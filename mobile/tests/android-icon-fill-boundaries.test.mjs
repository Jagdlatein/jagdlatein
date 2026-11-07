import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareProject, writeLauncherResources } from "../scripts/prepare-android-icon-fill.mjs";

const samePath = (a, b) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;

async function withFixture(run) {
  const parent = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(parent, "jagdlatein-icon-boundary-"));
  const source = path.join(root, "MixedSource");
  await fs.mkdir(path.join(source, "android/app"), { recursive: true });
  const gradleFile = path.join(source, "android/app/build.gradle");
  const gradle = 'android { defaultConfig { applicationId "de.jagdlatein.app"; versionCode 3; versionName "1.0.4" } }\n';
  await fs.writeFile(gradleFile, gradle);
  try {
    await run({ root, source, gradleFile, gradle });
    assert.equal(await fs.readFile(gradleFile, "utf8"), gradle, "The synthetic source must remain unchanged");
  } finally {
    // Delete only this test's newly created direct child of the resolved OS temp
    // directory. fs.rm removes junction/symlink entries without following them.
    const actual = await fs.realpath(root);
    assert.ok(samePath(actual, root) && samePath(path.dirname(actual), parent));
    assert.ok(path.basename(actual).startsWith("jagdlatein-icon-boundary-"));
    await fs.rm(actual, { recursive: true });
  }
}

const absent = file => assert.rejects(fs.lstat(file), { code: "ENOENT" });

test("Android icon preparation rejects identical source and output without changing the source", () => withFixture(async ({ source }) => {
  await assert.rejects(prepareProject(source, source), /separate directories/);
}));

test("Android icon preparation rejects output nested inside the source", () => withFixture(async ({ source }) => {
  const output = path.join(source, "new-output");
  await assert.rejects(prepareProject(source, output), /separate directories/);
  await absent(output);
}));

test("Android icon preparation recognizes Windows case variants of the same source parent", { skip: process.platform !== "win32" }, () => withFixture(async ({ root, source }) => {
  const output = path.join(root, "mixedsource", "new-output");
  await assert.rejects(prepareProject(source, output), /separate directories/);
  await absent(path.join(source, "new-output"));
}));

test("Android icon preparation rejects an output ancestor of its source", () => withFixture(async ({ root, source }) => {
  await assert.rejects(prepareProject(source, root), /separate directories/);
}));

test("Android icon preparation resolves an output-parent junction or symlink before checking separation", () => withFixture(async ({ root, source }) => {
  const alias = path.join(root, "source-alias");
  await fs.symlink(source, alias, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(prepareProject(source, path.join(alias, "new-output")), /separate directories/);
  await absent(path.join(source, "new-output"));
}));

test("Android icon preparation preserves an existing sibling output directory", () => withFixture(async ({ root, source }) => {
  const output = path.join(root, "existing-output"), marker = path.join(output, "preserve.txt");
  await fs.mkdir(output);
  await fs.writeFile(marker, "synthetic existing output");
  await assert.rejects(prepareProject(source, output), /already exists/);
  assert.equal(await fs.readFile(marker, "utf8"), "synthetic existing output");
}));

test("Android icon preparation rejects another application ID before creating output", () => withFixture(async ({ root, source, gradleFile, gradle }) => {
  await fs.writeFile(gradleFile, gradle.replace("de.jagdlatein.app", "example.invalid.app"));
  const output = path.join(root, "wrong-app-output");
  try {
    await assert.rejects(prepareProject(source, output), /Expected the reviewed/);
    await absent(output);
  } finally { await fs.writeFile(gradleFile, gradle); }
}));

for (const extension of ["p12", "jks", "keystore", "p8"]) {
  test(`Android icon preparation rejects a synthetic .${extension} by name before reading or copying it`, () => withFixture(async ({ root, source }) => {
    const dummy = path.join(source, "android/app", `fixture.${extension}`);
    await fs.writeFile(dummy, "SYNTHETIC TEST TEXT ONLY; NOT A SIGNING KEY");
    const output = path.join(root, "rejected-output"), originalRead = fs.readFile;
    let dummyRead = false;
    fs.readFile = async (file, ...args) => {
      if (samePath(path.resolve(String(file)), dummy)) {
        dummyRead = true;
        throw Error("The synthetic key file must not be read");
      }
      return originalRead.call(fs, file, ...args);
    };
    try { await assert.rejects(prepareProject(source, output), /must not be read or copied/); }
    finally { fs.readFile = originalRead; }
    assert.equal(dummyRead, false);
    await absent(output);
  }));
}

test("Android icon preparation refuses redirected source directories before copying", () => withFixture(async ({ root, source }) => {
  const target = path.join(root, "synthetic-redirect-target");
  await fs.mkdir(target);
  await fs.symlink(target, path.join(source, "android/redirected"), process.platform === "win32" ? "junction" : "dir");
  const output = path.join(root, "redirected-output");
  await assert.rejects(prepareProject(source, output), /Refusing redirected/);
  await absent(output);
}));

test("Android icon resources reject an unapproved master before creating any destination", () => withFixture(async ({ root }) => {
  const master = path.join(root, "wrong-master.png"), output = path.join(root, "resources");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=", "base64");
  await fs.writeFile(master, png);
  await assert.rejects(writeLauncherResources(output, master), /Approved opaque square master required/);
  await absent(output);
  assert.deepEqual(await fs.readFile(master), png);
}));
