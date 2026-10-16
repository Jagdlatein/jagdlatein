import wildlife from "../data/learning-expansion-wildlife-dogs-2026-10-16.json";
import nature from "../data/learning-expansion-nature-equipment-2026-10-16.json";
import practice from "../data/learning-expansion-practice-health-2026-10-16.json";

// Editorial evidence stays attached to its actual lesson and original scope.
// Structural validation is not a scientific certificate or a whole-app review.
export const knowledgeGrowthDatasets = [wildlife, nature, practice];
export const knowledgeGrowthModules = knowledgeGrowthDatasets.flatMap(dataset => dataset.modules.map(module => {
  const sourceByUrl = new Map(module.sources.map(source => [source.url, source]));
  const lessons = module.lessons.map(lesson => {
    const record = dataset.evidence.find(item => item.moduleId === module.id && item.lessonId === lesson.id);
    if (!record?.claims?.length) throw new Error(`Fehlende Quellenzuordnung: ${module.id}/${lesson.id}`);
    const evidence = record.claims.map(item => {
      if (!item.claim || new Set(item.sourceUrls).size < 2 || item.sourceUrls.some(url => !sourceByUrl.has(url))) throw new Error(`Ungültige Quellenzuordnung: ${module.id}/${lesson.id}`);
      return { claim: item.claim, sources: item.sourceUrls.map(url => ({ label: sourceByUrl.get(url).label, url })) };
    });
    return { ...lesson, evidence };
  });
  return { ...module, reviewedOn: dataset.reviewedOn, contentAddedOn: dataset.reviewedOn, flashcardExpansion: true, lessons };
}));
