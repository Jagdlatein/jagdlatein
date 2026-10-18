import catalog from "../data/wildlife-jaw-models-2026-10-18.json";

export const jawModelCatalog = catalog;
export const jawModelSpecies = catalog.species;
export const jawModelsBySlug = Object.fromEntries(jawModelSpecies.map(species => [species.speciesSlug, species]));

// Only the curated identifier enters the external viewer, never a query URL.
export function jawModelEmbedURL(model) {
  if (!model || typeof model.id !== "string" || model.id.length !== 32 || !/^[0-9a-f]{32}$/.test(model.id)) return null;
  return `https://sketchfab.com/models/${model.id}/embed?autostart=1&autospin=0&dnt=1&camera=0&animation_autoplay=0`;
}

export function preferredJawModel(species) {
  return species?.models?.find(model => model.part === "mandible") || species?.models?.[0] || null;
}
