import { learningModules } from "./learning-curriculum";
import { learningCategoryDetails, getLearningCategoryByTitle } from "./learning-categories";
import { lessonHash } from "./learning-lesson-navigation";
import { wildlifePhotographs } from "./wildlife-photographs";
import { matchesFlashcardSelection } from "./flashcard-selection";
import { getLessonReviewDate, isLearningReviewDate } from "./learning-review-date";

// Import this adapter in getStaticProps/server code only. The client receives the
// selected cards, not the complete curriculum, wrong options or quiz answer keys.
// Existing editorial dates and wording are inherited; this is not a new review.
const STARTER_QUESTIONS_PER_CATEGORY = 10;
const PHOTO_SLUGS = ["rotwild", "gamswild", "schwarzwild", "steinwild", "damwild", "fuchs"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function usableSource(source) {
  return source && typeof source.label === "string" && source.label.trim()
    && typeof source.url === "string" && /^https:\/\//.test(source.url);
}

function lessonSources(module, lesson) {
  const evidenceSources = (lesson.evidence || []).flatMap(item => item.sources || []);
  const actual = evidenceSources.length ? evidenceSources : module.sources.filter(source => !source.lessonIds || source.lessonIds.includes(lesson.id));
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
    if (!category || category.slug === "jagdrecht") return [];
    return module.questions.flatMap((question, questionIndex) => {
      if (question.topic === "Recht" || question.countries.length !== 3 || !standsAlone(question)) return [];
      const lesson = module.lessons.find(item => item.id === question.lessonId);
      const correct = question.answers.filter(answer => question.correct.includes(answer.id));
      if (!lesson || correct.length !== 1 || !correct[0].text || !question.explain) return [];
      const reviewedOn = getLessonReviewDate(lesson, module.reviewedOn);
      if (!reviewedOn) return [];
      const { sources, sourceScope } = lessonSources(module, lesson);
      if (sources.length < 2) return [];
      const href = `/kurse/${module.id}${lessonHash(lesson.id)}`;
      return [{
        card: {
          id: `flash-${question.id}`, categoryId: category.slug, categoryTitle: category.title,
          moduleId: module.id, moduleTitle: module.title, lessonId: lesson.id,
          context: module.title, lessonTitle: lesson.title,
          question: question.q, answer: correct[0].text, explanation: question.explain,
          sources, sourceScope, reviewedOn,
          courseHref: href, learningHref: href,
        },
        priority: sourceScope === "lesson" ? 0 : module.sourceReview ? 1 : 2,
        reviewedOn, starterReviewedOn: isLearningReviewDate(module.reviewedOn) ? module.reviewedOn : reviewedOn,
        moduleIndex, questionIndex, expanded: module.flashcardExpansion === true || lesson.flashcardExpansion === true,
      }];
    });
  });

  return learningCategoryDetails.filter(category => category.slug !== "jagdrecht").flatMap(category => {
    const available = candidates.filter(item => item.card.categoryId === category.slug).sort((a, b) =>
      a.priority - b.priority || b.reviewedOn.localeCompare(a.reviewedOn)
      || a.moduleIndex - b.moduleIndex || a.questionIndex - b.questionIndex);
    // Preserve the published starter IDs/order on their original course-date
    // selection basis. Expanded cards use the actual lesson date above; a later
    // narrow review must not silently replace somebody's saved starter cards.
    const starterAvailable = available.filter(item => !item.expanded).sort((a, b) =>
      a.priority - b.priority || b.starterReviewedOn.localeCompare(a.starterReviewedOn)
      || a.moduleIndex - b.moduleIndex || a.questionIndex - b.questionIndex);
    const selected = [], moduleCounts = new Map(), lessonCounts = new Map(), ids = new Set();
    function include(item) {
      selected.push(item.card); ids.add(item.card.id);
      moduleCounts.set(item.card.moduleId, (moduleCounts.get(item.card.moduleId) || 0) + 1);
      const key = `${item.card.moduleId}/${item.card.lessonId}`;
      lessonCounts.set(key, (lessonCounts.get(key) || 0) + 1);
    }
    // Balance lessons and courses before filling any remaining category places.
    for (const item of starterAvailable) {
      if (selected.length === STARTER_QUESTIONS_PER_CATEGORY) break;
      const key = `${item.card.moduleId}/${item.card.lessonId}`;
      if ((moduleCounts.get(item.card.moduleId) || 0) >= 4 || (lessonCounts.get(key) || 0) >= 2) continue;
      include(item);
    }
    for (const item of starterAvailable) {
      if (selected.length === STARTER_QUESTIONS_PER_CATEGORY) break;
      if (!ids.has(item.card.id)) include(item);
    }
    if (selected.length !== STARTER_QUESTIONS_PER_CATEGORY) throw new Error(`Zu wenige eigenständig verständliche Lernkarten: ${category.slug}`);
    // Retain the original starter selection. Expand only from lessons carrying
    // claim-level evidence or a documented independent source review; inherit
    // their editorial scope/date without claiming a fresh whole-app review.
    // A quiz can correctly ask for a false inference. Such options belong in
    // the explained quiz, not as a flashcard's affirmative answer headline.
    const extras = available.filter(item => !ids.has(item.card.id) && item.priority < 2
      && !/(?:^|[^\p{L}])(?:nicht|unzulässig|überschreitet)(?=$|[^\p{L}])/iu.test(item.card.question)).map(item => item.card);
    return { starter: selected, extras };
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

const questionSets = questionCards();
const starter = [...photoCards(), ...questionSets.flatMap(item => item.starter)];
const seenQuestions = new Set(starter.filter(card => card.kind !== "photo").map(card => `${card.question.trim().toLowerCase()}\n${card.answer.trim().toLowerCase()}`));
const extraCards = questionSets.flatMap(item => item.extras).filter(card => {
  const key = `${card.question.trim().toLowerCase()}\n${card.answer.trim().toLowerCase()}`;
  if (seenQuestions.has(key)) return false;
  seenQuestions.add(key);
  return true;
});
const cards = [...starter, ...extraCards];
if (new Set(cards.map(card => card.id)).size !== cards.length) throw new Error("Doppelte Lernkarten-ID");

export const flashcardCategories = learningCategoryDetails.flatMap(category => {
  const count = cards.filter(card => card.categoryId === category.slug).length;
  return count ? [{ id: category.slug, title: category.title, count }] : [];
});

export function getFlashcards() { return cards; }

export function getFlashcardLessonSummary(courseId) {
  const selected = cards.filter(card => card.moduleId === courseId);
  const lessons = {};
  for (const card of selected) lessons[card.lessonId] = (lessons[card.lessonId] || 0) + 1;
  return { total: selected.length, lessons };
}

export function getFlashcardExport(selection = null) {
  const selected = selection ? cards.filter(card => matchesFlashcardSelection(card, selection)) : cards;
  const module = selection && learningModules.find(item => item.id === selection.courseId);
  const lesson = module?.lessons.find(item => item.id === selection.lessonId);
  const scope = selection ? {
    courseId: selection.courseId || "", lessonId: selection.lessonId || "",
    invalid: Boolean(selection.invalid || !module || selection.lessonId && !lesson),
    title: module?.title || "Lernkartenauswahl nicht gefunden",
    lessonTitle: lesson?.title || "",
    returnHref: module ? `/kurse/${module.id}${lesson ? lessonHash(lesson.id) : ""}` : "",
  } : null;
  return {
    version: 1, title: "Jagdlatein Lernkarten", cards: scope?.invalid ? [] : selected,
    categories: selection ? flashcardCategories.map(category => ({ ...category, count: selected.filter(card => card.categoryId === category.id).length })).filter(category => category.count) : flashcardCategories,
    ...(scope ? { selection: scope } : {}),
    sourceNote: "Fragen, richtige Antworten und Erklärungen aus bestehenden Lerneinheiten; Nachweise und Prüfdaten übernommen. Fotokarten fragen nur nach dem dokumentierten Motiv.",
  };
}
