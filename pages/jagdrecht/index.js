import Link from "next/link";
import AppIcon from "../../components/AppIcon";
import LearningDiscovery from "../../components/LearningDiscovery";
import styles from "../../styles/SectionMenu.module.css";

const countries = [
  { id: "DE", slug: "de", title: "Deutsches Jagdrecht", description: "Bundesjagdgesetz, Verordnungen & Landesjagdgesetze." },
  { id: "CH", slug: "ch", title: "Schweizer Jagdrecht", description: "JSG, JSV, Kantone & Jagdsysteme." },
  { id: "AT", slug: "at", title: "Österreichisches Jagdrecht", description: "Landesjagdgesetze, Verordnungen und Jagdkarten der Bundesländer." },
];

export default function JagdrechtHome() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav} aria-label="Lernmenü">
        <Link href="/lernen"><AppIcon name="book" size={18} />Lernbereich</Link>
      </nav>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Rechtsquellen für dein Jagdgebiet</p>
        <h1><span className={styles.headingIcon}><AppIcon name="law" size={30} /></span><span>Jagdrecht – Länderwahl</span></h1>
        <p className={styles.intro}>Wähle dein Land für die passenden Rechtsübersichten und regionalen Vorgaben.</p>
      </header>
      <LearningDiscovery category="Jagdrecht" title="Jagdrecht Schritt für Schritt lernen" />
      <section className={styles.section} aria-labelledby="legal-country-choice">
        <h2 id="legal-country-choice">Für welches Land möchtest du lernen?</h2>
        <div className={styles.countryGrid}>
          {countries.map((country) => (
            <Link key={country.id} href={`/jagdrecht/${country.slug}`} className={styles.card}>
              <span className={`${styles.icon} ${styles.flag}`}><AppIcon name={`flag-${country.id}`} size={28} /></span>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{country.title}</h3>
                <p>{country.description}</p>
              </div>
              <AppIcon name="arrow-right" size={20} className={styles.arrow} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
