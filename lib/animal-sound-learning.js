import { animalSounds, shuffledSoundIds } from "./animal-sounds";

export const SOUND_PAGE_SIZE = 12;
export const SOUND_ROUND_SIZE = 10;
const waterBirds = /^(Anas|Mareca|Spatula|Aythya|Netta|Bucephala|Clangula|Melanitta|Somateria|Anser|Branta|Alopochen|Fulica) /;
const gameBirds = /^(Phasianus|Perdix|Tetrao|Lyrurus|Bonasa|Tetrastes|Lagopus|Coturnix) /;
const crowPigeon = /^(Corvus|Pica|Garrulus|Columba|Streptopelia) /;
export const soundGroups = [
  { id: "all", label: "Alle Stimmen" },
  { id: "mammals", label: "Säugetiere" },
  { id: "water", label: "Wasservögel" },
  { id: "gamebirds", label: "Hühner und Raufußhühner" },
  { id: "crow-pigeon", label: "Krähen und Tauben" },
  { id: "other", label: "Weitere Vögel" },
];
export function soundGroup(sound) {
  if (sound.group === "Säugetiere") return "mammals";
  if (waterBirds.test(sound.scientificName)) return "water";
  if (gameBirds.test(sound.scientificName)) return "gamebirds";
  if (crowPigeon.test(sound.scientificName)) return "crow-pigeon";
  return "other";
}
export function normalizeSoundSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
}
export function filterAnimalSounds({ query = "", group = "all" } = {}, records = animalSounds) {
  const terms = normalizeSoundSearch(query).trim().split(/\s+/).filter(Boolean);
  return records.filter(sound => (group === "all" || soundGroup(sound) === group) && terms.every(term => normalizeSoundSearch([sound.name, sound.scientificName, sound.call, sound.speciesSlug, sound.cue, sound.explanation, sound.context].join(" ")).includes(term)));
}
export function soundRound(records = animalSounds, size = SOUND_ROUND_SIZE, random = Math.random) {
  const ids = [...new Set(records.map(item => typeof item === "string" ? item : item.id))];
  const available = new Set(animalSounds.map(item => item.id));
  const valid = ids.filter(id => available.has(id));
  return shuffledSoundIds(valid, random).slice(0, size === "all" ? valid.length : SOUND_ROUND_SIZE);
}
