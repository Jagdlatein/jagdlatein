import discovery from "../data/wildlife-knowledge-discovery-2026-10-18.json";

// Searchable teaching text only. Source dossiers and editorial notes stay out
// of the shared species list; they remain with the actual knowledge sections.
export const wildlifeKnowledgeDiscovery = Object.fromEntries(discovery.species.map(species => [species.slug, species.sections]));
export const wildlifeKnowledgeSearchText = slug => (wildlifeKnowledgeDiscovery[slug] || [])
  .flatMap(section => [section.title, section.text, section.observationNote || ""]).join(" ");
