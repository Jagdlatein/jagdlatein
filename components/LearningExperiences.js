import Link from "next/link";
import AppIcon from "./AppIcon";
import { learningExperiences } from "../lib/learning-experiences";
import styles from "../styles/LearningTools.module.css";

export default function LearningExperiences({ category }) {
  const experiences = learningExperiences.filter(tool => !category || tool.categories.includes(category));
  if (!experiences.length) return null;
  return <section className={`${styles.section} ${styles.experiences}`} aria-labelledby="learning-experiences-heading">
    <p className={styles.eyebrow}>Neu im Lernbereich</p>
    <h2 id="learning-experiences-heading">Wissen mit allen Sinnen</h2>
    <p className={styles.intro}>Entdecken, zuhören und vergleichen – mit echten Fotos, Originalaufnahmen und verständlichen Erklärungen.</p>
    <div className={styles.experienceGrid}>
      {experiences.map(tool => <Link href={tool.href} key={tool.href} className={`${styles.card} ${styles.experienceCard}`}>
        <span className={styles.icon}><AppIcon name={tool.icon} size={30} /></span>
        <span className={styles.content}><span className={styles.label}>{tool.label}</span><strong>{tool.title}</strong><span>{tool.description}</span></span>
        <AppIcon name="arrow-right" size={20} className={styles.arrow} />
      </Link>)}
    </div>
  </section>;
}
