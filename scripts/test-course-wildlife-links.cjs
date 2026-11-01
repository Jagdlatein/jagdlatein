// Reciprocal navigation reuses exact authored associations, not inferred
// biological relationships. Synthetic scope edits never change product data.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { getCourseWildlifeLinks: project } = load('lib/course-wildlife-links-server.js');
const { getWildlifeLearningGuide: guide } = load('lib/wildlife-learning-guide.js');
const { wildYearCatalog: inventory } = load('lib/wild-year-catalog.js');
const { jawModelsBySlug } = load('lib/wildlife-jaw-models.js');
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { animalSounds } = load('lib/animal-sounds.js');
const Links = load('components/CourseWildlifeLinks.js').default;
const moduleKeys = ['slug', 'name', 'lessonIds', 'portraitHref', 'yearHref', 'modelHref', 'soundLinks'].sort();

test('Every reciprocal association matches an existing species-scoped guide target and never reverses generic foundations', () => {
  const snapshot = JSON.stringify(learningModules), covered = [], species = new Set();
  let associations = 0, maximum = 0;
  for (const module of learningModules) {
    const links = project(module);
    const expected = inventory.filter(species => guide(species.slug).some(target => target.scope === 'species' && target.moduleId === module.id));
    assert.deepEqual(links.map(link => link.slug).sort(), expected.map(item => item.slug).sort(), module.id);
    if (links.length) covered.push(module.id);
    maximum = Math.max(maximum, links.length); associations += links.length;
    for (const link of links) {
      species.add(link.slug); assert.deepEqual(Object.keys(link).sort(), moduleKeys);
      const target = guide(link.slug).find(target => target.scope === 'species' && target.moduleId === module.id);
      assert.ok(target); assert.equal(link.name, inventory.find(item => item.slug === link.slug).name);
      assert.deepEqual(link.lessonIds, target.lessonId ? [target.lessonId] : null);
    }
    assert.deepEqual(JSON.parse(JSON.stringify(links)), links);
    assert.ok(Buffer.byteLength(JSON.stringify(links), 'utf8') < 2048, module.id);
  }
  assert.equal(covered.length, 14); assert.equal(associations, 34); assert.equal(species.size, 27); assert.equal(maximum, 6);
  assert.deepEqual(project(getLearningModule('wissen-ausbau-biologie-vogelkoerper-2026')), []);
  assert.deepEqual(project(getLearningModule('wissen-ausbau-wildtiergenetik-2026')), []);
  assert.equal(JSON.stringify(learningModules), snapshot);
});

test('Feldhase and Ringeltaube appear only at their exact unique blinddarm and kropfmilch lessons', () => {
  const module = getLearningModule('wissen-ausbau-biologie-verdauungsvergleich-2026'), links = project(module);
  assert.equal(links.length, 2); assert.deepEqual(links.find(link => link.slug === 'feldhase').lessonIds, ['blinddarm']); assert.deepEqual(links.find(link => link.slug === 'ringeltaube').lessonIds, ['kropfmilch']);
  for (const lesson of module.lessons) {
    const tree = Links({ links, lessonId: lesson.id });
    const visible = nodes(tree, node => node.props?.['data-course-wildlife']).map(node => node.props['data-course-wildlife']);
    assert.deepEqual(visible, lesson.id === 'blinddarm' ? ['feldhase'] : lesson.id === 'kropfmilch' ? ['ringeltaube'] : [], lesson.id);
    const sounds = nodes(tree, node => node.props?.href?.startsWith('/lernen/tierstimmen?')).map(node => node.props.href);
    assert.deepEqual(sounds, lesson.id === 'kropfmilch' ? ['/lernen/tierstimmen?stimme=ringeltaube#tierstimme-title'] : [], `${lesson.id}: only the displayed species has sound links`);
  }
  for (const id of ['prefix-blinddarm', 'blinddarm-suffix', 'Blinddarm', 'unknown']) assert.deepEqual(project({ ...module, lessons: [{ id }] }), []);
  assert.deepEqual(project({ ...module, lessons: [{ id: 'blinddarm' }, { id: 'blinddarm' }] }), []);
  const broad = getLearningModule('wissen-vertiefung-wild-kleine-beutegreifer'), all = project(broad);
  assert.equal(all.length, 6); assert.ok(all.every(link => link.lessonIds === null));
  for (const lesson of broad.lessons) assert.equal(nodes(Links({ links: all, lessonId: lesson.id }), node => node.props?.['data-course-wildlife']).length, 6);
});

test('Eleven courses expose all exact recorded-species matches as 23 minimal links to 18 existing recordings', () => {
  const covered = [], recordings = new Set(); let associations = 0;
  for (const module of learningModules) {
    const links = project(module);
    if (links.some(link => link.soundLinks.length)) covered.push(module.id);
    for (const link of links) {
      const expected = animalSounds.filter(sound => sound.speciesSlug === link.slug);
      assert.deepEqual(link.soundLinks, expected.map(sound => ({ title: `${sound.name}: ${sound.call}`, href: `/lernen/tierstimmen?stimme=${encodeURIComponent(sound.id)}#tierstimme-title` })), `${module.id}:${link.slug}`);
      associations += link.soundLinks.length;
      for (const sound of link.soundLinks) {
        assert.deepEqual(Object.keys(sound).sort(), ['href', 'title']);
        assert.doesNotMatch(JSON.stringify(sound), /\.mp3|"src"|"options"|"explanation"|"questions"|"answer"/);
        const url = new URL(sound.href, 'https://jagdlatein.invalid');
        assert.equal(url.origin, 'https://jagdlatein.invalid'); assert.equal(url.pathname, '/lernen/tierstimmen'); assert.equal(url.hash, '#tierstimme-title');
        assert.deepEqual([...url.searchParams.keys()], ['stimme']);
        const original = animalSounds.find(item => item.id === url.searchParams.get('stimme'));
        assert.ok(original && original.speciesSlug === link.slug, `${module.id}:${sound.href}`);
        recordings.add(original.id);
      }
    }
  }
  assert.equal(covered.length, 11); assert.equal(associations, 23); assert.equal(recordings.size, 18);
  for (const [moduleId, slug, expected] of [
    ['wissen-rotwild-sozialverhalten', 'rotwild', 'rothirsch'],
    ['wissen-rehwild-jahreslauf', 'rehwild', 'rehbock'],
    ['wissen-gams-steinbock', 'gamswild', 'gams'],
  ]) assert.deepEqual(project(getLearningModule(moduleId)).find(link => link.slug === slug).soundLinks.map(sound => new URL(sound.href, 'https://jagdlatein.invalid').searchParams.get('stimme')), [expected]);
  assert.deepEqual(project(getLearningModule('wissen-ausbau-hasenartige')).flatMap(link => link.soundLinks), []);
});

test('All 37 original recording objects remain byte-for-byte identical through metadata projection', () => {
  assert.equal(animalSounds.length, 37);
  const before = JSON.stringify(animalSounds);
  assert.equal(createHash('sha256').update(before).digest('hex'), 'b44d90339a2d84a253ec2fa8273edd063801e1d72c32c13d8236c2aef11ced47');
  for (const module of learningModules) project(module);
  assert.equal(JSON.stringify(animalSounds), before);
});

test('Unknown courses and malformed module inputs produce no fallback species or empty menu section', () => {
  for (const input of [undefined, null, {}, { id: 'unknown', lessons: [{ id: 'a' }] }, { id: 'constructor', lessons: [{ id: 'a' }] }, { id: 'wissen-rehwild-jahreslauf' }, { id: 'wissen-rehwild-jahreslauf', lessons: [] }]) assert.deepEqual(project(input), []);
  assert.equal(Links({}), null); assert.equal(Links({ links: [], lessonId: 'unknown' }), null);
});

test('Each portrait anchor exists in the actual portrait topic registry; Wildjahr and3D links retain exact species scope', () => {
  const Portrait = load('components/WildlifePortraitLayout.js').default;
  for (const module of learningModules) for (const link of project(module)) {
    const portrait = new URL(link.portraitHref, 'https://example.invalid');
    const target = guide(link.slug).find(target => target.scope === 'species' && target.moduleId === module.id);
    assert.equal(portrait.pathname, `/wildkunde/${link.slug}`); assert.equal(portrait.hash, `#${target.topicId || `art-lerntext-${module.id}`}`);
    const tree = Portrait({ slug: link.slug, children: React.createElement('section', null, React.createElement('h2', null, 'Originale Merkmale')) });
    const reader = nodes(tree, node => node.type?.name === 'TopicSectionReader')[0];
    assert.ok(reader.props.groups.flatMap(group => group.topics).some(topic => '#' + topic.id === portrait.hash));
    assert.equal(link.yearHref, `/lernen/wildjahr?art=${link.slug}`);
    assert.equal(link.modelHref, jawModelsBySlug[link.slug] ? `/lernen/kiefer-3d?art=${link.slug}` : null);
  }
});

test('Actual198-course SSG props project only minimal links and retain the exact original module, flashcards and lesson photos', () => {
  const page = load('pages/kurse/[slug].js'), flashcards = load('lib/learning-flashcards.js'), photos = load('lib/lesson-photos-server.js');
  assert.deepEqual(page.getStaticPaths().paths.map(item => item.params.slug), learningModules.map(module => module.id));
  for (const module of learningModules) {
    const result = page.getStaticProps({ params: { slug: module.id } });
    assert.deepEqual(Object.keys(result.props).sort(), ['module', 'flashcards', 'wildlifeLinks', 'miniCourseLinks', 'glossaryLinks', 'oralExamLinks', 'practiceLinks', 'lessonPhotos'].sort());
    assert.equal(result.props.module, module); assert.deepEqual(result.props.flashcards, flashcards.getFlashcardLessonSummary(module.id)); assert.deepEqual(result.props.wildlifeLinks, project(module));
    assert.deepEqual(page.default(result.props).props.wildlifeLinks, result.props.wildlifeLinks);
    assert.deepEqual(result.props.lessonPhotos, photos.getCourseLessonPhotos(module));
  }
  assert.deepEqual(page.getStaticProps({ params: { slug: 'unknown' } }), { notFound: true });
});

test('The stateless menu uses short internal links without preloading, dialogs, controls, sources or new state', () => {
  const links = project(getLearningModule('wissen-vertiefung-wild-kleine-beutegreifer')), tree = Links({ links, lessonId: 'unused' });
  assert.equal(text(nodes(tree, node => node.type === 'h3')[0]), 'Arten');
  assert.equal(nodes(tree, node => node.props?.['data-course-wildlife']).length, 6);
  const navigation = nodes(tree, node => typeof node.props?.href === 'string');
  const sounds = links.flatMap(link => link.soundLinks.map(sound => ({ ...sound, species: link.name })));
  for (const link of navigation) {
    const sound = sounds.find(sound => sound.href === link.props.href);
    if (sound) { assert.equal(text(link), `Tierstimme: ${sound.title}`); assert.equal(link.props['aria-label'], `${sound.species}: ${sound.title}`); }
    else assert.ok(['Artenwissen', 'Wildjahr', '3D'].includes(text(link)));
    assert.equal(link.props.prefetch, false); assert.equal(link.props.target, undefined); assert.match(link.props.href, /^\/(wildkunde|lernen)\//); assert.ok(link.props['aria-label'].includes(': '));
  }
  assert.equal(navigation.length, links.reduce((sum, link) => sum + 2 + Number(!!link.modelHref) + link.soundLinks.length, 0));
  assert.equal(nodes(tree, node => ['details', 'dialog', 'button', 'select', 'input', 'form'].includes(node.type)).length, 0);
  const SSR = createLoader({ 'next/link': ({ href, children, prefetch, ...rest }) => React.createElement('a', { href, ...rest }, children) })('components/CourseWildlifeLinks.js').default;
  const html = renderToStaticMarkup(React.createElement(SSR, { links, lessonId: 'unused' }));
  assert.match(html, /data-course-wildlife-links/); assert.doesNotMatch(html, /<details|<dialog|target=|Quellen|Wissen prüfen|<audio\b|<source\b|<track\b|\.mp3/);
});

test('The page client transform removes server-only projection and the new presentation imports no corpus or question source', () => {
  const filename = path.join(root, 'pages/kurse/[slug].js');
  const swc = local('next/dist/build/swc');
  const transformed = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code;
  assert.doesNotMatch(transformed, /course-wildlife-links-server|learning-curriculum|learning-flashcards/);
  assert.match(transformed, /__N_SSG/);
  const source = fs.readFileSync(path.join(root, 'components/CourseWildlifeLinks.js'), 'utf8');
  assert.doesNotMatch(source, /course-wildlife-links-server|wildlife-learning-guide|wild-year-catalog|european-wildlife|learning-curriculum|animal-sounds|animalSound|useState|useEffect|fetch\(/);
  const course = fs.readFileSync(path.join(root, 'components/LearningCourse.js'), 'utf8');
  assert.doesNotMatch(course, /course-wildlife-links-server|wildlife-learning-guide|wild-year-catalog|european-wildlife|learning-curriculum|animal-sounds|animalSound/);
});

test('The actual course owner filters the current lesson inside its existing PageMenu and keeps learning, quiz and closed sources intact', () => {
  const module = getLearningModule('wissen-ausbau-biologie-verdauungsvergleich-2026'), wildlifeLinks = project(module), slots = []; let cursor = 0;
  const hooks = { ...React, useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; }, useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; }, useEffect() {} };
  const router = { isReady: true, asPath: `/kurse/${module.id}` }, PageMenu = () => null;
  const reader = createLoader({ react: hooks, 'next/router': { useRouter: () => router }, '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() {} } })('components/LearningCourse.js').default({ module, wildlifeLinks }).type;
  const render = () => { cursor = 0; return reader({ module, wildlifeLinks }); };
  let tree = render();
  for (let index = 0; index < module.lessons.length; index++) {
    if (index) { nodes(tree, node => node.props?.id === 'lesson-selection')[0].props.onChange({ target: { value: String(index) } }); tree = render(); }
    const menu = nodes(tree, node => node.type === PageMenu)[0], child = nodes(menu, node => node.type?.name === 'CourseWildlifeLinks')[0];
    assert.ok(child); assert.equal(child.props.lessonId, module.lessons[index].id); assert.equal(Links(child.props) !== null, ['blinddarm', 'kropfmilch'].includes(module.lessons[index].id));
    assert.equal(nodes(tree, node => node.type?.name === 'CourseWildlifeLinks').length, 1);
    const lesson = nodes(tree, node => node.type === 'article' && node.props?.['aria-labelledby'] === 'current-lesson-heading')[0];
    for (const paragraph of module.lessons[index].paragraphs) assert.ok(text(lesson).includes(paragraph));
    const details = nodes(tree, node => node.type === 'details'), sources = details.find(node => node.props.id === 'quellen');
    assert.equal(details.at(-1), sources); assert.equal(sources.props.open, false); assert.ok(nodes(tree, node => node.props?.id === 'wissenscheck').length);
  }
});
