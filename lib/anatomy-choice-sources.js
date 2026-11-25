// Comparison checks concern only the six appended answer options, not a new
// complete review of the original museum lesson or the unique specimens.
export const anatomyChoiceCheckedOn = "2026-11-25";
const sources = {
  record: { title: "Smithsonian · White-tailed Deer: Forelimb, EO404749 · Objektangaben und Massstabsgrenze", url: "https://3d.si.edu/object/3d/white-tailed-deer-forelimb:9395b925-4132-468c-a974-745abec177b4", organization: "Smithsonian Institution" },
  skull: { title: "Smithsonian · How to Read a Mammal Skull · Skull Basics, Eyes und Teeth", url: "https://naturalhistory.si.edu/education/teaching-resources/featured-collections/how-read-mammal-skull", organization: "Smithsonian Institution" },
  fallow: { title: "Animal Diversity Web · Dama dama · Wissenschaftliche Einordnung", url: "https://animaldiversity.org/accounts/Dama_dama/", organization: "Animal Diversity Web" },
  retina: { title: "OpenStax · Anatomy and Physiology 2e, 14.1 · Vision: Netzhaut und Lichtrezeptoren", url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception", organization: "OpenStax / Rice University" },
  teeth: { title: "University of Texas at El Paso · Mammal Glossary · Alveolar und Diastema", url: "https://www.utep.edu/leb/keys/glossary.htm", organization: "University of Texas at El Paso" },
  viewer: { title: "Google model-viewer 4.1.0 · Originaldokumentation zu Kamera und vorhandenen Animationen", url: "https://github.com/google/model-viewer/blob/v4.1.0/packages/modelviewer.dev/data/docs.json", organization: "Google / model-viewer" },
};
const comparisonSources = {
  art: ["record", "fallow"],
  auge: ["skull", "retina"],
  luecke: ["skull", "teeth"],
  weichteil: ["record", "viewer"],
  groessen: ["record", "viewer"],
  scan: ["record", "viewer"],
};
export function getAnatomyChoiceSources(questionId) {
  if (typeof questionId !== "string" || !Object.hasOwn(comparisonSources, questionId)) return [];
  return comparisonSources[questionId].map(id => ({ ...sources[id] }));
}
