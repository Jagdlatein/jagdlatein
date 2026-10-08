import test from "node:test";
import assert from "node:assert/strict";
import { describeCaptureManifestSchema, selectCaptureAttachment, captureTestIdentifier }
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
  // This diagnostic change alone must not authorize the unobserved schema.
  assert.throws(() => selectCaptureAttachment(manifest), /unbekannt\/mehrdeutig/);
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
