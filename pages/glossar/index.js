import { useState } from "react";
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

function hasPaidAccessFromCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  const loggedIn = cookieHeader.includes("jl_session=1");
  const paid = cookieHeader.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx) {
  const { req } = ctx;

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function GlossarIndex() {
  const [query, setQuery] = useState("");

  const filtered = TERMS.filter((t) =>
    t.term.toLowerCase().includes(query.toLowerCase()) ||
    t.def.toLowerCase().includes(query.toLowerCase())
  );

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
            Zentrale Begriffe aus der Jägersprache – kompakt & prüfungsrelevant erklärt.
          </p>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Begriff suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <ul className={styles.list}>
            {filtered.length === 0 && (
              <p className={styles.empty}>Keine passenden Begriffe gefunden.</p>
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
