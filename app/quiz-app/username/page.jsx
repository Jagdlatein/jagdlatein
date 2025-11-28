"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("DE");

  const countries = [
    { code: "DE", name: "Deutschland 🇩🇪" },
    { code: "AT", name: "Österreich 🇦🇹" },
    { code: "CH", name: "Schweiz 🇨🇭" },
    { code: "FR", name: "Frankreich 🇫🇷" },
    { code: "IT", name: "Italien 🇮🇹" },
    { code: "ES", name: "Spanien 🇪🇸" },
    { code: "PT", name: "Portugal 🇵🇹" },
    { code: "NL", name: "Niederlande 🇳🇱" },
    { code: "BE", name: "Belgien 🇧🇪" },
    { code: "LU", name: "Luxemburg 🇱🇺" },
    { code: "DK", name: "Dänemark 🇩🇰" },
    { code: "NO", name: "Norwegen 🇳🇴" },
    { code: "SE", name: "Schweden 🇸🇪" },
    { code: "FI", name: "Finnland 🇫🇮" },
    { code: "PL", name: "Polen 🇵🇱" },
    { code: "CZ", name: "Tschechien 🇨🇿" },
    { code: "SK", name: "Slowakei 🇸🇰" },
    { code: "HU", name: "Ungarn 🇭🇺" },
    { code: "SI", name: "Slowenien 🇸🇮" },
    { code: "HR", name: "Kroatien 🇭🇷" },
    { code: "RO", name: "Rumänien 🇷🇴" },
    { code: "BG", name: "Bulgarien 🇧🇬" },
    { code: "GR", name: "Griechenland 🇬🇷" },
    { code: "IE", name: "Irland 🇮🇪" },
    { code: "UK", name: "Vereinigtes Königreich 🇬🇧" },
  ];

  useEffect(() => {
    const savedName = localStorage.getItem("jagd_username");
    const savedCountry = localStorage.getItem("jagd_country");

    if (savedName && savedCountry) {
      router.replace("/quiz-app/run");
    }
  }, [router]);

  async function start() {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      alert("Bitte Username eingeben!");
      return;
    }

    // Supabase registrieren — WICHTIG: abwarten!
    const res = await fetch("/api/quiz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean, country }),
    });

    const json = await res.json();

    if (!json.success) {
      alert("Fehler beim Registrieren!");
      return;
    }

    // Lokal speichern
    localStorage.setItem("jagd_username", clean);
    localStorage.setItem("jagd_country", country);

    // Weiter
    router.push(`/quiz-app/run?country=${country}`);
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 30 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
        🏹 Jagdquiz – Start
      </h1>

      <label style={{ fontSize: 18, fontWeight: 700 }}>Dein Username:</label>
      <input
        type="text"
        placeholder="z.B. hannesjäger"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          marginTop: 8,
          borderRadius: 10,
          border: "1px solid #ccc",
          fontSize: 18,
        }}
      />

      <div style={{ marginTop: 20 }}>
        <label style={{ fontSize: 18, fontWeight: 700 }}>Dein Land:</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            fontSize: 18,
            marginTop: 8,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={start}
        style={{
          marginTop: 30,
          width: "100%",
          padding: 16,
          background: "#136f39",
          color: "white",
          fontSize: 20,
          borderRadius: 12,
          border: 0,
          cursor: "pointer",
        }}
      >
        ▶️ Quiz starten
      </button>
    </div>
  );
}
