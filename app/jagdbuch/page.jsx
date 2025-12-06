"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function JagdbuchPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/jagdbuch/list")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>Jagdbuch</h1>

      <Link href="/jagdbuch/erstellen">
        <button>➕ Neuen Beitrag erstellen</button>
      </Link>

      {posts.map((post) => (
        <Link key={post.slug} href={`/jagdbuch/${post.slug}`}>
          <div style={{ padding: 20, border: "1px solid #ccc", marginTop: 20 }}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <small>{post.date} · Likes: {post.likes}</small>
          </div>
        </Link>
      ))}
    </main>
  );
}
