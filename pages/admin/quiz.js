// pages/admin/quiz.js
import { useState } from "react";

export default function QuizAdmin() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [imported, setImported] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return setMsg("Bitte Excel (.xlsx) wählen.");

    const pass = process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
    if (!pass) return setMsg("Abgebrochen.");

    const form = new FormData();
    form.append("file", file); // Feldname MUSS 'file' sein

    setMsg("Import läuft …");
    const res = await fetch("/api/quiz/upload", {
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
      <h1>Quiz Import (Admin)</h1>
      <p>Erwarte Spalten: <code>id, country, category, topic, question, option_a, option_b, option_c, option_d, correct</code></p>
      <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
        <input type="file" name="file" accept=".xlsx" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button type="submit" style={{padding:"10px 14px"}}>Import starten</button>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
      {imported!=null && <p><strong>Importierte Zeilen:</strong> {imported}</p>}
    </main>
  );
}
<hr style={{margin:"24px 0"}} />

<h2>Excel ↔ GitHub</h2>

{/* A) Excel → GitHub committen */}
<form
  onSubmit={async (e) => {
    e.preventDefault();
    const file = e.currentTarget.elements.namedItem("ghfile")?.files?.[0];
    if (!file) { alert("Bitte Excel wählen"); return; }
    const pass = process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
    if (!pass) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/quiz-upload-github", {
      method: "POST",
      headers: { Authorization: `Bearer ${pass}` },
      body: form,
    });
    const j = await res.json().catch(()=>({}));
    alert(res.ok ? `✅ Commit: ${j.committed}\nImportiert: ${j.imported}` : `❌ ${j.error}`);
  }}
  style={{display:"grid", gap:12, marginTop:12}}
>
  <label>Excel nach GitHub committen (.xlsx)</label>
  <input name="ghfile" type="file" accept=".xlsx" />
  <button type="submit" style={{padding:"10px 14px"}}>Upload & Commit</button>
</form>

{/* B) GitHub → DB importieren */}
<form
  onSubmit={async (e) => {
    e.preventDefault();
    const path = e.currentTarget.elements.namedItem("ghpath")?.value?.trim() || "data/quiz/latest.xlsx";
    const pass = process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
    if (!pass) return;
    const res = await fetch("/api/admin/quiz-import-github", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${pass}` },
      body: JSON.stringify({ path }),
    });
    const j = await res.json().catch(()=>({}));
    alert(res.ok ? `✅ Importiert: ${j.imported}\nDatei: ${j.path}` : `❌ ${j.error}`);
  }}
  style={{display:"grid", gap:12, marginTop:16}}
>
  <label>GitHub-Pfad (z. B. data/quiz/latest.xlsx)</label>
  <input name="ghpath" type="text" defaultValue="data/quiz/latest.xlsx" />
  <button type="submit" style={{padding:"10px 14px"}}>Aus GitHub importieren</button>
</form>
