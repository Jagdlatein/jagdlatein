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

const reviewedPhotos = JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/wildlife-photo-provenance-2026-10-04.json'), 'utf8')).assets;
for (const pathname of [...reviewedPhotos.map(photo => `/wildkunde/${path.posix.basename(photo.src)}`), '/marderhund.jpg']) test(`Retired photograph ${pathname} is absent and has no public middleware exception`, async () => {
  assert.equal(learningImagePaths.includes(pathname), false);
  assert.equal(fs.existsSync(path.join(root, 'public', pathname)), false);
  const response = await middleware(request(pathname));
  assert.equal(response.headers.get('x-middleware-next'), null);
  assert.equal(new URL(response.headers.get('location')).pathname, '/preise');
});
test('Every reviewed wildlife photo decodes, has the recorded dimensions/hash and remains available without a paid account', async () => {
  assert.equal(reviewedPhotos.length, 47);
  assert.equal(new Set(reviewedPhotos.map(photo => photo.slug)).size, 47);
  const { createHash } = require('node:crypto');
  for (const photo of reviewedPhotos) {
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, 'jpeg', photo.slug);
    assert.equal(metadata.width, photo.width, photo.slug); assert.equal(metadata.height, photo.height, photo.slug);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256, photo.slug);
    assert.ok(photo.author && photo.credit && photo.creditUrl && photo.license && photo.licenseUrl, photo.slug);
    assert.ok(photo.sourcePage.startsWith('https://commons.wikimedia.org/wiki/File:'), photo.slug);
    assert.ok(learningImagePaths.includes(photo.src), photo.slug);
    assert.equal((await middleware(request(photo.src))).headers.get('x-middleware-next'), '1', photo.slug);
    const route = photo.slug === 'hirsch' ? 'rotwild' : photo.slug;
    const page = fs.readFileSync(path.join(root, 'pages/wildkunde', `${route}.js`), 'utf8');
    assert.ok(page.includes(`<WildlifePhoto slug="${route}" />`), route);
  }
  const blackGrouse = reviewedPhotos.find(photo => photo.slug === 'birkhuhn');
  assert.ok(blackGrouse.sourcePage.includes('48203418512'), 'Actual photo replaces historical drawing');
  const hoodedCrow = reviewedPhotos.find(photo => photo.slug === 'nebelkraehe');
  assert.ok(hoodedCrow.sourcePage.includes('Kristiansand'), 'Species photo replaces documented hybrid');
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
