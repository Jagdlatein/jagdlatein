// pages/admin/quiz.js
import { useState } from "react";

export default function AdminQuiz() {
  const [excelFile, setExcelFile] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [log, setLog] = useState("");

  async function handleExcelUpload(commit = false) {
    if (!excelFile) {
      alert("Bitte eine Excel-Datei auswählen.");
      return;
    }
    const pass = process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
    if (!pass) return;

    const fd = new FormData();
    fd.append("file", excelFile);

    const res = await fetch(`/api/admin/quiz-upload-github${commit ? "?commit=1" : ""}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pass.trim()}` },
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    setLog(JSON.stringify(data, null, 2));
    alert(res.ok ? "✅ Erfolgreich hochgeladen/importiert" : `❌ ${data.error}`);
  }

  async function handleJsonUpload(commit = false) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      alert("❌ Ungültiges JSON");
      return;
    }
    const pass = process.env.NEXT_PUBLIC_ADMIN_HINT || prompt("Admin-Passwort:");
    if (!pass) return;

    if (!Array.isArray(parsed)) {
      parsed = { ...(parsed || {}), commit };
    } else {
      parsed = { items: parsed, commit, filename: "questions.json" };
    }

    const res = await fetch("/api/admin/quiz-upload-json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pass.trim()}`,
      },
      body: JSON.stringify(parsed),
    });

    const data = await res.json().catch(() => ({}));
    setLog(JSON.stringify(data, null, 2));
    alert(res.ok ? "✅ Erfolgreich importiert" : `❌ ${data.error}`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>🧠 Quiz-Admin</h1>

      {/* Excel Upload */}
      <section style={{ marginTop: 32 }}>
        <h2>📄 Excel-Import</h2>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => handleExcelUpload(false)}>Nur DB importieren</button>
          <button onClick={() => handleExcelUpload(true)}>DB + GitHub committen</button>
        </div>
      </section>

      {/* JSON Upload */}
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
          <button onClick={() => handleJsonUpload(true)}>DB + GitHub committen</button>
        </div>
      </section>

      {/* Logs / Results */}
      {log && (
        <section style={{ marginTop: 32 }}>
          <h3>🪵 Ergebnis / Log:</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            {log}
          </pre>
        </section>
      )}
    </main>
  );
}
