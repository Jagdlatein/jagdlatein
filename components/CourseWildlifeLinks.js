import Link from "next/link";
import styles from "../styles/Learning.module.css";

export default function CourseWildlifeLinks({ links = [], lessonId }) {
  const visible = links.filter(link => link.lessonIds === null || link.lessonIds.includes(lessonId));
  if (!visible.length) return null;
  return <nav aria-labelledby="course-wildlife-links-title" data-course-wildlife-links>
    <h3 id="course-wildlife-links-title">Arten</h3>
    <ul className={styles.sources}>{visible.map(link => <li key={link.slug} data-course-wildlife={link.slug}>
      <h4>{link.name}</h4>
      <Link href={link.portraitHref} prefetch={false} aria-label={`${link.name}: Artenwissen`}>Artenwissen</Link>
      <Link href={link.yearHref} prefetch={false} aria-label={`${link.name}: Wildjahr`}>Wildjahr</Link>
      {link.modelHref && <Link href={link.modelHref} prefetch={false} aria-label={`${link.name}: 3D-Präparat`}>3D</Link>}
    </li>)}</ul>
  </nav>;
}
