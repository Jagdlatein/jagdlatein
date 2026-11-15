import { wildYearCatalog } from "../lib/wild-year-catalog";
import { getWildYearPhotograph } from "../lib/wild-year-photographs";
import { LearningPhotoCredit } from "./LearningPhoto";
import styles from "../styles/WildYear.module.css";

export default function WildYearPhotoCredits() {
  return <details id="wildjahr-photo-credits" className={styles.photoCredits}>
    <summary>Bildnachweise zur Wildartenauswahl</summary>
    <p>Die Bilder zeigen die jeweilige Art oder ausdrücklich benannte Vergleichsform. Sie belegen keinen gewählten Monat und keine Fortpflanzungsphase.</p>
    <ul>{wildYearCatalog.map(entry => {
      const photo = getWildYearPhotograph(entry.slug);
      return photo ? <li key={entry.slug} data-wildjahr-photo-credit={entry.slug}><strong>{entry.name}</strong><LearningPhotoCredit media={photo} full /></li> : null;
    })}</ul>
  </details>;
}
