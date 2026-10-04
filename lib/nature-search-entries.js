import { plantAtlasEntries } from "./plant-atlas";
import { tracksWorkshopEntries } from "./tracks-workshop";
import { habitatFeatures, habitatSpecies } from "./habitat-workshop";
export const natureSearchEntries = [
  ...plantAtlasEntries.map(entry => ({ id: `atlas-${entry.id}`, title: entry.name, description: `${entry.latin} · ${entry.features[0]}`, href: `/lernen/pflanzenatlas?eintrag=${entry.id}`, categories: ["wald-pflanzen"], text: `${entry.name} ${entry.latin} ${entry.group} ${entry.features.join(" ")} ${Object.values(entry.seasons).join(" ")} ${entry.confusion} ${entry.habitat}` })),
  ...tracksWorkshopEntries.map(entry => ({ id: `spur-${entry.id}`, title: entry.title, description: `${entry.group} · ${entry.traits[0]}`, href: `/lernen/spurenwerkstatt?eintrag=${entry.id}`, categories: ["wildkunde", "jagdpraxis"], text: `${entry.title} ${entry.group} ${entry.traits.join(" ")} ${entry.caution}` })),
  { id: "lebensraum-werkstatt", title: "Lebensraum-Werkstatt", description: "Bausteine für Nahrung, Deckung, Brutplätze und Verbindung vergleichen.", href: "/lernen/lebensraum-werkstatt", categories: ["natur-revier", "landwirtschaft-lebensraeume", "tierschutz-verantwortung"], text: `${habitatFeatures.map(feature => `${feature.name} ${feature.text}`).join(" ")} ${habitatSpecies.map(species => `${species.name} ${species.text}`).join(" ")}` },
];
