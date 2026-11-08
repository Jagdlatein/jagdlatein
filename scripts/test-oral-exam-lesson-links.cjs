// Actual server projection, authored-text comparisons and isolated React
// lifecycles. No real account, browser storage, voice output or live API.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const{createLoader,local,root:repo}=require('./helpers/project-module.cjs'),{setup,nodes,text}=require('./helpers/field-reader-fixture.cjs');
const React=local('react'),{JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
const load=createLoader(),questions=load('lib/oral-exam-trainer.js').oralExamQuestions,server=load('lib/oral-exam-lesson-links-server.js'),links=server.getOralExamLessonLinks(),page=load('pages/lernen/pruefungsgespraech.js');
const expected={kitzfund:['reh-nachwuchs'],rotte:['sau-sozial'],hundewahl:['passende-auswahl'],sinneseindruck:['qualitaet'],abruflernen:['abruf','abstand'],offlinekarte:['ausfall'],verbund:['biotop-netz','habitat-nische'],mahd:['team','aenderung'],hygienekette:['trennung','kuehlweg']};
const row=id=>links.filter(link=>link.questionId===id),sourceNode=h=>h.nodes(node=>node.props?.id==='exam-question-sources')[0];
function light(t,id,lessonLinks=links){const h=setup('components/OralExamTrainer.js',{eintrag:id},{props:{lessonLinks},router:{isReady:true,asPath:'/lernen/pruefungsgespraech?eintrag='+id}});t.after(()=>h.dispose());return h;}
function reveal(h){h.nodes(node=>node.type==='textarea')[0].props.onChange({target:{value:'Eigene isolierte Testantwort, keine echte Nutzernotiz.'}});h.render();h.click('Mit der Musterantwort vergleichen');}

test('Only nine explicitly reviewed cases project thirteen exact existing lesson starts and five small fields',()=>{
 assert.equal(links.length,13);assert.deepEqual([...new Set(links.map(link=>link.questionId))],Object.keys(expected));
 for(const[id,ids]of Object.entries(expected)){assert.deepEqual(row(id).map(link=>link.lessonId),ids);const question=questions.find(item=>item.id===id),course=load('lib/learning-curriculum.js').getLearningModule(question.course);for(const link of row(id)){assert.deepEqual(Object.keys(link).sort(),['questionId','courseId','lessonId','title','href'].sort());const lesson=course.lessons.find(item=>item.id===link.lessonId);assert.ok(lesson.paragraphs.length>0);assert.equal(link.courseId,question.course);assert.equal(link.title,lesson.title);assert.equal(link.href,'/kurse/'+course.id+load('lib/learning-lesson-navigation.js').lessonHash(lesson.id));}}
 // The four exact new rows increase actual props from1887 to2709 bytes; the
 // projection still has only the same five fields per row and no course bank.
 assert.deepEqual(page.getStaticProps(),{props:{lessonLinks:links}});assert.ok(Buffer.byteLength(JSON.stringify(page.getStaticProps().props))<2800);assert.doesNotMatch(JSON.stringify(page.getStaticProps().props),/"(?:model|criteria|mistake|paragraphs|sources|answers|correct|rating)"\s*:/);
});

test('The two reviewed verbund lesson rows retain the exact seven preceding starts; its question and course source remain unchanged',()=>{
 const baseline='e6b1d550d550e14a5571fa4caf43284758fe0c37',filename=path.join(repo,'lib/oral-exam-lesson-links-server.js'),original=execFileSync('git',['show',baseline+':lib/oral-exam-lesson-links-server.js'],{cwd:repo,encoding:'utf8'}),old={exports:{}};
 const{code}=local('next/dist/build/swc').transformSync(original,{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
 new Function('require','module','exports',code)(id=>id.startsWith('.')?load(path.resolve(repo,'lib',path.extname(id)?id:id+'.js')):local(id),old,old.exports);
 const previous=old.exports.getOralExamLessonLinks();assert.equal(previous.length,7);assert.deepEqual(links.slice(0,7),previous);
 const course=load('lib/learning-curriculum.js').getLearningModule('wissen-lebensraeume-biotopverbund'),hash=load('lib/learning-lesson-navigation.js').lessonHash;
 assert.deepEqual(links.slice(7,9),['biotop-netz','habitat-nische'].map(lessonId=>({questionId:'verbund',courseId:course.id,lessonId,title:course.lessons.find(lesson=>lesson.id===lessonId).title,href:'/kurse/'+course.id+hash(lessonId)})));
 for(const file of ['lib/oral-exam-trainer.js','lib/learning-wildlife.js','components/OralExamTrainer.js'])assert.equal(fs.readFileSync(path.join(repo,file),'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',baseline+':'+file],{cwd:repo,encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
});

test('Unknown, cross-course, duplicate or excessive lesson targets fail rather than selecting a course first lesson',()=>{
 const base={questionId:'kitzfund',courseId:'wissen-rehwild-jahreslauf',lessonId:'reh-nachwuchs'};
 for(const entries of [null,{},[null],[{...base,questionId:'unknown-question'}],[{...base,courseId:'wissen-kugelfang'}],[{...base,lessonId:'unknown-lesson'}],[{...base,lessonId:['reh-nachwuchs']}],[base,base],[base,{...base,lessonId:'reh-jahreszeiten'},{...base,lessonId:'reh-nahrung'}]])assert.throws(()=>server.projectOralExamLessonLinks(entries),/Gesprächs-/);
 const injected=server.projectOralExamLessonLinks([{...base,href:'https://other.invalid/private',model:'HIDDEN_ANSWER'}])[0];assert.equal(injected.href,'/kurse/wissen-rehwild-jahreslauf#lesson-reh-nachwuchs');assert.doesNotMatch(JSON.stringify(injected),/HIDDEN|other\.invalid/);
});

test('Category, genuine DACH country scope and complete lesson text are checked against the existing course',()=>{
 const base={questionId:'kitzfund',courseId:'wissen-rehwild-jahreslauf',lessonId:'reh-nachwuchs'},original=load('lib/learning-curriculum.js').getLearningModule(base.courseId);
 for(const change of [c=>{c.category='Hundewesen';},c=>{c.countries=['DE'];},c=>{c.countries=['DE','DE','DE'];},c=>{c.lessons.find(x=>x.id===base.lessonId).paragraphs=[];},c=>{c.lessons.push({...c.lessons.find(x=>x.id===base.lessonId)});}]){const course=JSON.parse(JSON.stringify(original));change(course);const api=createLoader({'./learning-curriculum':{getLearningModule:()=>course}})('lib/oral-exam-lesson-links-server.js');assert.throws(()=>api.projectOralExamLessonLinks([base]),/Gesprächs-/);}
});

test('All twenty original questions, models, sources, criteria and summary semantics remain exact old objects',()=>{
 const filename=path.join(repo,'lib/oral-exam-trainer.js'),source=execFileSync('git',['show','98fc900a6825bfa1c1c7f3520814eb954e4498f5:lib/oral-exam-trainer.js'],{cwd:repo,encoding:'utf8'}),old={exports:{}};
 const{code}=local('next/dist/build/swc').transformSync(source,{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});new Function('module','exports',code)(old,old.exports);assert.deepEqual(questions,old.exports.oralExamQuestions);assert.equal(questions.length,20);assert.equal(new Set(questions.map(x=>x.categorySlug)).size,12);
});

test('Reviewed lesson links appear only after the learner’s own answer comparison and leave the full course overview intact',t=>{
 for(const question of questions){const h=light(t,question.id);assert.ok(!text(h.tree).includes('Grundlagen nachlesen:'));reveal(h);const linkNodes=h.nodes(node=>node.props?.href&&row(question.id).some(link=>link.href===node.props.href));assert.deepEqual(linkNodes.map(node=>({href:node.props.href,title:text(node)})),row(question.id).map(link=>({href:link.href,title:link.title})));assert.ok(h.nodes(node=>node.props?.href==='/kurse/'+question.course).length);assert.equal(text(h.tree).includes('Grundlagen nachlesen:'),Object.hasOwn(expected,question.id));assert.ok(!h.nodes(node=>node.type==='dialog').length);}
});

test('Current-item presentation rejects unrelated question/course, query/hash mutations, external addresses and duplicate learning starts',t=>{
 const original=row('kitzfund')[0];
 for(const modified of [{...original,questionId:'rotte'},{...original,courseId:'wissen-kugelfang'},{...original,lessonId:'foreign'},{...original,title:{}},{...original,href:'https://other.invalid/'},{...original,href:original.href+'?private=yes'},{...original,href:original.href+'#other'},{...original,href:'/kurse/wissen-kugelfang#lesson-reh-nachwuchs'}]){const h=light(t,'kitzfund',[modified]);reveal(h);assert.ok(!text(h.tree).includes('Grundlagen nachlesen:'));}
 const h=light(t,'kitzfund',[original,original]);reveal(h);assert.ok(!text(h.tree).includes('Grundlagen nachlesen:'));
});

test('Exact old sources and October review date are closed at the very end after answer actions and promotion',t=>{
 const h=light(t,'kitzfund');reveal(h);const sources=sourceNode(h);assert.ok(sources&&!sources.props.open);assert.equal(h.tree.props.children.filter(Boolean).at(-1),sources);assert.match(text(sources),/geprüft am 04\.10\.2026/);assert.deepEqual(nodes(sources,node=>node.type==='a').map(node=>({title:text(node),url:node.props.href})),questions[0].sources);assert.ok(h.nodes(node=>node.type==='button'&&text(node)==='Nächste Frage').length);assert.ok(h.tree.props.children.find(node=>node?.type?.name==='JagdakademiePromotion'));
});

test('Client page transform erases curriculum and editorial projection imports; no API or browser storage is added',()=>{
 const filename=path.join(repo,'pages/lernen/pruefungsgespraech.js'),{code}=local('next/dist/build/swc').transformSync(fs.readFileSync(filename,'utf8'),{filename,isPageFile:true,disableNextSsg:false,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});assert.match(code,/__N_SSG/);assert.doesNotMatch(code,/oral-exam-lesson-links-server|learning-curriculum/);const ui=fs.readFileSync(path.join(repo,'components/OralExamTrainer.js'),'utf8');assert.doesNotMatch(ui,/from\s+["'][^"']*(?:learning-curriculum|oral-exam-lesson-links-server)|fetch\(|localStorage|sessionStorage/);
});

const native=node=>node[Object.keys(node).find(key=>key.startsWith('__reactProps$'))],settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
async function browserFixture(t){
 const dom=new JSDOM('<html><body><div id="root"></div></body></html>',{url:'https://exam.invalid/lernen/pruefungsgespraech?eintrag=kitzfund'}),saved=new Map(),spoken=[],pushes=[];let cancellations=0,mounted=true;
 dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=()=>{};dom.window.speechSynthesis={getVoices:()=>[{lang:'de-CH',localService:true}],cancel(){cancellations++;},speak(item){spoken.push(item);}};dom.window.SpeechSynthesisUtterance=function(value){this.text=value;};
 Object.defineProperty(dom.window,'localStorage',{get(){throw new Error('No browser data access allowed');}});
 const router={isReady:true,query:{eintrag:'kitzfund'},asPath:'/lernen/pruefungsgespraech?eintrag=kitzfund',push(href){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});pushes.push({href,resolve,reject});return promise;}};
 for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
 const wrap=value=>({__esModule:true,default:value}),Component=createLoader({'next/router':{useRouter:()=>router},'next/link':({href,children,prefetch,...props})=>React.createElement('a',{href,...props},children),'./LearningToolLayout':wrap(({children})=>React.createElement('main',null,children)),'./JagdakademiePromotion':wrap(()=>React.createElement('p',{id:'qa-promo'},'Promotion placeholder')),'./PageMenu':{...wrap(({children})=>React.createElement('aside',null,children)),openPageMenu(){},closePageMenu(){}}})('components/OralExamTrainer.js').default;
 const root=local('react-dom/client').createRoot(document.getElementById('root')),act=fn=>React.act(async()=>{fn();await settle();}),render=()=>act(()=>root.render(React.createElement(Component,{lessonLinks:links}))),button=name=>[...document.querySelectorAll('button')].find(node=>node.textContent===name),input=()=>document.querySelector('textarea');
 function commit(query,hash='exam-question-title',routerCommit=true){const url='/lernen/pruefungsgespraech?'+new URLSearchParams(query)+(hash?'#'+hash:'');dom.window.history.replaceState(null,'',url);if(routerCommit){router.query=query;router.asPath=url;}}
 async function unmount(){if(mounted){mounted=false;await act(()=>root.unmount());}}
 t.after(async()=>{await unmount();dom.window.close();for(const[key,descriptor]of saved)descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];});await render();return{dom,router,spoken,pushes,act,render,button,input,commit,unmount,cancellations:()=>cancellations,text:()=>document.querySelector('main')?.textContent||'',async type(value){await act(()=>native(input()).onChange({target:{value}}));},async click(label){await act(()=>button(label).click());}};
}

test('Actual router plus physical URL commits before paint block old answers, voice and selection; observed A-B-A cannot revive them',async t=>{
 const h=await browserFixture(t);await h.type('Eigene Antwort A bleibt erhalten.');const answer=native(h.input()).onChange,read=native(h.button('Frage vorlesen')).onClick,select=native(document.querySelector('#exam-question-select button[data-menu-choice="hundelernen"]')).onClick;
 h.commit({eintrag:'rotte'});await h.act(()=>{answer({target:{value:'OLD_WRITE'}});read();select();});assert.equal(h.input().value,'Eigene Antwort A bleibt erhalten.');assert.equal(h.spoken.length,0);assert.equal(h.pushes.length,0);
 h.commit({eintrag:'kitzfund'},'');await h.act(()=>{answer({target:{value:'OLD_A_B_A'}});read();select();});assert.equal(h.input().value,'Eigene Antwort A bleibt erhalten.');assert.equal(h.spoken.length,0);assert.equal(h.pushes.length,0);await h.render();await h.type('Aktuelle Antwort A.');assert.equal(h.input().value,'Aktuelle Antwort A.');
});

test('A physical-only hash change blocks prior actions and errors before render; old Stop cannot cancel a new question voice',async t=>{
 const h=await browserFixture(t);await h.click('Frage vorlesen');const utterance=h.spoken.at(-1),oldStop=native(h.button('Vorlesen stoppen')).onClick,oldAnswer=native(h.input()).onChange;h.commit({eintrag:'kitzfund'},'anderer-kontext',false);await h.act(()=>{oldAnswer({target:{value:'OLD_HASH'}});utterance.onerror?.({error:'synthetic-old-error'});});assert.equal(h.input().value,'');assert.ok(!h.text().includes('synthetic-old-error'));
 h.commit({eintrag:'rotte'});await h.render();await h.click('Frage vorlesen');const count=h.cancellations();await h.act(oldStop);assert.equal(h.cancellations(),count);assert.equal(h.spoken.length,2);await h.unmount();await h.act(()=>oldAnswer({target:{value:'OLD_UNMOUNT'}}));assert.equal(h.pushes.length,0);
});

test('Actual sources follow the exercise/promotion, start closed for each committed question and never replace the person’s preserved answer',async t=>{
 const h=await browserFixture(t);await h.type('Eigene Erklärung mit Übungsbedarf.');await h.click('Mit der Musterantwort vergleichen');const oldSource=document.getElementById('exam-question-sources');assert.ok(oldSource&&!oldSource.open);assert.ok(document.querySelector('#qa-promo').compareDocumentPosition(oldSource)&h.dom.window.Node.DOCUMENT_POSITION_FOLLOWING);oldSource.open=true;
 h.commit({eintrag:'rotte'});await h.render();assert.equal(document.getElementById('exam-question-sources'),null);await h.type('Eigene Erklärung B.');await h.click('Mit der Musterantwort vergleichen');assert.equal(document.getElementById('exam-question-sources').open,false);h.commit({eintrag:'kitzfund'});await h.render();assert.equal(h.input().value,'Eigene Erklärung mit Übungsbedarf.');assert.equal(document.getElementById('exam-question-sources').open,false);assert.ok(h.text().includes('Von der Blattzeit zum abgelegten Kitz'));
});

test('A real repeat commit before deferred acceptance blocks fresh edits, then clears only its own question and permits the new current draft',async t=>{
 const h=await browserFixture(t);h.commit({kategorie:'wildkunde',eintrag:'kitzfund'});await h.render();await h.type('Eigene ursprüngliche Erklärung A.');await h.click('Mit der Musterantwort vergleichen');await h.click('Noch offene Lücken');await h.click('Nächste Frage');const next=h.pushes.at(-1);h.commit(next.href.query,next.href.hash);await h.render();await h.act(()=>next.resolve(true));
 await h.type('Eigene sichere Erklärung B.');await h.click('Mit der Musterantwort vergleichen');await h.click('Sicher erklärt');await h.click('Runde auswerten');await h.click('Offene Fragen erneut erklären');const repeat=h.pushes.at(-1);assert.equal(repeat.href.query.eintrag,'kitzfund');h.commit(repeat.href.query,repeat.href.hash);await h.render();await h.type('Zu früher Entwurf darf nicht angenommen werden.');assert.equal(h.input().value,'Eigene ursprüngliche Erklärung A.');
 await h.act(()=>repeat.resolve(true));assert.equal(h.input().value,'');await h.type('Aktuelle neue Erklärung A.');assert.equal(h.input().value,'Aktuelle neue Erklärung A.');h.commit({kategorie:'wildkunde',eintrag:'rotte'});await h.render();assert.equal(h.input().value,'Eigene sichere Erklärung B.');
});
