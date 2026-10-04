import Link from "next/link";
import AppIcon from "./AppIcon";
import { learningExperiences } from "../lib/learning-experiences";
import styles from "../styles/LearningTools.module.css";

export default function LearningExperiences({ category }) {
  const experiences = learningExperiences.filter(tool => !category || tool.categories.includes(category));
  const groupDefinitions = [
    ["Gemeinsam lernen und Fragen klären", ["community"]],
    ["Neues aus Wissenschaft und Revier", ["news"]],
    ["Wildtiere erkennen und beobachten", ["wildkunde", "fotodetektiv", "tierstimmen", "spurenwerkstatt", "wildtier-videofaelle", "anatomie"]],
    ["Jagdrecht und Artenschutz nachschlagen", ["wildarten"]],
    ["Pflanzen und Lebensräume verstehen", ["pflanzenatlas", "lebensraum-werkstatt"]],
    ["Mit Jagdhunden lernen", ["jagdhund-kompass", "hundetraining-tagebuch"]],
    ["Fälle lösen und die Prüfung vorbereiten", ["wildbret-fallwerkstatt", "beobachtungswerkstatt", "pruefungsgespraech", "offline-rucksack"]],
  ];
  const groups = groupDefinitions.map(([title, slugs]) => ({ title, tools: experiences.filter(tool => slugs.includes(tool.href.split("/").pop())) })).filter(group => group.tools.length);
  if (!experiences.length) return null;
  return <section className={`${styles.section} ${styles.experiences}`} aria-labelledby="learning-experiences-heading">
    <p className={styles.eyebrow}>Neu im Lernbereich</p>
    <h2 id="learning-experiences-heading">Deine Lernwerkzeuge</h2>
    <p className={styles.intro}>Nach Themen geordnet: entdecken, üben, vergleichen und dokumentieren. Alle Angebote findest du auch in der gemeinsamen Suche.</p>
    {groups.map(group => <div className={styles.toolGroup} key={group.title}>
    <h3>{group.title}</h3>
    <div className={styles.experienceGrid}>
      {group.tools.map(tool => <Link href={tool.href} key={tool.href} className={`${styles.card} ${styles.experienceCard}`}>
        <span className={styles.icon}><AppIcon name={tool.icon} size={30} /></span>
        <span className={styles.content}><span className={styles.label}>{tool.label}</span><strong>{tool.title}</strong><span>{tool.description}</span></span>
        <AppIcon name="arrow-right" size={20} className={styles.arrow} />
      </Link>)}
    </div>
    </div>)}
  </section>;
}
