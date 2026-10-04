import Link from "next/link";
import AppIcon from "./AppIcon";
import styles from "../styles/LearningTools.module.css";

const tools = [
  { href: "/kurse", icon: "courses", title: "Kurse", description: "Alle Kurse und kompakte Wissenschecks." },
  { href: "/quiz-app", icon: "quiz", title: "Quiz", description: "Dein Wissen nach Thema prüfen." },
  { href: "/tagesquiz", icon: "daily", title: "Tagesquiz", description: "Jeden Tag eine neue Herausforderung." },
  { href: "/jagdpraxis", icon: "practice", title: "Praxis & Simulatoren", description: "Ansprechen, Sicherheit und Entscheidungen üben." },
  { href: "/glossar", icon: "glossary", title: "Glossar", description: "Jagdsprache und Fachbegriffe nachschlagen." },
  { href: "/ebook", icon: "ebook", title: "E-Book", description: "Jagdwissen in Ruhe lesen und vertiefen." },
  { href: "/wildkunde", icon: "deer", title: "Wildarten bestimmen", description: "Die Artenübersicht mit Merkmalen und Lebensweisen." },
  { href: "/jagdrecht", icon: "law", title: "Recht nach Land", description: "Gesetze und regionale Regelungen für DE, AT und CH." },
];

export default function LearningTools() {
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
