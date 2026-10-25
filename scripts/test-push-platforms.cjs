// Isolated protocol and SQL checks. No live Firebase, database or devices are used.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),pr=createRequire(path.join(root,'package.json')),swc=pr('next/dist/build/swc');
const EMAIL='push-owner@example.invalid',OTHER='different-owner@example.invalid',GEN='11111111-1111-4111-8111-111111111111';
const fid='cABCDEFGHIJKLMNOPQRSTU',fid2='dABCDEFGHIJKLMNOPQRSTU';
const at='2026-10-25T13:00:00.000Z';
const record=(token,platform='android',kind='token',extra={})=>({token,platform,registration_kind:kind,account_email:EMAIL,enabled:true,updated_at:at,...extra});
function fixture(options={}){
  const rows=structuredClone(options.rows||[]),calls=[],logs=[],writes=[];let actorChecks=0,adminChecks=0;
  const session={email:EMAIL,accountGeneration:GEN};
  const database={from(table){assert.equal(table,'push_tokens');const q={kind:'read',filters:[],fields:null,patch:null,start:0,end:Infinity,
    select(fields){this.fields=fields;return this;},eq(key,value){this.filters.push(row=>row[key]===value);return this;},in(key,value){this.filters.push(row=>value.includes(row[key]));return this;},is(key,value){this.filters.push(row=>row[key]===value);return this;},
    order(key){this.orderKey=key;return this;},range(start,end){this.start=start;this.end=end;return this;},
    upsert(patch,settings){this.kind='upsert';this.patch=patch;this.settings=settings;return this;},update(patch){this.kind='update';this.patch=patch;return this;},
    async execute(single=false){calls.push({type:'database',kind:this.kind,fields:this.fields,start:this.start,end:this.end});
      if(this.kind==='read')options.onRead?.(q,rows,calls);
      if(options.dbError)return{data:null,error:options.dbError};
      let chosen=rows.filter(row=>this.filters.every(filter=>filter(row)));
      if(this.kind==='upsert'){writes.push({kind:this.kind,patch:{...this.patch},settings:this.settings});const old=rows.find(row=>row.token===this.patch.token);if(old)Object.assign(old,this.patch);else rows.push({registration_kind:'token',...this.patch});chosen=rows.filter(row=>row.token===this.patch.token);}
      if(this.kind==='update'){writes.push({kind:this.kind,patch:{...this.patch},matched:chosen.map(row=>row.token)});chosen.forEach(row=>Object.assign(row,this.patch));}
      if(this.orderKey)chosen.sort((a,b)=>String(a[this.orderKey]).localeCompare(String(b[this.orderKey])));
      chosen=chosen.slice(this.start,this.end===Infinity?undefined:this.end+1);
      const fields=this.fields?.split(',');
      const data=chosen.map(row=>fields?Object.fromEntries(fields.filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]])):{...row});
      return{data:single?(data[0]||null):data,error:null};
    },maybeSingle(){return this.execute(true);},then(resolve,reject){return this.execute().then(resolve,reject);}};return q;}};
  const env={ADMIN_PASS:'isolated-admin-password',SUPABASE_URL:'https://database.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake-key',...options.env};
  const overrides={
    '@supabase/supabase-js':{createClient(url,key,clientOptions){calls.push({type:'client',clientOptions});return database;}},
    'lib/account-access.js':{readRequestAccountSession(){calls.push({type:'session'});return options.unsigned?null:session;}},
    'lib/account-session.js':{isAccountGenerationEnabled:()=>options.generation!==false,accountDatabaseOptions:actor=>({actorEmail:actor?.email,actorGeneration:actor?.accountGeneration})},
    'lib/test-environment.js':{isPayPalSandboxTestEnvironment:()=>options.sandbox===true},
    'lib/course-progress-server.js':{async requireCurrentAccount(db,actor){actorChecks++;assert.equal(actor.email,EMAIL);if(options.actorError||options.revokeAfterLookup&&actorChecks===2)throw Object.assign(new Error('Bitte erneut anmelden.'),{status:401});},requireSameOriginJson(req){if(req.headers.get('origin')!==new URL(req.url).origin)throw Object.assign(new Error('Origin'),{status:403});if((req.headers.get('content-type')||'').split(';')[0]!=='application/json')throw Object.assign(new Error('JSON'),{status:415});}},
    'lib/admin-trial-overview.js':{async requireCurrentTrialAdmin(){adminChecks++;calls.push({type:'admin'});if(options.adminError||options.revokeAdminAt===adminChecks)throw Object.assign(new Error('Bitte anmelden.'),{status:options.adminError?.status||403});return{database,session};}},
    'firebase-admin/app':{getApps(){calls.push({type:'firebase-apps'});return[{}];},cert(){throw new Error('No live cert');},initializeApp(){throw new Error('No live init');}},
    'firebase-admin/messaging':{getMessaging(){calls.push({type:'firebase-messaging'});return{async sendEachForMulticast(payload){calls.push({type:'send',payload:structuredClone(payload)});if(options.sendError)throw options.sendError;const custom=options.onSend?.(payload,rows,calls);if(custom)return custom;const ids=payload.fids||payload.tokens;return{successCount:ids.length,failureCount:0,responses:ids.map(()=>({success:true}))};}};}},
  };
  const cache=new Map();
  function load(relative){relative=relative.replace(/\\/g,'/');if(Object.hasOwn(overrides,relative))return overrides[relative];if(Object.hasOwn(overrides,relative.replace(/\.js$/,'')))return overrides[relative.replace(/\.js$/,'')];
    const filename=path.join(root,relative);if(cache.has(filename))return cache.get(filename).exports;const mod={exports:{}};cache.set(filename,mod);
    const{code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
    const local=id=>Object.hasOwn(overrides,id)?overrides[id]:id.startsWith('.')?load(path.relative(root,path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`))):pr(id);
    new Function('require','module','exports','process','console',code)(local,mod,mod.exports,{env},{error:(...args)=>logs.push(args)});return mod.exports;
  }
  function request(route,body,headers={}){return new Request(`https://jagdlatein.de/api/push/${route}`,{method:'POST',headers:{origin:'https://jagdlatein.de','content-type':'application/json',authorization:`Bearer ${env.ADMIN_PASS}`,...headers},body:typeof body==='string'?body:JSON.stringify(body)});}
  return{rows,calls,logs,writes,load,request,checks:()=>({actorChecks,adminChecks}),post:(route,body,headers)=>load(`app/api/push/${route}/route.js`).POST(request(route,body,headers))};
}
const message={title:'Jagdlatein',body:'Isolierte Nachricht'};

test('New web/iOS FIDs and legacy Android tokens remain distinct, with no raw APNs token route',()=>{
  const api=fixture().load('lib/push-registration.js');
  assert.deepEqual(api.parsePushRegistration({token:'  android-token  '}),{registration:'android-token',kind:'token',platform:'android',legacy:true});
  for(const platform of ['web','ios'])assert.deepEqual(api.parsePushRegistration({registration:fid,kind:'fid',platform}),{registration:fid,kind:'fid',platform,legacy:false});
  for(const body of [{registration:'a'.repeat(64),kind:'fid',platform:'ios'},{registration:fid,kind:'apns',platform:'ios'},{registration:fid,kind:'fid',platform:'android'},{registration:fid,kind:'fid',platform:'unknown'},{registration:fid,kind:'fid',platform:'web',account_email:OTHER},{token:'token',platform:'ios'},{registration:'x x',kind:'fid',platform:'web'}])assert.throws(()=>api.parsePushRegistration(body));
});
test('Legacy Android payload is preserved while new FID registrations receive their session owner and kind',async()=>{
  const legacy=fixture();assert.equal((await legacy.post('register',{token:'  android-token  '})).status,200);
  assert.deepEqual(Object.keys(legacy.writes[0].patch).sort(),['account_email','enabled','platform','token','updated_at']);assert.equal(legacy.writes[0].patch.platform,'android');
  for(const platform of ['web','ios']){const h=fixture();const r=await h.post('register',{registration:fid,kind:'fid',platform});assert.equal(r.status,200);assert.deepEqual(await r.json(),{success:true});assert.equal(h.writes[0].patch.registration_kind,'fid');assert.equal(h.writes[0].patch.account_email,EMAIL);assert.equal(h.checks().actorChecks,2);assert.equal(h.calls.find(call=>call.type==='client').clientOptions.actorGeneration,GEN);}
});
test('Current generation is rechecked after FID lookup; mismatched registration kinds never overwrite a recipient',async()=>{
  const revoked=fixture({revokeAfterLookup:true});assert.equal((await revoked.post('register',{registration:fid,kind:'fid',platform:'web'})).status,401);assert.equal(revoked.writes.length,0);
  const collision=fixture({rows:[record(fid,'android','token')]});assert.equal((await collision.post('register',{registration:fid,kind:'fid',platform:'web'})).status,409);assert.equal(collision.writes.length,0);
});
test('Malformed, huge, unsigned, foreign-origin and non-JSON registration requests cannot create a database client',async()=>{
  for(const [options,body,headers,status]of [[{unsigned:true},{token:'a'},{},401],[{},{token:'a'},{origin:'https://foreign.invalid'},403],[{},{token:'a'},{'content-type':'text/plain'},415],[{},'{',{},400],[{},'x'.repeat(9000),{},413],[{},{registration:'a'.repeat(64),kind:'fid',platform:'ios'},{},400]]){const h=fixture(options);assert.equal((await h.post('register',body,headers)).status,status);assert.equal(h.calls.filter(call=>call.type==='client').length,0);}
});
test('Missing registration-kind schema fails closed for new clients without a legacy fallback write',async()=>{
  const h=fixture({dbError:{code:'42703',message:'private internals'}});const r=await h.post('register',{registration:fid,kind:'fid',platform:'web'});assert.equal(r.status,503);assert.equal(h.writes.length,0);assert.ok(!JSON.stringify(await r.json()).includes('private internals'));
});
test('Unregister only disables the exact platform/kind/registration belonging to the current account',async()=>{
  const h=fixture({rows:[record(fid,'web','fid'),record(fid2,'web','fid',{account_email:OTHER}),record('android-token')]});
  assert.equal((await h.post('unregister',{registration:fid,kind:'fid',platform:'web'})).status,200);assert.equal(h.rows[0].enabled,false);assert.equal(h.rows[1].enabled,true);assert.equal(h.rows[2].enabled,true);
  assert.deepEqual(await(await h.post('unregister',{registration:fid2,kind:'fid',platform:'web'})).json(),{success:true});assert.equal(h.rows[1].enabled,true);
  assert.equal((await h.post('unregister',{registration:fid,kind:'fid',platform:'ios'})).status,200);assert.equal(h.rows[1].enabled,true);
});
test('Revoked accounts cannot unregister and all registration responses are private/no-store',async()=>{
  const h=fixture({rows:[record(fid,'web','fid')],actorError:true});const r=await h.post('unregister',{registration:fid,kind:'fid',platform:'web'});assert.equal(r.status,401);assert.equal(h.writes.length,0);assert.equal(h.rows[0].enabled,true);assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('Sandbox blocks register/unregister/send before session, database, credentials, body and Firebase calls',async()=>{
  for(const route of ['register','unregister','send']){const h=fixture({sandbox:true});const r=await h.load(`app/api/push/${route}/route.js`).POST({headers:new Headers(),async text(){throw new Error('must not parse');}});assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(h.calls,[]);}
});
test('Sending requires the existing bearer password, same origin, JSON and a current administrator',async()=>{
  for(const [options,headers,status]of [[{},{authorization:'Bearer wrong'},401],[{},{origin:'https://foreign.invalid'},403],[{}, {'content-type':'text/plain'},415],[{adminError:{status:401}},{},401],[{adminError:{status:403}},{},403]]){const h=fixture(options);assert.equal((await h.post('send',message,headers)).status,status);assert.equal(h.calls.filter(call=>call.type==='send'||call.type==='firebase-messaging').length,0);}
});
test('Broadcast groups new FIDs separately by platform while preserving Android token delivery',async()=>{
  const h=fixture({rows:[record('android-token'),record(fid,'web','fid'),record(fid2,'ios','fid')]});const r=await h.post('send',message);assert.equal(r.status,200);assert.deepEqual(await r.json(),{success:true,sent:3,failed:0,total:3,disabled:0});
  const sends=h.calls.filter(call=>call.type==='send').map(call=>call.payload);assert.equal(sends.length,3);
  assert.deepEqual(sends.find(value=>value.tokens).tokens,['android-token']);assert.equal(sends.find(value=>value.tokens).android.priority,'high');
  const web=sends.find(value=>value.webpush);assert.deepEqual(web.fids,[fid]);assert.equal(web.tokens,undefined);assert.equal(web.webpush.fcmOptions.link,'https://jagdlatein.de/lernen');
  const ios=sends.find(value=>value.apns);assert.deepEqual(ios.fids,[fid2]);assert.equal(ios.apns.headers['apns-push-type'],'alert');assert.equal(ios.apns.payload.aps.sound,'default');
  assert.ok(sends.every(value=>value.data.url==='/lernen'&&value.notification.title===message.title));
});
test('Raw APNs-like iOS rows are never forwarded to the FCM legacy token API',async()=>{
  const h=fixture({rows:[record('a'.repeat(64),'ios','token'),record('legacy-android',null,'token'),record(fid,'ios','fid')]});
  const api=h.load('lib/push-registration.js');const groups=api.pushDeliveryGroups(h.rows);
  assert.deepEqual(groups.map(group=>[group.kind,group.platform,group.rows.map(row=>row.token)]),[['token','android',['legacy-android']],['fid','ios',[fid]]]);
  const r=await h.post('send',{...message,platform:'ios'});assert.equal(r.status,200);
  const sends=h.calls.filter(call=>call.type==='send');assert.equal(sends.length,1);assert.deepEqual(sends[0].payload.fids,[fid]);assert.equal(sends[0].payload.tokens,undefined);
});
test('Platform selection and internal notification destinations cannot broaden to foreign pages or unknown platforms',async()=>{
  const h=fixture({rows:[record('android-token'),record(fid,'web','fid'),record(fid2,'ios','fid')]});assert.equal((await h.post('send',{...message,platform:'web',href:'/online-kurse?ansicht=live'})).status,200);const sends=h.calls.filter(call=>call.type==='send');assert.equal(sends.length,1);assert.deepEqual(sends[0].payload.fids,[fid]);assert.equal(sends[0].payload.webpush.fcmOptions.link,'https://jagdlatein.de/online-kurse?ansicht=live');
  for(const change of [{platform:'all-devices'},{href:'https://foreign.invalid/'},{href:'//foreign.invalid'},{href:'/\\foreign.invalid'},{href:'/%0afoo'},{href:'/%broken'}]){const x=fixture({rows:[record(fid,'web','fid')]});assert.equal((await x.post('send',{...message,...change})).status,400);assert.ok(!x.calls.some(call=>call.type==='send'));}
});
test('Recipient pagination exceeds the 1000-row default and provider batches never exceed 500 targets',async()=>{
  const h=fixture({rows:Array.from({length:1060},(_,index)=>record(`android-${String(index).padStart(4,'0')}`))});const r=await h.post('send',message);assert.equal(r.status,200);assert.equal((await r.json()).total,1060);assert.deepEqual(h.calls.filter(call=>call.type==='send').map(call=>call.payload.tokens.length),[500,500,60]);
});
test('Unregistering or reassigning a recipient while the broadcast is pending excludes its old snapshot',async()=>{
  const h=fixture({rows:[record(fid,'web','fid')],onRead(q,rows){if(q.fields&&q.filters.length>1)rows[0].enabled=false;}});const r=await h.post('send',message);assert.equal(r.status,200);assert.equal((await r.json()).total,0);assert.ok(!h.calls.some(call=>call.type==='send'));
});
test('A role revoked after recipient lookup cannot cross the Firebase send boundary',async()=>{
  for(const revokeAdminAt of [2,3]){const h=fixture({rows:[record(fid,'web','fid')],revokeAdminAt});assert.equal((await h.post('send',message)).status,403);assert.ok(!h.calls.some(call=>call.type==='send'));}
});
test('Only explicit invalid registrations are disabled; a newer owner/timestamp is preserved',async()=>{
  const h=fixture({rows:[record(fid,'web','fid'),record(fid2,'ios','fid')],onSend(payload,rows){if(payload.fids[0]===fid2){rows.find(row=>row.token===fid2).account_email=OTHER;rows.find(row=>row.token===fid2).updated_at='2026-10-25T13:01:00.000Z';}return{successCount:0,failureCount:1,responses:[{success:false,error:{code:'messaging/registration-token-not-registered'}}]};}});
  const r=await h.post('send',message);assert.equal(r.status,200);const result=await r.json();assert.equal(result.disabled,1);assert.equal(h.rows[0].enabled,false);assert.equal(h.rows[1].enabled,true);
  const payloadFailure=fixture({rows:[record(fid,'web','fid')],onSend(){return{successCount:0,failureCount:1,responses:[{success:false,error:{code:'messaging/invalid-argument'}}]};}});await payloadFailure.post('send',message);assert.equal(payloadFailure.rows[0].enabled,true);assert.equal(payloadFailure.writes.length,0);
});
test('Provider failure logs no identifiers, account address, credential, provider details or stacks',async()=>{
  const secret=`raw-provider-stack ${fid} ${EMAIL} isolated-admin-password`;
  const h=fixture({rows:[record(fid,'web','fid')],sendError:new Error(secret)});const r=await h.post('send',message);assert.equal(r.status,500);assert.deepEqual(h.logs,[['Push Versand fehlgeschlagen.']]);assert.ok(!JSON.stringify(await r.json()).includes(secret));
});

const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261025130000_push_platforms.sql'),'utf8');
const runtime=process.env.JL_PAYPAL_TEST_PGLITE_PATH||path.join(process.env.LOCALAPPDATA||'','Jagdlatein','paypal-sandbox','test-runtime','node_modules','@electric-sql','pglite');
if(!fs.existsSync(runtime))throw new Error('Missing isolated SQL runtime.');
const{PGlite}=require(runtime);let pg;
const deletion=fs.readFileSync(path.join(root,'supabase/migrations/20261007120000_account_deletion.sql'),'utf8');
function originalFunction(name){const start=deletion.indexOf(`CREATE OR REPLACE FUNCTION public.${name}()`);const end=deletion.indexOf('END $$;',start);assert.ok(start>=0&&end>start);return deletion.slice(start,end+7);}
test.before(async()=>{pg=new PGlite();await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE ROLE unsafe_push_role;');});
test.after(async()=>{await pg?.close();});
async function sqlBase(){await pg.exec('DROP SCHEMA public CASCADE;CREATE SCHEMA public;GRANT USAGE ON SCHEMA public TO PUBLIC;');await pg.exec(`CREATE TABLE public.userprofile(email text PRIMARY KEY,account_generation uuid NOT NULL);CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz,account_email text);${originalFunction('require_current_request_actor')}${originalFunction('guard_live_account_owner')}CREATE TRIGGER jagdlatein_live_owner BEFORE INSERT OR UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION public.guard_live_account_owner('account_email');INSERT INTO public.userprofile VALUES('${EMAIL}','${GEN}'),('${OTHER}','22222222-2222-4222-8222-222222222222');INSERT INTO public.push_tokens VALUES('existing-android','android',true,'${at}','${EMAIL}');`);}
test('SQL migration/replay preserves historical opt-in/owner fields and gives only bounded service privileges',async()=>{
  await sqlBase();const before=(await pg.query('SELECT token,platform,enabled,updated_at,account_email FROM public.push_tokens')).rows;
  await pg.exec('GRANT SELECT(token),UPDATE(enabled) ON public.push_tokens TO anon;');await pg.exec(sql);await pg.exec(sql);
  assert.deepEqual((await pg.query('SELECT token,platform,enabled,updated_at,account_email FROM public.push_tokens')).rows,before);assert.equal((await pg.query('SELECT registration_kind FROM public.push_tokens')).rows[0].registration_kind,'token');
  for(const role of ['anon','authenticated'])assert.deepEqual((await pg.query(`SELECT has_table_privilege($1,'public.push_tokens','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS table_access,has_any_column_privilege($1,'public.push_tokens','SELECT,INSERT,UPDATE,REFERENCES') AS column_access`,[role])).rows[0],{table_access:false,column_access:false});
  assert.deepEqual((await pg.query("SELECT has_table_privilege('service_role','public.push_tokens','SELECT') AS read,has_table_privilege('service_role','public.push_tokens','INSERT') AS insert,has_table_privilege('service_role','public.push_tokens','UPDATE') AS update,has_table_privilege('service_role','public.push_tokens','DELETE,TRUNCATE,REFERENCES,TRIGGER') AS other")).rows[0],{read:true,insert:true,update:true,other:false});
  await pg.exec(`INSERT INTO public.push_tokens(token,platform,enabled,account_email,registration_kind) VALUES('${fid}','web',true,'${EMAIL}','fid');`);
  await assert.rejects(pg.exec(`INSERT INTO public.push_tokens(token,platform,enabled,account_email,registration_kind) VALUES('wrong-kind','android',true,'${EMAIL}','fid');`),/jagdlatein_push_registration_kind/);
  assert.equal((await pg.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.push_tokens'::regclass")).rows[0].relrowsecurity,true);
});
test('SQL keeps the current account-generation actor guard active for new registrations',async()=>{
  await sqlBase();await pg.exec(sql);await pg.exec(`SET request.headers='{"x-jagdlatein-account-email":"${EMAIL}","x-jagdlatein-account-generation":"22222222-2222-4222-8222-222222222222"}';`);
  try{await assert.rejects(pg.exec(`INSERT INTO public.push_tokens(token,platform,enabled,account_email,registration_kind) VALUES('${fid}','web',true,'${EMAIL}','fid');`),/JL_ACCOUNT_GENERATION_MISMATCH/);assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.push_tokens')).rows[0].count,1);}finally{await pg.exec("SET request.headers='{}';");}
});
test('SQL refuses incompatible kinds or inherited browser privileges transactionally without altering historical rows',async()=>{
  await sqlBase();await pg.exec('ALTER TABLE public.push_tokens ADD COLUMN registration_kind integer;');await assert.rejects(pg.exec(sql),/JL_PUSH_PLATFORMS_SETUP/);await pg.exec('ROLLBACK;');assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.push_tokens')).rows[0].count,1);
  await sqlBase();await pg.exec('GRANT TRUNCATE ON public.push_tokens TO unsafe_push_role;GRANT unsafe_push_role TO anon;');try{await assert.rejects(pg.exec(sql),/JL_PUSH_PLATFORMS_SETUP/);await pg.exec('ROLLBACK;');assert.equal((await pg.query("SELECT count(*)::integer AS count FROM pg_attribute WHERE attrelid='public.push_tokens'::regclass AND attname='registration_kind' AND NOT attisdropped")).rows[0].count,0);}finally{await pg.exec('REVOKE unsafe_push_role FROM anon;');}
});

test('SQL refuses inherited destructive service privileges instead of reporting bounded grants',async()=>{
  await sqlBase();await pg.exec('GRANT DELETE ON public.push_tokens TO unsafe_push_role;GRANT unsafe_push_role TO service_role;');
  try{await assert.rejects(pg.exec(sql),/JL_PUSH_PLATFORMS_SETUP/);await pg.exec('ROLLBACK;');assert.equal((await pg.query("SELECT count(*)::integer AS count FROM pg_attribute WHERE attrelid='public.push_tokens'::regclass AND attname='registration_kind' AND NOT attisdropped")).rows[0].count,0);}finally{await pg.exec('REVOKE unsafe_push_role FROM service_role;');}
});
