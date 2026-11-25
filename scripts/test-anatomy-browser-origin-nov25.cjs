// Independent real React/DOM contract matrix. No author's anatomy fixture is
// imported. Synthetic addresses, fake viewer and deferred promises only.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the existing isolated jsdom module.', { cause: error }); }
const React = local('react'), wrap = value => ({ __esModule: true, default: value });
const base = '/lernen/anatomie?eintrag=schaedel&ref=source&ref=second#anatomie-modell';
const target = '/lernen/anatomie?eintrag=vorderlauf&ref=history-new#anatomie-modell';
const catalog = createLoader()('lib/anatomy-explorer.js');
const tick = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const defer = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a;reject=b; }); return {promise,resolve,reject}; };
function queryOf(href) { const params = new URL(href, 'https://independent.invalid').searchParams, object = {}; for (const key of new Set(params.keys())) { const values = params.getAll(key); object[key] = values.length === 1 ? values[0] : values; } return object; }
function native(node, name='onClick') { assert.ok(node); const key=Object.keys(node).find(k=>k.startsWith('__reactProps$')); assert.ok(key); assert.equal(typeof node[key][name], 'function'); return node[key][name]; }
// Retaining practice in a subtree is valid. The inconsistent reader must be
// both genuinely hidden and inert; mere DOM presence is not visibility.
const withheld = node => !node || Boolean(node.closest('[hidden]') && node.closest('[inert]'));
async function fixture({href=base,registered=false,ready=true}={}) {
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://independent.invalid'+href,pretendToBeVisual:true}), saved=new Map();
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(global,key));Object.defineProperty(global,key,{configurable:true,writable:true,value});}
 const calls=[], scripts=[], menus=[], focus=[], scroll=[], viewers=[], frames=new Map(); let frame=0,disposed=false;
 dom.window.scrollTo=(...args)=>scroll.push(args);dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 dom.window.HTMLElement.prototype.focus=function(){focus.push(this.id||this.getAttribute('aria-label')||this.tagName);};
 dom.window.requestAnimationFrame=fn=>{frames.set(++frame,fn);return frame;};dom.window.cancelAnimationFrame=id=>frames.delete(id);
 class FakeViewer extends dom.window.HTMLElement {
  constructor(){super();this.loaded=false;this.framing=Promise.resolve();this.complete=Promise.resolve();this.framingCalls=0;this.jumps=0;this.orbitReads=0;this.orbitWrites=[];this.listeners=new Map();viewers.push(this);}
  set cameraOrbit(v){this.orbitWrites.push(v);this.orbitValue=v;} get cameraOrbit(){return this.orbitValue||this.getAttribute('camera-orbit');}
  getCameraOrbit(){this.orbitReads++;return{theta:1,phi:1,radius:2};}updateFraming(){this.framingCalls++;return this.framing;}get updateComplete(){return this.complete;}jumpCameraToGoal(){this.jumps++;}
  addEventListener(name,fn,options){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);return super.addEventListener(name,fn,options);}
  removeEventListener(name,fn,options){this.listeners.get(name)?.delete(fn);return super.removeEventListener(name,fn,options);}
 }
 if(registered)dom.window.customElements.define('model-viewer',FakeViewer);
 const router={isReady:ready,pathname:'/lernen/anatomie',asPath:href,query:queryOf(href)};
 router.push=(destination,...options)=>{const pending=defer();calls.push({destination,options,...pending});return pending.promise;};
 const loader=createLoader({'next/router':{useRouter:()=>router},'next/script':wrap(props=>{scripts.push(props);return null;}),'next/image':wrap(({priority,fill,...props})=>React.createElement('img',props)),
 './LearningToolLayout':wrap(({children})=>React.createElement('main',null,React.createElement('h1',{'data-learning-page-start':true,tabIndex:-1},'Wildkörper verstehen'),children)),
 './PageMenu':{...wrap(({children})=>React.createElement('aside',null,children)),closePageMenu(){menus.push('close');},openPageMenu(id){menus.push('open:'+id);}}});
 const Component=loader('components/AnatomyExplorer.js').default,{createRoot}=local('react-dom/client'),host=dom.window.document.getElementById('root'),root=createRoot(host);
 const button=label=>[...host.querySelectorAll('button')].find(n=>n.textContent.trim()===label),quiz=()=>[...host.querySelectorAll('details')].find(n=>n.querySelector('summary')?.textContent.startsWith('Wissen zum Modell'));
 const h={dom,host,router,calls,scripts,menus,focus,scroll,viewers,frames,button,quiz,section:()=>host.querySelector('#anatomie-fragen')?.closest('section'),viewer:()=>host.querySelector('model-viewer'),feature:()=>host.querySelector('#anatomie-modell')?.closest('section')?.querySelector('button[aria-pressed="true"]')?.textContent||null,
 async render(){await React.act(async()=>{root.render(React.createElement(Component));await tick();});},
 address(value){dom.window.history.replaceState(null,'',value);},adopt(value){router.asPath=value;router.query=queryOf(value);},
 async invoke(fn,...args){await React.act(async()=>{fn(...args);await tick();});},async click(label){const n=button(label);assert.ok(n,label);assert.equal(n.disabled,false,label);await this.invoke(()=>n.click());},
 async toggle(open){const n=quiz();assert.ok(n);await this.invoke(()=>{n.open=open;n.dispatchEvent(new dom.window.Event('toggle'));});},
 async answer(index){const n=this.section()?.querySelectorAll('.choices > button')[index];assert.ok(n);await this.invoke(()=>n.click());},
 async commit(value){this.address(value);this.adopt(value);await this.render();},
 async load(){const element=this.viewer();assert.ok(element);element.loaded=true;await this.invoke(()=>element.dispatchEvent(new dom.window.Event('load')));return element;},
 async unmount(){if(!disposed){await React.act(async()=>root.unmount());disposed=true;}},
 async cleanup(){await this.unmount();dom.window.close();for(const[key,descriptor]of saved)if(descriptor)Object.defineProperty(global,key,descriptor);else delete global[key];}
 };
 await h.render();return h;
}
function menuAction(h,id='unterkiefer'){return native(h.host.querySelector('#anatomy-entry-select button[data-menu-choice="'+id+'"]'));}
async function run(name,body,options) {
 return test(name,async () => {
  const h=await fixture(options);
  try { await body(h,(label,pass,details) => assert.equal(Boolean(pass),true,label+(details ? ': '+JSON.stringify(details) : ''))); }
  finally { await h.cleanup(); }
 });
}
(async()=>{
 for(const phase of ['browser-first-before-render','browser-first-after-render','router-first-before-render','router-first-after-render'])await run(phase,async(h,check)=>{
  await h.toggle(true);const answer=native(h.section().querySelectorAll('.choices > button')[1]),select=menuAction(h),feature=native(h.button('Nasenraum')),open=native(h.button('3D-Ansicht öffnen'));
  if(phase.startsWith('browser'))h.address(target);else h.adopt(target);if(phase.endsWith('after-render'))await h.render();const calls=h.calls.length;
  // One act batch is essential: a preceding state write must not let a render
  // replace captured source handlers before the other before-render actions.
  await h.invoke(()=>{answer();feature();open();select();});
  check('No navigation from captured source selection',h.calls.length===calls,{requests:h.calls.map(x=>x.destination)});
  check('No source answer graded under mixed URL',!h.section()?.textContent.includes('1 beantwortet'));
  check('No optional script/viewer created by source callback',h.scripts.length===0&&h.viewer()===null);
  if(phase.endsWith('after-render'))check('No visible or interactive substitute museum content after mismatch render',withheld(h.quiz())&&withheld(h.host.querySelector('#anatomie-modell')));
  if(phase==='router-first-after-render'&&h.quiz()&&!withheld(h.quiz())){
   await h.toggle(true);const current=catalog.anatomyQuestions.find(q=>q.modelId==='vorderlauf'),fresh=h.section()?.querySelectorAll('.choices > button')[current.answer],before=h.calls.length;
   if(fresh)await h.invoke(native(fresh));await h.invoke(menuAction(h));check('Fresh mixed-render quiz and selection are inert too',!h.section()?.textContent.includes('1 beantwortet')&&h.calls.length===before);
  }
 });
 await run('Full query identity includes unrelated duplicates and live browser hash',async(h,check)=>{
  const select=menuAction(h),feature=native(h.button('Nasenraum'));h.router.query.ref=['second','source'];await h.invoke(select);await h.invoke(feature);check('Unknown duplicate order mismatch blocks selection before render',h.calls.length===0);await h.render();check('No visible/interactable museum content with raw/query disagreement',withheld(h.host.querySelector('#anatomie-modell')));
  await h.commit(base);const next=menuAction(h);h.address(base.replace('#anatomie-modell','#foreign'));await h.invoke(next);check('Raw hash browser drift blocks current captured selection',h.calls.length===0);
 });
 await run('Temporary mismatch and failed selection preserve confirmed quiz and structure',async(h,check)=>{
  await h.click('Nasenraum');await h.toggle(true);await h.answer(1);const before=h.section().textContent;h.adopt(target);await h.render();await h.commit(base);
  check('Same confirmed model retains selected structure after rollback',h.feature()==='Nasenraum',{feature:h.feature()});check('Same confirmed model retains quiz answer after rollback',h.section()?.textContent===before);
  await h.invoke(menuAction(h));const request=h.calls.at(-1);await h.invoke(()=>request.reject(new Error('isolated rejected selection')));check('Rejected push preserves same quiz and orbit',h.feature()==='Nasenraum'&&h.section()?.textContent===before);
 });
 await run('Real fully synchronised model change remains a fresh model practice and blocks old handlers',async(h,check)=>{
  await h.toggle(true);const old=native(h.section().querySelectorAll('.choices > button')[1]),select=menuAction(h);await h.commit(target);await h.invoke(old);await h.invoke(select);check('Old source actions already correctly rejected after actual model render',h.calls.length===0);await h.toggle(true);const first=catalog.anatomyQuestions.find(q=>q.modelId==='vorderlauf');await h.answer(first.answer);check('Current committed forelimb answer accepted',h.section().textContent.includes('1 beantwortet · 1 richtig'));
 });
 await run('Accepted push before URL commit does not focus or replace local practice',async(h,check)=>{
  await h.toggle(true);await h.answer(1);const before=h.section().textContent,focus=h.focus.length;await h.invoke(menuAction(h));await h.invoke(()=>h.calls[0].resolve(true));check('Accepted promise alone retains confirmed skull answer',h.section()?.textContent===before);check('No early target focus from accepted promise',h.focus.length===focus);await h.commit(target);check('Actual other-model commit creates fresh closed quiz',h.quiz()?.open===false);
 });
 await run('Delayed rejected push from browser-only foreign context cannot open an old error menu',async(h,check)=>{
  await h.invoke(menuAction(h));const count=h.menus.length;h.address(target);await h.invoke(()=>h.calls[0].reject(new Error('isolated late failure')));check('Late error does not open obsolete selection menu',h.menus.length===count);check('Late error does not insert old error text',!h.host.textContent.includes('Das Thema konnte nicht geöffnet werden'));
 });
 await run('Viewer camera, loaded action and captured load callback reject live browser drift',async(h,check)=>{
  await h.click('Nasenraum');await h.click('3D-Ansicht öffnen');const element=await h.load(),rotate=native(h.button('Nach rechts drehen')),reset=native(h.button('Ansicht zurücksetzen')),load=[...(element.listeners.get('load')||[])][0],writes=element.orbitWrites.length,reads=element.orbitReads,framing=element.framingCalls;
  h.address(target);await h.invoke(rotate);await h.invoke(reset);await h.invoke(load);check('No camera writes/reads under browser-only drift',element.orbitWrites.length===writes&&element.orbitReads===reads);check('No framing call from stale load under drift',element.framingCalls===framing);
 },{registered:true});
 for(const boundary of ['framing','updateComplete'])await run('Viewer '+boundary+' await continuation rejects drift before effect cleanup',async(h,check)=>{
  await h.click('3D-Ansicht öffnen');const element=h.viewer(),blocked=defer();if(boundary==='framing')element.framing=blocked.promise;else element.complete=blocked.promise;await h.invoke(()=>element.dispatchEvent(new h.dom.window.Event('load')));const writes=element.orbitWrites.length,jumps=element.jumps;h.address(target);await h.invoke(()=>blocked.resolve());check('No stale loaded status after '+boundary,h.host.querySelector('p[role="status"]')?.textContent.includes('lädt'));check('No stale post-await camera mutation',element.jumps===jumps&&(boundary!=='framing'||element.orbitWrites.length===writes));
 },{registered:true});
 await run('Temporary viewer withholding preserves practice; actual recreation requires fresh loading',async(h,check)=>{
  await h.click('Nasenraum');await h.click('3D-Ansicht öffnen');const old=await h.load();h.address(target);await h.render();const retained=h.viewer()===old;
  check('Inconsistent address withholds optional viewer, either removed or both hidden and inert',withheld(h.viewer()));await h.commit(base);const current=h.viewer();check('Structure retained on restoration',h.feature()==='Nasenraum');
  if(retained){check('The same retained viewer resumes with its unchanged current orbit',current===old&&current.cameraOrbit==='180deg 80deg 100%');check('Previously loaded retained viewer remains loaded',h.host.querySelector('p[role="status"]')?.textContent.includes('Mit einem Finger'));}
  else {check('Actually removed viewer is recreated as a different element',!!current&&current!==old);check('Actually recreated element visibly loads until its own load',h.host.querySelector('p[role="status"]')?.textContent.includes('lädt'));if(current)await h.load();}
  if(current)check('Restoration never substitutes the default camera for Nasenraum',current.cameraOrbit==='180deg 80deg 100%');
 },{registered:true});
 await run('An in-progress viewer load hidden by mismatch cannot complete until its origin is current again',async(h,check)=>{
  await h.click('Nasenraum');await h.click('3D-Ansicht öffnen');const old=h.viewer(),blocked=defer();old.framing=blocked.promise;old.loaded=true;await h.invoke(()=>old.dispatchEvent(new h.dom.window.Event('load')));const jumps=old.jumps;
  h.address(target);await h.render();await h.invoke(()=>blocked.resolve());check('The withheld old load does not jump the camera',old.jumps===jumps);check('Mismatch keeps the viewer absent or hidden and inert',withheld(h.viewer()));await h.commit(base);const current=h.viewer();assert.ok(current);await h.load();check('Current replay/fresh load reaches loaded with the selected structure',h.feature()==='Nasenraum'&&current.cameraOrbit==='180deg 80deg 100%'&&h.host.querySelector('p[role="status"]')?.textContent.includes('Mit einem Finger'));
 },{registered:true});
 await run('Unready/invalid selections stay empty and repairable only from matching complete origin',async(h,check)=>{
  h.router.isReady=false;await h.render();check('Unready withholds any previously confirmed model',withheld(h.quiz())&&withheld(h.viewer()));h.router.isReady=true;await h.commit('/lernen/anatomie?eintrag=unknown');check('Invalid shows no interactive substitute model',withheld(h.quiz()));const select=menuAction(h,'schaedel');h.address('/lernen/anatomie?eintrag=unknown#foreign');await h.invoke(select);check('Invalid repair action also blocks browser drift',h.calls.length===0);
 });
 await run('An initially unready reader invents no retained model or quiz',async(h,check)=>{check('No initial museum or digestive reader before readiness',h.host.querySelector('#anatomie-modell')===null&&h.quiz()===undefined&&h.host.querySelector('#anatomie-verdauung')===null&&h.scripts.length===0&&h.calls.length===0);},{ready:false});
 await run('Captured script callbacks and retry do not act after mixed browser identity',async(h,check)=>{
  await h.click('3D-Ansicht öffnen');const script=h.scripts.at(-1);h.address(target);await h.invoke(script.onError);check('Script failure under mismatch does not create retry',!h.button('Laden erneut vorbereiten'));await h.commit(base);await h.invoke(h.scripts.at(-1).onError);const retry=h.button('Laden erneut vorbereiten');if(retry){const handler=native(retry),before=h.scripts.length;h.address(target);await h.invoke(handler);check('Retry under drift leaves current viewer enabled/error state untouched',!h.button('3D-Ansicht öffnen')&&h.scripts.length===before);}else check('Current legitimate script failure exposes retry',false);
 });
 await run('Actual unmount preserves existing source-action boundary',async(h,check)=>{
  const select=menuAction(h),open=native(h.button('3D-Ansicht öffnen')),feature=native(h.button('Nasenraum'));await h.unmount();await h.invoke(select);await h.invoke(open);await h.invoke(feature);check('No source navigation or script after actual unmount',h.calls.length===0&&h.scripts.length===0);
 });
 const digestive='/lernen/anatomie?bereich=verdauung&thema=wiederkaeuer-verdauung&ref=source#anatomie-verdauung';
 await run('A digestive answer callback also rejects browser drift before the parent rerenders',async(h,check)=>{
  const radio=h.host.querySelector('input[type="radio"]');assert.ok(radio);const answer=native(radio,'onChange');h.address(target);await h.invoke(answer);check('Digestive child callback does not accept an answer under mixed address',!h.host.querySelector('input[type="radio"]')?.checked);
 },{href:digestive});
 await run('A temporary digestive mismatch preserves previously committed answers on restoration',async(h,check)=>{
  const radio=h.host.querySelector('input[type="radio"]');assert.ok(radio);await h.invoke(native(radio,'onChange'));check('Current digestive answer is accepted',h.host.querySelector('input[type="radio"]').checked);h.adopt(target);await h.render();await h.commit(digestive);check('Same digestive topic retains the prior answer after temporary router-first mismatch',h.host.querySelector('input[type="radio"]')?.checked);
 },{href:digestive});
 await run('A queued owner RAF rejects a live unknown-query drift before the parent rerenders',async(h,check)=>{
  const callback=[...h.frames.values()][0];assert.equal(typeof callback,'function');const scrolls=h.scroll.length;
  h.router.query.ref=['owner-query-only-drift'];
  await h.invoke(callback);check('No further scroll from a source RAF after raw/query owner identity diverges',h.scroll.length===scrolls);
 });
 await run('A coherent invalid museum URL can repair to its retained skull through one actual push without resetting practice',async(h,check)=>{
  await h.click('Nasenraum');await h.toggle(true);await h.answer(1);
  const before=h.section().textContent,oldSelect=menuAction(h),sources=[...h.host.querySelectorAll('details')].find(node=>node.querySelector('summary')?.textContent==='Fachliche Quellen und Modellnachweise');assert.ok(sources);sources.open=true;
  const invalid='/lernen/anatomie?bereich=museum&eintrag=unknown&ref=repair&ref=second&q=keep#anatomie-modell';await h.commit(invalid);
  check('Coherent invalid museum URL withholds the retained skull',withheld(h.section()));await h.invoke(oldSelect);check('Captured old-origin menu action cannot repair from a foreign origin',h.calls.length===0);
  await h.invoke(menuAction(h,'schaedel'));assert.equal(h.calls.length,1);
  assert.deepEqual(h.calls[0].destination,{pathname:'/lernen/anatomie',query:{ref:['repair','second'],q:'keep',eintrag:'schaedel'},hash:'anatomie-modell'});
  check('Repair does not optimistically unhide its retained museum practice',withheld(h.section()));await h.invoke(()=>h.calls[0].resolve(true));
  check('Accepted repair promise alone still leaves the invalid URL reader hidden',withheld(h.section()));
  await h.commit('/lernen/anatomie?ref=repair&ref=second&q=keep&eintrag=schaedel#anatomie-modell');
  check('Actual repair restores the same answer and question state',!withheld(h.section())&&h.section().textContent===before);check('Actual repair preserves the selected structure',h.feature()==='Nasenraum');
  const restored=[...h.host.querySelectorAll('details')].find(node=>node.querySelector('summary')?.textContent==='Fachliche Quellen und Modellnachweise');check('Same-model repair preserves its own source node and manual open state',restored===sources&&restored.open);
  await h.invoke(oldSelect);check('Captured pre-invalid source action remains blocked after successful repair',h.calls.length===1);
 });
 await run('A coherent invalid digestive URL can repair to its retained topic through one actual push without resetting answers',async(h,check)=>{
  const first=h.host.querySelector('input[type="radio"]');assert.ok(first);await h.invoke(native(first,'onChange'));
  const oldAnswer=native(h.host.querySelectorAll('input[type="radio"]')[1],'onChange'),oldSelect=menuAction(h,'schwarzwild-verdauung'),article=h.host.querySelector('#anatomie-verdauung'),before=article.textContent,sources=article.querySelector('details');assert.ok(sources);sources.open=true;
  await h.commit('/lernen/anatomie?bereich=verdauung&thema=unknown&ref=repair&ref=second&q=keep#anatomie-verdauung');
  check('Coherent invalid digestive URL withholds its retained lesson',withheld(article));await h.invoke(()=>{oldAnswer();oldSelect();});check('Old digestive answer and menu callbacks cannot act from the invalid origin',h.calls.length===0&&h.host.querySelector('input[type="radio"]').checked);
  await h.invoke(menuAction(h,'wiederkaeuer-verdauung'));assert.equal(h.calls.length,1);
  assert.deepEqual(h.calls[0].destination,{pathname:'/lernen/anatomie',query:{ref:['repair','second'],q:'keep',bereich:'verdauung',thema:'wiederkaeuer-verdauung'},hash:'anatomie-verdauung'});
  check('Repair does not optimistically unhide its retained digestive answers',withheld(article));await h.invoke(()=>h.calls[0].resolve(true));
  check('Accepted promise alone still withholds the invalid digestive reader',withheld(article));await h.commit('/lernen/anatomie?ref=repair&ref=second&q=keep&bereich=verdauung&thema=wiederkaeuer-verdauung#anatomie-verdauung');
  const restored=h.host.querySelector('#anatomie-verdauung');check('Actual same-topic repair preserves the existing answer and complete lesson text',restored===article&&!withheld(restored)&&restored.textContent===before&&h.host.querySelector('input[type="radio"]').checked);
  check('Same-topic repair preserves only its own retained source node and manual open state',restored.querySelector('details')===sources&&sources.open);
  await h.invoke(()=>{oldAnswer();oldSelect();});check('Captured pre-invalid child/menu actions remain blocked after repair',h.calls.length===1&&h.host.querySelector('input[type="radio"]').checked);
 },{href:digestive});
 // SSR is a separate own-loader check without any installed browser globals.
 const ssrRouter={isReady:true,pathname:'/lernen/anatomie',asPath:'/lernen/anatomie',query:{}},ssrLoad=createLoader({'next/router':{useRouter:()=>ssrRouter},'next/script':wrap(()=>null),'./LearningToolLayout':wrap(({children})=>React.createElement('main',null,children)),'./PageMenu':{...wrap(({children})=>React.createElement('aside',null,children)),closePageMenu(){},openPageMenu(){}}});
 const ssr=local('react-dom/server').renderToStaticMarkup(React.createElement(ssrLoad('components/AnatomyExplorer.js').default));
 await test('Normal ready bare museum SSR is preserved without a browser', () => {
  assert.equal(ssr.includes('Schädel')&&ssr.includes('3D-Ansicht öffnen'),true,'Ready bare SSR retains original initial skull teaching, not an invented loading replacement');
 });
})().catch(error=>{console.error(error);process.exitCode=1;});
