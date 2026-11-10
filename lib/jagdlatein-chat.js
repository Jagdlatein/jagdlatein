import { examCountries, examProfileLawHref, getExamProfileDetails } from "./exam-profile";
import { learningModules } from "./learning-curriculum";
import { normalizeSearch, searchLearning } from "./learning-search";

const filler = new Set(normalizeSearch(`
  ab am an auf aus bei beim bitte da dabei danke das dass dein dem den der des die dies dieser doch du durch
  ein eine einem einen einer eines erkläre erklären erklärst es etwas für funktioniert genau gern gerne gibt hallo hat haben hier ich im in
  ist kannst kenne kurz lernen macht man mein mir mit möchte nach noch nun oder passiert sage sag sich sie sind über um
  und uns unter vom von vor war warum was welche welchem welchen welcher welches wenn wer weshalb wie wieso wird wo woran
  wozu zeigt zu zum zur bedeutet beschreibe unterscheidet unterschied zwischen wisst wissen entsteht finde erkenne
`).match(/\w+/g));

const words = value => normalizeSearch(value).match(/[a-z0-9]+/g) || [];
const stem = word => word.length >= 6 ? word.replace(/(?:en|er|es|em|e|n|s)$/, "") : word;
const wordSet = value => new Set(words(value).map(stem));

const legalTerms = /\b(?:jagdrecht\w*|jagdgesetz\w*|jagdschein\w*|jagdkarte\w*|jagdpatent\w*|jagdzeit\w*|schonzeit\w*|gesetz\w*|verordnung\w*|vorschrift\w*|erlaub\w*|verbot\w*|pflicht\w*|darf(?:st)?|durfen|zulassig\w*|rechtslage|rechtlich\w*|meldepflicht\w*|waffenrecht\w*|abschussplan\w*|paragraf\w*)\b/;
const safetyTerms = /\b(?:waffe\w*|gewehr\w*|repetier\w*|munition\w*|abzug\w*|schuss\w*|kugelfang\w*|schiess\w*|geschoss\w*|fallenfang\w*|erleg\w*|toten|totet|totung\w*|laser\w*)\b/;
const healthTerms = /\b(?:krank\w*|erkrankt\w*|verletz\w*|behandlung\w*|behandeln|medikament\w*|dosier\w*|symptom\w*|diagnos\w*|therap\w*|impf\w*|vergift\w*|verdorben\w*|trichin\w*|tierarzt\w*)\b/;
const foodQuestion = /\b(?:essen|verzehr\w*|verkauf\w*|abgeben|einfrieren|aufbewahr\w*|entsorg\w*|uberpruf\w*)\b/;
const foodSubject = /\b(?:wildbret\w*|fleisch\w*|wildfleisch\w*)\b/;
const regionNames = examCountries.flatMap(country => [
  { name: words(country.name).join(" "), code: country.code, country: country.code },
  ...country.regions.map(region => ({ name: words(region.name).join(" "), code: region.code, country: country.code, region: region.code })),
]);

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
            legalTerms.test(normalizeSearch(evidence.claim))) return [];
        return [{ link, lessonWords, introWords, courseWords, claimWords: wordSet(evidence.claim), text: evidence.claim, sources }];
      });
    });
  });

const guidance = (text, label, href) => ({ kind: "clarify", text, links: [{ label, href }] });

function legalGuidance(question, profile) {
  const details = getExamProfileDetails(profile);
  // A named jurisdiction in the question must agree with the selected one.
  // Shared names (e.g. Freiburg) are accepted only if one matches the profile.
  const normalized = ` ${words(question).join(" ")} `;
  const codes = question.match(/(?<![\p{L}\p{N}])[A-Z]{2,3}(?![\p{L}\p{N}])/gu) || [];
  const matchesProfile = item => item.country === profile?.country && (!item.region || item.region === profile?.region);
  const names = regionNames.filter(item => normalized.includes(` ${item.name} `));
  const conflicting = names.some(item => !names.some(other => other.name === item.name && matchesProfile(other))) ||
    codes.some(code => regionNames.some(item => item.code === code) && !regionNames.some(item => item.code === code && matchesProfile(item)));
  return {
    kind: "region",
    text: details && !conflicting
      ? `Im Jagdrecht findest du die amtlichen Fundstellen für deine Prüfungsregion ${details.region.name} (${details.country.name}). Prüfe dort, welche Regel für den konkreten Fall gilt.`
      : "Öffne das Jagdrecht und wähle das Land und den zuständigen Kanton oder das Bundesland für deine Frage. Dort findest du die amtlichen Fundstellen.",
    links: [{ label: details && !conflicting ? `Jagdrecht: ${details.region.name}` : "Prüfungsregion wählen", href: examProfileLawHref(conflicting ? null : profile) }],
  };
}

export function answerJagdlateinQuestion(question, profile) {
  const normalized = normalizeSearch(question);
  if (healthTerms.test(normalized) || foodSubject.test(normalized) && foodQuestion.test(normalized)) {
    return guidance("Für konkrete Gesundheits- oder Verzehrfragen brauchst du eine fachkundige Beurteilung. Hier findest du den Lernstoff zu Hygiene und Tiergesundheit.", "Wildbret & Gesundheit", "/lernen/wildbret-gesundheit");
  }
  if (legalTerms.test(normalized) || normalized.includes("§")) return legalGuidance(question, profile);
  if (safetyTerms.test(normalized)) {
    return guidance("Für Handhabung und Sicherheit findest du die Grundlagen im entsprechenden Lernbereich. Konkrete Handgriffe übst du mit einer qualifizierten Anleitung.", "Waffen & Sicherheit", "/lernen/waffen-sicherheit");
  }

  const topicWords = words(question).filter(word => word.length >= 3 && !filler.has(word));
  const terms = [...new Set(topicWords.map(stem))];
  const comparison = /\b(?:vergleich\w*|unterschied\w*|unterscheid\w*)\b/.test(normalized);
  const matches = new Map();
  if (terms.length && terms.length <= 10) {
    for (const item of evidenceIndex) {
      if (comparison && (terms.length < 2 || !terms.every(term => item.claimWords.has(term)))) continue;
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
  const [best, next] = ranked;
  if (best && (!next || best.score >= next.score + 3)) {
    return { kind: "lesson", text: best.text, links: [best.link, ...best.sources] };
  }
  if (topicWords.length && topicWords.length <= 5) {
    const { results, suggestion } = searchLearning({ query: topicWords.join(" ") });
    const exactTitle = item => normalizeSearch(item.title) === topicWords.join(" ");
    const links = results.filter(item => {
      if (!["course", "species", "glossary"].includes(item.type) ||
          item.categories.some(category => category === "jagdrecht" || category === "waffen-sicherheit") ||
          (best && !exactTitle(item))) return false;
      // A mention in a different species' body text is not a useful link.
      const titleWords = wordSet(`${item.title} ${item.lessonTitle || ""}`);
      return terms.every(term => titleWords.has(term));
    }).sort((left, right) => Number(exactTitle(right)) - Number(exactTitle(left)))
      .slice(0, 3).map(item => ({ label: item.lessonTitle || item.title, href: item.href }));
    if (!suggestion && links.length) {
      return { kind: "clarify", text: "Ich finde keine eindeutig passende belegte Antwort. Diese Lerninhalte können dir beim Eingrenzen helfen.", links };
    }
  }
  if (best) {
    return { kind: "clarify", text: "Dazu passen mehrere Lektionen. Welche Wildart, welcher Fachbegriff oder welcher Teil des Themas interessiert dich?", links: ranked.slice(0, 3).map(item => item.link) };
  }
  return guidance("Ich finde keine eindeutig passende belegte Stelle. Frag nach einem konkreten Fachbegriff oder nenne die Wildart und das Thema.", "Zum Lernbereich", "/lernen");
}
