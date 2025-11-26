"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase Realtime ----
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ---- Flaggen ----
const flag = {
  DE: "🇩🇪",
  AT: "🇦🇹",
  CH: "🇨🇭",
};

// ---- Hirsch-Badges ----
function getHirschBadge(points) {
  if (points >= 15000) return "🦌 Kapitaler Hirsch";
  if (points >= 10000) return "🦌 Starker Hirsch";
  if (points >= 5000) return "🦌 Spießer";
  if (points >= 2000) return "🦌 Jährling";
  return "🦌 Kalb";
}

export default function LeaderboardPage() {
  const router = useRouter();

  const [tab, setTab] = useState("all");

  const [dataAll, setDataAll] = useState([]);
  const [dataMonth, setDataMonth] = useState([]);
  const [dataWeek, setDataWeek] = useState([]);
  const [dataToday, setDataToday] = useState([]);
  const [dataYear, setDataYear] = useState([]);

  const [loading, setLoading] = useState(true);

  // -------------------------
  //    LADEN DER DATEN
  // -------------------------
  useEffect(() => {
    loadData();
    subscribeRealtime();
  }, []);

  async function loadData() {
    setLoading(true);

    const all = await fetch("/api/quiz/leaderboard").then((r) => r.json());
    setDataAll(all.data || []);

    const month = await fetch("/api/quiz/leaderboard-month").then((r) =>
      r.json()
    );
    setDataMonth(month.data || []);

    const week = await fetch("/api/quiz/leaderboard-week").then((r) =>
      r.json()
    );
    setDataWeek(week.data || []);

    const today = await fetch("/api/quiz/leaderboard-today").then((r) =>
      r.json()
    );
    setDataToday(today.data || []);

    const year = await fetch("/api/quiz/leaderboard-year").then((r) =>
      r.json()
    );
    setDataYear(year.data || []);

    setLoading(false);
  }

  // -------------------------
  //   SUPABASE LIVE UPDATE
  // -------------------------
  function subscribeRealtime() {
    supabase
      .channel("quiz_scores")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        loadData(); // Auto reload
      })
      .subscribe();
  }

  // -------------------------
  //   PASSENDE DATEN AUSWÄHLEN
  // -------------------------
  const data =
    tab === "today"
      ? dataToday
      : tab === "week"
      ? dataWeek
      : tab === "month"
      ? dataMonth
      : tab === "year"
      ? dataYear
      : dataAll;

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

  return (
    <div
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 34, marginBottom: 14, textAlign: "center" }}>
        🏆 Rangliste
      </h1>

      {/* FILTER-TABS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          marginBottom: 22,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.12)",
        }}
      >
        {[
          ["Heute", "today"],
          ["Woche", "week"],
          ["Monat", "month"],
          ["Jahr", "year"],
          ["Gesamt", "all"],
        ].map(([label, key]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 600,
              background: tab === key ? "#136f39" : "#eee",
              color: tab === key ? "white" : "#333",
              border: "none",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* LADEN */}
      {loading && <p style={{ textAlign: "center" }}>Lade Daten…</p>}

      {/* LEER */}
      {!loading && data.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.7 }}>
          ❗ Noch keine Einträge vorhanden.
        </p>
      )}

      {/* LISTE */}
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
                backdropFilter: "blur(10px)",
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
                }}
              >
                {medal(i)}
              </div>

              {/* Username + Badges */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {item.username} {flag[item.country] || ""}
                </div>

                {/* Badges */}
                <div style={{ fontSize: 14, opacity: 0.7 }}>
                  {getHirschBadge(item.total_points)} • {item.rounds} Runden
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

      {/* ZURÜCK ZUM QUIZ */}
      <button
        onClick={() => router.push("/quiz/run")}
