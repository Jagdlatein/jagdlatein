"use client";

import { useEffect, useState } from "react";

export default function PostPage({ params }) {
  const { slug } = params;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  async function loadPost() {
    try {
      const res = await fetch(`/api/jagdbuch/post/${slug}`);
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
    setLoading(false);
  }

  async function addLike() {
    if (likeLoading) return;
    setLikeLoading(true);

    await fetch(`/api/jagdbuch/like/${slug}`, {
      method: "POST",
    });

    setPost((prev) => ({ ...prev, likes: prev.likes + 1 }));
    setLikeLoading(false);
  }

  async function sendComment() {
    if (!commentText.trim()) return;

    setSavingComment(true);

    const res = await fetch(`/api/jagdbuch/comment/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });

    const data = await res.json();

    setPost((prev) => ({
      ...prev,
      comments: [...prev.comments, data],
    }));

    setCommentText("");
    setSavingComment(false);
  }

  useEffect(() => {
    loadPost();
  }, []);

  if (loading) return <p style={{ padding: 32 }}>Lade Beitrag…</p>;

  if (!post)
    return (
      <p style={{ padding: 32, color: "red" }}>
        Beitrag nicht gefunden oder gelöscht.
      </p>
    );

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36 }}>{post.title}</h1>

      <p style={{ opacity: 0.6, marginTop: -8 }}>
        {post.date} · ❤️ {post.likes}
      </p>

      {/* LIKE BUTTON */}
      <button
        onClick={addLike}
        disabled={likeLoading}
        style={{
          marginTop: 12,
          background: "#caa53b",
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
        }}
      >
        ❤️ Gefällt mir
      </button>

      {/* HTML CONTENT */}
      <div
        style={{ marginTop: 30, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <hr style={{ margin: "40px 0", opacity: 0.3 }} />

      {/* KOMMENTARE */}
      <h2>Kommentare</h2>

      {post.comments.length === 0 && (
        <p style={{ opacity: 0.6 }}>Noch keine Kommentare vorhanden.</p>
      )}

      {post.comments.map((c, i) => (
        <div
          key={i}
          style={{
            background: "#f7f7f7",
            padding: 12,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <strong>{c.user ?? "Jäger"}</strong>
          <p style={{ margin: "4px 0" }}>{c.text}</p>
          <small style={{ opacity: 0.5 }}>{c.date}</small>
        </div>
      ))}

      {/* KOMMENTARFORMULAR */}
      <div style={{ marginTop: 20 }}>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Kommentar schreiben…"
          style={{
            width: "100%",
            minHeight: 100,
            padding: 10,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={sendComment}
          disabled={savingComment}
          style={{
            marginTop: 10,
            background: "#caa53b",
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          {savingComment ? "Speichere…" : "Kommentar senden"}
        </button>
      </div>
    </main>
  );
}
