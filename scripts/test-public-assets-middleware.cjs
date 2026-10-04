const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const sharp = pr('sharp');
const { NextRequest, NextResponse } = pr('next/server');
const oldPortraitNames = 'auerhuhn biber birkhuhn bisam damwild eichelhaeher eichhoernchen elster graugans hermelin hohltaube iltis kanadagans krickente luchs marderhund mauswiesel muffelwild nebelkraehe nilgans nutria pfeifente rabenkraehe rebhuhn reiherente ringeltaube schneehase schneehuhn sikawild spiessente steinmarder tafelente tuerkentaube waschbaer wildkatze'.split(' ');
const cache = new Map();
const context = vm.createContext({ process: { env: { JL_SESSION_SECRET: 'isolated-public-paths-test-key-at-least-32-bytes' } },
  Buffer, Response, Request, Headers, crypto: webcrypto, TextEncoder, TextDecoder, atob, URL, AbortSignal, Date,
  fetch: () => { throw new Error('Tests must never call the network'); } });
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
  const mod = { exports: {} }; cache.set(filename, mod);
  const req = id => {
    if (id === 'next/server') return { NextResponse };
    if (id === '@supabase/supabase-js') return { createClient: () => { throw new Error('Anonymous requests must not touch the database'); } };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
    return pr(id);
  };
  vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
  return mod.exports;
}
const { learningImagePaths } = load('lib/learning-image-paths.js');
const { middleware } = load('middleware.js');
const request = pathname => new NextRequest(`https://jagdlatein.test${pathname}`);

for (const name of oldPortraitNames) test(`The exact ${name} portrait JPEG is public and decodes without account access`, async () => {
  const pathname = `/wildkunde/${name}.jpg`;
  assert.ok(learningImagePaths.includes(pathname));
  const bytes = fs.readFileSync(path.join(root, 'public', pathname));
  assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, 'jpeg'); assert.ok(metadata.width >= 100 && metadata.height >= 100);
  const pageFiles = fs.readdirSync(path.join(root, 'pages/wildkunde')).filter(file => file.endsWith('.js'));
  assert.ok(pageFiles.some(file => fs.readFileSync(path.join(root, 'pages/wildkunde', file), 'utf8').includes(`"${pathname}"`)), 'Existing page must reference this exact file');
  const response = await middleware(request(pathname)); assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('Every published learning image path is exact, unique and backed by a real file', () => {
  assert.equal(new Set(learningImagePaths).size, learningImagePaths.length);
  assert.ok(learningImagePaths.every(pathname => /^\/(?:lernen|wildkunde)\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.jpg$/.test(pathname)));
  assert.ok(learningImagePaths.every(pathname => fs.existsSync(path.join(root, 'public', pathname))));
});

for (const pathname of ['/impressum', '/datenschutz', '/robots.txt', '/sitemap.xml']) test(`${pathname} is available to a guest`, async () => {
  const response = await middleware(request(pathname)); assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('Opening exact portraits and public documents never opens lessons, PDFs or unknown file paths', async () => {
  for (const pathname of ['/wildkunde/biber', '/wildkunde/private.jpg', '/wildkunde/biber.jpg/private', '/wildkunde/biber.json',
    '/wildkunde/BIBER.jpg', '/wildkunde/biber.jpg.bak', '/lernen/private.jpg', '/ebook.pdf', '/protected/ebook',
    '/datenschutz/private', '/impressum.pdf', '/robots.txt/private', '/sitemap.xml.bak']) {
    const response = await middleware(request(pathname)); const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, '/preise', pathname); assert.equal(target.searchParams.get('next'), pathname);
  }
});

for (const relative of ['account', 'community', 'lernen/offline', 'lernen/suche']) test(`Public media exceptions do not grant anonymous access to /api/${relative}`, async () => {
  // APIs use their own account guard, independent of static middleware exceptions.
  const response = await load(`app/api/${relative}/route.js`).GET(request(`/api/${relative}`));
  assert.equal(response.status, 401); assert.match(response.headers.get('cache-control'), /no-store/);
});
