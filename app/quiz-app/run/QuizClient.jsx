"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isCountryQuizTopic, quizLearningUrl } from "../../../lib/quiz-learning-scope";

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
  const feedbackTimer = useRef(null);
  const timerGeneration = useRef(0);
  const serverClock = useRef(null);
  currentRound.current = round;
  const storageKey = `jagd_quiz_round:${isCountryQuizTopic(topic) ? country : "COMMON"}:${topic}`;
  const returnUrl = quizLearningUrl("/quiz-app/run", country, topic);
  const setupUrl = quizLearningUrl("/quiz-app", country, topic);
  const nameUrl = quizLearningUrl("/quiz-app/username", country, topic);

  function clearFeedbackTimer() {
    timerGeneration.current += 1;
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
  }
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
      clearFeedbackTimer();
    };
  }, []);

  useEffect(() => {
    const record = { controller: new AbortController() };
    context.current = record;
    pending.current?.controller?.abort();
    pending.current = null;
    clearFeedbackTimer();
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
      clearFeedbackTimer();
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
    clearFeedbackTimer();
    const operation = { kind: "next", context: context.current, payload: { roundId: rendered.roundId, requestId: globalThis.crypto.randomUUID() } };
    pending.current = operation;
    void execute(operation);
  }
  function synchronize() {
    if (!round || pending.current?.running) return;
    clearFeedbackTimer();
    const operation = { kind: "sync", context: context.current, payload: { roundId: round.roundId } };
    pending.current = operation;
    void execute(operation);
  }
  function restart() {
    if (pending.current?.running) return;
    clearFeedbackTimer();
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
    clearFeedbackTimer();
    if (round?.phase !== "feedback" || busy || error) return;
    const generation = timerGeneration.current;
    const elapsed = Math.max(0, Date.parse(round.serverNow) - Date.parse(round.feedback.answeredAt));
    feedbackTimer.current = setTimeout(() => {
      if (!mounted.current || generation !== timerGeneration.current) return;
      feedbackTimer.current = null;
      next(round);
    }, Math.max(0, 10000 - elapsed));
    return clearFeedbackTimer;
  }, [round, busy, error]);

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

  if (!round) return <div style={{ padding: 30, textAlign: "center" }}>
    {error ? errorNotice() : <p role="status">{busy === "profile" ? "Dein Quizname wird bestätigt …" : busy === "redirect" ? "Bitte wähle deinen Quiznamen …" : "Lade Quizrunde …"}</p>}
    {!error && <p><Link href={setupUrl}>Thema wählen</Link></p>}
  </div>;

  if (round.phase === "complete") return <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
    <div className="quiz-finish-box fade-in">
      <h1 className="quiz-finish-title">🎉 Quiz abgeschlossen!</h1>
      <div className="quiz-score-badge">{round.points}</div>
      <p>{round.correctAnswers} von {round.total} Fragen richtig</p>
      <p><Link href={setupUrl}>Thema wählen</Link></p>
      {savedNotice()}
      <button type="button" onClick={() => router.push("/quiz-app/leaderboard")} className="quiz-end-btn">🏆 Rangliste ansehen</button>
      <button type="button" onClick={restart} className="quiz-end-btn">🔄 Neues Quiz starten</button>
    </div>
  </div>;

  const question = round.question;
  const feedback = round.phase === "feedback" ? round.feedback : null;
  const locked = round.phase !== "asking" || !!busy || !!error || !!pending.current;
  return <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
    <p style={{ margin: "0 0 18px" }}><Link href={setupUrl}>Thema wählen</Link></p>
    <div className="progressbar"><div className="progressbar-fill" style={{ width: `${seconds / 30 * 100}%` }} /></div>
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Frage {round.index + 1}/{round.total}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: seconds <= 5 ? "red" : "#136f39" }}>⏱ {seconds}s</div>
    </div>
    <div style={{ fontSize: 18, marginTop: 12, opacity: 0.7 }}>Score: {round.points} · {username}</div>
    <div className={`fade-in ${feedback ? feedback.correct ? "flash-correct" : "flash-wrong" : ""}`} style={{ padding: 18, background: "rgba(255,255,255,0.75)", borderRadius: 16, border: "1px solid rgba(0,0,0,0.1)", marginTop: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{question.q}</div>
      {question.answers.map(option => <button type="button" disabled={locked} key={option.id} onClick={() => answer(option.id, round)} style={{
        padding: "14px 16px", display: "block", width: "100%", font: "inherit", textAlign: "left", color: "inherit", borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.15)", background: selected === option.id ? feedback ? feedback.correct ? "#c6f6d5" : "#fed7d7" : "#e8edf2" : "#fff",
        marginBottom: 12, fontSize: 18, cursor: locked ? "default" : "pointer",
      }}>{option.text}</button>)}
    </div>
    {busy === "answer" && <p role="status">Deine Antwort wird geprüft …</p>}
    {feedback && <section role="status" aria-live="polite" style={{ marginTop: 18, padding: 18, borderRadius: 14, background: feedback.correct ? "#e5f6e9" : "#fff2f2", color: "#1f2937", lineHeight: 1.5 }}>
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
      <button type="button" disabled={!!busy || !!error} onClick={() => next(round)} className="quiz-end-btn" style={{ marginTop: 8 }}>{round.index === round.total - 1 ? "Ergebnis anzeigen" : "Weiter"}</button>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563" }}>{busy === "next" || busy === "sync" ? "Quizrunde wird geladen …" : "Automatisch weiter nach 10 Sekunden."}</p>
    </section>}
    {errorNotice()}
    {savedNotice()}
  </div>;
}
