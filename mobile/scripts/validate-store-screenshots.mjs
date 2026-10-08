import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const captureAttachmentName = "Jagdlatein.Preparatory.PublicHomepage.jpeg";
export const captureTestIdentifier = "WebsiteAppUITests/testPreparatoryPublicHomepageStoreScreenshot";
export const captureTargets = Object.freeze({
  iphone16pro: { deviceName: "iPhone 16 Pro", width: 1206, height: 2622,
    type: /^com\.apple\.CoreSimulator\.SimDeviceType\.iPhone-16-Pro$/ },
  iphone16promax: { deviceName: "iPhone 16 Pro Max", width: 1320, height: 2868,
    type: /^com\.apple\.CoreSimulator\.SimDeviceType\.iPhone-16-Pro-Max$/ },
  ipadpro13m4: { deviceName: "iPad Pro 13-inch (M4)", width: 2064, height: 2752,
    type: /^com\.apple\.CoreSimulator\.SimDeviceType\.iPad-Pro-13-inch-M4(?:-(?:8|16)GB)?$/ },
});
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const testLabel = /(?:^|[/.])WebsiteAppUITests\/testPreparatoryPublicHomepageStoreScreenshot(?:\(\))?(?:$|\?)/;
const attachmentLabel = /(?:^|[ _/])Jagdlatein\.Preparatory\.PublicHomepage\.jpeg(?:$|[ _.])/;
// Observed from Xcode 26.3's actual attachment export in run 37805473987,
// attempt 2: it replaces the extension with _0_<attachment UUID>.jpeg.
// Only this exact emitted public name is added; test scope and uniqueness stay.
const suggestedAttachmentLabel = /^Jagdlatein\.Preparatory\.PublicHomepage_0_[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}\.jpeg$/;
function fail(message) { throw new Error(`Simulator-Aufnahmen nicht freigegeben: ${message}`); }
function record(value) { return value && typeof value === "object" && !Array.isArray(value); }
function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}
async function assertNoSymlinks(target) {
  for (let current = path.resolve(target);; current = path.dirname(current)) {
    try { if ((await fs.lstat(current)).isSymbolicLink()) fail("Symbolische Pfade sind nicht zulässig."); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (path.dirname(current) === current) break;
  }
}
async function readJson(file, maxBytes = 2 * 1024 * 1024) {
  await assertNoSymlinks(file);
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.size > maxBytes) fail("Metadaten fehlen oder sind zu groß.");
  try { return JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "")); }
  catch { fail("Metadaten sind kein gültiges JSON."); }
}

export function validateCaptureInput(input) {
  if (!record(input) || input.schemaVersion !== 1 || input.purpose !== "preparatory-not-release-1.0" ||
      input.source !== "native-ios-simulator" || input.website !== "https://jagdlatein.de/" ||
      input.signedOut !== true || input.checkoutOpened !== false || input.codeSigned !== false || input.appStoreReady !== false ||
      !/^[0-9a-f]{40}$/.test(input.gitHead || "") || input.sourceDirty !== false ||
      typeof input.xcode !== "string" || input.xcode.length > 200 || !/^Xcode (?:2[6-9]|[3-9]\d)(?:\.|\s)/.test(input.xcode) ||
      input.bundleId !== "de.jagdlatein.preview" ||
      typeof input.nativeAppVersion !== "string" || !/^\d+(?:\.\d+){1,2}$/.test(input.nativeAppVersion) ||
      typeof input.nativeBuildNumber !== "string" || !/^\d+(?:\.\d+){0,2}$/.test(input.nativeBuildNumber) ||
      typeof input.capturedAtUtc !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3,7}Z$/.test(input.capturedAtUtc) ||
      !Number.isFinite(Date.parse(input.capturedAtUtc)) ||
      new Date(input.capturedAtUtc).toISOString() !== `${input.capturedAtUtc.slice(0, 23)}Z` ||
      !Array.isArray(input.captures) || input.captures.length !== 3) {
    fail("Die Herkunft der vorbereitenden unsigned Aufnahmen ist unvollständig.");
  }
  const seen = new Set(); const devices = new Set();
  for (const capture of input.captures) {
    const expected = Object.hasOwn(captureTargets, capture?.key) ? captureTargets[capture.key] : null;
    if (!record(capture) || !expected || seen.has(capture.key) || capture.deviceName !== expected.deviceName ||
        capture.width !== expected.width || capture.height !== expected.height ||
        typeof capture.deviceTypeIdentifier !== "string" || !expected.type.test(capture.deviceTypeIdentifier) ||
        !uuid.test(capture.simulatorUDID || "") || devices.has(capture.simulatorUDID.toLowerCase()) ||
        typeof capture.runtimeIdentifier !== "string" || !/^com\.apple\.CoreSimulator\.SimRuntime\.iOS-[0-9-]+$/.test(capture.runtimeIdentifier) ||
        typeof capture.runtimeVersion !== "string" || !/^\d+(?:\.\d+){1,3}$/.test(capture.runtimeVersion) ||
        Number(capture.runtimeVersion.split(".")[0]) < 26 ||
        capture.runtimeIdentifier !== `com.apple.CoreSimulator.SimRuntime.iOS-${capture.runtimeVersion.replaceAll(".", "-")}` ||
        typeof capture.exportDirectory !== "string" || !path.isAbsolute(capture.exportDirectory) ||
        capture.attachmentName !== captureAttachmentName || capture.testIdentifier !== captureTestIdentifier) {
      fail("Die drei exakten Geräte, Laufzeiten oder Capturekennungen stimmen nicht.");
    }
    seen.add(capture.key); devices.add(capture.simulatorUDID.toLowerCase());
  }
  if (new Set(input.captures.map(capture => capture.runtimeIdentifier)).size !== 1) fail("Die Geräte müssen dieselbe geprüfte Laufzeit verwenden.");
  return input;
}

// xcresulttool's selected Xcode supplies this JSON at runtime. Inspect only its
// named attachment/file and test-identity fields; unknown schemas fail closed.
// Never select a random image or fall back to an automatic failure screenshot.
export function selectCaptureAttachment(manifest) {
  const matches = [];
  function visit(value, tests = [], depth = 0) {
    if (depth > 20) fail("Unbekanntes xcresult-Exportschema.");
    if (Array.isArray(value)) { for (const child of value) visit(child, tests, depth + 1); return; }
    if (!record(value)) return;
    // A child test is not authorized by an ancestor's unrelated test identity.
    // Its nearest explicit identity replaces inherited context; if both named
    // forms are supplied, both must identify the exact same capture method.
    const explicitIdentities = [value.testIdentifier, value.testIdentifierURL].filter(item => typeof item === "string");
    const identities = explicitIdentities.length ? explicitIdentities : tests;
    if (Object.hasOwn(value, "exportedFileName")) {
      const names = [value.name, value.suggestedHumanReadableName].filter(item => typeof item === "string");
      if (names.some(name => attachmentLabel.test(name) || suggestedAttachmentLabel.test(name))) {
        if (!identities.length || !identities.every(identity => testLabel.test(identity)) || value.isAssociatedWithFailure !== false ||
            typeof value.exportedFileName !== "string" || !/^[A-Za-z0-9._-]{1,240}\.(?:jpeg|jpg)$/i.test(value.exportedFileName)) {
          fail("Capture-Attachment ist nicht dem erfolgreichen vorgesehenen UI-Test zugeordnet.");
        }
        matches.push(value.exportedFileName);
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== "exportedFileName" && (record(child) || Array.isArray(child))) visit(child, identities, depth + 1);
    }
  }
  visit(manifest);
  if (matches.length !== 1) fail("Der feste UI-Capture fehlt oder das xcresult-Exportschema ist unbekannt/mehrdeutig.");
  return matches[0];
}

// Log a bounded schema description, never arbitrary manifest string values.
// The only printable values are this public test's fixed identities/names and
// UUID JPEG filenames. This lets us inspect Xcode's real export format without
// accepting an unknown format or publishing raw test bundles.
export function describeCaptureManifestSchema(value, depth = 0) {
  if (depth > 6) return { type: "depth-limit" };
  if (Array.isArray(value)) return { type: "array", length: value.length,
    examples: value.slice(0, 3).map(item => describeCaptureManifestSchema(item, depth + 1)) };
  if (!record(value)) return { type: value === null ? "null" : typeof value };
  const fields = {};
  for (const [key, item] of Object.entries(value).slice(0, 40)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)) continue;
    const knownTest = ["testIdentifier", "testIdentifierURL"].includes(key) &&
      typeof item === "string" && item.length <= 200 && testLabel.test(item);
    const knownName = ["name", "suggestedHumanReadableName"].includes(key) && typeof item === "string" &&
      /^Jagdlatein\.Preparatory\.PublicHomepage(?:\.jpeg|_\d+_[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.jpeg)$/i.test(item);
    const knownFile = key === "exportedFileName" && typeof item === "string" &&
      /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.jpeg$/i.test(item);
    fields[key] = knownTest ? { type: "string", publicCaptureValue: captureTestIdentifier }
      : knownName || knownFile ? { type: "string", publicCaptureValue: item }
      : key === "isAssociatedWithFailure" && typeof item === "boolean" ? { type: "boolean", value: item }
      : describeCaptureManifestSchema(item, depth + 1);
  }
  return { type: "object", fields };
}

export async function validateStoreScreenshots({ inputPath, outputPath }) {
  const inputFile = path.resolve(inputPath); const output = path.resolve(outputPath);
  const evidenceRoot = path.dirname(inputFile);
  const input = validateCaptureInput(await readJson(inputFile));
  await assertNoSymlinks(output);
  try { await fs.lstat(output); fail("Das Ausgabeziel besteht bereits; kein Überschreiben."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const checked = [];
  for (const capture of input.captures) {
    const directory = path.resolve(capture.exportDirectory);
    if (!within(evidenceRoot, directory)) fail("Export liegt außerhalb der eigenen Aufnahmebelege.");
    await assertNoSymlinks(directory);
    const attachment = selectCaptureAttachment(await readJson(path.join(directory, "manifest.json")));
    const file = path.join(directory, attachment);
    await assertNoSymlinks(file);
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size < 1024 || stat.size > 32 * 1024 * 1024) fail("Bilddatei fehlt oder ist unzulässig groß.");
    const bytes = await fs.readFile(file);
    const metadata = await sharp(bytes, { limitInputPixels: 2064 * 2752 }).metadata();
    if (metadata.format !== "jpeg" || metadata.hasAlpha !== false || metadata.width !== capture.width ||
        metadata.height !== capture.height || (metadata.orientation != null && metadata.orientation !== 1)) {
      fail("Das Originalbild hat falsche Maße, Transparenz, Orientierung oder Format.");
    }
    const { channels } = await sharp(bytes).stats();
    if (!channels.some(channel => channel.stdev > 2)) fail("Die Aufnahme ist leer oder einfarbig.");
    const name = `${capture.key}-homepage.jpeg`;
    checked.push({ bytes, entry: {
      fileName: name, deviceName: capture.deviceName, deviceTypeIdentifier: capture.deviceTypeIdentifier,
      simulatorUDID: capture.simulatorUDID, runtimeIdentifier: capture.runtimeIdentifier, runtimeVersion: capture.runtimeVersion,
      width: metadata.width, height: metadata.height, format: "jpeg", hasAlpha: false,
      attachmentName: captureAttachmentName, testIdentifier: captureTestIdentifier,
      sha256: createHash("sha256").update(bytes).digest("hex"), byteLength: bytes.length,
    } });
  }
  // No resize, re-encoding, montage, device frame or content substitution: only
  // copy the original attachment bytes after every device has passed validation.
  await fs.mkdir(output, { recursive: true });
  for (const capture of checked) await fs.writeFile(path.join(output, capture.entry.fileName), capture.bytes, { flag: "wx" });
  const manifest = {
    schemaVersion: 1, purpose: input.purpose, source: input.source, website: input.website,
    signedOut: true, checkoutOpened: false, codeSigned: false, appStoreReady: false,
    gitHead: input.gitHead, sourceDirty: input.sourceDirty, xcode: input.xcode,
    nativeAppVersion: input.nativeAppVersion, nativeBuildNumber: input.nativeBuildNumber, bundleId: input.bundleId,
    capturedAtUtc: new Date(input.capturedAtUtc).toISOString(), captures: checked.map(capture => capture.entry),
  };
  await fs.writeFile(path.join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let diagnosticManifest;
  try {
    const args = process.argv.slice(2);
    if (args.length === 2 && args[0] === "--check-attachment-manifest" && args[1]) {
      diagnosticManifest = await readJson(path.resolve(args[1]));
      selectCaptureAttachment(diagnosticManifest);
      console.log("Fester öffentlicher Capture im xcresult-Manifest eindeutig zugeordnet.");
    } else {
      if (args.length !== 4 || args[0] !== "--input" || args[2] !== "--output" || !args[1] || !args[3]) fail("Aufruf: --input capture-input.json --output neues-Ausgabeziel");
      await validateStoreScreenshots({ inputPath: args[1], outputPath: args[3] });
      console.log("Drei unveränderte native JPEG-Aufnahmen geprüft; Vorbereitung, kein Release 1.0.");
    }
  } catch (error) {
    console.error(error.message);
    if (diagnosticManifest !== undefined) console.error("xcresult-Schema, unbekannte Werte verborgen: " +
      JSON.stringify(describeCaptureManifestSchema(diagnosticManifest)).slice(0, 16000));
    process.exitCode = 1;
  }
}
