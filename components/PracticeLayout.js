import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import AppIcon from "./AppIcon";
import { practiceCatalog } from "../lib/practice-catalog";
import styles from "../styles/LearningExperience.module.css";

export default function PracticeLayout({ exercise, title, description, result = false, children }) {
  const entry = practiceCatalog.find(([slug]) => slug === exercise);
  return <LearningToolLayout
    title={title || entry?.[1] || "Jagdpraxis"}
    description={description || (result ? "Prüfe dein Ergebnis, lies die Erklärungen nach und vertiefe offene Fragen im Lernbereich." : "Übungsfälle sorgfältig beurteilen und Antworten mit den Erklärungen vergleichen.")}
    icon={entry?.[2] || "practice"}
    category="jagdpraxis"
    eyebrow={result ? "Deine Auswertung" : "Wissen anwenden"}
  >
    {exercise && <nav className={styles.actions} aria-label="Praxisübungen"><Link className={styles.secondary} href="/jagdpraxis"><AppIcon name="arrow-left" size={18} />Alle Praxisübungen</Link></nav>}
    {children}
  </LearningToolLayout>;
}
