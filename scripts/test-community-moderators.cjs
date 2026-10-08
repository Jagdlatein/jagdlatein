// Real local PostgreSQL and application routes with disposable synthetic identities.
// No user account, secret, provider, email or remote database is accessed.
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const {createRequire}=require('node:module');const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');const pr=createRequire(path.join(root,'package.json'));
const swc=pr('next/dist/build/swc');const {NextRequest,NextResponse}=pr('next/server');
const runtime=process.env.JL_PAYPAL_TEST_PGLITE_PATH||path.join(process.env.LOCALAPPDATA||'',
  'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if(!fs.existsSync(path.join(runtime,'package.json')))throw Error('Isolated PGlite is required; moderator tests may not be skipped.');
const {PGlite}=require(runtime);
const MOD='moderator@example.invalid',AUTHOR='author@example.invalid',ADMIN='administrator@example.invalid';
const MID='11111111-1111-4111-8111-111111111111',AID='22222222-2222-4222-8222-222222222222',
  SID='33333333-3333-4333-8333-333333333333',OTHERID='44444444-4444-4444-8444-444444444444';
const MG='55555555-5555-4555-8555-555555555555',AG='66666666-6666-4666-8666-666666666666',
  SG='77777777-7777-4777-8777-777777777777',NEWG='88888888-8888-4888-8888-888888888888';
const migration='20261008170000_community_moderators.sql';
const SECRET='synthetic-community-role-session-secret-longer-than-32';
const PRIVATE_BODY='SYNTHETIC-PENDING-CONTENT-NOT-PUBLIC';
const sql=name=>fs.readFileSync(path.join(root,'supabase/migrations',name),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));let pg;
test.before(async()=>{
  pg=new PGlite();await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root,'supabase/test-only/paypal-sandbox-bootstrap.sql'),'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  for(const name of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql',
    '20261004190000_learning_community.sql','20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql','20261008120000_apple_refund_ordering.sql','20261008140000_community_blocks.sql',
    '20261008150000_apple_review_login_rate_limits.sql','20261008160000_community_premoderation.sql',migration])await pg.exec(sql(name));
});
test.after(async()=>{await pg?.close();});
async function fixture(){
  await pg.exec('TRUNCATE public.community_blocks,public.community_posts,public.community_profiles,public.apple_account_tokens,public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation,is_admin) VALUES($1,$2,$3,false),($4,$5,$6,false),($7,$8,$9,true)',
    [MID,MOD,MG,AID,AUTHOR,AG,SID,ADMIN,SG]);
  await pg.query("INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,'Pruefmoderator','test'),($2,'Waldlerner','test'),($3,'Pruefadmin','test')",[MOD,AUTHOR,ADMIN]);
  const posts=(await pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body,status) VALUES($1,'allgemein','question','Eine private neue Frage',$2,'pending'),($1,'allgemein','question','Eine sichtbare Lernfrage','Ein oeffentlich sichtbarer Lerninhalt.','visible'),($1,'allgemein','question','Ein ausgeblendetes Thema','SYNTHETIC-HIDDEN-CONTENT','hidden') RETURNING id,status",[AUTHOR,PRIVATE_BODY])).rows;
  return{pending:posts.find(x=>x.status==='pending').id,visible:posts.find(x=>x.status==='visible').id,hidden:posts.find(x=>x.status==='hidden').id};
}
const generation=email=>({[MOD]:MG,[AUTHOR]:AG,[ADMIN]:SG})[email];
async function service(call){return pg.transaction(async tx=>{await tx.exec('SET LOCAL ROLE service_role;');return call(tx);});}
async function setModerator(enabled,id=MID,gen=MG){
  return(await service(tx=>tx.query('SELECT public.set_community_moderator($1,$2,$3) AS result',[id,gen,enabled]))).rows[0].result;
}
async function community(email,name,operation,payload={},gen=generation(email)){
  return(await service(async tx=>{
    await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify({'x-jagdlatein-account-email':email,'x-jagdlatein-account-generation':gen})]);
    return tx.query(name==='community_read'?'SELECT public.community_read($1,$2,$3::jsonb) AS result':'SELECT public.community_write($1,$2,$3::jsonb) AS result',[email,operation,JSON.stringify(payload)]);
  })).rows[0].result;
}
const read=(email,mode='posts',options={},gen)=>community(email,'community_read',mode,options,gen);
const write=(email,action,payload)=>community(email,'community_write',action,payload);
async function flags(email=MOD){return(await pg.query('SELECT user_id,account_generation,is_admin,is_premium,is_community_moderator FROM public.userprofile WHERE email=$1',[email])).rows[0];}

function context(email=MOD,gen=generation(email),access={}){
  const calls={reads:[],rpcs:[]};const env={NODE_ENV:'production',JL_SESSION_SECRET:SECRET,
    SUPABASE_URL:'https://synthetic.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-not-a-key',
    ACCOUNT_GENERATION_ENABLED:'true',ACCOUNT_DELETION_ENABLED:'true'};
  let token;const cookieJar={get:name=>name==='jl_account_session'?{value:token}:undefined,set(){}};
  const database={requestHeaders:{},
    from(table){assert.ok(['userprofile','community_profiles','apple_account_tokens'].includes(table));const filters=[];
      const query={select(){return query;},eq(column,value){assert.ok(['account_email','app_account_token'].includes(column));filters.push([column,value]);return query;},
        ilike(column,value){assert.equal(column,'email');filters.push([column,value.replace(/\\([\\%_])/g,'$1')]);return query;},
        async maybeSingle(){calls.reads.push(table);const values=filters.map(x=>x[1]);
          const rows=(await pg.query(`SELECT * FROM public.${table} WHERE ${filters.map(([column],i)=>`${column}=$${i+1}`).join(' AND ')}`,values)).rows;
          const packet={data:rows[0]||null,error:null};if(database.afterRead)await database.afterRead(table,packet);return packet;}};
      return query;},
    async rpc(name,args){calls.rpcs.push({name,args:plain(args)});assert.ok(['community_read','community_write'].includes(name));
      try{const result=await service(async tx=>{
        await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify(database.requestHeaders)]);
        return tx.query(name==='community_read'?'SELECT public.community_read($1,$2,$3::jsonb) AS result':'SELECT public.community_write($1,$2,$3::jsonb) AS result',
          [args.p_actor_email,name==='community_read'?args.p_mode:args.p_action,JSON.stringify(name==='community_read'?args.p_options:args.p_payload)]);
      });const packet={data:result.rows[0].result,error:null};if(database.afterRpc)await database.afterRpc(name,packet);return packet;}
      catch(error){return{data:null,error};}}
  };
  const cache=new Map();const sandbox=vm.createContext({process:{env},Buffer,Date,URL,Response,Request,Headers,
    TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,atob,AbortSignal,console,
    fetch:async()=>{throw Error('Moderator tests must not contact any provider');}});
  function load(relative){
    const filename=path.join(root,relative);if(cache.has(filename))return cache.get(filename).exports;
    const module={exports:{}};cache.set(filename,module);
    const {code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022'},module:{type:'commonjs'}});
    const requireLocal=id=>{
      if(id==='next/server')return{NextResponse};if(id==='next/headers')return{cookies:async()=>cookieJar};
      if(id==='@supabase/supabase-js')return{createClient(url,key,options){database.requestHeaders=plain(options?.global?.headers||{});return database;}};
      if(id==='./subscription-access'||id==='../../../lib/subscription-access')return{resolveSubscriptionAccess:async()=>({paid:false,paidUntil:null,accessType:'none'})};
      if(id.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(filename),`${id}.js`)));return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`,sandbox)(requireLocal,module,module.exports);return module.exports;
  }
  token=load('lib/account-session.js').createAccountSession(email,Date.now(),{
    authenticatedAt:Math.floor(Date.now()/1000),accountGeneration:gen,paid:false,admin:false,...access});
  function request(method='GET',body,selection=''){
    return new NextRequest(`https://jagdlatein.de/api/community${selection}`,{method,
      headers:{origin:'https://jagdlatein.de','content-type':'application/json',cookie:`jl_account_session=${token}`},
      ...(body?{body:JSON.stringify(body)}:{})});
  }
  return{database,calls,env,load,token,request};
}

test('The migration grants no moderator role and creates only a false nonnullable scoped flag',async()=>{
  await fixture();assert.deepEqual(await flags(),{user_id:MID,account_generation:MG,is_admin:false,is_premium:false,is_community_moderator:false});
  const column=(await pg.query("SELECT is_nullable,data_type,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='userprofile' AND column_name='is_community_moderator'")).rows[0];
  assert.equal(column.is_nullable,'NO');assert.equal(column.data_type,'boolean');assert.equal(column.column_default,'false');
  await assert.rejects(read(MOD,'moderation'),/JL_COMMUNITY_FORBIDDEN/);
});
test('Service-only grant binds both exact user ID and generation; malformed/mismatched targets cannot elevate any account',async()=>{
  await fixture();const before=await flags();
  for(const [id,gen,enabled]of [[OTHERID,MG,true],[MID,NEWG,true],[AID,MG,true],[null,MG,true],[MID,null,true],[MID,MG,null]])
    await assert.rejects(setModerator(enabled,id,gen));
  assert.deepEqual(await flags(),before);assert.equal((await flags(AUTHOR)).is_community_moderator,false);
  assert.deepEqual(await setModerator(true),{updated:true,enabled:true});
  assert.deepEqual(await flags(),{...before,is_community_moderator:true});
});
test('Browser roles cannot execute role assignment or directly mutate the scoped flag',async()=>{
  await fixture();
  for(const role of ['anon','authenticated']){
    const rights=(await pg.query("SELECT has_function_privilege($1,'public.set_community_moderator(uuid,uuid,boolean)','EXECUTE') AS rpc,has_column_privilege($1,'public.userprofile','is_community_moderator','UPDATE') AS direct",[role])).rows[0];
    assert.deepEqual(rights,{rpc:false,direct:false});
    await pg.exec(`SET ROLE ${role}`);
    try{
      await assert.rejects(pg.query('SELECT public.set_community_moderator($1,$2,true)',[MID,MG]),/permission denied/);
      await assert.rejects(pg.query('UPDATE public.userprofile SET is_community_moderator=true WHERE user_id=$1',[MID]),/permission denied/);
    }finally{await pg.exec('RESET ROLE');}
  }
  assert.equal((await pg.query("SELECT has_function_privilege('service_role','public.set_community_moderator(uuid,uuid,boolean)','EXECUTE') AS allowed")).rows[0].allowed,true);
  assert.equal((await flags()).is_community_moderator,false);
});
test('A nonadmin moderator can inspect pending/reported/hidden content, publish replies and resolve Community reports only',async()=>{
  const f=await fixture();await setModerator(true);
  const queue=await read(MOD,'moderation');assert.equal(queue.posts[0].body,PRIVATE_BODY);assert.equal(queue.moderationAuthorized,true);
  assert.equal((await read(MOD)).posts.some(x=>x.id===f.hidden),true);
  assert.equal((await read(MOD,'thread',{threadId:f.pending})).thread.id,f.pending);
  await write(MOD,'moderate',{postId:f.pending,status:'visible'});
  await write(MOD,'mark-solved',{postId:f.pending,solved:true});
  assert.equal((await read(AUTHOR,'thread',{threadId:f.pending})).thread.solved,true);
  await write(MOD,'report',{postId:f.visible,reason:'Ein synthetischer Pruefhinweis.'});
  const report=(await read(MOD,'reports')).reports[0];await write(MOD,'resolve-report',{reportId:report.id});
  assert.equal((await read(MOD,'reports')).total,0);
  assert.equal((await flags()).is_admin,false);assert.equal((await flags()).is_premium,false);
});
test('The real API exposes canModerate independently while general admin and unpaid course access stay false',async()=>{
  await fixture();await setModerator(true);const ctx=context();const route=ctx.load('app/api/community/route.js');
  const response=await route.GET(ctx.request('GET',null,'?view=moderation'));assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.viewer.canModerate,true);assert.equal(data.viewer.admin,false);
  assert.ok(!Object.hasOwn(data,'moderationAuthorized'));assert.ok(!JSON.stringify(data).includes('@'));
  const account=ctx.load('lib/account-access.js');const access=await account.getSignedAccountAccess(ctx.request(),{refresh:true});
  assert.equal(access.admin,false);assert.equal(access.paid,false);
  await assert.rejects(account.requirePaidAccount(ctx.request()),e=>e.status===403);
  await assert.rejects(ctx.load('lib/adminGuard.js').requireAdmin(),e=>e.status===401);
  const status=await ctx.load('app/api/auth/status/route.js').GET();assert.equal(status.status,200);
  assert.deepEqual(await status.json(),{loggedIn:true,email:MOD,paid:false,admin:false});
});
test('Forged cookie admin/capability flags and request-body role overrides never grant Community authority',async()=>{
  const f=await fixture();const ctx=context(MOD,MG,{admin:true,canModerate:true});const route=ctx.load('app/api/community/route.js');
  assert.equal((await route.GET(ctx.request('GET',null,'?view=moderation&canModerate=true'))).status,403);
  assert.equal((await route.PATCH(ctx.request('PATCH',{action:'moderate',postId:f.pending,status:'visible'}))).status,403);
  const payload={action:'post',category:'wildkunde',type:'question',title:'Eine neue Frage zum Lernen',body:'Ein normaler synthetischer Lernbeitrag.',acceptedRules:true};
  for(const extra of [{is_community_moderator:true},{canModerate:true},{moderator:true},{action:'set-community-moderator'}])
    assert.equal((await route.POST(ctx.request('POST',{...payload,...extra}))).status,400);
  assert.equal((await flags()).is_community_moderator,false);assert.equal(ctx.calls.rpcs.length,0);
});
test('Revocation takes effect on the same signed cookie and SQL denies later moderation but preserves ordinary reading',async()=>{
  const f=await fixture();await setModerator(true);const ctx=context();const route=ctx.load('app/api/community/route.js');
  assert.equal((await route.GET(ctx.request('GET',null,'?view=moderation'))).status,200);
  assert.deepEqual(await setModerator(false),{updated:true,enabled:false});
  assert.equal((await route.GET(ctx.request('GET',null,'?view=moderation'))).status,403);
  assert.equal((await route.PATCH(ctx.request('PATCH',{action:'moderate',postId:f.pending,status:'visible'}))).status,403);
  await assert.rejects(write(MOD,'moderate',{postId:f.pending,status:'visible'}),/JL_COMMUNITY_FORBIDDEN/);
  const response=await route.GET(ctx.request());assert.equal(response.status,200);
  const ordinary=await response.json();assert.equal(ordinary.viewer.canModerate,false);assert.equal(ordinary.posts.length,1);
  assert.ok(!JSON.stringify(ordinary).includes(PRIVATE_BODY));
});
test('Revocation during the actual privileged read RPC prevents all selected private contents from being returned',async()=>{
  await fixture();await setModerator(true);const ctx=context();let selected=false;
  ctx.database.afterRpc=async(name,packet)=>{if(name==='community_read'){
    assert.equal(packet.data.moderationAuthorized,true);assert.ok(JSON.stringify(packet.data).includes(PRIVATE_BODY));
    selected=true;await setModerator(false);
  }};
  const response=await ctx.load('app/api/community/route.js').GET(ctx.request('GET',null,'?view=moderation'));
  assert.equal(selected,true);assert.equal(response.status,403);assert.ok(!JSON.stringify(await response.json()).includes(PRIVATE_BODY));
  assert.deepEqual(ctx.calls.rpcs.map(x=>x.name),['community_read']);
});
test('Revocation while parsing a moderation body is checked before the write RPC begins',async()=>{
  const f=await fixture();await setModerator(true);const ctx=context();let revoked=false;
  const original=ctx.request('PATCH',{action:'moderate',postId:f.pending,status:'visible'});
  const request={url:original.url,method:original.method,headers:original.headers,body:{getReader(){const reader=original.body.getReader();return{
    async read(){const result=await reader.read();if(!revoked){revoked=true;await setModerator(false);}return result;},
    cancel(){return reader.cancel();},releaseLock(){reader.releaseLock();}
  };}}};
  const response=await ctx.load('app/api/community/route.js').PATCH(request);assert.equal(revoked,true);assert.equal(response.status,403);
  assert.equal(ctx.calls.rpcs.length,0);assert.equal((await pg.query('SELECT status FROM public.community_posts WHERE id=$1',[f.pending])).rows[0].status,'pending');
});
test('Deleting and recreating the same email never inherits moderator rights or accepts old IDs/generation/cookies',async()=>{
  await fixture();await setModerator(true);const ctx=context();
  await service(async tx=>{
    await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify({'x-jagdlatein-account-email':MOD,'x-jagdlatein-account-generation':MG})]);
    await tx.query('SELECT public.delete_jagdlatein_account($1,$2)',[MOD,MG]);
  });
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES($1,$2,$3)',[OTHERID,MOD,NEWG]);
  const recreated=await flags();assert.equal(recreated.is_community_moderator,false);assert.equal(recreated.is_admin,false);
  await assert.rejects(setModerator(true,MID,MG));await assert.rejects(setModerator(true,OTHERID,MG));await assert.rejects(setModerator(true,MID,NEWG));
  assert.equal((await ctx.load('app/api/community/route.js').GET(ctx.request('GET',null,'?view=moderation'))).status,401);
  await assert.rejects(read(MOD,'moderation',{},MG),/JL_ACCOUNT_GENERATION_MISMATCH/);
  assert.equal((await flags()).is_community_moderator,false);assert.equal((await flags(AUTHOR)).is_community_moderator,false);
});
test('Migration rerun preserves assigned roles and posts while private bases remain inaccessible',async()=>{
  await fixture();await setModerator(true);const profiles=(await pg.query('SELECT to_jsonb(p) AS data FROM public.userprofile p ORDER BY user_id')).rows;
  const posts=(await pg.query('SELECT to_jsonb(p) AS data FROM public.community_posts p ORDER BY id')).rows;
  await pg.exec(sql(migration));
  assert.deepEqual((await pg.query('SELECT to_jsonb(p) AS data FROM public.userprofile p ORDER BY user_id')).rows,profiles);
  assert.deepEqual((await pg.query('SELECT to_jsonb(p) AS data FROM public.community_posts p ORDER BY id')).rows,posts);
  assert.equal((await read(MOD,'moderation')).total,1);
  for(const signature of ['public.jagdlatein_community_read_base(text,text,jsonb)',
    'public.jagdlatein_community_write_base(text,text,jsonb)','public.jagdlatein_community_blocking_write_base(text,text,jsonb)'])
    for(const role of ['anon','authenticated','service_role'])
      assert.equal((await pg.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') AS allowed',[role,signature])).rows[0].allowed,false);
});
test('An elevated Community moderator cannot reserve or use the private unprivileged Apple-review password login',async()=>{
  await fixture();const token=(await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS data',[MOD,MG])).rows[0].data.app_account_token;
  await setModerator(true);
  const attempt=(await service(tx=>tx.query('SELECT public.reserve_apple_review_login_attempt($1,$2,$3) AS data',[MG,token,'b'.repeat(64)]))).rows[0].data;
  assert.equal(attempt.allowed,false);assert.equal(attempt.identityMissing,true);
  assert.equal((await pg.query('SELECT count(*)::integer AS n FROM public.apple_review_login_limits WHERE account_generation=$1',[MG])).rows[0].n,0);
});
