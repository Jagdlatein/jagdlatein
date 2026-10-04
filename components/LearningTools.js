import Link from "next/link";
import AppIcon from "./AppIcon";
import { learningTools, legalLearningHubs } from "../lib/learning-tool-catalog";
import styles from "../styles/LearningTools.module.css";

export default function LearningTools({ category } = {}) {
  const tools = [...learningTools, ...(category === "jagdrecht" ? legalLearningHubs : [])].filter(tool => !category || tool.categories.includes(category));
  return (
    <section className={styles.section} aria-labelledby="learning-tools-heading">
      <h2 id="learning-tools-heading">Lernen, üben und nachschlagen</h2>
      <p className={styles.intro}>Hier findest du alle Lernangebote an einem Ort.</p>
      <div className={styles.grid}>
        {tools.map(tool => <Link href={tool.href} key={tool.href} className={styles.card}>
          <span className={styles.icon}><AppIcon name={tool.icon} size={26} /></span>
          <span className={styles.content}><strong>{tool.title}</strong><span>{tool.description}</span></span>
          <AppIcon name="arrow-right" size={18} className={styles.arrow} />
        </Link>)}
      </div>
      <div className={styles.personal} aria-label="Deine Lernübersicht">
        <Link href="/meine-kurse"><AppIcon name="progress" size={22} /><span>Meine Kurse & Abschlüsse</span><AppIcon name="arrow-right" size={18} /></Link>
        <Link href="/auswertungen"><AppIcon name="stats" size={22} /><span>Meine Auswertungen</span><AppIcon name="arrow-right" size={18} /></Link>
      </div>
    </section>
  );
}
