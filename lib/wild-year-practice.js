import { wildYearMonths, wildYearSpecies } from "./wild-year";

const sections = species => [
  { key: "coat", label: species.coatLabel || "Fell" },
  { key: "crown", label: species.secondaryLabel || species.crownLabel },
  { key: "reproduction", label: "Fortpflanzung" },
  { key: "behavior", label: "Verhalten" },
];
const hash = value => [...value].reduce((result, character) => (result * 31 + character.charCodeAt(0)) >>> 0, 0);

// These are reading exercises for the authored model. They add neither new
// biology nor an independent or official examination-question catalogue.
export function getWildYearPractice(slug) {
  const species = typeof slug === "string" ? wildYearSpecies.find(item => item.slug === slug) : null;
  if (!species) return [];
  const pools = sections(species).map(section => {
    const authored = species[section.key] || [];
    const seenTitles = new Set();
    const phases = authored.filter(claim => {
      if (!claim?.id || !claim.title || !claim.text || seenTitles.has(claim.title)) return false;
      const validMonths = claim.months.filter(month => Number.isInteger(month) && month >= 1 && month <= 12
        && authored.filter(other => other.months.includes(month)).length === 1);
      if (!validMonths.length) return false;
      seenTitles.add(claim.title);
      return true;
    });
    if (phases.length < 2) return [];
    return phases.map((claim, index) => {
      const validMonths = claim.months.filter(month => Number.isInteger(month) && month >= 1 && month <= 12
        && authored.filter(other => other.months.includes(month)).length === 1);
      const month = validMonths[Math.floor(validMonths.length / 2)];
      const alternatives = [...phases.slice(index + 1), ...phases.slice(0, index)].slice(0, 2);
      const choices = [claim, ...alternatives].map(item => ({ id: item.id, title: item.title, sourceIds: [...item.sourceIds] }));
      const offset = hash(`${slug}:${section.key}:${claim.id}`) % choices.length;
      return {
        id: `wildjahr-uebung-${slug}-${section.key}-${claim.id}`,
        speciesSlug: slug, month, monthName: wildYearMonths[month - 1],
        sectionKey: section.key, sectionLabel: section.label,
        prompt: `Welche Phase ordnet das Modell für „${species.name}“ im ${wildYearMonths[month - 1]} dem Bereich „${section.label}“ zu?`,
        choices: [...choices.slice(offset), ...choices.slice(0, offset)],
        answerId: claim.id, claimId: claim.id, explanation: claim.text,
        uncertainty: species.uncertainty, sourceIds: [...claim.sourceIds], reviewedOn: species.reviewedOn,
      };
    });
  });
  const questions = [], seenConcepts = new Set();
  // One eligible phase per field first; then use a genuinely different phase.
  for (let turn = 0; questions.length < 4 && pools.some(pool => turn < pool.length); turn++) {
    for (const pool of pools) {
      const question = pool[turn];
      if (!question) continue;
      const concept = `${question.choices.find(choice => choice.id === question.answerId).title}\n${question.explanation}`;
      if (seenConcepts.has(concept)) continue;
      seenConcepts.add(concept); questions.push(question);
      if (questions.length === 4) break;
    }
  }
  return questions;
}

// Include alternatives too: their displayed titles come from other authored
// phases, whose evidence may differ from that of the currently selected month.
export function getWildYearPracticeEvidence(slug) {
  const questions = getWildYearPractice(slug);
  const seen = new Set(), evidence = [];
  for (const question of questions) for (const choice of question.choices) {
    const key = `${question.sectionKey}:${choice.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    evidence.push({ claimId: choice.id, sectionKey: question.sectionKey, sectionLabel: question.sectionLabel,
      title: choice.title, sourceIds: [...choice.sourceIds], reviewedOn: question.reviewedOn });
  }
  return evidence;
}
