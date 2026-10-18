import expansion from "../data/wildlife-knowledge-expansion-2026-10-18.json";

const sources = new Map(expansion.sources.map(source => [source.id, source]));

// Keep each source attached to its actual claim block and original review date.
export const wildlifeKnowledgeBySlug = Object.fromEntries(expansion.species.map(species => [species.slug, {
  ...species,
  sections: species.sections.map(section => ({
    ...section,
    sources: section.sourceIds.map(id => sources.get(id)),
  })),
}]));
