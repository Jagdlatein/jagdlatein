import RequireAccess from '../../components/RequireAccess';
import Seo from '../../components/Seo';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { filterQuestions } from '../../data/questions';

export default function QuizRun(){
  const router = useRouter();
  const country = (router.query.country || 'DE').toString().toUpperCase();
  const topic = (router.query.topic || 'Alle').toString();

  const items = useMemo(() => filterQuestions({ country, topic, count: 10 }), [country, topic]);
  const [step, setStep] = useState(0);
  const [given, setGiven] = useState({});
  const [done, setDone] = useState(false);

  const current = items[step];

  const toggle = (qid, aid) => {
    setGiven(prev => {
      const set = new Set(prev[qid] || []);
      set.has(aid) ? set.delete(aid) : set.add(aid);
      return { ...prev, [qid]: [...set] };
    });
  };

  const isCorrect = (q) => {
    const a = new Set(given[q.id] || []);
    const c = new Set(q.correct);
    if (a.size !== c.size) return false;
    for (const x of a) if (!c.has(x)) return false;
    return true;
  };

  const next = () => step < items.length - 1 ? setStep(step+1) : setDone(true);
  const back = () => setStep(Math.max(0, step-1));
  const score = items.reduce((acc,q)=>acc + (isCorrect(q)?1:0), 0);

  return (
    <RequireAccess>
      <>
        <Seo title="Quiz starten – Jagdlatein" description="Prüfungsnahes Quiz mit Auswertung." />
        <section className="section">
          <div className="container" style={{maxWidth:820}}>
            <h1>Quiz</h1>
            <p className="small">Land: <b>{country}</b> · Thema: <b>{topic}</b> · Fragenpool: {items.length}</p>

            {!items.length ? (
              <div className="card">
                <p>Für diese Auswahl sind noch keine Fragen vorhanden.</p>
                <a className="btn" href="/quiz">Zurück</a>
              </div>
            ) : !done ? (
              <div className="card">
                <p className="small" style={{margin:'0 0 8px'}}>Frage {step+1} / {items.length} · Thema: <b>{current.topic}</b></p>
                <h3 style={{margin:'4px 0 12px'}}>{current.q}</h3>

                <div style={{display:'grid', gap:8}}>
                  {current.answers.map(a=>(
                    <label key={a.id} style={{
                      display:'flex', alignItems:'center', gap:10,
                      border:'1px solid rgba(42,35,25,.2)', borderRadius:12, padding:'10px 12px',
                      background: (given[current.id]?.includes(a.id) ? 'rgba(212,175,55,.12)' : 'rgba(255,255,255,.6)')
                    }}>
                      <input type="checkbox" checked={!!(given[current.id]?.includes(a.id))} onChange={()=>toggle(current.id, a.id)} />
                      <span>{a.text}</span>
                    </label>
                  ))}
                </div>

                <div style={{display:'flex', gap:10, marginTop:14}}>
                  <button className="btn" onClick={back} disabled={step===0}>Zurück</button>
                  <button className="cta" onClick={next}>{step < items.length - 1 ? 'Weiter' : 'Auswertung ansehen'}</button>
                </div>

                <details style={{marginTop:10}}>
                  <summary>Hinweis anzeigen</summary>
                  <p className="small" style={{marginTop:6}}>{current.explain}</p>
                </details>
              </div>
            ) : (
              <div className="card">
                <h3>Auswertung</h3>
                <p>Richtig: <b>{score}</b> von <b>{items.length}</b></p>
                <div style={{display:'grid', gap:8, marginTop:10}}>
                  {items.map(q=>(
                    <div key={q.id} style={{border:'1px solid rgba(42,35,25,.2)', borderRadius:12, padding:'8px 10px', background:'rgba(255,255,255,.6)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10}}>
                        <strong>{q.q}</strong>
                        <span style={{fontWeight:700, color: isCorrect(q) ? 'green' : '#8a2a2a'}}>
                          {isCorrect(q) ? '✔' : '✘'}
                        </span>
                      </div>
                      {!isCorrect(q) && <p className="small" style={{margin:'6px 0 0'}}>{q.explain}</p>}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', gap:10, marginTop:14}}>
                  <a className="btn" href="/quiz">Zur Übersicht</a>
                  <button className="cta" onClick={()=>{ location.replace(`/quiz/run?country=${country}&topic=${encodeURIComponent(topic)}`); }}>Nochmal mit neuer Reihenfolge</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </>
    </RequireAccess>
  );
}
