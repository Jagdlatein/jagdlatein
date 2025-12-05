import { promises as fs } from "fs";
import path from "path";

export default async function JagdbuchPage() {
  let posts = [];

  try {
    const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
    const file = await fs.readFile(filePath, "utf8");
    posts = JSON.parse(file);
  } catch (err) {
    console.error("❌ Fehler beim Lesen der posts.json:", err);
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700 }}>Jagdbuch</h1>

      <a href="/jagdbuch/erstellen">
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
      </a>

      {posts.length === 0 && (
        <p style={{ color: "#777" }}>Noch keine Beiträge vorhanden.</p>
      )}

      {posts.map((post) => (
        <a
          key={post.slug}
          href={`/jagdbuch/${post.slug}`}
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 18,
            }}
          >
            <h2>{post.title}</h2>
            <p style={{ opacity: 0.7 }}>{post.excerpt}</p>
            <small>{post.date} · Likes: {post.likes}</small>
          </div>
        </a>
      ))}
    </main>
  );
}
