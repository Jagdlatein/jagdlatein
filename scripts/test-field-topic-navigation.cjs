const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const entries = createLoader()('lib/tracks-workshop.js').tracksWorkshopEntries;

test('Tracks start with an explicit topic choice; unknown or repeated entry parameters never show an unrelated animal', () => {
  for (const query of [{}, { eintrag: 'unknown' }, { eintrag: ['biber-nagespur', 'unknown'] }]) {
    const h = setup('components/TracksWorkshop.js', query);
    assert.equal(h.nodes(node => node.props?.id === 'tracks-title').length, 0);
    assert.match(text(h.tree), /Wähle einen Spurenfall unten im Menü/);
    const menu = h.nodes(node => node.type?.name === 'PageMenu')[0]; assert.equal(menu.props.openInitially, true);
    h.dispose();
  }
});

test('Track filters affect menu choices only; selecting a result opens exactly its text and preserves the shareable URL', () => {
  const h = setup('components/TracksWorkshop.js', { eintrag: entries[0].id, retained: 'yes' });
  h.input('Biber');
  const menu = h.nodes(node => node.type?.name === 'PageMenu')[0];
  assert.equal(nodes(menu, node => node.type === 'button').length, 1);
  const heading = h.nodes(node => node.props?.id === 'tracks-title')[0]; let focused = 0, scrolled = 0;
  heading.props.ref.current = { focus() { focused++; }, scrollIntoView() { scrolled++; } };
  h.click('Nagespur des BibersNahrungszeichen · echte Fotografie');
  assert.equal(h.nodes(node => node.props?.id === 'tracks-title')[0].props.children, 'Nagespur des Bibers');
  assert.equal(h.calls[0].href.query.eintrag, 'biber-nagespur'); assert.equal(h.calls[0].href.query.retained, 'yes');
  assert.equal(h.calls[0].href.hash, 'tracks-detail'); assert.equal(h.calls[0].options.shallow, true);
  assert.ok(h.menu.closed >= 2); assert.equal(focused, 1); assert.equal(scrolled, 0, 'Selection focuses meaningfully without scrolling below earlier page content');
  const detail = h.nodes(node => node.props?.id === 'tracks-detail')[0]; assert.doesNotMatch(text(detail), /Rehfährte im Schnee/);
  h.input('no-such-track'); assert.match(text(h.tree), /Keine passende Spur/);
  assert.equal(h.nodes(node => node.props?.id === 'tracks-title')[0].props.children, 'Nagespur des Bibers');
  h.navigate({ eintrag: entries[0].id }); assert.equal(h.nodes(node => node.props?.id === 'tracks-title')[0].props.children, entries[0].title);
  h.navigate({ eintrag: 'biber-nagespur' }); assert.equal(h.nodes(node => node.props?.id === 'tracks-title')[0].props.children, 'Nagespur des Bibers');
  h.dispose();
});

test('Track checklist stays reversible when its learning mode is chosen from the bottom menu', () => {
  const h = setup('components/TracksWorkshop.js', { ansicht: 'checkliste', eintrag: 'biber-nagespur' });
  const checkbox = h.nodes(node => node.type === 'input' && node.props.type === 'checkbox')[0];
  checkbox.props.onChange(); h.render(); assert.match(text(h.tree), /1 von 6/);
  h.click('Checkliste leeren'); assert.match(text(h.tree), /0 von 6/);
  assert.match(text(h.tree), /nicht als amtlicher Nachweis/);
  h.navigate({ eintrag: 'biber-nagespur', ansicht: 'quiz' }); assert.ok(h.nodes(node => node.type?.name === 'NatureQuestionRound').length);
  h.navigate({ eintrag: 'biber-nagespur' }); assert.equal(h.nodes(node => node.props?.id === 'tracks-title')[0].props.children, 'Nagespur des Bibers');
  h.dispose();
});

test('Wildbret shows exactly one selected cut, its full explanation immediately, and supplementary sources at the end', () => {
  const h = setup('components/VenisonCutGuide.js', { eintrag: 'hals' });
  const cuts = h.load('lib/venison-cut-guide.js').venisonCuts;
  const articles = h.nodes(node => node.type === 'article'); assert.equal(articles.length, 1); assert.equal(articles[0].props.id, 'wildbret-hals');
  assert.match(text(articles[0]), /Wildpfeffer ist ein Gericht/);
  assert.match(text(articles[0]), /70 °C über zwei Minuten/);
  assert.equal(nodes(articles[0], node => node.type === 'details').length, 0);
  assert.equal(nodes(articles[0], node => node.type === 'a').length, 0);
  const details = h.nodes(node => node.type === 'details'); assert.equal(details.length, 2);
  assert.match(text(details.at(-1)), /Ergänzende Fachquellen, Foto und Prüfstand/);
  h.input('Gulasch'); const menu = h.nodes(node => node.type?.name === 'PageMenu')[0];
  assert.equal(nodes(menu, node => node.type === 'button').length, 3, 'two cuts plus common methods');
  h.click(cuts[0].title); assert.equal(h.nodes(node => node.type === 'article')[0].props.id, 'wildbret-schulter');
  assert.equal(h.calls[0].href.query.eintrag, 'schulter'); assert.equal(h.calls[0].href.hash, 'wildbret-detail');
  h.navigate({ eintrag: 'hals' }); assert.equal(h.nodes(node => node.type === 'article')[0].props.id, 'wildbret-hals');
  h.click('Garmethoden und Küchenhygiene'); assert.equal(h.nodes(node => node.type === 'article').length, 0);
  assert.match(text(h.nodes(node => node.props?.id === 'wildbret-detail')[0]), /70 °C über zwei Minuten/);
  h.dispose();
});

test('A delayed router cannot open the initial picker over a valid incoming deep link', () => {
  for (const [file, id] of [['components/TracksWorkshop.js', 'biber-nagespur'], ['components/VenisonCutGuide.js', 'hals']]) {
    const h = setup(file, {}, { ready: false });
    assert.equal(h.nodes(node => node.type?.name === 'PageMenu')[0].props.openInitially, false);
    assert.equal(h.menu.closed, 0);
    h.router.isReady = true; h.navigate({ eintrag: id });
    assert.equal(h.nodes(node => node.type?.name === 'PageMenu')[0].props.openInitially, false);
    assert.equal(h.menu.closed, 1);
    h.dispose();
  }
});

test('Cancelled, superseded and departed navigation cannot reopen the menu over the current text', async () => {
  for (const [file, start, target, later] of [
    ['components/TracksWorkshop.js', entries[0].id, 'biber-nagespur', entries[2].id],
    ['components/VenisonCutGuide.js', 'hals', 'schulter', 'ruecken'],
  ]) {
    const h = setup(file, { eintrag: start }); const rejects = [];
    h.router.push = () => new Promise((resolve, reject) => rejects.push(reject));
    function choose(id) {
      const records = file.includes('Tracks') ? entries : h.load('lib/venison-cut-guide.js').venisonCuts;
      const title = records.find(item => item.id === id).title;
      const menu = h.nodes(node => node.type?.name === 'PageMenu')[0];
      nodes(menu, node => node.type === 'button' && text(node).startsWith(title))[0].props.onClick(); h.render();
    }
    choose(target); choose(later);
    rejects[0](Object.assign(new Error('superseded'), { cancelled: true })); await Promise.resolve();
    assert.equal(h.menu.opened, 0);
    rejects[1](new Error('offline')); await Promise.resolve(); assert.equal(h.menu.opened, 1);
    choose(target); choose(later); rejects[2](new Error('old failure')); await Promise.resolve(); assert.equal(h.menu.opened, 1);
    h.dispose(); rejects[3](new Error('departed')); await Promise.resolve(); assert.equal(h.menu.opened, 1);
  }
});

test('Choosing the current topic while another selection is pending cancels that older destination through a fresh route', async () => {
  for (const [file, start, target] of [['components/TracksWorkshop.js', entries[0].id, 'biber-nagespur'], ['components/VenisonCutGuide.js', 'hals', 'schulter']]) {
    const h = setup(file, { eintrag: start }); const requests = [];
    h.router.push = href => new Promise((resolve, reject) => requests.push({ href, reject }));
    const records = file.includes('Tracks') ? entries : h.load('lib/venison-cut-guide.js').venisonCuts;
    function choose(id) { const menu = h.nodes(node => node.type?.name === 'PageMenu')[0]; nodes(menu, node => node.type === 'button' && text(node).startsWith(records.find(item => item.id === id).title))[0].props.onClick(); h.render(); }
    choose(target); choose(start);
    assert.equal(requests.length, 2); assert.equal(requests[1].href.query.eintrag, start);
    requests[0].reject(Object.assign(new Error('superseded'), { cancelled: true })); requests[1].reject(Object.assign(new Error('superseded'), { cancelled: true }));
    await Promise.resolve(); h.dispose();
  }
});

test('History navigation to a committed different topic invalidates a delayed failure from the previous view', async () => {
  for (const [file, start, target, later] of [['components/TracksWorkshop.js', entries[0].id, 'biber-nagespur', entries[2].id], ['components/VenisonCutGuide.js', 'hals', 'schulter', 'ruecken']]) {
    const h = setup(file, { eintrag: start }); let reject;
    h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
    const records = file.includes('Tracks') ? entries : h.load('lib/venison-cut-guide.js').venisonCuts;
    const menu = h.nodes(node => node.type?.name === 'PageMenu')[0];
    nodes(menu, node => node.type === 'button' && text(node).startsWith(records.find(item => item.id === target).title))[0].props.onClick();
    h.navigate({ eintrag: later }); reject(new Error('late failure')); await Promise.resolve();
    assert.equal(h.menu.opened, 0); h.dispose();
  }
});
