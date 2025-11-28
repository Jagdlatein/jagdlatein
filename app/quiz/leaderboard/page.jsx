"use client";

import { useEffect, useState, useCallback } from "react";
import { useLiveLeaderboard } from "./useLiveLeaderboard";

import Avatar from "../components/Avatar";
import Level from "../components/Level";
import Badge from "../components/Badge";
import Flag from "../components/Flag";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // 🔥 load() muss stable sein für den Realtime-Hook
  const load = useCallback(async () => {
    try {
      const all = await fetch("/api/quiz/leaderboard", {
        cache: "no-store",
      }).then((r) => r.json());

      const week = await fetch("/api/quiz/leaderboard-week", {
        cache: "no-store",
      }).then((r) => r.json());

      setData(all.data || []);
      setWeekData(week.data || []);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  }, []);

  // 🔥 Initial Laden
  useEffect(() => {
    load();
  }, [load]);

  // 🔥 Live-Updates aus SUPABASE
  useLiveLeaderboard(() => {
    load(); // automatisch neu laden
  });

  // Filter + Suche
  const filtered =
    filter === "week"
      ? weekData
      : filter === "all"
      ? data
      : data.filter((x) =>
          x.username.toLowerCase().includes(query.toLowerCase())
        );

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ maxWidth: 850, margin: "0 auto", padding: 20 }}>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 900,
          marginBottom: 25,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        🏆 Rangliste (Live)
      </h1>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: 0,
            background: filter === "all" ? "#136f39" : "#ddd",
            color: filter === "all" ? "#fff" : "#000",
          }}
        >
          Gesamt
        </button>

        <button
          onClick={() => setFilter("week")}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: 0,
            background: filter === "week" ? "#136f39" : "#ddd",
            color: filter === "week" ? "#fff" : "#000",
          }}
        >
          Woche
        </button>
      </div>

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
        onClick={() => (window.location.href = "/quiz/run")}
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
