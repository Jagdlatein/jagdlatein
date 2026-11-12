// Actual React effects with synthetic questions. No account, storage or network data.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const { nativeProps } = require('./helpers/account-exam-dom.cjs');

function question(overrides = {}) {
  return {
    id: 'practice-one',
    prompt: 'Welche der vier vorhandenen Antworten passt?',
    options: [
      { id: 'one', text: 'Antwort eins' }, { id: 'two', text: 'Antwort zwei' },
      { id: 'three', text: 'Antwort drei' }, { id: 'four', text: 'Antwort vier' },
    ],
    correctId: 'three',
    explanation: 'Die originale Erklärung gehört zu dieser Frage.',
    context: 'Synthetischer Lernkontext',
    href: '/kurse/synthetic#lesson-one',
    ...overrides,
  };
}

async function fixture(t, initial = question(), active = true) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
  const globals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let writes = 0;
  const ChatPractice = createLoader({ react: { ...React, useState(initialValue) {
    const [value, setValue] = React.useState(initialValue);
    return [value, next => { writes++; setValue(next); }];
  } } })('components/ChatPractice.js').default;
  const container = dom.window.document.getElementById('root');
  const root = local('react-dom/client').createRoot(container);
  const act = action => React.act(async () => action());
  let mounted = true, current = initial, enabled = active;
  const render = () => act(() => root.render(React.createElement(ChatPractice, { practice: current, active: enabled })));
  async function unmount() { if (mounted) { await act(() => root.unmount()); mounted = false; } }
  t.after(async () => {
    await unmount();
    dom.window.close();
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  await render();
  return {
    container, act, unmount, get writes() { return writes; },
    button: text => [...container.querySelectorAll('button')].find(button => button.textContent === text),
    choices: () => [...container.querySelectorAll('[role="group"] button')],
    choice: text => [...container.querySelectorAll('[role="group"] button')].find(button => button.querySelector('span').textContent === text),
    click: button => act(() => nativeProps(button).onClick()),
    async update(practice = current, active = enabled) { current = practice; enabled = active; await render(); },
  };
}

test('One explicit start reveals exactly four original choices without an answer or explanation', async t => {
  const practice = question();
  const h = await fixture(t, practice);
  assert.equal(h.container.querySelectorAll('button').length, 1);
  assert.equal(h.button('Kurz üben').type, 'button');
  assert.doesNotMatch(h.container.textContent, /Welche der|Antwort eins|originale Erklärung|Richtige Antwort/);
  await h.click(h.button('Kurz üben'));
  assert.equal(h.choices().length, 4);
  assert.equal(h.container.querySelector('h3').textContent, practice.prompt);
  assert.equal(h.container.ownerDocument.activeElement, h.container.querySelector('h3'));
  assert.match(h.container.textContent, /Synthetischer Lernkontext/);
  assert.deepEqual(h.choices().map(button => button.textContent).sort(), practice.options.map(option => option.text).sort());
  assert.ok(h.choices().every(button => !button.disabled && button.getAttribute('aria-pressed') === 'false'));
  assert.equal(h.container.querySelector('[role="status"]'), null);
  assert.doesNotMatch(h.container.textContent, /originale Erklärung|Richtige Antwort/);
});

test('A same-tick double answer freezes the first choice and labels correctness in words', async t => {
  const practice = question();
  const h = await fixture(t, practice);
  await h.click(h.button('Kurz üben'));
  const wrong = nativeProps(h.choice('Antwort eins')).onClick;
  const correct = nativeProps(h.choice('Antwort drei')).onClick;
  await h.act(() => { wrong(); correct(); });
  assert.ok(h.choices().every(button => button.disabled));
  assert.equal(h.choice('Antwort eins').getAttribute('aria-pressed'), 'true');
  assert.match(h.choice('Antwort eins').textContent, /Deine Antwort/);
  assert.match(h.choice('Antwort drei').textContent, /Richtige Antwort/);
  assert.equal(h.choice('Antwort drei').getAttribute('aria-pressed'), 'false');
  assert.match(h.container.querySelector('[role="status"]').textContent, /Die richtige Antwort ist markiert/);
  assert.ok(h.container.querySelector('[role="status"]').textContent.includes(practice.explanation));
  await h.update();
  assert.equal(h.choice('Antwort eins').getAttribute('aria-pressed'), 'true', 'an unchanged question retains the selected answer');
});

test('Retry preserves stable ordering while old choice and retry handlers cannot change the new attempt', async t => {
  const h = await fixture(t);
  await h.click(h.button('Kurz üben'));
  const order = h.choices().map(button => button.textContent);
  const oldWrong = nativeProps(h.choice('Antwort eins')).onClick;
  await h.click(h.choice('Antwort drei'));
  assert.match(h.container.querySelector('[role="status"]').textContent, /Richtig beantwortet/);
  assert.match(h.choice('Antwort drei').textContent, /Richtige Antwort · Deine Antwort/);
  const retry = nativeProps(h.button('Noch einmal')).onClick;
  await h.act(() => retry());
  assert.equal(h.container.ownerDocument.activeElement, h.container.querySelector('h3'));
  assert.deepEqual(h.choices().map(button => button.textContent), order);
  assert.equal(h.container.querySelector('[role="status"]'), null);
  const writes = h.writes;
  await h.act(() => { oldWrong(); retry(); });
  assert.equal(h.writes, writes);
  assert.ok(h.choices().every(button => !button.disabled));
  await h.click(h.choice('Antwort zwei'));
  assert.match(h.choice('Antwort zwei').textContent, /Deine Antwort/);
});

test('Replacing even an equal-ID question closes the old exercise and blocks its retained controls', async t => {
  const original = question();
  const h = await fixture(t, original);
  await h.click(h.button('Kurz üben'));
  const chooseOld = nativeProps(h.choice('Antwort drei')).onClick;
  await h.click(h.choice('Antwort eins'));
  const retryOld = nativeProps(h.button('Noch einmal')).onClick;
  await h.update(question({ prompt: 'Eine andere Frage mit derselben ID', explanation: 'Eine andere Erklärung' }));
  assert.ok(h.button('Kurz üben'));
  assert.doesNotMatch(h.container.textContent, /Welche der|originale Erklärung|Eine andere Frage/);
  const writes = h.writes;
  await h.act(() => { chooseOld(); retryOld(); });
  assert.equal(h.writes, writes);
  await h.click(h.button('Kurz üben'));
  assert.equal(h.container.querySelector('h3').textContent, 'Eine andere Frage mit derselben ID');
  assert.equal(h.container.querySelector('[role="status"]'), null);
});

test('A previous-region exercise hides its question and answer and invalidates controls across reactivation', async t => {
  const practice = question();
  const h = await fixture(t, practice);
  const oldOpen = nativeProps(h.button('Kurz üben')).onClick;
  await h.click(h.button('Kurz üben'));
  const oldAnswer = nativeProps(h.choice('Antwort drei')).onClick;
  await h.click(h.choice('Antwort drei'));
  const oldRetry = nativeProps(h.button('Noch einmal')).onClick;
  await h.update(practice, false);
  assert.match(h.container.textContent, /früheren Prüfungsregion/);
  assert.equal(h.container.querySelector('button, h3, [role="status"]'), null);
  assert.doesNotMatch(h.container.textContent, /originale Erklärung|Antwort drei/);
  const writes = h.writes;
  await h.act(() => { oldOpen(); oldAnswer(); oldRetry(); });
  assert.equal(h.writes, writes);
  await h.update(practice, true);
  await h.act(() => { oldOpen(); oldAnswer(); oldRetry(); });
  assert.equal(h.writes, writes, 'a previous active period does not regain control');
  assert.match(h.container.querySelector('[role="status"]').textContent, /Richtig beantwortet/);
});

test('Unmount prevents retained handlers from writing', async t => {
  const h = await fixture(t);
  const open = nativeProps(h.button('Kurz üben')).onClick;
  await h.click(h.button('Kurz üben'));
  const choose = nativeProps(h.choice('Antwort drei')).onClick;
  await h.click(h.choice('Antwort eins'));
  const retry = nativeProps(h.button('Noch einmal')).onClick;
  await h.unmount();
  const writes = h.writes;
  await h.act(() => { open(); choose(); retry(); });
  assert.equal(h.writes, writes);
  assert.equal(h.container.textContent, '');
});

test('Malformed questions expose no exercise', async t => {
  const invalid = await fixture(t, question({ correctId: 'missing' }));
  assert.equal(invalid.container.textContent, '');
  await invalid.update(question({ options: question().options.slice(0, 3) }));
  assert.equal(invalid.container.textContent, '');
  await invalid.update(question({ options: Array(4).fill({ id: 'same', text: 'Doppelt' }) }));
  assert.equal(invalid.container.textContent, '');
});
