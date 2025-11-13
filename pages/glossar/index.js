import Seo from '../../components/Seo';

const TERMS = [
  { slug:'ansitz', term:'Ansitz', def:'Stationäre Jagdart vom Hochsitz/Ansitz aus.' },
  { slug:'bergstock', term:'Bergstock', def:'Stab zur Unterstützung beim Gehen im alpinen Gelände.' },
  { slug:'bruch', term:'Bruch', def:'Zweig als Jagdzeichen, z. B. Anschuss-, Inbesitznahmebruch.' },
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
];

export default function GlossarIndex(){
  return (
    <>
      <Seo title="Glossar – Jagdlatein" description="Begriffe aus Jagd und Praxis kurz erklärt." />
      <section className="section">
        <div className="container" style={{maxWidth:820}}>
          <h1>Glossar</h1>

          <ul style={{listStyle:'none', padding:0, margin:0}}>
            {TERMS.map(x=>(
              <li key={x.slug} style={{margin:'10px 0'}}>
                <a className="card" href={`/glossar/${x.slug}`} style={{display:'block'}}>
                  <h3 style={{margin:'0 0 6px'}}>{x.term}</h3>
                  <p style={{margin:0}}>{x.def}</p>
                </a>
              </li>
            ))}
          </ul>

          {/* Kleine Rücknavigation */}
          <p className="small" style={{marginTop:16}}>
            <a href="/" style={{marginRight:10}}>Startseite</a> ·
            <a href="/quiz" style={{marginLeft:10}}>Zum Quiz</a>
          </p>
        </div>
      </section>
    </>
  );
}
