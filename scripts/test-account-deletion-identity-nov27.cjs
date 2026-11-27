// Original account page, account/deletion API and identity guards, with real
// ReactDOM and synthetic in-memory data only. No remote DB/provider/mail.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createLoader,local,root:repo}=require('./helpers/project-module.cjs');
const swc=local('next/dist/build/swc'),React=local('react'),{createRoot}=local('react-dom/client'),{NextRequest}=local('next/server');
const {JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||'jsdom');
const A='synthetic-a@example.invalid',B='synthetic-b@example.invalid',GA='11111111-1111-4111-8111-111111111111',GB='22222222-2222-4222-8222-222222222222',GC='33333333-3333-4333-8333-333333333333';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const propsFor=(email=A,accountKey=GA)=>({email,accountKey,paid:false,admin:false,accessType:'none',subscriptionStatus:null});
const handler=(node,name='onClick')=>{assert.ok(node,'real DOM control exists');const key=Object.keys(node).find(key=>key.startsWith('__reactProps$'));assert.ok(key);return node[key][name];};

function apiFixture(){
 const profiles=new Map([[A,{email:A,account_generation:GA,is_premium:false,is_admin:false}],[B,{email:B,account_generation:GB,is_premium:false,is_admin:false}]]),calls={clients:0,reads:[],deletions:[]};
 const database={from(table){assert.equal(table,'userprofile');let email;return{select(){return this;},ilike(field,value){assert.equal(field,'email');email=value.replace(/\\([\\%_])/g,'$1');return this;},async maybeSingle(){calls.reads.push(email);return{data:profiles.get(email)||null,error:null};}};},async rpc(name,args){assert.equal(name,'delete_jagdlatein_account');calls.deletions.push({...args});if(profiles.get(args.p_email)?.account_generation!==args.p_account_generation)return{data:null,error:{message:'JL_DELETE_ACCOUNT_MISSING'}};profiles.delete(args.p_email);return{data:{deleted:true},error:null};}};
 const context=vm.createContext({process:{env:{ACCOUNT_DELETION_ENABLED:'true',NODE_ENV:'production',JL_SESSION_SECRET:'synthetic-identity-deletion-test-secret-more-than-32-bytes',SUPABASE_URL:'https://database.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-not-a-key'}},Buffer,Date,URL,TextDecoder,Uint8Array,Response,AbortSignal,console,fetch:async()=>{throw Error('No network allowed');}}),cache=new Map();
 function load(relative){const filename=path.resolve(repo,relative);if(filename.endsWith('.json'))return JSON.parse(fs.readFileSync(filename,'utf8'));if(cache.has(filename))return cache.get(filename).exports;const module={exports:{}};cache.set(filename,module);const{code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022'},module:{type:'commonjs'}});vm.runInContext('(function(require,module,exports){'+code+'\n})',context)(id=>{if(id==='@supabase/supabase-js')return{createClient:()=>{calls.clients++;return database;}};if(id.endsWith('/subscription-access'))return{resolveSubscriptionAccess:async()=>({paid:false,paidUntil:null})};if(id==='./course-catalog')return{courses:[]};if(id.startsWith('.'))return load(path.relative(repo,path.resolve(path.dirname(filename),path.extname(id)?id:id+'.js')));return local(id);},module,module.exports);return module.exports;}
 const sessions=load('lib/account-session.js');
 const token=(email=A,generation=GA,old=false)=>sessions.createAccountSession(email,Date.now(),{paid:false,admin:false,authenticatedAt:Math.floor(Date.now()/1000)-(old?601:0),accountGeneration:generation});
 const request=(method,cookie=token(),key=GA,body={confirmation:'KONTO LÖSCHEN',acknowledgeSubscriptions:true})=>new NextRequest('https://jagdlatein.test/api/account/delete',{method,headers:{cookie:'jl_account_session='+cookie,...(method==='DELETE'?{origin:'https://jagdlatein.test','content-type':'application/json',...(key===null?{}:{'x-jagdlatein-delete-account':key})}:{})},...(method==='DELETE'?{body:JSON.stringify(body)}:{})});
 return{profiles,calls,load,token,request,deletion:load('app/api/account/delete/route.js'),account:load('app/api/account/route.js')};
}

async function uiFixture({realOverview=false,onCapabilityRequest,capabilityGate,capabilityBody,deleteGate,deleteBody}={}){
 const api=apiFixture(),dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://jagdlatein.test/konto',pretendToBeVisual:true}),saved=new Map();
 const state={account:propsFor(),cookie:api.token(),reloads:0,requests:[],cleanup:0,events:0,nextAccountGate:null,layoutAction:null};
 const assign=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
 for(const key of['window','document','navigator','HTMLElement','Node','Event'])assign(key,dom.window[key]);assign('IS_REACT_ACT_ENVIRONMENT',true);
 const cleanup=async()=>{state.cleanup++;return true;},clear=()=>{state.cleanup++;return true;};
 dom.window.addEventListener('jagdlatein-account-deleted',()=>state.events++);
 assign('fetch',async(url,options={})=>{
  assert.ok(['/api/account','/api/account/delete','/api/course-progress'].includes(url),'only isolated account routes');const method=options.method||'GET',cookie=state.cookie;
  const entry={url,method,body:options.body||null,key:new Headers(options.headers).get('x-jagdlatein-delete-account'),cookie};state.requests.push(entry);
  const request=new NextRequest('https://jagdlatein.test'+url,{method,headers:{...options.headers,cookie:'jl_account_session='+cookie,...(method==='DELETE'?{origin:'https://jagdlatein.test'}:{})},...(options.body?{body:options.body}:{})});
  if(url==='/api/course-progress')return Response.json({progress:[]});
  if(url==='/api/account'){const response=await api.account.GET(request),gate=state.nextAccountGate;state.nextAccountGate=null;if(gate)await gate.promise;return response;}
  if(method==='GET'){onCapabilityRequest?.(state,api);if(capabilityGate)await capabilityGate.promise;if(capabilityBody)return Response.json(capabilityBody);const current=new NextRequest(request.url,{headers:{cookie:'jl_account_session='+state.cookie}});return api.deletion.GET(current);}
  if(deleteGate)await deleteGate.promise;
  if(deleteBody)return Response.json(deleteBody.body,{status:deleteBody.status||200});
  return api.deletion.DELETE(request);
 });
 const nop=()=>null,asDefault=fn=>({__esModule:true,default:fn}),actualOverview=realOverview?createLoader()('hooks/useAccountOverview.js').default:null;
 const overrides={react:React,'next/link':asDefault(({children,href,...props})=>React.createElement('a',{href,...props},children)),
  '../components/AccountLayout':{...asDefault(({title,children})=>React.createElement('main',{},React.createElement('h1',{},title),children)),AccountError:({error})=>React.createElement('p',{},'Account error '+error.status),ProgressError:nop},
  '../hooks/useAccountOverview':asDefault(realOverview?actualOverview:()=>({account:state.account,progress:[],accountError:null,progressError:null,loading:false,progressLoading:false,reload:()=>state.reloads++})),
  '../lib/usage-analytics':{stopUsageAnalytics:()=>{}},'../lib/firebase-web-push':{cleanupWebPushForAccountChange:cleanup},'../lib/native-push-preferences':{cleanupNativePushForAccountChange:cleanup},
  '../lib/account-page':{getAccountPageProps:()=>({props:{}})},'../lib/offline-learning':{clearOfflineLearning:cleanup},'../lib/daily-review':{clearReviewHistory:clear},'../lib/exam-goal-progress':{clearExamGoalProgress:clear}};
 const filename=path.join(repo,'pages/konto.js'),module={exports:{}},{code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 new Function('require','module','exports',code)(id=>{if(Object.hasOwn(overrides,id))return overrides[id];if(id.endsWith('.module.css'))return{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};if(id.startsWith('../components/'))return asDefault(nop);return local(id);},module,module.exports);
 const Page=module.exports.default,root=createRoot(dom.window.document.getElementById('root'));
 function Wrapper({version}){React.useLayoutEffect(()=>{state.layoutAction?.();state.layoutAction=null;},[version]);return React.createElement(Page,{courses:[]});}
 const act=fn=>React.act(async()=>{await fn?.();for(let i=0;i<12;i++)await Promise.resolve();}),text=()=>dom.window.document.body.textContent,button=label=>[...dom.window.document.querySelectorAll('button')].find(node=>node.textContent===label);
 let version=0,closed=false;
 const render=()=>act(()=>root.render(React.createElement(Wrapper,{version:++version}))),click=node=>act(()=>handler(node)()),form=()=>dom.window.document.querySelector('form');
 const fill=async()=>{await click(button('Kontolöschung vorbereiten'));const input=dom.window.document.querySelector('input:not([type])'),checkbox=dom.window.document.querySelector('input[type="checkbox"]');await act(()=>{handler(input,'onChange')({target:{value:'KONTO LÖSCHEN'}});handler(checkbox,'onChange')({target:{checked:true}});});return{input,checkbox,submit:handler(form(),'onSubmit'),change:handler(input,'onChange'),cancel:handler(button('Abbrechen'))};};
 const submit=()=>act(()=>handler(form(),'onSubmit')({preventDefault(){}}));
 const close=async()=>{if(closed)return;closed=true;await act(()=>root.unmount());dom.window.close();for(const[key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];};
 await render();return{api,state,dom,act,text,button,click,render,fill,submit,form,close};
}

test('Account overview and deletion capability expose the same own generation, not a chosen client target',async()=>{
 const api=apiFixture(),request=api.request('GET'),account=await(await api.account.GET(request)).json(),capability=await(await api.deletion.GET(request)).json();
 assert.equal(account.account.accountKey,GA);assert.equal(account.account.email,A);assert.equal(capability.accountKey,GA);assert.equal(capability.accountEmail,A);assert.equal(capability.requiresReauthentication,false);
 assert.equal(api.calls.deletions.length,0);
});

test('Missing, malformed and foreign target keys are rejected before any database/retention call',async()=>{
 for(const key of[null,'','invalid',GB]){const api=apiFixture(),response=await api.deletion.DELETE(api.request('DELETE',api.token(),key));assert.equal(response.status,409);assert.equal((await response.json()).code,'DELETION_ACCOUNT_CHANGED');assert.equal(api.calls.clients,0);assert.equal(api.calls.deletions.length,0);assert.equal(api.profiles.size,2);}
});

test('Fresh cookie B with A confirmation and recreated same-email cookie cannot mutate any account',async()=>{
 for(const sameEmail of[false,true]){const api=apiFixture();if(sameEmail)api.profiles.set(A,{email:A,account_generation:GC,is_premium:false,is_admin:false});const response=await api.deletion.DELETE(api.request('DELETE',api.token(sameEmail?A:B,sameEmail?GC:GB),GA));assert.equal(response.status,409);assert.equal(api.calls.clients,0);assert.equal(api.calls.deletions.length,0);assert.equal(api.profiles.size,2);}
});

test('Matching confirmation still requires current generation and recent authentication before deletion',async()=>{
 const old=apiFixture();assert.equal((await old.deletion.DELETE(old.request('DELETE',old.token(A,GA,true)))).status,401);assert.equal(old.calls.deletions.length,0);
 const changed=apiFixture();changed.profiles.set(A,{email:A,account_generation:GC,is_premium:false,is_admin:false});assert.equal((await changed.deletion.DELETE(changed.request('DELETE'))).status,401);assert.equal(changed.calls.deletions.length,0);
 const valid=apiFixture(),response=await valid.deletion.DELETE(valid.request('DELETE'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{deleted:true,accountKey:GA});assert.equal(valid.profiles.has(A),false);assert.equal(valid.profiles.has(B),true);
});

test('The shown account A owns the header; cookie switch to B gives 409, clears confirmation and reloads',async()=>{
 const h=await uiFixture();try{const old=await h.fill();h.state.cookie=h.api.token(B,GB);assert.ok(h.text().includes(A));await h.submit();const request=h.state.requests.find(row=>row.method==='DELETE');assert.equal(request.key,GA);assert.deepEqual(JSON.parse(request.body),{confirmation:'KONTO LÖSCHEN',acknowledgeSubscriptions:true});assert.equal(h.api.calls.deletions.length,0);assert.equal(h.api.profiles.size,2);assert.equal(h.state.reloads,1);assert.equal(h.form(),null);assert.match(h.text(),/Kontodaten erneut laden/);await h.act(()=>{old.submit({preventDefault(){}});old.change({target:{value:'KONTO LÖSCHEN'}});old.cancel();});assert.equal(h.state.requests.filter(row=>row.method==='DELETE').length,1);assert.equal(h.state.cleanup,0);}finally{await h.close();}
});

test('Capability from another cookie, same-email recreation or missing binding cannot replace the shown account',async()=>{
 for(const mode of['other','recreated','missing']){const capability=mode==='missing'?{enabled:true,requiresReauthentication:false}:undefined;const h=await uiFixture({capabilityBody:capability,onCapabilityRequest:(state,api)=>{if(mode==='other')state.cookie=api.token(B,GB);if(mode==='recreated'){api.profiles.set(A,{email:A,account_generation:GC,is_premium:false,is_admin:false});state.cookie=api.token(A,GC);}}});try{assert.equal(h.button('Kontolöschung vorbereiten'),undefined);assert.equal(h.form(),null);assert.equal(h.api.calls.deletions.length,0);assert.equal(h.state.requests.filter(row=>row.method==='DELETE').length,0);assert.equal(h.state.reloads,mode==='missing'?0:1);assert.equal(h.state.cleanup,0);}finally{await h.close();}}
});

test('Old form submit/change/cancel cannot affect a newly rendered account or a new confirmation session',async()=>{
 const h=await uiFixture();try{const old=await h.fill();h.state.cookie=h.api.token(B,GB);h.state.account=propsFor(B,GB);h.state.layoutAction=()=>{old.submit({preventDefault(){}});old.change({target:{value:'KONTO LÖSCHEN'}});old.cancel();};await h.render();assert.equal(h.api.calls.deletions.length,0);assert.equal(h.state.requests.filter(row=>row.method==='DELETE').length,0);const current=await h.fill();await h.act(()=>old.submit({preventDefault(){}}));assert.ok(h.form());await h.act(()=>current.cancel());assert.equal(h.form(),null);await h.fill();await h.act(()=>current.submit({preventDefault(){}}));assert.equal(h.api.calls.deletions.length,0);}finally{await h.close();}
});

test('Changing a confirmed draft before the next render invalidates its old submit handler',async()=>{
 const h=await uiFixture();try{const old=await h.fill();await h.act(()=>{old.change({target:{value:''}});old.submit({preventDefault(){}});});assert.equal(h.state.requests.filter(row=>row.method==='DELETE').length,0);assert.equal(h.api.calls.deletions.length,0);}finally{await h.close();}
});

test('Same-email new generation requires a new overview and fresh confirmation',async()=>{
 const h=await uiFixture();try{const old=await h.fill();h.api.profiles.set(A,{email:A,account_generation:GC,is_premium:false,is_admin:false});h.state.cookie=h.api.token(A,GC);await h.submit();assert.equal(h.api.calls.deletions.length,0);assert.equal(h.state.reloads,1);h.state.account=propsFor(A,GC);await h.render();assert.ok(h.button('Kontolöschung vorbereiten'));await h.act(()=>old.submit({preventDefault(){}}));assert.equal(h.api.calls.deletions.length,0);await h.fill();await h.submit();assert.equal(h.api.calls.deletions[0].p_account_generation,GC);assert.equal(h.api.profiles.has(B),true);}finally{await h.close();}
});

test('A real overview refresh keeps A visible while pending, but its deletion confirmation cannot target B',async()=>{
 const h=await uiFixture({realOverview:true});try{await h.fill();const gate=deferred();h.state.nextAccountGate=gate;h.state.cookie=h.api.token(B,GB);await h.act(()=>{h.dom.window.dispatchEvent(new h.dom.window.Event('blur'));h.dom.window.dispatchEvent(new h.dom.window.Event('focus'));});assert.ok(h.text().includes(A));await h.submit();assert.equal(h.api.calls.deletions.length,0);assert.ok(h.text().includes(B));assert.equal(h.form(),null);assert.ok(h.button('Kontolöschung vorbereiten'));await h.act(()=>gate.resolve());assert.equal(h.state.cleanup,0);}finally{await h.close();}
});

test('A capability response after unmount or overview replacement does not restore the old form',async()=>{
 const gate=deferred(),h=await uiFixture({capabilityGate:gate});await h.close();await h.act(()=>gate.resolve());assert.equal(h.state.reloads,0);assert.equal(h.api.calls.deletions.length,0);
});

test('A deletion response arriving after actual unmount performs no local purge, event or follow-up',async()=>{
 const gate=deferred(),h=await uiFixture({deleteGate:gate});let old;try{old=await h.fill();await h.act(()=>{void old.submit({preventDefault(){}});});await h.close();await h.act(()=>gate.resolve());assert.equal(h.state.cleanup,0);assert.equal(h.state.events,0);await h.act(()=>old.submit({preventDefault(){}}));assert.equal(h.state.requests.filter(row=>row.method==='DELETE').length,1);}finally{await h.close();}
});

test('Legitimate same-account deletion preserves the explicit wording and clears only after its matching reply',async()=>{
 const h=await uiFixture();try{const old=await h.fill();assert.match(h.text(),/KONTO LÖSCHEN/);assert.match(h.text(),/Laufende Abos separat kündigen/);await h.submit();assert.equal(h.api.calls.deletions.length,1);assert.equal(h.api.calls.deletions[0].p_email,A);assert.equal(h.api.profiles.has(B),true);assert.match(h.text(),/Dein Konto ist gelöscht/);assert.equal(h.state.events,1);assert.equal(h.state.cleanup,5);await h.act(()=>old.submit({preventDefault(){}}));assert.equal(h.api.calls.deletions.length,1);}finally{await h.close();}
});

test('A mismatching success payload never clears another identity or adopts its key',async()=>{
 const h=await uiFixture({deleteBody:{body:{deleted:true,accountKey:GB}}});try{await h.fill();await h.submit();assert.equal(h.state.cleanup,0);assert.equal(h.state.events,0);assert.equal(h.state.reloads,1);assert.equal(h.api.calls.deletions.length,0);assert.match(h.text(),/Kontodaten erneut laden/);}finally{await h.close();}
});
