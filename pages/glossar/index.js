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
  const search = query.trim().toLowerCase();
  const letters = [...new Set(TERMS.map(entry => entry.term[0].toUpperCase()))].sort((a, b) => a.localeCompare(b, "de"));
  const showTerms = Boolean(letter || search);
  const filtered = TERMS.filter(t => (!letter || t.term[0].toUpperCase() === letter) && (
    t.term.toLowerCase().includes(search) ||
    t.def.toLowerCase().includes(search)
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

          {letter && <nav className={styles.breadcrumb} aria-label="Glossarpfad"><a href="/glossar">Glossar A–Z</a><span aria-hidden="true">›</span><span aria-current="page">Begriffe mit {letter}</span></nav>}

          <div className={styles.searchBox}>
            <input
              type="search"
              maxLength={160}
              aria-label="Glossarbegriffe durchsuchen"
              placeholder="Begriff suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <h2 className={styles.indexHeading}>{showTerms ? letter ? `Begriffe mit ${letter}` : "Gefundene Begriffe" : "Anfangsbuchstaben"}</h2>
          {showTerms ? <>
          {search && <p role="status">{filtered.length} {filtered.length === 1 ? "Begriff gefunden" : "Begriffe gefunden"}{letter ? ` mit ${letter}` : ""}.</p>}
          <ul className={styles.entryList}>
            {filtered.length === 0 && (
              <li className={styles.empty}>Keine passenden Begriffe gefunden.</li>
            )}

            {filtered.map((t) => (
              <li key={t.slug}>
                <a href={`/glossar/${t.slug}`} className={styles.entryLink}>
                  <span>{t.term}</span><span aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
          </> : <ul className={styles.letterTree} aria-label="Glossar nach Anfangsbuchstaben">
            {letters.map(initial => {
              const count = TERMS.filter(entry => entry.term[0].toUpperCase() === initial).length;
              return <li key={initial}><a href={`/glossar?letter=${encodeURIComponent(initial)}`}><strong>{initial}</strong><span>{count} {count === 1 ? "Begriff" : "Begriffe"}</span><span aria-hidden="true">→</span></a></li>;
            })}
          </ul>}

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
