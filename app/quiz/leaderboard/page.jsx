"use client";

import { useEffect, useState } from "react";

import Avatar from "../components/Avatar";
import Level from "../components/Level";
import Badge from "../components/Badge";
import Flag from "../components/Flag";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const all = await fetch("/api/quiz/leaderboard").then((r) => r.json());
      const month = await fetch("/api/quiz/leaderboard-month").then((r) =>
        r.json()
      );

      setData(all.data || []);
      setMonthData(month.data || []);
    } catch (err) {
      console.error("Fehler beim Laden der Rangliste:", err);
    }
  }

  // Punkte sicher auslesen (egal wie Supabase liefert)
  function getPoints(entry) {
    return entry.points ?? entry.total_points ?? 0;
  }

  const filtered =
    filter === "month"
      ? monthData
      : filter === "all"
      ? data
      : data.filter((x) =>
          x.username.toLowerCase().includes(query.toLowerCase())
        );

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 20 }}>
        🏆 Rangliste
      </h1>

      <Filters filter={filter} setFilter={setFilter} />
      <SearchBar query={query} setQuery={setQuery} />

      <div style={{ marginTop: 20 }}>
        {paginated.map((item, i) => {
          const points = getPoints(item);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ width: 40, fontSize: 22, fontWeight: 700 }}>
                {i + 1 + (page - 1) * perPage}
              </div>

              <Avatar username={item.username} />

              <div style={{ marginLeft: 12, flexGrow: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {item.username} <Flag country="DE" />
                </div>

                <Level points={points} />
              </div>

              <div style={{ fontSize: 22, fontWeight: 900, color: "#136f39" }}>
                {points}
              </div>

              <Badge points={points} />
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
          padding: 15,
          borderRadius: 12,
          fontSize: 18,
          border: 0,
        }}
      >
        🔙 Zurück zum Quiz
      </button>
    </div>
  );
}
