const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const { oralExamQuestions: questions } = createLoader()('lib/oral-exam-trainer.js');
const categories = [...new Set(questions.map(question => question.categorySlug))];
const file = 'components/OralExamTrainer.js', base = '/lernen/pruefungsgespraech';
const heading = h => h.nodes(node => node.props?.id === 'exam-question-title')[0];
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const questionSelect = h => h.nodes(node => node.props?.id === 'exam-question-select')[0];
const categorySelect = h => nodes(menu(h), node => node.type === 'select')[0];
const answer = h => h.nodes(node => node.type === 'textarea')[0]?.props.value;
const alerts = h => h.nodes(node => node.props?.role === 'alert');
const choose = (h, id) => questionSelect(h).props.onChange({ target: { value: id } });
const chooseCategory = (h, category) => categorySelect(h).props.onChange({ target: { value: category } });
function button(h, label) {
  const found = h.nodes(node => node.type === 'button' && text(node) === label)[0];
  assert.ok(found, `Missing button ${label}`); return found;
}
function fire(h, label) {
  const found = button(h, label); assert.ok(!found.props.disabled, `Disabled button ${label}`);
  const result = found.props.onClick(); h.render(); return result;
}
function writeAnswer(h, value) { h.nodes(node => node.type === 'textarea')[0].props.onChange({ target: { value } }); h.render(); }
function reveal(h, value = 'Eigene Erklärung für den technischen Inhaltsvergleich.') { writeAnswer(h, value); fire(h, 'Mit der Musterantwort vergleichen'); }
function rated(h, value, rating = 'Noch offene Lücken') { reveal(h, value); fire(h, rating); }
function address(query, hash = 'exam-question-title') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function fixture(t, query = { eintrag: questions[0].id }, options = {}) {
  const h = setup(file, query, { ...options, router: { asPath: address(query), ...options.router } });
  t.after(() => h.dispose()); return h;
}
function history(h, query, hash = 'exam-question-title') { h.router.asPath = address(query, hash); h.navigate(query); }
function pendingRouter(h) {
  const requests = [];
  h.router.push = (href, as, options) => {
    const request = { href, as, options }; requests.push(request); h.calls.push({ href, options });
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  };
  return requests;
}
async function commit(h, request, action) {
  history(h, request.href.query, request.href.hash); request.resolve(true); await action; h.render();
}
function focusProbe(h) {
  const calls = { focus: 0, scroll: 0 };
  heading(h).props.ref.current = {
    focus(options) { assert.deepEqual(options, { preventScroll: true }); calls.focus++; },
    scrollIntoView(options) { assert.deepEqual(options, { block: 'start', behavior: 'auto' }); calls.scroll++; },
  };
  return calls;
}

// Parent navigation and authored-text preservation only. Full local answering,
// speech and round lifecycle behavior has its own independent test harness.
test('Every old question URL preserves its exact prompt, revealed teaching text, criteria, lesson and closed sources under one lower picker', t => {
  const h = fixture(t);
  assert.equal(questions.length, 20); assert.equal(categories.length, 12);
  for (const question of questions) {
    history(h, { eintrag: question.id });
    assert.equal(text(heading(h)), question.title); assert.equal(questionSelect(h).props.value, question.id);
    const panel = h.nodes(node => node.props?.['aria-labelledby'] === 'exam-question-title')[0];
    assert.ok(text(panel).includes(question.prompt)); reveal(h);
    const revealed = h.nodes(node => node.props?.['aria-labelledby'] === 'exam-question-title')[0];
    for (const exact of [question.model, question.mistake, question.followUp, ...question.criteria]) assert.ok(text(revealed).includes(exact), question.id);
    const sources = nodes(revealed, node => node.type === 'details')[0];
    assert.ok(sources && !sources.props.open); assert.match(text(sources), /geprüft am 04\.10\.2026/);
    assert.deepEqual(nodes(sources, node => node.type === 'a').map(node => ({ href: node.props.href, label: text(node) })), question.sources.map(source => ({ href: source.url, label: source.title })));
    assert.ok(nodes(revealed, node => node.props?.href === `/kurse/${question.course}`).length);
    assert.equal(nodes(revealed, node => node.type === 'select').length, 0);
    assert.equal(h.nodes(node => node.type === 'select').length, nodes(menu(h), node => node.type === 'select').length);
    assert.match(text(h.tree), /Eigene Übungsfragen mit Selbsteinschätzung, kein amtlicher Fragenkatalog/);
    assert.match(text(h.tree), /Antworttexte bleiben nur in dieser geöffneten Seite und werden nicht hochgeladen/);
  }
  assert.equal(h.calls.length, 0);
});

test('Bare and category-only URLs select the documented first question; each of the twelve category pools is exact', t => {
  const h = fixture(t, {}); assert.equal(text(heading(h)), questions[0].title);
  for (const category of categories) {
    const expected = questions.filter(question => question.categorySlug === category);
    history(h, { kategorie: category });
    assert.equal(text(heading(h)), expected[0].title); assert.equal(categorySelect(h).props.value, category);
    assert.deepEqual(nodes(questionSelect(h), node => node.type === 'option' && node.props.value !== '').map(node => node.props.value), expected.map(question => question.id));
    for (const question of expected) { history(h, { kategorie: category, eintrag: question.id }); assert.equal(text(heading(h)), question.title); }
  }
  assert.equal(h.calls.length, 0);
});

test('Readiness never substitutes the first question and explicit invalid, multiple or category-mismatched links stay repairable', async t => {
  const h = fixture(t, { eintrag: 'baumwinter' }, { ready: false });
  assert.equal(heading(h), undefined); assert.equal(questionSelect(h).props.disabled, true); assert.equal(categorySelect(h).props.disabled, true);
  assert.equal(menu(h).props.openInitially, false); assert.match(text(h.tree), /wird geladen/);
  await choose(h, 'rotte'); await chooseCategory(h, 'wildkunde'); h.render(); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.render(); assert.equal(text(heading(h)), questions.find(question => question.id === 'baumwinter').title);
  const invalidQueries = [
    ...['', 'unknown', null, ['wildkunde'], ['wildkunde', 'hundewesen']].map(kategorie => ({ kategorie })),
    ...['', 'unknown', null, ['kitzfund'], ['kitzfund', 'rotte']].map(eintrag => ({ eintrag })),
    { kategorie: 'hundewesen', eintrag: 'kitzfund' },
  ];
  for (const query of invalidQueries) {
    const invalid = fixture(t, query); assert.equal(heading(invalid), undefined, JSON.stringify(query));
    assert.equal(menu(invalid).props.openInitially, true); assert.match(text(invalid.tree), /nicht verfügbar/);
    history(invalid, { eintrag: 'baumwinter' }); await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(invalid.menu.opened, 0);
  }
  const departed = fixture(t, { eintrag: 'missing' }); departed.dispose(); await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(departed.menu.opened, 0);
});

test('Deferred question selection waits for the actual URL, preserves the answer and carries only the deliberate category/context change', async t => {
  const initial = { kategorie: 'wildkunde', eintrag: 'kitzfund', ref: 'suche', q: 'Reh' };
  const h = fixture(t, initial, { router: { pathname: '/unrelated' } }), requests = pendingRouter(h), focus = focusProbe(h);
  reveal(h, 'Noch aktuelle eigene Antwort.'); const action = choose(h, 'rotte'); h.render();
  assert.deepEqual(requests[0].href, { pathname: base, query: { ...initial, eintrag: 'rotte' }, hash: 'exam-question-title' });
  assert.deepEqual(requests[0].options, { shallow: true, scroll: false }); assert.equal(requests[0].as, undefined);
  assert.equal(text(heading(h)), questions[0].title); assert.equal(answer(h), 'Noch aktuelle eigene Antwort.'); assert.equal(focus.focus, 0);
  await commit(h, requests[0], action); assert.equal(text(heading(h)), questions[1].title); assert.equal(focus.focus, 1);
  history(h, initial); assert.equal(answer(h), 'Noch aktuelle eigene Antwort.'); assert.ok(text(h.tree).includes(questions[0].model));
  history(h, requests[0].href.query); assert.equal(text(heading(h)), questions[1].title);
  const reload = fixture(t, h.router.query); assert.equal(text(heading(reload)), questions[1].title);
});

test('Category pushes choose their real first question, remove all explicitly and retain unrelated context', async t => {
  const h = fixture(t, { kategorie: 'wildkunde', eintrag: 'rotte', ref: 'menue' }), requests = pendingRouter(h);
  const action = chooseCategory(h, 'hundewesen');
  assert.deepEqual(requests[0].href.query, { kategorie: 'hundewesen', eintrag: 'hundelernen', ref: 'menue' });
  assert.equal(text(heading(h)), questions[1].title); await commit(h, requests[0], action);
  const all = chooseCategory(h, 'all'); assert.deepEqual(requests[1].href.query, { eintrag: 'kitzfund', ref: 'menue' });
  await commit(h, requests[1], all); assert.equal(categorySelect(h).props.value, 'all');
  const calls = requests.length; await chooseCategory(h, 'not-real'); await choose(h, 'https://outside.example/'); h.render(); assert.equal(requests.length, calls);
  const invalid = fixture(t, { kategorie: 'bad', eintrag: 'bad', ref: 'repair' }), repairRequests = pendingRouter(invalid);
  const repair = chooseCategory(invalid, 'wald-pflanzen'); assert.deepEqual(repairRequests[0].href.query, { kategorie: 'wald-pflanzen', eintrag: 'baumwinter', ref: 'repair' });
  await commit(invalid, repairRequests[0], repair); assert.equal(questionSelect(invalid).props.value, 'baumwinter');
});

test('A genuine route failure preserves revealed knowledge/answer; superseded, cancelled and false promises neither switch nor focus', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h); reveal(h, 'Antwort bleibt erhalten.');
  const first = choose(h, 'rotte'), second = choose(h, 'baumwinter');
  requests[0].reject(new Error('superseded')); await first; h.render(); assert.equal(alerts(h).length, 0);
  requests[1].reject(new Error('offline')); await second; h.render();
  assert.equal(h.menu.opened, 1); assert.match(text(alerts(h)[0]), /Frage konnte nicht geöffnet/);
  assert.equal(answer(h), 'Antwort bleibt erhalten.'); assert.ok(text(h.tree).includes(questions[0].model)); assert.equal(focus.focus, 0);
  const cancelled = choose(h, 'rotte'); requests[2].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  const refused = choose(h, 'baumwinter'); requests[3].resolve(false); await refused; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 1); assert.equal(focus.focus, 0); assert.equal(answer(h), 'Antwort bleibt erhalten.');
});

test('Reselecting the committed question supersedes a still-pending target after an older cancellation', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h); writeAnswer(h, 'Bestehender Entwurf.');
  const first = choose(h, 'rotte'), second = choose(h, 'baumwinter');
  requests[0].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await first;
  const current = choose(h, 'kitzfund'); assert.equal(requests.length, 3); assert.equal(requests[2].href.query.eintrag, 'kitzfund');
  requests[1].reject(new Error('late')); await second; requests[2].resolve(true); await current; h.render();
  assert.equal(answer(h), 'Bestehender Entwurf.'); assert.equal(alerts(h).length, 0); assert.equal(focus.focus, 1);
  await choose(h, 'kitzfund'); h.render(); assert.equal(requests.length, 3); assert.equal(focus.focus, 2);
});

test('Raw query/asPath/History origins reject stale selectors and late errors even after returning to the same question', async t => {
  const initial = { eintrag: 'kitzfund' };
  const visits = [
    h => history(h, { ...initial, ref: 'changed' }),
    h => { h.router.query = { ...initial, ref: 'query-only' }; h.render(); },
    h => { h.router.asPath = address(initial, 'another-anchor'); h.render(); },
    h => { history(h, { eintrag: 'baumwinter' }); history(h, initial); },
    h => { h.router.isReady = false; h.render(); h.router.isReady = true; h.render(); },
  ];
  for (const visit of visits) {
    const h = fixture(t, initial), requests = pendingRouter(h), focus = focusProbe(h);
    const oldQuestion = questionSelect(h).props.onChange, oldCategory = categorySelect(h).props.onChange;
    const action = choose(h, 'rotte'); visit(h); const focused = { ...focus };
    requests[0].reject(new Error('late origin failure')); await action;
    await oldQuestion({ target: { value: 'kitzfund' } }); await oldCategory({ target: { value: 'hundewesen' } }); h.render();
    assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.deepEqual(focus, focused);
  }
});

test('Next writes a real question history step while the final question only completes locally', async t => {
  const h = fixture(t, { kategorie: 'wildkunde', eintrag: 'kitzfund' }), requests = pendingRouter(h);
  rated(h, 'Erste Antwort.'); const first = fire(h, 'Nächste Frage');
  assert.equal(requests.length, 1); assert.equal(requests[0].href.query.eintrag, 'rotte'); assert.equal(questionSelect(h).props.value, 'kitzfund');
  await commit(h, requests[0], first); rated(h, 'Zweite Antwort.');
  fire(h, 'Runde auswerten'); assert.equal(heading(h), undefined); assert.match(text(h.tree), /Deine Gesprächsrunde/);
  assert.equal(requests.length, 1); assert.equal(h.router.query.eintrag, 'rotte');
});

test('A repeated-round response reset waits for both accepted navigation and its single matching URL commit', async t => {
  for (const resolution of ['accepted-first', 'commit-first', 'reject', 'context-invalidates']) {
    const h = fixture(t, { kategorie: 'wildkunde', eintrag: 'kitzfund' });
    rated(h, 'Wiederholen, aber erst nach Commit.');
    await fire(h, 'Nächste Frage'); h.render();
    rated(h, 'Zweite Antwort bleibt sicher.', 'Sicher erklärt'); fire(h, 'Runde auswerten');
    const requests = pendingRouter(h), action = fire(h, 'Offene Fragen erneut erklären');
    assert.equal(requests[0].href.query.eintrag, 'kitzfund'); assert.match(text(h.tree), /Deine Gesprächsrunde/);
    if (resolution === 'accepted-first') {
      requests[0].resolve(true); await action; h.render(); assert.match(text(h.tree), /Deine Gesprächsrunde/);
      history(h, requests[0].href.query); assert.equal(answer(h), '');
    } else if (resolution === 'commit-first') {
      history(h, requests[0].href.query); assert.equal(answer(h), 'Wiederholen, aber erst nach Commit.');
      requests[0].resolve(true); await action; h.render(); assert.equal(answer(h), '');
    } else if (resolution === 'reject') {
      requests[0].reject(new Error('offline')); await action; h.render();
      assert.match(text(h.tree), /Deine Gesprächsrunde/); history(h, { kategorie: 'wildkunde', eintrag: 'kitzfund' });
      assert.equal(answer(h), 'Wiederholen, aber erst nach Commit.');
    } else {
      history(h, { ...requests[0].href.query, ref: 'independent' });
      requests[0].resolve(true); await action; h.render(); assert.equal(answer(h), 'Wiederholen, aber erst nach Commit.');
    }
  }
});

test('A repeat commit awaiting acceptance never silently overwrites a newly accepted answer in its visible destination', async t => {
  for (const accepted of [true, false]) {
    const h = fixture(t, { kategorie: 'wildkunde', eintrag: 'kitzfund' });
    const previous = 'Bisheriger Entwurf des Wiederholungsfalls.';
    const fresh = 'Neuer Entwurf nach dem bereits sichtbaren URL-Wechsel.';
    rated(h, previous); await fire(h, 'Nächste Frage'); h.render();
    rated(h, 'Abgeschlossener zweiter Fall.', 'Sicher erklärt'); fire(h, 'Runde auswerten');
    const requests = pendingRouter(h), action = fire(h, 'Offene Fragen erneut erklären');
    history(h, requests[0].href.query);
    assert.equal(questionSelect(h).props.value, 'kitzfund'); assert.equal(answer(h), previous);
    writeAnswer(h, fresh);
    const acceptedFreshInput = answer(h) === fresh;
    requests[0].resolve(accepted); await action; h.render();
    if (acceptedFreshInput) assert.equal(answer(h), fresh, 'A deferred round action must not erase a newly accepted destination answer.');
    else assert.equal(answer(h), accepted ? '' : previous, 'Blocked edits remain unchanged on refusal and clear only after an accepted repeat.');
    if (!accepted) {
      writeAnswer(h, 'Nach der abgelehnten Aktion bearbeitbar.');
      assert.equal(answer(h), 'Nach der abgelehnten Aktion bearbeitbar.');
    }
  }
});

test('Unmount invalidates current and other-question/category callbacks before any URL/focus or late error work', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  const oldQuestion = questionSelect(h).props.onChange, oldCategory = categorySelect(h).props.onChange;
  const action = choose(h, 'rotte'); h.dispose(); requests[0].reject(new Error('late unmount')); await action;
  await oldQuestion({ target: { value: 'kitzfund' } }); await oldQuestion({ target: { value: 'baumwinter' } });
  await oldCategory({ target: { value: 'wildkunde' } }); h.render();
  assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.deepEqual(focus, { focus: 0, scroll: 0 });
});
