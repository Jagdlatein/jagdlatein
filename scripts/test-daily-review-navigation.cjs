// Real React lifecycles, the actual lower PageMenu portal and isolated router,
// question-response and device-storage doubles. No account or live API is used.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const{createLoader,local}=require('./helpers/project-module.cjs');
const React=local('react');
const{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const base='/lernen/fuenf-minuten',review=createLoader()('lib/daily-review.js');
const categories=createLoader()('lib/learning-categories.js').learningCategoryDetails;
const questions=[['wissen-nav-wild-error','wildkunde'],['wissen-nav-wild-due','wildkunde'],['wissen-nav-dog-new','hundewesen'],['wissen-nav-dog-error','hundewesen'],['wissen-nav-wild-fixed','wildkunde']].map(([id,category])=>({id,category,q:`Synthetische Frage ${id}`,answers:['a','b','c','d'].map(id=>({id,text:`Antwort ${id}`})),correct:['a'],explain:`Unveränderte Erklärung ${id}`,courseTitle:'Synthetischer Kurs',href:'/kurse/wissen-synthetic#lesson-existing',sources:[{label:'Isolierte Quelle',url:'https://example.invalid/source'}],sourceScope:'lesson',reading:{title:'Passende bestehende Lektion',paragraph:'Der passende vorhandene Wissenstext bleibt nach der Antwort unmittelbar sichtbar.'}}));
const catalog=questions.map(({id,category})=>({id,category}));
const settle=async()=>{for(let index=0;index<20;index++)await Promise.resolve();};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function address(query={},hash=''){
 const params=new URLSearchParams();for(const[key,value]of Object.entries(query))for(const item of Array.isArray(value)?value:[value])params.append(key,item);
 return `${base}${params.size?'?'+params:''}${hash?'#'+hash:''}`;
}
function seededHistory(){
 const now=Date.now();let history=review.parseReviewHistory(null);
 history=review.updateReviewHistory(history,questions[0].id,false,now-3600000,'old-error');
 history=review.updateReviewHistory(history,questions[1].id,true,now-2*86400000,'due-correct');
 history=review.updateReviewHistory(history,questions[3].id,false,now,'early-error');
 history=review.updateReviewHistory(history,questions[4].id,false,now-3600000,'previous-error');
 return review.updateReviewHistory(history,questions[4].id,true,now,'fixed-error');
}
function callback(element,name='onClick'){
 assert.ok(element,'Expected an actual mounted control');
 const key=Object.keys(element).find(key=>key.startsWith('__reactProps$'));
 assert.ok(key,'Expected the actual React handler');return element[key][name];
}
const choice=(id,value)=>[...document.querySelectorAll(`#${id} button[data-menu-choice]`)].find(button=>button.dataset.menuChoice===value);
const chosen=id=>document.querySelector(`#${id} button[aria-pressed="true"]`)?.dataset.menuChoice;
async function fixture(t,{query={},ready=true,history=seededHistory()}={}){
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div><nav><details><summary>Menü</summary><div id="jl-page-menu"></div></details></nav></body></html>',{url:'https://jagdlatein.de'+address(query)});
 const saved=new Map(),records=new Map([[review.REVIEW_STORAGE_KEY,JSON.stringify(history)]]),writes=[],reads=[],navigation=[],requests=[],focuses=[],scrolls=[];
 const storage={getItem(key){assert.equal(key,review.REVIEW_STORAGE_KEY);reads.push(key);return records.get(key)??null;},setItem(key,value){assert.equal(key,review.REVIEW_STORAGE_KEY);records.set(key,value);writes.push(['save',JSON.parse(value)]);},removeItem(key){assert.equal(key,review.REVIEW_STORAGE_KEY);records.delete(key);writes.push(['remove']);}};
 Object.defineProperty(dom.window,'localStorage',{value:storage,configurable:true});
 dom.window.HTMLElement.prototype.scrollIntoView=function(options){scrolls.push({id:this.id,options});};
 dom.window.scrollTo=function(options){scrolls.push({id:'page-top',options});};
 const focus=dom.window.HTMLElement.prototype.focus;
 dom.window.HTMLElement.prototype.focus=function(options){focuses.push({id:this.id,options});return focus.call(this,options);};
 const router={isReady:ready,query,asPath:address(query),push(href,as,options){const pending={href,as,options,...deferred()};navigation.push(pending);return pending.promise;}};
 const fetcher=(url,options)=>{assert.match(url,/^\/api\/lernen\/wiederholung\?/);const pending={url,options,...deferred()};requests.push(pending);return pending.promise;};
 for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,MutationObserver:dom.window.MutationObserver,fetch:fetcher,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
 const Component=createLoader({'next/router':{useRouter:()=>router},'next/head':()=>null,'next/link':({href,children,...props})=>React.createElement('a',{href,...props},children)})('components/DailyReview.js').default;
 let mounted=local('react-dom/client').createRoot(document.getElementById('root'));
 const render=()=>React.act(async()=>{mounted.render(React.createElement(Component,{pool:catalog}));await settle();});
 function rawRoute(nextQuery,hash='',nextReady=true){router.query=nextQuery;router.asPath=address(nextQuery,hash);router.isReady=nextReady;dom.window.history.replaceState(null,'',router.asPath);document.getElementById('jl-page-menu').setAttribute('data-page-menu-route',base+(dom.window.location.search||''));}
 async function route(nextQuery,hash='',nextReady=true){rawRoute(nextQuery,hash,nextReady);await render();}
 async function answer(index=requests.length-1,status=200,body){const request=requests[index];assert.ok(request);const ids=new URL(request.url,'https://example.invalid').searchParams.get('ids').split(',');await React.act(async()=>{request.resolve({ok:status>=200&&status<300,status,json:async()=>body||{questions:ids.map(id=>questions.find(question=>question.id===id)).reverse()}});await settle();});}
 async function choose(id,value){const control=choice(id,value);assert.ok(control);await React.act(async()=>{control.click();await settle();});}
 async function click(label){const control=[...document.querySelectorAll('button')].find(button=>button.textContent===label);assert.ok(control,label);await React.act(async()=>{control.click();await settle();});}
 const ids=(index=requests.length-1)=>new URL(requests[index].url,'https://example.invalid').searchParams.get('ids').split(',');
 const text=()=>document.getElementById('root').textContent;
 t.after(async()=>{if(mounted)await React.act(async()=>mounted.unmount());dom.window.close();for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 await route(query,'',ready);
 return{dom,router,records,writes,reads,navigation,requests,focuses,scrolls,render,rawRoute,route,answer,choose,click,ids,text,async unmount(){if(mounted){await React.act(async()=>mounted.unmount());mounted=null;}},button(label){return[...document.querySelectorAll('button')].find(button=>button.textContent===label);}};
}

test('Bare entry keeps the original mixed selection and places only canonical controls in the actual existing lower menu',async t=>{
 const h=await fixture(t);assert.equal(h.requests.length,1);
 assert.deepEqual(h.ids(),review.selectDailyReview(catalog,seededHistory(),{count:8}).map(question=>question.id));
 assert.equal(document.querySelectorAll('#jl-page-menu #review-mode').length,1);assert.equal(document.querySelectorAll('main select').length,0);
 assert.deepEqual([...document.querySelectorAll('#review-mode button')].map(option=>option.textContent),['Gemischt','Fällig','Fehler']);
 assert.deepEqual([...document.querySelectorAll('#review-category button')].map(option=>option.textContent),['Alle',...categories.filter(category=>catalog.some(question=>question.category===category.slug)).map(category=>category.title)]);
 await h.answer();assert.ok(h.text().includes('Synthetische Frage'));assert.equal(h.navigation.length,0);
 assert.ok(!document.querySelector('main details').open);assert.ok(!h.requests[0].url.includes('history'));assert.deepEqual(h.writes,[]);
});

test('An unready URL shows no replacement question and strict deep links load only their existing eligible IDs',async t=>{
 const h=await fixture(t,{ready:false,query:{modus:'fehler',kategorie:'hundewesen'}});
 assert.equal(h.requests.length,0);assert.equal(h.reads.length,0);assert.match(h.text(),/Auswahl wird geladen/);
 await h.route({modus:'fehler',kategorie:'hundewesen'});assert.deepEqual(h.ids(),[questions[3].id]);await h.answer();assert.match(h.text(),/Fehler wiederholen/);
 await h.route({modus:'faellig',kategorie:'wildkunde'});assert.deepEqual(h.ids().sort(),[questions[0].id,questions[1].id].sort());await h.answer();
 assert.ok(!h.ids().includes(questions[4].id));assert.equal(h.writes.length,0);
});

test('Empty strict pools explain this device state without a filler fetch or fabricated question total',async t=>{
 const h=await fixture(t,{query:{modus:'faellig',kategorie:'hundewesen'}});assert.equal(h.requests.length,0);assert.match(h.text(),/gerade keine Fragen fällig/);
 h.records.set(review.REVIEW_STORAGE_KEY,JSON.stringify(review.parseReviewHistory(null)));
 await h.route({modus:'fehler'});assert.equal(h.requests.length,0);assert.match(h.text(),/gerade keine offenen Fehler/);assert.ok(!h.text().includes('Frage 1 von'));
});

test('Unknown, empty and repeated selection fields show lower selection help without silently loading a different round',async t=>{
 const h=await fixture(t,{ready:false});
 for(const query of [{modus:''},{modus:'wrong'},{modus:['fehler','faellig']},{kategorie:''},{kategorie:'jagdrecht'},{kategorie:['wildkunde','hundewesen']}]){
  await h.route(query);await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,1));});
  assert.equal(h.requests.length,0);assert.match(h.text(),/Diese Auswahl ist nicht verfügbar/);assert.ok(document.querySelector('nav details').open);
 }
 assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);
});

test('Outgoing selection is a real push with preserved public context and commits its text and focus only with the accepted URL',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde',quelle:'suche'}});await h.answer();
 const oldText=h.text();await h.choose('review-mode','fehler');assert.equal(h.navigation.length,1);assert.equal(h.requests.length,1);assert.equal(h.text(),oldText);
 const attempt=h.navigation[0];assert.deepEqual(attempt.options,{shallow:true,scroll:false});assert.deepEqual(attempt.href.query,{modus:'fehler',kategorie:'wildkunde',quelle:'suche'});assert.equal(attempt.href.hash,'review-question-title');
 assert.equal(h.button('Antwort a').disabled,true);assert.equal(chosen('review-mode'),'gemischt');
 document.querySelector('nav details').open=true;
 await h.route(attempt.href.query,attempt.href.hash);await React.act(async()=>{attempt.resolve(true);await settle();});assert.equal(h.requests.length,2);assert.deepEqual(h.ids(),[questions[0].id]);
 await h.answer();assert.match(h.text(),/Fehler wiederholen/);assert.equal(document.querySelector('nav details').open,false);assert.equal(document.activeElement.id,'review-question-title');
 assert.ok(h.scrolls.some(value=>value.id==='page-top'&&value.options.top===0));assert.equal(h.writes.length,0);
});

test('A newer choice combines with the displayed fields and an older rejected push cannot replace its committed view',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt'}});await h.answer();await h.choose('review-mode','fehler');await h.choose('review-category','hundewesen');
 assert.deepEqual(h.navigation[1].href.query,{modus:'gemischt',kategorie:'hundewesen'});
 const latest=h.navigation[1];await h.route(latest.href.query,latest.href.hash);await React.act(async()=>{latest.resolve(true);h.navigation[0].reject(new Error('Synthetic superseded navigation'));await settle();});await h.answer();
 assert.equal(chosen('review-mode'),'gemischt');assert.equal(chosen('review-category'),'hundewesen');assert.ok(!document.querySelector('[role="alert"]'));
 assert.ok(h.ids().every(id=>questions.find(question=>question.id===id).category==='hundewesen'));
});

test('An accepted push that precedes its actual URL commit keeps the former question inert until the committed selection arrives',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});await h.answer();
 const oldAnswer=callback(h.button('Antwort a')),oldClear=callback(h.button('Wiederholungsverlauf entfernen'));
 await h.choose('review-mode','fehler');const attempt=h.navigation[0];
 await React.act(async()=>{attempt.resolve(true);await settle();oldAnswer();oldClear();await settle();});
 assert.equal(h.writes.length,0);assert.equal(h.requests.length,1);assert.equal(h.button('Antwort a').disabled,true);assert.equal(chosen('review-mode'),'gemischt');
 await h.route(attempt.href.query,attempt.href.hash);await h.answer();
 assert.equal(chosen('review-mode'),'fehler');assert.equal(h.button('Antwort a').disabled,false);
 await React.act(async()=>{oldAnswer();await settle();});assert.equal(h.writes.length,0);
 await h.click('Antwort a');assert.equal(h.writes.length,1);
});

test('A failed or false navigation and choosing the current mode preserve the actual answer and do not start a replacement round',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});await h.answer();await h.click('Antwort a');assert.equal(h.writes.length,1);const answered=h.text();
 for(const cancelled of [false,true]){
  await h.choose('review-mode','fehler');const pending=h.navigation.at(-1);await React.act(async()=>{if(cancelled)pending.resolve(false);else pending.reject(new Error('Synthetic route failure'));await settle();});
  assert.equal(h.requests.length,1);assert.equal(h.text(),answered);assert.ok(h.button('Nächste Frage'));assert.equal(h.writes.length,1);assert.ok(document.querySelector('[role="alert"]'));
 }
 const count=h.navigation.length;await h.choose('review-mode','gemischt');assert.equal(h.navigation.length,count);assert.equal(h.requests.length,1);assert.equal(h.writes.length,1);assert.ok(h.button('Nächste Frage'));
});

test('A cancelled transition silently releases the former round without changing its saved answer',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});await h.answer();await h.click('Antwort a');const chosen=h.text();
 await h.choose('review-mode','fehler');await React.act(async()=>{h.navigation[0].reject(Object.assign(new Error('Synthetic cancelled transition'),{cancelled:true}));await settle();});
 assert.equal(h.text(),chosen);assert.equal(h.requests.length,1);assert.equal(h.writes.length,1);assert.ok(!document.querySelector('[role="alert"]'));assert.equal(h.button('Nächste Frage').disabled,false);
});

test('History changes the actual pool; context-only history preserves an answer but invalidates old raw-URL callbacks',async t=>{
 const h=await fixture(t,{query:{modus:'fehler',kategorie:'wildkunde'}});await h.answer();const staleAnswer=callback(h.button('Antwort a'));
 await h.route({modus:'fehler',kategorie:'wildkunde',quelle:'neuer-kontext'},'review-question-title');assert.equal(h.requests.length,1);
 await React.act(async()=>{staleAnswer();await settle();});assert.equal(h.writes.length,0);
 await h.click('Antwort a');assert.equal(h.writes.length,1);const chosen=h.text();await h.route({quelle:'weiter',kategorie:'wildkunde',modus:'fehler'});assert.equal(h.requests.length,1);assert.equal(h.text(),chosen);
 await h.route({modus:'faellig',kategorie:'hundewesen'});assert.equal(h.requests.length,1);assert.match(h.text(),/keine Fragen fällig/);
 await h.route({modus:'fehler',kategorie:'hundewesen'});assert.equal(h.requests.length,2);assert.deepEqual(h.ids(),[questions[3].id]);
});

test('Stale answers, advance, round restart and clear-history handlers cannot act in a successor round or after unmount',async t=>{
 const h=await fixture(t,{query:{modus:'fehler',kategorie:'hundewesen'}});await h.answer();const answer=callback(h.button('Antwort a')),clear=callback(h.button('Wiederholungsverlauf entfernen'));
 await h.click('Antwort a');const advance=callback(h.button('Runde abschließen'));await h.click('Runde abschließen');const restart=callback(h.button('Neue kurze Runde'));
 await h.click('Neue kurze Runde');assert.equal(h.requests.length,1,'The corrected error leaves the strict pool empty');assert.match(h.text(),/keine offenen Fehler/);
 await React.act(async()=>{answer();advance();restart();clear();await settle();});assert.equal(h.writes.length,1);assert.equal(h.requests.length,1);
 await h.route({modus:'gemischt'});const pending=h.requests.length-1;const reset=callback(h.button('Wiederholungsverlauf entfernen'));await h.unmount();const writes=h.writes.length;
 await React.act(async()=>{reset();clear();answer();h.requests[pending].resolve({ok:true,status:200,json:async()=>({questions:h.ids(pending).map(id=>questions.find(question=>question.id===id))})});await settle();});assert.equal(h.writes.length,writes);
});

test('A late old question response and old selection handler cannot overwrite the next URL or navigate after unmount',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});const select=callback(choice('review-mode','faellig'));
 await h.route({modus:'fehler',kategorie:'hundewesen'});assert.equal(h.requests[0].options.signal.aborted,true);await h.answer(1);const text=h.text();await h.answer(0);assert.equal(h.text(),text);
 await React.act(async()=>{select({target:{value:'faellig'}});await settle();});assert.equal(h.navigation.length,0);
 const currentSelect=callback(choice('review-mode','gemischt'));await h.choose('review-mode','faellig');assert.equal(h.navigation.length,1);
 await h.unmount();await React.act(async()=>{h.navigation[0].reject(new Error('Synthetic navigation after unmount'));select({target:{value:'faellig'}});currentSelect({target:{value:'gemischt'}});await settle();});assert.equal(h.navigation.length,1);assert.equal(h.writes.length,0);
});

test('Selection callbacks reject raw URL, query and readiness changes before the next render, including in-place query mutation',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});await h.answer();
 const original={modus:'gemischt',kategorie:'wildkunde'};
 const changes=[
  ['selection',()=>h.rawRoute({modus:'gemischt',kategorie:'hundewesen',quelle:'synthetic-history'},'other-anchor')],
  ['in-place',()=>{h.router.query.kategorie='hundewesen';}],
  ['context',()=>h.rawRoute({...original,quelle:'context-only'})],
  ['hash',()=>h.rawRoute(original,'hash-only')],
  ['readiness',()=>{h.router.isReady=false;}],
 ];
 for(const [kind,change] of changes){
  await h.route({...original});
  await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,1));});
  const oldMode=callback(choice('review-mode','fehler')),oldCurrent=callback(choice('review-mode','gemischt')),oldCategory=callback(choice('review-category','hundewesen'));
  const before={navigation:h.navigation.length,requests:h.requests.length,writes:h.writes.length,focuses:h.focuses.length,scrolls:h.scrolls.length,text:h.text()};
  const queryObject=h.router.query;change();if(kind==='in-place')assert.equal(h.router.query,queryObject);
  await React.act(async()=>{oldMode();oldCurrent();oldCategory();await settle();});
  assert.deepEqual({navigation:h.navigation.length,requests:h.requests.length,writes:h.writes.length,focuses:h.focuses.length,scrolls:h.scrolls.length,text:h.text()},before);
  // Once a departure has been observed, returning to identical bytes cannot
  // revive handlers from the abandoned render before React commits again.
  h.rawRoute({...original});
  await React.act(async()=>{oldMode();oldCurrent();oldCategory();await settle();});
  assert.equal(h.navigation.length,before.navigation);
  assert.equal(h.writes.length,0);
 }
 await h.route({...original});await h.choose('review-mode','fehler');assert.equal(h.navigation.length,1,'The current rendered choice still navigates');
 const attempt=h.navigation[0];await h.route(attempt.href.query,attempt.href.hash);await React.act(async()=>{attempt.resolve(true);await settle();});await h.answer();assert.equal(chosen('review-mode'),'fehler');
});

test('A raw route committed before render prevents every late push outcome from repainting, opening or focusing its former selection',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});await h.answer();
 const original={modus:'gemischt',kategorie:'wildkunde'};
 for(const outcome of ['accepted','false','failure','cancelled']){
  await h.route({...original});await h.choose('review-mode','fehler');
  const attempt=h.navigation.at(-1);
  await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,1));});
  document.querySelector('nav details').open=false;
  const before={requests:h.requests.length,writes:h.writes.length,focuses:h.focuses.length,scrolls:h.scrolls.length,text:h.text()};
  h.rawRoute({...original,quelle:`raw-${outcome}`},'new-context');
  await React.act(async()=>{
   if(outcome==='failure')attempt.reject(new Error('Synthetic failed route after raw change'));
   else if(outcome==='cancelled')attempt.reject(Object.assign(new Error('Synthetic cancelled route after raw change'),{cancelled:true}));
   else attempt.resolve(outcome==='accepted');
   await settle();
  });
  assert.deepEqual({requests:h.requests.length,writes:h.writes.length,focuses:h.focuses.length,scrolls:h.scrolls.length,text:h.text()},before);
  assert.equal(document.querySelector('nav details').open,false);
  assert.equal(document.querySelector('[role="alert"]'),null);
  assert.equal(h.button('Antwort a').disabled,true,'Only the new committed render releases the former pending view');
  await h.render();
  assert.equal(h.button('Antwort a').disabled,false);
  assert.equal(chosen('review-mode'),'gemischt');
  assert.equal(chosen('review-category'),'wildkunde');
  assert.equal(h.requests.length,before.requests,'Context-only history keeps the existing round');
 }
 assert.equal(h.writes.length,0);
});

test('Browser-only departures and incomplete browser/router commits block old menu, answer and removal actions without changing the round history',async t=>{
 const original={modus:'gemischt',kategorie:'wildkunde'},h=await fixture(t,{query:original});await h.answer();
 const mode=callback(choice('review-mode','fehler')),answer=callback(h.button('Antwort a')),remove=callback(h.button('Wiederholungsverlauf entfernen'));
 const bytes=h.records.get(review.REVIEW_STORAGE_KEY),counts={navigation:h.navigation.length,requests:h.requests.length,writes:h.writes.length,focuses:h.focuses.length};
 h.dom.window.history.replaceState(null,'','#browser-before-router');
 await React.act(async()=>{mode();answer();remove();await settle();});
 assert.deepEqual({navigation:h.navigation.length,requests:h.requests.length,writes:h.writes.length,focuses:h.focuses.length},counts);assert.equal(h.records.get(review.REVIEW_STORAGE_KEY),bytes);
 await h.render();assert.equal(h.focuses.length,counts.focuses,'An incomplete browser commit cannot move the reading focus');await React.act(async()=>{callback(choice('review-mode','fehler'))();callback(h.button('Antwort a'))();callback(h.button('Wiederholungsverlauf entfernen'))();await settle();});
 assert.equal(h.navigation.length,counts.navigation);assert.equal(h.writes.length,0);assert.equal(h.records.get(review.REVIEW_STORAGE_KEY),bytes);
 await h.route({...original});await h.choose('review-mode','fehler');assert.equal(h.navigation.length,counts.navigation+1);
 const pending=h.navigation.at(-1);await h.route(pending.href.query,pending.href.hash);await React.act(async()=>{pending.resolve(true);await settle();});
 await h.answer();await h.click('Antwort a');assert.equal(h.writes.length,1,'A current committed answer remains functional');
});

test('Delayed invalid-selection help cannot open or focus the lower menu after a raw departure or unmount; current help still works',async t=>{
 const h=await fixture(t,{query:{modus:'gemischt',kategorie:'wildkunde'}});await h.answer();
 const jobs=[],originalTimeout=globalThis.setTimeout;
 try{
  globalThis.setTimeout=(action,delay,...args)=>{
   if(delay===0&&String(action).includes('review-selection')){const job={action,args};jobs.push(job);return job;}
   return originalTimeout(action,delay,...args);
  };
  await h.route({modus:'unknown-mode'});
 }finally{globalThis.setTimeout=originalTimeout;}
 assert.equal(jobs.length,1,'Hold only the actual invalid-selection help callback');
 const menu=document.querySelector('nav details');menu.open=false;
 const before={focuses:h.focuses.length,scrolls:h.scrolls.length,requests:h.requests.length,writes:h.writes.length};
 h.rawRoute({modus:'gemischt',kategorie:'hundewesen'},'new-raw-context');
 await React.act(async()=>{jobs[0].action(...jobs[0].args);await settle();});
 assert.equal(menu.open,false);assert.deepEqual({focuses:h.focuses.length,scrolls:h.scrolls.length,requests:h.requests.length,writes:h.writes.length},before);
 await h.render();await h.answer();
 await h.route({modus:'unknown-mode'});await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,1));});
 assert.equal(menu.open,true,'Current invalid selection still offers the existing lower help');
 menu.open=false;await h.unmount();const focuses=h.focuses.length;
 await React.act(async()=>{jobs[0].action(...jobs[0].args);await settle();});
 assert.equal(menu.open,false);assert.equal(h.focuses.length,focuses);assert.equal(h.writes.length,0);
});
