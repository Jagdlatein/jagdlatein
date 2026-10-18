import discovery from "../data/european-wildlife-discovery.json";
import { dachWildlife, normalizeWildlifeSearch } from "./dach-wildlife";
import { dentitionSearchText } from "./wildlife-dentition";
import { wildlifeKnowledgeSearchText } from "./wildlife-knowledge-discovery";

// Only discovery and section text belongs in the shared browser index. Full
// portraits, questions, sources and photo provenance stay in the server catalog.
export const europeanExpansion = discovery.species;
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
