import biology from "../data/learning-expansion-biology-2026-10-16.json";
import ecology from "../data/learning-expansion-ecology-2026-10-16.json";
import applied from "../data/learning-expansion-applied-2026-10-16.json";
import { prepareEvidenceModules } from "./learning-evidence";

export const scienceExpansionDatasets = [biology, ecology, applied];
export const scienceExpansionModules = prepareEvidenceModules(scienceExpansionDatasets);
