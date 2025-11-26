"use client";

import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [tab, setTab] = useState("all"); // all | month
  const [allData, setAllData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(true);

  useEffect(() => {
    loadAll();
    loadMonth();
  }, []);

  async function loadAll() {
    try {
      const r = await fetch("/api/quiz/leaderboard");
      const d = await r.json();
      setAllData(d.data || []);
    } catch (e) {
      console.error("Fehler beim Laden der Gesamtrangliste:", e);
    }
    setLoadingAll(false);
  }

  async function loadMonth() {
    try {
      const r = await fetch("/api/quiz/leaderboard-month");
      const d = await r.json();
      setMonthData(d.data || []);
    } catch (e) {
      console.error("Fehler beim Laden der Monatsrangliste:", e);
    }
    setLoadingMonth(false);
  }

  const medal = (i) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;

  const medalColor = (i) =>
    i === 0
      ? "#f5d142"
      : i === 1
      ? "#c0c0c0"
      : i === 2
      ? "#cd7f32"
      : "#136f39";

  const data = tab === "all" ? allData : monthData;
  const loading = tab === "all" ? loadingAll : loadingMonth;

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

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          marginBottom: 22,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.12)",
        }}
      >
        <button
          onClick={() => setTab("all")}
          style={{
            flex: 1,
            padding: "12px 0",
            fontSize: 18,
            fontWeight: 600,
            background: tab === "all" ? "#136f39" : "#eee",
            color: tab === "all" ? "white" : "#333",
            border: "none",
            cursor: "pointer",
          }}
        >
          Gesamt
        </button>

        <button
          onClick={() => setTab("month")}
          style={{
            flex: 1,
            padding: "12px 0",
            fontSize: 18,
            fontWeight: 600,
            background: tab === "month" ? "#136f39" : "#eee",
            color: tab === "month" ? "white" : "#333",
            border: "none",
            cursor: "pointer",
          }}
        >
          Monat
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>Lade Daten…</p>
      )}

      {/* Leere Liste */}
      {!loading && data.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.7 }}>
          ❗ Noch keine Einträge vorhanden.
        </p>
      )}

      {/* Liste */}
      {!loading && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.map((item, i) => (
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

              {/* Username + Runden */}
              <div style={{ flex: 1, fontSize: 20, fontWeight: 600 }}>
                {item.username}
                {item.rounds && (
                  <div style={{ fontSize: 13, opacity: 0.6 }}>
                    {item.rounds} Runden
                  </div>
                )}
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
