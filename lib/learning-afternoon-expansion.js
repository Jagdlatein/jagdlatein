import expansion from "../data/learning-expansion-afternoon-2026-10-16.json";

// Keep the editorial claim-to-source mapping with its lesson. These checks verify
// references, not the scientific interpretation of the cited material.
export const afternoonModules = expansion.modules.map(module => {
  const sourceByUrl = new Map(module.sources.map(source => [source.url, source]));
  const lessons = module.lessons.map(lesson => {
    const evidence = expansion.evidence.find(item => item.moduleId === module.id && item.lessonId === lesson.id);
    if (!evidence?.claims?.length) throw new Error(`Missing lesson evidence: ${module.id}/${lesson.id}`);
    return { ...lesson, evidence: evidence.claims.map(item => {
      if (!item.claim || new Set(item.sourceUrls).size < 2 || item.sourceUrls.some(url => !sourceByUrl.has(url))) throw new Error(`Invalid lesson evidence: ${module.id}/${lesson.id}`);
      return { claim: item.claim, sources: item.sourceUrls.map(url => ({ label: sourceByUrl.get(url).label, url })) };
    }) };
  });
  return { ...module, reviewedOn: expansion.reviewedOn, contentAddedOn: expansion.reviewedOn, lessons };
});
