function normalizeSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
}

function savedAt(entry) {
  if (typeof entry?.updated_at !== "string") return -Infinity;
  const value = Date.parse(entry.updated_at);
  return Number.isFinite(value) ? value : -Infinity;
}

function progressRow(course, entry) {
  const status = ["completed", "in_progress"].includes(entry?.status) ? entry.status : "open";
  const currentTotal = Number.isInteger(course.totalQuestions) && course.totalQuestions > 0 ? course.totalQuestions : null;
  if (!entry) return { course, entry: null, status, answered: 0, total: currentTotal,
    percent: currentTotal === null ? null : 0, bestScore: null, bestPercent: null };

  const validCounts = status !== "open" && Number.isInteger(entry.total_questions) && entry.total_questions > 0
    && Number.isInteger(entry.answered_questions) && entry.answered_questions >= 0 && entry.answered_questions <= entry.total_questions
    && (status !== "completed" || entry.answered_questions === entry.total_questions);
  const total = validCounts ? entry.total_questions : null;
  const answered = validCounts ? entry.answered_questions : null;
  const validBest = status === "completed" && validCounts && Number.isInteger(entry.best_score)
    && entry.best_score >= 0 && entry.best_score <= total;
  return { course, entry, status, answered, total,
    percent: validCounts ? Math.round(answered / total * 100) : null,
    bestScore: validBest ? entry.best_score : null,
    bestPercent: validBest ? Math.round(entry.best_score / total * 100) : null };
}

// These counts describe saved quiz answers. They do not measure lessons read,
// knowledge mastered, or the position of a newly opened practice round.
export function getMyCoursesView(catalog, progress, { query = "", category = "all", status = "all", sort = "recent" } = {}) {
  const knownCourses = [...new Map((Array.isArray(catalog) ? catalog : [])
    .filter(course => course && typeof course.id === "string" && course.id)
    .map(course => [course.id, course])).values()];
  const knownIds = new Set(knownCourses.map(course => course.id));
  const byCourse = new Map();
  for (const entry of Array.isArray(progress) ? progress : []) {
    if (!entry || !knownIds.has(entry.course_id)) continue;
    const previous = byCourse.get(entry.course_id);
    if (!previous || savedAt(entry) > savedAt(previous)) byCourse.set(entry.course_id, entry);
  }
  const allRows = knownCourses.map(course => progressRow(course, byCourse.get(course.id)));
  const metrics = { total: allRows.length, completed: 0, in_progress: 0, open: 0 };
  for (const row of allRows) metrics[row.status]++;
  const categories = [...new Map(knownCourses.filter(course => typeof course.categorySlug === "string" && course.categorySlug
      && typeof course.categoryTitle === "string" && course.categoryTitle)
    .map(course => [course.categorySlug, { slug: course.categorySlug, title: course.categoryTitle }])).values()]
    .sort((left, right) => left.title.localeCompare(right.title, "de"));
  const terms = normalizeSearch(String(query || "").trim().slice(0, 160)).split(/\s+/).filter(Boolean);
  const order = new Map(knownCourses.map((course, index) => [course.id, index]));
  const rows = allRows.filter(row => (category === "all" || row.course.categorySlug === category)
    && (status === "all" || row.status === status)
    && terms.every(term => normalizeSearch([row.course.title, row.course.description, row.course.categoryTitle, row.course.categorySlug].join(" ")).includes(term)));
  rows.sort((left, right) => {
    const primary = sort === "title" ? String(left.course.title).localeCompare(String(right.course.title), "de")
      : savedAt(right.entry) - savedAt(left.entry);
    return (Number.isNaN(primary) ? 0 : primary) || order.get(left.course.id) - order.get(right.course.id);
  });
  return { rows, metrics, categories };
}
