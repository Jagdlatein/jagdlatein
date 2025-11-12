// pages/admin/glossar-import.js
import { useState } from "react";

export default function GlossarImport() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("create"); // create | upsert
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!file) return alert("Bitte CSV/XLSX auswählen.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);

    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/glossar/import", { method: "POST", body: fd });
      const data = await r.json();
      setRes(data);
      if (!r.ok) alert(data.error || "Import fehlgeschlagen");
    } catch (err) {
      alert(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Glossar Import</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Unterstützt: <code>.csv</code>, <code>.xlsx</code>, <code>.xls</code>. Erwartete Spalten: <b>term</b>, <b>body</b>, optional <b>country</b>, <b>category</b>, <b>slug</b>.
      </p>

      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontWeight: 800, display: "block", marginBottom: 6 }}>Datei</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label style={{ fontWeight: 800, display: "block", marginBottom: 6 }}>Modus</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ccc" }}>
              <option value="create">Nur neue Slugs anlegen (Duplikate überspringen)</option>
              <option value="upsert">Upsert (neu anlegen oder bei gleichem Slug aktualisieren)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={busy || !file}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #d4af37", background: "#d4af37", color: "#231c0f", fontWeight: 900 }}
            >
              {busy ? "Import läuft…" : "Import starten"}
            </button>
            <a
              href="data:text/csv;charset=utf-8,term,body,country,category,slug%0ATreibjagd,%22Gemeinschaftliche Jagdform ...%22,DE,Jagdrecht,treibjagd"
              download="glossar_template.csv"
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", background: "#fff" }}
            >
              CSV-Template
            </a>
          </div>
        </div>
      </form>

      {res && (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Ergebnis</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(res, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}

// Admin-Schutz
export async function getServerSideProps({ req }) {
  const cookies = req.headers.cookie || "";
  const isAdmin = /(?:^|;\s*)jl_admin=1(?:;|$)/.test(cookies);
  if (!isAdmin) {
    return { redirect: { destination: "/login?next=/admin/glossar-import", permanent: false } };
  }
  return { props: {} };
}
