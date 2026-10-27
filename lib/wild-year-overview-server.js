import { europeanWildlifeBySlug } from "./european-wildlife";
import { wildlifeDepthBySlug } from "./wildlife-depth";
import { wildlifeKnowledgeBySlug } from "./wildlife-knowledge";
import originalPortraitReview from "../data/reviews/wildlife-biology-2026-10-04.json";

// Server-only projection of existing authored text. This module must not enter
// the browser selection bundle: it contains the full portrait source catalog.
// Selecting a month does not turn these unbanded readings into a monthly phase.
const originalAnnualSections = new Map(originalPortraitReview.species.flatMap(species => {
  const section = species.sections.find(item => item.heading === "Fortpflanzung und Jahresverlauf");
  return section ? [[species.slug, { species, section }]] : [];
}));

const europeanAnnualSectionIds = {
  rentier: ["nahrung", "jahreslauf", "fortpflanzung"],
  pyrenaeengaemse: ["lebensraum", "nahrung", "sozialverhalten", "fortpflanzung"],
  iberiensteinbock: ["lebensraum", "sozialverhalten", "fortpflanzung"],
  rothuhn: ["jahreslauf", "fortpflanzung"],
  chukarhuhn: ["sozial-jahreslauf", "fortpflanzung"],
  moorschneehuhn: ["sozial-jahreslauf", "fortpflanzung", "winter-tarnung"],
  kegelrobbe: ["verhalten", "nachwuchs"],
  "iberischer-hase": ["verhalten", "fortpflanzung"],
};

function sourcesFor(items = []) {
  const seen = new Set();
  return items.filter(item => item?.url && !seen.has(item.url) && seen.add(item.url))
    .map(item => ({ label: item.label || item.title, url: item.url }));
}

function speciesSection(species) {
  // Prefer the original authored biology list rather than repeating the same
  // identification and habitat facts above it in a second wording.
  const paragraphs = [...new Set(species.biology?.length ? species.biology : [species.identification, species.habitat])]
    .filter(text => typeof text === "string" && text.trim());
  return { id: "artenwissen", title: "Artenwissen", paragraphs, sources: sourcesFor(species.biologySources) };
}

export function getWildYearOverview(slug) {
  if (typeof slug !== "string" || !Object.hasOwn(europeanWildlifeBySlug, slug)) return null;
  const species = europeanWildlifeBySlug[slug];
  const knowledge = wildlifeKnowledgeBySlug[slug];
  const oldAnnual = originalAnnualSections.get(slug);
  const depth = wildlifeDepthBySlug[slug];
  let sections;

  if (species.europeanOnly) {
    const selectedIds = europeanAnnualSectionIds[slug] || [];
    sections = selectedIds.map(id => species.sections.find(section => section.id === id)).filter(Boolean)
      .map(section => ({ id: section.id, title: section.title, paragraphs: [...section.paragraphs],
        sources: sourcesFor(section.sources), reviewedOn: species.reviewedOn }));
  } else if (knowledge) {
    // The newer explicitly source-bound annual block takes precedence over a
    // broader older portrait. Preserve its complete prose and original date.
    sections = knowledge.sections.filter(section => /brut|jahres|zug|mauser|fortpflanz/.test(section.id))
      .map(section => ({ id: section.id, title: section.title, paragraphs: [section.text, ...(section.observationNote ? [section.observationNote] : [])],
        sources: sourcesFor(section.sources), reviewedOn: knowledge.reviewedOn }));
  } else if (oldAnnual) {
    // These are the unchanged annual bullet texts still present in the older
    // portrait. The inherited source references and date are not a new audit.
    const byUrl = new Map(oldAnnual.species.sources.map(item => [item.url, item]));
    sections = [{ id: "jahresverlauf", title: "Fortpflanzung und Jahresverlauf",
      paragraphs: [...oldAnnual.section.claims],
      sources: sourcesFor(oldAnnual.section.sourceRefs.map(url => byUrl.get(url) || { title: url, url })),
      reviewedOn: originalPortraitReview.reviewedOn }];
  } else if (depth?.seasonalLife?.length) {
    sections = [{ id: "jahreslauf", title: "Jahreslauf", paragraphs: [...depth.seasonalLife],
      sources: sourcesFor(depth.sources), reviewedOn: depth.reviewedOn }];
  }

  const annual = Boolean(sections?.length);
  if (!annual) sections = [speciesSection(species)];
  return {
    slug: species.slug, name: species.name, scientificName: species.scientificName,
    sections, coverage: annual ? "annual" : "species",
    scopeNote: annual
      ? `${species.europeanOnly ? "Diese biologische Übersicht betrifft europäische Vorkommen; sie belegt weder ein DACH-Vorkommen noch eine Jagdfreigabe. " : ""}Die Jahresübersicht ist nicht nach einzelnen Monaten aufgeteilt. Der gewählte Monat verändert diesen Lerntext nicht. Die Prüfstände wurden aus den bestehenden Lerninhalten übernommen; diese Verknüpfung ist keine neue fachliche Gesamtprüfung.`
      : "Hier steht bisher Artenwissen. Für diesen Eintrag ist noch kein geprüfter Monatskalender hinterlegt; der gewählte Monat verändert diese Übersicht nicht. Eine Aufnahme in das Wildjahr bedeutet keine örtliche Jagdfreigabe.",
  };
}
