const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (n) => (Object.hasOwn(mocks, n) ? mocks[n] : require(n)),
      console,
      Date,
      URL,
      Request,
      Response,
      Headers,
      Buffer,
      File,
      AbortSignal,
      setTimeout,
      process,
      ...globals,
    },
  );
  return module.exports;
}
const form = load("src/lib/pdf/form-fields.ts"),
  model = load("src/lib/student-enrollment/model.ts", {
    "@/lib/pdf/form-fields": form,
  });
function gemini(fetch, env = {}, globals = {}) {
  return load(
    "src/lib/student-enrollment/gemini.ts",
    { "server-only": {}, "./model": model },
    {
      fetch,
      process: {
        env: {
          GEMINI_API_KEY: "fixture-not-a-real-key",
          ENROLLMENT_AI_PROVIDERS: "cloudflare,gemini,groq",
          ...env,
        },
      },
      console: { error() {}, warn() {} },
      ...globals,
    },
  );
}
const data = () => ({
  fields: { ...model.blankFields, name_en: "Synthetic Student" },
  warnings: [],
  photoBox: [0, 0, 0, 0],
  signatureBox: [-1, 10, 20, 30],
});
function groqResponse() {
  return Response.json({
    choices: [
      {
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            ...data(),
            photoBox: null,
            signatureBox: null,
          }),
        },
      },
    ],
  });
}
function geminiResponse() {
  return Response.json({
    candidates: [
      {
        finishReason: "STOP",
        content: {
          parts: [
            {
              text: JSON.stringify({
                ...data(),
                photoBox: null,
                signatureBox: null,
              }),
            },
          ],
        },
      },
    ],
  });
}
test("default priority keeps satisfactory Groq first, Cloudflare second and Gemini last", async () => {
  for (const failures of [0, 1, 2]) {
    const calls = [];
    const service = gemini(
      async (url) => {
        const provider = url.includes("api.groq.com")
          ? "groq"
          : url.includes("api.cloudflare.com")
            ? "cloudflare"
            : "gemini";
        calls.push(provider);
        if (calls.length <= failures) return Response.json({}, { status: 503 });
        return provider === "gemini" ? geminiResponse() : groqResponse();
      },
      {
        ENROLLMENT_AI_PROVIDERS: "",
        GROQ_API_KEY: "groq-fixture",
        CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
        CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        AI_GATEWAY_API_KEY: "obsolete-key",
      },
    );
    assert.equal(
      (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
      "Synthetic Student",
    );
    assert.deepEqual(
      calls,
      ["groq", "cloudflare", "gemini"].slice(0, failures + 1),
    );
  }
});
test("default timeout budget allows a slower Cloudflare backup and retains a final attempt", async () => {
  let elapsed = 0;
  const budgets = [],
    started = Date.now();
  class Clock extends Date {
    static now() {
      return started + elapsed;
    }
  }
  const service = gemini(
    async (url) => {
      if (!url.includes("googleapis.com")) {
        elapsed += budgets.at(-1);
        throw Error("timeout");
      }
      return geminiResponse();
    },
    {
      ENROLLMENT_AI_PROVIDERS: "",
      GROQ_API_KEY: "groq-fixture",
      CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
      CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    {
      Date: Clock,
      AbortSignal: {
        timeout(ms) {
          budgets.push(ms);
          return new AbortController().signal;
        },
      },
    },
  );
  assert.equal(
    (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  assert.deepEqual(budgets, [8000, 30000, 7000]);
});
test("invalid provider configuration never makes an external request", async () => {
  let calls = 0;
  const service = gemini(
    async () => {
      calls++;
      return groqResponse();
    },
    { ENROLLMENT_AI_PROVIDERS: "gateway,groq", GROQ_API_KEY: "groq-fixture" },
  );
  await assert.rejects(
    service.extractPaperForm(Buffer.from("fixture")),
    /provider order is invalid/,
  );
  assert.equal(calls, 0);
});
test("Cloudflare is first and a valid result avoids both other providers", async () => {
  const calls = [];
  const service = gemini(
    async (url, init) => {
      calls.push(url);
      assert.equal(
        url,
        "https://api.cloudflare.com/client/v4/accounts/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ai/v1/chat/completions",
      );
      assert.equal(init.headers.Authorization, "Bearer cloudflare-fixture");
      assert.equal(init.headers["x-goog-api-key"], undefined);
      const body = JSON.parse(init.body);
      assert.equal(body.model, "@cf/qwen/qwen3.8-27b");
      assert.equal(body.response_format.type, "json_object");
      assert.equal(body.options.rejectIfBusy, true);
      return groqResponse();
    },
    {
      CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
      CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      GROQ_API_KEY: "groq-fixture",
    },
  );
  assert.equal(
    (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  assert.equal(calls.length, 1);
});
test("Cloudflare permission failures follow the configured backup order", async () => {
  for (const failGemini of [false, true]) {
    const calls = [];
    const service = gemini(
      async (url) => {
        calls.push(url);
        if (url.includes("api.cloudflare.com"))
          return Response.json(
            { error: { message: "Private billing details" } },
            { status: 403 },
          );
        if (url.includes("googleapis.com"))
          return failGemini
            ? Response.json({}, { status: 503 })
            : geminiResponse();
        return groqResponse();
      },
      {
        CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
        CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        GROQ_API_KEY: "groq-fixture",
      },
    );
    assert.equal(
      (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
      "Synthetic Student",
    );
    assert.ok(calls[0].includes("api.cloudflare.com"));
    assert.ok(calls[1].includes("googleapis.com"));
    assert.equal(calls.length, failGemini ? 3 : 2);
    if (failGemini) assert.ok(calls[2].includes("api.groq.com"));
  }
});
test("Cloudflare-only configuration can extract and refusals never switch providers", async () => {
  const only = gemini(async () => groqResponse(), {
    GEMINI_API_KEY: "",
    CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
    CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  assert.equal(
    (await only.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  let calls = 0;
  const refused = gemini(
    async () => {
      calls++;
      return Response.json({
        choices: [
          {
            finish_reason: "content_filter",
            message: { refusal: "Cannot process" },
          },
        ],
      });
    },
    {
      CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
      CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      GROQ_API_KEY: "groq-fixture",
    },
  );
  await assert.rejects(
    refused.extractPaperForm(Buffer.from("fixture")),
    /Cloudflare AI/,
  );
  assert.equal(calls, 1);
});
test("two slow providers still leave a bounded third attempt", async () => {
  let elapsed = 0;
  const budgets = [],
    started = Date.now();
  class Clock extends Date {
    static now() {
      return started + elapsed;
    }
  }
  const service = gemini(
    async (url) => {
      if (!url.includes("api.groq.com")) {
        elapsed += 18000;
        throw Error("timeout");
      }
      return groqResponse();
    },
    {
      CLOUDFLARE_AI_API_TOKEN: "cloudflare-fixture",
      CLOUDFLARE_AI_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      GROQ_API_KEY: "groq-fixture",
    },
    {
      Date: Clock,
      AbortSignal: {
        timeout(ms) {
          budgets.push(ms);
          return new AbortController().signal;
        },
      },
    },
  );
  assert.equal(
    (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  assert.deepEqual(budgets, [30000, 18000, 9000]);
});
test("a Gemini timeout leaves time for Groq within the combined deadline", async () => {
  let elapsed = 0;
  const budgets = [];
  const started = Date.now();
  class Clock extends Date {
    static now() {
      return started + elapsed;
    }
  }
  const service = gemini(
    async (url) => {
      if (url.includes("googleapis.com")) {
        elapsed += 18000;
        throw Error("timeout");
      }
      return groqResponse();
    },
    { GROQ_API_KEY: "backup-fixture" },
    {
      Date: Clock,
      AbortSignal: {
        timeout(ms) {
          budgets.push(ms);
          return new AbortController().signal;
        },
      },
    },
  );
  assert.equal(
    (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  assert.deepEqual(budgets, [18000, 27000]);
});
test("healthy Gemini does not call Groq", async () => {
  let calls = 0;
  const service = gemini(
    async (url) => {
      calls++;
      assert.ok(url.startsWith("https://generativelanguage.googleapis.com/"));
      return Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ text: JSON.stringify(data()) }] },
          },
        ],
      });
    },
    { GROQ_API_KEY: "backup-fixture" },
  );
  assert.equal(
    (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  assert.equal(calls, 1);
});
test("Gemini auth, missing-model, quota and service errors fall back once to Groq vision", async () => {
  for (const status of [401, 403, 404, 429, 500, 503, 504]) {
    let calls = 0;
    const service = gemini(
      async (url, init) => {
        calls++;
        if (url.startsWith("https://generativelanguage.googleapis.com/"))
          return Response.json({}, { status });
        assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
        assert.equal(init.headers.Authorization, "Bearer backup-fixture");
        assert.equal(init.headers["x-goog-api-key"], undefined);
        const body = JSON.parse(init.body);
        assert.equal(body.model, "qwen/qwen3.8-27b");
        assert.equal(body.reasoning_effort, "none");
        assert.equal(body.response_format.type, "json_object");
        assert.ok(
          body.messages[0].content[1].image_url.url.startsWith(
            "data:image/jpeg;base64,",
          ),
        );
        return groqResponse();
      },
      { GROQ_API_KEY: "backup-fixture" },
    );
    assert.equal(
      (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
      "Synthetic Student",
    );
    assert.equal(calls, 2);
  }
});
test("network failures and malformed Gemini output can recover through validated Groq output", async () => {
  for (const failure of ["network", "json"]) {
    const service = gemini(
      async (url) => {
        if (url.includes("api.groq.com")) return groqResponse();
        if (failure === "network") throw Error("sensitive provider diagnostic");
        return Response.json({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: "not json" }] },
            },
          ],
        });
      },
      { GROQ_API_KEY: "backup-fixture" },
    );
    assert.equal(
      (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
      "Synthetic Student",
    );
  }
});
test("Groq works when Gemini is not configured", async () => {
  let calls = 0;
  const service = gemini(
    async (url) => {
      calls++;
      assert.ok(url.includes("api.groq.com"));
      return groqResponse();
    },
    { GEMINI_API_KEY: "", GROQ_API_KEY: "backup-fixture" },
  );
  assert.equal(
    (await service.extractPaperForm(Buffer.from("fixture"))).fields.name_en,
    "Synthetic Student",
  );
  assert.equal(calls, 1);
});
test("invalid requests and provider refusals do not trigger fallback", async () => {
  for (const refusal of ["http", "safety"]) {
    let calls = 0;
    const service = gemini(
      async () => {
        calls++;
        return refusal === "http"
          ? Response.json({}, { status: 400 })
          : Response.json({ candidates: [{ finishReason: "SAFETY" }] });
      },
      { GROQ_API_KEY: "backup-fixture" },
    );
    await assert.rejects(
      service.extractPaperForm(Buffer.from("fixture")),
      /Gemini/,
    );
    assert.equal(calls, 1);
  }
});
test("both providers failing returns a safe manual-entry error and malformed Groq output is rejected", async () => {
  for (const failure of ["rate", "invalid"]) {
    const service = gemini(
      async (url) =>
        url.includes("googleapis.com")
          ? Response.json({}, { status: 503 })
          : failure === "rate"
            ? Response.json(
                { error: { message: "private credential details" } },
                { status: 429 },
              )
            : Response.json({
                choices: [
                  {
                    finish_reason: "stop",
                    message: { content: '{"fields":{}}' },
                  },
                ],
              }),
      { GROQ_API_KEY: "backup-fixture" },
    );
    await assert.rejects(
      service.extractPaperForm(Buffer.from("fixture")),
      (error) =>
        error.message ===
        "AI form extraction is currently unavailable. Retry shortly or enter the form manually.",
    );
  }
});
test("AI can match provided course IDs but cannot invent or select foreign courses", async () => {
  const courses = [{ id: "branch-course", name: "Branch training" }];
  for (const suggestion of ["branch-course", "foreign-course"]) {
    const service = gemini(async (_, init) => {
      const body = JSON.parse(init.body);
      assert.ok(body.contents[0].parts[0].text.includes("Branch training"));
      assert.ok(body.generationConfig.responseJsonSchema.properties.courseId);
      return Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                { text: JSON.stringify({ ...data(), courseId: suggestion }) },
              ],
            },
          },
        ],
      });
    });
    const result = await service.extractPaperForm(
      Buffer.from("fixture"),
      courses,
    );
    assert.equal(
      result.courseId,
      suggestion === "branch-course" ? suggestion : "",
    );
    assert.equal(result.fields.gender, "");
  }
});
test("invalid AI crops no longer discard extracted fields and thought text is excluded", async () => {
  const service = gemini(async () =>
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              { thought: true, text: "Reasoning is not JSON" },
              { text: JSON.stringify(data()) },
            ],
          },
        },
      ],
    }),
  );
  const result = await service.extractPaperForm(Buffer.from("fixture"));
  assert.equal(result.fields.name_en, "Synthetic Student");
  assert.equal(result.photoBox, null);
  assert.equal(result.signatureBox, null);
  assert.equal(result.warnings.length, 2);
});
test("temporary Gemini failures retry within one request and malformed output is identified as AI failure", async () => {
  let calls = 0;
  const service = gemini(async () =>
    ++calls === 1
      ? Response.json({}, { status: 503 })
      : Response.json({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      ...data(),
                      photoBox: null,
                      signatureBox: null,
                    }),
                  },
                ],
              },
            },
          ],
        }),
  );
  await service.extractPaperForm(Buffer.from("fixture"));
  assert.equal(calls, 2);
  const malformed = gemini(async () =>
    Response.json({
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: "not json" }] } },
      ],
    }),
  );
  await assert.rejects(
    malformed.extractPaperForm(Buffer.from("fixture")),
    /Gemini returned incomplete or invalid/,
  );
});
test("permission errors are not retried or described as storage failures", async () => {
  let calls = 0;
  const service = gemini(async () => {
    calls++;
    return Response.json({}, { status: 403 });
  });
  await assert.rejects(
    service.extractPaperForm(Buffer.from("fixture")),
    /Gemini rejected the server credentials or permissions/,
  );
  assert.equal(calls, 1);
});
test("scan errors identify the failed processing stage without leaking document data or credentials", async () => {
  for (const failing of ["image", "ai", "storage", "database"]) {
    const logs = [];
    const route = load(
      "src/app/api/partner-portal/quick-enrollment/route.ts",
      {
        "@/lib/partner-admin/auth": {
          requirePartnerAdminUser: async () => ({
            user: { id: "teacher", partnerId: "branch" },
            error: null,
          }),
        },
        "@/lib/connect-db": {
          db: {
            select: () => ({
              from() {
                return this;
              },
              where: async () => [{ id: "course", name: "Branch course" }],
            }),
            transaction: async (callback) => {
              if (failing === "database")
                throw Object.assign(Error("private database details"), {
                  code: "42P01",
                });
              return callback({ insert: () => ({ values: async () => {} }) });
            },
          },
        },
        "@/db/schema": {
          quickEnrollmentDrafts: {},
          studentDocuments: {},
          courses: {},
        },
        "drizzle-orm": { eq() {}, and() {} },
        "@/lib/student-enrollment/model": model,
        "@/lib/student-enrollment/gemini": {
          extractPaperForm: async () => {
            if (failing === "ai") throw Error("private AI document details");
            return { ...data(), photoBox: null, signatureBox: null };
          },
        },
        "@/lib/student-enrollment/storage": {
          validateFile: async () => {
            if (failing === "image") throw Error("private image details");
            return {
              buffer: Buffer.from("fixture"),
              original: Buffer.from("original"),
              type: "image/jpeg",
              originalType: "image/jpeg",
              originalExtension: "jpg",
            };
          },
          documentBucket: () => "fixture-bucket",
          putDocument: async () => {
            if (failing === "storage")
              throw Object.assign(Error("private storage credential details"), {
                name: "AccessDenied",
              });
          },
          removeDocument: async () => {},
        },
      },
      {
        process: { env: { STUDENT_DOCUMENTS_ENCRYPTION_KEY: "11".repeat(32) } },
        console: { error: (...args) => logs.push(args) },
      },
    );
    const body = new FormData();
    body.append(
      "file",
      new File(["fixture"], "synthetic.jpg", { type: "image/jpeg" }),
    );
    const response = await route.POST(
      new Request(
        "https://fixture.invalid/api/partner-portal/quick-enrollment",
        { method: "POST", body },
      ),
    );
    const result = await response.json();
    assert.equal(result.stage, failing);
    assert.ok(result.requestId);
    assert.ok(!JSON.stringify(result).includes("private"));
    assert.ok(!JSON.stringify(logs).includes("private"));
    assert.equal(
      response.status,
      failing === "image" ? 400 : failing === "ai" ? 422 : 503,
    );
  }
});
