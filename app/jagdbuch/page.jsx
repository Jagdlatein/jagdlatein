export default async function JagdbuchPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/jagdbuch/posts`, {
    cache: "no-store",
  });

  const posts = res.ok ? await res.json() : [];

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700 }}>Jagdbuch</h1>

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
        <p style={{ color: "#777", marginTop: 20 }}>
          Noch keine Beiträge vorhanden.
        </p>
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
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 18,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            <h2 style={{ margin: 0 }}>{post.title}</h2>
            <p style={{ opacity: 0.7 }}>{post.excerpt}</p>
            <small style={{ opacity: 0.5 }}>
              {post.date} · Likes: {post.likes}
            </small>
          </div>
        </Link>
      ))}
    </main>
  );
}
