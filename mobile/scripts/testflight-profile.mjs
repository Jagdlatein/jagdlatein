import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parse } from "plist";

const pushBundle = "de.jagdlatein.app";
export function validateFirebasePushConfiguration(config) {
  if (config?.BUNDLE_ID !== pushBundle || config?.PROJECT_ID !== "jagdlatein-a17b1" ||
      config?.GCM_SENDER_ID !== "1084120782155" || config?.GOOGLE_APP_ID !== "1:1084120782155:ios:1704651867d85968da44ce" ||
      typeof config?.API_KEY !== "string" || !/^AIza[A-Za-z0-9_-]{35}$/.test(config.API_KEY)) {
    throw new Error("Firebase-Konfiguration gehört nicht vollständig zur freigegebenen Apple-App.");
  }
  return { bundle: config.BUNDLE_ID, project: config.PROJECT_ID, app: config.GOOGLE_APP_ID };
}
function pushRequest(expected) {
  const enabled = expected.nativePush === true;
  if (enabled && (expected.bundle !== pushBundle || (expected.websiteEnvironment ?? "Production") !== "Production")) throw new Error("Apple-Push ist nur für die signierte Production-App de.jagdlatein.app vorgesehen.");
  return enabled;
}
export function validateSigningProfile(profile, team, bundle, now = new Date(), options = {}) {
  const reject = message => { throw new Error(message); };
  if (!/^[A-Z0-9]{10}$/.test(team)) reject("Ungültige Apple-Team-ID.");
  if (!/^[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)+$/.test(bundle) || bundle.includes("*")) reject("Ungültige feste Bundle-ID.");
  const entitlements = profile?.Entitlements;
  if (!Array.isArray(profile.TeamIdentifier) || !profile.TeamIdentifier.includes(team) || entitlements?.["com.apple.developer.team-identifier"] !== team) reject("Profil und Apple-Team stimmen nicht überein.");
  const prefixes = profile.ApplicationIdentifierPrefix;
  if (!Array.isArray(prefixes) || !prefixes.some(prefix => /^[A-Z0-9]{10}$/.test(prefix) && entitlements["application-identifier"] === `${prefix}.${bundle}`)) reject("Profil und feste Bundle-ID stimmen nicht überein.");
  if (!(profile.ExpirationDate instanceof Date) || !Number.isFinite(profile.ExpirationDate.valueOf()) || profile.ExpirationDate <= now) reject("Signierungsprofil ist abgelaufen oder hat kein gültiges Ablaufdatum.");
  if (entitlements["get-task-allow"] !== false) reject("Ein Entwicklungsprofil ist für TestFlight nicht erlaubt.");
  if (Object.hasOwn(profile, "ProvisionedDevices") || profile.ProvisionsAllDevices === true || entitlements["beta-reports-active"] !== true) reject("Es wird ein App-Store-Connect-Profil benötigt; Ad-hoc- und Enterprise-Profile sind nicht erlaubt.");
  if (!Array.isArray(profile.Platform) || !profile.Platform.includes("iOS")) reject("Profil ist kein iOS-/iPadOS-Profil.");
  if (!/^[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}$/.test(profile.UUID ?? "")) reject("Profil hat keine gültige Kennung.");
  if (typeof profile.Name !== "string" || profile.Name.length < 1 || profile.Name.length > 256 || /[\x00-\x1f\x7f]/.test(profile.Name)) reject("Profil hat keinen gültigen Namen.");
  // plist5 decodes <data> as Uint8Array; fixture/binary callers may use Buffer.
  if (!Array.isArray(profile.DeveloperCertificates) || profile.DeveloperCertificates.length !== 1 || !(profile.DeveloperCertificates[0] instanceof Uint8Array) || profile.DeveloperCertificates[0].length < 1) reject("Profil muss genau ein Apple-Verteilungszertifikat enthalten.");
  if (pushRequest({ ...options, bundle }) && entitlements["aps-environment"] !== "production") reject("Das tatsächliche Apple-Profil erlaubt keine Production-Push-Mitteilungen.");
  return {
    uuid: profile.UUID,
    team,
    bundle,
    applicationIdentifier: entitlements["application-identifier"],
    certificateSha1: createHash("sha1").update(profile.DeveloperCertificates[0]).digest("hex").toUpperCase(),
    expires: profile.ExpirationDate.toISOString(),
    nativePushAllowed: entitlements["aps-environment"] === "production"
  };
}

export function validateDeviceApp(info, expected) {
  const websiteEnvironment = expected.websiteEnvironment ?? "Production";
  if (!["Production", "Sandbox"].includes(websiteEnvironment)) throw new Error("Unbekannte iOS-Website-Umgebung.");
  const displayName = websiteEnvironment === "Sandbox" ? "Jagdlatein Test" : "Jagdlatein";
  if (info.JagdlateinWebsiteEnvironment !== websiteEnvironment || info.CFBundleDisplayName !== displayName) throw new Error("App-Website-Umgebung oder sichtbarer App-Name stimmen nicht mit dem angeforderten Build überein.");
  if (!/^[1-9][0-9]{0,3}(?:\.[0-9]{1,2}){0,2}$/.test(info.CFBundleVersion ?? "") || !/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,2}$/.test(info.CFBundleShortVersionString ?? "")) throw new Error("App hat keine gültige Apple-Version oder positive Build-Nummer.");
  if (info.CFBundleIdentifier !== expected.bundle || info.CFBundleVersion !== expected.build || info.CFBundleShortVersionString !== expected.version) throw new Error("Archiv-Metadaten stimmen nicht mit der angeforderten App überein.");
  if (info.CFBundleSupportedPlatforms?.length !== 1 || info.CFBundleSupportedPlatforms[0] !== "iPhoneOS" || info.DTPlatformName !== "iphoneos") throw new Error("Archiv wurde nicht für ein echtes iPhone/iPad gebaut.");
  if (!info.UIDeviceFamily?.includes(1) || !info.UIDeviceFamily.includes(2)) throw new Error("Archiv muss iPhone und iPad unterstützen.");
  const nativePush = pushRequest(expected);
  const flag = info.JagdlateinNativePushEnabled;
  const actualPush = flag === true || flag === "YES";
  if (flag !== undefined && ![true, false, "YES", "NO"].includes(flag) || actualPush !== nativePush) throw new Error("Die tatsächliche Apple-Push-Buildfreigabe stimmt nicht mit der Anforderung überein.");
  return { bundle: info.CFBundleIdentifier, build: info.CFBundleVersion, version: info.CFBundleShortVersionString,
    deviceFamilies: info.UIDeviceFamily, websiteEnvironment, displayName, nativePush };
}

export function validateSignedApp(info, entitlements, expected, profile, firebaseConfiguration) {
  const result = validateDeviceApp(info, expected);
  if (entitlements["application-identifier"] !== profile.applicationIdentifier || entitlements["com.apple.developer.team-identifier"] !== profile.team || entitlements["get-task-allow"] !== false) throw new Error("Signierte App gehört nicht zum geprüften TestFlight-Profil oder erlaubt Debugging.");
  if (result.nativePush) {
    if (profile.nativePushAllowed !== true || entitlements["aps-environment"] !== "production") throw new Error("Signierte App und eingebettetes Apple-Profil brauchen aps-environment=production.");
    validateFirebasePushConfiguration(firebaseConfiguration);
  }
  return { ...result, signed: true };
}

// This utility reads only explicit plist files created by the build script.
// It never reads a keychain, private key, environment secret, or Apple account.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, file, team, bundle, ...args] = process.argv.slice(2);
    const load = filename => parse(fs.readFileSync(filename, "utf8"));
    const enabled = flag => {
      if (!["YES", "NO"].includes(flag)) throw new Error("Apple-Push muss ausdrücklich YES oder NO sein.");
      return flag === "YES";
    };
    if (mode === "profile") {
      const [nativePush = "NO", websiteEnvironment = "Production"] = args;
      console.log(JSON.stringify(validateSigningProfile(load(file), team, bundle, new Date(), { nativePush: enabled(nativePush), websiteEnvironment })));
    } else if (mode === "firebase") {
      console.log(JSON.stringify(validateFirebasePushConfiguration(load(file))));
    } else if (mode === "device") {
      const [build, version, , , websiteEnvironment = "Production", nativePush = "NO"] = args;
      if (enabled(nativePush)) throw new Error("Ein unsigniertes Gerätearchiv darf Apple-Push nicht aktivieren.");
      console.log(JSON.stringify(validateDeviceApp(load(file), { bundle, build, version, websiteEnvironment, nativePush: false })));
    } else if (mode === "signed") {
      const [build, version, entitlementsFile, profileFile, websiteEnvironment = "Production", nativePush = "NO", firebaseFile] = args;
      const info = load(file);
      const options = { nativePush: enabled(nativePush), websiteEnvironment };
      const profile = validateSigningProfile(load(profileFile), team, bundle, new Date(), options);
      // Upload validates the actual IPA's build/version when not supplied.
      console.log(JSON.stringify(validateSignedApp(info, load(entitlementsFile), { bundle, build: build || info.CFBundleVersion,
        version: version || info.CFBundleShortVersionString, ...options }, profile, options.nativePush && firebaseFile ? load(firebaseFile) : null)));
    } else {
      throw new Error("Unbekannte TestFlight-Prüfung.");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
