import biology from "../data/learning-round5-biology-2026-10-18.json";
import habitat from "../data/learning-round5-habitat-2026-10-18.json";
import { prepareReviewedEvidenceModules } from "./learning-evidence";

export const round5ExpansionDatasets = [biology, habitat];
const prepared = prepareReviewedEvidenceModules(round5ExpansionDatasets);
export const round5ExpansionModules = [0, 2, 1, 3].map(index => prepared[index]);
