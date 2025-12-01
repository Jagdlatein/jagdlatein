import { useState } from "react";

export default function JagdbuchErstellen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function submit(e) {
    e.preventDefault();

    await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        slug: title
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        excerpt: content.substring(0, 120),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ marginBottom: 20 }}>Neuen Beitrag erstellen</h1>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input
          type="text"
          placeholder="Titel"
          value={title}
          onChange={e => setTitle(e.target.value)}
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
          onChange={e => setContent(e.target.value)}
          style={{
            minHeight: 250,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
          required
        />

        <button
          style={{
            background: "#caa53b",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Speichern
        </button>
      </form>
    </main>
  );
}
