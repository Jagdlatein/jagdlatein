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
{ slug: "aeser", term: "Äser", def: "Maul des Schalenwildes (Jägersprache)." },
{ slug: "aesung", term: "Äsung", def: "Nahrung des Wildes, besonders Pflanzen und Kräuter." },

{ slug: "abschussplan", term: "Abschussplan", def: "Behördlich festgelegte Vorgabe zur Regulierung von Wildbeständen." },
{ slug: "abwurfstange", term: "Abwurfstange", def: "Natürlich abgeworfene Geweihstange eines Hirschs." },

{ slug: "balg", term: "Balg", def: "Fell oder Haut eines kleinen Haarwildes." },
{ slug: "ballistik", term: "Ballistik", def: "Lehre von Geschossflug, Geschwindigkeit und Wirkung." },
{ slug: "blattzeit", term: "Blattzeit", def: "Paarungszeit des Rehwildes (Juli–August)." },
{ slug: "brunft", term: "Brunft", def: "Paarungszeit des Rotwildes, Damwildes und anderen Arten." },
{ slug: "bruch", term: "Bruch", def: "Traditioneller Zweig als Zeichen bei Jagderfolg oder Ritual." },

{ slug: "drueckjagdlinie", term: "Drückjagdlinie", def: "Reihe von Schützen bei Bewegungsjagden." },
{ slug: "durchschuss", term: "Durchschuss", def: "Geschoss tritt auf der Gegenseite aus dem Wildkörper aus." },
{ slug: "deckungswechsel", term: "Deckungswechsel", def: "Wechsel des Wildes aus einer Deckungsform in die nächste." },

{ slug: "einstand", term: "Einstand", def: "Bevorzugtes Rückzugsgebiet des Wildes." },
{ slug: "einwechseln", term: "Einwechseln", def: "Wild zieht in ein Gebiet ein." },

{ slug: "federwild", term: "Federwild", def: "Alle jagdbaren Vogelarten." },
{ slug: "flaeche", term: "Fläche", def: "Schulterblatt des Schalenwildes." },
{ slug: "fluchtlinie", term: "Fluchtlinie", def: "Richtung, in die Wild bei Störung flüchtet." },
{ slug: "foersterdreieck", term: "Försterdreieck", def: "Messhilfe zur Altersbestimmung von Schwarzwild am Gebiss." },

{ slug: "geweih", term: "Geweih", def: "Knochige Waffe der Hirsche, jährlich erneuert." },
{ slug: "grandeln", term: "Grandeln", def: "Canini der Hirsche, besonders beim Rotwild bekannt." },
{ slug: "gestoeb", term: "Gestöb", def: "Verwühlte Fläche, oft durch Schwarzwild verursacht." },

{ slug: "herbstlaub", term: "Herbstlaub", def: "Bezeichnung für Wild, das im Herbstfärbungszustand steht." },
{ slug: "hegering", term: "Hegering", def: "Zusammenschluss von Jägern zur Pflege des Wildbestandes." },
{ slug: "herkunftsbruch", term: "Herkunftsbruch", def: "Bruch am Schützen zur Anzeige des erfolgreichen Schusses." },

{ slug: "jaegerrecht", term: "Jägerrecht", def: "Historische Bezeichnung für traditionelle Rechte des Jägers." },
{ slug: "jagdschneise", term: "Jagdschneise", def: "Freigeschnittener Streifen zur Beobachtung und zum Schuss." },
{ slug: "jagddruck", term: "Jagddruck", def: "Einwirkung durch Jagd, die Wild in Verhalten und Einstand beeinflusst." },

{ slug: "kirrplatz", term: "Kirrplatz", def: "Ort der Kirrung zur schonenden Bejagung des Schwarzwildes." },
{ slug: "kugelfang", term: "Kugelfang", def: "Sicherer Hintergrund, in dem das Geschoss gefahrlos wirkt." },
{ slug: "kitzrettung", term: "Kitzrettung", def: "Maßnahmen zum Schutz von Jungwild vor Mähwerken." },

{ slug: "lauben", term: "Lauben", def: "Sich lautlos bewegen, besonders bei der Pirsch." },
{ slug: "leitbache", term: "Leitbache", def: "Führendes weibliches Schwarzwild, soziale Anführerin der Rotte." },
{ slug: "loeffeln", term: "Löffeln", def: "Bewegen der Ohren bei Hunden oder Rehen." },

{ slug: "malbaum", term: "Malbaum", def: "Baum, an dem Schwarzwild sich scheuert oder Duftmarken hinterlässt." },
{ slug: "maeusefraß", term: "Mäusefraß", def: "Schäden an Kulturen durch Nagetierverbiss." },
{ slug: "meisterlampe", term: "Meister Lampe", def: "Jägersprache für den Feldhasen." },

{ slug: "nachtwechsel", term: "Nachtwechsel", def: "Wechsel, den Wild vorwiegend nachts nutzt." },
{ slug: "nachsuche", term: "Nachsuche", def: "Suchen und Stellen angeschossenen oder verletzten Wildes." },
{ slug: "nachsuchenfuehrer", term: "Nachsuchenführer", def: "Spezialisierter Hundeführer für schwierige Nachsuchen." },

{ slug: "pirsch", term: "Pirsch", def: "Anschleichen an das Wild, leise und gedeckt." },
{ slug: "pirschzeichen", term: "Pirschzeichen", def: "Spuren nach dem Schuss: Schweiß, Schnitthaar, Knochensplitter." },
{ slug: "plastron", term: "Plastron", def: "Brustfeder eines Birkhahns." },

{ slug: "rehfieber", term: "Rehfieber", def: "Aufgeregtheit des Jägers vor dem Schuss." },
{ slug: "rudel", term: "Rudel", def: "Sozialgruppe des Rotwildes oder Damwildes." },

{ slug: "schweiß", term: "Schweiß", def: "Blut des Wildes (Jägersprache)." },
{ slug: "schweisshund", term: "Schweißhund", def: "Speziell gezüchteter Hund für Nachsuchen." },
{ slug: "schnitthaar", term: "Schnitthaar", def: "Abgeschnittenes Haar am Anschuss, Hinweis auf den Treffer." },
{ slug: "standlaut", term: "Standlaut", def: "Laut eines Hundes, wenn er das Wild gestellt hat." },

{ slug: "truemmerbruch", term: "Trümmerbruch", def: "Starker, unruhiger Bruch am Ende eines Geweihs." },

{ slug: "verhoffung", term: "Verhoffung", def: "Wild bleibt kurz stehen, um zu prüfen, woher die Gefahr kommt." },
{ slug: "verblasen", term: "Verblasen", def: "Musikalisches Ehrenritual mit Jagdhorn." },

{ slug: "wechsel", term: "Wechsel", def: "Gleichbleibender Weg, den das Wild regelmäßig nutzt." },
{ slug: ".windkante", term: "Windkante", def: "Bereich, in dem Windverhältnisse sich abrupt ändern." },

{ slug: "zaunflucht", term: "Zaunflucht", def: "Wild orientiert sich an einem Zaun und zieht entlang." },
{ slug: "zirpen", term: "Zirpen", def: "Feiner Warnlaut, z. B. beim Rehwild." },

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
