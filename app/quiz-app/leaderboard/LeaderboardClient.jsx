"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default function LeaderboardClient() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    let controller;
    let client;
    let channel;
    async function load() {
      const request = ++generation.current;
      controller?.abort();
      controller = new AbortController();
      setLoading(true);
      try {
        const response = await fetch("/api/quiz/leaderboard-week", {
          cache: "no-store", credentials: "same-origin", signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const json = await response.json();
        if (!Array.isArray(json.data)) throw new Error();
        if (!active || request !== generation.current) return;
        setRows(json.data);
        setError("");
      } catch {
        if (active && request === generation.current) setError("Die Rangliste ist gerade nicht erreichbar. Bitte versuche es erneut.");
      } finally {
        if (active && request === generation.current) setLoading(false);
      }
    }
    load();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        client = createClient(url, key);
        channel = client.channel("quiz_scores_live").on("postgres_changes",
          { schema: "public", table: "quiz_scores", event: "*" }, load).subscribe();
      } catch { /* Die Rangliste ist auch ohne Live-Verbindung abrufbar. */ }
    }
    return () => {
      active = false;
      generation.current += 1;
      controller?.abort();
      if (client && channel) client.removeChannel(channel);
    };
  }, [reloadKey]);

  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>🏆 Quiz-Rangliste</h1>
      <p>Die besten gespeicherten Einzelergebnisse · Top 100</p>
      <p><Link href="/quiz-app">Zum Quiz</Link> · <Link href="/auswertungen">Meine Auswertungen</Link></p>
      {loading && <p role="status">Rangliste wird geladen…</p>}
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={loading} onClick={() => setReloadKey(value => value + 1)}>Aktualisieren</button>
      {!loading && !error && rows.length === 0 && <p>Noch keine Ergebnisse gespeichert.</p>}
      {!error && rows.map((row, index) => (
        <div key={row.username} style={{ padding: 12, borderBottom: "1px solid #ddd", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", fontSize: 18 }}>
          <span style={{ overflowWrap: "anywhere" }}><strong>{index + 1}. {row.username}</strong> ({row.country})</span>
          <span>{row.total_points} Punkte</span>
        </div>
      ))}
    </div>
  );
}