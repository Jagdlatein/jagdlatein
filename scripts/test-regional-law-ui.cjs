const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');

function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(item => nodes(item, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function harness(query = {}, saved = null) {
  const originalWindow = global.window, originalFetch = global.fetch;
  const slots = [], effects = [], requests = [], pushes = [], replacements = [], menuOpenCalls = [];
  let cursor = 0, dirty = false, tree, focusCount = 0, scrollCount = 0;
  const window = { location: { hash: '' }, localStorage: { getItem: () => saved && JSON.stringify(saved), setItem(_key, value) { saved = JSON.parse(value); } } };
  const router = { isReady: true, query, push(href) { pushes.push(href); return Promise.resolve(true); }, replace(href) { replacements.push(href); } };
  const hooks = { ...React,
    useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; dirty = true; }]; },
    useRef(initial) { const i = cursor++; slots[i] ||= { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || !deps || deps.some((dep, j) => dep !== previous.deps?.[j])) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
  };
  const Link = ({ href, children, shallow, scroll, prefetch, ...props }) => React.createElement('a', { href, ...props }, children);
  const PageMenu = () => null;
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => router }, 'next/link': { __esModule: true, default: Link },
    './Seo': { __esModule: true, default: () => null },
    './PageMenu': { __esModule: true, default: PageMenu, openPageMenu: id => menuOpenCalls.push(id), closePageMenu: () => {}, resetPageMenuPosition: () => {} },
    './ResearchQuestionRound': { __esModule: true, default: ({ questions }) => React.createElement('div', { 'data-practice': questions.map(q => q.id).join(',') }, 'Practice') },
  });
  const Component = load('components/RegionalLawLearning.js').default;
  const regions = [{ code: 'SG', name: 'St. Gallen' }, { code: 'ZH', name: 'Zürich' }, { code: 'BUND', name: 'Bundesrecht' }];
  global.window = window;
  global.fetch = (url, options) => new Promise(resolve => { requests.push({ url, signal: options.signal, resolve }); });
  function render() {
    cursor = 0; dirty = false;
    tree = Component({ country: 'CH', name: 'Schweiz', regionLabel: 'Kanton', regions });
    for (const node of nodes(tree, node => node.props?.ref)) node.props.ref.current = { focus() { focusCount++; }, scrollIntoView() { scrollCount++; } };
    return tree;
  }
  function flush() { let guard = 0; do { render(); effects.splice(0).forEach(effect => effect()); } while (dirty && ++guard < 12); return tree; }
  flush();
  return { requests, pushes, replacements, menuOpenCalls, get tree() { return tree; }, get saved() { return saved; }, get focusCount() { return focusCount; }, get scrollCount() { return scrollCount; },
    html: () => renderToStaticMarkup(tree),
    menuHtml: () => renderToStaticMarkup(nodes(tree, node => node.type === PageMenu)[0].props.children),
    route(value) { router.query = value; flush(); },
    async respond(index, data, status = 200) { requests[index].resolve({ ok: status === 200, status, json: async () => data }); for (let i = 0; i < 6; i++) await Promise.resolve(); flush(); },
    close() { for (const slot of slots) slot?.cleanup?.(); global.window = originalWindow; global.fetch = originalFetch; },
    select(label) { const field = nodes(tree, node => node.type === 'label' && node.props.children?.[0] === label)[0]; return nodes(field, node => node.type === 'select')[0]; },
    search(value) { nodes(tree, node => node.type === 'input' && node.props.type === 'search')[0].props.onChange({ target: { value } }); flush(); },
  };
}
const norm = { id: 'sg-one', topic: 'pruefung', title: 'Synthetic norm', lawTitle: 'Synthetic law', citation: 'Art. 1–3', officialTextCitation: 'Art. 2 Abs. 1',
  officialText: 'Synthetic official text for component tests only.', learningReviewed: true, summary: 'Synthetic reviewed explanation.', reviewedOn: '2026-10-23',
  regionCode: 'SG', regionName: 'St. Gallen', sources: [{ title: 'Synthetic source', kind: 'law', publisher: 'Synthetic publisher', url: 'https://example.invalid/law' }] };
function bundle(code = 'SG') { return { country: 'CH', region: { code, name: code === 'SG' ? 'St. Gallen' : 'Zürich', officialUrl: 'https://example.invalid', lawTitle: 'Synthetic law' },
  articles: [{ ...norm, regionCode: code, regionName: code }], questions: [{ id: `${code}-q`, topic: 'pruefung', articleId: norm.id, regionCode: code }], sources: [] }; }

test('A late response from another canton is hidden and cannot replace the current learning region', async () => {
  const s = harness({ region: 'SG' });
  try {
    assert.equal(s.requests.length, 1);
    s.route({ region: 'ZH' }); assert.equal(s.requests[0].signal.aborted, true);
    await s.respond(1, bundle('ZH')); assert.match(s.html(), /<strong>Zürich<\/strong>/);
    await s.respond(0, bundle('SG')); assert.match(s.html(), /<strong>Zürich<\/strong>/); assert.doesNotMatch(s.html(), /<strong>St\. Gallen<\/strong>/);
    s.route({ region: 'SG' }); assert.match(s.html(), /werden geladen/); assert.doesNotMatch(s.html(), /<strong>Zürich<\/strong>/);
  } finally { s.close(); }
});

test('Filtering the lower-menu choices cannot erase the legal text already selected for reading', async () => {
  const s = harness({ region: 'SG', thema: 'pruefung', artikel: norm.id });
  try {
    await s.respond(0, bundle());
    const focused = s.focusCount;
    s.search('Kein Treffer fuer diesen Suchbegriff');
    assert.match(s.html(), /Synthetic reviewed explanation/);
    assert.doesNotMatch(s.html(), /Kein Treffer in dieser Auswahl/);
    assert.match(s.menuHtml(), /Kein Treffer\. Ändere deinen Suchbegriff/);
    assert.equal(s.focusCount, focused, 'Typing in a filter does not interrupt reading');
  } finally { s.close(); }
});

test('A remembered canton restores only an empty choice and never overrides an explicit region or country', () => {
  for (const [query, saved, expected] of [[{}, { country: 'CH', region: 'SG' }, 1], [{ region: 'ZH' }, { country: 'CH', region: 'SG' }, 0],
    [{}, { country: 'DE', region: 'BY' }, 0], [{}, { country: 'CH', region: 'XX' }, 0]]) {
    const s = harness(query, saved);
    try { assert.equal(s.replacements.length, expected); if (expected) assert.equal(s.replacements[0], '/jagdrecht/ch?region=SG'); } finally { s.close(); }
  }
});

test('Topic selection lives in the lower menu while the page shows only the chosen norm and its exact excerpt citation', async () => {
  const s = harness({ region: 'SG' });
  try {
    await s.respond(0, bundle());
    const link = nodes(s.tree, node => node.props?.href === '/jagdrecht/ch?region=SG&thema=pruefung')[0];
    link.props.onClick({ button: 0 });
    s.route({ region: 'SG', thema: 'pruefung' });
    await new Promise(resolve => setTimeout(resolve, 1));
    assert.ok(s.menuOpenCalls.includes('regional-law-topics'));
    assert.equal(s.focusCount, 0); assert.equal(s.scrollCount, 0);
    assert.doesNotMatch(s.html(), /<select|type="search"|aria-label="Rechtsthemen"|aria-label="Gesetzesstellen"/);
    assert.match(s.menuHtml(), /Aktuelle Auswahl/); assert.doesNotMatch(s.menuHtml(), /<select/);
    s.route({ region: 'SG', thema: 'pruefung', artikel: norm.id });
    assert.match(s.html(), /Art\. 2 Abs\. 1/); assert.match(s.html(), /Synthetic reviewed explanation/);
    assert.equal((s.html().match(/<article/g) || []).length, 1); assert.equal(s.requests.length, 1, 'Topic and reading form changes reuse the selected region response.');
    s.route({ region: 'SG', thema: 'pruefung', artikel: 'foreign' }); assert.match(s.html(), /gehört nicht zur aktuellen Auswahl/); assert.doesNotMatch(s.html(), /Synthetic reviewed explanation/);
  } finally { s.close(); }
});

test('An original-only norm stays clearly distinct from released learning explanations', async () => {
  const s = harness({ region: 'SG', thema: 'pruefung', artikel: norm.id });
  try {
    const value = bundle(); value.articles[0] = { ...norm, learningReviewed: false, summary: '' }; value.questions = [];
    await s.respond(0, value);
    assert.match(s.html(), /ergänzende Abgleich.*noch offen/); assert.doesNotMatch(s.html(), /Verständlich erklärt|Lerninhalt abgeglichen/);
    assert.match(s.html(), /Synthetic official text/); assert.match(s.html(), /Amtlichen Wortlaut eingesehen/);
  } finally { s.close(); }
});

test('Expired access offers a safe login return and malformed region responses do not show foreign content', async () => {
  const s = harness({ region: 'SG', ansicht: 'uebung' });
  try {
    await s.respond(0, { message: 'Anmeldung erforderlich' }, 401);
    assert.match(s.html(), /\/login\?next=%2Fjagdrecht%2Fch%3Fregion%3DSG%26ansicht%3Duebung/);
    s.route({ region: 'ZH', ansicht: 'uebung' }); await s.respond(1, bundle('SG'));
    assert.match(s.html(), /Antwort gehört nicht zur gewählten Lernregion/); assert.doesNotMatch(s.html(), /data-practice/);
  } finally { s.close(); }
});

test('Originals view labels a sample as a sample, separates requirements and does not display authored practice as official material', async () => {
  const s=harness({region:'SG',ansicht:'originale'});
  try {
    const value=bundle();value.region.examResources=[
      {title:'Synthetic official sample',publisher:'Synthetic authority',url:'https://example.invalid/sample',kind:'official-sample',reviewedOn:'2026-10-23',notes:'Only a sample.'},
      {title:'Synthetic requirements',publisher:'Synthetic authority',url:'https://example.invalid/rules',kind:'exam-rules',reviewedOn:'2026-10-23'},
    ];
    await s.respond(0,value);
    assert.match(s.html(),/Offizielles Muster \/ Beispiel/); assert.match(s.html(),/Anforderungen und zuständige Prüfungsstelle/);
    assert.doesNotMatch(s.html(),/data-practice|Synthetic reviewed explanation|Rechtsfragen zum Nachlesen/);
    assert.ok(s.html().includes('href="https://example.invalid/sample"'));
  } finally {s.close();}
});
