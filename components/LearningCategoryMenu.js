import Link from "next/link";
import { learningCategoryDetails } from "../lib/learning-categories";
import styles from "../styles/LearningCategoryMenu.module.css";

export default function LearningCategoryMenu({ counts }) {
  return (
    <section className={styles.section} aria-labelledby="learning-categories-heading">
      <h2 id="learning-categories-heading">Entdecke die Jagd von allen Seiten</h2>
      <p className={styles.intro}>Wähle deinen Lernbereich – mit Grundlagen, Vertiefungen und praktischen Denkaufgaben.</p>
      <div className={styles.grid}>
        {learningCategoryDetails.map(category => (
          <Link href={`/lernen/${category.slug}`} key={category.slug} className={styles.card}>
            <span className={styles.icon} aria-hidden="true">{category.icon}</span>
            <span className={styles.content}>
              <strong>{category.title}</strong>
              <span>{category.description}</span>
              {counts?.[category.title] && <span className={styles.count}>{counts[category.title]} Lerneinheiten</span>}
            </span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
