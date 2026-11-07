// Exact public story delivery and reviewed artifact preservation only.
// No customer account, real browser storage or external request is used.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { inflateRawSync } = require('node:zlib');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { NextRequest } = local('next/server');
const { unstable_getResponseFromNextConfig } = local('next/experimental/testing/server');
const config = local('./next.config.js');
const stem = '/werbung/jagdlatein-story-2026-11-07';
const paths = ['.html', '.jpg', '.txt', '.zip', '-30s.mp4', '-15s.mp4'].map(suffix => stem + suffix);
const reviews = () => JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/story-promo-2026-11-07.json'), 'utf8').replace(/^\uFEFF/, ''));
const bytes = suffix => fs.readFileSync(path.join(root, 'public', stem + suffix));
const sha = value => createHash('sha256').update(value).digest('hex');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const neighbours = ['/werbung', '/werbung/', '/werbung/private.mp4', stem + '.mp4', stem + '.json', stem + '.wav',
  stem + '-30s-ohne-Musik.mp4', stem + '-15s-ohne-Musik.mp4', stem.replace('2026-11-07', '2026-11-08') + '.html',
  ...paths.flatMap(p => [p + '.bak', p + '/', p + '/private', p.replace('jagdlatein', 'JAGDLATEIN')])];

function harness() {
  const calls = { sessions: 0, database: 0 };
  const load = createLoader({ './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account_session', async readAccountSessionEdge() { calls.sessions++; return null; } },
    '@supabase/supabase-js': { createClient() { calls.database++; throw Error('Anonymous public story delivery opened a database'); } } });
  const { middleware } = load('middleware.js');
  return { calls, run(p, method = 'GET') { return middleware(new NextRequest('https://jagdlatein.test' + p, { method, headers: { cookie: 'jl_account_session=synthetic-invalid-only' } })); } };
}

function zipEntries(zip) {
  let end = zip.length - 22;
  while (end >= Math.max(0, zip.length - 65557) && zip.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, 'ZIP end directory exists');
  const count = zip.readUInt16LE(end + 10), entries = new Map();
  let cursor = zip.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50);
    const method = zip.readUInt16LE(cursor + 10), packed = zip.readUInt32LE(cursor + 20), size = zip.readUInt32LE(cursor + 24);
    const nameLength = zip.readUInt16LE(cursor + 28), offset = zip.readUInt32LE(cursor + 42);
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    assert.ok(!name.includes('..') && !/[\\/]/.test(name) && !entries.has(name), name);
    assert.equal(zip.readUInt32LE(offset), 0x04034b50); assert.ok([0, 8].includes(method));
    const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
    const compressed = zip.subarray(start, start + packed), content = method === 8 ? inflateRawSync(compressed) : compressed;
    assert.equal(content.length, size, name); entries.set(name, content);
    cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
  }
  return entries;
}

test('Only the six exact story GET and HEAD paths bypass session reads without new account or database access', async () => {
  const h = harness();
  for (const p of paths) for (const suffix of ['', '?download=1']) for (const method of ['GET', 'HEAD']) {
    const response = await h.run(p + suffix, method);
    assert.equal(response.status, 200, p); assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('location'), null); assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.deepEqual(h.calls, { sessions: 0, database: 0 });
});

test('Neighbouring story files, suffixes, directories and protected teaching or personal routes keep their guard', async () => {
  const h = harness();
  for (const p of [...neighbours, '/lernen/videos', '/lernen/wildjahr', '/lernen/pruefungsplan', '/admin/testabos', '/konto', '/meine-kurse']) {
    const requested = p + '?download=1&source=phone', response = await h.run(requested);
    assert.equal(response.status, 307, p); assert.equal(response.headers.get('x-middleware-next'), null);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.pathname, ['/konto', '/meine-kurse'].includes(p) ? '/login' : '/preise', p);
    assert.equal(destination.searchParams.get('next'), requested, p);
  }
  assert.equal(h.calls.sessions, neighbours.length + 6); assert.equal(h.calls.database, 0);
});

test('Next supplies exactly three new attachment rules while plain videos remain previewable and global security survives', async () => {
  const rules = (await config.headers()).filter(rule => rule.source.startsWith(stem));
  assert.deepEqual(rules.map(rule => rule.source), [stem + '-30s.mp4', stem + '-15s.mp4', stem + '.zip']);
  for (const rule of rules.slice(0, 2)) assert.deepEqual(rule.has, [{ type: 'query', key: 'download', value: '1' }]);
  assert.equal(rules[2].has, undefined);
  const cases = [[stem + '-30s.mp4?download=1', 'Jagdlatein-Story-30s.mp4'], [stem + '-15s.mp4?download=1', 'Jagdlatein-Story-15s.mp4'], [stem + '.zip', 'Jagdlatein-Story-Paket.zip'],
    ...[stem + '-30s.mp4', stem + '-15s.mp4', stem + '-30s.mp4?download=0', stem + '-15s.mp4?download=11', stem + '-30s.mp4.bak?download=1', stem + '.jpg', stem + '.html', '/lernen/wildjahr', '/api/account'].map(p => [p, null])];
  for (const [p, name] of cases) {
    const response = await unstable_getResponseFromNextConfig({ url: 'https://jagdlatein.test' + p, nextConfig: config });
    assert.equal(response.headers.get('content-disposition'), name ? `attachment; filename="${name}"` : null, p);
    assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self';");
    assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  }
});

test('The mobile HTML provides both deliberate video downloads, a package and one local preview without background media loads', () => {
  const html = bytes('.html').toString('utf8');
  assert.match(html, /<html lang="de">/); assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.equal((html.match(/<video\b/g) || []).length, 1);
  assert.match(html, /<video controls playsinline preload="none"/); assert.doesNotMatch(html, /\bautoplay\b|<script\b|<iframe\b|\bon\w+\s*=/i);
  for (const length of ['30s', '15s']) assert.ok(html.includes(`href="${stem}-${length}.mp4?download=1" download="Jagdlatein-Story-${length}.mp4"`));
  assert.ok(html.includes(`href="${stem}.zip" download="Jagdlatein-Story-Paket.zip"`));
  assert.ok(html.includes(`poster="${stem}.jpg"`)); assert.ok(html.includes(`src="${stem}-30s.mp4" type="video/mp4"`));
  assert.doesNotMatch(html, /@import\b|url\(\s*['"]?(?:https?:)?\/\//i);
  for (const href of ['https://apps.apple.com/de/app/jagdlatein/id6819820561', 'https://play.google.com/store/apps/details?id=de.jagdlatein.app&amp;hl=de', 'https://jagdlatein.de/']) assert.ok(html.includes(`href="${href}"`));
  const finalDetails = html.indexOf('<details>'); assert.ok(finalDetails > html.indexOf('</video>'));
  assert.equal((html.match(/<details\b/g) || []).length, 1); assert.doesNotMatch(html, /<details[^>]+open/);
  assert.ok(html.indexOf('</details>') > html.lastIndexOf('<footer'));
});

test('All six hosted artifacts match the separately reviewed final manifest, with fast-start MP4 and a vertical JPEG cover', async () => {
  const review = reviews(); assert.deepEqual(review.files.map(item => item.path).sort(), [...paths].sort());
  for (const item of review.files) {
    assert.ok(Number.isSafeInteger(item.bytes) && item.bytes > 0); assert.match(item.sha256, /^[a-f0-9]{64}$/);
    const content = fs.readFileSync(path.join(root, 'public', item.path));
    assert.equal(content.length, item.bytes, item.path); assert.equal(sha(content), item.sha256, item.path);
  }
  for (const suffix of ['-30s.mp4', '-15s.mp4']) {
    const content = bytes(suffix); assert.equal(content.toString('ascii', 4, 8), 'ftyp');
    assert.ok(content.indexOf(Buffer.from('moov')) >= 0 && content.indexOf(Buffer.from('moov')) < content.indexOf(Buffer.from('mdat')), suffix);
  }
  const cover = await local('sharp')(bytes('.jpg')).metadata(); assert.equal(cover.width, 1080); assert.equal(cover.height, 1920); assert.equal(cover.format, 'jpeg');
});

test('The delivered ZIP contains both exact videos, cover, caption, separate silent exports and usable credit records', () => {
  const members = zipEntries(bytes('.zip'));
  const names = ['Jagdlatein-Story-30s.mp4', 'Jagdlatein-Story-15s.mp4', 'Jagdlatein-Story-30s-ohne-Musik.mp4', 'Jagdlatein-Story-15s-ohne-Musik.mp4', 'Jagdlatein-Story-Cover.jpg', 'Begleittext.txt', 'credits.json', 'Nutzung.txt'];
  assert.deepEqual([...members.keys()].sort(), names.sort());
  for (const [name, suffix] of [['Jagdlatein-Story-30s.mp4', '-30s.mp4'], ['Jagdlatein-Story-15s.mp4', '-15s.mp4'], ['Jagdlatein-Story-Cover.jpg', '.jpg'], ['Begleittext.txt', '.txt']]) assert.deepEqual(members.get(name), bytes(suffix), name);
  for (const name of names.filter(name => name.endsWith('ohne-Musik.mp4'))) assert.equal(members.get(name).toString('ascii', 4, 8), 'ftyp', name);
  const credits = JSON.parse(members.get('credits.json').toString('utf8').replace(/^\uFEFF/, ''));
  assert.ok(credits && typeof credits === 'object');
  for (const name of ['Begleittext.txt', 'credits.json', 'Nutzung.txt']) assert.equal(members.get(name).includes(Buffer.from('\r\n')), false, name);
  const attributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
  for (const suffix of ['.html', '.txt']) assert.ok(attributes.includes(`public${stem}${suffix} text eol=lf`));
});

test('Both the phone page and posting caption preserve every actual media author, source and license with the visible pool boundary', () => {
  const review = reviews(), html = bytes('.html').toString('utf8'), caption = bytes('.txt').toString('utf8');
  assert.ok(Array.isArray(review.videos) && review.videos.length === 3);
  assert.deepEqual(review.videos.map(video => video.author).sort(), ['Moritz Kohls', 'NaIzletuSi ™', 'Golden Woofs'].sort());
  for (const video of review.videos) for (const value of [video.title, video.author, video.source, video.license, video.licenseUrl]) {
    assert.ok(typeof value === 'string' && value.length > 0); assert.ok(caption.includes(value), value); assert.ok(html.includes(escape(value)), value);
  }
  assert.match(html, /Pool.*keine Jagdprüfung oder jagdliche Einsatzfähigkeit/);
  assert.match(caption, /Originalton entfernt/); assert.match(caption, /eigene|Eigene/);
  assert.equal(bytes('.html').includes(Buffer.from('\r\n')), false); assert.equal(bytes('.txt').includes(Buffer.from('\r\n')), false);
});
