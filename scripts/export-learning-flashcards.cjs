// Export the same server-built cards used in the app for the PDF authoring step.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const swc = require('next/dist/build/swc');
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2020' }, module: { type: 'commonjs' },
  });
  const mod = { exports: {} }; cache.set(filename, mod);
  const req = createRequire(filename);
  new Function('require', 'module', 'exports', code)(id => {
    if (!id.startsWith('.')) return req(id);
    const next = path.resolve(path.dirname(filename), id);
    return load(path.extname(next) ? next : `${next}.js`);
  }, mod, mod.exports);
  return mod.exports;
}
const output = process.argv[2];
if (!output) throw new Error('Ausgabepfad fuer den PDF-Datensatz fehlt.');
const { getFlashcardExport } = load(path.join(root, 'lib/learning-flashcards.js'));
const data = getFlashcardExport();
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, JSON.stringify(data, null, 2), 'utf8');
console.log(`Lernkarten-Datensatz exportiert: ${Array.isArray(data) ? data.length : data.cards?.length || data.flashcards?.length || 0} Karten.`);
