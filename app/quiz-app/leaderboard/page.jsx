"use client";

import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import Level from "../components/Level";
import Badge from "../components/Badge";
import Flag from "../components/Flag";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";

export default function LeaderboardPage() {
  const [weekData, setWeekData] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 20;

  useEffect(() => {
    loadWeek();
  }, []);

  // ----------------------------------------------------
  // Nur Wochenrangliste laden
  // ----------------------------------------------------
  async function loadWeek() {
    try {
      const week = await fetch("/api/quiz/leaderboard-week", {
        cache: "no-store",
      }).then((r) => r.json());

      setWeekData(week.data || []);
    } catch (err) {
      console.error("Fehler beim Laden der Wochenrangliste:", err);
    }
  }

  // ----------------------------------------------------
  // Suche filtern
  // ----------------------------------------------------
  const filtered = weekData.filter((row) =>
    row.username.toLowerCase().includes(query.toLowerCase())
  );

  // ----------------------------------------------------
  // Pagination
  // ----------------------------------------------------
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ maxWidth: 850, margin: "0 auto", padding: 20 }}>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 900,
          marginBottom: 25,
        }}
      >
        🏆 Wochen-Rangliste
      </h1>

      <p style={{ opacity: 0.7, marginTop: -10, marginBottom: 20 }}>
        Zeigt nur deinen besten Score dieser Woche an (Mo–So).
      </p>

      <SearchBar query={query} setQuery={setQuery} />

      <div style={{ marginTop: 20 }}>
        {paginated.map((item, idx) => {
          const place = idx + 1 + (page - 1) * perPage;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                padding: 16,
                borderRadius: 14,
                marginBottom: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: 40,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                {place}
              </div>

              <Avatar username={item.username} />

              <div style={{ marginLeft: 14, flexGrow: 1 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {item.username}
                  <Flag country={item.country || "DE"} />
                </div>

                <Level points={item.total_points} />
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#136f39",
                  textAlign: "right",
                  marginRight: 10,
                  minWidth: 60,
                }}
              >
                {item.total_points}
              </div>

              <Badge points={item.total_points} />
            </div>
          );
        })}
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        total={filtered.length}
        perPage={perPage}
      />

      <button
      onClick={() => (window.location.href = "/quiz-app/run")}
        style={{
          marginTop: 30,
          width: "100%",
          background: "#136f39",
          color: "#fff",
          padding: 16,
          borderRadius: 14,
          fontSize: 18,
          border: 0,
        }}
      >
        🔙 Zurück zum Quiz
      </button>
    </div>
  );
}
