// Actual page actions with isolated permission/network/storage doubles only.
// No real session, account deletion, native bridge or push service is contacted.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const{createLoader,local,root}=require('./helpers/project-module.cjs');
const React=local('react'),swc=local('next/dist/build/swc');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function text(node){if(node==null||typeof node==='boolean')return'';if(Array.isArray(node))return node.map(text).join('');return typeof node==='object'?text(node.props?.children):String(node);}
function find(node,predicate){if(Array.isArray(node)){for(const item of node){const found=find(item,predicate);if(found)return found;}return null;}if(!node||typeof node!=='object')return null;return predicate(node)?node:find(node.props?.children,predicate);}
function withGlobals(t,values){const saved=new Map();for(const[key,value]of Object.entries(values)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}t.after(()=>{for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});}

function homeFixture(t,{web=Promise.resolve(true),native=Promise.resolve(true),nativePlatform='web',sessionReply=()=>({ok:true})}={}){
  const calls=[],slots=[],effects=[],cleanups=[];let cursor=0,tree;
  const hooks={...React,useRef(initial){const index=cursor++;return slots[index]||(slots[index]={current:initial});},useEffect(callback){const index=cursor++;if(!slots[index]){slots[index]={};effects.push(callback);}}};
  const Home=createLoader({react:hooks,'next/head':()=>null,'next/link':({children,...props})=>React.createElement('a',props,children),'next/image':()=>null,'styled-jsx/style':()=>null,'../lib/firebase-web-push':{cleanupWebPushForAccountChange(options){calls.push(['web',options]);return web;}},
    '../lib/native-push-preferences':{cleanupNativePushForAccountChange(options){calls.push(['native',options]);return native;}},
    '../lib/daily-review':{clearReviewHistory(){calls.push(['review']);return true;}},'../lib/offline-learning':{async clearOfflineLearning(){calls.push(['offline']);}},
    '@capacitor/core':{Capacitor:{isNativePlatform:()=>nativePlatform!=='web',getPlatform:()=>nativePlatform}},
    '@capacitor/push-notifications':{PushNotifications:{checkPermissions(){calls.push(['native-permission']);throw new Error('No real permission test');}}},
  })('pages/index.js').default;
  withGlobals(t,{window:{location:{href:'https://jagdlatein.test/'},alert:message=>calls.push(['alert',message])},fetch:async(url,settings)=>{calls.push(['fetch',url,settings]);return sessionReply();}});
  function render(loggedIn=true){cursor=0;tree=Home({loggedIn});for(const effect of effects.splice(0))cleanups.push(effect());return tree;}
  render();const button=find(tree,node=>node.type==='button'&&text(node)==='Logout');assert.ok(button);
  t.after(()=>cleanups.forEach(cleanup=>cleanup?.()));
  return{calls,render,logout:()=>button.props.onClick(),location:window.location,unmount(){for(const cleanup of cleanups.splice(0))cleanup?.();}};
}

function deletionFixture(t,{reply={ok:true,body:{deleted:true}},web=Promise.resolve(true),native=Promise.resolve(true)}={}){
  const slots=[],effects=[],calls=[],cleanups=[];let cursor=0,tree,current=true;
  withGlobals(t,{window:{dispatchEvent:event=>calls.push(['event',event.type])},fetch:async(url,settings)=>{
    const method=settings?.method||'GET';calls.push(['fetch',url,method]);
    if(method==='GET')return{ok:true,json:async()=>({enabled:true,requiresReauthentication:false})};
    if(reply.promise)return reply.promise;
    if(reply.error)throw reply.error;
    return{ok:reply.ok,json:async()=>reply.body};
  }});
  const hooks={...React,useState(initial){const index=cursor++;if(!slots[index])slots[index]={value:typeof initial==='function'?initial():initial};return[slots[index].value,next=>{slots[index].value=typeof next==='function'?next(slots[index].value):next;}];},useRef(initial){const index=cursor++;return slots[index]||(slots[index]={current:initial});},useEffect(callback,dependencies){const index=cursor++;if(!slots[index]){slots[index]={dependencies};effects.push(callback);}}};
  const filename=path.join(root,'pages/konto.js'),source=fs.readFileSync(filename,'utf8')+'\nexport { AccountDeletion as AccountDeletionForTest };';
  const{code}=swc.transformSync(source,{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>{
    if(id==='react')return hooks;if(id==='react/jsx-runtime')return local(id);
    if(id==='next/link')return({children,...props})=>React.createElement('a',props,children);
    if(id.endsWith('.module.css'))return{__esModule:true,default:new Proxy({},{get:(_target,key)=>String(key)})};
    if(id==='../lib/firebase-web-push')return{cleanupWebPushForAccountChange(options){calls.push(['web',options]);return web;}};
    if(id==='../lib/native-push-preferences')return{cleanupNativePushForAccountChange(options){calls.push(['native',options]);return native;}};
    if(id==='../lib/daily-review')return{clearReviewHistory(){calls.push(['review']);return true;}};
    if(id==='../lib/offline-learning')return{async clearOfflineLearning(){calls.push(['offline']);}};
    if(id.startsWith('../components/')||id==='../hooks/useAccountOverview'||id==='../lib/account-page')return{__esModule:true,default:()=>null};
    throw new Error('Unexpected private-page dependency '+id);
  },module,module.exports);
  const Component=module.exports.AccountDeletionForTest;
  const render=()=>{cursor=0;tree=Component({onDeleted:()=>calls.push(['deleted']),isCurrent:()=>current});for(const callback of effects.splice(0))cleanups.push(callback());return tree;};
  render();
  t.after(()=>cleanups.forEach(cleanup=>cleanup?.()));
  return{calls,render,text:()=>text(tree),setCurrent:value=>{current=value;},unmount(){for(const cleanup of cleanups.splice(0))cleanup?.();},async prepare(){await settle();render();find(tree,node=>node.type==='button'&&text(node)==='Kontolöschung vorbereiten').props.onClick();render();
      find(tree,node=>node.type==='input'&&node.props.type!=='checkbox').props.onChange({target:{value:'KONTO LÖSCHEN'}});
      find(tree,node=>node.type==='input'&&node.props.type==='checkbox').props.onChange({target:{checked:true}});render();},
    submit(){const form=find(tree,node=>node.type==='form');assert.ok(form);return form.props.onSubmit({preventDefault(){}});},
  };
}

test('Actual homepage logout waits for both web and native owned-recipient cleanups before deleting the account cookie',async t=>{
  const web=deferred(),native=deferred(),f=homeFixture(t,{web:web.promise,native:native.promise});
  const done=f.logout();assert.deepEqual(f.calls.map(item=>item[0]),['web','native']);
  assert.ok(f.calls.every(item=>typeof item[1].isCurrent==='function'&&item[1].isCurrent()===true));
  web.resolve(true);await settle();assert.equal(f.calls.filter(item=>item[0]==='fetch').length,0);
  native.resolve(true);await done;
  assert.deepEqual(f.calls.map(item=>item[0]),['web','native','fetch','review','offline']);
  assert.equal(f.calls[2][1],'/api/auth/session');assert.equal(f.calls[2][2].method,'DELETE');assert.equal(f.location.href,'/');
});

test('A cleanup that returns false still allows an explicit logout but gives the existing device warning',async t=>{
  const f=homeFixture(t,{web:Promise.resolve(false)});await f.logout();
  assert.equal(f.calls.filter(item=>item[0]==='fetch'&&item[1]==='/api/auth/session').length,1);
  assert.equal(f.calls.filter(item=>item[0]==='alert').length,1);assert.match(f.calls.find(item=>item[0]==='alert')[1],/Benachrichtigungen/);assert.equal(f.location.href,'/');
});

for(const[title,failure]of [['HTTP 500',()=>({ok:false,status:500})],['network failure',()=>{throw new Error('Synthetic session transport failure');}]])
test(`An actual logout with ${title} preserves local learning, reports no completed logout and permits an explicit retry`,async t=>{
  let reply=failure;
  const f=homeFixture(t,{web:Promise.resolve(false),sessionReply:()=>reply()});
  await f.logout();
  assert.deepEqual(f.calls.filter(item=>['web','native','fetch'].includes(item[0])).map(item=>item[0]),['web','native','fetch'],'Push cleanup may already have completed before the session request fails');
  assert.ok(!f.calls.some(item=>item[0]==='review'||item[0]==='offline'),'Do not clear local learning until session removal is confirmed');
  assert.equal(f.location.href,'https://jagdlatein.test/');
  const alerts=f.calls.filter(item=>item[0]==='alert');
  assert.equal(alerts.length,1,'A failed logout must receive a visible explanation');
  assert.doesNotMatch(alerts[0][1],/^Abgemeldet\./);
  reply=()=>({ok:true});
  await f.logout();
  assert.equal(f.calls.filter(item=>item[0]==='fetch').length,2,'The failure releases the busy guard for a new explicit attempt');
  assert.equal(f.calls.filter(item=>item[0]==='review').length,1);
  assert.equal(f.calls.filter(item=>item[0]==='offline').length,1);
  assert.equal(f.location.href,'/');
});

test('Confirmed deletion performs only local cleanup after the successful delete response and waits before emitting the account-deleted event',async t=>{
  const deletion=deferred(),web=deferred(),native=deferred(),f=deletionFixture(t,{reply:deletion,web:web.promise,native:native.promise});await f.prepare();
  const done=f.submit();assert.deepEqual(f.calls.map(item=>item[0]),['fetch','fetch']);assert.equal(f.calls[1][2],'DELETE');
  deletion.resolve({ok:true,json:async()=>({deleted:true})});await settle();
  assert.deepEqual(f.calls.slice(2).map(item=>item[0]),['deleted','web','native']);
  for(const kind of ['web','native']){const options=f.calls.find(item=>item[0]===kind)[1];assert.equal(options.localOnly,true);assert.equal(typeof options.isCurrent,'function');assert.equal(options.isCurrent(),true);}
  web.resolve(true);await settle();assert.ok(!f.calls.some(item=>item[0]==='event'));
  native.resolve(true);await done;f.render();assert.match(f.text(),/Dein Konto ist gelöscht/);
  assert.deepEqual(f.calls.slice(-3),[['review'],['offline'],['event','jagdlatein-account-deleted']]);
});

for(const[title,reply]of [['server rejected',{ok:false,body:{deleted:false,message:'Synthetic refusal'}}],['success without deletion',{ok:true,body:{deleted:false}}],['reauthentication required',{ok:false,body:{code:'DELETION_REAUTH_REQUIRED'}}],['network failure',{error:new Error('Synthetic transport failure')}]] )
test(`A ${title} delete does not unregister either push service or erase local learning`,async t=>{
  const f=deletionFixture(t,{reply});await f.prepare();await f.submit();f.render();
  assert.ok(!f.calls.some(item=>['web','native','deleted','review','offline','event'].includes(item[0])));assert.doesNotMatch(f.text(),/Dein Konto ist gelöscht/);
});

test('Only confirmed deletion may report a partial local push cleanup without repeating its successful server deletion',async t=>{
  const f=deletionFixture(t,{web:Promise.resolve(false)});await f.prepare();await f.submit();f.render();
  assert.match(f.text(),/Dein Konto ist gelöscht/);assert.match(f.text(),/Benachrichtigungen/);
  assert.equal(f.calls.filter(item=>item[0]==='fetch'&&item[2]==='DELETE').length,1);assert.ok(f.calls.some(item=>item[0]==='event'));
});

test('A delete response arriving after the account panel unmounts cannot disable a later page’s active push controls or erase its local learning',async t=>{
  const deletion=deferred(),f=deletionFixture(t,{reply:deletion});await f.prepare();const done=f.submit();f.unmount();
  deletion.resolve({ok:true,json:async()=>({deleted:true})});await done;
  assert.ok(!f.calls.some(item=>['web','native','deleted','review','offline','event'].includes(item[0])));
});

test('A changed account context blocks the former delete before effect cleanup, including a delayed JSON body',async t=>{
  const body=deferred(),f=deletionFixture(t,{reply:{ok:true,body:body.promise}});await f.prepare();const done=f.submit();await settle();f.setCurrent(false);body.resolve({deleted:true});await done;
  assert.ok(!f.calls.some(item=>['web','native','deleted','review','offline','event'].includes(item[0])));
});

test('Logout cannot remove a successor context cookie after unmount or a changed signed-in state, and old iOS APNs never use the Android callback',async t=>{
  const web=deferred(),native=deferred(),f=homeFixture(t,{web:web.promise,native:native.promise,nativePlatform:'ios'});
  assert.ok(!f.calls.some(item=>item[0]==='native-permission'));
  const done=f.logout();await f.logout();assert.equal(f.calls.length,2,'Repeated logout clicks do not duplicate cleanup');
  f.render(false);assert.ok(f.calls.every(item=>item[1].isCurrent()===false));web.resolve(true);native.resolve(true);await done;
  assert.ok(!f.calls.some(item=>['fetch','review','offline'].includes(item[0])));
});

test('Browser/server rendering with no native bridge never initialises push, and absent registrations clean up without network',async()=>{
  const load=createLoader();const Native=load('components/NativePushPreferences.js').default,Web=load('components/WebPushPreferences.js').default;
  const html=local('react-dom/server').renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(Native,{account:{email:'synthetic@example.invalid'}}),React.createElement(Web,{account:{email:'synthetic@example.invalid'}})));
  assert.equal(html,'');assert.equal(await load('lib/native-push-preferences.js').cleanupNativePushForAccountChange(),true);
  assert.equal(await load('lib/firebase-web-push.js').cleanupWebPushForAccountChange(),true);
});
