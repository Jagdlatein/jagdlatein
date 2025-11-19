import { useState } from "react";
import Seo from "../../components/Seo";

const TERMS = [
  // --- A ---
  { slug: "ansitz", term: "Ansitz", def: "Stationäre Jagdart vom Hochsitz/Ansitz aus." },
  { slug: "anschuss", term: "Anschuss", def: "Ort, an dem das Wild beschossen wurde." },
  { slug: "absehen", term: "Absehen", def: "Fadenkreuz oder Markierung im Zielfernrohr." },
  { slug: "alttier", term: "Alttier", def: "Weibliches Rotwild ab dem dritten Lebensjahr." },
  { slug: "apportieren", term: "Apportieren", def: "Bringen des erlegten Wildes durch den Hund." },

  // --- B ---
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
];


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

      <main className="p-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Jagd-Glossar</h1>

        <p className="text-lg text-gray-700 mb-6">
          Zentrale Begriffe aus der Jägersprache – kompakt erklärt.
        </p>

        {/* SUCHFELD */}
        <input
          type="text"
          placeholder="Begriff suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 mb-6 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-700"
        />

        {/* ERGEBNISLISTE */}
        <ul className="list-none p-0">
          {filtered.length === 0 && (
            <p className="text-gray-500">Keine passenden Begriffe gefunden.</p>
          )}

          {filtered.map((t) => (
            <li key={t.slug} className="mb-4">
              <a
                href={`/glossar/${t.slug}`}
                className="font-semibold text-green-800 hover:underline"
              >
                {t.term}
              </a>
              <div className="text-gray-700 text-sm mt-1">{t.def}</div>
            </li>
          ))}
        </ul>

        <p className="text-sm mt-8">
          <a href="/" className="mr-4 text-green-800 hover:underline">
            Startseite
          </a>
          ·
          <a href="/quiz" className="ml-4 text-green-800 hover:underline">
            Zum Quiz
          </a>
        </p>
      </main>
    </>
  );
}

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

export default GlossarIndex;
