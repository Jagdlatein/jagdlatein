// Isolated public delivery and byte preservation for the reviewed 30s reel.
// No browser profile, provider account, customer data or external request.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { inflateRawSync } = require('node:zlib');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { NextRequest } = local('next/server');
const { unstable_getResponseFromNextConfig } = local('next/experimental/testing/server');
const config = local('./next.config.js');
const stem = '/werbung/jagdlatein-reel-30s-2026-11-01';
const review = JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/reel-promo-2026-11-01.json'), 'utf8'));
const paths = ['html', 'mp4', 'zip', 'jpg', 'txt'].map(ext => `${stem}.${ext}`);
const bytes = ext => fs.readFileSync(path.join(root, 'public', `${stem}.${ext}`));
const sha = value => createHash('sha256').update(value).digest('hex');
const neighbours = ['/werbung', '/werbung/', '/werbung/private.mp4', `${stem}.json`, `${stem}.wav`,
  ...paths.flatMap(p => [`${p}.bak`, `${p}/`, `${p}/private`, p.replace('jagdlatein', 'JAGDLATEIN')]),
  `${stem}-ohne-Musik.mp4`, stem.replace('2026-11-01', '2026-11-02') + '.mp4'];

function harness() {
  let sessions = 0;
  const load = createLoader({ './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account_session', async readAccountSessionEdge() { sessions++; return null; } },
    '@supabase/supabase-js': { createClient() { throw Error('Anonymous media delivery must not open a database'); } } });
  const { middleware } = load('middleware.js');
  return { get sessions() { return sessions; }, run(p, method='GET') { return middleware(new NextRequest(`https://jagdlatein.test${p}`, { method, headers: { cookie: 'jl_account_session=invalid-for-isolated-test' } })); } };
}

test('Hosted files preserve the independently reviewed reel, package and cover bytes', async () => {
  assert.deepEqual(review.files.map(item => item.path), paths);
  for (const item of review.files) {
    const file = fs.readFileSync(path.join(root, 'public', item.path));
    assert.equal(file.length, item.bytes); assert.equal(sha(file), item.sha256);
  }
  assert.equal(sha(bytes('mp4')), '1c07f554247c76f5f53fea6519c23259dbefae2e52beb5438d153ff52162062b');
  assert.equal(sha(bytes('zip')), '07e69ed6864158dab51dfe244864bcb2d3aa534d33d26e951d5ff051b936f2c5');
  const video = bytes('mp4'); assert.equal(video.toString('ascii', 4, 8), 'ftyp');
  assert.ok(video.indexOf(Buffer.from('moov')) < video.indexOf(Buffer.from('mdat')), 'Fast-start metadata precedes media');
  const photo = await local('sharp')(bytes('jpg')).metadata();
  assert.equal(photo.width, 1080); assert.equal(photo.height, 1920); assert.equal(photo.format, 'jpeg');
});

test('ZIP members retain the final movie and the exact LF caption served from Git on every platform', () => {
  const zip = bytes('zip'); let end = zip.length - 22;
  while (end >= Math.max(0, zip.length - 65557) && zip.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0); assert.equal(zip.readUInt16LE(end + 10), 6);
  const members = new Map(); let cursor = zip.readUInt32LE(end + 16);
  for (let i = 0; i < 6; i++) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50);
    const method = zip.readUInt16LE(cursor + 10), size = zip.readUInt32LE(cursor + 20);
    const nameLength = zip.readUInt16LE(cursor + 28), offset = zip.readUInt32LE(cursor + 42);
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    assert.equal(zip.readUInt32LE(offset), 0x04034b50); assert.ok([0,8].includes(method));
    const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
    const compressed = zip.subarray(start, start + size), content = method === 8 ? inflateRawSync(compressed) : compressed;
    assert.equal(content.length, zip.readUInt32LE(cursor + 24)); assert.equal(members.has(name), false);
    members.set(name, content); cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
  }
  assert.deepEqual([...members.keys()], ['Jagdlatein-Reel-30s.mp4','Jagdlatein-Reel-30s-ohne-Musik.mp4','Jagdlatein-Reel-30s-Cover.jpg','Begleittext.txt','credits.json','Nutzung.txt']);
  assert.deepEqual(members.get('Jagdlatein-Reel-30s.mp4'), bytes('mp4'));
  assert.deepEqual(members.get('Jagdlatein-Reel-30s-Cover.jpg'), bytes('jpg'));
  assert.deepEqual(members.get('Begleittext.txt'), bytes('txt'));
  assert.equal(sha(members.get('Jagdlatein-Reel-30s-ohne-Musik.mp4')), '82a2cbdc0d1bc033d5b33dbca69357b8484529a24ab2a7367fdc4702a0148bb1');
  for (const content of [bytes('txt'), bytes('html'), members.get('credits.json'), members.get('Nutzung.txt')]) assert.equal(content.includes(Buffer.from('\r\n')), false);
  const attributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
  for (const ext of ['html','txt']) assert.ok(attributes.includes(`public${stem}.${ext} text eol=lf`));
});

test('Only the five exact new GET/HEAD paths bypass session reads; neighbours and lessons remain guarded', async () => {
  const h = harness();
  for (const p of paths) for (const suffix of ['', '?download=1']) for (const method of ['GET', 'HEAD']) {
    const response = await h.run(p + suffix, method);
    assert.equal(response.status, 200, p); assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('location'), null);
  }
  assert.equal(h.sessions, 0);
  for (const p of [...neighbours, '/lernen/videos', '/lernen/wildjahr', '/admin/testabos']) {
    const response = await h.run(p + '?download=1');
    assert.equal(response.status, 307, p); const redirect = new URL(response.headers.get('location'));
    assert.equal(redirect.pathname, '/preise'); assert.equal(redirect.searchParams.get('next'), p + '?download=1');
  }
  assert.equal(h.sessions, neighbours.length + 3);
});

test('The phone page previews locally without autoplay and keeps all credits after the download', () => {
  const html = bytes('html').toString('utf8');
  assert.match(html, /<html lang="de">/); assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.equal((html.match(/<video\b/g) || []).length, 1);
  assert.match(html, /<video controls playsinline preload="none"/); assert.doesNotMatch(html, /\bautoplay\b|<script\b|<iframe\b|\bon\w+\s*=/i);
  assert.ok(html.includes(`poster="${stem}.jpg"`)); assert.ok(html.includes(`src="${stem}.mp4" type="video/mp4"`));
  assert.ok(html.includes(`href="${stem}.mp4?download=1" download="Jagdlatein-Reel-30s.mp4"`));
  assert.ok(html.includes(`href="${stem}.zip" download="Jagdlatein-Reel-30s-Paket.zip"`));
  assert.ok(html.indexOf('<details>') > html.indexOf('</video>')); assert.doesNotMatch(html, /<details[^>]+open/);
  const caption = bytes('txt').toString('utf8'); assert.ok([...caption].length <= 2200);
  for (const photo of review.photos) for (const value of [photo.title, photo.author, photo.source, photo.licenseUrl]) {
    assert.ok(caption.includes(value), `Caption preserves ${value}`);
    assert.ok(html.includes(value.replaceAll('&', '&amp;')), `Page preserves ${value}`);
  }
  assert.match(caption, /Ausschnitte.*Skalierung.*Farb-Overlays.*Typografie/);
});

test('Next attaches only the deliberate exact reel download and package, preserving inline preview and security', async () => {
  const cases = [
    [`${stem}.mp4?download=1`, 'attachment; filename="Jagdlatein-Reel-30s.mp4"'],
    [`${stem}.zip`, 'attachment; filename="Jagdlatein-Reel-30s-Paket.zip"'],
    ...[`${stem}.mp4`, `${stem}.mp4?download=0`, `${stem}.mp4?download=11`, `${stem}.jpg`, `${stem}.html`, '/api/account', '/lernen/wildjahr', `${stem}.mp4.bak?download=1`].map(p => [p,null]),
  ];
  for (const [p, disposition] of cases) {
    const response = await unstable_getResponseFromNextConfig({ url: `https://jagdlatein.test${p}`, nextConfig: config });
    assert.equal(response.headers.get('content-disposition'), disposition, p);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self';");
  }
});
