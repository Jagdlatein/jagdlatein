const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {createLoader,local,root}=require('./helpers/project-module.cjs');
const load=createLoader(),courseId='wissen-ausbau-federaufbau-funktion-2026',href=`/kurse/${courseId}#lesson-alula`;
const {answerJagdlateinQuestion:answer}=load('lib/jagdlatein-chat.js');
const {getLearningModule}=load('lib/learning-curriculum.js');
const {chatPracticeBindings,chatTopicBindings}=load('lib/jagdlatein-chat-bindings.js');
const course=getLearningModule(courseId),lesson=course.lessons.find(x=>x.id==='alula');

test('Natural Alula questions return the exact anatomical or functional four-answer exercise for CH/AT/DE',()=>{
  const before=JSON.stringify({course,chatPracticeBindings,chatTopicBindings});
  for(const [prompt,suffix,index] of [['Was ist der Daumenfittich?','alula-lage',0],['Wo sitzt die Alula?','alula-lage',0],['Welche Funktion hat die Alula?','alula-funktion',1],['Funktion des Daumenfittichs','alula-funktion',1]]){
    const q=course.questions.find(q=>q.id===`${courseId}-${suffix}`);
    for(const profile of [{country:'CH',region:'ZH'},{country:'AT',region:'S'},{country:'DE',region:'BY'}]){
      const reply=answer(prompt,profile);assert.equal(reply.kind,'lesson',prompt);assert.equal(reply.text,lesson.evidence[index].claim,prompt);assert.equal(reply.links[0].href,href);
      assert.equal(reply.practice.id,q.id);assert.equal(reply.practice.prompt,q.q);assert.deepEqual(reply.practice.options,q.answers);assert.equal(reply.practice.correctId,q.correct[0]);assert.equal(reply.practice.explanation,q.explain);assert.equal(reply.practice.options.length,4);
      assert.deepEqual(reply.links.filter(l=>l.href.startsWith('https:')).map(l=>l.href),lesson.evidence[index].sources.map(s=>new URL(s.url).href));
      const card=reply.links.find(l=>l.href.startsWith('/lernen/lernkarten?'));assert.ok(card);const query=new URL(card.href,'https://test.invalid').searchParams;assert.equal(query.get('kurs'),courseId);assert.equal(query.get('lektion'),'alula');
    }
  }
  assert.equal(JSON.stringify({course,chatPracticeBindings,chatTopicBindings}),before);
});

test('All pre-Alula chat bindings remain complete and ordered; both reviewed Alula pairs retain their published positions',()=>{
  const source=execFileSync('git',['show','c5a015713b2fc7181af09f1dfca23bc57be53730:lib/jagdlatein-chat-bindings.js'],{cwd:root,encoding:'utf8'}),module={exports:{}};
  const {code}=local('next/dist/build/swc').transformSync(source,{filename:'bindings.js',jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
  new Function('module','exports',code)(module,module.exports);
  const before=module.exports.chatPracticeBindings;
  assert.deepEqual(chatPracticeBindings.slice(0,before.length),before);assert.deepEqual(chatTopicBindings,module.exports.chatTopicBindings);
  assert.deepEqual(chatPracticeBindings.slice(before.length,before.length+2).map(x=>[x.courseId,x.lessonId,x.questionId]),['alula-lage','alula-funktion'].map(x=>[courseId,'alula',`${courseId}-${x}`]));
});
