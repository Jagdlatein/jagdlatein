import { useState } from "react";

export default function JagdbuchErstellen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function createSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const slug = createSlug(title);

    const res = await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user": "Jäger"   // 🔥 MUSS mitgesendet werden
      },
      body: JSON.stringify({
        title,
        content,
        slug,
        excerpt: content.substring(0, 150),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!res.ok) {
      setSaving(false);
      setError("Fehler beim Speichern. Bitte erneut versuchen.");
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ marginBottom: 20 }}>Neuen Beitrag erstellen</h1>

      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <input
          type="text"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
          required
        />

        <textarea
          placeholder="Inhalt schreiben..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            minHeight: 250,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
          required
        />

        {/* EXCERPT ZÄHLER */}
        <div style={{ fontSize: 14, opacity: 0.6 }}>
          Vorschau-Text Länge: {content.substring(0, 150).length}/150
        </div>

        {/* FEHLERMELDUNG */}
        {error && (
          <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>
        )}

        {/* 🔥 WICHTIG: type="submit" */}
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? "#b89633" : "#caa53b",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Speichere..." : "Speichern"}
        </button>
      </form>
    </main>
  );
}
