import { wildlifeVideoCases } from "./wildlife-video-cases";
import { huntingDogVideoLessons } from "./hunting-dog-video-lessons";
import { learningVideoLinks } from "./learning-video-links";
import { learningModules } from "./learning-curriculum";
import { getLearningVideoDiscovery } from "./learning-video-discovery";

// Preserve an authored primary lesson target only when that exact course owns
// one matching lesson. Secondary courses keep their own course entry point.
export function videoLibraryCourseHref(item, module) {
  const base = `/kurse/${module.id}`;
  const prefix = `${base}#lesson-`;
  if (typeof item?.course !== "string" || !item.course.startsWith(prefix)) return base;
  let id;
  try { id = decodeURIComponent(item.course.slice(prefix.length)); } catch { return base; }
  return module.lessons.filter(lesson => lesson.id === id).length === 1
    ? `${base}#lesson-${encodeURIComponent(id)}` : base;
}

function summary(item, group) {
  const link = learningVideoLinks.find(entry => entry.kind === group && entry.id === item.id);
  const observation = item.observations?.[0];
  const credit = group === "wild" ? item : item.media;
  const discovery = getLearningVideoDiscovery(item.id);
  return {
    id: `${group}-${item.id}`, group, title: item.title,
    subject: group === "wild" ? item.species : item.breed,
    duration: item.duration, tags: item.tags, poster: item.poster,
    credit: { author: credit.author, license: credit.license, licenseUrl: credit.licenseUrl, source: credit.source },
    focus: discovery?.focus || (typeof observation === "string" ? observation : observation?.text) || item.title,
    concepts: discovery?.concepts || [],
    courses: (link?.moduleIds || []).map(id => learningModules.find(module => module.id === id))
      .filter(Boolean).map(module => ({ title: module.title, href: videoLibraryCourseHref(item, module) })),
    href: link?.href || (group === "wild"
      ? `/lernen/wildtier-videofaelle?eintrag=${encodeURIComponent(item.id)}#video-fall`
      : `/lernen/jagdhund-videos?eintrag=${encodeURIComponent(item.id)}#hundevideo-film`),
  };
}

// Server-prepared discovery only. Questions, answer keys and media players stay
// in their existing lesson pages; opening this directory downloads no video.
export function getLearningVideoLibrary() {
  return [
    ...wildlifeVideoCases.map(item => summary(item, "wild")),
    ...huntingDogVideoLessons.map(item => summary(item, "hund")),
  ];
}
