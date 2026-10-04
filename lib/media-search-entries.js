import { wildlifeVideoCases } from "./wildlife-video-cases";
import { anatomyModels } from "./anatomy-explorer";
import { observationCases } from "./observation-workshop";

export const mediaSearchEntries = [
  ...wildlifeVideoCases.map(item => ({ id: `video-${item.id}`, title: item.title, description: `${item.species}: Originalvideo mit drei erklärten Beobachtungsfragen.`, href: `/lernen/wildtier-videofaelle?eintrag=${encodeURIComponent(item.id)}`, categories: ["wildkunde", "jagdpraxis"], text: `${item.title} ${item.species} ${item.tags.join(" ")} ${item.observations.join(" ")} ${item.location}` })),
  ...anatomyModels.map(item => ({ id: `anatomie-${item.id}`, title: `Weißwedelhirsch: ${item.title}`, description: item.description, href: `/lernen/anatomie?eintrag=${encodeURIComponent(item.id)}`, categories: ["wildkunde"], text: `${item.title} Weißwedelhirsch Odocoileus virginianus Museumsscan 3D ${item.features.map(feature => `${feature.title} ${feature.explanation}`).join(" ")}` })),
  ...observationCases.map(item => ({ id: `beobachtung-${item.id}`, title: item.title, description: `Drei Informationsstufen: ${item.tags.join(", ")}. Beobachtung und Vermutung sorgfältig unterscheiden.`, href: `/lernen/beobachtungswerkstatt?eintrag=${encodeURIComponent(item.id)}`, categories: [item.category], text: `${item.title} ${item.tags.join(" ")} ${item.stages.map(stage => stage.evidence).join(" ")}` })),
];
