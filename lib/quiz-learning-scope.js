import { variedQuizPool } from "./quiz-question-variety";
import { learningCategories } from "./learning-categories";

const legacyTopicCategories = {
  Biologie: "Wildkunde", Federwild: "Wildkunde", Gamswild: "Wildkunde", Raubwild: "Wildkunde", Rehwild: "Wildkunde", Rotwild: "Wildkunde", Schwarzwild: "Wildkunde", Steinwild: "Wildkunde",
  Waffen: "Waffen & Sicherheit", "Waffen & Schuss": "Waffen & Sicherheit",
  Hege: "Natur & Revier", "Hege/Naturschutz": "Natur & Revier", "Natur & Hege": "Natur & Revier", Ökologie: "Natur & Revier",
  Wildbrethygiene: "Wildbret & Gesundheit",
  Jägersprache: "Prüfung & Sprache", Prüfung: "Prüfung & Sprache", Prüfungsvorbereitung: "Prüfung & Sprache",
};
export function quizCategoryForTopic(topic) {
  return topic === "Jagdrecht" ? "Recht" : legacyTopicCategories[topic] || topic;
}

export const QUIZ_LEARNING_COUNTRIES = [
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "CH", name: "Schweiz" },
];

// These questions test a specific jurisdiction although their original packs
// placed them in another topic or tagged them for all countries. Keep wording and IDs.
export const quizJurisdictionQuestions = {
  "DE-hygiene-trichinen": ["DE"],
  "wissen-waffensicherheit-4": ["DE"],
  "wissen-ausbau-wildkameras-datenschutzlaender-2": ["CH"],
  "wissen-ausbau-wildkameras-bilderzugriff-1": ["CH"],
  "wissen-ausbau-rechtsquellen-regionen-1": ["CH"],
  "wissen-ausbau-rechtsquellen-grund-1": ["CH"],
  "wissen-ausbau-rechtsquellen-person-2": ["AT"],
};

export function isCountryQuizTopic(topic) {
  return topic === "Recht" || topic === "Jagdrecht";
}

export function quizQuestionTopic(question) {
  if (Object.hasOwn(quizJurisdictionQuestions, question.id) || isCountryQuizTopic(question.topic)) return "Recht";
  return quizCategoryForTopic(learningCategories.includes(question.learningCategory) ? question.learningCategory : question.topic);
}

export function quizQuestionCountries(question) {
  return Object.hasOwn(quizJurisdictionQuestions, question.id) ? quizJurisdictionQuestions[question.id] : question.countries;
}

export function quizLearningPool(questions, { country = "DE", topic = "Alle" } = {}) {
  return variedQuizPool(questions.filter(question => {
    const questionTopic = quizQuestionTopic(question);
    if (isCountryQuizTopic(topic)) {
      return questionTopic === "Recht" && quizQuestionCountries(question).includes(country);
    }
    return questionTopic !== "Recht" && (topic === "Alle" || questionTopic === topic
      // Existing direct links to a former topic remain valid; the setup shows
      // the same eleven shared categories as the rest of the learning area.
      || !learningCategories.includes(topic) && question.topic === topic);
  }));
}

export function quizLearningOptions(questions) {
  const common = quizLearningPool(questions);
  const topics = learningCategories.filter(category => category !== "Jagdrecht");
  return {
    commonOptions: {
      total: common.length,
      topics: topics.map(name => ({ name, count: quizLearningPool(questions, { topic: name }).length })).filter(topic => topic.count > 0),
    },
    countryOptions: QUIZ_LEARNING_COUNTRIES.map(country => ({
      ...country,
      count: quizLearningPool(questions, { country: country.code, topic: "Recht" }).length,
    })),
  };
}

export function quizLearningUrl(path, country, topic) {
  const parameters = isCountryQuizTopic(topic) ? `country=${encodeURIComponent(country)}&` : "";
  return `${path}?${parameters}topic=${encodeURIComponent(topic)}`;
}
