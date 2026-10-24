const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { readFlashcardSelection, matchesFlashcardSelection } = load('lib/flashcard-selection.js');
const { getFlashcardExport, getFlashcardLessonSummary } = load('lib/learning-flashcards.js');
const { packFlashcards, unpackFlashcards } = load('lib/flashcard-payload.js');
const courseId = 'wissen-ausbau-hund-ruhe-schlaf-2026';
const scope = { courseId, lessonId: 'messung' };
const actual = getFlashcardExport(scope);
const route = '/lernen/lernkarten';
const uiOverrides = {
  'next/router': { useRouter: () => ({ query: {}, isReady: true, asPath: route }) },
  'next/head': ({ children }) => React.createElement(React.Fragment, null, children),
  'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname + '?' + new URLSearchParams(href.query) }, children),
};

test('Course and lesson route selection is exact, bounded and rejects arrays, duplicate keys and orphan lessons', () => {
  assert.equal(readFlashcardSelection({}), null);
  assert.deepEqual(readFlashcardSelection({ kurs: courseId, lektion: 'messung' }), scope);
  assert.deepEqual(readFlashcardSelection(new URLSearchParams({ kurs: courseId })), { courseId, lessonId: '' });
  for (const query of [{ kurs: [] }, { kurs: [courseId, courseId] }, { lektion: 'messung' }, { kurs: '../secret' }, { kurs: '<script>' }, { kurs: courseId, lektion: '' }, { kurs: courseId, lektion: 'x'.repeat(200) }]) assert.deepEqual(readFlashcardSelection(query), { invalid: true });
  assert.deepEqual(readFlashcardSelection(new URLSearchParams(`kurs=${courseId}&kurs=${courseId}`)), { invalid: true });
});

test('Every real scoped export keeps only exact course/lesson cards, sources and honest counts', () => {
  const all = getFlashcardExport().cards;
  for (const id of new Set(all.filter(card => card.kind !== 'photo').map(card => card.moduleId))) {
    const subset = getFlashcardExport({ courseId: id, lessonId: '' });
    const expected = all.filter(card => card.moduleId === id);
    assert.deepEqual(subset.cards, expected);
    assert.equal(subset.categories.reduce((sum, category) => sum + category.count, 0), expected.length);
    assert.ok(!subset.selection.invalid);
    const summary = getFlashcardLessonSummary(id);
    assert.equal(summary.total, expected.length);
    assert.equal(Object.values(summary.lessons).reduce((sum, n) => sum + n, 0), expected.length);
    assert.ok(Object.values(summary.lessons).every(n => Number.isInteger(n) && n > 0));
    assert.deepEqual(Object.keys(summary).sort(), ['lessons', 'total']);
  }
  assert.ok(actual.cards.length > 0);
  assert.ok(actual.cards.every(card => card.moduleId === courseId && card.lessonId === scope.lessonId));
  assert.equal(actual.selection.returnHref, `/kurse/${courseId}#lesson-messung`);
  assert.deepEqual(unpackFlashcards(packFlashcards(actual)), actual);
  for (const selection of [{ invalid: true }, { courseId: 'missing-course', lessonId: '' }, { courseId, lessonId: 'missing-lesson' }]) {
    const missing = getFlashcardExport(selection);
    assert.equal(missing.cards.length, 0);
    assert.ok(missing.selection.invalid);
  }
});

test('Private server-rendered lesson selections immediately contain their complete small bank and never global photo cards', async () => {
  for (const filename of ['pages/lernen/lernkarten.js', 'pages/lernen/lernkarten-drucken.js']) {
    const headers = {};
    const context = { req: {}, res: { setHeader: (key, value) => headers[key] = value }, query: { kurs: courseId, lektion: scope.lessonId }, resolvedUrl: route + '?kurs=' + courseId + '&lektion=messung' };
    const signed = createLoader({ ...uiOverrides, '../../lib/account-access': { getPaidPageProps: async received => { assert.equal(received, context); received.res.setHeader('Cache-Control', 'private, no-store, max-age=0'); return { props: {} }; } } })(filename);
    const result = await signed.getServerSideProps(context);
    assert.match(headers['Cache-Control'], /private, no-store/);
    assert.equal(result.props.remote, false);
    assert.equal(result.props.totalCount, actual.cards.length);
    assert.deepEqual(unpackFlashcards(result.props.deck).cards, actual.cards);
    assert.ok(Buffer.byteLength(JSON.stringify(result.props)) < 32 * 1024);
    const unsigned = await createLoader({ '../../lib/account-access': { getPaidPageProps: async () => ({ redirect: { destination: '/login?next=' + encodeURIComponent(context.resolvedUrl), permanent: false } }) } })(filename).getServerSideProps(context);
    assert.equal(unsigned.redirect.destination, '/login?next=' + encodeURIComponent(context.resolvedUrl));
    assert.equal(unsigned.props, undefined);
    const denied = { redirect: { destination: '/preise?next=' + encodeURIComponent(context.resolvedUrl), permanent: false } };
    assert.equal(await createLoader({ '../../lib/account-access': { getPaidPageProps: async () => denied } })(filename).getServerSideProps(context), denied);
  }
});

test('Scoped API remains paid-only and private, rejects malformed selection and returns no unrelated answers', async () => {
  for (const [account, expected] of [[null, 401], [{ paid: false }, 403], [{ paid: true }, 200], [{ admin: true }, 200]]) {
    const api = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => account } })('app/api/lernen/lernkarten/route.js');
    const response = await api.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=messung`));
    assert.equal(response.status, expected);
    assert.match(response.headers.get('Cache-Control'), /private, no-store/);
    assert.equal(response.headers.get('Vary'), 'Cookie');
    if (expected === 200) assert.deepEqual(unpackFlashcards(await response.json()), actual);
    else assert.equal((await response.json()).cards, undefined);
    if (expected === 200) assert.equal((await api.GET(new Request('https://jagdlatein.test/api/lernen/lernkarten?lektion=messung'))).status, 400);
  }
});

test('Scoped learning and print UI show the chosen lesson, preserve its round trip and hide the unrelated category chooser', () => {
  const props = load('lib/flashcard-page-data.js').getFlashcardPageData(scope);
  const cards = unpackFlashcards(props.deck);
  const contributions = [];
  const Cards = createLoader({ ...uiOverrides, './PageMenu': {
    __esModule: true,
    default: menuProps => { contributions.push(menuProps); return null; },
    closePageMenu() {},
  } })('components/LearningFlashcards.js').default;
  const printContributions = [];
  const printMenu = { __esModule: true, default: menuProps => { printContributions.push(menuProps); return null; }, closePageMenu() {} };
  const Print = createLoader({ ...uiOverrides, './PageMenu': printMenu, '../../components/PageMenu': printMenu })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Cards, cards));
  assert.match(html, /Gewählte Lernkartenauswahl/);
  assert.match(html, /Liegen ist noch keine Schlafstadienmessung/);
  assert.doesNotMatch(html, /Zur Lektion|aria-label="Diese Auswahl drucken"/, 'Selection and export links belong to the shared lower menu, outside the reader SSR');
  assert.doesNotMatch(html, /<select|Welche Wildart zeigt dieses Foto/);
  // Render each real PageMenu contribution in its mounted-outlet state. Use
  // the actual portal implementation, without adding controls to reader SSR.
  const outlet = { nodeType: 1, id: 'jl-page-menu' };
  const PageMenu = createLoader({ react: { ...React,
    useState: () => [outlet, () => {}],
    useRef: initial => ({ current: initial }),
    useEffect() {},
  } })('components/PageMenu.js').default;
  const renderLowerMenus = contributions => new Map(contributions.map(contribution => {
    const portal = PageMenu(contribution);
    assert.equal(portal.$$typeof, Symbol.for('react.portal'));
    assert.equal(portal.containerInfo, outlet);
    return [contribution.title, renderToStaticMarkup(portal.children)];
  }));
  const lowerMenus = renderLowerMenus(contributions);
  assert.equal(lowerMenus.size, 3);
  assert.match(lowerMenus.get('Lernkartenauswahl'), /Zur Lektion/);
  assert.ok(lowerMenus.get('Lernkartenauswahl').includes(`href="/kurse/${courseId}#lesson-messung"`));
  const exportMenu = lowerMenus.get('Lernkarten drucken und speichern');
  assert.match(exportMenu, /aria-label="Diese Auswahl drucken"/);
  const printAnchor = exportMenu.match(/<a\b[^>]*aria-label="Diese Auswahl drucken"[^>]*>/)?.[0];
  assert.ok(printAnchor);
  const printTarget = new URL(printAnchor.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&'), 'https://jagdlatein.test');
  assert.equal(printTarget.pathname, '/lernen/lernkarten-drucken');
  assert.equal(printTarget.searchParams.get('kurs'), courseId);
  assert.equal(printTarget.searchParams.get('lektion'), scope.lessonId);
  assert.doesNotMatch(lowerMenus.get('Lernkarten auswählen'), /<select/);
  const printed = renderToStaticMarkup(React.createElement(Print, props));
  assert.doesNotMatch(printed, /<select|Druckauswahl wird geladen|Welche Wildart zeigt dieses Foto/);
  assert.doesNotMatch(printed, /Digital wiederholen/, 'The print-to-digital return link also belongs to the lower menu');
  const printMenus = renderLowerMenus(printContributions);
  assert.equal(printMenus.size, 3);
  const digitalMenu = printMenus.get('Weitere Lernkarten');
  assert.match(digitalMenu, /Digital wiederholen/);
  const digitalHref = digitalMenu.match(/<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?Digital wiederholen<\/a>/)?.[1];
  assert.ok(digitalHref);
  const digitalTarget = new URL(digitalHref.replaceAll('&amp;', '&'), 'https://jagdlatein.test');
  assert.equal(digitalTarget.pathname, '/lernen/lernkarten');
  assert.equal(digitalTarget.searchParams.get('kurs'), courseId);
  assert.equal(digitalTarget.searchParams.get('lektion'), scope.lessonId);
  assert.doesNotMatch(printMenus.get('Druckauswahl ändern'), /<select/);
  assert.equal((printed.match(/<article/g) || []).length, actual.cards.length);
});

test('The actual course page supplies only card counts and renders a link for its current lesson', () => {
  const page = load('pages/kurse/[slug].js');
  const { props } = page.getStaticProps({ params: { slug: courseId } });
  assert.deepEqual(props.flashcards, getFlashcardLessonSummary(courseId));
  const Course = createLoader(uiOverrides)('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, props));
  const first = props.module.lessons[0];
  assert.match(html, /Diese Lektion mit \d+ Lernkarten wiederholen/);
  assert.ok(html.includes(`kurs=${courseId}&amp;lektion=${first.id}`));
  const noCards = renderToStaticMarkup(React.createElement(Course, { module: props.module, flashcards: { total: 0, lessons: {} } }));
  assert.doesNotMatch(noCards, /Diese Lektion mit/);
});

function harness(props) {
  const slots = []; let cursor = 0, effects = [], currentProps = props, result;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useMemo(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((value, n) => value !== slots[i].deps[n])) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; const old = slots[i]; if (!old || deps.some((value, n) => value !== old.deps[n])) { slots[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  const hook = createLoader({ react: hooks })('components/useFlashcardDeck.js').default;
  function render(next = currentProps) { currentProps = next; cursor = 0; result = hook(currentProps); return result; }
  render();
  return { render, get value() { return result; }, flush() { const batch = effects; effects = []; batch.forEach(fn => fn()); render(); }, async settle() { await new Promise(resolve => setImmediate(resolve)); render(); }, cleanup() { slots.forEach(slot => slot?.cleanup?.()); } };
}

test('A direct scoped search is applied on the first server render and an invalid selection cannot silently print the full bank', () => {
  const ui = createLoader({ ...uiOverrides, 'next/router': { useRouter: () => ({ query: { q: 'unauffindbarerlernbegriffxyz' }, isReady: true, asPath: route }) } });
  const Cards = ui('components/LearningFlashcards.js').default;
  const Printed = ui('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Cards, actual));
  assert.match(html, /Keine passenden Karten gefunden/);
  assert.doesNotMatch(html, /id="lernkarten-frage"/);
  const print = renderToStaticMarkup(React.createElement(Printed, { ...actual, remote: false }));
  assert.equal((print.match(/<article/g) || []).length, 0);
  const missing = getFlashcardExport({ courseId: 'missing-course', lessonId: '' });
  const invalid = renderToStaticMarkup(React.createElement(Cards, missing));
  assert.match(invalid, /Lernkartenauswahl wurde nicht gefunden/);
  assert.doesNotMatch(invalid, /Diese Auswahl drucken/);
});

test('Scoped remote loading rejects a different course bank and old errors cannot follow a new complete lesson', async () => {
  const original = global.fetch; const calls = [];
  const initial = { ...actual, cards: actual.cards.slice(0, 1) };
  const h = harness({ deck: packFlashcards(initial), totalCount: actual.cards.length, remote: true });
  global.fetch = async url => { calls.push(url); return Response.json(packFlashcards({ ...getFlashcardExport(), selection: actual.selection })); };
  try {
    h.flush(); await h.settle();
    assert.equal(calls[0], `/api/lernen/lernkarten?kurs=${courseId}&lektion=messung`);
    assert.equal(h.value.incomplete, true);
    assert.match(h.value.loadError, /unvollständig/);
    assert.deepEqual(h.value.cards, initial.cards);
    const next = load('lib/flashcard-page-data.js').getFlashcardPageData(scope);
    h.render(next); h.flush();
    assert.equal(h.value.incomplete, false);
    assert.equal(h.value.loadError, '');
    assert.deepEqual(h.value.cards, actual.cards);
    assert.equal(calls.length, 1, 'a complete small selection never fetches');
  } finally { h.cleanup(); global.fetch = original; }
});
