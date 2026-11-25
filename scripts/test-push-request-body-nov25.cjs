// Native transport tests and explicitly isolated route gates. No notification,
// account, recipient, real token, database, Firebase or external network call.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const repo=process.env.JL_PUSH_TEST_REPO||path.resolve(__dirname,'..'),proposed=process.env.JL_PUSH_TEST_SOURCE||null,pr=createRequire(path.join(repo,'package.json')),swc=pr('next/dist/build/swc');
const productFiles=new Set(['lib/push-registration.js','app/api/push/register/route.js','app/api/push/unregister/route.js','app/api/push/send/route.js']);
const bytes=text=>new TextEncoder().encode(text),payload=JSON.stringify({token:'isolated-token'}),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture(options={}){
 const events=[],effects={database:0,actor:0,admin:0,provider:0},timers=new Set(),delays=[],cache=new Map(),logs=[];let facade;
 const forbidden=()=>{effects.provider++;throw Error('No provider or unreviewed dependency is allowed.');};
 const database=new Proxy({},{get(){effects.database++;throw Error('No database query is allowed in the transport fixture.');}});
 const context=vm.createContext({process:{env:{ADMIN_PASS:'synthetic-push-bearer'}},Buffer,URL,Date,TextDecoder:options.TextDecoder||TextDecoder,Response,Uint8Array,JSON:options.JSON||JSON,
  console:{error:(...args)=>logs.push(args)},setTimeout(callback,delay){delays.push(delay);const timer=setTimeout(callback,delay);timers.add(timer);return timer;},clearTimeout(timer){timers.delete(timer);clearTimeout(timer);}});
 function load(relative){
  relative=relative.replaceAll('\\','/');if(cache.has(relative))return cache.get(relative).exports;
  assert.ok(productFiles.has(relative),'Only these four actual product modules can be loaded.');
  const filename=path.join(repo,relative),source=fs.readFileSync(path.join(proposed||repo,relative),'utf8'),mod={exports:{}};cache.set(relative,mod);
  const{code}=swc.transformSync(source,{filename,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
  const req=id=>{
   if(id==='@supabase/supabase-js')return{createClient(){effects.database++;throw Error('No actual client');}};
   if(id==='./account-session')return{accountDatabaseOptions:forbidden};
   if(id.endsWith('/push-registration')&&facade)return facade;
   if(id.endsWith('/account-access'))return{readRequestAccountSession(){events.push('session');return options.unsigned?null:{email:'isolated-owner@example.invalid'};}};
   if(id.endsWith('/test-environment'))return{isPayPalSandboxTestEnvironment(){events.push('sandbox');return options.sandbox===true;}};
   if(id.endsWith('/account-session'))return{isAccountGenerationEnabled:()=>true};
   if(id.endsWith('/course-progress-server'))return{requireSameOriginJson(req){events.push('origin');if(req.headers.get('origin')!=='https://jagdlatein.de')throw{status:403,message:'Origin'};if(req.headers.get('content-type')!=='application/json')throw{status:415,message:'JSON'};},requireCurrentAccount:forbidden};
   if(id.endsWith('/admin-trial-overview'))return{async requireCurrentTrialAdmin(){events.push('admin');effects.admin++;if(options.adminError)throw{status:403,message:'Admin'};return{database};}};
   if(id==='node:crypto')return require(id);
   if(id==='firebase-admin/app')return{cert:forbidden,getApps:forbidden,initializeApp:forbidden};
   if(id==='firebase-admin/messaging')return{getMessaging:forbidden};
   if(id.startsWith('.'))return load(path.relative(repo,path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`)));
   throw Error('Unreviewed dependency '+id);
  };
  vm.runInContext(`(function(require,module,exports){${code}\n})`,context)(req,mod,mod.exports);return mod.exports;
 }
 const api=load('lib/push-registration.js');
 facade={...api,async readPushJson(req,max){events.push('body');const result=await api.readPushJson(req,max);options.afterReader?.(req,result);return result;}};
 return{api,events,effects,timers,delays,logs,load,post:(route,req)=>load(`app/api/push/${route}/route.js`).POST(req)};
}
function request(body=payload,options={}){return new Request('https://jagdlatein.de/api/push/register',{method:'POST',headers:{origin:'https://jagdlatein.de','content-type':'application/json',authorization:'Bearer synthetic-push-bearer',...options.headers},body,...(options.signal?{signal:options.signal}:{}),...(body instanceof ReadableStream?{duplex:'half'}:{})});}
function watch(req,hooks={}){
 const count={acquired:0,read:0,cancel:0,release:0,added:0,removed:0};
 if(req.body?.getReader){const acquire=req.body.getReader.bind(req.body);req.body.getReader=()=>{count.acquired++;const reader=acquire(),read=reader.read.bind(reader),cancel=reader.cancel.bind(reader),release=reader.releaseLock.bind(reader);reader.read=()=>{count.read++;return hooks.read?hooks.read(read(),count.read):read();};reader.cancel=()=>{count.cancel++;return hooks.cancel?hooks.cancel(cancel):cancel();};reader.releaseLock=()=>{count.release++;return release();};hooks.acquired?.();return reader;};}
 if(req.signal){const add=req.signal.addEventListener.bind(req.signal),remove=req.signal.removeEventListener.bind(req.signal);req.signal.addEventListener=(...args)=>{if(args[0]==='abort')count.added++;return add(...args);};req.signal.removeEventListener=(...args)=>{if(args[0]==='abort')count.removed++;return remove(...args);};}
 return count;
}
function clean(ctx,req,count){assert.equal(ctx.timers.size,0);if(count?.acquired){assert.equal(count.cancel,1);assert.equal(count.release,1);assert.equal(req.body.locked,false);}if(count)assert.equal(count.added,count.removed);assert.equal(ctx.effects.provider,0);}
async function rejected(ctx,promise,status){let captured;try{await promise;assert.fail('Expected rejection.');}catch(error){captured=error;}const response=ctx.api.pushErrorResponse(captured);assert.equal(response.status,status);const result=await response.json();assert.equal(result.success,false);return{error:captured,result};}

test('Push keeps8192-byte default and8000ms deadline while preserving optional explicit caps',()=>{const ctx=fixture();assert.equal(ctx.api.PUSH_REQUEST_DEFAULT_MAX_BYTES,8192);assert.equal(ctx.api.PUSH_REQUEST_READ_TIMEOUT_MS,8000);});
test('Native stream preserves nonfatal UTF8 replacement, initial BOM and split multibyte decoding',async()=>{
 const raw=Buffer.concat([Buffer.from([239,187,191]),Buffer.from('{"token":"Ä'),Buffer.from([255]),Buffer.from('b"}')]);
 const stream=new ReadableStream({start(control){for(const byte of raw)control.enqueue(Uint8Array.of(byte));control.close();}}),ctx=fixture(),req=request(stream),count=watch(req);
 assert.equal((await ctx.api.readPushJson(req)).token,'Ä�b');assert.deepEqual(ctx.delays,[8000]);clean(ctx,req,count);
});
test('8192 actual stream bytes pass;8193 reject with or without a false small declared length',async()=>{
 for(const size of [8192,8193])for(const declared of [undefined,'1']){const ctx=fixture(),req=request(payload+' '.repeat(size-Buffer.byteLength(payload)),{headers:declared?{'content-length':declared}:{}}),count=watch(req);if(size===8192)assert.equal((await ctx.api.readPushJson(req)).token,'isolated-token');else await rejected(ctx,ctx.api.readPushJson(req),413);clean(ctx,req,count);}
});
test('Explicit16384-byte API cap remains separate from all production default callers',async()=>{
 const raw=payload+' '.repeat(10000-Buffer.byteLength(payload));for(const limit of [undefined,16384]){const ctx=fixture(),req=request(raw),count=watch(req);if(limit)assert.equal((await ctx.api.readPushJson(req,limit)).token,'isolated-token');else await rejected(ctx,ctx.api.readPushJson(req),413);clean(ctx,req,count);}
});
test('Declared oversize and invalid headers reject before reader acquisition; empty header retains old acceptance',async()=>{
 for(const declared of ['8193','invalid','-1','9007199254740992','']){const ctx=fixture(),req=request(payload,{headers:{'content-length':declared}}),count=watch(req);if(declared==='')assert.equal((await ctx.api.readPushJson(req)).token,'isolated-token');else{await rejected(ctx,ctx.api.readPushJson(req),413);assert.equal(count.acquired,0);}clean(ctx,req,count);}
});
test('JSON syntax errors retain400 while the parser still accepts arbitrary JSON before platform validation',async()=>{
 for(const raw of ['{','', 'null','[]','0']){const ctx=fixture(),req=request(raw),count=watch(req);if(['{',''].includes(raw))await rejected(ctx,ctx.api.readPushJson(req),400);else assert.equal(JSON.stringify(await ctx.api.readPushJson(req)),raw);clean(ctx,req,count);}
});
test('Text fallback preserves returned-string reencodedUTF8 limit rather than raw stream byte count',async()=>{
 const raw=Buffer.concat([Buffer.from('{"token":"'),Buffer.from([255]),Buffer.from('"}')]),text=new TextDecoder().decode(raw),ctx=fixture(),req=request(raw),count=watch(req);
 assert.equal(raw.length,13);assert.equal(Buffer.byteLength(text,'utf8'),15);assert.equal((await ctx.api.readPushJson(req,13)).token,'�');clean(ctx,req,count);
 const fallback={headers:new Headers(),body:null,async text(){return text;}};await rejected(ctx,ctx.api.readPushJson(fallback,13),413);assert.equal(ctx.timers.size,0);
});
test('Text fallback accepts exact8192 reencoded bytes and retains JSON/BOM behavior',async()=>{
 for(const size of [8192,8193]){const ctx=fixture(),text=payload+' '.repeat(size-Buffer.byteLength(payload)),req={headers:new Headers(),body:null,async text(){return text;}};if(size===8192)assert.equal((await ctx.api.readPushJson(req)).token,'isolated-token');else await rejected(ctx,ctx.api.readPushJson(req),413);assert.equal(ctx.timers.size,0);}
 const ctx=fixture();await rejected(ctx,ctx.api.readPushJson({headers:new Headers(),body:null,async text(){return '\uFEFF'+payload;}}),400);assert.equal(ctx.timers.size,0);
});
test('Pre-aborted native and fallback requests stop before acquiring or invoking body readers',async()=>{
 for(const fallback of [false,true]){const controller=new AbortController();controller.abort();const ctx=fixture();let calls=0;const req=fallback?{headers:new Headers(),signal:controller.signal,body:null,async text(){calls++;return payload;}}:request(payload,{signal:controller.signal}),count=watch(req);await rejected(ctx,ctx.api.readPushJson(req),408);assert.equal(calls,0);assert.equal(count.acquired,0);clean(ctx,req,count);}
});
test('Acquisition-time abort cleans its acquired native reader before reading',async()=>{const controller=new AbortController(),ctx=fixture(),req=request(payload,{signal:controller.signal}),count=watch(req,{acquired:()=>controller.abort()});await rejected(ctx,ctx.api.readPushJson(req),408);assert.equal(count.read,0);clean(ctx,req,count);});
test('Mid-read native abort settles promptly despite a never-settling underlying cancel',async()=>{
 const controller=new AbortController(),stream=new ReadableStream({start(control){control.enqueue(bytes(payload));},cancel(){return new Promise(()=>{});}}),ctx=fixture(),req=request(stream,{signal:controller.signal}),count=watch(req),pending=ctx.api.readPushJson(req);await sleep(20);controller.abort();await rejected(ctx,Promise.race([pending,sleep(250).then(()=>{throw Error('Abort hung');})]),408);clean(ctx,req,count);
});
test('Pending text fallback abort settles without owning or cancelling a reader',async()=>{const controller=new AbortController(),ctx=fixture(),req={headers:new Headers(),signal:controller.signal,body:null,text(){return new Promise(()=>{});}},count=watch(req),pending=ctx.api.readPushJson(req);await sleep(20);controller.abort();await rejected(ctx,Promise.race([pending,sleep(250).then(()=>{throw Error('Fallback abort hung');})]),408);assert.equal(count.cancel,0);clean(ctx,req,count);});
test('Abort after a resolved chunk or native EOF cannot adopt a body',async()=>{
 for(const atEOF of [false,true]){const controller=new AbortController(),ctx=fixture(),req=request(payload,{signal:controller.signal}),count=watch(req,{read:pending=>pending.then(part=>{if(part.done===atEOF)controller.abort();return part;})});await rejected(ctx,ctx.api.readPushJson(req),408);clean(ctx,req,count);}
});
test('Abort after fallback resolution is checked before JSON parsing',async()=>{const controller=new AbortController(),ctx=fixture(),req={headers:new Headers(),signal:controller.signal,body:null,async text(){controller.abort();return payload;}},count=watch(req);await rejected(ctx,ctx.api.readPushJson(req),408);clean(ctx,req,count);});
test('Abort during decoding and after JSON parsing are checked before adoption',async()=>{
 for(const duringParse of [false,true]){const controller=new AbortController();class Decoder extends TextDecoder{decode(...args){const value=super.decode(...args);controller.abort();return value;}}const json={parse(...args){const value=JSON.parse(...args);controller.abort();return value;}};const ctx=fixture(duringParse?{JSON:json}:{TextDecoder:Decoder}),req=request(payload,{signal:controller.signal}),count=watch(req);await rejected(ctx,ctx.api.readPushJson(req),408);clean(ctx,req,count);}
});
test('An oversize native chunk rejects without awaiting stalled cancellation',async()=>{const ctx=fixture(),req=request(new ReadableStream({start(control){control.enqueue(new Uint8Array(8193));},cancel(){return new Promise(()=>{});}})),count=watch(req);await rejected(ctx,Promise.race([ctx.api.readPushJson(req),sleep(250).then(()=>{throw Error('Oversize hung');})]),413);clean(ctx,req,count);});
test('The genuine8000ms total deadline bounds native stream and text fallback concurrently', {timeout:11000},async()=>{
 const streamCtx=fixture(),streamReq=request(new ReadableStream({start(control){control.enqueue(bytes(payload));},cancel(){return new Promise(()=>{});}})),streamCount=watch(streamReq),fallbackCtx=fixture(),fallbackReq={headers:new Headers(),body:null,text(){return new Promise(()=>{});}},began=Date.now();
 await Promise.all([rejected(streamCtx,streamCtx.api.readPushJson(streamReq),408),rejected(fallbackCtx,fallbackCtx.api.readPushJson(fallbackReq),408)]);const elapsed=Date.now()-began;assert.ok(elapsed>=7900&&elapsed<10500,`Native deadline elapsed${elapsed}ms`);clean(streamCtx,streamReq,streamCount);assert.equal(fallbackCtx.timers.size,0);
});
test('Foreign stream and fallback rejection reasons cannot choose public status or message',async()=>{
 for(const kind of ['stream','text'])for(const value of [null,undefined,'private-marker',{status:403,message:'private-marker'},{status:408,message:'private-marker'}]){const ctx=fixture(),req=kind==='stream'?request(new ReadableStream({start(control){control.error(value);}})):{headers:new Headers(),body:null,async text(){throw value;}},count=watch(req),{result}=await rejected(ctx,ctx.api.readPushJson(req),500);assert.equal(result.error,'Serverfehler');assert.ok(!JSON.stringify(result).includes('private-marker'));clean(ctx,req,count);}
});
test('Supplied PushRegistrationError instances are not invocation-owned; forged408 response mapping stays500',async()=>{
 for(const status of [403,408,413]){const ctx=fixture(),error=new ctx.api.PushRegistrationError(status,'private-marker'),req=request(new ReadableStream({start(control){control.error(error);}})),count=watch(req);assert.equal((await rejected(ctx,ctx.api.readPushJson(req),500)).result.error,'Serverfehler');clean(ctx,req,count);if(status===408)assert.equal(ctx.api.pushErrorResponse(error).status,500);}
});
test('Existing legitimate origin/account status mappings remain intact while genuine abort receives408',async()=>{const ctx=fixture();for(const status of [400,401,403,409,413,415,503])assert.equal(ctx.api.pushErrorResponse({status,message:'existing-guard'}).status,status);const controller=new AbortController();controller.abort();await rejected(ctx,ctx.api.readPushJson(request(payload,{signal:controller.signal})),408);});
test('Locked or throwing native reader acquisition and text access normalize to500',async()=>{
 for(const locked of [false,true]){const ctx=fixture(),req=request();let held;if(locked)held=req.body.getReader();else req.body.getReader=()=>{throw{status:403,message:'private-acquire'};};assert.equal((await rejected(ctx,ctx.api.readPushJson(req),500)).result.error,'Serverfehler');held?.releaseLock();assert.equal(ctx.timers.size,0);}
 const ctx=fixture();await rejected(ctx,ctx.api.readPushJson({headers:new Headers(),body:null,text(){throw{status:403,message:'private-text'};}}),500);assert.equal(ctx.timers.size,0);
});
test('Rejected or throwing cleanup never replaces valid JSON; completed reads remove listeners',async()=>{
 for(const throwing of [false,true]){const controller=new AbortController(),ctx=fixture(),req=request(payload,{signal:controller.signal}),count=watch(req,{cancel:cancel=>{cancel();if(throwing)throw Error('private-cleanup');return Promise.reject(Error('private-cleanup'));}});assert.equal((await ctx.api.readPushJson(req)).token,'isolated-token');clean(ctx,req,count);controller.abort();await Promise.resolve();assert.equal(count.cancel,1);}
});
test('All three routes reject a fresh post-await abort before validation or subsequent workflow',async()=>{
 for(const route of ['register','unregister','send']){const controller=new AbortController(),ctx=fixture({afterReader:()=>controller.abort()}),body=route==='send'?{title:'Synthetic',body:'Synthetic only'}:{token:'isolated-token'},req=request(JSON.stringify(body),{signal:controller.signal}),response=await ctx.post(route,req);assert.equal(response.status,408);assert.equal(ctx.effects.database,0);assert.equal(ctx.effects.provider,0);assert.equal(ctx.effects.admin,route==='send'?1:0);assert.deepEqual(ctx.events,route==='send'?['sandbox','origin','admin','body']:['sandbox','session','origin','body']);assert.equal(ctx.logs.length,0);assert.equal(ctx.timers.size,0);}
});
test('Malformed bodies preserve400 and send retains its required pre-body administrator lookup',async()=>{
 for(const route of ['register','unregister','send']){const ctx=fixture(),response=await ctx.post(route,request('{'));assert.equal(response.status,400);assert.equal(ctx.effects.database,0);assert.equal(ctx.effects.provider,0);assert.equal(ctx.effects.admin,route==='send'?1:0);assert.equal(ctx.logs.length,0);assert.equal(ctx.timers.size,0);}
});
test('Sandbox, session, origin and bearer/admin rejection remain ahead of any body read',async()=>{
 for(const route of ['register','unregister','send']){const ctx=fixture({sandbox:true}),response=await ctx.post(route,{headers:new Headers(),get body(){throw Error('Do not read.');}});assert.equal(response.status,503);assert.deepEqual(ctx.events,['sandbox']);}
 for(const route of ['register','unregister']){const ctx=fixture({unsigned:true});assert.equal((await ctx.post(route,request())).status,401);assert.deepEqual(ctx.events,['sandbox','session']);}
 for(const route of ['register','unregister','send']){const ctx=fixture();assert.equal((await ctx.post(route,request(payload,{headers:{origin:'https://foreign.invalid'}}))).status,403);assert.ok(!ctx.events.includes('body'));assert.equal(ctx.effects.provider,0);}
 const denied=fixture();assert.equal((await denied.post('send',request(payload,{headers:{authorization:'Bearer wrong'}}))).status,401);assert.deepEqual(denied.events,['sandbox']);
 const admin=fixture({adminError:true});assert.equal((await admin.post('send',request())).status,403);assert.deepEqual(admin.events,['sandbox','origin','admin']);
});
