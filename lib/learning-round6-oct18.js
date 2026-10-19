import biology from "../data/learning-round6-biology-2026-10-18.json";
import habitat from "../data/learning-round6-habitat-2026-10-18.json";
import practice from "../data/learning-round6-practice-2026-10-18.json";
import { prepareReviewedEvidenceModules } from "./learning-evidence";

export const round6ExpansionDatasets = [biology, habitat, practice];
const prepared = prepareReviewedEvidenceModules(round6ExpansionDatasets);
export const round6ExpansionModules = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11].map(index => prepared[index]);
