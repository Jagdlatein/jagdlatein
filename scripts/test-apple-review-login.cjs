// Synthetic review credentials, real bcrypt and isolated PostgreSQL RPCs only.
// No email, Apple service, external HTTP, real account or remote database is used.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const {webcrypto,createHmac}=require('node:crypto');
const root=path.resolve(__dirname,'..');const pr=createRequire(path.join(root,'package.json'));
const swc=pr('next/dist/build/swc');const bcrypt=pr('bcryptjs');
const {NextRequest,NextResponse}=pr('next/server');
const EMAIL='apple-review-login@example.invalid';
const GENERATION='4ccfa30c-1cde-4f60-b991-341ccddac3f1';
const NEXT_GENERATION='f2ae242e-ac4d-4390-a8db-07d477ff2541';
const CREDENTIAL='4c7534f9-6725-4ab2-a146-0ad2e3c5452b';
const NEXT_CREDENTIAL='6bf8c9de-4a7b-4694-bbc1-aab05cc6e615';
const PASSWORD='syntheticA1b2C3d4E5f6G7h8J9k0L1m2N3p4Q5r6S7';
assert.equal(PASSWORD.length,43);
const PASSWORD_HASH=bcrypt.hashSync(PASSWORD,12);
const SESSION_SECRET='synthetic-apple-review-session-secret-more-than-32-bytes';
const plain=value=>JSON.parse(JSON.stringify(value));
const runtime=process.env.JL_APPLE_TEST_PGLITE_PATH||process.env.JL_PAYPAL_TEST_PGLITE_PATH||
  path.join(process.env.LOCALAPPDATA||'','Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if(!fs.existsSync(path.join(runtime,'package.json')))throw new Error('Isolated PGlite runtime is required; no skipped review login checks.');
const {PGlite}=require(path.resolve(runtime));

async function fixture(t,{community=false}={}){
  const pg=new PGlite();t.after(()=>pg.close());
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root,'supabase/test-only/paypal-sandbox-bootstrap.sql'),'utf8'));
  const migrations=community?['20261003_course_progress.sql','20261003160000_activity_results.sql',
    '20261004100000_ranked_quiz.sql','20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql',
    '20261004130000_subscription_trial.sql','20261004190000_learning_community.sql',
    '20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql','20261008120000_apple_refund_ordering.sql',
    '20261008140000_community_blocks.sql','20261008150000_apple_review_login_rate_limits.sql',
    '20261008160000_community_premoderation.sql','20261008170000_community_moderators.sql']:
    ['20261007110000_apple_subscriptions.sql','20261008120000_apple_refund_ordering.sql',
      '20261008150000_apple_review_login_rate_limits.sql'];
  if(community)await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  for(const filename of migrations)
    await pg.exec(fs.readFileSync(path.join(root,'supabase/migrations',filename),'utf8'));
  // The minimal login fixture has no Community subsystem. Its scoped profile
  // field is needed by the shared identity guard; the full migration/RPC and
  // privilege combinations are exercised by test-community-moderators.cjs.
  if(!community) await pg.exec('ALTER TABLE public.userprofile ADD COLUMN is_community_moderator boolean NOT NULL DEFAULT false;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[EMAIL,GENERATION]);
  const token=(await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v',[EMAIL,GENERATION])).rows[0].v.app_account_token;
  const calls={clients:0,rpcs:[],reads:0,readTables:[],mail:0,subscription:0,cookies:[]};
  const database={failReads:false,failRpc:false,
    from(table){
      const columns={userprofile:new Set(['email','account_generation']),apple_account_tokens:new Set(['app_account_token','account_email','account_generation']),
        login_codes:new Set(['email','code_hash','attempts']),community_profiles:new Set(['account_email'])};
      assert.ok(Object.hasOwn(columns,table));const filters=[];let mode='read';let update=null;
      const execute=async()=>{
        calls.reads++;calls.readTables.push(table);if(database.failReads)return{data:null,error:{message:'synthetic private database failure'}};
        const values=filters.map(([,value])=>value);const where=filters.map(([column],i)=>`${column}=$${i+1}`).join(' AND ');
        let result;
        if(mode==='update'){
          assert.equal(table,'login_codes');assert.deepEqual(Object.keys(update),['attempts']);
          result=await pg.query(`UPDATE public.login_codes SET attempts=$${values.length+1} WHERE ${where} RETURNING *`,[...values,update.attempts]);
        }else if(mode==='delete'){
          assert.equal(table,'login_codes');result=await pg.query(`DELETE FROM public.login_codes WHERE ${where} RETURNING *`,values);
        }else result=await pg.query(`SELECT * FROM public.${table}${where?` WHERE ${where}`:''}`,values);
        const packet={data:plain(result.rows),error:null};
        if(database.afterRead)await database.afterRead(table,packet);
        return packet;
      };
      return{select(){return this;},eq(column,value){assert.ok(columns[table].has(column));filters.push([column,value]);return this;},
        ilike(column,value){assert.equal(column,'email');filters.push([column,value.replace(/\\([\\%_])/g,'$1')]);return this;},
        update(value){mode='update';update=value;return this;},delete(){mode='delete';return this;},
        async maybeSingle(){const result=await execute();if(result.error)return result;assert.ok(result.data.length<=1);
          return{data:result.data[0]||null,error:null};},
        then(resolve,reject){return execute().then(resolve,reject);}};
    },
    async rpc(name,args){
      calls.rpcs.push({name,args:plain(args)});assert.ok(['reserve_apple_review_login_attempt','community_read','community_write'].includes(name));
      if(database.failRpc)return{data:null,error:{message:'synthetic private rate database failure'}};
      try{const packet={data:(await pg.transaction(async tx=>{
        await tx.exec('SET LOCAL ROLE service_role');
        if(name==='reserve_apple_review_login_attempt')return tx.query('SELECT public.reserve_apple_review_login_attempt($1,$2,$3) AS v',
          [args.p_account_generation,args.p_app_account_token,args.p_ip_bucket]);
        await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify(database.requestHeaders||{})]);
        if(name==='community_read')return tx.query('SELECT public.community_read($1,$2,$3::jsonb) AS v',
          [args.p_actor_email,args.p_mode,JSON.stringify(args.p_options)]);
        return tx.query('SELECT public.community_write($1,$2,$3::jsonb) AS v',
          [args.p_actor_email,args.p_action,JSON.stringify(args.p_payload)]);
      })).rows[0].v,error:null};
      if(database.afterRpc)await database.afterRpc(name,packet);
      return packet;}catch(error){return{data:null,error};}
    },
  };
  return{pg,token,calls,database};
}

function context(data,changes={},options={}){
  const now=Date.now();let clockMs=now;class Clock extends Date{static now(){return clockMs;}}
  const env={NODE_ENV:'production',JL_SESSION_SECRET:SESSION_SECRET,SUPABASE_URL:'https://database.example.invalid',
    SUPABASE_SERVICE_ROLE_KEY:'synthetic-not-a-key',ACCOUNT_GENERATION_ENABLED:'true',ACCOUNT_DELETION_ENABLED:'true',
    APPLE_SUBSCRIPTIONS_ENABLED:'true',APPLE_STORE_ENVIRONMENT:'Production',APPLE_BUNDLE_ID:'de.jagdlatein.app',
    APPLE_APP_ID:'6819820561',APPLE_PRODUCT_IDS:'de.jagdlatein.premium.monthly',APPLE_REVIEW_SANDBOX_ENABLED:'true',
    APPLE_REVIEW_ACCOUNT_GENERATION:GENERATION,APPLE_REVIEW_APP_ACCOUNT_TOKEN:data.token,
    APPLE_REVIEW_VALID_FROM:new Date(now-60000).toISOString(),APPLE_REVIEW_VALID_UNTIL:new Date(now+120000).toISOString(),
    APPLE_REVIEW_LOGIN_ENABLED:'true',APPLE_REVIEW_LOGIN_PASSWORD_HASH:PASSWORD_HASH,
    APPLE_REVIEW_LOGIN_CREDENTIAL_ID:CREDENTIAL,...changes};
  const cache=new Map();let storedCookie=null;
  const cookies={get(name){return name==='jl_account_session'&&storedCookie?{value:storedCookie}:undefined;},
    set(value){data.calls.cookies.push(value);if(value.name==='jl_account_session')storedCookie=value.value;}};
  const globals={process:{env},Buffer,Date:Clock,URL,Response,Request,Headers,TextEncoder,TextDecoder,Uint8Array,
    crypto:webcrypto,atob,AbortSignal,AbortController,console,
    fetch:async()=>{throw new Error('Review login test attempted a real network request');}};
  const sandbox=vm.createContext(globals);
  function load(relative){
    const filename=path.join(root,relative);if(filename.endsWith('.json'))return JSON.parse(fs.readFileSync(filename,'utf8'));
    if(cache.has(filename))return cache.get(filename).exports;
    const module={exports:{}};cache.set(filename,module);
    const {code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,
      jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022'},module:{type:'commonjs'}});
    const requireLocal=id=>{
      if(id==='next/server')return{NextResponse};
      if(id==='next/headers')return{cookies:async()=>cookies};
      if(id==='@supabase/supabase-js')return{createClient(url,key,settings){data.calls.clients++;data.database.requestHeaders=plain(settings?.global?.headers||{});return data.database;}};
      if(id==='./course-catalog')return{courses:[]};
      if(id==='./email'||id==='../../../../lib/email')return{async sendLoginCode(){data.calls.mail++;throw new Error('Review login must not send mail');}};
      if(id==='./subscription-access'||id==='../../../../lib/subscription-access')return{
        async resolveSubscriptionAccess(){data.calls.subscription++;return options.access||{paid:false,paidUntil:null,accessType:'none'};}};
      if(id.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(filename),id.endsWith('.json')?id:`${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`,sandbox)(requireLocal,module,module.exports);
    return module.exports;
  }
  function request(body={email:EMAIL,password:PASSWORD},headers={}){
    const combined={origin:'https://jagdlatein.de','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.10',...headers};
    for(const [key,value]of Object.entries(combined))if(value===null)delete combined[key];
    return new NextRequest('https://jagdlatein.de/api/auth/review-login',{method:'POST',headers:combined,
      body:typeof body==='string'?body:JSON.stringify(body)});
  }
  return{env,now,load,cookies,request,setTime(value){clockMs=value;},setCookie(value){storedCookie=value;},getCookie(){return storedCookie;}};
}

function signedMutatedSession(token,changes){
  const data={...JSON.parse(Buffer.from(token.split('.')[0],'base64url').toString('utf8')),...changes};
  const payload=Buffer.from(JSON.stringify(data)).toString('base64url');
  return`${payload}.${createHmac('sha256',SESSION_SECRET).update(payload).digest('base64url')}`;
}

async function verified(ctx,data,changes={},settings={}){
  return ctx.load('lib/apple-review-login.js').verifyReviewLogin(data.database,
    {email:EMAIL,password:PASSWORD,ip:'192.0.2.10',...changes},{env:ctx.env,nowMs:ctx.now,...settings});
}

test('Review login defaults off; incomplete or non-Production configuration cannot reserve a password attempt',async t=>{
  const data=await fixture(t);
  for(const changed of [{APPLE_REVIEW_LOGIN_ENABLED:undefined},{APPLE_REVIEW_LOGIN_ENABLED:'false'},
    {APPLE_REVIEW_LOGIN_ENABLED:'yes'},{APPLE_REVIEW_LOGIN_PASSWORD_HASH:'not-a-hash'},
    {APPLE_REVIEW_LOGIN_PASSWORD_HASH:bcrypt.hashSync(PASSWORD,10)},{APPLE_REVIEW_LOGIN_CREDENTIAL_ID:'invalid'},
    {ACCOUNT_GENERATION_ENABLED:'false'},{APPLE_REVIEW_SANDBOX_ENABLED:'false'},
    {APPLE_STORE_ENVIRONMENT:'Sandbox',JL_TEST_ENVIRONMENT:'paypal-sandbox'},{JL_SESSION_SECRET:'short'},
    {APPLE_REVIEW_VALID_FROM:new Date(Date.now()-120000).toISOString(),APPLE_REVIEW_VALID_UNTIL:new Date(Date.now()-60000).toISOString()},
    {APPLE_REVIEW_VALID_FROM:new Date(Date.now()+60000).toISOString()}]){
    const ctx=context(data,changed);
    await assert.rejects(verified(ctx,data),error=>error.status===503);
    assert.equal(data.calls.rpcs.length,0);assert.equal(data.calls.reads,0);assert.equal(data.calls.mail,0);
  }
});

test('Real bcrypt accepts only the exact review password and creates an unpaid bounded identity without sending mail',async t=>{
  const data=await fixture(t);const ctx=context(data);const helper=ctx.load('lib/apple-review-login.js');
  await assert.rejects(verified(ctx,data,{password:'X'+PASSWORD.slice(1)}),error=>error.status===401);
  const access=await verified(ctx,data,{email:`  ${EMAIL.toUpperCase()}  `});
  assert.equal(access.email,EMAIL);assert.equal(access.accountGeneration,GENERATION);
  assert.equal(access.paid,false);assert.equal(access.admin,false);assert.equal(access.authenticationMethod,'review-password');
  assert.equal(access.reviewAuth.credentialId,CREDENTIAL);assert.equal(access.reviewAuth.appAccountToken,data.token);
  assert.equal(access.reviewAuth.expiresAt,Math.floor(Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL)/1000));
  assert.equal(data.calls.mail,0);assert.equal(data.calls.rpcs.length,2);
  assert.ok(data.calls.rpcs.every(call=>/^[a-f0-9]{64}$/.test(call.args.p_ip_bucket)));
  assert.ok(!JSON.stringify(data.calls.rpcs).includes('192.0.2.10'));
  assert.ok(!JSON.stringify(data.calls.rpcs).includes(PASSWORD));
  assert.equal((await data.pg.query('SELECT is_admin,is_premium FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].is_premium,false);
  assert.equal(helper.ReviewLoginError.name,'ReviewLoginError');
});

test('Private PostgreSQL parallel attempts enforce the IP ceiling before bcrypt without an in-memory fallback',async t=>{
  const data=await fixture(t);const ctx=context(data);let comparisons=0;
  const attempts=await Promise.allSettled(Array.from({length:24},()=>verified(ctx,data,{},
    {bcryptCompare:async()=>{comparisons++;return false;}})));
  assert.equal(attempts.filter(item=>item.status==='rejected'&&item.reason.status===401).length,10);
  assert.equal(attempts.filter(item=>item.status==='rejected'&&item.reason.status===429).length,14);
  assert.equal(comparisons,10);
  const counts=(await data.pg.query('SELECT bucket_kind,attempts FROM public.apple_review_login_limits ORDER BY bucket_kind')).rows;
  assert.deepEqual(counts,[{bucket_kind:'account',attempts:10},{bucket_kind:'ip',attempts:10}]);
});

test('The global PostgreSQL ceiling survives parallel requests with different IP buckets',async t=>{
  const data=await fixture(t);const ctx=context(data);let comparisons=0;
  const attempts=await Promise.allSettled(Array.from({length:64},(_,i)=>verified(ctx,data,{ip:`192.0.2.${i+1}`},
    {bcryptCompare:async()=>{comparisons++;return false;}})));
  assert.equal(attempts.filter(item=>item.status==='rejected'&&item.reason.status===401).length,30);
  assert.equal(attempts.filter(item=>item.status==='rejected'&&item.reason.status===429).length,34);
  assert.equal(comparisons,30);
  assert.equal((await data.pg.query("SELECT attempts FROM public.apple_review_login_limits WHERE bucket_kind='account'")).rows[0].attempts,30);
  assert.equal((await data.pg.query("SELECT sum(attempts)::integer AS n FROM public.apple_review_login_limits WHERE bucket_kind='ip'")).rows[0].n,30);
});

test('The real rate RPC and its private counters reject browser roles and preserve populated data on migration rerun',async t=>{
  const data=await fixture(t);const ctx=context(data);
  await assert.rejects(verified(ctx,data,{}, {bcryptCompare:async()=>false}),error=>error.status===401);
  const before=(await data.pg.query('SELECT to_jsonb(l) AS v FROM public.apple_review_login_limits l ORDER BY bucket_kind')).rows;
  await data.pg.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261008150000_apple_review_login_rate_limits.sql'),'utf8'));
  assert.deepEqual((await data.pg.query('SELECT to_jsonb(l) AS v FROM public.apple_review_login_limits l ORDER BY bucket_kind')).rows,before);
  for(const role of ['anon','authenticated']){
    const rights=(await data.pg.query("SELECT has_function_privilege($1,'public.reserve_apple_review_login_attempt(uuid,uuid,text)','EXECUTE') AS rpc,has_table_privilege($1,'public.apple_review_login_limits','SELECT') AS data",[role])).rows[0];
    assert.deepEqual(rights,{rpc:false,data:false});
    await data.pg.exec(`SET ROLE ${role}`);
    await assert.rejects(data.pg.query('SELECT public.reserve_apple_review_login_attempt($1,$2,$3)',[GENERATION,data.token,'a'.repeat(64)]),/permission denied/);
    await assert.rejects(data.pg.query('SELECT * FROM public.apple_review_login_limits'),/permission denied/);
    await data.pg.exec('RESET ROLE');
  }
  assert.equal((await data.pg.query("SELECT has_table_privilege('service_role','public.apple_review_login_limits','SELECT') AS allowed")).rows[0].allowed,false);
});

test('Rate database and bcrypt failures return a neutral unavailable response rather than successful identity',async t=>{
  const data=await fixture(t);const ctx=context(data);let comparisons=0;data.database.failRpc=true;
  await assert.rejects(verified(ctx,data,{}, {bcryptCompare:async()=>{comparisons++;return true;}}),error=>error.status===503&&!error.message.includes('private'));
  assert.equal(comparisons,0);data.database.failRpc=false;
  await assert.rejects(verified(ctx,data,{}, {bcryptCompare:async()=>{throw new Error('synthetic private bcrypt failure');}}),error=>error.status===503&&!error.message.includes('private'));
  assert.equal(data.calls.mail,0);
});

test('Review identity requires a current nonadmin nonpremium nonmoderator profile and matching undeleted Apple token',async t=>{
  const data=await fixture(t);const ctx=context(data);const quick={bcryptCompare:async()=>true};
  await assert.rejects(verified(ctx,data,{email:'different@example.invalid'},quick),error=>error.status===401);
  await data.pg.query('UPDATE public.userprofile SET is_admin=true WHERE email=$1',[EMAIL]);
  await assert.rejects(verified(ctx,data,{},quick),error=>error.status===401);
  await data.pg.query('UPDATE public.userprofile SET is_admin=false,is_premium=true WHERE email=$1',[EMAIL]);
  await assert.rejects(verified(ctx,data,{},quick),error=>error.status===401);
  await data.pg.query('UPDATE public.userprofile SET is_premium=false,is_community_moderator=true WHERE email=$1',[EMAIL]);
  await assert.rejects(verified(ctx,data,{},quick),error=>error.status===401);
  await data.pg.query('UPDATE public.userprofile SET is_community_moderator=false,account_generation=$1 WHERE email=$2',[NEXT_GENERATION,EMAIL]);
  await assert.rejects(verified(ctx,data,{},quick),error=>error.status===401);
  await data.pg.query('UPDATE public.userprofile SET account_generation=$1 WHERE email=$2',[GENERATION,EMAIL]);
  await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
  await assert.rejects(verified(ctx,data,{},quick),error=>error.status===401);
  assert.equal(data.calls.mail,0);
});

test('Review login rechecks policy deadline, credential rotation and profile generation after asynchronous access resolution',async t=>{
  const data=await fixture(t);const ctx=context(data);const quick={bcryptCompare:async()=>true};
  const originalId=ctx.env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID;
  await assert.rejects(verified(ctx,data,{}, {...quick,resolveAccess:async()=>{
    ctx.env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID=NEXT_CREDENTIAL;return{paid:false};
  }}),error=>error.status===401);
  ctx.env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID=originalId;
  await assert.rejects(verified(ctx,data,{}, {...quick,resolveAccess:async()=>{
    await data.pg.query('UPDATE public.userprofile SET account_generation=$1 WHERE email=$2',[NEXT_GENERATION,EMAIL]);return{paid:false};
  }}),error=>error.status===401);
  await data.pg.query('UPDATE public.userprofile SET account_generation=$1 WHERE email=$2',[GENERATION,EMAIL]);
  await assert.rejects(verified(ctx,data,{}, {...quick,resolveAccess:async()=>{
    ctx.setTime(Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL));return{paid:false};
  }}),error=>error.status===401);
  assert.equal(data.calls.cookies.length,0);assert.equal(data.calls.mail,0);
});

test('A slow subscription check cannot turn an old password proof into a fresh deletion authorization',async t=>{
  const data=await fixture(t);const ctx=context(data,{APPLE_REVIEW_VALID_UNTIL:new Date(Date.now()+1200000).toISOString()});
  const result=await verified(ctx,data,{}, {bcryptCompare:async()=>true,resolveAccess:async()=>{
    ctx.setTime(ctx.now+601000);return{paid:false};
  }});
  assert.equal(result.authenticatedAt,Math.floor(ctx.now/1000),'Authentication must be stamped when the password was actually proved');
  const sessions=ctx.load('lib/account-session.js');
  const parsed=sessions.readAccountSession(sessions.createAccountSession(EMAIL,ctx.now+601000,result),ctx.now+601000);
  assert.ok(parsed);assert.equal(ctx.load('lib/account-deletion.js').requiresDeletionReauthentication(parsed,ctx.now+601000),true);
});

test('Bounded body parsing accepts only the exact email/password pair and rejects malformed streams',async t=>{
  const data=await fixture(t);const ctx=context(data);const read=ctx.load('lib/apple-review-login.js').readReviewLoginBody;
  assert.deepEqual(plain(await read(ctx.request())),{email:EMAIL,password:PASSWORD});
  for(const body of [{email:EMAIL},{email:EMAIL,password:PASSWORD,admin:true},[],null,'{broken', ' '.repeat(2049)])
    await assert.rejects(read(ctx.request(body)),error=>error.status===401);
  assert.equal(data.calls.rpcs.length,0);assert.equal(data.calls.mail,0);
});

test('A real review-password identity has consistent Node/Edge validation, a clamped cookie and no credential material',async t=>{
  const data=await fixture(t);const ctx=context(data);const access=await verified(ctx,data);
  const session=ctx.load('lib/account-session.js');const edge=ctx.load('lib/account-session-edge.js');
  const token=session.createAccountSession(EMAIL,ctx.now,access);assert.ok(token);
  const node=session.readAccountSession(token,ctx.now);const decoded=await edge.readAccountSessionEdge(token,ctx.now);
  for(const key of ['email','accountGeneration','authenticatedAt','expiresAt','paid','admin','authenticationMethod','reviewAuth'])
    assert.deepEqual(plain(node[key]),plain(decoded[key]));
  assert.equal(node.authenticationMethod,'review-password');assert.equal(node.expiresAt,access.reviewAuth.expiresAt);
  assert.ok(node.accessExpiresAt<=node.expiresAt);
  const payload=Buffer.from(token.split('.')[0],'base64url').toString('utf8');
  assert.ok(!payload.includes(PASSWORD));assert.ok(!payload.includes(PASSWORD_HASH));
  ctx.setCookie(token);
  const response=await ctx.load('app/api/auth/status/route.js').GET();
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{loggedIn:true,email:EMAIL,paid:false,admin:false});
  const renewed=session.readAccountSession(ctx.getCookie(),ctx.now);
  assert.equal(renewed.authenticatedAt,node.authenticatedAt);assert.equal(renewed.expiresAt,node.expiresAt);
  assert.deepEqual(plain(renewed.reviewAuth),plain(node.reviewAuth));
  const written=data.calls.cookies.at(-1);assert.equal(written.httpOnly,true);assert.equal(written.secure,true);assert.equal(written.sameSite,'lax');
  assert.ok(written.maxAge<=node.expiresAt-Math.floor(ctx.now/1000));
});

test('Disable, deadline, credential ID, token and generation changes revoke existing review cookies equally in Node and Edge',async t=>{
  const data=await fixture(t);const ctx=context(data);const access=await verified(ctx,data);
  const session=ctx.load('lib/account-session.js');const edge=ctx.load('lib/account-session-edge.js');
  const token=session.createAccountSession(EMAIL,ctx.now,access);const original={...ctx.env};
  for(const change of [{APPLE_REVIEW_LOGIN_ENABLED:'false'},{APPLE_REVIEW_SANDBOX_ENABLED:'false'},
    {APPLE_REVIEW_LOGIN_CREDENTIAL_ID:NEXT_CREDENTIAL},{APPLE_REVIEW_APP_ACCOUNT_TOKEN:'c6d66c4c-516c-49ad-93a5-50b20c1c7e0e'},
    {APPLE_REVIEW_ACCOUNT_GENERATION:NEXT_GENERATION}]){
    Object.assign(ctx.env,original,change);
    assert.equal(session.readAccountSession(token,ctx.now),null);assert.equal(await edge.readAccountSessionEdge(token,ctx.now),null);
  }
  Object.assign(ctx.env,original);
  const expired=Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL);
  assert.equal(session.readAccountSession(token,expired),null);assert.equal(await edge.readAccountSessionEdge(token,expired),null);
  assert.equal(session.readAccountSession(token.slice(0,-10)+'forgedxxxx',ctx.now),null);
});

test('Refreshing cannot extend the original review deadline, and valid-HMAC malformed review claims still fail closed',async t=>{
  const data=await fixture(t);const ctx=context(data);const access=await verified(ctx,data);
  const session=ctx.load('lib/account-session.js');const edge=ctx.load('lib/account-session-edge.js');
  const token=session.createAccountSession(EMAIL,ctx.now,access);const parsed=session.readAccountSession(token,ctx.now);
  const originalExpiry=parsed.expiresAt;
  ctx.env.APPLE_REVIEW_VALID_UNTIL=new Date(Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL)+60000).toISOString();
  const refreshed=session.createAccountSession(EMAIL,ctx.now+1000,{...parsed,paid:false});
  assert.equal(session.readAccountSession(refreshed,ctx.now+1000).expiresAt,originalExpiry);
  for(const changed of [{admin:true},{authenticationMethod:'email-code'},
    {reviewAuth:{...parsed.reviewAuth,extra:true}}, {reviewAuth:{...parsed.reviewAuth,credentialId:NEXT_CREDENTIAL}},
    {reviewAuth:{...parsed.reviewAuth,expiresAt:originalExpiry+86400}},{accountGeneration:NEXT_GENERATION},
    {version:2}]){
    const forged=signedMutatedSession(token,changed);
    assert.equal(session.readAccountSession(forged,ctx.now),null);assert.equal(await edge.readAccountSessionEdge(forged,ctx.now),null);
  }
});

test('Only a fresh independently verified review password satisfies deletion reauthentication; status refresh never renews that proof',async t=>{
  const data=await fixture(t);const ctx=context(data,{APPLE_REVIEW_VALID_UNTIL:new Date(Date.now()+1200000).toISOString()});
  const access=await verified(ctx,data);const sessions=ctx.load('lib/account-session.js');
  const session=sessions.readAccountSession(sessions.createAccountSession(EMAIL,ctx.now,access),ctx.now);
  const deletion=ctx.load('lib/account-deletion.js');
  assert.equal(deletion.requiresDeletionReauthentication(session,ctx.now),false);
  ctx.setCookie(sessions.createAccountSession(EMAIL,ctx.now,access));ctx.setTime(ctx.now+601000);
  assert.equal((await ctx.load('app/api/auth/status/route.js').GET()).status,200);
  const refreshed=sessions.readAccountSession(ctx.getCookie(),ctx.now+601000);
  assert.equal(refreshed.authenticatedAt,session.authenticatedAt);
  assert.equal(deletion.requiresDeletionReauthentication(refreshed,ctx.now+601000),true);
  assert.throws(()=>deletion.requireDeletionReauthentication(refreshed,ctx.now+601000),error=>error.status===401);
  const fresh=await ctx.load('lib/apple-review-login.js').verifyReviewLogin(data.database,
    {email:EMAIL,password:PASSWORD,ip:'192.0.2.10'},{env:ctx.env,nowMs:ctx.now+601000,bcryptCompare:async()=>true});
  const reauthenticated=sessions.readAccountSession(sessions.createAccountSession(EMAIL,ctx.now+601000,fresh),ctx.now+601000);
  assert.equal(deletion.requiresDeletionReauthentication(reauthenticated,ctx.now+601000),false);
  const emailSession={email:EMAIL,accountGeneration:GENERATION,authenticatedAt:Math.floor(ctx.now/1000)};
  assert.equal(deletion.requiresDeletionReauthentication(emailSession,ctx.now),false);
});

test('Login password validation prevents bcrypt truncation and malformed inputs before reserving a private attempt',async t=>{
  const data=await fixture(t);const ctx=context(data);let comparisons=0;
  for(const changed of [{password:''},{password:PASSWORD+'X'},{password:PASSWORD+' '.repeat(80)},
    {password:'é'.repeat(43)},{password:undefined},{email:'invalid'}])
    await assert.rejects(verified(ctx,data,changed,{bcryptCompare:async()=>{comparisons++;return true;}}),error=>error.status===401);
  assert.equal(comparisons,0);assert.equal(data.calls.rpcs.length,0);
});

test('Deleting one synthetic profile clears only its review limiter generation and keeps the trigger service-private',async t=>{
  const data=await fixture(t);const ctx=context(data);
  await assert.rejects(verified(ctx,data,{}, {bcryptCompare:async()=>false}),error=>error.status===401);
  const other='separate-review-limits@example.invalid';
  await data.pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[other,NEXT_GENERATION]);
  const otherToken=(await data.pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v',[other,NEXT_GENERATION])).rows[0].v.app_account_token;
  const reserved=(await data.pg.query('SELECT public.reserve_apple_review_login_attempt($1,$2,$3) AS v',[NEXT_GENERATION,otherToken,'b'.repeat(64)])).rows[0].v;
  assert.equal(reserved.allowed,true);
  const kept=(await data.pg.query('SELECT to_jsonb(l) AS v FROM public.apple_review_login_limits l WHERE account_generation=$1 ORDER BY bucket_kind',[NEXT_GENERATION])).rows;
  await data.pg.query('DELETE FROM public.userprofile WHERE email=$1 AND account_generation=$2',[EMAIL,GENERATION]);
  assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.apple_review_login_limits WHERE account_generation=$1',[GENERATION])).rows[0].n,0);
  assert.deepEqual((await data.pg.query('SELECT to_jsonb(l) AS v FROM public.apple_review_login_limits l WHERE account_generation=$1 ORDER BY bucket_kind',[NEXT_GENERATION])).rows,kept);
  const triggers=(await data.pg.query("SELECT p.oid FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid WHERE t.tgrelid='public.userprofile'::regclass AND NOT t.tgisinternal AND p.proname LIKE '%review_login%'")).rows;
  assert.equal(triggers.length,1);
  for(const role of ['anon','authenticated','service_role'])
    assert.equal((await data.pg.query("SELECT has_function_privilege($1,$2::oid,'EXECUTE') AS allowed",[role,triggers[0].oid])).rows[0].allowed,false);
});

test('A structurally valid review cookie loses live account access after Apple-token detachment',async t=>{
  const data=await fixture(t);const ctx=context(data);const access=await verified(ctx,data);
  const sessions=ctx.load('lib/account-session.js');const token=sessions.createAccountSession(EMAIL,ctx.now,access);
  ctx.setCookie(token);await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
  assert.ok(sessions.readAccountSession(token,ctx.now),'Cookie cryptography alone cannot see a database detachment');
  const response=await ctx.load('app/api/auth/status/route.js').GET();
  assert.equal(response.status,200);assert.equal((await response.json()).loggedIn,false);
  assert.equal(ctx.getCookie(),'');
});

test('Granting a Community-only role revokes an existing unprivileged review cookie without granting general admin access',async t=>{
  const data=await fixture(t,{community:true});const ctx=context(data);
  const access=await verified(ctx,data,{}, {bcryptCompare:async()=>true});
  const sessions=ctx.load('lib/account-session.js');
  const token=sessions.createAccountSession(EMAIL,ctx.now,access);ctx.setCookie(token);
  const owner=(await data.pg.query('SELECT user_id FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0];
  await data.pg.transaction(async tx=>{
    await tx.exec('SET LOCAL ROLE service_role');
    await tx.query('SELECT public.set_community_moderator($1,$2,true)',[owner.user_id,GENERATION]);
  });
  assert.equal((await data.pg.query('SELECT is_admin FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].is_admin,false);
  assert.ok(sessions.readAccountSession(token,ctx.now),'Only the live guard can observe the newly assigned scoped role');
  const response=await ctx.load('app/api/auth/status/route.js').GET();
  assert.equal(response.status,200);assert.equal((await response.json()).loggedIn,false);assert.equal(ctx.getCookie(),'');
});

test('Policy expiry, disable and credential rotation during live database reads stop DELETE before its personal RPC',async t=>{
  const data=await fixture(t);const originalFrom=data.database.from.bind(data.database);
  for(const change of ['deadline','disable','credential']){
    const ctx=context(data);const access=await verified(ctx,data,{}, {bcryptCompare:async()=>true});
    const token=ctx.load('lib/account-session.js').createAccountSession(EMAIL,ctx.now,access);
    const before=data.calls.rpcs.length;let profileReads=0;
    data.database.from=table=>{
      const query=originalFrom(table);
      if(table==='userprofile'){
        const read=query.maybeSingle.bind(query);
        query.maybeSingle=async()=>{
          const result=await read();profileReads++;
          if(profileReads===2){
            if(change==='deadline')ctx.setTime(Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL));
            if(change==='disable')ctx.env.APPLE_REVIEW_LOGIN_ENABLED='false';
            if(change==='credential')ctx.env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID=NEXT_CREDENTIAL;
          }
          return result;
        };
      }
      return query;
    };
    const request=new NextRequest('https://jagdlatein.de/api/account/delete',{method:'DELETE',
      headers:{origin:'https://jagdlatein.de','content-type':'application/json',cookie:`jl_account_session=${token}`},
      body:JSON.stringify({confirmation:'KONTO LÖSCHEN',acknowledgeSubscriptions:true})});
    const response=await ctx.load('app/api/account/delete/route.js').DELETE(request);
    assert.equal(response.status,401,change);assert.equal(profileReads,2,change);
    assert.equal(data.calls.rpcs.length,before,`${change} must stop before the personal deletion RPC`);
    assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].n,1);
    data.database.from=originalFrom;
  }
});

test('An ordinary email session bypasses review configuration and live-token queries entirely',async t=>{
  const data=await fixture(t);const ctx=context(data,{APPLE_REVIEW_LOGIN_PASSWORD_HASH:'invalid'});
  const helper=ctx.load('lib/apple-review-login.js');let queries=0;
  const database={from(){queries++;throw new Error('Ordinary identity must not use the review database guard');}};
  await helper.requireReviewSessionIdentity(database,{email:EMAIL,accountGeneration:GENERATION,
    authenticatedAt:Math.floor(ctx.now/1000)},{env:ctx.env,nowMs:ctx.now});
  assert.equal(queries,0);assert.equal(data.calls.rpcs.length,0);
});

test('Default-off route rejects before body/database access and active login enforces same-origin JSON',async t=>{
  const data=await fixture(t);const disabled=context(data,{APPLE_REVIEW_LOGIN_ENABLED:'false'});
  assert.equal((await disabled.load('app/api/auth/review-login/route.js').POST({})).status,503);
  assert.equal(data.calls.clients,0);assert.equal(data.calls.rpcs.length,0);
  const ctx=context(data);const route=ctx.load('app/api/auth/review-login/route.js');
  for(const changed of [{origin:null},{origin:'null'},{origin:'https://other.example.invalid'},
    {origin:'https://jagdlatein.de/untrusted'},{'sec-fetch-site':'cross-site'}])
    assert.equal((await route.POST(ctx.request(undefined,changed))).status,403);
  assert.equal((await route.POST(ctx.request(undefined,{'content-type':'text/plain'}))).status,415);
  for(const body of [{email:EMAIL,password:PASSWORD,admin:true},' '.repeat(2049),'{broken'])
    assert.equal((await route.POST(ctx.request(body))).status,401);
  assert.equal(data.calls.clients,0);assert.equal(data.calls.rpcs.length,0);assert.equal(data.calls.cookies.length,0);
});

test('Successful review route writes only a bounded secure identity cookie and does not disclose policy or password data',async t=>{
  const data=await fixture(t);const ctx=context(data);const route=ctx.load('app/api/auth/review-login/route.js');
  const rejected=await route.POST(ctx.request({email:EMAIL,password:'X'+PASSWORD.slice(1)}));
  assert.equal(rejected.status,401);assert.equal(rejected.headers.get('set-cookie'),null);
  const response=await route.POST(ctx.request());
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{success:true,paid:false,admin:false});
  assert.match(response.headers.get('cache-control'),/no-store/);
  const cookie=response.headers.get('set-cookie');assert.ok(cookie);
  assert.match(cookie,/; HttpOnly/);assert.match(cookie,/; SameSite=Lax/);assert.match(cookie,/; Secure/);
  const token=cookie.match(/^jl_account_session=([^;]+)/)[1];
  const parsed=ctx.load('lib/account-session.js').readAccountSession(token,ctx.now);assert.ok(parsed);
  const age=Number(cookie.match(/Max-Age=(\d+)/)[1]);
  assert.ok(age>0&&age<=Math.floor(Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL)/1000)-Math.floor(ctx.now/1000));
  assert.equal(parsed.authenticationMethod,'review-password');assert.equal(parsed.admin,false);
  assert.equal(data.calls.mail,0);
});

test('A Node status lookup cannot refresh a disabled review login into an ordinary email identity',async t=>{
  const data=await fixture(t);const ctx=context(data);const access=await verified(ctx,data);
  const session=ctx.load('lib/account-session.js');ctx.setCookie(session.createAccountSession(EMAIL,ctx.now,access));
  ctx.env.APPLE_REVIEW_LOGIN_ENABLED='false';
  const response=await ctx.load('app/api/auth/status/route.js').GET();
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{loggedIn:false,email:null,paid:false,admin:false});
  assert.equal(ctx.getCookie(),'');assert.equal(data.calls.cookies.at(-1).maxAge,0);
});

test('The real email-code login remains an ordinary identity even while private review-login configuration is invalid',async t=>{
  const data=await fixture(t);const ctx=context(data,{APPLE_REVIEW_LOGIN_PASSWORD_HASH:'invalid'});
  const code='406812';const hash=await bcrypt.hash(code,10);
  await data.pg.query('INSERT INTO public.login_codes(email,code_hash,expires_at,attempts,requested_at) VALUES($1,$2,now()+interval\'10 minutes\',0,now())',[EMAIL,hash]);
  const request=new NextRequest('https://jagdlatein.de/api/auth/verify-code',{method:'POST',
    headers:{'content-type':'application/json'},body:JSON.stringify({email:EMAIL,code})});
  const response=await ctx.load('app/api/auth/verify-code/route.js').POST(request);
  assert.equal(response.status,200);assert.equal((await response.json()).success,true);
  const token=ctx.getCookie();const session=ctx.load('lib/account-session.js').readAccountSession(token,ctx.now);
  const edge=await ctx.load('lib/account-session-edge.js').readAccountSessionEdge(token,ctx.now);
  assert.ok(session);assert.ok(edge);assert.equal(session.email,EMAIL);assert.equal(session.accountGeneration,GENERATION);
  assert.equal(session.authenticationMethod,undefined);assert.equal(session.reviewAuth,undefined);
  assert.equal(edge.authenticationMethod,undefined);assert.equal(edge.reviewAuth,undefined);
  assert.equal(session.expiresAt,session.authenticatedAt+40*86400);
  assert.equal(ctx.load('lib/account-deletion.js').requiresDeletionReauthentication(session,ctx.now),false);
  assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.login_codes WHERE email=$1',[EMAIL])).rows[0].n,0);
  assert.equal(data.calls.rpcs.length,0);assert.equal(data.calls.mail,0);
});

const COMMUNITY_MARKER='Synthetischer Lerninhalt nur fuer dieses Testkonto.';
const COMMUNITY_POST={action:'post',category:'wildkunde',type:'question',title:'Eine neue Frage zum Lernen',
  body:'Ein neuer synthetischer Beitrag zur geprueften Lernfrage.',acceptedRules:true};
async function communityFixture(t){
  const data=await fixture(t,{community:true});
  await data.pg.query("INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,'Prueflerner','test')",[EMAIL]);
  data.postId=(await data.pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body,status) VALUES($1,'allgemein','question','Eine bereits sichtbare Frage',$2,'visible') RETURNING id",[EMAIL,COMMUNITY_MARKER])).rows[0].id;
  return data;
}
function communityRequest(token,method='GET',body){
  return new NextRequest('https://jagdlatein.de/api/community',{method,
    headers:{origin:'https://jagdlatein.de','content-type':'application/json',cookie:`jl_account_session=${token}`},
    ...(body?{body:JSON.stringify(body)}:{})});
}
async function communityReviewCookie(ctx,data){
  const access=await verified(ctx,data,{}, {bcryptCompare:async()=>true});
  return ctx.load('lib/account-session.js').createAccountSession(EMAIL,ctx.now,access);
}
function revokeCommunityPolicy(ctx,change){
  if(change==='deadline')ctx.setTime(Date.parse(ctx.env.APPLE_REVIEW_VALID_UNTIL));
  else if(change==='disable')ctx.env.APPLE_REVIEW_LOGIN_ENABLED='false';
  else if(change==='credential')ctx.env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID=NEXT_CREDENTIAL;
  else throw new Error('Unknown synthetic community policy revocation');
}
async function assertCommunityDenied(response,label){
  assert.equal(response.status,401,label);
  const body=await response.json();assert.equal(body.code,'SESSION_RENEWAL_REQUIRED',label);
  assert.ok(!JSON.stringify(body).includes(COMMUNITY_MARKER),label);
  assert.ok(!Object.hasOwn(body,'posts')&&!Object.hasOwn(body,'viewer'),label);
}
function delayedCommunityBody(original,onRead){
  let reached=false;
  return{url:original.url,method:original.method,headers:original.headers,
    body:{getReader(){const reader=original.body.getReader();return{
      async read(){const next=await reader.read();if(!reached){reached=true;await onRead();}return next;},
      cancel(){return reader.cancel();},releaseLock(){reader.releaseLock();},
    };}}};
}

test('Community rejects a valid review cookie after token detachment or replacement with the same live account generation',async t=>{
  for(const replacement of [false,true])await t.test(replacement?'different current Apple token':'detached Apple token',async t=>{
    const data=await communityFixture(t);const ctx=context(data);const token=await communityReviewCookie(ctx,data);
    if(replacement){
      // No subscriptions reference this synthetic token. Replacing its key is
      // a SQL-valid binding change; a second token for one generation is not.
      const current=(await data.pg.query('UPDATE public.apple_account_tokens SET app_account_token=gen_random_uuid() WHERE app_account_token=$1 RETURNING app_account_token',[data.token])).rows[0];
      assert.notEqual(current.app_account_token,data.token);
    }else await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
    assert.equal((await data.pg.query('SELECT account_generation FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].account_generation,GENERATION);
    assert.ok(ctx.load('lib/account-session.js').readAccountSession(token,ctx.now),'The cookie still passes pure signature/config checks');
    const before=data.calls.rpcs.length;const route=ctx.load('app/api/community/route.js');
    await assertCommunityDenied(await route.GET(communityRequest(token)),'read after live-token revocation');
    await assertCommunityDenied(await route.POST(communityRequest(token,'POST',COMMUNITY_POST)),'write after live-token revocation');
    assert.equal(data.calls.rpcs.length,before,'Neither personal Community RPC may run after token revocation');
    assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.community_posts')).rows[0].n,1);
  });
});

test('Community policy expiry, disable and credential rotation during profile reads stop before the read RPC',async t=>{
  const data=await communityFixture(t);
  for(const change of ['deadline','disable','credential']){
    const ctx=context(data);const token=await communityReviewCookie(ctx,data);let reached=false;
    data.database.afterRead=async table=>{
      if(table==='community_profiles'&&!reached){reached=true;revokeCommunityPolicy(ctx,change);}
    };
    const before=data.calls.rpcs.length;
    await assertCommunityDenied(await ctx.load('app/api/community/route.js').GET(communityRequest(token)),change);
    assert.equal(reached,true,`${change} must actually happen during the private profile await`);
    assert.equal(data.calls.rpcs.length,before,`${change} must be checked before selecting Community contents`);
    data.database.afterRead=null;
  }
});

test('Community rechecks review authorization after its real read RPC and never returns previously selected contents after revocation',async t=>{
  const data=await communityFixture(t);
  for(const change of ['deadline','disable','credential']){
    const ctx=context(data);const token=await communityReviewCookie(ctx,data);let selected=false;
    data.database.afterRpc=async(name,packet)=>{
      if(name==='community_read'){
        assert.ok(JSON.stringify(packet.data).includes(COMMUNITY_MARKER),'Real SQL selected the synthetic contents before revocation');
        selected=true;revokeCommunityPolicy(ctx,change);
      }
    };
    const before=data.calls.rpcs.length;
    await assertCommunityDenied(await ctx.load('app/api/community/route.js').GET(communityRequest(token)),change);
    assert.equal(selected,true,`${change} must happen while awaiting the actual read RPC`);
    assert.equal(data.calls.rpcs.length,before+1,'Only the already-started read RPC may have run');
    assert.equal(data.calls.rpcs.at(-1).name,'community_read');
    data.database.afterRpc=null;
  }
});

test('Community refreshes review identity after a delayed request body before it starts any mutation',async t=>{
  const data=await communityFixture(t);
  for(const change of ['deadline','disable','credential']){
    const ctx=context(data);const token=await communityReviewCookie(ctx,data);let reached=false;
    const original=communityRequest(token,'POST',COMMUNITY_POST);
    const request=delayedCommunityBody(original,()=>{reached=true;revokeCommunityPolicy(ctx,change);});
    const before=data.calls.rpcs.length;
    await assertCommunityDenied(await ctx.load('app/api/community/route.js').POST(request),change);
    assert.equal(reached,true,'The policy change must occur after initial identity reads, while parsing the actual bounded body');
    assert.equal(data.calls.rpcs.length,before,`${change} must stop before the personal write RPC`);
    assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.community_posts')).rows[0].n,1);
  }
});

test('Live Apple-token detachment during Community awaits blocks contents and all not-yet-started mutations',async t=>{
  for(const stage of ['profile','body','read-rpc'])await t.test(stage,async t=>{
    const data=await communityFixture(t);const ctx=context(data);const token=await communityReviewCookie(ctx,data);
    let revoked=false;
    const detach=async()=>{if(!revoked){revoked=true;await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);}};
    if(stage==='profile')data.database.afterRead=async table=>{if(table==='community_profiles')await detach();};
    if(stage==='read-rpc')data.database.afterRpc=async(name,packet)=>{
      if(name==='community_read'){assert.ok(JSON.stringify(packet.data).includes(COMMUNITY_MARKER));await detach();}
    };
    const before=data.calls.rpcs.length;
    const request=stage==='body'?delayedCommunityBody(communityRequest(token,'POST',COMMUNITY_POST),detach):communityRequest(token);
    const route=ctx.load('app/api/community/route.js');
    await assertCommunityDenied(await(stage==='body'?route.POST(request):route.GET(request)),stage);
    assert.equal(revoked,true,'The detachment must occur inside the awaited operation');
    assert.equal(data.calls.rpcs.length,before+(stage==='read-rpc'?1:0));
    assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.community_posts')).rows[0].n,1);
    assert.equal((await data.pg.query('SELECT account_generation FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].account_generation,GENERATION);
  });
});

test('An actual ordinary email-code session keeps Community reading and writing without any review-token lookup',async t=>{
  const data=await communityFixture(t);const ctx=context(data,{APPLE_REVIEW_LOGIN_PASSWORD_HASH:'invalid'});
  await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
  const code='582046';const hash=await bcrypt.hash(code,10);
  await data.pg.query('INSERT INTO public.login_codes(email,code_hash,expires_at,attempts,requested_at) VALUES($1,$2,now()+interval\'10 minutes\',0,now())',[EMAIL,hash]);
  const login=await ctx.load('app/api/auth/verify-code/route.js').POST(new NextRequest('https://jagdlatein.de/api/auth/verify-code',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:EMAIL,code})}));
  assert.equal(login.status,200);const token=ctx.getCookie();
  assert.equal(ctx.load('lib/account-session.js').readAccountSession(token,ctx.now).authenticationMethod,undefined);
  const before=data.calls.readTables.length;const route=ctx.load('app/api/community/route.js');
  const response=await route.GET(communityRequest(token));assert.equal(response.status,200);
  const feed=await response.json();assert.equal(feed.posts[0].body,COMMUNITY_MARKER);assert.equal(feed.viewer.admin,false);
  const written=await route.POST(communityRequest(token,'POST',COMMUNITY_POST));assert.equal(written.status,200);
  const created=await written.json();assert.equal(created.success,true);assert.equal(created.status,'pending');
  assert.equal((await data.pg.query('SELECT status,account_email FROM public.community_posts WHERE id=$1',[created.postId])).rows[0].account_email,EMAIL);
  assert.ok(!data.calls.readTables.slice(before).includes('apple_account_tokens'),'Normal Community identity cannot depend on Review configuration or Apple ownership');
  assert.deepEqual(data.calls.rpcs.map(call=>call.name),['community_read','community_write']);
  assert.equal(data.calls.mail,0);
});
