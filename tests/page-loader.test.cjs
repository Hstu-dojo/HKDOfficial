const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(
  "src/components/loading/loader-state.ts",
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const loaderExports = {};
vm.runInNewContext(compiled, { exports: loaderExports });
const { initialLoaderState, loaderReducer } = loaderExports;
const config = { pathname: "/en/gallery", variant: "default" };
const register = (state, id = "first", overrides = {}) =>
  loaderReducer(state, {
    type: "register",
    id,
    config: { ...config, ...overrides },
  });
const unregister = (state, id = "first") =>
  loaderReducer(state, { type: "unregister", id });
const introComplete = (state) =>
  loaderReducer(state, { type: "intro-complete", cycle: state.cycle });
const exitComplete = (state) =>
  loaderReducer(state, { type: "exit-complete", cycle: state.cycle });

for (const locale of ["en", "bn", "ne"]) {
  test(`${locale} homepage has an opening sequence even when data is already ready`, () => {
    const state = initialLoaderState(`/${locale}`);
    assert.equal(state.phase, "intro");
    assert.equal(state.screen.pathname, `/${locale}`);
    assert.equal(state.introDuration, 2000);
    assert.equal(exitComplete(introComplete(state)).screen, null);
  });
}

test("ordinary pages do not show a loader without pending work", () => {
  const state = initialLoaderState("/en/gallery");
  assert.equal(state.screen, null);
  assert.equal(state.phase, "idle");
});

test("fast loading keeps the collage through the intro and removes it after the exit", () => {
  let state = register(initialLoaderState("/en/gallery"));
  state = unregister(state);
  assert.equal(state.phase, "intro");
  assert.ok(state.screen);
  state = introComplete(state);
  assert.equal(state.phase, "exiting");
  state = exitComplete(state);
  assert.equal(state.screen, null);
  assert.equal(state.phase, "idle");
  assert.equal(Object.keys(state.entries).length, 0);
});

test("slow loading stays visible after the intro until actual work finishes", () => {
  let state = introComplete(register(initialLoaderState("/en/gallery")));
  assert.equal(state.phase, "waiting");
  assert.equal(exitComplete(state), state);
  state = unregister(state);
  assert.equal(state.phase, "exiting");
  assert.equal(exitComplete(state).screen, null);
});

test("nested boundaries share the screen and keep it until both finish", () => {
  let state = register(initialLoaderState("/en/gallery"));
  state = introComplete(register(state, "second", { variant: "admin" }));
  state = unregister(state, "second");
  assert.equal(state.phase, "waiting");
  assert.equal(state.screen.variant, "default");
  state = unregister(state);
  assert.equal(state.phase, "exiting");
  assert.equal(exitComplete(state).screen, null);
});

test("a new load during the exit cannot be closed by the previous cycle timer", () => {
  let state = unregister(
    introComplete(register(initialLoaderState("/en/gallery"))),
  );
  const oldCycle = state.cycle;
  state = register(state, "second");
  assert.equal(state.phase, "intro");
  assert.equal(
    loaderReducer(state, { type: "exit-complete", cycle: oldCycle }),
    state,
  );
  assert.equal(
    loaderReducer(state, { type: "intro-complete", cycle: oldCycle }),
    state,
  );
  state = introComplete(unregister(state, "second"));
  assert.equal(exitComplete(state).screen, null);
});

test("registration updates do not restart the intro sequence", () => {
  let state = register(initialLoaderState("/en/gallery"));
  const cycle = state.cycle;
  state = register(state, "first", { badgeText: "Media" });
  assert.equal(state.cycle, cycle);
  assert.equal(state.screen.badgeText, "Media");
});

test("all portal routes use in-panel loading, without matching public pages", () => {
  for (const prefix of ["", "/en", "/bn", "/ne"]) {
    for (const path of [
      "/admin",
      "/admin/rbac",
      "/dashboard",
      "/dashboard/certificates",
    ]) {
      assert.equal(loaderExports.isPortalPath(prefix + path), true);
      assert.equal(initialLoaderState(prefix + path).screen, null);
    }
  }
  for (const path of ["/partner-admin", "/partner-admin/portal/members"])
    assert.equal(loaderExports.isPortalPath(path), true);
  for (const path of [
    "/en",
    "/en/gallery",
    "/bn/onboarding",
    "/en/admin-news",
    null,
  ])
    assert.equal(loaderExports.isPortalPath(path), false);
});
