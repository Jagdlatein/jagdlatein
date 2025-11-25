"use client";

import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/quiz/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.data || []));
  }, []);

  return (
    <main style={{ maxWidth: 650, margin: "40px auto", padding: 24 }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: 20,
          fontSize: 32,
          fontWeight: 800,
        }}
      >
        🏆 Rangliste
      </h1>

      {rows.length === 0 && (
        <p style={{ textAlign: "center" }}>Noch keine Einträge!</p>
      )}

      {rows.map((u, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <strong>
            {i + 1}. {u.username || "Gastjäger"}
          </strong>

          <span>{u.points} Punkte</span>
        </div>
      ))}

      {/* 🔙 Zurück zum Quiz Button */}
      <div style={{ marginTop: 30 }}>
        <a
          href="/quiz"
          style={{
            display: "block",
            width: "100%",
            backgroundColor: "#136f39",
            color: "white",
            textAlign: "center",
            padding: "16px 0",
            borderRadius: 14,
            fontSize: "1.5rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.03)";
            e.target.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
          }}
        >
          🔙 Zurück zum Quiz
        </a>
      </div>
    </main>
  );
}
