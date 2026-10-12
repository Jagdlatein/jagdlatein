import { huntingDogVideoAssetPaths } from "./hunting-dog-video-lessons";
import { venisonCutAssetPaths } from "./venison-cut-guide";
import { revierLifeAssetPaths } from "./small-revier-life";
import { researchAssetPaths } from "./research-understanding";
import { wildDetailAssetPaths } from "./wild-detail-atlas";

// Exact public media/data allowlist. Lesson pages retain their existing access check.
export const knowledgeExpansionAssetPaths = [
  ...huntingDogVideoAssetPaths, ...venisonCutAssetPaths, ...revierLifeAssetPaths, ...researchAssetPaths,
  ...wildDetailAssetPaths,
];
