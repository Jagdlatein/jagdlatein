import { useState, useEffect } from "react";
import fs from "fs";
import path from "path";

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  return {
    paths: posts.map((p) => ({ params: { slug: p.slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const post = posts.find((p) => p.slug === params.slug);

  return {
    props: { post },
    notFound: !post,
  };
}

export default function JagdbuchPost({ post }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // Admin-Erkennung (Cookie)
  const isAdmin =
    typeof document !== "undefined" &&
    document.cookie.includes("jl_admin=1");

  // Browser-ID erzeugen (für Likes nur 1×)
  useEffect(() => {
    if (!localStorage.getItem("browserId")) {
      localStorage.setItem(
        "browserId",
        "id-" + Math.random().toString(36).substring(2)
      );
    }
  }, []);

  if (!post) return <p>Beitrag nicht gefunden.</p>;

  // 👍 Like senden
  async function sendLike() {
    const browserId = localStorage.getItem("browserId");

    const res = await fetch("/api/jagdbuch/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": browserId,
      },
      body: JSON.stringify({ slug: post.slug }),
    });

    const data = await res.json();
    setLikes(data.likes);
  }

  // 💬 Kommentar oder Antwort senden
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
    setComments(data.comments);
    setComment("");
    setReplyTo(null);
  }

  // ❌ Admin: Beitrag löschen
  async function deletePost() {
    if (!confirm("Beitrag wirklich löschen?")) return;

    await fetch("/api/jagdbuch/posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin": isAdmin ? "1" : "0",
      },
      body: JSON.stringify({ slug: post.slug }),
    });

    window.location.href = "/jagdbuch";
  }

  // 🔁 Kommentare + Antworten verschachtelt anzeigen
  function renderComments(list, level = 0) {
    return list.map((c) => (
      <div
        key={c.id}
        style={{
          marginLeft: level * 20,
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginTop: 14,
        }}
      >
        <strong>🦌 {c.user}</strong>{" "}
        <span style={{ color: "#777" }}>{c.date}</span>

        <p style={{ marginTop: 10, whiteSpace: "pre-line" }}>{c.text}</p>

        {/* Antworten-Button */}
        <button
          onClick={() => setReplyTo(c.id)}
          style={{
            background: "transparent",
            border: "none",
            color: "#8a6a3e",
            cursor: "pointer",
            marginTop: 5,
          }}
        >
          ↳ Antworten
        </button>

        {/* Antworten rekursiv darstellen */}
        {c.replies && c.replies.length > 0
          ? renderComments(c.replies, level + 1)
          : null}
      </div>
    ));
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      {/* BEITRAG */}
      <div
        style={{
          background: "#fff",
          padding: 28,
          borderRadius: 14,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          borderLeft: "6px solid #caa53b",
        }}
      >
        <h1>{post.title}</h1>
        <p style={{ color: "#8a6a3e" }}>📅 {post.date}</p>

        <article
          style={{
            marginTop: 20,
            whiteSpace: "pre-line",
            color: "#2a2319",
            fontSize: 17,
            lineHeight: 1.6,
          }}
        >
          {post.content}
        </article>

        {/* BILDER (NEU – BLOCK 5) */}
        {post.images && post.images.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3>Bilder</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {post.images.map((img) => (
                <img
                  key={img.id}
                  src={img.data}
                  style={{
                    width: "200px",
                    borderRadius: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* LIKE BUTTON */}
        <button
          onClick={sendLike}
          style={{
            marginTop: 24,
            background: "#caa53b",
            border: "none",
            padding: "10px 18px",
            fontSize: 16,
            borderRadius: 12,
            cursor: "pointer",
            color: "#111",
            fontWeight: "bold",
          }}
        >
          👍 Gefällt mir ({likes})
        </button>

        {/* ADMIN DELETE */}
        {isAdmin && (
          <button
            onClick={deletePost}
            style={{
              marginTop: 18,
              background: "#8a1a1a",
              color: "#fff",
              padding: "10px 16px",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            ❌ Beitrag löschen
          </button>
        )}
      </div>

      {/* KOMMENTAR-BEREICH */}
      <div style={{ marginTop: 40 }}>
        <h2>Kommentare</h2>

        {comments.length === 0 && (
          <p style={{ color: "#555" }}>Noch keine Kommentare vorhanden.</p>
        )}

        {/* THREAD */}
        <div style={{ marginTop: 16 }}>
          {renderComments(comments)}
        </div>

        {/* Kommentar-Formular */}
        <form onSubmit={sendComment} style={{ marginTop: 24 }}>
          {replyTo && (
            <p style={{ color: "#8a6a3e" }}>
              Antwort auf Kommentar #{replyTo}{" "}
              <button
                onClick={() => setReplyTo(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#8a1a1a",
                }}
              >
                ×
              </button>
            </p>
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kommentar schreiben…"
            required
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
              padding: "10px 18px",
              background: "#1f2b23",
              color: "#fff",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            {replyTo ? "Antwort senden" : "Kommentar senden"}
          </button>
        </form>
      </div>
    </main>
  );
}
