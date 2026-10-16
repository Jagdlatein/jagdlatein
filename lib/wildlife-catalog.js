import { europeanWildlife, europeanWildlifeGroups } from "./european-wildlife";

// Gemeinsamer Artenbestand für Übersicht und Suche; bestehende URLs bleiben bestehen.
export const wildlifeCategories = europeanWildlifeGroups.map(group => ({
  title: group,
  items: europeanWildlife.filter(species => species.group === group).map(species => ({
    name: species.name,
    slug: species.slug,
    scientificName: species.scientificName,
    description: species.identification,
  })),
}));
