import { kv } from "@vercel/kv";

export default async function PostPage({ params }) {
  const items = await kv.lrange("posts", 0, -1);
  const posts = items.map(JSON.parse);

  const post = posts.find(p => p.slug === params.slug);

  if (!post) return <p>Beitrag nicht gefunden.</p>;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </main>
  );
}
