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
{ slug:'wechsel', term:'Wechsel', def:'Regelmäßig genutzter Weg des Wildes.' },
{ slug:'kirren', term:'Kirren', def:'Anlocken von Wild durch Futter.' },
{ slug:'verhoffen', term:'Verhoffen', def:'Wild bleibt kurz stehen, um zu sichern.' },
{ slug:'fuchsfang', term:'Fuchsfang', def:'Bejagen des Fuchses mit unterschiedlichen Fangmethoden.' },
{ slug:'sichern', term:'Sichern', def:'Wild prüft Umgebung mit Auge, Ohr und Nase.' },
{ slug:'zeichnen', term:'Zeichnen', def:'Reaktion des Wildes nach dem Schuss.' },
{ slug:'verblasen', term:'Verblasen', def:'Jagdlicher Brauch mit dem Jagdhorn.' },
{ slug:'verhitzen', term:'Verhitzen', def:'Wild wird durch Störung unruhig.' },
{ slug:'blasen', term:'Blasen', def:'Geräusch, wenn Rehbock weibliches Reh anlockt.' },
{ slug:'plätzen', term:'Plätzen', def:'Nahrungsaufnahme des Rehwildes.' },
{ slug:'brechen', term:'Brechen', def:'Fressen des Schwarzwildes.' },
{ slug:'fegen', term:'Fegen', def:'Hirsch/ Rehbock reibt Neubast ab.' },
{ slug:'rickenruf', term:'Rickenruf', def:'Ton der Ricke zur Kontaktaufnahme.' },
{ slug:'anschuss', term:'Anschuss', def:'Ort, an dem das Stück beim Schuss stand.' },
{ slug:'ausschuss', term:'Ausschuss', def:'Austrittsöffnung des Geschosses.' },
