import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function EditPost() {
  const router = useRouter();
  const { slug } = router.query;

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Admin prüfen
  const isAdmin =
    typeof document !== "undefined" &&
    document.cookie.includes("jl_admin=1");

  useEffect(() => {
    if (!slug) return;

    async function loadPost() {
      const res = await fetch("/api/jagdbuch/get?slug=" + slug);
      const data = await res.json();

      setPost(data);
      setTitle(data.title);
      setContent(data.content);
    }

    loadPost();
  }, [slug]);

  if (!isAdmin) {
    return (
      <main style={{ padding: 40 }}>
        <h1>❌ Kein Zugriff</h1>
        <p>Nur Administratoren dürfen Beiträge bearbeiten.</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main style={{ padding: 40 }}>
        <p>Lade Beitrag…</p>
      </main>
    );
  }

  // SPEICHERN
  async function save() {
    await fetch("/api/jagdbuch/posts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin": "1",
      },
      body: JSON.stringify({
        slug: slug,           // Slug bleibt exakt unverändert
        title,
        content,
      }),
    });

    router.push("/jagdbuch/" + slug);
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>Beitrag bearbeiten</h1>

      <label style={{ display: "block", marginTop: 20 }}>
        Titel
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
      </label>

      <label style={{ display: "block", marginTop: 20 }}>
        Inhalt
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            minHeight: 260,
            padding: 12,
            marginTop: 6,
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        ></textarea>
      </label>

      <button
        onClick={save}
        style={{
          marginTop: 24,
          padding: "12px 22px",
          background: "#1f2b23",
          color: "#fff",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          fontSize: 17,
          fontWeight: "bold",
        }}
      >
        💾 Speichern
      </button>
    </main>
  );
}
