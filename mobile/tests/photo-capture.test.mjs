import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { inspectProject, mobileRoot } from "../scripts/check-ios.mjs";

// Native APIs still need compilation and picker/device tests on a Mac/iPhone.
// These checks cover the declared purpose strings and the actual injected JS.
// Apple confirms default iOS WKWebView file upload support here:
// https://developer.apple.com/documentation/webkit/wkuidelegate/webview(_:runopenpanelwith:initiatedbyframe:completionhandler:)
// Camera purpose strings are required before camera access:
// https://developer.apple.com/documentation/bundleresources/information-property-list/nscamerausagedescription
const scene = fs.readFileSync(path.join(mobileRoot, "ios/App/App/SceneDelegate.swift"), "utf8");
const capabilitySource = scene.match(/let photoCaptureSource = """\r?\n([\s\S]*?)\r?\n\s*"""/)?.[1];

test("Photo inputs declare specific opt-in purposes without adding unrelated device permissions", async () => {
  const { info } = await inspectProject();
  assert.match(info.NSCameraUsageDescription, /Revier-Fotohelfer/);
  assert.match(info.NSCameraUsageDescription, /wählst/);
  assert.match(info.NSPhotoLibraryUsageDescription, /Foto auswählen/);
  for (const key of ["NSMicrophoneUsageDescription", "NSPhotoLibraryAddUsageDescription", "NSLocationWhenInUseUsageDescription", "NSLocationAlwaysAndWhenInUseUsageDescription"]) {
    assert.equal(info[key], undefined, key);
  }
  assert.doesNotMatch(scene, /PHPhotoLibrary\.(?:requestAuthorization|shared)|AVCaptureDevice\.requestAccess|UIImageWriteToSavedPhotosAlbum/);
});

test("Native capability is installed before page scripts only in the main frame and existing own-origin policy", () => {
  assert.ok(capabilitySource);
  const candidates = JSON.parse(scene.match(/let photoCaptureOrigins = (\[[^\r\n]+\])/)?.[1]);
  assert.deepEqual(candidates, ["https://jagdlatein.de", "https://www.jagdlatein.de", "https://jagdlatein-sandbox.vercel.app"]);
  assert.match(scene, /\.filter \{ WebsitePolicy\.isWebsiteURL\(\$0\) \}/);
  assert.match(scene, /source: photoCaptureSource, injectionTime: \.atDocumentStart, forMainFrameOnly: true/);
  assert.doesNotMatch(capabilitySource, /fetch\(|postMessage|cookie|localStorage|sessionStorage/);
});

function runCapability(allowedOrigins, origin, mainFrame = true) {
  const window = { location: { origin } };
  window.top = mainFrame ? window : {};
  vm.runInNewContext(capabilitySource.replace("\\(originsJSON)", JSON.stringify(allowedOrigins)), { window });
  return window;
}

test("Actual capability script rejects foreign pages, embedded frames and the other build environment", () => {
  const production = ["https://jagdlatein.de", "https://www.jagdlatein.de"];
  const sandbox = ["https://jagdlatein-sandbox.vercel.app"];
  for (const origin of production) {
    const window = runCapability(production, origin);
    assert.equal(window.jagdlateinPhotoCapture, true);
    assert.deepEqual(Object.getOwnPropertyDescriptor(window, "jagdlateinPhotoCapture"), {
      value: true, writable: false, configurable: false, enumerable: false,
    });
    assert.equal(Reflect.set(window, "jagdlateinPhotoCapture", false), false);
    assert.equal(Reflect.deleteProperty(window, "jagdlateinPhotoCapture"), false);
    assert.equal(runCapability(production, origin, false).jagdlateinPhotoCapture, undefined);
    assert.equal(runCapability(sandbox, origin).jagdlateinPhotoCapture, undefined);
  }
  assert.equal(runCapability(sandbox, sandbox[0]).jagdlateinPhotoCapture, true);
  for (const origin of [sandbox[0], "http://jagdlatein.de", "https://jagdlatein.de.evil.example", "https://evil.example", "null"]) {
    assert.equal(runCapability(production, origin).jagdlateinPhotoCapture, undefined, origin);
  }
});
