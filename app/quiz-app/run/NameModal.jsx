"use client";

import { useState } from "react";

export default function NameModal({ onDone }) {
  const [name, setName] = useState("");

  async function save() {
    const clean = name.trim();
    if (!clean) return;

    // Username lokal speichern
    localStorage.setItem("jagd_username", clean);

    // 🟩 WICHTIG: Username in Supabase registrieren
    await fetch("/api/quiz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: clean,
        country: "DE",
      }),
    });

    // Weiter im Quiz
    onDone(clean);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backdropFilter: "blur(5px)",
        background: "rgba(0,0,0,0.4)",
        zIndex: 999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.85)",
          padding: 30,
          borderRadius: 20,
          maxWidth: 350,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ marginBottom: 10, fontSize: 26 }}>
          🦌 Willkommen im Jagdquiz
        </h2>

        <p style={{ marginBottom: 20, opacity: 0.8 }}>
          Bitte gib deinen Namen ein,<br />damit wir dich in der Rangliste anzeigen können.
        </p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.2)",
            fontSize: 18,
            marginBottom: 20,
          }}
        />

        <button
          onClick={save}
          style={{
            width: "100%",
            padding: "14px 20px",
            fontSize: 18,
            background: "#136f39",
            color: "white",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
          }}
        >
          ▶ Quiz starten
        </button>
      </div>
    </div>
  );
}
