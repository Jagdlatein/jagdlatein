// Small client-safe URL contract. No catalog, question or answer bank imports.
import { lessonHash } from "./learning-lesson-navigation";

export function quizFeedbackLearningHref(value) {
  if (typeof value !== "string" || value.length > 400 || value.trim() !== value) return null;
  const match = /^\/kurse\/([a-z0-9-]+)(#lesson-([^?#]+))?$/.exec(value);
  if (!match) return null;
  if (!match[2]) return value;
  let lessonId;
  try { lessonId = decodeURIComponent(match[3]); } catch { return null; }
  if (!/^[\p{L}\p{N}][\p{L}\p{N}-]{0,159}$/u.test(lessonId) || match[2] !== lessonHash(lessonId)) return null;
  return value;
}
