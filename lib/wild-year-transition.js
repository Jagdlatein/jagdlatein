import { getWildYearProfile, wildYearSpecies } from "./wild-year";

// Compare existing editorial phases only. Validate before using the older
// profile helper, whose historical defaults deliberately substitute Gams/Jan.
export function getWildYearTransition(slug, month) {
  if (typeof slug !== "string" || !wildYearSpecies.some(species => species.slug === slug) ||
    !Number.isInteger(month) || month < 1 || month > 12) return null;
  const nextMonth = month === 12 ? 1 : month + 1;
  const current = getWildYearProfile(slug, month);
  const next = getWildYearProfile(slug, nextMonth);
  if (!current.sections.every(section => section.claim) || !next.sections.every(section => section.claim)) return null;
  const changes = current.sections.flatMap(section => {
    const nextSection = next.sections.find(item => item.key === section.key);
    if (!nextSection?.claim || section.claim.id === nextSection.claim.id) return [];
    return [{ key: section.key, label: section.label, fromClaim: section.claim, toClaim: nextSection.claim }];
  });
  return {
    speciesSlug: slug,
    speciesName: current.species.name,
    fromMonth: month,
    fromMonthName: current.monthName,
    toMonth: nextMonth,
    toMonthName: next.monthName,
    cyclicYearBoundary: month === 12,
    changes,
  };
}
