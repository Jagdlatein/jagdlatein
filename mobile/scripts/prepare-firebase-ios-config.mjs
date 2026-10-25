import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parse } from "plist";
import { validateFirebasePushConfiguration } from "./testflight-profile.mjs";

// Use plist's already locked XML parser dependency for strict validation. Its
// ordinary parse() repairs some malformed XML and may log input on warnings.
const { DOMParser } = createRequire(import.meta.resolve("plist"))("@xmldom/xmldom");
const MAX_BYTES = 16 * 1024;
const MAX_BASE64 = Math.ceil(MAX_BYTES / 3) * 4;
const defaultMobileRoot = fileURLToPath(new URL("../", import.meta.url));
const fail = message => { throw new Error(message); };

function originalConfiguration(encoded) {
  if (typeof encoded !== "string" || !encoded.length || encoded.length > MAX_BASE64) fail("Die Original-Firebase-Datei fehlt oder ist zu groß.");
  // Canonical standard Base64 only. No permissive URL-safe/whitespace decoding.
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) fail("Die Original-Firebase-Datei ist nicht gültig Base64-kodiert.");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_BYTES || bytes.toString("base64") !== encoded) fail("Die Original-Firebase-Datei ist nicht gültig Base64-kodiert.");
  let xml, document, config;
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/<!ENTITY\b|<!DOCTYPE[^>]*\[|BEGIN(?: [A-Z]+)? PRIVATE KEY|private_key|client_email|\.p8\b/i.test(xml)) throw new Error("Not a public client configuration");
    document = new DOMParser({ onError() { throw new Error("Invalid XML"); } }).parseFromString(xml, "text/xml");
    const root = document.documentElement;
    if (root?.nodeName !== "plist") throw new Error("Not an XML plist");
    const elements = node => Array.from(node.childNodes).filter(child => child.nodeType === 1);
    const contents = elements(root);
    if (contents.length !== 1 || contents[0].nodeName !== "dict") throw new Error("Not a dictionary");
    for (const dictionary of Array.from(document.getElementsByTagName("dict"))) {
      const children = elements(dictionary), keys = new Set();
      if (children.length % 2) throw new Error("Incomplete dictionary");
      for (let index = 0; index < children.length; index += 2) {
        const key = children[index];
        if (key.nodeName !== "key" || !key.textContent || keys.has(key.textContent) || ["__proto__", "constructor", "prototype"].includes(key.textContent) || /private_?key|client_email|service_account/i.test(key.textContent)) throw new Error("Ambiguous or private dictionary");
        keys.add(key.textContent);
      }
    }
    for (const value of Array.from(document.getElementsByTagName("string"))) {
      if (/BEGIN(?: [A-Z]+)? PRIVATE KEY|private_key|client_email|\.p8\b/i.test(value.textContent || "")) throw new Error("Private material in decoded XML");
    }
    config = parse(xml);
  } catch { fail("Die Original-Firebase-Datei ist keine gültige öffentliche XML-Plist."); }
  validateFirebasePushConfiguration(config);
  return bytes;
}

function targetDirectory(mobileRoot) {
  if (typeof mobileRoot !== "string" || !path.isAbsolute(mobileRoot) || mobileRoot.split(/[\\/]/).includes("..")) fail("Das Firebase-Zielverzeichnis ist ungültig.");
  const root = path.resolve(mobileRoot);
  let current = root;
  try {
    const samePath = (left, right) => process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;
    if (!samePath(fs.realpathSync(root), root)) fail("Das Firebase-Ziel darf keine Verknüpfung in seinem Ursprung enthalten.");
    for (const segment of [null, "ios", "App", "App"]) {
      if (segment) current = path.join(current, segment);
      const stat = fs.lstatSync(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) fail("Das Firebase-Ziel darf keine Verknüpfung sein.");
    }
    if (path.relative(fs.realpathSync(root), fs.realpathSync(current)) !== path.join("ios", "App", "App")) fail("Das Firebase-Ziel liegt außerhalb des vorgesehenen App-Verzeichnisses.");
  } catch { fail("Das Firebase-Zielverzeichnis fehlt oder ist nicht sicher auflösbar."); }
  return current;
}

// No original is reconstructed or normalised: the verified decoded bytes are
// copied unchanged, only to this fixed ignored path in each fresh CI checkout.
export function prepareFirebaseIosConfig(options = {}) {
  const enabled = options.nativePush;
  if (enabled === undefined || enabled === false) return { prepared: false };
  if (enabled !== true) fail("Apple-Push muss ausdrücklich ein- oder ausgeschaltet sein.");
  const bytes = originalConfiguration(options.encoded);
  const directory = targetDirectory(options.mobileRoot ?? defaultMobileRoot);
  const target = path.join(directory, "GoogleService-Info.plist");
  let existing;
  try { existing = fs.lstatSync(target); }
  catch (error) { if (error.code !== "ENOENT") fail("Die Firebase-Zieldatei konnte nicht sicher geprüft werden."); }
  if (existing) {
    if (!existing.isFile() || existing.isSymbolicLink() || existing.size > MAX_BYTES || !fs.readFileSync(target).equals(bytes)) fail("Eine andere Firebase-Zieldatei wird nicht überschrieben.");
    return { prepared: true, existing: true };
  }
  try { fs.writeFileSync(target, bytes, { flag: "wx", mode: 0o600 }); }
  catch { fail("Die Firebase-Originaldatei konnte nicht exklusiv bereitgestellt werden."); }
  return { prepared: true, existing: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const flag = process.env.IOS_NATIVE_PUSH;
    if (flag !== undefined && !["true", "false"].includes(flag)) fail("IOS_NATIVE_PUSH muss genau true oder false sein.");
    const result = flag === "true"
      ? prepareFirebaseIosConfig({ nativePush: true, encoded: process.env.IOS_FIREBASE_PLIST_BASE64 })
      : prepareFirebaseIosConfig();
    console.log(result.prepared ? "Firebase-Originaldatei geprüft und für diesen Build bereitgestellt." : "Apple-Push bleibt ausgeschaltet; keine Firebase-Datei bereitgestellt.");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
