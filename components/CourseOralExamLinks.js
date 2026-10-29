import Link from "next/link";
import styles from "../styles/Learning.module.css";

export default function CourseOralExamLinks({ links = [] }) {
  if (!links.length) return null;
  return <nav aria-labelledby="course-oral-exam-title" data-course-oral-exam-links>
    <h3 id="course-oral-exam-title">Mündlich üben</h3>
    <p>Ein Gesprächsimpuls zum Themengebiet des Kurses.</p>
    <ul className={styles.sources}>{links.map(link => <li key={link.id}>
      <Link href={link.href} prefetch={false}>{link.title}</Link>
    </li>)}</ul>
  </nav>;
}
