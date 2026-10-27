const safeBreedId = value => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);

// Existing editorial links only: no breed-name inference or new health claims.
const knowledgeAssignments = [
  { breedId: "labrador", name: "Labrador Retriever", courseId: "wissen-labrador-dnm1-eic-testgrenzen-2026", lessonId: "dnm1-befund-und-beobachtung" },
  { breedId: "weimaraner", name: "Weimaraner", courseId: "wissen-weimaraner-slc2a9-huu-testgrenzen-2026", lessonId: "huu-veranlagung-und-steinbefund" },
];

export function getDogBreedKnowledgeAssignment(breedId) {
  if (typeof breedId !== "string") return null;
  const assignment = knowledgeAssignments.find(item => item.breedId === breedId);
  return assignment ? { ...assignment } : null;
}

export function getCourseBreedLink(courseId, lessonId) {
  if (typeof courseId !== "string" || typeof lessonId !== "string") return null;
  const assignment = knowledgeAssignments.find(item => item.courseId === courseId && item.lessonId === lessonId);
  return assignment ? {
    breedId: assignment.breedId,
    name: assignment.name,
    href: dogBreedProfileHref(assignment.breedId, `gesundheit-${assignment.lessonId}`),
  } : null;
}

export function dogBreedProfileHref(id, topic = "rasse-erkennen") {
  if (!safeBreedId(id)) return "/lernen/jagdhunde";
  const fragment = typeof topic === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(topic) ? `#${topic}` : "";
  return `/lernen/jagdhunde/${encodeURIComponent(id)}${fragment}`;
}

export function legacyDogBreedTarget(query = {}, profiles = []) {
  if (!safeBreedId(query.rasse)) return "/lernen/jagdhunde";
  const profile = profiles.find(profile => profile.id === query.rasse);
  return profile ? dogBreedProfileHref(profile.id) : "/lernen/jagdhunde";
}
