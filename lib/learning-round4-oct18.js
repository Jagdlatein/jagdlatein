import biology from "../data/learning-round4-biology-2026-10-18.json";
import habitat from "../data/learning-round4-habitat-2026-10-18.json";
import practice from "../data/learning-round4-practice-2026-10-18.json";
import { prepareReviewedEvidenceModules } from "./learning-evidence";

export const round4ExpansionDatasets = [biology, habitat, practice];
const prepared = prepareReviewedEvidenceModules(round4ExpansionDatasets);
// Reading comes first; the small accompanying question set is optional practice.
export const round4ExpansionModules = [0, 3, 6, 1, 4, 7, 2, 5, 8].map(index => prepared[index]);
