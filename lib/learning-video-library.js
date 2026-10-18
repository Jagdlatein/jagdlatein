import { wildlifeVideoCases } from "./wildlife-video-cases";
import { huntingDogVideoLessons } from "./hunting-dog-video-lessons";

// Server-prepared discovery only. Questions, answer keys and media players stay
// in their existing lesson pages; opening this directory downloads no video.
export function getLearningVideoLibrary() {
  return [
    ...wildlifeVideoCases.map(item => ({
      id: `wild-${item.id}`, group: "wild", title: item.title,
      subject: item.species, duration: item.duration, tags: item.tags,
      href: `/lernen/wildtier-videofaelle?eintrag=${encodeURIComponent(item.id)}#video-fall`,
    })),
    ...huntingDogVideoLessons.map(item => ({
      id: `hund-${item.id}`, group: "hund", title: item.title,
      subject: item.breed, duration: item.duration, tags: item.tags,
      href: `/lernen/jagdhund-videos?eintrag=${encodeURIComponent(item.id)}#hundevideo-film`,
    })),
  ];
}
