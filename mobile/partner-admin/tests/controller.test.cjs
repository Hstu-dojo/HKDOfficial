const test = require("node:test"),
  assert = require("node:assert/strict");
const { createLoader } = require("../shared/test-support/load.cjs");
const { createAttendanceHook } = createLoader()("shared/controller.ts");
const active = {
    profileId: "student",
    name: "Synthetic Student",
    memberNumber: "1",
  },
  former = {
    profileId: "former",
    name: "Past Student",
    memberNumber: "2",
    status: "absent",
    notes: "Historical",
  };
function harness(options = {}) {
  const cells = [],
    queue = [];
  let cursor = 0,
    needsRender = true,
    view,
    posts = 0,
    lastPayload,
    resolveSave;
  const same = (a, b) =>
    a &&
    a.length === b.length &&
    a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in cells))
        cells[i] = typeof initial === "function" ? initial() : initial;
      return [
        cells[i],
        (value) => {
          const next = typeof value === "function" ? value(cells[i]) : value;
          if (!Object.is(next, cells[i])) {
            cells[i] = next;
            needsRender = true;
          }
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in cells)) cells[i] = { current: initial };
      return cells[i];
    },
    useMemo(factory, deps) {
      const i = cursor++;
      if (!same(cells[i]?.deps, deps)) cells[i] = { deps, value: factory() };
      return cells[i].value;
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!same(cells[i]?.deps, deps)) {
        const previous = cells[i];
        cells[i] = { deps, cleanup: previous?.cleanup };
        queue.push(() => {
          previous?.cleanup?.();
          cells[i].cleanup = effect();
        });
      }
    },
  };
  const hook = createAttendanceHook(hooks);
  const api = async (path, body) => {
    if (body) {
      posts++;
      lastPayload = body;
      if (options.failSave)
        throw Error("This register changed. Reload it before saving.");
      const saved = {
        session: {
          id: "register",
          date: body.date,
          label: body.label,
          notes: body.notes,
          updatedAt: "2026-10-12T12:00:00.000Z",
          records: body.records.map((r) => ({
            ...r,
            name: r.profileId === "student" ? active.name : former.name,
            memberNumber: r.profileId === "student" ? "1" : "2",
          })),
        },
      };
      if (options.deferSave)
        return new Promise((resolve) => {
          resolveSave = () => resolve(saved);
        });
      return saved;
    }
    if (path === "/api/course-attendance") {
      if (options.metadataFailure && !options.retried)
        throw Error("Disconnected");
      return {
        courses: [
          {
            id: "course",
            name: "Course",
            organization: "Branch",
            isActive: true,
          },
        ],
        canWrite: !options.readonly,
      };
    }
    return {
      students: [active],
      sessions: options.historical
        ? [
            {
              id: "register",
              date: new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Dhaka",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date()),
              label: "Training",
              notes: "",
              updatedAt: "2026-10-12T10:00:00.000Z",
              records: [{ ...active, status: "late", notes: "" }, former],
            },
          ]
        : [],
      canWrite: !options.readonly,
    };
  };
  async function flush() {
    for (let turn = 0; turn < 16; turn++) {
      if (needsRender) {
        needsRender = false;
        cursor = 0;
        view = hook(api);
        while (queue.length) queue.shift()();
      }
      await Promise.resolve();
    }
    return view;
  }
  return {
    flush,
    get view() {
      return view;
    },
    get posts() {
      return posts;
    },
    get payload() {
      return lastPayload;
    },
    resolve() {
      resolveSave();
    },
    retryMetadata() {
      options.retried = true;
      view.retry();
    },
  };
}
test("shared controller loads, marks and saves the same validated register for either platform", async () => {
  const app = harness();
  await app.flush();
  assert.equal(app.view.loading, false);
  assert.equal(app.view.records[0].status, "unmarked");
  app.view.markAllPresent();
  await app.flush();
  assert.equal(app.view.dirty, true);
  await app.view.save();
  await app.flush();
  assert.equal(app.posts, 1);
  assert.equal(app.payload.records[0].status, "present");
  assert.equal(app.view.dirty, false);
  assert.equal(app.view.monthly[0].records.length, 1);
});
test("historical inactive students are preserved and cannot be edited by a renderer", async () => {
  const app = harness({ historical: true });
  await app.flush();
  app.view.mark("former", "present");
  app.view.setStudentNote("former", "Overwrite");
  app.view.markAllPresent();
  await app.flush();
  assert.equal(
    app.view.records.find((r) => r.profileId === "former").status,
    "absent",
  );
  assert.equal(
    app.view.records.find((r) => r.profileId === "former").notes,
    "Historical",
  );
  await app.view.save();
  assert.equal(app.payload.records.length, 2);
});
test("read-only views cannot record attendance even if a renderer calls controller methods", async () => {
  const app = harness({ readonly: true });
  await app.flush();
  app.view.markAllPresent();
  app.view.mark("student", "present");
  await app.view.save();
  await app.flush();
  assert.equal(app.posts, 0);
  assert.equal(app.view.records[0].status, "unmarked");
});
test("duplicate save taps produce one request and selection cannot change while saving", async () => {
  const app = harness({ deferSave: true });
  await app.flush();
  app.view.markAllPresent();
  await app.flush();
  const pending = app.view.save();
  await app.view.save();
  app.view.setCourseId("other");
  await app.flush();
  assert.equal(app.posts, 1);
  assert.equal(app.view.courseId, "course");
  app.resolve();
  await pending;
  await app.flush();
  assert.equal(app.view.dirty, false);
});
test("save conflicts retain unsaved marks and metadata failures can be retried", async () => {
  const app = harness({ failSave: true });
  await app.flush();
  app.view.markAllPresent();
  await app.flush();
  await app.view.save();
  await app.flush();
  assert.equal(app.view.dirty, true);
  assert.equal(app.view.records[0].status, "present");
  assert.match(app.view.error, /changed/);
  const disconnected = harness({ metadataFailure: true });
  await disconnected.flush();
  assert.equal(disconnected.view.loading, false);
  disconnected.retryMetadata();
  await disconnected.flush();
  assert.equal(disconnected.view.courseId, "course");
  assert.equal(disconnected.view.records.length, 1);
});
