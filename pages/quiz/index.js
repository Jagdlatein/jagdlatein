// pages/quiz/index.js
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

const TOPICS = [
  "Alle",
  "Wildkunde",
  "Waffen & Schuss",
  "Recht",
  "Hege/Naturschutz",
  "Hundewesen",
  "Wildbrethygiene",
];

const COUNTRIES = ["DE", "AT", "CH"];

function QuizIndex() {
  const router = useRouter();

  // 👉 Username prüfen – falls keiner vorhanden → Username-Seite
  useEffect(() => {
    const name = localStorage.getItem("jagd_username");
    if (!name) {
      router.push("/quiz/username");
    }
  }, [router]);

  return (
    <main style={pageMain}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>
        Jagdlatein Quiz
      </h1>

      <p style={{ marginBottom: 24, color: "#374151", lineHeight: 1.5 }}>
        Wähle dein Land und ein Thema aus und starte ein zufälliges 10-Fragen-Quiz.
      </p>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          Einstellungen
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={label}>Land</div>
            <div style={{ display: "flex", gap: 8 }}>
              {COUNTRIES.map((c) => (
                <span key={c} style={pill}>
                  {c}
                </span>
              ))}
            </div>
            <p style={hint}>Das Land wählst du später direkt im Quiz.</p>
          </div>

          <div>
            <div style={label}>Themen (Beispiele)</div>
            <ul style={{ paddingLeft: 18, marginTop: 4, marginBottom: 0 }}>
              {TOPICS.map((t) => (
                <li key={t} style={{ fontSize: 14 }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ⭐ Neuer großer Start-Button */}
        <div style={{ marginTop: 24 }}>
          <Link
            href="/quiz/run"
            style={{
              display: "block",
              width: "100%",
              backgroundColor: "#136f39",
              color: "white",
              textAlign: "center",
              padding: "20px 0",
              borderRadius: 16,
              fontSize: "1.8rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 5px 14px rgba(0,0,0,0.25)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.32)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 5px 14px rgba(0,0,0,0.25)";
            }}
          >
            ▶️ QUIZ STARTEN
          </Link>
        </div>
      </section>

      <p style={{ fontSize: 14, color: "#6b7280" }}>
        Tipp: Du kannst das Quiz beliebig oft neu starten – die Fragen werden jeweils neu gemischt.
      </p>
    </main>
  );
}

const pageMain = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "32px 16px 64px",
};

const label = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.04,
  color: "#6b7280",
};

const pill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  background: "#f3f4f6",
  fontSize: 13,
};

const hint = {
  fontSize: 12,
  color: "#9ca3af",
  marginTop: 4,
};

export default QuizIndex;
