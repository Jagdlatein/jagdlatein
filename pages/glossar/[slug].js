import { useRouter } from "next/router";
import Seo from "../../components/Seo";
import styles from "./glossar.module.css";

const TERMS = [
  { slug: "waidmutter", term: "Waidmutter", def: "Erfahrene Jägerin, die jagdliches Wissen weitergibt." },
{ slug: "waidmannsdank", term: "Waidmannsdank", def: "Traditionelle Dankesformel nach erfolgreicher Jagd." },
{ slug: "waidwund", term: "Waidwund", def: "Treffer im Weichteilbereich des Wildkörpers." },
{ slug: "weidgerechtigkeit", term: "Weidgerechtigkeit", def: "Jagdliches Handeln nach ethischen Regeln." },

{ slug: "wechselwild", term: "Wechselwild", def: "Wild, das zwischen Revieren wechselt." },
{ slug: "wintergatter", term: "Wintergatter", def: "Eingezäunter Bereich zur Winterfütterung von Schalenwild." },

{ slug: "zaunfluencer", term: "Zaunfluencer", def: "Wild wird durch äußere Einflüsse (z. B. Zaun) geleitet." }, 
{ slug: "zweitbruch", term: "Zweitbruch", def: "Zusätzlicher Bruch als Zeichen für besondere Beachtung." },
{ slug: "zuwarten", term: "Zuwarten", def: "Verhalten des Jägers: nach dem Schuss Ruhe bewahren und warten." },
{ slug: "standlaeufer", term: "Standläufer", def: "Wild, das während einer Drückjagd dicht vor den Schützen vorbeizieht." },
{ slug: "sammelplatz", term: "Sammelplatz", def: "Ort, an dem sich Wild vor oder nach Bewegungen sammelt." },

{ slug: "rickenrudel", term: "Rickenrudel", def: "Sozialverband weiblicher Rehe und deren Kitze." },
{ slug: "ranzzeit", term: "Ranzzeit", def: "Paarungszeit des Rehwildes." },
{ slug: "ruhr", term: "Ruhr", def: "Durchfall des Wildes, häufig nach Stress oder Futterwechsel." },
{ slug: "riss", term: "Riss", def: "Vom Beutegreifer geschlagenes Wild." },
{ slug: "hetzen", term: "Hetzen", def: "Jagen oder Versuchen des Hundes, Wild zu verfolgen – unerwünscht." },
{ slug: "haupt", term: "Haupt", def: "Kopf des Haarwildes (Jägersprache)." },
{ slug: "hoerner", term: "Hörner", def: "Waffen des Steinwildes und Muffelwildes." },

{ slug: "kitzplatz", term: "Kitzplatz", def: "Sichere Deckung, in der Rehkitze nach dem Setzen ruhen." },
{ slug: "kirre", term: "Kirre", def: "Futterauslage zum Anlocken von Schwarzwild." },
{ slug: "kontaktlaut", term: "Kontaktlaut", def: "Lautäußerung zur Kommunikation, z. B. Fiep- oder Beller." },
{ slug: "drueckjagd", term: "Drückjagd", def: "Bewegungsjagd mit Treibern und Hunden, bei der das Wild verhofft oder flüchtet." },
{ slug: "deckungshoehe", term: "Deckungshöhe", def: "Höhe der Vegetation, die dem Wild Deckung bietet." },
{ slug: "diep", term: "Diep", def: "Lautäußerung des weiblichen Rehwildes." },

{ slug: "fegen", term: "Fegen", def: "Reinigung des Geweihs von Bast durch Reiben an Bäumen." },
{ slug: "fressfeind", term: "Fressfeind", def: "Natürlicher Beutegreifer des Wildes." },

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
