// Synthetic identities, actual local SQL and real JS/SSR rendering; no provider traffic.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA, 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
const { PGlite } = require(runtime);
const A='author@example.invalid', B='reader@example.invalid', C='reviewer@example.invalid';
const GA='11111111-1111-4111-8111-111111111111', GB='22222222-2222-4222-8222-222222222222', GC='33333333-3333-4333-8333-333333333333';
const ID='44444444-4444-4444-8444-444444444444';
const migration='20261008160000_community_premoderation.sql';
let pg;
const sql = name => fs.readFileSync(path.join(root, 'supabase/migrations', name), 'utf8');
test.before(async()=>{
  pg=new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root,'supabase/test-only/paypal-sandbox-bootstrap.sql'),'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  for(const name of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql',
    '20261004190000_learning_community.sql','20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql','20261008120000_apple_refund_ordering.sql','20261008140000_community_blocks.sql',
    '20261008150000_apple_review_login_rate_limits.sql',migration]) await pg.exec(sql(name));
});
test.after(async()=>{await pg?.close();});
async function fixture(){
  await pg.exec('TRUNCATE public.community_blocks,public.community_posts,public.community_profiles,public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation,is_admin) VALUES(gen_random_uuid(),$1,$2,false),(gen_random_uuid(),$3,$4,false),(gen_random_uuid(),$5,$6,true)',[A,GA,B,GB,C,GC]);
  await pg.query("INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,'Lernfuchs','test'),($2,'Waldlerner','test'),($3,'Revierblick','test')",[A,B,C]);
  const rows=(await pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body,status) VALUES($1,'allgemein','question','Bestehende Lernfrage','Vorher bereits sichtbarer Inhalt.','visible'),($2,'allgemein','question','Anderes altes Thema','Ein ebenfalls sichtbarer Beitrag.','visible') RETURNING id",[A,B])).rows;
  return {root:rows[0].id,other:rows[1].id};
}
function generation(email){return {[A]:GA,[B]:GB,[C]:GC}[email];}
async function rpc(email,name,action,payload={},gen=generation(email)){
  return pg.transaction(async tx=>{
    await tx.exec('SET LOCAL ROLE service_role;');
    await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify({'x-jagdlatein-account-email':email,'x-jagdlatein-account-generation':gen})]);
    return (await tx.query(`SELECT public.${name}($1,$2,$3::jsonb) AS data`,[email,action,JSON.stringify(payload)])).rows[0].data;
  });
}
const write=(email,action,payload)=>rpc(email,'community_write',action,payload);
const read=(email,mode='posts',options={})=>rpc(email,'community_read',mode,options);
const post=(email=A,extra={})=>write(email,'post',{category:'wildkunde',type:'question',title:'Eine neue Frage zum Lernen',body:'Beobachtungen und verlässliche Quellen vergleichen.',acceptedRules:true,...extra});

test('New topics are pending even with supplied approved status; ordinary feeds/search/direct routes do not leak them',async()=>{
  await fixture(); const created=await post(A,{status:'visible',approvedStatus:'visible',moderatorFlag:true});
  assert.equal(created.status,'pending');
  assert.equal((await read(B)).total,2);
  assert.equal((await read(B,'posts',{query:'Beobachtungen'})).total,0);
  await assert.rejects(read(B,'thread',{threadId:created.postId}),/JL_COMMUNITY_MISSING/);
  const own=await read(A,'thread',{threadId:created.postId}); assert.equal(own.thread.status,'pending');
  assert.equal((await read(A,'submissions')).posts[0].id,created.postId);
  assert.equal((await read(B,'submissions')).total,0);
  const queue=await read(C,'moderation'); assert.equal(queue.posts[0].displayName,'Lernfuchs');
  assert.ok(!JSON.stringify(queue).includes('@'));
});
test('Pending reply bodies and counts are visible only to their author/current moderators, and unanswered stays public-only',async()=>{
  const f=await fixture(); const submitted=await write(B,'reply',{threadId:f.root,body:'Ein Gedanke zur Frage.',acceptedRules:true});
  assert.equal(submitted.status,'pending');
  assert.equal((await read(A,'thread',{threadId:f.root})).replyTotal,0);
  assert.equal((await read(B,'thread',{threadId:f.root})).replyTotal,1);
  assert.equal((await read(C,'thread',{threadId:f.root})).replies[0].status,'pending');
  assert.equal((await read(A,'posts',{unanswered:true})).total,2);
  assert.equal((await read(A)).posts.find(x=>x.id===f.root).replyCount,0);
  await write(C,'moderate',{postId:submitted.postId,status:'visible'});
  assert.equal((await read(A,'thread',{threadId:f.root})).replyTotal,1);
  assert.equal((await read(A,'posts',{unanswered:true})).total,1);
});

test('Private submissions and rejection do not change public thread activity or order; actual answer publication does',async()=>{
  const f=await fixture();
  await pg.query("UPDATE public.community_posts SET updated_at=CASE WHEN id=$1 THEN '2026-01-01'::timestamptz ELSE '2026-02-01'::timestamptz END",[f.root]);
  const before=(await read(A)).posts;
  const submitted=await write(B,'reply',{threadId:f.root,body:'Eine noch private Antwort.',acceptedRules:true});
  assert.deepEqual((await read(A)).posts,before);
  await write(C,'moderate',{postId:submitted.postId,status:'hidden'});
  assert.deepEqual((await read(A)).posts,before);
  await write(C,'moderate',{postId:submitted.postId,status:'visible'});
  const published=(await read(A)).posts;
  assert.equal(published[0].id,f.root);
  assert.equal(published[0].replyCount,1);
  assert.ok(Date.parse(published[0].updatedAt)>Date.parse(before.find(x=>x.id===f.root).updatedAt));
});
test('Approval and rejection require current moderator authority; rejection remains private to its author',async()=>{
  await fixture(); const created=await post();
  await assert.rejects(read(A,'moderation'),/JL_COMMUNITY_FORBIDDEN/);
  await assert.rejects(write(A,'moderate',{postId:created.postId,status:'visible'}),/JL_COMMUNITY_FORBIDDEN/);
  await write(C,'moderate',{postId:created.postId,status:'hidden'});
  assert.equal((await read(B)).total,2); assert.equal((await read(A,'submissions')).posts[0].status,'hidden');
  await assert.rejects(read(B,'thread',{threadId:created.postId}),/JL_COMMUNITY_MISSING/);
  await pg.query('UPDATE public.userprofile SET is_admin=false WHERE email=$1',[C]);
  await assert.rejects(read(C,'moderation'),/JL_COMMUNITY_FORBIDDEN/);
  await assert.rejects(write(C,'moderate',{postId:created.postId,status:'visible'}),/JL_COMMUNITY_FORBIDDEN/);
});
test('Private queue pagination counts only pending content; author pagination cannot count another author',async()=>{
  await fixture();
  for(let i=0;i<45;i++) await pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body) VALUES($1,'allgemein','question',$2,'Ein neu eingereichter Lerninhalt.')",[i<17?A:B,`Noch zu prüfende Frage ${i}`]);
  const queue=await read(C,'moderation',{page:2}); assert.equal(queue.total,45); assert.equal(queue.posts.length,20); assert.equal(queue.pageSize,20);
  assert.equal((await read(A,'submissions',{page:2})).total,17); assert.equal((await read(A,'submissions',{page:2})).posts.length,0);
  assert.equal((await read(B)).total,2);
});
test('Blocks still reject replies and block later approval of pending cross-profile replies; staff queue remains reviewable',async()=>{
  const f=await fixture(); const pending=await write(B,'reply',{threadId:f.root,body:'Noch nicht freigegebene Antwort.',acceptedRules:true});
  await write(A,'block',{postId:f.other});
  await assert.rejects(write(B,'reply',{threadId:f.root,body:'Trotzdem antworten.',acceptedRules:true}),/JL_COMMUNITY_BLOCKED/);
  assert.equal((await read(C,'moderation')).posts[0].canApprove,false);
  await assert.rejects(write(C,'moderate',{postId:pending.postId,status:'visible'}),/JL_COMMUNITY_BLOCKED/);
  await write(C,'block',{postId:f.other});
  assert.equal((await read(C,'moderation')).posts[0].id,pending.postId);
  await write(C,'moderate',{postId:pending.postId,status:'hidden'});
  assert.equal((await read(B,'submissions')).posts[0].status,'hidden');
  await assert.rejects(write(C,'moderate',{postId:pending.postId,status:'visible'}),/JL_COMMUNITY_BLOCKED/);
});
test('Replies cannot be published after their parent is hidden/deleted; rejection and owner removal still work',async()=>{
  const f=await fixture(); const pending=await write(B,'reply',{threadId:f.root,body:'Eine Antwort vor der Themenänderung.',acceptedRules:true});
  await write(A,'delete',{postId:f.root});
  await assert.rejects(write(C,'moderate',{postId:pending.postId,status:'visible'}),/JL_COMMUNITY_PENDING_PARENT/);
  await write(C,'moderate',{postId:pending.postId,status:'hidden'});
  await assert.rejects(write(C,'moderate',{postId:pending.postId,status:'visible'}),/JL_COMMUNITY_PENDING_PARENT/);
  await write(B,'delete',{postId:pending.postId});
  assert.equal((await read(B,'submissions')).total,0);
});
test('Migration reapplication changes no existing content or accounts and retains private helpers/RLS',async()=>{
  const f=await fixture(); const pending=await post();
  const before=(await pg.query('SELECT to_jsonb(p) AS row FROM public.community_posts p ORDER BY id')).rows;
  await pg.exec(sql(migration));
  assert.deepEqual((await pg.query('SELECT to_jsonb(p) AS row FROM public.community_posts p ORDER BY id')).rows,before);
  assert.equal((await read(B,'thread',{threadId:f.root})).thread.status,'visible');
  assert.equal((await read(A,'submissions')).posts[0].id,pending.postId);
  for(const role of ['anon','authenticated']) {
    const rights=(await pg.query("SELECT has_table_privilege($1,'public.community_posts','SELECT,INSERT,UPDATE,DELETE') AS table_access,has_function_privilege($1,'public.community_write(text,text,jsonb)','EXECUTE') AS rpc",[role])).rows[0];
    assert.deepEqual(rights,{table_access:false,rpc:false});
  }
  const rights=(await pg.query("SELECT has_function_privilege('service_role','public.jagdlatein_community_blocking_write_base(text,text,jsonb)','EXECUTE') AS blocks,has_function_privilege('service_role','public.jagdlatein_community_read_base(text,text,jsonb)','EXECUTE') AS read,(SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN ('public.community_posts'::regclass,'public.community_blocks'::regclass)) AS rls")).rows[0];
  assert.deepEqual(rights,{blocks:false,read:false,rls:true});
});
test('Current generation/deletion guards cover private drafts, moderation and same-email recreation',async()=>{
  await fixture(); const pending=await post();
  await assert.rejects(rpc(C,'community_read','moderation',{},GA),/JL_ACCOUNT_GENERATION_MISMATCH/);
  await pg.transaction(async tx=>{
    await tx.exec('SET LOCAL ROLE service_role;');
    await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify({'x-jagdlatein-account-email':A,'x-jagdlatein-account-generation':GA})]);
    await tx.query('SELECT public.delete_jagdlatein_account($1,$2)',[A,GA]);
  });
  assert.equal((await read(C,'moderation')).total,0);
  assert.equal((await pg.query('SELECT status,account_email FROM public.community_posts WHERE id=$1',[pending.postId])).rows[0].account_email,null);
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,gen_random_uuid())',[A]);
  await assert.rejects(rpc(A,'community_read','submissions',{},GA),/JL_ACCOUNT_GENERATION_MISMATCH/);
});
test('Existing moderator reports remain available independently of private pending content and personal blocks',async()=>{
  const f=await fixture(); await write(A,'report',{postId:f.other,reason:'Bitte die Aussage prüfen.'}); await post();
  await write(C,'block',{postId:f.other});
  const reports=await read(C,'reports'); assert.equal(reports.total,1); assert.equal(reports.reports[0].post.id,f.other);
});

function load(relative, overrides={}, cache=new Map()) {
  const filename=path.join(root,relative); if(cache.has(filename)) return cache.get(filename).exports;
  const mod={exports:{}}; cache.set(filename,mod);
  const {code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  new Function('require','module','exports',code)(id=>{
    if(Object.hasOwn(overrides,id)) return overrides[id];
    if(id==='next/router') return {useRouter:()=>({push(){}})};
    if(id==='next/link') return ({href,children,...props})=>React.createElement('a',{href:typeof href==='string'?href:href.pathname,...props},children);
    if(id==='next/head') return ({children})=>React.createElement(React.Fragment,null,children);
    if(id.endsWith('.module.css')) return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
    if(id.startsWith('.')) return load(path.relative(root,path.resolve(path.dirname(filename),id+'.js')),overrides,cache);
    return pr(id);
  },mod,mod.exports); return mod.exports;
}
function apiContext(admin=false, readData={posts:[],total:0,page:1,pageSize:20}) {
  const calls=[]; const profile={email:A,account_generation:GA,is_admin:admin};
  const db={from(table){const q={select(){return q;},ilike(){return q;},eq(){return q;},async maybeSingle(){return {data:table==='userprofile'?profile:{display_name:'Lernfuchs'},error:null};}};return q;},
    async rpc(name,args){calls.push({name,args});return {data:name==='community_read'?readData:{success:true,postId:ID,status:'pending',account_email:A,moderatorFlag:true},error:null};}};
  const overrides={'@supabase/supabase-js':{createClient:()=>db},'./account-access':{readRequestAccountSession:()=>({email:A,accountGeneration:GA,admin:true})},'./account-session':{accountDatabaseOptions:()=>({}),isAccountSessionConfigured:()=>true,isAccountGenerationEnabled:()=>true,matchesAccountGeneration:(p,s)=>p.account_generation===s.accountGeneration}};
  const original={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};
  process.env.SUPABASE_URL='https://isolated.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic';
  const server=load('lib/community-server.js',overrides);
  const request=(method='GET',body,query='')=>new Request('https://jagdlatein.test/api/community'+query,{method,headers:{origin:'https://jagdlatein.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  return {server,calls,request,profile,cleanup(){for(const [key,value] of Object.entries(original)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}};
}
test('API rejects moderation/status spoofing and gates the queue on the current database role',async()=>{
  const ctx=apiContext();try{
    await assert.rejects(ctx.server.getCommunity(ctx.request('GET',null,'?view=moderation&admin=true')),e=>e.status===403);assert.equal(ctx.calls.length,0);
    const body={action:'post',category:'wildkunde',type:'question',title:'Eine neue Lernfrage',body:'Eine ordentliche Frage mit Kontext.',acceptedRules:true};
    for(const extra of [{status:'visible'},{approvedStatus:'visible'},{moderatorFlag:true}]) await assert.rejects(ctx.server.writeCommunity(ctx.request('POST',{...body,...extra})),e=>e.status===400);
    await assert.rejects(ctx.server.writeCommunity(ctx.request('PATCH',{action:'moderate',postId:ID,status:'visible'})),e=>e.status===403);
    const result=await ctx.server.writeCommunity(ctx.request('POST',body));assert.deepEqual(result,{success:true,postId:ID,status:'pending'});
  }finally{ctx.cleanup();}
});
test('Private queue output keeps the actual learner name/status and strips database identities and injected flags',async()=>{
  const ctx=apiContext(true,{posts:[{id:ID,title:'Neue Lernfrage',body:'Nur privat zu prüfen.',displayName:'Lernfuchs',status:'pending',owned:false,account_email:A,moderatorFlag:true,canApprove:false}],total:1,page:1,pageSize:20});try{
    const data=await ctx.server.getCommunity(ctx.request('GET',null,'?view=moderation'));
    assert.equal(data.posts[0].displayName,'Lernfuchs');assert.equal(data.posts[0].canApprove,false);assert.equal(data.pageSize,20);
    assert.ok(!JSON.stringify(data).includes('@'));assert.ok(!Object.hasOwn(data.posts[0],'moderatorFlag'));
    ctx.profile.is_admin=false;await assert.rejects(ctx.server.getCommunity(ctx.request('GET',null,'?view=moderation')),e=>e.status===403);
  }finally{ctx.cleanup();}
});
test('SSR renders private status, learner identity, accessible staff decisions, and no author approval controls',()=>{
  const {CommunitySubmission}=load('components/Community.js');
  const post={id:ID,title:'Neue Lernfrage',body:'<script>unsafe()</script>',displayName:'Lernfuchs',status:'pending',owned:true,createdAt:'2026-10-08T12:00:00Z',canApprove:false};
  const render=admin=>renderToStaticMarkup(React.createElement(CommunitySubmission,{post,admin,mutate(){},setRemoval(){}}));
  const own=render(false);assert.match(own,/noch nicht öffentlich/);assert.ok(!own.includes('Freigeben')&&!own.includes('Ablehnen'));
  const staff=render(true);assert.match(staff,/Öffentlicher Lernname/);assert.match(staff,/kein fachliches Prüfsiegel/);
  assert.match(staff,/aria-label="Beitrag von Lernfuchs freigeben" disabled=""|disabled="" aria-label="Beitrag von Lernfuchs freigeben"/);
  assert.ok(staff.includes('&lt;script&gt;')&&!staff.includes('<script>'));
});
