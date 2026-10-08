import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

// Load server/domain TypeScript without booting Next or exposing real credentials.
export function loadTypeScript(file, cache = new Map()) {
  const path = resolve(file);
  if (cache.has(path)) return cache.get(path).exports;
  const loaded = { exports: {} };
  cache.set(path, loaded);
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const nativeRequire = createRequire(path);
  const require = name => name === "server-only" ? {} : name.startsWith(".") ? loadTypeScript(resolve(dirname(path), `${name}.ts`), cache) : nativeRequire(name);
  const run = vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`, { filename: path });
  run(require, loaded, loaded.exports);
  return loaded.exports;
}
