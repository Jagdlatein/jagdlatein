// Export the existing attributed recordings for the offline analysis script.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const swc = require('next/dist/build/swc');
function load(file) {
  const filename = path.join(root, file);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id + '.js'))) : createRequire(filename)(id), mod, mod.exports);
  return mod.exports;
}
if (!process.argv[2]) throw new Error('Provide an output JSON path.');
fs.writeFileSync(process.argv[2], JSON.stringify(load('lib/animal-sounds.js').animalSounds, null, 2));
