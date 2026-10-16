// A reproducible inventory, not a claim of unique facts or scientific quality.
const fs = require('node:fs');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { learningModules, learningCounts } = load('lib/learning-curriculum.js');
const { QUESTIONS } = load('data/questions-full.js');
const { getFlashcards } = load('lib/learning-flashcards.js');
const growth = load('lib/learning-knowledge-growth.js').knowledgeGrowthModules;
const report = {
  generatedAt: new Date().toISOString(),
  courses: learningCounts.modules, lessons: learningCounts.lessons, courseQuestions: learningCounts.questions,
  centralQuizRecords: QUESTIONS.length,
  distinctCentralStems: new Set(QUESTIONS.map(item => String(item.q || item.prompt || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim())).size,
  flashcards: getFlashcards().length,
  speciesPortraits: load('lib/european-wildlife.js').europeanWildlife.length,
  animalSoundRecordings: load('lib/animal-sounds.js').animalSounds.length,
  added: { courses: growth.length, lessons: growth.reduce((n, x) => n + x.lessons.length, 0), questions: growth.reduce((n, x) => n + x.questions.length, 0) },
  categories: Object.fromEntries([...new Set(learningModules.map(x => x.category))].map(category => [category, { courses: learningModules.filter(x => x.category === category).length, newQuestions: growth.filter(x => x.category === category).reduce((n, x) => n + x.questions.length, 0) }])),
  scope: 'Course questions are already included in the central pool. Flashcards reuse existing questions. Counts do not mean distinct facts, official examination questions, or complete scientific verification.',
};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
