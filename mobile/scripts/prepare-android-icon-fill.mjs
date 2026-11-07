// Native icon layout only. The approved illustration is never retouched.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repo = fileURLToPath(new URL('../../', import.meta.url));
export const approvedMaster = path.join(repo, 'mobile/branding/jagdlatein-logo.png');
export const approvedSha256 = '96480878aea7652bd43497a103854e0ba93a3e0d932b96c3583d6be23ea880ca';
export const densities = [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];
const excluded = new Set(['build', '.gradle', '.git', '.idea', 'release']);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => digest(await fs.readFile(file));

async function files(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw Error('Refusing redirected source entry: ' + file);
    if (entry.isDirectory()) result.push(...await files(file));
    else {
      if (/\.(?:jks|p12|keystore|p8)$/i.test(entry.name)) throw Error('Private signing material must not be read or copied');
      result.push(file);
    }
  }
  return result.sort();
}
async function inventory(directory) {
  const result = {};
  for (const file of await files(directory)) result[path.relative(directory, file).replaceAll('\\', '/')] = await hashFile(file);
  return result;
}
async function validatedMaster(file) {
  const bytes = await fs.readFile(file), meta = await sharp(bytes).metadata();
  if (digest(bytes) !== approvedSha256 || meta.width !== 1254 || meta.height !== 1254 || meta.hasAlpha) throw Error('Approved opaque square master required');
  return bytes;
}

// The nominal visible 72dp square contains the whole source image. Outside it,
// repeat only edge pixels into the 108dp layer, so launcher motion exposes no
// separate flat mat. OEM masks can still crop image corners and outer details.
export function extendEdges(rgb, inner, size, offset) {
  if (rgb.length !== inner * inner * 3 || inner + 2 * offset !== size) throw Error('Invalid icon geometry');
  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    const sourceY = Math.max(0, Math.min(inner - 1, y - offset));
    for (let x = 0; x < size; x++) {
      const sourceX = Math.max(0, Math.min(inner - 1, x - offset));
      const from = (sourceY * inner + sourceX) * 3, to = (y * size + x) * 3;
      rgb.copy(pixels, to, from, from + 3);
    }
  }
  return pixels;
}

export async function writeLauncherResources(resDirectory, masterFile = approvedMaster) {
  const master = await validatedMaster(masterFile), changed = [];
  const write = async (relative, bytes) => {
    const target = path.join(resDirectory, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes); changed.push(relative);
  };
  for (const [density, scale] of densities) {
    const legacySize = Math.round(48 * scale);
    const legacy = await sharp(master).resize(legacySize, legacySize).removeAlpha().webp({ lossless: true }).toBuffer();
    for (const name of ['ic_launcher', 'ic_launcher_round']) await write(`mipmap-${density}/${name}.webp`, legacy);
    const size = Math.round(108 * scale), inner = Math.round(72 * scale), offset = (size - inner) / 2;
    const rgb = await sharp(master).resize(inner, inner).removeAlpha().raw().toBuffer();
    const background = extendEdges(rgb, inner, size, offset);
    await write(`mipmap-${density}/ic_launcher_background.webp`, await sharp(background, { raw: { width: size, height: size, channels: 3 } }).webp({ lossless: true }).toBuffer());
    // Keep the illustration in the native foreground too; its at-rest pixels
    // exactly match the background. Only the outer motion margin is transparent.
    const foregroundImage = await sharp(rgb, { raw: { width: inner, height: inner, channels: 3 } }).png().toBuffer();
    await write(`mipmap-${density}/ic_launcher_foreground.webp`, await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: foregroundImage, left: offset, top: offset }]).webp({ lossless: true }).toBuffer());
  }
  await write('drawable/ic_launcher_background.xml', Buffer.from('<?xml version="1.0" encoding="utf-8"?>\n<bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@mipmap/ic_launcher_background" android:gravity="fill" />\n'));
  for (const name of ['ic_launcher', 'ic_launcher_round']) await write(`mipmap-anydpi-v26/${name}.xml`, Buffer.from('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@drawable/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n'));
  return changed;
}

export async function prepareProject(sourceProject, outputDirectory) {
  const source = await fs.realpath(sourceProject), requested = path.resolve(outputDirectory);
  const output = path.join(await fs.realpath(path.dirname(requested)), path.basename(requested));
  const canonical = value => process.platform === 'win32' ? value.toLowerCase() : value;
  const contains = (parent, child) => {
    const relative = path.relative(canonical(parent), canonical(child));
    return relative === '' || relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
  };
  if (contains(source, output) || contains(output, source)) throw Error('Source and output must be separate directories');
  try { await fs.lstat(output); throw Error('Output already exists; refusing overwrite'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const android = path.join(source, 'android'), gradleFile = path.join(android, 'app/build.gradle');
  const originalGradle = await fs.readFile(gradleFile, 'utf8');
  if (!/versionCode 3\b/.test(originalGradle) || !/versionName "1\.0\.4"/.test(originalGradle) || !/applicationId "de\.jagdlatein\.app"/.test(originalGradle)) throw Error('Expected the reviewed Jagdlatein Android 1.0.4 (3) source');
  await validatedMaster(approvedMaster);
  const before = await inventory(android);
  await fs.mkdir(output, { recursive: false });
  const project = path.join(output, 'project');
  const copy = async (from, to) => fs.cp(from, to, { recursive: true, filter: file => !path.relative(from, file).split(path.sep).some(segment => excluded.has(segment)) });
  await copy(android, path.join(project, 'android'));
  for (const name of ['android', 'browser', 'push-notifications', 'core']) await copy(path.join(source, 'node_modules/@capacitor', name), path.join(project, 'node_modules/@capacitor', name));
  await fs.copyFile(path.join(source, 'capacitor.config.ts'), path.join(project, 'capacitor.config.ts'));
  const res = path.join(project, 'android/app/src/main/res');
  const changed = await writeLauncherResources(res);
  const gradle = originalGradle.replace('versionCode 3', 'versionCode 4').replace('versionName "1.0.4"', 'versionName "1.0.5"');
  await fs.writeFile(path.join(project, 'android/app/build.gradle'), gradle);
  if (JSON.stringify(before) !== JSON.stringify(await inventory(android))) throw Error('Original source changed');
  const after = await inventory(path.join(project, 'android'));
  const changes = Object.keys(after).filter(name => before[name] !== after[name]);
  const allowed = new Set(['app/build.gradle', ...changed.map(name => 'app/src/main/res/' + name)]);
  if (changes.some(name => !allowed.has(name)) || Object.keys(before).some(name => !Object.hasOwn(after, name))) throw Error('Unexpected native project change');
  const proof = { preparedAtUtc: new Date().toISOString(), source, project, packageName: 'de.jagdlatein.app', versionName: '1.0.5', versionCode: 4,
    masterSha256: approvedSha256, originalSourceUnchanged: true, changedNativeFiles: changes, changedResources: changed,
    resourcesSha256: Object.fromEntries(await Promise.all(changed.map(async name => [name, await hashFile(path.join(res, name))]))),
    geometry: { legacyDp: 48, adaptiveLayerDp: 108, centralImageDp: 72, outside: 'nearest existing edge pixels', foreground: 'same central 72dp illustration with transparent motion margin', noAddedMat: true },
    limits: ['Actual OEM masks may crop outer details; 66dp safe area and 72dp static viewport are distinct.', 'No device installation or store publication asserted by preparation.', 'No permissions, plugins, URLs, notification configuration, signing keys or user data changed.'] };
  await fs.writeFile(path.join(output, 'icon-fill-preparation.json'), JSON.stringify(proof, null, 2) + '\n');
  return proof;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2) { console.error('Usage: node prepare-android-icon-fill.mjs SOURCE_PROJECT NEW_OUTPUT_DIRECTORY'); process.exitCode = 1; }
  else prepareProject(args[0], args[1]).then(proof => console.log(JSON.stringify({ project: proof.project, versionName: proof.versionName, versionCode: proof.versionCode, changedFiles: proof.changedNativeFiles.length }))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
