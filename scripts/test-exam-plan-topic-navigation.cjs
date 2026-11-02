// Actual React/effect lifecycles with a mutable router and isolated storage.
// No customer account, live API or real browser data is touched.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const{createLoader,local}=require('./helpers/project-module.cjs');
const React=local('react');
const{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const categories=createLoader()('lib/learning-categories.js').learningCategoryDetails;
const base='/lernen/pruefungsplan', settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function address(query={},hash=''){const params=new URLSearchParams();for(const[key,value]of Object.entries(query))for(const item of Array.isArray(value)?value:[value])params.append(key,item);return`${base}${params.size?'?'+params:''}${hash?'#'+hash:''}`;}
async function fixture(t,{query={},ready=true,hash=''}={}){
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://jagdlatein.test'+address(query,hash)});
 const navigation=[],menus=[],focuses=[],scrolls=[],writes=[],saved=new Map(),frames=new Map();let frame=0,current=null,mounted=true;
 const records=new Map([['jl_exam_profile_v1','{"country":"CH","region":"ZH"}'],['jagdlatein.repetition.v1','{"version":1,"entries":{}}']]);
 const storage={getItem:key=>records.get(key)??null,setItem(key,value){writes.push(['set',key,value]);records.set(key,value);},removeItem(key){writes.push(['remove',key]);records.delete(key);}};
 Object.defineProperty(dom.window,'localStorage',{value:storage,configurable:true});
 dom.window.scrollTo=options=>scrolls.push(options);
 dom.window.requestAnimationFrame=callback=>{const id=++frame;frames.set(id,callback);return id;};dom.window.cancelAnimationFrame=id=>frames.delete(id);
 const focus=dom.window.HTMLElement.prototype.focus;dom.window.HTMLElement.prototype.focus=function(options){focuses.push({id:this.id,options});return focus.call(this,options);};
 const router={isReady:ready,query,asPath:address(query,hash),push(href,as,options){const request={href,as,options,...deferred()};navigation.push(request);return request.promise;}};
 for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true,fetch(){throw new Error('Unexpected API call in reading selection');}})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
 const useTopic=createLoader({'next/router':{useRouter:()=>router},'../components/PageMenu':{closePageMenu(){menus.push(['close']);},openPageMenu(id){menus.push(['open',id]);}}})('hooks/useExamPlanTopic.js').default;
 function Probe(){current=useTopic(categories);return React.createElement('main',null,React.createElement('h1',{id:'page-start',tabIndex:-1,'data-learning-page-start':''},'Prüfungsplan'),React.createElement('h2',{id:'exam-plan-learning',ref:current.heading,tabIndex:-1},'Dein Lernweg'),React.createElement('p',{'data-topic':''},current.ready?(current.topic||'invalid'):'unready'),React.createElement('ul',null,categories.filter(category=>current.topic==='alle'||current.topic===category.slug).map(category=>React.createElement('li',{key:category.slug},category.title))),current.error&&React.createElement('p',{role:'alert'},current.error));}
 const root=local('react-dom/client').createRoot(document.getElementById('root'));
 const render=()=>React.act(async()=>{root.render(React.createElement(Probe));await settle();});
 function mutate(nextQuery,nextHash='',nextReady=true){router.query=nextQuery;router.asPath=address(nextQuery,nextHash);router.isReady=nextReady;dom.window.history.replaceState(null,'',router.asPath);}
 async function route(nextQuery,nextHash='',nextReady=true){mutate(nextQuery,nextHash,nextReady);await render();}
 async function start(value,handler=current.select){let action;await React.act(async()=>{action=handler(value);await settle();});return{action,request:navigation.at(-1)};}
 async function finish(request,result=true,reject=false){await React.act(async()=>{reject?request.reject(result):request.resolve(result);await settle();});}
 const text=()=>document.getElementById('root').textContent,topic=()=>document.querySelector('[data-topic]')?.textContent;
 async function unmount(){if(mounted){mounted=false;await React.act(async()=>root.unmount());}}
 t.after(async()=>{await unmount();dom.window.close();for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 await render();return{dom,router,navigation,menus,focuses,scrolls,writes,records,frames,render,route,mutate,start,finish,text,topic,unmount,current:()=>current,async flushFrames(){await React.act(async()=>{for(const[id,callback]of [...frames]){frames.delete(id);callback();}await settle();});},async timers(){await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,1));});}};
}

test('Bare entry documents all twelve canonical categories and router readiness never flashes a substituted category',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'},ready:false});assert.equal(h.topic(),'unready');assert.equal(document.querySelectorAll('li').length,0);assert.equal(h.navigation.length,0);assert.equal(h.focuses.length,0);
 await h.route({});assert.equal(h.topic(),'alle');assert.deepEqual([...document.querySelectorAll('li')].map(node=>node.textContent),categories.map(category=>category.title));assert.equal(h.navigation.length,0);assert.equal(h.writes.length,0);
});

test('Every exact category deep link selects only its own group while empty unknown and repeated values request selection help',async t=>{
 const h=await fixture(t,{ready:false});
 for(const category of categories){await h.route({kategorie:category.slug});assert.equal(h.topic(),category.slug);assert.deepEqual([...document.querySelectorAll('li')].map(node=>node.textContent),[category.title]);}
 for(const value of ['', 'unknown', ['wildkunde'], ['wildkunde','hundewesen']]){await h.route({kategorie:value});await h.timers();assert.equal(h.topic(),'invalid');assert.equal(document.querySelectorAll('li').length,0);assert.deepEqual(h.menus.at(-1),['open','exam-plan-topic']);}
 assert.equal(h.navigation.length,0);assert.equal(h.writes.length,0);
});

test('Outgoing push preserves unrelated context, retains visible content while pending and focuses only after the actual URL commit',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde',quelle:'suche',q:'Vögel'}});await h.flushFrames();const before=h.text(),focus=h.focuses.length,scroll=h.scrolls.length;
 const operation=await h.start('hundewesen'),request=operation.request;
 assert.deepEqual(request.href,{pathname:base,query:{kategorie:'hundewesen',quelle:'suche',q:'Vögel'},hash:'exam-plan-learning'});assert.equal(request.as,undefined);assert.deepEqual(request.options,{shallow:true,scroll:false});assert.equal(h.text(),before);assert.equal(h.focuses.length,focus);assert.equal(h.scrolls.length,scroll);
 await h.finish(request,true);await operation.action;assert.equal(h.text(),before);assert.equal(h.focuses.length,focus);
 await h.route(request.href.query,request.href.hash);assert.equal(h.topic(),'hundewesen');assert.equal(document.activeElement.id,'page-start');assert.equal(h.focuses.length,focus+1);assert.equal(h.scrolls.at(-1).top,0);assert.deepEqual(h.scrolls.at(-1),{left:0,top:0,behavior:'instant'});assert.equal(h.writes.length,0);
});

test('Rejected false and cancelled transitions keep the current learning group and never erase profile or answer history',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'}});const beforeRecords=JSON.stringify([...h.records]);
 for(const result of ['reject','false','cancel']){const before=h.topic(),operation=await h.start('hundewesen');await h.finish(operation.request,result==='false'?false:Object.assign(new Error('Synthetic route error'),result==='cancel'?{cancelled:true}:{}),result!=='false');await operation.action;assert.equal(h.topic(),before);assert.equal(JSON.stringify([...h.records]),beforeRecords);assert.equal(h.writes.length,0);assert.equal(Boolean(document.querySelector('[role="alert"]')),result!=='cancel');}
});

test('Reselecting the current settled category writes no extra history while choosing all removes only the category field',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde',quelle:'lektion',q:'Merkmale'}});const original=h.navigation.length;await(await h.start('wildkunde')).action;assert.equal(h.navigation.length,original);
 const operation=await h.start('alle');assert.deepEqual(operation.request.href.query,{quelle:'lektion',q:'Merkmale'});await h.route(operation.request.href.query,operation.request.href.hash);await h.finish(operation.request);await operation.action;assert.equal(h.topic(),'alle');assert.equal(document.querySelectorAll('li').length,12);
});

test('History and hash context changes invalidate a pending failure even when the displayed category remains the same',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'}});const old=h.current().select,operation=await h.start('hundewesen');
 await h.route({kategorie:'wildkunde'},'anderer-kontext');const count=h.navigation.length;await h.finish(operation.request,new Error('Synthetic obsolete failure'),true);await operation.action;assert.equal(h.topic(),'wildkunde');assert.ok(!document.querySelector('[role="alert"]'));
 await(await h.start('hundewesen',old)).action;assert.equal(h.navigation.length,count);
 await h.route({kategorie:'hundewesen'});assert.equal(h.topic(),'hundewesen');await h.route({kategorie:'wildkunde'});await(await h.start('natur-revier',old)).action;assert.equal(h.navigation.length,count,'A-B-A cannot revive the first A handler');
});

test('The newest pending selection wins and an older failure cannot reopen or replace the committed group',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'}});const first=await h.start('hundewesen'),second=await h.start('natur-revier');assert.equal(h.topic(),'wildkunde');
 await h.route(second.request.href.query,second.request.href.hash);await h.finish(second.request);await second.action;const menus=h.menus.length;await h.finish(first.request,new Error('Synthetic superseded push'),true);await first.action;assert.equal(h.topic(),'natur-revier');assert.equal(h.menus.length,menus);assert.ok(!document.querySelector('[role="alert"]'));
});

test('Old actions stop before a rerender when the mutable router has already moved or lost readiness',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'}});const old=h.current().select;
 h.mutate({kategorie:'hundewesen'},'external-history');const before=h.navigation.length;const operation=await h.start('natur-revier',old);if(h.navigation.length>before){await h.finish(operation.request,false);await operation.action;}assert.equal(h.navigation.length,before,'No push from old raw-URL origin before rerender');
 await h.route({kategorie:'wildkunde'});const current=h.current().select;h.mutate({kategorie:'wildkunde'},'',false);const count=h.navigation.length;const next=await h.start('hundewesen',current);if(h.navigation.length>count){await h.finish(next.request,false);await next.action;}assert.equal(h.navigation.length,count,'Lost readiness blocks an old callback before rerender');
});

test('Unmount invalidates current and retained select/open handlers and ignores late navigation errors',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'}});const old=h.current().select,open=h.current().open,operation=await h.start('hundewesen');await h.unmount();const pushes=h.navigation.length,menus=h.menus.length;
 await h.finish(operation.request,new Error('Synthetic error after dispose'),true);await operation.action;await old('natur-revier');open();assert.equal(h.navigation.length,pushes);assert.equal(h.menus.length,menus);assert.equal(h.writes.length,0);
});

test('A pointer interruption cancels deferred top restoration and an obsolete frame cannot scroll a successor URL',async t=>{
 const h=await fixture(t,{query:{kategorie:'wildkunde'}});assert.ok(h.frames.size>0);const count=h.scrolls.length;document.dispatchEvent(new h.dom.window.Event('pointerdown'));await h.flushFrames();assert.equal(h.scrolls.length,count);
 await h.route({kategorie:'hundewesen'});assert.ok(h.frames.size>0);const after=h.scrolls.length;h.mutate({kategorie:'natur-revier'});await h.flushFrames();assert.equal(h.scrolls.length,after);assert.equal(h.writes.length,0);
});
