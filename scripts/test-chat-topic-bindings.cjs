const test = require("node:test");
const assert = require("node:assert/strict");
const { createLoader } = require("./helpers/project-module.cjs");

const load = createLoader();
const { learningModules, getLearningModule } = load("lib/learning-curriculum.js");
const { chatPracticeBindings, chatTopicBindings } = load("lib/jagdlatein-chat-bindings.js");
const { withChatPractice } = load("lib/jagdlatein-chat-practice.js");
const { answerJagdlateinQuestion: answer } = load("lib/jagdlatein-chat.js");
const { lessonHash } = load("lib/learning-lesson-navigation.js");
const clone = value => JSON.parse(JSON.stringify(value));
const profiles = [{ country: "CH", region: "ZH" }, { country: "AT", region: "S" }, { country: "DE", region: "BY" }];
const dog = "wissen-vertiefung-hunde-klare-lernsignale";
const ecology = "wissen-vertiefung-populationsoekologie";
const horn = "wissen-vertiefung-geweih-horn-gewebe-2026";
const forest = "wissen-ausbau-waldverjuengung-verbiss";
const feather = "wissen-ausbau-federaufbau-funktion-2026";

// Independent editorial expectations, deliberately not derived from registry
// order, its source lists, its first question, or the matching implementation.
const expectedPairs = [
  [dog, `${dog}-gewoehnung`, "Habituation bezeichnet", `${dog}-gewoehnung-frage-1`],
  [dog, `${dog}-lernverknuepfungen`, "Klassische Konditionierung", `${dog}-lernverknuepfungen-frage-1`],
  [dog, `${dog}-lernverknuepfungen`, "Operante Konditionierung", `${dog}-lernverknuepfungen-frage-2`],
  [ecology, "artenbeziehungen", "Mutualismus beschreibt", "artenbeziehungen-vergleich"],
  [ecology, "artenbeziehungen", "Beim Parasitismus", "artenbeziehungen-parasitismus"],
  [horn, "gewebe", "Geweih besteht aus Knochen", "q1"],
  [horn, "erneuerung", "Bast ist die versorgende Haut", "q4"],
  [forest, "samenmast", "Bei der Rotbuche wechseln", "samenmast-zeitmuster"],
  [forest, "samenmast", "Starke Samenproduktion kann", "samenmast-synchronitaet"],
  [forest, "stockausschlag-wurzelbrut", "Stockausschlag geht", "stock-wurzel-herkunft"],
  ["wissen-federwild-beobachtung", "vogel-lamellen", "Die Stockente kann", "vogel-lamellen-funktion"],
  ["wissen-ausbau-oekologie-holzaufbau-2026", "gefaessverteilung", "Stiel- und Traubeneiche", "gefaessverteilung-ringporige-eiche"],
  [feather, "feinbau", "Eine typische Fahnenfeder", "feinbau-q2"],
  [feather, "waerme", "Lockere Federn halten", "waerme-q1"],
  ["wissen-vertiefung-kiefernzapfen-round6-2026", "hygroskopische-bewegung", "Unterschiedliche Quellung/Schwindung", "hygroskopische-bewegung"],
  ["wissen-vertiefung-laubblatt-merkmale-round4-2026", "blattstellung", "Wechselständigkeit kann", "q2"],
];

function originalPair([courseId, lessonId, claimPrefix, questionSuffix]) {
  const course = getLearningModule(courseId);
  const lesson = course?.lessons.find(item => item.id === lessonId);
  const evidence = lesson?.evidence.find(item => item.claim.startsWith(claimPrefix));
  const question = course?.questions.find(item => item.id === `${courseId}-${questionSuffix}`);
  assert.ok(evidence, `${courseId}/${lessonId}/${claimPrefix}`);
  assert.equal(question?.lessonId, lessonId);
  return { course, lesson, evidence, question };
}

function replyFor(course, lesson, evidence) {
  const sources = [...new Map(evidence.sources.map(source => [new URL(source.url).href, {
    label: source.label, href: new URL(source.url).href,
  }])).values()];
  return {
    kind: "lesson", text: evidence.claim,
    links: [{ label: `Lektion: ${lesson.title} · ${course.title}`, href: `/kurse/${course.id}${lessonHash(lesson.id)}` }, ...sources],
  };
}

function assertOriginalPractice(result, original, href) {
  const { course, lesson, question } = original;
  assert.deepEqual(result.practice, {
    id: question.id, prompt: question.q, options: question.answers,
    correctId: question.correct[0], explanation: question.explain,
    context: `${course.title} · ${lesson.title}${question.context ? `\n\n${question.context}` : ""}`, href,
  });
}

for (const spec of expectedPairs) {
  test(`Explicit original practice ${spec[0]}/${spec[2]} is identical for CH, AT and DE`, () => {
    const original = originalPair(spec);
    const binding = chatPracticeBindings.find(item => item.courseId === spec[0] && item.lessonId === spec[1] && item.claim === original.evidence.claim);
    assert.equal(binding?.questionId, original.question.id, "The editorial pair is exact, not merely in the same lesson");
    assert.deepEqual(binding.sourceUrls, original.evidence.sources.map(source => new URL(source.url).href));
    const reply = replyFor(original.course, original.lesson, original.evidence);
    const before = clone({ reply, original });
    for (const profile of profiles) {
      const result = withChatPractice(reply, profile);
      assertOriginalPractice(result, original, reply.links[0].href);
      assert.equal(result.text, reply.text);
      assert.deepEqual(result.links.filter(link => !link.href.startsWith("/")), reply.links.slice(1));
      assert.equal(result.practice.options.length, 4);
      assert.equal(new Set(result.practice.options.map(option => option.id)).size, 4);
    }
    assert.deepEqual({ reply, original }, before);
  });
}

test("Every declared practice topic is reachable through the real chat dispatcher", () => {
  for (const spec of expectedPairs) {
    const original = originalPair(spec);
    const binding = chatPracticeBindings.find(item => item.questionId === original.question.id);
    assert.ok(binding.aliases?.length, original.question.id);
    for (const profile of profiles) {
      const result = answer(binding.aliases[0], profile);
      assert.equal(result.kind, "lesson", binding.aliases[0]);
      assert.equal(result.text, original.evidence.claim, binding.aliases[0]);
      assertOriginalPractice(result, original, `/kurse/${original.course.id}${lessonHash(original.lesson.id)}`);
      assert.deepEqual(result.links.filter(link => !link.href.startsWith("/")), replyFor(original.course, original.lesson, original.evidence).links.slice(1));
    }
  }
});

test("Operant/classical and parasitism/mutualism remain separate under actual natural questions", () => {
  const cases = [
    ["Was bedeutet operante Konditionierung?", expectedPairs[2]],
    ["Was ist klassische Konditionierung?", expectedPairs[1]],
    ["Was ist Parasitismus?", expectedPairs[4]],
    ["Wie unterscheiden sich Mutualismus und Kommensalismus?", expectedPairs[3]],
  ];
  for (const [question, spec] of cases) {
    const original = originalPair(spec);
    for (const profile of profiles) {
      const result = answer(question, profile);
      assert.equal(result.text, original.evidence.claim, question);
      assertOriginalPractice(result, original, `/kurse/${original.course.id}${lessonHash(original.lesson.id)}`);
    }
  }
});

function driftFixture(mutate) {
  const selected = originalPair(expectedPairs[2]);
  const course = clone(selected.course);
  const lesson = course.lessons.find(item => item.id === selected.lesson.id);
  const evidence = lesson.evidence.find(item => item.claim === selected.evidence.claim);
  const question = course.questions.find(item => item.id === selected.question.id);
  mutate({ course, lesson, evidence, question });
  const isolated = createLoader({
    "./learning-curriculum": { learningModules: [course], getLearningModule: id => id === course.id ? course : undefined },
    "./learning-flashcards": { getFlashcardLessonSummary: () => ({ lessons: {} }) },
  });
  const reply = replyFor(course, lesson, evidence);
  return { reply, result: isolated("lib/jagdlatein-chat-practice.js").withChatPractice(reply, profiles[0]) };
}

test("Registered practice fails closed after any original question, answer, explanation or context drift", () => {
  for (const [label, mutate] of [
    ["prompt", ({ question }) => { question.q += " Neue, nicht freigegebene Frage."; }],
    ["answer text", ({ question }) => { question.answers[0].text += " Neue Behauptung."; }],
    ["answer order", ({ question }) => { question.answers.reverse(); }],
    ["answer identifiers", ({ question }) => {
      question.correct = question.correct.map(id => `new-${id}`);
      question.answers.forEach(option => { option.id = `new-${option.id}`; });
    }],
    ["correct answer", ({ question }) => { question.correct = [question.answers.find(option => !question.correct.includes(option.id)).id]; }],
    ["explanation", ({ question }) => { question.explain += " Zusätzliche Erklärung."; }],
    ["context", ({ question }) => { question.context = "Ein neuer, anderer Papierfall."; }],
    ["country order", ({ question }) => { question.countries.reverse(); }],
    ["topic", ({ question }) => { question.topic = "Wildkunde"; }],
  ]) {
    const { result, reply } = driftFixture(mutate);
    assert.equal(result.practice, undefined, label);
    assert.equal(result, reply, label);
  }
});

test("Changed claim, changed source identity/order and a missing exact question cannot fall back to another question", () => {
  for (const [label, mutate] of [
    ["claim", ({ evidence }) => { evidence.claim += " Geänderter Geltungsbereich."; }],
    ["source URL", ({ evidence }) => { evidence.sources[0].url = "https://other.invalid/replacement"; }],
    ["source order", ({ evidence }) => { evidence.sources.reverse(); }],
    ["source added", ({ evidence }) => { evidence.sources.push({ label: "Weitere Quelle", url: "https://new.invalid/source" }); }],
    ["question removed", ({ course, question }) => { course.questions = course.questions.filter(item => item !== question); }],
    ["question moved to another lesson", ({ question }) => { question.lessonId = "other-lesson"; }],
  ]) {
    const { result, reply } = driftFixture(mutate);
    assert.equal(result.practice, undefined, label);
    assert.equal(result, reply, label);
  }
});

test("Birch and diffuse-porous claims in the same wood lesson cannot acquire the oak exercise", () => {
  const course = getLearningModule("wissen-ausbau-oekologie-holzaufbau-2026");
  const lesson = course.lessons.find(item => item.id === "gefaessverteilung");
  const claims = lesson.evidence.filter(item => item.claim.startsWith("Sandbirke") || item.claim.startsWith("Zerstreutporig"));
  assert.equal(claims.length, 2);
  for (const evidence of claims) for (const profile of profiles) {
    const reply = replyFor(course, lesson, evidence);
    const result = withChatPractice(reply, profile);
    assert.equal(result.practice, undefined, evidence.claim);
    assert.equal(result.text, evidence.claim);
    assert.ok(result.links.some(link => link.href.includes("lektion=gefaessverteilung")), "Existing exact-lesson cards remain available");
    assert.deepEqual(result.links.filter(link => !link.href.startsWith("/")), reply.links.slice(1));
  }
});

test("Three pinned topics show their complete original evidence and two scoped topics link the original lesson", () => {
  assert.equal(chatTopicBindings.length, 5);
  assert.equal(chatTopicBindings.filter(binding => binding.direct).length, 3);
  for (const binding of chatTopicBindings) {
    const parsed = new URL(binding.href, "https://jagdlatein.de");
    const course = getLearningModule(parsed.pathname.slice("/kurse/".length));
    const lesson = course.lessons.find(item => lessonHash(item.id) === parsed.hash);
    const evidence = lesson.evidence.find(item => item.claim === binding.claim);
    assert.ok(evidence, binding.href);
    assert.deepEqual(evidence.sources.map(source => new URL(source.url).href), binding.sourceUrls);
    for (const alias of binding.aliases) for (const profile of profiles) {
      const result = answer(`Erkläre mir bitte ${alias}.`, profile);
      assert.equal(result.kind, binding.direct ? "lesson" : "clarify", alias);
      assert.equal(result.links[0].href, binding.href, alias);
      if (binding.direct) {
        assert.equal(result.text, evidence.claim, alias);
        assert.deepEqual(result.links.filter(link => !link.href.startsWith("/")), replyFor(course, lesson, evidence).links.slice(1));
      } else {
        assert.deepEqual(result.links.map(link => link.href), [binding.href]);
        assert.notEqual(result.text, evidence.claim, "A terse evidence index is not falsely presented as a full explanation");
        assert.equal(result.practice, undefined);
      }
    }
  }
});

test("Wrong species, actual health questions, requests for media, negation and vague topics never receive a pinned answer", () => {
  const pinnedClaims = new Set(chatTopicBindings.map(binding => binding.claim));
  const health = new Set(["Mein Hund ist krank, was bedeuten seine Lymphknoten?", "Nierenkörperchen beim Hund: Welche Behandlung brauche ich?"]);
  for (const question of [
    "Was sind die Spaltöffnungen einer Stockente?", "Stomata beim Rothirsch", "Stomata bei Insekten",
    "Nierenkörperchen bei Vögeln", "Lymphknoten bei der Stockente", "Ökosystem vom Reh",
    "Stomata sind keine Spaltöffnungen", "Was ist der Unterschied zwischen Ökosystem und Naturverjüngung?",
    "Stomata Video", "Zeige ein Foto der Spaltöffnungen", "Nierenkörperchen Video", "Lymphknoten Bilder",
    "Was ist Wild?", "Wie funktioniert die Natur?", ...health,
  ]) for (const profile of profiles) {
    const result = answer(question, profile);
    assert.equal(result.kind, "clarify", question);
    assert.equal(pinnedClaims.has(result.text), false, question);
    assert.equal(result.practice, undefined, question);
    if (health.has(question)) assert.equal(result.links[0].href, "/lernen/wildbret-gesundheit", question);
  }
});

test("Binding enrichment leaves the full course and question corpus unchanged", () => {
  const before = JSON.stringify(learningModules);
  for (const spec of expectedPairs) {
    const original = originalPair(spec);
    withChatPractice(replyFor(original.course, original.lesson, original.evidence), profiles[0]);
  }
  for (const binding of chatTopicBindings) answer(binding.aliases[0], profiles[0]);
  assert.equal(JSON.stringify(learningModules), before);
});
