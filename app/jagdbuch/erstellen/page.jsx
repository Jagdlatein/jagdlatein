"use client";

import { useState, useEffect } from "react";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  useEffect(() => {
    setSlug(slugify(title));
  }, [title]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        slug,
        excerpt: content.substring(0, 150),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!res.ok) {
      setSaving(false);
      setError("⚠ Fehler beim Speichern!");
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 24 }}>
        Beitrag erstellen
      </h1>

      {/* FORMULAR */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          marginBottom: 40,
        }}
      >
        {/* Titel */}
        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Titel
          </label>
          <input
            type="text"
            value={title}
            placeholder="Titel eingeben…"
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #bbb",
              fontSize: 17,
            }}
            required
          />
        </div>

        {/* Slug Vorschau */}
        {slug && (
          <div style={{ opacity: 0.6, marginTop: -10, fontSize: 14 }}>
            URL: /jagdbuch/<b>{slug}</b>
          </div>
        )}

        {/* Inhalt */}
        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Inhalt
          </label>
          <textarea
            value={content}
            placeholder="Deinen Jagdbeitrag hier schreiben…"
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: 260,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #bbb",
              fontSize: 16,
              lineHeight: 1.5,
            }}
            required
          />
        </div>

        {/* Fehler */}
        {error && (
          <div
            style={{
              padding: 10,
              background: "#ffd8d8",
              borderRadius: 8,
              color: "#900",
              border: "1px solid #ffb4b4",
            }}
          >
            {error}
          </div>
        )}

        {/* Speichern */}
        <button
          disabled={saving}
          style={{
            background: saving ? "#9c8b43" : "#caa53b",
            padding: "14px 20px",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            border: "none",
          }}
        >
          {saving ? "Speichert…" : "Beitrag speichern"}
        </button>
      </form>

      {/* LIVE VORSCHAU */}
      {title || content ? (
        <div
          style={{
            background: "#fff",
            padding: 22,
            borderRadius: 12,
            border: "1px solid #ddd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{title || "Vorschau Titel…"}</h2>
          <p style={{ opacity: 0.8, whiteSpace: "pre-wrap" }}>
            {content || "Beitragstext wird hier angezeigt…"}
          </p>
        </div>
      ) : null}
    </main>
  );
}
