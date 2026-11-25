import { getDailyReviewPool } from "./daily-review-pool";
import { learningModules } from "./learning-curriculum";
import { getLessonReviewDate } from "./learning-review-date";
import { lessonHash } from "./learning-lesson-navigation";
import { getLearningCategoryByTitle } from "./learning-categories";
import { QUESTIONS } from "../data/questions-full";
import { quizLearningOptions } from "./quiz-learning-scope";

// Editorial selection, not a new factual review. All prompts, four options and
// explanations come unchanged from the shared DACH course questions. The order
// deliberately alternates subjects; no local law is generalized to DACH.
export const REVIER_MOMENT_IDS = Object.freeze([
  "wissen-schwarzwild-lebensweise-sau-q5",
  "wissen-wetter-wind-1",
  "wissen-ausbau-jagdhundewahl-gruppen-1",
  "wissen-ausbau-anwendung-sicherheitszeichen-2026-q19",
  "wissen-ansitzplanung-2",
  "wissen-wildbrethygiene-1",
  "wissen-ausbau-oekologie-blattfunktion-2026-wissen-ausbau-oekologie-blattfunktion-2026-blattalterung-q5",
  "wissen-ausbau-bodenporen-verdichtung-2026-q2",
  "wissen-jaegersprache-1",
  "wissen-ausbau-karten-gps-hoehenlinien-1",
  "wissen-ausbau-wildunfall-fundtiere-unfallmeldung-2",
  "wissen-ausbau-hasenartige-3",
  "wissen-wald-wild-1",
  "wissen-ausbau-biologie-hundegebiss-2026-dauerformel-q3",
  "wissen-ausbau-anwendung-sicherheitszeichen-2026-q11",
  "wissen-gesellschaftsjagd-1",
  "wissen-wildbrethygiene-temperatur-oberflaeche",
  "wissen-ausbau-oekologie-holzaufbau-2026-wissen-ausbau-oekologie-holzaufbau-2026-leitgewebe-q1",
  "wissen-pruefung-bodenwasser-wurzelraum-2026-q13",
  "wissen-jaegersprache-3",
  "wissen-ausbau-ausruestungsplanung-schichten-1",
  "wissen-vertiefung-verantwortung-fundtiere-wissen-vertiefung-verantwortung-fundtiere-beobachtung-frage-2",
  "wissen-ausbau-federaufbau-funktion-2026-pflege-q1",
  "wissen-orientierung-4",
  "wissen-ausbau-biologie-hundegebiss-2026-gruppen-q2",
  "wissen-ausbau-anwendung-sicherheitszeichen-2026-q12",
  "wissen-ausbau-revierpraxis-ansitzeinrichtungen-2026-q1",
  "wissen-wildbrethygiene-6",
  "wissen-ausbau-habitat-bluete-samen-frucht-2026-samen-frucht-q1",
  "wissen-vertiefung-flussbett-sediment-2026-q5",
  "wissen-jaegersprache-4",
  "wissen-ausbau-ausruestungsplanung-sichtbarkeit-1",
  "wissen-ausbau-oekologie-tierbewegungen-2026-wissen-ausbau-oekologie-tierbewegungen-2026-amphibienwege-q5",
  "wissen-rotwild-sozialverhalten-rot-q1",
  "wissen-vertiefung-gallen-blattminen-round5-2026-q1",
  "wissen-ausbau-hundelernen-schritte-2",
  "wissen-ausbau-sicherheitskommunikation-uebergabe-1",
  "wissen-ausbau-daemmerungssehen-2026-q5",
  "wissen-ausbau-gefrieren-auftauen-2026-q10",
  "wissen-ausbau-habitat-bluete-samen-frucht-2026-pollenweg-q1",
  "wissen-pruefung-bodenwasser-wurzelraum-2026-q2",
  "wissen-jaegersprache-5",
  "wissen-ausbau-karten-gps-massstab-2",
  "wissen-ausbau-naturdialog-gespraechsgrenzen-1",
  "wissen-federwild-beobachtung-vogel-lamellen-funktion",
  "wissen-ausbau-habitat-insektenentwicklung-2026-metamorphose-q8",
  "wissen-vertiefung-jagdhunderassen-pointer-setter-1",
  "wissen-ausbau-waffenorganisation-anleitung-2",
  "wissen-vertiefung-luftfeuchte-taupunkt-round3-2026-q13",
  "wissen-ausbau-anwendung-muskelbiologie-2026-q19",
  "wissen-ausbau-oekologie-blattfunktion-2026-wissen-ausbau-oekologie-blattfunktion-2026-photosynthese-q1",
  "wissen-ausbau-oekologie-leguminosen-stickstoff-2026-wissen-ausbau-oekologie-leguminosen-stickstoff-2026-stickstoffformen-q8",
  "wissen-vertiefung-wild-alpine-winterstrategien-a7",
  "wissen-ausbau-oekologie-bachlebensgemeinschaft-2026-wissen-ausbau-oekologie-bachlebensgemeinschaft-2026-wasserland-q3",
  "wissen-ausbau-biologie-hundesinne-2026-sehen-q4",
  "wissen-ausbau-schiessstandtraining-aufsicht-1",
  "wissen-ausbau-anwendung-kartenprofile-2026-q32",
  "wissen-ausbau-revierpraxis-lebensmittelbakterien-2026-q3",
  "wissen-ausbau-oekologie-holzaufbau-2026-wissen-ausbau-oekologie-holzaufbau-2026-jahrringe-q1",
  "wissen-ausbau-mahd-wildtierrettung-3",
]);

const text = value => typeof value === "string" && value.trim().length > 0;
function requireCase(condition) {
  if (!condition) throw new Error("Revier-Moment: Der geprüfte Fragenvorrat ist unvollständig oder ungültig.");
}

export function getRevierMomentCases() {
  requireCase(REVIER_MOMENT_IDS.length === 60 && new Set(REVIER_MOMENT_IDS).size === 60);
  const pool = getDailyReviewPool();
  requireCase(Array.isArray(pool));
  const quizTopics = new Set(quizLearningOptions(QUESTIONS).commonOptions.topics.map(topic => topic.name));
  return REVIER_MOMENT_IDS.map(id => {
    const matches = pool.filter(item => item?.id === id);
    requireCase(matches.length === 1);
    const item = matches[0];
    requireCase(text(item.q) && text(item.explain) && text(item.courseTitle)
      && Array.isArray(item.answers) && item.answers.length === 4
      && item.answers.every(answer => answer && text(answer.id) && text(answer.text))
      && new Set(item.answers.map(answer => answer.id)).size === 4
      && Array.isArray(item.correct) && item.correct.length === 1
      && item.answers.some(answer => answer.id === item.correct[0])
      && ["lesson", "course"].includes(item.sourceScope)
      && Array.isArray(item.sources) && item.sources.length > 0
      && item.sources.every(source => source && text(source.label) && /^https:\/\//.test(source.url)));
    const owners = learningModules.filter(course => course.questions.some(question => question.id === id));
    requireCase(owners.length === 1);
    const course = owners[0], question = course.questions.find(value => value.id === id);
    const lesson = course.lessons.find(value => value.id === question.lessonId);
    const category = getLearningCategoryByTitle(course.category);
    requireCase(lesson && Array.isArray(question.countries) && question.countries.length === 3
      && ["CH", "AT", "DE"].every(country => question.countries.includes(country))
      && question.topic !== "Recht" && item.category !== "jagdrecht"
      && category && category.slug === item.category && category.slug !== "jagdrecht"
      && item.href === `/kurse/${course.id}${lessonHash(lesson.id)}`);
    const reviewedOn = getLessonReviewDate(lesson, course.reviewedOn);
    requireCase(reviewedOn);
    const reading = item.reading;
    requireCase(reading && reading.title === lesson.title && Array.isArray(reading.paragraphs)
      && reading.paragraphs.length > 0 && reading.paragraphs.every(text)
      && reading.paragraphs.length === lesson.paragraphs.length
      && reading.paragraphs.every((paragraph, index) => paragraph === lesson.paragraphs[index])
      && reading.paragraph === reading.paragraphs[0]
      && ["takeaway", "exercise"].every(key => reading[key] === lesson[key] || reading[key] === undefined && !lesson[key]));
    const sources = item.sources.map((source, index) => ({ id: `daily-source-${index + 1}`, title: source.label, url: source.url }));
    return {
      question: {
        id: item.id, topicId: course.id, format: "single", skill: "Lernsituation",
        prompt: item.q, options: item.answers.map(({ id, text }) => ({ id, text })), correctIds: [...item.correct],
        explanation: item.explain, sourceIds: sources.map(source => source.id), reviewedOn,
      },
      topic: { id: course.id, title: item.courseTitle, sources },
      reading: { title: reading.title, paragraphs: [...reading.paragraphs],
        ...(reading.takeaway ? { takeaway: reading.takeaway } : {}),
        ...(reading.exercise ? { exercise: reading.exercise } : {}),
      },
      href: item.href, sourceScope: item.sourceScope, categorySlug: category.slug,
      practice: {
        categorySlug: category.slug, reviewHref: `/lernen/fuenf-minuten?kategorie=${encodeURIComponent(category.slug)}`,
        ...(quizTopics.has(category.title) ? { quizHref: `/quiz-app?topic=${encodeURIComponent(category.title)}` } : {}),
      },
    };
  });
}
