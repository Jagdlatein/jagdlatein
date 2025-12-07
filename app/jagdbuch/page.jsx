import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JagdbuchListPage() {
  const res = await fetch("/api/jagdbuch/list", { cache: "no-store" });
  const posts = await res.json();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 38, fontWeight: 700 }}>Jagdbuch</h1>

      <Link href="/jagdbuch/erstellen">
        <button
          style={{
            marginTop: 12,
            marginBottom: 24,
            padding: "10px 16px",
            background: "#eee",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ➕ Neuer Eintrag
        </button>
      </Link>

      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/jagdbuch/${post.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "white",
              border: "1px solid #ddd",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>{post.title}</h2>
            <p style={{ opacity: 0.7 }}>{post.excerpt}</p>
            <small style={{ opacity: 0.6 }}>
              {new Date(post.date).toLocaleDateString("de-DE")}
            </small>
          </div>
        </Link>
      ))}
    </main>
  );
}
