export const dynamic = "force-dynamic";

export default async function PostPage({ params }) {
  const { slug } = params;

  const res = await fetch(`/api/jagdbuch/posts/${slug}`, {
    cache: "no-store",
  });
  const post = await res.json();

  if (!post || post.error) {
    return <p style={{ padding: 32 }}>Beitrag nicht gefunden.</p>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36 }}>{post.title}</h1>
      <small style={{ opacity: 0.6 }}>
        {post.date
          ? new Date(post.date).toLocaleDateString("de-DE")
          : ""}
      </small>

      <p style={{ marginTop: 24, lineHeight: 1.6 }}>{post.content}</p>
    </main>
  );
}
