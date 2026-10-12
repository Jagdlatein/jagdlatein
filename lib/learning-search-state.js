import { learningCategoryDetails } from "./learning-categories";

export const learningSearchTypes = { course: "Kurse", tool: "Lernwerkzeuge", entry: "Einzelne Lerninhalte", species: "Wildarten", practice: "Praxisübungen", glossary: "Fachbegriffe" };
const categoryIds = new Set(["all", ...learningCategoryDetails.map(item => item.slug)]);
const ownedParams = ["q", "searchCategory", "type", "country", "page"];

export function defaultLearningSearch(category = "all") {
  return { query: "", category: categoryIds.has(category) ? category : "all", type: "all", country: "all", page: 1 };
}

export function normalizeLearningSearch(value = {}, initialCategory = "all") {
  const defaults = defaultLearningSearch(initialCategory);
  const query = typeof value.query === "string" ? value.query.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 160) : "";
  const category = categoryIds.has(value.category) ? value.category : defaults.category;
  const type = Object.hasOwn(learningSearchTypes, value.type) ? value.type : "all";
  const country = category === "jagdrecht" && ["DE", "AT", "CH"].includes(value.country) ? value.country : "all";
  const page = Number.isInteger(value.page) && value.page > 0 && value.page <= 1000 ? value.page : 1;
  return { query, category, type, country, page };
}

function localURL(asPath) {
  const path = typeof asPath === "string" && asPath.startsWith("/") && !asPath.startsWith("//")
    && !/[\\\u0000-\u001f\u007f]/.test(asPath) ? asPath : "/lernen";
  return new URL(path, "https://jagdlatein.invalid");
}

export function readLearningSearchURL(asPath, initialCategory = "all") {
  const params = localURL(asPath).searchParams;
  const page = params.get("page");
  return normalizeLearningSearch({ query: params.get("q"), category: params.get("searchCategory"),
    type: params.get("type"), country: params.get("country"), page: /^\d{1,4}$/.test(page || "") ? Number(page) : 1 }, initialCategory);
}

export function learningSearchActive(state, initialCategory = "all") {
  return Boolean(state.query.trim() || state.type !== "all" || state.category !== defaultLearningSearch(initialCategory).category || state.country !== "all");
}

export function sameLearningSearch(left, right) {
  return ["query", "category", "type", "country", "page"].every(key => left[key] === right[key]);
}

export function learningSearchURL(asPath, value, initialCategory = "all") {
  const url = localURL(asPath), state = normalizeLearningSearch(value, initialCategory);
  ownedParams.forEach(key => url.searchParams.delete(key));
  if (state.query) url.searchParams.set("q", state.query);
  if (state.category !== defaultLearningSearch(initialCategory).category) url.searchParams.set("searchCategory", state.category);
  if (state.type !== "all") url.searchParams.set("type", state.type);
  if (state.country !== "all") url.searchParams.set("country", state.country);
  if (state.page > 1 && learningSearchActive(state, initialCategory)) url.searchParams.set("page", String(state.page));
  return url.pathname + url.search + url.hash;
}

export function canonicalLearningSearchURL(asPath) {
  const url = localURL(asPath);
  url.searchParams.sort();
  const search = url.searchParams.toString();
  return url.pathname + (search ? `?${search}` : "") + url.hash;
}
