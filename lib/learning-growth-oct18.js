import dogs from "../data/learning-growth-dogs-2026-10-18.json";
import wildlife from "../data/learning-growth-wildlife-2026-10-18.json";
import field from "../data/learning-growth-field-2026-10-18.json";
import { prepareEvidenceModules } from "./learning-evidence";

export const october18GrowthModules = prepareEvidenceModules([dogs, wildlife, field]).map(module => ({
  ...module,
  sourceReview: {
    ...(module.sourceReview || {}),
    scope: module.sourceReview?.scope || "Quellenabgleich ausschließlich dieser drei neuen Lektionen; eigene Beispiele und Originalbefunde bleiben getrennt.",
    lessons: module.lessons.map(lesson => ({
      lesson: lesson.title,
      confirmedClaims: lesson.evidence.map(item => item.claim),
      standardOnly: [],
    })),
  },
}));
