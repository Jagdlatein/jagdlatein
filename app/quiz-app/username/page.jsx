"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function UsernameForm() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedCountry = (params.get("country") || "DE").toUpperCase();
  const quizCountry = ["DE", "AT", "CH"].includes(requestedCountry) ? requestedCountry : "DE";
  const requestedTopic = (params.get("topic") || "Alle").trim();
  const quizTopic = requestedTopic.length > 0 && requestedTopic.length <= 120 && !/[\u0000-\u001f\u007f]/.test(requestedTopic)
    ? requestedTopic : "Alle";
  const quizUrl = `/quiz-app/run?country=${encodeURIComponent(quizCountry)}&topic=${encodeURIComponent(quizTopic)}`;
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState(quizCountry);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const registrationPending = useRef(false);
  useEffect(() => {
    const storedCountry = localStorage.getItem("jagd_country");
    if (countries.some(item => item.code === storedCountry)) setCountry(storedCountry);
  }, []);
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

  

  async function start() {
    if (registrationPending.current) return;
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setError("Bitte gib einen Namen für die Rangliste ein.");
      return;
    }
    registrationPending.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quiz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean, country }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Registrierung fehlgeschlagen");
      localStorage.setItem("jagd_username", clean);
      localStorage.setItem("jagd_country", country);
      router.push(quizUrl);
    } catch {
      setError("Dein Quizname konnte gerade nicht gespeichert werden. Bitte versuche es erneut.");
    } finally {
      registrationPending.current = false;
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 30 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
        🏹 Jagdquiz – Start
      </h1>
      <p>Quizland: <strong>{{ DE: "Deutschland", AT: "Österreich", CH: "Schweiz" }[quizCountry]}</strong> · {quizTopic === "Alle" ? "Alle Themen" : quizTopic}</p>
      <p><Link href={`/quiz-app?country=${encodeURIComponent(quizCountry)}&topic=${encodeURIComponent(quizTopic)}`}>Land und Thema wählen</Link></p>

      <label htmlFor="quiz-username" style={{ fontSize: 18, fontWeight: 700 }}>Dein Username:</label>
      <input
        id="quiz-username"
        type="text"
        placeholder="z.B. hannesjäger"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 14,
          marginTop: 8,
          borderRadius: 10,
          border: "1px solid #ccc",
          fontSize: 18,
        }}
      />

      <div style={{ marginTop: 20 }}>
        <label htmlFor="leaderboard-country" style={{ fontSize: 18, fontWeight: 700 }}>Dein Land für die Rangliste:</label>
        <select
          id="leaderboard-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
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
        type="button"
        onClick={start}
        disabled={busy}
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
        {busy ? "Quizname wird gespeichert…" : "▶️ Quiz starten"}
      </button>
      {error && <p role="alert" style={{ color: "#9b2828", lineHeight: 1.5 }}>{error}</p>}
    </div>
  );
}

export default function UsernamePage() {
  return <Suspense fallback={<p style={{ padding: 30 }}>Quizstart wird vorbereitet…</p>}><UsernameForm /></Suspense>;
}
