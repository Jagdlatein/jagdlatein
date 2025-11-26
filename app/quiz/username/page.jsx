"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("DE");

  // Nutzer hat bereits alles → direkt weiter
  useEffect(() => {
    const savedName = localStorage.getItem("jagd_username");
    const savedCountry = localStorage.getItem("jagd_country");

    if (savedName && savedCountry) {
      router.replace("/quiz/run");
    }
  }, [router]);

  function handleStart() {
    if (!username.trim()) return;

    localStorage.setItem("jagd_username", username.trim());
    localStorage.setItem("jagd_country", country);

    router.push("/quiz/run");
  }

  return (
    <div style={{ maxWidth: 450, margin: "60px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>🦌 Jagdquiz starten</h1>

      <div style={{ textAlign: "left", marginBottom: 16 }}>
        <label style={{ fontSize: 18 }}>👤 Dein Spielername</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="z.B. Gastjäger"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            marginTop: 6,
            fontSize: 16,
          }}
        />
      </div>

      <div style={{ textAlign: "left", marginBottom: 26 }}>
        <label style={{ fontSize: 18 }}>🇩🇪 Dein Land</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ccc",
            marginTop: 6,
            fontSize: 16,
          }}
        >
          <option value="DE">🇩🇪 Deutschland</option>
          <option value="AT">🇦🇹 Österreich</option>
          <option value="CH">🇨🇭 Schweiz</option>
          <option value="IT">🇮🇹 Italien</option>
          <option value="FR">🇫🇷 Frankreich</option>
        </select>
      </div>

      <button
        onClick={handleStart}
        style={{
          background: "#136f39",
          padding: "14px 30px",
          width: "100%",
          border: 0,
          color: "white",
          fontSize: 18,
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        🎯 Quiz starten
      </button>
    </div>
  );
}
