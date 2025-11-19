import { useRouter } from "next/router";
import Seo from "../../components/Seo";

// 👉 gleiche TERMS wie in index.js einfügen
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

  // usw … (alle anderen Begriffe einfügen)
];

export default function GlossarSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  const entry = TERMS.find((t) => t.slug === slug);

  if (!entry) {
    return (
      <main className="glossar-wrapper">
        <div className="glossar-container">
          <h1 className="glossar-title">Begriff nicht gefunden</h1>

          <p className="glossar-subtitle">Dieser Glossarbegriff existiert nicht.</p>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a href="/glossar" style={{ color: "var(--forest)", fontWeight: 700 }}>
              ← Zurück zum Glossar
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Seo
        title={`${entry.term} – Jagd-Glossar`}
        description={`Glossarbegriff: ${entry.term} – erklärt auf Jagdlatein.de`}
      />

      <main className="glossar-wrapper">
        <div className="glossar-container">

          <div className="glossar-card" style={{ padding: "28px 32px" }}>
            <h1 className="glossar-title" style={{ marginBottom: "18px" }}>
              {entry.term}
            </h1>

            <p className="glossar-def" style={{ fontSize: 18, marginBottom: 32 }}>
              {entry.def}
            </p>

            <a href="/glossar" className="glossar-term" style={{ fontSize: 16 }}>
              ← Zurück zum Glossar
            </a>
          </div>

        </div>
      </main>
    </>
  );
}
