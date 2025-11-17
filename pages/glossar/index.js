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
      <section className="page">
        <div className="page-inner">
          <h1>Jagd-Glossar</h1>
          <p className="lead">
            Zentrale Begriffe aus der Jägersprache – kompakt erklärt, damit du sie
            in der Jagdprüfung sicher beherrschst.
          </p>

          <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
            {TERMS.map((t) => (
              <li key={t.slug} style={{ marginBottom: 12 }}>
                <a
                  href={`/glossar/${t.slug}`}
                  style={{ fontWeight: 600, textDecoration: "none" }}
                >
                  {t.term}
                </a>
                <div style={{ fontSize: 14, color: "#4b5563" }}>{t.def}</div>
              </li>
            ))}
          </ul>

          <p className="small" style={{ marginTop: 16 }}>
            <a href="/" style={{ marginRight: 10 }}>
              Startseite
            </a>
            ·
            <a href="/quiz" style={{ marginLeft: 10 }}>
              Zum Quiz
            </a>
          </p>
        </div>
      </section>
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
