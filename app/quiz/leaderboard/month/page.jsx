export default async function LeaderboardMonthPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/quiz/leaderboard-month`,
    { cache: "no-store" }
  );
  const { data } = await res.json();

  const month = new Date().toISOString().substring(0, 7);

  return (
    <main style={{
      maxWidth: 650,
      margin: "40px auto",
      background: "rgba(255,255,255,0.55)",
      padding: 24,
      borderRadius: 14
    }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        📅 Monatsranking – {month}
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
