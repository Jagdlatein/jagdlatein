import biology from "../data/learning-exam-biology-2026-10-18.json";
import forest from "../data/learning-exam-forest-2026-10-18.json";
import habitat from "../data/learning-exam-habitat-2026-10-18.json";
import { prepareReviewedEvidenceModules } from "./learning-evidence";

export const examExpansionDatasets = [biology, forest, habitat];
export const examExpansionModules = prepareReviewedEvidenceModules(examExpansionDatasets);
