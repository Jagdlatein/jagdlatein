import ungulates from "../data/dentition/ungulates-rodents.json";
import carnivores from "../data/dentition/carnivores.json";
import birds from "../data/dentition/birds.json";
import { dachWildlife } from "./dach-wildlife";

const birdGroups = new Set(["Hühner und Raufußhühner", "Enten", "Gänse und Schwäne", "Krähen und Tauben", "Schnepfen und Rallen", "Taucher, Kormorane und Reiher", "Weitere Vögel", "Möwen", "Säger"]);
export const birdDentitionSlugs = new Set(dachWildlife.filter(species => birdGroups.has(species.group)).map(species => species.slug));
export const birdDentition = birds;

export const toothTypes = [
  { id: "I", name: "Schneidezähne" },
  { id: "C", name: "Eckzähne" },
  { id: "P", name: "Vordere Backenzähne", scientific: "Prämolaren" },
  { id: "M", name: "Hintere Backenzähne", scientific: "Molaren" },
];

export function dentalCount(formula) {
  if (!formula || !toothTypes.every(({ id }) => Array.isArray(formula[id]) && formula[id].length === 2 && formula[id].every(value => Number.isInteger(value) && value >= 0 && value <= 8))) return null;
  const upper = toothTypes.reduce((sum, { id }) => sum + formula[id][0], 0);
  const lower = toothTypes.reduce((sum, { id }) => sum + formula[id][1], 0);
  return { upper, lower, total: 2 * (upper + lower) };
}

export const dentalNotationSources = [
  { id: "una-notation", organization: "University of North Alabama", title: "BI 102 Lab: 4 – Mammalian digestive systems / dental formula", url: "https://una.pressbooks.pub/bi102lab/chapter/4/", supports: "I/C/P/M, Zählung einer Seite von Ober- und Unterkiefer, Verdopplung für beide Seiten." },
  { id: "utep-notation", organization: "University of Texas at El Paso", title: "Dental Formulas", url: "https://www.utep.edu/leb/keys/dentform.htm", supports: "Ober- und Unterkiefer je einer Seite und Gesamtzahl beider Seiten; verwendet U und L als Zeilenbezeichnung." },
];

const datasets = [ungulates, carnivores];
export const dentitionProfiles = datasets.flatMap(dataset => dataset.profiles.map(profile => {
  const sources = profile.sourceIds.map(id => dataset.sources.find(source => source.id === id));
  const count = dentalCount(profile.formula);
  if (!count || count.total !== profile.total || new Set(profile.sourceIds).size !== profile.sourceIds.length || sources.length < 2 || sources.some(source => !source?.url) || new Set(sources.map(source => source.organization)).size < 2) throw new Error(`Invalid dentition record: ${profile.slug}`);
  return { ...profile, reviewedOn: dataset.reviewedOn, sources, count };
}));
if (new Set(dentitionProfiles.map(profile => profile.slug)).size !== dentitionProfiles.length) throw new Error("Duplicate dentition profile");
export const dentitionBySlug = Object.fromEntries(dentitionProfiles.map(profile => [profile.slug, profile]));
export const dentitionWithheld = datasets.flatMap(dataset => dataset.withheld || []);
export function dentitionSearchText(slug) {
  if (birdDentitionSlugs.has(slug)) return `Zahnzahl 0 Zähne Schnabel ${birdDentition.text}`;
  const profile = dentitionBySlug[slug];
  return profile ? `Gebiss Zahnzahl Zahnformel Zähne ${profile.total} Schneidezähne Eckzähne Prämolaren Molaren ${profile.scope} ${profile.note}` : "";
}
