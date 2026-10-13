import { revierLifeTopics, revierLifeSources } from './small-revier-life';

// Reuse checked claims, original photographs and provenance; no generated facts.
const topicIds = ['spinnen', 'koecherfliegenlarven', 'bachflohkrebse', 'amphibien', 'streuabbau'];
export const communityWeeklyCases = topicIds.map(id => {
  const topic = revierLifeTopics.find(item => item.id === id);
  const sourceIds = [...new Set(topic.facts.flatMap(fact => fact.sourceIds))];
  return { id, title: topic.title, photo: topic.photo, photoContext: topic.photoContext,
    question: topic.quiz.prompt, choices: topic.quiz.choices, answer: topic.quiz.answer,
    explanation: topic.quiz.explanation, facts: topic.facts, limit: topic.limit,
    reviewedOn: topic.reviewedOn, category: 'natur-revier',
    discussionTitle: `Fall der Woche: ${topic.title}`.slice(0, 140),
    href: `/lernen/kleines-revierleben?thema=${id}#revierleben-inhalt`,
    sources: sourceIds.map(sourceId => revierLifeSources[sourceId]),
  };
});

export function weeklyCaseIndex(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return 0;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = type => Number(parts.find(item => item.type === type).value);
  const days = (Date.UTC(part('year'), part('month') - 1, part('day')) - Date.UTC(2026, 9, 12)) / 86400000;
  const week = Math.floor(days / 7);
  return ((week % communityWeeklyCases.length) + communityWeeklyCases.length) % communityWeeklyCases.length;
}
export const getCommunityWeeklyCase = date => communityWeeklyCases[weeklyCaseIndex(date)];
export const communityWeeklyCaseSearchEntries = communityWeeklyCases.map(item => ({
  id: `community-fall:${item.id}`, title: `Community-Lernfall: ${item.title}`, type: 'entry',
  description: item.question, categories: ['natur-revier'], aliases: ['Fall der Woche', 'Community', 'Lernfall'],
  href: `/community?fall=${item.id}#community-wochenfall`, text: `${item.question} ${item.title}`,
}));
