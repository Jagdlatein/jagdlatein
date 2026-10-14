import Link from "next/link";
import styles from "../styles/LearningDiscovery.module.css";
import { getLearningCategoryByTitle } from "../lib/learning-categories";

export default function LearningDiscovery({ category, modules, title = "Wissen vertiefen" }) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2>{title}</h2>
      <p>Neue Lektionen, Denkaufgaben und Wissenschecks mit Erklärungen zu jeder Antwort.</p>
      <div className={styles.grid}>
        {modules.map(module => (
          <Link key={module.id} href={`/kurse/${module.id}`} className={styles.card}>
            <strong>{module.title}</strong>
            <span>{module.lessonCount} Lektionen · {module.questionCount} Fragen</span>
          </Link>
        ))}
      </div>
      <Link href={getLearningCategoryByTitle(category) ? `/lernen/${getLearningCategoryByTitle(category).slug}` : "/lernen"} className={styles.all}>Alle Lerneinheiten zu {category} ansehen →</Link>
    </section>
  );
}
