"use client";

import { useState } from "react";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createSlug = (text) =>
    text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    const slug = createSlug(title);

    const res = await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        title,
        content,
        excerpt: content.slice(0, 150),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!res.ok) {
      setSaving(false);
      setError("Fehler beim Speichern");
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>Neuen Beitrag erstellen</h1>

      <form onSubmit={submit}>
        <input
          style={{ width: "100%", padding: 10 }}
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          style={{ width: "100%", minHeight: 200, marginTop: 15 }}
          placeholder="Inhalt"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
          style={{ marginTop: 20, padding: 12, background: "#caa53b" }}
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </main>
  );
}
