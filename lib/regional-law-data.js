// Server-only imports. Country pages send only the compact region index;
// the authenticated API returns the chosen region and optional federal law.
import ch from "../data/jagdrecht-regional/ch.json";
import de from "../data/jagdrecht-regional/de.json";
import at from "../data/jagdrecht-regional/at.json";
import { legalCountries, legalRegionMetadata, regionCode } from "./regional-law-core";

const catalog = { CH: ch, DE: de, AT: at };
export function getLegalDataset(country) { return catalog[regionCode(country)] || null; }
export function getLegalCountryMetadata(country) {
  const dataset = getLegalDataset(country);
  const details = legalCountries.find(item => item.code === regionCode(country));
  return dataset && details ? { ...details, country: dataset.country, regions: legalRegionMetadata(dataset) } : null;
}
export function getAllLegalCountryMetadata() { return legalCountries.map(country => getLegalCountryMetadata(country.code)); }
