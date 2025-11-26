"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("DE");

  useEffect(() => {
    setUsername(localStorage.getItem("jagd_username") || "");
    setCountry(localStorage.getItem("jagd_country") || "DE");
  }, []);

  async function saveProfile() {
    if (!username || username.length < 2) {
      alert("Bitte mindestens 2 Zeichen eingeben.");
      return;
    }

    localStorage.setItem("jagd_username", username);
    localStorage.setItem("jagd_country", country);

    await fetch("/api/quiz/user-upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, country }),
    });

    router.push("/quiz/run");
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
        👤 Dein Profil
      </h1>

      <label>Benutzername</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          fontSize: 18,
          border: "1px solid #ccc",
          marginTop: 6,
          marginBottom: 20,
        }}
      />

      <label>Land</label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          fontSize: 18,
          border: "1px solid #ccc",
          marginTop: 6,
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
          marginTop: 20,
          padding: 14,
          background: "#136f39",
          color: "white",
          borderRadius: 12,
          border: 0,
          fontSize: 18,
        }}
      >
        💾 Speichern
      </button>
    </div>
  );
}
