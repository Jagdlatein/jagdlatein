import { useRouter } from "next/router";
import Seo from "../../components/Seo";
import styles from "./glossar.module.css";

// 👉 gleiche TERMS wie in index.js
const TERMS = [
  { slug: "ansitz", term: "Ansitz", def: "Stationäre Jagdart vom Hochsitz/Ansitz aus." },
  { slug: "anschuss", term: "Anschuss", def: "Ort, an dem das Wild beschossen wurde." },
  { slug: "absehen", term: "Absehen", def: "Fadenkreuz oder Markierung im Zielfernrohr." },
  { slug: "alttier", term: "Alttier", def: "Weibliches Rotwild ab dem dritten Lebensjahr." },
  { slug: "apportieren", term: "Apportieren", def: "Bringen des erlegten Wildes durch den Hund." },
  { slug: "bergstock", term: "Bergstock", def: "Stab zur Unterstützung beim Gehen im alpinen Gelände." },
  { slug: "balg", term: "Balg", def: "Fell von Raubwild oder Niederwild." },
  { slug: "balzen", term: "Balzen", def: "Paarungsritual des Federwildes." },
  { slug: "bejagungsschneise", term: "Bejagungsschneise", def: "Freigeschnittene Sichtschneise für sichere Schüsse." },
  { slug: "bruch", term: "Bruch", def: "Zweig als Jagdzeichen." },
  { slug: "bruchzeichen", term: "Bruchzeichen", def: "Mit Zweigen gelegte Zeichen im Revier." },

  { slug: "decke", term: "Decke", def: "Haut und Fell des Haarwildes." },
  { slug: "deckungswechsel", term: "Deckungswechsel", def: "Wechsel zwischen zwei Deckungsbereichen." },

  { slug: "einstand", term: "Einstand", def: "Bevorzugtes Rückzugsgebiet des Wildes." },
  { slug: "einfliegen", term: "Einfliegen", def: "Regelmäßiger Flugweg des Federwildes." },

  { slug: "fuchsfang", term: "Fuchsfang", def: "Bejagen des Fuchses." },
  { slug: "fegeschild", term: "Fegeschild", def: "Abgefegte Rinde durch Reh- oder Rotwild." },
  { slug: "frischling", term: "Frischling", def: "Junges Schwarzwild im ersten Lebensjahr." },
];

export default function GlossarSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  const entry = TERMS.find((t) => t.slug === slug);

  // ❌ Begriff nicht gefunden
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

  // ✅ Begriff gefunden
  return (
    <>
      <Seo
        title={`${entry.term} – Jagd-Glossar`}
        description={`Glossarbegriff: ${entry.term} – erklärt auf Jagdlatein.de`}
      />

      <main className={styles.wrapper}>
        <div className={styles.container}>

          <div className={styles.card}>
            <h1 className={styles.title}>{entry.term}</h1>

            <p className={styles.defBig}>
              {entry.def}
            </p>

            <a href="/glossar" className={styles.linkBack}>
              ← Zurück zum Glossar
            </a>
          </div>

        </div>
      </main>
    </>
  );
}
