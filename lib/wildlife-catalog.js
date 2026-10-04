import { dachWildlife, dachWildlifeGroups } from "./dach-wildlife";

// Gemeinsamer Artenbestand für Übersicht und Suche; bestehende URLs bleiben bestehen.
export const wildlifeCategories = dachWildlifeGroups.map(group => ({
  title: group,
  items: dachWildlife.filter(species => species.group === group).map(species => ({
    name: species.name,
    slug: species.slug,
    scientificName: species.scientificName,
    description: species.identification,
  })),
}));
