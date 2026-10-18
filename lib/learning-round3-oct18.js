import biology from "../data/learning-round3-biology-2026-10-18.json";
import habitat from "../data/learning-round3-habitat-2026-10-18.json";
import practice from "../data/learning-round3-practice-2026-10-18.json";
import { prepareReviewedEvidenceModules } from "./learning-evidence";

export const round3ExpansionDatasets = [biology, habitat, practice];
const prepared = prepareReviewedEvidenceModules(round3ExpansionDatasets);
// Varied new subjects share their actual review date; no invented recency.
export const round3ExpansionModules = [0, 2, 4, 1, 3, 5].map(index => prepared[index]);
