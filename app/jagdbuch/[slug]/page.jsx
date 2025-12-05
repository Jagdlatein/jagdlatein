import { notFound } from "next/navigation";

export default async function JagdbuchPostPage({ params }) {
  const slug = params.slug;

  const res = await fetch(process.env.NEXT_PUBLIC_SITE_URL + `/api/jagdbuch/get?slug=${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) return notFound();

  const post = await res.json();

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <PostClient post={post} />
    </main>
  );
}

// 🔥 Client-Komponente (Likes, Kommentare usw.)
"use client";

import { useEffect, useState } from "react";

function PostClient({ post }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // Browser-ID speichern
  useEffect(() => {
    if (!localStorage.getItem("browserId")) {
      localStorage.setItem("browserId", "id-" + Math.random().toString(36).substring(2));
    }
  }, []);

  async function sendLike() {
    const clientId = localStorage.getItem("browserId");

    const res = await fetch("/api/jagdbuch/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
      },
      body: JSON.stringify({ slug: post.slug }),
    });

    const data = await res.json();
    setLikes(data.likes);
  }

  async function sendComment(e) {
    e.preventDefault();

    const res = await fetch("/api/jagdbuch/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: post.slug,
        text: comment,
        replyTo,
        user: "Jäger",
      }),
    });

    const data = await res.json();
    setComments(data);
    setComment("");
    setReplyTo(null);
  }

  function renderComments(list, level = 0) {
    return list.map((c) => (
      <div
        key={c.id}
        style={{
          marginLeft: level * 20,
          marginTop: 16,
          background: "#fff",
          padding: 14,
          borderRadius: 10,
          boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
        }}
      >
        <strong>🦌 {c.user}</strong>{" "}
        <span style={{ color: "#777" }}>{c.date}</span>

        <p style={{ marginTop: 8, whiteSpace: "pre-line" }}>{c.text}</p>

        <button
          onClick={() => setReplyTo(c.id)}
          style={{
            marginTop: 6,
            background: "transparent",
            border: "none",
            color: "#8a6a3e",
            cursor: "pointer",
          }}
        >
          ↳ Antworten
        </button>

        {c.replies?.length > 0 && renderComments(c.replies, level + 1)}
      </div>
    ));
  }

  return (
    <>
      <div
        style={{
          background: "#fff",
          padding: 26,
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          borderLeft: "6px solid #caa53b",
        }}
      >
        <h1>{post.title}</h1>
        <p style={{ color: "#8a6a3e" }}>📅 {post.date}</p>

        <article
          style={{
            marginTop: 18,
            whiteSpace: "pre-line",
            fontSize: 17,
            color: "#2a2319",
            lineHeight: 1.6,
          }}
        >
          {post.content}
        </article>

        {post.images?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3>Bilder</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {post.images.map((img) => (
                <img
                  key={img.id}
                  src={img.data}
                  style={{
                    width: "220px",
                    borderRadius: 10,
                    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={sendLike}
          style={{
            marginTop: 20,
            background: "#caa53b",
            border: "none",
            padding: "10px 18px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          👍 Gefällt mir ({likes})
        </button>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2>Kommentare</h2>

        {comments.length === 0 && <p style={{ color: "#777" }}>Noch keine Kommentare.</p>}

        <div>{renderComments(comments)}</div>

        <form onSubmit={sendComment} style={{ marginTop: 20 }}>
          {replyTo && (
            <p style={{ color: "#8a6a3e" }}>
              Antwort auf Kommentar #{replyTo}{" "}
              <button
                onClick={() => setReplyTo(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8a1a1a",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </p>
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Kommentar schreiben…"
            style={{
              width: "100%",
              minHeight: 90,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />

          <button
            style={{
              marginTop: 12,
              background: "#1f2b23",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 12,
              cursor: "pointer",
              border: "none",
            }}
          >
            {replyTo ? "Antwort senden" : "Kommentar senden"}
          </button>
        </form>
      </section>
    </>
  );
}
