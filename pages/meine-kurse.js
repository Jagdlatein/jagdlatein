import Link from "next/link";
import { useState } from "react";
import AccountLayout, { AccountError, ProgressError } from "../components/AccountLayout";
import AppIcon from "../components/AppIcon";
import useAccountOverview from "../hooks/useAccountOverview";
import { getAccountPageProps } from "../lib/account-page";
import { getMyCourseCatalog } from "../lib/my-course-catalog";
import { getMyCoursesView } from "../lib/my-courses";
import styles from "../styles/Account.module.css";

export function getServerSideProps(context) {
  const result = getAccountPageProps(context);
  if (result.redirect) return result;
  return { ...result, props: { ...result.props, catalog: getMyCourseCatalog() } };
}

const filters = [
  { value: "all", label: "Alle", metric: "total" },
  { value: "in_progress", label: "Begonnen", metric: "in_progress" },
  { value: "completed", label: "Abgeschlossen", metric: "completed" },
  { value: "open", label: "Noch offen", metric: "open" },
];
const PAGE_SIZE = 12;

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("de-CH");
}

export default function MyCoursesPage({ catalog = [] }) {
  const { account, progress, accountError, progressError, loading, progressLoading, reload } = useAccountOverview();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const view = getMyCoursesView(catalog, progress, { query, category, status, sort });
  const filtered = Boolean(query.trim() || category !== "all" || status !== "all");

  function change(setter, value) {
    setter(value);
    setLimit(PAGE_SIZE);
  }
  function reset() {
    setStatus("all"); setQuery(""); setCategory("all"); setSort("recent"); setLimit(PAGE_SIZE);
  }

  return (
    <AccountLayout title="Meine Kurse" description="Finde dein Thema, sieh deinen gespeicherten Fortschritt und lerne direkt weiter." active="courses">
      {loading ? <p role="status">Dein Konto wird geladen …</p> : accountError ? (
        <AccountError error={accountError} next="/meine-kurse" onRetry={reload} />
      ) : account && (
        progressLoading ? <p role="status">Kursfortschritt wird geladen …</p> : progressError ? (
          <ProgressError error={progressError} onRetry={reload} />
        ) : (
          <>
            <section className={styles.card} aria-labelledby="my-learning-heading">
              <h2 id="my-learning-heading">Dein Lernen im Überblick</h2>
              <div className={styles.metrics}>
                <div><strong>{view.metrics.total}</strong><span>Kurse insgesamt</span></div>
                <div><strong>{view.metrics.in_progress}</strong><span>Begonnen</span></div>
                <div><strong>{view.metrics.completed}</strong><span>Abgeschlossen</span></div>
              </div>
              <p className={styles.muted}>Abgeschlossen bedeutet: alle Quizfragen beantwortet. Die Trefferquote steht separat beim Kurs. Der Balken zeigt deinen gespeicherten Fragenfortschritt.</p>
            </section>
            <section className={styles.card} aria-labelledby="my-course-search-heading">
              <h2 id="my-course-search-heading"><AppIcon name="search" size={22} /> Deinen nächsten Kurs finden</h2>
              <div className={styles.courseFilters}>
                <label className={styles.courseQuery}>Kurse durchsuchen
                  <input type="search" maxLength={160} value={query} onChange={event => change(setQuery, event.target.value)} placeholder="Zum Beispiel Gams, Nachsuche oder Hund" />
                </label>
                <label>Kategorie
                  <select value={category} onChange={event => change(setCategory, event.target.value)}>
                    <option value="all">Alle Kategorien</option>
                    {view.categories.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
                  </select>
                </label>
                <label>Reihenfolge
                  <select value={sort} onChange={event => change(setSort, event.target.value)}>
                    <option value="recent">Zuletzt bearbeitet</option>
                    <option value="title">Kurstitel A–Z</option>
                  </select>
                </label>
              </div>
              <div className={styles.filters} role="group" aria-label="Kurse nach Fortschritt filtern">
                {filters.map(item => <button key={item.value} type="button" aria-pressed={status === item.value} onClick={() => change(setStatus, item.value)}>{item.label} <span className={styles.filterCount}>{view.metrics[item.metric]}</span></button>)}
              </div>
              <div className={styles.courseResultStatus}>
                <p role="status" aria-live="polite">{view.rows.length} von {view.metrics.total} Kursen {filtered ? "passen zu deiner Auswahl" : "stehen in deiner Übersicht"}.</p>
                {filtered && <button type="button" className={styles.secondaryButton} onClick={reset}>Auswahl zurücksetzen</button>}
              </div>
            </section>
            {view.rows.length === 0 ? <section className={styles.card} aria-labelledby="my-courses-empty">
              <h2 id="my-courses-empty">Keine passenden Kurse</h2>
              <p>Versuche einen kürzeren Suchbegriff oder ändere Kategorie und Fortschritt.</p>
              <button type="button" className={styles.button} onClick={reset}>Alle Kurse anzeigen</button>
            </section> : <div className={`${styles.courseList} ${styles.personalCourseGrid}`}>
              {view.rows.slice(0, limit).map(row => {
                const { course, entry, status: courseStatus, answered, total, percent, bestScore, bestPercent } = row;
                const completed = courseStatus === "completed";
                const completedDate = completed && entry?.completed_at ? formatDate(entry.completed_at) : "";
                return <article className={styles.courseCard} key={course.id}>
                  <p className={styles.courseCategory}><AppIcon name={course.categorySlug || "book"} size={18} /> {course.categoryTitle || "Lernkurs"}</p>
                  <div className={styles.courseHeading}>
                    <h2>{course.title}</h2>
                    <span className={completed ? styles.completed : styles.badge}>{completed ? "Abgeschlossen" : courseStatus === "in_progress" ? "Begonnen" : "Noch offen"}</span>
                  </div>
                  <p className={styles.muted}>{course.description}</p>
                  {percent !== null ? <div className={styles.courseProgress}>
                    <p>{answered} von {total} Quizfragen beantwortet</p>
                    <progress value={answered} max={total} aria-label={`Gespeicherte Quizfragen beantwortet: ${course.title}`} />
                  </div> : <p className={styles.muted}>Den gespeicherten Fragenfortschritt kannst du im Kurs prüfen.</p>}
                  {completed && bestPercent !== null && <p>Bestes Ergebnis: <strong>{bestScore} / {total}</strong> ({bestPercent} % richtig)</p>}
                  {completedDate && <p className={styles.muted}>Abgeschlossen am {completedDate}</p>}
                  <Link href={course.href} className={styles.secondaryButton}>{completed ? "Kurs wiederholen" : courseStatus === "in_progress" ? "Weiterlernen" : "Kurs öffnen"}</Link>
                </article>;
              })}
            </div>}
            {view.rows.length > 0 && <div className={styles.courseMore}>
              <p>{Math.min(limit, view.rows.length)} von {view.rows.length} passenden Kursen angezeigt.</p>
              {limit < view.rows.length && <button type="button" className={styles.button} onClick={() => setLimit(value => value + PAGE_SIZE)}>Weitere Kurse anzeigen</button>}
              <Link className={styles.helpLink} href="/lernen#lernen-suche">Auch Wildarten, Fachbegriffe und Lernwerkzeuge suchen</Link>
            </div>}
          </>
        )
      )}
    </AccountLayout>
  );
}
