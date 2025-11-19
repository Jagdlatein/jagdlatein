import { useRouter } from "next/router";
import Seo from "../../components/Seo";

// 👉 WICHTIG: Das TERMS-Array hier muss identisch sein wie in index.js
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
  { slug: "bruch", term: "Bruch", def: "Zweig als Jagdzeichen, z. B. Anschuss-, Inbesitznahmebruch." },
  { slug: "bruchzeichen", term: "Bruchzeichen", def: "Mit Zweigen gelegte Zeichen zur Verständigung im Revier." },

  // --- D ---
  { slug: "decke", term: "Decke", def: "Haut und Fell des Haarwildes." },
  { slug: "deckungswechsel", term: "Deckungswechsel", def: "Wechsel zwischen zwei Deckungsbereichen." },

  // --- E ---
  { slug: "einstand", term: "Einstand", def: "Bevorzugtes Rückzugsgebiet des Wildes." },
  { slug: "einfliegen", term: "Einfliegen", def: "Regelmäßiger Flugweg des Federwildes." },

  // --- F ---
  { slug: "fuchsfang", term: "Fuchsfang", def: "Bejagen des Fuchses mit unterschiedlichen Methoden." },
  { slug: "fegeschild", term: "Fegeschild", def: "Abgefegte Rinde durch Reh- oder Rotwild." },
  { slug: "frischling", term: "Frischling", def: "Junges Schwarzwild im ersten Lebensjahr." },

  // --- G ---
  { slug: "geraeuschlos", term: "Geräuschlos", def: "Leise Fortbewegung bei der Pirsch." },

  // --- I ---
  { slug: "inbesitznahmebruch", term: "Inbesitznahmebruch", def: "Bruch, der dem erlegten Wild aufgelegt wird." },

  // --- K ---
  { slug: "kirren", term: "Kirren", def: "Anlocken von Wild durch Futter." },
  { slug: "kirrung", term: "Kirrung", def: "Futterstelle zur Lenkung von Wild, v. a. Schwarzwild." },
  { slug: "kalb", term: "Kalb", def: "Jungtier des Rotwildes bis zum ersten Jahr." },
  { slug: "kugelfang", term: "Kugelfang", def: "Bereich hinter dem Wild, der das Geschoss sicher stoppt." },

  // --- L ---
  { slug: "letzterbissen", term: "Letzter Bissen", def: "Ehrenbruch im Äser des erlegten Wildes." },
  { slug: "leerbaum", term: "Leerbaum", def: "Ansitz ohne Wildsichtung." },

  // --- M ---
  { slug: "malbaum", term: "Malbaum", def: "Baum, an dem sich Schwarzwild nach dem Suhlen scheuert." },

  // --- N ---
  { slug: "nachhalten", term: "Nachhalten", def: "Waffe nach dem Schuss ruhig im Ziel halten." },

  // --- P ---
  { slug: "plaetzen", term: "Plätzen", def: "Äsen des Rehwildes auf offenen Flächen." },
  { slug: "pinscher", term: "Pinscher", def: "Knochensplitter am Anschuss." },
  { slug: "panseninhalt", term: "Panseninhalt", def: "Grüner Mageninhalt – Hinweis auf Waidwundschuss." },

  // --- R ---
  { slug: "rotte", term: "Rotte", def: "Familienverband des Schwarzwildes." },
  { slug: "rudel", term: "Rudel", def: "Sozialverband bei Rot-, Dam- und Muffelwild." },

  // --- S ---
  { slug: "sichern", term: "Sichern", def: "Wild prüft Umgebung mit Auge, Ohr und Nase." },
  { slug: "suhlen", term: "Suhlen", def: "Schlammbad des Schwarzwildes zur Hautpflege." },
  { slug: "schnueblung", term: "Schnüblung", def: "Flügelgeräusch beim Abstreichen von Enten." },
  { slug: "spur", term: "Spur", def: "Trittabdruck von Raubwild." },
  { slug: "schweiss", term: "Schweiß", def: "Jägersprache für Blut des Wildes." },
  { slug: "schweissfaden", term: "Schweißfaden", def: "Dünner Blutstreifen an der Fährte." },
  { slug: "schweisshund", term: "Schweißhund", def: "Hund für die Nachsuche auf verletztes Wild." },
  { slug: "schmalreh", term: "Schmalreh", def: "Junges weibliches Reh im zweiten Lebensjahr." },
  { slug: "sicherung", term: "Sicherung", def: "Vorrichtung zum Verhindern ungewollter Schussabgabe." },

  // --- T ---
  { slug: "trockentraining", term: "Trockentraining", def: "Übung der Waffenhandhabung ohne Munition." },

  // --- V ---
  { slug: "verwaisen", term: "Verwaisen", def: "Wild verliert Anschluss an die Gruppe." },
  { slug: "verhoffen", term: "Verhoffen", def: "Wild bleibt kurz stehen, um zu sichern." },
  { slug: "verblasen", term: "Verblasen", def: "Jagdlicher Brauch mit dem Horn." },
  { slug: "verhitzen", term: "Verhitzen", def: "Wild wird durch Störung nervös oder flüchtig." },
  { slug: "vertraegen", term: "Vertragen", def: "Wild zeigt Ruhe und kein Fluchtverhalten." },
  { slug: "vorstehhund", term: "Vorstehhund", def: "Hund der Wild durch Erstarren anzeigt." },

  // --- W ---
  { slug: "wechsel", term: "Wechsel", def: "Regelmäßig genutzter Weg des Wildes." },
  { slug: "wechselkirrung", term: "Wechselkirrung", def: "Kirrung an einem Wildwechsel." },

  // --- Z ---
  { slug: "zuege", term: "Züge", def: "Regelmäßige Wander- oder Ziehwege des Wildes." },
  { slug: "zusammentrieb", term: "Zusammentrieb", def: "Wild sammelt sich, bevor es gemeinsam zieht." },
  // ... ALLE weiteren Begriffe wie in index.js (bitte kopieren!)
];

export default function GlossarSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  const entry = TERMS.find((t) => t.slug === slug);

  if (!entry) {
    return (
      <main className="py-20 text-center bg-[#faf8f1] min-h-screen">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Begriff nicht gefunden</h1>
        <p className="mt-4 text-green-800">
          <a href="/glossar" className="underline">
            Zurück zum Glossar
          </a>
        </p>
      </main>
    );
  }

  return (
    <>
      <Seo
        title={`${entry.term} – Jagd-Glossar`}
        description={`Glossarbegriff: ${entry.term} – kompakt erklärt auf Jagdlatein.de`}
      />

      <main className="py-14 px-4 bg-[#faf8f1] min-h-screen flex justify-center">
        <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-sm rounded-2xl p-8">

          {/* Titel */}
          <h1 className="text-4xl font-extrabold mb-6 text-[#1a1a1a]">
            {entry.term}
          </h1>

          {/* Definition */}
          <p className="text-lg leading-relaxed text-gray-800 mb-10">
            {entry.def}
          </p>

          {/* Zurück Link */}
          <a
            href="/glossar"
            className="text-green-800 hover:underline text-sm"
          >
            ← Zurück zum Glossar
          </a>

        </div>
      </main>
    </>
  );
}
