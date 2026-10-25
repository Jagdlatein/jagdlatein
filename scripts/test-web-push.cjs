// All permissions, browser storage, workers, messaging and HTTP requests are
// isolated doubles. These tests never register a real recipient or send push.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const config = createLoader()('lib/firebase-web-config.js');
const vapid = 'A'.repeat(87), fid = 'c'.repeat(22), rotated = 'd'.repeat(22);
const settle = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
function deferred() { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes;reject=no; }); return {promise,resolve,reject}; }

function fixture(options = {}) {
  const calls = [], statuses = [], records = options.records || new Map(); let current = true, registered, message, registrationRemoved=0, messagesRemoved=0;
  const data = options.data || createLoader()('lib/firebase-web-push.js');
  const storage = { getItem: key => records.get(key) ?? null, setItem(key,value) { calls.push(['storage-save',key]); if(options.storageDenied)throw new Error('Synthetic storage denial');records.set(key,value); }, removeItem(key) { calls.push(['storage-remove',key]); records.delete(key); } };
  if (options.saved) records.set(data.WEB_PUSH_STORAGE_KEY, JSON.stringify({version:1,registration:options.saved,kind:'fid',platform:'web'}));
  const worker = { scope:'https://jagdlatein.de/push/',active:{scriptURL:'https://jagdlatein.de/firebase-messaging-sw.js'},
    pushManager:{ async getSubscription() { calls.push(['subscription-read']); return {async unsubscribe() { calls.push(['subscription-unsubscribe']);return true; }}; } },
    async unregister() {calls.push(['worker-unregister']);return true;} };
  const browserWindow = {isSecureContext:true,PushManager:function(){},location:{origin:'https://jagdlatein.de'},localStorage:storage,
    Notification:{permission:options.permission || 'default', requestPermission() {calls.push(['permission']);if(options.permissionWait)return options.permissionWait.promise;this.permission='granted';return Promise.resolve(options.denied?'denied':'granted');}},
    matchMedia:()=>({matches:false})};
  const browserNavigator = {userAgent:'Mozilla/5.0 Firefox/140',platform:'Win32',maxTouchPoints:0,
    serviceWorker:{async register(script,settings){calls.push(['worker-register',script,settings]);return worker;},async getRegistration(scope){calls.push(['worker-read',scope]);return worker;}}};
  const sdk={
    async isSupported(){calls.push(['supported']);return true;},getApps(){return [];},initializeApp(value,name){calls.push(['initialize',value,name]);return {name};},getMessaging(app){calls.push(['messaging',app.name]);return {};},
    onRegistered(_messaging,handler){registered=handler;calls.push(['onRegistered']);return()=>{registrationRemoved++;};},
    onMessage(_messaging,handler){message=handler;calls.push(['onMessage']);return()=>{messagesRemoved++;};},
    async register(_messaging,settings){calls.push(['register',settings]);if(options.registerError)throw new Error('Synthetic registration failure');registered(options.firstFid || fid);},
    async unregister(){calls.push(['sdk-unregister']);},
  };
  const fetcher=async(url,settings)=>{
    calls.push(['fetch',url,settings]);
    if(options.fetcher)return options.fetcher(url,settings);
    return {ok:!options.backendError,json:async()=>options.backendError?{success:false,error:'Synthetic backend failure'}:{success:true}};
  };
  const sdkLoader=async()=>{calls.push(['sdk-load']);return options.sdkWait?options.sdkWait.promise:sdk;};
  const controller=data.createWebPushController({browserWindow,browserNavigator,fetcher,sdkLoader,vapidKey:options.unconfigured?'':vapid,isCurrent:()=>current,onStatus:value=>statuses.push(value)});
  return {data,controller,calls,statuses,records,browserWindow,browserNavigator,sdk,sdkLoader,fetcher,worker,
    emit:value=>registered?.(value),emitMessage:value=>message?.(value),setCurrent:value=>{current=value;},
    get registrationsRemoved(){return registrationRemoved;},get messagesRemoved(){return messagesRemoved;},
    stored:()=>data.readStoredWebPushRegistration(storage)};
}

test('Constructing the control, SSR-ready support checks and an unconfigured button initialise no external service',async()=>{
  const f=fixture({unconfigured:true});
  assert.deepEqual(f.calls,[]);assert.equal(f.data.getWebPushSupport(f.browserWindow,f.browserNavigator),'ready');
  assert.equal(await f.controller.enable(),false);assert.deepEqual(f.calls,[]);assert.deepEqual(f.statuses,[]);f.controller.dispose();
});

test('Explicit activation requests permission first and uses the pinned FID API with its own exact worker registration',async()=>{
  const f=fixture();
  assert.equal(await f.controller.enable(),true);
  assert.equal(f.calls[0][0],'permission');
  const registration=f.calls.find(item=>item[0]==='register');
  assert.equal(registration[1].vapidKey,vapid);assert.equal(registration[1].serviceWorkerRegistration,f.worker);
  assert.deepEqual(f.calls.find(item=>item[0]==='worker-register').slice(1),['/firebase-messaging-sw.js',{scope:'/push/'}]);
  assert.equal(f.calls.find(item=>item[0]==='initialize')[2],config.FIREBASE_WEB_APP_NAME);
  const request=f.calls.find(item=>item[0]==='fetch');
  assert.equal(request[1],'/api/push/register');assert.deepEqual(JSON.parse(request[2].body),{registration:fid,kind:'fid',platform:'web'});
  assert.equal(request[2].credentials,'same-origin');assert.equal(request[2].cache,'no-store');assert.ok(request[2].signal);
  assert.equal(f.stored(),fid);assert.equal(f.statuses.at(-1).phase,'active');
  assert.ok(!f.calls.some(item=>['getToken','analytics','send'].includes(item[0])));
  f.controller.dispose();
});

test('Denied permission creates no Firebase app, worker, registration request or stored recipient',async()=>{
  const f=fixture({denied:true});assert.equal(await f.controller.enable(),false);
  assert.deepEqual(f.calls,[['permission']]);assert.equal(f.stored(),null);assert.equal(f.statuses.at(-1).phase,'denied');f.controller.dispose();
});

test('A pending permission or SDK import cannot continue after unmount or a change of account identity',async()=>{
  const permission=deferred(),f=fixture({permissionWait:permission});
  const activation=f.controller.enable();f.controller.dispose();permission.resolve('granted');assert.equal(await activation,false);
  assert.deepEqual(f.calls,[['permission']]);const count=f.statuses.length;await settle();assert.equal(f.statuses.length,count);
  const sdk=deferred(),g=fixture({sdkWait:sdk});const later=g.controller.enable();await settle();g.setCurrent(false);sdk.resolve(g.sdk);
  assert.equal(await later,false);assert.ok(!g.calls.some(item=>item[0]==='initialize'||item[0]==='fetch'||item[0]==='worker-register'));g.controller.dispose();
});

test('Disposed and stale-account callback objects cannot save recipients, request HTTP or display a foreground message',async()=>{
  const f=fixture();await f.controller.enable();f.controller.dispose();
  const count=f.calls.length,statuses=f.statuses.length;f.emit(rotated);f.emitMessage({notification:{title:'Stale',body:'Ignored'}});await settle();
  assert.equal(f.calls.length,count);assert.equal(f.statuses.length,statuses);assert.equal(f.registrationsRemoved,1);assert.equal(f.messagesRemoved,1);
  const g=fixture();await g.controller.enable();g.setCurrent(false);const before=g.calls.length;g.emit(rotated);await settle();assert.equal(g.calls.length,before);g.controller.dispose();
});

test('FID refresh removes only the previous owned web registration before saving the new one, with no legacy-token API',async()=>{
  const f=fixture({saved:fid});await f.controller.enable();f.emit(rotated);await settle();
  const requests=f.calls.filter(item=>item[0]==='fetch');
  assert.deepEqual(requests.map(item=>[item[1],JSON.parse(item[2].body).registration]),[
    ['/api/push/register',fid],['/api/push/unregister',fid],['/api/push/register',rotated],
  ]);
  assert.equal(f.stored(),rotated);f.controller.dispose();
});

test('SDK or backend failures never become a false successful activation and can be retried explicitly',async()=>{
  const f=fixture({registerError:true});assert.equal(await f.controller.enable(),false);assert.equal(f.statuses.at(-1).phase,'error');assert.equal(f.stored(),null);
  assert.equal(f.registrationsRemoved,1);f.controller.dispose();
  const g=fixture({backendError:true});assert.equal(await g.controller.enable(),false);assert.equal(g.statuses.at(-1).phase,'error');
  assert.equal(g.stored(),fid,'The candidate remains available for explicit cleanup after an uncertain HTTP outcome');g.controller.dispose();
});

test('Blocked local storage cannot silently enable a recipient that logout would no longer be able to identify',async()=>{
  const f=fixture({storageDenied:true});assert.equal(await f.controller.enable(),false);
  assert.ok(f.calls.some(item=>item[0]==='sdk-unregister'));
  assert.ok(!f.calls.some(item=>item[0]==='fetch'));assert.equal(f.statuses.at(-1).phase,'error');f.controller.dispose();
});

test('A throwing or missing storage getter and an unconfirmed write cannot activate an untrackable backend recipient',async()=>{
  const cases=[
    {get(){throw new Error('Synthetic storage getter denial');}},
    {value:null},
    {value:{getItem:()=>null,setItem(){}}},
    {value:{getItem(){throw new Error('Synthetic readback denial');},setItem(){}}},
    {value:{getItem:()=>JSON.stringify({version:1,registration:rotated,kind:'fid',platform:'web'}),setItem(){}}},
  ];
  for(const descriptor of cases){
    const f=fixture();f.controller.dispose();
    Object.defineProperty(f.browserWindow,'localStorage',{configurable:true,...descriptor});
    const statuses=[],control=f.data.createWebPushController({browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader,vapidKey:vapid,onStatus:value=>statuses.push(value)});
    assert.equal(await control.enable(),false);
    assert.ok(f.calls.some(item=>item[0]==='sdk-unregister'),'An unpersisted candidate is rolled back locally');
    assert.ok(!f.calls.some(item=>item[0]==='fetch'&&item[1]==='/api/push/register'),'No authenticated recipient may be stored without its durable cleanup handle');
    assert.ok(!statuses.some(value=>value.phase==='active'));
    assert.equal(statuses.at(-1).phase,'error');control.dispose();
  }
});

test('Only string FIDs can enter the SDK callback queue; a later valid FID can still complete that activation',async()=>{
  const f=fixture();
  f.sdk.register=async()=>{f.emit([fid]);f.emit({toString:()=>fid});f.emit(fid);};
  assert.equal(await f.controller.enable(),true);
  assert.equal(f.calls.filter(item=>item[0]==='storage-save').length,1);
  const requests=f.calls.filter(item=>item[0]==='fetch');
  assert.equal(requests.length,1);assert.equal(JSON.parse(requests[0][2].body).registration,fid);f.controller.dispose();
});

test('Explicit deactivation disables the owned backend record before Firebase and unregisters only our /push/ worker',async()=>{
  const f=fixture({saved:fid,permission:'denied'});assert.equal(await f.controller.disable(),true);
  assert.equal(f.calls[0][0],'fetch');assert.equal(f.calls[0][1],'/api/push/unregister');
  assert.ok(f.calls.findIndex(item=>item[0]==='sdk-unregister')>0);
  assert.ok(f.calls.some(item=>item[0]==='subscription-unsubscribe'));assert.ok(f.calls.some(item=>item[0]==='worker-unregister'));
  assert.ok(!f.calls.some(item=>item[0]==='permission'||item[0]==='worker-register'));
  assert.equal(f.stored(),null);assert.equal(f.statuses.at(-1).phase,'idle');f.controller.dispose();
  const g=fixture({saved:fid});g.worker.scope='https://jagdlatein.de/lernen/';
  await g.controller.disable();assert.ok(!g.calls.some(item=>item[0]==='subscription-unsubscribe'||item[0]==='worker-unregister'));g.controller.dispose();
});

test('Backend deactivation failures retain the cleanup handle and do not prematurely unregister Firebase',async()=>{
  const f=fixture({saved:fid,backendError:true});assert.equal(await f.controller.disable(),false);
  assert.equal(f.stored(),fid);assert.equal(f.statuses.at(-1).phase,'error');assert.ok(!f.calls.some(item=>item[0]==='sdk-load'||item[0]==='sdk-unregister'));f.controller.dispose();
});

test('Unavailable SDK support after the owned server unlink reports partial deactivation and retains its retry handle',async()=>{
  const f=fixture({saved:fid});f.sdk.isSupported=async()=>false;
  assert.equal(await f.controller.disable(),false);
  assert.equal(f.calls.find(item=>item[0]==='fetch')[1],'/api/push/unregister');
  assert.equal(f.stored(),fid);assert.equal(f.controller.hasRegistration(),true);
  assert.ok(!f.calls.some(item=>['sdk-unregister','subscription-unsubscribe','worker-unregister','storage-remove'].includes(item[0])));
  assert.equal(f.statuses.at(-1).phase,'error');assert.equal(f.statuses.at(-1).hasRegistration,true);
  assert.match(f.statuses.at(-1).message,/Kontoverknüpfung ist entfernt/);
  assert.doesNotMatch(f.statuses.at(-1).message,/sind auf diesem Browser deaktiviert/);
  f.sdk.isSupported=async()=>true;
  assert.equal(await f.controller.disable(),true,'A later explicit supported retry can complete the local shutdown');
  assert.equal(f.stored(),null);assert.equal(f.statuses.at(-1).phase,'idle');f.controller.dispose();
});

test('Logout and post-deletion cleanup return partial failure when SDK support is lost, without forgetting the still-live subscription handle',async()=>{
  for(const localOnly of [false,true]){
    const f=fixture({saved:fid});f.sdk.isSupported=async()=>false;
    const settings={localOnly,browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader};
    assert.equal(await f.data.cleanupWebPushForAccountChange(settings),false);
    assert.equal(f.calls.filter(item=>item[0]==='fetch').length,localOnly?0:1);
    assert.equal(f.stored(),fid);
    assert.ok(!f.calls.some(item=>['sdk-unregister','subscription-unsubscribe','worker-unregister','storage-remove'].includes(item[0])));
    f.sdk.isSupported=async()=>true;
    assert.equal(await f.data.cleanupWebPushForAccountChange(settings),true);
    assert.equal(f.stored(),null);f.controller.dispose();
  }
});

test('Logout cleanup cancels active callbacks first; confirmed account deletion can clean the same browser without a now-invalid cookie',async()=>{
  const f=fixture();await f.controller.enable();const before=f.calls.length;
  assert.equal(await f.data.cleanupWebPushForAccountChange({browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader}),true);
  assert.equal(f.calls[before][0],'fetch');assert.equal(f.calls[before][1],'/api/push/unregister');assert.equal(f.stored(),null);
  const count=f.calls.length;f.emit(rotated);await settle();assert.equal(f.calls.length,count);
  const g=fixture({saved:fid});
  assert.equal(await g.data.cleanupWebPushForAccountChange({localOnly:true,browserWindow:g.browserWindow,browserNavigator:g.browserNavigator,fetcher:g.fetcher,sdkLoader:g.sdkLoader}),true);
  assert.ok(!g.calls.some(item=>item[0]==='fetch'));assert.equal(g.stored(),null);g.controller.dispose();
});

test('An already stale cleanup does not dispose a successor control or call its backend, SDK, worker or storage',async()=>{
  const f=fixture();await f.controller.enable();const count=f.calls.length;
  assert.equal(await f.data.cleanupWebPushForAccountChange({isCurrent:()=>false,browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader}),false);
  assert.equal(f.calls.length,count);assert.equal(f.registrationsRemoved,0);
  f.emitMessage({notification:{title:'Current view',body:'Still active'}});assert.match(f.statuses.at(-1).message,/Current view/);f.controller.dispose();
});

test('A successor requests permission in its own click stack but waits for a pending old SDK unregister, whose later phases cannot touch the successor',async()=>{
  const f=fixture();await f.controller.enable();const oldUnregister=deferred();let current=true,deviceEnabled=true;
  f.sdk.unregister=()=>{f.calls.push(['sdk-unregister-pending']);return oldUnregister.promise.then(()=>{deviceEnabled=false;});};
  const cleanup=f.data.cleanupWebPushForAccountChange({localOnly:true,isCurrent:()=>current,browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader});await settle();
  assert.ok(f.calls.some(item=>item[0]==='sdk-unregister-pending'));current=false;
  const g=fixture({data:f.data,records:f.records,firstFid:rotated});
  const register=g.sdk.register;g.sdk.register=async(...args)=>{await register(...args);deviceEnabled=true;};
  const activated=g.controller.enable();assert.equal(g.calls[0][0],'permission');await settle();
  assert.ok(!g.calls.some(item=>['sdk-load','initialize','worker-register','register'].includes(item[0])));
  oldUnregister.resolve();assert.equal(await cleanup,false);assert.equal(await activated,true);
  assert.equal(deviceEnabled,true);assert.equal(g.stored(),rotated);assert.ok(!f.calls.some(item=>['worker-read','subscription-unsubscribe','worker-unregister','storage-remove'].includes(item[0])));g.controller.dispose();
});

test('A timed-out cleanup cannot release its device gate while the actual old unregister is still unsettled',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const f=fixture();await f.controller.enable();const oldUnregister=deferred();
  f.sdk.unregister=()=>{f.calls.push(['sdk-unregister-pending']);return oldUnregister.promise;};
  const cleanup=f.data.cleanupWebPushForAccountChange({localOnly:true,browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader});await settle();
  t.mock.timers.tick(18000);await settle();assert.equal(await cleanup,false);
  const g=fixture({data:f.data,records:f.records,firstFid:rotated});const activated=g.controller.enable();await settle();assert.ok(!g.calls.some(item=>item[0]==='sdk-load'));
  oldUnregister.resolve();assert.equal(await activated,true);assert.equal(g.stored(),rotated);g.controller.dispose();
});

test('Context changes during worker lookup prevent a stale unsubscribe, worker unregister and local record removal',async()=>{
  const f=fixture({saved:fid});const lookup=deferred();let current=true;
  f.browserNavigator.serviceWorker.getRegistration=()=>{f.calls.push(['worker-read-pending']);return lookup.promise;};
  const cleanup=f.data.cleanupWebPushForAccountChange({localOnly:true,isCurrent:()=>current,browserWindow:f.browserWindow,browserNavigator:f.browserNavigator,fetcher:f.fetcher,sdkLoader:f.sdkLoader});await settle();
  assert.ok(f.calls.some(item=>item[0]==='worker-read-pending'));current=false;lookup.resolve(f.worker);assert.equal(await cleanup,false);
  assert.equal(f.stored(),fid);assert.ok(!f.calls.some(item=>['subscription-read','subscription-unsubscribe','worker-unregister','storage-remove'].includes(item[0])));f.controller.dispose();
});

test('Support and storage guards cover iOS home-screen requirements, unsupported browsers and malformed or oversized local records',()=>{
  const f=fixture();const iphone={...f.browserNavigator,userAgent:'iPhone AppleWebKit/605.1.15 Mobile/15E148'};
  assert.equal(f.data.getWebPushSupport(f.browserWindow,iphone),'ios-home-screen');
  assert.equal(f.data.getWebPushSupport(f.browserWindow,{...iphone,standalone:true}),'ready');
  assert.equal(f.data.getWebPushSupport({...f.browserWindow,PushManager:undefined},f.browserNavigator),'unsupported');
  for(const value of ['x','[]','x'.repeat(300),JSON.stringify({version:1,registration:'a'.repeat(64),kind:'fid',platform:'web'}),JSON.stringify({version:1,registration:fid,kind:'token',platform:'web'}),JSON.stringify({version:1,registration:[fid],kind:'fid',platform:'web'})])
    assert.equal(f.data.readStoredWebPushRegistration({getItem:()=>value}),null);
  assert.equal(f.data.readStoredWebPushRegistration({getItem(){throw new Error('Synthetic denial');}}),null);f.controller.dispose();
});

test('Production Firebase cannot initialise from the sandbox, preview or local origin even after an explicit click',async()=>{
  for(const origin of ['https://jagdlatein-sandbox.vercel.app','https://jagdlatein-preview.vercel.app','http://localhost:3000','https://foreign.invalid']){
    const f=fixture({saved:fid});f.browserWindow.location.origin=origin;
    assert.equal(f.data.getWebPushSupport(f.browserWindow,f.browserNavigator),'unavailable');assert.equal(await f.controller.enable(),false);assert.equal(await f.controller.disable(),false);assert.deepEqual(f.calls,[]);f.controller.dispose();
  }
});

test('The worker uses the same named Firebase app, handles data-only messages once and opens only our fixed learning destination',async()=>{
  const events=new Map(),imports=[],notifications=[],opened=[],navigated=[];let background,settings,appName;
  const worker={location:{origin:'https://jagdlatein.test'},addEventListener:(name,callback)=>events.set(name,callback),
    registration:{showNotification:(title,options)=>{notifications.push([title,options]);return Promise.resolve();}},
    clients:{matchAll:async()=>[{url:'https://foreign.invalid/',navigate:async value=>{throw new Error('External client must not be touched');}},{url:'https://jagdlatein.test/fotohelfer',navigate:async value=>{navigated.push(value);return{focus:async()=>{}};}}],openWindow:async value=>opened.push(value)}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'public/firebase-messaging-sw.js'),'utf8'),{self:worker,URL,importScripts:value=>imports.push(value),firebase:{initializeApp(value,name){settings=value;appName=name;return{messaging:()=>({onBackgroundMessage:callback=>{background=callback;}})};}}});
  assert.deepEqual(JSON.parse(JSON.stringify(settings)),config.firebaseWebConfig);assert.equal(appName,config.FIREBASE_WEB_APP_NAME);
  assert.equal(imports.length,2);assert.ok(imports.every(value=>value.startsWith('https://www.gstatic.com/firebasejs/13.1.0/')));
  assert.equal(events.has('fetch'),false,'The notification worker must not replace or intercept offline learning');
  await background({notification:{title:'Already displayed'}});assert.equal(notifications.length,0);
  await background({data:{title:'Jagdlatein',body:'Synthetic message',link:'https://untrusted.invalid'}});assert.equal(notifications.length,1);
  let promise,closed=0,stopped=0;events.get('notificationclick')({stopImmediatePropagation(){stopped++;},notification:{close(){closed++;},data:{link:'javascript:alert(1)'}},waitUntil(value){promise=value;}});await promise;
  assert.equal(closed,1);assert.equal(stopped,1);assert.deepEqual(navigated,['https://jagdlatein.test/lernen']);assert.deepEqual(opened,[]);
});

test('Pinned official SDK imports stay behind explicit actions and the public worker bypass is exact, not a broader unauthenticated subtree',async()=>{
  const source=fs.readFileSync(path.join(root,'lib/firebase-web-push.js'),'utf8');
  assert.match(source,/async function loadFirebaseMessaging\(\)[\s\S]*import\(\/\* webpackIgnore: true \*\/ "https:\/\/www\.gstatic\.com\/firebasejs\/13\.1\.0\/firebase-app\.js"\)/);
  assert.match(source,/import\(\/\* webpackIgnore: true \*\/ "https:\/\/www\.gstatic\.com\/firebasejs\/13\.1\.0\/firebase-messaging\.js"\)/);
  assert.doesNotMatch(source,/getToken\(|getAnalytics\(/);
  const load=createLoader({'./lib/account-session-edge':{JL_ACCOUNT_COOKIE:'synthetic',readAccountSessionEdge:async()=>null}});
  const middleware=load('middleware.js').middleware,{NextRequest}=local('next/server');
  assert.equal((await middleware(new NextRequest('https://jagdlatein.test/firebase-messaging-sw.js'))).headers.get('x-middleware-next'),'1');
  for(const suffix of ['/private','-private.js'])assert.equal(new URL((await middleware(new NextRequest('https://jagdlatein.test/firebase-messaging-sw.js'+suffix))).headers.get('location')).pathname,'/preise');
});

test('Installable web metadata uses only existing correctly sized local icons and is present in both router shells without activating push',async()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/manifest.webmanifest'),'utf8'));
  assert.equal(manifest.id,'/');assert.equal(manifest.start_url,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.display,'standalone');
  assert.equal(manifest.name,'Jagdlatein');assert.equal(manifest.short_name,'Jagdlatein');
  assert.deepEqual(manifest.icons.map(item=>item.sizes),['192x192','512x512']);
  for(const icon of manifest.icons){
    assert.match(icon.src,/^\/android_(192|512)\.png$/);assert.equal(icon.type,'image/png');
    const bytes=fs.readFileSync(path.join(root,'public',icon.src.slice(1)));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,icon.sizes);
  }
  assert.ok(!JSON.stringify(manifest).includes('https:'));
  const load=createLoader({'next/head':({children})=>React.createElement(React.Fragment,null,children),'../components/GlobalHomeButton':{__esModule:true,default:()=>null},'../styles/AppBase.css':{},'./globals.css':{}});
  const App=load('pages/_app.js').default;
  const html=local('react-dom/server').renderToStaticMarkup(React.createElement(App,{Component:()=>React.createElement('main',null,'Synthetic page'),pageProps:{}}));
  assert.match(html,/<link rel="manifest" href="\/manifest.webmanifest"/);
  assert.equal(load('app/layout.jsx').metadata.manifest,'/manifest.webmanifest');
  for(const filename of ['pages/_app.js','app/layout.jsx'])assert.doesNotMatch(fs.readFileSync(path.join(root,filename),'utf8'),/requestPermission|serviceWorker\.register|initializeApp|firebase\/|firebasejs/);
  const middleware=createLoader({'./lib/account-session-edge':{JL_ACCOUNT_COOKIE:'synthetic',readAccountSessionEdge:async()=>null}})('middleware.js').middleware,{NextRequest}=local('next/server');
  assert.equal((await middleware(new NextRequest('https://jagdlatein.test/manifest.webmanifest'))).headers.get('x-middleware-next'),'1');
  assert.equal(new URL((await middleware(new NextRequest('https://jagdlatein.test/manifest.webmanifest/private'))).headers.get('location')).pathname,'/preise');
});

test('Account control is absent in native apps and an account switch disposes old handlers before any new state can appear',async()=>{
  const saved=new Map(),dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://jagdlatein.test/konto'});let mounted;
  for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true})){
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  }
  try{
    let platform='native';const controls=[];
    const Component=createLoader({'../hooks/useWebCoursePlatform':{__esModule:true,default:()=>platform},'../lib/firebase-web-config':{firebaseWebVapidKey:vapid},
      '../lib/firebase-web-push':{getWebPushSupport:()=> 'ready',createWebPushController(options){const value={options,disposed:false,enabled:0,hasRegistration:()=>false,enable(){this.enabled++;},dispose(){this.disposed=true;}};controls.push(value);return value;}}})('components/WebPushPreferences.js').default;
    mounted=local('react-dom/client').createRoot(document.getElementById('root'));
    const render=async email=>React.act(async()=>{mounted.render(React.createElement(Component,{account:{email}}));});
    await render('first@example.invalid');assert.equal(document.getElementById('root').children.length,0);assert.equal(controls.length,0);
    platform='browser';await render('first@example.invalid');assert.equal(controls.length,1);assert.equal(controls[0].enabled,0);
    const old=controls[0];await render('second@example.invalid');assert.equal(old.disposed,true);assert.equal(old.options.isCurrent(),false);
    await React.act(async()=>old.options.onStatus({phase:'active',message:'Stale account state'}));assert.ok(!document.body.textContent.includes('Stale account state'));
    await React.act(async()=>document.querySelector('button').click());assert.equal(controls[1].enabled,1);assert.equal(old.enabled,0);
    await React.act(async()=>mounted.unmount());mounted=null;assert.equal(controls[1].disposed,true);
  }finally{if(mounted)await React.act(async()=>mounted.unmount());dom.window.close();for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
});
