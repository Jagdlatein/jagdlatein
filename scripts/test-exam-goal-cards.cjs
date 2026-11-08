// Server projections and actual scoped adapters; accounts and API transports
// below are isolated doubles. No real user, browser or provider data is read.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const{createLoader,local,root}=require('./helpers/project-module.cjs');
const React=local('react'),{renderToStaticMarkup}=local('react-dom/server'),swc=local('next/dist/build/swc');
const load=createLoader(),project=load('lib/exam-learning-goal-server.js').projectExamLearningGoal;
const{getLearningModule,learningModules}=load('lib/learning-curriculum.js'),cards=load('lib/learning-flashcards.js');
const blueprint=load('lib/exam-blueprint-server.js').getExamBlueprintData(),alignment=load('lib/exam-alignment-server.js').getExamAlignmentData();
const raw=JSON.parse(fs.readFileSync(path.join(root,'data/exam-alignment/learning-goals-2026-11-01.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x)),fixtureGoal=(extra={})=>({id:'test-lesson-cards',title:'Zusammenhang erklären',task:'Erkläre den konkreten Zusammenhang.',selfCheck:['Begründung und Grenze nennen'],moduleId:'wissen-kugelfang',lessonId:'hintergrund',...extra});
const wrap=value=>({__esModule:true,default:value}),Link=({href,children,prefetch,...props})=>React.createElement('a',{href,...props},children);
const ui=createLoader({'next/link':wrap(Link)})('components/ExamLearningGoals.js').ExamLearningGoal;
const html=goal=>renderToStaticMarkup(React.createElement(ui,{goal,profile:{country:'DE',region:'BY'}}));
const cardAnchor=markup=>[...markup.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>Lernkarten \((\d+)\)<\/a>/g)].map(m=>({href:m[1].replaceAll('&amp;','&'),count:Number(m[2])}));
function scoped(goal){const u=new URL(goal.cardHref,'https://exam.invalid');return load('lib/flashcard-selection.js').readFlashcardSelection(u.searchParams);}
function oldProjection(){
 const filename=path.join(root,'lib/exam-learning-goal-server.js'),source=execFileSync('git',['show','0d9e2f5f161800455808996c1ace0ef56951bdf5:lib/exam-learning-goal-server.js'],{cwd:root,encoding:'utf8'}),module={exports:{}};
 const{code}=swc.transformSync(source,{filename,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
 new Function('require','module','exports',code)(id=>load(path.resolve(root,'lib',id+'.js')),module,module.exports);return module.exports;
}

test('Each positive common or regional goal link resolves to exactly its existing lesson cards and no full-course or foreign fallback',()=>{
 const groups=[blueprint.categories.flatMap(c=>c.goals),alignment.regions.flatMap(r=>(r.subjectAreas||[]).flatMap(a=>a.goals))];let counts=[];
 for(const goals of groups){let positive=0;for(const goal of goals){if(goal.cardHref){positive++;const selection=scoped(goal),deck=cards.getFlashcardExport(selection);assert.ok(!selection.invalid&&!deck.selection.invalid);assert.equal(goal.cardCount,deck.cards.length);assert.ok(goal.cardCount>0);assert.equal(deck.selection.returnHref,goal.href);assert.ok(deck.cards.every(card=>card.moduleId===selection.courseId&&card.lessonId===selection.lessonId));assert.deepEqual(cardAnchor(html(goal)),[{href:goal.cardHref,count:deck.cards.length}]);}else{assert.equal(goal.cardCount,undefined);assert.deepEqual(cardAnchor(html(goal)),[]);}}counts.push(positive);}
 assert.deepEqual(counts,[15,22]);
});

test('The server adds only tiny positive count and exact href fields; every pre-existing projected goal field is positively preserved',()=>{
 const before=oldProjection(),source=raw.categories.flatMap(category=>category.goals),regional=['ch','at','de'].flatMap(code=>JSON.parse(fs.readFileSync(path.join(root,`data/exam-alignment/${code}-2026-11-01.json`),'utf8')).regions).flatMap(region=>(region.subjectAreas||[]).flatMap(area=>area.goals.map(goal=>({goal,country:region.country}))));
 for(const item of [...source.map(goal=>({goal})),...regional]){const current=project(item.goal,{country:item.country}),previous=before.projectExamLearningGoal(item.goal,{country:item.country});const{cardCount,cardHref,...remaining}=current;assert.deepEqual(remaining,previous);if(cardCount){assert.deepEqual(Object.keys(current).filter(key=>!Object.hasOwn(previous,key)).sort(),['cardCount','cardHref']);assert.equal(typeof cardHref,'string');assert.ok(Number.isSafeInteger(cardCount));}}
 assert.doesNotMatch(JSON.stringify([blueprint,alignment]),/"(?:cards|answers|correct|correctIds|paragraphs|ratings|accountKey)"\s*:/);
});

test('No-card lessons and all regional-law goals omit metadata rather than opening an unrelated starter deck',()=>{
 const noCard=project(fixtureGoal({moduleId:'wissen-federwild-beobachtung',lessonId:'vogel-merkmale'}));assert.equal(noCard.cardCount,undefined);assert.equal(noCard.cardHref,undefined);
 for(const goal of [...blueprint.categories.flatMap(c=>c.goals),...alignment.regions.flatMap(r=>(r.subjectAreas||[]).flatMap(a=>a.goals))].filter(goal=>goal.regionalLaw)){assert.equal(goal.cardHref,undefined);assert.equal(goal.cardCount,undefined);assert.deepEqual(cardAnchor(html({...goal,cardCount:2,cardHref:'/lernen/lernkarten?kurs=some-course&lektion=some-lesson'})),[]);}
 assert.throws(()=>project(fixtureGoal({lessonId:'unknown-lesson'})),/Lektionsbezug/);
});

test('A shared card shortcut requires the actual course and exact lesson question country scope, not only a positive summary',()=>{
 const baseline=getLearningModule('wissen-kugelfang');
 for(const change of [c=>{c.countries=['DE'];},c=>{c.countries=['DE','DE','DE'];},c=>{c.questions.find(q=>q.lessonId==='hintergrund').countries=['DE'];},c=>{c.questions.find(q=>q.lessonId==='hintergrund').countries=['DE','DE','DE'];},c=>{c.questions.find(q=>q.lessonId==='hintergrund').countries=['DE','AT','UNKNOWN'];},c=>{c.questions.find(q=>q.lessonId==='hintergrund').topic='Recht';}]){
  const course=clone(baseline);change(course);const fn=createLoader({'./learning-curriculum':{getLearningModule:id=>id===course.id?course:null},'./learning-flashcards':{getFlashcardLessonSummary:()=>({total:1,lessons:{hintergrund:1}})}})('lib/exam-learning-goal-server.js').projectExamLearningGoal;
  const result=fn(fixtureGoal());assert.equal(result.cardHref,undefined);assert.equal(result.cardCount,undefined);
 }
});

test('One readonly summary per reused current course supplies exact per-lesson counters without recomputing exports or mutating caller data',()=>{
 const course=clone(getLearningModule('wissen-kugelfang')),summary=cards.getFlashcardLessonSummary(course.id),before=JSON.stringify(summary);Object.freeze(summary.lessons);Object.freeze(summary);let calls=0;
 const fn=createLoader({'./learning-curriculum':{getLearningModule:id=>id===course.id?course:null},'./learning-flashcards':{getFlashcardLessonSummary:id=>{assert.equal(id,course.id);calls++;return summary;}}})('lib/exam-learning-goal-server.js').projectExamLearningGoal;
 for(let i=0;i<20;i++)assert.equal(fn(fixtureGoal({id:'reused-goal-'+i})).cardCount,summary.lessons.hintergrund);
 assert.equal(calls,1);assert.equal(JSON.stringify(summary),before);
 const changed=clone(course);const nextFn=createLoader({'./learning-curriculum':{getLearningModule:()=>changed},'./learning-flashcards':{getFlashcardLessonSummary:()=>({total:0,lessons:{}})}})('lib/exam-learning-goal-server.js').projectExamLearningGoal;assert.equal(nextFn(fixtureGoal()).cardHref,undefined);
});

test('Malformed, inherited, mismatched or impossible summary counters fail closed without a substitute lesson link',()=>{
 const baseline=getLearningModule('wissen-kugelfang'),inherited=Object.create({hintergrund:1});
 for(const summary of [null,{},Object.create({total:1,lessons:{hintergrund:1}}), {total:1,lessons:[]},{total:1,lessons:inherited},{total:'1',lessons:{hintergrund:1}},{total:1,lessons:{hintergrund:'1'}},{total:1,lessons:{hintergrund:0}},{total:2,lessons:{hintergrund:1}},{total:1,lessons:{foreign:1}},{total:999999,lessons:{hintergrund:999999}},{total:2,lessons:{hintergrund:1,foreign:1}}]){
  const course=clone(baseline),fn=createLoader({'./learning-curriculum':{getLearningModule:()=>course},'./learning-flashcards':{getFlashcardLessonSummary:()=>summary}})('lib/exam-learning-goal-server.js').projectExamLearningGoal;const result=fn(fixtureGoal());assert.equal(result.cardCount,undefined,JSON.stringify(summary));assert.equal(result.cardHref,undefined);
 }
});

test('Authored injected hrefs/counts cannot replace the server destination; presentation additionally rejects malformed or cross-lesson destinations',()=>{
 const goal=project(fixtureGoal({cardCount:999,cardHref:'https://other.invalid/private'}));assert.equal(goal.cardCount,cards.getFlashcardExport({courseId:'wissen-kugelfang',lessonId:'hintergrund'}).cards.length);assert.match(goal.cardHref,/^\/lernen\/lernkarten\?kurs=wissen-kugelfang&lektion=hintergrund$/);
 for(const change of [{cardCount:0},{cardCount:-1},{cardCount:'2'},{cardCount:1.5},{cardHref:'https://other.invalid/private'},{cardHref:'//other.invalid/private'},{cardHref:'/api/admin/overview'},{cardHref:'/lernen/lernkarten?kurs=wissen-kugelfang'},{cardHref:goal.cardHref+'&lektion=foreign'},{cardHref:goal.cardHref+'&debug=on'},{cardHref:goal.cardHref+'#foreign'},{cardHref:'/lernen/lernkarten?kurs=wissen-kugelfang&lektion=foreign'}])assert.deepEqual(cardAnchor(html({...goal,...change})),[],JSON.stringify(change));
 const markup=html(goal);assert.doesNotMatch(markup,/target="_blank"|<button|<dialog|<form/);assert.ok(markup.includes('prefetch')===false);assert.match(markup,/Lernkarten zur Lektion/);
});

test('The real selected page-data and print renderer preserve exact card IDs, lesson return target and original dates/sources',async()=>{
 const selected=blueprint.categories.flatMap(c=>c.goals).find(goal=>goal.cardHref),selection=scoped(selected),expected=cards.getFlashcardExport(selection),query={kurs:selection.courseId,lektion:selection.lessonId};
 const before=JSON.stringify(cards.getFlashcards());
 for(const filename of ['pages/lernen/lernkarten.js','pages/lernen/lernkarten-drucken.js']){
  const headers={},context={req:{},res:{setHeader:(key,value)=>headers[key]=value},query,resolvedUrl:selected.cardHref};
  const page=createLoader({'../../lib/account-access':{getPaidPageProps:async actual=>{assert.equal(actual,context);actual.res.setHeader('Cache-Control','private, no-store, max-age=0');return{props:{}};}}})(filename),result=await page.getServerSideProps(context),data=load('lib/flashcard-payload.js').unpackFlashcards(result.props.deck);
  assert.match(headers['Cache-Control'],/private, no-store/);assert.equal(result.props.totalCount,selected.cardCount);assert.equal(result.props.remote,false);assert.deepEqual(data.cards,expected.cards);assert.equal(data.selection.returnHref,selected.href);
  if(filename.includes('drucken')){const Print=createLoader({'next/router':{useRouter:()=>({isReady:true,query,asPath:selected.cardHref.replace('/lernkarten','/lernkarten-drucken')})},'next/head':wrap(()=>null),'next/link':wrap(Link),'../../components/PageMenu':{...wrap(()=>null),closePageMenu(){}}})(filename).default;const markup=renderToStaticMarkup(React.createElement(Print,result.props));assert.ok(markup.includes(expected.selection.lessonTitle));assert.doesNotMatch(markup,/Welche Wildart zeigt dieses Foto/);}
 }
 assert.equal(JSON.stringify(cards.getFlashcards()),before,'Links and projections never mutate original cards or starter order');
});

test('The selected export API keeps existing paid/current-admin boundaries and returns no unrelated answer bank',async()=>{
 const goal=blueprint.categories.flatMap(c=>c.goals).find(goal=>goal.cardHref),selection=scoped(goal),expected=cards.getFlashcardExport(selection);
 for(const[account,status]of [[null,401],[{paid:false},403],[{paid:true},200],[{admin:true},200]]){
  const api=createLoader({'../../../../lib/account-access':{getSignedAccountAccess:async()=>account}})('app/api/lernen/lernkarten/route.js');const response=await api.GET(new Request('https://jagdlatein.test/api/lernen/lernkarten?'+new URL(goal.cardHref,'https://jagdlatein.test').searchParams));assert.equal(response.status,status);assert.match(response.headers.get('Cache-Control'),/private, no-store/);const body=await response.json();
  if(status===200){const deck=load('lib/flashcard-payload.js').unpackFlashcards(body);assert.deepEqual(deck.cards,expected.cards);assert.ok(deck.cards.every(card=>card.lessonId===selection.lessonId&&card.moduleId===selection.courseId));}else{assert.equal(body.cards,undefined);assert.equal(body.cardTable,undefined);assert.doesNotMatch(JSON.stringify(body),/correct|explanation|sourceTable|contextTable/);}
 }
});

test('Client goal presentation imports only small route validators; full card and curriculum banks stay in server-only projection',()=>{
 const source=fs.readFileSync(path.join(root,'components/ExamLearningGoals.js'),'utf8');assert.doesNotMatch(source,/from\s+["'][^"']*(?:learning-flashcards|learning-curriculum|flashcard-page-data|exam-learning-goal-server)/);
 const output=swc.transformSync(fs.readFileSync(path.join(root,'pages/lernen/pruefungsplan.js'),'utf8'),{filename:path.join(root,'pages/lernen/pruefungsplan.js'),isPageFile:true,disableNextSsg:false,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code;
 assert.doesNotMatch(output,/exam-blueprint-server|exam-alignment-server|learning-flashcards|learning-curriculum/);
});
