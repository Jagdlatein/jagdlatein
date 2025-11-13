import Seo from '../../components/Seo';

const TERMS = {
  ansitz: {
    title:'Ansitz',
    body:'Stationäre Jagdart vom festen Stand (z. B. Hochsitz). Fördert Ruhe und sichere Schussabgabe.',
  },
  bergstock: {
    title:'Bergstock',
    body:'Stab/Stock als Gehhilfe im alpinen Gelände; unterstützt Stand und Sicherheit.',
  },
  bruch: {
    title:'Bruch',
    body:'Traditionelles Jagdzeichen aus Zweigen, z. B. Anschussbruch, Inbesitznahmebruch.',
  }
};

export default function GlossarDetail({ title, body }){
  return (
    <>
      <Seo title={`${title} – Glossar`} description={body.slice(0,120)} />
      <section className="section">
        <div className="container" style={{maxWidth:820}}>
          <a className="btn" href="/glossar">← Zurück zum Glossar</a>
          <h1 style={{marginTop:12}}>{title}</h1>
          <p>{body}</p>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps(ctx){
  const { slug } = ctx.params || {};
  const hit = TERMS[slug];
  if (!hit) return { notFound: true };
  return { props: hit };
}

