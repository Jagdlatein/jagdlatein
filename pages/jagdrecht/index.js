import Link from "next/link";
import AppIcon from "../../components/AppIcon";
import LearningDiscovery from "../../components/LearningDiscovery";
import RegionalLawResume from "../../components/RegionalLawResume";
import ExamProfileSummary from "../../components/ExamProfileSummary";
import PageMenu from "../../components/PageMenu";
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
        <h1>Jagdrecht</h1>
        <p className={styles.intro}>Wähle Land, Prüfungsregion und Thema im unteren Menü.</p>
      </header>
      <ExamProfileSummary />
      <PageMenu title="Jagdrecht – Land wählen" openInitially initialFocusId="jagdrecht-land-de">
      <RegionalLawResume countries={regionCountries} />
          {countries.map((country) => (
            <Link key={country.id} id={`jagdrecht-land-${country.slug}`} href={`/jagdrecht/${country.slug}`} prefetch={false}>
              <AppIcon name={`flag-${country.id}`} size={21} />{country.title}
            </Link>
          ))}
      <details className={styles.section}><summary>Allgemeine Rechtsgrundlagen vertiefen</summary>
        <LearningDiscovery category="Jagdrecht" modules={discoveryModules} title="Jagdrecht Schritt für Schritt lernen" />
      </details>
      </PageMenu>
    </main>
  );
}
