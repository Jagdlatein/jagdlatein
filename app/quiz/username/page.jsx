"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsernamePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  // Wenn Name bereits existiert → direkt weiterleiten
  useEffect(() => {
    const saved = localStorage.getItem("jagd_username");
    if (saved) {
      router.replace("/quiz/run");
    }
  }, []);

  function save() {
    if (!name.trim()) return;
    localStorage.setItem("jagd_username", name.trim());
    router.replace("/quiz/run");
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "60px auto",
        fontFamily: "system-ui",
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Wie heißt du auf der Jagd?</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Jagdname..."
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #ccc",
          marginBottom: 16,
          fontSize: 18,
        }}
      />

      <button
        onClick={save}
        style={{
          width: "100%",
          padding: "14px",
          background: "#136f39",
          color: "white",
          border: 0,
          borderRadius: 12,
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        Weiter zum Quiz
      </button>
    </div>
  );
}
