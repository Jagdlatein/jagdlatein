import { learningModules, learningPaths } from "./learning-curriculum";
import { getLearningCategory, learningCategoryDetails } from "./learning-categories";
import { learningExperiences } from "./learning-experiences";
import { learningFeaturedMedia } from "./learning-featured-media";
import { learningTools, legalLearningHubs } from "./learning-tool-catalog";
import { getLearningMedia } from "./learning-media";
import { practiceHighlights } from "./practice-catalog";

const coverFields = ["src", "width", "height", "fit", "objectPosition", "credit", "creditUrl", "licenseUrl", "categoryCover"];

// Cards use one photo and its credit. Galleries, diagrams and provenance records stay
// on the server; repeated category covers are transferred only once per overview.
function coverSummary(media) {
  return media ? { ...Object.fromEntries(coverFields.filter(field => media[field] !== undefined).map(field => [field, media[field]])), ...(media.modifications ? { modifications: true } : {}) } : null;
}

// Overview pages need summaries; lesson text and answer keys stay in the course pages.
export function getLearningOverviewData(categorySlug) {
  const categoryInfo = categorySlug ? getLearningCategory(categorySlug) : null;
  if (categorySlug && !categoryInfo) return null;
  const selected = (categoryInfo ? learningModules.filter(module => module.category === categoryInfo.title) : [...learningModules])
    .sort((left, right) => (right.contentAddedOn || "").localeCompare(left.contentAddedOn || ""));
  const covers = [], coverIndexes = new Map();
  const addCover = module => {
    const cover = coverSummary(getLearningMedia(module));
    if (!cover) return null;
    const key = JSON.stringify(cover);
    if (!coverIndexes.has(key)) { coverIndexes.set(key, covers.length); covers.push(cover); }
    return coverIndexes.get(key);
  };
  const modules = selected.map(module => ({
    id: module.id, title: module.title, description: module.description,
    category: module.category, countries: module.countries, minutes: module.minutes, level: module.level,
    ...(module.contentAddedOn ? { contentAddedOn: module.contentAddedOn } : {}),
    lessonCount: module.lessons.length, questionCount: module.questions.length,
    coverIndex: addCover({ id: module.id, category: module.category }),
  }));
  const categoryCovers = categoryInfo ? {} : Object.fromEntries(learningCategoryDetails.map(category => [category.slug, addCover({ category: category.title })]));
  const moduleIds = new Set(modules.map(module => module.id));
  const paths = learningPaths.filter(path => !categoryInfo || path.advanced)
    .map(path => ({ ...path, moduleIds: path.moduleIds.filter(id => moduleIds.has(id)) }))
    .filter(path => path.moduleIds.length);
  const resources = categoryInfo ? [...practiceHighlights, ...learningExperiences, ...learningTools, ...(categoryInfo.slug === "jagdrecht" ? legalLearningHubs : [])]
    .filter(tool => tool.categories.includes(categoryInfo.slug))
    .filter((tool, index, all) => all.findIndex(item => item.href === tool.href) === index)
    .map(({ href, icon, title, description, featured }) => ({ href, icon, title, description, ...(featured ? { featured: true } : {}) })) : [];
  const categoryCounts = Object.fromEntries(learningModules.map(module => [module.category, 0]));
  for (const module of learningModules) categoryCounts[module.category] += 1;
  return {
    categoryInfo, modules, paths, categoryCounts, covers, categoryCovers, resources,
    featuredMedia: categoryInfo ? Object.fromEntries(learningExperiences
      .filter(tool => tool.featured && tool.categories.includes(categoryInfo.slug))
      .map(tool => [tool.href, learningFeaturedMedia[tool.href]])) : {},
    counts: { modules: modules.length, lessons: selected.reduce((sum, module) => sum + module.lessons.length, 0), questions: selected.reduce((sum, module) => sum + module.questions.length, 0) },
  };
}
