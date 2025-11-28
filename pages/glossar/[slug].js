import { useRouter } from "next/router";
import Seo from "../../components/Seo";
import styles from "./glossar.module.css";

const TERMS = [
  // … deine komplette TERMS-Liste hier wie gehabt …
];

export default function GlossarSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  const entryIndex = TERMS.findIndex((t) => t.slug === slug);
  const entry = TERMS[entryIndex];

  // Fallback – Begriff existiert nicht
  if (!entry) {
    return (
      <main className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Begriff nicht gefunden</h1>

            <p className={styles.subtitle}>
              Dieser Glossarbegriff existiert nicht.
            </p>

            <a href="/glossar" className={styles.linkBack}>
              ← Zurück zum Glossar
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Vorheriger / Nächster Begriff
  const prev = TERMS[entryIndex - 1] || null;
  const next = TERMS[entryIndex + 1] || null;

  // Verwandte Begriffe (selber Anfangsbuchstabe)
  const related = TERMS.filter(
    (t) => t.term[0].toLowerCase() === entry.term[0].toLowerCase() && t.slug !== entry.slug
  ).slice(0, 6);

  // Alphabet-Leiste
  const letters = [...new Set(TERMS.map((t) => t.term[0].toUpperCase()))].sort();

  return (
    <>
      <Seo
        title={`${entry.term} – Jagd-Glossar Definition`}
        description={`Definition von "${entry.term}" aus der Jägersprache: ${entry.def}`}
        keywords={`Jagd Glossar ${entry.term}, Jägersprache Begriff ${entry.term}, Jagdlatein`}
      />

      <main className={styles.wrapper}>
        <div className={styles.container}>

          {/* A–Z Leiste */}
          <div className={styles.azBar}>
            {letters.map((l) => (
              <a key={l} href={`/glossar?letter=${l}`} className={styles.azItem}>
                {l}
              </a>
            ))}
          </div>

          {/* Begriff-Karte */}
          <div className={styles.card}>

            <div className={styles.slugHeader}>
              <h1 className={styles.slugTitle}>{entry.term}</h1>
              <span className={styles.slugLetter}>{entry.term[0].toUpperCase()}</span>
            </div>

            <p className={styles.defBig}>{entry.def}</p>

            {/* Kontrolle: Vorher/Nachher */}
            <div className={styles.navRow}>
              {prev && (
                <a href={`/glossar/${prev.slug}`} className={styles.navLink}>
                  ← {prev.term}
                </a>
              )}
              {next && (
                <a href={`/glossar/${next.slug}`} className={styles.navLink}>
                  {next.term} →
                </a>
              )}
            </div>

            {/* Verwandte Begriffe */}
            {related.length > 0 && (
              <div className={styles.relatedBox}>
                <h3 className={styles.relatedTitle}>Verwandte Begriffe</h3>
                <ul className={styles.relatedList}>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <a href={`/glossar/${r.slug}`} className={styles.relatedLink}>
                        {r.term}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a href="/glossar" className={styles.linkBack}>
              ← Zurück zum Glossar
            </a>

          </div>
        </div>
      </main>
    </>
  );
}
