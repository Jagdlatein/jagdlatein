// Isolated PostgreSQL/WASM, synthetic accounts only. Never a live database.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {root,createLoader}=require('./helpers/project-module.cjs');
const runtime=process.env.JL_PAYPAL_TEST_PGLITE_PATH||path.join(process.env.LOCALAPPDATA||'','Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if(!fs.existsSync(runtime))throw Error('Use the existing isolated PGlite runtime.');
const {PGlite}=require(runtime);
const beforeSql=fs.readFileSync(path.join(root,'supabase/migrations/20261108120000_usage_analytics.sql'),'utf8').replace(/\r\n/g,'\n');
const afterSql=fs.readFileSync(path.join(root,'supabase/migrations/20261126090000_revierduell_usage_events.sql'),'utf8').replace(/\r\n/g,'\n');
const actorSql=fs.readFileSync(path.join(root,'supabase/migrations/20261007120000_account_deletion.sql'),'utf8').match(/CREATE OR REPLACE FUNCTION public\.require_current_request_actor\(\)[\s\S]*?END \$\$;/)[0];
const analytics=createLoader()('lib/revierduell-analytics.js'),names=analytics.REVIERDUELL_ANALYTICS_EVENTS;
const A='synthetic-learner@example.invalid',B='synthetic-optout@example.invalid',G='11111111-1111-4111-8111-111111111111',H='22222222-2222-4222-8222-222222222222';
const oldList="'page_view','navigation','action','expand','video_play'",newList=oldList+','+names.map(name=>`'${name}'`).join(',');
const rpcPattern=/CREATE OR REPLACE FUNCTION public\.record_usage_events\(p_email text,p_account_generation uuid,p_batch_id uuid,p_events jsonb\)[\s\S]*?END \$\$;/;
let pg,beforeCatalog;let batch=0;
const id=()=>`33333333-3333-4333-8333-${String(++batch).padStart(12,'0')}`;
const headers=async(email=A,generation=G)=>pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({'x-jagdlatein-account-email':email,'x-jagdlatein-account-generation':generation})]);
const call=async(events=[{page:'quiz',event:'revierduell_start',count:1}],options={})=>(await pg.query('SELECT public.record_usage_events($1,$2,$3,$4::jsonb) AS value',[options.email||A,options.generation||G,options.batchId||id(),JSON.stringify(events)])).rows[0].value;
const catalog=async()=>({
 function:(await pg.query("SELECT proowner,proacl::text,prosecdef,proconfig::text FROM pg_proc WHERE oid='public.record_usage_events(text,uuid,uuid,jsonb)'::regprocedure")).rows,
 tables:(await pg.query("SELECT relname,relowner,relacl::text,relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid IN ('public.usage_daily_counts'::regclass,'public.usage_collection_settings'::regclass,'public.usage_ingested_batches'::regclass,'public.usage_ingestion_limits'::regclass) ORDER BY relname")).rows,
 policies:(await pg.query("SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename LIKE 'usage_%' ORDER BY tablename,policyname")).rows,
 columns:(await pg.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND (table_name LIKE 'usage_%' OR table_name='userprofile') ORDER BY table_name,ordinal_position")).rows,
});
test.before(async()=>{pg=new PGlite();await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE TABLE userprofile(email text PRIMARY KEY,account_generation uuid UNIQUE);');await pg.exec(actorSql);await pg.exec(beforeSql);await pg.query('INSERT INTO userprofile(email,account_generation,usage_analytics_opt_in) VALUES($1,$2,true),($3,$4,false)',[A,G,B,H]);beforeCatalog=await catalog();await pg.exec(afterSql);});
test.after(async()=>{if(pg)await pg.close();});
test.beforeEach(async()=>{await pg.exec('RESET ROLE;TRUNCATE usage_daily_counts,usage_ingested_batches,usage_ingestion_limits;UPDATE usage_collection_settings SET started_at=NULL;');await headers();});

test('The complete prior RPC is byte-identical after reversing only its seven-name whitelist',()=>{
 const before=beforeSql.match(rpcPattern)?.[0],after=afterSql.match(rpcPattern)?.[0];assert.ok(before&&after);assert.equal(after.replace(newList,oldList),before);assert.equal(after.split(newList).length,2);
 const outside=afterSql.replace(after,'');assert.doesNotMatch(outside,/^\s*(?:GRANT\b|REVOKE\b|CREATE POLICY\b|DISABLE ROW LEVEL\b|UPDATE\s+public\.userprofile\b)/im);
 assert.ok(outside.includes('CHECK(event_kind IN ('+newList+'))'));
});
test('Migration preserves every table/RPC security property, column and policy; rerun is safe',async()=>{
 assert.deepEqual(await catalog(),beforeCatalog);await pg.exec(afterSql);assert.deepEqual(await catalog(),beforeCatalog);
 for(const role of ['anon','authenticated','service_role']){
  const row=(await pg.query("SELECT has_function_privilege($1,'public.record_usage_events(text,uuid,uuid,jsonb)','EXECUTE') AS execute,has_table_privilege($1,'public.usage_daily_counts','INSERT') AS insert",[role])).rows[0];
  assert.equal(row.execute,role==='service_role');assert.equal(row.insert,false);
 }
 assert.ok((await catalog()).tables.every(row=>row.relrowsecurity));
});
test('All seven fixed names and the five original names are accepted, counted without extra columns',async()=>{
 const all=['page_view','navigation','action','expand','video_play',...names];for(const event of all)assert.deepEqual(await call([{page:'quiz',event,count:2}]),{recorded:true});
 const rows=(await pg.query('SELECT page_key,event_kind,events FROM usage_daily_counts ORDER BY event_kind')).rows;assert.equal(rows.length,12);assert.ok(rows.every(row=>row.page_key==='quiz'&&row.events===2));assert.deepEqual(rows.map(row=>row.event_kind).sort(),[...all].sort());
 assert.deepEqual((await pg.query('SELECT email,usage_analytics_opt_in FROM userprofile ORDER BY email')).rows,[{email:A,usage_analytics_opt_in:true},{email:B,usage_analytics_opt_in:false}].sort((a,b)=>a.email.localeCompare(b.email)));
});
test('Unknown names, metadata, duplicate rows and invalid counts still fail before writes',async()=>{
 for(const events of[
  [{page:'quiz',event:'revierduell_private',count:1}],
  [{page:'quiz',event:'revierduell_answer',count:1,seed:'private-marker'}],
  [{page:'quiz',event:'revierduell_answer',count:1,questionId:'private-marker'}],
  [{page:'quiz',event:'revierduell_answer',count:0}],
  [{page:'quiz',event:'revierduell_answer',count:21}],
  [{page:'quiz',event:'revierduell_answer',count:1},{page:'quiz',event:'revierduell_answer',count:2}],
 ])await assert.rejects(call(events),/JL_USAGE_BATCH/);
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM usage_daily_counts')).rows[0].n,0);
 await assert.rejects(pg.query("INSERT INTO usage_daily_counts VALUES(current_date,'quiz','revierduell_private',1,clock_timestamp())"),/check constraint/);
});
test('Opt-out, wrong generation and missing actor headers never collect',async()=>{
 await headers(B,H);assert.deepEqual(await call(undefined,{email:B,generation:H}),{recorded:false});
 await headers(A,H);await assert.rejects(call(undefined,{generation:H}),/ACCOUNT_GENERATION|REQUEST_ACTOR|JL_USAGE_IDENTITY/);
 await pg.query("SELECT set_config('request.headers','{}',false)");await assert.rejects(call(),/JL_USAGE_IDENTITY/);
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM usage_daily_counts')).rows[0].n,0);
});
test('Anonymous and authenticated roles cannot call the RPC or write counters',async()=>{
 for(const role of ['anon','authenticated']){await pg.exec(`SET ROLE ${role}`);await assert.rejects(call(),/permission denied/);await assert.rejects(pg.query("INSERT INTO usage_daily_counts VALUES(current_date,'quiz','revierduell_answer',1,clock_timestamp())"),/permission denied/);await pg.exec('RESET ROLE');}
});
test('Existing batch deduplication and global minute ceiling apply equally to game counters',async()=>{
 const batchId=id();assert.deepEqual(await call(undefined,{batchId}),{recorded:true});assert.deepEqual(await call(undefined,{batchId}),{recorded:false});assert.equal((await pg.query("SELECT events FROM usage_daily_counts WHERE event_kind='revierduell_start'")).rows[0].events,1);
 await pg.exec("INSERT INTO usage_ingestion_limits VALUES(date_trunc('minute',clock_timestamp()),2000) ON CONFLICT(minute) DO UPDATE SET requests=2000");assert.deepEqual(await call(),{recorded:false});assert.equal((await pg.query("SELECT events FROM usage_daily_counts WHERE event_kind='revierduell_start'")).rows[0].events,1);
});
