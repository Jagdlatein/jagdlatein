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

  // neue Fragen wenn rnd in der URL sich ändert
  const items = useMemo(() => {
    return filterQuestions({ country, topic, count: 10 });
  }, [country, topic, router.query.rnd]);

  return (
    <>
      <Seo title="Quiz" />
      <RequireAccess />

      {/* MOBILE-OPTIMIERUNG */}
      <style>{`
        @media (max-width: 780px) {
          .quiz-wrapper {
            max-width: 100% !important;
            margin: 10px auto !important;
            padding: 14px !important;
          }

          .quiz-title {
            font-size: 24px !important;
            margin-bottom: 12px !important;
          }

          .quiz-card {
            padding: 14px !important;
            margin-bottom: 16px !important;
          }

          .quiz-card h2 {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }

          .quiz-answer {
            padding: 10px !important;
            font-size: 15px !important;
            margin-bottom: 8px !important;
          }

          .quiz-button {
            padding: 12px !important;
            font-size: 16px !important;
            border-radius: 10px !important;
            margin-top: 20px !important;
          }
        }
      `}</style>

      <main
        className="quiz-wrapper"
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
          className="quiz-title"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "32px",
            marginBottom: "16px",
            color: "#1f2b23",
            textAlign: "center",
          }}
        >
          Quiz – {topic}
        </h1>

        {/* Fragen anzeigen */}
        {items.map((q, index) => (
          <div
            key={index}
            className="quiz-card"
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
                  className="quiz-answer"
                  style={{
                    marginBottom: 8,
                    padding: "10px 14px",
                    background: "#fff8",
                    borderRadius: 10,
                    border: "1px solid rgba(42,35,25,0.14)",
                  }}
                >
                  {a.text}   {/* ❗ FIX: kein React-Error mehr */}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Button: neue Reihenfolge */}
        <button
          className="quiz-button"
          onClick={() =>
            router.push({
              pathname: "/quiz/run",
              query: {
                country,
                topic,
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

// SSR — Login prüfen (Cookie jl_paid=1)
export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import("../../lib/auth-check");

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

