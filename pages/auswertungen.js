import Link from "next/link";
import AccountLayout, { AccountError } from "../components/AccountLayout";
import useActivityStatistics from "../hooks/useActivityStatistics";
import { getAccountPageProps } from "../lib/account-page";
import styles from "../styles/Statistics.module.css";

export const getServerSideProps = getAccountPageProps;

function percent(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toLocaleString("de-CH", { maximumFractionDigits: 1 })} %`
    : "—";
}

function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString("de-CH", {
    timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Metric({ label, value }) {
  return <div className={styles.metric}><strong>{value}</strong><span>{label}</span></div>;
}

export default function StatisticsPage() {
  const { statistics, loading, error, reload } = useActivityStatistics();
  return (
    <AccountLayout title="Meine Auswertungen" description="Deine Ergebnisse aus Quiz und Ansitzsimulator, auf allen Geräten in deinem Konto." active="statistics">
      {loading ? <p role="status">Deine Auswertungen werden geladen …</p> : error ? (
        error.status === 401 ? <AccountError error={error} next="/auswertungen" onRetry={reload} /> : (
          <div className={styles.notice} role="alert">
            <p>Deine Auswertungen sind gerade nicht erreichbar. Bitte versuche es später erneut.</p>
            <button type="button" className={styles.button} onClick={reload}>Erneut versuchen</button>
          </div>
        )
      ) : statistics && (
        <>
          <p className={styles.explanation}>Es zählen abgeschlossene Runden ab jetzt. Die Trefferquote berücksichtigt alle Fragen; Zeitüberschreitungen zählen als nicht richtig beantwortet.</p>
          {statistics.quiz.rounds === 0 && statistics.ansitz.rounds === 0 && (
            <p className={styles.notice}>Deine Auswertungen starten mit der nächsten abgeschlossenen Quizrunde oder einem vollständigen Ansitzdurchlauf.</p>
          )}
          <section className={styles.card} aria-labelledby="quiz-statistics">
            <h2 id="quiz-statistics">Quiz</h2>
            <div className={styles.metrics}>
              <Metric label="Abgeschlossene Runden" value={statistics.quiz.rounds} />
              <Metric label="Trefferquote" value={percent(statistics.quiz.hitRate)} />
              <Metric label="Beste Runde" value={percent(statistics.quiz.bestHitRate)} />
              <Metric label="Gesamtpunkte" value={statistics.quiz.totalPoints} />
            </div>
            <p>{statistics.quiz.correctAnswers} von {statistics.quiz.totalQuestions} Fragen richtig. Zeit überschritten bei {statistics.quiz.timedOutAnswers} Fragen.</p>
            <p className={styles.explanation}>Die Quizpunkte enthalten den Zeitbonus. Die beste Runde wird anhand der Trefferquote verglichen.</p>
            <Link href="/quiz" className={styles.button}>Quiz spielen</Link>
          </section>
          <section className={styles.card} aria-labelledby="ansitz-statistics">
            <h2 id="ansitz-statistics">Ansitzsimulator</h2>
            <div className={styles.metrics}>
              <Metric label="Abgeschlossene Durchläufe" value={statistics.ansitz.rounds} />
              <Metric label="Richtige Entscheidungen" value={statistics.ansitz.correctAnswers} />
              <Metric label="Trefferquote" value={percent(statistics.ansitz.hitRate)} />
              <Metric label="Bester Durchlauf" value={percent(statistics.ansitz.bestHitRate)} />
            </div>
            <p>{statistics.ansitz.correctAnswers} von {statistics.ansitz.totalQuestions} Entscheidungen richtig.</p>
            <Link href="/jagdpraxis/ansitz" className={styles.button}>Ansitz üben</Link>
          </section>
          <section className={styles.card} aria-labelledby="topic-statistics">
            <h2 id="topic-statistics">Quizrunden nach Thema</h2>
            {statistics.topics.length === 0 ? <p>Noch keine Quizrunden erfasst.</p> : (
              <ul className={styles.list}>
                {statistics.topics.map(item => (
                  <li className={styles.row} key={`${item.country}:${item.topic}`}>
                    <div><strong>{item.topic} · {item.country}</strong><p>{item.rounds} Runden · {item.correctAnswers} / {item.totalQuestions} richtig</p></div>
                    <strong>{percent(item.hitRate)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={styles.card} aria-labelledby="result-history">
            <h2 id="result-history">Letzte Ergebnisse</h2>
            {statistics.history.length === 0 ? <p>Noch keine Ergebnisse erfasst.</p> : (
              <ul className={styles.list}>
                {statistics.history.map(item => (
                  <li className={styles.row} key={item.eventId}>
                    <div>
                      <strong>{item.type === "quiz" ? `Quiz · ${item.topic} · ${item.country}` : "Ansitzsimulator"}</strong>
                      <p>{date(item.finishedAt)}</p>
                      <p>{item.correctAnswers} / {item.totalQuestions} richtig{item.type === "quiz" ? ` · ${item.points} Punkte` : ""}</p>
                    </div>
                    <strong>{percent(item.correctAnswers / item.totalQuestions * 100)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.explanation}>Der Verlauf zeigt die letzten 20 Ergebnisse. Die Gesamtwerte berücksichtigen alle gespeicherten Runden.</p>
          </section>
        </>
      )}
    </AccountLayout>
  );
}
