"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const router = useRouter();

  const [username, setUsername] = useState(
    localStorage.getItem("jagd_username") || ""
  );
  const [country, setCountry] = useState(
    localStorage.getItem("jagd_country") || "DE"
  );

  async function saveProfile() {
    if (!username || username.length < 2) {
      alert("Bitte mindestens 2 Zeichen.");
      return;
    }

    localStorage.setItem("jagd_username", username);
    localStorage.setItem("jagd_country", country);

    try {
      await fetch("/api/quiz/user-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          country,
        }),
      });
    } catch (e) {
      console.error("Konnte Profil nicht speichern:", e);
    }

    router.push("/quiz/run");
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 20 }}>
        👤 Dein Profil
      </h1>

      <label style={{ fontSize: 16 }}>Benutzername</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Dein Jägername"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.3)",
          fontSize: 18,
          marginTop: 6,
          marginBottom: 20,
        }}
      />

      <label style={{ fontSize: 16 }}>Land</label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.3)",
          fontSize: 18,
          marginTop: 6,
          marginBottom: 20,
        }}
      >
        <option value="DE">🇩🇪 Deutschland</option>
        <option value="AT">🇦🇹 Österreich</option>
        <option value="CH">🇨🇭 Schweiz</option>
      </select>

      <button
        onClick={saveProfile}
        style={{
          width: "100%",
          padding: 14,
          background: "#136f39",
          color: "white",
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 12,
          border: 0,
          marginTop: 20,
        }}
      >
        💾 Speichern & Weiter
      </button>

      <button
        onClick={() => router.push("/quiz/run")}
        style={{
          width: "100%",
          padding: 14,
          background: "#1f2b23",
          color: "white",
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 12,
          border: 0,
          marginTop: 10,
        }}
      >
        🔙 Zurück ohne Speichern
      </button>
    </div>
  );
}
