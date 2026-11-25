import { parasiteSources } from "./parasite-learning";

// Only the six appended answer comparisons were checked on this date.
// Original fact/source records and their October review dates stay unchanged.
export const parasiteChoiceCheckedOn = "2026-11-25";
const extraSources = {
  cdcFluke: {
    title: "CDC DPDx · Fascioliasis, Life Cycle und Hosts",
    url: "https://www.cdc.gov/dpdx/fascioliasis/index.html",
    organization: "Centers for Disease Control and Prevention",
  },
};
const comparisonSources = {
  "trich-stadium": ["bfrTrich", "cdcTrich", "blvTrich"],
  "trich-foto": ["blvTrich", "bfrTrich", "cdcTrich"],
  "echino-rollen": ["fli", "uzhEchino", "blvEchino"],
  "echino-ei": ["fli", "uzhEchino", "meduniFluke", "cdcFluke"],
  "fasciola-schnecke-frage": ["meduniFluke", "cdcFluke"],
  "fasciola-infektioes": ["meduniFluke", "cdcFluke"],
};
export function getParasiteChoiceSources(questionId) {
  if (typeof questionId !== "string" || !Object.hasOwn(comparisonSources, questionId)) return [];
  return comparisonSources[questionId].map(id => {
    const source = extraSources[id] || parasiteSources[id];
    return { title: source.title, url: source.url, organization: source.organization };
  });
}
