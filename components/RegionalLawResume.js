import Link from "next/link";
import { useEffect, useState } from "react";
import { legalSelectionHref, readLegalRegionPreference } from "../lib/regional-law-core";
import styles from "../styles/RegionalLaw.module.css";

export default function RegionalLawResume({ countries = [] }) {
  const [saved, setSaved] = useState(null);
  useEffect(() => {
    try {
      const preference = readLegalRegionPreference(window.localStorage);
      const country = countries.find(country => country.code === preference?.country);
      const region = country?.regions.find(region => region.code === preference.region);
      if (region) setSaved({ country, region });
    } catch { /* A blocked storage does not prevent ordinary country selection. */ }
  }, [countries]);
  if (!saved) return null;
  return <section className={styles.resume} aria-label="Gemerkte Prüfungsregion"><p>Deine gemerkte Lernregion: <strong>{saved.region.name} · {saved.country.name}</strong></p>
    <Link className={styles.button} prefetch={false} href={legalSelectionHref(saved.country.code, { region: saved.region.code })}>Hier weiterlernen</Link>
  </section>;
}
