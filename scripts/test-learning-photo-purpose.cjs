const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader({
  'next/link': ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children),
  'next/head': ({ children }) => children,
  'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
  'next/router': { useRouter: () => ({ isReady: true, asPath: '/kurse/test', query: {} }) },
  '../hooks/useCourseProgress': () => ({}),
});
const { learningModules } = load('lib/learning-curriculum.js');
const { getLearningMedia, coursePhotoUses, breedPictures } = load('lib/learning-media.js');
const byId = Object.fromEntries(learningModules.map(module => [module.id, module]));
const Course = load('components/LearningCourse.js').default;

test('Only an audited, actually illustrated course/lesson receives a course photo; imageKey/category alone is insufficient', () => {
  assert.equal(Object.keys(coursePhotoUses).length, 14);
  for (const [id, use] of Object.entries(coursePhotoUses)) {
    const module = byId[id]; assert.ok(module, id);
    assert.ok(module.lessons.some(lesson => lesson.id === use.lessonId), `${id}: actual teaching placement`);
    assert.ok(use.purpose.length > 35, `${id}: concrete visual purpose`);
    const media = getLearningMedia(module);
    assert.deepEqual(media.coursePhotoUse, use);
    assert.ok(media.src && media.credit && media.creditUrl);
    assert.ok(media.pictures?.length || ['wissen-vertiefung-hunde-vorstehrassen', 'wissen-vertiefung-hunde-retriever-spaniels'].includes(id));
  }
  for (const module of learningModules.filter(module => !Object.hasOwn(coursePhotoUses, module.id))) {
    assert.equal(getLearningMedia(module)?.coursePhotoUse, undefined, module.id);
  }
  assert.equal(getLearningMedia({ id: 'not-curated', category: 'Wildkunde', imageKey: 'wildkunde' }).coursePhotoUse, undefined);
  assert.equal(getLearningMedia(byId['wissen-rotwild-sozialverhalten']).coursePhotoUse, undefined, 'An individual stag does not illustrate group relationships');
});

test('Overview summaries and actual cards omit category fallback photos, while twelve category orientation photos remain', () => {
  const getData = load('lib/learning-overview-server.js').getLearningOverviewData;
  const Overview = load('components/LearningOverview.js').default;
  const data = getData();
  for (const module of data.modules) {
    if (Object.hasOwn(coursePhotoUses, module.id)) assert.ok(data.covers[module.coverIndex]?.coursePhotoUse, module.id);
    else assert.equal(module.coverIndex, null, module.id);
  }
  assert.equal(Object.keys(data.categoryCovers).length, 12);
  for (const index of Object.values(data.categoryCovers)) assert.ok(data.covers[index]?.src);
  const html = renderToStaticMarkup(React.createElement(Overview, { data }));
  assert.equal((html.match(/class="photoLink"/g) || []).length, Object.keys(coursePhotoUses).length);
  assert.equal((html.match(/class="photo"/g) || []).length, 12);
  assert.ok(data.covers.every(photo => !photo.pictures && !photo.diagram && !photo.lessons && !photo.questions));
});

test('Text and abstract biology courses open directly with knowledge and retain real lesson diagrams', () => {
  for (const id of ['wissen-rotwild-sozialverhalten', 'wissen-ausbau-biologie-wiederkaeuer-2026', 'wissen-ausbau-anwendung-biologische-ebenen-2026']) {
    const module = byId[id]; assert.ok(module, id);
    const html = renderToStaticMarkup(React.createElement(Course, { module }));
    assert.doesNotMatch(html, /<img/, `${id}: no generic hero`);
    assert.ok(html.includes(module.lessons[0].title));
    assert.ok(html.includes(module.lessons[0].paragraphs[0].slice(0, 60)));
    if (module.lessons[0].diagram) assert.match(html, /<svg/, `${id}: actual teaching diagram retained`);
  }
});

test('Purposeful single photos follow their lesson text, disappear for unrelated lessons and preserve exact photo credit', () => {
  const module = byId['wissen-rehwild-jahreslauf'];
  const html = renderToStaticMarkup(React.createElement(Course, { module }));
  const media = getLearningMedia(module);
  assert.match(html, /<img/);
  assert.ok(html.indexOf('class="lessonText"') < html.indexOf('<img'), 'Knowledge precedes its teaching photograph');
  assert.ok(html.includes(media.src) && html.includes(media.creditUrl));
  const otherLesson = { ...module, lessons: [module.lessons[1], module.lessons[0], module.lessons[2]] };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Course, { module: otherLesson })), /<img/, 'The same animal photo must not decorate the Keimruhe/Kitz lesson');
});

test('Real species comparison and dog breed galleries remain, without an additional duplicate hero', () => {
  const wildlife = byId['wissen-gams-steinbock'];
  const media = getLearningMedia(wildlife);
  const html = renderToStaticMarkup(React.createElement(Course, { module: wildlife }));
  assert.match(html, /Wildarten dieser Lerneinheit im Bild/);
  assert.equal((html.match(/<img/g) || []).length, media.pictures.length);
  for (const photo of media.pictures) assert.ok(html.includes(photo.src) && html.includes(photo.creditUrl));
  const breeds = renderToStaticMarkup(React.createElement(Course, { module: byId['wissen-vertiefung-jagdhunderassen'] }));
  assert.match(breeds, /Jagdhunderassen im Bild/);
  assert.equal((breeds.match(/<img/g) || []).length, breedPictures.length);
});

test('Featured previews require a concrete teaching-medium purpose; research and short-review entries remain text links', () => {
  const previews = load('lib/learning-featured-media.js').learningFeaturedMedia;
  assert.equal(Object.keys(previews).length, 5);
  for (const href of ['/lernen/wissen-fuers-revier', '/lernen/forschung-verstehen', '/lernen/fuenf-minuten']) assert.equal(previews[href], undefined);
  for (const photo of Object.values(previews)) assert.ok(photo.purpose && photo.src && photo.creditUrl);
  const data = load('lib/learning-overview-server.js').getLearningOverviewData('natur-revier');
  const Overview = load('components/LearningOverview.js').default;
  const html = renderToStaticMarkup(React.createElement(Overview, { data }));
  for (const href of ['/lernen/wissen-fuers-revier', '/lernen/forschung-verstehen', '/lernen/fuenf-minuten']) {
    const card = [...html.matchAll(/<article class="featuredCard">([\s\S]*?)<\/article>/g)].map(match => match[1]).find(card => card.includes(`href="${href}"`));
    assert.ok(card, href); assert.doesNotMatch(card, /<img|class="featuredCredit"/, href);
  }
});
