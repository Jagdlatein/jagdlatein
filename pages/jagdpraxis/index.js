import { practiceCatalog } from "../../lib/practice-catalog";
import Link from "next/link";
import AppIcon from "../../components/AppIcon";
import LearningDiscovery from "../../components/LearningDiscovery";
import PracticeLayout from "../../components/PracticeLayout";
import { learningModules } from "../../lib/learning-curriculum";
import styles from "../../styles/SectionMenu.module.css";

const exercises = practiceCatalog;

export function getStaticProps() {
  const discoveryModules = learningModules.filter(module => module.category === "Jagdpraxis").slice(0, 3)
    .map(module => ({ id: module.id, title: module.title, lessonCount: module.lessons.length, questionCount: module.questions.length }));
  return { props: { discoveryModules } };
}

export default function Jagdpraxis({ discoveryModules }) {
  return (
    <PracticeLayout title="Jagdpraxis: Übungen & Ansitzsimulator" description="Wissen zu Ansprechen, Verhalten und Sicherheit üben. Die Aussageprüfungen greifen auf den geprüften Lernbestand zurück; der Ansitzsimulator beschreibt eigene Entscheidungsfälle.">
      <LearningDiscovery category="Jagdpraxis" modules={discoveryModules} title="Vor den Simulatoren: Praxiswissen vertiefen" />
      <section className={styles.section} aria-labelledby="practice-exercises">
        <h2 id="practice-exercises">Wähle deine Übung</h2>
        <div className={styles.grid}>
          {exercises.map(([slug, label, icon]) => (
            <Link key={slug} href={`/jagdpraxis/${slug}`} className={styles.card}>
              <span className={styles.icon}><AppIcon name={icon} size={24} /></span>
              <span className={styles.cardTitle}>{label}</span>
              <AppIcon name="arrow-right" size={20} className={styles.arrow} />
            </Link>
          ))}
        </div>
      </section>
    </PracticeLayout>
  );
}
