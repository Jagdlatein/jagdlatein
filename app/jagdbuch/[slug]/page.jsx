import path from "path";
import { promises as fs } from "fs";

export default async function PostPage({ params }) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  let posts = [];
  try {
    const json = await fs.readFile(filePath, "utf8");
    posts = JSON.parse(json || "[]");
  } catch {
    posts = [];
  }

  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return <h1>Beitrag nicht gefunden</h1>;
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>{post.title}</h1>
      <p style={{ opacity: 0.7 }}>{post.date}</p>
      <article style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>
        {post.content}
      </article>
    </main>
  );
}
