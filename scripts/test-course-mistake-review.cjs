// Real React/effect cleanups with synthetic lessons and router/storage doubles.
// No live accounts, user data, provider calls or browser data are accessed.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const reviewKey = 'jagdlatein.repetition.v1';
const question = (id, lessonId, countries = ['DE', 'AT', 'CH']) => ({ id, lessonId, q: `Eigene Frage ${id}`, answers: ['a','b','c','d'].map(key => ({ id: key, text: `${id} / Antwort ${key}` })), correct: ['a'], explain: `Unveränderte Originalerklärung ${id}: Zusammenhang begründen.`, countries });
const course = { id: 'wissen-fehler-lernen', title: 'Isolierter Lernkurs', description: 'Keine echten Nutzerdaten.', category: 'Wildkunde', countries: ['DE','AT','CH'], countryNotes: Object.fromEntries(['DE','AT','CH'].map(code => [code, 'Gemeinsames Lernbeispiel.'])), objectives: ['Zusammenhänge erklären'], reviewedOn: '2026-10-16', sources: [{ label: 'Isolierter Herkunftsnachweis', url: 'https://example.invalid/source' }], lessons: ['eins','zwei'].map(id => ({ id, title: `Lektion ${id}`, paragraphs: [`Vollständiger Lerntext ${id}`], takeaway: `Merksatz ${id}`, exercise: `Übungsauftrag ${id}` })), questions: [question('q1','eins'), question('q2','eins'), question('q3','zwei')] };
const native = node => node[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

async function fixture(t, options = {}) {
  const base = '/kurse/' + course.id, dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://exam.invalid' + base + '#lesson-eins' });
  const originals = new Map(), progress = [], records = [], calls = [], focuses = [], savedValues = new Map(), writes = []; let module = options.module || course, mounted = true;
  Object.defineProperty(dom.window, 'localStorage', { configurable: true, value: { getItem: key => savedValues.get(key) ?? null, setItem(key, value) { writes.push([key,value]); savedValues.set(key,value); }, removeItem(key) { writes.push([key,null]); savedValues.delete(key); } } });
  dom.window.scrollTo = () => {}; dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const focus = dom.window.HTMLElement.prototype.focus; dom.window.HTMLElement.prototype.focus = function(args) { focuses.push(this.id); focus.call(this,args); };
  const router = { isReady: true, asPath: base + '#lesson-eins', query: {}, replace(href, as, opts) { const item = { href, as, options: opts }; item.promise = new Promise((resolve,reject) => Object.assign(item,{resolve,reject})); calls.push(item); return item.promise; } };
  for (const [key,value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) { originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key)); Object.defineProperty(globalThis,key,{value,writable:true,configurable:true}); }
  const wrap = value => ({ __esModule: true, default: value });
  const Component = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': ({href,children}) => React.createElement('a',{href},children), './LearningToolLayout': wrap(({children}) => React.createElement('main',null,children)), './PageMenu': { ...wrap(({children}) => React.createElement('aside',null,children)), closePageMenu() {} }, '../lib/learning-media': { getLearningMedia: () => null }, '../hooks/useCourseProgress': (id,state) => { progress.push({...state}); return {}; }, '../lib/daily-review': { REVIEW_STORAGE_KEY: reviewKey, recordReviewAnswer: (...args) => records.push(args) }, './CourseProgressNotice': wrap(() => null) })('components/LearningCourse.js').default;
  const root = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = fn => React.act(async () => { fn(); await settle(); });
  const render = () => act(() => root.render(React.createElement(Component,{module})));
  const button = name => [...document.querySelectorAll('button')].find(node => node.textContent === name);
  const click = name => act(() => { const node = button(name); assert.ok(node,name); node.click(); });
  const answer = (id,right = false) => click(`${id} / Antwort ${right ? 'a' : 'b'}`);
  const advance = () => click(button('Nächste Frage') ? 'Nächste Frage' : 'Ergebnis ansehen');
  function mutate(hash, query = {}) { const search = new URLSearchParams(query).toString(); router.query=query; router.asPath=base+(search?'?'+search:'')+hash; dom.window.history.replaceState(null,'',router.asPath); }
  async function route(hash,query={}) { mutate(hash,query); await render(); }
  const recap = () => document.querySelector('[aria-labelledby="course-mistakes-title"]');
  const recapLink = id => [...(recap()?.querySelectorAll('a') || [])].find(node => node.getAttribute('aria-label').startsWith(`Eigene Frage ${id}:`));
  const clickLink = node => act(() => native(node).onClick({preventDefault(){}}));
  async function complete(mode='full',wrong=['q1','q3']) { await click(mode==='lesson'?'Lektion üben':'Wissen prüfen'); for (const item of mode==='lesson'?module.questions.filter(item=>item.lessonId==='eins'):module.questions) { await answer(item.id,!wrong.includes(item.id)); await advance(); } }
  async function unmount() { if (mounted) { mounted=false; await act(() => root.unmount()); } }
  t.after(async () => { await unmount(); dom.window.close(); for(const [key,descriptor]of originals) descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key]; });
  await render(); return { dom, router, progress, records, calls, focuses, writes, act, render, button, click, answer, advance, mutate, route, recap, recapLink, clickLink, complete, unmount, text:()=>document.querySelector('main')?.textContent||'', async module(next){module=next;await render();}, async pause(kind='clear'){await act(()=>{const event=new dom.window.Event(kind==='account'?'jagdlatein-account-deleted':'storage'); if(kind!=='account')for(const[key,value]of Object.entries({key:kind==='clear'?null:reviewKey,newValue:null,storageArea:dom.window.localStorage}))Object.defineProperty(event,key,{value});dom.window.dispatchEvent(event);});} };
}

test('Completed full round retains only genuinely wrong questions in round order with exact own, correct and unchanged explanation text', async t => {
  const h=await fixture(t);await h.complete();const recap=h.recap();assert.ok(recap);
  assert.deepEqual([...recap.querySelectorAll('h5')].map(node=>node.textContent),['Eigene Frage q1','Eigene Frage q3']);
  for(const id of ['q1','q3']){assert.ok(recap.textContent.includes(`Deine Antwort: ${id} / Antwort b`));assert.ok(recap.textContent.includes(`Richtig ist: ${id} / Antwort a`));assert.ok(recap.textContent.includes(course.questions.find(item=>item.id===id).explain));}
  assert.ok(!recap.textContent.includes('Eigene Frage q2'));assert.equal(h.recapLink('q1').getAttribute('href'),'#lesson-eins');assert.equal(h.recapLink('q3').getAttribute('href'),'#lesson-zwei');
  assert.equal(document.querySelectorAll('dialog').length,0);assert.equal(document.getElementById('quellen').open,false);assert.ok(h.text().indexOf('Fehler verstehen')<h.text().indexOf('Alle Quellen dieses Themenbereichs'));
  assert.deepEqual(h.records,[['q1',false],['q2',true],['q3',false]]);assert.equal(h.writes.length,0);
});

test('Reading a mistake commits the exact lesson without restarting or changing the completed score, answers or full-course progress', async t => {
  const h=await fixture(t);await h.complete();const completed=h.progress.at(-1),records=h.records.slice();await h.clickLink(h.recapLink('q3'));
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].href,'/kurse/wissen-fehler-lernen#lesson-zwei');assert.ok(h.text().includes('Vollständiger Lerntext eins'));assert.ok(!h.text().includes('Vollständiger Lerntext zwei'));
  await h.route('#lesson-zwei');await h.act(()=>h.calls[0].resolve(true));assert.ok(h.text().includes('Vollständiger Lerntext zwei'));assert.match(h.text(),/1 von 3 richtig/);assert.ok(h.recap());assert.deepEqual(h.records,records);assert.deepEqual(h.progress.at(-1),completed);
  await h.route('#lesson-eins');assert.ok(h.recap());assert.deepEqual(h.records,records);assert.equal(h.writes.length,0);
});

test('A failed lesson navigation preserves the completed explanation, score and current reading rather than substituting another lesson', async t => {
  const h=await fixture(t);await h.complete();await h.clickLink(h.recapLink('q3'));await h.act(()=>h.calls[0].reject(new Error('Synthetic offline route failure')));
  assert.ok(h.text().includes('Vollständiger Lerntext eins'));assert.ok(!h.text().includes('Vollständiger Lerntext zwei'));assert.match(h.text(),/1 von 3 richtig/);assert.ok(h.recap().textContent.includes(course.questions[2].explain));assert.match(h.text(),/Die Lektion konnte nicht geöffnet werden/);assert.equal(h.records.length,3);
});

test('Missing or ambiguous lesson IDs never borrow a first or neighbouring lesson, while the actual explanation stays readable', async t => {
  const unknown={...course,questions:[question('q1','unknown')]};const h=await fixture(t,{module:unknown});await h.complete('full',['q1']);
  assert.equal(h.recapLink('q1'),undefined);assert.match(h.recap().textContent,/keine eindeutige passende Lektion/);assert.ok(h.recap().textContent.includes(unknown.questions[0].explain));assert.equal(h.calls.length,0);
  await h.module({...course,id:'wissen-fehler-ambiguous',lessons:[course.lessons[0],{...course.lessons[0]}],questions:[question('q1','eins')]});await h.complete('full',['q1']);assert.equal(h.recapLink('q1'),undefined);assert.match(h.recap().textContent,/keine eindeutige passende Lektion/);
});

test('A completely correct round offers no invented mistake section or error retry', async t => {
  const h=await fixture(t);await h.complete('full',[]);assert.equal(h.recap(),null);assert.equal(h.button('Nur Fehler üben (0)'),undefined);assert.match(h.text(),/3 von 3 richtig/);
});

test('Lesson and explicit error rounds keep their own recap pool and never overwrite a completed full-course result', async t => {
  const h=await fixture(t);await h.complete('full',[]);const completed=h.progress.at(-1);await h.complete('lesson',['q2']);
  assert.deepEqual([...h.recap().querySelectorAll('h5')].map(node=>node.textContent),['Eigene Frage q2']);assert.deepEqual(h.progress.at(-1),completed);
  await h.click('Nur Fehler üben (1)');await h.answer('q2',false);await h.advance();assert.deepEqual([...h.recap().querySelectorAll('h5')].map(node=>node.textContent),['Eigene Frage q2']);assert.deepEqual(h.progress.at(-1),completed);
  await h.click('Lektion wiederholen');assert.equal(document.getElementById('current-question').textContent,'Eigene Frage q1');assert.equal(h.recap(),null);assert.deepEqual(h.progress.at(-1),completed);
});

test('Old mistake links and retry closures cannot affect a newer round, raw URL context before render, A-B-A or genuine unmount', async t => {
  const h=await fixture(t);await h.complete();const link=native(h.recapLink('q3')).onClick,retry=native(h.button('Nur Fehler üben (2)')).onClick;
  h.mutate('#lesson-zwei',{quelle:'history'});await h.act(()=>{link({preventDefault(){}});retry();});assert.equal(h.calls.length,0);assert.ok(h.recap());
  await h.route('#lesson-eins');await h.act(()=>{link({preventDefault(){}});retry();});assert.equal(h.calls.length,0);assert.ok(h.recap(),'Returning to the old address cannot revive a prior rendered origin');
  const currentLink=native(h.recapLink('q3')).onClick;await h.click('Alle Fragen wiederholen');await h.act(()=>currentLink({preventDefault(){}}));assert.equal(h.calls.length,0);assert.equal(document.getElementById('current-question').textContent,'Eigene Frage q1');
  await h.unmount();await h.act(()=>{link({preventDefault(){}});retry();currentLink({preventDefault(){}});});assert.equal(h.calls.length,0);assert.equal(h.records.length,3);
});

test('A replaced question/catalog at the same course ID invalidates previously captured recap navigation and retries', async t => {
  const h=await fixture(t);await h.complete();const link=native(h.recapLink('q3')).onClick,retry=native(h.button('Nur Fehler üben (2)')).onClick;const replacement={...course,questions:course.questions.map(item=>({...item,explain:item.explain+' Nový katalog.'}))};await h.module(replacement);
  await h.act(()=>{link({preventDefault(){}});retry();});assert.equal(h.calls.length,0);assert.equal(h.records.length,3);assert.equal(h.recapLink('q3'),undefined,'Old round data never links into a replacement question object');assert.equal(h.recap(),null);assert.match(h.text(),/Die Fragen dieses Kurses wurden geändert/);
});

test('Old answers, next buttons and existing feedback links stop before render at a new raw address while current rendered controls continue the preserved round', async t => {
  const h=await fixture(t);await h.click('Wissen prüfen');const answer=native(h.button('q1 / Antwort b')).onClick;
  h.mutate('#lesson-zwei',{quelle:'history'});await h.act(answer);assert.equal(h.records.length,0);await h.route('#lesson-eins');await h.answer('q1',false);
  const next=native(h.button('Nächste Frage')).onClick,feedback=native([...document.querySelectorAll('a')].find(node=>node.textContent==='Passende Lektion öffnen')).onClick;
  h.mutate('#lesson-zwei',{quelle:'new-origin'});await h.act(()=>{next();feedback({preventDefault(){}});});assert.equal(h.calls.length,0);assert.equal(h.records.length,1);assert.equal(document.getElementById('current-question').textContent,'Eigene Frage q1');
  await h.route('#lesson-zwei',{quelle:'new-origin'});await h.click('Nächste Frage');assert.equal(document.getElementById('current-question').textContent,'Eigene Frage q2');assert.equal(h.records.length,1);
});

test('An existing per-answer lesson link cannot navigate after an explicit new round or genuine unmount', async t => {
  const h=await fixture(t);await h.click('Wissen prüfen');await h.answer('q1',false);const feedback=native([...document.querySelectorAll('a')].find(node=>node.textContent==='Passende Lektion öffnen')).onClick;
  await h.click('Lektion üben');await h.act(()=>feedback({preventDefault(){}}));assert.equal(h.calls.length,0);assert.equal(document.getElementById('current-question').textContent,'Eigene Frage q1');
  await h.unmount();await h.act(()=>feedback({preventDefault(){}}));assert.equal(h.calls.length,0);assert.equal(h.records.length,1);
});

test('Replacing an in-progress question catalog at the same course ID hides stale question facts and blocks retained answer/next writes', async t => {
  const h=await fixture(t);await h.click('Wissen prüfen');const answer=native(h.button('q1 / Antwort b')).onClick;await h.module({...course,questions:course.questions.map(item=>({...item,q:'Neue Fassung '+item.id}))});
  assert.equal(document.getElementById('current-question'),null);assert.match(h.text(),/Die Fragen dieses Kurses wurden geändert/);assert.equal(h.button('Lektion üben').disabled,true);await h.act(answer);assert.equal(h.records.length,0);assert.equal(h.calls.length,0);
});

for(const kind of ['remove','clear','account'])test('Existing pause invalidates recap and retained link/retry immediately: '+kind,async t=>{
  const h=await fixture(t);await h.complete();const link=native(h.recapLink('q3')).onClick,retry=native(h.button('Nur Fehler üben (2)')).onClick;await h.pause(kind);await h.act(()=>{link({preventDefault(){}});retry();});assert.equal(h.calls.length,0);assert.equal(h.recap(),null);assert.match(h.text(),/Die Übungsrunde wurde geschlossen/);assert.equal(h.records.length,3);assert.equal(h.writes.length,0);
});

test('Question-specific territorial limits remain beside the corresponding mistake rather than hidden in sources',async t=>{
  const regional={...course,questions:[{...question('q1','eins',['AT']),topic:'Recht'}]};const h=await fixture(t,{module:regional});await h.complete('full',['q1']);assert.match(h.recap().textContent,/Geltungsbereich dieser Frage: Österreich/);assert.equal(document.getElementById('quellen').open,false);
});
