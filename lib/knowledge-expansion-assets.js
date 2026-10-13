import { huntingDogVideoAssetPaths } from "./hunting-dog-video-lessons";
import { venisonCutAssetPaths } from "./venison-cut-guide";
import { revierLifeAssetPaths } from "./small-revier-life";
import { researchAssetPaths } from "./research-understanding";
import { wildDetailAssetPaths } from "./wild-detail-atlas";
import { digestiveAssetPaths } from "./digestive-learning";
import { parasiteAssetPaths } from "./parasite-learning";
import { foodwebAssetPaths } from "./foodweb-learning";
import { wildMovementAssetPaths } from "./wild-movement";
import { developmentAssetPaths } from "./development-photo-series";
import { soundSpectrogramAssetPaths } from "./sound-spectrograms";

// Exact public media/data allowlist. Lesson pages retain their existing access check.
export const knowledgeExpansionAssetPaths = [...new Set([
  ...huntingDogVideoAssetPaths, ...venisonCutAssetPaths, ...revierLifeAssetPaths, ...researchAssetPaths,
  ...wildDetailAssetPaths,
  ...digestiveAssetPaths, ...parasiteAssetPaths, ...foodwebAssetPaths,
  ...wildMovementAssetPaths, ...developmentAssetPaths, ...soundSpectrogramAssetPaths,
])];
