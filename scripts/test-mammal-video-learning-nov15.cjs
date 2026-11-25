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
const sharp = local('sharp');
const revision = 'd81efdd66f3639cb0184316a714d1e88626c3537';
const directory = '/lernen/videos-saeugetiere-2026-11-15';
const ids = ['murmeltier-klausenpass', 'fischotter-fellpflege'];
const load = createLoader();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const file = value => path.join(root, 'public', value);
function data() {
  const records = JSON.parse(fs.readFileSync(file(`${directory}/mediennachweise.json`), 'utf8'));
  const exports = load('lib/wildlife-video-expansion-mammals-2026-11-15.js');
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
  assert.equal(tracks.filter(media => handler(media) === 'soun').length, 0, 'The authored silent versions contain no invented calls or other audio');
  const videos = tracks.filter(media => handler(media) === 'vide'); assert.equal(videos.length, 1);
  const media = videos[0], time = timing(bytes, child(bytes, media, 'mdhd'));
  const table = child(bytes, child(bytes, media, 'minf'), 'stbl');
  const stsz = child(bytes, table, 'stsz'), frames = bytes.readUInt32BE(stsz.body + 8);
  const commonSampleSize = bytes.readUInt32BE(stsz.body + 4);
  if (commonSampleSize === 0) {
    assert.equal(stsz.body + 12 + frames * 4, stsz.end, 'Every stored sample has a size entry');
    for (let i = 0; i < frames; i++) assert.ok(bytes.readUInt32BE(stsz.body + 12 + i * 4) > 0, 'Each real video sample is nonempty');
  } else assert.equal(stsz.body + 12, stsz.end);
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

const course = 'wissen-spuren-systematisch';
const addedConcepts = { fuchs: ['Zehengänger', 'Auftrittsform'], 'dachs-fellpflege': ['Sohlengänger', 'Auftrittsform'], rehwild: ['Zehenspitzengänger', 'Auftrittsform'] };
const boundedNotes = {
  fuchs: 'Kursbezug: Zehengänger. Der Film beweist keinen vollständig sichtbaren Fusskontakt oder erhaltenen Pfotenabdruck.',
  'dachs-fellpflege': 'Kursbezug: Sohlengänger. Der Film beweist keinen vollständig sichtbaren Sohlenkontakt oder erhaltenen Pfotenabdruck.',
  rehwild: 'Kursbezug: Zehenspitzengänger. Der Film ersetzt keine vollständige Ansicht des Fusskontakts oder eines Trittsiegels.',
};
const expected = [
  { id: ids[0], frames: 1312, fps: 30, seconds: 1312 / 30, sourceStart: 0.007, maxBytes: 15 * 1024 * 1024, times: [14, 29, 36], posterTime: 29, slug: 'murmeltier', href: '/kurse/wissen-vertiefung-wild-alpine-winterstrategien#lesson-protokoll' },
  { id: ids[1], frames: 2346, fps: 25, seconds: 2346 / 25, sourceStart: 0, maxBytes: 30 * 1024 * 1024, times: [32, 72, 92], posterTime: 32, slug: 'fischotter', href: '/kurse/wissen-ausbau-gewaesser-feuchtgebiete#lesson-ufer' },
];

test('All 23 published wildlife cases / 65 questions and 4 dog cases / 8 questions remain exact complete objects in order', () => {
  const old = publishedLoader(), before = old('lib/wildlife-video-cases.js').wildlifeVideoCases, dogs = old('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
  assert.equal(before.length, 23); assert.equal(before.flatMap(item => item.questions).length, 65); assert.equal(dogs.length, 4); assert.equal(dogs.flatMap(item => item.questions).length, 8);
  const current = load('lib/wildlife-video-cases.js');
  assert.deepEqual(withoutAuerhuhnNov25Cases(current.wildlifeVideoCases).filter(item => !ids.includes(item.id)), before); assert.deepEqual(current.wildlifeVideoCases.slice(0, 23), before);
  assert.deepEqual(load('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons, dogs);
  assert.equal(current.wildlifeVideoCases.length, 26); assert.equal(current.wildlifeVideoQuestionCount, 74);
});

test('Only the 3 approved foot-course appends and their exact bounded discovery notes change existing lightweight metadata', () => {
  const old = publishedLoader(), links = load('lib/learning-video-links.js').learningVideoLinks, previousLinks = old('lib/learning-video-links.js').learningVideoLinks;
  assert.deepEqual(withoutAuerhuhnNov25Cases(links).filter(item => !ids.includes(item.id)), previousLinks.map(item => Object.hasOwn(addedConcepts, item.id) ? { ...item, moduleIds: [...item.moduleIds, course] } : item));
  const before = old('lib/learning-video-discovery.js'), after = load('lib/learning-video-discovery.js');
  const oldCases = [...old('lib/wildlife-video-cases.js').wildlifeVideoCases, ...old('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons];
  for (const scene of oldCases) {
    const prior = before.getLearningVideoDiscovery(scene.id), current = after.getLearningVideoDiscovery(scene.id);
    assert.deepEqual(current, Object.hasOwn(addedConcepts, scene.id) ? { ...prior, focus: `${prior.focus} ${boundedNotes[scene.id]}`, concepts: [...prior.concepts, ...addedConcepts[scene.id]], note: boundedNotes[scene.id] } : prior, scene.id);
  }
});

test('Both bounded mobile MP4s preserve every real video sample, positive sample timing, 16:9 square pixels and silent H264/yuv420p', () => {
  const { cases, records } = data(); assert.deepEqual(records.map(item => item.id), ids);
  for (const [i, record] of records.entries()) {
    const spec = expected[i], scene = cases[i], bytes = fs.readFileSync(file(scene.src)), actual = movie(bytes);
    assert.equal(scene.src, `${directory}/${spec.id}.mp4`); assert.equal(record.file, scene.src); assert.equal(bytes.length, record.bytes); assert.equal(sha256(bytes), record.sha256);
    assert.ok(bytes.length <= spec.maxBytes, `${spec.id}: bounded mobile file`); assert.deepEqual([actual.width, actual.height, ...actual.sar], [1280, 720, 1, 1]);
    assert.equal(actual.frames, spec.frames); assert.equal(record.sourceVideoFrames, spec.frames); assert.equal(record.encodedVideoFrames, spec.frames);
    assert.ok(Math.abs(actual.fps - spec.fps) < 0.00001); assert.ok(Math.abs(actual.seconds - spec.seconds) < 0.000002); assert.ok(Math.abs(actual.containerSeconds - record.duration) < 0.002);
    assert.ok(Math.abs(record.sourceDuration - spec.seconds) < 0.000002); assert.equal(scene.duration, Math.round(spec.seconds)); assert.equal(scene.mimeType, 'video/mp4'); assert.equal(record.sourceStartTimestamp, spec.sourceStart);
    assert.equal(record.timeline.sourceFirstFrameSeconds, spec.sourceStart); assert.equal(record.timeline.encodedFirstFrameSeconds, 0);
    assert.equal(record.timeline.sourceFrameCount, spec.frames); assert.equal(record.timeline.encodedFrameCount, spec.frames);
    assert.ok(Math.abs(record.timeline.encodedLastFrameSeconds - (spec.frames - 1) / spec.fps) < 0.000002);
    assert.ok(Math.abs(record.timeline.sourceLastFrameSeconds - spec.sourceStart - record.timeline.encodedLastFrameSeconds) < 0.000002);
    assert.equal(record.timeline.maxTimestampDifferenceSeconds, 0); assert.equal(record.timeline.allFrameTimestampsCompared, true);
    assert.equal(record.audioTrack, false); assert.equal(record.aiGenerated, false); assert.equal(record.posterTime, spec.posterTime);
    assert.deepEqual(record.questionTimes, spec.times); assert.deepEqual(scene.questions.map(question => question.at), spec.times);
    for (const question of scene.questions) assert.ok(question.at >= 0 && question.at < actual.seconds);
  }
});

test('Actual JPEG posters decode fully and every asset has its own matching source/license/change record', async () => {
  const { cases, records } = data(), credits = fs.readFileSync(file(`${directory}/MEDIEN-LIZENZEN.md`), 'utf8');
  assert.deepEqual(fs.readdirSync(file(directory)).sort(), ['MEDIEN-LIZENZEN.md', 'mediennachweise.json', ...ids.flatMap(id => [`${id}.mp4`, `${id}-vorschau.jpg`])].sort());
  for (const [i, record] of records.entries()) {
    const scene = cases[i]; assert.equal(scene.poster, `${directory}/${scene.id}-vorschau.jpg`); assert.equal(record.poster, scene.poster);
    const bytes = fs.readFileSync(file(scene.poster)); assert.equal(bytes.length, record.posterBytes); assert.equal(sha256(bytes), record.posterSha256);
    const image = sharp(bytes), metadata = await image.metadata(); assert.equal(metadata.format, 'jpeg'); assert.deepEqual([metadata.width, metadata.height], [1280, 720]);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true }); assert.equal(pixels.data.length, metadata.width * metadata.height * pixels.info.channels);
    for (const key of ['source', 'author', 'license', 'licenseUrl', 'modifications']) { assert.equal(scene[key], record[key]); assert.ok(credits.includes(scene[key]), `${scene.id}: ${key} documented`); }
    assert.equal(scene.reviewedOn, '2026-11-15'); assert.equal(record.checked, '2026-11-15');
    assert.equal(scene.questions.length, 3); assert.equal(new Set(scene.questions.map(question => question.id)).size, 3); assert.equal(new Set(scene.questions.map(question => question.question)).size, 3);
    assert.ok(scene.questions.every(question => question.choices.length === 4 && new Set(question.choices).size === 4 && Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4 && question.explanation.trim()));
  }
});

test('The actual current reader displays 4 neutral choices for each new question and reveals its explanation only after an answer', t => {
  const { cases } = data();
  for (const scene of cases) {
    const h = setup('components/WildlifeVideoCases.js', { eintrag: scene.id }, { router: { asPath: `/lernen/wildtier-videofaelle?eintrag=${scene.id}#video-fall` } }); t.after(() => h.dispose());
    const player = h.nodes(node => node.type === 'video')[0], source = h.nodes(node => node.type === 'source')[0];
    assert.equal(source.props.src, scene.src); assert.equal(source.props.type, 'video/mp4'); assert.equal(player.props.preload, 'none'); assert.equal(player.props.autoPlay, undefined);
    assert.ok(text(h.tree).includes(scene.transcript)); for (const question of scene.questions) assert.ok(!text(h.tree).includes(question.explanation));
    h.click('Textfassung gelesen – Fragen öffnen');
    for (const [index, question] of scene.questions.entries()) {
      assert.ok(text(h.tree).includes(question.question)); assert.equal(h.nodes(node => node.type === 'button' && question.choices.includes(text(node))).length, 4);
      assert.ok(!text(h.tree).includes(question.explanation)); assert.ok(!text(h.tree).includes('Richtig ist:'));
      h.click(question.choices[question.answer]); assert.ok(text(h.tree).includes(question.explanation));
      if (index < 2) h.click('Nächste Frage');
    }
    assert.equal(h.nodes(node => node.type === 'progress')[0].props.value, 3); assert.equal(h.calls.length, 0);
  }
});

test('Real curriculum, species, course anchors, library and global search retain the intended observation scope and omit answer keys', () => {
  const { cases } = data(), links = load('lib/learning-video-links.js'), library = load('lib/learning-video-library.js').getLearningVideoLibrary();
  const { getLearningModule } = load('lib/learning-curriculum.js'), discovery = load('lib/learning-video-discovery.js'), filter = load('lib/video-library-search.js').filterLearningVideos, search = load('lib/learning-search.js').searchLearning;
  assert.deepEqual(links.getCourseVideoLinks(course).map(item => item.id), ['fuchs', 'rehwild', 'dachs-fellpflege']);
  assert.ok(getLearningModule(course).lessons.some(lesson => lesson.id === 'auftrittsformen'));
  for (const [i, scene] of cases.entries()) {
    const spec = expected[i], metadata = links.learningVideoLinks.find(item => item.id === scene.id), row = library.find(item => item.id === `wild-${scene.id}`), description = discovery.getLearningVideoDiscovery(scene.id);
    assert.ok(metadata && row && description); assert.deepEqual(metadata.speciesSlugs, [spec.slug]); assert.ok(links.getWildlifeVideoLinks(spec.slug).some(item => item.id === scene.id));
    assert.equal(scene.course, spec.href); assert.equal(row.courses[0].href, spec.href); const target = new URL(spec.href, 'https://test.invalid'), module = getLearningModule(target.pathname.slice(7)); assert.ok(module.lessons.some(lesson => `#lesson-${lesson.id}` === target.hash));
    assert.equal(row.href, `/lernen/wildtier-videofaelle?eintrag=${scene.id}#video-fall`); assert.doesNotMatch(JSON.stringify(row), /"questions"|"correct"|"transcript"|"src"/);
    const term = i === 0 ? 'Murmeltier Pflanzenkontakt' : 'Fischotter Fellpflege'; assert.ok(filter(library, term, 'wild').some(item => item.id === row.id));
    const first = search({ query: term, type: 'entry', category: 'wildkunde' }), results = [first.results, ...Array.from({ length: first.pages - 1 }, (_, n) => search({ query: term, type: 'entry', category: 'wildkunde', page: n + 2 }).results)].flat();
    assert.ok(results.some(item => item.href.split('#')[0] === row.href.split('#')[0]));
    const entry = load('lib/media-search-entries.js').mediaSearchEntries.find(item => item.id === `video-${scene.id}`); assert.ok(entry);
    for (const question of scene.questions) { assert.ok(!JSON.stringify(entry).includes(question.question)); assert.ok(!JSON.stringify(entry).includes(question.explanation)); }
    assert.doesNotMatch(scene.transcript, /ist ein(?:e[rmns]?)? (?:Sohlengänger|Zehengänger|Zehenspitzengänger)/i, 'No invented foot classification from these new films');
  }
});

test('The public allowlist grows by only 4 new media and 2 source documents, while lesson pages and nearby files stay protected', async () => {
  const before = publishedLoader()('lib/media-experience-asset-paths.js'), after = load('lib/media-experience-asset-paths.js');
  const media = ids.flatMap(id => [`${directory}/${id}.mp4`, `${directory}/${id}-vorschau.jpg`]), docs = [`${directory}/mediennachweise.json`, `${directory}/MEDIEN-LIZENZEN.md`];
  assert.deepEqual(withoutAuerhuhnNov25Paths(after.mediaExperienceAssetPaths).filter(value => !media.includes(value)), before.mediaExperienceAssetPaths); assert.deepEqual(withoutAuerhuhnNov25Paths(after.mediaExperienceDocumentationPaths).filter(value => !docs.includes(value)), before.mediaExperienceDocumentationPaths);
  const middleware = load('middleware.js').middleware, request = value => { const nextUrl = new URL(value, 'https://jagdlatein.de'); return { nextUrl, url: nextUrl.href, cookies: { get() { return undefined; } } }; };
  for (const value of [...media, ...docs]) { const response = await middleware(request(value)); assert.equal(response.headers.get('x-middleware-next'), '1', value); assert.equal(response.headers.get('location'), null); }
  for (const value of [directory, `${directory}/answers.json`, `${directory}/mediennachweise.json/extra`, `${directory}/fischotter-fellpflege-original.webm`, '/lernen/wildtier-videofaelle?eintrag=murmeltier-klausenpass', `/kurse/${course}`]) { const response = await middleware(request(value)); assert.equal(new URL(response.headers.get('location')).pathname, '/preise', value); }
});
