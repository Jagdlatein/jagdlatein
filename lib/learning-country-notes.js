export function getCourseCountryNotes(module) {
  const available = module.countries.filter(country => module.countryNotes?.[country]);
  const distinct = new Set(available.map(country => module.countryNotes[country].trim().replace(/\s+/g, " ")));
  const common = available.length > 1 && distinct.size === 1 ? module.countryNotes[available[0]] : "";
  return { common, regional: common ? [] : available };
}
