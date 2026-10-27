import { wildYearCatalog } from "../lib/wild-year-catalog";
import styles from "../styles/WildYear.module.css";

// Reuse the authored catalog groups in the existing single menu view. Native
// buttons avoid an additional operating-system select window and its focus
// restoration after the selected page has already opened.
export default function WildYearSpeciesPicker({ selectedSlug, disabled = false, onSelect }) {
  return <div id="wildjahr-species" className={styles.speciesPicker}>
    {[...new Set(wildYearCatalog.map(entry => entry.group))].map((group, index) => <section key={group} aria-labelledby={`wildjahr-group-${index}`}>
      <h3 id={`wildjahr-group-${index}`}>{group}</h3>
      <ul className={styles.speciesOptions}>{wildYearCatalog.filter(entry => entry.group === group).map(entry => <li key={entry.slug}>
        <button type="button" data-wildjahr-species={entry.slug} aria-pressed={selectedSlug === entry.slug} disabled={disabled} onClick={() => onSelect?.(entry.slug)}>{entry.name}</button>
      </li>)}</ul>
    </section>)}
  </div>;
}
