"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditPostPage({ params }) {
  const { slug } = params;
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(`/api/jagdbuch/posts/${slug}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPost(data);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!post) return;

    await fetch(`/api/jagdbuch/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });

    router.push(`/jagdbuch/${slug}`);
  }

  async function remove() {
    if (!confirm("Diesen Beitrag wirklich löschen?")) return;

    await fetch(`/api/jagdbuch/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    router.push("/jagdbuch");
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <p style={{ padding: 32 }}>Lade…</p>;
  }

  if (!post) {
    return <p style={{ padding: 32 }}>Beitrag nicht gefunden.</p>;
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Beitrag bearbeiten</h1>

      <input
        value={post.title || ""}
        onChange={(e) => setPost({ ...post, title: e.target.value })}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 12,
        }}
      />

      <textarea
        value={post.content || ""}
        onChange={(e) => setPost({ ...post, content: e.target.value })}
        style={{
          width: "100%",
          minHeight: 240,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 12,
        }}
      />

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button
          onClick={save}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Speichern
        </button>

        <button
          onClick={remove}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: "red",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Löschen
        </button>
      </div>
    </main>
  );
}
