import RequireAccess from '../../components/RequireAccess';
import Seo from '../../components/Seo';
import { useMemo, useState } from 'react';

const QUESTIONS = [
  {
    id: 'w1',
    country: ['DE','AT','CH'],
    topic: 'Wildkunde',
    q: 'Woran erkennst du typischerweise Rehwild-Losung?',
    answers: [
      { id: 'a', text: 'Birnenförmig, oft in Ketten' },
      { id: 'b', text: 'Kugelig, groß wie Murmeln' },
      { id: 'c', text: 'Länglich, spiralig gedreht' },
      { id: 'd', text: 'Flach, scheibenförmig' },
    ],
    correct: ['a'],
    explain: 'Rehwild-Losung ist meist birnenförmig und kettenartig aneinandergereiht.'
  },
  {
    id: 'w2',
    country: ['DE','AT','CH'],
    topic: 'Waffen & Schuss',
    q: 'Welche Sicherheitsregel ist IMMER einzuhalten?',
    answers: [
      { id: 'a', text: 'Waffe ist sicher, wenn der Sicherungsschieber auf „S“ steht.' },
      { id: 'b', text: 'Waffe nie auf etwas richten, das nicht beschossen werden soll.' },
      { id: 'c', text: 'Im Revier kann die Mündung beliebig zeigen.' },
      { id: 'd', text: 'Abzugsdisziplin ist optional.' },
    ],
    correct: ['b'],
    explain: 'Mündungsdisziplin ist zentral: niemals auf etwas zielen, das nicht beschossen werden soll.'
  },
  {
    id: 'r1',
    country: ['DE'],
    topic: 'Recht (DE)',
    q: 'Wer ist in Deutschland Träger des Jagdrechts?',
    answers: [
      { id: 'a', text: 'Der jeweilige Jagdpächter' },
      { id: 'b', text: 'Der Grundstückseigentümer' },
      { id: 'c', text: 'Die Jagdgenossenschaft' },
      { id: 'd', text: 'Der Forstbetrieb' },
    ],
    correct: ['b'],
    explain: 'Jagdausübungsrecht kann verpachtet sein, Träger des Jagdrechts ist der Eigentümer.'
  },
];

function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }

export default function QuizRun(){
  const [step, setStep] = useState(0);
  const [given, setGiven] = useState({});
  const [done, setDone] = useState(false);

  const items = useMemo(()=>shuffle(QUESTIONS).slice(0, 10) /* später mehr */, []);
  const current = items[step];

  const select = (qid, aid) => {
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

  const next = () => {
    if (step < items.length - 1) setStep(step+1);
    else setDone(true);
  };

  const score = items.reduce((acc,q)=>acc + (isCorrect(q)?1:0), 0);

  return (
    <RequireAccess>
      <>
        <Seo title="Quiz starten – Jagdlatein" description="Prüfungsnahes Quiz mit Auswertung." />
        <section className="section">
          <div className="container" style={{maxWidth:820}}>
            <h1>Quiz</h1>

            {!done ? (
              <>
                <div className="card">
                  <p className="small" style={{margin:'0 0 8px'}}>
                    Frage {step+1} / {items.length} • Thema: <b>{current.topic}</b>
                  </p>
                  <h3 style={{margin:'4px 0 12px'}}>{current.q}</h3>

                  <div style={{display:'grid', gap:8}}>
                    {current.answers.map(a=>(
                      <label key={a.id} style={{
                        display:'flex', alignItems:'center', gap:10,
                        border:'1px solid rgba(42,35,25,.2)', borderRadius:12, padding:'10px 12px',
                        background: (given[current.id]?.includes(a.id) ? 'rgba(212,175,55,.12)' : 'rgba(255,255,255,.6)')
                      }}>
                        <input
                          type="checkbox"
                          checked={!!(given[current.id]?.includes(a.id))}
                          onChange={()=>select(current.id, a.id)}
                        />
                        <span>{a.text}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{display:'flex', gap:10, marginTop:14}}>
                    <button className="btn" onClick={()=>setStep(Math.max(0, step-1))} disabled={step===0}>Zurück</button>
                    <button className="cta" onClick={next}>{step < items.length - 1 ? 'Weiter' : 'Auswertung ansehen'}</button>
                  </div>
                </div>

                {/* Optional: Sofort-Feedback */}
                <details style={{marginTop:10}}>
                  <summary>Hinweis anzeigen</summary>
                  <p className="small" style={{marginTop:6}}>{current.explain}</p>
                </details>
              </>
            ) : (
              <div className="card">
                <h3>Auswertung</h3>
                <p>Richtig: <b>{score}</b> von <b>{items.length}</b></p>
                <div style={{display:'grid', gap:8, marginTop:10}}>
                  {items.map(q=>(
                    <div key={q.id} style={{border:'1px solid rgba(42,35,25,.2)', borderRadius:12, padding:'8px 10px', background:'rgba(255,255,255,.6)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10}}>
                        <strong style={{marginRight:6}}>{q.q}</strong>
                        <span style={{fontWeight:700, color: isCorrect(q) ? 'green' : '#8a2a2a'}}>
                          {isCorrect(q) ? '✔' : '✘'}
                        </span>
                      </div>
                      {!isCorrect(q) && (
                        <p className="small" style={{margin:'6px 0 0'}}>{q.explain}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', gap:10, marginTop:14}}>
                  <a className="btn" href="/quiz">Zur Übersicht</a>
                  <button className="cta" onClick={()=>{ setStep(0); setGiven({}); setDone(false); }}>Nochmals</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </>
    </RequireAccess>
  );
}
