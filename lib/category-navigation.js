import { learningCategoryDetails } from "./learning-categories";

const categoryPaths = new Set(learningCategoryDetails.map(category => `/lernen/${category.slug}`));

// Only category choices reset the overview. Search typing, hash destinations,
// local accordions and ordinary course lessons keep their own navigation.
export function getCategoryNavigationKey(path) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
  let url;
  try { url = new URL(path, "https://jagdlatein.local"); } catch { return null; }
  const isLearningCategory = categoryPaths.has(url.pathname);
  const isLawCategory = /^\/jagdrecht(?:\/(?:ch|de|at))?$/.test(url.pathname);
  if (!isLearningCategory && !isLawCategory) return null;
  const fields = isLearningCategory ? ["bereich", "kurs"] : ["region", "thema", "artikel", "ansicht"];
  return JSON.stringify([url.pathname, ...fields.map(field => url.searchParams.getAll(field))]);
}
