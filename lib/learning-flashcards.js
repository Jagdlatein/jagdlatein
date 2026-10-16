import { learningModules } from "./learning-curriculum";
import { learningCategoryDetails, getLearningCategoryByTitle } from "./learning-categories";
import { lessonHash } from "./learning-lesson-navigation";
import { wildlifePhotographs } from "./wildlife-photographs";

// Import this adapter in getStaticProps/server code only. The client receives the
// selected cards, not the complete curriculum, wrong options or quiz answer keys.
// Existing editorial dates and wording are inherited; this is not a new review.
const QUESTIONS_PER_CATEGORY = 10;
const PHOTO_SLUGS = ["rotwild", "gamswild", "schwarzwild", "steinwild", "damwild", "fuchs"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function usableSource(source) {
  return source && typeof source.label === "string" && source.label.trim()
    && typeof source.url === "string" && /^https:\/\//.test(source.url);
}

function lessonSources(module, lesson) {
  const evidenceSources = (lesson.evidence || []).flatMap(item => item.sources || []);
  const actual = evidenceSources.length ? evidenceSources : module.sources;
  const sources = [...new Map(actual.filter(usableSource).map(source => [source.url, {
    label: source.label, url: source.url,
  }])).values()];
  return { sources, sourceScope: evidenceSources.length ? "lesson" : "course" };
}

function standsAlone(question) {
  // These stems ask the learner to choose among absent options. Preserve useful
  // concrete recall/case questions instead of inventing a rewritten question.
  if (/^Welche (?:Aussage|Beschreibung|Formulierung|Notiz|Zuordnung|Antwort|Ergänzung|Folge)\b/i.test(question.q)) return false;
  // A correct quiz option can itself be a false statement when the prompt asks
  // for an error. Do not promote that option to a flashcard's answer headline.
  if (/\b(?:falsch|unzutreffend|unbelegt|zu weitgehend|nicht bewirken|nicht belegt|allein nicht schließen|allein noch nicht sicher)\b/i.test(question.q)) return false;
  if (/\b(?:oben|unten|vorstehend|nachfolgend|Antwort [ABCD]|Option [ABCD])\b/i.test(question.q)) return false;
  if (/\b(?:dieses|diese[mr]?) (?:Foto|Bild|Abbildung|Skizze|Tabelle)\b/i.test(question.q)) return false;
  // Keep original explanations intact. If they compare omitted multiple-choice
  // options, omit the whole card and select another existing question instead.
  if (/\b(?:die\s+(?:(?:zwei|drei|vier)\s+)?(?:anderen|übrigen)\b|(?:erste|zweite|dritte|vierte|erstgenannte|letztgenannte)\s+(?:Antwort|Option)|(?:Antwort|Option)\s+[A-D]\b)/i.test(question.explain)) return false;
  return question.q.length >= 28 && question.q.length <= 320;
}

function questionCards() {
  const candidates = learningModules.flatMap((module, moduleIndex) => {
    const category = getLearningCategoryByTitle(module.category);
    if (!category || category.slug === "jagdrecht" || !DATE.test(module.reviewedOn)) return [];
    return module.questions.flatMap((question, questionIndex) => {
      if (question.topic === "Recht" || question.countries.length !== 3 || !standsAlone(question)) return [];
      const lesson = module.lessons.find(item => item.id === question.lessonId);
      const correct = question.answers.filter(answer => question.correct.includes(answer.id));
      if (!lesson || correct.length !== 1 || !correct[0].text || !question.explain) return [];
      const { sources, sourceScope } = lessonSources(module, lesson);
      if (sources.length < 2) return [];
      const href = `/kurse/${module.id}${lessonHash(lesson.id)}`;
      return [{
        card: {
          id: `flash-${question.id}`, categoryId: category.slug, categoryTitle: category.title,
          moduleId: module.id, moduleTitle: module.title, lessonId: lesson.id,
          context: module.title, lessonTitle: lesson.title,
          question: question.q, answer: correct[0].text, explanation: question.explain,
          sources, sourceScope, reviewedOn: module.reviewedOn,
          courseHref: href, learningHref: href,
        },
        priority: sourceScope === "lesson" ? 0 : module.sourceReview ? 1 : 2,
        reviewedOn: module.reviewedOn, moduleIndex, questionIndex,
      }];
    });
  });

  return learningCategoryDetails.filter(category => category.slug !== "jagdrecht").flatMap(category => {
    const available = candidates.filter(item => item.card.categoryId === category.slug).sort((a, b) =>
      a.priority - b.priority || b.reviewedOn.localeCompare(a.reviewedOn)
      || a.moduleIndex - b.moduleIndex || a.questionIndex - b.questionIndex);
    const selected = [], moduleCounts = new Map(), lessonCounts = new Map(), ids = new Set();
    function include(item) {
      selected.push(item.card); ids.add(item.card.id);
      moduleCounts.set(item.card.moduleId, (moduleCounts.get(item.card.moduleId) || 0) + 1);
      const key = `${item.card.moduleId}/${item.card.lessonId}`;
      lessonCounts.set(key, (lessonCounts.get(key) || 0) + 1);
    }
    // Balance lessons and courses before filling any remaining category places.
    for (const item of available) {
      if (selected.length === QUESTIONS_PER_CATEGORY) break;
      const key = `${item.card.moduleId}/${item.card.lessonId}`;
      if ((moduleCounts.get(item.card.moduleId) || 0) >= 4 || (lessonCounts.get(key) || 0) >= 2) continue;
      include(item);
    }
    for (const item of available) {
      if (selected.length === QUESTIONS_PER_CATEGORY) break;
      if (!ids.has(item.card.id)) include(item);
    }
    if (selected.length !== QUESTIONS_PER_CATEGORY) throw new Error(`Zu wenige eigenständig verständliche Lernkarten: ${category.slug}`);
    return selected;
  });
}

function photoCards() {
  return PHOTO_SLUGS.map(slug => {
    const photo = wildlifePhotographs[slug];
    if (!photo || photo.aiGenerated !== false || !DATE.test(photo.checkedAt)
      || !photo.credit || !photo.creditUrl || !photo.sourcePage || !photo.author
      || !/^CC BY-SA (?:2\.0|2\.5|3\.0|4\.0)$/.test(photo.license)) {
      throw new Error(`Unvollständiger Fotomotivnachweis für Lernkarte: ${slug}`);
    }
    const href = `/wildkunde/${slug}`;
    return {
      id: `flash-photo-${slug}`, kind: "photo", categoryId: "wildkunde", categoryTitle: "Wildkunde",
      moduleId: `art-${slug}`, moduleTitle: "Wildarten erkennen", lessonId: "fotobestimmung",
      context: "Wildarten erkennen", lessonTitle: "Fotobestimmung",
      question: "Welche Wildart zeigt dieses Foto?", answer: photo.name,
      explanation: "Die Artzuordnung stammt aus dem bestehenden Motivnachweis des Wildartenatlas.",
      reviewedOn: photo.checkedAt, sourceScope: "photo", courseHref: href, learningHref: href,
      sources: [
        { label: "Fotografischer Motivnachweis", url: photo.sourcePage },
        { label: "Bestehendes Artenporträt", url: `https://jagdlatein.de${href}` },
      ],
      image: {
        src: photo.src, width: photo.width, height: photo.height, author: photo.author,
        credit: photo.credit, creditUrl: photo.creditUrl, license: photo.license, licenseUrl: photo.licenseUrl,
        alt: "Tierfoto für diese Bestimmungskarte", modifications: photo.modifications,
      },
    };
  });
}

const cards = [...photoCards(), ...questionCards()];
if (new Set(cards.map(card => card.id)).size !== cards.length) throw new Error("Doppelte Lernkarten-ID");

export const flashcardCategories = learningCategoryDetails.flatMap(category => {
  const count = cards.filter(card => card.categoryId === category.slug).length;
  return count ? [{ id: category.slug, title: category.title, count }] : [];
});

export function getFlashcards() { return cards; }

export function getFlashcardExport() {
  return {
    version: 1, title: "Jagdlatein Lernkarten", cards, categories: flashcardCategories,
    sourceNote: "Fragen, richtige Antworten und Erklärungen aus bestehenden Lerneinheiten; Nachweise und Prüfdaten übernommen. Fotokarten fragen nur nach dem dokumentierten Motiv.",
  };
}
