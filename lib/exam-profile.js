// Compact selection metadata only. The authenticated regional-law API owns
// legal texts, review gates and questions; none of that data belongs here.
export const EXAM_PROFILE_STORAGE_KEY = "jl_exam_profile_v1";

export const examCountries = Object.freeze([
  {
    code: "CH", slug: "ch", name: "Schweiz", regionLabel: "Kanton",
    regions: [
      { code: "ZH", name: "Zürich" }, { code: "BE", name: "Bern" },
      { code: "LU", name: "Luzern" }, { code: "UR", name: "Uri" },
      { code: "SZ", name: "Schwyz" }, { code: "OW", name: "Obwalden" },
      { code: "NW", name: "Nidwalden" }, { code: "GL", name: "Glarus" },
      { code: "ZG", name: "Zug" }, { code: "FR", name: "Freiburg" },
      { code: "SO", name: "Solothurn" }, { code: "BS", name: "Basel-Stadt" },
      { code: "BL", name: "Basel-Landschaft" }, { code: "SH", name: "Schaffhausen" },
      { code: "AR", name: "Appenzell Ausserrhoden" }, { code: "AI", name: "Appenzell Innerrhoden" },
      { code: "SG", name: "St. Gallen" }, { code: "GR", name: "Graubünden" },
      { code: "AG", name: "Aargau" }, { code: "TG", name: "Thurgau" },
      { code: "TI", name: "Tessin" }, { code: "VD", name: "Waadt" },
      { code: "VS", name: "Wallis" }, { code: "NE", name: "Neuenburg" },
      { code: "GE", name: "Genf" }, { code: "JU", name: "Jura" },
    ],
  },
  {
    code: "AT", slug: "at", name: "Österreich", regionLabel: "Bundesland",
    regions: [
      { code: "B", name: "Burgenland" }, { code: "K", name: "Kärnten" },
      { code: "NOE", name: "Niederösterreich" }, { code: "OOE", name: "Oberösterreich" },
      { code: "S", name: "Salzburg" }, { code: "ST", name: "Steiermark" },
      { code: "T", name: "Tirol" }, { code: "V", name: "Vorarlberg" },
      { code: "W", name: "Wien" },
    ],
  },
  {
    code: "DE", slug: "de", name: "Deutschland", regionLabel: "Bundesland",
    regions: [
      { code: "BW", name: "Baden-Württemberg" }, { code: "BY", name: "Bayern" },
      { code: "BE", name: "Berlin" }, { code: "BB", name: "Brandenburg" },
      { code: "HB", name: "Bremen" }, { code: "HH", name: "Hamburg" },
      { code: "HE", name: "Hessen" }, { code: "MV", name: "Mecklenburg-Vorpommern" },
      { code: "NI", name: "Niedersachsen" }, { code: "NW", name: "Nordrhein-Westfalen" },
      { code: "RP", name: "Rheinland-Pfalz" }, { code: "SL", name: "Saarland" },
      { code: "SN", name: "Sachsen" }, { code: "ST", name: "Sachsen-Anhalt" },
      { code: "SH", name: "Schleswig-Holstein" }, { code: "TH", name: "Thüringen" },
    ],
  },
].map(country => Object.freeze({
  ...country,
  regions: Object.freeze(country.regions.map(region => Object.freeze(region))),
})));

export function normalizeExamProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    !Object.hasOwn(value, "country") || !Object.hasOwn(value, "region") ||
    typeof value.country !== "string" || typeof value.region !== "string") return null;
  const country = examCountries.find(item => item.code === value.country);
  if (!country || !country.regions.some(item => item.code === value.region)) return null;
  // Persist only the explicit examination target, never incidental input fields.
  return Object.freeze({ country: country.code, region: value.region });
}

export function getExamProfileDetails(value) {
  const profile = normalizeExamProfile(value);
  if (!profile) return null;
  const country = examCountries.find(item => item.code === profile.country);
  return { country, region: country.regions.find(item => item.code === profile.region) };
}

export function examProfileLawHref(value, view = "wissen") {
  const details = getExamProfileDetails(value);
  if (!details) return "/jagdrecht";
  const params = new URLSearchParams({ region: details.region.code });
  if (["fragen", "uebung", "originale"].includes(view)) params.set("ansicht", view);
  return `/jagdrecht/${details.country.slug}?${params}`;
}
