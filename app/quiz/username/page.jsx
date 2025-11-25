"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function UsernamePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    // Wenn es schon einen gespeicherten Namen gibt → direkt ins Quiz
    const existing = localStorage.getItem("jagd_username");
    if (existing) router.push("/quiz");
  }, [router]);

  function save() {
    if (name.trim().length < 2) return;
    localStorage.setItem("jagd_username", name.trim());
    router.push("/quiz");
  }

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>📝 Benutzername wählen</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Jägername…"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid #ccc",
          marginBottom: 20,
          fontSize: 18,
        }}
      />

      <button
        onClick={save}
        style={{
          width: "100%",
          padding: 12,
          background: "#136f39",
          color: "white",
          borderRadius: 12,
          border: "none",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        Speichern & Weiter
      </button>
    </main>
  );
}
