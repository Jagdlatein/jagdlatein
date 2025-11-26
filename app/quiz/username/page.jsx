"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("jagd_username");

    if (saved && saved.length > 0) {
      router.replace("/quiz/run");
    }
  }, []);

  function handleStart() {
    if (!name.trim()) return;

    localStorage.setItem("jagd_username", name.trim());
    router.push("/quiz/run");
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "80px auto",
        padding: 20,
        textAlign: "center",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
        🎯 Benutzername wählen
      </h1>

      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Bitte gib deinen Jägernamen ein, damit du in der Rangliste erscheinst.
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Name..."
        style={{
          width: "100%",
          padding: 15,
          fontSize: 18,
          borderRadius: 10,
          border: "1px solid #ccc",
          marginBottom: 20,
        }}
      />

      <button
        onClick={handleStart}
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 10,
          background: "#136f39",
          color: "white",
          fontSize: 20,
          border: 0,
        }}
      >
        ▶ Quiz starten
      </button>
    </div>
  );
}
