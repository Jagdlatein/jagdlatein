import Link from "next/link";
import AppIcon from "./AppIcon";
import { quizLearningUrl } from "../lib/quiz-learning-scope";
import styles from "../styles/QuizLeagueEntry.module.css";

export default function QuizLeagueEntry({ practice = false }) {
  const start = practice ? quizLearningUrl("/quiz-app/run", "DE", "Jagdpraxis") : "/quiz-app";
  return <section className={styles.entry} aria-labelledby={practice ? "research-league-title" : "learning-league-title"}>
    <div className={styles.heading}><span className={styles.icon}><AppIcon name="trophy" size={32} /></span><div><p className={styles.eyebrow}>Jagdquiz</p><h2 id={practice ? "research-league-title" : "learning-league-title"}>Quiz mit Rangliste</h2></div></div>
    <p>{practice ? "Starte eine gewertete Runde Jagdpraxis. Die 60 Revierwissensfragen bleiben separate Lernübungen ohne Ranglistenpunkte." : "Wähle dein Thema, spiele eine gewertete Runde und vergleiche deine Bestleistung."}</p>
    <p className={styles.facts}>Bis zu 10 Fragen · 30 Sekunden je Frage · Deine beste abgeschlossene Runde zählt</p>
    <div className={styles.actions}><Link href={start} className={styles.start}>{practice ? "Ranglistenquiz starten" : "Zum Ranglistenquiz"}<AppIcon name="arrow-right" size={20} /></Link><Link href="/quiz-app/leaderboard" className={styles.ranks}>Rangliste ansehen<AppIcon name="trophy" size={19} /></Link></div>
    <p className={styles.note}>Du spielst mit deinem Jagdlatein-Konto und einem öffentlichen Quiznamen. Deine Punkte werden auf dem Server geprüft.</p>
  </section>;
}
