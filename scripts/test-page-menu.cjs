const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');

function engine() {
  const slots = []; let cursor = 0, effects = [], mounted = true;
  return {
    hooks: { ...React,
      useState(initial) { const i = cursor++; slots[i] ||= { value: initial }; return [slots[i].value, value => { assert.ok(mounted, 'No state update after unmount'); slots[i].value = value; }]; },
      useRef(initial) { const i = cursor++; slots[i] ||= { value: { current: initial } }; return slots[i].value; },
      useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) { slots[i] = { deps, cleanup: previous?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
    },
    render(callback) { assert.ok(mounted); cursor = 0; return callback(); },
    flush() { const pending = effects; effects = []; pending.forEach(callback => callback()); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); effects = []; mounted = false; },
  };
}

function fixture() {
  let opened = false, openCalls = 0;
  const focusCalls = [], scrollCalls = [];
  const input = { focus: options => focusCalls.push(options), scrollIntoView: options => scrollCalls.push(options) };
  const outside = { focus() { throw new Error('Must not focus content outside the shared menu'); } };
  const menu = { get open() { return opened; }, set open(value) { opened = value; openCalls++; }, contains: target => target === input };
  const outlet = { nodeType: 1, getAttribute: name => name === 'data-page-menu-route' ? '/jagdrecht' : null, closest: selector => selector === 'details' ? menu : null, remove() { throw new Error('The page must not remove the shared outlet'); } };
  const elements = new Map([['jl-page-menu', outlet], ['region-input', input], ['outside', outside]]);
  return { outlet, menu, input, focusCalls, scrollCalls, elements, document: { getElementById: id => elements.get(id) || null }, get openCalls() { return openCalls; } };
}

function withDocument(value, callback) {
  const previous = Object.getOwnPropertyDescriptor(global, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(global, 'window');
  if (value === undefined) delete global.document;
  else Object.defineProperty(global, 'document', { configurable: true, value, writable: true });
  if (value !== undefined) Object.defineProperty(global, 'window', { configurable: true, writable: true, value: { location: { pathname: '/jagdrecht', search: '' } } });
  try { return callback(); }
  finally { if (previous) Object.defineProperty(global, 'document', previous); else delete global.document; if (previousWindow) Object.defineProperty(global, 'window', previousWindow); else delete global.window; }
}

test('SSR contributes no second menu, portal or document access', () => withDocument(undefined, () => {
  const { default: PageMenu, openPageMenu, PAGE_MENU_OUTLET_ID } = createLoader()('components/PageMenu.js');
  assert.equal(PAGE_MENU_OUTLET_ID, 'jl-page-menu');
  assert.equal(renderToStaticMarkup(React.createElement(PageMenu, { title: 'Lernregion', openInitially: true }, React.createElement('select'))), '');
  assert.equal(openPageMenu('region-input'), false);
}));

test('Mount resolves the existing outlet, creates a real React portal and updates its contents without moving its target', () => {
  const f = fixture();
  withDocument(f.document, () => {
    const e = engine(), PageMenu = createLoader({ react: e.hooks })('components/PageMenu.js').default;
    const render = text => e.render(() => PageMenu({ title: 'Jagdrecht auswählen', children: React.createElement('p', null, text) }));
    assert.equal(render('Schweiz'), null, 'The initial client render matches SSR');
    e.flush();
    const portal = render('Schweiz'); e.flush();
    assert.equal(portal.$$typeof, Symbol.for('react.portal'));
    assert.equal(portal.containerInfo, f.outlet);
    assert.equal(portal.children.type, 'section');
    assert.equal(portal.children.props['aria-label'], 'Jagdrecht auswählen');
    assert.equal(portal.children.props.children[1].props.children, 'Schweiz');
    const updated = render('Österreich'); e.flush();
    assert.equal(updated.containerInfo, portal.containerInfo);
    assert.equal(updated.children.props.children[1].props.children, 'Österreich');
    assert.equal(f.openCalls, 0, 'Content updates do not open the menu by default');
    e.unmount();
    assert.equal(f.elements.get('jl-page-menu'), f.outlet, 'The shared app shell retains ownership of its outlet after the page unmounts');
    e.flush();
    assert.equal(f.openCalls, 0, 'Unmount leaves no scheduled opening or state update');
  });
});

test('Optional initial opening waits for the committed portal and does not reopen when content or props change', () => {
  const f = fixture();
  withDocument(f.document, () => {
    const e = engine(), PageMenu = createLoader({ react: e.hooks })('components/PageMenu.js').default;
    const render = (children, openInitially = true) => e.render(() => PageMenu({ title: 'Lernregion', children, openInitially, initialFocusId: 'region-input' }));
    assert.equal(render('Auswahl'), null); assert.equal(f.openCalls, 0);
    e.flush(); assert.equal(f.openCalls, 0, 'Finding an outlet alone does not open it before the portal render');
    assert.ok(render('Auswahl')); assert.equal(f.openCalls, 0);
    e.flush(); assert.equal(f.openCalls, 1); assert.equal(f.menu.open, true);
    assert.equal(f.focusCalls.length, 1, 'The region control is focused only after the portal is committed');
    f.menu.open = false;
    render('Andere Auswahl'); e.flush();
    render('Andere Auswahl', false); e.flush();
    render('Andere Auswahl', true); e.flush();
    assert.equal(f.openCalls, 2, 'The only second toggle was the user closing the menu');
    assert.equal(f.menu.open, false);
    e.unmount();
  });
});

test('An absent outlet keeps the component inert and unmounting before its second render cannot open a menu', () => {
  for (const missing of [true, false]) {
    const f = fixture(); if (missing) f.elements.delete('jl-page-menu');
    withDocument(f.document, () => {
      const e = engine(), PageMenu = createLoader({ react: e.hooks })('components/PageMenu.js').default;
      assert.equal(e.render(() => PageMenu({ openInitially: true, children: 'Auswahl' })), null);
      e.flush();
      if (missing) { assert.equal(e.render(() => PageMenu({ openInitially: true, children: 'Auswahl' })), null); e.flush(); }
      e.unmount(); e.flush();
      assert.equal(f.openCalls, 0);
    });
  }
});

test('The explicit helper opens only the shared native menu and focuses a requested control inside it', () => {
  const f = fixture();
  withDocument(f.document, () => {
    const { openPageMenu } = createLoader()('components/PageMenu.js');
    assert.equal(openPageMenu('region-input'), true);
    assert.equal(f.menu.open, true);
    assert.deepEqual(f.focusCalls, [{ preventScroll: true }]);
    assert.deepEqual(f.scrollCalls, [{ block: 'nearest', inline: 'nearest' }]);
    assert.equal(openPageMenu('outside'), true);
    assert.equal(openPageMenu('missing'), true);
    assert.equal(f.focusCalls.length, 1);
    f.outlet.closest = () => null;
    assert.equal(openPageMenu('region-input'), false);
    f.elements.delete('jl-page-menu');
    assert.equal(openPageMenu(), false);
  });
});

test('Opening a text closes the shared menu without moving focus away from that text', () => {
  const f = fixture();
  withDocument(f.document, () => {
    const { openPageMenu, closePageMenu } = createLoader()('components/PageMenu.js');
    openPageMenu('region-input');
    assert.equal(closePageMenu(), true); assert.equal(f.menu.open, false);
    assert.equal(f.focusCalls.length, 1, 'Closing preserves the reader focus');
    f.elements.clear(); assert.equal(closePageMenu(), false);
  });
  withDocument(undefined, () => assert.equal(createLoader()('components/PageMenu.js').closePageMenu(), false));
});
