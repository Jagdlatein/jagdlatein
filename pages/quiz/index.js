// pages/quiz/index.js
<p className="small"><a href="/quiz/run">Direkt starten</a></p>
import RequireAccess from '../../components/RequireAccess';
import Seo from '../../components/Seo';

const blocks = [
  { title:'Wildkunde', items:['Huftiere','Haarraubwild','Federwild'] },
  { title:'Waffen & Schuss', items:['Sicherheit','Ballistik','Wartung'] },
  { title:'Recht', items:['Deutschland','Österreich','Schweiz'] },
];

export default function QuizHome(){
  return (
    <RequireAccess>
      <>
        <Seo title="Quiz – Jagdlatein" description="Prüfungsnah trainieren – wähle dein Themengebiet." />
        <section className="section">
          <div className="container">
            <h1>Quiz</h1>
            <p className="lead">Trainiere prüfungsnah. Wähle ein Themengebiet:</p>
            <div className="grid">
              {blocks.map((b,i)=>(
                <div className="card" key={i}>
                  <h3>{b.title}</h3>
                  <ul style={{margin:'8px 0 12px',paddingLeft:18}}>
                    {b.items.map((it,j)=><li key={j}>{it}</li>)}
                  </ul>
                  <a className="btn" href="/login">Starten</a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    </RequireAccess>
  );
}
