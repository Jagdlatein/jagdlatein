export default async function Page() {
  const res = await fetch(process.env.NEXT_PUBLIC_SITE_URL + "/api/jagdbuch/posts", {
    cache: "no-store",
  });

  const posts = await res.json();

  return (
    <main style={{ padding: 32, maxWidth: 860, margin: "0 auto" }}>
      <h1>Jagdbuch</h1>

      <a href="/jagdbuch/erstellen">➕ Neuen Beitrag erstellen</a>

      {posts.map(p => (
        <a key={p.slug} href={`/jagdbuch/${p.slug}`} style={{ textDecoration: "none" }}>
          <div style={{ padding: 16, marginTop: 20, background: "#fff", borderRadius: 10 }}>
            <h2>{p.title}</h2>
            <p>{p.excerpt}</p>
            <small>{p.date} • 👍 {p.likes}</small>
          </div>
        </a>
      ))}
    </main>
  );
}
