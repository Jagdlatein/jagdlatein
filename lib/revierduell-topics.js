// Keep the public chooser aligned with the existing learning categories.
// This small catalogue contains labels only, never the teaching/question bank.
import { getLearningCategory } from "./learning-categories";

export const DUELL_TOPIC_SLUGS = Object.freeze([
  "wildkunde", "waffen-sicherheit", "jagdpraxis", "natur-revier", "hundewesen",
  "wildbret-gesundheit", "pruefung-sprache", "wald-pflanzen",
  "landwirtschaft-lebensraeume", "ausruestung-technik", "tierschutz-verantwortung",
]);

export const DUELL_TOPICS = Object.freeze(DUELL_TOPIC_SLUGS.map(slug =>
  Object.freeze({ slug, title: getLearningCategory(slug).title })));

export function normaliseDuellTopic(value) {
  return typeof value === "string" && DUELL_TOPIC_SLUGS.includes(value) ? value : null;
}
