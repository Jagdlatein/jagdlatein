// pages/quiz/index.js
import Link from "next/link";

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

        <div style={{ marginTop: 20 }}>
          <Link
            href="/quiz/run"
            className="cta"
            style={{
              textDecoration: "none",
              padding: "10px 18px",
              borderRadius: 999,
              display: "inline-block",
            }}
          >
            ▶️ Quiz starten
          </Link>
        </div>
      </section>

      <p style={{ fontSize: 14, color: "#6b7280" }}>
        Tipp: Du kannst das Quiz beliebig oft neu starten – die Fragen werden
        jeweils neu gemischt.
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

function hasPaidAccessFromCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  const loggedIn = cookieHeader.includes("jl_session=1");
  const paid = cookieHeader.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx) {
  const { req } = ctx;

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default QuizIndex;
