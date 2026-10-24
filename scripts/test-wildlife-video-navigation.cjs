const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const { wildlifeVideoCases: cases, wildlifeVideoQuestionCount } = createLoader()('lib/wildlife-video-cases.js');
const file = 'components/WildlifeVideoCases.js', base = '/lernen/wildtier-videofaelle';
const heading = h => h.nodes(node => node.props?.id === 'video-fall')[0];
const video = h => h.nodes(node => node.type === 'video')[0];
const source = h => h.nodes(node => node.type === 'source')[0];
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const transcript = h => h.nodes(node => node.props?.id === 'video-textfassung')[0];
const answered = h => h.nodes(node => node.type === 'progress')[0].props.value;
const alerts = h => h.nodes(node => node.props?.role === 'alert');
function button(h, label) {
  const found = h.nodes(node => node.type === 'button' && text(node) === label)[0];
  assert.ok(found, `Missing button ${label}`); return found;
}
function fire(h, label, render = true) {
  const node = button(h, label); assert.ok(!node.props.disabled, `Disabled button ${label}`);
  const result = node.props.onClick(); if (render) h.render(); return result;
}
function choose(h, id) {
  const found = h.nodes(node => node.type === 'button' && node.key === id)[0];
  assert.ok(found, `Missing case ${id}`); return found.props.onClick();
}
function address(query, hash = 'video-fall') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function fixture(t, query = { eintrag: cases[0].id }, options = {}) {
  const h = setup(file, query, { ...options, router: { asPath: address(query), ...options.router } });
  t.after(() => h.dispose()); return h;
}
function history(h, query, hash = 'video-fall') { h.router.asPath = address(query, hash); h.navigate(query); }
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
  const result = { heading: 0, transcript: 0, scroll: 0, details: { open: false } };
  heading(h).props.ref.current = { focus() { result.heading++; }, scrollIntoView() { result.scroll++; } };
  Object.assign(result.details, { focus() { result.transcript++; }, scrollIntoView() { result.scroll++; } });
  transcript(h).props.ref.current = result.details;
  return result;
}
function bindPlayer(h, duration = 30) {
  const player = { currentTime: 0, duration, pauses: 0, pause() { this.pauses++; } };
  video(h).props.ref.current = player; return player;
}
function observed(h) { fire(h, 'Textfassung gelesen – Fragen öffnen'); }
function questionNumber(h) {
  return Number(text(h.nodes(node => node.type === 'p' && /^Frage \d+ von \d+$/.test(text(node)))[0]).match(/\d+/)[0]);
}
function answer(h, item, index = questionNumber(h) - 1) {
  fire(h, item.questions[index].choices[item.questions[index].answer]);
}

// These checks preserve authored content and event behavior; they do not assert
// a new factual review or physical device playback.
test('All five direct scenes retain exact media, transcripts, observations, licenses and fifteen explanations with one lower picker', t => {
  const h = fixture(t);
  for (const item of cases) {
    history(h, { eintrag: item.id });
    assert.equal(text(heading(h)), item.title);
    assert.equal(video(h).props.poster, item.poster); assert.equal(source(h).props.src, item.src);
    assert.equal(source(h).props.type, 'video/webm'); assert.equal(video(h).props.preload, 'none');
    assert.equal(video(h).props.controls, true); assert.equal(video(h).props.playsInline, true);
    assert.equal(video(h).props.autoPlay, undefined); assert.equal(video(h).props['aria-label'], item.title);
    assert.ok(text(transcript(h)).includes(item.transcript));
    const body = h.nodes(node => node.type === 'section' && node.props['aria-labelledby'] === 'video-fall')[0];
    for (const fact of [item.species, item.location, ...item.observations]) assert.ok(text(body).includes(fact));
    const footer = nodes(body, node => node.type === 'details' && node.props.id !== 'video-textfassung')[0];
    assert.ok(footer && !footer.props.open); assert.match(text(footer), /Geprüft am 4\. Oktober 2026/);
    assert.ok(text(footer).includes(item.author));
    for (const href of [item.source, item.licenseUrl, ...(item.authorUrl ? [item.authorUrl] : [])]) assert.ok(nodes(footer, node => node.props?.href === href).length);
    assert.ok(nodes(body, node => node.type === 'p' && text(node).includes('Unsichtbare Nahrung, exakte Altersjahre')).length);
    assert.ok(!text(footer).includes('Unsichtbare Nahrung, exakte Altersjahre'), 'The interpretation limit is visible before the sources');
    assert.equal(nodes(body, node => node.type === 'input' && node.props.type === 'search').length, 0);
    assert.equal(nodes(menu(h), node => node.type === 'button' && cases.some(entry => node.key === entry.id)).length, cases.length);
    assert.ok(nodes(menu(h), node => node.props?.href === '/lernen/videos').length);
    observed(h);
    for (const [index, question] of item.questions.entries()) {
      assert.equal(questionNumber(h), index + 1);
      assert.ok(text(h.nodes(node => node.type === 'section' && node.props['aria-labelledby'] === 'video-fall')[0]).includes(question.question));
      const wrong = button(h, question.choices[(question.answer + 1) % question.choices.length]).props.onClick;
      wrong(); wrong(); h.render(); assert.ok(text(h.tree).includes(question.explanation));
      if (index < item.questions.length - 1) { const next = button(h, 'Nächste Frage').props.onClick; next(); next(); h.render(); }
    }
  }
  assert.equal(answered(h), wildlifeVideoQuestionCount); assert.match(text(menu(h)), /15 von 15 Fragen beantwortet · 0 richtig/);
  assert.equal(h.calls.length, 0, 'Existing URLs and local quiz steps add no synthetic navigation');
});

test('Readiness and explicit invalid/repeated IDs cannot show a substitute video; invalid picker timers are cancelled', async t => {
  const bare = fixture(t, {}); assert.equal(text(heading(bare)), cases[0].title); assert.equal(bare.calls.length, 0);
  const h = fixture(t, { eintrag: 'stockente' }, { ready: false });
  assert.equal(heading(h), undefined); assert.equal(video(h), undefined); assert.equal(menu(h).props.openInitially, false);
  assert.match(text(h.tree), /wird geladen/); await choose(h, 'rotwild'); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.render(); assert.equal(text(heading(h)), cases.find(item => item.id === 'stockente').title);
  for (const id of ['', 'missing', null, ['fuchs'], ['fuchs', 'rotwild']]) {
    const invalid = fixture(t, { eintrag: id }); assert.equal(video(invalid), undefined);
    assert.equal(menu(invalid).props.openInitially, true); assert.match(text(invalid.tree), /nicht verfügbar/);
    history(invalid, { eintrag: 'rehwild' }); await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(invalid.menu.opened, 0);
  }
  const departed = fixture(t, { eintrag: 'missing' }); departed.dispose();
  await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(departed.menu.opened, 0);
});

test('A deferred case push preserves the actual question/media/answer until commit and focuses only the committed target', async t => {
  const h = fixture(t, { eintrag: 'fuchs', ref: 'suche', q: 'Wild' }), requests = pendingRouter(h), focus = focusProbe(h);
  observed(h); answer(h, cases[0]); fire(h, 'Nächste Frage');
  const key = video(h).key, currentTime = bindPlayer(h); currentTime.currentTime = 8;
  const action = choose(h, 'rotwild'); h.render();
  assert.deepEqual(requests[0].href, { pathname: base, query: { eintrag: 'rotwild', ref: 'suche', q: 'Wild' }, hash: 'video-fall' });
  assert.deepEqual(requests[0].options, { shallow: true, scroll: false }); assert.equal(requests[0].as, undefined);
  assert.equal(text(heading(h)), cases[0].title); assert.equal(questionNumber(h), 2); assert.equal(video(h).key, key);
  assert.equal(answered(h), 1); assert.equal(focus.heading, 0);
  await commit(h, requests[0], action);
  assert.equal(text(heading(h)), cases[1].title); assert.equal(questionNumber(h), 1); assert.equal(focus.heading, 1);
  assert.equal(source(h).props.src, cases[1].src); assert.notEqual(video(h).key, key);
  assert.equal(answered(h), 1);
});

test('Normal case changes retain observed/answers, while same-case hash/context and reselect retain the current question', async t => {
  const h = fixture(t), focus = focusProbe(h);
  observed(h); answer(h, cases[0]); fire(h, 'Nächste Frage');
  const key = video(h).key;
  await choose(h, 'fuchs'); h.render(); assert.equal(h.calls.length, 0); assert.equal(questionNumber(h), 2); assert.equal(video(h).key, key);
  history(h, { eintrag: 'fuchs', ref: 'kontext' }, 'video-textfassung');
  assert.equal(questionNumber(h), 2); assert.equal(focus.transcript, 1); assert.equal(focus.details.open, true);
  assert.equal(button(h, cases[0].questions[1].choices[0]).props.disabled, false);
  history(h, { eintrag: 'rotwild' }); observed(h); answer(h, cases[1]); assert.equal(answered(h), 2);
  history(h, { eintrag: 'fuchs' }); assert.equal(questionNumber(h), 1);
  assert.ok(text(h.tree).includes(cases[0].questions[0].explanation));
  fire(h, 'Nächste Frage'); assert.equal(button(h, cases[0].questions[1].choices[0]).props.disabled, false);
  assert.equal(answered(h), 2);
});

test('Transcript direct links are honored across real pushes; legacy picker hash opens the lower picker without navigation', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  history(h, { eintrag: 'fuchs' }, 'video-textfassung');
  const action = choose(h, 'stockente'); assert.equal(requests[0].href.hash, 'video-textfassung');
  await commit(h, requests[0], action); assert.equal(focus.transcript, 2); assert.equal(focus.details.open, true);
  history(h, { eintrag: 'stockente' }, 'video-auswahl');
  const opens = h.menu.opened; await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(h.menu.opened, opens + 1);
  assert.equal(questionNumber(h), 1); assert.equal(h.calls.length, 1);
});

test('Actual navigation errors retain the round; cancelled, refused and superseded promises cannot reopen it or steal focus', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  observed(h); answer(h, cases[0]); fire(h, 'Nächste Frage');
  const first = choose(h, 'rotwild'), second = choose(h, 'stockente');
  requests[0].reject(new Error('superseded')); await first; h.render(); assert.equal(alerts(h).length, 0);
  requests[1].reject(new Error('offline')); await second; h.render();
  assert.equal(alerts(h).length, 1); assert.match(text(alerts(h)[0]), /Aufnahme konnte nicht geöffnet werden/);
  assert.equal(h.menu.opened, 1); assert.equal(focus.heading, 0); assert.equal(questionNumber(h), 2); assert.equal(answered(h), 1);
  const cancelled = choose(h, 'rotwild'); requests[2].reject(Object.assign(new Error('cancel'), { cancelled: true })); await cancelled; h.render();
  const refused = choose(h, 'stockente'); requests[3].resolve(false); await refused; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 1); assert.equal(focus.heading, 0); assert.equal(questionNumber(h), 2);
});

test('A current-case reselect cancels pending targets even after an older request settles, preserving the current question', async t => {
  const h = fixture(t), requests = pendingRouter(h);
  observed(h); answer(h, cases[0]); fire(h, 'Nächste Frage');
  const first = choose(h, 'rotwild'), second = choose(h, 'stockente');
  requests[0].reject(Object.assign(new Error('cancel'), { cancelled: true })); await first;
  const current = choose(h, 'fuchs'); assert.equal(requests.length, 3); assert.equal(requests[2].href.query.eintrag, 'fuchs');
  requests[1].reject(new Error('superseded')); await second; requests[2].resolve(true); await current; h.render();
  assert.equal(questionNumber(h), 2); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0);
});

test('Late failures and selector/media/quiz callbacks are invalid after History, including away and back to the identical URL', async t => {
  for (const visits of [['stockente'], ['stockente', 'fuchs']]) {
    const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
    observed(h); const staleAnswer = button(h, cases[0].questions[0].choices[0]).props.onClick;
    const staleVideo = video(h), staleText = button(h, 'Textfassung gelesen – Fragen öffnen').props.onClick;
    const staleChoose = h.nodes(node => node.type === 'button' && node.key === 'rotwild')[0].props.onClick;
    const action = choose(h, 'rotwild'); for (const id of visits) history(h, { eintrag: id });
    const focused = focus.heading; requests[0].reject(new Error('late failure')); await action;
    staleAnswer(); staleText(); staleVideo.props.onTimeUpdate({ currentTarget: { currentTime: 5 } }); staleVideo.props.onError();
    let paused = 0; staleVideo.props.onPlay({ currentTarget: { pause() { paused++; } } }); await staleChoose(); h.render();
    assert.equal(paused, 1); assert.equal(requests.length, 1); assert.equal(answered(h), 0);
    assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.equal(focus.heading, focused);
  }
});

test('Retry immediately invalidates old playback/transcript/seek events and a fresh attempt unlocks only after observation', t => {
  const h = fixture(t), old = video(h), oldSource = source(h), player = bindPlayer(h, 3);
  const staleTranscript = button(h, 'Textfassung gelesen – Fragen öffnen').props.onClick;
  const staleSeek = button(h, 'Beobachtungsmoment anhalten').props.onClick;
  oldSource.props.onError(); h.render(); assert.equal(alerts(h).length, 1);
  const retry = button(h, 'Video neu laden').props.onClick; retry(); retry();
  old.props.onError(); old.props.onTimeUpdate({ currentTarget: { currentTime: 5 } }); staleTranscript(); staleSeek();
  assert.equal(player.currentTime, 0); h.render();
  assert.notEqual(video(h).key, old.key); assert.equal(alerts(h).length, 0);
  assert.equal(button(h, cases[0].questions[0].choices[0]).props.disabled, true);
  const current = video(h); current.props.onTimeUpdate({ currentTarget: { currentTime: 1.9 } }); h.render();
  assert.equal(button(h, cases[0].questions[0].choices[0]).props.disabled, true);
  video(h).props.onTimeUpdate({ currentTarget: { currentTime: 2 } }); h.render();
  assert.equal(button(h, cases[0].questions[0].choices[0]).props.disabled, false);
  fire(h, 'Beobachtungsmoment anhalten'); assert.equal(player.currentTime, 2.9);
});

test('Explicit reset clears every case while retaining its URL and blocks old round events before a render', t => {
  const h = fixture(t); observed(h); answer(h, cases[0]); history(h, { eintrag: 'rotwild' }); observed(h); answer(h, cases[1]);
  const url = h.router.asPath, query = { ...h.router.query }, old = video(h), oldKey = old.key;
  const oldText = button(h, 'Textfassung gelesen – Fragen öffnen').props.onClick;
  const oldAnswer = button(h, cases[1].questions[0].choices[0]).props.onClick;
  const oldNext = button(h, 'Nächste Frage').props.onClick, reset = button(h, 'Alle Videofälle neu beginnen').props.onClick;
  reset(); reset(); oldText(); oldAnswer(); oldNext(); old.props.onTimeUpdate({ currentTarget: { currentTime: 3 } }); old.props.onError(); h.render();
  assert.equal(answered(h), 0); assert.equal(questionNumber(h), 1); assert.equal(text(heading(h)), cases[1].title);
  assert.deepEqual(h.router.query, query); assert.equal(h.router.asPath, url); assert.equal(h.calls.length, 0);
  assert.notEqual(video(h).key, oldKey); assert.equal(alerts(h).length, 0);
  assert.equal(button(h, cases[1].questions[0].choices[0]).props.disabled, true);
  observed(h); answer(h, cases[1]); assert.equal(answered(h), 1);
  history(h, { eintrag: 'fuchs' }); assert.equal(button(h, cases[0].questions[0].choices[0]).props.disabled, true);
  assert.equal(answered(h), 1);
});

test('Playback cleanup pauses the captured departing player rather than a newly installed one', t => {
  const h = fixture(t), first = bindPlayer(h);
  history(h, { eintrag: 'fuchs', ref: 'warmup' });
  const firstPauses = first.pauses, second = bindPlayer(h);
  history(h, { eintrag: 'rotwild' });
  assert.equal(first.pauses, firstPauses + 1); assert.equal(second.pauses, 0);
  h.dispose(); assert.equal(second.pauses, 1);
});

test('Unmount prevents stale navigation, media, answer and transcript callbacks and ignores a late rejected transition', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  observed(h); const staleAnswer = button(h, cases[0].questions[0].choices[0]).props.onClick;
  const old = video(h), staleText = button(h, 'Textfassung gelesen – Fragen öffnen').props.onClick;
  const staleChoose = h.nodes(node => node.type === 'button' && node.key === 'stockente')[0].props.onClick;
  const action = choose(h, 'rotwild'); h.dispose(); requests[0].reject(new Error('late after unmount')); await action;
  staleAnswer(); staleText(); old.props.onError(); old.props.onTimeUpdate({ currentTarget: { currentTime: 5 } }); await staleChoose(); h.render();
  assert.equal(answered(h), 0); assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0);
  assert.equal(h.menu.opened, 0); assert.equal(focus.heading, 0);
});
