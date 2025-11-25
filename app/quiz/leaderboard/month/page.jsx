"use client";

import { useEffect, useState } from "react";

export default function MonthlyLeaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/quiz/leaderboard-month")
      .then((r) => r.json())
      .then((d) => setRows(d.data || []));
  }, []);

  return (
    <main style={{ maxWidth: 650, margin: "40px auto", padding: 24 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20, fontSize: 32 }}>🏆 Monats-Rangliste</h1>

      {rows.length === 0 && <p style={{ textAlign: "center" }}>Noch keine Einträge!</p>}

      {rows.map((u, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
          <strong>{i + 1}. {u.username}</strong>
          <span>{u.total_points} Punkte</span>
        </div>
      ))}
    </main>
  );
}
