import { learningCategoryDetails } from "./learning-categories";

const ROUTE = "/kurse", BASE = "https://jagdlatein.invalid";
const formats = new Set(["all", "mini", "detailed"]);
const categories = new Set(["all", ...learningCategoryDetails.map(category => category.slug)]);
function field(query, key) {
  if (typeof query?.getAll === "function") {
    const values = query.getAll(key);
    return { present: values.length > 0, valid: values.length <= 1, value: values[0] };
  }
  const present = Object.prototype.hasOwnProperty.call(query || {}, key), value = query?.[key];
  return { present, valid: !present || typeof value === "string", value };
}

export function readCourseDirectorySelection(query = {}) {
  const category = field(query, "kategorie"), format = field(query, "format");
  const categoryValid = category.valid && (!category.present || categories.has(category.value));
  const formatValid = format.valid && (!format.present || formats.has(format.value));
  return { valid: categoryValid && formatValid, category: categoryValid && category.present ? category.value : null, format: formatValid ? format.value || "all" : null };
}

function queryIdentity(query) {
  if (typeof query?.getAll === "function") return [...new Set(query.keys())].sort().map(key => {
    const values = query.getAll(key); return [key, values.length > 1, values];
  });
  return Object.entries(query || {}).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, value]) => [key, Array.isArray(value), Array.isArray(value) ? value : [value]]);
}
function localURL(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try { return new URL(value, BASE); } catch { return null; }
}
function browserAddress() {
  const location = typeof window === "undefined" ? null : window.location;
  return typeof location?.pathname === "string" ? `${location.pathname}${location.search || ""}${location.hash || ""}` : null;
}

export function courseDirectoryRoute(router = {}) {
  const url = localURL(router.asPath), query = router.query, browser = browserAddress();
  const identity = queryIdentity(query), selection = readCourseDirectorySelection(query);
  const ready = router.isReady === true && Boolean(url && url.pathname === ROUTE && query && typeof query === "object" && !Array.isArray(query)
    && JSON.stringify(identity) === JSON.stringify(queryIdentity(url.searchParams)) && (browser === null || browser === router.asPath));
  return { ready, selection, origin: JSON.stringify([router.isReady === true, router.asPath, identity, browser]), scope: { path: router.asPath, query: JSON.stringify(identity), browser } };
}

// A focus-only marker can outlive an action's permission while Next commits the
// source/target router and browser views in separate phases. It grants no action.
export function courseDirectoryFocusIntent(router, target) {
  const source = courseDirectoryRoute(router), url = localURL(target);
  if (!source.ready || !url || url.pathname !== ROUTE) return null;
  return { source: source.scope, target: { path: target, query: JSON.stringify(queryIdentity(url.searchParams)), browser: source.scope.browser === null ? null : target } };
}

export function courseDirectoryTarget(router, category, format) {
  if (!courseDirectoryRoute(router).ready || category !== null && !categories.has(category) || format !== null && !formats.has(format)) return null;
  const url = localURL(router.asPath);
  url.searchParams.delete("kategorie"); url.searchParams.delete("format");
  if (category !== null) url.searchParams.set("kategorie", category);
  if (format !== null) url.searchParams.set("format", format);
  url.hash = "course-directory-top";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function courseDirectoryCourses(courses, selection) {
  if (!selection?.valid || !categories.has(selection.category) || !formats.has(selection.format) || !Array.isArray(courses)) return [];
  return courses.filter(course => (selection.category === "all" || course.category === selection.category) && (selection.format === "all" || course.format === selection.format));
}
