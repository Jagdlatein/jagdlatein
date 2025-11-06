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
    form.append("file", file);

    setMsg("Import läuft …");
    const res = await fetch("/api/quiz/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${pass}` },
      body: form,
    });
    const j = await res.json().catch(()=>({}));
    if (!res.ok) return setMsg(`❌ ${j.error || res.statusText} – ${j.detail || ""}`);
    setImported(j.imported);
    setMsg("✅ Import erfolgreich");
  }

  return (
    <main style={{maxWidth:720,margin:"40px auto",padding:"0 16px"}}>
      <h1>Quiz Import (Admin)</h1>
      <p>Spalten: <code>id, country, category, topic, question, option_a, option_b, option_c, option_d, correct</code></p>
      <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
        <input type="file" name="file" accept=".xlsx" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button type="submit">Import starten</button>
      </form>
      {msg && <p style={{marginTop:12}}>{msg}</p>}
      {imported!=null && <p><b>Importiert:</b> {imported}</p>}
    </main>
  );
}
