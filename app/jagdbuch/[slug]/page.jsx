import { promises as fs } from "fs";
import path from "path";

export default async function PostPage({ params }) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  const data = await fs.readFile(filePath, "utf8");
  const posts = JSON.parse(data);

  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return <div>⚠️ Beitrag nicht gefunden</div>;
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>{post.title}</h1>

      <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>

      <div style={{ opacity: 0.6, marginTop: 10 }}>
        {post.date} — Likes: {post.likes}
      </div>

      <hr style={{ margin: "20px 0" }} />

      {/* TODO → Kommentare + Bilder */}
    </main>
  );
}
