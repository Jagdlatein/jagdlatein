import Link from "next/link";
import styles from "../styles/Learning.module.css";

export default function CourseMiniLinks({ links = [], lessonId }) {
  const visible = links.filter(link => link.lessonIds === null || link.lessonIds.includes(lessonId));
  if (!visible.length) return null;
  return <nav aria-labelledby="course-mini-links-title" data-course-mini-links>
    <h3 id="course-mini-links-title">Mini-Kurse</h3>
    <p>Weitere Übungen zum Themengebiet.</p>
    <ul className={styles.sources}>{visible.map(link => <li key={link.id}>
      <Link href={link.href} prefetch={false}>{link.title}</Link>
    </li>)}</ul>
  </nav>;
}
