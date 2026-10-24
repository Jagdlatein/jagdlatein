import dogs from "../data/learning-growth-dogs-2026-10-18.json";
import wildlife from "../data/learning-growth-wildlife-2026-10-18.json";
import field from "../data/learning-growth-field-2026-10-18.json";
import dogGenetics from "../data/learning-dog-genetics-2026-10-24.json";
import redDeerVoice from "../data/learning-red-deer-voice-2026-10-24.json";
import { prepareEvidenceModules, prepareReviewedEvidenceModules } from "./learning-evidence";

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

// A separately dated addition; the historical October 18 courses keep their dates.
export const dogGeneticsModules = prepareReviewedEvidenceModules([dogGenetics]);
export const redDeerVoiceModules = prepareReviewedEvidenceModules([redDeerVoice]);
