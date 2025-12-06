"use client";

import { useState } from "react";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function save() {
    const slug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now();

    const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 120);

    await fetch("/api/jagdbuch/create", {
      method: "POST",
      body: JSON.stringify({
        title,
        slug,
        content,
        excerpt,
      }),
      headers: { "Content-Type": "application/json" },
    });

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>Neuen Beitrag erstellen</h1>

      <input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <textarea
        placeholder="Inhalt (HTML/Richtext)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", minHeight: 200, padding: 10 }}
      />

      <button
        onClick={save}
        style={{ padding: "8px 14px", marginTop: 12 }}
      >
        Speichern
      </button>
    </main>
  );
}
