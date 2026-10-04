import Link from "next/link";
import AppIcon from "../../components/AppIcon";
import LearningDiscovery from "../../components/LearningDiscovery";
import styles from "../../styles/SectionMenu.module.css";

const exercises = [
  ["ansitz", "Ansitz-Simulator", "target"],
  ["drueckjagd", "Drückjagd-Wissen üben", "practice"],
  ["pirsch", "Pirsch-Wissen üben", "practice"],
  ["keiler", "Keiler-Erkennung", "deer"],
  ["schusszeichen", "Schusszeichen-Trainer", "alert"],
  ["trefferzonen", "Trefferzonen-Trainer", "target"],
  ["wild", "Wildkunde", "deer"],
  ["wildansprache", "Wildansprache-Trainer", "deer"],
  ["nachsuche", "Nachsuche-Simulator", "paw"],
  ["schussfeld", "Schussfeld-Beurteilung", "target"],
  ["revier", "Revierkunde & Geländeformen", "tree"],
  ["trophaeen", "Trophäenbewertung", "deer"],
  ["nachtjagd", "Nachtjagd-Wissen üben", "moon"],
  ["waermebild", "Wärmebild-Ansprechen", "eye"],
  ["entfernung", "Entfernungsschätzung", "ruler"],
  ["beschuss", "Kugelfang & Sicherheitstrainer", "shield"],
  ["krankeswild", "Krankes Wild erkennen", "health"],
  ["familienverbaende", "Wildfamilien & Sozialstrukturen", "deer"],
  ["verhalten", "Wildverhalten beurteilen", "eye"],
  ["lauscher", "Lauscher- und Zeichendeutung", "deer"],
  ["wind", "Wind & Pirschrichtung", "wind"],
  ["mond", "Mondphasen-Revieraktivität", "moon"],
  ["ansprache_rehwild", "Rehwild-Ansprechen", "deer"],
  ["ansprache_schwarzwild", "Schwarzwild-Ansprechen", "deer"],
  ["ansprache_rotwild", "Rotwild-Ansprechen", "deer"],
  ["wildspuren", "Fährten- & Spurenkunde", "practice"],
  ["kugelwirkung", "Geschosswirkung-Demo", "target"],
  ["wildalarm", "Wild reagiert – was nun?", "alert"],
  ["optik", "Optik richtig nutzen", "binoculars"],
  ["waffenhandhabung", "Waffenhandhabungs-Simulator", "shield"],
];

export default function Jagdpraxis() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav} aria-label="Lernmenü">
        <Link href="/lernen"><AppIcon name="book" size={18} />Lernbereich</Link>
      </nav>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Üben und anwenden</p>
        <h1><span className={styles.headingIcon}><AppIcon name="practice" size={30} /></span><span>Jagdpraxis: Übungen & Ansitzsimulator</span></h1>
        <p className={styles.intro}>Wissen zu Ansprechen, Verhalten und Sicherheit üben. Die Aussageprüfungen greifen auf den geprüften Lernbestand zurück; der Ansitzsimulator beschreibt eigene Entscheidungsfälle.</p>
      </header>
      <LearningDiscovery category="Jagdpraxis" title="Vor den Simulatoren: Praxiswissen vertiefen" />
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
    </main>
  );
}
