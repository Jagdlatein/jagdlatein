const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
function load(relative, overrides = {}, cache = new Map()) {
  relative = relative.replace(/\\/g, '/');
  if (Object.hasOwn(overrides, relative)) return overrides[relative];
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} }; cache.set(filename, mod);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
  const local = id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), overrides, cache) : pr(id);
  new Function('require', 'module', 'exports', code)(local, mod, mod.exports); return mod.exports;
}
const pure = load('lib/online-academy.js');
const schoolId='11111111-1111-4111-8111-111111111111', rejectedId='22222222-2222-4222-8222-222222222222';
const offerId='33333333-3333-4333-8333-333333333333', sessionId='44444444-4444-4444-8444-444444444444';
const room='jagdlatein-55555555-5555-4555-8555-555555555555';
const now=Date.parse('2026-11-01T12:00:00Z');
const school = {id:schoolId,name:'Testschule',description:'Isolierter Test',website:'https://example.org/',status:'approved',updated_at:'2026-10-25T08:00:00Z'};
const offer = {id:offerId,school_id:schoolId,title:'Wildkunde lernen',description:'Vorhandene Lerneinheiten',category_slug:'wildkunde',module_ids:['wissen-reh'],status:'published',updated_at:'2026-10-25T08:00:00Z'};
const session = {id:sessionId,offer_id:offerId,title:'Gemeinsam lernen',starts_at:'2026-11-01T12:00:00.000Z',ends_at:'2026-11-01T13:00:00.000Z',status:'scheduled',room_name:room,updated_at:'2026-10-25T08:00:00Z'};
const tables={school:'online_academy_schools',offer:'online_academy_offers',session:'online_academy_sessions'};
function harness(options={}) {
  const data = { [tables.school]:[structuredClone(school)], [tables.offer]:[structuredClone(offer)], [tables.session]:[structuredClone(session)], ...structuredClone(options.data||{}) };
  const ops=[]; let paidCalls=0,adminCalls=0;
  const access={email:'member@example.org',accountGeneration:'66666666-6666-4666-8666-666666666666',paid:true,admin:false,...options.access};
  const db={from(table){ const q={table,fields:null,match:null,write:null,kind:'read',max:Infinity,
    select(fields,options){this.fields=fields;this.countExact=options?.count==='exact';return this;},limit(max){this.max=max;return this;},eq(key,value){this.match={key,value};return this;},
    update(value){this.kind='update';this.write=value;return this;},insert(value){this.kind='insert';this.write=value;return this;},
    async result(single){
      ops.push({table:this.table,kind:this.kind,match:this.match,write:this.write,fields:this.fields});
      if(options.dbError) return {data:null,error:options.dbError};
      if(!Object.hasOwn(data,table)) return {data:null,error:{code:'42P01'}};
      if(this.kind==='read') options.onRead?.({table,ops,data});
      let rows=data[table].filter(row=>!this.match||row[this.match.key]===this.match.value);
      if(this.kind==='insert'){const row={id:'77777777-7777-4777-8777-777777777777',...this.write};data[table].push(row);rows=[row];}
      if(this.kind==='update') rows.forEach(row=>Object.assign(row,this.write));
      const columns=this.fields?.split(',')||[];
      const count=rows.length;
      rows=rows.slice(0,this.max).map(row=>Object.fromEntries(columns.filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]])));
      return {data:single?(rows[0]||null):rows,error:null,...(this.countExact?{count}: {})};
    },maybeSingle(){return this.result(true);},then(resolve,reject){return this.result(false).then(resolve,reject);} };return q;}};
  const overrides={
    'lib/account-access.js':{async requirePaidAccount(req){paidCalls++;if(options.paidError)throw Object.assign(new Error('Denied'),options.paidError);options.onPaid?.(paidCalls,data);return {...access};}},
    'lib/course-progress-server.js':{getAccountDatabase(){return db;}},
    'lib/admin-trial-overview.js':{async requireCurrentTrialAdmin(){adminCalls++;if(options.adminError)throw Object.assign(new Error('Denied'),options.adminError);options.onAdmin?.(adminCalls,data);return {session:{...access,admin:true},database:db};}},
    'lib/my-course-catalog.js':{getMyCourseCatalog(){return [{id:'wissen-reh'}];}},
    'lib/learning-categories.js':{learningCategoryDetails:[{slug:'wildkunde'}]},
  };
  const cache=new Map();
  return {data,ops,api:load('lib/online-academy-server.js',overrides,cache),routes:load('app/api/online-academy/route.js',overrides,cache),roomRoute:load('app/api/online-academy/room/route.js',overrides,cache),calls:()=>({paidCalls,adminCalls})};
}
const request=(suffix='',body,headers={})=>new Request(`https://jagdlatein.de/api/online-academy${suffix}`,body===undefined?{}:{method:'POST',headers:{origin:'https://jagdlatein.de','content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const withoutId=row=>Object.fromEntries(Object.entries(row).filter(([key])=>!['id','updated_at','room_name'].includes(key)));

test('Record validation accepts known course metadata and trims text without inventing curriculum',()=>{
  assert.equal(pure.validateAcademyRecord('school',{...withoutId(school),name:' Testschule '}).name,'Testschule');
  const valid=pure.validateAcademyRecord('offer',withoutId(offer),{moduleIds:['wissen-reh'],categorySlugs:['wildkunde']});
  assert.deepEqual(valid.module_ids,['wissen-reh']);
  for(const change of [{module_ids:['unknown']},{module_ids:['wissen-reh','wissen-reh']},{category_slug:'unknown'},{price:99},{teacher_email:'private@example.org'}])assert.throws(()=>pure.validateAcademyRecord('offer',{...withoutId(offer),...change},{moduleIds:['wissen-reh'],categorySlugs:['wildkunde']}),/./);
});
test('Website and text validation rejects active schemes, credentials, controls, unbounded records and unknown action',()=>{
  for(const website of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','https://example.org:444','https://example.org/\\bad'])assert.throws(()=>pure.normalizeAcademyWebsite(website));
  assert.equal(pure.normalizeAcademyWebsite(''),'');
  for(const record of [{...withoutId(school),name:'x'},{...withoutId(school),description:'x'.repeat(2001)},{...withoutId(school),name:'name\u0000'},{...withoutId(school),id:''}])assert.throws(()=>pure.validateAcademyRecord('school',record));
  for(const action of ['remove','__proto__','constructor',['school']])assert.throws(()=>pure.validateAcademyRecord(action,withoutId(school)),error=>error.status===400);
  assert.throws(()=>pure.validateAcademyRecord('school',[]));
});
test('Session dates reject ambiguous times, invalid calendar rollover, inverted or excessively long intervals',()=>{
  const valid=withoutId(session);
  assert.equal(pure.validateAcademyRecord('session',valid).starts_at,valid.starts_at);
  for(const change of [{starts_at:'0000-11-01T12:00:00Z'},{starts_at:'2026-02-30T12:00:00Z'},{starts_at:'2026-11-01T12:00'},{ends_at:valid.starts_at},{ends_at:'2026-11-02T12:00:00Z'},{room_name:room}])assert.throws(()=>pure.validateAcademyRecord('session',{...valid,...change}));
  assert.equal(pure.validateAcademyRecord('session',{...valid,starts_at:'2026-11-01T12:00:00Z'}).starts_at,'2026-11-01T12:00:00.000Z');
});
test('Session phases respect exact opening/start/end boundaries and cancellation',()=>{
  assert.equal(pure.getSessionPhase(session,now-15*60000-1),'upcoming');
  assert.equal(pure.getSessionPhase(session,now-15*60000),'opening');
  assert.equal(pure.getSessionPhase(session,now),'live');
  assert.equal(pure.getSessionPhase(session,now+60*60000),'ended');
  assert.equal(pure.getSessionPhase({...session,status:'cancelled'},now),'cancelled');
  assert.equal(pure.getSessionPhase({...session,ends_at:'invalid'},now),'unavailable');
});
test('Student listing excludes pending/rejected schools, unpublished offers and private room fields',async()=>{
  const h=harness({data:{[tables.school]:[school,{...school,id:rejectedId,status:'rejected'}],[tables.offer]:[offer,{...offer,id:'88888888-8888-4888-8888-888888888888',status:'submitted'},{...offer,id:'99999999-9999-4999-8999-999999999999',school_id:rejectedId}],[tables.session]:[session,{...session,id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',status:'cancelled'}]}});
  const result=await h.api.getAcademyOverview(request());
  assert.equal(result.schools.length,1);assert.equal(result.offers.length,1);assert.equal(result.sessions.length,1);assert.equal(result.canManage,false);
  assert.equal(JSON.stringify(result).includes(room),false);assert.equal(JSON.stringify(result).includes('room_name'),false);
  assert.equal(h.calls().paidCalls,2);
});
test('Explicit management scope uses current admin checks before and after reading and returns editable drafts',async()=>{
  const h=harness({data:{[tables.school]:[{...school,status:'pending'}],[tables.offer]:[{...offer,status:'draft'}]}});
  const result=await h.api.getAcademyOverview(request('?scope=manage'));
  assert.equal(result.canManage,true);assert.equal(result.schools[0].status,'pending');assert.equal(result.offers[0].status,'draft');assert.equal(h.calls().adminCalls,2);assert.equal(h.calls().paidCalls,0);
  assert.equal(JSON.stringify(result).includes('room_name'),false);
});
test('Anonymous/unpaid/nonadmin requests cannot read private listings, rooms, or write records',async()=>{
  for(const status of [401,403]){
    const h=harness({paidError:{status},adminError:{status}});
    assert.equal((await h.routes.GET(request())).status,status);
    assert.equal((await h.routes.GET(request('?scope=manage'))).status,status);
    assert.equal((await h.roomRoute.GET(request(`/room?id=${sessionId}`))).status,status);
    assert.equal((await h.routes.POST(request('',{action:'school',record:withoutId(school)}))).status,status);
    assert.equal(h.ops.length,0);
  }
});
test('Fresh revoked membership and admin role do not yield a previously read overview',async()=>{
  const member=harness({onPaid(count){if(count===2)throw Object.assign(new Error('Revoked'),{status:403});}});
  assert.equal((await member.routes.GET(request())).status,403);
  const admin=harness({onAdmin(count){if(count===2)throw Object.assign(new Error('Revoked'),{status:403});}});
  assert.equal((await admin.routes.GET(request('?scope=manage'))).status,403);
});
test('Invalid duplicate/unknown query fields fail rather than broadening access',async()=>{
  for(const query of ['?scope=manage&scope=manage','?scope=all','?private=true'])assert.equal((await harness().routes.GET(request(query))).status,400);
  for(const query of [`/room?id=${sessionId}&id=${sessionId}`,'/room?id=unknown',`/room?id=${sessionId}&token=1`])assert.equal((await harness().roomRoute.GET(request(query))).status,400);
});
test('Schema unavailable is explicit and private responses cannot be cached',async()=>{
  const h=harness({dbError:{code:'42P01',message:'secret database internals'}});
  const result=await h.routes.GET(request());
  assert.equal(result.status,503);assert.equal((await result.json()).code,'ACADEMY_NOT_CONFIGURED');assert.match(result.headers.get('cache-control'),/no-store/);assert.equal(result.headers.get('vary'),'Cookie');
  const unknown=h.api.academyErrorResponse(new Error('secret database internals'));
  assert.equal(JSON.stringify(await unknown.json()).includes('secret'),false);
});
test('Admin write rejects CSRF, unsupported format, malformed and oversized bodies before any mutation',async()=>{
  const payload={action:'school',record:withoutId(school)};
  for(const [body,headers,status] of [[payload,{origin:'https://untrusted.invalid'},403],[payload,{'content-type':'text/plain'},415],['{',{},400],['x'.repeat(16001),{},413],[payload,{'content-length':'99999'},413],[{...payload,grantAdmin:true},{},400]]){
    const h=harness();const response=await h.routes.POST(request('',body,headers));assert.equal(response.status,status);assert.equal(h.ops.filter(op=>op.kind!=='read').length,0);
  }
});
test('Admin can save actual school and offer metadata; rejected school cannot publish an offer',async()=>{
  const h=harness();
  assert.equal((await h.routes.POST(request('',{action:'school',record:withoutId(school)}))).status,200);
  assert.equal(h.calls().adminCalls,2);
  const response=await h.routes.POST(request('',{action:'offer',record:withoutId(offer)}));assert.equal(response.status,200);assert.deepEqual((await response.json()).record.module_ids,['wissen-reh']);
  const rejected=harness({data:{[tables.school]:[{...school,status:'rejected'}]}});
  assert.equal((await rejected.routes.POST(request('',{action:'offer',record:withoutId(offer)}))).status,409);assert.equal(rejected.ops.filter(op=>op.kind==='insert').length,0);
});
test('Admin access revoked before write prevents mutation; unknown record cannot be recreated accidentally',async()=>{
  const h=harness({onAdmin(count){if(count===2)throw Object.assign(new Error('Revoked'),{status:403});}});
  assert.equal((await h.routes.POST(request('',{action:'school',record:withoutId(school)}))).status,403);assert.equal(h.ops.length,0);
  const absent=harness();assert.equal((await absent.routes.POST(request('',{action:'school',record:{...withoutId(school),id:rejectedId}}))).status,404);assert.equal(absent.ops.filter(op=>op.kind!=='read').length,0);
});
test('Session creation uses a server-generated room, retains it on editing and never returns it in metadata',async()=>{
  const h=harness();const response=await h.routes.POST(request('',{action:'session',record:withoutId(session)}));assert.equal(response.status,200);
  const saved=(await response.json()).record;assert.equal(Object.hasOwn(saved,'room_name'),false);
  const created=h.ops.find(op=>op.kind==='insert');assert.match(created.write.room_name,/^jagdlatein-[0-9a-f-]{36}$/);assert.notEqual(created.write.room_name,room);
  const edit=await h.routes.POST(request('',{action:'session',record:{...withoutId(session),id:sessionId,status:'cancelled'}}));assert.equal(edit.status,200);assert.equal(h.data[tables.session][0].room_name,room);assert.equal(h.ops.find(op=>op.kind==='update').write.room_name,undefined);
});
test('Room access requires current publication chain and the exact 15-minute time window',async()=>{
  const h=harness();const result=await h.api.getAcademyRoom(request(`/room?id=${sessionId}`),{now});assert.deepEqual(result,{host:'meet.jit.si',roomName:room,sessionId,endsAt:session.ends_at});
  for(const time of [now-15*60000-1,now+60*60000])await assert.rejects(()=>h.api.getAcademyRoom(request(`/room?id=${sessionId}`),{now:time}),error=>error.status===409);
  for(const [table,value] of [[tables.school,'rejected'],[tables.offer,'submitted'],[tables.session,'cancelled']]){const x=harness();x.data[table][0].status=value;await assert.rejects(()=>x.api.getAcademyRoom(request(`/room?id=${sessionId}`),{now}),error=>error.status===404);}
  const absent=harness({data:{[tables.session]:[]}});await assert.rejects(()=>absent.api.getAcademyRoom(request(`/room?id=${sessionId}`),{now}),error=>error.status===404);
});
test('Cancellation, unpublication and membership revocation during a pending room lookup fail closed',async()=>{
  for(const table of [tables.school,tables.offer,tables.session]){
    const h=harness({onPaid(count,data){if(count===2)data[table][0].status=table===tables.school?'rejected':table===tables.offer?'draft':'cancelled';}});
    await assert.rejects(()=>h.api.getAcademyRoom(request(`/room?id=${sessionId}`),{now}),error=>error.status===404);
  }
  const revoked=harness({onPaid(count){if(count===2)throw Object.assign(new Error('Revoked'),{status:403});}});
  await assert.rejects(()=>revoked.api.getAcademyRoom(request(`/room?id=${sessionId}`),{now}),error=>error.status===403);
});
test('Migration exposes no anonymous/authenticated table rights and stores no student or payment identity',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261025090000_online_academy.sql'),'utf8');
  for(const table of Object.values(tables))assert.match(sql,new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
  assert.match(sql,/REVOKE ALL ON TABLE[^;]+FROM PUBLIC,anon,authenticated,service_role/);
  assert.match(sql,/GRANT SELECT,INSERT,UPDATE ON TABLE[^;]+TO service_role/);
  assert.doesNotMatch(sql,/GRANT[^;]+TO (?:anon|authenticated)/);
  assert.doesNotMatch(sql,/REFERENCES public\.userprofile|owner_email|account_generation|INSERT INTO public\.(?:userprofile|course_progress)/);
  assert.match(sql,/room_name text NOT NULL UNIQUE/);
});

test('A real request reaching the end during authorization cannot obtain an expired room',async()=>{
  const clock=Date.now;
  try {
    Date.now=()=>now;
    const h=harness({onPaid(count){if(count===2)Date.now=()=>Date.parse(session.ends_at);}});
    await assert.rejects(()=>h.api.getAcademyRoom(request(`/room?id=${sessionId}`)),error=>error.status===404);
  } finally { Date.now=clock; }
});


test('Listing detects a bounded PostgREST row cap rather than silently publishing an incomplete catalog',async()=>{
  const h=harness({data:{[tables.school]:Array.from({length:1001},(_,index)=>({...school,id:`school-${index}`}))}});
  const response=await h.routes.GET(request());assert.equal(response.status,503);assert.equal((await response.json()).code,'ACADEMY_UNAVAILABLE');
});
