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
  const unquote = value => String(value).replaceAll('"', "");
  const requirePath = (file, label) => {
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
  for (const source of ["AppDelegate.swift", "SceneDelegate.swift"]) {
    if (!fs.existsSync(path.join(app, source))) throw new Error(`Swift-Quelle fehlt: ${source}`);
  }
  if (!resourceNames.includes("PrivacyInfo.xcprivacy")) throw new Error("Datenschutzmanifest wird nicht in die App kopiert.");
  if (info.NSAppTransportSecurity?.NSAllowsArbitraryLoads || info.NSAppTransportSecurity?.NSAllowsArbitraryLoadsInWebContent) throw new Error("Unsichere HTTP-Ausnahme im iOS-Projekt.");
  if (info.UIMainStoryboardFile || info.UIApplicationSceneManifest?.UISceneConfigurations?.UIWindowSceneSessionRoleApplication?.some(scene => scene.UISceneStoryboardFile)) throw new Error("Veralteter Browser-Storyboard-Verweis.");
  if (icon.width !== 1024 || icon.height !== 1024 || icon.hasAlpha) throw new Error("App-Icon muss 1024×1024 ohne Transparenz sein.");
  return { info, privacy, icon, resourceNames, objects };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await inspectProject();
  console.log("Xcode-Projektstruktur, Ressourcen, Datenschutzmanifest und Originalsymbol geprüft.");
  console.log("Diese Quellenprüfung kompiliert noch keine iOS-App. Dafür ist Xcode auf einem Mac erforderlich.");
}
