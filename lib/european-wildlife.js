import expansion from "../data/european-wildlife-expansion.json";
import birds from "../data/european-wildlife-birds-2026-10-16.json";
import mammals from "../data/european-wildlife-mammals-2026-10-16.json";
import { dachWildlife, normalizeWildlifeSearch } from "./dach-wildlife";
import { dentitionSearchText } from "./wildlife-dentition";
import { wildlifeKnowledgeSearchText } from "./wildlife-knowledge-discovery";

// Biological atlas extension only. The legally scoped DACH inventory stays separate.
export const europeanExpansion = [expansion, birds, mammals].flatMap(dataset => dataset.species.map(species => ({
  ...species,
  europeanOnly: true,
  reviewedOn: dataset.reviewedOn,
  aliases: species.aliases || [],
  biologySources: species.sourceIds.map(id => dataset.sources.find(source => source.id === id)),
  sections: species.sections.map(section => ({ ...section, sources: section.sourceIds.map(id => dataset.sources.find(source => source.id === id)) })),
})));
export const europeanWildlife = [...dachWildlife, ...europeanExpansion];
if (new Set(europeanWildlife.map(species => species.slug)).size !== europeanWildlife.length) throw new Error("Duplicate wildlife portrait");
export const europeanWildlifeBySlug = Object.fromEntries(europeanWildlife.map(species => [species.slug, species]));
export const europeanWildlifeGroups = [...new Set(europeanWildlife.map(species => species.group))];
export function europeanBiologyText(slug) {
  const species = europeanWildlifeBySlug[slug];
  return species?.europeanOnly ? species.sections.flatMap(section => [section.title, ...section.paragraphs]).join(" ") : "";
}
export function filterEuropeanWildlife({ query = "", group = "all" } = {}) {
  const terms = normalizeWildlifeSearch(query).split(/\s+/).filter(Boolean);
  return europeanWildlife.filter(species => (group === "all" || species.group === group) && terms.every(term => normalizeWildlifeSearch([species.name, species.slug, species.scientificName, species.group, species.identification, species.habitat, ...(species.biology || []), ...species.aliases, europeanBiologyText(species.slug), dentitionSearchText(species.slug), wildlifeKnowledgeSearchText(species.slug)].join(" ")).includes(term)));
}
