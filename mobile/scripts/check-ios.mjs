import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "plist";
import xcode from "xcode";
import sharp from "sharp";

export const mobileRoot = fileURLToPath(new URL("../", import.meta.url));

export async function inspectProject(root = mobileRoot) {
  const app = path.join(root, "ios/App/App");
  const pbx = path.join(root, "ios/App/App.xcodeproj/project.pbxproj");
  const project = xcode.project(pbx);
  project.parseSync();
  const objects = project.hash.project.objects;
  const firebaseConfigPath = path.join(app, "GoogleService-Info.plist");
  const appConfigurations = Object.values(objects.XCBuildConfiguration).filter(value => typeof value === "object" && value.buildSettings?.INFOPLIST_FILE === "App/Info.plist");
  const firebaseRequired = process.env.JL_NATIVE_PUSH_ENABLED === "YES" || appConfigurations.some(value => value.buildSettings.JL_NATIVE_PUSH_ENABLED === "YES");
  const unquote = value => String(value).replaceAll('"', "");
  const requirePath = (file, label) => {
    // The real public Firebase config may be absent in an explicitly disabled
    // preview. Xcode's conditional copy phase rejects YES without that file.
    if (path.resolve(file) === path.resolve(firebaseConfigPath) && !firebaseRequired) return;
    if (!fs.existsSync(file)) throw new Error(`Xcode-Verweis fehlt: ${label}`);
  };
  const mainGroup = Object.values(objects.PBXProject).find(value => typeof value === "object").mainGroup;
  const visit = (id, parent) => {
    const group = objects.PBXGroup[id] ?? objects.PBXVariantGroup[id];
    if (group) {
      const directory = group.path ? path.resolve(parent, unquote(group.path)) : parent;
      for (const child of group.children) visit(child.value, directory);
      return;
    }
    const file = objects.PBXFileReference[id];
    if (!file) throw new Error(`Unbekannter Xcode-Dateiverweis: ${id}`);
    if (unquote(file.sourceTree) === "BUILT_PRODUCTS_DIR") return;
    requirePath(path.resolve(parent, unquote(file.path)), file.path);
  };
  visit(mainGroup, path.join(root, "ios/App"));
  for (const config of Object.values(objects.XCBuildConfiguration).filter(value => typeof value === "object")) {
    if (config.baseConfigurationReference && !objects.PBXFileReference[config.baseConfigurationReference]) {
      throw new Error(`Fehlende Xcode-Basiskonfiguration: ${config.baseConfigurationReference}`);
    }
  }
  requirePath(path.join(root, "ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme"), "Gemeinsames App-Scheme");
  const resources = Object.values(objects.PBXResourcesBuildPhase).filter(value => typeof value === "object").flatMap(phase => phase.files.map(file => file.value));
  const resourceNames = resources.map(id => objects.PBXBuildFile[id].fileRef_comment);
  const info = parse(fs.readFileSync(path.join(app, "Info.plist"), "utf8"));
  const privacy = parse(fs.readFileSync(path.join(app, "PrivacyInfo.xcprivacy"), "utf8"));
  const icon = await sharp(path.join(app, "Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")).metadata();
  const localPackages = Object.values(objects.XCLocalSwiftPackageReference).filter(value => typeof value === "object");
  for (const reference of localPackages) {
    const relative = reference.relativePath.replaceAll('"', "");
    if (!fs.existsSync(path.resolve(root, "ios/App", relative, "Package.swift"))) throw new Error(`Lokales Swift-Paket fehlt: ${relative}`);
  }
  for (const source of ["AppDelegate.swift", "SceneDelegate.swift", "NativePush.swift"]) {
    if (!fs.existsSync(path.join(app, source))) throw new Error(`Swift-Quelle fehlt: ${source}`);
  }
  if (!resourceNames.includes("PrivacyInfo.xcprivacy")) throw new Error("Datenschutzmanifest wird nicht in die App kopiert.");
  if (info.NSAppTransportSecurity?.NSAllowsArbitraryLoads || info.NSAppTransportSecurity?.NSAllowsArbitraryLoadsInWebContent) throw new Error("Unsichere HTTP-Ausnahme im iOS-Projekt.");
  if (info.UIMainStoryboardFile || info.UIApplicationSceneManifest?.UISceneConfigurations?.UIWindowSceneSessionRoleApplication?.some(scene => scene.UISceneStoryboardFile)) throw new Error("Veralteter Browser-Storyboard-Verweis.");
  if (icon.width !== 1024 || icon.height !== 1024 || icon.hasAlpha) throw new Error("App-Icon muss 1024×1024 ohne Transparenz sein.");
  const firebaseConfigurationPresent = fs.existsSync(firebaseConfigPath);
  if (firebaseConfigurationPresent) {
    const firebase = parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    if (firebase.BUNDLE_ID !== "de.jagdlatein.app" || firebase.PROJECT_ID !== "jagdlatein-a17b1" ||
        firebase.GCM_SENDER_ID !== "1084120782155" || firebase.GOOGLE_APP_ID !== "1:1084120782155:ios:1704651867d85968da44ce") {
      throw new Error("Firebase-Konfiguration gehört nicht zur freigegebenen Apple-App.");
    }
  }
  return { info, privacy, icon, resourceNames, objects, firebaseConfigurationPresent };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await inspectProject();
  console.log("Xcode-Projektstruktur, Ressourcen, Datenschutzmanifest und Originalsymbol geprüft.");
  console.log("Diese Quellenprüfung kompiliert noch keine iOS-App. Dafür ist Xcode auf einem Mac erforderlich.");
}
