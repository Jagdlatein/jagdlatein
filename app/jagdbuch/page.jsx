import path from "path";
import { promises as fs } from "fs";
import Link from "next/link";

export default async function JagdbuchPage() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  let posts = [];

  try {
    const data = await fs.readFile(filePath, "utf8");
    posts = JSON.parse(data);
  } catch (err) {
    console.error("❌ Konnte posts.json nicht lesen:", err);
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700, marginBottom: 20 }}>
        Jagdbuch
      </h1>

      <Link href="/jagdbuch/erstellen">
        <button
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            padding: "8px 14px",
            borderRadius: 8,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          ➕ Neuen Beitrag erstellen
        </button>
      </Link>

      {posts.length === 0 && (
        <p style={{ opacity: 0.6 }}>Noch keine Beiträge vorhanden.</p>
      )}

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
              marginBottom: 16,
              borderRadius: 10,
              border: "1px solid #ddd",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            <h2 style={{ margin: 0 }}>{post.title}</h2>
            <p style={{ opacity: 0.7 }}>{post.excerpt}</p>
            <small style={{ opacity: 0.5 }}>
              {post.date} — Likes: {post.likes ?? 0}
            </small>
          </div>
        </Link>
      ))}
    </main>
  );
}
