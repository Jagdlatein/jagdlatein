import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JagdbuchListPage() {
  // KORREKTER API-CALL
  const res = await fetch(`/api/jagdbuch/posts`, {
    cache: "no-store",
  });

  let posts = [];
  try {
    posts = await res.json();
  } catch (e) {
    console.error("Fehler beim Laden:", e);
  }

  // Sortierung: neueste zuerst
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700, marginBottom: 20 }}>
        Jagdbuch
      </h1>

      <div style={{ marginBottom: 24 }}>
        <Link href="/jagdbuch/erstellen">
          <button
            style={{
              background: "#f3f3f3",
              border: "1px solid #ccc",
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ➕ Neuen Beitrag erstellen
          </button>
        </Link>
      </div>

      {posts.length === 0 && (
        <p style={{ color: "#777", marginTop: 20 }}>
          Noch keine Beiträge vorhanden.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/jagdbuch/${post.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                background: "#fff",
                padding: 22,
                borderRadius: 12,
                border: "1px solid #e0e0e0",
                boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <h2 style={{ margin: 0, marginBottom: 6 }}>{post.title}</h2>

              <p
                style={{
                  opacity: 0.75,
                  margin: 0,
                  marginBottom: 10,
                  lineHeight: "1.4",
                }}
              >
                {post.excerpt}
              </p>

              <small style={{ opacity: 0.6 }}>
                {new Date(post.date).toLocaleDateString("de-DE")} · Likes:{" "}
                {post.likes}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
