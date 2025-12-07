export const dynamic = "force-dynamic";

export default async function PostPage({ params }) {
  const { slug } = params;

  const res = await fetch(`/api/jagdbuch/posts/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <p style={{ padding: 32 }}>Beitrag nicht gefunden.</p>;
  }

  let post = null;

  try {
    post = await res.json();
  } catch (e) {
    return <p style={{ padding: 32 }}>Beitrag ungültig.</p>;
  }

  if (!post || !post.title) {
    return <p style={{ padding: 32 }}>Beitrag nicht gefunden.</p>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36 }}>{post.title}</h1>

      <small style={{ opacity: 0.6 }}>
        {post.date
          ? new Date(post.date).toLocaleDateString("de-DE")
          : "Kein Datum"}
      </small>

      <p style={{ marginTop: 24, lineHeight: 1.6 }}>
        {post.content || ""}
      </p>
    </main>
  );
}
