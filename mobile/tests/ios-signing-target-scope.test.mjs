import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import xcode from "xcode";

const mappings = Object.freeze({
  CODE_SIGN_ENTITLEMENTS: "JL_APP_CODE_SIGN_ENTITLEMENTS",
  CODE_SIGN_STYLE: "JL_APP_CODE_SIGN_STYLE",
  DEVELOPMENT_TEAM: "JL_APP_DEVELOPMENT_TEAM",
  CODE_SIGN_IDENTITY: "JL_APP_CODE_SIGN_IDENTITY",
  PROVISIONING_PROFILE_SPECIFIER: "JL_APP_PROVISIONING_PROFILE_SPECIFIER",
});
const defaults = Object.freeze({
  JL_APP_CODE_SIGN_ENTITLEMENTS: "App/App.entitlements",
  JL_APP_CODE_SIGN_STYLE: "Automatic",
  JL_APP_DEVELOPMENT_TEAM: "",
  JL_APP_CODE_SIGN_IDENTITY: "iPhone Developer",
  JL_APP_PROVISIONING_PROFILE_SPECIFIER: "",
});
const unquote = value => typeof value === "string" && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;

function projectObjects() {
  // Parse only the tracked public project, not the Firebase file, profiles or
  // Xcode's generated settings. The real Mac compile remains a separate check.
  const filename = fileURLToPath(new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url));
  const project = xcode.project(filename);
  project.parseSync();
  return project.hash.project.objects;
}

function configurations(objects, owner) {
  assert.ok(owner?.buildConfigurationList, "An actual PBX owner must select its configuration list");
  const list = objects.XCConfigurationList[owner.buildConfigurationList];
  assert.ok(Array.isArray(list?.buildConfigurations));
  return list.buildConfigurations.map(reference => {
    const configuration = objects.XCBuildConfiguration[reference.value];
    assert.equal(configuration?.isa, "XCBuildConfiguration");
    return { id: reference.value, ...configuration };
  });
}

test("Only the actual App target maps all five signing fields to app-scoped overrides in Debug and Release", () => {
  const objects = projectObjects();
  const appTargets = Object.values(objects.PBXNativeTarget).filter(value => typeof value === "object" && unquote(value.name) === "App");
  assert.equal(appTargets.length, 1);
  assert.equal(unquote(appTargets[0].productType), "com.apple.product-type.application");
  const appConfigurations = configurations(objects, appTargets[0]);
  assert.deepEqual(appConfigurations.map(value => unquote(value.name)).sort(), ["Debug", "Release"]);
  for (const configuration of appConfigurations) {
    for (const [standard, appScoped] of Object.entries(mappings)) {
      assert.equal(unquote(configuration.buildSettings[standard]), `$(${appScoped})`, `${configuration.name}: ${standard} must not use a global command-line override`);
    }
  }
  const appIds = new Set(appConfigurations.map(value => value.id));
  for (const [id, configuration] of Object.entries(objects.XCBuildConfiguration)) {
    if (typeof configuration !== "object" || appIds.has(id)) continue;
    for (const appScoped of Object.values(mappings)) {
      assert.equal(Object.hasOwn(configuration.buildSettings, appScoped), false, `${configuration.name} outside App must not own ${appScoped}`);
      assert.equal(Object.values(configuration.buildSettings).some(value => typeof value === "string" && value.includes(`$(${appScoped})`)), false, `${configuration.name} outside App must not consume ${appScoped}`);
    }
  }
});

test("The App's explicit scoped defaults preserve direct-Xcode signing without CI overrides", () => {
  const objects = projectObjects();
  const app = Object.values(objects.PBXNativeTarget).find(value => typeof value === "object" && unquote(value.name) === "App");
  for (const configuration of configurations(objects, app)) {
    for (const [setting, expected] of Object.entries(defaults)) {
      assert.equal(unquote(configuration.buildSettings[setting]), expected, `${configuration.name}: direct-Xcode default ${setting}`);
    }
    assert.equal(unquote(configuration.buildSettings.JL_NATIVE_PUSH_ENABLED), "NO", "A source default must not activate push");
  }
});

test("Project and UI-test signing defaults remain independent of App-only entitlement and profile overrides", () => {
  const objects = projectObjects();
  const projects = Object.values(objects.PBXProject).filter(value => typeof value === "object");
  assert.equal(projects.length, 1);
  for (const configuration of configurations(objects, projects[0])) {
    assert.equal(unquote(configuration.buildSettings.CODE_SIGN_IDENTITY), "iPhone Developer");
    assert.equal(configuration.buildSettings.CODE_SIGN_ENTITLEMENTS, undefined);
    assert.equal(configuration.buildSettings.PROVISIONING_PROFILE_SPECIFIER, undefined);
  }
  const testTargets = Object.values(objects.PBXNativeTarget).filter(value => typeof value === "object" && unquote(value.name) === "AppUITests");
  assert.equal(testTargets.length, 1);
  for (const configuration of configurations(objects, testTargets[0])) {
    assert.equal(unquote(configuration.buildSettings.CODE_SIGN_STYLE), "Automatic");
    assert.equal(configuration.buildSettings.CODE_SIGN_ENTITLEMENTS, undefined);
    assert.equal(configuration.buildSettings.PROVISIONING_PROFILE_SPECIFIER, undefined);
  }
});
