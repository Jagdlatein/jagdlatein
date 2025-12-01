"use client";

import { useState } from "react";

export default function NewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function submit(e) {
    e.preventDefault();

    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");

    await fetch("/api/jagdbuch/posts", {
      method: "POST",
      body: JSON.stringify({
        title,
        slug,
        excerpt: content.substring(0, 160),
        content,
        date: new Date().toISOString().split("T")[0],
      }),
    });

    window.location.href = "/jagdbuch";
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Neuen Beitrag erstellen</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="Titel"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <textarea
          className="w-full p-2 border rounded h-64"
          placeholder="Inhalt (HTML oder Text)"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />

        <button className="px-4 py-2 rounded bg-green-700 text-white">Speichern</button>
      </form>
    </main>
  );
}
