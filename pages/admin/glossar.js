// 🔒 helpers
function getBearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
function isAuthorized(req) {
  const sent = getBearer(req).trim();
  const want = (process.env.ADMIN_PASS || "").trim();
  return Boolean(sent && want && sent === want);
}

// pages/admin/glossar.js
import { useState } from "react";

export default function GlossarAdmin() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [imported, setImported] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return setMsg("Bitte Excel-Datei wählen (.xlsx).");

    const pass = process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
    if (!pass) return setMsg("Abgebrochen.");

    const form = new FormData();
    form.append("file", file);

    setMsg("Import läuft …");
    const res = await fetch("/api/admin/glossar-import", {
      method: "POST",
      headers: { Authorization: `Bearer ${pass}` },
      body: form,
    });

    const j = await res.json().catch(()=>({}));
    if (!res.ok) return setMsg(`❌ ${j.error || res.statusText}${j.detail ? " – "+j.detail : ""}`);
    setImported(j.imported);
    setMsg("✅ Import erfolgreich");
  }

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:"0 16px"}}>
      <h1>Glossar Import (Admin)</h1>
      <p>Spalten: <code>id, term, definition, category, country</code></p>
      <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
        <input type="file" accept=".xlsx" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button type="submit" style={{padding:"10px 14px"}}>Import starten</button>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
      {imported!=null && <p><strong>Importierte Zeilen:</strong> {imported}</p>}
    </main>
  );
}
