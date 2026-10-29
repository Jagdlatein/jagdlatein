import Link from "next/link";
import styles from "../styles/Learning.module.css";

export default function CoursePracticeLinks({ links = [] }) {
  if (!links.length) return null;
  return <nav aria-labelledby="course-practice-title" data-course-practice-links>
    <h3 id="course-practice-title">Praxis</h3>
    <p>Fälle und Übungsbeschreibungen zum Themengebiet des Kurses.</p>
    <ul className={styles.sources}>{links.map(link => <li key={link.id}>
      <Link href={link.href} prefetch={false}>{link.title}</Link>
    </li>)}</ul>
  </nav>;
}
