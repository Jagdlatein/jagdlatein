import body from "../data/learning-expansion-body-functions-2026-10-17.json";
import habitat from "../data/learning-expansion-habitat-depth-2026-10-17.json";
import field from "../data/learning-expansion-field-science-2026-10-17.json";
import { prepareEvidenceModules } from "./learning-evidence";

export const depthExpansionDatasets = [body, habitat, field];
export const depthExpansionModules = prepareEvidenceModules(depthExpansionDatasets);
