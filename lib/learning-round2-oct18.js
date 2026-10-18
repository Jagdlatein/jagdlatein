import biology from "../data/learning-round2-biology-2026-10-18.json";
import habitat from "../data/learning-round2-habitat-2026-10-18.json";
import dogsPractice from "../data/learning-round2-dogs-practice-2026-10-18.json";
import { prepareReviewedEvidenceModules } from "./learning-evidence";

export const round2ExpansionDatasets = [biology, habitat, dogsPractice];
const prepared = prepareReviewedEvidenceModules(round2ExpansionDatasets);
// Keep the newest overview varied while retaining each course's real review date.
export const round2ExpansionModules = [0, 2, 4, 1, 3, 5].map(index => prepared[index]);
