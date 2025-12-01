import { useState } from "react";
import { useRouter } from "next/router";
import fs from "fs";
import path from "path";

export async function getServerSideProps({ query }) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");
  const posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const post = posts.find(p => p.slug === query.slug) || null;

  return { props: { post } };
}

export default function EditPost({ post }) {
  const r = useRouter();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);

  async function save() {
    await fetch("/api/jagdbuch/posts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user": document.cookie.split("jl_user=")[1]?.split(";")[0] || "",
        "x-admin": document.cookie.includes("jl_admin=1") ? "1" : "0",
      },
      body: JSON.stringify({ slug: post.slug, title, content }),
    });

    r.push(`/jagdbuch/${post.slug}`);
  }

  return (
    <main style={{ maxWidth: 860, margin:"0 auto", padding:32 }}>
      <h1>Beitrag bearbeiten</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width:"100%", padding:12, marginBottom:20 }}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width:"100%", minHeight:250, padding:12 }}
      />

      <button
        onClick={save}
        style={{ marginTop:20, background:"#caa53b", padding:"12px 20px", borderRadius:12 }}
      >
        Speichern
      </button>
    </main>
  );
}
