const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
function Link({ href, children, prefetch, ...props }) { return React.createElement('a', { href, ...props }, children); }
const Component = createLoader({ 'next/link': { __esModule: true, default: Link } })('components/ExamRegionPreparation.js').default;

const wildlife = { id: 'wild', title: 'Wildmerkmale erklären', href: '/kurse/wild#lesson-merkmale', quizHref: '/kurse/wild#wissenscheck', categorySlug: 'wildkunde', categoryTitle: 'Wildkunde', oralHref: '/lernen/pruefungsgespraech?eintrag=gemeinsame-wildfrage', reviewHref: '/lernen/fuenf-minuten?modus=gemischt&kategorie=wildkunde' };
const dogs = { id: 'dogs', title: 'Jagdhundeaufgaben begründen', href: '/kurse/dogs', quizHref: '/kurse/dogs#wissenscheck', categorySlug: 'hundewesen', categoryTitle: 'Hundewesen', oralHref: null, reviewHref: '/lernen/fuenf-minuten?modus=gemischt&kategorie=hundewesen' };
const regionalLaw = { id: 'law', title: 'Regionaler Rechtskurs', href: '/kurse/law', quizHref: '/kurse/law#wissenscheck', categorySlug: 'jagdrecht', categoryTitle: 'Jagdrecht', oralHref: '/lernen/pruefungsgespraech?eintrag=regionale-frage', reviewHref: null };
const catalog = { wild: wildlife, dogs, law: regionalLaw, other: { ...wildlife, id: 'other', title: 'Ungewählter Fremdkurs', href: '/kurse/other' } };
const region = {
  country: 'AT', region: 'NOE', status: 'confirmed', summary: 'Diese gewählte Region verbindet mündliches Erklären und praktische Ausbildung.',
  formats: [{ label: 'Mündliche Theorie', sourceIds: ['norm', 'explanation'] }, { label: 'Praktischer Teil', sourceIds: ['norm', 'explanation'] }],
  limits: ['Nur die benannten Fachbezüge sind abgeglichen.', 'Digitale Übungen ersetzen die betreute praktische Ausbildung nicht.'],
  focus: [{ label: 'Beobachtung begründen', detail: 'Erkläre sichtbare Wildmerkmale und die Grenze deiner Beobachtung.', moduleIds: ['wild'], sourceIds: ['norm', 'explanation'] }],
  moduleIds: ['wild', 'dogs'], sources: [{ id: 'norm', label: 'Nur im abschließenden Quellenbereich', url: 'https://example.invalid/norm', reviewedOn: '2026-11-01' }],
};
const tree = (value = region, learningCatalog = catalog) => Component({ region: value, learningCatalog });
const html = (value = region, learningCatalog = catalog) => renderToStaticMarkup(React.createElement(Component, { region: value, learningCatalog }));
const hrefs = node => nodes(node, item => item.type === Link).map(item => item.props.href);

test('Confirmed formats are an unordered list; limits and own complete learning tasks precede learning links in actual SSR', () => {
  const node = tree(), markup = html();
  assert.equal(node.type, 'section'); assert.equal(node.props['aria-labelledby'], 'exam-plan-regional-exam');
  assert.match(markup, /<h2 id="exam-plan-regional-exam">Deine Prüfung<\/h2>/);
  const formats = nodes(node, item => item.type === 'ul' && text(item).includes('Mündliche Theorie'));
  assert.equal(formats.length, 1); assert.deepEqual(nodes(formats[0], item => item.type === 'li').map(text), ['Mündliche Theorie', 'Praktischer Teil']);
  assert.equal(nodes(node, item => item.type === 'ol').length, 0);
  assert.ok(markup.indexOf(region.summary) < markup.indexOf('Eigene Vorbereitung'));
  for (const value of [...region.limits, region.focus[0].detail]) assert.ok(markup.indexOf(value) < markup.indexOf('<a '), value);
  assert.ok(markup.indexOf('Eigene Vorbereitung') < markup.indexOf('Passende Lernstarts'));
  assert.match(markup, /eigene Übungsbeispiele/); assert.doesNotMatch(markup, /amtliche Simulation|Prüfungsreife|Bestehensgarantie/);
});

test('Partial records visibly explain the open review and never render candidate or accidentally supplied regular formats', () => {
  const partial = { ...region, status: 'partial', summary: 'Der unabhängige Zweitnachweis steht noch aus.', formats: [{ label: 'Unbestätigte Theorieform' }], candidateFormats: [{ label: 'Ungeprüfte Kandidatenform' }] };
  const markup = html(partial);
  assert.match(markup, /Prüfungsrahmen noch im Abgleich/); assert.ok(markup.includes(partial.summary));
  for (const limit of partial.limits) assert.ok(markup.includes(limit));
  assert.doesNotMatch(markup, /Unbestätigte Theorieform|Ungeprüfte Kandidatenform/);
  assert.ok(markup.includes('Erkläre sichtbare Wildmerkmale')); assert.ok(markup.includes('/kurse/wild#lesson-merkmale'));
  assert.doesNotMatch(markup, /<details|hidden=|aria-hidden/);
});

test('Special local frameworks keep their summary and scope visible without inventing the normal examination formats', () => {
  const special = { ...region, country: 'CH', region: 'GE', status: 'special', summary: 'Für diesen Sonderfall ist die örtliche Zuständigkeit zuerst zu klären.', limits: ['Der allgemeine Jagdprüfungsablauf wird hier nicht übertragen.'], formats: [{ label: 'Nicht übertragbares Standardformat' }], focus: [], moduleIds: [] };
  const markup = html(special);
  assert.match(markup, /Besonderer Prüfungsrahmen/); assert.ok(markup.includes(special.summary)); assert.ok(markup.includes(special.limits[0]));
  assert.doesNotMatch(markup, /Nicht übertragbares Standardformat|Passende Lernstarts|Eigene Vorbereitung|<a /);
});

test('Only explicitly selected catalog modules appear once, with exact supplied anchors and optional common oral links', () => {
  const selected = { ...region, focus: [...region.focus, { label: 'Aufgabe des Hundes', detail: 'Erkläre die benötigten Fähigkeiten.', moduleIds: ['dogs', 'wild', 'missing'], sourceIds: [] }], moduleIds: ['dogs', 'law', 'missing', 'wild'] };
  const node = tree(selected);
  assert.deepEqual(hrefs(node), [wildlife.href, wildlife.quizHref, wildlife.oralHref, wildlife.reviewHref, dogs.href, dogs.quizHref, dogs.reviewHref]);
  assert.equal(nodes(node, item => item.type === Link && text(item) === 'Erklären').length, 1);
  for (const link of nodes(node, item => item.type === Link)) { assert.equal(link.props.prefetch, false); assert.equal(link.props.target, undefined); assert.ok(link.props['aria-label'].includes(': ')); }
  assert.doesNotMatch(text(node), /Ungewählter Fremdkurs|Regionaler Rechtskurs/);
  assert.equal(nodes(node, item => item.type === 'h4' && text(item) === wildlife.title).length, 1);
  assert.ok(text(node).includes('Wildkunde')); assert.ok(text(node).includes('Hundewesen'));
});

test('Changing the supplied region renders only the new selection and exposes no source contents, dates or extra selection UI', () => {
  const next = { ...region, country: 'DE', region: 'BY', summary: 'Nur die neu gewählte Region.', focus: [{ label: 'Neuer Lernauftrag', detail: 'Nur die neue Erklärung.', moduleIds: ['dogs'], sourceIds: ['next-source'] }], moduleIds: [], sources: [{ id: 'next-source', label: 'Verborgene fremde Quellenangabe', url: 'https://example.invalid/other', reviewedOn: '2024-05-06' }], reviewedOn: '2025-01-02', officialText: 'Vollständiger fremder Rechtstext', questions: [{ answer: 'Nicht ausgeben' }] };
  const markup = html(next), node = tree(next);
  assert.ok(markup.includes(next.summary)); assert.ok(markup.includes('Nur die neue Erklärung.'));
  assert.doesNotMatch(markup, /Diese gewählte Region|Beobachtung begründen|Wildmerkmale erklären|example\.invalid|Verborgene fremde Quellenangabe|2024-05-06|2025-01-02|2026-11-01|fremder Rechtstext|Nicht ausgeben/);
  assert.equal(nodes(node, item => ['form', 'select', 'input', 'button', 'dialog', 'details', 'iframe'].includes(item.type)).length, 0);
  assert.deepEqual(hrefs(node), [dogs.href, dogs.quizHref, dogs.reviewHref]);
});

test('Absent targets and missing catalog entries add no fallback course, while valid visible learning content remains intact', () => {
  assert.equal(Component({}), null); assert.equal(tree(null), null);
  const noCatalog = { ...region, focus: [{ label: 'Sichtbarer Lernauftrag', detail: 'Die Erklärung bleibt verfügbar.', moduleIds: ['unknown'], sourceIds: [] }], moduleIds: ['constructor', 'toString', 'unknown'] };
  const markup = html(noCatalog, {});
  assert.match(markup, /Sichtbarer Lernauftrag|Die Erklärung bleibt verfügbar/);
  assert.doesNotMatch(markup, /Passende Lernstarts|<a /); assert.ok(markup.includes(region.summary));
  assert.equal(html(region, new Map(Object.entries(catalog))), html());
});

test('Catalog metadata cannot create external windows or unsafe links, and rendering does not mutate supplied records', () => {
  const selected = { ...region, moduleIds: ['wild', 'external', 'wrong-id', 'protocol', 'backslash'] };
  const mixed = { ...catalog, wild: { ...wildlife, oralHref: 'javascript:alert(1)', quizHref: '//external.invalid/quiz' }, external: { ...dogs, id: 'external', href: 'https://external.invalid/course' }, 'wrong-id': { ...dogs }, protocol: { ...dogs, id: 'protocol', href: '//external.invalid/course' }, backslash: { ...dogs, id: 'backslash', href: '/\\external.invalid/course' } };
  const before = JSON.stringify({ selected, mixed }), node = tree(selected, mixed), markup = html(selected, mixed);
  assert.deepEqual(hrefs(node), [wildlife.href, wildlife.reviewHref]);
  assert.doesNotMatch(markup, /javascript:|external\.invalid|target=|window|onclick=/i);
  assert.equal(JSON.stringify({ selected, mixed }), before);
});

test('The isolated presentation imports no regional bank, answer catalog, account store or navigation effects', () => {
  const source = fs.readFileSync(path.join(root, 'components/ExamRegionPreparation.js'), 'utf8');
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|window\.|router\.|useEffect|useState|useExamProfile|regional-law-data|learning-curriculum|exam-study-plan-server|candidateFormats/);
});
