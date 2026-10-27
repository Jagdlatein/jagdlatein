const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const observations = load('lib/observation-workshop.js').observationCases;
const meat = load('lib/game-meat-cases.js').gameMeatCases;
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const choices = h => nodes(menu(h), node => node.type?.name === 'MenuChoice');
function choice(h, label, value) {
  const component = choices(h).find(node => node.props.label === label);
  assert.ok(component, label);
  // Execute the actual stateless renderer, including its disabled handling;
  // an unexecuted option element is not proof of a usable button.
  const rendered = component.type(component.props);
  const button = nodes(rendered, node => node.type === 'button' && node.props['data-menu-choice'] === value)[0];
  assert.ok(button, `${label}: ${value}`);
  return button;
}
const cases = [
  { file: 'TracksWorkshop', path: '/lernen/spurenwerkstatt', initial: { eintrag: 'biber-nagespur' }, next: { eintrag: 'biber-nagespur', ansicht: 'quiz' }, label: 'Lernweise', value: 'quiz', expected: [3, 6] },
  { file: 'PlantAtlas', path: '/lernen/pflanzenatlas', initial: { eintrag: 'rotbuche', jahreszeit: 'winter' }, next: { eintrag: 'rotbuche', jahreszeit: 'fruehling' }, label: 'Jahreszeit', value: 'fruehling', expected: [3, 4, 4] },
  { file: 'ObservationWorkshop', path: '/lernen/beobachtungswerkstatt', initial: { eintrag: observations[0].id }, next: { eintrag: observations[1].id }, label: 'Lernangebot', value: observations[1].id, expected: [8] },
  { file: 'GameMeatCases', path: '/lernen/wildbret-fallwerkstatt', initial: { eintrag: meat[0].id }, next: { eintrag: meat[1].id }, label: 'Fall wählen', value: meat[1].id, expected: [3, 10] },
  { file: 'VenisonCutGuide', path: '/lernen/wildbret-stuecke', initial: { eintrag: 'hals' }, next: { eintrag: 'schulter' }, expected: [] },
];
// Resolve framework modules before installing the minimal window double. It
// models scrolling only, rather than pretending to provide a browser document.
for (const item of cases) load(`components/${item.file}.js`);
function action(h, item) {
  return item.label ? choice(h, item.label, item.value).props.onClick : nodes(menu(h), node => node.type === 'button' && text(node) === 'Schulter / Blatt')[0].props.onClick;
}
function browser(path) {
  return { location: { pathname: path, search: '', hash: '' }, scroll: [], scrollTo(options) { this.scroll.push(options); }, addEventListener() {}, removeEventListener() {} };
}
async function withBrowser(path, run) {
  const previous = global.window, current = browser(path); global.window = current;
  try { await run(current); } finally { if (previous === undefined) delete global.window; else global.window = previous; }
}
function probe(h, events) {
  const target = { isConnected: true, querySelector() { return this; }, setAttribute() {}, focus(options) { events.push(['focus', options]); }, scrollIntoView(options) { events.push(['anchor', options]); } };
  for (const node of h.nodes(node => node.props?.ref && typeof node.props.ref === 'object')) node.props.ref.current = target;
}
const turn = () => new Promise(resolve => setImmediate(resolve));

test('Actual workshop menus offer complete controlled button choices with no native dropdown window', async () => {
  for (const item of cases) await withBrowser(item.path, async () => {
    const h = setup(`components/${item.file}.js`, item.initial);
    try {
      assert.equal(nodes(menu(h), node => node.type === 'select').length, 0, item.file);
      const counts = choices(h).map(component => {
        const tree = component.type(component.props), buttons = nodes(tree, node => node.type === 'button');
        assert.equal(nodes(tree, node => ['select', 'dialog', 'input'].includes(node.type)).length, 0);
        for (const button of buttons) assert.equal(button.props.type, 'button');
        assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1);
        return buttons.length;
      });
      assert.deepEqual(counts, item.expected, item.file);
    } finally { h.dispose(); }
  });
});

test('Workshop selections wait for the actual URL commit then reset to absolute page top rather than the lower result', async () => {
  for (const item of cases) await withBrowser(item.path, async window => {
    const h = setup(`components/${item.file}.js`, item.initial), events = [], requests = [];
    try {
      probe(h, events); window.scroll.length = 0;
      h.router.push = (href, as, options) => new Promise((resolve, reject) => requests.push({ href, options, resolve, reject }));
      const before = text(h.tree), pending = action(h, item)(); h.render();
      assert.equal(requests.length, 1, item.file);
      assert.equal(text(h.tree), before, `${item.file}: no optimistic content replacement`);
      assert.deepEqual(window.scroll, []); assert.deepEqual(events, []);
      assert.deepEqual(requests[0].href.query, item.next);
      assert.deepEqual(requests[0].options, { shallow: true, scroll: false });
      h.router.asPath = `${item.path}?${new URLSearchParams(item.next)}#${requests[0].href.hash}`;
      h.navigate(requests[0].href.query); requests[0].resolve(true); await pending; await turn(); h.render();
      assert.deepEqual(window.scroll, [{ left: 0, top: 0, behavior: 'instant' }], item.file);
      assert.deepEqual(events, [['focus', { preventScroll: true }]], `${item.file}: no result scrollIntoView`);
    } finally { h.dispose(); }
  });
});

test('Local menu filters preserve the selected reading and do not close the menu, write a URL or reset scroll', async () => {
  for (const [file, query, label, value] of [
    ['TracksWorkshop', { eintrag: 'biber-nagespur' }, 'Feldzeichen', 'Trittsiegel'],
    ['PlantAtlas', { eintrag: 'rotbuche' }, 'Pflanzengruppe', 'Nadelbaum'],
  ]) await withBrowser('/lernen/local-filter', async window => {
    const h = setup(`components/${file}.js`, query), events = [], closed = h.menu.closed;
    try {
      probe(h, events); window.scroll.length = 0;
      choice(h, label, value).props.onClick(); h.render();
      assert.deepEqual(h.router.query, query); assert.equal(h.calls.length, 0); assert.equal(h.menu.closed, closed);
      assert.deepEqual(events, []); assert.deepEqual(window.scroll, []);
      assert.equal(choices(h).find(node => node.props.label === label).props.value, value);
    } finally { h.dispose(); }
  });
});

test('Failed selection, departed handlers and unmounted handlers cannot move the page or navigate a newer workshop view', async () => {
  for (const item of cases) await withBrowser(item.path, async window => {
    const h = setup(`components/${item.file}.js`, item.initial), events = [], requests = [];
    try {
      probe(h, events); window.scroll.length = 0;
      h.router.push = (href, as, options) => new Promise((resolve, reject) => requests.push({ href, resolve, reject }));
      const stale = action(h, item), pending = stale(); requests[0].reject(new Error('offline')); await pending; await turn(); h.render();
      assert.deepEqual(window.scroll, []); assert.deepEqual(events, []); assert.deepEqual(h.router.query, item.initial);
      h.navigate(item.next); window.scroll.length = 0; events.length = 0;
      stale(); await turn(); h.render(); assert.equal(requests.length, 1, `${item.file}: old origin cannot navigate`);
      const unmounted = action(h, item);
      h.dispose(); unmounted(); await turn();
      assert.equal(requests.length, 1); assert.deepEqual(window.scroll, []); assert.deepEqual(events, []);
    } finally { h.dispose(); }
  });
});

test('Habitat reading uses the same actual grouped choices while checkbox edits retain their local model position', async () => {
  await withBrowser('/lernen/lebensraum-werkstatt', async window => {
    const h = setup('components/HabitatWorkshop.js'), events = [];
    try {
      probe(h, events); window.scroll.length = 0;
      assert.deepEqual(choices(h).map(component => nodes(component.type(component.props), node => node.type === 'button').length), [3, 16]);
      choice(h, 'Wissen auswählen', 'art:igel').props.onClick(); h.render();
      assert.equal(window.scroll.length, 1); assert.equal(events.filter(event => event[0] === 'anchor').length, 0);
      assert.ok(text(h.tree).includes(load('lib/habitat-workshop.js').habitatSpecies.find(item => item.id === 'igel').text));
      choice(h, 'Lernangebot', 'gestalten').props.onClick(); h.render(); window.scroll.length = 0; events.length = 0;
      const checkbox = h.nodes(node => node.type === 'input' && node.props.type === 'checkbox')[0];
      checkbox.props.onChange(); h.render();
      assert.deepEqual(window.scroll, []); assert.deepEqual(events, []);
      assert.equal(choices(h).find(component => component.props.label === 'Lernlandschaft laden').props.value, 'custom');
      choice(h, 'Lernlandschaft laden', 'leer').props.onClick(); h.render();
      assert.deepEqual(window.scroll, [], 'Loading a local model preset does not reset the page');
      assert.deepEqual(events, [['focus', { preventScroll: true }], ['anchor', { block: 'start', behavior: 'auto' }]], 'The original model-position focus is retained');
    } finally { h.dispose(); }
  });
});

test('Advancing a local hygiene exercise retains question focus without resetting to the page beginning', async () => {
  await withBrowser('/lernen/wildbret-fallwerkstatt', async window => {
    const h = setup('components/GameMeatCases.js'), events = [];
    try {
      probe(h, events); window.scroll.length = 0;
      const answer = h.nodes(node => node.type === 'button' && text(node) === meat[0].choices[meat[0].answer].text)[0];
      assert.ok(answer); answer.props.onClick(); h.render();
      const next = h.nodes(node => node.type === 'button' && text(node) === 'Nächster Fall')[0];
      assert.ok(next); next.props.onClick(); h.render();
      assert.deepEqual(window.scroll, []);
      assert.deepEqual(events, [['focus', { preventScroll: true }], ['anchor', { block: 'start', behavior: 'auto' }]]);
      assert.ok(text(h.tree).includes(meat[1].situation)); assert.equal(h.calls.length, 0);
    } finally { h.dispose(); }
  });
});
