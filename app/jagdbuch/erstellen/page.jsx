"use client";

import { useState } from "react";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  function createSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  async function savePost(e) {
    e.preventDefault();
    setSaving(true);

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
      alert("Fehler!");
      setSaving(false);
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Neuen Beitrag erstellen</h1>

      <form onSubmit={savePost} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Inhalt"
          style={{ minHeight: 200 }}
        />

        <button disabled={saving}>
          {saving ? "Speichere..." : "Speichern"}
        </button>
      </form>
    </main>
  );
}
