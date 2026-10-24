const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const { gameMeatCases: cases } = createLoader()('lib/game-meat-cases.js');
const { parasiteTopics } = createLoader()('lib/parasite-learning.js');
const file = 'components/GameMeatCases.js';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const body = h => h.nodes(node => node.props?.id === 'game-meat-content')[0];
const title = h => h.nodes(node => node.props?.id === 'game-meat-title')[0]?.props.children;
const parasite = h => h.nodes(node => node.type?.name === 'ParasiteLearning')[0];
function select(h, id, value) {
  const control = h.nodes(node => node.type === 'select' && node.props.id === id)[0];
  assert.ok(control, id);
  return control.props.onChange({ target: { value } });
}
function button(h, label) {
  const found = h.nodes(node => node.type === 'button' && text(node) === label)[0];
  assert.ok(found, label); return found;
}
function fixture(t, query = {}, options) {
  const h = setup(file, query, options); t.after(() => h.dispose()); return h;
}

// These checks protect existing authored learning text. They do not certify its factual accuracy.
test('All existing case links expose the complete matching explanation and checklist without upper selectors', t => {
  const h = fixture(t);
  assert.equal(title(h), cases[0].title);
  assert.match(text(body(h)), /Fall 1 von 10/);
  for (const item of cases) {
    h.navigate({ eintrag: item.id });
    assert.equal(title(h), item.title);
    const rendered = text(body(h));
    for (const fact of [item.situation, item.question, item.choices[item.answer].text, item.choices[item.answer].explanation, item.takeaway, ...item.checklist]) assert.ok(rendered.includes(fact), `${item.id}: ${fact}`);
    assert.match(rendered, /Begründung/);
    assert.equal(nodes(body(h), node => node.type === 'select' || node.type === 'input').length, 0);
    assert.equal(h.nodes(node => node.type === 'select').length, nodes(menu(h), node => node.type === 'select').length);
    const sources = nodes(body(h), node => node.type === 'details')[0];
    assert.match(text(sources), /04\.10\.2026/);
    for (const source of item.sources) assert.ok(nodes(sources, node => node.props?.href === source.url).length);
    assert.ok(nodes(menu(h), node => node.props?.href === `/kurse/${item.course}`).length);
    assert.match(text(h.tree), /Die App erteilt keine Freigabe für ein reales Stück/);
  }
  assert.equal(h.calls.length, 0, 'Restored links must not rewrite browser history');
});

test('Existing parasite links retain their exact topic and the embedded selector is hidden', async t => {
  const h = fixture(t, { bereich: 'parasiten' });
  assert.equal(parasite(h).props.selectedId, parasiteTopics[0].id);
  assert.equal(parasite(h).props.hideSelector, true);
  for (const topic of parasiteTopics) {
    h.navigate({ bereich: 'parasiten', thema: topic.id });
    assert.equal(parasite(h).props.selectedId, topic.id);
    assert.equal(parasite(h).props.hideSelector, true);
    assert.equal(title(h), undefined);
  }
  await select(h, 'game-meat-parasite', parasiteTopics[0].id); h.render();
  assert.equal(h.calls[0].href.hash, 'wildbret-parasiten');
  assert.deepEqual(h.calls[0].href.query, { bereich: 'parasiten', thema: parasiteTopics[0].id });
});

test('Unknown/repeated selections do not silently substitute a different case or parasite', t => {
  for (const query of [{ eintrag: 'unknown' }, { eintrag: [cases[0].id, cases[1].id] }, { bereich: 'parasiten', thema: 'unknown' }, { bereich: 'parasiten', thema: [parasiteTopics[0].id] }, { bereich: ['parasiten'] }, { bereich: 'unknown' }]) {
    const h = fixture(t, query);
    assert.equal(title(h), undefined);
    assert.equal(parasite(h), undefined);
    assert.equal(menu(h).props.openInitially, true);
    assert.match(text(body(h)), /Dieses Thema ist nicht verfügbar/);
  }
});

test('Modes and topics create reversible canonical deep links and retain unrelated query values', async t => {
  const h = fixture(t, { eintrag: cases[3].id, herkunft: 'suche' });
  await select(h, 'game-meat-case', cases[5].id); h.render();
  const selectedCase = { eintrag: cases[5].id, herkunft: 'suche' };
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/wildbret-fallwerkstatt', query: selectedCase, hash: 'game-meat-content' }, options: { shallow: true, scroll: false } });
  assert.equal(title(h), cases[5].title);
  await select(h, 'game-meat-mode', 'parasiten'); h.render();
  assert.deepEqual(h.router.query, { herkunft: 'suche', bereich: 'parasiten', thema: parasiteTopics[0].id });
  await select(h, 'game-meat-parasite', parasiteTopics[1].id); h.render();
  const selectedParasite = { ...h.router.query };
  assert.equal(parasite(h).props.selectedId, parasiteTopics[1].id);
  await select(h, 'game-meat-mode', 'practice'); h.render();
  assert.deepEqual(h.router.query, { herkunft: 'suche' }); assert.match(text(body(h)), /Fall 1 von 10/);
  await select(h, 'game-meat-mode', 'discover'); h.render(); assert.equal(title(h), cases[5].title);
  await select(h, 'game-meat-mode', 'parasiten'); h.render(); assert.equal(parasite(h).props.selectedId, parasiteTopics[1].id);
  assert.equal(h.calls.length, 6);
  h.navigate(selectedCase); assert.equal(title(h), cases[5].title);
  h.navigate(selectedParasite); assert.equal(parasite(h).props.selectedId, parasiteTopics[1].id);
  const fresh = fixture(t, h.router.query); assert.equal(parasite(fresh).props.selectedId, parasiteTopics[1].id);
});

test('Hydration waits for the incoming URL and focuses only committed content', async t => {
  for (const query of [{ eintrag: cases[3].id }, { bereich: 'parasiten', thema: parasiteTopics[1].id }]) {
    const h = fixture(t, query, { ready: false });
    let focused = 0, scrolled = 0;
    body(h).props.ref.current = { querySelector: () => ({ setAttribute() {}, focus() { focused++; }, scrollIntoView() { scrolled++; } }) };
    assert.equal(menu(h).props.openInitially, false); assert.equal(title(h), undefined); assert.equal(parasite(h), undefined);
    assert.match(text(body(h)), /wird geladen/);
    await select(h, 'game-meat-mode', 'practice'); h.render(); assert.equal(h.calls.length, 0);
    h.router.isReady = true; h.render();
    await new Promise(resolve => setTimeout(resolve, 1));
    assert.equal(menu(h).props.openInitially, false); assert.equal(h.menu.opened, 0);
    assert.equal(focused, 1); assert.equal(scrolled, 1);
    if (query.eintrag) assert.equal(title(h), cases[3].title); else assert.equal(parasite(h).props.selectedId, parasiteTopics[1].id);
  }
});

test('Navigation failure retains the current text and URL; cancellation and superseded requests remain silent', async t => {
  const h = fixture(t, { eintrag: cases[0].id });
  const rejects = [];
  h.router.push = () => new Promise((resolve, reject) => rejects.push(reject));
  const first = select(h, 'game-meat-case', cases[1].id);
  const second = select(h, 'game-meat-case', cases[2].id);
  rejects[0](new Error('old request')); await first; h.render();
  assert.equal(h.menu.opened, 0); assert.equal(title(h), cases[0].title);
  rejects[1](new Error('offline')); await second; h.render();
  assert.equal(h.menu.opened, 1); assert.match(text(h.tree), /Thema konnte nicht geöffnet werden/);
  assert.equal(title(h), cases[0].title); assert.deepEqual(h.router.query, { eintrag: cases[0].id });
  const cancelled = select(h, 'game-meat-case', cases[1].id);
  rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  assert.equal(h.menu.opened, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  const departed = select(h, 'game-meat-case', cases[2].id);
  h.dispose(); rejects[3](new Error('departed')); await departed; h.render();
  assert.equal(h.menu.opened, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
});

test('Re-selecting the committed case supersedes a pending selection, including after an older request settles', async t => {
  const h = fixture(t, { eintrag: cases[0].id }); const rejects = [];
  h.router.push = href => { h.calls.push({ href }); return new Promise((resolve, reject) => rejects.push(reject)); };
  const first = select(h, 'game-meat-case', cases[1].id);
  const second = select(h, 'game-meat-case', cases[2].id);
  rejects[0](Object.assign(new Error('cancelled'), { cancelled: true })); await first;
  const restore = select(h, 'game-meat-case', cases[0].id);
  assert.equal(h.calls.length, 3); assert.equal(h.calls[2].href.query.eintrag, cases[0].id);
  rejects[1](Object.assign(new Error('cancelled'), { cancelled: true })); await second;
  rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await restore; h.render();
  assert.equal(title(h), cases[0].title); assert.equal(h.menu.opened, 0);
});

test('History commits invalidate pending failures even after returning to the original case or parasite', async t => {
  for (const initial of [{ eintrag: cases[0].id }, { bereich: 'parasiten', thema: parasiteTopics[0].id }]) for (const returnToOrigin of [false, true]) {
    const h = fixture(t, initial); let reject;
    h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
    const pending = initial.eintrag ? select(h, 'game-meat-case', cases[1].id) : select(h, 'game-meat-parasite', parasiteTopics[1].id);
    h.navigate({ eintrag: cases[3].id });
    if (returnToOrigin) h.navigate(initial);
    reject(new Error('late failure')); await pending; h.render();
    assert.equal(h.menu.opened, 0); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
    if (returnToOrigin && !initial.eintrag) assert.equal(parasite(h).props.selectedId, parasiteTopics[0].id);
    else assert.equal(title(h), returnToOrigin ? cases[0].title : cases[3].title);
  }
});

test('Case rounds still explain wrong answers, reject duplicate/stale actions and repeat exactly the missed cases', t => {
  const h = fixture(t); const first = cases[0];
  const wrongPosition = (first.answer + 1) % first.choices.length;
  const wrong = button(h, first.choices[wrongPosition].text); const correct = button(h, first.choices[first.answer].text);
  wrong.props.onClick(); wrong.props.onClick(); correct.props.onClick(); h.render();
  assert.ok(text(body(h)).includes(first.choices[wrongPosition].explanation)); assert.ok(text(body(h)).includes(first.choices[first.answer].explanation));
  const next = button(h, 'Nächster Fall'); next.props.onClick(); next.props.onClick(); h.render(); assert.match(text(body(h)), /Fall 2 von 10/);
  wrong.props.onClick(); next.props.onClick(); h.render(); assert.match(text(body(h)), /Fall 2 von 10/);
  for (let i = 1; i < cases.length; i++) {
    button(h, cases[i].choices[cases[i].answer].text).props.onClick(); h.render();
    button(h, i === cases.length - 1 ? 'Runde auswerten' : 'Nächster Fall').props.onClick(); h.render();
  }
  assert.match(text(body(h)), /9 von 10 Entscheidungen/);
  const repeat = button(h, 'Offene Fälle wiederholen'); repeat.props.onClick(); repeat.props.onClick(); h.render();
  assert.match(text(body(h)), /Fall 1 von 1/); assert.equal(title(h), first.title);
  wrong.props.onClick(); next.props.onClick(); h.render();
  assert.equal(h.nodes(node => node.props?.role === 'status').length, 0);
  assert.equal(h.calls.length, 0, 'Answering within a round is not topic navigation');
});

test('An answer callback captured before History leaves and returns cannot answer the restored round', t => {
  const h = fixture(t); const first = cases[0];
  const stale = button(h, first.choices[first.answer].text);
  h.navigate({ eintrag: cases[3].id }); h.navigate({});
  stale.props.onClick(); h.render(); assert.equal(h.nodes(node => node.props?.role === 'status').length, 0);
  button(h, first.choices[first.answer].text).props.onClick(); h.render();
  assert.match(text(body(h)), /Richtig begründet/);
});
