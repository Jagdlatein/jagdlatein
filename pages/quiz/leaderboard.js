// pages/quiz/leaderboard.js

import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/quiz/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.data || []));
  }, []);

  return (
    <main
      style={{
        maxWidth: 650,
        margin: "40px auto",
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(42,35,25,0.14)",
        borderRadius: 14,
        padding: 24,
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20, fontSize: 32 }}>
        🏆 Rangliste
      </h1>

      {rows.length === 0 && (
        <p style={{ textAlign: "center", fontSize: 18 }}>
          Noch keine Einträge – spiele das Quiz!
        </p>
      )}

      {rows.map((u, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            fontSize: 18,
          }}
        >
          <strong>{i + 1}. {u.username}</strong>
          <span>{u.total_points} Punkte</span>
        </div>
      ))}
    </main>
  );
}
