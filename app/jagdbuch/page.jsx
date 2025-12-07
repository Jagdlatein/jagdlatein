"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  async function save() {
    const slug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now();

    const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 120);

    await fetch("/api/jagdbuch/create", {
      method: "POST",
      body: JSON.stringify({ title, slug, content, excerpt }),
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    router.push("/jagdbuch");
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Neuen Beitrag erstellen</h1>

      <input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <textarea
        placeholder="Inhalt"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          minHeight: 220,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={save}
        style={{
          padding: "12px 20px",
          marginTop: 20,
          borderRadius: 8,
          background: "#2563eb",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
        }}
      >
        Speichern
      </button>
    </main>
  );
}
