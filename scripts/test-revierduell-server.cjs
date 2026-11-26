const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createLoader,local,root}=require('./helpers/project-module.cjs');
const load=createLoader(),server=load('lib/revierduell-server.js'),engine=load('lib/revierduell.js');
const secure={getRandomValues(bytes){bytes.fill(17);return bytes;}};
test('The57fixed references project original neutral questions with provenance and no full reading/private extras',()=>{
 const pool=load('lib/daily-review-pool.js').getDailyReviewPool(),bank=server.getDuellBank();assert.equal(bank.length,57);assert.equal(new Set(bank.map(q=>q.id)).size,57);assert.equal(new Set(bank.map(q=>q.prompt.trim().toLocaleLowerCase('de'))).size,57);assert.equal(new Set(bank.map(q=>q.categorySlug)).size,11);
 for(const q of bank){const original=pool.find(item=>item.id===q.id);assert.equal(q.prompt,original.q);assert.deepEqual(q.options,original.answers);assert.deepEqual(q.correctIds,original.correct);assert.equal(q.explanation,original.explain);assert.equal(q.href,original.href);assert.equal(q.courseTitle,original.courseTitle);assert.equal(q.sourceScope,original.sourceScope);assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(q.reviewedOn));assert.equal(q.options.length,4);assert.equal(q.correctIds.length,1);assert.notEqual(q.categorySlug,'jagdrecht');assert.ok(q.sources.every(s=>/^https:\/\//.test(s.url)));assert.equal(Object.hasOwn(q,'reading'),false);}
 for(const id of ['wissen-federwild-beobachtung-vogel-lamellen-funktion','wissen-vertiefung-jagdhunderassen-pointer-setter-1','wissen-ausbau-biologie-hundesinne-2026-sehen-q4'])assert.equal(bank.some(q=>q.id===id),false);
 const altered=structuredClone(pool);for(const row of altered){row.privateAccount='SyntheticPrivateMarker';row.answers.forEach(a=>a.privateAccount='SyntheticPrivateMarker');}
 const projected=createLoader({'./daily-review-pool':{getDailyReviewPool:()=>altered}})('lib/revierduell-server.js').getDuellBank();assert.doesNotMatch(JSON.stringify(projected),/SyntheticPrivateMarker|"reading"|"paragraphs"/);
});
test('Actual57-question bank reproduces exact seven-category rounds and answer order',()=>{
 for(let i=0;i<60;i++){const query={duell:'test_'+i},a=server.getDuellPageProps(query),b=server.getDuellPageProps(query);assert.deepEqual(a,b);assert.equal(a.questions.length,7);assert.equal(new Set(a.questions.map(q=>q.categorySlug)).size,7);assert.equal(new Set(a.questions.map(q=>q.id)).size,7);}
 const bank=server.getDuellBank(),rev=server.duellBankRevision(bank),copy=structuredClone(bank);copy[0].explanation+=' Synthetic test correction.';assert.notEqual(server.duellBankRevision(copy),rev);assert.match(rev,/^[a-f0-9]{16}$/);
});
test('Secure missing/invalid seeds discard target scores instead of attaching them to unrelated questions',()=>{
 for(const seed of [undefined,'','bad seed','x'.repeat(65),['a','b'],null]){const p=server.getDuellPageProps({duell:seed,ziel:'500'},secure);assert.equal(p.seed,'d1_'+ '11'.repeat(16));assert.equal(p.target,null);assert.equal(p.questions.length,7);assert.ok(p.linkNotice);}
 assert.throws(()=>server.getDuellPageProps({},{}),/SECURE_RANDOM/);
 const a=server.getDuellPageProps({}),b=server.getDuellPageProps({});assert.notEqual(a.seed,b.seed);
});
test('Valid zero target and revision are retained; stale revisions never produce a different challenge',()=>{
 const initial=server.getDuellPageProps({duell:'fixed'}),p=server.getDuellPageProps({duell:'fixed',ziel:'0',v:initial.revision});assert.equal(p.target,0);assert.equal(p.unavailable,false);assert.equal(p.questions.length,7);
 const stale=server.getDuellPageProps({duell:'fixed',ziel:'1000',v:'0000000000000000'});assert.equal(stale.unavailable,true);assert.equal(stale.target,null);assert.deepEqual(stale.questions,[]);
 for(const target of ['8331','-1','1.0','1e2',' 100',['100','200']])assert.equal(server.getDuellPageProps({duell:'fixed',ziel:target}).target,null);
});
test('Public SSR page exposes only seven records, no-store and an explicit disabled-by-default analytics flag',()=>{
 const saved=process.env.REVIERDUELL_ANALYTICS_ENABLED;delete process.env.REVIERDUELL_ANALYTICS_ENABLED;
 try{const headers=new Map(),page=load('pages/revierduell.js'),ctx={query:{duell:'public'},resolvedUrl:'/revierduell?duell=public',res:{setHeader(k,v){headers.set(k,v);}}};const out=page.getServerSideProps(ctx);assert.equal(headers.get('Cache-Control'),'private, no-store, max-age=0');assert.equal(out.props.questions.length,7);assert.equal(out.props.analyticsEnabled,false);assert.doesNotMatch(JSON.stringify(out.props),/"reading"|"paragraphs"|"learningModules"|SUPABASE/);}
 finally{if(saved===undefined)delete process.env.REVIERDUELL_ANALYTICS_ENABLED;else process.env.REVIERDUELL_ANALYTICS_ENABLED=saved;}
});
test('Next client transform drops the server bank, crypto and complete curriculum imports',()=>{
 const filename=path.join(root,'pages/revierduell.js'),{code}=local('next/dist/build/swc').transformSync(fs.readFileSync(filename,'utf8'),{filename,isPageFile:true,disableNextSsg:false,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 assert.match(code,/__N_SSP/);assert.doesNotMatch(code,/revierduell-server|learning-curriculum|daily-review-pool|node:crypto|question-ids-v1/);
});
test('Only the exact new page is public; protected quiz/login flow and nested neighbours retain their old gates',async()=>{
 const {middleware}=createLoader({'./lib/account-session-edge':{JL_ACCOUNT_COOKIE:'jl_account',readAccountSessionEdge:async()=>null}})('middleware.js');
 for(const route of ['/revierduell','/revierduell?duell=public&ziel=100']){const url='https://jagdlatein.example'+route,r=await middleware({url,nextUrl:new URL(url),cookies:{get:()=>undefined}});assert.equal(r.status,200);}
 for(const route of ['/revierduell/private','/quiz-app','/quiz-app/run','/lernen/lernkarten']){const url='https://jagdlatein.example'+route,r=await middleware({url,nextUrl:new URL(url),cookies:{get:()=>undefined}});assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location')).pathname,'/preise');}
});
test('Disabled named-analytics rollout cannot call the old database whitelist; existing batches still work',async()=>{
 const saved=process.env.REVIERDUELL_ANALYTICS_ENABLED;delete process.env.REVIERDUELL_ANALYTICS_ENABLED;let calls=0;
 const base={requireUsageOrigin(){},usageAccount:async()=>({session:{email:'synthetic@example.invalid',accountGeneration:'synthetic'},database:{rpc:async()=>{calls++;return{data:{recorded:true}};}}}),readUsageBody:async()=>null,validatedUsageBatch:()=>({batchId:'synthetic',events:[{page:'quiz',event:'revierduell_start',count:1}]}),usageJson:(value,status=200)=>Response.json(value,{status}),confirmUsageAccount:async()=>{},usageError:error=>{throw error;},usageMethod(){}};
 try{const route=createLoader({'../../../lib/usage-analytics-server':base})('app/api/usage-events/route.js');const result=await route.POST({headers:new Headers()});assert.deepEqual(await result.json(),{recorded:false});assert.equal(calls,0);
 const normal=createLoader({'../../../lib/usage-analytics-server':{...base,validatedUsageBatch:()=>({batchId:'synthetic',events:[{page:'quiz',event:'action',count:1}]})}})('app/api/usage-events/route.js');assert.deepEqual(await(await normal.POST({headers:new Headers()})).json(),{recorded:true});assert.equal(calls,1);
 }finally{if(saved===undefined)delete process.env.REVIERDUELL_ANALYTICS_ENABLED;else process.env.REVIERDUELL_ANALYTICS_ENABLED=saved;}
});
