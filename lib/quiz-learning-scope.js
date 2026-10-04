export const QUIZ_LEARNING_COUNTRIES = [
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "CH", name: "Schweiz" },
];

// These questions test a specific jurisdiction although their original packs
// placed them in another topic or tagged them for all countries. Keep wording and IDs.
export const quizJurisdictionQuestions = {
  "DE-hygiene-trichinen": ["DE"],
  "AT-wk-aalweibchen-69": ["AT"],
  "wissen-waffensicherheit-4": ["DE"],
  "wissen-ausbau-wildkameras-datenschutzlaender-2": ["CH"],
  "wissen-ausbau-wildkameras-bilderzugriff-1": ["CH"],
  "wissen-ausbau-rechtsquellen-regionen-1": ["CH"],
  "wissen-ausbau-rechtsquellen-grund-1": ["CH"],
  "wissen-ausbau-rechtsquellen-person-2": ["AT"],
};

export function isCountryQuizTopic(topic) {
  return topic === "Recht";
}

export function quizQuestionTopic(question) {
  return Object.hasOwn(quizJurisdictionQuestions, question.id) ? "Recht" : question.topic;
}

export function quizQuestionCountries(question) {
  return Object.hasOwn(quizJurisdictionQuestions, question.id) ? quizJurisdictionQuestions[question.id] : question.countries;
}

export function quizLearningPool(questions, { country = "DE", topic = "Alle" } = {}) {
  return questions.filter(question => {
    const questionTopic = quizQuestionTopic(question);
    if (isCountryQuizTopic(topic)) {
      return questionTopic === "Recht" && quizQuestionCountries(question).includes(country);
    }
    return questionTopic !== "Recht" && (topic === "Alle" || questionTopic === topic);
  });
}

export function quizLearningOptions(questions) {
  const common = quizLearningPool(questions);
  const counts = new Map();
  common.forEach(question => counts.set(question.topic, (counts.get(question.topic) || 0) + 1));
  return {
    commonOptions: {
      total: common.length,
      topics: [...counts].map(([name, count]) => ({ name, count }))
        .sort((left, right) => left.name.localeCompare(right.name, "de")),
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
