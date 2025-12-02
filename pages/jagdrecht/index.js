export default function Jagdrecht() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>

      <h1 style={{
        fontSize: 36,
        marginBottom: 10,
        color: "#1f2b23",
        fontFamily: "Georgia, serif"
      }}>
        🏛️ Jagdrecht
      </h1>

      <p style={{ color: "#4b4b4b", marginBottom: 28 }}>
        Jagdrechtliche Grundlagen und Sonderregelungen für Deutschland, Österreich & Schweiz.
      </p>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        marginTop: 32
      }}>

        <a
          href="/jagdrecht/de"
          style={linkStyle}
        >
          🇩🇪 Jagdrecht Deutschland
        </a>

        <a
          href="/jagdrecht/at"
          style={linkStyle}
        >
          🇦🇹 Jagdrecht Österreich
        </a>

        <a
          href="/jagdrecht/ch"
          style={linkStyle}
        >
          🇨🇭 Jagdrecht Schweiz
        </a>

      </div>
    </main>
  );
}

const linkStyle = {
  display: "block",
  background: "#fff",
  padding: "14px 20px",
  borderRadius: 12,
  fontSize: 18,
  fontWeight: "600",
  color: "#1f2b23",
  textDecoration: "none",
  borderLeft: "6px solid #caa53b",
  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
  transition: "transform 0.15s ease, boxShadow 0.15s ease",
};
