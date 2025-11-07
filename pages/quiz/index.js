// pages/quiz/index.js
import prisma from "../../lib/prisma";

export async function getServerSideProps() {
  const count = await prisma.quizQuestion.count();
  const items = await prisma.quizQuestion.findMany({
    take: 10,
    orderBy: { id: "asc" },
    select: { id:true, country:true, category:true, topic:true, question:true, option_a:true, option_b:true, option_c:true, option_d:true, correct:true }
  });
  return { props: { count, items } };
}

export default function QuizPage({ count, items }) {
  return (
    <main style={{maxWidth:900, margin:"40px auto", padding:"0 16px", fontFamily:"system-ui,sans-serif"}}>
      <h1>🧠 Quiz</h1>
      <p style={{color:"#6b7280"}}>Fragen in DB: <b>{count}</b></p>
      {items.length === 0 && <p>Keine Fragen vorhanden. Bitte Import ausführen.</p>}
      <ol>
        {items.map(q => (
          <li key={q.id} style={{margin:"16px 0"}}>
            <div style={{fontSize:14, color:"#6b7280"}}>#{q.id} · {q.country} · {q.category} · {q.topic}</div>
            <div style={{fontWeight:600, margin:"6px 0"}}>{q.question}</div>
            <ul style={{margin:"6px 0 0 18px"}}>
              <li>A) {q.option_a}</li>
              <li>B) {q.option_b}</li>
              <li>C) {q.option_c}</li>
              <li>D) {q.option_d}</li>
            </ul>
          </li>
        ))}
      </ol>

  // Hilfsfunktionen
  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));
  const categories = useMemo(() => uniq(all.map(x => x.category)), [all]);
  const countries  = useMemo(() => uniq(all.map(x => x.country)),  [all]);

  // gefilterte Liste
  const filtered = useMemo(() => {
    let list = [...all];

    if (country)   list = list.filter(x => (x.country||"").toUpperCase() === country);
    if (category)  list = list.filter(x => (x.category||"") === category);
    if (difficulty)list = list.filter(x => (x.difficulty||"").toLowerCase() === difficulty);
    if (q.trim())  {
      const s = q.trim().toLowerCase();
      list = list.filter(x =>
        [x.question, x.topic, x.tags, x.category]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(s))
      );
    }

    // Shuffle einmalig pro Umschalter
    if (shuffled) {
      list = list
        .map(v => [Math.random(), v])
        .sort((a,b)=>a[0]-b[0])
        .map(v => v[1]);
    }
    return list;
  }, [all, country, category, difficulty, q, shuffled]);

  // idx zurücksetzen wenn Filter ändern
  useEffect(() => setIdx(0), [country, category, difficulty, q, shuffled]);

  const cur = filtered[idx];

  function next() { setIdx(i => Math.min(i+1, Math.max(filtered.length-1,0))); }
  function prev() { setIdx(i => Math.max(i-1, 0)); }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Quiz</h1>

        {/* Filter */}
        <div style={s.filters}>
          <select value={country} onChange={e=>setCountry(e.target.value)} style={s.sel}>
            <option value="">Alle Länder</option>
            {countries.map(c => <option key={c} value={c.toUpperCase()}>{c.toUpperCase()}</option>)}
          </select>

          <select value={category} onChange={e=>setCategory(e.target.value)} style={s.sel}>
            <option value="">Alle Kategorien</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} style={s.sel}>
            <option value="">Alle Stufen</option>
            {DIFF.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Suche (Frage, Tags, Thema)…"
            style={s.input}
          />

          <label style={s.chk}>
            <input type="checkbox" checked={shuffled} onChange={e=>setShuffled(e.target.checked)} />
            <span style={{marginLeft:8}}>Zufällige Reihenfolge</span>
          </label>
        </div>

        {/* Statusleiste */}
        <div style={s.status}>
          <div>{filtered.length} Fragen gefunden</div>
          <div>{filtered.length ? `${idx+1} / ${filtered.length}` : "—"}</div>
        </div>

        {/* Fragekarte */}
        {!filtered.length && (
          <div style={s.empty}>Keine Fragen für diese Filter.</div>
        )}

        {cur && (
          <article style={s.card}>
            {/* Bild, falls vorhanden */}
            {cur.image_url ? (
              <div style={s.imgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cur.image_url} alt={cur.topic || "Fragebild"} style={s.img}/>
              </div>
            ) : null}

            <div style={{padding:14}}>
              <div style={s.meta}>
                <span style={s.badge}>{(cur.country||"").toUpperCase()}</span>
                {cur.category ? <span style={s.badge}>{cur.category}</span> : null}
                {cur.difficulty ? <span style={s.badgeMuted}>{cur.difficulty}</span> : null}
              </div>

              <h2 style={s.q}>{cur.question}</h2>

              <ol style={s.list}>
                {["a","b","c","d"].map((k, i) => {
                  const label = String.fromCharCode(65+i); // A/B/C/D
                  const text  = cur[`option_${k}`];
                  if (!text) return null;
                  return (
                    <li key={k} style={s.li}>
                      <span style={s.keycap}>{label}</span>
                      <span style={{flex:1}}>{text}</span>
                      {cur.correct?.toUpperCase() === label ? (
                        <span style={s.correct}>richtig</span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              {cur.explanation ? (
                <div style={s.expl}>
                  <strong>Warum?</strong><br/>{cur.explanation}
                </div>
              ) : null}
            </div>
          </article>
        )}

        {/* Navigation */}
        <div style={s.nav}>
          <button onClick={prev} disabled={idx<=0} style={s.btn}>Zurück</button>
          <button onClick={next} disabled={idx>=filtered.length-1} style={s.btn}>Weiter</button>
        </div>
      </div>
    </main>
  );
}

// Styles (inline, mobilfreundlich)
const s = {
  page: { background:"linear-gradient(180deg,#fff,#f7faf7)" },
  wrap: { maxWidth:980, margin:"0 auto", padding:"20px 14px", fontFamily:"system-ui, Segoe UI, Roboto, Arial" },
  h1: { margin:"6px 0 12px", fontSize:34, lineHeight:1.15, color:"#121518" },
  filters:{
    display:"grid", gap:10,
    gridTemplateColumns:"1fr",
    alignItems:"center", marginBottom:12
  },
  sel:{ height:40, borderRadius:10, border:"1px solid #dfe7df", padding:"0 10px", background:"#fff" },
  input:{ height:40, borderRadius:10, border:"1px solid #dfe7df", padding:"0 12px", background:"#fff" },
  chk:{ display:"flex", alignItems:"center", fontSize:14, color:"#374151" },

  status:{ display:"flex", justifyContent:"space-between", fontSize:14, color:"#57636b", margin:"4px 2px 12px" },

  card:{ background:"#fff", border:"1px solid #e6eee6", borderRadius:14, overflow:"hidden",
    boxShadow:"0 8px 18px rgba(17,41,25,0.06)" },

  imgWrap:{ width:"100%", maxHeight:360, overflow:"hidden", background:"#f4f6f4" },
  img:{ width:"100%", objectFit:"cover" },

  meta:{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 },
  badge:{ background:"#e8f0ea", color:"#163a22", padding:"4px 8px", borderRadius:999, fontSize:12, fontWeight:700 },
  badgeMuted:{ background:"#eef0f2", color:"#333", padding:"4px 8px", borderRadius:999, fontSize:12 },

  q:{ fontSize:20, margin:"4px 0 10px", color:"#111827" },

  list:{ listStyle:"none", padding:0, margin:0, display:"grid", gap:8 },
  li:{ display:"flex", gap:10, alignItems:"center", border:"1px solid #edf2ee", borderRadius:12, padding:"10px 12px" },
  keycap:{ minWidth:28, height:28, borderRadius:8, background:"#eef3ef", display:"inline-grid",
    placeItems:"center", fontWeight:800, color:"#162a1b" },
  correct:{ background:"#e8f8ee", color:"#0a7a3b", border:"1px solid #c3edd5", padding:"2px 8px", borderRadius:999, fontSize:12 },

  expl:{ marginTop:12, background:"#fbfcfb", border:"1px dashed #e1e9e1", borderRadius:10, padding:"10px 12px", color:"#374151", fontSize:14 },

  nav:{ display:"flex", gap:10, justifyContent:"space-between", margin:"14px 0 6px" },
  btn:{ padding:"10px 14px", borderRadius:10, background:"#1d4d2b", color:"#fff", border:"none", cursor:"pointer",
    fontWeight:700, minWidth:120, opacity:1 },
};

// Desktop 2-Spalten-Filter
// (Diese kleine Regel kannst du optional in <Head><style> packen,
// ich lasse sie hier weg, weil die Seite schon mobil super läuft.)
