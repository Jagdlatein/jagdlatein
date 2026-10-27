import { wildYearMonths } from "../lib/wild-year";
import styles from "../styles/WildYear.module.css";

// Project the authored bands; do not calculate new biological dates or infer
// a hunting season. The parent commits all outgoing selections to its URL.
export function getWildYearOverviewRows(species) {
  if (!species?.reproduction || !species?.behavior) return [];
  const rows = wildYearMonths.map((monthName, index) => ({
    month: index + 1, monthName,
    reproduction: species.reproduction.find(claim => claim.months.includes(index + 1)),
    behavior: species.behavior.find(claim => claim.months.includes(index + 1)),
  }));
  return rows.every(row => row.reproduction && row.behavior) ? rows : [];
}

export default function WildYearOverview({ species, month, disabled = false, onSelect }) {
  const rows = getWildYearOverviewRows(species);
  if (!rows.length) return null;
  return <section id="wildjahr-year-overview" className={styles.yearOverview} aria-labelledby="wildjahr-year-title">
    <h2 id="wildjahr-year-title">{species.name}: Jahresübersicht</h2>
    <p>Fortpflanzung und Verhalten über zwölf Monate vergleichen. Wähle einen Monat, um seine vollständigen Erklärungen oben zu lesen. Die Bänder sind eine biologische Orientierung; Abläufe können sich überlappen und örtlich verschieben.</p>
    <ol className={styles.yearMonths}>{rows.map(row => <li key={row.month}>
      <button type="button" data-wildjahr-month={row.month} aria-pressed={row.month === month} disabled={disabled} onClick={() => onSelect?.(row.month)}>
        <strong>{row.monthName}</strong>
        <span><small>Fortpflanzung</small>{row.reproduction.title}</span>
        <span><small>Verhalten</small>{row.behavior.title}</span>
      </button>
    </li>)}</ol>
  </section>;
}
