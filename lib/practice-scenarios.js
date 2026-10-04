import { getLearningModule } from "./learning-curriculum";

export const practiceModuleIds = {
  "ansprache_rehwild": [
    "wissen-rehwild-jahreslauf",
    "wissen-ausbau-jungtiere-beobachten",
    "wissen-jaegersprache"
  ],
  "ansprache_rotwild": [
    "wissen-rotwild-sozialverhalten",
    "wissen-ausbau-jungtiere-beobachten",
    "wissen-jaegersprache"
  ],
  "ansprache_schwarzwild": [
    "wissen-schwarzwild-lebensweise",
    "wissen-ausbau-jungtiere-beobachten",
    "wissen-jaegersprache"
  ],
  "beschuss": [
    "wissen-kugelfang",
    "wissen-waffensicherheit",
    "wissen-ausbau-schiessstandtraining"
  ],
  "drueckjagd": [
    "wissen-gesellschaftsjagd",
    "wissen-ausbau-sicherheitskommunikation",
    "wissen-ausbau-rollenabsprachen"
  ],
  "entfernung": [
    "wissen-optik",
    "wissen-ausbau-schiessstandtraining",
    "wissen-ansitzplanung"
  ],
  "familienverbaende": [
    "wissen-rehwild-jahreslauf",
    "wissen-rotwild-sozialverhalten",
    "wissen-ausbau-jungtiere-beobachten"
  ],
  "keiler": [
    "wissen-schwarzwild-lebensweise",
    "wissen-jaegersprache",
    "wissen-ausbau-jungtiere-beobachten"
  ],
  "kugelwirkung": [
    "wissen-waffensicherheit",
    "wissen-kugelfang",
    "wissen-ausbau-schiessstandtraining"
  ],
  "lauscher": [
    "wissen-rehwild-jahreslauf",
    "wissen-jaegersprache",
    "wissen-ausbau-pirschbeobachtung"
  ],
  "mond": [
    "wissen-wetter-wind",
    "wissen-ansitzplanung",
    "wissen-ausbau-wildkameras"
  ],
  "nachtjagd": [
    "wissen-optik",
    "wissen-ansitzplanung",
    "wissen-ausbau-verantwortungsentscheidungen"
  ],
  "optik": [
    "wissen-optik",
    "wissen-ausbau-ausruestungsplanung",
    "wissen-ausbau-wildkameras"
  ],
  "pirsch": [
    "wissen-ausbau-pirschbeobachtung",
    "wissen-wetter-wind",
    "wissen-ausbau-verantwortungsentscheidungen"
  ],
  "revier": [
    "wissen-orientierung",
    "wissen-ausbau-karten-gps",
    "wissen-ausbau-biotoppflege"
  ],
  "schussfeld": [
    "wissen-kugelfang",
    "wissen-gesellschaftsjagd",
    "wissen-ausbau-sicherheitskommunikation"
  ],
  "schusszeichen": [
    "wissen-nachsuche",
    "wissen-ausbau-anschussmeldung",
    "wissen-waffensicherheit"
  ],
  "trefferzonen": [
    "wissen-kugelfang",
    "wissen-waffensicherheit",
    "wissen-ausbau-verantwortungsentscheidungen"
  ],
  "trophaeen": [
    "wissen-jaegersprache",
    "wissen-rotwild-sozialverhalten",
    "wissen-ausbau-jaegersprache"
  ],
  "verhalten": [
    "wissen-rehwild-jahreslauf",
    "wissen-schwarzwild-lebensweise",
    "wissen-ausbau-pirschbeobachtung"
  ],
  "waermebild": [
    "wissen-optik",
    "wissen-ansitzplanung",
    "wissen-ausbau-ausruestungsplanung"
  ],
  "wild": [
    "wissen-rehwild-jahreslauf",
    "wissen-federwild-beobachtung",
    "wissen-ausbau-hasenartige"
  ],
  "wildalarm": [
    "wissen-ausbau-pirschbeobachtung",
    "wissen-ansitzplanung",
    "wissen-ausbau-verantwortungsentscheidungen"
  ],
  "wildansprache": [
    "wissen-rehwild-jahreslauf",
    "wissen-rotwild-sozialverhalten",
    "wissen-ausbau-jungtiere-beobachten"
  ],
  "wildspuren": [
    "wissen-spuren-systematisch",
    "wissen-ausbau-monitoring",
    "wissen-ausbau-pirschbeobachtung"
  ],
  "wind": [
    "wissen-wetter-wind",
    "wissen-ausbau-pirschbeobachtung",
    "wissen-ansitzplanung"
  ]
};

// Derselbe geprüfte Fragenbestand wie in den ausführlichen Lernkursen.
// Stabile lokale IDs erhalten den Umfang der vorhandenen Trainer.
export function getPracticeScenarios(slug) {
  const modules = (practiceModuleIds[slug] || []).map(id => getLearningModule(id));
  if (!modules.length || modules.some(module => !module)) throw new Error("Unbekannter Praxistrainer: " + slug);
  const pool = [];
  const longest = Math.max(...modules.map(module => module.questions.length));
  for (let index = 0; index < longest; index += 1) {
    for (const module of modules) if (module.questions[index]) pool.push({ module, question: module.questions[index] });
  }
  if (pool.length < 25) throw new Error("Zu wenige geprüfte Praxisfragen: " + slug);
  return pool.slice(0, 25).map(({ module, question }, index) => {
    const correct = index % 2 === 0;
    const right = question.answers.find(answer => question.correct.includes(answer.id));
    const wrong = question.answers.filter(answer => !question.correct.includes(answer.id));
    const selected = correct ? right : wrong[index % wrong.length];
    return {
      id: index + 1,
      title: question.q,
      text: "Aussage: „" + selected.text + "“",
      correct,
      explanation: "Passende Antwort: " + right.text + " " + question.explain,
      source: module.sources[0].url,
      sources: module.sources,
      sourceQuestionId: question.id,
      learningHref: question.learningHref,
      countryLabel: question.countries.join(" / "),
      moduleTitle: module.title,
      statementPractice: true,
    };
  });
}
