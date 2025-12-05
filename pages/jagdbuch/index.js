import Link from "next/link";
import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      posts = JSON.parse(raw);
    }
  } catch (err) {
    console.error("❌ Fehler beim Lesen von posts.json:", err);
  }

  // Sortierung: Neueste Beiträge ganz oben
  posts.sort((a, b) => {
    const da = new Date(a.date || "1970-01-01");
    const db = new Date(b.date || "1970-01-01");
    return db - da;
  });

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

      {/* Neuer Beitrag Button */}
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
          transition: "0.2s",
        }}
      >
        ➕ Beitrag erstellen
      </Link>

      {/* Keine Beiträge */}
      {posts.length === 0 && (
        <p style={{ marginTop: 20, opacity: 0.7 }}>
          Noch keine Einträge vorhanden.
        </p>
      )}

      {/* Beitragsliste */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {posts.map((post) => {
          const excerpt =
            post.excerpt ||
            (post.content ? post.content.substring(0, 140) + "..." : "");

          return (
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
                transition: "all 0.2s ease",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24 }}>{post.title}</h2>

              <p style={{ margin: "8px 0 12px 0", color: "#6c6458" }}>
                {excerpt}
              </p>

              <p style={{ color: "#8a6a3e", fontSize: 15 }}>
                👍 {post.likes || 0} Likes
              </p>

              <p style={{ color: "#999", marginTop: 4, fontSize: 14 }}>
                📅 {post.date || "Unbekanntes Datum"}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
