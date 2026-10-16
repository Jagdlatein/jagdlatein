"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppIcon from "../../../components/AppIcon";
import styles from "../../../styles/RankedQuiz.module.css";
import { isCountryQuizTopic, quizLearningUrl } from "../../../lib/quiz-learning-scope";
import { recordReviewAnswer } from "../../../lib/daily-review";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));

function validRound(round) {
  if (!round || !UUID.test(round.roundId) || !["asking", "feedback", "complete"].includes(round.phase)
    || !Number.isInteger(round.total) || round.total < 1 || round.total > 10
    || !Number.isInteger(round.index) || round.index < 0 || round.index >= round.total
    || !["DE", "AT", "CH"].includes(round.country) || typeof round.topic !== "string"
    || !timestamp(round.serverNow) || !Number.isInteger(round.points) || round.points < 0 || round.points > round.total * 400
    || !Number.isInteger(round.correctAnswers) || round.correctAnswers < 0 || round.correctAnswers > round.total
    || !Number.isInteger(round.timedOutAnswers) || round.timedOutAnswers < 0 || round.timedOutAnswers > round.total - round.correctAnswers
    || (round.finishedAt !== null && !timestamp(round.finishedAt))) return false;
  if (round.phase === "complete") return timestamp(round.finishedAt);
  const question = round.question;
  if (!question || typeof question.id !== "string" || typeof question.q !== "string"
    || !Array.isArray(question.answers) || question.answers.length < 2
    || !question.answers.every(answer => typeof answer.id === "string" && typeof answer.text === "string")
    || new Set(question.answers.map(answer => answer.id)).size !== question.answers.length) return false;
  if (round.phase === "asking") return timestamp(round.deadlineAt) && !round.feedback;
  const feedback = round.feedback;
  return feedback && feedback.questionId === question.id && typeof feedback.correct === "boolean"
    && typeof feedback.timedOut === "boolean" && timestamp(feedback.answeredAt)
    && (feedback.selectedAnswerId === null || question.answers.some(answer => answer.id === feedback.selectedAnswerId))
    && Array.isArray(feedback.correctAnswerIds) && feedback.correctAnswerIds.length > 0
    && feedback.correctAnswerIds.every(id => question.answers.some(answer => answer.id === id))
    && typeof feedback.explain === "string" && (feedback.source === null || typeof feedback.source === "string")
    && Number.isInteger(feedback.earnedPoints) && feedback.earnedPoints >= 0 && feedback.earnedPoints <= 400;
}

export default function QuizClient() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedCountry = (params.get("country") || "DE").toUpperCase();
  const requestedTopic = (params.get("topic") || "Alle").trim();
  const topic = requestedTopic && requestedTopic.length <= 120 && !/[\u0000-\u001f\u007f]/.test(requestedTopic) ? requestedTopic : "Alle";
  const country = isCountryQuizTopic(topic) && ["DE", "AT", "CH"].includes(requestedCountry) ? requestedCountry : "DE";
  const [round, setRound] = useState(null);
  const [busy, setBusy] = useState("profile");
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [seconds, setSeconds] = useState(30);
  const [reloadKey, setReloadKey] = useState(0);
  const [username, setUsername] = useState("");
  const mounted = useRef(false);
  const context = useRef(null);
  const startRequest = useRef(null);
  const pending = useRef(null);
  const currentRound = useRef(round);
  const serverClock = useRef(null);
  const questionHeading = useRef(null);
  const focusedQuestion = useRef(null);
  currentRound.current = round;
  const storageKey = `jagd_quiz_round:${isCountryQuizTopic(topic) ? country : "COMMON"}:${topic}`;
  const returnUrl = quizLearningUrl("/quiz-app/run", country, topic);
  const setupUrl = quizLearningUrl("/quiz-app", country, topic);
  const nameUrl = quizLearningUrl("/quiz-app/username", country, topic);

  function rememberRound(id) {
    try { window.sessionStorage.setItem(storageKey, id); } catch { /* The server remains authoritative without browser storage. */ }
  }
  function forgetRound() {
    try { window.sessionStorage.removeItem(storageKey); } catch {}
  }
  function remainingSeconds() {
    const clock = serverClock.current;
    if (!clock) return 0;
    const elapsed = Math.max(0, globalThis.performance.now() - clock.receivedAt);
    return Math.max(0, Math.min(30, Math.ceil((clock.deadline - clock.serverNow - elapsed) / 1000)));
  }
  function applyRound(value) {
    if (!validRound(value)) throw new Error("Die Quizrunde enthält keine gültige Antwort.");
    serverClock.current = value.phase === "asking" ? {
      deadline: Date.parse(value.deadlineAt), serverNow: Date.parse(value.serverNow), receivedAt: globalThis.performance.now(),
    } : null;
    currentRound.current = value;
    setRound(value);
    setSelected(value.feedback?.selectedAnswerId ?? null);
    setSeconds(value.phase === "asking" ? remainingSeconds() : 0);
    setError(null);
    setBusy(null);
    if (value.phase === "feedback" && value.feedback.learningHref?.startsWith("/kurse/wissen-")) {
      recordReviewAnswer(value.feedback.questionId, value.feedback.correct, `${value.roundId}:${value.feedback.questionId}:${value.feedback.answeredAt}`, Date.parse(value.feedback.answeredAt));
    }
    if (value.phase === "complete") forgetRound();
  }
  async function readResponse(response) {
    let data;
    try { data = await response.json(); } catch { throw new Error("Die Quizrunde ist gerade nicht erreichbar."); }
    if (!response.ok || data?.success !== true) {
      const failure = new Error(typeof data?.error === "string" && data.error.length <= 300 ? data.error : "Die Quizrunde ist gerade nicht erreichbar.");
      failure.status = response.status;
      throw failure;
    }
    return data;
  }
  function failureState(stage, failure) {
    return { stage, status: failure?.status || 0 };
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      context.current?.controller.abort();
      pending.current?.controller?.abort();
    };
  }, []);

  useEffect(() => {
    const record = { controller: new AbortController() };
    context.current = record;
    pending.current?.controller?.abort();
    pending.current = null;
    currentRound.current = null;
    setRound(null);
    setSelected(null);
    setError(null);
    setBusy("profile");
    if (startRequest.current?.key !== storageKey) {
      let savedId;
      try { savedId = window.sessionStorage.getItem(storageKey); } catch {}
      startRequest.current = { key: storageKey, id: UUID.test(savedId || "") ? savedId : null };
    }
    async function start() {
      let stage = "profile";
      try {
        const profile = await readResponse(await fetch("/api/quiz/register", {
          method: "GET", credentials: "same-origin", cache: "no-store", signal: record.controller.signal,
        }));
        if (!mounted.current || context.current !== record) return;
        if (profile.identity === null) {
          setBusy("redirect");
          router.push(nameUrl);
          return;
        }
        if (typeof profile.identity?.username !== "string" || typeof profile.identity?.country !== "string") throw new Error("Quizname fehlt.");
        setUsername(profile.identity.username);
        stage = "start";
        setBusy("start");
        if (!startRequest.current.id) startRequest.current.id = globalThis.crypto.randomUUID();
        rememberRound(startRequest.current.id);
        const result = await readResponse(await fetch("/api/quiz/round", {
          method: "POST", credentials: "same-origin", cache: "no-store", signal: record.controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, topic, requestId: startRequest.current.id }),
        }));
        if (!mounted.current || context.current !== record) return;
        if (result.round?.roundId !== startRequest.current.id) throw new Error("Die Antwort gehört nicht zu dieser Runde.");
        applyRound(result.round);
      } catch (failure) {
        if (mounted.current && context.current === record) {
          setBusy(null);
          setError(failureState(stage, failure));
        }
      }
    }
    void start();
    return () => {
      record.controller.abort();
    };
  }, [country, topic, reloadKey, router]);

  async function execute(operation) {
    if (!operation || operation.running || !mounted.current || operation.context !== context.current) return;
    operation.running = true;
    operation.controller = new AbortController();
    setBusy(operation.kind);
    setError(null);
    try {
      const url = operation.kind === "sync" ? `/api/quiz/round?roundId=${encodeURIComponent(operation.payload.roundId)}` : `/api/quiz/round/${operation.kind}`;
      const options = {
        method: operation.kind === "sync" ? "GET" : "POST", credentials: "same-origin", cache: "no-store", signal: operation.controller.signal,
      };
      if (options.method === "POST") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(operation.payload);
      }
      const result = await readResponse(await fetch(url, options));
      if (!mounted.current || operation.context !== context.current || pending.current !== operation) return;
      if (result.round?.roundId !== operation.payload.roundId) throw new Error("Die Antwort gehört nicht zu dieser Runde.");
      applyRound(result.round);
      pending.current = null;
    } catch (failure) {
      if (mounted.current && operation.context === context.current && pending.current === operation) {
        setBusy(null);
        setError(failureState(operation.kind, failure));
      }
    } finally {
      operation.running = false;
    }
  }

  function answer(answerId, rendered = round) {
    if (!mounted.current || pending.current || rendered !== currentRound.current || rendered?.phase !== "asking") return;
    if (answerId !== null && !rendered.question.answers.some(item => item.id === answerId)) return;
    const operation = { kind: "answer", context: context.current, payload: {
      roundId: rendered.roundId, questionId: rendered.question.id, answerId, requestId: globalThis.crypto.randomUUID(),
    } };
    pending.current = operation;
    setSelected(answerId);
    void execute(operation);
  }
  function next(rendered = round) {
    if (!mounted.current || pending.current || rendered !== currentRound.current || rendered?.phase !== "feedback") return;
    const operation = { kind: "next", context: context.current, payload: { roundId: rendered.roundId, requestId: globalThis.crypto.randomUUID() } };
    pending.current = operation;
    void execute(operation);
  }
  function synchronize() {
    if (!round || pending.current?.running) return;
    const operation = { kind: "sync", context: context.current, payload: { roundId: round.roundId } };
    pending.current = operation;
    void execute(operation);
  }
  function restart() {
    if (pending.current?.running) return;
    forgetRound();
    startRequest.current = { key: storageKey, id: null };
    setReloadKey(value => value + 1);
  }

  useEffect(() => {
    if (!round || round.phase !== "asking" || busy || error) return;
    let timer;
    function tick() {
      if (!mounted.current || currentRound.current !== round || pending.current) return;
      const remaining = remainingSeconds();
      setSeconds(remaining);
      if (remaining <= 0) answer(null, round);
      else timer = setTimeout(tick, 250);
    }
    tick();
    return () => clearTimeout(timer);
  }, [round, busy, error]);

  useEffect(() => {
    if (!round) return;
    const key = `${round.roundId}:${round.phase === "complete" ? "complete" : round.question?.id}`;
    if (focusedQuestion.current && focusedQuestion.current !== key) questionHeading.current?.focus();
    focusedQuestion.current = key;
  }, [round?.roundId, round?.question?.id, round?.phase]);

  function errorNotice() {
    if (!error) return null;
    const messages = {
      profile: "Dein Quizname konnte gerade nicht bestätigt werden.",
      start: "Die Quizrunde konnte gerade nicht geladen werden.",
      answer: "Deine Antwort konnte gerade nicht bestätigt werden. Bitte sende sie erneut.",
      next: "Die nächste Frage konnte gerade nicht geladen werden.",
      sync: "Die Quizrunde konnte gerade nicht erneut geladen werden.",
    };
    return <aside role="alert" style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "#fff4dc", lineHeight: 1.5 }}>
      <p style={{ marginTop: 0 }}>{messages[error.stage]}</p>
      {[401, 403].includes(error.status) ? <Link href={`/login?reauth=1&next=${encodeURIComponent(returnUrl)}`}>Anmeldung erneuern</Link>
        : error.status === 409 && round ? <button type="button" onClick={synchronize}>Runde erneut laden</button>
        : <button type="button" onClick={() => {
          if (pending.current) void execute(pending.current);
          else setReloadKey(value => value + 1);
        }}>Erneut versuchen</button>}
      {[400, 404, 409].includes(error.status) && <p><button type="button" onClick={restart}>Neue Runde starten</button></p>}
      <p><Link href={setupUrl}>Thema wählen</Link></p>
    </aside>;
  }
  function savedNotice() {
    return timestamp(round?.finishedAt) ? <aside role="status" style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "#eaf4e9", lineHeight: 1.5 }}>
      Dein Ranglistenergebnis und deine Auswertung wurden gespeichert. Die Rangliste zeigt deinen besten Durchlauf.
    </aside> : null;
  }

  if (!round) return <main className={styles.main}><div className={styles.wrap}>
    <header className={styles.header}><h1><AppIcon name="quiz" size={32} />Jagdquiz mit Rangliste</h1></header>
    {error ? errorNotice() : <p role="status">{busy === "profile" ? "Dein Quizname wird bestätigt …" : busy === "redirect" ? "Bitte wähle deinen Quiznamen …" : "Lade Quizrunde …"}</p>}
    {!error && <p><Link href={setupUrl}>Thema wählen</Link></p>}
  </div></main>;

  if (round.phase === "complete") return <main className={styles.main}><div className={styles.wrap}>
    <section className={styles.card} aria-labelledby="ranked-result-title">
      <h1 id="ranked-result-title" tabIndex={-1} ref={questionHeading}><AppIcon name="trophy" size={36} />Quiz abgeschlossen</h1>
      <p className={styles.resultPoints}>{round.points} <span>Punkte</span></p>
      <p>{round.correctAnswers} von {round.total} Fragen richtig</p>
      <p><Link href={setupUrl}>Thema wählen</Link></p>
      {savedNotice()}
      <div className={styles.actions}><Link href="/quiz-app/leaderboard" className={styles.primary}>Rangliste ansehen<AppIcon name="trophy" size={20} /></Link><button type="button" onClick={restart} className={styles.secondary}>Neue Runde starten</button></div>
    </section>
  </div></main>;

  const question = round.question;
  const feedback = round.phase === "feedback" ? round.feedback : null;
  const locked = round.phase !== "asking" || !!busy || !!error || !!pending.current;
  return <main className={styles.main}><div className={styles.wrap}>
    <nav className={styles.nav} aria-label="Quizmenü"><Link href={setupUrl}>Thema wählen</Link><Link href="/quiz-app/leaderboard">Rangliste</Link></nav>
    <header className={styles.header}><p className={styles.eyebrow}>{isCountryQuizTopic(topic) ? `${{ DE: "Deutschland", AT: "Österreich", CH: "Schweiz" }[country]} · Recht` : topic === "Alle" ? "Alle Lernbereiche" : topic}</p><h1><AppIcon name="quiz" size={34} />Jagdquiz mit Rangliste</h1></header>
    <progress className={styles.timebar} max={30} value={round.phase === "asking" ? seconds : 0} aria-label="Verbleibende Antwortzeit in Sekunden" />
    <div className={styles.roundMeta}>
      <span>Frage {round.index + 1} von {round.total}</span>
      <span className={seconds <= 5 && round.phase === "asking" ? styles.timeLow : styles.time} role="timer" aria-live="off">{round.phase === "feedback" ? "Antwort ausgewertet" : `${seconds} Sekunden`}</span>
    </div>
    <p className={styles.score}>{round.points} Punkte · {username}</p>
    <section className={styles.card} aria-labelledby="ranked-question-title">
      <h2 id="ranked-question-title" tabIndex={-1} ref={questionHeading}>{question.q}</h2>
      <div className={styles.answers} role="group" aria-label="Eine Antwort wählen">{question.answers.map(option => <button type="button" disabled={locked} key={option.id} onClick={() => answer(option.id, round)} className={`${styles.answer}${feedback?.correctAnswerIds.includes(option.id) ? ` ${styles.correct}` : feedback && selected === option.id ? ` ${styles.wrong}` : selected === option.id ? ` ${styles.selected}` : ""}`}>{option.text}{feedback?.correctAnswerIds.includes(option.id) && <span>Richtige Antwort</span>}{feedback && selected === option.id && !feedback.correctAnswerIds.includes(option.id) && <span>Deine Antwort</span>}</button>)}</div>
    </section>
    {busy === "answer" && <p role="status">Deine Antwort wird geprüft …</p>}
    {feedback && <section role="status" aria-live="polite" className={styles.feedback}>
      <strong>{feedback.timedOut ? "Zeit abgelaufen." : feedback.correct ? "Richtig!" : "Leider falsch."}</strong>
      <p style={{ margin: "8px 0" }}><b>Richtige Antwort:</b>{" "}{question.answers.filter(option => feedback.correctAnswerIds.includes(option.id)).map(option => option.text).join("; ")}</p>
      {feedback.explain && <p style={{ margin: "8px 0" }}>{feedback.explain}</p>}
      {feedback.source?.startsWith("https://") && <div style={{ marginTop: 12 }}>
        <a href={feedback.source} target="_blank" rel="noopener noreferrer">{feedback.sourceTitle || "Quelle nachlesen"} (neuer Tab)</a>
        {/^\d{4}-\d{2}-\d{2}$/.test(feedback.sourceCheckedAt || "") && <p style={{ margin: "8px 0", fontSize: 14 }}>Quellenabgleich: {feedback.sourceCheckedAt.split("-").reverse().join(".")}</p>}
        {feedback.sourceScope && <p style={{ margin: "8px 0", fontSize: 14 }}>{feedback.sourceScope}</p>}
      </div>}
      {!feedback.source && /^\/kurse\/[a-z0-9-]+$/.test(feedback.learningHref || "") && <p style={{ margin: "8px 0" }}><Link href={feedback.learningHref}>Lerneinheit und zugehörige Quellen öffnen</Link></p>}
      <p style={{ margin: "8px 0" }}><Link href="/lernen">Im Lernwissen nachlesen</Link></p>
      <button type="button" disabled={!!busy || !!error} onClick={() => next(round)} className={styles.primary}>{round.index === round.total - 1 ? "Ergebnis anzeigen" : "Weiter"}</button>
      <p className={styles.note}>{busy === "next" || busy === "sync" ? "Quizrunde wird geladen …" : "Lies in Ruhe nach. Die nächste Antwortzeit beginnt erst mit Weiter."}</p>
    </section>}
    {errorNotice()}
    {savedNotice()}
  </div></main>;
}
