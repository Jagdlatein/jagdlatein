import { digestiveSources } from "./digestive-learning";

// This date covers only the four newly appended answer comparisons.
// The existing lesson/source records keep their original review dates.
export const digestiveChoiceCheckedOn = "2026-11-25";
const extraSources = {
  minnesotaHtml: {
    title: "Erin Malone · Digestion Overview, Monogastrics Anatomy",
    url: "https://open.lib.umn.edu/vetphysioapplied/chapter/overview/",
    organization: "University of Minnesota",
  },
};
const comparisonSources = {
  "wiederkaeuer-kammern": ["bzl", "luzern"],
  "wiederkaeuer-helfer": ["bzl", "vetMicrobes"],
  "schwein-pansen": ["uzhPig", "thuenenPig"],
  "schwein-mikroben": ["thuenenPig", "minnesotaHtml"],
};
export function getDigestiveChoiceSources(questionId) {
  if (typeof questionId !== "string" || !Object.hasOwn(comparisonSources, questionId)) return [];
  return comparisonSources[questionId].map(id => {
    const source = extraSources[id] || digestiveSources[id];
    return { title: source.title, url: source.url, organization: source.organization };
  });
}
