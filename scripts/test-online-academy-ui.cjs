// Isolated real ReactDOM/effect tests. No remote media, accounts or rooms are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const load = createLoader();
const view = load('lib/online-academy-view.js');
const SID = '10000000-0000-4000-8000-000000000001';
const OID = '20000000-0000-4000-8000-000000000001';
const SCHOOL = '30000000-0000-4000-8000-000000000001';
const now = Date.now();
const session = { id:SID, offer_id:OID, title:'Fiktiver Testtermin', status:'scheduled', starts_at:new Date(now-60000).toISOString(), ends_at:new Date(now+3600000).toISOString() };
const offer = { id:OID,school_id:SCHOOL,title:'Fiktiver Testkurs',description:'Isoliertes Testangebot',category_slug:'wildkunde',module_ids:['wissen-test'],status:'published' };
const school = {id:SCHOOL,name:'Fiktive Testschule',description:'Kein echtes Anbieterprofil',website:'https://example.test/',status:'approved'};
const catalog = [{id:'wissen-test',title:'Vorhandener Testkurs',description:'Unverändertes Testwissen',href:'/kurse/wissen-test',categorySlug:'wildkunde',categoryTitle:'Wildkunde',totalQuestions:2}];
const details = (extra={}) => ({schools:[school],offers:[offer],sessions:[session],canManage:false,...extra});
const room = (extra={}) => ({host:'meet.jit.si',sessionId:SID,roomName:`jagdlatein-${SID}`,endsAt:session.ends_at,...extra});
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const props = node => node[Object.keys(node).find(key=>key.startsWith('__reactProps$'))];
function defer(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
async function fixture(file, initialProps={}, options={}) {
  const dom=new JSDOM('<!doctype html><html><body><nav aria-label="Seitennavigation"><details><summary>Menü</summary></details></nav><div id="mount"></div></body></html>',{url:'https://jagdlatein.test/online-kurse'});
  const saved=new Map(),requests=[],pushes=[]; let platform=options.platform||'browser',accountCalls=0,closes=0,opens=0;
  const router={isReady:true,asPath:'/online-kurse',query:{},push:(...args)=>{const task=defer();pushes.push({args,...task});return task.promise;},...options.router};
  const account={account:{email:'isolated@example.test',admin:false,paid:true},progress:[],accountError:null,progressError:null,loading:false,progressLoading:false,reload(){},...options.account};
  const defaultFetch=(url,init={})=>{const task=defer();requests.push({url,init,...task});return task.promise;};
  for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,fetch:defaultFetch})) {
    saved.set(key,Object.getOwnPropertyDescriptor(global,key));Object.defineProperty(global,key,{configurable:true,writable:true,value});
  }
  dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  const loader=createLoader({
    'next/router':{useRouter:()=>router},
    'next/link':({href,children,prefetch,scroll,...rest})=>React.createElement('a',{...rest,href:typeof href==='string'?href:href.pathname},children),
    './LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},
    './PageMenu':{__esModule:true,default:({children,title})=>React.createElement('section',{'data-menu':title},children),closePageMenu:()=>{closes++;},openPageMenu:()=>{opens++;}},
    '../hooks/useWebCoursePlatform':{__esModule:true,default:()=>platform},
    '../hooks/useAccountOverview':{__esModule:true,default:()=>{accountCalls++;return account;}},
  });
  const Component=loader(file),root=local('react-dom/client').createRoot(dom.window.document.getElementById('mount'));
  let currentProps=initialProps;
  const render=async(next=currentProps)=>{currentProps=next;await React.act(async()=>{root.render(React.createElement(Component.default,currentProps));await flush();});};
  await render();
  const f={dom,router,account,requests,pushes,get accountCalls(){return accountCalls;},get closes(){return closes;},get opens(){return opens;},render,
    setPlatform(value){platform=value;},get document(){return dom.window.document;},get text(){return dom.window.document.body.textContent;},
    button(text){const found=[...dom.window.document.querySelectorAll('button')].find(node=>node.textContent.trim()===text);assert.ok(found,`button ${text}`);return found;},
    async click(node){await React.act(async()=>{node.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));await flush();});},
    async invoke(fn,...args){await React.act(async()=>{fn(...args);await flush();});},
    async answer(index,body,status=200){await React.act(async()=>{requests[index].resolve({ok:status>=200&&status<300,status,json:async()=>body});await flush();});},
    async route(query,asPath){router.query=query;router.asPath=asPath||`/online-kurse?${new URLSearchParams(query)}`;await render();},
    async unmount(){await React.act(async()=>root.unmount());},
    async dispose(){await React.act(async()=>root.unmount());dom.window.close();for(const[key,value]of saved){if(value)Object.defineProperty(global,key,value);else delete global[key];}},
  };return f;
}

test('Academy selection rejects arrays, explicit empty values and conflicting fields; query changes preserve only unrelated context',()=>{
  assert.equal(view.readAcademySelection({isReady:false,query:{}}),null);
  assert.deepEqual(view.readAcademySelection({isReady:true,query:{}}),{view:'kurse',category:'all',offerId:null,sessionId:null});
  for(const query of [{ansicht:[]},{ansicht:''},{ansicht:'unknown'},{kategorie:['wildkunde']},{kategorie:''},{angebot:[OID]},{termin:''},{ansicht:'kurse',termin:SID},{ansicht:'live',angebot:OID},{ansicht:'live',termin:SID,angebot:OID}])assert.deepEqual(view.readAcademySelection({isReady:true,query}),{invalid:true});
  assert.deepEqual(view.academyQuery({ansicht:'live',termin:SID,kategorie:'wildkunde',q:'context'}, {ansicht:'schulen'}),{q:'context',ansicht:'schulen'});
});

test('Calendar escapes event injection, uses UTC instants and folds complete UTF-8 characters within 75 octets',()=>{
  const cal=view.makeAcademyCalendar({...session,title:'Ä🦌'.repeat(70)+'\r\nBEGIN:VEVENT,;\\'},offer,now);
  assert.equal((cal.match(/^BEGIN:VEVENT$/gm)||[]).length,1);
  for(const line of cal.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75,`${Buffer.byteLength(line)} octets`);
  const unfolded=cal.replace(/\r\n /g,'');
  assert.match(unfolded,/\\nBEGIN:VEVENT\\,\\;\\\\/);
  assert.doesNotMatch(unfolded,/\ufffd/);assert.match(unfolded,/DESCRIPTION:Fiktiver Testkurs\\nZeitangaben/);
  assert.match(unfolded,new RegExp(`URL:https://jagdlatein.de/online-kurse\\?ansicht=live&termin=${SID}`));
  assert.doesNotMatch(unfolded,/jagdlatein-[0-9a-f-]{36}|meet\.jit\.si/);
  for(const input of ['2026-02-30T18:00','2026-10-25T24:00','2026-10-25','2026-10-25T18:00Z'])assert.throws(()=>view.academyUtcInput(input));
  assert.equal(view.academyUtcInput('2026-10-25T18:00'),'2026-10-25T18:00:00.000Z');
});

test('Checking/native shells do not mount personal workspace or request academy data',async()=>{
  const f=await fixture('components/OnlineAcademy.js',{catalog},{platform:'checking'});
  try{assert.match(f.text,/vorbereitet/);assert.equal(f.accountCalls,0);assert.equal(f.requests.length,0);f.setPlatform('native');await f.render();assert.match(f.text,/Onlinekurse im Webbrowser/);assert.equal(f.accountCalls,0);assert.equal(f.requests.length,0);assert.equal(f.document.querySelector('iframe'),null);}finally{await f.dispose();}
});

test('Student workspace derives content only after URL commit, preserves context and follows history',async()=>{
  const f=await fixture('components/OnlineAcademy.js',{catalog},{router:{query:{kontext:'behalten'},asPath:'/online-kurse?kontext=behalten'}});
  try{
    await f.answer(0,details());assert.match(f.text,/Vorhandener Testkurs/);assert.equal(f.document.querySelector('iframe'),null);assert.equal(f.requests.length,1);
    await f.click(f.button('Live-Unterricht'));assert.equal(f.pushes.length,1);assert.deepEqual(f.pushes[0].args,[{pathname:'/online-kurse',query:{kontext:'behalten',ansicht:'live'}},undefined,{shallow:true,scroll:false}]);
    assert.match(f.text,/Vorhandener Testkurs/);assert.doesNotMatch(f.text,/Fiktiver Testtermin/);
    await f.invoke(f.pushes[0].resolve,true);assert.match(f.text,/Vorhandener Testkurs/,'Promise success alone is not a URL commit');
    await f.route({kontext:'behalten',ansicht:'live'});assert.match(f.text,/Fiktiver Testtermin/);assert.doesNotMatch(f.text,/Vorhandener Testkurs/);assert.equal(f.document.activeElement.id,'academy-content-title');
    await f.route({kontext:'behalten'});assert.match(f.text,/Vorhandener Testkurs/);assert.equal(f.requests.length,1,'History selection does not leak a room request');
  }finally{await f.dispose();}
});

test('Failed, cancelled and superseded navigation cannot overwrite URL-backed content or show stale errors',async()=>{
  const f=await fixture('components/OnlineAcademy.js',{catalog});
  try{await f.answer(0,details());const old=props(f.button('Live-Unterricht')).onClick;await f.invoke(old);await f.invoke(f.pushes[0].resolve,false);assert.match(f.text,/nicht übernommen/);assert.match(f.text,/Vorhandener Testkurs/);
    await f.invoke(old);await f.route({ansicht:'schulen'});await f.invoke(f.pushes[1].reject,new Error('old navigation'));assert.match(f.text,/Anbieterprofile|Fiktive Testschule/);assert.doesNotMatch(f.text,/old navigation|Auswahl konnte nicht/);
    const pushes=f.pushes.length;await f.invoke(old);assert.equal(f.pushes.length,pushes,'Origin-bound stale handler cannot navigate another view');
  }finally{await f.dispose();}
});

test('Unready and malformed Academy URLs do not show fallback self-learning; students never see administration editor',async()=>{
  const f=await fixture('components/OnlineAcademy.js',{catalog},{router:{isReady:false,query:{ansicht:'live'},asPath:'/online-kurse?ansicht=live'}});
  try{assert.doesNotMatch(f.text,/Vorhandener Testkurs|Kursangebote verwalten/);assert.match(f.text,/Kursauswahl wird geladen/);await f.answer(0,details());f.router.isReady=true;await f.route({ansicht:['live','kurse']});assert.match(f.text,/Diese Auswahl ist nicht verfügbar/);assert.doesNotMatch(f.text,/Vorhandener Testkurs/);assert.equal([...f.document.querySelectorAll('button')].some(node=>node.textContent==='Verwaltung'),false);
    await f.route({ansicht:'verwaltung'});await f.answer(1,details());assert.match(f.text,/Betreiber vorbehalten/);assert.equal(f.document.querySelector('form'),null);
  }finally{await f.dispose();}
});

test('Live room entry is explicit, duplicate clicks issue one request, and embeds only a validated muted room',async()=>{
  const f=await fixture('components/LiveCourseRoom.js',{session,offer});
  try{assert.equal(f.requests.length,0);assert.equal(f.document.querySelector('iframe'),null);const start=props(f.button('Videoraum laden')).onClick;await f.invoke(()=>{void start();void start();});assert.equal(f.requests.length,1);assert.equal(f.requests[0].init.credentials,'same-origin');assert.equal(f.requests[0].init.cache,'no-store');await f.answer(0,room());const frame=f.document.querySelector('iframe');assert.ok(frame);assert.match(frame.src,/^https:\/\/meet\.jit\.si\/jagdlatein-/);assert.match(frame.src,/startWithAudioMuted=true.*startWithVideoMuted=true/);assert.doesNotMatch(frame.src,/email|isolated/);assert.equal(frame.getAttribute('referrerpolicy'),'no-referrer');
    await f.click(f.button('Videoraum schließen'));assert.equal(f.document.querySelector('iframe'),null);
  }finally{await f.dispose();}
});

test('Denied and invalid room responses never embed a conference; retry remains explicit',async()=>{
  const f=await fixture('components/LiveCourseRoom.js',{session,offer});
  try{for(const [body,status]of [[{message:'Noch nicht freigegeben'},403],[room({host:'untrusted.test'}),200],[room({sessionId:OID}),200],[room({endsAt:new Date(now-1).toISOString()}),200]]){await f.click(f.button('Videoraum laden'));await f.answer(f.requests.length-1,body,status);assert.equal(f.document.querySelector('iframe'),null);assert.ok(f.document.querySelector('[role="alert"]'));}assert.equal(f.requests.length,4);}finally{await f.dispose();}
});

test('Menu opening ends an embedded room and blocks an old pending result; unmount blocks retained load actions',async()=>{
  const f=await fixture('components/LiveCourseRoom.js',{session,offer});
  try{const start=props(f.button('Videoraum laden')).onClick;await f.invoke(start);const menu=f.document.querySelector('nav details');await f.invoke(()=>{menu.open=true;menu.dispatchEvent(new f.dom.window.Event('jagdlatein-menu-visibility'));});assert.equal(f.requests[0].init.signal.aborted,true);await f.answer(0,room());assert.equal(f.document.querySelector('iframe'),null);
    await f.invoke(()=>{menu.open=false;});await f.click(f.button('Videoraum laden'));assert.equal(f.requests.length,2,'A fresh room load still works after both custom and native menu-toggle notifications');await f.answer(1,room());assert.ok(f.document.querySelector('iframe'));await f.invoke(()=>{menu.open=true;menu.dispatchEvent(new f.dom.window.Event('jagdlatein-menu-visibility'));});assert.equal(f.document.querySelector('iframe'),null);
    await f.unmount();const count=f.requests.length;await f.invoke(start);assert.equal(f.requests.length,count);
  }finally{await f.dispose();}
});

test('Synchronous parent origin invalidation blocks room actions and late fetch output before unmount',async()=>{
  let current=true;const f=await fixture('components/LiveCourseRoom.js',{session,offer,canAct:()=>current});
  try{const start=props(f.button('Videoraum laden')).onClick;current=false;await f.invoke(start);assert.equal(f.requests.length,0);current=true;await f.invoke(start);assert.equal(f.requests.length,1);current=false;await f.answer(0,room());assert.equal(f.document.querySelector('iframe'),null);}finally{await f.dispose();}
});

test('A retained close action from a previous connection cannot terminate a newer explicit room load',async()=>{
  const f=await fixture('components/LiveCourseRoom.js',{session,offer});
  try{await f.click(f.button('Videoraum laden'));await f.answer(0,room());const oldClose=props(f.button('Videoraum schließen')).onClick;await f.invoke(oldClose);await f.click(f.button('Videoraum laden'));await f.answer(1,room());assert.ok(f.document.querySelector('iframe'));await f.invoke(oldClose);assert.ok(f.document.querySelector('iframe'),'Old connection close action must not affect its successor');}finally{await f.dispose();}
});

test('An old load action is inert after a connection closes while the current load action can retry',async()=>{
  const f=await fixture('components/LiveCourseRoom.js',{session,offer});
  try{const oldLoad=props(f.button('Videoraum laden')).onClick;await f.invoke(oldLoad);await f.answer(0,room());await f.click(f.button('Videoraum schließen'));await f.invoke(oldLoad);assert.equal(f.requests.length,1);await f.click(f.button('Videoraum laden'));assert.equal(f.requests.length,2);await f.answer(1,room());assert.ok(f.document.querySelector('iframe'));}finally{await f.dispose();}
});

test('An ended room closes on visible return and a revoked recheck cannot leave the iframe active',async()=>{
  const f=await fixture('components/LiveCourseRoom.js',{session,offer});const originalNow=Date.now;
  try{await f.click(f.button('Videoraum laden'));await f.answer(0,room());Object.defineProperty(f.document,'visibilityState',{configurable:true,value:'visible'});await f.invoke(()=>f.document.dispatchEvent(new f.dom.window.Event('visibilitychange')));assert.equal(f.requests.length,2);await f.answer(1,{message:'Zugang entfernt'},403);assert.equal(f.document.querySelector('iframe'),null);assert.match(f.text,/Raumzugang hat sich geändert/);
    await f.click(f.button('Videoraum laden'));await f.answer(2,room());Date.now=()=>Date.parse(session.ends_at)+1;await f.invoke(()=>f.document.dispatchEvent(new f.dom.window.Event('visibilitychange')));assert.equal(f.document.querySelector('iframe'),null);assert.match(f.text,/Unterrichtstermin ist beendet/);
  }finally{Date.now=originalNow;await f.dispose();}
});

test('Management resources stay bound to identity and scope; late administrator data cannot enter a student view',async()=>{
  const f=await fixture('components/OnlineAcademy.js',{catalog},{router:{query:{ansicht:'verwaltung'},asPath:'/online-kurse?ansicht=verwaltung'},account:{account:{email:'operator@example.test',admin:true,paid:true}}});
  try{assert.equal(f.requests[0].url,'/api/online-academy?scope=manage');await f.answer(0,details({canManage:true}));assert.match(f.text,/Kursangebote verwalten/);
    f.account.account={email:'student@example.test',admin:false,paid:true};await f.render();assert.doesNotMatch(f.text,/Kursangebote verwalten/);assert.equal(f.document.querySelector('form'),null);await f.route({ansicht:'kurse'});assert.equal(f.requests[1].init.signal.aborted,true);await f.answer(1,details({canManage:true}));assert.doesNotMatch(f.text,/Kursangebote verwalten/);await f.answer(2,details());assert.match(f.text,/Vorhandener Testkurs/);assert.equal(f.document.querySelector('form'),null);
  }finally{await f.dispose();}
});

test('Admin sends only declared fields, combines current inputs and rejects duplicate saves',async()=>{
  let saved=0;const f=await fixture('components/OnlineAcademyAdmin.js',{data:details({canManage:true}),catalog,onSaved:()=>saved++});
  try{const inputs=f.document.querySelectorAll('input'),textarea=f.document.querySelector('textarea'),save=props(f.document.querySelector('form')).onSubmit;await f.invoke(()=>{props(inputs[0]).onChange({target:{value:'Testschule Neu'}});props(inputs[1]).onChange({target:{value:'https://example.test/new'}});props(textarea).onChange({target:{value:'Beschreibung Neu'}});});await f.invoke(()=>{void save({preventDefault(){}});void save({preventDefault(){}});});assert.equal(f.requests.length,1);assert.deepEqual(JSON.parse(f.requests[0].init.body),{action:'school',record:{name:'Testschule Neu',description:'Beschreibung Neu',website:'https://example.test/new',status:'pending'}});assert.equal(f.document.querySelector('fieldset').disabled,true);await f.answer(0,{ok:true});assert.equal(saved,1);assert.match(f.text,/Gespeichert/);}finally{await f.dispose();}
});

test('Admin retained editor actions cannot mutate replacement drafts or save after origin change/unmount',async()=>{
  let current=true,saved=0;const f=await fixture('components/OnlineAcademyAdmin.js',{data:details({canManage:true}),catalog,onSaved:()=>saved++,canAct:()=>current});
  try{const oldChange=props(f.document.querySelector('input')).onChange,oldSubmit=props(f.document.querySelector('form')).onSubmit;await f.click(f.button('Neu anlegen'));await f.invoke(oldChange,{target:{value:'Stale draft'}});assert.equal(f.document.querySelector('input').value,'');await f.invoke(oldSubmit,{preventDefault(){}});assert.equal(f.requests.length,0);
    const freshSubmit=props(f.document.querySelector('form')).onSubmit;current=false;await f.invoke(freshSubmit,{preventDefault(){}});assert.equal(f.requests.length,0);current=true;await f.invoke(freshSubmit,{preventDefault(){}});assert.equal(f.requests.length,1);await f.unmount();assert.equal(f.requests[0].init.signal.aborted,true);await f.answer(0,{ok:true});assert.equal(saved,0);await f.invoke(freshSubmit,{preventDefault(){}});assert.equal(f.requests.length,1);
  }finally{await f.dispose();}
});

test('Admin session form rejects impossible UTC dates before POST and serialises a valid date exactly once',async()=>{
  const f=await fixture('components/OnlineAcademyAdmin.js',{data:details({canManage:true}),catalog,onSaved(){}});
  try{await f.invoke(props(f.document.querySelector('select')).onChange,{target:{value:'session'}});const dates=f.document.querySelectorAll('input[type="datetime-local"]');await f.invoke(()=>{props(dates[0]).onChange({target:{value:'2026-02-30T17:00'}});props(dates[1]).onChange({target:{value:'2026-03-01T18:00'}});});await f.invoke(props(f.document.querySelector('form')).onSubmit,{preventDefault(){}});assert.equal(f.requests.length,0);assert.match(f.text,/ungültig/);await f.invoke(()=>{props(dates[0]).onChange({target:{value:'2026-10-25T17:00'}});props(dates[1]).onChange({target:{value:'2026-10-25T18:00'}});});await f.invoke(props(f.document.querySelector('form')).onSubmit,{preventDefault(){}});assert.equal(f.requests.length,1);const body=JSON.parse(f.requests[0].init.body);assert.equal(body.record.starts_at,'2026-10-25T17:00:00.000Z');assert.equal(body.record.ends_at,'2026-10-25T18:00:00.000Z');await f.answer(0,{ok:true});}finally{await f.dispose();}
});

test('The public course catalog metadata never contains classroom credentials or full lessons',()=>{
  const actual=load('lib/my-course-catalog.js').getMyCourseCatalog();
  assert.ok(actual.length>100);assert.doesNotMatch(JSON.stringify(actual),/"(?:room_key|roomName|room_token|questions|lessons|correct|paragraphs)":/);
});
