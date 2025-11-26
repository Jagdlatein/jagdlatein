"use client";

import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoard();
  }, []);

  async function loadBoard() {
    try {
      const res = await fetch("/api/quiz/leaderboard");
      const data = await res.json();
      setBoard(data.data || []);
    } catch (e) {
      console.error("Fehler beim Laden der Rangliste:", e);
    }
    setLoading(false);
  }

  const medal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1 + ".";
  };

  const medalColor = (index) => {
    if (index === 0) return "#f5d142";   // Gold
    if (index === 1) return "#c0c0c0";   // Silber
    if (index === 2) return "#cd7f32";   // Bronze
    return "#136f39";                    // Jagdlatein-Grün
  };

  return (
    <div
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 34, marginBottom: 20, textAlign: "center" }}>
        🏆 Rangliste
      </h1>

      {loading && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          Lade Rangliste…
        </p>
      )}

      {!loading && board.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.7 }}>
          ❗ Noch keine Einträge vorhanden.
        </p>
      )}

      {!loading && board.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {board.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(8px)",
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              {/* Platz */}
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: medalColor(i),
                  width: 60,
                  textAlign: "left",
                }}
              >
                {medal(i)}
              </div>

              {/* Username */}
              <div
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {item.username}
                <div style={{ fontSize: 13, opacity: 0.6 }}>
                  {item.rounds} Runden gespielt
                </div>
              </div>

              {/* Punkte */}
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#136f39",
                  minWidth: 100,
                  textAlign: "right",
                }}
              >
                {item.total_points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
