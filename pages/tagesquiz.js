import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { QUESTIONS } from "../data/questions-full";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getSwissDateParts(date) {
  const parts = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );
}

function getDailyQuestion() {
  const now = new Date();

  const { year, month, day } = getSwissDateParts(now);

  const dayNumber = Math.floor(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    ) / DAY_IN_MS
  );

  const pool = QUESTIONS.filter(
    (question) =>
      question &&
      question.q &&
      Array.isArray(question.answers) &&
      question.answers.length === 4 &&
      Array.isArray(question.correct) &&
      question.correct.length === 1 &&
      Array.isArray(question.countries) &&
      question.countries.length > 0
  );

  return {
    displayDate: new Intl.DateTimeFormat("de-CH", {
      timeZone: "Europe/Zurich",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(now),

    question: pool[dayNumber % pool.length],
  };
}

export default function Tagesquiz({
  question,
  displayDate,
}) {
  const [selectedId, setSelectedId] = useState(null);

  const answered = selectedId !== null;

  const isCorrect =
    answered &&
    question.correct.includes(selectedId);

  function answerStyle(answer) {
    if (!answered) {
      return styles.answer;
    }

    if (question.correct.includes(answer.id)) {
      return {
        ...styles.answer,
        ...styles.correctAnswer,
      };
    }

    if (answer.id === selectedId) {
      return {
        ...styles.answer,
        ...styles.wrongAnswer,
      };
    }

    return {
      ...styles.answer,
      ...styles.inactiveAnswer,
    };
  }

  return (
    <>
      <Head>
        <title>Tagesquiz – Jagdlatein</title>

        <meta
          name="description"
          content="Jeden Tag eine neue Jagdfrage im Jagdlatein-Tagesquiz beantworten."
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>

      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.eyebrow}>
            Frage des Tages · {displayDate}
          </div>

          <h1 style={styles.heading}>
            Tagesquiz
          </h1>

          <p style={styles.lead}>
            Teste dein Jagdwissen – morgen wartet eine neue Frage.
          </p>

          <section
            style={styles.card}
            aria-labelledby="daily-question"
          >
            <div style={styles.metaRow}>
              <span style={styles.topic}>
                {question.topic}
              </span>

              <span style={styles.countries}>
                {question.countries.join(" · ")}
              </span>
            </div>

            <h2
              id="daily-question"
              style={styles.question}
            >
              {question.q}
            </h2>

            <div style={styles.answers}>
              {question.answers.map((answer) => (
                <button
                  key={answer.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(answer.id)
                  }
                  disabled={answered}
                  aria-pressed={
                    selectedId === answer.id
                  }
                  style={answerStyle(answer)}
                >
                  <span style={styles.answerLetter}>
                    {answer.id.toUpperCase()}
                  </span>

                  <span>
                    {answer.text}
                  </span>
                </button>
              ))}
            </div>

            {answered && (
              <div
                role="status"
                style={{
                  ...styles.feedback,
                  ...(isCorrect
                    ? styles.correctFeedback
                    : styles.wrongFeedback),
                }}
              >
                <strong>
                  {isCorrect
                    ? "Richtig!"
                    : "Leider falsch."}
                </strong>

                <span style={styles.explanation}>
                  {question.explain}
                </span>

                <span style={styles.tomorrow}>
                  Morgen gibt es eine neue Frage.
                </span>
              </div>
            )}
          </section>

          <div style={styles.links}>
            <Link
              href="/quiz"
              style={styles.quizLink}
            >
              Mehr Fragen spielen
            </Link>

            <Link
              href="/"
              style={styles.homeLink}
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export function getServerSideProps() {
  const dailyQuiz = getDailyQuestion();

  return {
    props: {
      question: dailyQuiz.question,
      displayDate: dailyQuiz.displayDate,
    },
  };
}

const styles = {
  main: {
    minHeight: "100vh",
    padding: "38px 16px 48px",
    background:
      "linear-gradient(180deg,#faf8f1,#f4efe3)",
    fontFamily:
      "system-ui, Segoe UI, Roboto, Arial",
  },

  container: {
    width: "100%",
    maxWidth: 720,
    margin: "0 auto",
  },

  eyebrow: {
    marginBottom: 8,
    color: "#79611e",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: ".04em",
    textTransform: "uppercase",
  },

  heading: {
    margin: "0 0 8px",
    color: "#1f2b23",
    fontSize: 38,
    lineHeight: 1.1,
  },

  lead: {
    margin: "0 0 22px",
    color: "#4b5563",
    fontSize: 17,
    lineHeight: 1.5,
  },

  card: {
    padding: 22,
    background: "#fffdf7",
    border:
      "1px solid rgba(202,165,59,.5)",
    borderRadius: 18,
    boxShadow:
      "0 10px 28px rgba(31,43,35,.10)",
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  topic: {
    padding: "5px 10px",
    background: "#efe4bd",
    borderRadius: 999,
    color: "#4b3b10",
    fontSize: 14,
    fontWeight: 700,
  },

  countries: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 700,
  },

  question: {
    margin: "0 0 20px",
    color: "#171b18",
    fontSize: 24,
    lineHeight: 1.35,
  },

  answers: {
    display: "grid",
    gap: 11,
  },

  answer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 15px",
    background: "#fff",
    border: "1px solid #d7ddd8",
    borderRadius: 12,
    color: "#1f2937",
    fontFamily: "inherit",
    fontSize: 16,
    lineHeight: 1.4,
    textAlign: "left",
    cursor: "pointer",
  },

  answerLetter: {
    flex: "0 0 auto",
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1ead4",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 900,
  },

  correctAnswer: {
    background: "#e5f6e9",
    borderColor: "#2f855a",
    color: "#175233",
  },

  wrongAnswer: {
    background: "#fde8e8",
    borderColor: "#c24141",
    color: "#7f1d1d",
  },

  inactiveAnswer: {
    opacity: 0.58,
  },

  feedback: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    marginTop: 18,
    padding: 15,
    borderRadius: 12,
    fontSize: 17,
    lineHeight: 1.5,
  },

  correctFeedback: {
    background: "#eaf7ed",
    border: "1px solid #86c99a",
    color: "#175233",
  },

  wrongFeedback: {
    background: "#fff2f2",
    border: "1px solid #e7aaaa",
    color: "#7f1d1d",
  },

  explanation: {
    color: "#374151",
    fontSize: 16,
  },

  tomorrow: {
    marginTop: 2,
    color: "#6b7280",
    fontSize: 14,
  },

  links: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },

  quizLink: {
    padding: "11px 17px",
    background: "#caa53b",
    borderRadius: 10,
    color: "#111",
    fontSize: 16,
    fontWeight: 800,
    textDecoration: "none",
  },

  homeLink: {
    padding: "11px 4px",
    color: "#334155",
    fontSize: 16,
  },
};
