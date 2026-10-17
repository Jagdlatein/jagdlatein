import styles from "../styles/Learning.module.css";

export default function LessonEvidence({ lesson, reviewedOn }) {
  if (!lesson.evidence?.length) return null;
  const day = typeof reviewedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(reviewedOn) ? new Date(`${reviewedOn}T00:00:00Z`) : null;
  const hasReviewDay = day && Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === reviewedOn;
  return <details className={styles.lessonEvidence}>
    <summary>Belege zu dieser Lektion</summary>
    <p>{hasReviewDay ? <>Diese Aussagen wurden am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(day)} mit den angegebenen Fachquellen abgeglichen.</> : "Quellenzuordnung der Ausgangslektion."}</p>
    <ul>{lesson.evidence.map(item => <li key={item.claim}><strong>{item.claim}</strong><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></li>)}</ul>
  </details>;
}
