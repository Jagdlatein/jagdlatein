export default async function LeaderboardPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/quiz/leaderboard`,
    { cache: "no-store" }
  );
  const { data } = await res.json();

  return (
    <main style={{
      maxWidth: 650,
      margin: "40px auto",
      background: "rgba(255,255,255,0.55)",
      padding: 24,
      borderRadius: 14
    }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        🏆 Gesamtrangliste
      </h1>

      {data.map((u, i) => (
        <div key={i}
          style={{
            padding: "12px 0",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <b>{i + 1}. {u.username}</b>
          <span>{u.total_points} Punkte</span>
        </div>
      ))}
    </main>
  );
}
