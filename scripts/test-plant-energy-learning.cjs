// Full-object preservation and reader/export integration; scientific reading is
// documented separately rather than inferred from these structural checks.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{createHash}=require('node:crypto');
const{createLoader,local}=require('./helpers/project-module.cjs');
const{courseId,lessonIds,questionIds,sourceURLs,stripPlantEnergyAddition,stripPlantEnergyDataset,isPlantEnergyCard,plantEnergyBaselineFixture}=require('./helpers/plant-energy-additions-oct27.cjs');
const{stripAdiposeAddition,isAdiposeCard,adiposeBaselineFixture}=require('./helpers/adipose-learning-additions-oct27.cjs');
const raw=require('../data/learning-expansion-ecology-2026-10-16.json'),load=createLoader();
const{learningModules,getLearningModule}=load('lib/learning-curriculum.js'),course=getLearningModule(courseId),original=raw.modules.find(item=>item.id===courseId),lessons=course.lessons.slice(-2),cards=load('lib/learning-flashcards.js').getFlashcards();
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only the exact plant-energy appendix differs from the complete647e2df ecology dataset,four lessons,32questions and8source objects',()=>{
 assert.equal(hash(stripPlantEnergyDataset(raw)),'636c4b14263193d056710bc5d8f185897eed8d9185049e23c86332dc5603aa3e');
 assert.equal(hash(stripPlantEnergyAddition(original)),'8b938ff42b74b2ea24392ad370ebe3a7c685a02e49dbae0fd30e929e71873383');
 assert.equal(hash(raw.modules.filter(item=>item.id!==courseId)),'00c980b9268f1ab416d52fde9ee98a063eab34cd7b63b486e03b114bf526dd0f');
 assert.equal(hash(stripPlantEnergyDataset(raw).evidence),'de64c336e8c84602e9e5b99eb1cb8a012052d754ee75e78918679d13aceac6e6');
 assert.equal(hash(stripPlantEnergyAddition(course)),'9b0061ab8290aecfd305d3f20c62207aebbff646aaee4641df2985d23208b4df');
 assert.deepEqual(stripPlantEnergyAddition(course).lessons.map(item=>item.id),['blattbau','photosynthese','wasserhaushalt','blattalterung']);
 assert.equal(raw.reviewedOn,'2026-10-16');assert.equal(course.reviewedOn,'2026-10-16');
});
test('The374-word appendix distinguishes plant respiration,light and darkness,energy and atoms with exact evidence and visible model limits',()=>{
 assert.equal(course.lessons.length,6);assert.equal(course.questions.length,36);assert.equal(course.sources.length,15);
 assert.deepEqual(lessons.map(item=>item.id),lessonIds);assert.equal(lessons.flatMap(item=>item.paragraphs).join(' ').split(/\s+/).length,374);
 const first=lessons[0].paragraphs.join(' '),second=lessons[1].paragraphs.join(' ');
 assert.match(first,/Aerob bedeutet hier, dass Sauerstoff benötigt wird/);assert.match(first,/kein Vorgang ausschließlich der Nacht/);assert.match(first,/keine Aussage über eine gleiche Atmungsrate/);
 assert.match(second,/photosynthetisch gestützten Waldsystem/);assert.match(second,/Wärme bleibt Energie/);assert.match(second,/Kohlenstoffatom/);assert.match(second,/weder, dass jeder Teil sofort zurückkehrt, noch dass ein Revier einen geschlossenen Kreislauf bildet/);
 for(const lesson of lessons){assert.equal(lesson.reviewedOn,'2026-10-27');assert.equal(lesson.flashcardExpansion,true);assert.equal(lesson.image,undefined);assert.equal(lesson.diagram,undefined);assert.match(lesson.paragraphs.join(' '),/Eigene Denkübung/);assert.doesNotMatch(lesson.paragraphs.join(' '),/\d|ATP|Prozent|Wirkungsgrad|Düng|Begas|Chemosynth|Energie wird vernichtet/);}
 const expected=[[[0,1],[1,2],[1,2]],[[3,4],[5,6]]];
 for(const[index,lesson]of lessons.entries()){
  assert.deepEqual(lesson.evidence.map(claim=>claim.sources.map(source=>source.url)),expected[index].map(pair=>pair.map(i=>sourceURLs[i])));
  const record=raw.evidence.find(item=>item.moduleId===courseId&&item.lessonId===lesson.id);
  for(const claim of record.claims){assert.equal(new Set(claim.sourceUrls).size,2);assert.equal(new Set(claim.sourceUrls.map(url=>course.sources.find(source=>source.url===url).organization)).size,2);for(const url of claim.sourceUrls)assert.ok(claim.sourceRoles[url].length>40);}
 }
 assert.deepEqual(course.sources.slice(-7).map(source=>source.url),sourceURLs);assert.equal(new Set(course.sources.map(source=>source.url)).size,15);
 for(const[index,source]of course.sources.slice(-7).entries()){assert.equal(source.checkedOn,'2026-10-27');assert.deepEqual(source.lessonIds,[index<3?'zellatmung':'energie-stoffe']);}
});
test('All198 old complete course objects and1732old complete cards including116starters remain exact and ordered,excluding only the separately authorized adipose appendix',()=>{
 assert.equal(learningModules.length,198);assert.equal(hash(learningModules.map(item=>stripAdiposeAddition(stripPlantEnergyAddition(item)))),'e0a7538f5499a9344ab151854b4fb4d108da297d5a207d6e94fc6ca29358c4d1');
 const historical=cards.filter(card=>!isPlantEnergyCard(card)&&!isAdiposeCard(card));assert.equal(historical.length,1732);assert.equal(hash(historical),'1b3b514335333b7166645a86b7ea54e92744853ad44bbfa87ae5e67a817a5833');
 assert.equal(hash(cards.filter(card=>card.moduleId===courseId&&!isPlantEnergyCard(card))),'5c338e3a690ede0e55386fd9ed4fdf95e01d157518ebcb91851739ac3c3fd0ea');assert.equal(cards.filter(card=>card.moduleId===courseId).length,34);
 assert.equal(hash(cards.slice(0,116)),'54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
 const foreign=fs.readFileSync(path.join(__dirname,'../data/learning-expansion-afternoon-2026-10-16.json'));assert.equal(createHash('sha256').update(foreign).digest('hex'),'23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});
test('Four distinct own questions become four exact dated lesson cards in each existing shared DACH quiz pool',()=>{
 const selected=course.questions.filter(question=>lessonIds.includes(question.lessonId));assert.deepEqual(selected.map(question=>question.id),questionIds.map(id=>`${courseId}-${id}`));assert.equal(new Set(selected.map(question=>question.q)).size,4);
 for(const question of selected){assert.equal(learningModules.flatMap(module=>module.questions).filter(item=>item.q===question.q).length,1);assert.equal(new Set(question.answers.map(answer=>answer.text)).size,4);const chosen=cards.filter(card=>card.id===`flash-${question.id}`);assert.equal(chosen.length,1);const[card]=chosen;assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);assert.equal(card.explanation,question.explain);assert.equal(card.sourceScope,'lesson');assert.equal(card.reviewedOn,'2026-10-27');assert.deepEqual(card.sources.map(source=>source.url),question.lessonId==='zellatmung'?sourceURLs.slice(0,3):sourceURLs.slice(3));assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${question.lessonId}`);assert.equal(card.options,undefined);}
 const bank=load('data/questions-full.js').QUESTIONS,{quizLearningPool}=load('lib/quiz-learning-scope.js');for(const country of ['DE','AT','CH'])for(const question of selected)assert.ok(quizLearningPool(bank,{country,topic:'Hege/Naturschutz'}).some(item=>item.id===question.id));
});
test('Existing category,search,static course data and scoped card counts retain both precise lesson destinations',()=>{
 const location=load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);assert.equal(location.categorySlug,'wald-pflanzen');assert.equal(location.groupId,'pflanzenbau-vermehrung');
 for(const[query,lesson]of [['Pflanzenatmung',lessons[0]],['Kohlenstoffatom',lessons[1]]]){const result=load('lib/learning-search.js').searchLearning({query,type:'course'}).results.find(item=>item.id===`course:${courseId}`);assert.ok(result);assert.equal(result.href,`/kurse/${courseId}#lesson-${lesson.id}`);assert.equal(result.lessonTitle,lesson.title);}
 const props=load('pages/kurse/[slug].js').getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module.lessons.slice(-2),lessons);assert.equal(props.flashcards.lessons.zellatmung,2);assert.equal(props.flashcards.lessons['energie-stoffe'],2);
});
test('Synthetic offline delivery retains all new text,questions,evidence and original course date without extending expiry',()=>{
 const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-plant-energy-offline';try{const now=Date.parse('2026-10-27T20:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-10-29T20:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.equal(pack.courses[0].reviewedOn,'2026-10-16');for(const lesson of pack.courses[0].lessons.slice(-2)){assert.equal(lesson.reviewedOn,'2026-10-27');assert.deepEqual(lesson.evidence,lessons.find(item=>item.id===lesson.id).evidence);}}finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});
test('The real course reader shows each whole new lesson before its own closed final source block and true lesson date',()=>{
 const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');for(const[offset,lesson]of lessons.entries()){let cursor=0;const hooks={...React,useState(initial){return[cursor++===1?4+offset:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
 const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lesson.id}`})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
 const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId)})),start=html.indexOf('<details id="quellen"');assert.ok(start>0);for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,start).includes(paragraph));const urls=offset===0?sourceURLs.slice(0,3):sourceURLs.slice(3);for(const url of urls){assert.ok(!html.slice(0,start).includes(url));assert.ok(html.slice(start).includes(url));}const evidenceStart=html.indexOf('<section class="lessonEvidence">',start);assert.ok(evidenceStart>start);const evidenceHtml=html.slice(evidenceStart,html.indexOf('</section>',evidenceStart));for(const url of urls)assert.ok(evidenceHtml.includes(url));for(const url of sourceURLs.filter(url=>!urls.includes(url)))assert.ok(!evidenceHtml.includes(url));assert.ok(html.includes(`Lektion ${5+offset} von 6`));assert.match(html.slice(start),/27\. Oktober 2026/);assert.doesNotMatch(html.slice(start),/16\. Oktober 2026/);assert.ok(!html.slice(start).split('>')[0].includes('open'));}
});
test('Exact baseline fixtures preserve explicit overrides,future fields and similarly named unrelated content',()=>{
 const key='../data/learning-expansion-ecology-2026-10-16.json',sentinel={keep:true},explicit={...raw,future:{marker:true}};
 const fixtures=plantEnergyBaselineFixture(adiposeBaselineFixture({[key]:explicit,sentinel}));assert.equal(fixtures.sentinel,sentinel);assert.deepEqual(fixtures[key].future,{marker:true});assert.deepEqual(fixtures[key],stripPlantEnergyDataset(explicit));
 const unrelated={id:'other-course',lessons:[{id:'zellatmung'}]};assert.equal(stripPlantEnergyAddition(unrelated),unrelated);
 const probe={...original,unrelated:{keep:true},lessons:[...original.lessons,{id:'zellatmung-zusatz'}],questions:[...original.questions,{id:'zellatmung-tag-nacht-zusatz'}],sources:[...original.sources,{url:sourceURLs[0]+'?other'}]},result=stripPlantEnergyAddition(probe);assert.deepEqual(result.unrelated,{keep:true});assert.equal(result.lessons.at(-1).id,'zellatmung-zusatz');assert.equal(result.questions.at(-1).id,'zellatmung-tag-nacht-zusatz');assert.equal(result.sources.at(-1).url,sourceURLs[0]+'?other');
});
