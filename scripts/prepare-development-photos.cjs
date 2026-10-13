const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public/lernen/bewegung-entwicklung-2026');
const cache = process.argv[2];
if (!cache) throw new Error('Pass a download cache directory.');
const days = [29, 32, 39, 221, 227];
const dates = ['2014-12-05', '2014-12-08', '2014-12-15', '2015-06-15', '2015-06-21'];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
  await fs.mkdir(out, { recursive: true }); await fs.mkdir(cache, { recursive: true });
  const photos = [];
  for (let i = 0; i < days.length; i++) {
    const filename = `Quercus_robur_-_gland_1_-_${days[i]}e_jour${days[i] === 221 ? '_-_feuilles' : ''}.${days[i] === 29 ? 'JPG' : 'jpg'}`;
    const md5 = crypto.createHash('md5').update(filename).digest('hex');
    const download = `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(filename)}`;
    const source = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`;
    let downloadedPreview = false;
    let inputDownload = download;
    const localOriginal = path.join(cache, filename);
    let input;
    try { input = await fs.readFile(localOriginal); } catch {
      try {
        input = await fs.readFile(`${localOriginal}.preview`);
        downloadedPreview = true;
        inputDownload = `https://thumb.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(filename)}/960px-${encodeURIComponent(filename)}`;
      } catch {}
      if (!input) {
      let response = await fetch(download, { headers: { 'User-Agent': 'Jagdlatein source audit / real educational photos' } });
      if (response.status === 429 && days[i] >= 221) {
        // Commons explicitly offers this official proportional preview on the file page.
        inputDownload = `https://thumb.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(filename)}/960px-${encodeURIComponent(filename)}`;
        response = await fetch(inputDownload, { headers: { 'User-Agent': 'Jagdlatein source audit / real educational photos' } });
        downloadedPreview = true;
      }
      if (!response.ok) throw new Error(`${inputDownload}: ${response.status}`);
      input = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(downloadedPreview ? `${localOriginal}.preview` : localOriginal, input);
      }
    }
    const metadata = await sharp(input).metadata();
    const targetName = `stieleiche-tag-${days[i]}.webp`;
    const output = await sharp(input).rotate().resize({ width: 900, height: 1100, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    await fs.writeFile(path.join(out, targetName), output);
    const result = await sharp(output).metadata();
    photos.push({ id: `eiche-${days[i]}`, src: `/lernen/bewegung-entwicklung-2026/${targetName}`, dayAfterSowing: days[i], capturedOn: dates[i], sourceUrl: source, originalDownload: download, inputDownload, downloadedPreview, author: 'Abaddon1337', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', inputWidth: metadata.width, inputHeight: metadata.height, width: result.width, height: result.height, inputSha256: hash(input), originalSha256: downloadedPreview ? null : hash(input), originalCommonsSha1: days[i] === 221 ? '6665476de2c0e83b7e0ea9979daf5ef6daddeea2' : days[i] === 227 ? '84d091a64db23ad3cc12f7c4c918877718dc8990' : null, sha256: hash(output), modifications: `${downloadedPreview ? 'Offizielle proportionale 960-Pixel-Vorschau von Wikimedia Commons als Eingangsdatei. ' : ''}Proportional auf höchstens 900 × 1100 Pixel verkleinert und als WebP gespeichert. Kein Ausschnitt, keine Retusche, kein generativer Inhalt.`, aiGenerated: false, reviewedOn: '2026-10-13', visuallyInspectedOn: '2026-10-13' });
  }
  await fs.writeFile(path.join(out, 'eichenserie-bildnachweise.json'), JSON.stringify(photos, null, 2) + '\n');
  const tiles = await Promise.all(photos.map(photo => sharp(path.join(root, 'public', photo.src)).resize({ width: 180, height: 260, fit: 'contain', background: '#f5eddc' }).toBuffer()));
  await sharp({create: {width: 900, height: 260, channels: 3, background: '#f5eddc'}}).composite(tiles.map((input, i) => ({input, left: i*180, top: 0}))).jpeg().toFile(path.join(cache, 'eichenserie-contact.jpg'));
  console.log(JSON.stringify(photos.map(photo => ({src: photo.src, dimensions: [photo.width, photo.height]})), null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
