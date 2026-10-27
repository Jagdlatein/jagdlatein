const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const load = createLoader();
const { wildYearSpecies, wildYearSources, getWildYearProfile } = load('lib/wild-year.js');
const { getWildYearPractice, getWildYearPracticeEvidence } = load('lib/wild-year-practice.js');
const React = local('react');

// Executes the real component and effects. Cleanup and pre-cleanup renders are
// deliberately separate so stale callbacks cannot hide behind a remount mock.
function fixture(t, speciesSlug = 'rehwild', options = {}) {
  const slots = [], cleanups = [], pending = [];
  let cursor = 0, changed = false, tree, writes = 0;
  let props = { speciesSlug, scope: {}, isCurrent: () => true, ...options };
  const hooks = { ...React,
    useRef(initial) { const slot = cursor++; return slots[slot] ||= { current: initial }; },
    useState(initial) {
      const slot = cursor++;
      slots[slot] ||= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[slot].value, update => {
        writes++; const next = typeof update === 'function' ? update(slots[slot].value) : update;
        changed ||= !Object.is(next, slots[slot].value); slots[slot].value = next;
      }];
    },
    useEffect(effect, dependencies) {
      const slot = cursor++;
      if (!slots[slot] || dependencies.some((value, index) => !Object.is(value, slots[slot].dependencies[index]))) {
        slots[slot] = { dependencies };
        pending.push(() => { cleanups[slot]?.(); cleanups[slot] = effect(); });
      }
    },
  };
  const Component = createLoader({ react: hooks })('components/WildYearPractice.js').default;
  function render(next = {}, effects = true) {
    props = { ...props, ...next };
    for (let pass = 0; pass < 8; pass++) {
      cursor = 0; changed = false; tree = Component(props);
      if (effects) pending.splice(0).forEach(run => run());
      if (!changed) return tree;
    }
    throw new Error('Practice did not settle');
  }
  function dispose() { cleanups.splice(0).forEach(cleanup => cleanup?.()); }
  render(); t.after(dispose);
  return { render, dispose, get tree() { return tree; }, get props() { return props; }, get writes() { return writes; },
    nodes: predicate => nodes(tree, predicate),
    radio(id) { return nodes(tree, node => node.type === 'input' && node.props.value === id)[0]; },
    button(label) { return nodes(tree, node => node.type === 'button' && text(node) === label)[0]; },
  };
}
const heading = h => h.nodes(node => node.props?.id === 'wildjahr-practice-question')[0];
const chosen = h => h.nodes(node => node.type === 'input' && node.props.checked).map(node => node.props.value);
function answer(h, question, correct = true) {
  const id = correct ? question.answerId : question.choices.find(choice => choice.id !== question.answerId).id;
  h.radio(id).props.onChange(); h.render(); return id;
}
function advance(h) { const button = h.button('Nächste Frage') || h.button('Runde abschließen'); assert.ok(button); button.props.onClick(); h.render(); }
function finish(h, questions, wrongIds = []) {
  for (const question of questions) { answer(h, question, !wrongIds.includes(question.id)); advance(h); }
  assert.equal(text(heading(h)), 'Runde abgeschlossen');
}

test('Every exercise reads one actual unambiguous phase, with same-field alternatives and exact explanation/evidence', () => {
  let questionsChecked = 0; const correctPositions = new Set();
  for (const species of wildYearSpecies) {
    const questions = getWildYearPractice(species.slug), concepts = new Set();
    assert.ok(questions.length > 0 && questions.length <= 4, species.slug);
    for (const question of questions) {
      const section = getWildYearProfile(species.slug, question.month).sections.find(item => item.key === question.sectionKey);
      const claim = section.claim;
      assert.equal(question.answerId, claim.id); assert.equal(question.claimId, claim.id);
      assert.equal(question.explanation, claim.text); assert.equal(question.uncertainty, species.uncertainty);
      assert.equal(question.reviewedOn, species.reviewedOn); assert.deepEqual(question.sourceIds, claim.sourceIds);
      assert.ok(question.prompt.includes('Modell') && question.prompt.includes(question.monthName) && question.prompt.includes(section.label));
      assert.equal(question.sectionLabel, section.label);
      assert.ok(question.choices.length >= 2 && question.choices.length <= 3);
      assert.equal(new Set(question.choices.map(choice => choice.title)).size, question.choices.length);
      const authored = species[question.sectionKey]; assert.ok(authored.length > 1, 'No year-round-only exercise');
      for (const choice of question.choices) {
        const phase = authored.find(item => item.id === choice.id); assert.ok(phase);
        assert.equal(choice.title, phase.title); assert.deepEqual(choice.sourceIds, phase.sourceIds);
        for (const id of choice.sourceIds) assert.ok(wildYearSources[id]);
      }
      const concept = `${claim.title}\n${claim.text}`; assert.ok(!concepts.has(concept)); concepts.add(concept);
      correctPositions.add(question.choices.findIndex(choice => choice.id === question.answerId)); questionsChecked++;
    }
  }
  assert.ok(questionsChecked >= wildYearSpecies.length); assert.ok(correctPositions.size >= 2, 'Answer is not always the first option');
});

test('A two-phase model keeps two real choices, and unsupported/overview-only species never fall back to another species', () => {
  const stock = getWildYearPractice('stockente'); assert.equal(stock.length, 2);
  assert.ok(stock.every(question => question.sectionKey === 'reproduction' && question.choices.length === 2));
  for (const slug of ['unbekannt', 'elchwild', '', undefined, ['rehwild']]) {
    assert.deepEqual(getWildYearPractice(slug), []); assert.deepEqual(getWildYearPracticeEvidence(slug), []);
  }
});

test('Parent evidence includes every displayed alternative exactly once without mutating the authored facts', () => {
  for (const species of wildYearSpecies) {
    const questions = getWildYearPractice(species.slug), evidence = getWildYearPracticeEvidence(species.slug);
    const actual = new Map(evidence.map(item => [`${item.sectionKey}:${item.claimId}`, item])); assert.equal(actual.size, evidence.length);
    const expected = new Set();
    for (const question of questions) for (const choice of question.choices) {
      const key = `${question.sectionKey}:${choice.id}`; expected.add(key);
      assert.equal(actual.get(key)?.title, choice.title); assert.deepEqual(actual.get(key)?.sourceIds, choice.sourceIds);
      assert.equal(actual.get(key)?.reviewedOn, species.reviewedOn);
    }
    assert.deepEqual(new Set(actual.keys()), expected);
  }
  const original = JSON.stringify(wildYearSpecies), first = getWildYearPractice('rehwild');
  first[0].sourceIds.push('not-a-source'); first[0].choices[0].sourceIds.length = 0;
  assert.equal(JSON.stringify(wildYearSpecies), original); assert.ok(!JSON.stringify(getWildYearPractice('rehwild')).includes('not-a-source'));
});

test('Full question and exact feedback stay visible; the child creates no extra menu, source disclosure or external link', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t);
  assert.equal(text(heading(h)), questions[0].prompt); assert.equal(h.nodes(node => node.type === 'input').length, questions[0].choices.length);
  assert.equal(h.nodes(node => node.type === 'details' || node.type === 'a' || node.type === 'select').length, 0);
  assert.match(text(h.tree), /keine amtlichen Prüfungsfragen/); assert.equal(h.button('Nächste Frage'), undefined);
  answer(h, questions[0], false);
  const feedback = h.nodes(node => node.props?.role === 'status')[0];
  assert.ok(text(feedback).includes(questions[0].explanation)); assert.ok(text(feedback).includes(questions[0].uncertainty));
  assert.equal(h.nodes(node => node.type === 'fieldset')[0].props.disabled, true);
  assert.ok(h.button('Nächste Frage'));
});

test('First answer wins before rerender, and an old radio/Next cannot answer or skip a different question', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t);
  const first = h.radio(questions[0].answerId), other = h.radio(questions[0].choices.find(choice => choice.id !== questions[0].answerId).id);
  first.props.onChange(); other.props.onChange(); h.render(); assert.deepEqual(chosen(h), [questions[0].answerId]);
  const oldNext = h.button('Nächste Frage'); oldNext.props.onClick(); oldNext.props.onClick(); h.render();
  assert.equal(text(heading(h)), questions[1].prompt); assert.deepEqual(chosen(h), []);
  const writes = h.writes; first.props.onChange(); oldNext.props.onClick(); h.render();
  assert.equal(h.writes, writes); assert.equal(text(heading(h)), questions[1].prompt); assert.deepEqual(chosen(h), []);
});

test('Wrong-only repeat contains only failed phases; restart restores the full round and invalidates old finish/reset handlers', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t), wrongIds = [questions[1].id];
  finish(h, questions, wrongIds); assert.match(text(h.tree), /3 von 4/);
  const repeat = h.button('Fehler wiederholen'), oldRestart = h.button('Neu beginnen');
  repeat.props.onClick(); oldRestart.props.onClick(); h.render();
  assert.equal(text(heading(h)), questions[1].prompt); assert.match(text(h.tree), /Frage 1 von 1/); assert.deepEqual(chosen(h), []);
  const before = h.writes; repeat.props.onClick(); h.render(); assert.equal(h.writes, before);
  answer(h, questions[1]); advance(h); assert.match(text(h.tree), /1 von 1/); assert.equal(h.button('Fehler wiederholen'), undefined);
  h.button('Neu beginnen').props.onClick(); h.render(); assert.equal(text(heading(h)), questions[0].prompt); assert.match(text(h.tree), /Frage 1 von 4/);
});

test('Same URL scope preserves the round across parent rerenders and guard-function replacement', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t);
  const oldRadio = h.radio(questions[0].answerId); answer(h, questions[0]);
  h.render({ isCurrent: () => true }); assert.deepEqual(chosen(h), [questions[0].answerId]);
  const writes = h.writes; oldRadio.props.onChange(); h.render(); assert.equal(h.writes, writes);
  advance(h); assert.equal(text(heading(h)), questions[1].prompt);
});

test('Committed A–B–A scopes synchronously invalidate old handlers before any effect cleanup', t => {
  const a = {}, b = {}, questions = getWildYearPractice('rehwild'), h = fixture(t, 'rehwild', { scope: a });
  const oldRadio = h.radio(questions[0].answerId); answer(h, questions[0]); const oldNext = h.button('Nächste Frage');
  h.render({ speciesSlug: 'stockente', scope: b }, false);
  const writes = h.writes; oldRadio.props.onChange(); oldNext.props.onClick(); assert.equal(h.writes, writes);
  const stock = getWildYearPractice('stockente'); assert.equal(text(heading(h)), stock[0].prompt);
  h.render({ speciesSlug: 'rehwild', scope: {} }, false);
  oldRadio.props.onChange(); oldNext.props.onClick(); h.render(); assert.equal(h.writes, writes);
  assert.equal(text(heading(h)), questions[0].prompt); assert.deepEqual(chosen(h), []);
  answer(h, questions[0]); assert.deepEqual(chosen(h), [questions[0].answerId]);
});

test('A completed round cannot restart or repeat inside a new scope of the same species before cleanup', t => {
  const questions = getWildYearPractice('stockente'), h = fixture(t, 'stockente');
  finish(h, questions, [questions[0].id]);
  const restart = h.button('Neu beginnen'), repeat = h.button('Fehler wiederholen');
  h.render({ scope: {} }, false); const writes = h.writes;
  restart.props.onClick(); repeat.props.onClick(); h.render(); assert.equal(h.writes, writes);
  assert.equal(text(heading(h)), questions[0].prompt); assert.deepEqual(chosen(h), []);
});

test('Early parent-origin rejection and disabled readiness block actions, including retained enabled handlers', t => {
  let active = true; const h = fixture(t, 'rehwild', { isCurrent: () => active });
  const questions = getWildYearPractice('rehwild'), radio = h.radio(questions[0].answerId), writes = h.writes;
  active = false; radio.props.onChange(); h.render(); assert.equal(h.writes, writes); assert.deepEqual(chosen(h), []);
  active = true; h.render({ disabled: true }); radio.props.onChange(); h.radio(questions[0].answerId).props.onChange(); h.render();
  assert.equal(h.writes, writes); assert.equal(h.nodes(node => node.type === 'fieldset')[0].props.disabled, true);
  h.render({ disabled: false }); answer(h, questions[0]); assert.deepEqual(chosen(h), [questions[0].answerId]);
});

test('Retained answer, Next and restart callbacks cause no state writes after real effect cleanup', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t), radio = h.radio(questions[0].answerId);
  answer(h, questions[0]); const next = h.button('Nächste Frage'); h.dispose(); const writes = h.writes;
  radio.props.onChange(); next.props.onClick(); assert.equal(h.writes, writes);
  const complete = fixture(t, 'stockente'); finish(complete, getWildYearPractice('stockente'));
  const restart = complete.button('Neu beginnen'); complete.dispose(); const finalWrites = complete.writes;
  restart.props.onClick(); assert.equal(complete.writes, finalWrites);
});

test('Moving through a round focuses the new question after render; choosing an answer keeps focus in place', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t); let focuses = 0, scrolls = 0;
  heading(h).props.ref.current = { focus() { focuses++; }, scrollIntoView() { scrolls++; } };
  answer(h, questions[0]); assert.equal(focuses, 0); advance(h); assert.equal(focuses, 1); assert.equal(scrolls, 1);
  assert.equal(text(heading(h)), questions[1].prompt);
});

test('A focus request from the old round cannot steal focus after a committed URL scope change', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t); let focuses = 0;
  heading(h).props.ref.current = { focus() { focuses++; }, scrollIntoView() {} };
  answer(h, questions[0]); h.button('Nächste Frage').props.onClick();
  h.render({ scope: {} }, false); h.render();
  assert.equal(focuses, 0); assert.equal(text(heading(h)), questions[0].prompt);
});

test('A queued focus effect uses the latest readiness and parent guard even when its question dependencies did not change', t => {
  const questions = getWildYearPractice('rehwild'), h = fixture(t); let focuses = 0;
  heading(h).props.ref.current = { focus() { focuses++; }, scrollIntoView() {} };
  answer(h, questions[0]); h.button('Nächste Frage').props.onClick();
  h.render({}, false);
  h.render({ disabled: true, isCurrent: () => false }, false);
  h.render(); assert.equal(focuses, 0); assert.equal(text(heading(h)), questions[1].prompt);
});

test('Overview-only species render no borrowed calendar exercise or interactive placeholder', t => {
  const h = fixture(t, 'elchwild'); assert.equal(h.tree, null); assert.equal(h.writes, 0);
});
