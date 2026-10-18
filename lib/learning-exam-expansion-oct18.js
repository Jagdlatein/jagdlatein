import biology from "../data/learning-exam-biology-2026-10-18.json";
import forest from "../data/learning-exam-forest-2026-10-18.json";
import habitat from "../data/learning-exam-habitat-2026-10-18.json";
import { prepareEvidenceModules } from "./learning-evidence";

export const examExpansionDatasets = [biology, forest, habitat];
export const examExpansionModules = prepareEvidenceModules(examExpansionDatasets).map(module => ({
  ...module,
  sourceReview: {
    ...(module.sourceReview || {}),
    scope: module.sourceReview?.scope || "Quellenabgleich ausschließlich dieser vier neuen Lektionen; Aussagen und Geltungsgrenzen sind den jeweiligen Fachquellen zugeordnet.",
    lessons: module.lessons.map(lesson => ({ lesson: lesson.title, confirmedClaims: lesson.evidence.map(item => item.claim), standardOnly: [] })),
  },
}));
