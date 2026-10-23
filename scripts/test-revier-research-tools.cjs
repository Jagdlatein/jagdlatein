const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const css = new Proxy({}, { get: (_, key) => String(key) });
function load(relative, overrides = {}, expose = '') {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: false }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'object' ? href.pathname : href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/image') return ({ priority, loading, sizes, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), /\.(js|json)$/.test(id) ? id : `${id}.js`)), overrides);
    return req(id);
  }
  new Function('require', 'module', 'exports', code + (expose ? `\nmodule.exports.__test = ${expose};` : ''))(resolve, mod, mod.exports);
  return mod.exports;
}
function engine() {
  const slots = [], effects = []; let cursor = 0;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; const old = slots[i]; if (!old || !deps || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) { slots[i] = { deps }; effects.push(fn); } },
  };
  return { hooks, render(fn) { cursor = 0; return fn(); }, effects() { for (const effect of effects.splice(0)) effect(); } };
}
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(''); return typeof node === 'object' ? text(node.props?.children) : String(node); }
function hrefs(node) { return [...renderToStaticMarkup(node).matchAll(/href="([^"]+)"/g)].map(match => match[1].replace(/&amp;/g, '&')); }
function PageMenu() { return null; }
function setup(file, props = {}, exposed = '', router = { query: {}, isReady: false }) {
  let closes = 0;
  const focused = [], scrolled = [];
  const e = engine(); const mod = load(file, { react: e.hooks, 'next/router': { useRouter: () => router }, './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() { closes++; return true; } } }, exposed); const Component = exposed ? mod.__test : mod.default; let tree;
  const render = () => {
    tree = e.render(() => Component(props));
    const container = find(tree, node => node.props?.ref);
    if (container) {
      const id = find(tree, node => node.type === 'select' && ['revierleben-thema', 'forschung-datensatz'].includes(node.props.id))?.props.value;
      const heading = { setAttribute(name, value) { assert.equal(name, 'tabindex'); assert.equal(value, '-1'); }, focus(options) { focused.push({ id, options }); }, scrollIntoView(options) { scrolled.push({ id, options }); } };
      container.props.ref.current = { querySelector(selector) { assert.equal(selector, 'h2'); return heading; } };
    }
    return tree;
  };
  render();
  return { e, render, router, focused, scrolled, get closes() { return closes; }, get tree() { return tree; }, html() { return renderToStaticMarkup(tree); },
    menu() { return find(tree, node => node.type === PageMenu); },
    menuHtml() { return renderToStaticMarkup(find(tree, node => node.type === PageMenu).props.children); },
    flush() { for (let i = 0; i < 3; i++) { e.effects(); render(); } },
  };
}
const ecology = load('lib/small-revier-life.js');
const research = load('lib/research-understanding.js');
const data = load('public/lernen/forschung-2026/originaldaten.json');

test('Sixteen ecological topics carry distinct factual references, limits and actual licensed media', () => {
  assert.equal(ecology.revierLifeTopics.length, 16);
  assert.equal(new Set(ecology.revierLifeTopics.map(item => item.id)).size, 16);
  for (const topic of ecology.revierLifeTopics) {
    assert.ok(topic.photoContext.length > 90 && topic.limit.length > 70);
    for (const fact of topic.facts) {
      assert.ok(fact.sourceIds.every(id => ecology.revierLifeSources[id]), `${topic.id}/${fact.id}: valid references`);
      assert.ok(new Set(fact.sourceIds.map(id => ecology.revierLifeSources[id].organization)).size >= 2, `${topic.id}/${fact.id}: independent organizations`);
    }
    assert.equal(topic.reviewedOn, ['spinnen', 'amphibien', 'streuabbau', 'eintagsfliegenlarven', 'koecherfliegenlarven', 'bachflohkrebse', 'asseln', 'doppelfuesser', 'libellenlarven', 'wasserlaeufer'].includes(topic.id) ? '2026-10-13' : '2026-10-12');
    assert.equal(topic.photo.aiGenerated, false);
  }
  assert.match(ecology.getRevierLifeTopic('laufkaefer').facts.map(item => item.text).join(' '), /samenfressende.*Regenwürmer/s);
  assert.match(ecology.getRevierLifeTopic('mykorrhiza').photoContext, /nicht sichtbar/);
  assert.match(ecology.getRevierLifeTopic('springschwaenze').facts.map(item => item.text).join(' '), /zurückgebildet/);
});
test('Delivered image dimensions and hashes match the attributed unchanged photographs', async () => {
  const sharp = pr('sharp'); const photos = ['kleines-revierleben-2026', 'forest-floor-2026', 'pond-life-2026'].flatMap(folder => load(`public/lernen/${folder}/bildnachweise.json`));
  assert.deepEqual(photos.map(item => item.src).sort(), [...ecology.revierLifeAssetPaths].sort());
  for (const photo of photos) {
    const file = path.join(root, 'public', photo.src); const image = await sharp(file).metadata();
    assert.equal(image.width, photo.width); assert.equal(image.height, photo.height);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), photo.sha256);
    assert.ok(photo.author && photo.alt && photo.originalUrl && photo.modifications);
    assert.match(photo.license, /^CC BY(?:-SA)? (?:[234]\.0|2\.5)(?: DE)?$/);
    assert.match(photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  }
});
test('All eleven temperature values are exact copies of the named original DWD column', () => {
  const rows = fs.readFileSync(path.join(root, 'public/lernen/forschung-2026/dwd-gebietsmittel-2026-10-12.txt'), 'utf8').trim().split(/\r?\n/);
  const countryColumn = rows[1].split(';').indexOf('Deutschland');
  assert.equal(countryColumn, 18);
  const original = new Map(rows.slice(2).map(row => { const cells = row.split(';'); return [Number(cells[0]), Number(cells[countryColumn])]; }));
  assert.equal(data.temperature.points.length, 11);
  assert.deepEqual(data.temperature.points.map(point => point.year), Array.from({ length: 11 }, (_, i) => i + 2015));
  for (const point of data.temperature.points) assert.equal(point.value, original.get(point.year));
  assert.equal(data.temperature.points.at(-1).value, 10.03);
  assert.match(data.temperature.sourceVersion, /20261002/);
  assert.equal(data.temperature.license, 'CC BY 4.0');
});
test('Published Austrian counts keep per-year source dates, and approximate area is not made precise', () => {
  assert.deepEqual(data.forestFires.points.map(point => [point.year, point.value]), [[2022, 217], [2023, 122], [2024, 125], [2025, 193]]);
  for (const point of data.forestFires.points) { assert.match(point.statusOn, /^20\d{2}-\d{2}-\d{2}$/); assert.ok(research.researchSources[point.source]); }
  assert.deepEqual(data.forestFires.areaComparison.map(point => [point.year, point.value, !!point.approximate]), [[2024, 142, false], [2025, 45, true]]);
  const view = setup('components/ResearchUnderstanding.js', { dataset: research.getResearchDataset('waldbrand') }, 'DatasetView');
  assert.match(view.html(), /rund 45 Hektar/);
  assert.match(text(view.tree), /verschiedene Stichtage/);
});
test('Swiss data remain changes between two three-year means, with no invented annual values', () => {
  assert.equal(data.birds.baseline, 'Mittel 1990–1992'); assert.equal(data.birds.comparison, 'Mittel 2023–2025');
  assert.deepEqual(data.birds.points.map(point => [point.id, point.species, point.value]), [['alle', 171, 30.61], ['roteliste', 41, 6.42], ['wald', 56, 31.88]]);
  assert.ok(data.birds.points.every(point => point.year === undefined));
  const birds = research.getResearchDataset('brutvoegel');
  assert.match(birds.provenance, /demselben Vogelwarte-Monitoring/);
  assert.match(birds.provenance, /bestätigt keine Schweizer Messzahl/);
  assert.match(birds.boundaries.join(' '), /keine jährliche Verlaufslinie/);
});
test('Period and group changes filter source points without inventing, rounding or combining them', () => {
  const temperature = research.getResearchDataset('temperatur'), birds = research.getResearchDataset('brutvoegel');
  assert.deepEqual(research.selectResearchPoints(temperature, 'recent').map(point => point.year), [2020, 2021, 2022, 2023, 2024, 2025]);
  assert.deepEqual(research.selectResearchPoints(birds, 'all', 'wald'), [birds.points[2]]);
  assert.equal(research.selectResearchPoints(birds, 'all', 'unknown').length, 0);
  assert.equal(research.formatResearchValue(temperature, 10.03), '10,03');
  assert.equal(research.formatResearchValue(temperature, NaN), 'keine Angabe');
});
test('Search entries resolve every profile and dataset and exclude private quiz explanations', () => {
  for (const [entries, lookup, param] of [[ecology.revierLifeSearchEntries, ecology.revierLifeTopics, 'thema'], [research.researchSearchEntries, research.researchDatasets, 'datensatz']]) {
    assert.equal(entries.length, lookup.length);
    for (const entry of entries) {
      const url = new URL(entry.href, 'https://jagdlatein.de'); const item = lookup.find(item => item.id === url.searchParams.get(param));
      assert.ok(item); assert.ok(entry.categories.includes('natur-revier'));
      assert.ok(!entry.text.includes((item.quiz || item.question).explanation));
    }
  }
});
test('Tools keep complete learning content visible while their subject selectors occur only in the lower PageMenu', () => {
  for (const file of ['components/SmallRevierLife.js', 'components/ResearchUnderstanding.js']) {
    const s = setup(file); const html = s.html();
    assert.equal((html.match(/<main/g) || []).length, 1);
    assert.doesNotMatch(html, /id="(?:revierleben-thema|forschung-datensatz)"|Lebewesen oder Zusammenhang|Forschungsbeispiel/);
    assert.match(s.menuHtml(), /<label[^>]*>[^<]+<select/);
    assert.ok(find(s.menu(), node => node.type === 'optgroup'), 'All thematic groups remain available in the shared menu');
    assert.doesNotMatch(html, /<button|undefined/); assert.match(html, /<fieldset/);
    assert.match(html, /revierleben-inhalt|forschung-inhalt/);
  }
});

test('Valid menu selection closes the menu and focuses the newly committed learning heading; invalid selection changes nothing', () => {
  for (const [file, parameter, initial, next] of [
    ['components/SmallRevierLife.js', 'thema', 'holzpilze', 'regenwuermer'],
    ['components/ResearchUnderstanding.js', 'datensatz', 'temperatur', 'waldbrand'],
  ]) {
    const changes = [];
    const router = { query: { [parameter]: initial, retained: 'yes' }, isReady: true, pathname: '/synthetic-tool', replace: (...args) => { changes.push(args); return Promise.resolve(); } };
    const s = setup(file, {}, '', router); s.flush();
    const closes = s.closes, focused = s.focused.length;
    find(s.menu(), node => node.type === 'select').props.onChange({ target: { value: 'invalid' } }); s.flush();
    assert.equal(changes.length, 0); assert.equal(s.closes, closes); assert.equal(s.focused.length, focused);
    find(s.menu(), node => node.type === 'select').props.onChange({ target: { value: next } }); s.flush();
    assert.ok(s.closes > closes); assert.equal(changes.length, 1);
    assert.equal(changes[0][0].query[parameter], next); assert.equal(changes[0][0].query.retained, 'yes');
    assert.deepEqual(changes[0][2], { shallow: true, scroll: false });
    assert.deepEqual(s.focused.at(-1), { id: next, options: { preventScroll: true } });
    assert.deepEqual(s.scrolled.at(-1), { id: next, options: { block: 'start', behavior: 'auto' } });
    assert.doesNotMatch(s.html(), /id="(?:revierleben-thema|forschung-datensatz)"/);
    router.query[parameter] = next; s.render(); s.flush();
    router.query[parameter] = initial; s.render(); s.flush();
    assert.equal(find(s.menu(), node => node.type === 'select').props.value, initial);
    assert.equal(s.focused.at(-1).id, initial, 'Back/direct URL navigation focuses its own restored content');
  }
});

test('The lower research menu switches between data series and movement maps without mixing their content', () => {
  const router = { query: { datensatz: 'weissstorch-olea-2014' }, isReady: true, pathname: '/lernen/forschung-verstehen', replace: () => Promise.resolve() };
  const s = setup('components/ResearchUnderstanding.js', {}, '', router); s.flush();
  assert.equal(find(s.tree, node => node.type?.name === 'WildMovementMap').props.selectedId, 'weissstorch-olea-2014');
  assert.equal(find(s.tree, node => node.props?.dataset), null);
  assert.match(s.html(), /id="wildbewegung"/); assert.doesNotMatch(s.html(), /id="forschung-inhalt"/);
  find(s.menu(), node => node.type === 'select').props.onChange({ target: { value: 'brutvoegel' } }); s.flush();
  assert.equal(find(s.tree, node => node.props?.dataset).props.dataset.id, 'brutvoegel');
  assert.equal(find(s.tree, node => node.type?.name === 'WildMovementMap'), null);
  assert.equal(s.focused.at(-1).id, 'brutvoegel');
});
test('Ecology deep links, back navigation and selectors consistently show the addressed topic', () => {
  const changes = []; const router = { query: { thema: 'holzpilze', preserved: 'yes' }, isReady: true, pathname: '/lernen/kleines-revierleben', replace: (...args) => { changes.push(args); return Promise.resolve(); } };
  const s = setup('components/SmallRevierLife.js', {}, '', router); s.e.effects(); s.render();
  assert.equal(find(s.tree, item => item.props?.topic)?.props.topic.id, 'holzpilze');
  find(s.tree, item => item.type === 'select').props.onChange({ target: { value: 'regenwuermer' } }); s.render();
  assert.equal(find(s.tree, item => item.props?.topic)?.props.topic.id, 'regenwuermer');
  assert.equal(changes[0][0].query.preserved, 'yes'); assert.equal(changes[0][0].query.thema, 'regenwuermer');
  assert.deepEqual(changes[0][2], { shallow: true, scroll: false });
  router.query.thema = 'wildbienen'; s.render(); s.e.effects(); s.render(); assert.equal(find(s.tree, item => item.props?.topic)?.props.topic.id, 'wildbienen');
  router.query.thema = 'unknown'; s.render(); s.e.effects(); s.render(); assert.equal(find(s.tree, item => item.props?.topic)?.props.topic.id, 'wildbienen');
});
test('Research direct selection is stable and unrelated URL state survives without extra steps', () => {
  const changes = []; const router = { query: { datensatz: 'brutvoegel', preserved: 'yes' }, isReady: true, pathname: '/lernen/forschung-verstehen', replace: (...args) => { changes.push(args); return Promise.resolve(); } };
  const s = setup('components/ResearchUnderstanding.js', {}, '', router); s.e.effects(); s.render();
  assert.equal(find(s.tree, item => item.props?.dataset)?.props.dataset.id, 'brutvoegel');
  const select = find(s.tree, item => item.type === 'select'); select.props.onChange({ target: { value: 'waldbrand' } }); s.render();
  assert.equal(find(s.tree, item => item.props?.dataset)?.props.dataset.id, 'waldbrand'); assert.equal(changes[0][0].query.preserved, 'yes');
  assert.equal(find(s.tree, item => item.props?.dataset)?.key, 'waldbrand');
  select.props.onChange({ target: { value: 'invalid' } }); s.render(); assert.equal(changes.length, 1);
});
test('An interpretation answer immediately supplies corrective explanation and the correct statement', () => {
  for (const [file, props, exposed] of [['components/SmallRevierLife.js', { topic: ecology.getRevierLifeTopic('laufkaefer') }, 'TopicContent'], ['components/ResearchUnderstanding.js', { dataset: research.getResearchDataset('temperatur') }, 'DatasetView']]) {
    const s = setup(file, props, exposed); assert.equal(find(s.tree, item => item.props?.role === 'status'), null);
    find(s.tree, item => item.type === 'input' && item.props.value === 0).props.onChange(); s.render();
    const feedback = find(s.tree, item => item.props?.role === 'status'); assert.ok(feedback); assert.match(text(feedback), /Passend ist:/);
    assert.doesNotMatch(s.html(), /<button/);
  }
});

test('Every ecology profile keeps knowledge and photo context visible, with exact claim references and all photo credits only in the final closed source block', () => {
  for (const topic of ecology.revierLifeTopics) {
    const s = setup('components/SmallRevierLife.js', { topic }, 'TopicContent');
    const children = React.Children.toArray(s.tree.props.children);
    const footer = children.at(-1), body = React.createElement(React.Fragment, null, children.slice(0, -1));
    assert.equal(footer.type, 'details'); assert.ok(!footer.props.open);
    assert.doesNotMatch(renderToStaticMarkup(body), /<a\b/);
    assert.ok(text(body).includes(topic.photoContext)); assert.ok(text(body).includes(topic.limit));
    for (const fact of topic.facts) {
      assert.ok(text(body).includes(fact.text));
      const mapping = find(footer, node => node.props?.['data-source-for'] === fact.id);
      assert.ok(mapping, `${topic.id}/${fact.id}: explicit evidence mapping`);
      assert.deepEqual(hrefs(mapping), [...new Set(fact.sourceIds)].map(id => ecology.revierLifeSources[id].url));
    }
    assert.ok(text(footer).includes(topic.photo.author)); assert.ok(text(footer).includes(topic.photo.license));
    assert.ok(hrefs(footer).includes(topic.photo.sourceUrl)); assert.ok(hrefs(footer).includes(topic.photo.licenseUrl));
    assert.match(text(footer), /Originalaufnahme bzw\. proportionale Vorschau; kein generativer Bildinhalt/);
  }
});

test('Research values and per-year dates remain readable before sources, and every displayed point retains its exact original reference at the end', () => {
  for (const dataset of research.researchDatasets) {
    const s = setup('components/ResearchUnderstanding.js', { dataset }, 'DatasetView');
    const children = React.Children.toArray(s.tree.props.children);
    const footer = children.at(-1), body = React.createElement(React.Fragment, null, children.slice(0, -1));
    assert.equal(footer.type, 'details'); assert.ok(!footer.props.open);
    assert.doesNotMatch(renderToStaticMarkup(body), /<a\b/);
    assert.ok(text(body).includes(dataset.method)); assert.ok(text(body).includes(dataset.interpretation));
    const table = find(body, node => node.type === 'table'); assert.ok(table);
    for (const point of research.selectResearchPoints(dataset, 'all', 'all')) {
      assert.ok(text(table).includes(research.formatResearchValue(dataset, point.value)));
      if (point.statusOn) assert.ok(text(table).includes(point.statusOn));
      const mapping = find(footer, node => node.props?.['data-source-for'] === `point-${point.id || point.year}`);
      assert.deepEqual(hrefs(mapping), [research.researchSources[point.source || dataset.originalSourceIds[0]].url]);
    }
    for (const point of dataset.areaComparison || []) {
      const mapping = find(footer, node => node.props?.['data-source-for'] === `area-${point.year}`);
      assert.deepEqual(hrefs(mapping), [research.researchSources[point.source].url]);
      if (point.approximate) assert.ok(text(body).includes(`rund ${point.value} Hektar`));
    }
    assert.ok(hrefs(footer).includes('/lernen/forschung-2026/originaldaten.json'));
    if (dataset.id === 'temperatur') assert.ok(hrefs(footer).includes('/lernen/forschung-2026/dwd-gebietsmittel-2026-10-12.txt'));
  }
});
test('Displayed chart and accessible table change together, including isolated Swiss groups', () => {
  const dataset = research.getResearchDataset('temperatur'); const s = setup('components/ResearchUnderstanding.js', { dataset }, 'DatasetView');
  find(s.tree, item => item.type === 'select').props.onChange({ target: { value: 'recent' } }); s.render();
  const chart = find(s.tree, item => item.type?.name === 'ResearchChart'); assert.equal(chart.props.points.length, 6);
  const table = find(s.tree, item => item.type === 'table'); assert.doesNotMatch(text(table), /2015/); assert.match(text(table), /2025.*10,03/);
  const svg = renderToStaticMarkup(React.createElement(load('components/ResearchUnderstanding.js').ResearchChart, chart.props));
  assert.match(svg, /role="img".*aria-labelledby=/); assert.match(svg, /2025: 10,03 °C/); assert.doesNotMatch(svg, /2015|<path/);
  const birds = setup('components/ResearchUnderstanding.js', { dataset: research.getResearchDataset('brutvoegel') }, 'DatasetView');
  find(birds.tree, item => item.type === 'select').props.onChange({ target: { value: 'wald' } }); birds.render();
  assert.equal(find(birds.tree, item => item.type?.name === 'ResearchChart').props.points.length, 1);
  assert.match(text(find(birds.tree, item => item.type === 'table')), /Waldvögel.*56 Arten.*31,88/);
});
test('Learning observation gaps remain missing data while the legacy course acknowledges program definitions', () => {
  const { natureExpansionModules } = load('lib/learning-expansion-nature.js');
  const course = natureExpansionModules.find(item => item.id === 'wissen-ausbau-monitoring');
  const dataLesson = course.lessons.find(item => item.id === 'daten');
  assert.doesNotMatch(dataLesson.paragraphs.join(' '), /Null kann nur/);
  assert.match(dataLesson.paragraphs.join(' '), /ausgefallenen Lernbesuch/);
  assert.match(dataLesson.paragraphs.join(' '), /Amtliche Programme/);
  const question = course.questions.find(item => item.id === '4');
  assert.match(question.q, /Lernbeobachtung/); assert.equal(question.options[question.answer], 'Keine Erhebung beziehungsweise fehlende Angabe');
  assert.ok(course.sources.some(source => source.url.includes('wildbienen.thuenen.de')));
});
test('Each new ecology deep link directly selects its group, photograph and immediate answer feedback', () => {
  for (const id of ['spinnen', 'amphibien', 'streuabbau']) {
    const router = { query: { thema: id }, isReady: true };
    const view = setup('components/SmallRevierLife.js', {}, '', router); view.e.effects(); view.render();
    const topic = find(view.tree, item => item.props?.topic)?.props.topic;
    assert.equal(topic.id, id);
    assert.ok(ecology.revierLifeGroups.some(group => group.id === topic.group));
    assert.equal(find(view.tree, item => item.type === 'select').props.value, id);
    const content = setup('components/SmallRevierLife.js', { topic }, 'TopicContent');
    assert.match(content.html(), /13\. Oktober 2026/);
    const photograph = find(content.tree, item => item.props?.src === topic.photo.src);
    assert.ok(photograph); assert.ok(topic.photo.visuallyVerified);
    const wrong = (topic.quiz.answer + 1) % topic.quiz.choices.length;
    find(content.tree, item => item.type === 'input' && item.props.value === wrong).props.onChange(); content.render();
    const feedback = find(content.tree, item => item.props?.role === 'status');
    assert.ok(text(feedback).includes(topic.quiz.choices[topic.quiz.answer]));
    find(content.tree, item => item.type === 'input' && item.props.value === topic.quiz.answer).props.onChange(); content.render();
    assert.match(text(find(content.tree, item => item.props?.role === 'status')), /Das passt/);
    assert.doesNotMatch(content.html(), /<button/);
  }
});
test('New factual segments retain an explicit evidence map and do not redate legacy ecology', () => {
  const report = load('docs/small-revier-life-expansion-oct13.json');
  assert.equal(report.reviewedOn, '2026-10-13');
  assert.equal(report.topics.flatMap(topic => topic.claims).length, 9);
  for (const reviewed of report.topics) {
    const topic = ecology.revierLifeTopics.find(item => item.id === reviewed.id);
    assert.ok(topic);
    assert.deepEqual(reviewed.claims.map(item => item.factId).sort(), topic.facts.map(item => item.id).sort());
    for (const claim of reviewed.claims) {
      const fact = topic.facts.find(item => item.id === claim.factId);
      assert.deepEqual(claim.sourceIds, fact.sourceIds);
      assert.deepEqual([...new Set(claim.sourceIds.map(id => ecology.revierLifeSources[id].organization))].sort(), [...claim.independentOrganizations].sort());
      assert.ok(claim.independentOrganizations.length >= 2 && claim.boundary);
      assert.ok(claim.support.every(item => claim.sourceIds.includes(item.sourceId) && item.supports && item.section));
    }
  }
  const legacyIds = ['wildbienen', 'laufkaefer', 'holzpilze', 'mykorrhiza', 'regenwuermer', 'springschwaenze'];
  assert.deepEqual(legacyIds.map(id => { const topic = ecology.revierLifeTopics.find(item => item.id === id); assert.ok(topic); return topic.reviewedOn; }), Array(6).fill('2026-10-12'));
  const frogPhoto = ecology.getRevierLifeTopic('amphibien').photo;
  assert.equal(frogPhoto.license, 'CC BY-SA 3.0 DE');
  assert.match(frogPhoto.licenseUrl, /\/3\.0\/de\/$/);
  const oldTopic = setup('components/SmallRevierLife.js', { topic: ecology.getRevierLifeTopic('wildbienen') }, 'TopicContent');
  assert.match(oldTopic.html(), /12\. Oktober 2026/);
  assert.doesNotMatch(oldTopic.html(), /13\. Oktober 2026/);
});
