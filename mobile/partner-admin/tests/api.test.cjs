const test = require("node:test"),
  assert = require("node:assert/strict");
const { createLoader } = require("../shared/test-support/load.cjs");
function client(fetch) {
  const values = new Map();
  const store = {
    getItemAsync: async (key) => values.get(key) || null,
    setItemAsync: async (key, value) => values.set(key, value),
    deleteItemAsync: async (key) => values.delete(key),
  };
  return {
    ...createLoader({ "expo-secure-store": store }, { fetch })("src/api.ts"),
    values,
  };
}
test("native requests carry tokens only in Authorization and omit browser cookie state", async () => {
  let observed;
  const api = client(async (url, options) => {
    observed = { url, options };
    return Response.json({ saved: true });
  });
  const result = await api.request(
    "https://www.hstuma.com",
    "/api/course-attendance",
    "ab".repeat(32),
    { courseId: "course" },
  );
  assert.equal(result.saved, true);
  assert.equal(observed.url, "https://www.hstuma.com/api/course-attendance");
  assert.equal(
    observed.options.headers.Authorization,
    "Bearer " + "ab".repeat(32),
  );
  assert.equal(observed.options.credentials, "omit");
  assert.equal(observed.options.method, "POST");
  assert.equal(JSON.parse(observed.options.body).courseId, "course");
});
test("expired sessions are exposed as typed unauthorized errors and network failures remain retryable", async () => {
  const expired = client(async () =>
    Response.json({ error: "Expired" }, { status: 401 }),
  );
  await assert.rejects(
    expired.request(
      "https://www.hstuma.com",
      "/api/course-attendance",
      "token",
    ),
    (error) => error instanceof expired.ApiError && error.status === 401,
  );
  const disconnected = client(async () => {
    throw Error("network");
  });
  await assert.rejects(
    disconnected.request("https://www.hstuma.com", "/api/course-attendance"),
    /Check your internet/,
  );
});
test("secure session storage restores valid sessions, ignores damaged state, and clears on logout", async () => {
  const api = client(async () => Response.json({}));
  const session = {
    token: "ab".repeat(32),
    origin: "https://www.hstuma.com",
    expiresAt: "2026-10-13T00:00:00Z",
    user: { id: "admin", partnerId: "branch" },
  };
  await api.sessionStore.save(session);
  assert.equal((await api.sessionStore.read()).token, session.token);
  await api.sessionStore.clear();
  assert.equal(await api.sessionStore.read(), null);
  api.values.set("kaizen.partner.session.v1", '{"token":"invalid"}');
  assert.equal(await api.sessionStore.read(), null);
});
