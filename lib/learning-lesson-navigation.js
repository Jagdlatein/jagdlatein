export function lessonHash(id) {
  return `#lesson-${encodeURIComponent(id)}`;
}

export function lessonIndexFromHash(lessons, hash) {
  if (typeof hash !== "string" || !hash.startsWith("#lesson-")) return -1;
  try {
    const id = decodeURIComponent(hash.slice(8));
    return lessons.findIndex(lesson => lesson.id === id);
  } catch {
    return -1;
  }
}
