import Seo from "../../components/Seo";

const TERMS = {
  ansitz: {
    title: "Ansitz",
    body:
      "Stationäre Jagdart vom festen Stand (z. B. Hochsitz). Fördert Ruhe, Übersicht und eine sichere Schussabgabe.",
  },
  bergstock: {
    title: "Bergstock",
    body:
      "Stab oder Stock als Gehhilfe im alpinen Gelände; unterstützt Stand, Gleichgewicht und Sicherheit.",
  },
  bruch: {
    title: "Bruch",
    body:
      "Traditionelles Jagdzeichen aus Zweigen, z. B. Anschussbruch, Inbesitznahmebruch oder letzter Bissen.",
  },
  wechsel: {
    title: "Wechsel",
    body:
      "Regelmäßig genutzter Pfad, auf dem das Wild zwischen Äsungs-, Einstands- und Ruheplätzen zieht.",
  },
  kirren: {
    title: "Kirren",
    body:
      "Gezieltes Anlocken von Wild (z. B. Schwarzwild) mit Futter an bestimmten Stellen.",
  },
  verhoffen: {
    title: "Verhoffen",
    body:
      "Wild bleibt nach einer Bewegung kurz stehen, um die Umgebung mit Sinnesorganen zu prüfen.",
  },
  fuchsfang: {
    title: "Fuchsfang",
    body:
      "Bejagung des Fuchses mit verschiedenen Methoden, z. B. Baujagd, Ansitzjagd oder Fangjagd.",
  },
  sichern: {
    title: "Sichern",
    body:
      "Aufmerksames Prüfen der Umgebung durch das Wild mit Augen, Ohren und Nase.",
  },
  zeichnen: {
    title: "Zeichnen",
    body:
      "Typische Reaktion des Wildes nach dem Schuss, z. B. Zeichnen am Anschuss.",
  },
  verblasen: {
    title: "Verblasen",
    body:
      "Jagdlicher Brauch mit dem Jagdhorn, z. B. Verblasen von Strecke oder Signalen.",
  },
  verhitzen: {
    title: "Verhitzen",
    body:
      "Wild wird durch anhaltende Störung unruhig, wechselt häufig den Einstand oder wird nachtaktiver.",
  },
  blasen: {
    title: "Blasen",
    body:
      "Lautäußerung, z. B. des Rehbocks in der Blattzeit oder des Rotwildes in der Brunft.",
  },
  plaetzen: {
    title: "Plätzen",
    body:
      "Nahrungsaufnahme des Rehwildes auf offenen Flächen, oft mit guter Übersicht über das Umfeld.",
  },
};

function GlossarEntry({ title, body }) {
  return (
    <>
      <Seo title={`${title} – Jagd-Glossar`} />
      <section className="page">
        <div className="page-inner" style={{ maxWidth: 740 }}>
          <p className="small" style={{ marginBottom: 8 }}>
            <a href="/glossar">← zurück zum Glossar</a>
          </p>
          <h1 style={{ marginTop: 12 }}>{title}</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>{body}</p>
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
  const { req, params } = ctx;

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const slug = params?.slug || "";
  const hit = TERMS[slug];

  if (!hit) {
    return { notFound: true };
  }

  return { props: hit };
}

export default GlossarEntry;
