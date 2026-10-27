import { answerOrder, newAnswerSeed } from "../lib/answer-order";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { learningCategoryDetails } from "../lib/learning-categories";
import { readReviewHistory, recordReviewAnswer, clearReviewHistory, selectDailyReview, reviewMethodSources } from "../lib/daily-review";
import { unpackDailyReviewCatalog } from "../lib/daily-review-catalog";
import styles from "../styles/LearningExperience.module.css";

export default function DailyReview({ pool: suppliedPool, catalog }) {
  const pool = useMemo(() => Array.isArray(suppliedPool) ? suppliedPool : unpackDailyReviewCatalog(catalog), [suppliedPool, catalog]);
  const router = useRouter(), ready = router.isReady === true;
  const available = learningCategoryDetails.filter(item => pool.some(question => question.category === item.slug));
  const requestedMode = router.query.modus, requestedCategory = router.query.kategorie;
  const mode = requestedMode === undefined ? "gemischt" : typeof requestedMode === "string" && ["gemischt", "faellig", "fehler"].includes(requestedMode) ? requestedMode : null;
  const category = requestedCategory === undefined ? "" : typeof requestedCategory === "string" && available.some(item => item.slug === requestedCategory) ? requestedCategory : null;
  const valid = ready && mode !== null && category !== null;
  const selectionKey = valid ? JSON.stringify([mode, category]) : null;
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const view = useRef({ key: viewKey });
  if (view.current.key !== viewKey) view.current = { key: viewKey };
  const origin = view.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const mounted = useRef(false), navigation = useRef(0), pending = useRef(null), content = useRef(null);
  const [working, setWorking] = useState(false), [navigationError, setNavigationError] = useState("");
  const currentSelection = useRef(selectionKey); currentSelection.current = selectionKey;
  const isCurrent = () => view.current === origin && valid && pending.current === null;
  function focusContent() {
    const target = content.current?.querySelector?.("#review-question-title") || content.current;
    focusSelection(target);
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pending.current = null; };
  }, []);
  useEffect(() => {
    if (pending.current && pending.current.origin !== origin) { pending.current = null; navigation.current++; setWorking(false); }
    setNavigationError("");
    if (!ready) return;
    if (!valid) { const timer = setTimeout(() => openPageMenu("review-selection"), 0); return () => clearTimeout(timer); }
    closePageMenu(); focusContent();
  }, [viewKey]);
  async function select(nextMode, nextCategory) {
    if (!ready || !mounted.current || view.current !== origin || !["gemischt", "faellig", "fehler"].includes(nextMode) || typeof nextCategory !== "string" || nextCategory && !available.some(item => item.slug === nextCategory)) return;
    cancelSelectionFocus();
    setNavigationError("");
    const target = JSON.stringify([nextMode, nextCategory]);
    if (selectionKey === target && pending.current === null) { closePageMenu(); focusContent(); return; }
    const ticket = ++navigation.current; pending.current = { ticket, origin }; setWorking(true);
    const query = { ...router.query, modus: nextMode }; delete query.kategorie;
    if (nextCategory) query.kategorie = nextCategory;
    let waitForCommit = false;
    function failed() {
      if (!mounted.current || navigation.current !== ticket || view.current !== origin) return;
      setNavigationError("Die Runde konnte nicht geöffnet werden. Bitte wähle sie erneut."); openPageMenu("review-selection");
    }
    try {
      const accepted = await router.push({ pathname: "/lernen/fuenf-minuten", query, hash: "review-question-title" }, undefined, { shallow: true, scroll: false });
      if (accepted === false) failed();
      else if (mounted.current && navigation.current === ticket && currentSelection.current === target) { closePageMenu(); focusContent(); }
      else waitForCommit = true;
    } catch (error) { if (!error?.cancelled) failed(); }
    finally { if (!waitForCommit && pending.current?.ticket === ticket) { pending.current = null; if (mounted.current) setWorking(false); } }
  }
  return <LearningToolLayout title="Deine fünf Minuten Wissen" icon="book" category="pruefung-sprache" headingOnly>
    <PageMenu title="Kurze Runde" openInitially={ready && !valid} initialFocusId="review-selection">
      <section id="review-selection" tabIndex={-1}>
        <MenuChoice label="Runde" id="review-mode" value={mode || ""} disabled={!ready} aria-controls="review-content" onChange={event => select(event.target.value, category || "")}>
          {!mode && <option value="" disabled>Runde wählen</option>}<option value="gemischt">Gemischt</option><option value="faellig">Fällig</option><option value="fehler">Fehler</option>
        </MenuChoice>
        <MenuChoice label="Thema" id="review-category" value={category ?? "invalid"} disabled={!ready} aria-controls="review-content" onChange={event => select(mode || "gemischt", event.target.value)}>
          {category === null && <option value="invalid" disabled>Thema wählen</option>}<option value="">Alle</option>{available.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
        </MenuChoice>
        <p className={styles.muted}>Gemischt ergänzt neue Fragen. Fällig enthält nur Wiederholungen, deren Zeitpunkt erreicht ist. Fehler übt zuletzt falsche Antworten auch vor ihrer Fälligkeit.</p>
        {navigationError && <p role="alert">{navigationError}</p>}
      </section>
    </PageMenu>
    <div id="review-content" ref={content} tabIndex={-1} aria-busy={working}>
      {valid ? <DailyReviewRound key={selectionKey} pool={pool} category={category} mode={mode} isCurrent={isCurrent} disabled={working} /> : <p role={ready ? undefined : "status"}>{ready ? "Diese Auswahl ist nicht verfügbar. Wähle Runde und Thema unten im Menü." : "Deine Auswahl wird geladen …"}</p>}
    </div>
  </LearningToolLayout>;
}

function DailyReviewRound({ pool, category, mode, isCurrent, disabled }) {
  const [round, setRound] = useState(null);
  const [load, setLoad] = useState({ phase: "loading", message: "", status: 0 });
  const current = useRef(null);
  const request = useRef(0);
  const controller = useRef(null);
  const mounted = useRef(false);
  const heading = useRef(null);
  const [notice, setNotice] = useState("");
  const renderedRequest = request.current;
  const canAct = () => mounted.current && isCurrent() && request.current === renderedRequest;
  async function start(initial = false) {
    if (!mounted.current || !initial && !canAct()) return;
    const version = ++request.current;
    controller.current?.abort();
    current.current = null; setRound(null);
    setLoad({ phase: "loading", message: "", status: 0 });
    // Selection and reasons are computed locally. Only the selected IDs leave the device.
    const selectedQuestions = selectDailyReview(pool, readReviewHistory(), { category, mode, count: 8 });
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
    mounted.current = true; start(true);
    return () => { mounted.current = false; ++request.current; controller.current?.abort(); current.current = null; };
  }, []);
  useEffect(() => { if (round) { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "auto" }); } }, [round?.index, round?.finished]);
  function choose(id) {
    if (!canAct() || !round || current.current !== round || round.finished || round.selected !== null) return;
    const question = round.questions[round.index];
    if (!question.answers.some(answer => answer.id === id)) return;
    const correct = question.correct.includes(id);
    const next = { ...round, selected: id, score: round.score + (correct ? 1 : 0) };
    current.current = next; setRound(next);
    if (!recordReviewAnswer(question.id, correct)) setNotice("Du kannst weiterüben. Dieser Browser speichert die Wiederholungen gerade nicht.");
  }
  function advance() {
    if (!canAct() || !round || current.current !== round || round.finished || round.selected === null) return;
    const next = round.index + 1 === round.questions.length ? { ...round, finished: true } : { ...round, index: round.index + 1, selected: null };
    current.current = next; setRound(next);
  }
  const question = round?.questions[round.index];
  const questionCategory = learningCategoryDetails.find(item => item.slug === question?.category)?.title;
  return <>
    <section className={styles.panel}>
      <p>Eine kurze Runde mit bis zu acht Fragen aus den ausführlichen Kursen. Du bestimmst das Tempo; fünf Minuten sind eine Orientierung.</p>
      <p className={styles.muted}>Auf diesem Gerät: fällige Fehler und Wiederholungen kommen zuerst. „Gemischt“ ergänzt neue Fragen aus wechselnden Bereichen. Antworten aus ausführlichen Kursen und deren Quizfragen fließen ab jetzt ein. Frühere Antworten werden nicht nachträglich übernommen.</p>
    </section>
    {load.phase === "error" ? <section className={styles.panel} role="alert"><p>{load.message}</p>{load.status === 401 ? <Link href="/login?next=%2Flernen%2Ffuenf-minuten">Zum Jagdlatein-Konto</Link> : load.status === 403 ? <Link href="/preise?next=%2Flernen%2Ffuenf-minuten">Zugang ansehen</Link> : <button type="button" className={styles.primary} disabled={disabled} onClick={() => start()}>Erneut versuchen</button>}</section> : !round ? <p role="status">Deine Fragen werden geladen …</p> : round.finished ? <section className={styles.panel}>
      <h2 id="review-question-title" tabIndex={-1} ref={heading}>Deine Runde ist abgeschlossen</h2><p>{round.score} von {round.questions.length} richtig. Lies die Erklärungen und wiederhole zu einem späteren Zeitpunkt.</p>
      <button type="button" className={styles.primary} disabled={disabled} onClick={() => start()}>Neue kurze Runde</button>
    </section> : question ? <section className={styles.panel}>
      <p className={`${styles.eyebrow} ${styles.reviewContext}`}>{question.reason}{!category && questionCategory ? ` · ${questionCategory}` : ""} · Frage {round.index + 1} von {round.questions.length}</p>
      <h2 id="review-question-title" ref={heading} tabIndex={-1}>{question.q}</h2>
      <div className={styles.choices}>{question.answers.map(answer => <button type="button" key={answer.id} className={`${styles.choice} ${round.selected !== null && question.correct.includes(answer.id) ? styles.correct : round.selected === answer.id ? styles.wrong : ""}`} disabled={disabled || round.selected !== null} aria-pressed={round.selected === answer.id} onClick={() => choose(answer.id)}>{answer.text}</button>)}</div>
      {round.selected !== null && <div className={styles.feedback}><div role="status"><h3>{question.correct.includes(round.selected) ? "Richtig" : "Noch einmal nachlesen"}</h3><p>{question.explain}</p></div>
        {question.reading && <section className={styles.reviewReading} aria-labelledby={`reading-${question.id}`}><h3 id={`reading-${question.id}`}>Wissen dazu</h3><p><strong>{question.reading.title}</strong></p><p>{question.reading.paragraph}</p></section>}
        <Link href={question.href}>In „{question.courseTitle}“ weiterlesen</Link><details><summary>{question.sourceScope === "lesson" ? "Quellen zur passenden Lektion" : "Quellen der Lerneinheit"}</summary><ul>{question.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label || source.title}</a></li>)}</ul></details></div>}
      {round.selected !== null && <button type="button" className={styles.primary} disabled={disabled} onClick={advance}>{round.index + 1 === round.questions.length ? "Runde abschließen" : "Nächste Frage"}</button>}
    </section> : <p>{mode === "faellig" ? "Auf diesem Gerät sind für dieses Thema gerade keine Fragen fällig." : mode === "fehler" ? "Auf diesem Gerät gibt es für dieses Thema gerade keine offenen Fehler." : "Für dieses Thema sind noch keine Fragen in der kurzen Runde verfügbar."}</p>}
    {notice && <p role="status">{notice}</p>}
    <details className={styles.panel}><summary>Wie die Wiederholung funktioniert</summary>
      <p>Eine falsche Antwort wird nach zehn Minuten fällig. Nach richtigen Antworten folgen Abstände von einem, drei, sieben, vierzehn und dreißig Tagen. „Gemischt“ ergänzt bei Bedarf neue oder noch nicht fällige Fragen; „Fällig“ füllt nicht auf. „Fehler“ enthält nur zuletzt falsch beantwortete Fragen und erlaubt bewusst früheres Üben. Das ist eine einfache Lernhilfe, kein wissenschaftlich optimaler Zeitplan.</p>
      <p>Gespeichert werden nur Fragenkennungen, Antwortzählungen, Fehlerzahl, Zeitpunkt und nächste Wiederholung auf diesem Gerät. Kein gewählter Antworttext und keine E-Mail-Adresse. Der Verlauf wird nicht ins Konto übertragen und beim Logout oder der Kontolöschung auf diesem Gerät entfernt.</p>
      <p>Zum Laden der Runde werden nur die Kennungen der bis zu acht ausgewählten Fragen übermittelt. Dein Verlauf und deine gewählten Antworten bleiben auf dem Gerät.</p>
      <ul>{reviewMethodSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a><p>{source.supports}</p></li>)}</ul>
      <button type="button" className={styles.secondary} disabled={disabled} onClick={() => { if (!canAct()) return; if (clearReviewHistory()) { setNotice("Lokalen Wiederholungsverlauf entfernt."); start(); } else setNotice("Der lokale Verlauf konnte nicht entfernt werden. Bitte die Browserdaten dieser App löschen."); }}>Wiederholungsverlauf entfernen</button>
    </details>
  </>;
}
