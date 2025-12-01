import { useState } from "react";
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
  const [hasLiked, setHasLiked] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("liked_" + post.slug) === "1"
      : false
  );

  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [replyTo, setReplyTo] = useState(null); // ID des Kommentars für Antworten

  if (!post) return <p>Beitrag nicht gefunden.</p>;

  const isAdmin =
    typeof document !== "undefined" &&
    document.cookie.includes("jl_admin=1");

  // 👍 Like senden (pro Benutzer nur einmal)
  async function sendLike() {
    if (hasLiked) return;

    const res = await fetch("/api/jagdbuch/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: post.slug }),
    });

    const data = await res.json();
    setLikes(data.likes);

    localStorage.setItem("liked_" + post.slug, "1");
    setHasLiked(true);
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
        user: "Jäger", // Benutzername bleibt statisch
      }),
    });

    const data = await res.json();
    setComments(data.comments);
    setComment("");
    setReplyTo(null);
  }

  // 🔥 Admin: Beitrag löschen
  async function deletePost() {
    if (!confirm("Diesen Beitrag wirklich löschen?")) return;

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

  // 🎯 Kommentare mit Antworten rendern
  function renderComments(list, level = 0) {
    return list.map((c, i) => (
      <div
        key={i}
        style={{
          marginLeft: level * 20,
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginTop: 12,
        }}
      >
        <strong>🦌 {c.user}</strong>{" "}
        <span style={{ color: "#777" }}>{c.date}</span>

        <p style={{ marginTop: 10, whiteSpace: "pre-line" }}>{c.text}</p>

        <button
          onClick={() => setReplyTo(c.id)}
          style={{
            background: "transparent",
            border: "none",
            color: "#8a6a3e",
            marginTop: 6,
            cursor: "pointer",
          }}
        >
          ↳ Antworten
        </button>

        {/* Antworten */}
        {c.replies && c.replies.length > 0
          ? renderComments(c.replies, level + 1)
          : null}
      </div>
    ));
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      {/* Beitrag */}
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
            lineHeight: 1.5,
          }}
        >
          {post.content}
        </article>

        {/* LIKE */}
        <button
          onClick={sendLike}
          disabled={hasLiked}
          style={{
            marginTop: 24,
            background: hasLiked ? "#ccc" : "#caa53b",
            border: "none",
            padding: "10px 18px",
            fontSize: 16,
            borderRadius: 12,
            cursor: hasLiked ? "default" : "pointer",
            color: "#111",
            fontWeight: "bold",
          }}
        >
          👍 Gefällt mir ({likes})
        </button>

        {/* ADMIN: LÖSCHEN */}
        {isAdmin && (
          <button
            onClick={deletePost}
            style={{
              marginTop: 20,
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

      {/* Kommentare */}
      <div style={{ marginTop: 40 }}>
        <h2>Kommentare</h2>

        {comments.length === 0 && (
          <p style={{ color: "#555" }}>Noch keine Kommentare vorhanden.</p>
        )}

        {/* Kommentar-Thread */}
        <div>{renderComments(comments)}</div>

        {/* Kommentar-Feld */}
        <form onSubmit={sendComment} style={{ marginTop: 24 }}>
          {replyTo && (
            <p style={{ color: "#8a6a3e" }}>
              Antwort auf Kommentar #{replyTo}{" "}
              <button
                onClick={() => setReplyTo(null)}
                style={{
                  border: "none",
                  background: "transparent",
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
