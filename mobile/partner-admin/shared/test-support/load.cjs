const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  { createRequire } = require("node:module"),
  ts = require("typescript");
function createLoader(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} },
      localRequire = createRequire(file);
    cache.set(file, module.exports);
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      {
        module,
        exports: module.exports,
        require: (name) => {
          if (Object.hasOwn(mocks, name)) return mocks[name];
          const target = name.startsWith("@partner-shared/")
            ? path.resolve(
                __dirname,
                "..",
                name.slice("@partner-shared/".length),
              )
            : name.startsWith(".")
              ? path.resolve(path.dirname(file), name)
              : null;
          if (target && fs.existsSync(target + ".ts"))
            return load(target + ".ts");
          return localRequire(name);
        },
        console,
        Date,
        Intl,
        URL,
        Request,
        Response,
        Headers,
        Buffer,
        File,
        AbortSignal,
        AbortController,
        setTimeout,
        clearTimeout,
        process,
        ...globals,
      },
      { filename: file },
    );
    cache.set(file, module.exports);
    return module.exports;
  }
  return load;
}
module.exports = { createLoader };
