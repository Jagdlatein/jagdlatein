import { animalSoundById } from "./animal-sounds";
import { dogBreeds } from "./dog-compass";
import { europeanWildlifeBySlug } from "./european-wildlife";
import { learningTools } from "./learning-tool-catalog";
import { learningCategoryDetails } from "./learning-categories";
import { learningModules } from "./learning-curriculum";
import { normalizeSearch, searchLearning } from "./learning-search";
import { chatPracticeBindings, chatTopicBindings } from "./jagdlatein-chat-bindings";

const filler = new Set(normalizeSearch(`
  ab am an auf aus bei beim bitte da dabei danke das dass dein dem den der des die dies dieser doch du durch
  ein eine einem einen einer eines erklär erkläre erklären erklärst erzähl erzähle erzählen es etwas für funktioniert funktionieren genau gern gerne gibt hallo hat haben hier ich im in
  ist kannst kenne kurz lernen macht man mein mir mit möchte nach noch nun oder passiert sage sag sich sie sind über um
  und uns unter vom von vor war warum was welche welchem welchen welcher welches wenn wer weshalb wie wieso wird wo woran
  wozu zeigt zu zum zur bedeutet beschreibe unterscheide unterscheiden unterscheidet unterschied vergleich vergleiche vergleichen zwischen wisst wissen entsteht finde finden suche suchen erkenne lesen offnen sehen anschauen zeig zeige zeigen machen passende passenden passendes mehr dazu zugehorig ansehen
`).match(/\w+/g));

const words = value => normalizeSearch(value).match(/[a-z0-9]+/g) || [];
const stem = word => word.length >= 6 ? word.replace(/(?:en|er|es|em|e|n|s)$/, "") : word;
const wordSet = value => new Set(words(value).map(stem));
const entityTerms = new Set([
  ...Object.values(europeanWildlifeBySlug), ...dogBreeds,
].flatMap(item => words([item.name, ...(item.aliases || [])].join(" "))).concat(["hund", "hunde"]).map(stem));

const legalTerms = /\b(?:jagdrecht\w*|jagdgesetz\w*|jagdschein\w*|jagdkarte\w*|jagdpatent\w*|jagdzeit\w*|schonzeit\w*|gesetz\w*|verordnung\w*|vorschrift\w*|erlaub\w*|verbot\w*|pflicht\w*|darf(?:st)?|durfen|zulassig\w*|rechtslage|rechtlich\w*|meldepflicht\w*|waffenrecht\w*|abschussplan\w*|paragraf\w*)\b/;

function sourceLinks(sources) {
  const links = new Map();
  for (const source of sources || []) {
    if (typeof source?.label !== "string" || !source.label.trim()) continue;
    try {
      const url = new URL(source.url);
      if (url.protocol === "https:" && !url.username && !url.password) {
        links.set(url.href, { label: source.label, href: url.href });
      }
    } catch { /* Only well-formed URLs from the lesson evidence are eligible. */ }
  }
  return [...links.values()];
}

// The evidence record is a sourced statement from the course. Matching against
// quiz answers or attributing unrelated paragraphs to its sources is avoided.
const evidenceIndex = learningModules
  .filter(course => course.countries.length === 3 && !["Jagdrecht", "Waffen & Sicherheit"].includes(course.category))
  .flatMap(course => {
    const courseWords = wordSet(`${course.title} ${course.category}${course.category === "Hundewesen" ? " Hund Hunde" : ""}`);
    return course.lessons.flatMap(lesson => {
      const lessonWords = wordSet(lesson.title);
      const introWords = wordSet(lesson.paragraphs?.[0]);
      const link = { label: `Lektion: ${lesson.title} · ${course.title}`, href: `/kurse/${course.id}#lesson-${encodeURIComponent(lesson.id)}` };
      return (lesson.evidence || []).flatMap(evidence => {
        const sources = sourceLinks(evidence.sources);
        if (typeof evidence.claim !== "string" || !evidence.claim.trim() || sources.length < 2 ||
            (legalTerms.test(normalizeSearch(evidence.claim)) || evidence.claim.includes("§"))) return [];
        return [{ link, lessonWords, introWords, courseWords, dogCourse: course.category === "Hundewesen", claimWords: wordSet(evidence.claim), text: evidence.claim, sources }];
      });
    });
  });

const isComparison = value => /\b(?:vergleich\w*|unterschied\w*|unterscheid\w*)\b/.test(normalizeSearch(value));

const topicBindings = [...chatTopicBindings, ...chatPracticeBindings.map(binding => ({
  ...binding, href: `/kurse/${binding.courseId}#lesson-${encodeURIComponent(binding.lessonId)}`, direct: true,
}))];

function boundTopicAnswer(terms) {
  if (!terms.length) return null;
  const bindings = topicBindings.filter(binding => binding.aliases.some(alias => {
    const expected = wordSet(searchableWords(alias).join(" "));
    return terms.length === expected.size && terms.every(term => expected.has(term));
  }));
  if (bindings.length !== 1) return null;
  const binding = bindings[0];
  const matches = evidenceIndex.filter(item => item.link.href === binding.href && item.text === binding.claim &&
    JSON.stringify(item.sources.map(source => source.href)) === JSON.stringify(binding.sourceUrls));
  if (matches.length !== 1) return null;
  const item = matches[0];
  return binding.direct ? { kind: "lesson", text: item.text, links: [item.link, ...item.sources] } :
    { kind: "clarify", text: "Hier findest du die passende Erklärung in der Lektion.", links: [item.link] };
}

function rankEvidence(question, terms) {
  const comparison = isComparison(question);
  const matches = new Map();
  // An animal name alone does not identify which fact the learner is asking for.
  if (terms.every(term => entityTerms.has(term))) return [];
  if (terms.length && terms.length <= 10) {
    for (const item of evidenceIndex) {
      if (comparison && (terms.length < 2 || !terms.every(term => item.claimWords.has(term)))) continue;
      if (!terms.every(term => item.lessonWords.has(term) || item.claimWords.has(term) || item.introWords.has(term) || (item.dogCourse && term === "hund"))) continue;
      if (!terms.some(term => item.lessonWords.has(term) ||
          (term.length >= 5 && item.claimWords.has(term) && item.introWords.has(term)))) continue;
      const weights = terms.map(term => 6 * Number(item.lessonWords.has(term)) + 5 * Number(item.claimWords.has(term)) +
        2 * Number(item.introWords.has(term)) + Number(item.courseWords.has(term)));
      if (weights.some(weight => !weight)) continue;
      const score = weights.reduce((total, weight) => total + weight, 0);
      const previous = matches.get(item.link.href);
      if (!previous || score > previous.score) matches.set(item.link.href, { ...item, score });
    }
  }
  const ranked = [...matches.values()].sort((a, b) => b.score - a.score);
  return ranked;
}


const formats = [
  { words: /^(?:(?:lern|jagd|wildtier|hunde)?videos?|filme?)$/, query: "video", route: /\/lernen\/[\w-]*video/, catalog: { label: "Lernvideos", href: "/lernen/videos" } },
  { words: /^(?:tierstimmen?|stimmen?|rufe?|laute?|anhore[ns]?|hore[ns]?|hort|klingt)$/, query: "tierstimme", route: /^\/lernen\/tierstimmen(?:[?#]|$)/, catalog: { label: "Tierstimmen", href: "/lernen/tierstimmen" } },
  { words: /^(?:simulator(?:en)?|(?:praxis)?ubung(?:en)?)$/, type: "practice", catalog: { label: "Praxisübungen", href: "/jagdpraxis" } },
  { words: /^(?:kurse?|lektion(?:en)?)$/, type: "course", catalog: { label: "Kursverzeichnis", href: "/kurse" } },
];

const specialTopics = new Map([
  [normalizeSearch("Wiederkäuerverdauung"), "Wiederkäuer Verdauung"],
  ["schwarzwildverdauung", "Schwarzwild Verdauung"],
  ["karteikarte", "Lernkarten"],
  ["karteikarten", "Lernkarten"],
  ["flashcards", "Lernkarten"],
]);

const flashcardTool = learningTools.find(item => item.href === "/lernen/lernkarten");
const searchableCategory = category => !["jagdrecht", "waffen-sicherheit"].includes(category);
const signature = value => words(value).join(" ");

function relevantLink(item) {
  if (typeof item.href !== "string" || !/^\/(?![\/\\])/.test(item.href) || /[\\\u0000-\u001f]/.test(item.href)) return false;
  const path = item.href.split(/[?#]/, 1)[0];
  return !/^(?:\/jagdrecht(?:\/|$)|\/lernen\/(?:jagdrecht|waffen-sicherheit)(?:\/|$))/.test(path) &&
    path !== "/lernen/jagdlatein-chat" && (!item.categories.length || item.categories.some(searchableCategory));
}

function entityAliases({ id }) {
  const [type, slug] = id.split(":");
  if (type === "species") return europeanWildlifeBySlug[slug]?.aliases || [];
  if (type === "breed") return dogBreeds.find(item => item.id === slug)?.aliases || [];
  if (type === "sound") return [animalSoundById[slug]?.speciesSlug].filter(Boolean);
  return [];
}

const headingContains = (heading, term) => heading.some(word => word === term || term.length >= 4 && word.startsWith(term));

function learningLinks(topicWords, format) {
  if (!topicWords.length) return format ? [format.catalog] : [];
  const terms = words(topicWords.join(" ")).map(stem);
  const query = [...terms, ...(format?.query ? [format.query] : [])].join(" ");
  const { results, suggestion } = searchLearning({ query, type: format?.type || "all" });
  // A proposed spelling correction can lead to another species or term.
  if (suggestion) return [];
  const topic = signature(topicWords.join(" "));
  const candidates = results.flatMap(item => {
    if (!relevantLink(item) || (format?.route && !format.route.test(item.href))) return [];
    const labels = [item.title, item.lessonTitle, ...entityAliases(item)].filter(Boolean);
    const heading = [...wordSet(labels.join(" "))];
    const exact = labels.some(label => signature(label) === topic);
    if (terms.every(term => headingContains(heading, term))) return [{ item, exact }];
    if (item.type !== "entry" && item.type !== "course") return [];
    // A direct selection URL can supply a subject omitted from the short title.
    const selection = [...heading, ...wordSet(item.href)];
    if (terms.every(term => headingContains(selection, term))) return [{ item, exact }];
    // Titles and selection URLs keep lookalike recordings from being mixed
    // merely because their descriptions mention another species.
    if ((format && format.type !== "course") || !terms.some(term => headingContains(heading, term))) return [];
    const excerpt = [...selection, ...wordSet(item.description)];
    return terms.every(term => headingContains(excerpt, term)) ? [{ item, exact }] : [];
  });
  return candidates.sort((left, right) => Number(right.exact) - Number(left.exact))
    .map(({ item }) => ({ label: item.lessonTitle || item.title, href: item.href }));
}

function categoryLink(topicWords) {
  const isCards = topicWords.some(word => normalizeSearch(word) === "lernkarten");
  const categoryTitle = signature(topicWords.filter(word => normalizeSearch(word) !== "lernkarten").join(" "));
  const category = learningCategoryDetails.find(item => searchableCategory(item.slug) && signature(item.title) === categoryTitle);
  if (!category) return null;
  if (!isCards) return { label: category.title, href: "/lernen/" + category.slug };
  if (flashcardTool?.categories.includes(category.slug)) {
    return { label: "Lernkarten · " + category.title, href: flashcardTool.href + "?kategorie=" + category.slug };
  }
  return null;
}

function distinctLinks(links) {
  return [...new Map(links.map(link => [link.href, link])).values()].slice(0, 3);
}

function searchableWords(value, requestedFormats = []) {
  return (String(value || "").match(/[\p{L}\p{N}]+/gu) || []).filter(word => {
    const normalized = normalizeSearch(word);
    return normalized.length >= 3 && !filler.has(normalized) && !requestedFormats.some(format => format.words.test(normalized));
  }).flatMap(word => (specialTopics.get(normalizeSearch(word)) || word).split(" "));
}

function compareSpecies(question) {
  const parts = question.split(/\b(?:und|gegen|vs)\b/iu).map(part => searchableWords(part).join(" "));
  if (parts.length < 2 || parts.length > 3 || parts.some(part => !part)) return [];
  const portraits = parts.map(part => {
    const { results, suggestion } = searchLearning({ query: part, type: "species" });
    if (suggestion) return null;
    const exact = results.filter(item => [item.title, ...entityAliases(item)].some(label => signature(label) === signature(part)));
    return exact.length === 1 ? { label: exact[0].title, href: exact[0].href.split("#", 1)[0] } : null;
  });
  return portraits.every(Boolean) && new Set(portraits.map(item => item.href)).size === portraits.length ? portraits : [];
}

export function answerJagdlateinLearningQuestion(question) {
  const wordsInQuestion = String(question || "").match(/[\p{L}\p{N}]+/gu) || [];
  const requestedFormats = formats.filter(format => wordsInQuestion.some(word => format.words.test(normalizeSearch(word))));
  const topicWords = searchableWords(question, requestedFormats);
  const topic = signature(topicWords.join(" "));
  const terms = [...new Set(words(topicWords.join(" ")).map(stem))];
  // Keyword matches cannot decide whether a negated statement is being
  // confirmed or corrected. Keep such requests on the learning-link path.
  const canAnswer = requestedFormats.every(format => format.type === "course") &&
    !/\b(?:nicht|kein(?:s|e[rmns]?)?|keinerlei|ohne|nie|niemals|weder)\b/.test(normalizeSearch(question));
  const bound = canAnswer ? boundTopicAnswer(terms) : null;
  if (bound) return bound;
  const ranked = canAnswer ? rankEvidence(question, terms) : [];
  const [best, next] = ranked;
  if (best && (!next || best.score >= next.score + 3)) {
    return { kind: "lesson", text: best.text, links: [best.link, ...best.sources] };
  }

  const category = requestedFormats.length ? null : categoryLink(topicWords);
  if (category) {
    return { kind: "clarify", text: "Hier findest du die passende Auswahl.", links: [category] };
  }

  if (topicWords.length <= 10 && !["wild", "tier", "tiere"].includes(topic)) {
    const choices = requestedFormats.length ? requestedFormats.flatMap(format => learningLinks(topicWords, format)) : learningLinks(topicWords);
    // On ambiguous questions keep exact destinations such as the glossary
    // ahead of the competing evidence passages.
    const exact = link => signature(link.label) === topic;
    const learning = best ? [...choices.filter(exact), ...ranked.map(item => item.link), ...choices] : choices;
    const portraits = !requestedFormats.length && isComparison(question) ? compareSpecies(question) : [];
    const links = distinctLinks(portraits.length ? [...learning.slice(0, 1), ...portraits] : learning);
    if (links.length) {
      return {
        kind: "clarify",
        text: requestedFormats.length ? "Hier findest du passende Lernangebote zu deiner Frage." :
          "Ich finde keine eindeutig passende belegte Antwort. Diese Lerninhalte können dir beim Eingrenzen helfen.",
        links,
      };
    }
  }

  return {
    kind: "clarify",
    text: "Ich finde keine eindeutig passende belegte Stelle. Frag nach einem konkreten Fachbegriff oder nenne die Wildart und das Thema.",
    links: [{ label: "Zum Lernbereich", href: "/lernen" }],
  };
}
