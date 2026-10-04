import { wildlifeModules } from "./learning-wildlife";
import { practiceModules } from "./learning-practice";
import { natureExpansionModules } from "./learning-expansion-nature";
import { practiceExpansionModules } from "./learning-expansion-practice";
import { careExpansionModules } from "./learning-expansion-care";
import { natureDeepeningModules } from "./learning-deepening-nature";
import { practiceDeepeningModules } from "./learning-deepening-practice";
import { careDeepeningModules } from "./learning-deepening-care";
import { learningCategories, learningCategoryDetails } from "./learning-categories";

export { learningCategories };

function prepareModule(item) {
  const lessonIds = new Set(item.lessons.map(lesson => lesson.id));
  if (lessonIds.size !== item.lessons.length || !learningCategories.includes(item.category) ||
      !item.lessons.length || !item.questions.length || !item.countries.length ||
      item.countries.some(country => !["DE", "AT", "CH"].includes(country) || !item.countryNotes?.[country])) {
    throw new Error(`Ungültige Lerneinheit: ${item.id}`);
  }
  const ids = new Set();
  const questions = item.questions.map((question) => {
    const id = `${item.id}-${question.id}`;
    const countries = question.countries ?? item.countries;
    if (ids.has(id) || !lessonIds.has(question.lessonId) || question.options.length !== 4 || new Set(question.options).size !== 4 || !question.explain ||
        !Array.isArray(countries) || !countries.length || new Set(countries).size !== countries.length || countries.some(country => !item.countries.includes(country)) ||
        !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
      throw new Error(`Ungültige Lernfrage: ${id}`);
    }
    ids.add(id);
    // Rotate the display order reproducibly; correct answer IDs retain their meaning.
    const answers = question.options.map((text, index) => ({ id: "abcd"[index], text }));
    const offset = [...id].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7) % 4;
    return {
      id, q: question.q, answers: [...answers.slice(offset), ...answers.slice(0, offset)],
      correct: ["abcd"[question.answer]], explain: question.explain,
      lessonId: question.lessonId, countries: [...countries],
      // An explicitly regional question tests a local rule, even in a hygiene course.
      topic: question.countries && countries.length < 3 ? "Recht" : item.topic,
      learningHref: `/kurse/${item.id}`,
    };
  });
  return { ...item, questions, reviewedOn: "2026-10-04" };
}

const rawModules = [...wildlifeModules, ...practiceModules, ...natureExpansionModules, ...practiceExpansionModules, ...careExpansionModules, ...natureDeepeningModules, ...practiceDeepeningModules, ...careDeepeningModules];
if (new Set(rawModules.map(module => module.id)).size !== rawModules.length) throw new Error("Doppelte Kurs-ID im Lernbereich");
export const learningModules = rawModules.map(prepareModule);
export const learningQuestions = learningModules.flatMap(module => module.questions);
export const learningCounts = {
  modules: learningModules.length,
  lessons: learningModules.reduce((total, module) => total + module.lessons.length, 0),
  questions: learningQuestions.length,
};

export function getLearningModule(id) {
  return learningModules.find(module => module.id === id);
}

const foundationPaths = [
  {
    id: "einstieg", title: "Grundlagen sicher aufbauen",
    description: "Vom Beobachten über die Sicherheit bis zur passenden Rechtsquelle.",
    moduleIds: ["wissen-rehwild-jahreslauf", "wissen-spuren-systematisch", "wissen-waffensicherheit", "wissen-kugelfang", "wissen-ansitzplanung", "wissen-jagdrecht-de", "wissen-jagdrecht-at", "wissen-jagdrecht-ch"],
  },
  {
    id: "wildkunde", title: "Wildtiere und Lebensräume verstehen",
    description: "Arten, Jahreslauf, Sozialverhalten und Lebensraum gemeinsam betrachten.",
    moduleIds: ["wissen-rehwild-jahreslauf", "wissen-rotwild-sozialverhalten", "wissen-schwarzwild-lebensweise", "wissen-gams-steinbock", "wissen-federwild-beobachtung", "wissen-lebensraeume-biotopverbund", "wissen-wald-wild"],
  },
  {
    id: "praxis", title: "Gut vorbereitet ins Revier",
    description: "Gelände, Wetter, Optik und Zusammenarbeit in einem sicheren Ablauf verbinden.",
    moduleIds: ["wissen-orientierung", "wissen-wetter-wind", "wissen-optik", "wissen-ansitzplanung", "wissen-gesellschaftsjagd", "wissen-jagdhunde-aufgaben-ausbildung", "wissen-nachsuche"],
  },
  {
    id: "gesundheit", title: "Wildbret und Tiergesundheit",
    description: "Hygiene, nachvollziehbare Meldung und Biosicherheit vertiefen.",
    moduleIds: ["wissen-tiergesundheit", "wissen-wildbrethygiene", "wissen-nachsuche"],
  },
  {
    id: "pruefung", title: "Wissen für die Prüfung festigen",
    description: "Verständlich erklären, Länderregeln unterscheiden und Fehler gezielt bearbeiten.",
    moduleIds: ["wissen-pruefungslernen", "wissen-jaegersprache", "wissen-waffensicherheit", "wissen-kugelfang", "wissen-jagdrecht-de", "wissen-jagdrecht-at", "wissen-jagdrecht-ch", "wissen-wildbrethygiene"],
  },
];

export const learningPaths = [
  ...foundationPaths,
  ...learningCategoryDetails.map(category => ({
    id: `vertiefung-${category.slug}`, title: `${category.title} vertiefen`,
    description: `Verbinde ${category.focus.join(", ")} in ausführlichen Aufbaukursen.`,
    moduleIds: learningModules.filter(module => module.category === category.title && (module.id.startsWith("wissen-ausbau-") || module.id.startsWith("wissen-vertiefung-"))).map(module => module.id),
    advanced: true,
  })).filter(path => path.moduleIds.length > 0),
];
