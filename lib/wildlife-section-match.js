import { normalizeWildlifeSearch } from "./dach-wildlife";
import { birdDentition, birdDentitionSlugs, dentitionBySlug, dentitionWithheld } from "./wildlife-dentition";

const words = value => normalizeWildlifeSearch(value).match(/[\p{L}\p{N}]+/gu) || [];
function preview(text) {
  const value = String(text).replace(/\s+/g, " ").trim();
  if (value.length <= 260) return value;
  const end = value.lastIndexOf(" ", 255);
  return `${value.slice(0, end > 160 ? end : 255)} …`;
}

// Link to existing section IDs; this never creates a new fact or reveals quiz data.
export function matchWildlifeSection(species, query = "") {
  const terms = words(query);
  if (!species || !terms.length) return null;
  const href = `/wildkunde/${species.slug}`;
  const dentalQuery = terms.some(term => /^(gebiss|zahn|zahne|zahnen|zahnformel|zahnzahl|schneidezahn|schneidezahne|eckzahn|eckzahne|pramolar|pramolaren|molar|molaren)$/.test(term));
  if (dentalQuery) {
    const profile = dentitionBySlug[species.slug];
    if (profile) return { href: `${href}#gebiss`, sectionTitle: "Gebiss im Detail", description: preview(`${profile.scope} ${profile.note}`) };
    if (birdDentitionSlugs.has(species.slug)) return { href: `${href}#gebiss`, sectionTitle: "Schnabel und Zähne", description: birdDentition.text };
    if (dentitionWithheld.some(record => record.slug === species.slug)) return { href: `${href}#gebiss`, sectionTitle: "Gebiss: offener Nachweis", description: "Die vollständige Zahnformel ist für diese Art noch nicht ausreichend mit unabhängigen Fachquellen abgeglichen. Der offene Nachweis wird im Porträt erklärt." };
  }
  if (terms.some(term => /^(stimme|stimmen|ruf|rufe|laute|tierstimme|tierstimmen)$/.test(term))) return { href: `${href}#portrait-sounds`, sectionTitle: "Stimme dieser Art", description: preview(species.voice || "Geprüfte Originalaufnahmen und die noch offenen Aufnahmen sind im Stimmenabschnitt dieses Porträts ausgewiesen.") };
  if (!species.europeanOnly || terms.every(term => normalizeWildlifeSearch(`${species.name} ${species.scientificName}`).includes(term))) return null;
  const matches = species.sections.map(section => ({ section, rank: terms.reduce((sum, term) => sum + (normalizeWildlifeSearch(section.title).includes(term) ? 3 : 0) + (normalizeWildlifeSearch(section.paragraphs.join(" ")).includes(term) ? 1 : 0), 0) })).sort((a, b) => b.rank - a.rank);
  const best = matches[0];
  return best?.rank ? { href: `${href}#art-${best.section.id}`, sectionTitle: best.section.title, description: preview(best.section.paragraphs[0]) } : null;
}
