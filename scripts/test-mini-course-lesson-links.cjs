const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader(), { miniCourses } = load('lib/course-catalog.js');
const { miniCourseLessonTargets, getMiniCourseDetails } = load('lib/mini-course-details.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const expected = {
  greifvoegel: [{ moduleId: 'wissen-ausbau-biologie-verdauungsvergleich-2026', lessonId: 'gewoelle' }],
  federwild: [{ moduleId: 'wissen-ausbau-biologie-verdauungsvergleich-2026', lessonId: 'gewoelle' }],
  waffen: [{ moduleId: 'wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026', lessonId: 'zuendungsarten' }],
  ballistik: [{ moduleId: 'wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026', lessonId: 'zuendungsarten' }],
};

test('Only four explicitly authored lesson links complement all 34 otherwise exact a0a6563 metadata objects', () => {
  assert.deepEqual(miniCourseLessonTargets, expected);
  const preserved = miniCourses.map(course => { const { lessonLinks, ...old } = getMiniCourseDetails(course.id); return old; });
  assert.equal(preserved.length, 34);
  assert.equal(createHash('sha256').update(JSON.stringify(preserved)).digest('hex'), '91c932491fbd1e9fcb4fa6937167507691825b4170f085120e48f77102833439');
  for (const course of miniCourses) assert.equal(Object.hasOwn(getMiniCourseDetails(course.id), 'lessonLinks'), Object.hasOwn(expected, course.id));
  assert.equal(getMiniCourseDetails('unknown'), null);
});

test('Each exact native target and title comes from a real unique current lesson, without copied content or answers', () => {
  for (const [id, targets] of Object.entries(expected)) {
    const details = getMiniCourseDetails(id); assert.equal(details.lessonLinks.length, targets.length);
    for (const [index, target] of targets.entries()) {
      const module = getLearningModule(target.moduleId), lessons = module.lessons.filter(lesson => lesson.id === target.lessonId);
      assert.equal(lessons.length, 1);
      assert.deepEqual(details.lessonLinks[index], { ...target, title: lessons[0].title, href: `/kurse/${module.id}#lesson-${target.lessonId}` });
      const page = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: module.id } }).props;
      assert.ok(page.module.lessons.some(lesson => lesson.id === target.lessonId));
    }
    assert.ok(JSON.stringify(details).length < 4500);
    for (const field of ['answers', 'correct', 'paragraphs', 'sourceUrls', 'account', 'email']) assert.equal(details.lessonLinks.some(link => Object.hasOwn(link, field)), false);
  }
});

test('All 34 static mini-course pages carry only the intended optional small lesson-link projection', () => {
  for (const course of miniCourses) {
    const page = load(`pages/kurse/${course.id}.js`), props = page.getStaticProps().props;
    assert.deepEqual(props.details, getMiniCourseDetails(course.id));
    const element = page.default(props); assert.equal(element.props.courseId, course.id);
    assert.deepEqual(element.props.details.lessonLinks, getMiniCourseDetails(course.id).lessonLinks);
  }
});

test('Mini-course client transforms exclude metadata, full curriculum and static-props machinery for every page', () => {
  const swc = local('next/dist/build/swc');
  for (const course of miniCourses) {
    const filename = path.join(root, `pages/kurse/${course.id}.js`);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'es6' } });
    assert.ok(code.includes('__N_SSG')); assert.ok(code.includes('MiniCourse'));
    for (const dependency of ['mini-course-details', 'learning-curriculum', 'miniCourseLessonTargets', 'getStaticProps']) assert.ok(!code.includes(dependency), `${course.id}: ${dependency}`);
  }
});
