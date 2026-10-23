import Link from "next/link";
import AppIcon from "../../components/AppIcon";
import LearningDiscovery from "../../components/LearningDiscovery";
import RegionalLawResume from "../../components/RegionalLawResume";
import { learningModules } from "../../lib/learning-curriculum";
import styles from "../../styles/SectionMenu.module.css";

const countries = [
  { id: "DE", slug: "de", title: "Deutsches Jagdrecht", description: "Bundesjagdgesetz, Verordnungen & Landesjagdgesetze." },
  { id: "CH", slug: "ch", title: "Schweizer Jagdrecht", description: "JSG, JSV, Kantone & Jagdsysteme." },
  { id: "AT", slug: "at", title: "Österreichisches Jagdrecht", description: "Landesjagdgesetze, Verordnungen und Jagdkarten der Bundesländer." },
];

export async function getStaticProps() {
  const { getAllLegalCountryMetadata } = await import("../../lib/regional-law-data");
  const discoveryModules = learningModules.filter(module => module.category === "Jagdrecht").slice(0, 3)
    .map(module => ({ id: module.id, title: module.title, lessonCount: module.lessons.length, questionCount: module.questions.length }));
  return { props: { discoveryModules, regionCountries: getAllLegalCountryMetadata() } };
}

export default function JagdrechtHome({ discoveryModules, regionCountries = [] }) {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Rechtsquellen für dein Jagdgebiet</p>
        <h1><span className={styles.headingIcon}><AppIcon name="law" size={30} /></span><span>Jagdrecht für deine Prüfungsregion</span></h1>
        <p className={styles.intro}>Land wählen, Kanton oder Bundesland auswählen und gezielt mit Gesetzestexten und Rechtsfragen lernen.</p>
      </header>
      <RegionalLawResume countries={regionCountries} />
      <section className={styles.section} aria-labelledby="legal-country-choice">
        <h2 id="legal-country-choice">Für welches Land möchtest du lernen?</h2>
        <div className={styles.countryGrid}>
          {countries.map((country) => (
            <Link key={country.id} href={`/jagdrecht/${country.slug}`} className={styles.card}>
              <span className={`${styles.icon} ${styles.flag}`}><AppIcon name={`flag-${country.id}`} size={28} /></span>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{country.title}</h3>
                <p>{country.description}</p>
                <p>{regionCountries.find(item => item.code === country.id)?.regions.filter(region => region.code !== "BUND").length || ""} {country.id === "CH" ? "Kantone" : "Bundesländer"} · Gesetzesstellen, Prüfungsunterlagen und eigene Lernfragen</p>
              </div>
              <AppIcon name="arrow-right" size={20} className={styles.arrow} />
            </Link>
          ))}
        </div>
      </section>
      <details className={styles.section}><summary>Allgemeine Rechtsgrundlagen vertiefen</summary>
        <LearningDiscovery category="Jagdrecht" modules={discoveryModules} title="Jagdrecht Schritt für Schritt lernen" />
      </details>
    </main>
  );
}
