"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  async function save() {
    if (!title.trim()) return;

    const slug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now();

    const plainContent = content.replace(/<[^>]+>/g, "");
    const excerpt = plainContent.slice(0, 120);

   const base = process.env.NEXT_PUBLIC_BASE_URL || "https://jagdlatein.de";

await fetch(`${base}/api/jagdbuch/create`, {


      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ title, slug, content, excerpt }),
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
