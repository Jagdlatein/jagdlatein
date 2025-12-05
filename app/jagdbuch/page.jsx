import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

export default async function JagdbuchPage() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  try {
    const data = await fs.readFile(filePath, "utf8");
    posts = JSON.parse(data);
  } catch {}

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Jagdbuch</h1>

      <Link href="/jagdbuch/erstellen">
        <button style={{ marginBottom: 20 }}>➕ Neuen Beitrag erstellen</button>
      </Link>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {posts.map((p) => (
          <Link key={p.slug} href={`/jagdbuch/${p.slug}`}>
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              <h3>{p.title}</h3>
              <p>{p.excerpt}</p>

              <div style={{ opacity: 0.6, fontSize: 14 }}>
                {p.date} — Likes: {p.likes ?? 0}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
