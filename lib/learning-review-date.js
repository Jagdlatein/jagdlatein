// Editorial dates describe a real review. Never manufacture a current date or
// accept Date's rollover of impossible calendar days such as 2026-02-30.
export function isLearningReviewDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value;
}

export function getLessonReviewDate(lesson, courseReviewedOn) {
  if (isLearningReviewDate(lesson?.reviewedOn)) return lesson.reviewedOn;
  return isLearningReviewDate(courseReviewedOn) ? courseReviewedOn : "";
}
