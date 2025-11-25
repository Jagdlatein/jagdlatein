"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  function save() {
    if (name.trim().length < 2) return;
    localStorage.setItem("jagd_username", name.trim());
    router.push("/quiz");
  }

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>📝 Benutzername</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Jägername"
        style={{ width: "100%", padding: 12, borderRadius: 12, marginBottom: 20 }}
      />

      <button
        onClick={save}
        style={{ width: "100%", padding: 12, borderRadius: 12, background: "#136f39", color: "white" }}
      >
        Speichern & Weiter
      </button>
    </main>
  );
}
