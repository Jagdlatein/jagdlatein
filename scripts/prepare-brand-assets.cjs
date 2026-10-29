// Format derivatives of the operator-approved illustration; no teaching media.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const release = '2026-10-29';

async function main() {
  const source = await fs.readFile(path.join(root, 'mobile/branding/jagdlatein-logo.png'));
  const meta = await sharp(source).metadata();
  if (meta.format !== 'png' || meta.width !== 1254 || meta.height !== 1254 || meta.hasAlpha) throw Error('Expected the approved opaque 1254-square illustration');
  const directory = path.join(root, 'public/branding');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, `jagdlatein-${release}.png`), source);
  const derivatives = [];
  const outputs = [
    [32, `favicon-32-${release}.png`, 'favicon_32.png'],
    [48, `favicon-48-${release}.png`, 'favicon_48.png'],
    [96, `favicon-96-${release}.png`, null],
    [180, `apple-touch-${release}.png`, 'apple_touch_icon.png'],
    [192, `app-192-${release}.png`, 'android_192.png'],
    [512, `app-512-${release}.png`, 'android_512.png'],
  ];
  let icon512;
  for (const [size, name, legacy] of outputs) {
    const bytes = await sharp(source).resize(size, size, { fit: 'contain', background: '#f4e8cf' }).flatten({ background: '#f4e8cf' }).png().toBuffer();
    await fs.writeFile(path.join(directory, name), bytes);
    if (legacy) await fs.writeFile(path.join(root, 'public', legacy), bytes);
    if (size === 192 || size === 512) await fs.writeFile(path.join(root, 'icons', `icon-${size}.png`), bytes);
    if (size === 512) icon512 = bytes;
    derivatives.push({ path: `/branding/${name}`, width: size, height: size, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  // Keep the complete square motif visible in social previews, without crop.
  const social = await sharp(source).resize(1200, 630, { fit: 'contain', background: '#e9d6a3' }).flatten({ background: '#e9d6a3' }).png().toBuffer();
  await fs.writeFile(path.join(directory, `og-${release}.png`), social);
  await fs.writeFile(path.join(root, 'public/og.png'), social);
  derivatives.push({ path: `/branding/og-${release}.png`, width: 1200, height: 630, sha256: createHash('sha256').update(social).digest('hex') });
  // Compatibility for the existing legacy URL. Self-contained, no remote load.
  await fs.writeFile(path.join(root, 'public/app-icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>Jagdlatein</title><image width="512" height="512" href="data:image/png;base64,${icon512.toString('base64')}"/></svg>\n`);
  const record = {
    date: release,
    role: 'operator-approved brand illustration, not a teaching photograph',
    originalFilename: 'IMG_20250715_104310_496-1.webp',
    editMethod: 'Built-in Imagegen: remove the three lower foreground beer mugs; preserve the two raised mugs, characters and lettering',
    rights: 'Operator-supplied illustration, explicitly approved for Jagdlatein branding. No new public license assigned.',
    source: 'mobile/branding/jagdlatein-logo.png',
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    width: meta.width, height: meta.height,
    publicOriginal: `/branding/jagdlatein-${release}.png`,
    processing: 'Only deterministic resizing, opaque PNG encoding and letterboxing; source pixels retained in public original',
    derivatives,
  };
  await fs.writeFile(path.join(root, `data/reviews/brand-assets-${release}.json`), JSON.stringify(record, null, 2) + '\n');
  console.log(`Prepared ${derivatives.length + 1} versioned web assets and legacy compatibility images.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
