import { useState } from "react";
import { TERMS } from "../../data/glossary-terms";
import { getPaidPageProps } from "../../lib/account-access";
import Seo from "../../components/Seo";
import styles from "./glossar.module.css";



export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context);
  if (!access.props) return access;
  const requestedLetter = typeof context.query.letter === "string" ? context.query.letter.toUpperCase() : "";
  const letter = TERMS.some(entry => entry.term[0].toUpperCase() === requestedLetter) ? requestedLetter : "";
  return { props: { letter } };
}

export default function GlossarIndex({ letter = "" }) {
  const [query, setQuery] = useState("");

  const filtered = TERMS.filter(t => (!letter || t.term[0].toUpperCase() === letter) && (
    t.term.toLowerCase().includes(query.toLowerCase()) ||
    t.def.toLowerCase().includes(query.toLowerCase())
  ));

  return (
    <>
      <Seo
        title="Jagd-Glossar – Jagdlatein"
        description="Wichtige Begriffe aus der Jägersprache kurz und verständlich erklärt."
      />

      <main className={styles.wrapper}>
        <div className={styles.container}>

          <h1 className={styles.title}>Jagd-Glossar</h1>

          <p className={styles.subtitle}>
            Zentrale Begriffe aus der Jägersprache, kompakt erklärt. Einzelne Bezeichnungen werden regional unterschiedlich verwendet.
          </p>
          {letter && <p>Begriffe mit {letter} · <a href="/glossar">Alle Begriffe anzeigen</a></p>}

          <div className={styles.searchBox}>
            <input
              type="text"
              aria-label="Glossarbegriffe durchsuchen"
              placeholder="Begriff suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <ul className={styles.list}>
            {filtered.length === 0 && (
              <li className={styles.empty}>Keine passenden Begriffe gefunden.</li>
            )}

            {filtered.map((t) => (
              <li key={t.slug} className={styles.card}>
                <a href={`/glossar/${t.slug}`} className={styles.term}>
                  {t.term}
                </a>
                <p className={styles.def}>{t.def}</p>
              </li>
            ))}
          </ul>

          <div className={styles.footer}>
            <a href="/" className={styles.footerLink}>Startseite</a>
            <span>·</span>
            <a href="/quiz" className={styles.footerLink}>Zum Quiz</a>
          </div>

        </div>
      </main>
    </>
  );
}
