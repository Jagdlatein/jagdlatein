import Link from "next/link";
import { getJawComparisonEntry, getJawComparisonRows } from "../lib/wildlife-jaw-comparison";
import styles from "../styles/WildlifeJawModel.module.css";

export default function WildlifeJawComparison({ left, right }) {
  if (!left || !right || left === right) return null;
  const entries = [getJawComparisonEntry(left), getJawComparisonEntry(right)];
  if (entries.some(entry => !entry)) return null;
  const rows = getJawComparisonRows(...entries);
  return <section className={styles.panel} aria-labelledby="kiefervergleich-title">
    <h2 id="kiefervergleich-title">{entries[0].name} und {entries[1].name} vergleichen</h2>
    {rows.length > 0 && <>
      <p>Bei I, C, P und M steht jeweils <strong>oben / unten für eine Kieferseite</strong>. Die letzten drei Zeilen zählen linke und rechte Seite zusammen.</p>
      <table className={styles.comparisonTable}>
        <caption>Bereits belegte Referenzformeln · keine Zählung an den 3D-Präparaten</caption>
        <thead><tr><th scope="col">Zahnart / Anzahl</th>{entries.map(entry => <th scope="col" key={entry.slug}>{entry.name}{entry.profile.variants?.length > 0 && <small>Grundform mit Abweichungen</small>}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={entries[index].slug}>{value}</td>)}</tr>)}</tbody>
      </table>
    </>}
    <div className={styles.comparisonNotes}>{entries.map(entry => <article key={entry.slug}><h3>{entry.name}{entry.kind === "bird" ? ": Schnabel" : entry.kind === "open" ? ": Formel offen" : ": Geltungsbereich"}</h3><p>{entry.explanation}</p><Link href={entry.sourceHref}>Einordnung und Belege zu {entry.name}</Link></article>)}</div>
    <p className={styles.scope}>Die Referenzformel und das einzelne Sammlungspräparat sind getrennt zu beurteilen. Unterschiede zwischen Arten erlauben hier keine Alters- oder Gesundheitsbestimmung.</p>
  </section>;
}
