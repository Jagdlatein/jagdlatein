// Real React lifecycles and strictly isolated storage/network doubles.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const{createLoader,local}=require('./helpers/project-module.cjs');
const React=local('react');
const{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const review=createLoader()('lib/daily-review.js'),offline=createLoader()('lib/offline-learning.js');
const questions=[0,1].map(number=>({id:`wissen-cleanup-${number}`,category:'wildkunde',q:`Isolierte Frage ${number}`,answers:['a','b','c','d'].map(id=>({id,text:`Antwort ${number}/${id}`})),correct:['a'],explain:`Unveränderte Erklärung ${number}.`,reading:{title:`Bestehende Lektion ${number}`,paragraph:`Passender bestehender Lerntext ${number}.`},courseTitle:'Isolierter Kurs',href:`/kurse/wissen-synthetic#lesson-${number}`,sources:[{url:'https://example.invalid/source',label:'Isolierte Quelle'}]}));
const settle=async()=>{for(let index=0;index<25;index++)await Promise.resolve();};
function replaceGlobals(t,values,auto=true){const saved=new Map();for(const[key,value]of Object.entries(values)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}const restore=()=>{for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}};if(auto)t.after(restore);return restore;}
async function fixture(t){
 const dom=new JSDOM('<!doctype html><html><body><div id="mount"></div><nav><details><summary>Menü</summary><div id="jl-page-menu"></div></details></nav></body></html>',{url:'https://example.invalid/lernen/fuenf-minuten'});
 const records=new Map([['unrelated-notes','preserve']]),writes=[],requests=[],listeners=new Map();
 const add=dom.window.addEventListener.bind(dom.window),remove=dom.window.removeEventListener.bind(dom.window);
 dom.window.addEventListener=(name,handler,...rest)=>{if(['storage','jagdlatein-account-deleted'].includes(name)){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(handler);}add(name,handler,...rest);};
 dom.window.removeEventListener=(name,handler,...rest)=>{if(['storage','jagdlatein-account-deleted'].includes(name)){listeners.get(name)?.delete(handler);if(listeners.get(name)?.size===0)listeners.delete(name);}remove(name,handler,...rest);};
 Object.defineProperty(dom.window,'localStorage',{value:{getItem:key=>records.get(key)??null,setItem(key,value){assert.equal(key,review.REVIEW_STORAGE_KEY);records.set(key,value);writes.push(JSON.parse(value));},removeItem(key){assert.equal(key,review.REVIEW_STORAGE_KEY);records.delete(key);}},configurable:true});
 dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const router={isReady:true,query:{},asPath:'/lernen/fuenf-minuten',push(){throw Error('No local-review navigation expected');}};
 const restore=replaceGlobals(t,{window:dom.window,document:dom.window.document,navigator:dom.window.navigator,MutationObserver:dom.window.MutationObserver,IS_REACT_ACT_ENVIRONMENT:true,fetch:(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}))},false);
 const Component=createLoader({'next/router':{useRouter:()=>router},'next/head':()=>null,'next/link':({href,children,...props})=>React.createElement('a',{href,...props},children)})('components/DailyReview.js').default;
 let root=local('react-dom/client').createRoot(document.getElementById('mount'));
 const act=fn=>React.act(async()=>{fn?.();await settle();});
 const render=()=>act(()=>root.render(React.createElement(Component,{pool:questions.map(({id,category})=>({id,category}))})));
 const buttons=()=>[...document.querySelectorAll('button')];
 const button=label=>{const found=buttons().find(node=>node.textContent.trim()===label);assert.ok(found,label);return found;};
 const callback=node=>{const key=Object.keys(node).find(key=>key.startsWith('__reactProps$'));assert.ok(key);return node[key].onClick;};
 async function respond(index=requests.length-1,status=200){const pending=requests[index];assert.ok(pending);const params=new URL(pending.url,'https://example.invalid').searchParams;assert.deepEqual([...params.keys()],['ids']);assert.equal(pending.options.body,undefined);const ids=params.get('ids').split(',');await act(()=>pending.resolve({ok:status===200,status,json:async()=>status===200?{questions:ids.map(id=>questions.find(item=>item.id===id)).reverse()}:{message:'Bitte erneut anmelden.'}}));}
 const event=(kind='remove')=>kind==='deleted'?new dom.window.Event('jagdlatein-account-deleted'):new dom.window.StorageEvent('storage',{key:kind==='clear'?null:kind==='unrelated'?'unrelated-notes':review.REVIEW_STORAGE_KEY,newValue:kind==='update'?'new unrelated-tab answer':null,storageArea:kind==='session'?dom.window.sessionStorage:null});
 t.after(async()=>{if(root)await act(()=>root.unmount());dom.window.close();restore();});await render();
 return{dom,records,writes,requests,listeners,button,callback,act,render,respond,event,text:()=>document.getElementById('mount').textContent,async unmount(){if(root){await act(()=>root.unmount());root=null;}}};
}
for(const kind of ['remove','clear','deleted'])test(`A ${kind} event invalidates an old answer before React repaints and requires a fresh authenticated load`,async t=>{
 const h=await fixture(t);await h.respond();
 const q=questions.find(item=>item.q===document.getElementById('review-question-title').textContent),oldAnswer=h.callback(h.button(q.answers[1].text));
 await h.act(()=>{window.dispatchEvent(h.event(kind));oldAnswer();});
 assert.equal(h.writes.length,0);assert.equal(h.requests.length,1);assert.match(h.text(),/vorherige Runde wurde geschlossen/);assert.ok(!h.text().includes(q.q));assert.equal(document.querySelector('#review-mistakes-title'),null);
 const restart=h.callback(h.button('Neue kurze Runde'));await h.act(()=>{restart();restart();oldAnswer();});assert.equal(h.requests.length,2);assert.equal(h.writes.length,0);
 assert.equal(h.requests[1].options.credentials,'same-origin');assert.equal(h.requests[1].options.cache,'no-store');await h.respond(1,401);
 assert.match(h.text(),/Bitte erneut anmelden/);assert.ok(document.querySelector('a[href="/login?next=%2Flernen%2Ffuenf-minuten"]'));assert.equal(h.writes.length,0);assert.equal(h.records.get('unrelated-notes'),'preserve');
});
test('A deletion aborts the in-flight question load and a late successful response cannot revive the old round',async t=>{
 const h=await fixture(t);const original=h.requests[0];assert.equal(original.options.signal.aborted,false);
 await h.act(()=>window.dispatchEvent(h.event()));assert.equal(original.options.signal.aborted,true);assert.equal(h.requests.length,1);
 await h.respond(0);assert.match(h.text(),/vorherige Runde wurde geschlossen/);assert.equal(h.writes.length,0);assert.equal(h.requests.length,1);
 await h.act(()=>h.button('Neue kurze Runde').click());await h.respond(1);assert.ok(questions.some(q=>h.text().includes(q.q)));assert.equal(h.writes.length,0);
});
test('History updates, unrelated keys and session storage removals preserve the current round and its one answer write',async t=>{
 const h=await fixture(t);await h.respond();const original=h.text();
 for(const kind of ['update','unrelated','session'])await h.act(()=>window.dispatchEvent(h.event(kind)));
 assert.equal(h.text(),original);assert.equal(h.requests.length,1);
 const q=questions.find(item=>item.q===document.getElementById('review-question-title').textContent);await h.act(()=>h.button(q.answers[1].text).click());assert.equal(h.writes.length,1);assert.match(h.text(),/Noch einmal nachlesen/);
 for(const saved of h.writes){assert.deepEqual(Object.keys(saved).sort(),['entries','version']);for(const entry of Object.values(saved.entries))assert.deepEqual(Object.keys(entry).sort(),['due','lastEvent','lastSeen','mistakes','seen','streak']);}
});
test('Deletion removes finished mistake explanations, blocks retained next/restart callbacks, and detaches both listeners on unmount',async t=>{
 const h=await fixture(t);await h.respond();let oldNext;
 for(let index=0;index<2;index++){const q=questions.find(item=>item.q===document.getElementById('review-question-title').textContent);await h.act(()=>h.button(q.answers[1].text).click());oldNext=h.callback(h.button(index===1?'Runde abschließen':'Nächste Frage'));await h.act(()=>oldNext());}
 assert.ok(document.querySelector('#review-mistakes-title'));const oldRestart=h.callback(h.button('Neue kurze Runde'));assert.equal(h.writes.length,2);
 await h.act(()=>{window.dispatchEvent(h.event('deleted'));oldNext();oldRestart();});assert.equal(document.querySelector('#review-mistakes-title'),null);assert.equal(h.writes.length,2);assert.equal(h.requests.length,1);
 const latestRestart=h.callback(h.button('Neue kurze Runde'));await h.unmount();assert.equal(h.listeners.size,0);await h.act(()=>{window.dispatchEvent(h.event('deleted'));latestRestart();oldRestart();});assert.equal(h.requests.length,1);assert.equal(h.writes.length,2);
});
test('The existing explicit clear-history control still starts one new round without erasing unrelated local data',async t=>{
 const h=await fixture(t);await h.respond();await h.act(()=>h.button('Wiederholungsverlauf entfernen').click());assert.equal(h.requests.length,2);assert.equal(h.writes.length,0);assert.equal(h.records.get('unrelated-notes'),'preserve');await h.respond(1);assert.ok(questions.some(q=>h.text().includes(q.q)));
});
for(const failDatabase of [false,true])for(const failCache of [false,true])test(`Offline cleanup independently attempts only its own stores (database failure=${failDatabase}, cache failure=${failCache})`,async t=>{
 const calls=[],pack=new Map([['current','synthetic']]),cachesMap=new Map([[offline.OFFLINE_CACHE,'synthetic media'],['foreign-cache','preserve']]);
 const second=Error('Isolated cache unavailable');
 replaceGlobals(t,{indexedDB:{open(name,version){assert.equal(name,offline.OFFLINE_DB);assert.equal(version,1);calls.push(['open',name]);const request={};queueMicrotask(()=>{request.result={close(){calls.push(['close']);},transaction(store,mode){assert.equal(store,'packs');assert.equal(mode,'readwrite');const tx={objectStore(){return{clear(){const result={};queueMicrotask(()=>{if(failDatabase)tx.onerror();else{pack.clear();result.onsuccess();tx.oncomplete();}});return result;}};}};return tx;}};request.onsuccess();});return request;}},caches:{async delete(name){calls.push(['cache',name]);assert.equal(name,offline.OFFLINE_CACHE);if(failCache)throw second;return cachesMap.delete(name);}}});
 if(failDatabase)await assert.rejects(offline.clearOfflineLearning(),/Der Lernrucksack konnte nicht gespeichert werden/);else if(failCache)await assert.rejects(offline.clearOfflineLearning(),failure=>failure===second);else await offline.clearOfflineLearning();
 assert.deepEqual(calls.filter(item=>item[0]==='cache'),[['cache',offline.OFFLINE_CACHE]]);assert.equal(pack.size,failDatabase?1:0);assert.equal(cachesMap.has(offline.OFFLINE_CACHE),failCache);assert.equal(cachesMap.get('foreign-cache'),'preserve');
});
