// Synthetic technical fixtures only: never read a downloaded Firebase file,
// repository variable, signing credential, Apple account or live service.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { prepareFirebaseIosConfig } from "../scripts/prepare-firebase-ios-config.mjs";

const mobile = fileURLToPath(new URL("../", import.meta.url));
const root = path.dirname(path.resolve(mobile));
const temp = fs.realpathSync(os.tmpdir());
const maxBytes = 16 * 1024;
const syntheticKey = `AIza${"A".repeat(35)}`;
const syntheticMarker = "SYNTHETIC-TRANSFER-TEST-NOT-A-FIREBASE-DOWNLOAD";
const fields = {
  BUNDLE_ID: "de.jagdlatein.app", PROJECT_ID: "jagdlatein-a17b1", GCM_SENDER_ID: "1084120782155",
  GOOGLE_APP_ID: "1:1084120782155:ios:1704651867d85968da44ce", API_KEY: syntheticKey,
};
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
function syntheticXml(changes = {}) {
  const entries = Object.entries({ ...fields, ...changes }).filter(([, value]) => value !== undefined);
  return `<?xml version="1.0" encoding="UTF-8"?>\r\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\r\n<plist version="1.0">\r\n<dict>\r\n${entries.map(([key, value]) => `<key>${key}</key><string>${escape(value)}</string>`).join("\r\n")}\r\n<key>SYNTHETIC_MARKER</key><string>${syntheticMarker} – Grüße 🦌</string>\r\n<key>SYNTHETIC_EXTRA</key><array><true/><integer>7</integer><dict><key>preserve</key><string>Original fixture bytes</string></dict></array>\r\n</dict>\r\n</plist>\r\n`;
}
const syntheticBytes = changes => Buffer.from(`\uFEFF${syntheticXml(changes)}`, "utf8");
const encode = bytes => Buffer.from(bytes).toString("base64");
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(temp, "jagdlatein-SYNTHETIC-firebase-transfer-"));
  const mobileRoot = path.join(directory, "mobile");
  const parent = path.join(mobileRoot, "ios", "App", "App");
  fs.mkdirSync(parent, { recursive: true });
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), temp);
    assert.ok(path.basename(directory).startsWith("jagdlatein-SYNTHETIC-firebase-transfer-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { directory, mobileRoot, parent, target: path.join(parent, "GoogleService-Info.plist") };
}
function prepare(f, bytes = syntheticBytes(), options = {}) {
  return prepareFirebaseIosConfig({ nativePush: true, encoded: encode(bytes), mobileRoot: f.mobileRoot, ...options });
}
function assertNoTarget(f) { assert.equal(fs.existsSync(f.target), false); }
function directoryLink(target, link) { fs.symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir"); }

test("Missing or false activation never reads the configuration or destination, and non-boolean requests fail closed", () => {
  const hidden = { get encoded() { throw new Error("Disabled transfer must not read encoded configuration"); }, get mobileRoot() { throw new Error("Disabled transfer must not inspect a path"); } };
  assert.deepEqual(prepareFirebaseIosConfig(), { prepared: false });
  assert.deepEqual(prepareFirebaseIosConfig(hidden), { prepared: false });
  const disabled = Object.create(hidden); disabled.nativePush = false;
  assert.deepEqual(prepareFirebaseIosConfig(disabled), { prepared: false });
  for (const nativePush of ["true", "false", "YES", 1, 0, null, [], {}]) {
    const options = Object.create(hidden); options.nativePush = nativePush;
    assert.throws(() => prepareFirebaseIosConfig(options));
  }
});

test("Canonical Base64 is required before a public XML configuration can create any file", t => {
  const f = fixture(t);
  let bytes = syntheticBytes();
  while (bytes.length % 3 !== 1) bytes = Buffer.concat([bytes, Buffer.from(" ")]);
  const canonical = encode(bytes), alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  assert.ok(canonical.endsWith("=="));
  const alternatePaddingBits = canonical.slice(0, -3) + alphabet[alphabet.indexOf(canonical.at(-3)) + 1] + "==";
  assert.deepEqual(Buffer.from(alternatePaddingBits, "base64"), bytes);
  const malformed = [undefined, null, 12, {}, "", " ", "!!!", `${canonical}\n`, ` ${canonical}`, canonical.slice(0, -2), `${canonical}=`, alternatePaddingBits];
  if (/[+/]/.test(canonical)) malformed.push(canonical.replaceAll("+", "-").replaceAll("/", "_"));
  for (const encoded of malformed) {
    assert.throws(() => prepareFirebaseIosConfig({ nativePush: true, encoded, mobileRoot: f.mobileRoot }));
    assertNoTarget(f);
  }
});

test("The decoded size bound is exact and a valid configuration at the limit retains every original byte", t => {
  const f = fixture(t), bytes = syntheticBytes();
  const limit = Buffer.concat([bytes, Buffer.alloc(maxBytes - bytes.length, 0x20)]);
  const oversized = Buffer.concat([limit, Buffer.from(" ")]);
  assert.throws(() => prepare(f, oversized)); assertNoTarget(f);
  assert.equal(prepare(f, limit).prepared, true);
  assert.deepEqual(fs.readFileSync(f.target), limit);
});

test("Malformed XML, non-dictionary plists, ambiguous keys and private-key material are never transferred", t => {
  const f = fixture(t), xml = syntheticXml();
  const invalid = [
    "not XML", JSON.stringify(fields), "<dict/>", "<plist><array/></plist>",
    xml.replace("</dict>\r\n</plist>", "</plist>"),
    xml.replace("</plist>", "</plist><extra/>"),
    xml.replace("<key>BUNDLE_ID</key>", "<key>BUNDLE_ID</key><string>de.jagdlatein.app</string><key>BUNDLE_ID</key>"),
    xml.replace("<key>SYNTHETIC_EXTRA</key>", "<key>__proto__</key>"),
    xml.replace("<dict>", "<dict><key>incomplete</key>"),
    xml.replace(/<!DOCTYPE[^>]+>/, '<!DOCTYPE plist [<!ENTITY injected SYSTEM "https://example.invalid/must-not-fetch">]>'),
    xml.replace(syntheticMarker, "-----BEGIN PRIVATE KEY-----"),
    xml.replace(syntheticMarker, "private_key"),
    xml.replace("</dict>\r\n</plist>", "<key>private&#95;key</key><string>SYNTHETIC-NOT-A-SECRET</string></dict>\r\n</plist>"),
    xml.replace(syntheticMarker, "-----BEGIN PRI&#86;ATE KEY----- SYNTHETIC-NOT-A-REAL-KEY"),
  ];
  for (const contents of invalid) { assert.throws(() => prepare(f, Buffer.from(contents))); assertNoTarget(f); }
});

test("Invalid UTF-8 cannot be repaired into an accepted configuration", t => {
  const f = fixture(t), xml = syntheticXml();
  const marker = xml.indexOf(syntheticMarker);
  const invalid = Buffer.concat([Buffer.from(xml.slice(0, marker)), Buffer.from([0xc3, 0x28]), Buffer.from(xml.slice(marker))]);
  assert.throws(() => prepare(f, invalid)); assertNoTarget(f);
  assert.throws(() => prepare(f, Buffer.from(xml, "utf16le"))); assertNoTarget(f);
});

test("Every public identity field and the API-key shape must belong to the already approved Apple configuration", t => {
  const f = fixture(t);
  for (const change of [{ BUNDLE_ID: "de.jagdlatein.preview" }, { PROJECT_ID: "synthetic-wrong-project" }, { GCM_SENDER_ID: "000" },
    { GOOGLE_APP_ID: "1:1084120782155:web:synthetic" }, { API_KEY: "synthetic-invalid-key" }, { API_KEY: undefined }, { BUNDLE_ID: undefined }]) {
    assert.throws(() => prepare(f, syntheticBytes(change))); assertNoTarget(f);
  }
});

test("A synthetic XML original keeps its BOM, CRLF, additional fields and byte identity on an idempotent second preparation", t => {
  const f = fixture(t), bytes = syntheticBytes();
  assert.equal(prepare(f, bytes, { mobileRoot: f.mobileRoot + path.sep }).prepared, true);
  assert.deepEqual(fs.readFileSync(f.target), bytes);
  const before = fs.statSync(f.target);
  const second = prepare(f, bytes), after = fs.statSync(f.target);
  assert.equal(second.prepared, true); assert.equal(second.existing, true);
  assert.deepEqual(fs.readFileSync(f.target), bytes);
  assert.equal(after.mtimeMs, before.mtimeMs); assert.equal(after.ino, before.ino);
  assert.deepEqual(fs.readdirSync(f.parent), ["GoogleService-Info.plist"]);
});

test("An existing different file, equivalent reformatted XML or non-file target is never overwritten", t => {
  const f = fixture(t), bytes = syntheticBytes();
  for (const existing of [Buffer.from("SYNTHETIC unrelated existing file"), Buffer.from(syntheticXml().replaceAll("\r\n", "\n"))]) {
    fs.writeFileSync(f.target, existing);
    assert.throws(() => prepare(f, bytes)); assert.deepEqual(fs.readFileSync(f.target), existing);
    fs.unlinkSync(f.target);
  }
  fs.mkdirSync(f.target);
  assert.throws(() => prepare(f, bytes)); assert.equal(fs.statSync(f.target).isDirectory(), true);
});

test("Missing parents, non-directory ancestors and relative or traversal destinations cannot create another output path", t => {
  const f = fixture(t);
  const missing = path.join(f.directory, "missing-mobile");
  assert.throws(() => prepare(f, syntheticBytes(), { mobileRoot: missing })); assert.equal(fs.existsSync(missing), false);
  assert.throws(() => prepare(f, syntheticBytes(), { mobileRoot: "relative-mobile" })); assertNoTarget(f);
  assert.throws(() => prepare(f, syntheticBytes(), { mobileRoot: path.join(f.mobileRoot, "sub") + path.sep + ".." })); assertNoTarget(f);
  fs.rmSync(path.join(f.mobileRoot, "ios"), { recursive: true, force: true });
  fs.writeFileSync(path.join(f.mobileRoot, "ios"), "SYNTHETIC parent file");
  assert.throws(() => prepare(f)); assert.equal(fs.readFileSync(path.join(f.mobileRoot, "ios"), "utf8"), "SYNTHETIC parent file");
});

test("Real root, parent and ancestor directory links cannot redirect the fixed output beyond its intended mobile tree", t => {
  for (const level of ["root", "ios", "ios/App", "ios/App/App", "ancestor"]) {
    const f = fixture(t), outside = path.join(f.directory, `SYNTHETIC-outside-${level.replaceAll("/", "-")}`);
    fs.mkdirSync(outside);
    let mobileRoot = f.mobileRoot, redirectedTarget = f.target;
    if (level === "ancestor") {
      directoryLink(f.directory, path.join(outside, "alias")); mobileRoot = path.join(outside, "alias", "mobile");
    } else {
      const parts = level === "root" ? [] : level.split("/");
      const linked = path.join(f.mobileRoot, ...parts);
      fs.rmSync(linked, { recursive: true, force: true });
      fs.mkdirSync(path.join(outside, ...["ios", "App", "App"].slice(parts.length)), { recursive: true });
      directoryLink(outside, linked);
      redirectedTarget = path.join(outside, ...["ios", "App", "App"].slice(parts.length), "GoogleService-Info.plist");
    }
    assert.throws(() => prepare(f, syntheticBytes(), { mobileRoot }));
    assert.equal(fs.existsSync(redirectedTarget), false);
  }
});

test("A real destination link is refused (file symlink on Unix, directory junction at the same target path on restricted Windows)", t => {
  const f = fixture(t), outside = path.join(f.directory, "SYNTHETIC-destination"); fs.mkdirSync(outside);
  const original = path.join(outside, "unchanged-original.plist"), bytes = syntheticBytes(); fs.writeFileSync(original, bytes);
  // The Windows runner may not permit file symlinks without developer/admin
  // privileges. Its actual directory junction still exercises a linked target.
  if (process.platform === "win32") directoryLink(outside, f.target);
  else fs.symlinkSync(original, f.target, "file");
  assert.equal(fs.lstatSync(f.target).isSymbolicLink(), true);
  assert.throws(() => prepare(f, bytes)); assert.deepEqual(fs.readFileSync(original), bytes);
});

function temporaryCli(f) {
  fs.mkdirSync(path.join(f.mobileRoot, "scripts"));
  for (const filename of ["prepare-firebase-ios-config.mjs", "testflight-profile.mjs"])
    fs.copyFileSync(path.join(mobile, "scripts", filename), path.join(f.mobileRoot, "scripts", filename));
  // Copy only already installed public parser packages into this complete
  // temporary module tree; the positive CLI can never point at the real app.
  const plistEntry = fileURLToPath(import.meta.resolve("plist"));
  const packages = [[path.dirname(path.dirname(plistEntry)), "plist"],
    [path.join(mobile, "node_modules", "@xmldom", "xmldom"), "@xmldom/xmldom"],
    [path.join(mobile, "node_modules", "xmlbuilder"), "xmlbuilder"]];
  for (const [source, name] of packages) fs.cpSync(source, path.join(f.mobileRoot, "node_modules", name), { recursive: true });
  return (flag, encoded) => {
    const env = Object.fromEntries(["PATH", "SystemRoot", "WINDIR", "TMP", "TEMP"].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
    if (flag !== undefined) env.IOS_NATIVE_PUSH = flag;
    if (encoded !== undefined) env.IOS_FIREBASE_PLIST_BASE64 = encoded;
    return spawnSync(process.execPath, [path.join(f.mobileRoot, "scripts", "prepare-firebase-ios-config.mjs")], { env, encoding: "utf8" });
  };
}

test("The real CLI is default-off, strict about flags and never logs supplied bytes or keys; enabled copying runs only inside a complete temporary module tree", t => {
  const f = fixture(t), run = temporaryCli(f), bytes = syntheticBytes(), encoded = encode(bytes);
  for (const flag of [undefined, "false"]) {
    const result = run(flag, encoded); assert.equal(result.status, 0, result.stderr); assertNoTarget(f);
    assert.match(result.stdout, /ausgeschaltet/); assert.ok(!result.stdout.includes(syntheticMarker));
  }
  for (const [flag, value] of [["TRUE", encoded], ["YES", encoded], ["1", encoded], ["", encoded], ["true", undefined], ["true", "not base64"], ["true", encode(syntheticBytes({ PROJECT_ID: "synthetic-wrong" }))]]) {
    const result = run(flag, value); assert.notEqual(result.status, 0); assertNoTarget(f);
    for (const forbidden of [encoded, syntheticKey, syntheticMarker]) assert.ok(!(result.stdout + result.stderr).includes(forbidden));
  }
  const result = run("true", encoded); assert.equal(result.status, 0, result.stderr); assert.deepEqual(fs.readFileSync(f.target), bytes);
  for (const forbidden of [encoded, syntheticKey, syntheticMarker, fields.GOOGLE_APP_ID]) assert.ok(!(result.stdout + result.stderr).includes(forbidden));
});

test("Both separate CI jobs obtain the original from the masked repository secret before their existing check and signed export", () => {
  const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "ios-testflight.yml"), "utf8");
  const jobs = name => {
    const lines = workflow.split(/\r?\n/), start = lines.findIndex(line => line === `  ${name}:`);
    assert.ok(start >= 0, name); let end = start + 1;
    while (end < lines.length && !/^  [a-z][a-z_]*:$/.test(lines[end])) end++;
    return lines.slice(start, end).join("\n");
  };
  for (const [job, helper, boundary] of [["checks", "node scripts/prepare-firebase-ios-config.mjs", "../scripts/build-ios-testflight.ps1 -Step Check"],
    ["signing", "node mobile/scripts/prepare-firebase-ios-config.mjs", "./scripts/build-ios-testflight.ps1 -Step Export"]]) {
    const section = jobs(job), step = section.split(/(?=^      - name:)/m).find(block => block.includes(helper));
    assert.ok(step, `${job} must prepare its own fresh checkout`);
    assert.match(step, /IOS_NATIVE_PUSH:\s*\$\{\{ inputs\.native_push \}\}/);
    assert.match(step, /IOS_FIREBASE_PLIST_BASE64:\s*\$\{\{ secrets\.IOS_FIREBASE_PLIST_BASE64 \}\}/);
    assert.ok(step.indexOf(helper) < step.indexOf(boundary), `${job} must transfer before the existing protected build action`);
    assert.ok(step.includes("if ($LASTEXITCODE -ne 0)"));
  }
  assert.match(jobs("signing"), /environment: ios-testflight/);
  assert.match(workflow, /native_push:[\s\S]*?type: boolean[\s\S]*?default: false/);
  assert.doesNotMatch(workflow, /vars\.IOS_FIREBASE_PLIST_BASE64/);
  assert.doesNotMatch(workflow, /<plist[\s>]|AIza[A-Za-z0-9_-]{35}/);
});
