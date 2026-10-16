"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppIcon from "../../../components/AppIcon";
import { quizLeaderboardRows } from "../../../lib/quiz-leaderboard-view";
import styles from "../../../styles/QuizLeaderboard.module.css";

export default function LeaderboardClient() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    let controller;
    async function load() {
      const request = ++generation.current;
      controller?.abort();
      controller = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/quiz/leaderboard-week", {
          cache: "no-store", credentials: "same-origin", signal: controller.signal,
        });
        if (!response.ok) throw Object.assign(new Error("Rangliste nicht erreichbar."), { status: response.status });
        const json = await response.json();
        const nextRows = quizLeaderboardRows(json?.data);
        if (!active || request !== generation.current) return;
        setRows(nextRows);
      } catch (failure) {
        if (active && request === generation.current) setError({ status: failure?.status || 0 });
      } finally {
        if (active && request === generation.current) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      generation.current += 1;
      controller?.abort();
    };
  }, [reloadKey]);

  const loginRequired = error?.status === 401;
  const accessRequired = error?.status === 403;

  return <main className={styles.main}>
    <div className={styles.wrap}>
      <nav className={styles.nav} aria-label="Quizmenü">
        <Link href="/lernen"><AppIcon name="book" size={21} />Lernbereich</Link>
        <Link href="/auswertungen"><AppIcon name="stats" size={21} />Meine Auswertungen</Link>
      </nav>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Gemeinsam Wissen anwenden</p>
        <h1><AppIcon name="trophy" size={40} />Quiz-Rangliste</h1>
        <p>Hier zählt dein bester Durchlauf aus einer vollständig gespielten Quizrunde. Spiele erneut und verbessere dein Ergebnis.</p>
        <Link href="/quiz-app" className={styles.start}>Quiz starten<AppIcon name="arrow-right" size={22} /></Link>
      </header>
      <section className={styles.card} aria-labelledby="quiz-ranking-title" aria-busy={loading}>
        <div className={styles.tableHeading}>
          <div><h2 id="quiz-ranking-title">Die besten Ergebnisse</h2><p>Top 100 · Gleiche Punktzahl, gleicher Rang</p></div>
          {!loginRequired && !accessRequired && <button type="button" className={styles.refresh} disabled={loading} onClick={() => setReloadKey(value => value + 1)}>Aktualisieren</button>}
        </div>
        {loading && <p className={styles.notice} role="status">{rows.length ? "Rangliste wird aktualisiert …" : "Rangliste wird geladen …"}</p>}
        {error && <div className={styles.error} role="alert">
          <AppIcon name="alert" size={27} />
          <div>{loginRequired ? <><p>Bitte melde dich erneut an, um die Rangliste zu sehen.</p><Link href="/login?reauth=1&next=%2Fquiz-app%2Fleaderboard">Anmeldung erneuern</Link></>
            : accessRequired ? <><p>Für die Rangliste und gewertete Quizrunden brauchst du einen aktiven Jagdlatein-Zugang.</p><Link href="/konto">Zugang prüfen</Link></>
              : <p>Die Rangliste ist gerade nicht erreichbar. Bitte versuche es über „Aktualisieren“ erneut.</p>}</div>
        </div>}
        {!loading && !error && rows.length === 0 && <div className={styles.empty} role="status"><AppIcon name="quiz" size={34} /><h3>Dein Ergebnis kann den Anfang machen</h3><p>Spiele eine Quizrunde vollständig. Danach erscheint deine Bestleistung hier unter deinem Quiznamen.</p></div>}
        {!error && rows.length > 0 && <table className={styles.table}>
          <caption className={styles.srOnly}>Beste vollständig gespielte Quizrunde je Quizname, nach Punkten geordnet. Bei Punktgleichheit teilen sich Quiznamen den Rang.</caption>
          <thead><tr><th scope="col">Platz</th><th scope="col">Quizname</th><th scope="col" className={styles.points}>Punkte</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.username} className={row.rank <= 3 ? styles.topRank : undefined}>
            <td><span className={styles.rank}>{row.rank}<span className={styles.srOnly}>. Platz</span></span></td>
            <th scope="row"><span className={styles.name}>{row.displayName}</span><span className={styles.country}>Ranglistenland: {row.country}</span></th>
            <td className={styles.points}><strong>{row.points.toLocaleString("de-CH")}</strong></td>
          </tr>)}</tbody>
        </table>}
        <p className={styles.note}>Dein öffentlicher Quizname und das gewählte Ranglistenland werden angezeigt. Deine persönlichen Ergebnisse findest du unter „Meine Auswertungen“.</p>
      </section>
    </div>
  </main>;
}
