import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const mobile = fileURLToPath(new URL("../", import.meta.url));
const assets = path.join(mobile, "ios/App/App/Assets.xcassets");
const svg = await readFile(path.join(mobile, "../public/app-icon.svg"));
await sharp(svg).resize(1024, 1024).flatten({ background: "#fff7e3" }).png().toFile(path.join(assets, "AppIcon.appiconset/AppIcon-512@2x.png"));
const brandAssets = path.join(assets, "BrandLogo.imageset");
await mkdir(brandAssets, { recursive: true });
for (const scale of [1, 2, 3]) {
  const filename = scale === 1 ? "brand-logo.png" : `brand-logo@${scale}x.png`;
  await sharp(svg).resize(36 * scale, 36 * scale).flatten({ background: "#fff7e3" }).png().toFile(path.join(brandAssets, filename));
}
const centeredBook = await sharp(svg).resize(500, 500).flatten({ background: "#fbf7ee" }).png().toBuffer();
const splash = await sharp({ create: { width: 2732, height: 2732, channels: 3, background: "#fbf7ee" } }).composite([{ input: centeredBook, left: 1116, top: 1116 }]).png().toBuffer();
for (const filename of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await writeFile(path.join(assets, "Splash.imageset", filename), splash);
}
console.log("Vorhandenes Jagdlatein-Buchsymbol als iOS-Icon, Kopfzeilenlogo und Startbild gerendert. Keine KI-Bilder.");
