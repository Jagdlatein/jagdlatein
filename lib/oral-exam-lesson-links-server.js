// Build-only editorial learning starts. A linked lesson is a useful foundation,
// not a claim that it alone proves every sentence of an oral model answer.
import { oralExamQuestions } from "./oral-exam-trainer";
import { getLearningModule } from "./learning-curriculum";
import { getLearningCategoryByTitle } from "./learning-categories";
import { lessonHash } from "./learning-lesson-navigation";

const targets = [
  { questionId: "kitzfund", courseId: "wissen-rehwild-jahreslauf", lessonId: "reh-nachwuchs" },
  { questionId: "rotte", courseId: "wissen-schwarzwild-lebensweise", lessonId: "sau-sozial" },
  { questionId: "hundewahl", courseId: "wissen-vertiefung-jagdhunderassen", lessonId: "passende-auswahl" },
  { questionId: "sinneseindruck", courseId: "wissen-ausbau-wildbretqualitaet", lessonId: "qualitaet" },
  { questionId: "abruflernen", courseId: "wissen-ausbau-lernmethoden", lessonId: "abruf" },
  { questionId: "abruflernen", courseId: "wissen-ausbau-lernmethoden", lessonId: "abstand" },
  { questionId: "offlinekarte", courseId: "wissen-ausbau-karten-gps", lessonId: "ausfall" },
  { questionId: "verbund", courseId: "wissen-lebensraeume-biotopverbund", lessonId: "biotop-netz" },
  { questionId: "verbund", courseId: "wissen-lebensraeume-biotopverbund", lessonId: "habitat-nische" },
  { questionId: "mahd", courseId: "wissen-ausbau-mahd-wildtierrettung", lessonId: "team" },
  { questionId: "mahd", courseId: "wissen-ausbau-mahd-wildtierrettung", lessonId: "aenderung" },
  { questionId: "hygienekette", courseId: "wissen-ausbau-wildbretprozess", lessonId: "trennung" },
  { questionId: "hygienekette", courseId: "wissen-ausbau-wildbretprozess", lessonId: "kuehlweg" },
];
const id = value => typeof value === "string" && /^[a-z][a-z0-9-]{1,159}$/.test(value);
const text = value => typeof value === "string" && value.trim().length > 0;

export function projectOralExamLessonLinks(entries) {
  if (!Array.isArray(entries) || entries.length > oralExamQuestions.length * 2) throw new Error("Ungültige Gesprächs-Lernstarts");
  const seen = new Set(), counts = new Map();
  return entries.map(target => {
    if (!target || ![target.questionId, target.courseId, target.lessonId].every(id)) throw new Error("Ungültiger Gesprächs-Lektionsbezug");
    const questions = oralExamQuestions.filter(question => question.id === target.questionId);
    const question = questions[0], course = getLearningModule(target.courseId);
    const lessons = course?.lessons.filter(lesson => lesson.id === target.lessonId) || [], lesson = lessons[0];
    const key = `${target.questionId}:${target.courseId}:${target.lessonId}`;
    const count = (counts.get(target.questionId) || 0) + 1;
    if (questions.length !== 1 || !course || question.course !== course.id || question.categorySlug === "jagdrecht" || getLearningCategoryByTitle(course.category)?.slug !== question.categorySlug
      || course.countries.length !== 3 || !["DE", "AT", "CH"].every(country => course.countries.includes(country))
      || lessons.length !== 1 || !text(lesson.title) || !Array.isArray(lesson.paragraphs) || !lesson.paragraphs.length || !lesson.paragraphs.every(text)
      || seen.has(key) || count > 2) throw new Error(`Unpassender Gesprächs-Lernstart: ${target.questionId}`);
    seen.add(key); counts.set(target.questionId, count);
    return { questionId: question.id, courseId: course.id, lessonId: lesson.id, title: lesson.title, href: `/kurse/${course.id}${lessonHash(lesson.id)}` };
  });
}

export function getOralExamLessonLinks() { return projectOralExamLessonLinks(targets); }
