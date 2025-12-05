"use client";

import { useState } from "react";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function submit(e) {
    e.preventDefault();

    await fetch("/api/jagdbuch/posts", {
      method: "POST",
      body: JSON.stringify({
        title,
        content,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        excerpt: content.slice(0, 120)
      })
    });

    window.location.href = "/jagdbuch";
  }

  return (
    <form onSubmit={submit}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titel"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Inhalt"
      />
      <button>Speichern</button>
    </form>
  );
}
