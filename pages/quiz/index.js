import Seo from '../../components/Seo';
import RequireAccess from '../../components/RequireAccess';
import { useState } from 'react';

export default function QuizHome(){
  const [country, setCountry] = useState('DE');
  const [topic, setTopic] = useState('Alle');
  const startUrl = `/quiz/run?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`;

  return (
    <RequireAccess>
      <>
        <Seo title="Quiz – Jagdlatein" description="Prüfungsnah trainieren – wähle Land und Thema." />
        <section className="section">
          <div className="container" style={{maxWidth:820}}>
            <h1>Quiz</h1>
            <div className="card" style={{display:'grid', gap:12}}>
              <div>
                <label><b>Land</b></label><br/>
                <select value={country} onChange={e=>setCountry(e.target.value)} style={{padding:'10px', borderRadius:12, border:'1px solid rgba(42,35,25,.2)'}}>
                  <option value="DE">Deutschland</option>
                  <option value="AT">Österreich</option>
                  <option value="CH">Schweiz</option>
                </select>
              </div>
              <div>
                <label><b>Thema</b></label><br/>
                <select value={topic} onChange={e=>setTopic(e.target.value)} style={{padding:'10px', borderRadius:12, border:'1px solid rgba(42,35,25,.2)'}}>
                  <option>Alle</option>
                  <option>Wildkunde</option>
                  <option>Waffen & Schuss</option>
                  <option>Recht</option>
                </select>
  <option>Fangjagd</option>
<option>Seuchen</option>
<option>Erste Hilfe</option>
<option>Ökologie</option>
<option>Wald & Forst</option>

              </div>
              <div>
                <a className="cta" href={startUrl}>Quiz starten</a>
              </div>
            </div>
            <p className="small" style={{marginTop:12}}>
              Tipp: Auswahl „Alle“ mischt Themen. Fragensatz wird zufällig gezogen.
            </p>
          </div>
        </section>
      </>
    </RequireAccess>
  );
}
