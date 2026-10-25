// Real lifecycle/UI tests with isolated storage, bridge and HTTP doubles only.
// No Firebase app, Apple permission prompt, recipient or live send is created.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),local=createRequire(path.join(root,'package.json')),swc=local('next/dist/build/swc'),React=local('react');
const{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const fid='cABCDEFGHIJKLMNOPQRSTU',second='dABCDEFGHIJKLMNOPQRSTU';
const settle=async()=>{for(let i=0;i<18;i++)await Promise.resolve();};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function fixture(options={}){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://jagdlatein.de/konto'});
  const records=new Map(),calls=[],statuses=[],merged={};let current=true,nextTimer=0;
  const timers=new Map();
  const storage={getItem(key){if(options.readStorageDenied)throw new Error('Synthetic storage denied');return records.get(key)??null;},setItem(key,value){calls.push(['store',key,value]);if(options.storageDenied)throw new Error('Synthetic storage denied');records.set(key,value);},removeItem(key){calls.push(['forget',key]);if(options.removeStorageDenied)throw new Error('Synthetic removal denied');records.delete(key);}};
  Object.defineProperty(dom.window,'localStorage',{configurable:true,value:storage});
  const bridge={
    async status(){calls.push(['native-status']);if(options.statusWait)return options.statusWait.promise;if(options.statusError)throw new Error('Synthetic status failure');return{supported:true,enabled:false,permission:'notDetermined',...options.status};},
    async enable(){calls.push(['native-enable']);if(options.enableWait)return options.enableWait.promise;if(options.enableError)throw new Error('Synthetic enable failure');return options.enableValue||{supported:true,enabled:true,permission:'authorized',registration:fid};},
    async disable(){calls.push(['native-disable']);if(options.disableWait)return options.disableWait.promise;if(options.disableError)throw new Error('Synthetic native cleanup failure');return{supported:true,enabled:false};},
  };
  if(options.noBridge!==true)dom.window.jagdlateinNativePush=bridge;
  const fetcher=async(url,settings)=>{calls.push(['fetch',url,settings]);if(options.fetcher)return options.fetcher(url,settings);return{ok:!options.backendError,json:async()=>options.backendError?{success:false,error:'Synthetic backend failure'}:{success:true}};};
  const cache=new Map();
  function load(relative,overrides={}){
    const filename=path.resolve(root,relative);if(cache.has(filename))return cache.get(filename).exports;const mod={exports:{}};cache.set(filename,mod);
    const{code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
    const req=id=>Object.hasOwn(overrides,id)?overrides[id]:id.endsWith('.module.css')?{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})}:id.startsWith('.')?load(path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`),overrides):local(id);
    new Function('require','module','exports','window','fetch','setTimeout','clearTimeout',code)(req,mod,mod.exports,dom.window,fetcher,(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id;},id=>timers.delete(id));return mod.exports;
  }
  const api=load('lib/native-push-preferences.js');
  if(options.saved)records.set(api.NATIVE_PUSH_STORAGE_KEY,JSON.stringify({version:1,platform:'ios',kind:'fid',registration:options.saved}));
  const controller=api.createNativePushPreferences({isCurrent:()=>current,onStatus:value=>{statuses.push(value);Object.assign(merged,value);}});
  return{dom,records,calls,statuses,merged,timers,bridge,api,controller,load,storage,
    setCurrent:value=>{current=value;},lastFetch:()=>calls.filter(item=>item[0]==='fetch').at(-1),
    fireTimeout(){const target=[...timers].find(([,item])=>item.delay===45000);assert.ok(target,'Expected a bounded native/HTTP timer');timers.delete(target[0]);target[1].fn();},
    async close(){controller.dispose();await settle();dom.window.close();},
  };
}
async function withDom(f,run){
  const saved=new Map();for(const[key,value]of Object.entries({window:f.dom.window,document:f.dom.window.document,navigator:f.dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
  let mounted;
  try{mounted=local('react-dom/client').createRoot(document.getElementById('root'));await run(mounted);}finally{if(mounted)await React.act(async()=>mounted.unmount());for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}await f.close();}
}
const button=text=>[...document.querySelectorAll('button')].find(item=>item.textContent===text);

test('Construction and status initialise no messaging service or recipient; a local FID is not a confirmed account link',async()=>{
  const f=fixture({saved:fid,status:{enabled:true,linked:true,registration:second}});
  assert.deepEqual(f.calls,[]);await f.controller.status();
  assert.deepEqual(f.calls,[['native-status']]);assert.equal(f.merged.linked,false);assert.equal(f.merged.hasRegistration,true);assert.equal(Object.hasOwn(f.merged,'registration'),false);await f.close();
});
test('Explicit native activation persists its cleanup handle before registering the FID under this authenticated account',async()=>{
  const f=fixture();await f.controller.enable();
  assert.deepEqual(f.calls.map(item=>item[0]),['native-enable','store','fetch']);const request=f.lastFetch();assert.equal(request[1],'/api/push/register');assert.deepEqual(JSON.parse(request[2].body),{registration:fid,kind:'fid',platform:'ios'});assert.equal(request[2].credentials,'same-origin');assert.equal(request[2].cache,'no-store');assert.ok(request[2].signal);
  assert.equal(f.api.readNativePushRegistration(),fid);assert.equal(f.merged.linked,true);assert.equal(f.merged.working,false);assert.ok(!JSON.stringify(f.statuses).includes(fid));await f.close();
});
test('Duplicate activation cannot create two native requests or backend registrations',async()=>{
  const pending=deferred(),f=fixture({enableWait:pending});const first=f.controller.enable();const duplicate=f.controller.enable();await settle();assert.equal(f.calls.filter(item=>item[0]==='native-enable').length,1);pending.resolve({supported:true,enabled:true,permission:'authorized',registration:fid});await Promise.all([first,duplicate]);assert.equal(f.calls.filter(item=>item[0]==='fetch').length,1);await f.close();
});
test('Denied or missing native registration does not write a cleanup handle or backend recipient',async()=>{
  for(const value of [{supported:true,permission:'denied'},{supported:false,permission:'notDetermined'},{supported:true,permission:'authorized',registration:'a'.repeat(64)}]){const f=fixture({enableValue:value});await f.controller.enable();assert.ok(!f.calls.some(item=>['store','fetch'].includes(item[0])));assert.notEqual(f.merged.linked,true);assert.equal(f.merged.working,false);await f.close();}
});
test('Blocked storage rolls native activation back before any backend registration',async()=>{
  const f=fixture({storageDenied:true});await f.controller.enable();assert.ok(f.calls.some(item=>item[0]==='native-disable'));assert.ok(!f.calls.some(item=>item[0]==='fetch'));assert.equal(f.merged.linked,false);assert.equal(f.merged.error,true);await f.close();
});
test('A backend registration failure preserves the cleanup handle but cannot confirm an account link',async()=>{
  const f=fixture({backendError:true});await f.controller.enable();assert.equal(f.api.readNativePushRegistration(),fid);assert.equal(f.merged.linked,false);assert.equal(f.merged.error,true);await f.close();
});
test('Disposal or identity change while the native permission/registration operation is pending prevents stale writes and statuses',async()=>{
  for(const dispose of [true,false]){const pending=deferred(),f=fixture({enableWait:pending});const operation=f.controller.enable();await settle();assert.ok(f.calls.some(item=>item[0]==='native-enable'));if(dispose)f.controller.dispose();else f.setCurrent(false);const before=f.statuses.length;pending.resolve({supported:true,enabled:true,permission:'authorized',registration:fid});await operation;assert.ok(!f.calls.some(item=>['store','fetch'].includes(item[0])));assert.equal(f.statuses.length,before);await f.close();}
});
test('A disposed controller cannot invoke old status, enable or disable callbacks',async()=>{
  const f=fixture({saved:fid});f.controller.dispose();await Promise.all([f.controller.status(),f.controller.enable(),f.controller.disable()]);assert.deepEqual(f.calls,[]);await f.close();
});
test('A bounded activation timeout cancels native activation, and a late FID cannot save or register itself',async()=>{
  const pending=deferred(),f=fixture({enableWait:pending});const operation=f.controller.enable();await settle();f.fireTimeout();await settle();await operation;assert.ok(f.calls.some(item=>item[0]==='native-disable'));assert.equal(f.merged.linked,false);assert.equal(f.merged.error,true);const before=f.calls.length;pending.resolve({supported:true,enabled:true,permission:'authorized',registration:fid});await settle();assert.equal(f.calls.length,before);assert.ok(!f.calls.some(item=>item[0]==='fetch'));await f.close();
});
test('Explicit deactivation disables only the owned backend record before native unregister and forgets the local handle after both succeed',async()=>{
  const f=fixture({saved:fid});await f.controller.disable();assert.deepEqual(f.calls.map(item=>item[0]),['fetch','native-disable','forget']);assert.equal(f.lastFetch()[1],'/api/push/unregister');assert.deepEqual(JSON.parse(f.lastFetch()[2].body),{registration:fid,kind:'fid',platform:'ios'});assert.equal(f.api.readNativePushRegistration(),null);assert.equal(f.merged.enabled,false);assert.equal(f.merged.linked,false);await f.close();
});
test('Backend deactivation failure retains the handle and never claims a completed native shutdown',async()=>{
  const f=fixture({saved:fid,backendError:true});await f.controller.disable();assert.equal(f.api.readNativePushRegistration(),fid);assert.ok(!f.calls.some(item=>item[0]==='native-disable'||item[0]==='forget'));assert.equal(f.merged.error,true);assert.ok(!String(f.merged.message).includes('sind auf diesem Gerät deaktiviert'));await f.close();
});
test('Logout cleanup disposes pending controls, waits for the actual native operation, and blocks its stale registration',async()=>{
  const pending=deferred(),f=fixture({saved:fid,enableWait:pending});const operation=f.controller.enable();await settle();const cleanup=f.api.cleanupNativePushForAccountChange();await settle();assert.ok(!f.calls.some(item=>item[0]==='fetch'||item[0]==='native-disable'));pending.resolve({supported:true,enabled:true,permission:'authorized',registration:second});await operation;await cleanup;assert.deepEqual(f.calls.filter(item=>['fetch','native-disable','forget'].includes(item[0])).map(item=>item[0]),['fetch','native-disable','forget']);assert.equal(f.lastFetch()[1],'/api/push/unregister');assert.ok(!f.calls.some(item=>item[0]==='fetch'&&item[1]==='/api/push/register'));assert.equal(f.api.readNativePushRegistration(),null);await f.close();
});
test('Post-deletion local-only cleanup never sends an authenticated backend request',async()=>{
  const f=fixture({saved:fid});assert.equal(await f.api.cleanupNativePushForAccountChange({localOnly:true}),true);assert.deepEqual(f.calls.map(item=>item[0]),['native-disable','forget']);assert.equal(f.api.readNativePushRegistration(),null);await f.close();
});
test('A residual native cleanup failure returns false and retains the handle for an explicit retry',async()=>{
  const f=fixture({saved:fid,disableError:true});assert.equal(await f.api.cleanupNativePushForAccountChange(),false);assert.equal(f.api.readNativePushRegistration(),fid);assert.ok(!f.calls.some(item=>item[0]==='forget'));await f.close();
});
test('Native preference markup is absent without a native bridge and exposes no installation identifier',async()=>{
  const noBridge=fixture({noBridge:true});await withDom(noBridge,async root=>{const Component=noBridge.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(Component,{account:{email:'first@example.invalid'}})));assert.equal(document.getElementById('root').children.length,0);assert.deepEqual(noBridge.calls,[]);});
  const f=fixture({saved:fid,status:{enabled:true,registration:fid}});await withDom(f,async root=>{const Component=f.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(Component,{account:{email:'first@example.invalid'}})));assert.ok(document.body.textContent.includes('Apple-Benachrichtigungen'));assert.ok(!document.body.innerHTML.includes(fid));assert.ok(!document.body.textContent.includes('wurde in dieser Ansicht bestätigt'));assert.equal(f.calls.filter(item=>item[0]==='native-enable'||item[0]==='fetch').length,0);});
});
test('Real account component activation is explicit; old callbacks and late native results are isolated from the next identity',async()=>{
  const pending=deferred(),f=fixture({enableWait:pending});await withDom(f,async root=>{const Component=f.load('components/NativePushPreferences.js').default;const render=async email=>React.act(async()=>root.render(React.createElement(Component,{account:{email}})));
    await render('first@example.invalid');assert.equal(f.calls.filter(item=>item[0]==='native-enable').length,0);const oldButton=button('Aktivieren');assert.ok(oldButton);await React.act(async()=>{oldButton.click();await settle();});assert.equal(f.calls.filter(item=>item[0]==='native-enable').length,1);await render('second@example.invalid');await React.act(async()=>{pending.resolve({supported:true,enabled:true,permission:'authorized',registration:fid});await settle();oldButton.click();await settle();});assert.equal(f.calls.filter(item=>item[0]==='native-enable').length,1);assert.ok(!f.calls.some(item=>item[0]==='fetch'||item[0]==='store'));assert.ok(!document.body.textContent.includes('wurde in dieser Ansicht bestätigt'));
  });
});
test('Real component keeps no confirmed-link claim after a fresh permission denial or a partial deactivation failure',async()=>{
  const f=fixture();await withDom(f,async root=>{const Component=f.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(Component,{account:{email:'first@example.invalid'}})));await React.act(async()=>{button('Aktivieren').click();await settle();});assert.ok(document.body.textContent.includes('wurde in dieser Ansicht bestätigt'));
    f.bridge.enable=async()=>({supported:true,enabled:false,permission:'denied'});await React.act(async()=>{button('Verknüpfung prüfen').click();await settle();});assert.ok(!document.body.textContent.includes('wurde in dieser Ansicht bestätigt'),'Permission denial invalidates a previous view confirmation');
  });
  const g=fixture();await withDom(g,async root=>{const Component=g.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(Component,{account:{email:'first@example.invalid'}})));await React.act(async()=>{button('Aktivieren').click();await settle();});g.bridge.disable=async()=>{throw new Error('Synthetic device cleanup failure');};await React.act(async()=>{button('Deaktivieren').click();await settle();});assert.ok(!document.body.textContent.includes('wurde in dieser Ansicht bestätigt'),'Successful backend unregister invalidates the previous link even if native cleanup fails');assert.ok(document.querySelector('[role="alert"]'));
  });
});

test('Successful component deactivation clears the old handle affordance and offers a fresh activation',async()=>{
  const f=fixture();await withDom(f,async root=>{const Component=f.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(Component,{account:{email:'first@example.invalid'}})));await React.act(async()=>{button('Aktivieren').click();await settle();});assert.ok(button('Deaktivieren'));await React.act(async()=>{button('Deaktivieren').click();await settle();});assert.equal(f.api.readNativePushRegistration(),null);assert.ok(button('Aktivieren'));assert.equal(button('Deaktivieren'),undefined);assert.equal(button('Verknüpfung prüfen'),undefined);assert.ok(!document.body.innerHTML.includes(fid));});
});
test('Transient native status failure remains retryable without activating notifications or contacting the backend',async()=>{
  const f=fixture({statusError:true});await withDom(f,async root=>{const Component=f.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(Component,{account:{email:'first@example.invalid'}})));assert.ok(button('Geräteprüfung wiederholen'));assert.ok(document.querySelector('[role="alert"]'));
    f.bridge.status=async()=>({supported:true,enabled:false,permission:'notDetermined'});await React.act(async()=>{button('Geräteprüfung wiederholen').click();await settle();});assert.ok(button('Aktivieren'));assert.equal(button('Geräteprüfung wiederholen'),undefined);assert.equal(document.querySelector('[role="alert"]'),null,'Successful status retry clears the stale failure message');assert.ok(!f.calls.some(item=>item[0]==='native-enable'||item[0]==='fetch'));});
});
test('Stored cleanup handles accept only a bounded string FID for the exact schema and platform',async()=>{
  const f=fixture();for(const value of [{version:2,platform:'ios',kind:'fid',registration:fid},{version:1,platform:'web',kind:'fid',registration:fid},{version:1,platform:'ios',kind:'token',registration:fid},{version:1,platform:'ios',kind:'fid',registration:[fid]},{version:1,platform:'ios',kind:'fid',registration:'a'.repeat(64)}]){f.records.set(f.api.NATIVE_PUSH_STORAGE_KEY,JSON.stringify(value));assert.equal(f.api.readNativePushRegistration(),null);}for(const raw of ['{','x'.repeat(257),'null']){f.records.set(f.api.NATIVE_PUSH_STORAGE_KEY,raw);assert.equal(f.api.readNativePushRegistration(),null);}await f.close();
});
test('Real StrictMode mount/cleanup cannot publish stale device state or initialise a registration',async()=>{
  const pending=deferred(),f=fixture({statusWait:pending});await withDom(f,async root=>{const Component=f.load('components/NativePushPreferences.js').default;await React.act(async()=>root.render(React.createElement(React.StrictMode,null,React.createElement(Component,{account:{email:'first@example.invalid'}}))));await React.act(async()=>{pending.resolve({supported:true,enabled:false,permission:'notDetermined',registration:fid});await settle();});assert.ok(button('Aktivieren'));assert.ok(!document.body.innerHTML.includes(fid));assert.ok(!f.calls.some(item=>item[0]==='native-enable'||item[0]==='fetch'||item[0]==='store'));});
});

test('A stale cleanup invocation cannot dispose a current account control or touch HTTP, native state or storage',async()=>{
  const f=fixture({saved:fid});assert.equal(await f.api.cleanupNativePushForAccountChange({isCurrent:()=>false}),false);assert.deepEqual(f.calls,[]);assert.equal(f.api.readNativePushRegistration(),fid);await f.controller.enable();assert.ok(f.calls.some(item=>item[0]==='native-enable'));assert.equal(f.merged.linked,true);await f.close();
});
test('A cleanup whose actor changes during its owned HTTP request cannot disable or forget a newer activation',async()=>{
  const http=deferred(),f=fixture({saved:fid,fetcher:async url=>url==='/api/push/unregister'?http.promise:{ok:true,json:async()=>({success:true})}});let oldActor=true;
  const cleanup=f.api.cleanupNativePushForAccountChange({isCurrent:()=>oldActor});await settle();assert.equal(f.lastFetch()[1],'/api/push/unregister');
  oldActor=false;f.setCurrent(false);f.bridge.enable=async()=>{f.calls.push(['native-enable']);return{supported:true,enabled:true,permission:'authorized',registration:second};};const statuses=[];const fresh=f.api.createNativePushPreferences({isCurrent:()=>true,onStatus:value=>statuses.push(value)});const activation=fresh.enable();await settle();assert.ok(!f.calls.some(item=>item[0]==='native-enable'||item[0]==='native-disable'));
  http.resolve({ok:true,json:async()=>({success:true})});assert.equal(await cleanup,false);await activation;assert.equal(f.api.readNativePushRegistration(),second);assert.ok(!f.calls.some(item=>item[0]==='native-disable'||item[0]==='forget'));assert.ok(statuses.some(item=>item.linked===true));fresh.dispose();await f.close();
});
test('An already-started native cleanup holds the device gate until it settles before a fresh account may enable',async()=>{
  const native=deferred(),f=fixture({saved:fid,disableWait:native});let oldActor=true;const cleanup=f.api.cleanupNativePushForAccountChange({isCurrent:()=>oldActor});await settle();assert.ok(f.calls.some(item=>item[0]==='native-disable'));
  oldActor=false;f.setCurrent(false);f.bridge.enable=async()=>{f.calls.push(['native-enable']);return{supported:true,enabled:true,permission:'authorized',registration:second};};const fresh=f.api.createNativePushPreferences({isCurrent:()=>true});const activation=fresh.enable();await settle();assert.ok(!f.calls.some(item=>item[0]==='native-enable'));
  native.resolve({supported:true,enabled:false});assert.equal(await cleanup,false);await activation;assert.equal(f.api.readNativePushRegistration(),second);assert.ok(f.calls.findIndex(item=>item[0]==='native-enable')>f.calls.findIndex(item=>item[0]==='native-disable'));assert.ok(!f.calls.some(item=>item[0]==='forget'));fresh.dispose();await f.close();
});
test('A fresh native status check also waits for an old device cleanup before touching its bridge',async()=>{
  const native=deferred(),f=fixture({saved:fid,disableWait:native});let oldActor=true;const cleanup=f.api.cleanupNativePushForAccountChange({isCurrent:()=>oldActor});await settle();oldActor=false;
  const states=[],fresh=f.api.createNativePushPreferences({isCurrent:()=>true,onStatus:value=>states.push(value)});const status=fresh.status();await settle();assert.ok(!f.calls.some(item=>item[0]==='native-status'));native.resolve({enabled:false});assert.equal(await cleanup,false);await status;assert.equal(f.calls.filter(item=>item[0]==='native-status').length,1);assert.equal(states.at(-1).linked,false);fresh.dispose();await f.close();
});
test('Failed backend or native cleanup releases the gate instead of permanently blocking the next explicit activation',async()=>{
  for(const failure of ['backend','native']){const f=fixture({saved:fid,disableError:failure==='native',fetcher:async url=>url==='/api/push/unregister'&&failure==='backend'?{ok:false,json:async()=>({error:'Synthetic unregister failure'})}:{ok:true,json:async()=>({success:true})}});
    const cleanup=f.api.cleanupNativePushForAccountChange();const fresh=f.api.createNativePushPreferences({isCurrent:()=>true});const activation=fresh.enable();assert.equal(await cleanup,false);await activation;assert.ok(f.calls.some(item=>item[0]==='native-enable'));assert.equal(f.api.readNativePushRegistration(),fid);fresh.dispose();await f.close();}
});
test('A queued stale native action is skipped after its controller is disposed during an older cleanup',async()=>{
  const native=deferred(),f=fixture({saved:fid,disableWait:native});const cleanup=f.api.cleanupNativePushForAccountChange();await settle();const fresh=f.api.createNativePushPreferences({isCurrent:()=>true});const activation=fresh.enable();fresh.dispose();native.resolve({enabled:false});assert.equal(await cleanup,true);await activation;assert.ok(!f.calls.some(item=>item[0]==='native-enable'));assert.equal(f.api.readNativePushRegistration(),null);await f.close();
});

test('A timed-out cleanup retains the gate through a delayed native preflight and unregister side effect',async()=>{
  const native=deferred(),f=fixture({saved:fid});let deviceEnabled=true;
  f.bridge.disable=async()=>{f.calls.push(['native-disable-preflight']);await native.promise;deviceEnabled=false;f.calls.push(['native-unregister-effect']);return{enabled:false};};
  f.bridge.enable=async()=>{f.calls.push(['native-enable']);deviceEnabled=true;return{supported:true,enabled:true,permission:'authorized',registration:second};};
  const cleanup=f.api.cleanupNativePushForAccountChange();await settle();f.fireTimeout();assert.equal(await cleanup,false);
  const states=[],fresh=f.api.createNativePushPreferences({onStatus:value=>states.push(value)});const activation=fresh.enable();await settle();assert.ok(!f.calls.some(item=>item[0]==='native-enable'));assert.ok(!states.some(item=>item.linked===true));
  native.resolve();await activation;assert.equal(deviceEnabled,true);assert.ok(f.calls.findIndex(item=>item[0]==='native-unregister-effect')<f.calls.findIndex(item=>item[0]==='native-enable'));assert.equal(f.api.readNativePushRegistration(),second);assert.ok(states.some(item=>item.linked===true));fresh.dispose();await f.close();
});

test('Ordinary deactivation retains a late native effect behind the gate after timeout or disposal',async()=>{
  for(const mode of ['timeout','dispose']){const pending=deferred(),f=fixture({saved:fid});let deviceEnabled=true;
    f.bridge.disable=async()=>{f.calls.push(['native-disable-preflight']);await pending.promise;deviceEnabled=false;f.calls.push(['native-unregister-effect']);return{enabled:false};};
    f.bridge.enable=async()=>{f.calls.push(['native-enable']);deviceEnabled=true;return{supported:true,enabled:true,permission:'authorized',registration:second};};
    const disabling=f.controller.disable();await settle();if(mode==='timeout')f.fireTimeout();else f.controller.dispose();await disabling;f.controller.dispose();
    const fresh=f.api.createNativePushPreferences();const enabling=fresh.enable();await settle();assert.ok(!f.calls.some(item=>item[0]==='native-enable'));pending.resolve();await enabling;assert.equal(deviceEnabled,true);assert.equal(f.api.readNativePushRegistration(),second);fresh.dispose();await f.close();
  }
});
test('A queued activation has a bounded UI wait but cannot cancel or overtake the earlier unresolved native operation',async()=>{
  const pending=deferred(),f=fixture({saved:fid,disableWait:pending});const cleanup=f.api.cleanupNativePushForAccountChange();await settle();f.fireTimeout();assert.equal(await cleanup,false);
  const states=[],fresh=f.api.createNativePushPreferences({onStatus:value=>states.push(value)});const waiting=fresh.enable();await settle();f.fireTimeout();await waiting;assert.ok(!f.calls.some(item=>item[0]==='native-enable'));assert.equal(f.calls.filter(item=>item[0]==='native-disable').length,1,'A waiter has not acquired this device and cannot cancel the earlier action');assert.equal(states.at(-1).working,false);assert.ok(states.some(item=>item.error===true));
  pending.resolve({enabled:false});await settle();assert.ok(!f.calls.some(item=>item[0]==='native-enable'),'A timed-out waiter never auto-retries');await fresh.enable();assert.equal(f.calls.filter(item=>item[0]==='native-enable').length,1);fresh.dispose();await f.close();
});
test('A timed-out owned POST also remains in the device lease until its actual backend effect finishes',async()=>{
  const http=deferred();let backendEnabled=true;
  const f=fixture({saved:fid,fetcher:async url=>{if(url==='/api/push/unregister'){await http.promise;backendEnabled=false;return{ok:true,json:async()=>({success:true})};}backendEnabled=true;return{ok:true,json:async()=>({success:true})};}});
  const cleanup=f.api.cleanupNativePushForAccountChange();await settle();f.fireTimeout();assert.equal(await cleanup,false);const fresh=f.api.createNativePushPreferences();const enabling=fresh.enable();await settle();assert.ok(!f.calls.some(item=>item[0]==='native-enable'));http.resolve();await enabling;assert.equal(backendEnabled,true);assert.equal(f.lastFetch()[1],'/api/push/register');fresh.dispose();await f.close();
});
