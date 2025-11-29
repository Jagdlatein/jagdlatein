"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LeaderboardClient() {
  const [scores, setScores] = useState([]);
  const [weekStart, setWeekStart] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/quiz/leaderboard-week", {
          cache: "no-store",
        });

        const json = await res.json();

        setScores(json.data || []);
        setWeekStart(json.weekStart || "");
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade Rangliste…</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
        🏆 Wochen-Rangliste
      </h1>

      {weekStart && (
        <div style={{ marginBottom: 12, opacity: 0.7 }}>
          Woche ab: {new Date(weekStart).toLocaleDateString()}
        </div>
      )}

      {scores.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", opacity: 0.7 }}>
          Noch keine Scores für diese Woche.
        </div>
      )}

      {scores.map((s, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            marginBottom: 12,
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
          }}
        >
          <div style={{ fontWeight: 700 }}>#{i + 1} {s.username}</div>

          <div style={{ fontWeight: 900, color: "#136f39" }}>
            {s.total_points} Punkte
          </div>
        </div>
      ))}

      <Link
        href="/quiz-app/run"
        style={{
          marginTop: 20,
          display: "block",
          padding: 16,
          background: "#136f39",
          color: "white",
          borderRadius: 12,
          textAlign: "center",
          fontSize: 20,
        }}
      >
        🔄 Neues Quiz starten
      </Link>
    </div>
  );
}
