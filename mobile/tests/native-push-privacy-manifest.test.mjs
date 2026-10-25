// App-owned source manifest and isolated DTOs only. Importing the pure validator
// does not inspect a Firebase configuration, signing file or private account.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "plist";
import { inspectProject, mobileRoot, validateAppPrivacyManifest } from "../scripts/check-ios.mjs";

const deviceType = "NSPrivacyCollectedDataTypeDeviceID";
const purpose = "NSPrivacyCollectedDataTypePurposeAppFunctionality";
const userDefaults = "NSPrivacyAccessedAPICategoryUserDefaults";
const ownDevice = () => ({
  NSPrivacyCollectedDataType: deviceType,
  NSPrivacyCollectedDataTypeLinked: true,
  NSPrivacyCollectedDataTypeTracking: false,
  NSPrivacyCollectedDataTypePurposes: [purpose],
});
const ownApi = () => ({ NSPrivacyAccessedAPIType: userDefaults, NSPrivacyAccessedAPITypeReasons: ["CA92.1"] });
const syntheticManifest = () => ({ NSPrivacyCollectedDataTypes: [ownDevice()], NSPrivacyAccessedAPITypes: [ownApi()] });

test("The actual app XML declares only its own account-linked device ID for functionality and preserves the original UserDefaults reason", () => {
  const filename = fileURLToPath(new URL("../ios/App/App/PrivacyInfo.xcprivacy", import.meta.url));
  const privacy = parse(fs.readFileSync(filename, "utf8"));
  assert.deepEqual(privacy.NSPrivacyCollectedDataTypes, [ownDevice()], "Do not copy vendor diagnostics, Analytics purposes or their generic unlinked classification into the app-owned declaration");
  assert.equal(typeof privacy.NSPrivacyCollectedDataTypes[0].NSPrivacyCollectedDataTypeLinked, "boolean");
  assert.equal(typeof privacy.NSPrivacyCollectedDataTypes[0].NSPrivacyCollectedDataTypeTracking, "boolean");
  assert.deepEqual(privacy.NSPrivacyAccessedAPITypes, [ownApi()], "The existing app-scoped CA92.1 declaration remains exact");
  assert.doesNotThrow(() => validateAppPrivacyManifest(privacy));
});

test("The app privacy validator refuses missing, malformed or duplicate device-ID declarations", () => {
  for (const collected of [undefined, null, {}, [], [null], [{ ...ownDevice(), NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherDiagnosticData" }], [ownDevice(), ownDevice()]]) {
    const privacy = syntheticManifest(); privacy.NSPrivacyCollectedDataTypes = collected;
    assert.throws(() => validateAppPrivacyManifest(privacy));
  }
  for (const invalid of [undefined, null, false, "not a manifest", []]) assert.throws(() => validateAppPrivacyManifest(invalid));
});

test("Device linkage and tracking use real booleans with the exact linked-true and tracking-false values", () => {
  const wrongLinked = [undefined, null, false, 0, 1, "YES", "true", "false", [], {}, new Boolean(true)];
  const wrongTracking = [undefined, null, true, 0, 1, "NO", "false", "true", [], {}, new Boolean(false)];
  for (const [key, values] of [["NSPrivacyCollectedDataTypeLinked", wrongLinked], ["NSPrivacyCollectedDataTypeTracking", wrongTracking]]) {
    for (const value of values) {
      const privacy = syntheticManifest(); privacy.NSPrivacyCollectedDataTypes[0][key] = value;
      assert.throws(() => validateAppPrivacyManifest(privacy));
    }
  }
  assert.doesNotThrow(() => validateAppPrivacyManifest(syntheticManifest()));
});

test("The account-bound device ID cannot lose functionality or acquire duplicated, untyped or vendor Analytics purposes", () => {
  for (const purposes of [undefined, null, purpose, [], ["NSPrivacyCollectedDataTypePurposeAnalytics"], [purpose, purpose], [purpose, "NSPrivacyCollectedDataTypePurposeAnalytics"], [1], [false]]) {
    const privacy = syntheticManifest(); privacy.NSPrivacyCollectedDataTypes[0].NSPrivacyCollectedDataTypePurposes = purposes;
    assert.throws(() => validateAppPrivacyManifest(privacy));
  }
});

test("The existing app-owned UserDefaults API reason cannot disappear or be replaced by another SDK reason", () => {
  for (const apis of [undefined, null, {}, [], [null], [{ ...ownApi(), NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp" }],
    [{ ...ownApi(), NSPrivacyAccessedAPITypeReasons: [] }], [{ ...ownApi(), NSPrivacyAccessedAPITypeReasons: "CA92.1" }],
    [{ ...ownApi(), NSPrivacyAccessedAPITypeReasons: ["C56D.1"] }]]) {
    const privacy = syntheticManifest(); privacy.NSPrivacyAccessedAPITypes = apis;
    assert.throws(() => validateAppPrivacyManifest(privacy));
  }
});

test("The actual project inspector rejects altered original privacy XML in a temporary public-only project copy", async t => {
  const temp = fs.realpathSync(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(temp, "jagdlatein-SYNTHETIC-privacy-project-"));
  const oldFlag = process.env.JL_NATIVE_PUSH_ENABLED;
  process.env.JL_NATIVE_PUSH_ENABLED = "NO";
  t.after(() => {
    if (oldFlag === undefined) delete process.env.JL_NATIVE_PUSH_ENABLED;
    else process.env.JL_NATIVE_PUSH_ENABLED = oldFlag;
    assert.equal(path.dirname(path.resolve(directory)), temp);
    assert.ok(path.basename(directory).startsWith("jagdlatein-SYNTHETIC-privacy-project-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  // Explicit public allowlist, not a whole-root copy: no Firebase original,
  // keychain, provisioning profile, Xcode user state or build output is read.
  const publicFiles = [
    "ios/App/App.xcodeproj/project.pbxproj", "ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme",
    "ios/App/App/AppDelegate.swift", "ios/App/App/SceneDelegate.swift", "ios/App/App/NativePush.swift",
    "ios/App/App/AppleSubscriptions.swift", "ios/App/App/App.entitlements", "ios/App/App/Info.plist",
    "ios/App/App/PrivacyInfo.xcprivacy", "ios/App/App/Base.lproj/LaunchScreen.storyboard", "ios/App/AppUITests/WebsiteAppUITests.swift",
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", "core/Package.swift",
  ];
  for (const relative of publicFiles) {
    const target = path.join(directory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(mobileRoot, relative), target);
  }
  const privacyFile = path.join(directory, "ios/App/App/PrivacyInfo.xcprivacy");
  const original = fs.readFileSync(privacyFile, "utf8");
  const valid = await inspectProject(directory);
  assert.deepEqual(valid.privacy.NSPrivacyCollectedDataTypes, [ownDevice()]);
  assert.equal(valid.firebaseConfigurationPresent, false);
  const notLinked = original.replace(/(<key>NSPrivacyCollectedDataTypeLinked<\/key>\s*)<true\/>/, "$1<false/>");
  assert.notEqual(notLinked, original);
  fs.writeFileSync(privacyFile, notLinked);
  await assert.rejects(inspectProject(directory), /kontogebunden/);
  fs.writeFileSync(privacyFile, original.replace("CA92.1", "C56D.1"));
  await assert.rejects(inspectProject(directory), /UserDefaults/);
  fs.writeFileSync(privacyFile, original);
  assert.deepEqual((await inspectProject(directory)).privacy.NSPrivacyAccessedAPITypes, [ownApi()]);
});
