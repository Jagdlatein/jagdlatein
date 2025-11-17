import Seo from '../../components/Seo';

const TERMS = {
  ansitz: {
    title:'Ansitz',
    body:'Stationäre Jagdart vom festen Stand (z. B. Hochsitz). Fördert Ruhe und sichere Schussabgabe.'
  },
  bergstock: {
    title:'Bergstock',
    body:'Stab/Stock als Gehhilfe im alpinen Gelände; unterstützt Stand und Sicherheit.'
  },
  bruch: {
    title:'Bruch',
    body:'Traditionelles Jagdzeichen aus Zweigen, z. B. Anschussbruch, Inbesitznahmebruch.',
  },
  wechsel: {
    ...
  },
  ...
};

export default function GlossarEntry({ title, body }){
  return (
    <>
      <Seo title={`${title} – Jagd-Glossar`} />
      <section className="page">
        <div className="page-inner">
          <h1>{title}</h1>
          <p>{body}</p>

          <p className="small" style={{marginTop:16}}>
            <a href="/glossar">Zurück zum Glossar</a>
          </p>
        </div>
      </section>
    </>
  );
}

function hasPaidAccessFromCookies(req) {
  const cookies = req.headers.cookie || "";
  const loggedIn = cookies.includes("jl_session=1");
  const paid = cookies.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx){
  const { req, params } = ctx;

  // ⛔ ohne Login + Zahlung → redirect auf /login
  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const { slug } = params || {};
  const hit = TERMS[slug];
  if (!hit) return { notFound: true };
  return { props: hit };
}
