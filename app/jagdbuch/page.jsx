import Link from "next/link";
import { kv } from "@vercel/kv";

export default async function JagdbuchPage() {
  const items = await kv.lrange("posts", 0, -1);
  const posts = items.map(JSON.parse);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>Jagdbuch</h1>

      <Link href="/jagdbuch/erstellen">
        <button>Beitrag erstellen</button>
      </Link>

      {posts.map(post => (
        <Link key={post.slug} href={`/jagdbuch/${post.slug}`}>
          <div>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </div>
        </Link>
      ))}
    </main>
  );
}
