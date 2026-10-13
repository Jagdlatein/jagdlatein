import { wildYearSearchEntries } from "./wild-year";
import { wildDetailSearchEntries } from "./wild-detail-atlas";
import { huntingDogVideoSearchEntries } from "./hunting-dog-video-lessons";
import { venisonCutSearchEntries } from "./venison-cut-guide";
import { revierLifeSearchEntries } from "./small-revier-life";
import { researchSearchEntries } from "./research-understanding";
import { digestiveSearchEntries } from "./digestive-learning";
import { parasiteSearchEntries } from "./parasite-learning";
import { foodwebSearchEntries } from "./foodweb-learning";
import { wildMovementSearchEntries } from "./wild-movement";
import { developmentSearchEntries } from "./development-photo-series";
import { communityWeeklyCaseSearchEntries } from "./community-weekly-case";
import { getLearningCategoryByTitle } from "./learning-categories";

export const knowledgeExpansionSearchEntries = [...wildYearSearchEntries, ...wildDetailSearchEntries, ...huntingDogVideoSearchEntries, ...venisonCutSearchEntries, ...revierLifeSearchEntries, ...researchSearchEntries, ...digestiveSearchEntries, ...parasiteSearchEntries, ...foodwebSearchEntries, ...wildMovementSearchEntries, ...developmentSearchEntries, ...communityWeeklyCaseSearchEntries].map(entry => ({
  ...entry,
  categories: entry.categories || [entry.categorySlug || getLearningCategoryByTitle(entry.category)?.slug || "wildkunde"],
  aliases: entry.aliases || entry.keywords || [],
  text: entry.text || [entry.description, ...(entry.keywords || [])].join(" "),
}));
