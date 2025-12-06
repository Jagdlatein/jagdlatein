import { supabase } from "../../lib/supabase";

export default async function JagdbuchPage() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>Jagdbuch</h1>

      <a href="/jagdbuch/erstellen">
        <button style={{ padding: "8px 14px" }}>➕ Beitrag erstellen</button>
      </a>

      {!posts?.length && <p>Keine Beiträge vorhanden.</p>}

      {posts?.map((p) => (
        <a
          key={p.slug}
          href={`/jagdbuch/${p.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              marginTop: 16,
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <h2>{p.title}</h2>
            <p>{p.excerpt}</p>
            <small>{p.likes} Likes</small>
          </div>
        </a>
      ))}
    </main>
  );
}
