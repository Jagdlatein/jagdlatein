import { getLearningCategory } from "./learning-categories";

const goalId = value => typeof value === "string" && /^[a-z][a-z0-9-]{1,160}$/.test(value);
const queryKey = value => JSON.stringify(Object.keys(value).sort().map(key => [key, Array.isArray(value[key]) ? value[key] : [value[key]]]));
const urlQuery = params => Object.fromEntries([...new Set(params.keys())].map(key => [key, params.getAll(key)]));

export function examPlanRouteIsReady(router) {
  if (router.isReady !== true) return false;
  // SSR has no browser address. Actual browser views must agree before any
  // selected task is displayed; partial router commits cannot borrow a task.
  if (typeof window === "undefined" || !window.location) return true;
  try {
    if (typeof router.asPath !== "string" || !router.asPath.startsWith("/") || router.asPath.startsWith("//")) return false;
    const route = new URL(router.asPath, "https://jagdlatein.invalid"), browser = new URL(window.location.href);
    return route.pathname === "/lernen/pruefungsplan" && browser.pathname === route.pathname && browser.hash === route.hash
      && queryKey(router.query) === queryKey(urlQuery(route.searchParams)) && queryKey(router.query) === queryKey(urlQuery(browser.searchParams));
  } catch { return false; }
}

// Public reading selection only. This never looks up a profile, mark or answer.
export function getExamGoalOptions(blueprint, categories, topic) {
  if (!Array.isArray(blueprint?.categories) || !Array.isArray(categories)) return [];
  const allowed = new Set(categories.map(category => category.slug)), seen = new Set(), groups = new Set(), result = [];
  for (const category of blueprint.categories) {
    if (!allowed.has(category?.slug) || groups.has(category.slug) || !Array.isArray(category.goals)) return [];
    groups.add(category.slug);
    for (const goal of category.goals) {
      if (!goalId(goal?.id) || typeof goal.title !== "string" || !goal.title.trim() || seen.has(goal.id)) return [];
      seen.add(goal.id);
      result.push({ id: goal.id, title: goal.title, categorySlug: category.slug });
    }
  }
  return topic === "alle" ? result : result.filter(goal => goal.categorySlug === topic);
}

export function readExamGoalFocus(value, choices) {
  if (value === undefined || value === "alle") return "alle";
  return goalId(value) && choices.some(goal => goal.id === value) ? value : null;
}

export function examPlanGoalHref(category, id) {
  if (!getLearningCategory(category) || !goalId(id)) return null;
  return `/lernen/pruefungsplan?kategorie=${encodeURIComponent(category)}&lernziel=${encodeURIComponent(id)}#exam-plan-learning`;
}
