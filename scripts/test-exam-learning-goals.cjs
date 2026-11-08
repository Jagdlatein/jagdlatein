const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
// The plan's reading focus uses a ready bare Next route; account readiness is still tested independently.
const createLoader = (overrides = {}) => createProjectLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {}, asPath: '/lernen/pruefungsplan' }) }, ...overrides });
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { learningCategoryDetails, getLearningCategoryByTitle } = load('lib/learning-categories.js');
const { lessonHash, lessonIndexFromHash } = load('lib/learning-lesson-navigation.js');
const { getLearningNavigationLabel } = load('lib/learning-navigation-labels.js');
const { examCountries, examProfileLawHref } = load('lib/exam-profile.js');
const { oralExamQuestions } = load('lib/oral-exam-trainer.js');
const { projectExamLearningGoal } = load('lib/exam-learning-goal-server.js');
const RAW_PATH = '../data/exam-alignment/learning-goals-2026-11-01.json';
const BASELINE = '514b51091325bf27ecdd53458f78b00854e4a7d3';
const clone = value => JSON.parse(JSON.stringify(value));
const raw = () => JSON.parse(fs.readFileSync(path.join(root, 'data/exam-alignment/learning-goals-2026-11-01.json'), 'utf8'));
const blueprint = () => createLoader()('lib/exam-blueprint-server.js').getExamBlueprintData();
function fixture(change = () => {}, courseTransform = course => course) {
  const data = raw(); change(data);
  return createLoader({ [RAW_PATH]: data, './learning-curriculum': { learningModules, getLearningModule(id) { const course = getLearningModule(id); return course ? courseTransform(clone(course)) : null; } } })('lib/exam-blueprint-server.js').getExamBlueprintData();
}
const goalFixture = extra => ({ id: 'independent-goal', title: 'Sicherheitsentscheidung begründen', task: 'Erkläre deine Entscheidung an einem eigenen Fall.', selfCheck: ['Beobachtung und Schluss getrennt', 'Offene Voraussetzung benannt'], moduleId: 'wissen-waffensicherheit', lessonId: 'regeln', ...extra });
function Link({ href, children, prefetch, ...props }) { return React.createElement('a', { href, ...props }, children); }
function uiLoader(overrides = {}) { return createLoader({ 'next/link': { __esModule: true, default: Link }, ...overrides }); }
function goalHtml(goal, profile) { const Component = uiLoader()('components/ExamLearningGoals.js').ExamLearningGoal; return renderToStaticMarkup(React.createElement(Component, { goal, profile })); }
function categoryHtml(category, profile) { const Component = uiLoader()('components/ExamLearningGoals.js').default; return renderToStaticMarkup(React.createElement(Component, { category, profile })); }
function fullPlan(profile, options = {}) {
  const useProfile = () => ({ profile, ready: true, persistence: 'device', ...options });
  const api = uiLoader({ '../lib/use-exam-profile': { __esModule: true, default: useProfile }, './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} } });
  return renderToStaticMarkup(React.createElement(api('components/ExamStudyPlan.js').default, { data: load('lib/exam-study-plan-server.js').getExamStudyPlanData(), examBlueprint: blueprint() }));
}
function hrefs(markup) { return [...markup.matchAll(/href="([^"]*)"/g)].map(match => match[1].replace(/&amp;/g, '&')); }
const escaped = value => renderToStaticMarkup(React.createElement('span', null, value)).replace(/^<span>|<\/span>$/g, '');

test('The actual blueprint keeps the canonical twelve categories and36 bounded unique lesson goals', () => {
  const before = JSON.stringify(raw()), data = blueprint();
  assert.deepEqual(Object.keys(data).sort(), ['categories', 'sources']);
  assert.deepEqual(data.categories.map(category => category.slug), learningCategoryDetails.map(category => category.slug));
  const goals = data.categories.flatMap(category => category.goals);
  assert.equal(goals.length, 36); assert.equal(new Set(goals.map(goal => goal.id)).size, 36);
  for (const category of data.categories) {
    assert.deepEqual(Object.keys(category).sort(), ['goals', 'practiceCase', 'slug']); assert.equal(category.goals.length, 3);
    for (const goal of category.goals) {
      const authored=raw().categories.find(item=>item.slug===category.slug).goals.find(item=>item.id===goal.id);
      const cards=load('lib/learning-flashcards.js').getFlashcardExport({courseId:authored.moduleId,lessonId:authored.lessonId}).cards;
      const cardKeys=!goal.regionalLaw&&goal.lessonPractice&&cards.length?['cardCount','cardHref']:[];
      const relatedKeys=goal.id==='natur-biotopnetz'?['relatedLessons']:[];
      assert.deepEqual(Object.keys(goal).sort(), ['courseTitle','href','id','lessonPractice','lessonTitle','quizHref','regionalLaw','selfCheck','sourceIds','sourceScope','task','title',...cardKeys,...relatedKeys].sort());
      if(cardKeys.length){assert.equal(goal.cardCount,cards.length);assert.equal(goal.cardHref,`/lernen/lernkarten?kurs=${authored.moduleId}&lektion=${authored.lessonId}`);}
      assert.ok(goal.id && goal.title && goal.task && goal.selfCheck && goal.sourceIds.length);
      assert.ok(['lesson','course'].includes(goal.sourceScope));
    }
  }
  assert.equal(JSON.stringify(raw()), before);
  assert.doesNotMatch(JSON.stringify(data), /"(?:model|mistake|criteria|answers|choices|questions|lessons|paragraphs|transcript|correctIndex|correctIds)"\s*:/);
});

test('Every authored goal points to its exact existing lesson, while regional law receives no generic course fallback', () => {
  const source = raw(), data = blueprint(); let regional = 0, direct = 0;
  for (const category of data.categories) for (const goal of category.goals) {
    const authored = source.categories.find(item => item.slug === category.slug).goals.find(item => item.id === goal.id);
    const course = getLearningModule(authored.moduleId), lesson = course?.lessons.find(item => item.id === authored.lessonId);
    assert.ok(course && lesson && lesson.paragraphs.length); assert.equal(getLearningCategoryByTitle(course.category).slug, category.slug);
    assert.deepEqual([...course.countries].sort(), ['AT','CH','DE']);
    assert.equal(goal.courseTitle, getLearningNavigationLabel(course)); assert.equal(goal.lessonTitle, lesson.title);
    assert.equal(goal.title, authored.title); assert.equal(goal.task, authored.task); assert.deepEqual(goal.selfCheck, authored.selfCheck);
    if (category.slug === 'jagdrecht' || authored.regionalLaw === true) {
      regional++; assert.equal(goal.regionalLaw, true); assert.equal(goal.href, null); assert.equal(goal.quizHref, null);
    } else {
      direct++; const url = new URL(goal.href, 'https://jagdlatein.test');
      assert.equal(url.pathname, `/kurse/${course.id}`); assert.equal(url.hash, lessonHash(lesson.id));
      assert.equal(lessonIndexFromHash(course.lessons, url.hash), course.lessons.indexOf(lesson));
      const shared = question => [...question.countries].sort().join(',') === 'AT,CH,DE' && question.topic !== 'Recht';
      assert.equal(goal.quizHref, course.questions.every(shared) ? `/kurse/${course.id}#wissenscheck` : null);
    }
    const selectedQuestions = course.questions.filter(question => question.lessonId === lesson.id);
    assert.equal(goal.lessonPractice, !goal.regionalLaw && selectedQuestions.length > 0 && selectedQuestions.every(question => [...question.countries].sort().join(',') === 'AT,CH,DE' && question.topic !== 'Recht'));
  }
  assert.ok(regional >= 3 && direct > 0);
});

test('Malformed authored text and selection references fail before a React child or invented target can be projected', () => {
  for (const change of [{id:['array-id']},{id:'UPPER'},{title:{}},{title:42},{title:'   '},{task:[]},{task:true},{selfCheck:{}},{selfCheck:2},{selfCheck:[]},{selfCheck:['ok',{}]},{selfCheck:['']},{regionalLaw:'yes'},{moduleId:'missing-course'},{lessonId:'missing-lesson'}]) {
    assert.throws(() => projectExamLearningGoal(goalFixture(change)), /Prüfungslernziel|Lektionsbezug/, JSON.stringify(change));
  }
  assert.throws(() => projectExamLearningGoal(goalFixture(), { country:'UNKNOWN' }), /Lektionsbezug/);
  assert.throws(() => projectExamLearningGoal(goalFixture(), { categorySlug:'wildkunde' }), /Lektionsbezug/);
});

test('The goal projection keeps authored string or array criteria and strips supplied answers, bodies and external destinations', () => {
  const authored = goalFixture({ href:'https://other.invalid/private', quizHref:'javascript:alert(1)', model:'HIDDEN_MODEL', paragraphs:['HIDDEN_BODY'], answers:[{correct:true}] });
  const before = JSON.stringify(authored), goal = projectExamLearningGoal(authored, { country:'DE', categorySlug:'waffen-sicherheit' });
  assert.equal(JSON.stringify(authored), before); assert.deepEqual(goal.selfCheck, authored.selfCheck);
  assert.equal(goal.href, '/kurse/wissen-waffensicherheit#lesson-regeln');
  assert.equal(goal.quizHref, null, 'the existing Waffensicherheit course contains a national/legal question and must not advertise a shared whole-course check');
  const shared = projectExamLearningGoal(goalFixture({moduleId:'wissen-kugelfang',lessonId:'hintergrund'}));
  assert.equal(shared.quizHref, '/kurse/wissen-kugelfang#wissenscheck');
  assert.doesNotMatch(JSON.stringify(goal), /HIDDEN_|other\.invalid|javascript:|answers|paragraphs/);
  assert.equal(projectExamLearningGoal(goalFixture({selfCheck:'Eigene Erklärung ohne Vorlage.'})).selfCheck, 'Eigene Erklärung ohne Vorlage.');
  const law = getLearningModule('wissen-ausbau-rechtsquellen');
  const forced = projectExamLearningGoal(goalFixture({ moduleId:law.id, lessonId:law.lessons[0].id, regionalLaw:false }));
  assert.equal(forced.regionalLaw,true); assert.equal(forced.href,null); assert.equal(forced.quizHref,null);
});

test('Existing oral question objects remain byte-for-byte equivalent in content and only eleven exact prompt/follow-up projections are added', () => {
  const original = execFileSync('git',['show',`${BASELINE}:lib/oral-exam-trainer.js`],{cwd:root,encoding:'utf8'});
  const {code} = local('next/dist/build/swc').transformSync(original,{filename:path.join(root,'lib/oral-exam-trainer.js'),disableNextSsg:true,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
  const module = {exports:{}}; new Function('module','exports',code)(module,module.exports);
  assert.deepEqual(oralExamQuestions,module.exports.oralExamQuestions); assert.equal(oralExamQuestions.length,20);
  const source = raw(), data = blueprint(), cases=data.categories.filter(category=>category.practiceCase);
  assert.equal(cases.length,11);
  for (const category of cases) {
    const id = source.categories.find(item=>item.slug===category.slug).caseQuestionId;
    const originalQuestion=oralExamQuestions.find(item=>item.id===id && item.categorySlug===category.slug);
    assert.ok(originalQuestion); assert.notEqual(category.slug,'jagdrecht');
    assert.deepEqual(category.practiceCase,{id:originalQuestion.id,text:originalQuestion.prompt,followUp:originalQuestion.followUp,href:`/lernen/pruefungsgespraech?kategorie=${category.slug}&eintrag=${originalQuestion.id}`});
    assert.ok(!JSON.stringify(data).includes(originalQuestion.model));
  }
  assert.equal(data.categories.find(category=>category.slug==='jagdrecht').practiceCase,null);
});

test('Missing, duplicate or wrong-category goals and cases cannot silently become the first available example', () => {
  assert.throws(()=>fixture(data=>data.categories.pop()),/Prüfungslerngebiete/);
  assert.throws(()=>fixture(data=>{data.categories[1].slug=data.categories[0].slug;}),/Prüfungslerngebiete/);
  assert.throws(()=>fixture(data=>data.categories[0].goals.pop()),/Prüfungslernziele/);
  assert.throws(()=>fixture(data=>{data.categories[1].goals[0].id=data.categories[0].goals[0].id;}),/Doppeltes/);
  assert.throws(()=>fixture(data=>{data.categories[0].goals[0].moduleId='missing-course';}),/Lektionsbezug/);
  assert.throws(()=>fixture(data=>{data.categories[0].caseQuestionId='missing-question';}),/Übungsfall/);
  assert.throws(()=>fixture(data=>{data.categories[0].caseQuestionId=oralExamQuestions.find(item=>item.categorySlug==='hundewesen').id;}),/Übungsfall/);
  assert.throws(()=>fixture(data=>{data.categories.find(item=>item.slug==='jagdrecht').caseQuestionId='rechtsebenen';}),/Übungsfall/);
});

test('Lesson evidence wins over course sources; fallback course references remain scoped to the selected lesson', () => {
  const authored=raw().categories.find(item=>item.slug==='wildkunde').goals[0];
  const exact={label:'Independent exact lesson source',url:'https://example.org/lesson-evidence'};
  const global={label:'Course-wide source',url:'https://example.org/course-wide'};
  const scoped={label:'This lesson source',url:'https://example.org/this-lesson',lessonIds:[authored.lessonId]};
  const other={label:'Another lesson only',url:'https://example.org/not-this-lesson',lessonIds:['definitely-another-lesson']};
  function transform(exactEvidence) { return course=>{
    if(course.id!==authored.moduleId)return course;
    course.sources=[global,scoped,other]; const lesson=course.lessons.find(item=>item.id===authored.lessonId);
    lesson.evidence=exactEvidence?[{sources:[exact]}]:[]; return course;
  }; }
  function urls(data) { const goal=data.categories.find(item=>item.slug==='wildkunde').goals[0];return goal.sourceIds.map(id=>data.sources.find(source=>source.id===id).url).sort(); }
  const lessonProjection=fixture(undefined,transform(true)),courseProjection=fixture(undefined,transform(false));
  assert.deepEqual(urls(lessonProjection),[exact.url]);
  assert.deepEqual(urls(courseProjection),[global.url,scoped.url].sort());
  assert.equal(lessonProjection.categories.find(item=>item.slug==='wildkunde').goals[0].sourceScope,'lesson');
  assert.equal(courseProjection.categories.find(item=>item.slug==='wildkunde').goals[0].sourceScope,'course');
});

test('Source dates inherit the actual lesson date then valid course date, never the new feature date or an impossible calendar day', () => {
  const authored=raw().categories.find(item=>item.slug==='wildkunde').goals[0];
  const scenarios=[['2026-10-13','2026-10-16','2026-10-13'],['2026-02-30','2026-10-16','2026-10-16'],[undefined,undefined,'']];
  for(const [lessonDate,courseDate,expected] of scenarios){
    const data=fixture(undefined,course=>{if(course.id!==authored.moduleId)return course;course.reviewedOn=courseDate;const lesson=course.lessons.find(item=>item.id===authored.lessonId);lesson.reviewedOn=lessonDate;lesson.evidence=[{sources:[{label:'Date boundary source',url:'https://example.org/date-boundary'}]}];return course;});
    const goal=data.categories.find(item=>item.slug==='wildkunde').goals[0];
    for(const id of goal.sourceIds)assert.equal(data.sources.find(source=>source.id===id).reviewedOn,expected);
  }
});

test('Shared goals require all three actual DACH countries and trustworthy nonempty lesson-source addresses', () => {
  const authored=raw().categories[0].goals[0];
  for(const countries of [['DE'],['DE','DE','DE'],['DE','AT','UNKNOWN']])assert.throws(()=>fixture(undefined,course=>course.id===authored.moduleId?{...course,countries}:course),/Regionaler Stoff|Lektionsbezug/);
  for(const url of ['http://example.org/insecure','https://user:password@example.org/private','not-a-url'])assert.throws(()=>fixture(undefined,course=>{if(course.id!==authored.moduleId)return course;course.lessons.find(item=>item.id===authored.lessonId).evidence=[{sources:[{label:'Bad source',url}]}];return course;}));
  assert.throws(()=>fixture(undefined,course=>{if(course.id!==authored.moduleId)return course;course.sources=[];course.lessons.find(item=>item.id===authored.lessonId).evidence=[];return course;}),/Lektionsnachweise/);
});

test('Actual category SSR shows complete authored objectives and criteria before the exact existing practice case, without a model or new controls', () => {
  const data=blueprint();
  for(const category of data.categories){
    const markup=categoryHtml(category,{country:'DE',region:'BY'});
    for(const goal of category.goals){assert.ok(markup.includes(escaped(goal.title)));assert.ok(markup.includes(escaped(goal.task)));for(const check of Array.isArray(goal.selfCheck)?goal.selfCheck:[goal.selfCheck])assert.ok(markup.includes(escaped(check)));}
    assert.doesNotMatch(markup,/<form|<select|<input|<button|target="_blank"|<details/);
    if(category.practiceCase){assert.ok(markup.includes(escaped(category.practiceCase.text)));assert.ok(markup.includes(escaped(category.practiceCase.followUp)));assert.ok(markup.indexOf('Übungsfall')>markup.indexOf(escaped(category.goals.at(-1).task)));assert.ok(hrefs(markup).includes(category.practiceCase.href));}
  }
});

test('Regional legal goals use each of the51 exact explicit profiles and copy no incidental private properties into destinations', () => {
  const goal=blueprint().categories.find(category=>category.slug==='jagdrecht').goals[0];
  assert.equal(goal.href,null); assert.equal(goal.quizHref,null);
  for(const country of examCountries)for(const region of country.regions){
    const profile={country:country.code,region:region.code,notes:'PRIVATE_NOTE_MUST_STAY_OFF_URL',email:'private@example.invalid'};
    const markup=goalHtml(goal,profile);
    assert.deepEqual(hrefs(markup),[examProfileLawHref(profile),examProfileLawHref(profile,'uebung')]);
    assert.doesNotMatch(markup,/PRIVATE_NOTE|private@example|\/kurse\/wissen-jagdrecht|region=BUND/);
  }
});

test('Invalid or absent legal profiles offer the selection hint and never use a supplied generic or foreign-country fallback', () => {
  const goal={...blueprint().categories.find(category=>category.slug==='jagdrecht').goals[0],href:'/jagdrecht/de?region=BY',quizHref:'/kurse/wissen-jagdrecht-de#wissenscheck'};
  const inherited=Object.create({country:'DE',region:'BY'});
  for(const profile of [null,{},[],{country:'DE',region:'ZZ'},{country:'AT',region:'BY'},{country:'DE',region:['BY']},{country:['DE'],region:'BY'},inherited]){
    const markup=goalHtml(goal,profile);assert.deepEqual(hrefs(markup),[]);assert.match(markup,/Prüfungsziel im unteren Menü/);
  }
  const standard=blueprint().categories.find(category=>category.slug!=='jagdrecht').goals.find(goal=>!goal.regionalLaw);
  assert.ok(hrefs(goalHtml(standard,null)).includes(standard.href));
});

test('An unready saved profile cannot leak regional legal destinations anywhere in the complete plan', () => {
  const markup=fullPlan({country:'AT',region:'NOE'},{ready:false});
  const sharedLearning=markup.slice(markup.indexOf('id="exam-plan-learning"'),markup.indexOf('id="exam-plan-practice"'));
  assert.match(sharedLearning,/Prüfungsziel im unteren Menü/);
  assert.ok(!hrefs(sharedLearning).some(href=>/^\/jagdrecht\/(ch|at|de)\?/.test(href)));
  assert.ok(!hrefs(markup).some(href=>/^\/jagdrecht\/(ch|at|de)\?/.test(href)));
  for(const goal of blueprint().categories.flatMap(category=>category.goals))assert.ok(sharedLearning.includes(escaped(goal.task)));
});

test('A selected lesson or whole-course check is not advertised as shared practice when its actual questions are legal or country-specific', () => {
  const base = getLearningModule('wissen-waffensicherheit');
  function project(questionChange) {
    const course=clone(base), question=course.questions.find(item=>item.lessonId==='regeln');
    assert.ok(question); Object.assign(question,questionChange);
    return createLoader({'./learning-curriculum':{learningModules,getLearningModule(id){return id===course.id?course:getLearningModule(id);}}})('lib/exam-learning-goal-server.js').projectExamLearningGoal(goalFixture());
  }
  for(const change of [{countries:['DE']},{countries:['DE','DE','DE']},{countries:['DE','AT','UNKNOWN']},{topic:'Recht'}]){
    const goal=project(change);assert.equal(goal.lessonPractice,false,JSON.stringify(change));assert.equal(goal.quizHref,null,JSON.stringify(change));
    assert.match(goal.href,/#lesson-regeln$/);
    const markup=goalHtml(goal,{country:'CH',region:'ZH'});assert.doesNotMatch(markup,/Lektion lesen &amp; üben|Kurscheck/);
  }
});

test('Optional own case prompts and complementary lessons keep exact safe anchors without answers or a second selection window', () => {
  const authored=goalFixture({caseText:'Eigener Fall ohne vorgegebene Lösung.',followUp:'Welche Angabe fehlt?',relatedLessons:[{moduleId:'wissen-kugelfang',lessonId:'hintergrund'}]});
  const goal=projectExamLearningGoal(authored,{country:'DE'});
  assert.equal(goal.caseText,authored.caseText);assert.equal(goal.followUp,authored.followUp);
  assert.deepEqual(goal.relatedLessons,[{courseTitle:getLearningNavigationLabel(getLearningModule('wissen-kugelfang')),lessonTitle:getLearningModule('wissen-kugelfang').lessons.find(item=>item.id==='hintergrund').title,href:'/kurse/wissen-kugelfang#lesson-hintergrund'}]);
  const markup=goalHtml(goal,{country:'DE',region:'BY'});assert.match(markup,/Eigener Übungsfall/);assert.match(markup,/Welche Angabe fehlt/);assert.ok(hrefs(markup).includes(goal.relatedLessons[0].href));
  assert.doesNotMatch(markup,/target="_blank"|<form|<select|<input|<button/);
  for(const change of [{caseText:{}},{followUp:[]},{relatedLessons:[{moduleId:'missing',lessonId:'missing'}]},{relatedLessons:[{moduleId:'wissen-ausbau-rechtsquellen',lessonId:getLearningModule('wissen-ausbau-rechtsquellen').lessons[0].id}]}])assert.throws(()=>projectExamLearningGoal(goalFixture(change),{country:'DE'}));
});

test('The54 regional subject areas retain all exact authored lessons, own cases and complementary anchors for only the nine evidenced profiles', () => {
  const expected=new Map([['CH:ZH',7],['CH:BE',6],['CH:GR',5],['DE:BY',6],['DE:BB',6],['DE:HE',4],['CH:AR',9],['AT:NOE',4],['AT:ST',7]]);
  const data=load('lib/exam-alignment-server.js').getExamAlignmentData();
  const authored=['ch','at','de'].flatMap(country=>JSON.parse(fs.readFileSync(path.join(root,`data/exam-alignment/${country}-2026-11-01.json`),'utf8')).regions);
  let count=0,complementary=0,ownCases=0;
  for(const region of data.regions){
    const key=`${region.country}:${region.region}`,original=authored.find(item=>item.country===region.country&&item.region===region.region);
    if(!expected.has(key)){assert.equal(region.subjectAreas,undefined);continue;}
    assert.equal(region.subjectAreas.length,expected.get(key));
    for(const area of region.subjectAreas){
      count++;const rawArea=original.subjectAreas.find(item=>item.id===area.id);assert.ok(rawArea);
      assert.equal(area.label,rawArea.label);assert.equal(area.limit,rawArea.limit);assert.deepEqual(area.sourceIds,rawArea.sourceIds);
      const sourceIds=new Set(region.sources.map(source=>source.id));assert.ok(area.sourceIds.every(id=>sourceIds.has(id)));
      for(const goal of area.goals){
        const rawGoal=rawArea.goals.find(item=>item.id===goal.id);assert.ok(rawGoal);const course=getLearningModule(rawGoal.moduleId),lesson=course.lessons.find(item=>item.id===rawGoal.lessonId);
        assert.ok(lesson&&course.countries.includes(region.country));assert.equal(goal.task,rawGoal.task);assert.deepEqual(goal.selfCheck,rawGoal.selfCheck);
        assert.equal(goal.lessonTitle,lesson.title);
        assert.equal(goal.href,goal.regionalLaw?null:`/kurse/${course.id}${lessonHash(lesson.id)}`);
        if(rawGoal.caseText){ownCases++;assert.equal(goal.caseText,rawGoal.caseText);}else assert.equal(goal.caseText,undefined);
        if(rawGoal.followUp)assert.equal(goal.followUp,rawGoal.followUp);
        for(const [i,target] of (rawGoal.relatedLessons||[]).entries()){
          complementary++;const related=getLearningModule(target.moduleId),relatedLesson=related.lessons.find(item=>item.id===target.lessonId);assert.ok(relatedLesson&&related.countries.includes(region.country));
          assert.equal(goal.relatedLessons[i].href,`/kurse/${related.id}${lessonHash(relatedLesson.id)}`);assert.equal(goal.relatedLessons[i].lessonTitle,relatedLesson.title);
        }
        const markup=goalHtml(goal,region);if(goal.regionalLaw)assert.ok(hrefs(markup).includes(examProfileLawHref(region)));
      }
    }
  }
  assert.equal(count,54);assert.ok(complementary>0&&ownCases>0);
});

test('Full plan SSR keeps the exact learning text and self-checks above closed final sources and states their real limits', () => {
  const data=blueprint(),markup=fullPlan({country:'DE',region:'BY'});
  const sources=markup.indexOf('id="exam-plan-sources"'),goalSources=markup.indexOf('id="exam-plan-goal-sources"');
  assert.ok(sources>markup.indexOf('Praxis und örtliche Vorgaben'));assert.ok(goalSources>sources);
  const start=markup.lastIndexOf('<details',sources);assert.doesNotMatch(markup.slice(start,markup.indexOf('>',sources)+1),/\sopen(?:\s|=|>)/);
  for(const goal of data.categories.flatMap(category=>category.goals))assert.ok(markup.indexOf(escaped(goal.task))<sources);
  for(const source of data.sources){assert.ok(markup.indexOf(escaped(source.title),goalSources)>goalSources);assert.ok(markup.indexOf(escaped(source.url),goalSources)>goalSources);}
  const finalSourceText=markup.slice(goalSources);
  assert.match(finalSourceText,/Lektionszuordnung/);assert.match(finalSourceText,/Kursreferenz/);
  assert.match(finalSourceText,/keine neue externe Quellenlektüre oder vollständige Fachprüfung sämtlicher Lernziele/);
  assert.match(markup,/Kurscheck umfasst auch andere Lektionen/);assert.match(markup,/keine amtlichen Bestehensregeln/);
  assert.equal((markup.match(/<form\b/g)||[]).length,1);
});

test('SSG exposes only the compact blueprint and erases build-time curriculum, question banks and raw research imports from the client', () => {
  const props=load('pages/lernen/pruefungsplan.js').getStaticProps().props;assert.deepEqual(props.examBlueprint,blueprint());
  const filename=path.join(root,'pages/lernen/pruefungsplan.js');
  const {code}=local('next/dist/build/swc').transformSync(fs.readFileSync(filename,'utf8'),{filename,isPageFile:true,disableNextSsg:false,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  assert.match(code,/__N_SSG/);assert.doesNotMatch(code,/exam-blueprint-server|exam-learning-goal-server|learning-curriculum|oral-exam-trainer|learning-goals-2026-11-01/);
  const ui=fs.readFileSync(path.join(root,'components/ExamLearningGoals.js'),'utf8');assert.doesNotMatch(ui,/learning-curriculum|oral-exam-trainer|localStorage|sessionStorage|window\.open|router\.(?:push|replace)/);
});
