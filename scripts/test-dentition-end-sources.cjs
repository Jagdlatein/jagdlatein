// Actual component rendering and isolated hook state only: no browser or remote calls.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const Dentition = load('components/WildlifeDentition.js').default;
const Round = load('components/ResearchQuestionRound.js').default;
const { dentitionProfiles, dentalNotationSources, birdDentition, birdDentitionSlugs, dentitionWithheld } = load('lib/wildlife-dentition.js');
const { makeDentitionQuestions } = load('lib/dentition-questions.js');
const { currentResearchQuestion } = load('lib/research-question-round.js');
const research = load('lib/practice-research-server.js').getPracticeResearchData();
const explanation = [
  'Die Zahlen beschreiben jeweils eine Kieferseite. Oben steht die Zahl im Oberkiefer, darunter die im Unterkiefer. Für die linke und rechte Seite zusammen wird die Summe verdoppelt.',
  'I bezeichnet Schneidezähne, C Eckzähne, P Prämolaren und M Molaren. Die Formel hier beschreibt das bleibende Gebiss. Milchgebiss und Zahnwechsel sind davon getrennt zu betrachten; dafür wird hier keine ungeprüfte Formel angegeben.',
  'Das ist eine Zählübersicht, keine Zeichnung der Zahnform oder ihrer räumlichen Lage. Die artspezifischen Einschränkungen stehen direkt bei der Formel.',
];
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
function escaped(value) { return renderToStaticMarkup(React.createElement('span', null, value)).slice(6, -7); }
function roundProps(profile) {
  return nodes(Dentition({ slug: profile.slug, name: profile.name }), node => node.type === Round)[0].props;
}
function roundFixture(initialProps) {
  const slots = [], pendingEffects = [], cleanups = new Map();
  let cursor = 0, dirty = false, tree, props = initialProps;
  const hooks = {
    ...React,
    useReducer(reducer, arg, init) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: init(arg) };
      return [slots[index].value, event => {
        const value = reducer(slots[index].value, event);
        dirty ||= value !== slots[index].value;
        slots[index].value = value;
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useEffect(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        slots[index] = { dependencies }; pendingEffects.push({ index, callback });
      }
    },
  };
  const Component = createLoader({ react: hooks })('components/ResearchQuestionRound.js').default;
  function render() {
    let renders = 0;
    do {
      assert.ok(renders++ < 10, 'Effects must settle');
      dirty = false; cursor = 0; tree = Component(props);
      for (const node of nodes(tree, node => node.props?.ref)) node.props.ref.current = { focus() {} };
      for (const effect of pendingEffects.splice(0)) {
        cleanups.get(effect.index)?.();
        const cleanup = effect.callback();
        if (typeof cleanup === 'function') cleanups.set(effect.index, cleanup);
      }
    } while (dirty);
    return tree;
  }
  function button(label) {
    const button = nodes(tree, node => node.type === 'button' && text(node) === label)[0];
    assert.ok(button, `Missing actual button: ${label}`);
    return button;
  }
  function answer() {
    const question = currentResearchQuestion(slots[0].value);
    if (question.format === 'single') {
      button(question.options.find(option => question.correctIds.includes(option.id)).text).props.onClick();
    } else if (question.format === 'multiple') {
      for (const id of question.correctIds) {
        const label = nodes(tree, node => node.type === 'label' && text(node) === question.options.find(option => option.id === id).text)[0];
        nodes(label, node => node.type === 'input')[0].props.onChange(); render();
      }
      button('Antwort prüfen').props.onClick();
    } else {
      for (const [position, id] of question.expectedOrder.entries()) {
        nodes(tree, node => node.type === 'select')[position].props.onChange({ target: { value: id } }); render();
      }
      button('Antwort prüfen').props.onClick();
    }
    render(); return question;
  }
  const fixture = {
    render, answer, button,
    get tree() { return tree; }, get state() { return slots[0].value; },
    html() { return renderToStaticMarkup(tree); },
    setProps(nextProps) { props = nextProps; render(); },
    finish() {
      while (!fixture.state.finished) {
        answer();
        button(fixture.state.index + 1 === fixture.state.ids.length ? 'Runde auswerten' : 'Nächste Frage').props.onClick();
        render();
      }
    },
    dispose() { for (const cleanup of cleanups.values()) cleanup(); },
  };
  render(); return fixture;
}
function fullDentitionHtml(profile, fixture) {
  // The parent is real; its actual child output is supplied after real hook actions.
  const Parent = createLoader({ './ResearchQuestionRound': { __esModule: true, default: () => fixture.tree } })('components/WildlifeDentition.js').default;
  return renderToStaticMarkup(React.createElement(Parent, { slug: profile.slug, name: profile.name }));
}
function assertCollectedSources(html, profile) {
  const sourceStart = html.indexOf('<summary>Belege zur Zahnformel</summary>');
  assert.ok(sourceStart > html.indexOf('Zahnformel abwechslungsreich üben'));
  assert.ok(html.endsWith('</details></section>'), 'Collected sources are the final content of the dentition panel');
  for (const source of [...profile.sources, ...dentalNotationSources]) {
    const marker = `href="${escaped(source.url)}"`;
    assert.equal(html.split(marker).length - 1, 1, `${profile.slug}:${source.id} must occur once`);
    assert.ok(html.indexOf(marker) > sourceStart, source.id);
    assert.ok(html.includes(escaped(`${source.organization}: ${source.title}`)), source.id);
  }
  assert.doesNotMatch(html, /Quellen zur aktuellen Frage|Quellen zur Übungsrunde/);
}

test('Every actual dentition panel teaches the complete notation before its exercise and ends with one closed source collection', () => {
  for (const profile of dentitionProfiles) {
    const tree = Dentition({ slug: profile.slug, name: profile.name });
    const html = renderToStaticMarkup(React.createElement(Dentition, { slug: profile.slug, name: profile.name }));
    const reading = nodes(tree, node => node.type === 'section' && text(node).startsWith('Zahnformeln richtig lesen'))[0];
    assert.deepEqual(nodes(reading, node => node.type === 'p').map(text), explanation);
    assert.ok(html.indexOf('Zahnformeln richtig lesen') < html.indexOf('Zahnformel abwechslungsreich üben'));
    assert.ok(html.includes(escaped(profile.scope)), profile.slug);
    if (profile.note) assert.ok(html.includes(escaped(profile.note)), profile.slug);
    assert.ok(html.includes(`= ${profile.total}`), profile.slug);
    const sources = nodes(tree, node => node.type === 'details' && nodes(node, child => child.type === 'summary' && text(child) === 'Belege zur Zahnformel').length)[0];
    assert.equal(sources.props.open, undefined);
    assert.ok(text(sources).includes(new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${profile.reviewedOn}T00:00:00Z`))));
    assertCollectedSources(html, profile);
  }
});

test('All sixteen question objects, original sources, scope notice and profile association still reach the actual round unchanged', () => {
  for (const profile of dentitionProfiles) {
    const props = roundProps(profile);
    assert.deepEqual(props.questions, makeDentitionQuestions(profile));
    assert.equal(props.questions.length, 16);
    assert.equal(props.sources, profile.sources);
    assert.equal(props.showSources, false);
    assert.equal(props.sectionId, `gebisscheck-${profile.slug}`);
    assert.equal(props.notice, 'Du übst die oben gezeigte Referenzformel. Diese Zählübung beurteilt kein individuelles Tier und ersetzt keine Altersbestimmung. Beim Verlassen beginnt die Runde neu.');
    for (const question of props.questions) assert.ok(question.sourceIds.every(id => profile.sources.some(source => source.id === id)));
  }
});

test('Answering the real embedded dentition round keeps its explanation and scoring while all evidence stays at the end', () => {
  const profile = dentitionProfiles[0], before = JSON.stringify(profile);
  const fixture = roundFixture(roundProps(profile));
  const question = fixture.answer();
  assert.equal(fixture.state.answers[question.id].correct, true);
  assert.ok(fixture.html().includes(escaped(question.explanation)));
  assert.match(fixture.html(), /Richtig eingeordnet/);
  assert.doesNotMatch(fixture.html(), /<a\b|Quellen zur/);
  const html = fullDentitionHtml(profile, fixture);
  assert.ok(html.indexOf('Zahnformeln richtig lesen') < html.indexOf('Dein Gebisscheck'));
  assertCollectedSources(html, profile);
  assert.equal(JSON.stringify(profile), before);
  fixture.dispose();
});

test('Both completed eight-question batches retain every question and explanation without reintroducing middle sources', () => {
  const profile = dentitionProfiles.find(profile => profile.variants?.length);
  const fixture = roundFixture(roundProps(profile)), seen = new Set();
  for (let batch = 0; batch < 2; batch++) {
    fixture.finish();
    assert.equal(fixture.state.ids.length, 8);
    for (const id of fixture.state.ids) {
      assert.ok(!seen.has(id)); seen.add(id);
      assert.equal(fixture.state.answers[id].correct, true);
      const question = makeDentitionQuestions(profile).find(question => question.id === id);
      assert.ok(fixture.html().includes(escaped(question.explanation)), id);
    }
    assert.match(fixture.html(), /8 von 8 richtig/);
    assertCollectedSources(fullDentitionHtml(profile, fixture), profile);
    if (!batch) { fixture.button('Weitere Fragen').props.onClick(); fixture.render(); }
  }
  assert.equal(seen.size, 16);
  assert.equal(fixture.state.remaining.length, 0);
  fixture.button('Neu gemischt üben').props.onClick(); fixture.render();
  assert.equal(fixture.state.finished, false);
  assert.equal(Object.keys(fixture.state.answers).length, 0);
  assertCollectedSources(fullDentitionHtml(profile, fixture), profile);
  fixture.dispose();
});

test('Omitting showSources preserves real research source links and explanations for all three answer formats', () => {
  for (const format of ['single', 'multiple', 'sequence']) {
    const question = research.questions.find(question => question.format === format);
    const sources = research.topics.find(topic => topic.id === question.topicId).sources;
    const props = { questions: [question], sources };
    const fixture = roundFixture(props);
    assert.doesNotMatch(fixture.html(), /Quellen zur/);
    fixture.answer();
    assert.match(fixture.html(), /Quellen zur aktuellen Frage/);
    for (const id of question.sourceIds) assert.ok(fixture.html().includes(`href="${escaped(sources.find(source => source.id === id).url)}"`));
    const omitted = fixture.html(), state = fixture.state;
    fixture.setProps({ ...props, showSources: true });
    assert.equal(fixture.html(), omitted);
    fixture.setProps({ ...props, showSources: false });
    assert.doesNotMatch(fixture.html(), /Quellen zur/);
    assert.equal(fixture.state, state, 'Presentation cannot reset an answer');
    assert.ok(fixture.html().includes(escaped(question.explanation)));
    fixture.setProps(props);
    fixture.button('Runde auswerten').props.onClick(); fixture.render();
    assert.match(fixture.html(), /Quellen zur Übungsrunde/);
    assert.equal(fixture.state.answers[question.id].correct, true);
    fixture.dispose();
  }
});

test('The existing real daily caller still receives default sources and retains its single-answer behavior', () => {
  const moment = load('lib/revier-moment-server.js').getRevierMoment(new Date('2026-10-16T12:00:00Z'));
  const Moment = load('components/RevierMoment.js').default;
  const props = nodes(Moment({ moment }), node => node.type === Round)[0].props;
  assert.equal(Object.hasOwn(props, 'showSources'), false);
  assert.equal(props.daily, true);
  const fixture = roundFixture(props);
  fixture.answer();
  assert.match(fixture.html(), /Quellen zur aktuellen Frage/);
  assert.match(fixture.html(), /Für heute bearbeitet/);
  assert.doesNotMatch(fixture.html(), /Runde auswerten|Nächste Frage/);
  fixture.dispose();
});

test('Bird, withheld and unsupported dentition paths retain their original content and do not acquire a round', () => {
  const birdSlug = [...birdDentitionSlugs][0];
  const bird = Dentition({ slug: birdSlug, name: 'Vogel' });
  assert.ok(text(bird).includes(birdDentition.text));
  assert.ok(text(bird).includes(birdDentition.scope));
  assert.equal(nodes(bird, node => node.type === Round).length, 0);
  const withheld = dentitionWithheld[0];
  const waiting = Dentition({ slug: withheld.slug, name: 'Art' });
  assert.ok(text(waiting).includes(withheld.reason));
  assert.equal(nodes(waiting, node => node.type === Round).length, 0);
  assert.equal(Dentition({ slug: 'unsupported-test-only', name: 'Unbekannt' }), null);
});
