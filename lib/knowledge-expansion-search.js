import { wildYearSearchEntries } from "./wild-year";
import { wildDetailSearchEntries } from "./wild-detail-atlas";
import { huntingDogVideoSearchEntries } from "./hunting-dog-video-lessons";
import { venisonCutSearchEntries } from "./venison-cut-guide";
import { revierLifeSearchEntries } from "./small-revier-life";
import { researchSearchEntries } from "./research-understanding";
import { getLearningCategoryByTitle } from "./learning-categories";

export const knowledgeExpansionSearchEntries = [...wildYearSearchEntries, ...wildDetailSearchEntries, ...huntingDogVideoSearchEntries, ...venisonCutSearchEntries, ...revierLifeSearchEntries, ...researchSearchEntries].map(entry => ({
  ...entry,
  categories: entry.categories || [entry.categorySlug || getLearningCategoryByTitle(entry.category)?.slug || "wildkunde"],
  aliases: entry.aliases || entry.keywords || [],
  text: entry.text || [entry.description, ...(entry.keywords || [])].join(" "),
}));
