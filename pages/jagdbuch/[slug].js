import fs from "fs";
import path from "path";

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  let posts = [];

  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const post = posts.find(p => p.slug === params.slug);

  return {
    props: { post },
    notFound: !post,
  };
}

export default function JagdbuchPost({ post }) {
  if (!post) return <p>Beitrag nicht gefunden.</p>;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>{post.title}</h1>
      <p style={{ color: "#777" }}>{post.date}</p>

      <article style={{ marginTop: 20, whiteSpace: "pre-line" }}>
        {post.content}
      </article>
    </main>
  );
}
