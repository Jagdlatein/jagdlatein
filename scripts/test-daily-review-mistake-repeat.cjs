// Actual React/DOM lifecycles with synthetic questions and isolated storage/fetch doubles.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const{createLoader,local}=require('./helpers/project-module.cjs');
const React=local('react');
const{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const review=createLoader()('lib/daily-review.js'),ordering=createLoader()('lib/answer-order.js');
const questions=Array.from({length:8},(_,index)=>({id:`wissen-repeat-${index}`,category:index<6?'wildkunde':'hundewesen',q:`Vorhandene Testfrage ${index}?`,answers:['a','b','c','d'].map(id=>({id,text:`Antwort ${index}/${id}`})),correct:index%2?['a']:['a','c'],explain:`Vollständige vorhandene Erklärung ${index}.`,reading:{title:`Vorhandene Lektion ${index}`,paragraph:`Vollständiger vorhandener Wissensabsatz ${index}.`},courseTitle:`Vorhandener Kurs ${index}`,href:`/kurse/wissen-test-${index}#lesson-${index}`,sources:[{url:`https://example.invalid/source-${index}`,label:`Vorhandene Quelle ${index}`}],sourceScope:'lesson'}));
const metadata=questions.map(({id,category})=>({id,category}));
const settle=async()=>{for(let index=0;index<15;index++)await Promise.resolve();};
const defer=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const handler=node=>{assert.ok(node);return node[Object.keys(node).find(key=>key.startsWith('__reactProps$'))].onClick;};
async function fixture(t){
  const dom=new JSDOM('<html><body><div id="root"></div></body></html>',{url:'https://jagdlatein.invalid/lernen/fuenf-minuten'});
  const saved=new Map(),values=new Map(),writes=[],records=[],requests=[],pushes=[],seeds=[],returned=[];let selections=0,pool=metadata,beforeEffects=null;
  const storage={getItem:key=>values.get(key)??null,setItem(key,value){values.set(key,value);writes.push({key,value});},removeItem:key=>values.delete(key)};
  Object.defineProperty(dom.window,'localStorage',{value:storage,configurable:true});dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  const router={isReady:true,query:{},asPath:'/lernen/fuenf-minuten',push(href){const operation={href,...defer()};pushes.push(operation);return operation.promise;}};
  const fetcher=(url,options)=>{const operation={url,options,...defer()};requests.push(operation);return operation.promise;};
  for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,fetch:fetcher,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
  const wrap=value=>({__esModule:true,default:value});
  const Component=createLoader({'next/router':{useRouter:()=>router},'next/link':({href,children})=>React.createElement('a',{href},children),'./LearningToolLayout':wrap(({children})=>React.createElement('main',null,children)),'./PageMenu':{...wrap(({children})=>React.createElement('aside',null,children)),openPageMenu(){},closePageMenu(){}},'../lib/daily-review':{...review,selectDailyReview(...args){selections++;return review.selectDailyReview(...args);},recordReviewAnswer(...args){records.push(args);return review.recordReviewAnswer(...args);}},'../lib/answer-order':{...ordering,newAnswerSeed(previous){const next=ordering.newAnswerSeed(previous,()=>0.25);seeds.push({previous,next});return next;}}})('components/DailyReview.js').default;
  function Shell(){React.useLayoutEffect(()=>{const action=beforeEffects;beforeEffects=null;action?.();});return React.createElement(Component,{pool});}
  let root=local('react-dom/client').createRoot(document.getElementById('root'));
  const act=action=>React.act(async()=>{action?.();await settle();});
  const render=()=>act(()=>root.render(React.createElement(Shell)));
  const button=text=>[...document.querySelectorAll('button')].find(node=>node.textContent===text);
  const click=async text=>{assert.ok(button(text),text);await act(()=>button(text).click());};
  const ids=(index=requests.length-1)=>new URL(requests[index].url,'https://example.invalid').searchParams.get('ids').split(',');
  async function respond(index=requests.length-1,{status=200,transform,body}={}){
    const details=ids(index).map(id=>questions.find(item=>item.id===id));
    const responseBody=body??(status===200?{questions:details.map(item=>transform?transform(structuredClone(item)):structuredClone(item)).reverse()}:{message:`Isolierte Antwort ${status}`});
    if(responseBody.questions)returned.push(...responseBody.questions);
    await act(()=>requests[index].resolve({ok:status>=200&&status<300,status,json:async()=>responseBody}));return ids(index);
  }
  const visible=()=>returned.findLast(item=>item?.q===document.getElementById('review-question-title')?.textContent);
  async function answer(id){const item=visible();assert.ok(item);await click(item.answers.find(answer=>answer.id===id).text);}
  async function finish(wrong=new Set()){
    const order=ids();for(const[index,id]of order.entries()){await answer(wrong.has(id)?'b':visible().correct[0]);await click(index+1===order.length?'Runde abschließen':'Nächste Frage');}return order;
  }
  async function route(query={},hash=''){router.query=query;router.asPath='/lernen/fuenf-minuten'+(Object.keys(query).length?'?'+new URLSearchParams(query):'')+hash;dom.window.history.replaceState(null,'',router.asPath);await render();}
  const deletion=kind=>kind==='deleted'?new dom.window.Event('jagdlatein-account-deleted'):new dom.window.StorageEvent('storage',{key:kind==='clear'?null:review.REVIEW_STORAGE_KEY,newValue:null});
  async function unmount(){if(root){await act(()=>root.unmount());root=null;}}
  t.after(async()=>{await unmount();dom.window.close();for(const[key,value]of saved)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];});
  await render();
  return{dom,router,requests,pushes,values,writes,records,seeds,act,render,button,click,ids,respond,visible,answer,finish,route,deletion,unmount,setPool(value){pool=value;},beforeEffects(action){beforeEffects=action;},selections:()=>selections,text:()=>document.querySelector('main')?.textContent||''};
}
async function completed(t){const h=await fixture(t),ids=await h.respond(),wrong=new Set([ids[0],ids[3]]);await h.finish(wrong);return{h,ids,wrong};}

test('Only exact current-round mistakes are reloaded in original order; fresh server content and original answer IDs govern the new round',async t=>{
  const{h,ids,wrong}=await completed(t),before=h.writes.length;
  const global=review.updateReviewHistory(review.readReviewHistory(),ids[1],false,Date.now()+1,'unrelated-device-error');h.values.set(review.REVIEW_STORAGE_KEY,JSON.stringify(global));
  const repeat=handler(h.button('Diese Fehler üben')),restart=handler(h.button('Neue kurze Runde'));
  await h.act(()=>{repeat();repeat();restart();});assert.equal(h.requests.length,2);assert.deepEqual(h.ids(),[...wrong]);assert.equal(h.selections(),1);assert.equal(h.writes.length,before);
  assert.match(h.text(),/6 von 8 richtig/);assert.equal(document.querySelectorAll('[aria-labelledby="review-mistakes-title"] > article').length,2);
  assert.equal(h.button('Diese Fehler üben').disabled,true);assert.equal(h.button('Neue kurze Runde').disabled,true);
  await h.act(()=>{handler(h.button('Diese Fehler üben'))();handler(h.button('Neue kurze Runde'))();});assert.equal(h.requests.length,2,'Even retained handlers from the disabled pending render cannot supersede the request');
  assert.equal(h.requests[1].options.cache,'no-store');assert.equal(h.requests[1].options.credentials,'same-origin');assert.equal(h.requests[1].options.body,undefined);assert.equal(h.pushes.length,0);
  assert.deepEqual([...new URL(h.requests[1].url,'https://example.invalid').searchParams.keys()],['ids']);
  await h.respond(1,{transform:item=>({...item,q:`Erneut geprüfte Frage ${item.id}`,answers:[...item.answers].reverse().map(answer=>({...answer,text:`Neu ${item.id}/${answer.id}`})),correct:['d'],explain:'Erneut vollständig geladene Erklärung.'})});
  assert.equal(h.visible().id,[...wrong][0]);assert.match(h.text(),/Frage 1 von 2/);assert.match(h.text(),/Erneut geprüfte Frage/);assert.equal(document.querySelector('#review-mistakes-title'),null);
  assert.equal(h.seeds.length,2);assert.equal(h.seeds[1].previous,h.seeds[0].next);assert.notEqual(h.seeds[1].next,h.seeds[0].next);assert.equal(h.writes.length,before);
  await h.answer('d');assert.deepEqual(h.records.at(-1),[[...wrong][0],true]);await h.click('Nächste Frage');await h.answer('d');await h.click('Runde abschließen');
  assert.match(h.text(),/2 von 2 richtig/);assert.equal(h.button('Diese Fehler üben'),undefined);assert.equal(h.records.length,10);assert.equal(h.writes.length,before+2);
});

test('A second mistake repetition uses only errors of the latest short round, not its ancestor or all device errors',async t=>{
  const{h,wrong}=await completed(t);await h.click('Diese Fehler üben');await h.respond();const nextWrong=new Set([[...wrong][1]]);await h.finish(nextWrong);
  await h.click('Diese Fehler üben');assert.deepEqual(h.ids(),[...nextWrong]);assert.equal(h.selections(),1);assert.equal(h.records.length,10);
});

for(const kind of ['network','malformed',401,403,503])test(`A ${kind} failure preserves the completed score, full mistake reading and explicit retry without history writes`,async t=>{
  const{h}=await completed(t),before=h.writes.length,articles=[...document.querySelectorAll('[aria-labelledby="review-mistakes-title"] > article')].map(node=>node.textContent);
  await h.click('Diese Fehler üben');
  if(kind==='network')await h.act(()=>h.requests[1].reject(new Error('Isolierter Verbindungsfehler')));
  else if(kind==='malformed')await h.respond(1,{body:{questions:[]}});
  else await h.respond(1,{status:kind});
  assert.match(h.text(),/6 von 8 richtig/);assert.deepEqual([...document.querySelectorAll('[aria-labelledby="review-mistakes-title"] > article')].map(node=>node.textContent),articles);assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(h.button('Diese Fehler üben').disabled,false);assert.equal(h.button('Neue kurze Runde').disabled,false);assert.equal(h.writes.length,before);assert.equal(h.seeds.length,1);
  if(kind===401)assert.ok(document.querySelector('a[href="/login?next=%2Flernen%2Ffuenf-minuten"]'));if(kind===403)assert.ok(document.querySelector('a[href="/preise?next=%2Flernen%2Ffuenf-minuten"]'));
  await h.click('Diese Fehler üben');assert.equal(h.requests.length,3);await h.respond(2);assert.match(h.text(),/Frage 1 von 2/);
});

test('All-correct completion has no mistake-repeat button or request, and a stale finished handler cannot restart a successor',async t=>{
  const h=await fixture(t);await h.respond();await h.finish();assert.equal(h.button('Diese Fehler üben'),undefined);assert.equal(h.requests.length,1);
  const restart=handler(h.button('Neue kurze Runde'));await h.click('Neue kurze Runde');await h.respond();await h.act(restart);assert.equal(h.requests.length,2);assert.equal(h.records.length,8);
});

test('Handlers captured from disabled completion controls cannot restart after the repeated API round has committed',async t=>{
  const{h}=await completed(t);await h.click('Diese Fehler üben');
  const restart=handler(h.button('Neue kurze Runde')),repeat=handler(h.button('Diese Fehler üben'));
  assert.equal(h.button('Neue kurze Runde').disabled,true);await h.respond(1);
  const question=h.visible().id;await h.act(()=>{restart();repeat();});
  assert.equal(h.requests.length,2);assert.equal(h.visible().id,question);assert.match(h.text(),/Frage 1 von 2/);assert.equal(h.records.length,8);
});

test('A raw URL change before redraw blocks adoption and releases only its own pending request for a fresh retry',async t=>{
  const{h,wrong}=await completed(t),old=handler(h.button('Diese Fehler üben'));await h.click('Diese Fehler üben');
  h.router.asPath+='#quellen';await h.respond(1);assert.match(h.text(),/6 von 8 richtig/);assert.equal(h.seeds.length,1);
  await h.render();await h.act(old);assert.equal(h.requests.length,2);await h.click('Diese Fehler üben');assert.deepEqual(h.ids(),[...wrong]);await h.respond(2);assert.match(h.text(),/Frage 1 von 2/);
});

test('Same-key raw hash/query A-B-A invalidates an old operation and its late failure cannot unblock or replace a newer operation',async t=>{
  const{h}=await completed(t),old=handler(h.button('Diese Fehler üben'));await h.click('Diese Fehler üben');const late=h.requests[1];
  await h.route({kontext:'b'},'#anderer-kontext');assert.equal(late.options.signal.aborted,true);await h.route();
  await h.act(old);assert.equal(h.requests.length,2);await h.click('Diese Fehler üben');assert.equal(h.requests.length,3);
  await h.act(()=>late.reject(new Error('Veralteter Fehler')));assert.equal(h.button('Diese Fehler üben').disabled,true);assert.doesNotMatch(h.text(),/Veralteter Fehler/);
  await h.respond(2);assert.match(h.text(),/Frage 1 von 2/);assert.equal(h.seeds.length,2);
});

test('Pending navigation cannot commit the repeat; a failed navigation leaves completion retryable while a category commit replaces it',async t=>{
  const{h}=await completed(t);await h.click('Diese Fehler üben');await h.click('Wildkunde');assert.equal(h.pushes.length,1);
  await h.respond(1);assert.match(h.text(),/6 von 8 richtig/);await h.act(()=>h.pushes[0].resolve(false));
  await h.click('Diese Fehler üben');const late=h.requests[2];await h.route({kategorie:'hundewesen'});assert.equal(late.options.signal.aborted,true);
  await h.respond(2);assert.equal(document.querySelector('#review-mistakes-title'),null);assert.equal(h.requests.length,4);await h.respond(3);assert.ok(h.ids().every(id=>questions.find(item=>item.id===id).category==='hundewesen'));
});

for(const kind of ['remove','clear','deleted'])test(`A ${kind} deletion removes completion and aborts a repeat before paint; late success/callbacks cannot restore it`,async t=>{
  const{h}=await completed(t),repeat=handler(h.button('Diese Fehler üben')),restart=handler(h.button('Neue kurze Runde')),before=h.writes.length;
  await h.click('Diese Fehler üben');await h.act(()=>{window.dispatchEvent(h.deletion(kind));repeat();restart();});
  assert.equal(h.requests[1].options.signal.aborted,true);await h.respond(1);assert.match(h.text(),/vorherige Runde wurde geschlossen/);assert.equal(document.querySelector('#review-mistakes-title'),null);assert.equal(h.writes.length,before);assert.equal(h.requests.length,2);
  await h.click('Neue kurze Runde');await h.respond(2,{status:401});assert.match(h.text(),/Isolierte Antwort 401/);assert.doesNotMatch(h.text(),/6 von 8 richtig/);
});

test('Explicit history clearing supersedes a pending mistake-only load and late output cannot replace the new full round',async t=>{
  const{h}=await completed(t);await h.click('Diese Fehler üben');await h.click('Wiederholungsverlauf entfernen');
  assert.equal(h.requests[1].options.signal.aborted,true);assert.equal(h.requests.length,3);assert.equal(h.ids(2).length,8);assert.equal(h.selections(),2);
  await h.respond(2);const visible=h.visible().id;await h.respond(1);assert.equal(h.visible().id,visible);assert.match(h.text(),/Frage 1 von 8/);
});

test('Deletion between a changed-origin render and its passive cleanup wins over invalidated-request cleanup',async t=>{
  const{h}=await completed(t);await h.click('Diese Fehler üben');
  h.beforeEffects(()=>window.dispatchEvent(h.deletion('deleted')));await h.route({kontext:'neuer-kontext'},'#quellen');
  assert.equal(h.requests[1].options.signal.aborted,true);assert.match(h.text(),/vorherige Runde wurde geschlossen/);
  await h.respond(1);assert.match(h.text(),/vorherige Runde wurde geschlossen/);assert.equal(document.querySelector('#review-mistakes-title'),null);
  await h.click('Neue kurze Runde');await h.respond(2);assert.match(h.text(),/Frage 1 von 8/);assert.equal(h.records.length,8);
});

test('Current catalog/category mismatches refuse repetition and actual unmount blocks retained actions and late results',async t=>{
  const{h,wrong}=await completed(t);h.setPool(metadata.filter(item=>item.id!==[...wrong][0]));await h.render();await h.click('Diese Fehler üben');assert.equal(h.requests.length,1);
  h.setPool(metadata);await h.render();const repeat=handler(h.button('Diese Fehler üben'));await h.click('Diese Fehler üben');await h.unmount();assert.equal(h.requests[1].options.signal.aborted,true);
  await h.respond(1);await h.act(repeat);assert.equal(h.requests.length,2);assert.equal(h.records.length,8);assert.equal(h.seeds.length,1);
});
