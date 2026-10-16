import styles from "../styles/Learning.module.css";

export default function LessonEvidence({ lesson, reviewedOn }) {
  if (!lesson.evidence?.length) return null;
  return <details className={styles.lessonEvidence}>
    <summary>Belege zu dieser Lektion</summary>
    <p>Diese Aussagen wurden am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${reviewedOn}T00:00:00Z`))} mit den angegebenen Fachquellen abgeglichen.</p>
    <ul>{lesson.evidence.map(item => <li key={item.claim}><strong>{item.claim}</strong><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></li>)}</ul>
  </details>;
}
