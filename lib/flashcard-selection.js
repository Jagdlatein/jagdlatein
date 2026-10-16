// Route selection only. No catalog, browser storage or account data imports.
const ID = /^[a-z][a-z0-9-]{1,159}$/;
function value(query, key) {
  if (typeof query?.getAll === "function") {
    const values = query.getAll(key);
    return values.length > 1 ? values : values[0];
  }
  return query?.[key];
}
export function readFlashcardSelection(query = {}) {
  const course = value(query, "kurs");
  const lesson = value(query, "lektion");
  if (course === undefined && lesson === undefined) return null;
  if (typeof course !== "string" || !ID.test(course)
    || lesson !== undefined && (typeof lesson !== "string" || !ID.test(lesson))) return { invalid: true };
  return { courseId: course, lessonId: lesson || "" };
}
export function flashcardSelectionQuery(selection) {
  return selection?.courseId && !selection.invalid
    ? { kurs: selection.courseId, ...(selection.lessonId ? { lektion: selection.lessonId } : {}) } : {};
}
export function matchesFlashcardSelection(card, selection) {
  return !selection || !selection.invalid && card.moduleId === selection.courseId
    && (!selection.lessonId || card.lessonId === selection.lessonId);
}
