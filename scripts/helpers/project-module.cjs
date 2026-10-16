const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const local = createRequire(path.join(root, 'package.json'));
const swc = local('next/dist/build/swc');
function createLoader(overrides = {}) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`));
      return local(id);
    }, module, module.exports);
    return module.exports;
  }
  return load;
}
module.exports = { createLoader, root, local };
