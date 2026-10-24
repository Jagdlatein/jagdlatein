import Link from "next/link";
import AppIcon from "./AppIcon";
import { learningCategoryDetails } from "../lib/learning-categories";
import styles from "../styles/LearningCategoryMenu.module.css";

export default function LearningCategoryMenu({ counts }) {
  return (
    <section className={styles.section} aria-labelledby="learning-categories-heading">
      <h2 id="learning-categories-heading">Kategorien</h2>
      <nav aria-label="Lernkategorien">
        <ul className={styles.grid}>
          {learningCategoryDetails.map(category => {
            const count = counts?.[category.title];
            return <li key={category.slug} className={styles.card}>
              <Link href={`/lernen/${category.slug}`} scroll={false} className={styles.cardLink}>
                <span className={styles.icon}><AppIcon name={category.slug} size={26} /></span>
                <span className={styles.content}>
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                  {Number.isInteger(count) && count >= 0 && <span className={styles.count}>{count} {count === 1 ? "Lerneinheit" : "Lerneinheiten"}</span>}
                </span>
                <AppIcon name="arrow-right" size={18} className={styles.arrow} />
              </Link>
            </li>;
          })}
        </ul>
      </nav>
    </section>
  );
}
