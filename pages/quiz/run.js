// pages/quiz/run.js
import RequireAccess from "../../components/RequireAccess";
import Seo from "../../components/Seo";
import { useMemo } from "react";
import { useRouter } from "next/router";
import { filterQuestions } from "../../data/questions-full";

function QuizRun() {
  const router = useRouter();
  const country = (router.query.country || "DE").toString().toUpperCase();
  const topic = (router.query.topic || "Alle").toString();

  // hole 10 neue Fragen
  const items = useMemo(
    () => filterQuestions({ country, topic, count: 10 }),
    [country, topic, router.query.rnd] // → wichtig für neue Reihenfolge
  );

  return (
    <>
      <Seo title="Quiz" />

      <RequireAccess />

      <main
        style={{
          maxWidth: 650,
          margin: "40px auto",
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(42,35,25,0.14)",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "32px",
            marginBottom: "16px",
            color: "#1f2b23",
          }}
        >
          Quiz – {topic}
        </h1>

        {/* Fragenliste */}
        {items.map((q, index) => (
          <div
            key={index}
            style={{
              marginBottom: 24,
              padding: 16,
              background: "rgba(255,255,255,0.35)",
              borderRadius: 12,
              border: "1px solid rgba(42,35,25,0.14)",
            }}
          >
            <h2 style={{ marginBottom: 12 }}>{q.question}</h2>

            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {q.answers.map((a, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: 8,
                    padding: "10px 14px",
                    background: "#fff8",
                    borderRadius: 10,
                    border: "1px solid rgba(42,35,25,0.14)",
                  }}
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* BUTTON: Nochmal mit neuer Reihenfolge */}
        <button
          onClick={() =>
            router.push({
              pathname: "/quiz/run",
              query: {
                country: country,
                topic: topic,
                rnd: Math.random().toString(36).substring(2),
              },
            })
          }
          style={{
            marginTop: 30,
            padding: "12px 16px",
            width: "100%",
            background: "#1f2b23",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Nochmal mit neuer Reihenfolge
        </button>
      </main>
    </>
  );
}

// Serverseitige Berechtigung prüfen
export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import(
    "../../lib/auth-check"
  );

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

export default QuizRun;
