"use client";

import { useEffect, useState } from "react";

export default function PostPage({ params }) {
  const slug = params.slug;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");

  async function load() {
    const res = await fetch(`/api/jagdbuch/post/${slug}`);
    const json = await res.json();
    setPost(json);
    setLoading(false);
  }

  async function like() {
    await fetch(`/api/jagdbuch/like/${slug}`, { method: "POST" });
    setPost((p) => ({ ...p, likes: p.likes + 1 }));
  }

  async function sendComment() {
    if (!comment.trim()) return;
    const res = await fetch(`/api/jagdbuch/comment/${slug}`, {
      method: "POST",
      body: JSON.stringify({ text: comment }),
      headers: { "Content-Type": "application/json" },
    });
    const newComment = await res.json();

    setPost((p) => ({
      ...p,
      comments: [...p.comments, newComment],
    }));

    setComment("");
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p>Lade…</p>;
  if (!post) return <p>Beitrag nicht gefunden.</p>;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>{post.title}</h1>
      <p style={{ opacity: 0.6 }}>{post.likes} Likes</p>

      <button
        onClick={like}
        style={{ padding: "6px 12px", background: "#cca244" }}
      >
        ❤️ Gefällt mir
      </button>

      <div
        style={{ marginTop: 20 }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <hr style={{ margin: "40px 0" }} />

      <h2>Kommentare</h2>

      {post.comments.map((c, i) => (
        <div key={i} style={{ background: "#eee", padding: 12, marginBottom: 8 }}>
          <p>{c.text}</p>
          <small>{c.date}</small>
        </div>
      ))}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: "100%", minHeight: 100, marginTop: 10 }}
      />

      <button
        onClick={sendComment}
        style={{ padding: "6px 12px", marginTop: 10 }}
      >
        Kommentar senden
      </button>

      <hr />
      <a href={`/jagdbuch/bearbeiten/${slug}`}>
        ✏️ Beitrag bearbeiten
      </a>
    </main>
  );
}
