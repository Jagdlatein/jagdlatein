import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { approvedMaster, writeLauncherResources } from '../scripts/prepare-android-icon-fill.mjs';

test('Actual launcher files fill the visible picture area at every density and preserve both native layers', async () => {
  const parent = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(parent, 'jagdlatein-icon-artifact-'));
  const source = await fs.readFile(approvedMaster);
  try {
    await writeLauncherResources(root);
    for (const [density, scale] of [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]]) {
      const folder = path.join(root, 'mipmap-' + density), inner = 72 * scale, size = 108 * scale, offset = 18 * scale;
      const expectedLegacy = await sharp(source).resize(48 * scale, 48 * scale).removeAlpha().raw().toBuffer();
      for (const name of ['ic_launcher', 'ic_launcher_round']) {
        const image = sharp(await fs.readFile(path.join(folder, name + '.webp')));
        assert.equal((await image.metadata()).width, 48 * scale, density);
        assert.deepEqual(await image.removeAlpha().raw().toBuffer(), expectedLegacy, 'Legacy source must reach all four edges: ' + density);
      }
      const expected = await sharp(source).resize(inner, inner).removeAlpha().raw().toBuffer();
      for (const name of ['ic_launcher_background', 'ic_launcher_foreground']) {
        const bytes = await fs.readFile(path.join(folder, name + '.webp')), meta = await sharp(bytes).metadata();
        assert.equal(meta.width, size); assert.equal(meta.height, size);
        const center = await sharp(bytes).extract({ left: offset, top: offset, width: inner, height: inner }).removeAlpha().raw().toBuffer();
        assert.deepEqual(center, expected, 'The nominal viewport contains the full original, without an inset: ' + density + '/' + name);
      }
      const alpha = await sharp(await fs.readFile(path.join(folder, 'ic_launcher_foreground.webp'))).ensureAlpha().extractChannel('alpha').raw().toBuffer();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        assert.equal(alpha[y * size + x], x >= offset && x < offset + inner && y >= offset && y < offset + inner ? 255 : 0, 'Foreground picture and motion margin: ' + density);
      }
      // Invisible RGB under alpha=0 is deliberately unconstrained: lossless WebP
      // may change it. The visible center and all alpha values above are exact.
      const background = await sharp(await fs.readFile(path.join(folder, 'ic_launcher_background.webp'))).removeAlpha().raw().toBuffer();
      assert.deepEqual(background.subarray(0, 3), expected.subarray(0, 3), 'Motion margin extends the original edge, not a new mat');
      assert.deepEqual(background.subarray(-3), expected.subarray(-3));
    }
    const bitmap = await fs.readFile(path.join(root, 'drawable/ic_launcher_background.xml'), 'utf8');
    assert.match(bitmap, /android:src="@mipmap\/ic_launcher_background"/); assert.match(bitmap, /android:gravity="fill"/);
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      const xml = await fs.readFile(path.join(root, 'mipmap-anydpi-v26', name + '.xml'), 'utf8');
      assert.match(xml, /@drawable\/ic_launcher_background/); assert.match(xml, /@mipmap\/ic_launcher_foreground/);
      assert.doesNotMatch(xml, /<inset|<monochrome/);
    }
    assert.deepEqual(await fs.readFile(approvedMaster), source, 'The approved artwork remains unchanged');
  } finally {
    const actual = await fs.realpath(root), normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
    assert.equal(normalize(actual), normalize(root)); assert.equal(normalize(path.dirname(actual)), normalize(parent));
    assert.ok(path.basename(actual).startsWith('jagdlatein-icon-artifact-'));
    await fs.rm(actual, { recursive: true });
  }
});
