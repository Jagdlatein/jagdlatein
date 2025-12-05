"use client";

import { useState } from "react";
import RichEditor from "../../components/RichEditor";

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
        "x-user": "Jäger",
      },
      body: JSON.stringify({
        title,
        content,
        slug,
        excerpt: content.slice(0, 150),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!res.ok) {
      setSaving(false);
      setError("Fehler beim Speichern!");
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ marginBottom: 20 }}>Neuen Beitrag erstellen</h1>

      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
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

        {/* EDITOR */}
        <RichEditor value={content} onChange={setContent} />

        <div style={{ opacity: 0.6, fontSize: 14 }}>
          Vorschau: {content.slice(0, 150).length}/150 Zeichen
        </div>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button
          disabled={saving}
          style={{
            background: saving ? "#b89633" : "#caa53b",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Speichere..." : "Speichern"}
        </button>
      </form>
    </main>
  );
}
