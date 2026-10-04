import Link from "next/link";
import { useState } from "react";
import AccountLayout, { AccountError, ProgressError } from "../components/AccountLayout";
import AppIcon from "../components/AppIcon";
import useAccountOverview from "../hooks/useAccountOverview";
import { getAccountPageProps } from "../lib/account-page";
import { courses } from "../lib/course-catalog";
import styles from "../styles/Account.module.css";

export const getServerSideProps = getAccountPageProps;

const filters = [
  { value: "all", label: "Alle" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "in_progress", label: "Begonnen" },
  { value: "open", label: "Noch offen" },
];

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("de-CH");
}

export default function MyCoursesPage() {
  const { account, progress, accountError, progressError, loading, progressLoading, reload } = useAccountOverview();
  const [filter, setFilter] = useState("all");
  const byCourse = new Map(progress.map((entry) => [entry.course_id, entry]));
  const visible = courses.filter((course) => filter === "all" || (byCourse.get(course.id)?.status || "open") === filter);

  return (
    <AccountLayout title="Meine Kurse" description="Sieh, welche Kurse du begonnen oder abgeschlossen hast." active="courses">
      {loading ? <p role="status">Dein Konto wird geladen …</p> : accountError ? (
        <AccountError error={accountError} next="/meine-kurse" onRetry={reload} />
      ) : account && (
        progressLoading ? <p role="status">Kursfortschritt wird geladen …</p> : progressError ? (
          <ProgressError error={progressError} onRetry={reload} />
        ) : (
          <>
            <p className={styles.muted}>Abgeschlossen bedeutet: alle Quizfragen beantwortet. Das Ergebnis wird separat angezeigt. Neue Abschlüsse erscheinen hier automatisch.</p>
            <div className={styles.filters} aria-label="Kurse filtern">
              {filters.map((item) => (
                <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>
              ))}
            </div>
            {visible.length === 0 && <p className={styles.card}>Hier sind noch keine Kurse erfasst. <Link href="/kurse">Kurse entdecken</Link></p>}
            <div className={styles.courseList}>
              {visible.map((course) => {
                const entry = byCourse.get(course.id);
                const completed = entry?.status === "completed";
                return (
                  <article className={styles.courseCard} key={course.id}>
                    <div className={styles.courseHeading}>
                      <h2><AppIcon name="book" size={24} />{course.title.replace(/^[^\p{L}\p{N}]+/u, "")}</h2>
                      <span className={completed ? styles.completed : styles.badge}>{completed ? "Abgeschlossen" : entry ? "Begonnen" : "Noch offen"}</span>
                    </div>
                    <p className={styles.muted}>{course.description}</p>
                    {entry && (
                      <>
                        <p>{entry.answered_questions} von {entry.total_questions} Fragen beantwortet</p>
                        {completed && <p>Bestes Ergebnis: <strong>{entry.best_score} / {entry.total_questions}</strong> ({Math.round(entry.best_score / entry.total_questions * 100)} % richtig)</p>}
                        {completed && entry.completed_at && <p className={styles.muted}>Abgeschlossen am {formatDate(entry.completed_at)}</p>}
                      </>
                    )}
                    <Link href={course.href} className={styles.secondaryButton}>{completed ? "Kurs wiederholen" : "Kurs öffnen"}</Link>
                  </article>
                );
              })}
            </div>
          </>
        )
      )}
    </AccountLayout>
  );
}
