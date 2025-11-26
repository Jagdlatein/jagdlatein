"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsernamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("jagd_username");
    if (stored) {
      router.replace("/quiz/run");
    } else {
      setLoading(false);
    }
  }, []);

  function save() {
    if (!name.trim()) return;
    localStorage.setItem("jagd_username", name.trim());
    router.replace("/quiz/run");
  }

  if (loading) return <p style={{ padding: 20 }}>Lade...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 16 }}>Wie heißt du?</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Name"
        style={{
          padding: "12px 16px",
          width: "100%",
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 12,
        }}
      />
      <button
        onClick={save}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "#136f39",
          color: "white",
          borderRadius: 8,
          border: 0,
        }}
      >
        Weiter
      </button>
    </div>
  );
}
