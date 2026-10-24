import styles from "../styles/Learning.module.css";
import { getLessonReviewDate } from "../lib/learning-review-date";

export default function LessonEvidence({ lesson, reviewedOn, embedded = false }) {
  if (!lesson.evidence?.length) return null;
  const reviewDate = getLessonReviewDate(lesson, reviewedOn);
  const day = reviewDate ? new Date(`${reviewDate}T00:00:00Z`) : null;
  const content = <>
    <p>{day ? <>Diese Aussagen wurden am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(day)} mit den angegebenen Fachquellen abgeglichen.</> : "Quellenzuordnung der Ausgangslektion."}</p>
    <ul>{lesson.evidence.map(item => <li key={item.claim}><strong>{item.claim}</strong><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></li>)}</ul>
  </>;
  return embedded
    ? <section className={styles.lessonEvidence}><h3>Belege zu dieser Lektion</h3>{content}</section>
    : <details className={styles.lessonEvidence}><summary>Belege zu dieser Lektion</summary>{content}</details>;
}
