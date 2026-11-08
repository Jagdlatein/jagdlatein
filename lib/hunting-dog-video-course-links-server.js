import { huntingDogVideoLessons } from "./hunting-dog-video-lessons";
import { learningVideoLinks } from "./learning-video-links";
import { learningModules } from "./learning-curriculum";
import { videoLibraryCourseHref } from "./learning-video-library";

// Build-time projection of existing authored relations only. The player gets
// small labels and exact destinations, never a curriculum or an answer bank.
export function getHuntingDogVideoCourseLinks() {
  return Object.fromEntries(huntingDogVideoLessons.map(lesson => {
    const authored = learningVideoLinks.find(link => link.kind === "hund" && link.id === lesson.id);
    const ids = [...new Set(authored?.moduleIds || [])];
    const links = ids.flatMap(id => {
      const matches = learningModules.filter(module => module.id === id);
      if (matches.length !== 1 || !Array.isArray(matches[0].lessons) || matches[0].lessons.length === 0) return [];
      const module = matches[0];
      return [{ id: module.id, title: module.title, href: videoLibraryCourseHref(lesson, module) }];
    });
    return [lesson.id, links];
  }));
}
