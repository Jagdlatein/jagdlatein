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
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);

  if (!post) return <p>Beitrag nicht gefunden.</p>;

  // 👍 Like senden
  async function sendLike() {
    const res = await fetch("/api/jagdbuch/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: post.slug }),
    });

    const data = await res.json();
    setLikes(data.likes);
  }

  // 💬 Kommentar senden
  async function sendComment(e) {
    e.preventDefault();

    const res = await fetch("/api/jagdbuch/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: post.slug,
        text: comment,
        user: "Jäger", // später dynamisch machen
      }),
    });

    const data = await res.json();
    setComments(data.comments);
    setComment("");
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      
      {/* Beitrag als Karte */}
      <div
        style={{
          background: "#fff",
          padding: 28,
          borderRadius: 14,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          borderLeft: "6px solid #caa53b",
        }}
      >
        <h1 style={{ marginBottom: 6 }}>{post.title}</h1>

        <p style={{ color: "#8a6a3e", marginBottom: 20 }}>
          📅 {post.date}
        </p>

        <article
          style={{
            whiteSpace: "pre-line",
            color: "#2a2319",
            fontSize: 17,
            lineHeight: 1.5,
          }}
        >
          {post.content}
        </article>

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
      </div>

      {/* Kommentare */}
      <div style={{ marginTop: 40 }}>
        <h2>Kommentare</h2>

        {comments.length === 0 && (
          <p style={{ color: "#555" }}>Noch keine Kommentare vorhanden.</p>
        )}

        {/* Kommentar-Liste */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((c, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <strong>{c.user}</strong> – <span style={{ color: "#777" }}>{c.date}</span>
              <p style={{ marginTop: 10, whiteSpace: "pre-line" }}>{c.text}</p>
            </div>
          ))}
        </div>

        {/* Kommentar-Feld */}
        <form onSubmit={sendComment} style={{ marginTop: 24 }}>
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
            Kommentar senden
          </button>
        </form>
      </div>
    </main>
  );
}
