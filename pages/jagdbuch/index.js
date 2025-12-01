import Link from "next/link";
import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // 🔥 NEUESTE BEITRÄGE OBEN
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { props: { posts } };
}

export default function Jagdbuch({ posts }) {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 20, color: "#1f2b23" }}>
        Jagdbuch
      </h1>

      <p style={{ marginBottom: 32, color: "#4a433b", fontSize: 17 }}>
        Austausch für Jäger – Beiträge, Erfahrungen und Wissen.
      </p>

      {/* Beitrag erstellen */}
      <Link
        href="/jagdbuch/erstellen"
        style={{
          display: "inline-block",
          background: "#caa53b",
          color: "#111",
          padding: "10px 22px",
          borderRadius: 12,
          fontWeight: "bold",
          marginBottom: 30,
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        ➕ Beitrag erstellen
      </Link>

      {/* Leere Liste */}
      {posts.length === 0 && (
        <p style={{ marginTop: 20 }}>Noch keine Einträge vorhanden.</p>
      )}

      {/* Beitragskarten */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/jagdbuch/${post.slug}`}
            style={{
              background: "#fff",
              padding: 22,
              borderRadius: 14,
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              textDecoration: "none",
              color: "#1f2b23",
              borderLeft: "6px solid #caa53b",
              transition: "0.2s",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24 }}>{post.title}</h2>

            <p style={{ margin: "8px 0 12px 0", color: "#6c6458" }}>
              {post.excerpt || post.content?.slice(0, 120) + "..."}
            </p>

            {/* Likes-Anzeige */}
            <p style={{ color: "#8a6a3e", fontSize: 15 }}>
              👍 {post.likes || 0} Likes
            </p>

            <p style={{ color: "#999", marginTop: 4, fontSize: 14 }}>
              📅 {post.date}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
