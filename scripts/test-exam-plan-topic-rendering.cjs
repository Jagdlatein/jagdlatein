// Independent component integration: actual plan/goals/region/source components,
// synthetic ready account and router snapshots, no network or customer storage.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const{createLoader,local}=require('./helpers/project-module.cjs');
const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
const{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const data=createLoader()('pages/lernen/pruefungsplan.js').getStaticProps().props;
function fixture(t,{query={},routerReady=true,profileReady=true,profile={country:'AT',region:'S'}}={}){
 const calls=[],saved=new Map();
 const storage={getItem(key){calls.push(['read',key]);throw new Error('Unexpected profile/review read during static integration');},setItem(key){calls.push(['write',key]);throw new Error('Unexpected write');},removeItem(key){calls.push(['remove',key]);throw new Error('Unexpected remove');}};
 for(const[key,value]of Object.entries({window:{localStorage:storage,sessionStorage:storage},fetch(){calls.push(['fetch']);throw new Error('Unexpected network request');}})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
 const router={isReady:routerReady,query,asPath:'/lernen/pruefungsplan'};
 const load=createLoader({'next/head':()=>null,'next/router':{useRouter:()=>router},'next/link':({children,href,prefetch,...props})=>React.createElement('a',{href,...props},children),
  '../lib/use-exam-profile':{__esModule:true,default:()=>({profile,ready:profileReady,persistence:'account',accountKey:'synthetic-only-account',saving:false,saveProfile(){calls.push(['save-profile']);},clearProfile(){calls.push(['clear-profile']);}})},
  './PageMenu':{__esModule:true,default:({children,title})=>React.createElement('aside',{'data-plan-page-menu':title},children),closePageMenu(){calls.push(['close-menu']);},openPageMenu(){calls.push(['open-menu']);}}});
 let markup;try{markup=renderToStaticMarkup(React.createElement(load('components/ExamStudyPlan.js').default,data));}finally{for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
 const dom=new JSDOM(markup),document=dom.window.document;t.after(()=>dom.window.close());return{markup,document,calls,learning:document.querySelector('section[aria-labelledby="exam-plan-learning"]'),sources:document.getElementById('exam-plan-sources')};
}

test('Every focused category renders its complete three goals first, its own case and only its corresponding closed final lesson-source subset',t=>{
 for(const category of data.examBlueprint.categories){
  const h=fixture(t,{query:{kategorie:category.slug}}),text=h.learning.textContent;
  for(const goal of category.goals){assert.ok(text.includes(goal.title));assert.ok(text.includes(goal.task));for(const criterion of goal.selfCheck)assert.ok(text.includes(criterion));}
  assert.equal(h.learning.querySelectorAll('.examGoal').length,3);
  for(const other of data.examBlueprint.categories.filter(item=>item.slug!==category.slug))for(const goal of other.goals)assert.ok(!text.includes(goal.task),'No substituted or duplicate category teaching text');
  if(category.practiceCase){assert.ok(text.includes(category.practiceCase.text));assert.ok(text.includes(category.practiceCase.followUp));assert.ok([...h.learning.querySelectorAll('a')].some(link=>link.getAttribute('href')===category.practiceCase.href));}
  const expectedIds=new Set(category.goals.flatMap(goal=>goal.sourceIds));
  const expected=data.examBlueprint.sources.filter(source=>expectedIds.has(source.id));
  const sourceList=h.sources.querySelector('section[aria-labelledby="exam-plan-goal-sources"] > ul');
  assert.deepEqual([...sourceList.querySelectorAll(':scope > li > a')].map(link=>link.getAttribute('href')),expected.map(source=>source.url));
  assert.equal(sourceList.children.length,expected.length);assert.equal(h.sources.open,false);assert.equal(h.sources.parentElement.lastElementChild,h.sources);
  assert.equal(h.learning.compareDocumentPosition(h.document.getElementById('exam-plan-regional-exam'))&4,4,'Chosen learning content precedes the regional framework');
  assert.deepEqual(h.calls,[]);
 }
});

test('All-category view preserves all36 complete goals and139 inherited source records in the only final closed source section',t=>{
 const h=fixture(t),text=h.learning.textContent;
 assert.equal(h.learning.querySelectorAll('.examGoal').length,36);
 for(const category of data.examBlueprint.categories)for(const goal of category.goals)assert.ok(text.includes(goal.task));
 const sourceList=h.sources.querySelector('section[aria-labelledby="exam-plan-goal-sources"] > ul');
 assert.equal(sourceList.children.length,data.examBlueprint.sources.length);assert.equal(sourceList.children.length,139);
 assert.equal(h.document.querySelectorAll('details').length,1);assert.equal(h.sources.open,false);assert.equal(h.sources.parentElement.lastElementChild,h.sources);
 assert.ok(h.document.getElementById('exam-plan-field').compareDocumentPosition(h.sources)&4);assert.deepEqual(h.calls,[]);
});

test('Invalid or unready category URLs show selection help without replacement goals or invented goal-source attribution',t=>{
 for(const options of [{query:{kategorie:''}},{query:{kategorie:'unknown'}},{query:{kategorie:['wildkunde','hundewesen']}},{query:{kategorie:'wildkunde'},routerReady:false}]){
  const h=fixture(t,options);assert.equal(h.learning.querySelectorAll('.examGoal').length,0);assert.ok(!h.document.getElementById('exam-plan-goal-sources'));
  assert.match(h.learning.textContent,options.routerReady===false?/Lerngebiete werden geladen/:/Lerngebiet ist nicht verfügbar/);
  assert.equal(h.document.querySelectorAll('[data-plan-page-menu]').length,1);assert.equal(h.document.querySelectorAll('form').length,1);assert.deepEqual(h.calls,[]);
 }
 const h=fixture(t,{query:{kategorie:'jagdrecht'},profileReady:false});assert.ok(!h.document.getElementById('exam-plan-regional-exam'));assert.ok(!h.document.getElementById('exam-plan-law'));
 assert.ok(![...h.learning.querySelectorAll('a')].some(link=>/^\/jagdrecht\/(ch|at|de)\?/.test(link.getAttribute('href'))));assert.match(h.learning.textContent,/Prüfungsziel im unteren Menü/);assert.deepEqual(h.calls,[]);
});

test('Focused plan retains a single lower choice menu and profile form, exact regional legal scope and visible preparation limits before sources',t=>{
 const h=fixture(t,{query:{kategorie:'waffen-sicherheit'},profile:{country:'CH',region:'ZH'}});
 assert.equal(h.document.querySelectorAll('[data-plan-page-menu]').length,1);assert.equal(h.document.querySelectorAll('form').length,1);
 assert.equal(h.document.querySelectorAll('#exam-plan-topic').length,1);assert.equal(h.document.querySelector('#exam-plan-topic').closest('[data-plan-page-menu]')!==null,true);
 const buttons=[...h.document.querySelectorAll('#exam-plan-topic [data-menu-choice]')];assert.equal(buttons.length,13);assert.equal(buttons.filter(button=>button.getAttribute('aria-pressed')==='true').length,1);
 assert.deepEqual(buttons.map(button=>button.getAttribute('data-menu-choice')),['alle',...data.data.categories.map(category=>category.slug)]);
 const law=h.document.querySelector('section[aria-labelledby="exam-plan-law"]');assert.ok(law);assert.deepEqual([...law.querySelectorAll('a')].map(link=>link.getAttribute('href')),['/jagdrecht/ch?region=ZH','/jagdrecht/ch?region=ZH&ansicht=uebung']);
 const visible=h.markup.slice(0,h.markup.indexOf('id="exam-plan-sources"'));
 for(const phrase of ['keine amtlichen Bestehensregeln','keine vollständige Abdeckung','weder eine Prüfungszulassung noch eine Jagdberechtigung','ausschließlich in betreuter Ausbildung'])assert.ok(visible.includes(phrase),phrase);
 assert.ok(!visible.includes('target="_blank"'));assert.match(h.sources.textContent,/jeweils genannten Daten/);assert.doesNotMatch(h.sources.textContent,/Am 1\. November 2026 wurden/);assert.deepEqual(h.calls,[]);
});
