import expansion from "../data/european-wildlife-expansion.json";
import { dachWildlife, normalizeWildlifeSearch } from "./dach-wildlife";

// Biological atlas extension only. The legally scoped DACH inventory stays separate.
export const europeanExpansion = expansion.species.map(species => ({
  ...species,
  europeanOnly: true,
  reviewedOn: expansion.reviewedOn,
  aliases: species.aliases || [],
  biologySources: species.sourceIds.map(id => expansion.sources.find(source => source.id === id)),
  sections: species.sections.map(section => ({ ...section, sources: section.sourceIds.map(id => expansion.sources.find(source => source.id === id)) })),
}));
export const europeanWildlife = [...dachWildlife, ...europeanExpansion];
export const europeanWildlifeBySlug = Object.fromEntries(europeanWildlife.map(species => [species.slug, species]));
export const europeanWildlifeGroups = [...new Set(europeanWildlife.map(species => species.group))];
export function europeanBiologyText(slug) {
  const species = europeanWildlifeBySlug[slug];
  return species?.europeanOnly ? species.sections.flatMap(section => [section.title, ...section.paragraphs]).join(" ") : "";
}
export function filterEuropeanWildlife({ query = "", group = "all" } = {}) {
  const terms = normalizeWildlifeSearch(query).split(/\s+/).filter(Boolean);
  return europeanWildlife.filter(species => (group === "all" || species.group === group) && terms.every(term => normalizeWildlifeSearch([species.name, species.slug, species.scientificName, species.group, species.identification, species.habitat, ...species.aliases, europeanBiologyText(species.slug)].join(" ")).includes(term)));
}
