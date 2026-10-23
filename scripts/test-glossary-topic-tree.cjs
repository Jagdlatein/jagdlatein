const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const sources = createLoader();
const { TERMS } = sources('data/glossary-terms.js');
function words(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(words).join('');
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean) || null;
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function setup(letter = '') {
  let query = '';
  const load = createLoader({ react: { ...React, useState: () => [query, value => { query = value; }] }, '../../lib/account-access': { getPaidPageProps: async () => ({ props: {} }) } });
  const Component = load('pages/glossar/index.js').default;
  let tree;
  const redraw = () => tree = Component({ letter }); redraw();
  return { get tree() { return tree; }, text: () => words(tree), html: () => renderToStaticMarkup(tree),
    search(value) { find(tree, node => node.type === 'input').props.onChange({ target: { value } }); redraw(); } };
}

test('Glossary root displays every real initial as a native branch link without dumping terms or definitions', () => {
  const s = setup(), html = s.html();
  const letters = [...new Set(TERMS.map(term => term.term[0].toUpperCase()))];
  for (const letter of letters) {
    const href = `/glossar?letter=${encodeURIComponent(letter)}`;
    assert.ok(html.includes(href));
    const count = TERMS.filter(term => term.term[0].toUpperCase() === letter).length;
    assert.equal(words(find(s.tree, node => node.type === 'a' && node.props.href === href).props.children[1]), `${count} ${count === 1 ? 'Begriff' : 'Begriffe'}`);
  }
  for (const term of TERMS) { assert.ok(!html.includes(`href="/glossar/${term.slug}"`)); assert.ok(!s.text().includes(term.def)); }
  s.search('   '); assert.ok(s.html().includes('Glossar nach Anfangsbuchstaben'));
});

test('Each initial branch exposes only its compact term links and preserves the complete existing catalog', () => {
  const letters = [...new Set(TERMS.map(term => term.term[0].toUpperCase()))]; let linked = 0;
  for (const letter of letters) {
    const s = setup(letter), html = s.html();
    for (const term of TERMS) {
      const belongs = term.term[0].toUpperCase() === letter;
      assert.equal(html.includes(`href="/glossar/${term.slug}"`), belongs, term.slug);
      assert.ok(!s.text().includes(term.def), `Index leaked definition: ${term.slug}`);
      if (belongs) linked++;
    }
    assert.doesNotMatch(html, /aria-label="Glossarpfad"|Startseite|Zum Quiz/);
    assert.match(html, new RegExp(`Begriffe mit ${letter}`));
  }
  assert.equal(linked, TERMS.length);
});

test('Searching still matches definition text and terms but renders only relevant links; only a detail page shows its own definition', () => {
  const target = TERMS.find(term => term.slug === 'abwurfstange');
  const s = setup(); s.search('Natürlich abgeworfene');
  assert.ok(s.html().includes(`/glossar/${target.slug}`)); assert.ok(!s.text().includes(target.def));
  s.search(target.term.toUpperCase()); assert.ok(s.html().includes(`/glossar/${target.slug}`));
  s.search('___KEIN_BEG RIFF_9584___'); assert.match(s.text(), /Keine passenden Begriffe/);
  const branch = setup('B'); branch.search('Natürlich abgeworfene'); assert.ok(!branch.html().includes(`/glossar/${target.slug}`));
  const Detail = createLoader({ '../../lib/account-access': { getPaidPageProps: async () => ({ props: {} }) } })('pages/glossar/[slug].js').default;
  const detail = Detail({ slug: target.slug }); assert.ok(words(detail).includes(target.def));
  for (const other of TERMS.filter(term => term.slug !== target.slug)) assert.ok(!words(detail).includes(other.def));
});

test('A term opens directly at its definition; further navigation stays below it in one closed disclosure', () => {
  const Detail = createLoader({ '../../lib/account-access': { getPaidPageProps: async () => ({ props: {} }) } })('pages/glossar/[slug].js').default;
  const entry = TERMS[0], tree = Detail({ slug: entry.slug }), html = renderToStaticMarkup(tree);
  const breadcrumb = find(tree, node => node.type === 'nav' && node.props['aria-label'] === 'Glossarpfad');
  assert.ok(breadcrumb); assert.ok(words(breadcrumb).includes(`Begriffe mit ${entry.term[0].toUpperCase()}`));
  const disclosure = find(tree, node => node.type === 'details');
  assert.ok(disclosure && !disclosure.props.open);
  assert.equal(find(disclosure, node => node === breadcrumb), breadcrumb);
  assert.ok(html.indexOf('class="defBig"') < html.indexOf('aria-label="Glossarpfad"'));
  assert.ok(html.indexOf('class="defBig"') < html.indexOf('Weitere Glossarbegriffe'));
  assert.doesNotMatch(html.slice(0, html.indexOf('class="defBig"')), /<nav|<summary|navbar|Hauptmenü/);
  for (const letter of new Set(TERMS.map(term => term.term[0].toUpperCase()))) assert.ok(renderToStaticMarkup(disclosure).includes(`/glossar?letter=${encodeURIComponent(letter)}`));
});

test('Legacy header imports cannot restore a duplicate upper menu or trigger an auth request', () => {
  const Header = createLoader()('components/Header.js').default;
  assert.equal(renderToStaticMarkup(React.createElement(Header)), '');
});

test('Server letter validation retains the existing paid-access guard for all callers and rejects invalid/array filters', async () => {
  let access = { redirect: { destination: '/login', permanent: false } }, calls = 0;
  const { getServerSideProps } = createLoader({ '../../lib/account-access': { getPaidPageProps: async () => { calls++; return access; } } })('pages/glossar/index.js');
  assert.equal(await getServerSideProps({ query: { letter: 'A' } }), access);
  access = { props: {} };
  assert.deepEqual(await getServerSideProps({ query: { letter: 'a' } }), { props: { letter: 'A' } });
  for (const letter of ['UNKNOWN', ['A', 'B'], '', undefined]) assert.deepEqual(await getServerSideProps({ query: { letter } }), { props: { letter: '' } });
  assert.equal(calls, 6);
});
