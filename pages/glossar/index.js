import Seo from "../../components/Seo";

const TERMS = [
  { slug: "ansitz", term: "Ansitz", def: "Stationäre Jagdart vom Hochsitz/Ansitz aus." },
  { slug: "bergstock", term: "Bergstock", def: "Stab zur Unterstützung beim Gehen im alpinen Gelände." },
  { slug: "bruch", term: "Bruch", def: "Zweig als Jagdzeichen, z. B. Anschuss-, Inbesitznahmebruch." },
  { slug: "wechsel", term: "Wechsel", def: "Regelmäßig genutzter Weg des Wildes." },
  { slug: "kirren", term: "Kirren", def: "Anlocken von Wild durch Futter." },
  { slug: "verhoffen", term: "Verhoffen", def: "Wild bleibt kurz stehen, um zu sichern." },
  { slug: "fuchsfang", term: "Fuchsfang", def: "Bejagen des Fuchses mit unterschiedlichen Fangmethoden." },
  { slug: "sichern", term: "Sichern", def: "Wild prüft Umgebung mit Auge, Ohr und Nase." },
  { slug: "zeichnen", term: "Zeichnen", def: "Reaktion des Wildes nach dem Schuss." },
  { slug: "verblasen", term: "Verblasen", def: "Jagdlicher Brauch mit dem Jagdhorn." },
  { slug: "verhitzen", term: "Verhitzen", def: "Wild wird durch Störung unruhig." },
  { slug: "blasen", term: "Blasen", def: "Lautäußerung, z. B. beim Rehbock in der Blattzeit." },
  { slug: "plaetzen", term: "Plätzen", def: "Nahrungsaufnahme des Rehwildes auf offenen Flächen." },
];

function GlossarIndex() {
  return (
    <>
      <Seo
        title="Jagd-Glossar – Jagdlatein"
        description="Wichtige Begriffe aus der Jägersprache kurz und verständlich erklärt."
      />

      <main className="p-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Jagd-Glossar</h1>

        <p className="text-lg text-gray-700 mb-6">
          Zentrale Begriffe aus der Jägersprache – kompakt erklärt, damit du sie
          in der Jagdprüfung sicher beherrschst.
        </p>

        <ul className="list-none p-0">
          {TERMS.map((t) => (
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
