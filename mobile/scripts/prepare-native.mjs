import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const mobile = fileURLToPath(new URL("../", import.meta.url));
const assets = path.join(mobile, "ios/App/App/Assets.xcassets");
const logo = await readFile(path.join(mobile, "branding/jagdlatein-logo.png"));
await sharp(logo).resize(1024, 1024, { fit: "contain", background: "#fff7e3" }).flatten({ background: "#fff7e3" }).png().toFile(path.join(assets, "AppIcon.appiconset/AppIcon-512@2x.png"));
const brandAssets = path.join(assets, "BrandLogo.imageset");
await mkdir(brandAssets, { recursive: true });
for (const scale of [1, 2, 3]) {
  const filename = scale === 1 ? "brand-logo.png" : `brand-logo@${scale}x.png`;
  await sharp(logo).resize(36 * scale, 36 * scale, { fit: "contain", background: "#fff7e3" }).flatten({ background: "#fff7e3" }).png().toFile(path.join(brandAssets, filename));
}
const centeredLogo = await sharp(logo).resize(700, 700, { fit: "contain", background: "#fbf7ee" }).flatten({ background: "#fbf7ee" }).png().toBuffer();
const splash = await sharp({ create: { width: 2732, height: 2732, channels: 3, background: "#fbf7ee" } }).composite([{ input: centeredLogo, left: 1016, top: 1016 }]).png().toBuffer();
for (const filename of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await writeFile(path.join(assets, "Splash.imageset", filename), splash);
}
console.log("Bereitgestelltes Jagdlatein-Logo als iOS-Icon, Kopfzeilenlogo und Startbild aufbereitet.");
