// Real isolated hook lifetimes and synthetic learning actions. No accounts,
// remote services, stored answers, audio output, or product files are changed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { oralExamQuestions: questions } = createLoader()('lib/oral-exam-trainer.js');

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}

function fixture(t, { query = {}, hash = '', voices = [{ lang: 'de-CH', localService: true }] } = {}) {
  const previousWindow = global.window;
  const slots = [], effects = [], cleanups = new Map(), pushes = [], utterances = [], focused = [];
  const listeners = new Map();
  let cursor = 0, dirty = false, tree, disposed = false, stateWrites = 0, writesAfterDispose = 0;
  let cancelCalls = 0, voiceList = voices, voiceError = null;
  function pathFor(nextQuery, nextHash) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(nextQuery)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
    return `/lernen/pruefungsgespraech${params.size ? `?${params}` : ''}${nextHash ? `#${nextHash.replace(/^#/, '')}` : ''}`;
  }
  global.window = {
    location: { pathname: '/lernen/pruefungsgespraech', search: '', hash: '', href: '' },
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
    setTimeout, clearTimeout,
    speechSynthesis: {
      cancel() { cancelCalls++; },
      getVoices() { if (voiceError) throw voiceError; return voiceList; },
      speak(utterance) { utterances.push(utterance); },
    },
    SpeechSynthesisUtterance: function (prompt) { this.text = prompt; },
  };
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, input => {
        stateWrites++;
        if (disposed) { writesAfterDispose++; return; }
        const value = typeof input === 'function' ? input(slots[index].value) : input;
        dirty ||= !Object.is(slots[index].value, value);
        slots[index].value = value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || !previous.dependencies || dependencies.length !== previous.dependencies.length || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        slots[index] = { dependencies };
        effects.push({ index, callback });
      }
    },
    useMemo(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) slots[index] = { dependencies, value: callback() };
      return slots[index].value;
    },
  };
  const router = {
    isReady: true, pathname: '/lernen/pruefungsgespraech', query: {}, asPath: '',
    async push(url, as, options) {
      pushes.push({ url, as, options });
      const parsed = typeof url === 'string' ? new URL(url, 'https://jagdlatein.test') : null;
      const nextQuery = parsed ? Object.fromEntries(parsed.searchParams) : url.query || {};
      commit(nextQuery, parsed ? parsed.hash : url.hash || '');
      render();
      return true;
    },
  };
  function commit(nextQuery, nextHash = '') {
    router.query = { ...nextQuery }; router.asPath = pathFor(nextQuery, nextHash);
    const address = new URL(router.asPath, 'https://jagdlatein.test');
    Object.assign(global.window.location, { search: address.search, hash: address.hash, href: address.href });
  }
  commit(query, hash);
  const Component = createLoader({
    react: hooks,
    'next/router': { useRouter: () => router },
    'next/link': props => React.createElement('a', props, props.children),
    './LearningToolLayout': props => React.createElement('main', {}, props.children),
    './JagdakademiePromotion': () => null,
    './PageMenu': {
      __esModule: true,
      default: props => React.createElement('aside', {}, props.children),
      closePageMenu() {}, openPageMenu() {},
    },
  })('components/OralExamTrainer.js').default;
  function render() {
    assert.equal(disposed, false, 'Never render an unmounted instance');
    let passes = 0;
    do {
      assert.ok(passes++ < 12, 'State and dependency effects must settle');
      cursor = 0; dirty = false; tree = Component();
      for (const node of nodes(tree, node => node.props?.ref)) if (typeof node.props.ref === 'object') node.props.ref.current = {
        focus(options) { focused.push({ action: 'focus', text: text(node), options }); },
        scrollIntoView(options) { focused.push({ action: 'scroll', text: text(node), options }); },
      };
      while (effects.length) {
        const { index, callback } = effects.shift();
        cleanups.get(index)?.();
        const cleanup = callback();
        if (typeof cleanup === 'function') cleanups.set(index, cleanup);
        else cleanups.delete(index);
      }
    } while (dirty);
    return tree;
  }
  function dispose() {
    if (disposed) return;
    for (const cleanup of cleanups.values()) cleanup();
    disposed = true;
  }
  const find = predicate => nodes(tree, predicate)[0];
  function button(label) {
    const node = find(node => node.type === 'button' && text(node).trim() === label);
    assert.ok(node, `Missing button: ${label}`);
    return node;
  }
  function input(label) {
    const choice = find(node => node.type?.name === 'MenuChoice' && node.props.label === label);
    if (choice) return choice;
    const holder = find(node => node.type === 'label' && text(node).startsWith(label));
    assert.ok(holder, `Missing field: ${label}`);
    const node = nodes(holder, node => ['input', 'select', 'textarea'].includes(node.type))[0];
    assert.ok(node, label);
    return node;
  }
  async function act(handler, event) { await handler(event); render(); }
  t.after(() => { dispose(); global.window = previousWindow; });
  render();
  return {
    render, dispose, find, input, button, act, pushes, utterances, focused,
    body: () => text(tree), answer: () => input('Deine Antwort').props.value,
    click(label) { const node = button(label); assert.ok(!node.props.disabled, `Disabled: ${label}`); return act(node.props.onClick); },
    field(label, value) { return act(input(label).props.onChange, { target: { value, checked: value } }); },
    criterion(label) { return nodes(find(node => node.type === 'label' && text(node) === label), node => node.type === 'input')[0]; },
    restore(nextQuery, nextHash = '') { commit(nextQuery, nextHash); render(); },
    setVoices(value) { voiceList = value; }, setVoiceError(error) { voiceError = error; },
    get cancelCalls() { return cancelCalls; }, get stateWrites() { return stateWrites; }, get writesAfterDispose() { return writesAfterDispose; },
  };
}

async function answerAndRate(f, answer, rating = 'Sicher erklärt') {
  await f.field('Deine Antwort', answer);
  await f.click('Mit der Musterantwort vergleichen');
  await f.click(rating);
}
const singleCategory = questions.find(question => questions.filter(other => other.categorySlug === question.categorySlug).length === 1).categorySlug;

test('Current own-answer and self-rating conditions govern reveal and Next, even for retained old handlers', async t => {
  const f = fixture(t);
  assert.equal(f.button('Mit der Musterantwort vergleichen').props.disabled, true);
  await f.field('Deine Antwort', 'Initial explanation');
  const oldCompare = f.button('Mit der Musterantwort vergleichen').props.onClick;
  await f.field('Deine Antwort', '');
  await f.act(oldCompare);
  assert.ok(!f.body().includes(questions[0].model));
  await answerAndRate(f, 'An actual explanation');
  assert.ok(f.body().includes(questions[0].model));
  assert.ok(f.body().includes(questions[0].mistake));
  assert.ok(f.body().includes(questions[0].followUp));
  for (const criterion of questions[0].criteria) assert.ok(f.criterion(criterion));
  const oldNext = f.button('Nächste Frage').props.onClick;
  await f.field('Deine Antwort', 'Revised explanation that needs a fresh self-rating');
  assert.equal(f.button('Nächste Frage').props.disabled, true);
  const before = f.pushes.length;
  await f.act(oldNext);
  assert.equal(f.pushes.length, before);
  assert.equal(f.answer(), 'Revised explanation that needs a fresh self-rating');
  assert.ok(f.body().includes(questions[0].prompt));
  await f.click('Teilweise sicher');
  await f.click('Nächste Frage');
  assert.ok(f.body().includes(questions[1].prompt));
});

test('A retained criterion handler updates the current criteria without dropping newer choices and invalidates the old Next rating', async t => {
  const f = fixture(t), [question] = questions;
  await answerAndRate(f, 'Explanation before the checklist');
  const second = f.criterion(question.criteria[1]).props.onChange;
  const oldNext = f.button('Nächste Frage').props.onClick;
  await f.act(f.criterion(question.criteria[0]).props.onChange, { target: { checked: true } });
  await f.act(second, { target: { checked: true } });
  assert.equal(f.criterion(question.criteria[0]).props.checked, true);
  assert.equal(f.criterion(question.criteria[1]).props.checked, true);
  assert.equal(f.button('Nächste Frage').props.disabled, true);
  const before = f.pushes.length;
  await f.act(oldNext);
  assert.equal(f.pushes.length, before);
  await f.act(f.criterion(question.criteria[0]).props.onChange, { target: { checked: false } });
  assert.equal(f.criterion(question.criteria[0]).props.checked, false);
  assert.equal(f.criterion(question.criteria[1]).props.checked, true);
});

test('Question changes retain each answer while old origin handlers remain invalid after returning to the same question', async t => {
  const f = fixture(t), [first, second] = questions;
  await answerAndRate(f, 'First question draft');
  const oldAnswer = f.input('Deine Antwort').props.onChange;
  const oldRating = f.button('Noch offene Lücken').props.onClick;
  await f.field('Frage wählen', second.id);
  assert.equal(f.answer(), '');
  await f.field('Deine Antwort', 'Second question draft');
  await f.field('Frage wählen', first.id);
  assert.equal(f.answer(), 'First question draft');
  const before = f.stateWrites;
  await f.act(oldAnswer, { target: { value: 'Stale overwrite' } });
  await f.act(oldRating);
  assert.equal(f.stateWrites, before);
  assert.equal(f.answer(), 'First question draft');
  assert.equal(f.button('Sicher erklärt').props['aria-pressed'], true);
  await f.field('Frage wählen', second.id);
  assert.equal(f.answer(), 'Second question draft');
  const pushes = f.pushes.length;
  await f.field('Frage wählen', 'not-an-existing-question');
  assert.equal(f.pushes.length, pushes);
  assert.equal(f.answer(), 'Second question draft', 'Invalid selection cannot crash or discard the current response');
});

test('The manual spoken-answer path remains available without text and changing that claim requires a fresh self-rating', async t => {
  const f = fixture(t);
  await f.field(' Ich habe meine Antwort', true);
  assert.equal(f.answer(), '');
  assert.equal(f.button('Mit der Musterantwort vergleichen').props.disabled, false);
  await f.click('Mit der Musterantwort vergleichen');
  await f.click('Sicher erklärt');
  const oldNext = f.button('Nächste Frage').props.onClick;
  await f.field(' Ich habe meine Antwort', false);
  assert.equal(f.button('Mit der Musterantwort vergleichen').props.disabled, true);
  assert.equal(f.button('Nächste Frage').props.disabled, true);
  const before = f.pushes.length;
  await f.act(oldNext);
  assert.equal(f.pushes.length, before);
  assert.ok(f.body().includes(questions[0].prompt));
});

test('Explicit repetition resets only its own question IDs and stale summary actions cannot reset a newer answer', async t => {
  const f = fixture(t), [first, second] = questions, last = questions.at(-1);
  await answerAndRate(f, 'Repeat this answer', 'Noch offene Lücken');
  await f.field('Frage wählen', second.id);
  await answerAndRate(f, 'Keep this secure answer');
  await f.field('Frage wählen', last.id);
  await answerAndRate(f, 'Last secure answer');
  await f.click('Runde auswerten');
  assert.ok(f.body().includes('Deine Gesprächsrunde'));
  const oldRepeat = f.button('Offene Fragen erneut erklären').props.onClick;
  const oldReset = f.button('Neue Runde beginnen').props.onClick;
  await f.click('Offene Fragen erneut erklären');
  assert.ok(f.body().includes(first.prompt));
  assert.equal(f.answer(), '');
  assert.ok(!f.body().includes(first.model));
  await f.field('Deine Antwort', 'New explanation in the repeated round');
  const before = f.stateWrites, pushes = f.pushes.length;
  await f.act(oldRepeat); await f.act(oldReset);
  assert.equal(f.stateWrites, before);
  assert.equal(f.pushes.length, pushes);
  assert.equal(f.answer(), 'New explanation in the repeated round');
  await f.field('Themenbereich', second.categorySlug);
  await f.field('Frage wählen', second.id);
  assert.equal(f.answer(), 'Keep this secure answer');
  assert.equal(f.button('Sicher erklärt').props['aria-pressed'], true);
});

test('An explicit new round clears answers but retains its selected URL question, and the previous reset cannot clear the new draft', async t => {
  const f = fixture(t);
  await f.field('Themenbereich', singleCategory);
  const question = questions.find(item => item.categorySlug === singleCategory);
  await answerAndRate(f, 'Previous round');
  await f.click('Runde auswerten');
  const oldReset = f.button('Neue Runde beginnen').props.onClick;
  await f.click('Neue Runde beginnen');
  assert.ok(f.body().includes(question.prompt));
  assert.equal(f.answer(), '');
  await f.field('Deine Antwort', 'Current round draft');
  const before = f.stateWrites;
  await f.act(oldReset);
  assert.equal(f.stateWrites, before);
  assert.equal(f.answer(), 'Current round draft');
});

test('Reading requires a local German voice and keeps the textual question usable when voices are absent or the device API fails', async t => {
  const f = fixture(t, { voices: [{ lang: 'de-DE', localService: false }, { lang: 'en-US', localService: true }] });
  await f.click('Frage vorlesen');
  assert.equal(f.utterances.length, 0);
  assert.match(f.body(), /Keine lokale deutsche Gerätestimme verfügbar/);
  assert.ok(f.body().includes(questions[0].prompt));
  f.setVoices([{ lang: 'de-AT', localService: true }]);
  await f.click('Frage vorlesen');
  assert.equal(f.utterances.length, 1);
  assert.equal(f.utterances[0].text, questions[0].prompt);
  assert.equal(f.utterances[0].voice.localService, true);
  assert.equal(f.utterances[0].lang, 'de-AT');
  f.setVoiceError(new Error('Synthetic local device error'));
  await f.click('Frage vorlesen');
  assert.equal(f.utterances.length, 1);
  assert.match(f.body(), /Vorlesen.*nicht verfügbar/);
  assert.ok(f.body().includes(questions[0].prompt));
});

test('Old Read, Stop and speech errors cannot affect a different question or a later origin of the same question', async t => {
  const f = fixture(t), [first, second] = questions;
  await f.click('Frage vorlesen');
  const oldSpeech = f.utterances.at(-1);
  const oldRead = f.button('Frage vorlesen').props.onClick;
  const oldStop = f.button('Vorlesen stoppen').props.onClick;
  await f.field('Frage wählen', second.id);
  await f.click('Frage vorlesen');
  let before = f.stateWrites, cancelled = f.cancelCalls, spoken = f.utterances.length;
  await f.act(oldRead); await f.act(oldStop);
  oldSpeech.onerror?.({ error: 'synthetic-late-error' }); f.render();
  assert.equal(f.stateWrites, before);
  assert.equal(f.cancelCalls, cancelled);
  assert.equal(f.utterances.length, spoken);
  assert.ok(f.body().includes(second.prompt));
  await f.field('Frage wählen', first.id);
  await f.click('Frage vorlesen');
  before = f.stateWrites; cancelled = f.cancelCalls; spoken = f.utterances.length;
  await f.act(oldRead); await f.act(oldStop);
  oldSpeech.onerror?.({ error: 'synthetic-late-error' }); f.render();
  assert.equal(f.stateWrites, before);
  assert.equal(f.cancelCalls, cancelled);
  assert.equal(f.utterances.length, spoken);
  await f.click('Vorlesen stoppen');
  assert.match(f.body(), /Vorlesen beendet/);
});

test('Repeating Read on the same question replaces its speech ticket even when the displayed notice is unchanged', async t => {
  const f = fixture(t);
  await f.click('Frage vorlesen');
  const firstSpeech = f.utterances.at(-1), oldStop = f.button('Vorlesen stoppen').props.onClick;
  await f.click('Frage vorlesen');
  assert.equal(f.utterances.length, 2);
  assert.equal(f.utterances[0].text, f.utterances[1].text);
  let before = f.stateWrites, cancelled = f.cancelCalls;
  await f.act(oldStop);
  firstSpeech.onerror?.({ error: 'synthetic-replaced-read-error' }); f.render();
  assert.equal(f.stateWrites, before);
  assert.equal(f.cancelCalls, cancelled);
  const currentSpeech = f.utterances.at(-1);
  await f.click('Vorlesen stoppen');
  assert.ok(f.cancelCalls > cancelled);
  before = f.stateWrites;
  currentSpeech.onerror?.({ error: 'synthetic-stopped-error' }); f.render();
  assert.equal(f.stateWrites, before);
  assert.match(f.body(), /Vorlesen beendet/);
});

test('Finishing and restarting a one-question round cancels speech even when the question ID stays identical', async t => {
  const f = fixture(t);
  await f.field('Themenbereich', singleCategory);
  await f.click('Frage vorlesen');
  const oldSpeech = f.utterances.at(-1), oldStop = f.button('Vorlesen stoppen').props.onClick;
  await answerAndRate(f, 'My final explanation');
  const beforeFinish = f.cancelCalls;
  await f.click('Runde auswerten');
  assert.ok(f.cancelCalls > beforeFinish, 'A summary view must stop the departed question voice');
  let before = f.stateWrites;
  oldSpeech.onerror?.({ error: 'synthetic-summary-error' }); f.render();
  assert.equal(f.stateWrites, before);
  await f.click('Neue Runde beginnen');
  await f.click('Frage vorlesen');
  before = f.stateWrites;
  const cancelled = f.cancelCalls;
  oldSpeech.onerror?.({ error: 'synthetic-old-round-error' });
  await f.act(oldStop);
  assert.equal(f.stateWrites, before);
  assert.equal(f.cancelCalls, cancelled);
  assert.match(f.body(), /lokalen Gerätestimme/);
});

test('Unmount invalidates answer, criteria, rating, Next, Read, Stop and current utterance errors before any state or navigation write', async t => {
  const f = fixture(t), [question] = questions;
  await answerAndRate(f, 'Own answer before leaving');
  await f.click('Frage vorlesen');
  const actions = [
    [f.input('Deine Antwort').props.onChange, { target: { value: 'Late answer' } }],
    [f.input(' Ich habe meine Antwort').props.onChange, { target: { checked: true } }],
    [f.criterion(question.criteria[0]).props.onChange, { target: { checked: true } }],
    [f.button('Noch offene Lücken').props.onClick],
    [f.button('Nächste Frage').props.onClick],
    [f.button('Frage vorlesen').props.onClick],
    [f.button('Vorlesen stoppen').props.onClick],
  ];
  const utterance = f.utterances.at(-1);
  f.dispose();
  const before = f.stateWrites, cancelled = f.cancelCalls, pushes = f.pushes.length, spoken = f.utterances.length;
  for (const [handler, event] of actions) await handler(event);
  utterance.onerror?.({ error: 'synthetic-unmounted-error' });
  assert.equal(f.stateWrites, before);
  assert.equal(f.writesAfterDispose, 0);
  assert.equal(f.cancelCalls, cancelled);
  assert.equal(f.pushes.length, pushes);
  assert.equal(f.utterances.length, spoken);
});
