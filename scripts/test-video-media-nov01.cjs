// Read actual ISO-BMFF headers and JPEG data, not just the editorial manifest.
// Visual review and full FFmpeg decoding are recorded separately.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { root, local } = require('./helpers/project-module.cjs');
const sharp = local('sharp');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/lernen/videos-2026-11-01/mediennachweise.json'), 'utf8'));
const digest = data => createHash('sha256').update(data).digest('hex');

function atoms(data, start = 0, end = data.length) {
  const result = []; let offset = start;
  while (offset < end) {
    assert.ok(offset + 8 <= end, 'Complete MP4 atom header');
    const type = data.toString('ascii', offset + 4, offset + 8);
    let size = data.readUInt32BE(offset), header = 8;
    if (size === 1) { assert.ok(offset + 16 <= end); size = Number(data.readBigUInt64BE(offset + 8)); header = 16; }
    if (size === 0) size = end - offset;
    assert.ok(Number.isSafeInteger(size) && size >= header && offset + size <= end, `${type}: bounded atom`);
    result.push({ type, start: offset, body: offset + header, end: offset + size });
    offset += size;
  }
  assert.equal(offset, end); return result;
}
function child(data, parent, type) {
  const found = atoms(data, parent.body, parent.end).find(atom => atom.type === type);
  assert.ok(found, `${parent.type} contains ${type}`); return found;
}
function mediaDuration(data, atom) {
  const version = data[atom.body]; assert.ok(version === 0 || version === 1);
  const scaleAt = atom.body + (version === 0 ? 12 : 20);
  const scale = data.readUInt32BE(scaleAt); assert.ok(scale > 0);
  const ticks = version === 0 ? data.readUInt32BE(scaleAt + 4) : Number(data.readBigUInt64BE(scaleAt + 4));
  return ticks / scale;
}
function readFilm(data) {
  const top = atoms(data), moov = top.find(atom => atom.type === 'moov');
  assert.equal(top[0].type, 'ftyp');
  assert.ok(moov && top.some(atom => atom.type === 'mdat'));
  assert.ok(moov.start < top.find(atom => atom.type === 'mdat').start, 'Fast-start metadata precedes media payload');
  const movieDuration = mediaDuration(data, child(data, moov, 'mvhd'));
  const tracks = atoms(data, moov.body, moov.end).filter(atom => atom.type === 'trak');
  const video = tracks.map(track => child(data, track, 'mdia')).find(mdia => {
    const handler = child(data, mdia, 'hdlr'); return data.toString('ascii', handler.body + 8, handler.body + 12) === 'vide';
  });
  assert.ok(video, 'A real video track exists');
  const videoDuration = mediaDuration(data, child(data, video, 'mdhd'));
  const descriptions = child(data, child(data, child(data, video, 'minf'), 'stbl'), 'stsd');
  assert.equal(data.readUInt32BE(descriptions.body + 4), 1, 'One video sample description');
  const entry = atoms(data, descriptions.body + 8, descriptions.end)[0];
  assert.equal(entry.type, 'avc1', 'H.264 browser video sample entry');
  const width = data.readUInt16BE(entry.start + 32), height = data.readUInt16BE(entry.start + 34);
  const configuration = atoms(data, entry.start + 86, entry.end).find(atom => atom.type === 'avcC');
  assert.ok(configuration && configuration.end - configuration.body > 8, 'Real AVC decoder configuration');
  assert.equal(data[configuration.body], 1, 'AVC configuration version');
  assert.ok([66, 77, 88, 100].includes(data[configuration.body + 1]), 'Supported AVC profile');
  // Square-pixel output is explicit; original non-square source pixels must
  // have been incorporated into display dimensions before conversion.
  const pasp = atoms(data, entry.start + 86, entry.end).find(atom => atom.type === 'pasp');
  if (pasp) assert.equal(data.readUInt32BE(pasp.body), data.readUInt32BE(pasp.body + 4));
  return { movieDuration, videoDuration, width, height };
}

test('Four complete H.264 MP4s have bounded atoms, front-loaded metadata and recorded source-length timelines', () => {
  assert.equal(manifest.length, 4);
  for (const entry of manifest) {
    const bytes = fs.readFileSync(path.join(root, 'public', entry.file));
    assert.equal(bytes.length, entry.bytes, entry.id); assert.equal(digest(bytes), entry.sha256, entry.id);
    const actual = readFilm(bytes);
    assert.deepEqual([actual.width, actual.height], [entry.width, entry.height]);
    assert.ok(actual.width > 0 && actual.width <= 1280 && actual.width % 2 === 0 && actual.height % 2 === 0);
    assert.ok(Math.abs(actual.movieDuration - entry.duration) < 0.002, entry.id);
    assert.ok(Math.abs(actual.videoDuration - entry.sourceDuration) < 0.1, `${entry.id}: no cut or speed-up in timeline`);
    assert.ok(Math.abs(actual.movieDuration - actual.videoDuration) < 0.1, `${entry.id}: no long audio tail`);
  }
});

test('The buzzard retains its source display aspect instead of incorrectly treating 720×576 source pixels as square', () => {
  const entry = manifest.find(item => item.id === 'maeusebussard-flug');
  const actual = readFilm(fs.readFileSync(path.join(root, 'public', entry.file)));
  const sourceDisplayWidth = 720 * 341 / 240, sourceHeight = 576;
  assert.equal(sourceDisplayWidth, 1023);
  assert.deepEqual([actual.width, actual.height], [1024, 576]);
  assert.ok(Math.abs(actual.width / actual.height - sourceDisplayWidth / sourceHeight) <= 1 / sourceHeight + 1e-10);
  assert.ok(Math.abs(actual.width / actual.height - 720 / 576) > 0.5, 'The distorted square-source ratio is rejected');
});

test('Every local preview really decodes as its recorded whole-frame JPEG and matches exact content hashes', async () => {
  for (const entry of manifest) {
    const bytes = fs.readFileSync(path.join(root, 'public', entry.poster));
    assert.equal(bytes.length, entry.posterBytes); assert.equal(digest(bytes), entry.posterSha256);
    const image = sharp(bytes), metadata = await image.metadata();
    assert.equal(metadata.format, 'jpeg');
    assert.deepEqual([metadata.width, metadata.height], [entry.width, entry.height]);
    const pixels = await image.raw().toBuffer({ resolveWithObject: true });
    assert.equal(pixels.data.length, entry.width * entry.height * pixels.info.channels);
    assert.ok(entry.posterTime >= 0 && entry.posterTime < entry.sourceDuration);
  }
});
