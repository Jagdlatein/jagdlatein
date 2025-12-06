"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function JagdbuchPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    try {
      const res = await fetch("/api/jagdbuch/list");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 20 }}>
        Jagdbuch
      </h1>

      {/* Neuer Beitrag Button */}
      <Link href="/jagdbuch/erstellen">
        <button
          style={{
            background: "#caa53b",
            padding: "10px 16px",
            borderRadius: 8,
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            marginBottom: 30,
          }}
        >
          ➕ Neuen Beitrag erstellen
        </button>
      </Link>

      {loading && <p>Beiträge werden geladen…</p>}

      {!loading && posts.length === 0 && (
        <p style={{ opacity: 0.7, marginTop: 20 }}>
          Noch keine Beiträge vorhanden.
        </p>
      )}

      {/* Beitrag-Liste */}
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/jagdbuch/${post.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 20,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 8 }}>{post.title}</h2>

            <p style={{ opacity: 0.7, margin: "6px 0 10px" }}>
              {post.excerpt}
            </p>

            <small style={{ opacity: 0.5 }}>
              {post.date} · ❤️ {post.likes}
            </small>
          </div>
        </Link>
      ))}
    </main>
  );
}
