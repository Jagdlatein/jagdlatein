const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createLoader,local,root}=require('./helpers/project-module.cjs');
const load=createLoader(),courseId='wissen-spuren-systematisch',lessonId='auftrittsformen',href=`/kurse/${courseId}#lesson-${lessonId}`;
const {answerJagdlateinQuestion:answer}=load('lib/jagdlatein-chat.js');
const {getLearningModule}=load('lib/learning-curriculum.js');
const {chatPracticeBindings,chatTopicBindings}=load('lib/jagdlatein-chat-bindings.js');
const course=getLearningModule(courseId),lesson=course.lessons.find(item=>item.id===lessonId);
const sourceURLs=[
 'https://www.duesseldorf.de/fileadmin/Amt68/gartenamt/pdf/wald/lb_wirbeltiere.pdf',
 'https://hausdermuseen.ch/images/nmo/angebot/downloads/nmo-dachs-schulunterlagen-24-01-18.pdf#page=31',
 'https://www.waldwissen.net/de/lebensraum-wald/tiere-im-wald/die-kunst-des-faehrtenlesens',
];
const prompts=[
 ['Was ist ein Sohlengänger?','auftritt-sohle',0],
 ['Warum gehört der Dachs zu den Sohlengängern?','auftritt-sohle',0],
 ['Was ist ein Zehengänger?','auftritt-zehen',1],
 ['Wie tritt der Fuchs auf?','auftritt-zehen',1],
 ['Was ist ein Zehenspitzengänger?','auftritt-zehenspitzen',2],
 ['Wie tritt das Reh auf?','auftritt-zehenspitzen',2],
];

test('Natural foot-posture questions return their exact four-option exercise and original sources in CH/AT/DE',()=>{
 const before=JSON.stringify({course,chatPracticeBindings,chatTopicBindings});
 for(const [prompt,suffix,index] of prompts){
  const question=course.questions.find(item=>item.id===`${courseId}-${suffix}`);
  for(const profile of [{country:'CH',region:'ZH'},{country:'AT',region:'S'},{country:'DE',region:'BY'}]){
   const reply=answer(prompt,profile);
   assert.equal(reply.kind,'lesson',prompt);assert.equal(reply.text,lesson.evidence[index].claim,prompt);assert.equal(reply.links[0].href,href);
   assert.equal(reply.practice.id,question.id);assert.equal(reply.practice.prompt,question.q);assert.deepEqual(reply.practice.options,question.answers);
   assert.equal(reply.practice.options.length,4);assert.equal(reply.practice.correctId,question.correct[0]);assert.equal(reply.practice.explanation,question.explain);
   assert.deepEqual(reply.links.filter(item=>item.href.startsWith('https:')).map(item=>item.href),index===2?[sourceURLs[0],sourceURLs[2]]:sourceURLs);
   const link=reply.links.find(item=>item.href.startsWith('/lernen/lernkarten?'));assert.ok(link);
   const query=new URL(link.href,'https://test.invalid').searchParams;assert.equal(query.get('kurs'),courseId);assert.equal(query.get('lektion'),lessonId);
  }
 }
 assert.equal(JSON.stringify({course,chatPracticeBindings,chatTopicBindings}),before,'Reading does not mutate the curriculum or registry');
});

test('All eighteen published bindings and every topic binding remain complete and ordered; only three explicit reviewed pairs follow',()=>{
 const source=execFileSync('git',['show','d81efdd66f3639cb0184316a714d1e88626c3537:lib/jagdlatein-chat-bindings.js'],{cwd:root,encoding:'utf8'}),module={exports:{}};
 const {code}=local('next/dist/build/swc').transformSync(source,{filename:'bindings.js',jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
 new Function('module','exports',code)(module,module.exports);
 assert.equal(module.exports.chatPracticeBindings.length,18);
 assert.deepEqual(chatPracticeBindings.slice(0,18),module.exports.chatPracticeBindings);assert.deepEqual(chatTopicBindings,module.exports.chatTopicBindings);
 assert.equal(chatPracticeBindings.length,21);
 assert.deepEqual(chatPracticeBindings.slice(18).map(item=>[item.courseId,item.lessonId,item.questionId]),['auftritt-sohle','auftritt-zehen','auftritt-zehenspitzen'].map(suffix=>[courseId,lessonId,`${courseId}-${suffix}`]));
});
