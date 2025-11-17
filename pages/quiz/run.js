// pages/quiz/run.js
import RequireAccess from "../../components/RequireAccess";
import Seo from "../../components/Seo";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { filterQuestions } from "../../data/questions-full";

function QuizRun() {
  const router = useRouter();
  const country = (router.query.country || "DE").toString().toUpperCase();
  const topic = (router.query.topic || "Alle").toString();

  const items = useMemo(
    () => filterQuestions({ country, topic, count: 10 }),
    [country, topic]
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const total = items.length;
  const current = items[step] || null;

  const handleSelect = (qid, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: optionId,
    }));
  };

  const handleNext = () => {
    if (!current) return;
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const handleRestart = () => {
    router.replace(router.asPath);
  };

  const numCorrect = useMemo(() => {
    if (!done) return 0;
    return items.reduce((acc, q) => {
      const picked = answers[q.id];
      const correct = q.correct && q.correct[0];
      return acc + (picked === correct ? 1 : 0);
    }, 0);
  }, [done, items, answers]);

  return (
    <RequireAccess>
      <>
        <Seo title="Quiz starten – Jagdlatein" />
        <section className="page">
          <div className="page-inner" style={{ maxWidth: 720 }}>
            <p className="small" style={{ marginBottom: 8 }}>
              <a href="/quiz">← Zurück zur Übersicht</a>
            </p>

            <h1>Quiz</h1>
            <p className="lead">
              Land: <strong>{country}</strong> · Thema: <strong>{topic}</strong>
            </p>

            {total === 0 && (
              <p>
                Für diese Kombination sind noch keine Fragen eingetragen. Wähle
                bitte ein anderes Thema oder Land.
              </p>
            )}

            {total > 0 && !done && current && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}
                >
                  Frage {step + 1} von {total}
                </div>
                <h2 style={{ fontSize: 18, marginBottom: 12 }}>{current.q}</h2>

                <div style={{ display: "grid", gap: 8 }}>
                  {current.answers.map((opt) => {
                    const picked = answers[current.id];
                    const isPicked = picked === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelect(current.id, opt.id)}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: isPicked
                            ? "2px solid #16a34a"
                            : "1px solid #e5e7eb",
                          background: isPicked ? "#dcfce7" : "#ffffff",
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        <strong style={{ marginRight: 6 }}>
                          {opt.id.toUpperCase()}.
                        </strong>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="cta"
                    onClick={handleNext}
                    disabled={!answers[current.id]}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      cursor: answers[current.id] ? "pointer" : "not-allowed",
                    }}
                  >
                    {step + 1 < total ? "Nächste Frage" : "Auswertung anzeigen"}
                  </button>
                </div>
              </div>
            )}

            {done && total > 0 && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h2 style={{ fontSize: 20, marginBottom: 12 }}>Auswertung</h2>
                <p style={{ marginBottom: 12 }}>
                  Du hast <strong>{numCorrect}</strong> von{" "}
                  <strong>{total}</strong> Fragen richtig beantwortet.
                </p>

                <details style={{ marginBottom: 16 }}>
                  <summary style={{ cursor: "pointer" }}>
                    Lösungen im Detail anzeigen
                  </summary>
                  <ol style={{ marginTop: 12 }}>
                    {items.map((q) => {
                      const picked = answers[q.id];
                      const correct = q.correct && q.correct[0];
                      const ok = picked === correct;
                      return (
                        <li key={q.id} style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 600 }}>{q.q}</div>
                          <div style={{ fontSize: 14 }}>
                            Deine Antwort:{" "}
                            <strong>
                              {picked
                                ? q.answers.find((a) => a.id === picked)?.text
                                : "keine Antwort"}
                            </strong>
                            {" · "}
                            Richtige Antwort:{" "}
                            <strong>
                              {q.answers.find((a) => a.id === correct)?.text}
                            </strong>
                            {" · "}
                            <span
                              style={{ color: ok ? "#16a34a" : "#dc2626" }}
                            >
                              {ok ? "richtig" : "falsch"}
                            </span>
                          </div>
                          {q.explain && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "#6b7280",
                                marginTop: 4,
                              }}
                            >
                              {q.explain}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </details>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <a className="btn" href="/quiz">
                    Zur Übersicht
                  </a>
                  <button
                    type="button"
                    className="cta"
                    onClick={handleRestart}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Nochmal mit neuer Reihenfolge
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </>
    </RequireAccess>
  );
}

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

export default QuizRun;
