const assert = require("node:assert/strict");
const test = require("node:test");
const { createLoader } = require("./helpers/project-module.cjs");

const load = createLoader();
const { withChatPractice: attach } = load("lib/jagdlatein-chat-practice.js");
const { answerJagdlateinLearningQuestion: learningAnswer } = load("lib/jagdlatein-chat-learning.js");
const { answerJagdlateinLawQuestion: lawAnswer } = load("lib/jagdlatein-chat-law.js");
const { getLearningModule, learningModules } = load("lib/learning-curriculum.js");
const { getFlashcards, getFlashcardLessonSummary } = load("lib/learning-flashcards.js");
const { getLegalDataset } = load("lib/regional-law-data.js");
const { buildRegionalLawBundle, legalSelectionHref } = load("lib/regional-law-core.js");
const { getExamProfileDetails } = load("lib/exam-profile.js");
const { lessonHash } = load("lib/learning-lesson-navigation.js");

const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const source = (label, url) => ({ label, url });
const sources = [source("Fachquelle eins", "https://one.invalid/original"), source("Fachquelle zwei", "https://two.invalid/original")];
function courseQuestion(overrides = {}) {
  return {
    id: "wissen-chat-test-frage", lessonId: "eins",
    q: "Ein Tier wird zweimal beobachtet. Welche Beobachtung wurde tatsächlich beschrieben?",
    answers: [{ id: "c", text: "Zwei Beobachtungen." }, { id: "d", text: "Drei Beobachtungen." },
      { id: "a", text: "Eine Beobachtung." }, { id: "b", text: "Keine Beobachtung." }],
    correct: ["c"], explain: "Die Fallbeschreibung nennt zwei Beobachtungen; sie bestimmt keine Individuenzahl.",
    countries: ["DE", "AT", "CH"], topic: "Wildkunde", ...overrides,
  };
}
function fixture({ questions = [courseQuestion()], cards = { eins: 1 }, courseOverrides = {} } = {}) {
  const course = {
    id: "wissen-chat-test", title: "Originalkurs", category: "Wildkunde", countries: ["DE", "AT", "CH"],
    lessons: [
      { id: "eins", title: "Erste Lektion", evidence: [{ claim: "Vollständige belegte Aussage mit ihrer Geltungsgrenze.", sources }] },
      { id: "zwei", title: "Andere Lektion", evidence: [{ claim: "Andere belegte Aussage.", sources }] },
    ], questions, ...courseOverrides,
  };
  const local = createLoader({
    "./learning-curriculum": { getLearningModule: id => id === course.id ? course : undefined },
    "./learning-flashcards": { getFlashcardLessonSummary: () => ({ lessons: cards }) },
  });
  const reply = {
    kind: "lesson", text: course.lessons[0].evidence[0].claim,
    links: [{ label: "Lektion: Erste Lektion · Originalkurs", href: "/kurse/wissen-chat-test#lesson-eins" },
      ...sources.map(({ label, url }) => ({ label, href: url }))],
  };
  return { course, reply, attach: local("lib/jagdlatein-chat-practice.js").withChatPractice };
}

function legalFixture({ country = "CH", region = "ZH", articleOverrides = {}, questions, federal = false } = {}) {
  const question = {
    id: "original-rechtsfrage", prompt: "Welche Aussage enthält diese vollständig beschriebene Rechtslektion?",
    choices: ["Die erste unveränderte Antwort.", "Die zweite Antwort.", "Die dritte Antwort.", "Die vierte Antwort."],
    correctIndex: 0, explanation: "Vollständige Originalerklärung einschliesslich der örtlichen Grenze.",
  };
  const article = {
    id: "original-artikel", topic: "zulassung", title: "Originallektion", lawTitle: "Originalgesetz", citation: "§ 1",
    originalVerified: true, verified: true, officialText: "Unveränderter Originalauszug.",
    summary: "Unveränderte geprüfte Zusammenfassung mit ihrer Grenze.", reviewedOn: "2026-10-01",
    effectiveFrom: "2026-01-01", questions: questions || [question],
    sources: [
      { title: "Amtlicher Originaltext", url: "https://law.invalid/original", publisher: "Gesetzgeber", kind: "law" },
      { title: "Unabhängige Einordnung", url: "https://independent.invalid/context", publisher: "Fachorganisation", kind: "context" },
    ], ...articleOverrides,
  };
  const dataset = {
    country, regions: [
      { code: region, name: "Ausgewählte Region", articles: federal ? [] : [article] },
      { code: "BUND", name: "Bundesrecht", articles: federal ? [article] : [] },
      { code: "OTHER", name: "Fremde Region", articles: [{ ...article, id: "fremder-artikel" }] },
    ],
  };
  const profile = { country, region };
  const details = getExamProfileDetails(profile);
  const href = legalSelectionHref(country, { region, article: article.id, topic: article.topic, includeFederal: federal });
  const reply = {
    kind: "region", text: article.summary,
    links: [{ label: "Rechtslektion und Gesetzesauszug", href },
      ...article.sources.filter(source => source.kind === "law").map(source => ({ label: source.title, href: source.url }))],
    law: {
      jurisdiction: federal ? `Bundesrecht · ${details.country.name}` :
        `${details.country.regionLabel} ${details.region.name} · ${details.country.name}`,
      lawTitle: article.lawTitle, citation: article.citation, reviewedOn: article.reviewedOn,
    },
  };
  const local = createLoader({ "./regional-law-data": { getLegalDataset: code => code === country ? dataset : null } });
  return { article, dataset, profile, reply, attach: local("lib/jagdlatein-chat-practice.js").withChatPractice };
}

test("The single-evidence/single-question sniffing unit supplies its exact original practice and actual cards", () => {
  const reply = learningAnswer("Wie funktioniert das Schnueffeln beim Hund?");
  const original = clone(reply);
  const course = getLearningModule("wissen-vertiefung-hunde-nase-spur-laut");
  const lesson = course.lessons.find(lesson => lesson.id === "wissen-vertiefung-hunde-nase-spur-laut-ausatemrichtung");
  const question = course.questions.find(question => question.lessonId === lesson.id);
  assert.equal(lesson.evidence.length, 1);
  assert.equal(course.questions.filter(question => question.lessonId === lesson.id).length, 1);
  const result = attach(freeze(reply));
  assert.deepEqual(result.practice, {
    id: question.id, prompt: question.q, options: question.answers, correctId: question.correct[0],
    explanation: question.explain, context: `${course.title} · ${lesson.title}`, href: original.links[0].href,
  });
  assert.equal(result.text, original.text);
  assert.deepEqual(result.links, [original.links[0], {
    label: "Lernkarten zur Lektion", href: "/lernen/lernkarten?kurs=wissen-vertiefung-hunde-nase-spur-laut&lektion=wissen-vertiefung-hunde-nase-spur-laut-ausatemrichtung",
  }, ...original.links.slice(1)]);
  const selectedCards = getFlashcards().filter(card => card.moduleId === course.id && card.lessonId === lesson.id);
  assert.ok(selectedCards.length > 0);
  assert.equal(getFlashcardLessonSummary(course.id).lessons[lesson.id], selectedCards.length);
  assert.deepEqual(reply, original);
  assert.equal(attach(result), result, "Repeated enrichment is idempotent");
});

test("Every current eligible sourced lesson keeps question/answer/source identity without changing the corpus", () => {
  const before = JSON.stringify(learningModules);
  let attached = 0;
  for (const course of learningModules) for (const lesson of course.lessons) for (const evidence of lesson.evidence || []) {
    if (!evidence.sources?.length) continue;
    const links = [...new Map(evidence.sources.map(source => [source.url, { label: source.label, href: new URL(source.url).href }])).values()];
    const reply = { kind: "lesson", text: evidence.claim, links: [
      { label: "Originallektion", href: `/kurse/${course.id}${lessonHash(lesson.id)}` }, ...links,
    ] };
    const result = attach(reply);
    if (!result.practice) continue;
    attached++;
    const original = course.questions.find(question => question.id === result.practice.id);
    assert.equal(lesson.evidence.length, 1, "Only a single source claim is eligible");
    assert.equal(course.questions.filter(question => question.lessonId === lesson.id).length, 1, "No first-question guessing in multipart lessons");
    assert.equal(original.lessonId, lesson.id);
    assert.equal(original.q, result.practice.prompt);
    assert.deepEqual(original.answers, result.practice.options);
    assert.deepEqual(original.correct, [result.practice.correctId]);
    assert.equal(original.explain, result.practice.explanation);
    assert.deepEqual(result.links.filter(link => !link.href.startsWith("/")), reply.links.slice(1));
    assert.equal(result.practice.href, reply.links[0].href);
  }
  assert.ok(attached > 0, "Real unambiguous one-evidence/one-question units are actually attached");
  assert.equal(JSON.stringify(learningModules), before);
});

test("Unconfident replies and noncanonical, missing, duplicate or unrelated lesson destinations stay unchanged", () => {
  const base = fixture();
  for (const input of [null, {}, { ...base.reply, kind: "clarify" }, { ...base.reply, kind: "fallback" },
    { ...base.reply, text: "Unrelated text." }, { ...base.reply, links: [] },
    ...["/kurse/wissen-chat-test", "/kurse/wissen-chat-test#lesson-zwei", "/kurse/wissen-chat-test#lesson-nope",
      "/kurse/wissen-chat-test#lesson-%65ins", "/kurse/wissen-chat-test?lektion=eins#lesson-eins",
      "https://jagdlatein.de/kurse/wissen-chat-test#lesson-eins", "/kurse/missing#lesson-eins",
      "/kurse/wissen-chat-test#lesson-eins#lesson-zwei"].map(href => ({ ...base.reply, links: [{ label: "Link", href }, ...base.reply.links.slice(1)] }))]) {
    assert.equal(base.attach(input), input);
  }
  const mismatched = clone(base.reply);
  mismatched.links[1].href = "https://different.invalid/unrelated";
  assert.equal(base.attach(mismatched), mismatched);
});

test("An exact lesson never borrows questions or card counts from a different lesson", () => {
  const f = fixture({ questions: [courseQuestion({ lessonId: "zwei" })], cards: { zwei: 7 } });
  assert.equal(f.attach(f.reply), f.reply);
  const cardsOnly = fixture({ questions: [], cards: { eins: 1, zwei: 7 } });
  const result = cardsOnly.attach(cardsOnly.reply);
  assert.equal(result.practice, undefined);
  assert.equal(result.links[1].href, "/lernen/lernkarten?kurs=wissen-chat-test&lektion=eins");
  const noCards = fixture({ cards: {} });
  assert.ok(noCards.attach(noCards.reply).practice);
  assert.deepEqual(noCards.attach(noCards.reply).links, noCards.reply.links);
});

test("Country-specific/safety course questions do not become general DACH chat practice", () => {
  for (const change of [{ countries: ["CH"] }, { topic: "Recht" }]) {
    const f = fixture({ questions: [courseQuestion(change)], cards: {} });
    assert.equal(f.attach(f.reply), f.reply);
  }
  for (const courseOverrides of [{ category: "Jagdrecht" }, { category: "Waffen & Sicherheit" }, { countries: ["CH"] }]) {
    const f = fixture({ courseOverrides });
    assert.equal(f.attach(f.reply), f.reply);
  }
});

test("Incomplete, duplicated, multiple-answer and oversized questions are skipped intact", () => {
  const valid = courseQuestion();
  for (const change of [
    { answers: valid.answers.slice(0, 3) }, { answers: [...valid.answers, { id: "e", text: "Fünf." }] },
    { answers: valid.answers.map(option => ({ ...option, id: "same" })) },
    { answers: valid.answers.map(option => ({ ...option, text: " gleiche Antwort " })) },
    { answers: valid.answers.map((option, index) => ({ ...option, text: index < 2 ? "gleich" : option.text })) },
    { answers: [valid.answers[0], valid.answers[1], valid.answers[2], { id: "b", text: " " }] },
    { correct: ["c", "d"] }, { correct: [] }, { correct: ["missing"] }, { q: "" }, { explain: "" },
    { q: "x".repeat(4001) }, { explain: "x".repeat(12001) }, { id: "unstable id" },
  ]) {
    const f = fixture({ questions: [courseQuestion(change)], cards: {} });
    assert.equal(f.attach(f.reply), f.reply, JSON.stringify(change).slice(0, 100));
  }
  const f = fixture({ questions: [courseQuestion({ correct: [] }), courseQuestion({ id: "valid-second" })], cards: {} });
  assert.equal(f.attach(f.reply), f.reply, "Multiple questions do not identify the question belonging to this claim");
});

test("Multipart evidence and multi-question lessons retain exact cards without guessing a claim exercise", () => {
  for (const question of ["Was bedeutet operante Konditionierung?", "Was ist Parasitismus?", "Wozu hat die Stockente Schnabellamellen?"]) {
    const reply = learningAnswer(question);
    assert.equal(reply.kind, "lesson", question);
    const before = clone(reply);
    const result = attach(reply);
    assert.equal(result.practice, undefined, question);
    assert.ok(result.links.some(link => link.label === "Lernkarten zur Lektion"), question);
    assert.equal(result.text, before.text);
    assert.deepEqual(result.links.filter(link => !link.href.startsWith("/")), before.links.slice(1));
    assert.deepEqual(reply, before);
  }
  const oneEvidenceManyQuestions = fixture({ questions: [courseQuestion(), courseQuestion({ id: "other-question" })] });
  assert.equal(oneEvidenceManyQuestions.attach(oneEvidenceManyQuestions.reply).practice, undefined);
  const multipleEvidenceOneQuestion = fixture();
  multipleEvidenceOneQuestion.course.lessons[0].evidence.push({ claim: "Anderes Thema derselben Lektion.", sources });
  assert.equal(multipleEvidenceOneQuestion.attach(multipleEvidenceOneQuestion.reply).practice, undefined);
});

test("Questions depending on an absent photo, diagram, recording or marked feature are omitted", () => {
  for (const q of [
    "Welche Tierart ist auf diesem Foto zu sehen?", "Welche Aussage trifft auf das Bild zu?",
    "Welche Struktur ist in der Abbildung dargestellt?", "Was zeigt die markierte Struktur?",
    "Welche Art ist zu hören?", "Welcher Ton wurde vorgespielt?", "Was sagt diese Tabelle aus?",
    "Wie unterscheidet sich die hervorgehobene Struktur?",
  ]) {
    const f = fixture({ questions: [courseQuestion({ q })], cards: {} });
    assert.equal(f.attach(f.reply), f.reply, q);
  }
  for (const required of [{ image: "/required.jpg" }, { audio: "/required.mp3" }, { requiredMedia: true }]) {
    const f = fixture({ questions: [courseQuestion(required)], cards: {} });
    assert.equal(f.attach(f.reply), f.reply);
  }
});

test("Full textual cases and optional lesson diagrams preserve all original context, options and limits", () => {
  const question = courseQuestion({ context: "Originaler vollständiger Fallkontext vor der Frage." });
  const f = fixture({ questions: [question] });
  f.course.lessons[0].diagram = { id: "optional-reading-illustration" };
  const result = f.attach(f.reply);
  assert.equal(result.practice.prompt, question.q);
  assert.deepEqual(result.practice.options, question.answers);
  assert.equal(result.practice.context, `Originalkurs · Erste Lektion\n\n${question.context}`);
  assert.equal(result.practice.explanation, question.explain);
});

test("Real unsupported optics/source-less destinations do not borrow a neighbouring course question", () => {
  const course = getLearningModule("wissen-optik");
  const question = course.questions.find(question => question.id === "wissen-optik-8");
  assert.match(question.q, /Das Bild/);
  const reply = {
    kind: "lesson", text: question.q,
    links: [{ label: course.title, href: `/kurse/${course.id}${lessonHash(question.lessonId)}` },
      ...course.sources.map(source => ({ label: source.label, href: source.url }))],
  };
  assert.equal(attach(reply), reply);
  const unresolved = learningAnswer("Was ist der Unterschied zwischen Reh und Rothirsch?");
  assert.equal(unresolved.kind, "clarify");
  assert.equal(attach(unresolved), unresolved);
});

test("A fully supplied real map case retains its number and wording without needing an absent graphic", () => {
  const course = getLearningModule("wissen-ausbau-anwendung-kartenprofile-2026");
  const lesson = course.lessons.find(lesson => lesson.id === "legende");
  const question = course.questions.find(question => /743/.test(question.q));
  assert.equal(question.lessonId, lesson.id);
  const f = fixture({
    questions: [{ ...question, lessonId: "eins" }], cards: {},
  });
  const result = f.attach(f.reply);
  assert.equal(result.practice.prompt, question.q);
  assert.deepEqual(result.practice.options, question.answers);
  assert.equal(result.practice.explanation, question.explain);
});

test("The current three-choice regional-law questions are not padded with invented fourth answers", () => {
  const before = ["CH", "DE", "AT"].map(country => JSON.stringify(getLegalDataset(country)));
  for (const [question, country, region] of [
    ["Welches Jagdsystem gilt in Zürich?", "CH", "ZH"],
    ["Welche Mindestgrösse hat ein Eigenjagdrevier in Bayern?", "DE", "BY"],
    ["Ab welchem Alter kommt die Jahresjagdkarte in Salzburg in Betracht?", "AT", "S"],
    ["Wo gilt mein Jagdschein bundesweit?", "DE", "BY"],
  ]) {
    const profile = { country, region };
    const reply = lawAnswer(question, profile);
    assert.ok(reply.law, question);
    assert.equal(attach(reply, profile), reply);
  }
  assert.deepEqual(["CH", "DE", "AT"].map(country => JSON.stringify(getLegalDataset(country))), before);
});

test("Existing original four-choice law fixtures retain the exact reviewed local article in all three countries", () => {
  for (const [country, region] of [["CH", "ZH"], ["DE", "BY"], ["AT", "S"]]) {
    const f = legalFixture({ country, region });
    const expected = buildRegionalLawBundle(f.dataset, region).questions.find(q => q.articleId === f.article.id);
    const before = clone(f.reply);
    const result = f.attach(freeze(f.reply), f.profile);
    assert.deepEqual(result.practice, {
      id: expected.id, prompt: expected.prompt, options: expected.options, correctId: expected.correctIds[0],
      explanation: expected.explanation, context: expected.context, href: before.links[0].href,
    });
    assert.deepEqual(result.links, before.links);
    assert.deepEqual(f.reply, before);
  }
});

test("Federal practice stays federal while retaining the explicitly chosen regional landing context", () => {
  const f = legalFixture({ country: "DE", region: "BY", federal: true });
  const result = f.attach(f.reply, f.profile);
  assert.ok(result.practice);
  assert.match(result.practice.context, /^Bundesrecht ·/);
  assert.equal(result.practice.href, "/jagdrecht/de?region=BY&thema=zulassung&artikel=original-artikel");
  assert.equal(f.attach(f.reply, { country: "DE", region: "BE" }), f.reply);
});

test("Stale, original-only, withheld, future and no-longer-effective legal articles cannot supply practice", () => {
  for (const articleOverrides of [
    { originalVerified: false }, { verified: false }, { reviewedOn: "2099-01-01" },
    { effectiveFrom: "2099-01-01" }, { effectiveUntil: "2020-01-01" },
    { sources: [{ title: "Gesetz", url: "https://law.invalid/original", publisher: "Einziger Herausgeber", kind: "law" }] },
  ]) {
    const f = legalFixture({ articleOverrides });
    assert.equal(f.attach(f.reply, f.profile), f.reply);
  }
});

test("A legal source, metadata or selection mismatch never borrows another article or region", () => {
  const f = legalFixture();
  for (const profile of [null, {}, { country: "DE", region: "BY" }, { country: "CH", region: "BE" }, { country: "CH", region: ["ZH"] }]) {
    assert.equal(f.attach(f.reply, profile), f.reply);
  }
  const changes = [
    reply => { reply.text += " Unbelegte zusätzliche Behauptung."; },
    reply => { delete reply.law; },
    reply => { reply.law.jurisdiction = "Kanton Bern · Schweiz"; },
    reply => { reply.law.reviewedOn = "2026-10-02"; },
    reply => { reply.law.citation = "§ 2"; },
    reply => { reply.law.lawTitle = "Anderes Gesetz"; },
    reply => { reply.links[1].href = "https://other.invalid/law"; },
    reply => { reply.links[0].href += "&region=BE"; },
    reply => { reply.links[0].href += "#original"; },
    reply => { reply.links[0].href = reply.links[0].href.replace("original-artikel", "fremder-artikel"); },
    reply => { reply.links[0].href = reply.links[0].href.replace("&bund=0", ""); },
  ];
  for (const change of changes) {
    const reply = clone(f.reply); change(reply);
    assert.equal(f.attach(reply, f.profile), reply, change.toString());
  }
});

test("An exact original legal-question answer can attach its article practice without shortening its boundaries", () => {
  const f = legalFixture();
  const q = f.article.questions[0];
  f.reply.text = `${q.choices[q.correctIndex]}\n\n${q.explanation}\n\n${f.article.summary}`;
  const result = f.attach(f.reply, f.profile);
  assert.ok(result.practice);
  assert.equal(result.text, f.reply.text);
  assert.equal(result.practice.explanation, q.explanation);
  assert.equal(f.attach({ ...f.reply, text: q.explanation }, f.profile).practice, undefined);
});
