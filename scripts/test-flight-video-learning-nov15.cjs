// Independent binary, preservation and actual-reader integration checks.
// Public curriculum reads only; no browser/account storage is accessed.
const { withoutAuerhuhnNov25Cases, withoutAuerhuhnNov25Paths } = require('./helpers/auerhuhn-video-addition-nov25.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { withoutMammalNov15Cases, withoutMammalNov15Paths, beforeMammalNov15Links } = require('./helpers/mammal-video-addition-nov15.cjs');
const sharp = local('sharp');
const revision = 'c5a015713b2fc7181af09f1dfca23bc57be53730';
const directory = '/lernen/videos-2026-11-15';
const ids = ['stockente-flugstart', 'graugans-landung'];
const load = createLoader();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const file = value => path.join(root, 'public', value);
function data() {
  const records = JSON.parse(fs.readFileSync(file(`${directory}/mediennachweise.json`), 'utf8'));
  const exports = load('lib/wildlife-video-expansion-2026-11-15.js');
  const cases = Object.values(exports).find(value => Array.isArray(value) && value.every(item => ids.includes(item?.id)));
  assert.ok(cases, 'A dedicated export contains the two new authored scenes');
  assert.deepEqual(cases.map(item => item.id), ids);
  return { records, cases };
}
function publishedLoader() {
  const cache = new Map();
  function old(relative) {
    const filename = path.resolve(root, relative), relativeFile = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(relativeFile && !relativeFile.startsWith('../') && !path.isAbsolute(relativeFile));
    assert.notEqual(relativeFile, 'data/learning-expansion-afternoon-2026-10-16.json');
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${relativeFile}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? old(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return old;
}
function atoms(bytes, start = 0, end = bytes.length) {
  const out = []; let offset = start;
  while (offset < end) {
    assert.ok(offset + 8 <= end, 'Complete MP4 atom header');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    let size = bytes.readUInt32BE(offset), header = 8;
    if (size === 1) { assert.ok(offset + 16 <= end); size = Number(bytes.readBigUInt64BE(offset + 8)); header = 16; }
    if (!size) size = end - offset;
    assert.ok(Number.isSafeInteger(size) && size >= header && offset + size <= end, `${type}: bounded atom`);
    out.push({ type, start: offset, body: offset + header, end: offset + size }); offset += size;
  }
  assert.equal(offset, end); return out;
}
function child(bytes, parent, type) {
  const result = atoms(bytes, parent.body, parent.end).find(item => item.type === type);
  assert.ok(result, `${parent.type}/${type}`); return result;
}
function timing(bytes, atom) {
  const version = bytes[atom.body]; assert.ok(version === 0 || version === 1);
  const position = atom.body + (version === 0 ? 12 : 20), scale = bytes.readUInt32BE(position);
  const ticks = version === 0 ? bytes.readUInt32BE(position + 4) : Number(bytes.readBigUInt64BE(position + 4));
  assert.ok(scale > 0 && ticks > 0); return { scale, ticks, seconds: ticks / scale };
}
function spsFormat(bytes, avc) {
  assert.equal(bytes[avc.body], 1, 'AVC configuration version');
  assert.equal(bytes[avc.body + 1], 100, 'H.264 High profile');
  assert.ok((bytes[avc.body + 5] & 31) > 0, 'At least one SPS NAL');
  const length = bytes.readUInt16BE(avc.body + 6), nal = bytes.subarray(avc.body + 8, avc.body + 8 + length);
  assert.equal(nal[0] & 31, 7);
  const rbsp = [];
  for (let i = 1; i < nal.length; i++) if (!(nal[i] === 3 && nal[i - 1] === 0 && nal[i - 2] === 0)) rbsp.push(nal[i]);
  let position = 24;
  function bit() { assert.ok(position < rbsp.length * 8); const value = rbsp[position >> 3] >> (7 - (position & 7)) & 1; position++; return value; }
  function ue() { let zeros = 0; while (!bit()) { assert.ok(++zeros < 32); } let value = 1; while (zeros--) value = value * 2 + bit(); return value - 1; }
  ue(); assert.equal(ue(), 1, 'Actual SPS yuv420p chroma'); assert.equal(ue(), 0, '8-bit luma'); assert.equal(ue(), 0, '8-bit chroma');
}
function movie(bytes) {
  const top = atoms(bytes), moov = top.find(item => item.type === 'moov'), mdat = top.find(item => item.type === 'mdat');
  assert.equal(top[0].type, 'ftyp'); assert.ok(moov && mdat && moov.start < mdat.start, 'Fast-start metadata precedes complete payload');
  const tracks = atoms(bytes, moov.body, moov.end).filter(item => item.type === 'trak').map(track => child(bytes, track, 'mdia'));
  const handler = media => { const hdlr = child(bytes, media, 'hdlr'); return bytes.toString('ascii', hdlr.body + 8, hdlr.body + 12); };
  assert.equal(tracks.filter(media => handler(media) === 'soun').length, 0, 'The authored silent versions contain no invented bird calls');
  const videos = tracks.filter(media => handler(media) === 'vide'); assert.equal(videos.length, 1);
  const media = videos[0], time = timing(bytes, child(bytes, media, 'mdhd'));
  const table = child(bytes, child(bytes, media, 'minf'), 'stbl');
  const stsz = child(bytes, table, 'stsz'), frames = bytes.readUInt32BE(stsz.body + 8);
  const stts = child(bytes, table, 'stts'), count = bytes.readUInt32BE(stts.body + 4);
  assert.equal(stts.body + 8 + count * 8, stts.end);
  let timeFrames = 0, ticks = 0;
  for (let i = 0; i < count; i++) { const samples = bytes.readUInt32BE(stts.body + 8 + i * 8), delta = bytes.readUInt32BE(stts.body + 12 + i * 8); assert.ok(samples > 0 && delta > 0); timeFrames += samples; ticks += samples * delta; }
  assert.equal(timeFrames, frames); assert.equal(ticks, time.ticks, 'Every video sample contributes to the stored timestamp sequence');
  const stsd = child(bytes, table, 'stsd'); assert.equal(bytes.readUInt32BE(stsd.body + 4), 1);
  const sample = atoms(bytes, stsd.body + 8, stsd.end)[0]; assert.equal(sample.type, 'avc1');
  const width = bytes.readUInt16BE(sample.start + 32), height = bytes.readUInt16BE(sample.start + 34);
  const config = atoms(bytes, sample.start + 86, sample.end), avc = config.find(item => item.type === 'avcC'); assert.ok(avc); spsFormat(bytes, avc);
  const pasp = config.find(item => item.type === 'pasp'), sar = pasp ? [bytes.readUInt32BE(pasp.body), bytes.readUInt32BE(pasp.body + 4)] : [1, 1];
  return { width, height, sar, frames, seconds: time.seconds, fps: frames / time.seconds, containerSeconds: timing(bytes, child(bytes, moov, 'mvhd')).seconds };
}

test('Flight scenes retain all21 existing full wild objects/59 questions and all4 dog objects/8 questions against the published release', () => {
  const old = publishedLoader(), beforeWild = old('lib/wildlife-video-cases.js').wildlifeVideoCases, beforeDogs = old('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
  assert.equal(beforeWild.length, 21); assert.equal(beforeWild.flatMap(item => item.questions).length, 59);
  assert.equal(beforeDogs.length, 4); assert.equal(beforeDogs.flatMap(item => item.questions).length, 8);
  const now = load('lib/wildlife-video-cases.js');
  assert.deepEqual(withoutMammalNov15Cases(withoutAuerhuhnNov25Cases(now.wildlifeVideoCases)).filter(item => !ids.includes(item.id)), beforeWild);
  assert.deepEqual(now.wildlifeVideoCases.slice(0, 21), beforeWild);
  assert.deepEqual(load('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons, beforeDogs);
  assert.deepEqual(beforeMammalNov15Links(withoutAuerhuhnNov25Cases(load('lib/learning-video-links.js').learningVideoLinks)).filter(item => !ids.includes(item.id)), old('lib/learning-video-links.js').learningVideoLinks);
  assert.equal(withoutMammalNov15Cases(withoutAuerhuhnNov25Cases(now.wildlifeVideoCases)).flatMap(item => item.questions).length, 65);
});

test('Actual new MP4 bytes contain every recorded frame, valid timestamps, H264/yuv420p and the preserved display aspect', () => {
  const { records, cases } = data(); assert.deepEqual(records.map(item => item.id), ids);
  for (const [i, record] of records.entries()) {
    const scene = cases[i], bytes = fs.readFileSync(file(scene.src)), actual = movie(bytes);
    assert.equal(scene.src, `${directory}/${scene.id}.mp4`); assert.equal(record.file, scene.src);
    assert.equal(bytes.length, record.bytes); assert.equal(sha256(bytes), record.sha256);
    assert.equal(actual.frames, scene.id === ids[0] ? 816 : 1911); assert.equal(actual.frames, record.encodedVideoFrames); assert.equal(actual.frames, record.sourceVideoFrames, 'No source image is removed or duplicated');
    assert.ok(Math.abs(actual.seconds - record.sourceDuration) < 0.1); assert.ok(Math.abs(actual.containerSeconds - record.duration) < 0.002);
    assert.ok(Math.abs(actual.containerSeconds - actual.seconds) < 0.05); assert.equal(scene.duration, Math.round(record.duration));
    assert.equal(scene.mimeType, 'video/mp4'); assert.equal(record.aiGenerated, false);
    assert.deepEqual([actual.width, actual.height], scene.id === ids[0] ? [1280, 720] : [1024, 576]);
    assert.ok(Math.abs(actual.fps - (scene.id === ids[0] ? 30000 / 1001 : 25)) < 0.0001);
    assert.deepEqual(actual.sar, scene.id === ids[0] ? [1, 1] : [1023, 1024]);
    const display = actual.width * actual.sar[0] / actual.sar[1] / actual.height;
    assert.ok(Math.abs(display - (scene.id === ids[0] ? 16 / 9 : 341 / 192)) < 1e-10);
    for (const question of scene.questions) assert.ok(Number.isFinite(question.at) && question.at >= 0 && question.at < actual.seconds);
    assert.ok(record.posterTime >= 0 && record.posterTime < actual.seconds);
  }
});

test('Both preview JPEGs decode fully with their exact hashes and correct square-pixel display dimensions', async () => {
  const { records, cases } = data();
  for (const [i, record] of records.entries()) {
    assert.equal(cases[i].poster, `${directory}/${record.id}-vorschau.jpg`); assert.equal(record.poster, cases[i].poster);
    const bytes = fs.readFileSync(file(record.poster)); assert.equal(bytes.length, record.posterBytes); assert.equal(sha256(bytes), record.posterSha256);
    const image = sharp(bytes), meta = await image.metadata(); assert.equal(meta.format, 'jpeg');
    assert.deepEqual([meta.width, meta.height], record.id === ids[0] ? [1280, 720] : [1023, 576]);
    const decoded = await image.raw().toBuffer({ resolveWithObject: true }); assert.equal(decoded.data.length, meta.width * meta.height * decoded.info.channels);
  }
});

test('Authored cases carry exactly three distinct four-option questions and source/license records for their own files', () => {
  const { cases, records } = data(), credits = fs.readFileSync(file(`${directory}/MEDIEN-LIZENZEN.md`), 'utf8');
  assert.deepEqual(fs.readdirSync(file(directory)).sort(), ['MEDIEN-LIZENZEN.md', 'mediennachweise.json', ...ids.flatMap(id => [`${id}.mp4`, `${id}-vorschau.jpg`])].sort());
  for (const [i, scene] of cases.entries()) {
    assert.equal(scene.questions.length, 3); assert.equal(new Set(scene.questions.map(question => question.id)).size, 3);
    assert.deepEqual(scene.questions.map(question => question.at), scene.id === ids[0] ? [3, 20, 24] : [36, 41, 71], 'Question timestamps remain tied to the independently viewed frames');
    assert.equal(new Set(scene.questions.map(question => question.question)).size, 3);
    assert.ok(scene.questions.every(question => question.choices.length === 4 && new Set(question.choices).size === 4 && Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4 && question.explanation.trim()));
    for (const key of ['source', 'author', 'license', 'licenseUrl', 'modifications']) { assert.equal(scene[key], records[i][key]); assert.ok(credits.includes(scene[key]), `${scene.id}: ${key} credited`); }
    assert.equal(scene.reviewedOn, '2026-11-15'); assert.equal(records[i].checked, '2026-11-15');
    assert.deepEqual(records[i].questionTimes, scene.questions.map(question => question.at));
  }
});

test('The current real case UI hides all new explanations until a deliberate answer, then advances each own round', t => {
  const { cases } = data();
  for (const scene of cases) {
    const h = setup('components/WildlifeVideoCases.js', { eintrag: scene.id }, { router: { asPath: `/lernen/wildtier-videofaelle?eintrag=${scene.id}#video-fall` } }); t.after(() => h.dispose());
    const source = h.nodes(node => node.type === 'source')[0], player = h.nodes(node => node.type === 'video')[0];
    assert.equal(source.props.src, scene.src); assert.equal(source.props.type, 'video/mp4'); assert.equal(player.props.preload, 'none'); assert.equal(player.props.autoPlay, undefined);
    for (const question of scene.questions) assert.ok(!text(h.tree).includes(question.explanation));
    h.click('Textfassung gelesen – Fragen öffnen');
    for (const [index, question] of scene.questions.entries()) {
      assert.ok(text(h.tree).includes(question.question));
      const choices = h.nodes(node => node.type === 'button' && question.choices.includes(text(node)));
      assert.equal(choices.length, 4); assert.ok(!text(h.tree).includes(question.explanation));
      assert.ok(!text(h.tree).includes('Richtige Antwort')); assert.ok(!text(h.tree).includes('Deine Antwort'));
      h.click(question.choices[question.answer]); assert.ok(text(h.tree).includes(question.explanation));
      if (index < 2) { assert.ok(!text(h.tree).includes(scene.questions[index + 1].explanation)); h.click('Nächste Frage'); }
    }
    assert.equal(h.nodes(node => node.type === 'progress')[0].props.value, 3);
    assert.equal(h.calls.length, 0, 'Answering adds no unrelated navigation');
  }
});

test('New species/course links, directory and global search share the reviewed Alula boundary without indexing answer keys', () => {
  const { cases } = data(), links = load('lib/learning-video-links.js');
  const library = load('lib/learning-video-library.js').getLearningVideoLibrary(), discovery = load('lib/learning-video-discovery.js');
  const filter = load('lib/video-library-search.js').filterLearningVideos;
  const search = load('lib/learning-search.js').searchLearning;
  function results(query) { const options = { query, type: 'entry', category: 'wildkunde' }, first = search(options); return [first.results, ...Array.from({ length: first.pages - 1 }, (_, i) => search({ ...options, page: i + 2 }).results)].flat(); }
  for (const scene of cases) {
    const row = library.find(item => item.id === `wild-${scene.id}`), metadata = links.learningVideoLinks.find(item => item.id === scene.id), concept = discovery.getLearningVideoDiscovery(scene.id);
    assert.ok(row && metadata && concept); assert.equal(metadata.kind, 'wild'); assert.ok(metadata.speciesSlugs.includes(scene.speciesSlug));
    assert.ok(links.getWildlifeVideoLinks(scene.speciesSlug).some(item => item.id === scene.id));
    assert.ok(links.getCourseVideoLinks('wissen-ausbau-federaufbau-funktion-2026').some(item => item.id === scene.id));
    const primary = scene.id === ids[0] ? '/kurse/wissen-ausbau-federaufbau-funktion-2026#lesson-alula' : '/kurse/wissen-vertiefung-wild-wasservoegel-jahreslauf#lesson-familien';
    assert.equal(scene.course, primary); assert.equal(row.courses[0].href, primary);
    assert.ok(row.courses.some(course => course.href.split('#')[0] === '/kurse/wissen-ausbau-federaufbau-funktion-2026'));
    assert.equal(row.href, `/lernen/wildtier-videofaelle?eintrag=${scene.id}#video-fall`);
    assert.ok(filter(library, scene.id === ids[0] ? 'Stockente Flugstart' : 'Graugans Landung', 'wild').some(item => item.id === row.id));
    assert.ok(results(scene.id === ids[0] ? 'Stockente Flugstart' : 'Graugans Landung').some(item => item.href.split('#')[0] === row.href.split('#')[0]));
    if (scene.id === ids[0]) { assert.match(`${concept.focus} ${concept.note}`, /Alula|Daumenfittich/); assert.match(`${concept.focus} ${concept.note}`, /nicht|unsichtbar|unaufgelöst|unaufgeloest/); }
    const entry = load('lib/media-search-entries.js').mediaSearchEntries.find(item => item.id === `video-${scene.id}`);
    assert.ok(entry); for (const question of scene.questions) { assert.ok(!JSON.stringify(entry).includes(question.question)); assert.ok(!JSON.stringify(entry).includes(question.explanation)); }
  }
});

test('Only the exact new films/posters and attribution documents extend public access; paid neighbouring paths remain guarded', async () => {
  const old = publishedLoader()('lib/media-experience-asset-paths.js'), current = load('lib/media-experience-asset-paths.js');
  const media = ids.flatMap(id => [`${directory}/${id}.mp4`, `${directory}/${id}-vorschau.jpg`]);
  const documents = [`${directory}/mediennachweise.json`, `${directory}/MEDIEN-LIZENZEN.md`];
  assert.deepEqual(withoutMammalNov15Paths(withoutAuerhuhnNov25Paths(current.mediaExperienceAssetPaths)).filter(value => !media.includes(value)), old.mediaExperienceAssetPaths);
  assert.deepEqual(withoutMammalNov15Paths(withoutAuerhuhnNov25Paths(current.mediaExperienceDocumentationPaths)).filter(value => !documents.includes(value)), old.mediaExperienceDocumentationPaths);
  for (const value of media) assert.ok(current.mediaExperienceAssetPaths.includes(value));
  for (const value of documents) assert.ok(current.mediaExperienceDocumentationPaths.includes(value));
  const middleware = load('middleware.js').middleware;
  const request = pathname => { const nextUrl = new URL(pathname, 'https://jagdlatein.de'); return { nextUrl, url: nextUrl.href, cookies: { get() { return undefined; } } }; };
  for (const value of [...media, ...documents]) { const response = await middleware(request(value)); assert.equal(response.headers.get('x-middleware-next'), '1', value); assert.equal(response.headers.get('location'), null); }
  for (const value of [directory, `${directory}/answers.json`, `${directory}/mediennachweise.json/extra`, `${directory}/stockente-flugstart.mp4/private`, `${directory}/stockente-flugstart-original.webm`, '/lernen/wildtier-videofaelle?eintrag=stockente-flugstart', '/kurse/wissen-ausbau-federaufbau-funktion-2026#lesson-alula']) {
    const response = await middleware(request(value)); assert.notEqual(response.headers.get('x-middleware-next'), '1', value); assert.equal(new URL(response.headers.get('location')).pathname, '/preise', value);
  }
});
