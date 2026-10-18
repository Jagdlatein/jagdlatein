// Keep editorial evidence with the lesson it actually supports.
// Structural checks do not certify the scientific correctness of a claim.
export function prepareEvidenceModules(datasets) {
  return datasets.flatMap(dataset => dataset.modules.map(module => {
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
    return { ...module, reviewedOn: dataset.reviewedOn, contentAddedOn: dataset.reviewedOn, flashcardExpansion: true, showCategoryDiagram: false, lessons };
  }));
}

// Source-review display follows the same claim-level evidence as the lesson.
// This adds no review date and does not widen the author's documented scope.
export function prepareReviewedEvidenceModules(datasets) {
  return prepareEvidenceModules(datasets).map(module => ({
    ...module,
    sourceReview: {
      ...(module.sourceReview || {}),
      scope: module.sourceReview?.scope || "Quellenabgleich ausschließlich dieser neuen Lektionen; Aussagen und Geltungsgrenzen sind den jeweiligen Fachquellen zugeordnet.",
      lessons: module.lessons.map(lesson => ({ lesson: lesson.title, confirmedClaims: lesson.evidence.map(item => item.claim), standardOnly: [] })),
    },
  }));
}
