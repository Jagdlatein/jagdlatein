import { getDailyReviewPool } from "./daily-review-pool";
import { learningModules } from "./learning-curriculum";
import { getLessonReviewDate } from "./learning-review-date";
import { lessonHash } from "./learning-lesson-navigation";

// Editorial selection, not a new factual review. All prompts, four options and
// explanations come unchanged from the shared DACH course questions. The order
// deliberately alternates subjects; no local law is generalized to DACH.
export const REVIER_MOMENT_IDS = Object.freeze([
  "wissen-rehwild-jahreslauf-reh-q1",
  "wissen-spuren-systematisch-spur-q1",
  "wissen-jagdhunde-aufgaben-ausbildung-hund-q1",
  "wissen-waffensicherheit-3",
  "wissen-ansitzplanung-2",
  "wissen-wildbrethygiene-1",
  "wissen-ausbau-baumarten-waldaufbau-3",
  "wissen-ausbau-agrarjahr-2",
  "wissen-pruefungslernen-3",
  "wissen-wachstum-gps-wald-2026-q4",
  "wissen-ausbau-wildunfall-fundtiere-abstand-2",
  "wissen-rotwild-sozialverhalten-rot-q1",
  "wissen-lebensraeume-biotopverbund-biotop-q1",
  "wissen-nachsuche-8",
  "wissen-kugelfang-1",
  "wissen-gesellschaftsjagd-1",
  "wissen-tiergesundheit-1",
  "wissen-ausbau-straeucher-jahreslauf-1",
  "wissen-ausbau-mahd-wildtierrettung-5",
  "wissen-jaegersprache-6",
  "wissen-ausbau-wetterdaten-verstehen-2026-q2",
  "wissen-vertiefung-verantwortung-fundtiere-wissen-vertiefung-verantwortung-fundtiere-beobachtung-frage-2",
  "wissen-schwarzwild-lebensweise-sau-q1",
  "wissen-orientierung-4",
  "wissen-ausbau-jagdhundewahl-aufgaben-2",
  "wissen-optik-1",
  "wissen-ausbau-pirschbeobachtung-beobachtungsfrage-1",
  "wissen-ausbau-wildbretprozess-trennung-2",
  "wissen-ausbau-waldverjuengung-verbiss-3",
  "wissen-vertiefung-krautpflanzen-lebensdauer-round4-2026-q1",
  "wissen-ausbau-revierpraxis-groessen-einheiten-2026-q11",
  "wissen-ausbau-habitat-mobile-energie-2026-laufzeit-q4",
  "wissen-ausbau-nachtlebensraum-licht-2026-q9",
  "wissen-gams-steinbock-berg-q1",
  "wissen-wetter-wind-8",
  "wissen-ausbau-hundelernen-schritte-2",
  "wissen-ausbau-sicherheitskommunikation-vorbesprechung-1",
  "wissen-ausbau-anschussmeldung-uebergabenotiz-1",
  "wissen-ausbau-wildkrankheiten-beobachten-2",
  "wissen-vertiefung-samenruhe-keimung-round5-2026-q1",
  "wissen-ausbau-habitat-bodenentwicklung-2026-profilmodell-q5",
  "wissen-vertiefung-antwortsicherheit-feedback-2026-q1",
  "wissen-vertiefung-gnss-hoehenbezug-2026-q6",
  "wissen-vertiefung-vogelglas-praevention-2026-q1",
  "wissen-federwild-beobachtung-vogel-q1",
  "wissen-ausbau-gewaesser-feuchtgebiete-1",
  "wissen-ausbau-hundeteam-auftrag-2",
  "wissen-ausbau-schiessstandtraining-aufsicht-1",
  "wissen-ausbau-daemmerungssehen-2026-q2",
  "wissen-vertiefung-wasseraktivitaet-ph-round4-2026-q1",
  "wissen-vertiefung-laubblatt-merkmale-round4-2026-q3",
  "wissen-ausbau-bodenporen-verdichtung-2026-q11",
  "wissen-ausbau-hasenartige-1",
  "wissen-ausbau-biotoppflege-1",
  "wissen-vertiefung-hundeteam-belastung-teamkarte-1",
  "wissen-ausbau-waffenorganisation-anleitung-1",
  "wissen-vertiefung-kompass-nordrichtungen-2026-q7",
  "wissen-ausbau-revierpraxis-lebensmittelbakterien-2026-q3",
  "wissen-ausbau-pilze-lebensweisen-2026-q15",
  "wissen-vertiefung-feldflur-bluehkette-2026-q3",
]);

const text = value => typeof value === "string" && value.trim().length > 0;
function requireCase(condition) {
  if (!condition) throw new Error("Revier-Moment: Der geprüfte Fragenvorrat ist unvollständig oder ungültig.");
}

export function getRevierMomentCases() {
  requireCase(REVIER_MOMENT_IDS.length === 60 && new Set(REVIER_MOMENT_IDS).size === 60);
  const pool = getDailyReviewPool();
  requireCase(Array.isArray(pool));
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
    requireCase(lesson && Array.isArray(question.countries) && question.countries.length === 3
      && ["CH", "AT", "DE"].every(country => question.countries.includes(country))
      && question.topic !== "Recht" && item.category !== "jagdrecht"
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
      href: item.href, sourceScope: item.sourceScope,
    };
  });
}
