// Actual MP4/JPEG content checks. Editorial source reading and visual review
// are separate work; passing these tests is not factual certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { root, local } = require('./helpers/project-module.cjs');
const sharp = local('sharp');
const directory = '/lernen/videos-pruefungswissen-2026-11-01';
const records = JSON.parse(fs.readFileSync(path.join(root, 'public', directory, 'mediennachweise.json'), 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
// Frozen after source-page reading, whole-file decoding and actual preview QA.
const expected = [
  { id: 'damwild-dyrehaven', author: 'Thue', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Fallow_deer_in_Dyrehaven_1.webm', original: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Fallow_deer_in_Dyrehaven_1.webm', bytes: 7846445, sha256: '578febffe0c93b23f42017f7a4a1365de1c178ca1a9f424fad2a88cc2fb08132', posterTime: 9, posterBytes: 164004, posterSha256: 'b139e7087ea142bd9a115f12af10e28cc70b1375e4963e6d652b05021c2045e0', frames: 543, movieDuration: 21.72, videoDuration: 21.72, originalContainerDuration: 22, originalStartTimestamp: 0.28, originalBytes: 68550735, originalSha256: '5ddeb8c30f8f2216b28619d664937a482f9b7d6634ef3b6fadcd3e14326dda45' },
  { id: 'blaesshuhn-bled', author: 'NaIzletuSi ™', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', source: 'https://commons.wikimedia.org/wiki/File:2022-01-08_BLED_GRUIFORMES_Fulica_atra_LISKA.webm', original: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/2022-01-08_BLED_GRUIFORMES_Fulica_atra_LISKA.webm', bytes: 11677285, sha256: 'c9288f9edc8201794c8574b9d097bfe0f977c32846eda7ea4dcfb7bbfae6032b', posterTime: 5, posterBytes: 62754, posterSha256: '5ea20519baf2dc98a4d83a94e5c760be2a0002d24926a79b681eb5d5c77a7115', frames: 624, movieDuration: 25.015, videoDuration: 24.96, originalContainerDuration: 25.015, originalStartTimestamp: -0.007, originalBytes: 27207554, originalSha256: 'c8ce0dd7a391e5446837176dbca154586316b6196053774f38b6f6b14a2dc6c1' },
];

function atoms(data, start = 0, end = data.length) {
  const result = []; let position = start;
  while (position < end) {
    assert.ok(position + 8 <= end, 'Bounded atom header');
    const type = data.toString('ascii', position + 4, position + 8);
    let size = data.readUInt32BE(position), header = 8;
    if (size === 1) { assert.ok(position + 16 <= end); size = Number(data.readBigUInt64BE(position + 8)); header = 16; }
    if (size === 0) size = end - position;
    assert.ok(Number.isSafeInteger(size) && size >= header && position + size <= end, `${type}: bounded payload`);
    result.push({ type, start: position, body: position + header, end: position + size }); position += size;
  }
  assert.equal(position, end); return result;
}
function child(data, parent, type) {
  const value = atoms(data, parent.body, parent.end).find(atom => atom.type === type); assert.ok(value, `${parent.type}/${type}`); return value;
}
function timing(data, atom) {
  const version = data[atom.body]; assert.ok(version === 0 || version === 1);
  const position = atom.body + (version === 0 ? 12 : 20), scale = data.readUInt32BE(position);
  const ticks = version === 0 ? data.readUInt32BE(position + 4) : Number(data.readBigUInt64BE(position + 4));
  assert.ok(scale > 0); return { scale, ticks, duration: ticks / scale };
}
function avcFormat(data, atom) {
  assert.equal(data[atom.body], 1);
  assert.equal(data[atom.body + 1], 100, 'H.264 High profile');
  assert.ok((data[atom.body + 5] & 31) > 0, 'An actual sequence parameter set exists');
  const length = data.readUInt16BE(atom.body + 6), nal = data.subarray(atom.body + 8, atom.body + 8 + length);
  assert.equal(nal[0] & 31, 7, 'AVC SPS NAL unit');
  const rbsp = [];
  for (let i = 1; i < nal.length; i++) if (!(nal[i] === 3 && nal[i - 1] === 0 && nal[i - 2] === 0)) rbsp.push(nal[i]);
  let bit = 24;
  const read = () => { assert.ok(bit < rbsp.length * 8); const value = rbsp[bit >> 3] >> (7 - (bit & 7)) & 1; bit++; return value; };
  const ue = () => { let zeros = 0; while (!read()) { zeros++; assert.ok(zeros < 32); } let result = 1; while (zeros--) result = result * 2 + read(); return result - 1; };
  ue(); // seq_parameter_set_id
  assert.equal(ue(), 1, 'SPS chroma_format_idc 1: YUV 4:2:0');
  assert.equal(ue(), 0, 'Eight-bit luma'); assert.equal(ue(), 0, 'Eight-bit chroma');
}
function filmInfo(data) {
  const top = atoms(data); assert.equal(top[0].type, 'ftyp');
  const movie = top.find(atom => atom.type === 'moov'), payload = top.find(atom => atom.type === 'mdat');
  assert.ok(movie && payload && movie.start < payload.start, 'Fast-start metadata before media bytes');
  const movieTiming = timing(data, child(data, movie, 'mvhd'));
  const media = atoms(data, movie.body, movie.end).filter(atom => atom.type === 'trak').map(track => child(data, track, 'mdia')).find(mdia => {
    const handler = child(data, mdia, 'hdlr'); return data.toString('ascii', handler.body + 8, handler.body + 12) === 'vide';
  }); assert.ok(media, 'Video track exists');
  const videoTiming = timing(data, child(data, media, 'mdhd'));
  const table = child(data, child(data, media, 'minf'), 'stbl');
  const samples = child(data, table, 'stsz'), frameCount = data.readUInt32BE(samples.body + 8);
  const timeTable = child(data, table, 'stts'), entries = data.readUInt32BE(timeTable.body + 4);
  assert.equal(timeTable.body + 8 + entries * 8, timeTable.end);
  let timingFrames = 0, ticks = 0;
  for (let i = 0; i < entries; i++) { const count = data.readUInt32BE(timeTable.body + 8 + i * 8), delta = data.readUInt32BE(timeTable.body + 12 + i * 8); timingFrames += count; ticks += count * delta; }
  assert.equal(timingFrames, frameCount); assert.equal(ticks, videoTiming.ticks);
  const descriptions = child(data, table, 'stsd'); assert.equal(data.readUInt32BE(descriptions.body + 4), 1);
  const description = atoms(data, descriptions.body + 8, descriptions.end)[0]; assert.equal(description.type, 'avc1');
  const width = data.readUInt16BE(description.start + 32), height = data.readUInt16BE(description.start + 34);
  assert.deepEqual([width, height], [1280, 720]); assert.equal(width % 2, 0); assert.equal(height % 2, 0);
  assert.equal(width / height, 1920 / 1080, 'Actual original display aspect retained');
  const format = atoms(data, description.start + 86, description.end), avc = format.find(atom => atom.type === 'avcC'); assert.ok(avc); avcFormat(data, avc);
  const aspect = format.find(atom => atom.type === 'pasp'); if (aspect) assert.equal(data.readUInt32BE(aspect.body), data.readUInt32BE(aspect.body + 4));
  return { frameCount, movieDuration: movieTiming.duration, videoDuration: videoTiming.duration };
}

test('Both new original-source manifests retain exact licensing, files and full-frame timestamp provenance', () => {
  assert.deepEqual(records.map(item => item.id), expected.map(item => item.id));
  const documentation = fs.readFileSync(path.join(root, 'public', directory, 'MEDIEN-LIZENZEN.md'), 'utf8');
  for (let i = 0; i < expected.length; i++) {
    const item = records[i], frozen = expected[i];
    for (const field of ['id', 'author', 'license', 'licenseUrl', 'source', 'original', 'bytes', 'sha256', 'posterTime', 'posterBytes', 'posterSha256']) assert.equal(item[field], frozen[field], `${item.id}: ${field}`);
    assert.equal(item.file, `${directory}/${item.id}.mp4`); assert.equal(item.poster, `${directory}/${item.id}-vorschau.jpg`);
    assert.equal(item.aiGenerated, false); assert.equal(item.checked, '2026-11-01');
    assert.equal(item.downloadedBytes, frozen.originalBytes); assert.equal(item.downloadedSha256, frozen.originalSha256);
    assert.equal(item.sourceVideoFrames, frozen.frames); assert.equal(item.encodedVideoFrames, frozen.frames);
    for (const text of [item.author, item.licenseUrl, item.source, item.original]) assert.ok(documentation.includes(text));
    assert.match(item.modifications, /alle dekodierten Videobilder bleiben erhalten/);
    assert.match(item.modifications, /kein Zuschnitt und keine zusätzlichen Schnitte oder Montage/);
  }
  assert.match(documentation, /22 Sekunden.*0\.28 Sekunden/s);
  assert.match(documentation, /sämtliche 543.*21\.72 Sekunden/s);
});

test('Actual MP4 samples, AVC SPS, square-pixel display and fast-start atoms preserve every original decoded video frame', () => {
  for (const item of expected) {
    const bytes = fs.readFileSync(path.join(root, 'public', directory, `${item.id}.mp4`));
    assert.equal(bytes.length, item.bytes); assert.equal(hash(bytes), item.sha256);
    const actual = filmInfo(bytes);
    assert.equal(actual.frameCount, item.frames);
    assert.ok(Math.abs(actual.movieDuration - item.movieDuration) < 0.001);
    assert.ok(Math.abs(actual.videoDuration - item.videoDuration) < 0.001);
    assert.equal(actual.videoDuration, item.frames / 25, 'Original 25-fps picture sequence, no speed change');
  }
});

test('Damwild offset normalization and the coot audio tail are documented separately from complete video duration', () => {
  for (let i = 0; i < records.length; i++) {
    const item = records[i], frozen = expected[i];
    assert.equal(item.sourceContainerDuration, frozen.originalContainerDuration);
    assert.equal(item.sourceStartTimestamp, frozen.originalStartTimestamp);
    const expectedTimeline = item.sourceContainerDuration - Math.max(0, item.sourceStartTimestamp);
    assert.equal(item.sourceDuration, expectedTimeline); assert.equal(item.duration, frozen.movieDuration);
    assert.ok(Math.abs(item.duration - expectedTimeline) < 0.001);
  }
  const damwild = records[0], coot = records[1];
  assert.ok(damwild.sourceContainerDuration - damwild.duration > 0.1, 'The real 0.280-s source offset must not fail a naive container-duration comparison');
  assert.ok(Math.abs(coot.duration - expected[1].videoDuration - 0.055) < 0.001, 'The original audio/container tail is not an extra video frame');
});

test('Both approved whole-frame JPEG previews fully decode with exact reviewed bytes, dimensions and hashes', async () => {
  for (const item of expected) {
    const bytes = fs.readFileSync(path.join(root, 'public', directory, `${item.id}-vorschau.jpg`));
    assert.equal(bytes.length, item.posterBytes); assert.equal(hash(bytes), item.posterSha256);
    const image = sharp(bytes), info = await image.metadata();
    assert.equal(info.format, 'jpeg'); assert.deepEqual([info.width, info.height], [1280, 720]);
    const { data, info: decoded } = await image.raw().toBuffer({ resolveWithObject: true });
    assert.equal(data.length, 1280 * 720 * decoded.channels);
  }
});
