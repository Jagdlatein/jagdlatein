const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const css = new Proxy({}, { get: (_, key) => String(key) });
const preserved = {
  "anschuss": {
    "questionsHash": "03ce306742aecdb1776810a65ef23642a4e7cb3405e27763428c507e26e0bb45",
    "introductionHash": "c830e69266c45bca01a80703aa73b82ccb904cee61f8edfc61ed6ee053363e9d"
  },
  "ballistik": {
    "questionsHash": "715f7b3258326a245eb9610a433bf45acf59b50e022a35fb9ca918109f91fe34",
    "introductionHash": "a0afaad4df20c76fd004228c99b94839196e0a82840d9ad112d6a8a2fc9ca445"
  },
  "faehrten": {
    "questionsHash": "651bc89c48a61f5a087f1e4ea77482d7885ad97ae23e3fcd587c8fdf7449f639",
    "introductionHash": "00e5db88fc4299bec6829e40ec249c81894e3e76040e24b2f52c54a347e5e553"
  },
  "fallenjagd": {
    "questionsHash": "d57adf8835f1c7c286c4804329082b7a508f7a7f1778d01ba4b83bcde7dfe1c7",
    "introductionHash": "c8e51285f997869fab32ef8873829bf95a8f2be1166cb4c4341738280d11e532"
  },
  "fallenrecht": {
    "questionsHash": "173a26762dc82c54d5c9361c2139c4f9690b6d9f1ceb9f22b241404ce9978b13",
    "introductionHash": "b2cd39aa7a13653896f5009edcdde021049c22a64919518a1e1bcf50845c39ee"
  },
  "federwild": {
    "questionsHash": "b0d373215141faed00da323faf391f2d385d31943342b100d4164f22def7f1b7",
    "introductionHash": "fbdaddf406812d45a795dd042626e568043ee77366fad97b88c0eb14b97e3cb2"
  },
  "greifvoegel": {
    "questionsHash": "a43fa96a6b316a55b46beaaef19ffd3d95181cddbc9ff47947eb64d73220f327",
    "introductionHash": "767fbfaeef7ebce209261262299b5c4fb7e5173fb747a9caa7188ff491f6523e"
  },
  "jaegersprache": {
    "questionsHash": "f838f3dbf824b1dc7a1b403d1dfb58a2b18099710172610a41f49d6703027e90",
    "introductionHash": "3f84b35484a3276fcef6116f45b631cab6199cf83d14ee07081a318cbfd8cf4c"
  },
  "kleinraubwild": {
    "questionsHash": "4301aa9c71f3924610e66f4e4b8e04bf3c5190071f246a648d0092d9fea1705d",
    "introductionHash": "104c94d139d72a126ce2058671d936add179bdf71c32d57dd97366c5abfb2d8a"
  },
  "lockjagd": {
    "questionsHash": "558ba6a7ca8c70ce6820e0dce23ae7bccbafe8ba01d7e7f676df4593646dac30",
    "introductionHash": "840ffda57488713ed08dea0d48b621a36af312377138b6ed586813ba15deea46"
  },
  "nachtjagd-pro": {
    "questionsHash": "786d5d44c3a23261a79995b5f904f8d18878f827f3f59aa95974fa6d3727fef3",
    "introductionHash": "10fe9682c465e0936d4bc9325e44e7ab473ac12bbe24dae615965f6e6cf68b12"
  },
  "nachtjagd": {
    "questionsHash": "f728c9969ceb3cec4adcc5fcd1e33e45c6b005119343e273655ce5b5937b354b",
    "introductionHash": "753d84a701467e46f85eeb195b3c70010999b47312918f82a1b57c8708526a6f"
  },
  "orientierung-pro": {
    "questionsHash": "17ff3495d66bee99666d47b4edfbebbe7be8dd9e90fada99ecf568673cc1f9e5",
    "introductionHash": "25c1ed3487270e5bb5d442fd61a32f26bffc1fb17b737226c3c6ba6d4236533a"
  },
  "orientierung": {
    "questionsHash": "0045a275665cd1da0de8ecc588efa9b62758abe4fff192d0aab3be193059ca2b",
    "introductionHash": "eb11059e070a64a24d116f8339696b96f1ca665dcb42f3bfa0a53de3bd8d0b22"
  },
  "pirsch": {
    "questionsHash": "dbcdb28405e1870fb549c173a7e036240f0d9cc9899a45f46339563409d6b685",
    "introductionHash": "ed340cf160a6f5f0aeb0b035c8e96ac24b32333a1384075c91a53ca76f2168d5"
  },
  "pruefung": {
    "questionsHash": "6d0ea1f39ac508f32d5356b53ae7817ce3823212841bc8a5e2ea1798e5a60b41",
    "introductionHash": "56fe03d6c584aa72e65caaa31485e87b31880a22d7cee2ea5746932a4d68e7f4"
  },
  "raubwild": {
    "questionsHash": "9357eae312cea300351023e4e98ae0de9c379070aeb17976b049df9285552d00",
    "introductionHash": "e0b7d9f7fa6785b540c8290bb0fae20ed038760853f7ebd6380c2f8aac908cfb"
  },
  "rehwild": {
    "questionsHash": "7429a33a06cf5a09b65a2e3e3dbbb65ac9b159a6c9510d6fd329905679c947de",
    "introductionHash": "01a747914461f5c77b51fd0cbdcd1a160166bd0195a52f721acf96b05eb62a8a"
  },
  "revierplanung": {
    "questionsHash": "4b22227380940e1836aa6480fa32f3fb3fc89dad72849c73c7ee07f055df2bc4",
    "introductionHash": "2d3ae5a6a8df075ef339eeaee3927d7d8aacee632d57f1fbbf870fa8e0e48065"
  },
  "rotwild": {
    "questionsHash": "cd6d7531f6457e9815b3bdf9fd5fe7d61fcd138f151c40ce76f681f4422ae4de",
    "introductionHash": "c56b4498df0f974652f1cbc551e0fc1688547689857aa42d59b8a9ebb349738c"
  },
  "schiessen-basic": {
    "questionsHash": "9ddfee49eab6af859a3231edc508093dc02afd2bee9960aa79860aa279ab335c",
    "introductionHash": "ab07d48264e02dbb3a549fb232166409b827abe075f87c82235a71cf09155974"
  },
  "schiessen-pro": {
    "questionsHash": "60378477ced2f04573847abb574dc6238223c68dfd781f41ea97f466cba152d0",
    "introductionHash": "cd0e5cc58c93827db1221d394fe3afbd09674a9fff556383f3f5d4a45269d9e0"
  },
  "schwarzwild": {
    "questionsHash": "6f0732f437ada28ca9e84d6178124a78b0309bbc5af4c7416546f90a64965287",
    "introductionHash": "70919c4b3966d1308dece6ec1d9350b73ef3d7bfc9dd364ed8a69d484ea5415c"
  },
  "sicherheit": {
    "questionsHash": "1a0759027726320a45ab1147c0f88302e7726cadd0a6a6c5ef86390327c21e27",
    "introductionHash": "513fde6a39761cd4c9f5cd34f36845b228304b34ffc0163365edd772a77d0182"
  },
  "tarnung": {
    "questionsHash": "2148f8e624da526bbf364b1e030002bb950042d2ff95552eddcbdc5b8adb39b6",
    "introductionHash": "03ab519086216ab45d12747261eb67351541e94f958148a7b790364162ca615f"
  },
  "technik": {
    "questionsHash": "4bd4402cbe856ccc8244b8d58ecdf609ee666fc30859f5a62cf7c282542410fd",
    "introductionHash": "d5dcbc0a69b1fbfa0750b82893fc6045f184fdf05057f35d336f741485ca98ac"
  },
  "trittsiegel": {
    "questionsHash": "b170f5a3fa636e315c7f4342ba3143dcf901c0e909ac834b68ab3178007c24ef",
    "introductionHash": "8b32c7446850401ec03d80f85410ea1c6b250049eb1e163305112cb2f0379451"
  },
  "waffen": {
    "questionsHash": "1fdf58e3e80432f95da63dd3d25243f8c063ba6f89f76121ba5621f216f372fa",
    "introductionHash": "59cd566b4770c192adca8e35cbead0b2e7b3e26b034fafee50155420c1d789cd"
  },
  "wasservoegel": {
    "questionsHash": "53d031ffd8228e5390ca5c2788056fc834c23a45ab8c46bafd6b40715dc82161",
    "introductionHash": "f1588090caed7587f3bd4a15a55b9fb5dd4c91ac4a1da5e751d1e774c32bcc67"
  },
  "wetter": {
    "questionsHash": "195e4406ba5f8b7c8ab5c5d2c98c6efcb9e05d99f8359bde2e5d5720be42579e",
    "introductionHash": "0a2b9b92511ee8dc0b48713675bba5b51074e5604c24546b7bf0bd5e79c3a735"
  },
  "wildbiologie": {
    "questionsHash": "f49670c56a6386368db412d8a04a7b54ad640fb254d211e64d0cceaab25adee6",
    "introductionHash": "c8141121a7d3f37e57536a4e8cc84a040c3fbfbe4762dae57ae243dc04647c1a"
  },
  "wildhygiene": {
    "questionsHash": "b749ab06e58115d29d9b129e78c4e5259ee40082e704e10001d552922be7ddc7",
    "introductionHash": "48c5b54771a01464735645f188e69c9922d24286f6f859853627fc6e84aeff03"
  },
  "wildkunde": {
    "questionsHash": "f603d84064266992d1efcc294d13b3242a0e1fe6ea0a2c6282b2fab7f09b921e",
    "introductionHash": "057deda73762bbb52641ebf613e3ad07aa7c4f96e6d0666b7d17a35038578e5f"
  },
  "wildschaeden": {
    "questionsHash": "81c0537245fac042efbe3c677863fa7660ab1fc7b5b43497b4a6ea4e850dc039",
    "introductionHash": "d0d40389a802754d4f37f4d43be7468a255ac01d295489f8a2287e8b04f8df34"
  }
};
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const req = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, cache);
    return req(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function normalizedHtml(children) { return renderToStaticMarkup(React.createElement(React.Fragment, null, children)).replace(/\s+/g, ' ').trim(); }
const cache = new Map();
const { miniCourses } = load('lib/course-catalog.js', {}, cache);
const { miniCourseDetails, getMiniCourseDetails } = load('lib/mini-course-details.js', {}, cache);
const pages = new Map(miniCourses.map(course => {
  const page = load(`pages/kurse/${course.id}.js`, {}, cache);
  const props = page.getStaticProps().props;
  return [course.id, { page, props, element: page.default(props) }];
}));
function walk(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const found = walk(child, predicate); if (found) return found; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : walk(node.props?.children, predicate);
}
function words(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(words).join('');
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function engine() {
  const slots = []; let cursor = 0;
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || !deps || deps.some((value, j) => value !== slots[i].deps?.[j])) { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: callback() }; } },
  }, render(fn) { cursor = 0; return fn(); }, unmount() { for (const slot of slots) slot?.cleanup?.(); } };
}
function setup(id, progressNotice = {}) {
  const e = engine(), calls = [];
  const Component = load('components/MiniCourse.js', { react: e.hooks, '../hooks/useCourseProgress': (courseId, progress) => { calls.push({ courseId, ...progress }); return progressNotice; } }).default;
  const props = pages.get(id).element.props;
  const render = () => e.render(() => Component(props)); let tree = render();
  return { calls, props, get tree() { return tree; }, redraw() { tree = render(); }, html() { return renderToStaticMarkup(tree); }, unmount() { e.unmount(); },
    button(label) { const button = walk(tree, n => n.type === 'button' && words(n).trim() === label); assert.ok(button, `Missing button: ${label}`); return button; },
    click(label) { const button = this.button(label); assert.ok(!button.props.disabled, `Disabled button: ${label}`); button.props.onClick(); tree = render(); },
    choose(index) { this.click(props.questions[this.calls.at(-1).answeredQuestions].antworten[index].text); },
  };
}

test('All 34 original course IDs, 122 question records, answer order and source URLs are preserved', () => {
  assert.equal(miniCourses.length, 34); assert.equal(Object.keys(preserved).length, 34);
  let total = 0;
  for (const course of miniCourses) {
    const { element, props } = pages.get(course.id), questions = element.props.questions;
    assert.equal(element.type.name, 'MiniCourse'); assert.equal(element.props.courseId, course.id);
    assert.equal(props.details.id, course.id); assert.equal(props.details.href, `/kurse/${course.id}`);
    assert.equal(questions.length, course.totalQuestions);
    assert.equal(hash(JSON.stringify(questions)), preserved[course.id].questionsHash, `${course.id}: original quiz content`);
    for (const question of questions) { assert.equal(question.antworten.length, 4); assert.equal(question.antworten.filter(answer => answer.richtig).length, 1); if (question.source) assert.ok(question.source.startsWith('https://')); }
    total += questions.length;
  }
  assert.equal(total, 122);
});

test('Legacy introduction contents and all 25 examination tips survive the common layout', () => {
  for (const course of miniCourses) {
    if (['fallenjagd', 'fallenrecht', 'nachtjagd-pro'].includes(course.id)) continue;
    assert.equal(hash(normalizedHtml(pages.get(course.id).element.props.children)), preserved[course.id].introductionHash, `${course.id}: introduction content`);
  }
  const tips = normalizedHtml(pages.get('pruefung').element.props.children);
  assert.equal((tips.match(/<li>/g) || []).length, 25);
  const anschuss = words(pages.get('anschuss').element.props.children);
  assert.match(anschuss, /Schweiß, Haar, Knochensplitter, Panseninhalt/); assert.match(anschuss, /Nachsuchengespanns/);
});

test('Every mini course has compact static metadata, real existing photos and valid related courses', () => {
  assert.deepEqual(Object.keys(miniCourseDetails).sort(), miniCourses.map(course => course.id).sort());
  for (const course of miniCourses) {
    const details = getMiniCourseDetails(course.id);
    assert.equal(details.category.slug, miniCourseDetails[course.id].category);
    assert.ok(details.modules.length > 0); assert.deepEqual(details.modules.map(module => module.id), miniCourseDetails[course.id].modules); assert.ok(details.photo.src.startsWith('/'));
    assert.ok(fs.existsSync(path.join(root, 'public', details.photo.src)));
    assert.ok(details.photo.credit); if (details.photo.creditUrl) assert.ok(details.photo.creditUrl.startsWith('https://'));
    assert.ok(JSON.stringify(details).length < 4500, `${course.id}: compact static props`);
    for (const module of details.modules) { assert.deepEqual(Object.keys(module).sort(), ['id', 'title']); assert.ok(module.title && module.id.startsWith('wissen-')); }
    const html = renderToStaticMarkup(pages.get(course.id).element);
    assert.ok(html.includes(`/lernen/${details.category.slug}`)); assert.ok(html.includes('Passende Vertiefung'));
    for (const module of details.modules) assert.ok(html.includes(`/kurse/${module.id}`));
    assert.ok(html.includes('Nächste Frage')); assert.ok(!html.includes('country-select'));
  }
  assert.equal(getMiniCourseDetails('invented'), null);
});

test('Wrong answers disclose the correct solution and source while the learner controls progression', () => {
  const s = setup('fallenrecht'), question = s.props.questions[0];
  assert.ok(s.button('Nächste Frage').props.disabled);
  const wrong = question.antworten.findIndex(answer => !answer.richtig);
  s.click(question.antworten[wrong].text);
  assert.match(s.html(), /Noch einmal nachlesen/); assert.ok(s.html().includes(question.antworten.find(answer => answer.richtig).text));
  assert.ok(s.html().includes(question.source)); assert.ok(s.html().includes('Quelle zu dieser Frage öffnen'));
  assert.match(s.html(), /Frage 1 von 2/); assert.match(s.html(), /In der passenden Vertiefung/);
  assert.ok(!s.html().includes('Warum diese Antwort'));
  s.click('Nächste Frage'); assert.match(s.html(), /Frage 2 von 2/);
  assert.equal(s.calls.at(-1).score, 0); assert.equal(s.calls.at(-1).answeredQuestions, 1);
});

test('Double and stale answer/advance events cannot inflate score, skip questions or affect a restarted run', () => {
  const s = setup('ballistik'), questions = s.props.questions;
  const correct = questions[0].antworten.find(answer => answer.richtig).text;
  const wrong = questions[0].antworten.find(answer => !answer.richtig).text;
  const answer = s.button(correct), staleOther = s.button(wrong), premature = s.button('Nächste Frage');
  premature.props.onClick(); assert.equal(s.calls.at(-1).answeredQuestions, 0);
  answer.props.onClick(); answer.props.onClick(); staleOther.props.onClick(); s.redraw();
  assert.equal(s.calls.at(-1).score, 1); assert.equal(s.calls.at(-1).answeredQuestions, 1);
  const advance = s.button('Nächste Frage'); advance.props.onClick(); advance.props.onClick(); answer.props.onClick(); s.redraw();
  assert.match(s.html(), /Frage 2 von 2/); assert.equal(s.calls.at(-1).score, 1);
  s.click(questions[1].antworten.find(a => !a.richtig).text);
  assert.deepEqual(s.calls.at(-1), { courseId: 'ballistik', started: true, answeredQuestions: 2, totalQuestions: 2, score: 1, completed: true });
  s.click('Ergebnis ansehen'); assert.match(s.html(), /1 von 2/); assert.ok(s.html().includes('Alle Antworten prüfen'));
  s.click('Mini-Kurs wiederholen'); answer.props.onClick(); advance.props.onClick(); s.redraw();
  assert.match(s.html(), /Frage 1 von 2/); assert.equal(s.calls.at(-1).answeredQuestions, 0); assert.equal(s.calls.at(-1).score, 0);
  const afterRestart = s.button(correct); s.unmount(); afterRestart.props.onClick(); s.redraw(); assert.equal(s.calls.at(-1).answeredQuestions, 0);
});

test('Progress save errors retain retry and renewal links for the original course route', () => {
  let retries = 0;
  const s = setup('anschuss', { error: { code: 'PROGRESS_UNAVAILABLE' }, retry() { retries++; } });
  assert.match(s.html(), /Kursfortschritt konnte gerade nicht gespeichert/);
  const notice = walk(s.tree, n => n.type?.name === 'CourseProgressNotice'); assert.equal(notice.props.courseId, 'anschuss'); notice.props.retry(); assert.equal(retries, 1);
  const expired = setup('anschuss', { error: { code: 'SESSION_RENEWAL_REQUIRED' } });
  assert.ok(expired.html().includes('/login?reauth=1&amp;next=%2Fkurse%2Fanschuss'));
});

test('Reviewed legacy introductions use local legal requirements and distinguish thermal detection from safe identification', () => {
  for (const id of ['fallenrecht', 'fallenjagd']) {
    const html = normalizedHtml(pages.get(id).element.props.children);
    assert.ok(html.includes('https://www.gesetze-bayern.de/Content/Document/BayAVJG-12a'));
    assert.match(html, /örtlichen/); assert.ok(!html.includes('tägliche Kontrolle')); assert.ok(!html.includes('mindestens einmal täglich'));
  }
  const thermal = normalizedHtml(pages.get('nachtjagd-pro').element.props.children);
  assert.ok(!thermal.includes('ermöglichen eine zuverlässige Wildansprache'));
  assert.match(thermal, /Wärmequellen/); assert.match(thermal, /Schussfeld und Kugelfang/); assert.match(thermal, /Unsicherheit/);
});

test('The Next.js client transform removes full metadata imports from every mini-course page', () => {
  for (const course of miniCourses) {
    const filename = path.join(root, 'pages/kurse', course.id + '.js');
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'es6' } });
    assert.ok(code.includes('__N_SSG'), course.id + ': static page marker');
    assert.ok(code.includes('components/MiniCourse'));
    assert.ok(!code.includes('mini-course-details'), course.id + ': server metadata dependency excluded');
    assert.ok(!code.includes('getStaticProps'));
  }
});

test('Course overview static props contain every mini/detailed course once with valid categories, routes and accurate counts', () => {
  const overview = load('pages/kurse/index.js', {}, cache).getStaticProps().props;
  const { learningModules } = load('lib/learning-curriculum.js', {}, cache);
  const { learningCategoryDetails } = load('lib/learning-categories.js', {}, cache);
  const { courses } = load('lib/course-catalog.js', {}, cache);
  const moduleById = new Map(learningModules.map(module => [module.id, module]));
  const categoryByTitle = new Map(learningCategoryDetails.map(category => [category.title, category.slug]));
  assert.equal(overview.miniCount, miniCourses.length); assert.equal(overview.detailedCount, learningModules.length);
  assert.equal(overview.courses.length, overview.miniCount + overview.detailedCount);
  assert.deepEqual(overview.courses.map(course => course.id).sort(), courses.map(course => course.id).sort());
  assert.equal(new Set(overview.courses.map(course => course.href)).size, overview.courses.length);
  for (const course of overview.courses) {
    assert.deepEqual(Object.keys(course).sort(), ['category', 'description', 'format', 'href', 'id', 'title', 'totalQuestions']);
    assert.ok(learningCategoryDetails.some(category => category.slug === course.category), course.id + ': defined category');
    assert.equal(course.href, `/kurse/${course.id}`); assert.ok(Number.isInteger(course.totalQuestions) && course.totalQuestions > 0);
    if (miniCourseDetails[course.id]) {
      assert.equal(course.format, 'mini'); assert.equal(course.category, miniCourseDetails[course.id].category);
      assert.equal(course.totalQuestions, pages.get(course.id).element.props.questions.length);
      assert.ok(fs.existsSync(path.join(root, 'pages/kurse', course.id + '.js')));
    } else {
      assert.equal(course.format, 'detailed'); const module = moduleById.get(course.id); assert.ok(module);
      assert.equal(course.category, categoryByTitle.get(module.category)); assert.equal(course.totalQuestions, module.questions.length);
      assert.ok(fs.existsSync(path.join(root, 'pages/kurse/[slug].js')));
    }
  }
  assert.deepEqual(new Set(overview.courses.map(course => course.category)), new Set(learningCategoryDetails.map(category => category.slug)));
  assert.ok(!JSON.stringify(overview).includes('"lessons"')); assert.ok(!JSON.stringify(overview).includes('"answers"'));
});

test('Course overview combines category, format and text filters, accepts umlaut variants and resets empty selections', () => {
  const e = engine();
  const overview = load('pages/kurse/index.js', { react: e.hooks });
  const props = overview.getStaticProps().props;
  const render = () => e.render(() => overview.default(props)); let tree = render();
  function cards() {
    const result = [];
    function visit(node) { if (Array.isArray(node)) node.forEach(visit); else if (node && typeof node === 'object') { if (node.type === 'article') result.push(node); visit(node.props?.children); } }
    visit(tree); return result;
  }
  function hrefs() { return cards().map(card => walk(card, node => typeof node.props?.href === 'string' && node.props.href.startsWith('/kurse/')).props.href); }
  function change(label, value) { const parent = walk(tree, node => node.type === 'label' && words(node).startsWith(label)); assert.ok(parent, label); const field = walk(parent, node => node.type === 'input' || node.type === 'select'); field.props.onChange({ target: { value } }); tree = render(); }
  function reset() { const button = walk(tree, node => node.type === 'button' && words(node) === 'Auswahl zurücksetzen'); assert.ok(button); button.props.onClick(); tree = render(); }
  assert.equal(cards().length, props.courses.length);
  assert.match(words(walk(tree, node => node.props?.role === 'status')), new RegExp(`${props.courses.length} von ${props.courses.length}`));
  change('Lernformat', 'mini'); assert.equal(cards().length, props.miniCount);
  change('Kategorie', 'wildkunde'); assert.deepEqual(hrefs(), props.courses.filter(course => course.format === 'mini' && course.category === 'wildkunde').map(course => course.href));
  change('Kurse durchsuchen', 'Rehwild'); assert.deepEqual(hrefs(), ['/kurse/rehwild']);
  reset(); change('Lernformat', 'detailed'); assert.equal(cards().length, props.detailedCount);
  change('Kategorie', 'hundewesen'); assert.ok(cards().length >= 5); assert.deepEqual(hrefs(), props.courses.filter(course => course.format === 'detailed' && course.category === 'hundewesen').map(course => course.href)); assert.ok(hrefs().includes('/kurse/wissen-nachsuche'));
  change('Lernformat', 'mini'); assert.equal(cards().length, 0); assert.match(words(tree), /Keine passenden Kurse gefunden/);
  reset(); assert.equal(cards().length, props.courses.length);
  for (const [accented, transliterated] of [['Jägersprache', 'Jaegersprache'], ['Fährten', 'Faehrten'], ['Wärmebild', 'Waermebild']]) {
    change('Kurse durchsuchen', accented); const expected = hrefs(); assert.ok(expected.length > 0, accented);
    change('Kurse durchsuchen', transliterated); assert.deepEqual(hrefs(), expected, transliterated);
  }
  change('Kurse durchsuchen', 'zzznichtvorhanden'); assert.equal(cards().length, 0); reset(); assert.equal(cards().length, props.courses.length);
});

test('The course overview client transform excludes full curriculum and server-only course metadata imports', () => {
  const filename = path.join(root, 'pages/kurse/index.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'es6' } });
  assert.ok(code.includes('__N_SSG')); assert.ok(code.includes('LearningToolLayout'));
  for (const dependency of ['learning-curriculum', 'course-catalog', 'mini-course-details', 'getStaticProps']) assert.ok(!code.includes(dependency), dependency + ': excluded from client');
});