import { getWildYearTransition } from "../lib/wild-year-transition";
import styles from "../styles/WildYear.module.css";

export default function WildYearNextMonth({ speciesSlug, month }) {
  const transition = getWildYearTransition(speciesSlug, month);
  if (!transition) return null;
  return <section id="wildjahr-next-month" className={styles.yearOverview} aria-labelledby="wildjahr-next-month-title">
    <h2 id="wildjahr-next-month-title">Nächster Monat</h2>
    <p><strong>{transition.speciesName}: {transition.fromMonthName} → {transition.toMonthName}</strong></p>
    <p>Der Vergleich zeigt nur, welche hinterlegten Phasen das Jahresmodell dem nächsten Monat zuordnet. Er sagt keine Veränderung bei einem einzelnen Tier voraus.</p>
    {transition.cyclicYearBoundary && <p>Dezember und Januar werden als benachbarte Monate des wiederkehrenden Jahresmodells verglichen.</p>}
    {transition.changes.length ? <div className={styles.cards}>{transition.changes.map(change => <article key={change.key} className={styles.card} data-wild-year-transition={change.key} data-wild-year-from-claim={change.fromClaim.id} data-wild-year-to-claim={change.toClaim.id}>
      <p className={styles.label}>{change.label}</p>
      <p>{transition.fromMonthName}: <strong>{change.fromClaim.title}</strong></p>
      <h3>{transition.toMonthName}: {change.toClaim.title}</h3>
      <p>{change.toClaim.text}</p>
    </article>)}</div> : <p>Für {transition.fromMonthName} und {transition.toMonthName} ordnet dieses Modell dieselben Phasen zu. Daraus folgt nicht, dass sich draußen nichts verändert.</p>}
  </section>;
}
