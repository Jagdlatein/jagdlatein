const { createLoader, local } = require('./project-module.cjs');
const React = local('react');
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function setup(file, initialQuery = {}, options = {}) {
  const slots = [], calls = [], cleanups = []; let cursor = 0, effects = [], changed = false, tree;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, input => { const next = typeof input === 'function' ? input(slots[i].value) : input; changed ||= !Object.is(next, slots[i].value); slots[i].value = next; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || !deps || deps.some((value, j) => !Object.is(value, slots[i].deps[j]))) { slots[i] = { deps }; effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); }); } },
  };
  function PageMenu({ children }) { return React.createElement('aside', { 'data-page-menu': true }, children); }
  const menu = { closed: 0, opened: 0 };
  const router = { isReady: options.ready !== false, query: { ...initialQuery }, push: async (href, as, options) => { calls.push({ href, options }); router.query = href.query; return true; } };
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => router }, './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) }, './PageMenu': { __esModule: true, default: PageMenu, openPageMenu: () => { menu.opened++; }, closePageMenu: () => { menu.closed++; } } });
  const Component = load(file).default;
  function render() {
    for (let pass = 0; pass < 8; pass++) { cursor = 0; changed = false; tree = Component(); const pending = effects; effects = []; pending.forEach(fn => fn()); if (!changed) return tree; }
    throw new Error('Reader did not settle');
  }
  render();
  return { get tree() { return tree; }, render, router, calls, menu, load, nodes: predicate => nodes(tree, predicate),
    navigate(query) { router.query = query; render(); },
    input(value) { nodes(tree, node => node.type === 'input' && node.props.type === 'search')[0].props.onChange({ target: { value } }); render(); },
    click(label) { const button = nodes(tree, node => node.type === 'button' && text(node) === label)[0]; if (!button) throw new Error('Missing button: ' + label); button.props.onClick(); render(); },
    dispose() { cleanups.forEach(fn => fn?.()); },
  };
}
module.exports = { setup, nodes, text };
