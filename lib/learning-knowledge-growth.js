import wildlife from "../data/learning-expansion-wildlife-dogs-2026-10-16.json";
import nature from "../data/learning-expansion-nature-equipment-2026-10-16.json";
import practice from "../data/learning-expansion-practice-health-2026-10-16.json";
import { prepareEvidenceModules } from "./learning-evidence";

// Editorial evidence stays attached to its actual lesson and original scope.
// Structural validation is not a scientific certificate or a whole-app review.
export const knowledgeGrowthDatasets = [wildlife, nature, practice];
export const knowledgeGrowthModules = prepareEvidenceModules(knowledgeGrowthDatasets);
