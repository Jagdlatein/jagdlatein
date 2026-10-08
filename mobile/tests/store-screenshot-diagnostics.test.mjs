import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { describeCaptureManifestSchema, selectCaptureAttachment, captureTestIdentifier,
  captureTargets, captureAttachmentName, inspectHomepageContentPixels, validateStoreScreenshots }
  from "../scripts/validate-store-screenshots.mjs";

test("Unknown xcresult schemas stay rejected while diagnostics redact arbitrary values and test URL queries", () => {
  const manifest = [{ testIdentifierURL: `${captureTestIdentifier}()?secret=PRIVATE_VALUE`,
    account: "PRIVATE_VALUE", attachments: [{ exportedFileName: "PRIVATE_VALUE.jpeg",
      name: "PRIVATE_VALUE", unknown: { token: "PRIVATE_VALUE" } }] }];
  assert.throws(() => selectCaptureAttachment(manifest), /unbekannt\/mehrdeutig/);
  const description = JSON.stringify(describeCaptureManifestSchema(manifest));
  assert.ok(description.includes(captureTestIdentifier));
  assert.ok(description.includes('"unknown"'));
  assert.ok(!description.includes("PRIVATE_VALUE"));
  assert.ok(!description.includes("?secret="));
});

test("Only the fixed public attachment names and UUID JPEG filenames appear in schema diagnostics", () => {
  const name = "Jagdlatein.Preparatory.PublicHomepage_0_06CC1705-2420-4FA6-8FEE-6B470BAC4CD0.jpeg";
  const file = "3209133B-803A-4F69-8AA7-A907A408EFF3.jpeg";
  const manifest = [{ testIdentifier: captureTestIdentifier, attachments: [
    { suggestedHumanReadableName: name, exportedFileName: file, isAssociatedWithFailure: false },
  ] }];
  const description = JSON.stringify(describeCaptureManifestSchema(manifest));
  assert.ok(description.includes(name));
  assert.ok(description.includes(file));
  // The name is observed in the actual Xcode export log. Supported identity
  // fields still have to bind it to this one successful public capture method.
  assert.equal(selectCaptureAttachment(manifest), file);
});

test("The observed Xcode filename cannot authorize a foreign test, failed attachment or duplicate capture", () => {
  const attachment = { suggestedHumanReadableName:
    "Jagdlatein.Preparatory.PublicHomepage_0_06CC1705-2420-4FA6-8FEE-6B470BAC4CD0.jpeg",
    exportedFileName: "3209133B-803A-4F69-8AA7-A907A408EFF3.jpeg", isAssociatedWithFailure: false };
  assert.throws(() => selectCaptureAttachment([{ testIdentifier: "OtherTests/testLogin", attachments: [attachment] }]), /nicht dem erfolgreichen/);
  assert.throws(() => selectCaptureAttachment([{ testIdentifier: captureTestIdentifier,
    attachments: [{ ...attachment, isAssociatedWithFailure: true }] }]), /nicht dem erfolgreichen/);
  assert.throws(() => selectCaptureAttachment([{ testIdentifier: captureTestIdentifier,
    attachments: [attachment, { ...attachment }] }]), /mehrdeutig/);
  assert.throws(() => selectCaptureAttachment([{ testIdentifier: captureTestIdentifier,
    attachments: [{ ...attachment, suggestedHumanReadableName: attachment.suggestedHumanReadableName.replace("_0_", "_1_") }] }]), /unbekannt\/mehrdeutig/);
});

test("Schema diagnostics have bounded nesting, arrays and object fields", () => {
  let deep = { value: "PRIVATE_VALUE" };
  for (let i = 0; i < 30; i++) deep = { next: deep };
  const array = Array.from({ length: 100 }, () => deep);
  const description = describeCaptureManifestSchema(array);
  assert.equal(description.examples.length, 3);
  assert.ok(JSON.stringify(description).includes("depth-limit"));
  const fields = describeCaptureManifestSchema(Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => [`field${i}`, "PRIVATE_VALUE"])));
  assert.equal(Object.keys(fields.fields).length, 40);
  assert.ok(!JSON.stringify(fields).includes("PRIVATE_VALUE"));
});

test("A named capture needs an explicit boolean non-failure marker", () => {
  const attachment = { suggestedHumanReadableName:
    "Jagdlatein.Preparatory.PublicHomepage_0_06CC1705-2420-4FA6-8FEE-6B470BAC4CD0.jpeg",
    exportedFileName: "3209133B-803A-4F69-8AA7-A907A408EFF3.jpeg" };
  assert.throws(() => selectCaptureAttachment([{ testIdentifier: captureTestIdentifier,
    attachments: [attachment] }]), /nicht dem erfolgreichen/);
  for (const marker of [true, "true", "false", null, 0, 1]) {
    assert.throws(() => selectCaptureAttachment([{ testIdentifier: captureTestIdentifier,
      attachments: [{ ...attachment, isAssociatedWithFailure: marker }] }]), /nicht dem erfolgreichen/);
  }
  assert.equal(selectCaptureAttachment([{ testIdentifier: captureTestIdentifier,
    attachments: [{ ...attachment, isAssociatedWithFailure: false }] }]), attachment.exportedFileName);
});

// These geometric decoder fixtures are technical tests, never actual app or
// Store screenshots. No website, logo, text or Store media is substituted.
async function technicalPixelFixture({ bodyContent = false, grey = false } = {}) {
  const width = 1206; const height = 2622;
  const pixels = Buffer.alloc(width * height * 3, 247);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const chrome = y < 0.1 * height || y > 0.9 * height;
      const body = bodyContent && y >= 0.4 * height && y < 0.45 * height &&
        x >= 0.2 * width && x < 0.5 * width;
      if ((chrome && x % 80 < 40) || body) {
        const offset = (y * width + x) * 3;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 20;
      }
    }
  }
  let encoder = sharp(pixels, { raw: { width, height, channels: 3 } });
  if (grey) encoder = encoder.greyscale().toColourspace("b-w");
  return encoder.jpeg({ quality: 100 }).toBuffer();
}

test("Synthetic native chrome cannot authorize a blank webpage through global image variation", async () => {
  const bytes = await technicalPixelFixture();
  const wholeScreen = await sharp(bytes).stats();
  assert.ok(wholeScreen.channels.some(channel => channel.stdev > 2),
    "This reproduces why the former whole-screen guard accepted blank web content.");
  const pixels = await inspectHomepageContentPixels(bytes);
  assert.equal(pixels.darkPixelRatio, 0);
  assert.ok(pixels.darkPixelRatio < pixels.minimumDarkPixelRatio);

  const prefix = path.join(os.tmpdir(), "jagdlatein-SYNTHETIC-NOT-STORE-blank-body-");
  const root = await fs.mkdtemp(prefix);
  try {
    const inputPath = path.join(root, "SYNTHETIC-TECHNICAL-capture-input.json");
    const outputPath = path.join(root, "SYNTHETIC-NOT-STORE-output-must-not-exist");
    const captures = Object.entries(captureTargets).map(([key, target], index) => ({
      key, deviceName: target.deviceName, width: target.width, height: target.height,
      deviceTypeIdentifier: "com.apple.CoreSimulator.SimDeviceType." + ({
        iphone16pro: "iPhone-16-Pro", iphone16promax: "iPhone-16-Pro-Max",
        ipadpro13m4: "iPad-Pro-13-inch-M4-8GB",
      })[key],
      simulatorUDID: `${index + 1}1111111-1111-4111-8111-111111111111`,
      runtimeIdentifier: "com.apple.CoreSimulator.SimRuntime.iOS-26-3", runtimeVersion: "26.3",
      exportDirectory: path.join(root, key), attachmentName: captureAttachmentName,
      testIdentifier: captureTestIdentifier,
    }));
    await fs.mkdir(captures[0].exportDirectory);
    const imagePath = path.join(captures[0].exportDirectory, "SYNTHETIC-NOT-STORE.jpeg");
    await fs.writeFile(imagePath, bytes);
    await fs.writeFile(path.join(captures[0].exportDirectory, "manifest.json"), JSON.stringify([
      { testIdentifier: captureTestIdentifier, attachments: [{ name: captureAttachmentName,
        exportedFileName: "SYNTHETIC-NOT-STORE.jpeg", isAssociatedWithFailure: false }] },
    ]));
    await fs.writeFile(inputPath, JSON.stringify({ schemaVersion: 1, purpose: "preparatory-not-release-1.0",
      source: "native-ios-simulator", website: "https://jagdlatein.de/", signedOut: true,
      checkoutOpened: false, codeSigned: false, appStoreReady: false, gitHead: "a".repeat(40),
      sourceDirty: false, xcode: "Xcode 26.3\nBuild version 17C529", nativeAppVersion: "0.1",
      nativeBuildNumber: "1", bundleId: "de.jagdlatein.preview", capturedAtUtc: "2026-10-08T12:00:00.000Z",
      captures }));
    const originalHash = createHash("sha256").update(bytes).digest("hex");
    await assert.rejects(validateStoreScreenshots({ inputPath, outputPath }), /zentrale Webseitenbereich/);
    await assert.rejects(fs.stat(outputPath), { code: "ENOENT" });
    assert.equal(createHash("sha256").update(await fs.readFile(imagePath)).digest("hex"), originalHash);
  } finally {
    // This exact freshly created technical fixture root is the only cleanup.
    assert.ok(path.resolve(root).startsWith(path.resolve(prefix)));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Synthetic visible body pixels pass the content gate without changing source bytes", async () => {
  const bytes = await technicalPixelFixture({ bodyContent: true });
  const original = Buffer.from(bytes);
  const pixels = await inspectHomepageContentPixels(bytes);
  assert.ok(pixels.darkPixelRatio >= pixels.minimumDarkPixelRatio);
  assert.ok(pixels.roi.top > 0.1 * 2622);
  assert.ok(pixels.roi.top + pixels.roi.height < 0.9 * 2622);
  assert.deepEqual(bytes, original);
});

test("Pixel inspection rejects broken decoders and unexpected grayscale channels", async () => {
  await assert.rejects(inspectHomepageContentPixels(Buffer.alloc(2048, 17)), /Decoder/);
  await assert.rejects(inspectHomepageContentPixels(await technicalPixelFixture({ bodyContent: true, grey: true })),
    /drei vollständige RGB-Kanäle/);
});
