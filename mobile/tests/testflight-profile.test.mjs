import test from "node:test";
import assert from "node:assert/strict";
import { build as buildPlist, parse as parsePlist } from "plist";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateSigningProfile, validateDeviceApp, validateSignedApp, validateFirebasePushConfiguration } from "../scripts/testflight-profile.mjs";

const team = "ABCDE12345";
const bundle = "de.jagdlatein.app";
const now = new Date("2026-10-05T12:00:00Z");
const validProfile = () => ({
  UUID: "12345678-1234-1234-1234-123456789012", Name: "Jagdlatein TestFlight",
  TeamIdentifier: [team], ApplicationIdentifierPrefix: [team], Platform: ["iOS"],
  ExpirationDate: new Date("2027-10-05T12:00:00Z"),
  DeveloperCertificates: [Buffer.from("fixture public certificate")],
  Entitlements: { "application-identifier": `${team}.${bundle}`, "com.apple.developer.team-identifier": team, "get-task-allow": false, "beta-reports-active": true }
});
const validInfo = () => ({ CFBundleIdentifier: bundle, CFBundleVersion: "2", CFBundleShortVersionString: "0.1.0", CFBundleSupportedPlatforms: ["iPhoneOS"], DTPlatformName: "iphoneos", UIDeviceFamily: [1, 2],
  CFBundleDisplayName: "Jagdlatein", JagdlateinWebsiteEnvironment: "Production" });

test("TestFlight-Profil verlangt das genaue Apple-Team und die genaue Bundle-ID", () => {
  assert.equal(validateSigningProfile(validProfile(), team, bundle, now).certificateSha1.length, 40);
  const decodedRealPlist = parsePlist(buildPlist(validProfile()));
  assert.equal(validateSigningProfile(decodedRealPlist, team, bundle, now).certificateSha1, validateSigningProfile(validProfile(), team, bundle, now).certificateSha1);
  assert.throws(() => validateSigningProfile(validProfile(), "ZZZZZ12345", bundle, now), /Team/);
  assert.throws(() => validateSigningProfile(validProfile(), team, "de.jagdlatein.other", now), /Bundle/);
  const wildcard = validProfile(); wildcard.Entitlements["application-identifier"] = `${team}.*`;
  assert.throws(() => validateSigningProfile(wildcard, team, bundle, now), /Bundle/);
});

test("TestFlight-Profil lehnt Ablauf, Debugging, Ad-hoc und Enterprise ab", () => {
  for (const change of [
    profile => { profile.ExpirationDate = now; },
    profile => { profile.ExpirationDate = "2027-10-05"; },
    profile => { profile.Entitlements["get-task-allow"] = true; },
    profile => { delete profile.Entitlements["get-task-allow"]; },
    profile => { profile.ProvisionedDevices = []; },
    profile => { profile.ProvisionsAllDevices = true; },
    profile => { profile.Entitlements["beta-reports-active"] = false; },
    profile => { profile.Platform = ["OSX"]; },
    profile => { profile.DeveloperCertificates = []; }
  ]) {
    const profile = validProfile(); change(profile);
    assert.throws(() => validateSigningProfile(profile, team, bundle, now));
  }
});

test("Gerätearchiv und signierte App dürfen keine Simulator-App oder fremde App sein", () => {
  const expected = { bundle, build: "2", version: "0.1.0" };
  assert.equal(validateDeviceApp(validInfo(), expected).bundle, bundle);
  const simulator = validInfo(); simulator.CFBundleSupportedPlatforms = ["iPhoneSimulator"];
  assert.throws(() => validateDeviceApp(simulator, expected), /echtes/);
  const phoneOnly = validInfo(); phoneOnly.UIDeviceFamily = [1];
  assert.throws(() => validateDeviceApp(phoneOnly, expected), /iPad/);
  assert.throws(() => validateDeviceApp(validInfo(), { ...expected, build: "3" }), /Metadaten/);
  const dottedBuild = validInfo(); dottedBuild.CFBundleVersion = "2.1";
  assert.equal(validateDeviceApp(dottedBuild, { ...expected, build: "2.1" }).build, "2.1");
  const checked = validateSigningProfile(validProfile(), team, bundle, now);
  assert.equal(validateSignedApp(validInfo(), validProfile().Entitlements, expected, checked).signed, true);
  const other = validProfile().Entitlements; other["com.apple.developer.team-identifier"] = "ZZZZZ12345";
  assert.throws(() => validateSignedApp(validInfo(), other, expected, checked), /Signierte/);
});

test("Archiv und IPA müssen die gewählte Website-Umgebung und deren sichtbaren Namen enthalten", () => {
  const expected = { bundle, build: "2", version: "0.1.0", websiteEnvironment: "Sandbox" };
  const sandbox = { ...validInfo(), JagdlateinWebsiteEnvironment: "Sandbox", CFBundleDisplayName: "Jagdlatein Test" };
  const profile = validateSigningProfile(validProfile(), team, bundle, now);
  assert.equal(validateDeviceApp(sandbox, expected).websiteEnvironment, "Sandbox");
  assert.equal(validateSignedApp(sandbox, validProfile().Entitlements, expected, profile).displayName, "Jagdlatein Test");
  assert.throws(() => validateDeviceApp(validInfo(), expected), /Umgebung/);
  assert.throws(() => validateSignedApp(sandbox, validProfile().Entitlements, { ...expected, websiteEnvironment: "Production" }, profile), /Umgebung/);
  assert.throws(() => validateDeviceApp({ ...sandbox, CFBundleDisplayName: "Jagdlatein" }, expected), /Name/);
  assert.throws(() => validateDeviceApp({ ...sandbox, JagdlateinWebsiteEnvironment: "https://evil.test" }, expected), /Umgebung/);
  assert.throws(() => validateDeviceApp(sandbox, { ...expected, websiteEnvironment: "sandbox" }), /Unbekannte/);
});

test("Store-Version 1.0.0 wird im echten Plist geprüft und eine alte Testversion abgewiesen", () => {
  const expected = { bundle, build: "7", version: "1.0.0", websiteEnvironment: "Production" };
  const releaseInfo = parsePlist(buildPlist({ ...validInfo(), CFBundleVersion: "7", CFBundleShortVersionString: "1.0.0" }));
  const profile = validateSigningProfile(validProfile(), team, bundle, now);
  assert.equal(validateDeviceApp(releaseInfo, expected).version, "1.0.0");
  assert.equal(validateSignedApp(releaseInfo, validProfile().Entitlements, expected, profile).version, "1.0.0");
  const oldTestInfo = { ...releaseInfo, CFBundleShortVersionString: "0.1.0" };
  assert.throws(() => validateDeviceApp(oldTestInfo, expected), /Metadaten/);
  assert.throws(() => validateSignedApp(oldTestInfo, validProfile().Entitlements, expected, profile), /Metadaten/);
  for (const version of ["1.0", "1.0.0.1", "1.0.0-beta", " 1.0.0", "1.0.0\n", "1.0.100", "10000.0.0"]) {
    assert.throws(() => validateDeviceApp({ ...releaseInfo, CFBundleShortVersionString: version }, { ...expected, version }));
  }
});

const firebaseConfiguration = () => ({ BUNDLE_ID: bundle, PROJECT_ID: "jagdlatein-a17b1", GCM_SENDER_ID: "1084120782155",
  GOOGLE_APP_ID: "1:1084120782155:ios:1704651867d85968da44ce", API_KEY: `AIza${"A".repeat(35)}` });
const pushProfile = () => { const profile = validProfile(); profile.Entitlements["aps-environment"] = "production"; return profile; };
const pushExpected = () => ({ bundle, build: "2", version: "0.1.0", websiteEnvironment: "Production", nativePush: true });

test("Apple-Push bleibt ohne ausdrückliche Anforderung aus und verlangt im tatsächlichen Profil Production-APS", () => {
  assert.equal(validateSignedApp(validInfo(), validProfile().Entitlements, { bundle, build: "2", version: "0.1.0" }, validateSigningProfile(validProfile(), team, bundle, now)).nativePush, false);
  assert.throws(() => validateSigningProfile(validProfile(), team, bundle, now, { nativePush: true }), /Production-Push/);
  const development = pushProfile(); development.Entitlements["aps-environment"] = "development";
  assert.throws(() => validateSigningProfile(development, team, bundle, now, { nativePush: true }), /Production-Push/);
  assert.equal(validateSigningProfile(pushProfile(), team, bundle, now, { nativePush: true }).nativePushAllowed, true);
  assert.throws(() => validateSigningProfile(pushProfile(), team, bundle, now, { nativePush: true, websiteEnvironment: "Sandbox" }), /Production-App/);
});

test("Archiv- und IPA-Metadaten brauchen dieselbe bewusste Push-Freigabe wie Signierungsrechte und Firebase-Datei", () => {
  const info = { ...validInfo(), JagdlateinNativePushEnabled: "YES" }, expected = pushExpected();
  const profile = validateSigningProfile(pushProfile(), team, bundle, now, { nativePush: true });
  assert.equal(validateSignedApp(info, pushProfile().Entitlements, expected, profile, firebaseConfiguration()).nativePush, true);
  assert.throws(() => validateSignedApp(info, validProfile().Entitlements, expected, profile, firebaseConfiguration()), /aps-environment/);
  const development = pushProfile().Entitlements; development["aps-environment"] = "development";
  assert.throws(() => validateSignedApp(info, development, expected, profile, firebaseConfiguration()), /aps-environment/);
  assert.throws(() => validateSignedApp(info, pushProfile().Entitlements, expected, { ...profile, nativePushAllowed: false }, firebaseConfiguration()), /aps-environment/);
  assert.throws(() => validateSignedApp(info, pushProfile().Entitlements, expected, profile), /Firebase/);
  assert.throws(() => validateDeviceApp(info, { ...expected, nativePush: false }), /Buildfreigabe/);
  assert.throws(() => validateDeviceApp({ ...info, JagdlateinNativePushEnabled: "NO" }, expected), /Buildfreigabe/);
  assert.throws(() => validateDeviceApp(info, { ...expected, bundle: "de.jagdlatein.other" }));
});

test("Die öffentliche Firebase-Datei wird auf die freigegebene Apple-App und vollständige Schlüsselstruktur geprüft", () => {
  const result = validateFirebasePushConfiguration(firebaseConfiguration());
  assert.equal(result.bundle, bundle); assert.ok(!Object.hasOwn(result, "API_KEY"));
  for (const change of [{ BUNDLE_ID: "de.jagdlatein.other" }, { PROJECT_ID: "other-project" }, { GCM_SENDER_ID: "000" },
    { GOOGLE_APP_ID: "1:000:ios:wrong" }, { API_KEY: "" }, { API_KEY: undefined }]) {
    assert.throws(() => validateFirebasePushConfiguration({ ...firebaseConfiguration(), ...change }), /Firebase/);
  }
});

test("Der echte Datei-CLI prüft exportierte Metadaten, CodeSign-APS, eingebettetes Profil und eingebettete Firebase-Datei gemeinsam", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "jagdlatein-push-profile-test-"));
  try {
    const helper = fileURLToPath(new URL("../scripts/testflight-profile.mjs", import.meta.url));
    const files = {};
    function write(name, value) { files[name] = path.join(directory, `${name}.plist`); fs.writeFileSync(files[name], buildPlist(value)); return files[name]; }
    const info = { ...validInfo(), JagdlateinNativePushEnabled: "YES" };
    write("info", info); write("profile", pushProfile()); write("entitlements", pushProfile().Entitlements); write("firebase", firebaseConfiguration());
    const args = () => [helper, "signed", files.info, team, bundle, "2", "0.1.0", files.entitlements, files.profile, "Production", "YES", files.firebase];
    const run = values => spawnSync(process.execPath, values, { encoding: "utf8" });
    let result = run(args()); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).nativePush, true); assert.ok(!result.stdout.includes(firebaseConfiguration().API_KEY));
    write("entitlements", validProfile().Entitlements); result = run(args()); assert.notEqual(result.status, 0); assert.match(result.stderr, /aps-environment/);
    write("entitlements", pushProfile().Entitlements); write("profile", validProfile()); result = run(args()); assert.notEqual(result.status, 0); assert.match(result.stderr, /Production-Push/);
    write("profile", pushProfile()); write("firebase", { ...firebaseConfiguration(), PROJECT_ID: "other" }); result = run(args()); assert.notEqual(result.status, 0); assert.match(result.stderr, /Firebase/);
    const unsigned = run([helper, "device", files.info, "", bundle, "2", "0.1.0", "", "", "Production", "YES"]); assert.notEqual(unsigned.status, 0); assert.match(unsigned.stderr, /unsigniertes/);
    const defaultOff = run([helper, "signed", files.info, team, bundle, "2", "0.1.0", files.entitlements, files.profile, "Production"]); assert.notEqual(defaultOff.status, 0); assert.match(defaultOff.stderr, /Buildfreigabe/);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("jagdlatein-push-profile-test-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
