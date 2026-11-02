const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path'), {execFileSync} = require('node:child_process');
const {createLoader, local, root} = require('./helpers/project-module.cjs');
const BASELINE = '8b12ce6253ce9bc090aad2c47bd660e5b2280002';
const actual = createLoader();
const {learningModules} = actual('lib/learning-curriculum.js');
const {unpackDailyReviewCatalog} = actual('lib/daily-review-catalog.js');
const query = (id, countries, extra = {}) => ({id, countries, lessonId:'scope-lesson', topic:'Wildkunde', q:`Own synthetic question ${id}`, answers:[{id:'a',text:'Synthetic A'},{id:'b',text:'Synthetic B'}], correct:['a'], explain:'Own synthetic explanation.', ...extra});
function course(questions, category = 'Wildkunde') {
  return {id:'scope-course',title:'Own synthetic scope course',category,countries:['DE','AT','CH'],lessons:[{id:'scope-lesson',title:'Own synthetic lesson',paragraphs:['Own synthetic reading.']}],sources:[{label:'Synthetic source',url:'https://example.invalid/own-scope-fixture'}],questions};
}
function fixture(courses) {
  return createLoader({'./learning-curriculum':{learningModules:courses}})('lib/daily-review-pool.js');
}

test('Only each actual DACH country once qualifies as shared knowledge, independently of array order', () => {
  const valid = [['DE','AT','CH'],['DE','CH','AT'],['AT','DE','CH'],['AT','CH','DE'],['CH','DE','AT'],['CH','AT','DE']];
  const invalid = [['DE'],['AT','CH'],['DE','AT','CH','DE'],['DE','DE','DE'],['DE','AT','UNKNOWN'],['DE','AT','ch'],['DE','AT',''],['DE','AT',null],[],null,undefined,'DACH',{length:3,includes:()=>true}];
  const questions = [...valid.map((countries,index)=>query(`scope-shared-${index}`,countries)),...invalid.map((countries,index)=>query(`scope-rejected-${index}`,countries))];
  const api=fixture([course(questions)]);
  assert.deepEqual(api.getDailyReviewPool().map(item=>item.id),valid.map((_,index)=>`scope-shared-${index}`));
  assert.deepEqual(api.getDailyReviewCatalog(),valid.map((_,index)=>({id:`scope-shared-${index}`,category:'wildkunde'})));
});

test('The question-specific scope and existing legal exclusions prevail over a shared course label', () => {
  const shared=query('scope-shared',['DE','AT','CH']);
  const foreign=query('scope-foreign',['DE','DE','DE']);
  const legal=query('scope-legal',['DE','AT','CH'],{topic:'Recht'});
  const legalCourse=course([query('scope-law-course',['DE','AT','CH'])],'Jagdrecht');
  const api=fixture([course([shared,foreign,legal]),legalCourse]);
  assert.deepEqual(api.getDailyReviewPool().map(item=>item.id),['scope-shared']);
  assert.throws(()=>api.getDailyReviewQuestions(['scope-foreign']),/Wiederholungsfragen/);
  assert.throws(()=>api.getDailyReviewQuestions(['scope-legal']),/Wiederholungsfragen/);
  assert.throws(()=>api.getDailyReviewQuestions(['scope-law-course']),/Wiederholungsfragen/);
  assert.deepEqual(api.getDailyReviewQuestions(['scope-shared']).map(item=>item.id),['scope-shared']);
});

test('Filtering cannot mutate authored countries, questions, readings or source objects', () => {
  const authored=course([query('scope-frozen-shared',Object.freeze(['DE','AT','CH'])),query('scope-frozen-rejected',Object.freeze(['DE','AT','UNKNOWN']))]);
  const before=JSON.stringify(authored);
  for(const question of authored.questions){Object.freeze(question.answers);Object.freeze(question.correct);Object.freeze(question);}
  Object.freeze(authored.questions);Object.freeze(authored);
  const api=fixture([authored]),pool=api.getDailyReviewPool();
  assert.deepEqual(pool.map(item=>item.id),['scope-frozen-shared']);
  assert.equal(JSON.stringify(authored),before);
  assert.deepEqual(unpackDailyReviewCatalog(api.getPackedDailyReviewCatalog()),api.getDailyReviewCatalog());
  assert.deepEqual(api.getDailyReviewQuestions([pool[0].id]),pool);
});

test('Every real maintained question already has exact shared scope and the entire prior pool remains semantically identical', () => {
  const source=execFileSync('git',['show',`${BASELINE}:lib/daily-review-pool.js`],{cwd:root,encoding:'utf8'});
  const {code}=local('next/dist/build/swc').transformSync(source,{filename:path.join(root,'lib/daily-review-pool.js'),disableNextSsg:true,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>id.startsWith('.')?actual(path.join('lib',path.extname(id)?id:`${id}.js`)):local(id),module,module.exports);
  const oldPool=module.exports.getDailyReviewPool(),nextPool=actual('lib/daily-review-pool.js').getDailyReviewPool();
  assert.ok(nextPool.length>2000);
  assert.deepEqual(nextPool,oldPool);
  const questions=new Map(learningModules.flatMap(item=>item.questions.map(question=>[question.id,question])));
  for(const item of nextPool){const question=questions.get(item.id);assert.ok(question);assert.deepEqual([...question.countries].sort(),['AT','CH','DE']);assert.notEqual(question.topic,'Recht');}
  assert.deepEqual(actual('lib/daily-review-pool.js').getDailyReviewCatalog(),module.exports.getDailyReviewCatalog());
  assert.deepEqual(actual('lib/daily-review-pool.js').getPackedDailyReviewCatalog(),module.exports.getPackedDailyReviewCatalog());
});
