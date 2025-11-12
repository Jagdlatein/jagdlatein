// pages/admin/glossar.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function GlossarAdmin() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ term:"", body:"", country:"", category:"", slug:"" });
  const [editing, setEditing] = useState(null); // id oder null
  const take = 20;
  const [skip, setSkip] = useState(0);

  async function load() {
    setBusy(true);
    const r = await fetch(`/api/glossar?q=${encodeURIComponent(q)}&skip=${skip}&take=${take}`);
    const data = await r.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setBusy(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */}, [q, skip]);

  function resetForm() {
    setForm({ term:"", body:"", country:"", category:"", slug:"" });
    setEditing(null);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/glossar/${editing}` : "/api/glossar";
    const r = await fetch(url, {
      method, headers: { "Content-Type":"application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!r.ok) return alert("Fehler beim Speichern.");
    resetForm();
    load();
  }

  async function edit(id) {
    const r = await fetch(`/api/glossar/${id}`);
    const { item } = await r.json();
    setForm({
      term: item.term || "",
      body: item.body || "",
      country: item.country || "",
      category: item.category || "",
      slug: item.slug || "",
    });
    setEditing(id);
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  async function remove(id) {
    if (!confirm("Wirklich löschen?")) return;
    const r = await fetch(`/api/glossar/${id}`, { method:"DELETE" });
    if (!r.ok) return alert("Löschen fehlgeschlagen.");
    load();
  }

  return (
    <main style={{maxWidth: 980, margin:"20px auto", padding:"0 16px"}}>
      <h1 style={{fontSize:28, fontWeight:800, marginBottom:10}}>Glossar – Admin</h1>

      {/* Suche */}
      <div style={{display:"flex", gap:10, alignItems:"center", marginBottom:16}}>
        <input
          value={q} onChange={(e)=>{ setSkip(0); setQ(e.target.value); }}
          placeholder="Suchen nach Begriff, Text, Slug…"
          style={{flex:1, padding:"10px 12px", border:"1px solid #ccc", borderRadius:10}}
        />
        <button onClick={()=>{ setSkip(0); load(); }} style={{padding:"10px 12px", borderRadius:10, border:"1px solid #ccc"}}>Suchen</button>
      </div>

      {/* Formular */}
      <form onSubmit={submit}
            style={{background:"#fff", border:"1px solid #ddd", borderRadius:12, padding:14, marginBottom:16}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div>
            <label style={{fontWeight:700}}>Begriff (term)</label>
            <input value={form.term} onChange={e=>setForm({...form, term:e.target.value})}
                   required style={{width:"100%", padding:"10px 12px", border:"1px solid #ccc", borderRadius:10}} />
          </div>
          <div>
            <label style={{fontWeight:700}}>Slug (optional)</label>
            <input value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})}
                   placeholder="auto-aus-term, wenn leer"
                   style={{width:"100%", padding:"10px 12px", border:"1px solid #ccc", borderRadius:10}} />
          </div>
          <div>
            <label style={{fontWeight:700}}>Land (optional)</label>
            <input value={form.country} onChange={e=>setForm({...form, country:e.target.value})}
                   placeholder="DE / AT / CH …"
                   style={{width:"100%", padding:"10px 12px", border:"1px solid #ccc", borderRadius:10}} />
          </div>
          <div>
            <label style={{fontWeight:700}}>Kategorie (optional)</label>
            <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})}
                   placeholder="z. B. Waffenrecht, Wildkunde …"
                   style={{width:"100%", padding:"10px 12px", border:"1px solid #ccc", borderRadius:10}} />
          </div>
          <div style={{gridColumn:"1 / -1"}}>
            <label style={{fontWeight:700}}>Text (body)</label>
            <textarea value={form.body} onChange={e=>setForm({...form, body:e.target.value})}
                      required rows={8}
                      style={{width:"100%", padding:"10px 12px", border:"1px solid #ccc", borderRadius:10, fontFamily:"inherit"}} />
          </div>
        </div>

        <div style={{display:"flex", gap:10, marginTop:12}}>
          <button disabled={busy}
            style={{background:"#1f2b23", color:"#fff", border:"none", borderRadius:10, padding:"10px 14px", fontWeight:800}}>
            {editing ? "Änderungen speichern" : "Anlegen"}
          </button>
          {editing && (
            <button type="button" onClick={resetForm}
                    style={{background:"#fff", border:"1px solid #ccc", borderRadius:10, padding:"10px 14px"}}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      {/* Liste */}
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
        <div>{busy ? "Lade…" : `${total} Einträge`}</div>
        <div style={{display:"flex", gap:8}}>
          <button disabled={skip<=0} onClick={()=>setSkip(Math.max(skip-take,0))}>◀</button>
          <button disabled={skip+take>=total} onClick={()=>setSkip(skip+take)}>▶</button>
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
                <td style={{...td, textAlign:"right"}}>
                  <button onClick={()=>edit(it.id)} style={btnSm}>Bearbeiten</button>
                  <button onClick={()=>remove(it.id)} style={{...btnSm, background:"#b00020", color:"#fff"}}>Löschen</button>
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

const th = { textAlign:"left", padding:"10px 12px", fontWeight:800, fontSize:13 };
const td = { padding:"10px 12px", fontSize:14, verticalAlign:"top" };
const btnSm = { border:"1px solid #ccc", background:"#fff", borderRadius:8, padding:"6px 10px", marginLeft:6 };
