// Isolated public delivery and byte preservation for the reviewed 30s reel.
// No browser profile, provider account, customer data or external request.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
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
  assert.equal(sha(bytes('zip')), '63c05a931bb84f3a9dbf9be87972e9be81ddbcf73cc32952ec1d6fdde8a509fb');
  const video = bytes('mp4'); assert.equal(video.toString('ascii', 4, 8), 'ftyp');
  assert.ok(video.indexOf(Buffer.from('moov')) < video.indexOf(Buffer.from('mdat')), 'Fast-start metadata precedes media');
  const photo = await local('sharp')(bytes('jpg')).metadata();
  assert.equal(photo.width, 1080); assert.equal(photo.height, 1920); assert.equal(photo.format, 'jpeg');
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
