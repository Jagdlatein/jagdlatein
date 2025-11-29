"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  async function load() {
    const res = await fetch("/api/quiz/leaderboard-week", {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    const json = await res.json();
    setRows(json.data || []);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("quiz_scores_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_scores" },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
        🏆 Wochen-Rangliste (Live)
      </h1>

      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
          }}
        >
          <span>
            <strong>{i + 1}. {r.username}</strong> ({r.country})
          </span>
          <span>{r.total_points} Punkte</span>
        </div>
      ))}
    </div>
  );
}
