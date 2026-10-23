import LearningToolLayout from "./LearningToolLayout";
import { practiceCatalog } from "../lib/practice-catalog";

export default function PracticeLayout({ exercise, title, description, result = false, headingOnly = false, children }) {
  const entry = practiceCatalog.find(([slug]) => slug === exercise);
  return <LearningToolLayout
    title={title || entry?.[1] || "Jagdpraxis"}
    description={description || (result ? "Prüfe dein Ergebnis, lies die Erklärungen nach und vertiefe offene Fragen im Lernbereich." : "Übungsfälle sorgfältig beurteilen und Antworten mit den Erklärungen vergleichen.")}
    icon={entry?.[2] || "practice"}
    category="jagdpraxis"
    headingOnly={headingOnly}
    eyebrow={result ? "Deine Auswertung" : "Wissen anwenden"}
  >
    {children}
  </LearningToolLayout>;
}
