import Seo from '../../components/Seo';

const TERMS = [
  { slug:'ansitz', term:'Ansitz', def:'Stationäre Jagdart vom Hochsitz/Ansitz aus.' },
  { slug:'bergstock', term:'Bergstock', def:'Stab zur Unterstützung beim Gehen im alpinen Gelände.' },
  { slug:'bruch', term:'Bruch', def:'Zweig als Jagdzeichen, z. B. Anschuss-, Inbesitznahmebruch.' },
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
        </div>
      </section>
    </>
  );
}
<p className="small" style={{marginTop:16}}>
  <a href="/quiz" style={{marginRight:10}}>Zum Quiz</a> ·
  <a href="/glossar" style={{marginLeft:10}}>Zum Glossar</a>
</p>
