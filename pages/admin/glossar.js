// pages/admin/glossar.js
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const COUNTRIES = ["DE", "AT", "CH"];
const CATEGORIES = ["Waffenrecht","Wildkunde","Jagdrecht","Hundewesen","Waffen & Munition","Hege","Sicherheit","Praxis"];

function slugify(s=""){
  return s.toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)+/g,"")
    .slice(0,120);
}

export default function GlossarAdmin(){
  const [q,setQ] = useState("");
  const [items,setItems] = useState([]);
  const [total,setTotal] = useState(0);
  const [busy,setBusy] = useState(false);
  const [sort,setSort] = useState("term");
  const [dir,setDir] = useState("asc");
  const [skip,setSkip] = useState(0);
  const take = 20;

  const [form,setForm] = useState({ term:"", slug:"", country:"", category:"", body:"" });
  const [editing,setEditing] = useState(null);
  const [preview,setPreview] = useState(false);
  const qRef = useRef(null);

  // debounce
  const [debQ,setDebQ] = useState(q);
  useEffect(()=>{ const t=setTimeout(()=>setDebQ(q),300); return ()=>clearTimeout(t); },[q]);

  async function load(){
    setBusy(true);
    const url = `/api/glossar?q=${encodeURIComponent(debQ)}&skip=${skip}&take=${take}&sort=${sort}&dir=${dir}`;
    const r = await fetch(url);
    const data = await r.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setBusy(false);
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[debQ,skip,sort,dir]);

  function resetForm(){ setForm({ term:"", slug:"", country:"", category:"", body:"" }); setEditing(null); setPreview(false); }

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    const payload = { ...form };
    if(!payload.slug) payload.slug = slugify(payload.term);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/glossar/${editing}` : "/api/glossar";
    const r = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if(r.status === 409) return alert("Slug bereits vergeben. Bitte ändern.");
    if(!r.ok) return alert("Speichern fehlgeschlagen.");
    resetForm(); load();
  }

  async function edit(id){
    const r = await fetch(`/api/glossar/${id}`);
    const { item } = await r.json();
    setForm({ term:item.term||"", slug:item.slug||"", country:item.country||"", category:item.category||"", body:item.body||"" });
    setEditing(id);
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  async function remove(id){
    if(!confirm("Wirklich löschen?")) return;
    const r = await fetch(`/api/glossar/${id}`, { method:"DELETE" });
    if(!r.ok) return alert("Löschen fehlgeschlagen.");
    if(editing===id) resetForm();
    load();
  }

  // Auto-Slug solange nicht manuell überschrieben
  useEffect(()=>{ if(!editing || !form.slug){ setForm(f=>({ ...f, slug: slugify(f.term) })); } },[form.term]); // eslint-disable-line

  return (
    <main style={{maxWidth: 980, margin:"20px auto", padding:"0 16px"}}>
      <h1 style={{fontSize:28, fontWeight:900, margin:"6px 0 14px"}}>Glossar – Admin</h1>

      {/* Suche */}
      <div style={{display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:10, marginBottom:12}}>
        <input ref={qRef} value={q} onChange={e=>{ setSkip(0); setQ(e.target.value); }}
          placeholder="Suchen (Begriff, Text, Slug, Kategorie)…"
          style={inp}/>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={inp}>
          <option value="term">Sort: Begriff</option>
          <option value="updatedAt">Sort: Aktualisiert</option>
          <option value="slug">Sort: Slug</option>
          <option value="category">Sort: Kategorie</option>
        </select>
        <select value={dir} onChange={e=>setDir(e.target.value)} style={inp}>
          <option value="asc">Aufsteigend</option>
          <option value="desc">Absteigend</option>
        </select>
        <button onClick={()=>{ setSkip(0); load(); }} style={btn}>Suchen</button>
      </div>

      {/* Formular */}
      <form onSubmit={submit} style={card}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div>
            <label style={label}>Begriff*</label>
            <input value={form.term} onChange={e=>setForm({...form, term:e.target.value})} required style={inp}/>
          </div>
          <div>
            <label style={label}>Slug</label>
            <input value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})} style={inp}/>
          </div>
          <div>
            <label style={label}>Land</label>
            <input list="countries" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} style={inp}/>
            <datalist id="countries">{COUNTRIES.map(c=><option key={c} value={c}/>)}</datalist>
          </div>
          <div>
            <label style={label}>Kategorie</label>
            <input list="cats" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={inp}/>
            <datalist id="cats">{CATEGORIES.map(c=><option key={c} value={c}/>)}</datalist>
          </div>
          <div style={{gridColumn:"1 / -1"}}>
            <label style={label}>Text (Markdown)*</label>
            <textarea value={form.body} onChange={e=>setForm({...form, body:e.target.value})} required rows={10}
              style={{...inp, height:"auto", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas"}}/>
          </div>
        </div>

        <div style={{display:"flex", gap:10, alignItems:"center", marginTop:10}}>
          <button disabled={busy} style={btnPrimary}>{editing ? "Änderungen speichern" : "Anlegen"}</button>
          {editing && <button type="button" onClick={resetForm} style={btn}>Abbrechen</button>}
          <label style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:6}}>
            <input type="checkbox" checked={preview} onChange={e=>setPreview(e.target.checked)}/>
            Vorschau
          </label>
        </div>

        {preview && (
          <div style={{marginTop:14, padding:14, border:"1px solid #ddd", borderRadius:12, background:"#fff"}}>
            <h3 style={{margin:"0 0 8px"}}>Vorschau</h3>
            <div style={{whiteSpace:"pre-wrap"}}>{form.body}</div>
          </div>
        )}
      </form>

      {/* Liste */}
      <div style={{display:"flex", justifyContent:"space-between", margin:"12px 0 6px"}}>
        <div>{busy ? "Lade…" : `${total} Einträge`}</div>
        <div style={{display:"flex", gap:8}}>
          <button disabled={skip<=0} onClick={()=>setSkip(Math.max(0, skip-take))} style={btn}>◀</button>
          <button disabled={skip+take>=total} onClick={()=>setSkip(skip+take)} style={btn}>▶</button>
        </div>
      </div>

      <div style={{border:"1px solid #ddd", borderRadius:12, overflow:"hidden"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead style={{background:"#f6f2e6"}}>
            <tr>
              <th style={th}>Begriff</th>
              <th style={th}>Slug</th>
              <th style={th}>Land</th>
              <th style={th}>Kategorie</th>
              <th style={th}>Aktualisiert</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=>(
              <tr key={it.id} style={{borderTop:"1px solid #eee"}}>
                <td style={td}><Link href={`/glossar/${it.slug}`} target="_blank">{it.term}</Link></td>
                <td style={td}>{it.slug}</td>
                <td style={td}>{it.country || "—"}</td>
                <td style={td}>{it.category || "—"}</td>
                <td style={td}>{new Date(it.updatedAt).toLocaleDateString()}</td>
                <td style={{...td, textAlign:"right", whiteSpace:"nowrap"}}>
                  <button onClick={()=>edit(it.id)} style={btn}>Bearbeiten</button>
                  <button onClick={()=>remove(it.id)} style={{...btn, background:"#b00020", color:"#fff", borderColor:"#a0001a"}}>Löschen</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={6} style={{padding:16, textAlign:"center", color:"#777"}}>Keine Einträge</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export async function getServerSideProps({ req }) {
  const cookies = req.headers.cookie || "";
  const isAdmin = /(?:^|;\s*)jl_admin=1(?:;|$)/.test(cookies);
  if (!isAdmin) {
    return { redirect: { destination: "/login?next=/admin/glossar", permanent: false } };
  }
  return { props: {} };
}

const label = { fontWeight:800, display:"block", marginBottom:6 };
const inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #ccc", background:"#fff" };
const btn = { padding:"10px 12px", borderRadius:10, border:"1px solid #ccc", background:"#fff" };
const btnPrimary = { padding:"10px 14px", borderRadius:10, border:"1px solid #d4af37", background:"#d4af37", color:"#231c0f", fontWeight:900, boxShadow:"0 8px 18px rgba(212,175,55,.22)" };
const th = { textAlign:"left", padding:"10px 12px", fontWeight:900, fontSize:13 };
const td = { padding:"10px 12px", fontSize:14, verticalAlign:"top" };
const card = { background:"#fff", border:"1px solid #ddd", borderRadius:12, padding:14, marginBottom:16 };
