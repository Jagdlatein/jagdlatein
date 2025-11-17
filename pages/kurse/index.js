import Link from "next/link";

export default function KurseOverview() {
  const kurse = [
    { name: "🦌 Wildkunde Basics", link: "/kurse/wildkunde" },
    { name: "📖 Jägersprache 100 Begriffe", link: "/kurse/jaegersprache" },
    { name: "🐗 Schwarzwild verstehen", link: "/kurse/schwarzwild" },
    { name: "👣 Fährten & Spuren", link: "/kurse/faehrten" },
    { name: "🔫 Waffenhandhabung sicher", link: "/kurse/waffen" },
    { name: "🩸 Anschusszeichen lesen", link: "/kurse/anschuss" },
    { name: "🦌 Rehwild ansprechen", link: "/kurse/rehwild" },
    { name: "🦌 Rotwild kompakt", link: "/kurse/rotwild" },
    { name: "🪤 Fallenjagd Basics", link: "/kurse/fallenjagd" },
    { name: "⚠ Sicherheit im Revier", link: "/kurse/sicherheit" },
    { name: "🌲 Pirsch & Ansitz", link: "/kurse/pirsch" },
    { name: "📚 25 Prüfungstipps", link: "/kurse/pruefung" },
  ];

  return (
    <main
      style={{
        background: "linear-gradient(180deg,#faf8f1,#f4efe3)",
        minHeight: "100vh",
        padding: "45px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            margin: "0 0 16px",
            color: "#1a1a1a",
          }}
        >
          📚 Jagdlatein – Mini-Kurse
        </h1>

        <p
          style={{
            fontSize: 18,
            color: "#4b4b4b",
            margin: "0 0 26px",
            maxWidth: 640,
          }}
        >
          Kompakte Lernmodule für Jungjäger und erfahrene Jäger.
          Jeder Kurs ist kurz, praxisnah und schließt mit einem Quiz ab.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {kurse.map((kurs, i) => (
            <Link key={i} href={kurs.link}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: "14px 18px",
                  border: "1px solid #e0ddcf",
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{kurs.name}</span>
                <span style={{ fontSize: 16 }}>➜</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
