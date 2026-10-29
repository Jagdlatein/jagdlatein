const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
function load(relative, overrides = {}, globals = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'window', 'setTimeout', 'clearTimeout', 'process', 'Date', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, globals);
    return pr(id);
  }, mod, mod.exports, globals.fetch, globals.window, globals.setTimeout || setTimeout, globals.clearTimeout || clearTimeout, globals.process || process, globals.Date || Date);
  return mod.exports;
}
const { getNextUrl, getLoginDestination, getLoginContinuation } = load('lib/login-destination.js');
const unpaid = { paid: false, admin: false };

test('Welcome preserves the exact computed safe checkout, including an explicitly configured HTTPS payment URL', () => {
  for (const payment of ['/preise#paypal-subscribe-preise', 'https://checkout.example.invalid/pay', 'https://checkout.example.invalid/pay?offer=1#confirm']) {
    for (const next of ['/lernen', '/kurse/wissen-jagdrecht-ch?lektion=2#quellen']) {
      const computed = getLoginDestination(next, unpaid, payment);
      assert.equal(getLoginContinuation(computed, payment), computed);
    }
  }
  for (const next of ['/konto', '/community?thema=Wild#frage', '/preise?next=%2Flernen#paypal-subscribe-preise']) {
    assert.equal(getLoginContinuation(next, 'https://checkout.example.invalid/pay'), next);
  }
});

test('Welcome never promotes arbitrary external next, payment lookalikes, credentials or extra redirect fields', () => {
  const payment = 'https://checkout.example.invalid/pay?offer=1#confirm';
  for (const value of ['https://evil.invalid/', '//evil.invalid/', 'https://checkout.example.invalid.evil.invalid/pay?offer=1&next=%2Flernen#confirm',
    'https://checkout.example.invalid/pay?offer=1&next=https%3A%2F%2Fevil.invalid%2F#confirm',
    'https://checkout.example.invalid/pay?offer=1&next=%2Flernen&extra=1#confirm',
    'https://checkout.example.invalid/pay?offer=1&next=%2Flernen#other', '/login', '/registrieren', ['https://evil.invalid/'], null]) {
    assert.equal(getLoginContinuation(value, payment), '/', String(value));
  }
  for (const configured of ['http://checkout.example.invalid/pay', 'https://user:secret@checkout.example.invalid/pay']) {
    assert.equal(getLoginContinuation(getLoginDestination('/lernen', unpaid, configured), configured), '/');
  }
});
test('An unpaid learner returns to the free community with category, topic and thread context preserved', () => {
  for (const route of ['/community', '/community/?category=hundewesen&thema=R%C3%BCckruf#frage', '/community/11111111-1111-4111-8111-111111111111']) {
    assert.equal(getLoginDestination(route, unpaid), route);
  }
});
test('Personal account and statistics need identity, while learning and unknown forum paths still lead to prices', () => {
  for (const route of ['/konto', '/meine-kurse', '/auswertungen', '/quiz-app/stats', '/quiz/stats']) assert.equal(getLoginDestination(route, unpaid), route);
  for (const route of ['/lernen', '/community/admin', '/community/not-a-thread', '/kurse/hundewesen?modus=test#quiz']) {
    assert.equal(new URL(getLoginDestination(route, unpaid), 'https://test.invalid').searchParams.get('next'), route);
  }
});
test('An unpaid learner returns directly to checkout, preserving the original learning destination once', () => {
  for (const route of ['/preise', '/preise?next=%2Flernen%3Fsuche%3Dgams#paypal-subscribe-preise']) {
    assert.equal(getLoginDestination(route, unpaid), route);
    assert.equal(getLoginDestination(route, { paid: true }), route);
  }
});
test('Paid or administrator access returns directly to the selected safe learning page', () => {
  for (const account of [{ paid: true }, { admin: true }]) assert.equal(getLoginDestination('/lernen?suche=gams', account), '/lernen?suche=gams');
  assert.match(getLoginDestination('/lernen', { paid: 'true', admin: 1 }), /^\/preise\?/);
});
test('Unsafe return URLs and login loops cannot become navigation destinations', () => {
  for (const route of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/%5cevil.invalid', '/%2f%2fevil.invalid', '/login', '/registrieren', '/login/?next=/lernen', '/%6cogin', '/bad%escape', '/%0anews', '/\nnews', null]) assert.equal(getNextUrl(route), '/');
  assert.equal(getNextUrl(['/community', 'https://evil.invalid']), '/community');
  assert.equal(getLoginDestination('/lernen#quiz', unpaid, '/preise?aktion=abo#paypal'), '/preise?aktion=abo&next=%2Flernen%23quiz#paypal');
});

function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, json: async () => body });
function harness(fetch, props = {}, query = { next: '/community?category=hundewesen' }) {
  const states = ['member@example.invalid', '123456', 'code', '', false], refs = [], effects = [], timers = new Map(), calls = [];
  let cursor = 0, refCursor = 0, effectCursor = 0, sequence = 0, dirty = false;
  let pendingEffects = [];
  let now = 1780000000000;
  class ClockDate extends Date { static now() { return now; } }
  const window = { location: { href: null } };
  const Component = load('pages/login.js', { react: { ...React,
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => {
      const next = typeof value === 'function' ? value(states[i]) : value;
      if (!Object.is(next, states[i])) { states[i] = next; dirty = true; }
    }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ||= { current: initial }; },
    useEffect(fn, deps) { const i = effectCursor++, previous = effects[i];
      if (!previous || !deps || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
        pendingEffects.push(() => { previous?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
      }
    },
  }, 'next/router': { useRouter: () => ({ query }) } }, {
    fetch: async (...args) => { calls.push(args); return fetch(...args); }, window,
    Date: ClockDate,
    setTimeout: (fn, delay) => { timers.set(++sequence, { fn, delay, dueAt: now + delay }); return sequence; }, clearTimeout: id => timers.delete(id),
  }).default;
  const render = changes => {
    if (changes) props = { ...props, ...changes };
    let tree;
    do {
      dirty = false; cursor = 0; refCursor = 0; effectCursor = 0; pendingEffects = [];
      tree = Component(props);
      pendingEffects.forEach(fn => fn());
    } while (dirty);
    return tree;
  };
  return { states, calls, timers, window, render, unmount: () => effects.forEach(effect => effect?.cleanup?.()),
    submit: tree => find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }),
    advance: elapsed => { now += elapsed; for (const [id, timer] of [...timers]) if (timer.dueAt <= now) { timers.delete(id); timer.fn(); } },
  };
}

test('Registration confirms through the free-account endpoint and preserves a free community destination', async () => {
  const h = harness(() => response({ success: true, paid: false, admin: false }), { registration: true, allowRegistration: true });
  await h.submit(h.render());
  assert.equal(h.calls[0][0], '/api/auth/register-verify');
  assert.deepEqual(JSON.parse(h.calls[0][1].body), { email: 'member@example.invalid', code: '123456' });
  const navigation = [...h.timers.values()].find(item => item.delay === 500);
  navigation.fn();
  assert.equal(h.render().props.destination, '/community?category=hundewesen');
});

test('Requesting a code preserves the neutral server message without claiming the account exists or mail arrived', async () => {
  const message = 'Falls diese E-Mail registriert ist, wurde ein Login-Code versendet.';
  for (const serverMessage of [message, undefined]) {
    const h = harness(() => response({ success: true, ...(serverMessage ? { message: serverMessage } : {}) }));
    h.states[2] = 'email'; h.states[1] = '';
    await h.submit(h.render());
    assert.equal(h.calls[0][0], '/api/auth/request-code');
    assert.equal(h.states[2], 'code'); assert.equal(h.states[3], message);
    const html = renderToStaticMarkup(h.render());
    assert.match(html, /Code für/); assert.ok(!html.includes('Wir haben dir'));
    h.unmount();
  }
  const registrationMessage = 'Falls die Adresse erreichbar ist, wurde ein Bestätigungscode versendet. Bitte prüfe auch den Spamordner.';
  const h = harness(() => response({ success: true, message: registrationMessage }), { registration: true });
  h.states[2] = 'email'; h.states[1] = '';
  await h.submit(h.render());
  assert.equal(h.calls[0][0], '/api/auth/register-request'); assert.equal(h.states[3], registrationMessage);
  h.unmount();
});

test('Both payment entry routes use the same email flow and preserve checkout context', async () => {
  const next = '/preise?next=%2Fkurse%2Fhundewesen%3Fmodus%3Dtest#paypal-subscribe-preise';
  for (const registration of [false, true]) {
    const h = harness(() => response({ success: true, paid: false, admin: false }), { registration, allowRegistration: true }, { next });
    h.states[2] = 'email';
    const html = renderToStaticMarkup(h.render());
    assert.match(html, /Schritte zum Abo/);
    assert.match(html,/Anmelden oder Konto erstellen/);
    assert.match(html,/Dein bestehendes Konto bleibt erhalten/);
    assert.match(html,/Ein neues Konto entsteht erst nach der Codebestätigung/);
    assert.doesNotMatch(html,/aria-label="Jagdlatein-Konto wählen"/);
    const links = [...html.matchAll(/href="(\/(?:login|registrieren)\?[^"]+)"/g)].map(match => new URL(match[1], 'https://jagdlatein.invalid'));
    assert.equal(links.length, 0);
    for (const link of links) assert.equal(link.searchParams.get('next'), next);
    h.states[2] = 'code'; h.states[1] = '123456';
    assert.match(renderToStaticMarkup(h.render()), /Bestätigen und weiter/);
    await h.submit(h.render());
    assert.equal(h.calls[0][0], '/api/auth/register-verify');
    [...h.timers.values()].find(item => item.delay === 500).fn();
    assert.equal(h.render().props.destination, next);
    h.unmount();
  }
});

test('Native account entry and web checkout request and verify the same OTP for new or existing addresses', async () => {
  for (const email of ['new@example.invalid', 'member@example.invalid']) {
    for (const next of ['/konto', '/preise?next=%2Flernen#paypal-subscribe-preise']) {
      const h = harness(() => response({ success: true, ...unpaid }), { allowRegistration: true }, { next, reauth: '1' });
      h.states[0] = email; h.states[1] = ''; h.states[2] = 'email';
      const html = renderToStaticMarkup(h.render());
      assert.match(html, /Anmelden oder Konto erstellen/);
      assert.match(html, /Ein neues Konto entsteht erst nach der Codebestätigung/);
      assert.doesNotMatch(html, /Ich habe ein Konto|Kostenlos registrieren|Jagdlatein-Konto wählen/);
      await h.submit(h.render());
      assert.equal(h.calls.length, 1, 'No preflight account-existence lookup.');
      assert.equal(h.calls[0][0], '/api/auth/register-request');
      assert.deepEqual(JSON.parse(h.calls[0][1].body), { email });
      assert.equal(h.window.location.href, null, 'Email request does not authenticate or buy.');
      assert.match(h.states[3], /Falls die Adresse erreichbar/);
      h.states[1] = '123456';
      await h.submit(h.render());
      assert.equal(h.calls[1][0], '/api/auth/register-verify');
      assert.deepEqual(JSON.parse(h.calls[1][1].body), { email, code: '123456' });
      [...h.timers.values()].find(timer => timer.delay === 500).fn();
      assert.equal(h.render().props.destination, next);
      h.unmount();
    }
  }
});

test('Disabling registration cancels the prior unified request and starts an independent login-code flow', async () => {
  const old = deferred(); let sends = 0;
  const h = harness(() => ++sends === 1 ? old.promise : response({ success: true, ...unpaid }), { allowRegistration: true }, { next: '/konto', reauth: '1' });
  h.states[2] = 'email';
  const previous = h.submit(h.render());
  assert.equal(h.calls[0][0], '/api/auth/register-request');
  h.states[1] = '999999';
  const switched = h.render({ allowRegistration: false });
  assert.equal(h.calls[0][1].signal.aborted, true);
  assert.equal(h.states[1], ''); assert.equal(h.states[2], 'email');
  assert.match(renderToStaticMarkup(switched), /Login-Code senden/);
  const current = h.submit(switched);
  old.resolve(response({ success: true, message: 'Obsolete registration response' }));
  await Promise.all([previous, current]);
  assert.equal(h.calls[1][0], '/api/auth/request-code');
  assert.doesNotMatch(h.states[3], /Obsolete/);
  h.states[1] = '123456'; await h.submit(h.render());
  assert.equal(h.calls[2][0], '/api/auth/verify-code');
  [...h.timers.values()].find(timer => timer.delay === 500).fn();
  assert.equal(h.render().props.destination, '/konto');
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('Switching unified entry routes preserves the email, clears the code, and honors the same resend deadline', async () => {
  const h = harness(() => response({ success: true }), { allowRegistration: true });
  h.states[2] = 'email';
  await h.submit(h.render());
  h.states[1] = '456789';
  const switched = h.render({ registration: true });
  assert.equal(h.states[0], 'member@example.invalid');
  assert.equal(h.states[1], ''); assert.equal(h.states[2], 'email'); assert.equal(h.states[3], '');
  assert.equal(find(switched, node => node.type === 'input').props.type, 'email');
  assert.equal(h.calls.length, 1, 'Changing mode must not send mail automatically.');
  await h.submit(switched);
  assert.equal(h.calls.length, 1, 'The same OTP endpoint keeps its original resend deadline across routes.');
  assert.equal(h.states[2], 'code');
  h.render({ registration: false });
  assert.equal(h.states[1], ''); assert.equal(h.states[2], 'email');
  await h.submit(h.render());
  assert.equal(h.calls.length, 1, 'Returning to login must honor the same deadline.');
  assert.equal(h.states[2], 'code');
  assert.match(h.states[3], /zuletzt angeforderten Code/);
  h.advance(60000);
  const resend = find(h.render(), node => node.type === 'button' && node.props.children === 'Neuen Code senden');
  await resend.props.onClick({ preventDefault() {} });
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1][0], '/api/auth/register-request');
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('An aborted old-mode response cannot overwrite or release a newer registration request', async () => {
  const login = deferred(), registration = deferred();
  let sends = 0;
  const h = harness(() => ++sends === 1 ? login.promise : registration.promise, { allowRegistration: true });
  h.states[2] = 'email';
  const oldRequest = h.submit(h.render());
  const switched = h.render({ registration: true });
  assert.equal(h.calls[0][1].signal.aborted, true);
  assert.equal(h.timers.size, 0, 'Mode cleanup cancels the former timeout too.');
  const newRequest = h.submit(switched);
  login.resolve(response({ success: true, message: 'Old login message' }));
  await oldRequest;
  assert.equal(h.states[2], 'email'); assert.equal(h.states[3], ''); assert.equal(h.states[4], true);
  await h.submit(h.render()); assert.equal(h.calls.length, 2, 'The newer request remains protected against double submit.');
  registration.resolve(response({ success: true, message: 'Registration confirmation requested' }));
  await newRequest;
  assert.equal(h.states[2], 'code'); assert.equal(h.states[3], 'Registration confirmation requested');
  assert.equal(h.states[4], false); assert.equal(h.window.location.href, null);
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('Changing mode cancels a completed verification redirect and ignores its old callback', async () => {
  const h = harness(() => response({ success: true, paid: true }), { allowRegistration: true });
  await h.submit(h.render());
  const redirect = [...h.timers.values()].find(timer => timer.delay === 500);
  assert.ok(redirect);
  h.render({ registration: true });
  assert.equal(h.states[0], 'member@example.invalid'); assert.equal(h.states[1], '');
  assert.equal(h.states[2], 'email'); assert.equal(h.states[4], false);
  assert.equal(h.timers.size, 0);
  redirect.fn(); assert.equal(h.window.location.href, null);
  h.unmount();
});

test('Unified sign-in keeps a free community destination without another account-choice link', async () => {
  const next = '/community/11111111-1111-4111-8111-111111111111?thema=Gams#frage';
  const page = load('pages/login.js', { 'next/router': { useRouter: () => ({ query: { next } }) } }).default;
  const html = renderToStaticMarkup(React.createElement(page, { allowRegistration: true }));
  assert.doesNotMatch(html, /href="\/(?:login|registrieren)\?/);
  assert.match(html, /Anmelden oder Konto erstellen/);
  const h = harness(() => response({ success: true, ...unpaid }), { allowRegistration: true }, { next });
  await h.submit(h.render());
  assert.equal(h.calls[0][0], '/api/auth/register-verify');
  [...h.timers.values()].find(timer => timer.delay === 500).fn();
  assert.equal(h.render().props.destination, next); h.unmount();
  assert.ok(!html.includes('Schritte zum Abo'));
});

test('Resending a code uses the existing endpoint, clears a stale entry and blocks parallel sends', async () => {
  for (const registration of [false, true]) {
    const pending = deferred();
    const h = harness(() => pending.promise, { registration });
    const tree = h.render();
    const resend = find(tree, node => node.type === 'button' && node.props.children === 'Neuen Code senden');
    const event = { preventDefault() {} };
    const first = resend.props.onClick(event);
    await resend.props.onClick(event);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0][0], registration ? '/api/auth/register-request' : '/api/auth/request-code');
    assert.deepEqual(JSON.parse(h.calls[0][1].body), { email: 'member@example.invalid' });
    pending.resolve(response({ success: true }));
    await first;
    assert.equal(h.states[1], '');
    assert.equal(h.states[2], 'code');
    assert.equal(h.states[4], false);
    assert.equal(h.window.location.href, null);
    const html = renderToStaticMarkup(h.render());
    assert.match(html, /Neuer Code in 60 Sekunden/);
    assert.equal(find(h.render(), node => node.type === 'button' && node.props.children === 'Neuen Code senden').props.disabled, true);
    assert.ok(!html.includes('Wir haben dir'));
    h.unmount();
  }
});

test('A successful request blocks resending for one minute without clearing an entered code, then permits a new request', async () => {
  for (const registration of [false, true]) {
    const h = harness(() => response({ success: true }), { registration });
    h.states[2] = 'email';
    await h.submit(h.render());
    h.states[1] = '456789';
    const resend = () => find(h.render(), node => node.type === 'button' && node.props.children === 'Neuen Code senden');
    assert.equal(resend().props.disabled, true);
    await resend().props.onClick({ preventDefault() {} });
    assert.equal(h.calls.length, 1);
    assert.equal(h.states[1], '456789');
    assert.match(h.states[3], /zuletzt angeforderten Code/);
    h.advance(59000);
    assert.equal(resend().props.disabled, true);
    assert.match(renderToStaticMarkup(h.render()), /Neuer Code in 1 Sekunde/);
    h.advance(1000);
    assert.equal(resend().props.disabled, false);
    await resend().props.onClick({ preventDefault() {} });
    assert.equal(h.calls.length, 2);
    assert.equal(h.states[1], '');
    assert.equal(resend().props.disabled, true);
    h.unmount();
    assert.equal(h.timers.size, 0);
  }
});

test('The resend deadline catches up after the browser was paused, without announcing every timer tick', async () => {
  const h = harness(() => response({ success: true }));
  h.states[2] = 'email';
  await h.submit(h.render());
  const waiting = find(h.render(), node => node.type === 'p' && node.props.id === 'resend-help');
  assert.equal(waiting.props['aria-live'], undefined);
  assert.equal(waiting.props.role, undefined);
  assert.equal(find(waiting, node => node.type === 'span' && node.props['aria-hidden'] === 'true')?.props.children?.[1], 60);
  h.advance(5 * 60000);
  assert.equal(find(h.render(), node => node.type === 'button' && node.props.children === 'Neuen Code senden').props.disabled, false);
  assert.equal(h.timers.size, 0);
  h.unmount();
});

test('Editing an address preserves its request deadline while a different address can receive its own code', async () => {
  for (const registration of [false, true]) {
    const h = harness(() => response({ success: true }), { registration });
    h.states[2] = 'email';
    await h.submit(h.render());
    const edit = () => find(h.render(), node => node.type === 'button' && node.props.children === 'E-Mail ändern');
    assert.equal(edit().props.disabled, false);
    edit().props.onClick();
    find(h.render(), node => node.type === 'input').props.onChange({ target: { value: '  MEMBER@EXAMPLE.INVALID  ' } });
    await h.submit(h.render());
    assert.equal(h.calls.length, 1);
    assert.equal(h.states[2], 'code');
    edit().props.onClick();
    find(h.render(), node => node.type === 'input').props.onChange({ target: { value: 'other@example.invalid' } });
    await h.submit(h.render());
    assert.equal(h.calls.length, 2);
    assert.deepEqual(JSON.parse(h.calls[1][1].body), { email: 'other@example.invalid' });
    edit().props.onClick();
    find(h.render(), node => node.type === 'input').props.onChange({ target: { value: 'member@example.invalid' } });
    await h.submit(h.render());
    assert.equal(h.calls.length, 2);
    h.unmount();
    assert.equal(h.timers.size, 0);
  }
});

test('A failed code request leaves resend available and an entered code can still be corrected during the wait', async () => {
  let failing = true;
  const h = harness(() => failing ? response({ success: false, message: 'Dienst nicht erreichbar' }, 503) : response({ success: true }));
  const resend = () => find(h.render(), node => node.type === 'button' && node.props.children === 'Neuen Code senden');
  await resend().props.onClick({ preventDefault() {} });
  assert.equal(resend().props.disabled, false);
  assert.equal(h.states[1], '123456');
  assert.equal(h.timers.size, 0);
  failing = false;
  await resend().props.onClick({ preventDefault() {} });
  find(h.render(), node => node.type === 'input').props.onChange({ target: { value: '12 34-56' } });
  assert.equal(h.states[1], '123456');
  assert.equal(find(h.render(), node => node.type === 'button' && node.props.type === 'submit').props.disabled, false);
  await h.submit(h.render());
  assert.equal(h.calls[2][0], '/api/auth/verify-code');
  assert.deepEqual(JSON.parse(h.calls[2][1].body), { email: 'member@example.invalid', code: '123456' });
  h.unmount();
  assert.equal(h.timers.size, 0);
});

test('Email and code fields support mobile keyboards and focus after changing the email step', () => {
  for (const registration of [false, true]) {
    const h = harness(() => response({ success: true }), { registration });
    const code = find(h.render(), node => node.type === 'input');
    assert.equal(code.props.inputMode, 'numeric');
    assert.equal(code.props.autoComplete, 'one-time-code');
    assert.equal(code.props.enterKeyHint, 'go');
    assert.equal(code.props.autoFocus, true);
    find(h.render(), node => node.type === 'button' && node.props.children === 'E-Mail ändern').props.onClick();
    const email = find(h.render(), node => node.type === 'input');
    assert.equal(email.props.type, 'email');
    assert.equal(email.props.inputMode, 'email');
    assert.equal(email.props.enterKeyHint, 'next');
    assert.equal(email.props.autoFocus, true);
    assert.notEqual(email.key, code.key);
    assert.equal(h.calls.length, 0, 'Changing email must not send a request automatically.');
    h.unmount();
  }
});

test('Disabled registration preserves a safe return destination when it falls back to sign-in', async () => {
  const page = load('pages/registrieren.js', {}, { process: { env: { ACCOUNT_REGISTRATION_ENABLED: 'false' } } });
  for (const [next, expected] of [['/preise?next=%2Flernen#paypal-subscribe-preise', '/preise?next=%2Flernen#paypal-subscribe-preise'],
    ['//evil.invalid', '/'], ['/login?next=/preise', '/'], [undefined, '/']]) {
    const result = await page.getServerSideProps({ query: { next } });
    const target = new URL(result.redirect.destination, 'https://jagdlatein.invalid');
    assert.equal(target.pathname, '/login');
    assert.equal(target.searchParams.get('next'), expected);
    assert.equal(result.redirect.permanent, false);
  }
});

test('Authentication pages expose only a private-derived mail mode, never tester addresses or transport credentials', async () => {
  for (const isolated of [false, true]) for (const mode of [undefined, 'sink', 'tester-smtp']) {
    const env = { ACCOUNT_REGISTRATION_ENABLED: 'true', JL_TEST_MAIL_MODE: mode,
      JL_TEST_MAIL_RECIPIENTS: 'private-tester@example.invalid', JL_TEST_SMTP_PASS: 'private-test-smtp-password',
      JL_TEST_SMTP_USER: 'private-sender@example.invalid', JL_TEST_SMTP_FROM: 'private-from@example.invalid',
      ...(isolated ? { JL_TEST_ENVIRONMENT: 'paypal-sandbox' } : {}) };
    const globals = { process: { env } };
    const login = await load('pages/login.js', {}, globals).getServerSideProps({ req: { cookies: {} },
      query: { isTestMail: isolated ? 'false' : 'true', testMailMode: isolated ? 'sink' : 'tester-smtp' } });
    const registration = await load('pages/registrieren.js', {}, globals).getServerSideProps({});
    const testMailMode = isolated ? mode || 'sink' : null;
    assert.deepEqual(login.props, { allowRegistration: true, isTestMail: isolated, testMailMode, allowReviewLogin: false });
    assert.deepEqual(registration.props, { registration: true, allowRegistration: true, isTestMail: isolated, testMailMode });
    const exposed = JSON.stringify([login.props, registration.props]);
    for (const key of ['JL_TEST_MAIL_RECIPIENTS', 'JL_TEST_SMTP_USER', 'JL_TEST_SMTP_PASS', 'JL_TEST_SMTP_FROM']) {
      assert.ok(!exposed.includes(key)); assert.ok(!exposed.includes(env[key]));
    }
  }
});

function reviewEntryEnvironment(changes = {}) {
  const now = Date.now();
  return { ACCOUNT_REGISTRATION_ENABLED: 'true', ACCOUNT_GENERATION_ENABLED: 'true',
    APPLE_SUBSCRIPTIONS_ENABLED: 'true', APPLE_STORE_ENVIRONMENT: 'Production',
    APPLE_REVIEW_SANDBOX_ENABLED: 'true', APPLE_REVIEW_LOGIN_ENABLED: 'true',
    APPLE_REVIEW_ACCOUNT_GENERATION: '4ccfa30c-1cde-4f60-b991-341ccddac3f1',
    APPLE_REVIEW_APP_ACCOUNT_TOKEN: 'f2ae242e-ac4d-4390-a8db-07d477ff2541',
    APPLE_REVIEW_VALID_FROM: new Date(now - 60000).toISOString(),
    APPLE_REVIEW_VALID_UNTIL: new Date(now + 86400000).toISOString(),
    APPLE_REVIEW_LOGIN_CREDENTIAL_ID: '4c7534f9-6725-4ab2-a146-0ad2e3c5452b',
    APPLE_REVIEW_LOGIN_PASSWORD_HASH: '$2b$12$' + 'a'.repeat(53),
    JL_SESSION_SECRET: 'synthetic-private-review-entry-session-secret', ...changes };
}

test('The actual ordinary sign-in page exposes a same-origin review entry only for a valid active private Production policy', async () => {
  const disabled = [
    { APPLE_REVIEW_LOGIN_ENABLED: undefined }, { APPLE_REVIEW_LOGIN_ENABLED: 'false' },
    { APPLE_REVIEW_SANDBOX_ENABLED: 'false' }, { APPLE_REVIEW_LOGIN_ENABLED: 'TRUE' },
    { APPLE_REVIEW_LOGIN_PASSWORD_HASH: 'not-a-hash' }, { APPLE_REVIEW_LOGIN_CREDENTIAL_ID: 'invalid' },
    { APPLE_REVIEW_APP_ACCOUNT_TOKEN: 'invalid' }, { APPLE_REVIEW_ACCOUNT_GENERATION: 'invalid' },
    { APPLE_REVIEW_VALID_FROM: new Date(Date.now() + 600000).toISOString() },
    { APPLE_REVIEW_VALID_UNTIL: new Date(Date.now() - 1000).toISOString() },
    { APPLE_REVIEW_VALID_UNTIL: new Date(Date.now() + 15 * 86400000).toISOString() },
    { APPLE_REVIEW_VALID_FROM: '2026-10-09T14:00:00Z' },
    { JL_SESSION_SECRET: 'short' }, { ACCOUNT_GENERATION_ENABLED: 'false' },
    { APPLE_SUBSCRIPTIONS_ENABLED: 'false' },
    { APPLE_STORE_ENVIRONMENT: 'Sandbox', JL_TEST_ENVIRONMENT: 'paypal-sandbox' },
    { JL_TEST_ENVIRONMENT: 'paypal-sandbox' },
  ];
  for (const changes of [{}, ...disabled]) {
    const env = reviewEntryEnvironment(changes);
    const page = load('pages/login.js', {}, { process: { env } });
    const headers = {};
    const result = await page.getServerSideProps({ req: { cookies: {} }, query: { allowReviewLogin: 'true' },
      res: { setHeader: (key, value) => headers[key] = value } });
    const expected = Object.keys(changes).length === 0;
    assert.equal(result.props.allowReviewLogin, expected, JSON.stringify(changes));
    assert.match(headers['Cache-Control'], /private, no-store/);
    const html = renderToStaticMarkup(React.createElement(page.default, result.props));
    assert.equal(html.includes('href="/review-login?next=%2Fkonto"'), expected);
    assert.equal(html.includes('Mit Prüfkonto anmelden'), expected);
    assert.match(html, /Bestätigungscode senden/);
    const publicResult = JSON.stringify(result) + html;
    for (const key of ['APPLE_REVIEW_ACCOUNT_GENERATION', 'APPLE_REVIEW_APP_ACCOUNT_TOKEN',
      'APPLE_REVIEW_LOGIN_PASSWORD_HASH', 'APPLE_REVIEW_LOGIN_CREDENTIAL_ID', 'JL_SESSION_SECRET']) {
      assert.ok(!publicResult.includes(key));
      assert.ok(!publicResult.includes(env[key]));
    }
  }
});

test('Review entry preserves safe in-app destinations and never appears in registration or isolated tester forms', async () => {
  const env = reviewEntryEnvironment();
  const globals = { process: { env } };
  for (const [next, expected] of [
    ['/community?category=hundewesen#frage', '/community?category=hundewesen#frage'],
    ['/lernen?suche=gams', '/lernen?suche=gams'],
    ['//evil.invalid', '/konto'], ['/%5cevil.invalid', '/konto'],
    ['/review-login', '/konto'], ['/review-login/?next=/lernen', '/konto'], ['/%72eview-login', '/konto'],
  ]) {
    const page = load('pages/login.js', { 'next/router': { useRouter: () => ({ query: { next } }) } }, globals);
    const result = await page.getServerSideProps({ req: { cookies: {} }, query: { next } });
    const html = renderToStaticMarkup(React.createElement(page.default, result.props));
    const href = html.match(/href="(\/review-login\?[^"]+)"/)[1];
    const url = new URL(href, 'https://jagdlatein.de');
    assert.equal(url.origin, 'https://jagdlatein.de');
    assert.equal(url.searchParams.get('next'), expected);
    for (const props of [{ registration: true }, { isTestMail: true }]) {
      const hidden = renderToStaticMarkup(React.createElement(page.default, { ...result.props, ...props }));
      assert.ok(!hidden.includes('/review-login'));
    }
  }
  const registration = load('pages/registrieren.js', {}, globals);
  const result = await registration.getServerSideProps({});
  assert.ok(!Object.hasOwn(result.props, 'allowReviewLogin'));
  const html = renderToStaticMarkup(React.createElement(registration.default, result.props));
  assert.ok(!html.includes('/review-login'));
});

test('Invalid private mail modes cannot silently render a misleading sink or tester hint', async () => {
  for (const mode of ['', 'smtp', 'TESTER-SMTP']) {
    const globals = { process: { env: { ACCOUNT_REGISTRATION_ENABLED: 'true',
      JL_TEST_ENVIRONMENT: 'paypal-sandbox', JL_TEST_MAIL_MODE: mode } } };
    await assert.rejects(load('pages/login.js', {}, globals).getServerSideProps({ req: { cookies: {} }, query: {} }),
      error => error.status === 503);
    await assert.rejects(load('pages/registrieren.js', {}, globals).getServerSideProps({}), error => error.status === 503);
  }
  const publicGlobals = { process: { env: { ACCOUNT_REGISTRATION_ENABLED: 'true', JL_TEST_MAIL_MODE: 'invalid-private-mode' } } };
  const publicProps = await load('pages/login.js', {}, publicGlobals).getServerSideProps({ req: { cookies: {} }, query: {} });
  assert.equal(publicProps.props.isTestMail, false); assert.equal(publicProps.props.testMailMode, null);
});

test('Sandbox login and registration explain the isolated inbox and separate accounts; public pages omit that hint', () => {
  const Login = load('pages/login.js').default;
  for (const registration of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Login, { registration, allowRegistration: true, isTestMail: true }));
    assert.match(html, /ausschließlich im getrennten Testpostfach/);
    assert.match(html, /normales E-Mail-Postfach erhält keine Nachricht/);
    assert.match(html, /Konten der öffentlichen App werden hier nicht übernommen/);
    assert.match(html, /bestätigst du dein eigenes Testkonto/);
    const codePage = harness(() => response({ success: true }), { registration, isTestMail: true });
    const codeHtml = renderToStaticMarkup(codePage.render());
    assert.match(codeHtml, /Der Code steht im getrennten Testpostfach/);
    assert.ok(!codeHtml.includes('Öffne dein E-Mail-Postfach'));
    codePage.unmount();
    const publicHtml = renderToStaticMarkup(React.createElement(Login, { registration, allowRegistration: true, isTestMail: false }));
    assert.ok(!publicHtml.includes('Testpostfach')); assert.ok(!publicHtml.includes('Testumgebung:'));
  }
});

test('Opt-in tester login explains real delivery and separate accounts without promising a message to every address', () => {
  const Login = load('pages/login.js').default;
  for (const registration of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Login, {
      registration, allowRegistration: true, isTestMail: true, testMailMode: 'tester-smtp',
    }));
    assert.match(html, /Freigegebene Tester erhalten/); assert.match(html, /per E-Mail/);
    assert.match(html, /Spamordner/); assert.match(html, /Konten der öffentlichen App werden hier nicht übernommen/);
    assert.ok(!html.includes('normales E-Mail-Postfach erhält keine Nachricht'));
    assert.ok(!html.includes('ausschließlich im getrennten Testpostfach'));
    if (registration) assert.match(html, /freigegebenen E-Mail-Adresse/);
    const publicHtml = renderToStaticMarkup(React.createElement(Login, {
      registration, allowRegistration: true, isTestMail: false, testMailMode: 'tester-smtp',
    }));
    assert.ok(!publicHtml.includes('Freigegebene Tester')); assert.ok(!publicHtml.includes('Testumgebung:'));
  }
});
test('Duplicate code confirmation and changing email stay blocked through the successful navigation', async () => {
  const pending = deferred(), h = harness(() => pending.promise), tree = h.render();
  const first = h.submit(tree); await h.submit(tree); assert.equal(h.calls.length, 1);
  pending.resolve(response({ success: true, paid: false, admin: false })); await first;
  const updated = h.render(); assert.equal(find(updated, node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(find(updated, node => node.type === 'button' && node.props.type === 'button').props.disabled, true);
  const navigation = [...h.timers.values()].find(timer => timer.delay === 500); assert.ok(navigation); navigation.fn();
  assert.equal(h.render().props.destination, '/community?category=hundewesen'); h.unmount();
});
test('A failed code can be corrected and submitted again without leaving the learner stuck', async () => {
  const h = harness(() => Promise.resolve(response({ success: false, message: 'Code abgelaufen' }, 400)));
  await h.submit(h.render()); assert.equal(h.states[4], false); assert.equal(h.states[3], 'Code abgelaufen');
  await h.submit(h.render()); assert.equal(h.calls.length, 2); assert.equal(h.window.location.href, null); h.unmount();
});
test('Leaving the login page cancels the request and ignores a late successful response', async () => {
  const pending = deferred(), h = harness(() => pending.promise); const action = h.submit(h.render());
  h.unmount(); assert.equal(h.calls[0][1].signal.aborted, true);
  pending.resolve(response({ success: true, paid: true })); await action;
  assert.equal(h.window.location.href, null); assert.equal(h.states[3], ''); assert.equal(h.timers.size, 0);
});
test('A stalled authentication request times out and offers another attempt', async () => {
  const h = harness((url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })));
  const action = h.submit(h.render()); [...h.timers.values()].find(timer => timer.delay === 18000).fn(); await action;
  assert.equal(h.states[4], false); assert.match(h.states[3], /erneut versuchen/); assert.equal(h.timers.size, 0); h.unmount();
});
test('Login and personal pages use the shared design, explicit field labels and private metadata', () => {
  const Login = load('pages/login.js').default;
  const html = renderToStaticMarkup(React.createElement(Login));
  assert.match(html, /class="header compactHeader"/); assert.match(html, /<label>E-Mail-Adresse/); assert.match(html, /noindex, nofollow/);
  const headers = {}; load('pages/login.js').getServerSideProps({ req: { cookies: {} }, res: { setHeader: (key, value) => headers[key] = value }, query: {} });
  assert.match(headers['Cache-Control'], /private, no-store/);
  const AccountLayout = load('components/AccountLayout.js').default;
  const account = renderToStaticMarkup(React.createElement(AccountLayout, { title: 'Mein Konto', description: 'Dein Lernfortschritt', active: 'account' }));
  const accountHeadings = account.match(/<h1\b[^>]*>/g) || [];
  assert.equal(accountHeadings.length, 1);
  assert.match(account, /<h1\b[^>]*>Mein Konto<\/h1>/);
  assert.match(accountHeadings[0], /\btabindex="-1"/);
  assert.match(accountHeadings[0], /\bdata-learning-page-start="true"/);
  assert.doesNotMatch(account, /aria-label="(?:Lernmenü|Kontomenü)"/); assert.match(account, /class="header compactHeader"/);
});
