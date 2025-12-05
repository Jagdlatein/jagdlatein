"use client";

import { useState } from "react";
import RichEditor from "../components/RichEditor";

export default function ErstellenPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user": "Jäger"
      },
      body: JSON.stringify({
        title,
        content,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        excerpt: content.slice(0, 150),
        date: new Date().toISOString().split("T")[0],
      })
    });

    if (!res.ok) {
      setError("Fehler beim Speichern.");
      setSaving(false);
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <h1>Neuen Beitrag erstellen</h1>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        <input
          type="text"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
        />

        {/* Rich Editor */}
        <RichEditor
          value={content}
          onChange={setContent}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          disabled={saving}
          style={{
            background: "#caa53b",
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: "bold",
            cursor: "pointer",
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>

      </form>
    </main>
  );
}
