// Actual current signed sessions, route guards and PostgreSQL RPCs; ephemeral DB only.
// The initial 20-case read-only audit was independently run against 647e2df.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),local=require('node:module').createRequire(path.join(repo,'package.json')),swc=local('next/dist/build/swc');
const runtime=process.env.JL_PAYPAL_TEST_PGLITE_PATH||path.join(process.env.LOCALAPPDATA||'','Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite'),{PGlite}=require(runtime);
const a='a_under%tag@example.invalid',b='another@example.invalid',near='aXunderYtag@example.invalid';
const g1='11111111-1111-4111-8111-111111111111',g2='22222222-2222-4222-8222-222222222222',otherGeneration='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',nearGeneration='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const read=file=>fs.readFileSync(path.join(repo,file),'utf8');
const migration=read('supabase/migrations/20261007120000_account_deletion.sql');
function originalFunction(name){const start=migration.indexOf('CREATE OR REPLACE FUNCTION public.'+name+'('),end=migration.indexOf('END $$;',start);assert.ok(start>=0&&end>start);return migration.slice(start,end+7);}
async function applyMigrationFunctionPrivileges(){
 // Apply the actual migration's ACL verbs, roles and order. Filter only the
 // functions absent from this deliberately small isolated database; never
 // grant the expected permissions independently of the code under review.
 const clauses=[...migration.matchAll(/\b(REVOKE\s+ALL|GRANT\s+EXECUTE)\s+ON\s+FUNCTION\s+([\s\S]*?)\s+(FROM|TO)\s+([^;]+);/gi)];
 assert.ok(clauses.length>0,'Migration must contain actual function privilege clauses');
 for(const[,verb,functions,direction,roles]of clauses){
  assert.equal(direction.toUpperCase(),verb.toUpperCase().startsWith('REVOKE')?'FROM':'TO');
  const signatures=functions.match(/public\.[a-z_][a-z_0-9]*\s*\([^)]*\)/gi)||[];
  assert.ok(signatures.length>0,'A privilege clause must name its function signatures');
  const existing=[];
  for(const signature of signatures){const result=await pg.query('SELECT to_regprocedure($1) AS function_oid',[signature]);if(result.rows[0].function_oid!==null)existing.push(signature);}
  if(existing.length)await pg.exec(`${verb} ON FUNCTION ${existing.join(',')} ${direction} ${roles};`);
 }
}
let pg;
test.before(async()=>{pg=new PGlite();await pg.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;');});
test.after(async()=>{await pg.close();});
test.beforeEach(async()=>{
 await pg.exec('DROP SCHEMA public CASCADE;CREATE SCHEMA public;GRANT USAGE ON SCHEMA public TO PUBLIC;CREATE TABLE public.userprofile(email text PRIMARY KEY,account_generation uuid NOT NULL UNIQUE);');
 await pg.exec(read('supabase/migrations/20261003_course_progress.sql'));await pg.exec(read('supabase/migrations/20261003160000_activity_results.sql'));
 await pg.exec('ALTER FUNCTION public.get_activity_statistics(text) RENAME TO jagdlatein_activity_statistics_base;');
 for(const name of['require_current_request_actor','require_current_account_read','get_current_course_progress','get_activity_statistics'])await pg.exec(originalFunction(name));
 await applyMigrationFunctionPrivileges();
 // An unescaped ILIKE pattern for a would also select near. Keep generations
 // unique, so the recreated a receives a genuinely different, unused g2.
 await pg.query('INSERT INTO public.userprofile VALUES($1,$2),($3,$4),($5,$6)',[a,g1,b,otherGeneration,near,nearGeneration]);
 await pg.query("INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,'only-a','in_progress',1,5,1),($2,'only-b','in_progress',2,5,2)",[a,b]);
 await pg.query("INSERT INTO public.activity_results(account_email,event_id,type,country,topic,total_questions,correct_answers,timed_out_answers,points,duration_seconds) VALUES($1,'33333333-3333-4333-8333-333333333333','ansitz',null,'Ansitzsimulator',25,7,0,7,60),($2,'44444444-4444-4444-8444-444444444444','ansitz',null,'Ansitzsimulator',25,25,0,25,60)",[a,b]);
});
async function callRPC(name,email,headers){try{return await pg.transaction(async tx=>{await tx.query("SELECT set_config('request.headers',$1,true)",[JSON.stringify(headers)]);await tx.exec('SET LOCAL ROLE service_role');const result=await tx.query(`SELECT public.${name}($1) AS data`,[email]);return{data:result.rows[0].data,error:null};});}catch(error){return{data:null,error};}}
function fixture({recreateAfterProfile=false,startGeneration=g1,cookie='valid',spoofHeaders=false}={}){
 const syntheticProcess={env:{ACCOUNT_GENERATION_ENABLED:'true',JL_SESSION_SECRET:'isolated-private-statistics-session-key-only',SUPABASE_URL:'https://database.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'not-a-real-service-key'}};
 const cache=new Map(),options=[],calls=[];let profiles=0,changed=false;
 const overrides={'lib/course-catalog.js':{courses:[]},'lib/apple-review-login.js':{ReviewLoginError:class ReviewLoginError extends Error{},requireReviewSessionIdentity:async()=>{}}};
 function client(configuration){return{from(table){assert.equal(table,'userprofile');let pattern;return{select(){return this;},ilike(key,value){assert.equal(key,'email');pattern=value;return this;},async maybeSingle(){profiles++;const result=await pg.query('SELECT email,account_generation FROM public.userprofile WHERE email ILIKE $1',[pattern]);assert.ok(result.rows.length<=1);const data=result.rows[0]||null;
  if(recreateAfterProfile&&!changed){changed=true;await pg.query('UPDATE public.userprofile SET account_generation=$1 WHERE email=$2',[g2,a]);await pg.query('DELETE FROM public.course_progress WHERE account_email=$1',[a]);await pg.query("INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score)VALUES($1,'new-g2-private','in_progress',4,5,4)",[a]);}
  return{data,error:null};}};},async rpc(name,args){calls.push({name,args,headers:configuration.global.headers});assert.ok(['get_current_course_progress','get_activity_statistics'].includes(name));return callRPC(name,args.p_email||args.p_account_email,configuration.global.headers);}};}
 function load(file){file=file.replace(/\\/g,'/');if(Object.hasOwn(overrides,file))return overrides[file];if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);const{code}=swc.transformSync(read(file),{filename:file,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});new Function('require','module','exports','process',code)(id=>{if(id==='@supabase/supabase-js')return{createClient(_url,_key,configuration){options.push(configuration);return client(configuration);}};if(id==='node:crypto'||id==='crypto')return require(id);if(id.startsWith('.'))return load(path.posix.normalize(path.posix.join(path.posix.dirname(file),path.posix.extname(id)?id:id+'.js')));throw Error('Unexpected dependency '+id);},mod,mod.exports,syntheticProcess);return mod.exports;}
 const session=load('lib/account-session.js'),now=Date.now(),issued=cookie==='expired'?now-41*86400000:now;let token=session.createAccountSession(a,issued,{paid:false,admin:false,authenticatedAt:Math.floor(issued/1000),accountGeneration:g1});assert.ok(token);if(cookie==='forged')token=token.slice(0,-5)+'xxxxx';
 const request={url:'https://jagdlatein.invalid/api/private?email='+encodeURIComponent(b),headers:new Headers(spoofHeaders?{'x-jagdlatein-account-email':b,'x-jagdlatein-account-generation':otherGeneration}:{}),cookies:{get:name=>cookie!=='none'&&name===session.JL_ACCOUNT_COOKIE?{value:token}:undefined}};
 return{options,calls,get profiles(){return profiles;},async get(route){if(startGeneration!==g1)await pg.query('UPDATE public.userprofile SET account_generation=$1 WHERE email=$2',[startGeneration,a]);const response=await load('app/api/'+route+'/route.js').GET(request);return{response,body:await response.json()};}};
}
function privateHeaders(response){assert.match(response.headers.get('cache-control'),/private/);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('vary'),'Cookie');}
for(const route of['course-progress','activity-results']){
 test(route+' returns only its signed owner data; SQL sees the original g1 headers',async()=>{const h=fixture(),{response,body}=await h.get(route);assert.equal(response.status,200);privateHeaders(response);assert.equal(h.calls.length,1);assert.deepEqual(h.calls[0].headers,{'x-jagdlatein-account-generation':g1,'x-jagdlatein-account-email':a});if(route==='course-progress')assert.deepEqual(body.progress.map(r=>r.course_id),['only-a']);else{assert.equal(body.statistics.ansitz.rounds,1);assert.equal(body.statistics.ansitz.correctAnswers,7);assert.equal(body.statistics.history.length,1);}});
 test(route+' rejects an already recreated g2 account before reading private data',async()=>{const h=fixture({startGeneration:g2}),{response,body}=await h.get(route);assert.equal(response.status,401);assert.equal(h.calls.length,0);assert.equal(body.progress,undefined);assert.equal(body.statistics,undefined);privateHeaders(response);});
 test(route+' SQL generation guard rejects recreation after successful profile precheck rather than adopting g2',async()=>{const h=fixture({recreateAfterProfile:true}),{response,body}=await h.get(route);assert.equal(response.status,503);assert.equal(h.calls.length,1);assert.equal(h.calls[0].headers['x-jagdlatein-account-generation'],g1);assert.equal(body.progress,undefined);assert.equal(body.statistics,undefined);assert.ok(!JSON.stringify(body).includes('new-g2-private'));privateHeaders(response);});
 test(route+' ignores attacker-supplied owner query and generation headers',async()=>{const h=fixture({spoofHeaders:true}),{response,body}=await h.get(route);assert.equal(response.status,200);assert.equal(h.calls[0].headers['x-jagdlatein-account-email'],a);assert.equal(h.calls[0].headers['x-jagdlatein-account-generation'],g1);if(route==='course-progress')assert.deepEqual(body.progress.map(r=>r.course_id),['only-a']);else assert.equal(body.statistics.ansitz.correctAnswers,7);});
 for(const cookie of['none','forged','expired'])test(route+' rejects '+cookie+' identity without creating a DB client',async()=>{const h=fixture({cookie}),{response,body}=await h.get(route);assert.equal(response.status,401);assert.equal(h.options.length,0);assert.equal(body.progress,undefined);assert.equal(body.statistics,undefined);privateHeaders(response);});
}
for(const name of['get_current_course_progress','get_activity_statistics']){
 test(name+' SQL forbids a different p_email even for a current signed actor',async()=>{const result=await callRPC(name,b,{'x-jagdlatein-account-generation':g1,'x-jagdlatein-account-email':a});assert.equal(result.data,null);assert.match(result.error.message,/JL_ACCOUNT_GENERATION_MISMATCH/);});
 test(name+' SQL refuses a partial actor header set',async()=>{const result=await callRPC(name,a,{'x-jagdlatein-account-email':a});assert.equal(result.data,null);assert.match(result.error.message,/JL_ACCOUNT_GENERATION_MISMATCH/);});
 test(name+' private RPC is unavailable to browser roles',async()=>{for(const role of['anon','authenticated'])await assert.rejects(pg.transaction(async tx=>{await tx.exec('SET LOCAL ROLE '+role);await tx.query(`SELECT public.${name}($1)`,[a]);}),/permission denied/);});
}
