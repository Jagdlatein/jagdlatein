// Exact public phone delivery for one reviewed Wildkunde reel.
// Local cases use synthetic cookies only, without accounts or a database.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { NextRequest } = local('next/server');
const { unstable_getResponseFromNextConfig } = local('next/experimental/testing/server');
const config = local('./next.config.js');
const stem = '/werbung/jagdlatein-wildkunde-quiz-2026-11-12';
const paths = ['html', 'mp4', 'png', 'txt'].map(ext => `${stem}.${ext}`);
const downloadName = 'Jagdlatein-Wildkunde-Quiz.mp4';
const review = () => JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/wildkunde-reel-promo-2026-11-12.json'), 'utf8').replace(/^\uFEFF/, ''));
const bytes = ext => fs.readFileSync(path.join(root, 'public', `${stem}.${ext}`));
const sha = value => createHash('sha256').update(value).digest('hex');
const security = {
  'content-security-policy': "frame-ancestors 'self';",
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
};
const neighbours = [
  '/werbung', '/werbung/', '/werbung/private.mp4', stem, `${stem}.zip`, `${stem}.jpg`, `${stem}.json`, `${stem}.wav`,
  stem.replace('2026-11-12', '2026-11-13') + '.html',
  ...paths.flatMap(p => [`${p}.bak`, `${p}/`, `${p}/private`, p.replace('jagdlatein', 'JAGDLATEIN')]),
];

function harness() {
  const calls = { sessions: 0, database: 0 };
  const load = createLoader({
    './lib/account-session-edge': {
      JL_ACCOUNT_COOKIE: 'jl_account_session',
      async readAccountSessionEdge() { calls.sessions++; return null; },
    },
    '@supabase/supabase-js': {
      createClient() { calls.database++; throw new Error('Public reel delivery must not open a database'); },
    },
  });
  const { middleware } = load('middleware.js');
  return { calls, run(p, method = 'GET') {
    return middleware(new NextRequest(`https://jagdlatein.test${p}`, {
      method, headers: { cookie: 'jl_account_session=isolated-invalid-reel-cookie' },
    }));
  } };
}

test('The four exact public reel GET and HEAD files skip sessions and database calls', async () => {
  const h = harness();
  for (const p of paths) for (const suffix of ['', '?download=1']) for (const method of ['GET', 'HEAD']) {
    const response = await h.run(p + suffix, method);
    assert.equal(response.status, 200, `${method} ${p}${suffix}`);
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.deepEqual(h.calls, { sessions: 0, database: 0 });
});

test('Nearby files, unlisted suffixes, teaching pages and account pages retain their guards', async () => {
  const h = harness();
  const protectedPaths = [...neighbours, '/lernen/videos', '/lernen/wildjahr', '/admin/testabos', '/konto', '/meine-kurse'];
  for (const p of protectedPaths) {
    const requested = p + '?download=1&source=phone';
    const response = await h.run(requested);
    assert.equal(response.status, 307, p);
    assert.equal(response.headers.get('x-middleware-next'), null, p);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, ['/konto', '/meine-kurse'].includes(p) ? '/login' : '/preise', p);
    assert.equal(target.searchParams.get('next'), requested, p);
  }
  assert.deepEqual(h.calls, { sessions: protectedPaths.length, database: 0 });
});

test('Only the deliberate exact MP4 query adds an attachment while all four global safeguards survive', async () => {
  const rules = (await config.headers()).filter(rule => rule.source.startsWith(stem));
  assert.equal(rules.length, 1);
  assert.equal(rules[0].source, `${stem}.mp4`);
  assert.deepEqual(rules[0].has, [{ type: 'query', key: 'download', value: '1' }]);
  assert.deepEqual(rules[0].headers, [{ key: 'Content-Disposition', value: `attachment; filename="${downloadName}"` }]);
  const cases = [
    [`${stem}.mp4?download=1`, `attachment; filename="${downloadName}"`],
    [`${stem}.mp4?source=phone&download=1`, `attachment; filename="${downloadName}"`],
    ...[...paths, `${stem}.mp4?download=0`, `${stem}.mp4?download=11`, `${stem}.mp4?download`,
      `${stem}.mp4.bak?download=1`, `${stem}.png?download=1`, '/api/account', '/lernen/wildjahr'].map(p => [p, null]),
  ];
  for (const [p, disposition] of cases) {
    const response = await unstable_getResponseFromNextConfig({ url: `https://jagdlatein.test${p}`, nextConfig: config });
    assert.equal(response.headers.get('content-disposition'), disposition, p);
    for (const [name, value] of Object.entries(security)) assert.equal(response.headers.get(name), value, `${p}: ${name}`);
  }
});

test('The phone page supplies an explicit download and a local non-autoplay inline preview with sources last', () => {
  const html = bytes('html').toString('utf8');
  assert.match(html, /<html\s+lang="de"/i);
  assert.match(html, /name="viewport"\s+content="width=device-width, initial-scale=1"/i);
  assert.match(html, /name="robots"\s+content="noindex,nofollow"/i);
  assert.equal((html.match(/<video\b/gi) || []).length, 1);
  const video = html.match(/<video\b[^>]*>/i)?.[0];
  assert.ok(video);
  assert.match(video, /\bcontrols\b/);
  assert.match(video, /\bplaysinline\b/);
  assert.match(video, /\bpreload="none"/);
  assert.ok(video.includes(`poster="${stem}.png"`));
  assert.ok(html.includes(`src="${stem}.mp4" type="video/mp4"`));
  const download = [...html.matchAll(/<a\b[^>]*>/gi)].map(match => match[0])
    .find(tag => tag.includes(`href="${stem}.mp4?download=1"`) && tag.includes(`download="${downloadName}"`));
  assert.ok(download, 'The phone download anchor carries the exact reviewed file and download name');
  assert.doesNotMatch(html, /\bautoplay\b|<script\b|<iframe\b|\bon\w+\s*=/i);
  assert.doesNotMatch(html, /@import\b|url\(\s*['"]?(?:https?:)?\/\//i);
  const details = html.indexOf('<details');
  assert.ok(details > html.indexOf('</video>'));
  assert.equal((html.match(/<details\b/gi) || []).length, 1);
  assert.doesNotMatch(html, /<details\b[^>]*\bopen\b/i);
  assert.ok(html.indexOf('</details>') > details);
  assert.ok(html.includes(`href="${stem}.txt"`));
  assert.equal(bytes('html').includes(Buffer.from('\r\n')), false);
  assert.equal(bytes('txt').includes(Buffer.from('\r\n')), false);
  const attributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
  for (const ext of ['html', 'txt']) assert.ok(attributes.includes(`public${stem}.${ext} text eol=lf`));
});

test('The four public artifacts match the final review manifest, with a real fast-start MP4 and full-size PNG', () => {
  const record = review();
  assert.deepEqual(record.files.map(file => file.path).sort(), [...paths].sort());
  for (const item of record.files) {
    assert.ok(Number.isSafeInteger(item.bytes) && item.bytes > 0);
    assert.match(item.sha256, /^[a-f0-9]{64}$/i);
    const content = fs.readFileSync(path.join(root, 'public', item.path));
    assert.equal(content.length, item.bytes, item.path);
    assert.equal(sha(content), item.sha256.toLowerCase(), item.path);
  }
  const video = bytes('mp4');
  const boxes = [];
  for (let offset = 0; offset < video.length;) {
    assert.ok(offset + 8 <= video.length, 'Complete MP4 top-level box header');
    let size = video.readUInt32BE(offset);
    const type = video.toString('ascii', offset + 4, offset + 8);
    if (size === 1) {
      assert.ok(offset + 16 <= video.length);
      const extended = video.readBigUInt64BE(offset + 8);
      assert.ok(extended <= BigInt(Number.MAX_SAFE_INTEGER));
      size = Number(extended);
    } else if (size === 0) size = video.length - offset;
    assert.ok(size >= 8 && offset + size <= video.length, type);
    boxes.push({ type, offset, size });
    offset += size;
  }
  assert.equal(boxes[0].type, 'ftyp');
  const moov = boxes.find(box => box.type === 'moov'), mdat = boxes.find(box => box.type === 'mdat');
  assert.ok(moov && mdat && moov.offset < mdat.offset && mdat.size > 8, 'Metadata precedes the video payload');
  const cover = bytes('png');
  assert.deepEqual(cover.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(cover.toString('ascii', 12, 16), 'IHDR');
  assert.equal(cover.readUInt32BE(16), 1080);
  assert.equal(cover.readUInt32BE(20), 1920);
  assert.deepEqual(Object.fromEntries(['width', 'height', 'fps', 'frames', 'duration', 'audio'].map(key => [key, record.video[key]])),
    { width: 1080, height: 1920, fps: 30, frames: 600, duration: 20, audio: 'none' });
  assert.match(record.quiz.category, /^Wildkunde(?: Quiz)?$/i);
  for (const key of ['question', 'answerA', 'answerB', 'answerC']) assert.ok(typeof record.quiz[key] === 'string' && record.quiz[key].trim());
});

if (process.env.JL_WILDKUNDE_REEL_BASE_URL) test('Live phone download returns the exact reviewed public bytes and byte ranges', async () => {
  const base = new URL(process.env.JL_WILDKUNDE_REEL_BASE_URL);
  assert.equal(base.protocol, 'https:');
  assert.ok(['jagdlatein.de', 'www.jagdlatein.de'].includes(base.hostname));
  const get = (p, options = {}) => fetch(new URL(p, base), { signal: AbortSignal.timeout(45000), ...options });
  const record = review();
  for (const item of record.files) {
    const response = await get(item.path);
    assert.equal(response.status, 200, item.path);
    assert.equal(new URL(response.url).pathname, item.path);
    assert.equal(response.headers.get('set-cookie'), null);
    const content = Buffer.from(await response.arrayBuffer());
    assert.equal(content.length, item.bytes, item.path);
    assert.equal(sha(content), item.sha256.toLowerCase(), item.path);
    if (item.path.endsWith('.mp4')) {
      assert.match(response.headers.get('content-type'), /^video\/mp4/);
      assert.ok(response.headers.get('content-disposition') === null || /^inline(?:;|$)/i.test(response.headers.get('content-disposition')));
    }
  }
  const attachment = await get(`${stem}.mp4?download=1`);
  assert.equal(attachment.status, 200);
  assert.equal(attachment.headers.get('content-disposition'), `attachment; filename="${downloadName}"`);
  assert.equal(sha(Buffer.from(await attachment.arrayBuffer())), sha(bytes('mp4')));
  const range = await get(`${stem}.mp4`, { headers: { Range: 'bytes=0-1023' } });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get('content-range'), `bytes 0-1023/${bytes('mp4').length}`);
  assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes('mp4').subarray(0, 1024));
  for (const p of [`${stem}.mp4.bak`, '/werbung/private.mp4', '/lernen/wildjahr']) {
    const denied = await get(p, { redirect: 'manual' });
    assert.equal(denied.status, 307, p);
    assert.equal(new URL(denied.headers.get('location'), base).pathname, '/preise');
    await denied.arrayBuffer();
  }
});
