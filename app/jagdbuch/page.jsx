"use client";

import { useState } from "react";
import RichEditor from "../components/RichEditor";

export default function ErstellenPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/jagdbuch/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user": "Jäger",
      },
      body: JSON.stringify({
        title,
        content,
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        excerpt: content.slice(0, 150),
        date: new Date().toISOString().split("T")[0],
      }),
    });

    if (!res.ok) {
      setError("Fehler beim Speichern.");
      setSaving(false);
      return;
    }

    window.location.href = "/jagdbuch";
  }

  return (
    <main
      style={{
        background: "#f7f1e3",
        minHeight: "100vh",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          width: "100%",
          background: "white",
          padding: 30,
          borderRadius: 14,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 32, marginBottom: 20 }}>Neuen Beitrag erstellen</h1>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "600" }}>
              Titel
            </label>
            <input
              type="text"
              placeholder="Titel eingeben…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #aaa",
                borderRadius: 10,
                fontSize: 16,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: "600" }}>
              Beitrag
            </label>

            <RichEditor value={content} onChange={setContent} />
          </div>

          {error && (
            <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>
          )}

          <button
            disabled={saving}
            style={{
              background: saving ? "#b89633" : "#caa53b",
              padding: "14px 20px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: "bold",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
        </form>
      </div>
    </main>
  );
}
