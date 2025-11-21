// pages/success.js
import Link from "next/link";

export default function Success() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
        textAlign: "center",
      }}
    >
      <h1>Vielen Dank! ✅</h1>

      <p style={{ color: "#374151", fontSize: 18, marginTop: 10 }}>
        Deine Zahlung war erfolgreich.
        <br />Der Zugang wurde automatisch freigeschaltet.
      </p>

      <Link
        href="/login"
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "12px 22px",
          background: "#1d4d2b",
          color: "#fff",
          borderRadius: 12,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Jetzt einloggen
      </Link>

      <p style={{ marginTop: 20, color: "#6b7280", fontSize: 14 }}>
        Der Zugang bleibt 30 Tage aktiv und verlängert sich automatisch,
        wenn du erneut zahlst.
      </p>
    </main>
  );
}
