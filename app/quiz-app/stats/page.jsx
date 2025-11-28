"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLevel } from "../components/Level";
import { getHirschBadge } from "../components/Badge";

export default function StatsPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("DE");
  const [stats, setStats] = useState(null);
  const [top10, setTop10] = useState([]);

  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    const c = localStorage.getItem("jagd_country");

    if (!u) {
      router.push("/quiz-app/username");
      return;
    }

    setUsername(u);
    setCountry(c || "DE");

    loadStats(u);
    loadTop10();
  }, []);

  async function loadStats(u) {
    const res = await fetch("/api/quiz/player-stats?u=" + u);
    const data = await res.json();
    setStats(data);
  }

  async function loadTop10() {
    const res = await fetch("/api/quiz/leaderboard");
    const data = await res.json();
    setTop10((data.data || []).slice(0, 10));
  }

  if (!stats) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade Statistiken…</h2>
      </div>
    );
  }

  const levelTitle = getLevel(stats.total_points);
  const badge = getHirschBadge(stats.total_points);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10 }}>
        📊 Deine Jagd-Statistik
      </h1>

      <p style={{ fontSize: 20, opacity: 0.7, marginBottom: 20 }}>
        Spielerprofil & Fortschritt
      </p>

      {/* Profilblock */}
      <div
        style={{
          padding: 20,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.1)",
          marginBottom: 30,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 800 }}>{username}</div>
        <div style={{ opacity: 0.7, marginBottom: 10 }}>{country}</div>

        <div style={{ fontSize: 20, marginTop: 10 }}>
          Level: <b>{levelTitle}</b>
        </div>

        <div style={{ fontSize: 24, marginTop: 6 }}>
          Badge: <span style={{ fontSize: 30 }}>{badge}</span>
        </div>
      </div>

      {/* Statsgrid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <StatCard title="Gesamtpunkte" value={stats.total_points} icon="🏆" />
        <StatCard title="Runden gespielt" value={stats.rounds} icon="🎮" />
        <StatCard title="Durchschnitt / Runde" value={stats.avgScore} icon="📈" />
        <StatCard
          title="Trefferquote"
          value={stats.hitRate + "%"}
          icon="🎯"
        />
        <StatCard title="Beste Kategorie" value={stats.bestTopic} icon="⭐" />
        <StatCard title="Land" value={country} icon="🌍" />
      </div>

      {/* Top 10 Vergleich */}
      <h2 style={{ marginBottom: 12 }}>Top 10 Vergleich</h2>

      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        {top10.map((x, i) => (
          <div
            key={i}
            style={{
              padding: 10,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <b>{i + 1}.</b> {x.username}
            </div>
            <div style={{ fontWeight: 700 }}>{x.total_points}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/quiz/run")}
        style={{
          width: "100%",
          padding: 16,
          background: "#136f39",
          color: "white",
          borderRadius: 12,
          border: 0,
          marginTop: 30,
          fontSize: 18,
        }}
      >
        🔙 Zurück zum Quiz
      </button>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 18,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontSize: 22 }}>{icon} {title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}
