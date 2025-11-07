// pages/admin/quiz.js
import { useState } from "react";

export default function AdminQuiz() {
  const [excelFile, setExcelFile] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [log, setLog] = useState("");

  function getAdminPass() {
    return process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
  }

  async function logResponse(res) {
    const status = res.status;
    const ok = res.ok;
    const headers = Object.fromEntries(res.headers.entries());
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {}
    const out = { ok, status, headers, json: json ?? null, raw: json ? undefined : text };
    setLog(JSON.stringify(out, null, 2));
    return out;
  }

  async function handleExcelUpload(commit = false) {
    if (!excelFile) { alert("❌ Bitte eine Excel-Datei auswählen."); return; }
    const pass = getAdminPass(); if (!pass) return;

    const fd = new FormData();
    fd.append("file", excelFile);

    const res = await fetch(`/api/admin/quiz-upload-github${commit ? "?commit=1" : ""}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pass.trim()}` },
      body: fd
    });

    const out = await logResponse(res);
    alert(out.ok ? "✅ Import erfolgreich!" : `❌ Fehler (Status ${out.status})`);
  }

  async function handleJsonUpload(commit = false) {
    let parsed;
    try { parsed = JSON.parse(jsonText); } catch { alert("❌ Ungültiges JSON"); return; }
    const pass = getAdminPass(); if (!pass) return;

    const payload = Array.isArray(parsed)
      ? { items: parsed, commit, filename: "questions.json" }
      : { ...parsed, commit };

    const res = await fetch("/api/admin/quiz-upload-json", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pass.trim()}` },
      body: JSON.stringify(payload)
    });

    const out = await logResponse(res);
    alert(out.ok ? "✅ JSON importiert!" : `❌ Fehler (Status ${out.status})`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>🧠 Quiz-Administration</h1>

      <section style={{ marginTop: 32 }}>
        <h2>📄 Excel-Import</h2>
        <input type="file" accept=".xlsx" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => handleExcelUpload(false)}>Nur DB importieren</button>
          <button onClick={() => handleExcelUpload(true)}>DB + GitHub Commit</button>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>💾 JSON-Import</h2>
        <textarea
          rows={10}
          placeholder='[{"id":1,"country":"DE","category":"Wild","topic":"Reh","question":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct":"A"}]'
          style={{ width: "100%", fontFamily: "monospace" }}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => handleJsonUpload(false)}>Nur DB importieren</button>
          <button onClick={() => handleJsonUpload(true)}>DB + GitHub Commit</button>
        </div>
      </section>

      {log && (
        <section style={{ marginTop: 32 }}>
          <h3>🪵 Ergebnis & Log</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 12, borderRadius: 6 }}>{log}</pre>
        </section>
      )}
    </main>
  );
}
