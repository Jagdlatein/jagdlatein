import test from "node:test";
import assert from "node:assert/strict";
import { build as buildPlist, parse as parsePlist } from "plist";
import { validateSigningProfile, validateDeviceApp, validateSignedApp } from "../scripts/testflight-profile.mjs";

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
