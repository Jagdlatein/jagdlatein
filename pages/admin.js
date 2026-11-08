import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getPaidPageProps } from '../lib/account-access';
import { isPayPalSandboxTestEnvironment } from '../lib/test-environment';
import AdminOverview from '../components/AdminOverview';
import Seo from '../components/Seo';

const blank = {
  id:'', countries:['DE'], topic:'Wildkunde',
  q:'', answers:[{id:'a',text:''},{id:'b',text:''},{id:'c',text:''},{id:'d',text:''}],
  correct:['a'], explain:''
};

export default function Admin({ testEnvironment = false } = {}){
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(blank);

  const add = () => {
    if (!draft.id || !draft.q) return alert('ID & Frage sind Pflicht.');
    setItems(prev => [...prev, draft]);
    setDraft({ ...blank, id: String(Date.now()) });
  };

  const del = (id) => setItems(prev => prev.filter(x => x.id !== id));
  const upd = (idx, field, val) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: val };
    setItems(copy);
  };

  const exportJS = () => {
    const header = `// data/questions.js – automatisch erzeugt\n`;
    const body = `export const QUESTIONS = ${JSON.stringify(items, null, 2)};\n\nexport function filterQuestions({ country = 'DE', topic = 'Alle', count = 10 }) {
  const pool = QUESTIONS.filter(q => (q.countries.includes(country)) && (topic === 'Alle' || q.topic === topic));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}\n`;
    const blob = new Blob([header + body], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'questions.js'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Seo title="Admin – Jagdlatein" />
      <Head><meta name="robots" content="noindex, nofollow" /></Head>
      <section className="section">
        <div className="container" style={{maxWidth:1180}}>
          <h1 tabIndex={-1} data-learning-page-start>Admin</h1>
          <p>Konten, Lernen, Nutzung und Abos an einem Ort.</p>
          <nav aria-label="Verwaltung" style={{display:'flex',flexWrap:'wrap',gap:10,margin:'18px 0 28px'}}>
            <Link className="btn" href="/admin/testabos">Testabos</Link>
            <Link className="btn" href="/admin/import">Import</Link>
            <Link className="btn" href="/admin/glossar">Glossar</Link>
            <Link className="btn" href="/admin/push">Push</Link>
            <Link className="btn" href="/online-kurse?ansicht=verwaltung">Kurse</Link>
            <Link className="btn" href="/konto">Konto</Link>
          </nav>
          <AdminOverview testEnvironment={testEnvironment} />
          <details className="card" style={{marginTop:28}} id="admin-fragen">
          <summary style={{cursor:'pointer',padding:'12px 0',fontWeight:700}}>Fragen</summary>
          <h2>Fragen-Editor</h2>
          <div className="card" style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <input value={draft.id} onChange={e=>setDraft({...draft,id:e.target.value})} placeholder="ID (einzigartig)"/>
              <select value={draft.topic} onChange={e=>setDraft({...draft,topic:e.target.value})}>
                <option>Wildkunde</option>
                <option>Waffen & Schuss</option>
                <option>Recht</option>
              </select>
            </div>

            <div>
              <label><b>Länder</b></label><br/>
              {['DE','AT','CH'].map(c=>(
                <label key={c} style={{marginRight:10}}>
                  <input
                    type="checkbox"
                    checked={draft.countries.includes(c)}
                    onChange={(e)=>{
                      const set = new Set(draft.countries);
                      e.target.checked ? set.add(c) : set.delete(c);
                      setDraft({...draft, countries:[...set]});
                    }}
                  /> {c}
                </label>
              ))}
            </div>

            <textarea rows={3} value={draft.q} onChange={e=>setDraft({...draft,q:e.target.value})} placeholder="Fragetext"></textarea>

            <div style={{display:'grid', gap:6}}>
              {draft.answers.map((a,i)=>(
                <div key={a.id} style={{display:'grid', gridTemplateColumns:'60px 1fr 120px', gap:6}}>
                  <input value={a.id} onChange={e=>{
                    const arr=[...draft.answers]; arr[i]={...a,id:e.target.value}; setDraft({...draft,answers:arr});
                  }} placeholder="a/b/c/d"/>
                  <input value={a.text} onChange={e=>{
                    const arr=[...draft.answers]; arr[i]={...a,text:e.target.value}; setDraft({...draft,answers:arr});
                  }} placeholder={`Antwort ${a.id}`}/>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.correct.includes(a.id)}
                      onChange={(e)=>{
                        const set=new Set(draft.correct);
                        e.target.checked? set.add(a.id) : set.delete(a.id);
                        setDraft({...draft,correct:[...set]});
                      }}
                    /> korrekt
                  </label>
                </div>
              ))}
            </div>

            <textarea rows={2} value={draft.explain} onChange={e=>setDraft({...draft,explain:e.target.value})} placeholder="Erklärung / Hinweis"></textarea>

            <div style={{display:'flex', gap:10}}>
              <button className="cta" onClick={add}>Frage hinzufügen</button>
              <button className="btn" onClick={exportJS}>Export nach questions.js</button>
            </div>
          </div>

          <h3 style={{marginTop:20}}>Fragenliste ({items.length})</h3>
          <div style={{display:'grid', gap:8}}>
            {items.map((q,idx)=>(
              <div key={q.id} className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10}}>
                  <b>{q.id}</b>
                  <button className="btn" onClick={()=>del(q.id)}>Löschen</button>
                </div>
                <div className="small">{q.topic} • {q.countries.join(', ')}</div>
                <textarea rows={2} value={q.q} onChange={e=>upd(idx,'q',e.target.value)} style={{marginTop:6}}/>
              </div>
            ))}
          </div>
          </details>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps(context) {
  const result = await getPaidPageProps(context, { adminOnly: true });
  if (!result.props) return result;
  try { return { props: { ...result.props, testEnvironment: isPayPalSandboxTestEnvironment() } }; }
  catch { return { redirect: { destination: '/konto?access=unavailable', permanent: false } }; }
}
