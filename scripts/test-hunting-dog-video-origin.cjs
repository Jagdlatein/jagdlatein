const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const { huntingDogVideoLessons: lessons, dogVideoSources } = createLoader()('lib/hunting-dog-video-lessons.js');
const file = 'components/HuntingDogVideos.js', base = '/lernen/jagdhund-videos';
const article = h => h.nodes(node => node.type === 'article' && node.props.id === 'hundevideo-film')[0];
const video = h => h.nodes(node => node.type === 'video')[0];
const source = h => h.nodes(node => node.type === 'source')[0];
const selector = h => h.nodes(node => node.type === 'select' && node.props.id === 'hundevideo-auswahl')[0];
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const alerts = h => h.nodes(node => node.props?.role === 'alert');
const questions = h => h.nodes(node => node.type?.name === 'ObservationQuestion');
const choose = (h, id) => selector(h).props.onChange({ target: { value: id } });
function address(query, hash = 'hundevideo-film') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function fixture(t, query = { eintrag: lessons[0].id }, options = {}) {
  const h = setup(file, query, { ...options, router: { asPath: address(query), ...options.router } });
  t.after(() => h.dispose()); return h;
}
function history(h, query, hash = 'hundevideo-film') { h.router.asPath = address(query, hash); h.navigate(query); }
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
  const calls = { film: 0, transcript: 0, scroll: 0 };
  nodes(article(h), node => node.type === 'h2')[0].props.ref.current = {
    focus(options) { assert.deepEqual(options, { preventScroll: true }); calls.film++; },
    scrollIntoView(options) { assert.deepEqual(options, { block: 'start', behavior: 'auto' }); calls.scroll++; },
  };
  const transcript = h.nodes(node => node.props?.id === 'hundevideo-handlung')[0];
  nodes(transcript, node => node.type === 'h3')[0].props.ref.current = {
    focus(options) { assert.deepEqual(options, { preventScroll: true }); calls.transcript++; },
    scrollIntoView(options) { assert.deepEqual(options, { block: 'start', behavior: 'auto' }); calls.scroll++; },
  };
  return calls;
}
function bindPlayer(h) {
  const player = { pauses: 0, pause() { this.pauses++; } }; video(h).props.ref.current = player; return player;
}
function mountPath(node, predicate, path = []) {
  if (Array.isArray(node)) {
    for (const [index, child] of node.entries()) { const found = mountPath(child, predicate, [...path, { slot: index }]); if (found) return found; }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  const next = [...path, { type: node.type, key: node.key }];
  return predicate(node) ? next : mountPath(node.props?.children, predicate, next);
}

// Parent contract checks only: ObservationQuestion's own radio/session harness
// is maintained separately. These checks do not claim a new factual review.
test('All four URL-owned scenes preserve exact MP4/poster/captions, authored text, limits, closed final evidence and child props', t => {
  const h = fixture(t);
  for (const lesson of lessons) {
    history(h, { eintrag: lesson.id });
    const panel = article(h); assert.equal(panel.key, lesson.id);
    assert.equal(selector(h).props.value, lesson.id); assert.equal(video(h).props.poster, lesson.poster);
    assert.equal(source(h).props.src, lesson.src); assert.equal(source(h).props.type, 'video/mp4');
    const captions = h.nodes(node => node.type === 'track')[0];
    assert.equal(captions.props.src, lesson.captions); assert.equal(captions.props.srcLang, 'de'); assert.equal(captions.props.default, true);
    assert.equal(video(h).props.controls, true); assert.equal(video(h).props.playsInline, true); assert.equal(video(h).props.preload, 'none');
    assert.equal(video(h).props.autoPlay, undefined);
    for (const exact of [lesson.title, lesson.breed, lesson.transcript, lesson.context, lesson.lesson, lesson.practice,
      ...lesson.observations.flatMap(item => [item.at, item.text])]) assert.ok(text(panel).includes(exact), lesson.id);
    const footer = nodes(panel, node => node.type === 'details')[0];
    assert.ok(footer && !footer.props.open); assert.match(text(footer), /geprüft am 12\. Oktober 2026/);
    assert.ok(text(footer).includes(lesson.media.author)); assert.ok(text(footer).includes(lesson.media.recordingDate));
    assert.ok(text(footer).includes(lesson.media.changes));
    assert.deepEqual(nodes(footer, node => node.type === 'a').map(node => node.props.href),
      [lesson.media.source, lesson.media.licenseUrl, ...lesson.sources.map(id => dogVideoSources[id].url)]);
    const children = questions(h); assert.equal(children.length, lesson.questions.length);
    assert.deepEqual(children.map(node => node.props.question), lesson.questions);
    assert.deepEqual(children.map(node => node.key), lesson.questions.map(question => `${lesson.id}-${question.id}`));
    assert.ok(children.every(node => node.props.scope === children[0].props.scope && node.props.canInteract()));
    assert.equal(nodes(panel, node => node.type === 'select').length, 0);
    assert.equal(nodes(menu(h), node => node.type === 'select').length, 1);
    assert.deepEqual(nodes(menu(h), node => node.props?.href).map(node => node.props.href), ['/lernen/videos', '/lernen/jagdhunde']);
  }
  assert.equal(h.calls.length, 0);
});

test('An unready URL cannot show a fallback film or write a URL; explicit invalid/repeated values get a repair picker', async t => {
  const h = fixture(t, { eintrag: lessons[1].id }, { ready: false });
  assert.equal(article(h), undefined); assert.equal(video(h), undefined); assert.equal(selector(h).props.disabled, true);
  assert.equal(menu(h).props.openInitially, false); assert.match(text(h.tree), /wird geladen/);
  await choose(h, lessons[2].id); h.render(); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.render(); assert.equal(article(h).key, lessons[1].id);
  const bare = fixture(t, {}); assert.equal(article(bare).key, lessons[0].id); assert.equal(bare.calls.length, 0);
  for (const id of ['', '../other', null, [lessons[0].id], [lessons[0].id, lessons[1].id]]) {
    const invalid = fixture(t, { eintrag: id });
    assert.equal(article(invalid), undefined); assert.equal(selector(invalid).props.value, ''); assert.equal(menu(invalid).props.openInitially, true);
    history(invalid, { eintrag: lessons[2].id }); await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(invalid.menu.opened, 0);
  }
  const departed = fixture(t, { eintrag: 'missing' }); departed.dispose();
  await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(departed.menu.opened, 0);
});

test('A real deferred push preserves the committed film and failure until commit, uses the canonical path and focuses the new film', async t => {
  const query = { eintrag: lessons[0].id, herkunft: 'videos', q: 'Retriever' };
  const h = fixture(t, query, { router: { pathname: '/unrelated' } }), requests = pendingRouter(h), focus = focusProbe(h);
  source(h).props.onError(); h.render(); assert.equal(alerts(h).length, 1);
  const old = video(h), action = choose(h, lessons[1].id); h.render();
  assert.deepEqual(requests[0].href, { pathname: base, query: { ...query, eintrag: lessons[1].id }, hash: 'hundevideo-film' });
  assert.equal(requests[0].as, undefined); assert.deepEqual(requests[0].options, { shallow: true, scroll: false });
  assert.equal(article(h).key, lessons[0].id); assert.equal(source(h).props.src, lessons[0].src); assert.equal(focus.film, 0);
  assert.equal(alerts(h).length, 1); await commit(h, requests[0], action);
  assert.equal(article(h).key, lessons[1].id); assert.equal(source(h).props.src, lessons[1].src); assert.equal(focus.film, 1);
  assert.equal(alerts(h).length, 0); old.props.onError(); h.render(); assert.equal(alerts(h).length, 0);
});

test('Raw query and asPath changes independently invalidate old navigation, media and child interaction scope, including exact away-and-back', async t => {
  const initial = { eintrag: lessons[0].id };
  const mutations = [
    h => history(h, { ...initial, ref: 'anderer-einstieg' }),
    h => { h.router.query = { ...initial, ref: 'query-ohne-aspath' }; h.render(); },
    h => { h.router.asPath = address(initial, 'hundevideo-handlung'); h.render(); },
    h => { history(h, { eintrag: lessons[2].id }); history(h, initial); },
    h => { h.router.isReady = false; h.render(); h.router.isReady = true; h.render(); },
  ];
  for (const mutate of mutations) {
    const h = fixture(t, initial), requests = pendingRouter(h), focus = focusProbe(h);
    const oldSelect = selector(h).props.onChange, oldVideo = video(h), oldSource = source(h), oldQuestion = questions(h)[0];
    const action = choose(h, lessons[1].id); mutate(h);
    const focused = { ...focus }; requests[0].reject(new Error('late raw-origin failure')); await action;
    await oldSelect({ target: { value: lessons[0].id } }); await oldSelect({ target: { value: lessons[3].id } });
    oldVideo.props.onError(); oldSource.props.onError(); let paused = 0;
    oldVideo.props.onPlay({ currentTarget: { pause() { paused++; } } }); h.render();
    assert.equal(requests.length, 1, 'An old selector is rejected before it can write a URL');
    assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.deepEqual(focus, focused); assert.equal(paused, 1);
    assert.equal(oldQuestion.props.canInteract(), false); assert.equal(questions(h)[0].props.canInteract(), true);
    assert.notEqual(questions(h)[0].props.scope, oldQuestion.props.scope);
  }
});

test('Current source and video failures work, while stale Play is paused and current Play stays deliberate', t => {
  const h = fixture(t), oldVideo = video(h), oldSource = source(h);
  let currentPaused = 0; oldVideo.props.onPlay({ currentTarget: { pause() { currentPaused++; } } }); assert.equal(currentPaused, 0);
  oldSource.props.onError(); h.render(); assert.equal(alerts(h).length, 1);
  history(h, { eintrag: lessons[1].id }); oldVideo.props.onError(); oldSource.props.onError(); h.render(); assert.equal(alerts(h).length, 0);
  history(h, { eintrag: lessons[0].id }); oldVideo.props.onError(); oldSource.props.onError(); h.render(); assert.equal(alerts(h).length, 0);
  oldVideo.props.onPlay({ currentTarget: { pause() { currentPaused++; } } }); assert.equal(currentPaused, 1);
  video(h).props.onError(); h.render(); assert.match(text(alerts(h)[0]), /Video lässt sich gerade nicht abspielen/);
});

test('Real failures open repair without switching media; superseded, cancelled and false transitions remain silent', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  const first = choose(h, lessons[1].id), second = choose(h, lessons[2].id);
  requests[0].reject(new Error('superseded')); await first; h.render(); assert.equal(alerts(h).length, 0);
  requests[1].reject(new Error('offline')); await second; h.render();
  assert.equal(article(h).key, lessons[0].id); assert.equal(h.menu.opened, 1); assert.match(text(alerts(h)[0]), /Szene konnte nicht geöffnet/);
  const cancelled = choose(h, lessons[1].id); requests[2].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  const refused = choose(h, lessons[2].id); requests[3].resolve(false); await refused; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 1); assert.equal(focus.film, 0); assert.equal(focus.transcript, 0);
});

test('Reselecting the actual scene cancels a pending different scene without an older completion releasing the pending guard', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  const first = choose(h, lessons[1].id), second = choose(h, lessons[2].id);
  requests[0].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await first;
  const current = choose(h, lessons[0].id); assert.equal(requests.length, 3); assert.equal(requests[2].href.query.eintrag, lessons[0].id);
  requests[1].reject(new Error('late')); await second; requests[2].resolve(true); await current; h.render();
  assert.equal(article(h).key, lessons[0].id); assert.equal(alerts(h).length, 0); assert.equal(focus.film, 1);
  await choose(h, lessons[0].id); h.render(); assert.equal(requests.length, 3); assert.equal(focus.film, 2);
});

test('Focusing follows the router film/transcript target even if window has a contradictory hash; picker links remain lower-menu actions', async t => {
  const previous = global.window; t.after(() => { global.window = previous; });
  global.window = { location: { hash: '#hundevideo-handlung' } };
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  await choose(h, lessons[0].id); assert.equal(focus.film, 1); assert.equal(focus.transcript, 0);
  global.window.location.hash = '#hundevideo-film';
  history(h, { eintrag: lessons[0].id }, 'hundevideo-handlung'); assert.equal(focus.transcript, 1);
  await choose(h, lessons[0].id); assert.equal(focus.transcript, 2); assert.equal(requests.length, 0);
  const action = choose(h, lessons[1].id); assert.equal(requests[0].href.hash, 'hundevideo-film');
  await commit(h, requests[0], action); assert.equal(focus.film, 2);
  history(h, { eintrag: lessons[1].id }, 'hundevideo-auswahl');
  const opened = h.menu.opened; await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(h.menu.opened, opened + 1);
});

test('Same-scene origins keep the player mount path but pause it; cleanup of a changed scene targets the captured departing player', t => {
  const h = fixture(t), first = bindPlayer(h), path = mountPath(h.tree, node => node.type === 'video');
  const childrenBefore = questions(h).map(node => ({ key: node.key, question: node.props.question }));
  history(h, { eintrag: lessons[0].id, ref: 'warmup' });
  assert.equal(first.pauses, 1); assert.deepEqual(mountPath(h.tree, node => node.type === 'video'), path);
  video(h).props.onError(); h.render();
  assert.equal(first.pauses, 1); assert.deepEqual(mountPath(h.tree, node => node.type === 'video'), path);
  assert.deepEqual(questions(h).map(node => ({ key: node.key, question: node.props.question })), childrenBefore);
  history(h, { eintrag: lessons[0].id, ref: 'warmup' }, 'hundevideo-handlung');
  assert.equal(first.pauses, 2); assert.deepEqual(mountPath(h.tree, node => node.type === 'video'), path);
  const second = bindPlayer(h); history(h, { eintrag: lessons[1].id });
  assert.equal(first.pauses, 3); assert.equal(second.pauses, 0);
  assert.notDeepEqual(mountPath(h.tree, node => node.type === 'video'), path);
  h.dispose(); assert.equal(second.pauses, 1);
});

test('Unmount blocks both same-scene and other-scene selectors before URL/state work, as well as late media and rejected navigation', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  const oldSelect = selector(h).props.onChange, oldVideo = video(h), oldSource = source(h), oldQuestion = questions(h)[0];
  const action = choose(h, lessons[1].id); h.dispose(); requests[0].reject(new Error('late unmount failure')); await action;
  await oldSelect({ target: { value: lessons[0].id } }); await oldSelect({ target: { value: lessons[2].id } });
  oldVideo.props.onError(); oldSource.props.onError(); let paused = 0;
  oldVideo.props.onPlay({ currentTarget: { pause() { paused++; } } }); h.render();
  assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0);
  assert.equal(oldQuestion.props.canInteract(), false); assert.equal(paused, 1); assert.deepEqual(focus, { film: 0, transcript: 0, scroll: 0 });
});
