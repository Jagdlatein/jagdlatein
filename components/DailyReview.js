import { answerOrder, newAnswerSeed } from "../lib/answer-order";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LearningToolLayout from "./LearningToolLayout";
import { learningCategoryDetails } from "../lib/learning-categories";
import { readReviewHistory, recordReviewAnswer, clearReviewHistory, selectDailyReview, reviewMethodSources } from "../lib/daily-review";
import { unpackDailyReviewCatalog } from "../lib/daily-review-catalog";
import styles from "../styles/LearningExperience.module.css";

export default function DailyReview({ pool: suppliedPool, catalog }) {
  const pool = useMemo(() => Array.isArray(suppliedPool) ? suppliedPool : unpackDailyReviewCatalog(catalog), [suppliedPool, catalog]);
  const [category, setCategory] = useState("");
  const [round, setRound] = useState(null);
  const [load, setLoad] = useState({ phase: "loading", message: "", status: 0 });
  const current = useRef(null);
  const categoryRef = useRef("");
  const request = useRef(0);
  const controller = useRef(null);
  const mounted = useRef(false);
  const heading = useRef(null);
  const [notice, setNotice] = useState("");
  const available = learningCategoryDetails.filter(item => pool.some(question => question.category === item.slug));
  async function start(selected = categoryRef.current) {
    if (selected && !available.some(item => item.slug === selected)) return;
    const version = ++request.current;
    controller.current?.abort();
    current.current = null; setRound(null);
    setLoad({ phase: "loading", message: "", status: 0 });
    // Selection and reasons are computed locally. Only the selected IDs leave the device.
    const selectedQuestions = selectDailyReview(pool, readReviewHistory(), { category: selected, count: 8 });
    if (!selectedQuestions.length) {
      const next = { questions: [], index: 0, selected: null, score: 0, finished: false };
      current.current = next; setRound(next); setLoad({ phase: "ready", message: "", status: 0 });
      return;
    }
    const abort = new AbortController(); controller.current = abort;
    let responseStatus = 0;
    try {
      const params = new URLSearchParams({ ids: selectedQuestions.map(question => question.id).join(",") });
      const response = await fetch(`/api/lernen/wiederholung?${params}`, { signal: abort.signal, cache: "no-store", credentials: "same-origin" });
      responseStatus = response.status;
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body?.message === "string" ? body.message : "Deine Fragen konnten nicht geladen werden.");
      const details = Array.isArray(body?.questions) ? new Map(body.questions.map(question => [question?.id, question])) : null;
      if (!details || details.size !== selectedQuestions.length || body.questions.length !== selectedQuestions.length || selectedQuestions.some(item => {
        const question = details.get(item.id);
        return !question || question.category !== item.category || typeof question.q !== "string" || !Array.isArray(question.answers) || question.answers.length !== 4 ||
          question.answers.some(answer => !answer || typeof answer.id !== "string" || typeof answer.text !== "string") || new Set(question.answers.map(answer => answer.id)).size !== 4 ||
          !Array.isArray(question.correct) || !question.correct.length || question.correct.some(id => !question.answers.some(answer => answer.id === id)) ||
          typeof question.explain !== "string" || typeof question.courseTitle !== "string" || !Array.isArray(question.sources) ||
          question.reading != null && (typeof question.reading.title !== "string" || !question.reading.title.trim() || typeof question.reading.paragraph !== "string" || !question.reading.paragraph.trim()) ||
          typeof question.href !== "string" || !question.href.startsWith("/kurse/");
      })) throw new Error("Die Fragenauswahl konnte nicht vollständig geladen werden. Bitte erneut versuchen.");
      if (version !== request.current || abort.signal.aborted || !mounted.current) return;
      const answerSeed = newAnswerSeed();
      const questions = selectedQuestions.map(item => {
        const question = details.get(item.id);
        return { ...question, answers: answerOrder(question.answers, question.id, answerSeed).map(index => question.answers[index]), reason: item.reason };
      });
      const next = { questions, index: 0, selected: null, score: 0, finished: false };
      current.current = next; setRound(next); setLoad({ phase: "ready", message: "", status: 0 });
    } catch (failure) {
      if (version === request.current && !abort.signal.aborted && mounted.current) {
        current.current = null; setRound(null);
        setLoad({ phase: "error", message: failure.message || "Deine Fragen konnten nicht geladen werden.", status: responseStatus });
      }
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  }
  useEffect(() => {
    mounted.current = true; start("");
    return () => { mounted.current = false; ++request.current; controller.current?.abort(); current.current = null; };
  }, []);
  useEffect(() => { if (round?.index > 0 || round?.finished) heading.current?.focus({ preventScroll: true }); }, [round?.index, round?.finished]);
  function choose(id) {
    if (!round || current.current !== round || round.finished || round.selected !== null) return;
    const question = round.questions[round.index];
    if (!question.answers.some(answer => answer.id === id)) return;
    const correct = question.correct.includes(id);
    const next = { ...round, selected: id, score: round.score + (correct ? 1 : 0) };
    current.current = next; setRound(next);
    if (!recordReviewAnswer(question.id, correct)) setNotice("Du kannst weiterüben. Dieser Browser speichert die Wiederholungen gerade nicht.");
  }
  function advance() {
    if (!round || current.current !== round || round.finished || round.selected === null) return;
    const next = round.index + 1 === round.questions.length ? { ...round, finished: true } : { ...round, index: round.index + 1, selected: null };
    current.current = next; setRound(next);
  }
  const question = round?.questions[round.index];
  return <LearningToolLayout title="Deine fünf Minuten Wissen" icon="book" category="pruefung-sprache" headingOnly searchHref="/lernen#lernen-suche">
    <section className={styles.panel}>
      <p>Eine kurze Runde mit bis zu acht Fragen aus den ausführlichen Kursen. Du bestimmst das Tempo; fünf Minuten sind eine Orientierung.</p>
      <label htmlFor="review-category">Thema</label>{" "}<select id="review-category" value={category} onChange={event => { const value = event.target.value; if (value && !available.some(item => item.slug === value)) return; categoryRef.current = value; setCategory(value); start(value); }}>
        <option value="">Themen mischen</option>{available.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
      </select>
      <p className={styles.muted}>Auf diesem Gerät: zuerst fällige Fehler und Wiederholungen, dann neue Fragen. Antworten aus ausführlichen Kursen und deren Quizfragen fließen ab jetzt ein. Frühere Antworten werden nicht nachträglich übernommen.</p>
    </section>
    {load.phase === "error" ? <section className={styles.panel} role="alert"><p>{load.message}</p>{load.status === 401 ? <Link href="/login?next=%2Flernen%2Ffuenf-minuten">Zum Jagdlatein-Konto</Link> : load.status === 403 ? <Link href="/preise?next=%2Flernen%2Ffuenf-minuten">Zugang ansehen</Link> : <button type="button" className={styles.primary} onClick={() => start()}>Erneut versuchen</button>}</section> : !round ? <p role="status">Deine Fragen werden geladen …</p> : round.finished ? <section className={styles.panel}>
      <h2 tabIndex={-1} ref={heading}>Deine Runde ist abgeschlossen</h2><p>{round.score} von {round.questions.length} richtig. Lies die Erklärungen und wiederhole zu einem späteren Zeitpunkt.</p>
      <button type="button" className={styles.primary} onClick={() => start()}>Neue kurze Runde</button>
    </section> : question ? <section className={styles.panel}>
      <p className={styles.eyebrow}>{question.reason} · Frage {round.index + 1} von {round.questions.length}</p>
      <h2 ref={heading} tabIndex={-1}>{question.q}</h2>
      <div className={styles.choices}>{question.answers.map(answer => <button type="button" key={answer.id} className={`${styles.choice} ${round.selected !== null && question.correct.includes(answer.id) ? styles.correct : round.selected === answer.id ? styles.wrong : ""}`} disabled={round.selected !== null} aria-pressed={round.selected === answer.id} onClick={() => choose(answer.id)}>{answer.text}</button>)}</div>
      {round.selected !== null && <div className={styles.feedback}><div role="status"><h3>{question.correct.includes(round.selected) ? "Richtig" : "Noch einmal nachlesen"}</h3><p>{question.explain}</p></div>
        {question.reading && <section className={styles.reviewReading} aria-labelledby={`reading-${question.id}`}><h3 id={`reading-${question.id}`}>Wissen dazu</h3><p><strong>{question.reading.title}</strong></p><p>{question.reading.paragraph}</p></section>}
        <Link href={question.href}>In „{question.courseTitle}“ weiterlesen</Link><details><summary>{question.sourceScope === "lesson" ? "Quellen zur passenden Lektion" : "Quellen der Lerneinheit"}</summary><ul>{question.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label || source.title}</a></li>)}</ul></details></div>}
      {round.selected !== null && <button type="button" className={styles.primary} onClick={advance}>{round.index + 1 === round.questions.length ? "Runde abschließen" : "Nächste Frage"}</button>}
    </section> : <p>Für dieses Thema sind noch keine Fragen in der kurzen Runde verfügbar.</p>}
    {notice && <p role="status">{notice}</p>}
    <details className={styles.panel}><summary>Wie die Wiederholung funktioniert</summary>
      <p>Eine falsche Antwort wird nach zehn Minuten fällig. Nach richtigen Antworten folgen Abstände von einem, drei, sieben, vierzehn und dreißig Tagen. Die kurzen Runden ergänzen bei Bedarf neue oder noch nicht fällige Fragen. Das ist eine einfache Lernhilfe, kein wissenschaftlich optimaler Zeitplan.</p>
      <p>Gespeichert werden nur Fragenkennungen, Antwortzählungen, Fehlerzahl, Zeitpunkt und nächste Wiederholung auf diesem Gerät. Kein gewählter Antworttext und keine E-Mail-Adresse. Der Verlauf wird nicht ins Konto übertragen und beim Logout oder der Kontolöschung auf diesem Gerät entfernt.</p>
      <p>Zum Laden der Runde werden nur die Kennungen der bis zu acht ausgewählten Fragen übermittelt. Dein Verlauf und deine gewählten Antworten bleiben auf dem Gerät.</p>
      <ul>{reviewMethodSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a><p>{source.supports}</p></li>)}</ul>
      <button type="button" className={styles.secondary} onClick={() => { if (clearReviewHistory()) { setNotice("Lokalen Wiederholungsverlauf entfernt."); start(); } else setNotice("Der lokale Verlauf konnte nicht entfernt werden. Bitte die Browserdaten dieser App löschen."); }}>Wiederholungsverlauf entfernen</button>
    </details>
  </LearningToolLayout>;
}
