import test from "node:test";
import assert from "node:assert/strict";
import { inspectProject } from "../scripts/check-ios.mjs";

test("iOS-Projekt hat eine native Scene und löst seine tatsächlichen Ressourcen auf", async () => {
  const { info, objects, resourceNames } = await inspectProject();
  assert.equal(info.CFBundleDisplayName, "$(JL_APP_DISPLAY_NAME)");
  assert.equal(info.JagdlateinWebsiteEnvironment, "$(IOS_WEBSITE_ENVIRONMENT)");
  const appDefaults = Object.values(objects.XCBuildConfiguration).filter(value => typeof value === "object" && value.buildSettings?.INFOPLIST_FILE === "App/Info.plist");
  assert.equal(appDefaults.length, 2);
  for (const configuration of appDefaults) {
    assert.equal(configuration.buildSettings.IOS_WEBSITE_ENVIRONMENT, "Production");
    assert.equal(configuration.buildSettings.JL_APP_DISPLAY_NAME, "Jagdlatein");
  }
  assert.equal(info.UIApplicationSceneManifest.UISceneConfigurations.UIWindowSceneSessionRoleApplication[0].UISceneDelegateClassName, "$(PRODUCT_MODULE_NAME).SceneDelegate");
  assert.ok(resourceNames.includes("LaunchScreen.storyboard"));
  assert.ok(!resourceNames.includes("public"));
  assert.ok(!resourceNames.includes("capacitor.config.json"));
  const products = Object.values(objects.XCSwiftPackageProductDependency).filter(value => typeof value === "object");
  assert.deepEqual(products.map(value => value.productName.replaceAll('"', "")), ["JagdlateinCore"]);
});

test("Lokale Merkliste hat Datenschutz-API-Grund; Browser-Schutzausnahmen fehlen", async () => {
  const { privacy, info, icon } = await inspectProject();
  assert.ok(privacy.NSPrivacyAccessedAPITypes.some(api => api.NSPrivacyAccessedAPIType === "NSPrivacyAccessedAPICategoryUserDefaults" && api.NSPrivacyAccessedAPITypeReasons.includes("CA92.1")));
  assert.equal(info.NSAppTransportSecurity, undefined);
  assert.equal(icon.width, 1024);
  assert.equal(icon.hasAlpha, false);
});
