"use client";

import { useState } from "react";

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function submit(e) {
    e.preventDefault();

    const slug = title.toLowerCase().replace(/ /g, "-");

    await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        slug,
        excerpt: content.slice(0, 150),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Beitrag erstellen</h1>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel" required />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Inhalt" />
        <button>Speichern</button>
      </form>
    </main>
  );
}
