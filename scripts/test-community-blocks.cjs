// Real in-memory PostgreSQL migrations; no remote service or actual account.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA,'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
const { PGlite } = require(runtime);
const root = path.resolve(__dirname,'..');
const A='blocker@example.invalid', B='blocked@example.invalid', C='other@example.invalid';
const GA='11111111-1111-4111-8111-111111111111', GB='22222222-2222-4222-8222-222222222222';
const GC='33333333-3333-4333-8333-333333333333';
let pg;
const sql = file => fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8');
test.before(async()=>{
  pg=new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root,'supabase/test-only/paypal-sandbox-bootstrap.sql'),'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  for(const file of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql',
    '20261004190000_learning_community.sql','20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql','20261008120000_apple_refund_ordering.sql','20261008140000_community_blocks.sql']) await pg.exec(sql(file));
});
test.after(async()=>{await pg?.close();});
async function fixture(){
  await pg.exec('TRUNCATE public.community_blocks,public.community_posts,public.community_profiles,public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation,is_admin) VALUES(gen_random_uuid(),$1,$2,false),(gen_random_uuid(),$3,$4,false),(gen_random_uuid(),$5,$6,true)',[A,GA,B,GB,C,GC]);
  await pg.query("INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,'Blocker','test'),($2,'Blocked','test'),($3,'Moderator Test','test')",[A,B,C]);
  const row=await pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body) VALUES($1,'allgemein','question','Die Frage des anderen','Ein gewöhnlicher Lernbeitrag.') RETURNING id",[B]);
  const own=await pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body) VALUES($1,'allgemein','question','Meine eigene Lernfrage','Ein anderer gewöhnlicher Lernbeitrag.') RETURNING id",[A]);
  return {post:row.rows[0].id,own:own.rows[0].id};
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
test('Blocking hides both authors in feeds and direct threads; unrelated users retain content',async()=>{
  const f=await fixture(); await write(A,'block',{postId:f.post});
  assert.equal((await read(A)).total,1); assert.equal((await read(B)).total,1);
  assert.equal((await read(C)).total,2);
  await assert.rejects(read(A,'thread',{threadId:f.post}),/JL_COMMUNITY_MISSING/);
  await assert.rejects(read(B,'thread',{threadId:f.own}),/JL_COMMUNITY_MISSING/);
  assert.equal((await read(C,'thread',{threadId:f.post})).thread.id,f.post);
});
test('Replies, unanswered filters, counts and pagination use server-side block filtering',async()=>{
  const f=await fixture();
  await pg.query("INSERT INTO public.community_posts(parent_id,account_email,category,kind,body) VALUES($1,$2,'allgemein','reply','Eine Antwort')",[f.own,B]);
  for(let i=0;i<14;i++) await pg.query("INSERT INTO public.community_posts(account_email,category,kind,title,body) VALUES($1,'allgemein','question',$2,'Eine zusätzliche Lernfrage')",[B,`Weitere Lernfrage ${i}`]);
  await write(A,'block',{postId:f.post});
  const page=await read(A,'posts',{unanswered:true});
  assert.equal(page.total,1); assert.equal(page.posts[0].replyCount,0);
  assert.equal((await read(A,'thread',{threadId:f.own})).replyTotal,0);
  assert.equal((await read(A,'posts',{page:2})).posts.length,0);
  await assert.rejects(write(B,'reply',{threadId:f.own,body:'Trotz Block antworten',acceptedRules:true}),/JL_COMMUNITY_BLOCKED/);
});
test('Only own opaque block IDs are disclosed and removable; duplicate block is idempotent',async()=>{
  const f=await fixture(); await write(A,'block',{postId:f.post}); await write(A,'block',{postId:f.post});
  const list=await read(A,'blocks'); assert.equal(list.blocks.length,1);
  assert.deepEqual(Object.keys(list.blocks[0]).sort(),['createdAt','displayName','id']);
  assert.ok(!JSON.stringify(list).includes('@')); assert.equal((await read(B,'blocks')).blocks.length,0);
  await assert.rejects(write(B,'unblock',{blockId:list.blocks[0].id}),/JL_COMMUNITY_MISSING/);
  await write(A,'unblock',{blockId:list.blocks[0].id});
  assert.equal((await read(A)).total,2);
  await assert.rejects(write(A,'block',{postId:f.own}),/JL_COMMUNITY_INVALID/);
});
test('Moderation reports remain visible to current admins even when personal blocks exist',async()=>{
  const f=await fixture(); await write(A,'report',{postId:f.post,reason:'Bitte fachlich prüfen'});
  await write(C,'block',{postId:f.post}); const reports=await read(C,'reports');
  assert.equal(reports.total,1); assert.equal(reports.reports[0].post.id,f.post);
  await assert.rejects(read(A,'reports'),/JL_COMMUNITY_FORBIDDEN/);
});
test('Account deletion removes both sides of blocks and old generations cannot mutate a recreated account',async()=>{
  const f=await fixture(); await write(A,'block',{postId:f.post});
  await pg.transaction(async tx=>{
    await tx.exec('SET LOCAL ROLE service_role;');
    await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify({'x-jagdlatein-account-email':B,'x-jagdlatein-account-generation':GB})]);
    assert.equal((await tx.query('SELECT public.delete_jagdlatein_account($1,$2) AS data',[B,GB])).rows[0].data.deleted,true);
  });
  assert.equal((await read(A,'blocks')).blocks.length,0);
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,gen_random_uuid())',[B]);
  await assert.rejects(rpc(B,'community_write','block',{postId:f.own},GB),/JL_ACCOUNT_GENERATION_MISMATCH/);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.community_blocks')).rows[0].n,0);
});
test('Browser roles have no block table/RPC access; private helpers stay inaccessible after reapplying migration',async()=>{
  await pg.exec(sql('20261008140000_community_blocks.sql'));
  for(const role of ['anon','authenticated']) {
    const rights=(await pg.query("SELECT has_table_privilege($1,'public.community_blocks','SELECT') AS read,has_table_privilege($1,'public.community_blocks','INSERT') AS write,has_function_privilege($1,'public.community_write(text,text,jsonb)','EXECUTE') AS rpc",[role])).rows[0];
    assert.deepEqual(rights,{read:false,write:false,rpc:false});
  }
  const privateRights=(await pg.query("SELECT has_function_privilege('service_role','public.jagdlatein_community_write_base(text,text,jsonb)','EXECUTE') AS write,has_function_privilege('service_role','public.jagdlatein_community_read_base(text,text,jsonb)','EXECUTE') AS read,(SELECT relrowsecurity FROM pg_class WHERE oid='public.community_blocks'::regclass) AS rls")).rows[0];
  assert.deepEqual(privateRights,{write:false,read:false,rls:true});
});
