import { europeanWildlifeBySlug } from "./european-wildlife-discovery";
import { birdDentition, birdDentitionSlugs, dentitionBySlug } from "./wildlife-dentition";

// A reading aid for the already published reference formulas; no measurements
// are inferred from an individual scan or from another species.
export function getJawComparisonEntry(slug) {
  if (typeof slug !== "string" || !Object.prototype.hasOwnProperty.call(europeanWildlifeBySlug, slug)) return null;
  const species = europeanWildlifeBySlug[slug];
  if (!species) return null;
  const profile = dentitionBySlug[slug];
  return {
    slug, name: species.name, sourceHref: `/wildkunde/${slug}#gebiss`,
    kind: profile ? "formula" : birdDentitionSlugs.has(slug) ? "bird" : "open",
    profile: profile || null,
    explanation: profile ? `${profile.scope} ${profile.note || ""}` : birdDentitionSlugs.has(slug) ? birdDentition.text : "Für diese Art ist die vollständige Zahnformel noch nicht ausreichend unabhängig belegt. Sie wird nicht von einer anderen Art übernommen.",
  };
}

export function getJawComparisonRows(left, right) {
  if (left?.kind !== "formula" || right?.kind !== "formula") return [];
  const profiles = [left.profile, right.profile];
  const names = { I: "Schneidezähne I", C: "Eckzähne C", P: "Prämolaren P", M: "Molaren M" };
  return [
    ...Object.entries(names).map(([key, label]) => ({ id: key, label, values: profiles.map(profile => `${profile.formula[key][0]} / ${profile.formula[key][1]}`) })),
    { id: "upper", label: "Oberkiefer · beide Seiten", values: profiles.map(profile => profile.count.upper * 2) },
    { id: "lower", label: "Unterkiefer · beide Seiten", values: profiles.map(profile => profile.count.lower * 2) },
    { id: "total", label: "Gesamt · beide Kiefer", values: profiles.map(profile => profile.count.total) },
  ];
}
