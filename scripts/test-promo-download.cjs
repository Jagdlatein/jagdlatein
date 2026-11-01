// This release fixture records the operator-delivered files, including the final
// MP4 hash from visual-QA.json. These are byte-preservation/access tests, not a
// substitute for the separate visual, sound, and licensing review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { createHash, webcrypto } = require('node:crypto');
const { inflateRawSync } = require('node:zlib');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { NextRequest, NextResponse } = pr('next/server');
const { unstable_getResponseFromNextConfig } = pr('next/experimental/testing/server');
const nextConfig = pr('./next.config.js');
const stem = '/werbung/jagdlatein-15s-2026-11-01';
const publicPaths = ['html', 'mp4', 'zip', 'jpg', 'txt'].map(ext => `${stem}.${ext}`);
const fixtures = {
  mp4: { bytes: 10504668, sha256: 'c3bd9d8747ae2b737c13f99a58eb04050d5f20c4aa6758fbf62337f056c9ac0b', type: 'video/mp4' },
  zip: { bytes: 21735743, sha256: 'f9c2125cf13a15f85e6f842f5bb0346e7c8a7d94acdccdf102abc71de5d9b80f', type: 'application/zip' },
  jpg: { bytes: 182966, sha256: '88ff745775230d940868fb82ab8e62f7408b8880427aeb31c617d24deafa3afe', type: 'image/jpeg' },
  txt: { bytes: 2334, sha256: '0c1b559bb616de18b5e6b2c74ba58fae0c6da34a8606af7b515faf7a40c9e627', type: 'text/plain' },
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const localBytes = ext => fs.readFileSync(path.join(root, 'public', `${stem}.${ext}`));
const nearby = ['/werbung', '/werbung/', '/werbung/private.mp4', '/werbung/private.zip', `${stem}.json`,
  ...publicPaths.flatMap(name => [`${name}.bak`, `${name}/private`, `${name}/`, name.replace('jagdlatein', 'JAGDLATEIN')]),
  `${stem}.MP4`, `${stem}.ZIP`, `${stem.replace('2026-11-01', '2026-11-02')}.mp4`];

function harness() {
  const calls = { sessions: 0, network: 0, database: 0 };
  const cache = new Map();
  const context = vm.createContext({ process: { env: {
    JL_SESSION_SECRET: 'isolated-promo-download-test-key-at-least-32-bytes',
    ACCOUNT_GENERATION_ENABLED: 'true', APPLE_SUBSCRIPTIONS_ENABLED: 'true',
  } }, Buffer, Response, Request, Headers, crypto: webcrypto, TextEncoder, TextDecoder, atob, URL, AbortSignal, Date,
    fetch() { calls.network++; throw new Error('An isolated access test attempted a network request'); } });
  function load(relative) {
    const filename = path.join(root, relative);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(filename, mod);
    const requireLocal = id => {
      if (id === 'next/server') return { NextResponse };
      if (id === '@supabase/supabase-js') return { createClient() {
        calls.database++; throw new Error('An anonymous request attempted to create a database client');
      } };
      if (!id.startsWith('.')) return pr(id);
      const resolved = path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`);
      const exports = load(path.relative(root, resolved));
      if (resolved === path.join(root, 'lib/account-session-edge.js')) return { ...exports,
        async readAccountSessionEdge(...args) { calls.sessions++; return exports.readAccountSessionEdge(...args); } };
      return exports;
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, mod, mod.exports);
    return mod.exports;
  }
  const { middleware } = load('middleware.js');
  return { calls, load, run: (pathname, headers = {}, method = 'GET') => middleware(new NextRequest(
    `https://jagdlatein.test${pathname}`, { headers, method })) };
}

function tags(html, name) {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi')), match => {
    const attributes = {};
    for (const entry of match[1].matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
      attributes[entry[1].toLowerCase()] = entry[2] ?? entry[3] ?? entry[4] ?? '';
    return attributes;
  });
}

function zipEntries(bytes) {
  let eocd = bytes.length - 22;
  while (eocd >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  assert.ok(eocd >= 0, 'ZIP end-of-directory is present');
  const count = bytes.readUInt16LE(eocd + 10);
  let cursor = bytes.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50);
    const method = bytes.readUInt16LE(cursor + 10);
    const size = bytes.readUInt32LE(cursor + 20);
    const unpackedSize = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const local = bytes.readUInt32LE(cursor + 42);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    assert.equal(entries.has(name), false, `Duplicate ZIP member ${name}`);
    assert.equal(bytes.readUInt32LE(local), 0x04034b50);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const compressed = bytes.subarray(start, start + size);
    assert.ok(method === 0 || method === 8, `Supported ZIP compression for ${name}`);
    const content = method === 0 ? compressed : inflateRawSync(compressed);
    assert.equal(content.length, unpackedSize, name);
    entries.set(name, content);
    cursor += 46 + nameLength + bytes.readUInt16LE(cursor + 30) + bytes.readUInt16LE(cursor + 32);
  }
  return entries;
}

test('All four hosted assets preserve the exact delivered final bytes and file formats', async () => {
  for (const [ext, fixture] of Object.entries(fixtures)) {
    const bytes = localBytes(ext);
    assert.equal(bytes.length, fixture.bytes, ext); assert.equal(sha256(bytes), fixture.sha256, ext);
  }
  assert.equal(localBytes('mp4').toString('ascii', 4, 8), 'ftyp');
  const cover = await pr('sharp')(localBytes('jpg')).metadata();
  assert.equal(cover.format, 'jpeg'); assert.equal(cover.width, 1080); assert.equal(cover.height, 1920);
});

test('The unchanged ZIP contains the same final video, cover and caption, plus usable license records', () => {
  const entries = zipEntries(localBytes('zip'));
  for (const [name, ext] of [['Jagdlatein-15s-Hochformat.mp4', 'mp4'], ['Jagdlatein-15s-Cover.jpg', 'jpg'], ['Begleittext.txt', 'txt']])
    assert.equal(sha256(entries.get(name)), fixtures[ext].sha256, name);
  assert.ok(entries.get('Jagdlatein-15s-ohne-Musik.mp4').length > 9000000);
  const credits = JSON.parse(entries.get('credits.json').toString('utf8'));
  assert.deepEqual(credits.videos.map(video => video.author), ['Moritz Kohls', 'NaIzletuSi ™']);
  assert.deepEqual(credits.videos.map(video => video.license), ['CC BY 4.0', 'CC BY 3.0']);
  const caption = localBytes('txt').toString('utf8');
  for (const video of credits.videos) for (const value of [video.author, video.license, video.source, video.licenseUrl])
    assert.ok(caption.includes(value), `Caption includes ${value}`);
});

test('Only the five exact promotional paths bypass session parsing, network and database access', async () => {
  const ctx = harness();
  for (const pathname of publicPaths) for (const suffix of ['', '?download=1']) for (const method of ['GET', 'HEAD']) {
    const response = await ctx.run(`${pathname}${suffix}`, { cookie: 'jl_account_session=deliberately-invalid' }, method);
    assert.equal(response.status, 200, pathname); assert.equal(response.headers.get('x-middleware-next'), '1', pathname);
    assert.equal(response.headers.get('location'), null, pathname); assert.equal(response.headers.get('set-cookie'), null, pathname);
  }
  assert.deepEqual(ctx.calls, { sessions: 0, network: 0, database: 0 });
});

test('Neighboring and altered promotional paths retain the payment guard and complete return URL', async () => {
  const ctx = harness();
  for (const pathname of nearby) {
    const requested = `${pathname}?download=1&source=phone`;
    const response = await ctx.run(requested);
    assert.equal(response.status, 307, pathname); assert.equal(response.headers.get('x-middleware-next'), null, pathname);
    const location = new URL(response.headers.get('location'));
    assert.equal(location.pathname, '/preise', pathname); assert.equal(location.searchParams.get('next'), requested, pathname);
  }
  assert.equal(ctx.calls.sessions, nearby.length); assert.equal(ctx.calls.database, 0); assert.equal(ctx.calls.network, 0);
});

test('Protected lessons and personal account routes retain their anonymous redirects', async () => {
  const ctx = harness();
  for (const pathname of ['/lernen/wildtier-videofaelle', '/lernen/wildjahr', '/wildkunde/rehwild', '/ebook.pdf',
    '/lernen/lernkarten', '/protected/ebook', '/admin/private', '/konto', '/meine-kurse']) {
    const response = await ctx.run(pathname);
    assert.equal(response.status, 307, pathname);
    assert.equal(new URL(response.headers.get('location')).pathname,
      ['/konto', '/meine-kurse'].includes(pathname) ? '/login' : '/preise', pathname);
  }
  assert.equal(ctx.calls.database, 0); assert.equal(ctx.calls.network, 0);
});

test('Protected API handlers still reject anonymous requests with private no-store and Vary: Cookie', async () => {
  const ctx = harness();
  for (const relative of ['account', 'community', 'lernen/offline', 'lernen/suche', 'lernen/lernkarten']) {
    const response = await ctx.load(`app/api/${relative}/route.js`).GET(new NextRequest(`https://jagdlatein.test/api/${relative}`));
    assert.equal(response.status, 401, relative);
    assert.equal(response.headers.get('cache-control'), 'private, no-store', relative);
    assert.equal(response.headers.get('vary'), 'Cookie', relative);
    assert.equal(response.headers.get('content-disposition'), null, relative);
  }
  assert.equal(ctx.calls.database, 0); assert.equal(ctx.calls.network, 0);
});

test('The mobile HTML provides deliberate downloads and a locally hosted inline preview without autoplay', () => {
  const html = localBytes('html').toString('utf8');
  assert.match(html, /<html\s+lang="de"/);
  assert.ok(tags(html, 'meta').some(tag => tag.name === 'viewport' && /width=device-width/.test(tag.content) && /initial-scale=1/.test(tag.content)));
  assert.equal(tags(html, 'script').length, 0); assert.doesNotMatch(html, /\bon\w+\s*=/i);
  const videos = tags(html, 'video'); assert.equal(videos.length, 1);
  const video = videos[0];
  assert.ok(Object.hasOwn(video, 'controls')); assert.ok(Object.hasOwn(video, 'playsinline'));
  assert.equal(video.preload, 'none'); assert.equal(Object.hasOwn(video, 'autoplay'), false);
  assert.equal(video.poster, `${stem}.jpg`); assert.equal(video.width, '1080'); assert.equal(video.height, '1920');
  assert.deepEqual(tags(html, 'source'), [{ src: `${stem}.mp4`, type: 'video/mp4' }]);
  const anchors = tags(html, 'a');
  assert.ok(anchors.some(tag => tag.href === `${stem}.mp4?download=1` && tag.download === 'Jagdlatein-15s.mp4'));
  assert.ok(anchors.some(tag => tag.href === `${stem}.zip` && tag.download === 'Jagdlatein-15s-Werbepaket.zip'));
  assert.ok(anchors.some(tag => tag.href === `${stem}.txt`));
  for (const tag of [...tags(html, 'source'), ...videos, ...tags(html, 'img'), ...tags(html, 'link')])
    for (const key of ['src', 'poster', 'href']) if (tag[key]) assert.ok(tag[key].startsWith('/'), `${key} is local`);
  assert.doesNotMatch(html, /@import\b|url\(\s*['"]?(?:https?:)?\/\//i);
  assert.ok(tags(html, 'details').every(tag => !Object.hasOwn(tag, 'open')), 'Credits start collapsed');
  for (const value of ['Moritz Kohls', 'NaIzletuSi ™', 'CC BY 4.0', 'CC BY 3.0', 'Originalton entfernt', 'synthetisierter Soundtrack',
    'https://commons.wikimedia.org/wiki/File:Galoppierende_Rehe_auf_einem_Feld.webm',
    'https://commons.wikimedia.org/wiki/File:2022-04-19_%C5%A0TARANCAN_LEPORIDAE_Lepus_Europaeus_POLJSKI_ZAJEC_3.webm',
    'https://creativecommons.org/licenses/by/4.0/', 'https://creativecommons.org/licenses/by/3.0/']) assert.ok(html.includes(value), value);
});

test('Next header rules keep preview inline and attach only the exact requested MP4 download and ZIP', async () => {
  const headerRules = await nextConfig.headers();
  const attachments = headerRules.filter(rule => rule.headers.some(header => header.key.toLowerCase() === 'content-disposition'));
  assert.deepEqual(attachments.map(rule => rule.source), [`${stem}.mp4`, `${stem}.zip`, '/werbung/jagdlatein-reel-30s-2026-11-01.mp4', '/werbung/jagdlatein-reel-30s-2026-11-01.zip']);
  assert.deepEqual(attachments[0].has, [{ type: 'query', key: 'download', value: '1' }]);
  assert.equal(attachments[1].has, undefined);
  const expectedSecurity = {
    'content-security-policy': "frame-ancestors 'self';", 'x-frame-options': 'SAMEORIGIN',
    'referrer-policy': 'strict-origin-when-cross-origin', 'x-content-type-options': 'nosniff',
  };
  // Exercise Next's real custom-route parser and query matching, not a test-made matcher.
  const cases = [
    [`${stem}.mp4?download=1`, 'attachment; filename="Jagdlatein-15s.mp4"'],
    [`${stem}.mp4?source=phone&download=1`, 'attachment; filename="Jagdlatein-15s.mp4"'],
    [`${stem}.zip`, 'attachment; filename="Jagdlatein-15s-Werbepaket.zip"'],
    [`${stem}.zip?download=0`, 'attachment; filename="Jagdlatein-15s-Werbepaket.zip"'],
    ...[...publicPaths.filter(name => !name.endsWith('.zip')), `${stem}.mp4?download=0`, `${stem}.mp4?download=11`,
      `${stem}.mp4?download`, ...nearby.map(name => `${name}?download=1`), '/lernen/wildjahr', '/api/account', '/api/lernen/offline']
      .map(name => [name, name === `${stem}.mp4/?download=1` ? 'attachment; filename="Jagdlatein-15s.mp4"'
        : name === `${stem}.zip/?download=1` ? 'attachment; filename="Jagdlatein-15s-Werbepaket.zip"' : null]),
  ];
  for (const [pathname, disposition] of cases) {
    const response = await unstable_getResponseFromNextConfig({ url: `https://jagdlatein.test${pathname}`, nextConfig });
    assert.equal(response.headers.get('content-disposition'), disposition, pathname);
    const parsed = new URL(`https://jagdlatein.test${pathname}`);
    if (parsed.pathname.endsWith('/')) {
      // Next canonicalizes a trailing slash before serving files; that alias
      // must redirect to the same exact file, never a directory/prefix route.
      assert.equal(response.status, 308, pathname);
      assert.equal(response.headers.get('location'), `https://jagdlatein.test${parsed.pathname.slice(0, -1)}${parsed.search}`, pathname);
    }
    for (const [name, value] of Object.entries(expectedSecurity)) assert.equal(response.headers.get(name), value, `${pathname}: ${name}`);
  }
});

// Opt in after deployment. Run with JL_PROMO_RELEASE_BASE_URL=https://jagdlatein.de
// to verify anonymous public GETs, exact bytes and byte ranges against this fixture.
if (process.env.JL_PROMO_RELEASE_BASE_URL) test('Deployed phone URLs return the reviewed bytes, download headers and working video ranges', async t => {
  const supplied = new URL(process.env.JL_PROMO_RELEASE_BASE_URL);
  assert.equal(supplied.protocol, 'https:');
  assert.ok(['jagdlatein.de', 'www.jagdlatein.de'].includes(supplied.hostname));
  const get = (url, options = {}) => fetch(url, { signal: AbortSignal.timeout(45000), ...options });
  const htmlResponse = await get(new URL(`${stem}.html`, supplied));
  assert.equal(htmlResponse.status, 200); assert.match(htmlResponse.headers.get('content-type'), /^text\/html/);
  const canonical = new URL(htmlResponse.url).origin;
  assert.equal(htmlResponse.headers.get('set-cookie'), null);
  assert.equal(await htmlResponse.text(), localBytes('html').toString('utf8'));
  t.diagnostic(`Anonymous HTML resolved to ${htmlResponse.url}`);
  const releases = [];
  for (const origin of ['https://jagdlatein.de', 'https://www.jagdlatein.de']) {
    const response = await get(`${origin}/api/app-version`, { cache: 'no-store' });
    assert.equal(response.status, 200, origin);
    assert.match(response.headers.get('cache-control'), /no-store/);
    const release = await response.json();
    assert.match(release.releaseId, /^dpl_[A-Za-z0-9]{8,80}$/);
    assert.equal(new URL(response.url).origin, canonical, origin);
    releases.push(release.releaseId);
  }
  assert.equal(releases[0], releases[1], 'Both public domains resolve to the same deployment');
  if (process.env.JL_PROMO_RELEASE_ID) assert.equal(releases[0], process.env.JL_PROMO_RELEASE_ID);
  t.diagnostic(`Both public domains report release ${releases[0]}`);
  for (const [ext, fixture] of Object.entries(fixtures)) {
    const response = await get(`${canonical}${stem}.${ext}`);
    assert.equal(response.status, 200, ext); assert.equal(new URL(response.url).pathname, `${stem}.${ext}`);
    assert.ok(response.headers.get('content-type').startsWith(fixture.type), ext);
    assert.equal(response.headers.get('set-cookie'), null, ext);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.length, fixture.bytes, ext); assert.equal(sha256(bytes), fixture.sha256, ext);
    const disposition = response.headers.get('content-disposition');
    if (ext === 'zip') assert.equal(disposition, 'attachment; filename="Jagdlatein-15s-Werbepaket.zip"');
    else assert.ok(disposition === null || /^inline(?:;|$)/i.test(disposition), `${ext} remains inline`);
    t.diagnostic(`${ext}: 200, ${bytes.length} bytes, SHA-256 ${sha256(bytes)}`);
  }
  const download = await get(`${canonical}${stem}.mp4?download=1`);
  assert.equal(download.status, 200); assert.equal(download.headers.get('content-disposition'), 'attachment; filename="Jagdlatein-15s.mp4"');
  assert.equal(sha256(Buffer.from(await download.arrayBuffer())), fixtures.mp4.sha256);
  const range = await get(`${canonical}${stem}.mp4`, { headers: { range: 'bytes=0-1023' } });
  assert.equal(range.status, 206); assert.equal(range.headers.get('content-range'), `bytes 0-1023/${fixtures.mp4.bytes}`);
  assert.deepEqual(Buffer.from(await range.arrayBuffer()), localBytes('mp4').subarray(0, 1024));
  for (const pathname of ['/werbung/private.mp4', `${stem}.mp4.bak`, '/lernen/wildjahr']) {
    const response = await get(`${canonical}${pathname}`, { redirect: 'manual' });
    assert.equal(response.status, 307, pathname); assert.equal(new URL(response.headers.get('location'), canonical).pathname, '/preise', pathname);
    await response.arrayBuffer();
  }
  const account = await get(`${canonical}/api/account`, { redirect: 'manual' });
  assert.equal(account.status, 401); assert.match(account.headers.get('cache-control'), /private.*no-store/);
  assert.match(account.headers.get('vary'), /Cookie/i); await account.arrayBuffer();
});
