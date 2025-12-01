import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function EditPost() {
  const router = useRouter();
  const { slug } = router.query;

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);

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
      setImages(data.images || []);
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

  // 🔼 Bild-Upload (Base64)
  async function uploadImage(file) {
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result;

      const res = await fetch("/api/jagdbuch/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug,
          image: base64,
        }),
      });

      const data = await res.json();
      setImages(data.images);
    };

    reader.readAsDataURL(file);
  }

  // ❌ Bild löschen
  async function deleteImage(id) {
    const res = await fetch("/api/jagdbuch/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin": "1",
      },
      body: JSON.stringify({
        slug: slug,
        imageId: id,
      }),
    });

    const data = await res.json();
    setImages(data.images);
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
        slug: slug, // Slug bleibt exakt unverändert
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

      {/* BILD-HOCHLADEN */}
      <label style={{ display: "block", marginTop: 30 }}>
        Bilder hochladen
        <input
          type="file"
          accept="image/*"
          onChange={(e) => uploadImage(e.target.files[0])}
          style={{ display: "block", marginTop: 10 }}
        />
      </label>

      {/* BILD-VORSCHAU MIT LÖSCHEN */}
      {images.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Bilder</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {images.map((img) => (
              <div key={img.id} style={{ position: "relative" }}>
                <img
                  src={img.data}
                  style={{
                    width: "150px",
                    borderRadius: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />

                {/* Löschbutton */}
                <button
                  onClick={() => deleteImage(img.id)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#8a1a1a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: "28px",
                    textAlign: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
