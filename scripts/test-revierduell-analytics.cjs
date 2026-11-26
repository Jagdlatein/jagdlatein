// Synthetic consent, clock, browser event and network doubles only.
const test=require('node:test'),assert=require('node:assert/strict');
const {createLoader,local}=require('./helpers/project-module.cjs'),React=local('react');
const A='11111111-1111-4111-8111-111111111111',V='2026-11-26T08:00:00.123456+00:00';
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
function fixture(t,{optedIn=true,anonymous=false,dnt=false,gpc=false,native=false,storageDenied=false}={}){
 const before=Object.fromEntries(['window','document','fetch','setTimeout','clearTimeout'].map(key=>[key,Object.getOwnPropertyDescriptor(global,key)]));
 const windowEvents=new Map(),documentEvents=new Map(),calls=[],captured=[],timers=new Map();let timer=0,uuid=0;
 const on=(map,name,fn)=>{if(!map.has(name))map.set(name,new Set());map.get(name).add(fn);};
 const fire=(map,name,event={type:name})=>{for(const fn of [...(map.get(name)||[])])fn(event);};
 const win={location:{pathname:'/revierduell'},navigator:{userAgent:'Synthetic Chrome/130 Safari/537.36',doNotTrack:dnt?'1':'0',globalPrivacyControl:gpc},...(native?{Capacitor:{isNativePlatform:()=>true}}:{}),
  localStorage:{getItem(){if(storageDenied)throw Error('denied');return null;}},crypto:{randomUUID:()=>`33333333-3333-4333-8333-${String(++uuid).padStart(12,'0')}`},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  addEventListener:(name,fn)=>on(windowEvents,name,fn),removeEventListener:(name,fn)=>windowEvents.get(name)?.delete(fn),dispatchEvent(event){captured.push(event);fire(windowEvents,event.type,event);return true;}};
 Object.defineProperty(win.location,'search',{get(){throw Error('Never inspect URL query metadata');}});
 const doc={addEventListener:(name,fn)=>on(documentEvents,name,fn),removeEventListener:(name,fn)=>documentEvents.get(name)?.delete(fn)};
 Object.defineProperties(global,{window:{configurable:true,writable:true,value:win},document:{configurable:true,writable:true,value:doc},setTimeout:{configurable:true,writable:true,value:(fn,delay)=>{timers.set(++timer,{fn,delay});return timer;}},clearTimeout:{configurable:true,writable:true,value:id=>timers.delete(id)},fetch:{configurable:true,writable:true,value:async(url,options={})=>{calls.push({url,options});return{ok:!anonymous,status:anonymous?401:200,json:async()=>url==='/api/usage-events'?{recorded:true}:{enabled:optedIn,accountKey:A,consentVersion:V}};}}});
 let slots=[],cursor=0,pending=[],cleanup=null;const react={...React,useRef(value){const i=cursor++;return slots[i]||(slots[i]={current:value});},useEffect(fn){pending.push(fn);}};
 const load=createLoader({react}),pure=load('lib/usage-analytics.js'),analytics=load('lib/revierduell-analytics.js'),Tracker=load('components/UsageTelemetry.js').default;
 function mount(pathname='/revierduell'){cursor=0;slots=[];pending=[];Tracker({pathname});for(const fn of pending)cleanup=fn();}
 function dispose(){cleanup?.();cleanup=null;}
 t.after(()=>{dispose();pure.usagePreferenceClient.stop();for(const[key,descriptor]of Object.entries(before)){if(descriptor)Object.defineProperty(global,key,descriptor);else delete global[key];}});
 return{win,calls,captured,pure,analytics,windowEvents,mount,dispose,fire:(name,event)=>fire(windowEvents,name,event),flush:()=>fire(windowEvents,'pagehide'),rows:()=>calls.filter(row=>row.url==='/api/usage-events').flatMap(row=>JSON.parse(row.options.body).events)};
}

test('Seven exact names use the existing quiz page and do not change the generic batch schema',t=>{
 const f=fixture(t);assert.deepEqual(f.analytics.REVIERDUELL_ANALYTICS_EVENTS,['revierduell_view','revierduell_start','revierduell_question_view','revierduell_answer','revierduell_complete','revierduell_share','revierduell_copy']);
 assert.equal(f.pure.usagePageForPath('/revierduell'),'quiz');assert.equal(f.pure.usagePageForPath('/revierduell/private'),null);assert.equal(f.pure.usagePageForPath('/revierduell?duell=private'),null);
 for(const event of f.analytics.REVIERDUELL_ANALYTICS_EVENTS)assert.deepEqual(f.pure.validateUsageBatch({batchId:A,events:[{page:'quiz',event,count:1}]}).events,[{page:'quiz',event,count:1}]);
 for(const field of ['seed','questionId','responseMs','score','email'])assert.throws(()=>f.pure.validateUsageBatch({batchId:A,events:[{page:'quiz',event:'revierduell_answer',count:1,[field]:'private-marker'}]}));
});

test('Feature flag/current owner are fail-closed and arbitrary names never dispatch',t=>{
 const f=fixture(t),emit=f.analytics.emitDuellAnalytics;
 for(const options of[undefined,{}, {enabled:'true',isCurrent:()=>true},{enabled:true},{enabled:true,isCurrent:()=>false},{enabled:true,isCurrent:()=>{throw Error('stale');}}])assert.equal(emit('revierduell_start',options),false);
 assert.equal(emit('private-marker',{enabled:true,isCurrent:()=>true}),false);assert.equal(f.captured.length,0);
});

test('Genuine events carry only a frozen name and cannot be forged,replayed or adopt a stale round',t=>{
 const f=fixture(t);let current=true;assert.equal(f.analytics.emitDuellAnalytics('revierduell_answer',{enabled:true,isCurrent:()=>current,seed:'private-marker'}),true);
 const event=f.captured.at(-1);assert.deepEqual(Object.keys(event.detail),['name']);assert.equal(Object.isFrozen(event.detail),true);assert.equal(f.analytics.readDuellAnalyticsEvent({type:event.type,detail:event.detail}),null);
 assert.equal(f.analytics.readDuellAnalyticsEvent(event),'revierduell_answer');assert.equal(f.analytics.readDuellAnalyticsEvent(event),null);
 f.analytics.emitDuellAnalytics('revierduell_complete',{enabled:true,isCurrent:()=>current});current=false;assert.equal(f.analytics.readDuellAnalyticsEvent(f.captured.at(-1)),null);
});

test('Only current consented browser telemetry sends seven bounded names and no payload metadata',async t=>{
 const f=fixture(t);f.mount();await settle();for(const name of f.analytics.REVIERDUELL_ANALYTICS_EVENTS)assert.equal(f.analytics.emitDuellAnalytics(name,{enabled:true,isCurrent:()=>true,questionId:'private-marker'}),true);
 f.analytics.emitDuellAnalytics('revierduell_answer',{enabled:true,isCurrent:()=>true});f.flush();await settle();
 const rows=f.rows();assert.equal(rows.length,8);for(const name of f.analytics.REVIERDUELL_ANALYTICS_EVENTS)assert.equal(rows.find(row=>row.event===name)?.count,name==='revierduell_answer'?2:1);
 assert.equal(rows.find(row=>row.event==='page_view')?.count,1);assert.ok(rows.every(row=>row.page==='quiz'&&Object.keys(row).sort().join(',')==='count,event,page'));
 assert.doesNotMatch(JSON.stringify(f.calls.filter(row=>row.url==='/api/usage-events')),/private-marker|questionId|responseMs|seed|score|email/);
});

test('Disabled game events cannot poison the original generic page-view batch',async t=>{
 const f=fixture(t);f.mount();await settle();for(const name of f.analytics.REVIERDUELL_ANALYTICS_EVENTS)assert.equal(f.analytics.emitDuellAnalytics(name,{enabled:false,isCurrent:()=>true}),false);f.flush();await settle();assert.deepEqual(f.rows(),[{page:'quiz',event:'page_view',count:1}]);
});

for(const options of[{anonymous:true},{optedIn:false},{dnt:true},{gpc:true},{native:true},{storageDenied:true}])test('No analytics POST for privacy or account gate '+Object.keys(options)[0],async t=>{
 const f=fixture(t,options);f.mount();await settle();f.analytics.emitDuellAnalytics('revierduell_start',{enabled:true,isCurrent:()=>true});f.flush();await settle();assert.equal(f.calls.filter(row=>row.url==='/api/usage-events').length,0);
});

test('Unowned custom events,route drift and disposed leases cannot enqueue game counters',async t=>{
 const f=fixture(t);f.mount();await settle();f.fire(f.analytics.REVIERDUELL_ANALYTICS_EVENT,{type:f.analytics.REVIERDUELL_ANALYTICS_EVENT,detail:{name:'revierduell_answer'}});f.flush();await settle();assert.equal(f.rows().some(row=>row.event==='revierduell_answer'),false);
 f.win.location.pathname='/lernen';assert.equal(f.analytics.emitDuellAnalytics('revierduell_answer',{enabled:true,isCurrent:()=>true}),false);f.win.location.pathname='/revierduell';
 const retained=[...f.windowEvents.get(f.analytics.REVIERDUELL_ANALYTICS_EVENT)][0];f.dispose();f.analytics.emitDuellAnalytics('revierduell_answer',{enabled:true,isCurrent:()=>true});retained(f.captured.at(-1));f.flush();await settle();assert.equal(f.rows().some(row=>row.event==='revierduell_answer'),false);
});
