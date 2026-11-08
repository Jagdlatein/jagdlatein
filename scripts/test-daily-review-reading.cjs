const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createLoader,local}=require('./helpers/project-module.cjs');
const load=createLoader(),reader=load('lib/daily-review-reading.js'),React=local('react');
const {JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const text={title:'Synthetischer Lektionsname',paragraph:'Erster vorhandener Absatz.',paragraphs:['Erster vorhandener Absatz.','Zweiter vorhandener Absatz.','Wichtige vorhandene Grenze am Ende.'],takeaway:'Vorhandener Merksatz.',exercise:'Vorhandener Denkauftrag.'};
const q={id:'wissen-full-reading-q1',category:'wildkunde',q:'Synthetische Übung?',answers:['a','b','c','d'].map(id=>({id,text:`Antwort ${id}`})),correct:['a'],explain:'Vorhandene Erklärung.',reading:text,courseTitle:'Vorhandener Kurs',href:'/kurse/wissen-full-reading#lesson-existing',sources:[{label:'Synthetische Quelle',url:'https://example.invalid/source'}],sourceScope:'lesson'};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};

test('Full lesson context is checked as a whole, and a legacy single paragraph remains compatible',()=>{
  assert.deepEqual(reader.reviewReadingParagraphs(text),text.paragraphs);
  assert.deepEqual(reader.reviewReadingParagraphs({title:text.title,paragraph:text.paragraph}),[text.paragraph]);
  for(const invalid of [null,{}, {...text,paragraphs:[]},{...text,paragraphs:['Different first paragraph']},{...text,paragraphs:[text.paragraph,null]},{...text,paragraphs:[text.paragraph,' ']},{...text,paragraphs:Array(33).fill(text.paragraph)},{...text,takeaway:3},{...text,exercise:''}])assert.equal(reader.reviewReadingParagraphs(invalid),null);
});

for(const stalled of ['fetch','json'])test(`A stalled ${stalled} has a whole-operation deadline and aborts transport`,async t=>{
  const previous=global.fetch;t.after(()=>global.fetch=previous);const controller=new AbortController(),late=deferred();
  global.fetch=()=>stalled==='fetch'?late.promise:Promise.resolve({status:200,json:()=>late.promise});
  await assert.rejects(reader.requestDailyReviewQuestions([q.id],controller,5),error=>error.code==='REVIEW_TIMEOUT');
  assert.equal(controller.signal.aborted,true);late.resolve(stalled==='fetch'?{status:200,json:async()=>({questions:[q]})}:{questions:[q]});
});

test('An explicit abort settles even a non-cooperative transport and an already aborted request never fetches',async t=>{
  const previous=global.fetch;t.after(()=>global.fetch=previous);let calls=0;
  global.fetch=()=>{calls++;return new Promise(()=>{});};const controller=new AbortController();
  const pending=reader.requestDailyReviewQuestions([q.id],controller,500);controller.abort();
  await assert.rejects(pending,error=>error.name==='AbortError');assert.equal(calls,1);
  await assert.rejects(reader.requestDailyReviewQuestions([q.id],controller,500),error=>error.name==='AbortError');assert.equal(calls,1);
});

async function fixture(t,{timeout=10000,timeoutAt=null}={}){
  const dom=new JSDOM('<html><body><div id="root"></div></body></html>',{url:'https://example.invalid/lernen/fuenf-minuten'}),saved=new Map(),requests=[],writes=[];
  dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  Object.defineProperty(dom.window,'localStorage',{value:{getItem:()=>null,setItem:(...args)=>writes.push(args),removeItem(){}},configurable:true});
  const fetcher=(url,options)=>{const request={url,options,...deferred()};requests.push(request);return request.promise;};
  for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,fetch:fetcher,IS_REACT_ACT_ENVIRONMENT:true})){
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  const router={isReady:true,query:{},asPath:'/lernen/fuenf-minuten',async push(){throw Error('No navigation is needed by this test');}};
  const wrap=defaultValue=>({__esModule:true,default:defaultValue});
  const Page=createLoader({'next/router':{useRouter:()=>router},'next/link':({href,children})=>React.createElement('a',{href},children),'./LearningToolLayout':wrap(({children})=>React.createElement('main',null,children)),'./PageMenu':{...wrap(({children})=>React.createElement('aside',null,children)),closePageMenu(){},openPageMenu(){}},'../lib/daily-review-reading':{...reader,requestDailyReviewQuestions:(ids,controller)=>reader.requestDailyReviewQuestions(ids,controller,timeoutAt===null||requests.length===timeoutAt?timeout:10000)}})('components/DailyReview.js').default;
  const root=local('react-dom/client').createRoot(document.getElementById('root'));let mounted=true;
  const act=action=>React.act(async()=>{action?.();for(let i=0;i<12;i++)await Promise.resolve();});
  const button=label=>[...document.querySelectorAll('button')].find(node=>node.textContent===label);
  const click=label=>act(()=>{assert.ok(button(label),label);button(label).click();});
  const respond=(index=0,question=q)=>act(()=>requests[index].resolve({ok:true,status:200,json:async()=>({questions:[question]})}));
  const unmount=async()=>{if(mounted){mounted=false;await act(()=>root.unmount());}};
  t.after(async()=>{await unmount();dom.window.close();for(const[key,value]of saved)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];});
  await act(()=>root.render(React.createElement(Page,{pool:[{id:q.id,category:q.category}]})));
  return {act,click,button,respond,requests,writes,unmount,text:()=>document.querySelector('main')?.textContent||''};
}

test('Every lesson paragraph, end-of-text limit, takeaway and exercise stays visible after answer and after finishing mistakes',async t=>{
  const h=await fixture(t);await h.respond();assert.ok(!h.text().includes(text.paragraphs[2]));
  await h.click('Antwort b');
  for(const value of [...text.paragraphs,text.takeaway,text.exercise])assert.ok(h.text().includes(value),value);
  assert.equal(h.writes.length,1);assert.equal(h.requests.length,1);
  await h.click('Runde abschließen');
  for(const value of [...text.paragraphs,text.takeaway,text.exercise])assert.ok(h.text().includes(value),value);
  const sources=[...document.querySelectorAll('details')].at(-1);assert.equal(sources.open,false);assert.match(sources.textContent,/Quellen zu den nachgelesenen Fragen/);
  assert.ok(h.text().indexOf(text.paragraphs[2])<h.text().indexOf('Quellen zu den nachgelesenen Fragen'));
});

test('A malformed appended paragraph is never shown as a partial learning text or silently accepted',async t=>{
  const h=await fixture(t);await h.respond(0,{...q,reading:{...text,paragraphs:[text.paragraph,null]}});
  assert.match(h.text(),/nicht vollständig geladen/);assert.equal(h.button('Antwort a'),undefined);assert.equal(h.writes.length,0);
});

test('A timed-out initial round becomes retryable; its late reply cannot replace a successful retry',async t=>{
  const h=await fixture(t,{timeout:5,timeoutAt:0});await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,12));});
  assert.match(h.text(),/Laden dauert zu lange/);assert.equal(h.requests[0].options.signal.aborted,true);assert.ok(h.button('Erneut versuchen'));
  await h.click('Erneut versuchen');await h.respond(1,{...q,q:'Aktuelle Wiederholungsfrage?'});
  await h.respond(0,{...q,q:'Verspätete Frage?'});assert.match(h.text(),/Aktuelle Wiederholungsfrage/);assert.doesNotMatch(h.text(),/Verspätete Frage/);assert.equal(h.writes.length,0);
});

test('Timeout while repeating mistakes preserves the completed explanation, whole reading and current score',async t=>{
  const h=await fixture(t,{timeout:8,timeoutAt:1});await h.respond();await h.click('Antwort b');await h.click('Runde abschließen');const before=h.writes.length;
  await h.click('Diese Fehler üben');await React.act(async()=>{await new Promise(resolve=>setTimeout(resolve,16));});
  assert.match(h.text(),/0 von 1 richtig/);assert.match(h.text(),/Laden dauert zu lange/);assert.ok(h.text().includes(text.paragraphs[2]));assert.equal(h.button('Diese Fehler üben').disabled,false);assert.equal(h.writes.length,before);
  await h.click('Diese Fehler üben');await h.respond(2);assert.match(h.text(),/Frage 1 von 1/);assert.equal(h.writes.length,before);
});
