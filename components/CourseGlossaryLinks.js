import Link from "next/link";
import styles from "../styles/Learning.module.css";

export default function CourseGlossaryLinks({ links = [], lessonId }) {
  const visible = links.filter(link => link.lessonIds === null || link.lessonIds.includes(lessonId));
  if (!visible.length) return null;
  return <nav aria-labelledby="course-glossary-links-title" data-course-glossary-links>
    <h3 id="course-glossary-links-title">Begriffe</h3>
    <ul className={styles.sources}>{visible.map(link => <li key={link.slug}>
      <Link href={link.href} prefetch={false}>{link.term}</Link>
    </li>)}</ul>
  </nav>;
}
