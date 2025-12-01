import Link from "next/link";
import fs from "fs";
import path from "path";

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  return { props: { posts } };
}

export default function Jagdbuch({ posts }) {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 20 }}>Jagdbuch</h1>
      <p style={{ marginBottom: 32 }}>
        Austausch für Jäger – Beiträge, Erfahrungen und Wissen.
      </p>

      <Link 
        href="/jagdbuch/erstellen"
        style={{
          display: "inline-block",
          background: "#caa53b",
          color: "#111",
          padding: "10px 20px",
          borderRadius: 12,
          fontWeight: "bold",
          marginBottom: 30,
        }}
      >
        Beitrag erstellen
      </Link>

      {posts.length === 0 && <p>Noch keine Einträge vorhanden.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {posts.map(post => (
          <Link 
            key={post.slug} 
            href={`/jagdbuch/${post.slug}`}
            style={{
              padding: 18,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              textDecoration: "none",
              color: "#111",
            }}
          >
            <h3 style={{ margin: 0 }}>{post.title}</h3>
            <p style={{ margin: "8px 0 0 0", color: "#555" }}>{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
