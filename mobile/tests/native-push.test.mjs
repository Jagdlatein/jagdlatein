import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { inspectProject, mobileRoot } from '../scripts/check-ios.mjs';

const app = path.join(mobileRoot, 'ios/App/App');
const native = fs.readFileSync(path.join(app, 'NativePush.swift'), 'utf8');
const scene = fs.readFileSync(path.join(app, 'SceneDelegate.swift'), 'utf8');
const delegate = fs.readFileSync(path.join(app, 'AppDelegate.swift'), 'utf8');
const policy = fs.readFileSync(path.join(mobileRoot, 'core/Sources/JagdlateinCore/NativePushPolicy.swift'), 'utf8');
const source = native.match(/static let script = #"""\r?\n([\s\S]*?)\r?\n\s*"""#/)?.[1];

function bridge(origin, mainFrame = true, available = true) {
  const calls = [], window = { location: { origin } };
  window.top = mainFrame ? window : {};
  if (available) window.webkit = { messageHandlers: { jagdlateinNativePush: { postMessage: body => { calls.push(body); return Promise.resolve({ supported:true, permission:'authorized', enabled:true }); } } } };
  vm.runInNewContext(source, { window });
  return { window, calls };
}

test('Native capability installs one frozen main-frame Promise bridge without network or identifiers on entry', async () => {
  assert.ok(source);
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|cookie|registration|console\./);
  for (const origin of ['https://jagdlatein.de','https://www.jagdlatein.de']) {
    const f = bridge(origin);
    assert.equal(f.calls.length, 0);
    assert.equal(Object.isFrozen(f.window.jagdlateinNativePush), true);
    assert.equal(Reflect.deleteProperty(f.window,'jagdlateinNativePush'), false);
    for (const action of ['status','enable','disable']) {
      assert.equal((await f.window.jagdlateinNativePush[action]()).supported, true);
      assert.deepEqual(Object.keys(f.calls.at(-1)), ['action']);
      assert.equal(f.calls.at(-1).action, action);
    }
  }
});

test('Actual bridge JS never exposes APIs in foreign frames, other environments or ordinary browsers', () => {
  for (const origin of ['https://jagdlatein-sandbox.vercel.app','http://jagdlatein.de','https://jagdlatein.de.evil.test','https://evil.test','null'])
    assert.equal(bridge(origin).window.jagdlateinNativePush, undefined, origin);
  assert.equal(bridge('https://jagdlatein.de',false).window.jagdlateinNativePush,undefined);
  assert.equal(bridge('https://jagdlatein.de',true,false).window.jagdlateinNativePush,undefined);
  assert.match(scene, /addScriptMessageHandler\(pushBridge, contentWorld: \.page, name: "jagdlateinNativePush"\)/);
  assert.match(scene, /source: NativePushBridge\.script, injectionTime: \.atDocumentStart, forMainFrameOnly: true/);
});

test('Push is default-off, FID-only, manually mapped and does not initialise Firebase or request permissions at app launch', async () => {
  const { info, objects, resourceNames } = await inspectProject();
  assert.equal(info.FirebaseMessagingAutoInitEnabled, false);
  assert.equal(info.FirebaseMessagingInstallationIdEnabled, true);
  assert.equal(info.FirebaseAppDelegateProxyEnabled, false);
  assert.equal(info.FIREBASE_ANALYTICS_COLLECTION_ENABLED, false);
  assert.equal(info.JagdlateinNativePushEnabled, '$(JL_NATIVE_PUSH_ENABLED)');
  for (const config of Object.values(objects.XCBuildConfiguration).filter(value=>value?.buildSettings?.JL_NATIVE_PUSH_ENABLED !== undefined)) {
    assert.equal(config.buildSettings.JL_NATIVE_PUSH_ENABLED, 'NO');
    assert.equal(config.buildSettings.CODE_SIGN_ENTITLEMENTS, '"$(JL_APP_CODE_SIGN_ENTITLEMENTS)"');
    assert.equal(config.buildSettings.JL_APP_CODE_SIGN_ENTITLEMENTS, 'App/App.entitlements');
  }
  assert.ok(!resourceNames.includes('GoogleService-Info.plist'), 'An absent optional config is not a mandatory Xcode resource');
  const copyPhase=Object.values(objects.PBXShellScriptBuildPhase).find(value=>value?.name==='"Optional Firebase configuration"');
  assert.ok(copyPhase);assert.match(copyPhase.shellScript,/JL_NATIVE_PUSH_ENABLED/);
  assert.doesNotMatch(delegate,/FirebaseApp\.configure|requestAuthorization|registerForRemoteNotifications\(/);
  assert.match(delegate,/didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data/);
  assert.match(native,/Messaging\.messaging\(\)\.apnsToken = token/);
  assert.match(native,/didReceiveRegistration installationId: String\?/);
  assert.match(native,/Messaging\.messaging\(\)\.register \{/);
  assert.match(native,/Messaging\.messaging\(\)\.unregister \{/);
  assert.ok((native.match(/\.isAutoInitEnabled = false/g)||[]).length>=3);
  assert.doesNotMatch(native,/\.token\s*\(|didReceiveRegistrationToken|print\(|NSLog\(|(?:isAutoInitEnabled|autoInitEnabled) = true/);
});

test('Source boundaries preserve independent origin, account, navigation and explicit-consent guards', () => {
  assert.match(native,/NativePushPolicy\.allowsMessage/);
  assert.match(native,/message\.webView === webView/);
  assert.match(native,/accountOnly: action != "disable"/);
  assert.match(native,/hasSession \|\| action == "disable"/);
  assert.match(native,/cookie\.name == "jl_account_session" && cookie\.isSecure && cookie\.isHTTPOnly/);
  assert.match(native,/self\?\.generation == ticket/);
  assert.match(native,/cookiesDidChange/);
  assert.match(native,/try await center\.requestAuthorization/);
  assert.match(native,/#if targetEnvironment\(simulator\) \|\| DEBUG/);
  assert.match(policy,/de\.jagdlatein\.app/);
  assert.match(policy,/jagdlatein-a17b1/);
  assert.match(policy,/1084120782155/);
  assert.doesNotMatch(native,/SecTask|SecCode|evaluateJavaScript|URLSession|httpBody|setValue\(.+Cookie/);
});

test('Pinned SDK products and source/resource references resolve without adding Analytics or a Firebase secret', async () => {
  const { objects }=await inspectProject();
  const refs=Object.values(objects.XCRemoteSwiftPackageReference).filter(value=>typeof value==='object');
  const firebase=refs.find(value=>String(value.repositoryURL).includes('firebase/firebase-ios-sdk.git'));
  assert.ok(firebase);assert.equal(firebase.requirement.kind,'exactVersion');assert.equal(firebase.requirement.version,'13.1.1');
  const products=Object.values(objects.XCSwiftPackageProductDependency).filter(value=>typeof value==='object').map(value=>String(value.productName).replaceAll('"',''));
  assert.ok(products.includes('FirebaseCore'));assert.ok(products.includes('FirebaseMessaging'));assert.ok(!products.includes('FirebaseAnalytics'));
  const sources=Object.values(objects.PBXSourcesBuildPhase).filter(value=>typeof value==='object').flatMap(value=>value.files).map(item=>objects.PBXBuildFile[item.value]?.fileRef_comment);
  assert.ok(sources.includes('NativePush.swift'));
  const entitlements=fs.readFileSync(path.join(app,'App.entitlements'),'utf8');
  assert.match(entitlements,/<key>aps-environment<\/key>\s*<string>production<\/string>/);
  const configPath=path.join(app,'GoogleService-Info.plist');
  if(fs.existsSync(configPath)) assert.doesNotMatch(fs.readFileSync(configPath,'utf8'),/BEGIN PRIVATE KEY|private_key|client_email|\.p8/);
  else {
    const phase=Object.values(objects.PBXShellScriptBuildPhase).find(value=>value?.name==='"Optional Firebase configuration"');
    assert.match(phase.shellScript,/Apple-Push-Konfiguration fehlt/);
    assert.match(phase.shellScript,/CONFIGURATION/);assert.match(phase.shellScript,/CODE_SIGNING_ALLOWED/);
  }
});

test('Missing real Firebase config is explicitly allowed only while disabled; enabling fails the project gate', async () => {
  const before=process.env.JL_NATIVE_PUSH_ENABLED;
  try {
    delete process.env.JL_NATIVE_PUSH_ENABLED;
    const result=await inspectProject();
    assert.equal(result.firebaseConfigurationPresent,fs.existsSync(path.join(app,'GoogleService-Info.plist')));
    if(!result.firebaseConfigurationPresent){
      process.env.JL_NATIVE_PUSH_ENABLED='YES';
      await assert.rejects(inspectProject(),/GoogleService-Info/);
    }
  } finally { if(before===undefined)delete process.env.JL_NATIVE_PUSH_ENABLED;else process.env.JL_NATIVE_PUSH_ENABLED=before; }
});

test('Native rollback owns its ticket, waits for SDK unregister and quarantines an unresolved revocation', () => {
  assert.match(native,/private var operations = NativePushOperationState\(\)/);
  assert.match(native,/let result = await status\(\)\s+guard isCurrent\(\), operation == ticket/);
  assert.match(native,/disableIfCurrentEnable\(enabledTicket\)/);
  assert.match(native,/operations\.beginDisable\(expectedEnable: expectedEnable\)/);
  assert.equal((native.match(/Messaging\.messaging\(\)\.unregister \{/g)||[]).length,1,'Only the ticket-bound awaited revocation calls the SDK');
  assert.match(native,/try\? await unregisterCurrent\(ticket\)/);
  assert.match(native,/self\.operations\.finishRevocation\(ticket\) else \{ return \}/);
  assert.match(native,/result\.removeValue\(forKey: "registration"\)/);
  assert.match(policy,/guard current == ticket, !revoking else \{ return false \}/);
  assert.match(policy,/if let expected = expectedEnable, !canRevokeCompletedEnable\(expected\)/);
});
