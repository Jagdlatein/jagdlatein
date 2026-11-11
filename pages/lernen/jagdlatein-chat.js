import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import { getPaidPageProps } from "../../lib/account-access";
import { getExamProfileDetails } from "../../lib/exam-profile";
import { MAX_JAGDLATEIN_QUESTION_LENGTH } from "../../lib/jagdlatein-chat-limits";
import { useExamProfile } from "../../lib/use-exam-profile";
import { siteBranding } from "../../lib/brand-config";
import layout from "../../styles/LearningExperience.module.css";
import styles from "../../styles/JagdlateinChat.module.css";

const MAX_TURNS = 8;
const QUESTION_ID = "jagdlatein-chat-question";
const EXAMPLES = [
  { label: "Schnüffeln beim Hund", question: "Wie funktioniert das Schnüffeln beim Hund?" },
  { label: "Lernkarten Wildkunde", question: "Lernkarten Wildkunde" },
  { label: "Video vom Biber", question: "Zeige mir einen Film über einen Biber" },
];

function disposeRequest(pending) {
  if (!pending) return;
  clearTimeout(pending.timer);
  pending.controller.abort();
}

export async function getServerSideProps(context) {
  return getPaidPageProps(context);
}

function isLearningLink(link) {
  return typeof link?.href === "string" && /^\/(?![\/\\])/.test(link.href) && !/[\\\u0000-\u001f]/.test(link.href);
}

function AnswerLinks({ links, official }) {
  const entries = Array.isArray(links) ? links.filter(link => typeof link?.label === "string" && link.label.trim()) : [];
  const learning = entries.filter(isLearningLink);
  const sources = entries.filter(link => typeof link.href === "string" && link.href.startsWith("https://"));
  return <>
    {learning.length > 0 && <><p className={styles.linkLabel}>Weiterlernen</p><ul className={styles.learningLinks}>{learning.map((link, index) => (
      <li key={`${link.href}:${index}`}><Link href={link.href}>{link.label}</Link></li>
    ))}</ul></>}
    {sources.length > 0 && <details className={styles.sources}>
      <summary>{official ? "Amtliche Originalquellen" : "Quellen"}</summary>
      <ul>{sources.map(link => <li key={link.href}><a href={link.href} rel="noreferrer">{link.label}</a></li>)}</ul>
    </details>}
  </>;
}

function ChatAnswer({ turn, headingRef }) {
  const { id, question, reply } = turn;
  return <article className={styles.reply} aria-labelledby={`chat-answer-${id}`}>
    <p className={styles.asked}><strong>Deine Frage</strong>{question}</p>
    <div className={styles.answerIdentity}>
      <img src={siteBranding.icon192} width={36} height={36} alt="" />
      <h2 id={`chat-answer-${id}`} ref={headingRef} tabIndex={-1}>Jagdlatein</h2>
    </div>
    {reply.law && <p className={styles.lawContext}>
      <strong>{reply.law.jurisdiction}</strong>
      {" · "}{reply.law.lawTitle && `${reply.law.lawTitle}, `}{reply.law.citation}
      {typeof reply.law.reviewedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(reply.law.reviewedOn) && <>{" · Geprüft am "}<time dateTime={reply.law.reviewedOn}>{reply.law.reviewedOn.split("-").reverse().join(".")}</time></>}
    </p>}
    <p className={styles.answer}>{reply.text}</p>
    <AnswerLinks links={reply.links} official={Boolean(reply.law)} />
  </article>;
}

export default function JagdlateinChatPage() {
  const { profile, ready, phase, accountKey } = useExamProfile();
  const loadingExam = phase === "loading";
  const exam = ready ? getExamProfileDetails(profile) : null;
  const scope = JSON.stringify([accountKey, loadingExam, exam?.country.code, exam?.region.code]);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef(null);
  const mounted = useRef(false);
  const draft = useRef("");
  const currentScope = useRef(scope);
  const previousAccount = useRef(accountKey);
  const turnNumber = useRef(0);
  const transcriptRevision = useRef(0);
  const latestHeading = useRef(null);
  const revision = transcriptRevision.current;
  const pendingAtRender = request.current;
  currentScope.current = scope;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      disposeRequest(request.current);
      request.current = null;
    };
  }, []);

  useEffect(() => {
    const pending = request.current;
    if (!pending || pending.scope === scope) return;
    request.current = null;
    disposeRequest(pending);
    setBusy(false);
  }, [scope]);

  useEffect(() => {
    if (loadingExam) return;
    if (previousAccount.current && previousAccount.current !== accountKey) {
      draft.current = "";
      setQuestion("");
      setTurns([]);
      setError("");
      setNotice("");
      transcriptRevision.current++;
    }
    previousAccount.current = accountKey;
  }, [accountKey, loadingExam]);

  const latestId = turns[0]?.id;
  useEffect(() => {
    if (!latestId || document.querySelector("[data-single-menu-view]")) return;
    latestHeading.current?.focus({ preventScroll: true });
    latestHeading.current?.closest("article")?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }, [latestId]);

  function changeQuestion(text) {
    draft.current = text;
    setQuestion(text);
  }

  function stopRequest(pending, timedOut = false) {
    if (!mounted.current || !pending || request.current !== pending || currentScope.current !== pending.scope) return;
    request.current = null;
    disposeRequest(pending);
    transcriptRevision.current++;
    setBusy(false);
    setError(timedOut ? "Die Antwort dauert zu lange. Deine Frage ist noch da. Versuche es erneut." : "");
    setNotice(timedOut ? "" : "Anfrage beendet. Du kannst deine Frage bearbeiten.");
    if (!timedOut) document.getElementById(QUESTION_ID)?.focus();
  }

  function startAgain() {
    if (!mounted.current || revision !== transcriptRevision.current || scope !== currentScope.current || question !== draft.current) return;
    const pending = request.current;
    request.current = null;
    disposeRequest(pending);
    transcriptRevision.current++;
    setTurns([]);
    changeQuestion("");
    setError("");
    setNotice("");
    setBusy(false);
    document.getElementById(QUESTION_ID)?.focus();
  }

  async function ask(event) {
    event.preventDefault();
    const text = question.trim();
    if (!mounted.current || scope !== currentScope.current || question !== draft.current || !text || text.length > MAX_JAGDLATEIN_QUESTION_LENGTH || loadingExam || request.current) return;
    const controller = new AbortController();
    const pending = { controller, scope, timer: null };
    request.current = pending;
    transcriptRevision.current++;
    const isCurrent = () => request.current === pending && currentScope.current === scope;
    setBusy(true);
    setError("");
    setNotice("");
    pending.timer = setTimeout(() => stopRequest(pending, true), 20000);
    try {
      const response = await fetch("/api/lernen/jagdlatein-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ question: text, examProfile: exam ? profile : null }),
      });
      if (!isCurrent()) return;
      if (response.status === 401 || response.status === 403) {
        setError(response.status === 401 ? "Bitte melde dich erneut an." : "Für den Lernchat brauchst du einen aktiven Lernzugang.");
        return;
      }
      if (!response.ok) throw new Error("Chat unavailable");
      const reply = await response.json();
      if (!isCurrent()) return;
      if (typeof reply?.text !== "string" || !reply.text.trim()) throw new Error("Missing answer");
      const turn = { id: ++turnNumber.current, question: text, reply };
      transcriptRevision.current++;
      setTurns(previous => [turn, ...previous].slice(0, MAX_TURNS));
      changeQuestion("");
    } catch {
      if (isCurrent()) setError("Die Frage konnte gerade nicht beantwortet werden. Versuche es erneut.");
    } finally {
      clearTimeout(pending.timer);
      if (request.current === pending) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return <LearningToolLayout title="Jagdlatein" description="Stell eine Frage zur Jagdprüfung und finde den passenden Lerninhalt." headingOnly className={styles.page} robots="noindex">
    <form onSubmit={ask} className={`${layout.panel} ${styles.form}`} aria-busy={busy}>
      <div className={styles.formTop}>
        <span className={styles.eyebrow}>Dein Lernchat</span>
        <Link className={styles.region} href="/lernen/pruefungsplan">{exam ? `Prüfungsregion: ${exam.region.name}` : "Prüfungsregion wählen"}</Link>
      </div>
      <label htmlFor={QUESTION_ID}>Deine Frage an Jagdlatein</label>
      <p id="jagdlatein-chat-hint">Frag nach einem Begriff, einer Erklärung oder einer passenden Übung. Rechtsantworten beziehen sich auf deine Prüfungsregion.</p>
      <textarea id={QUESTION_ID} aria-describedby="jagdlatein-chat-hint" value={question} onChange={event => changeQuestion(event.target.value)} readOnly={busy} rows={3} maxLength={MAX_JAGDLATEIN_QUESTION_LENGTH} placeholder="Was möchtest du verstehen?" required />
      {!turns.length && !question && <div className={styles.examples} aria-label="Frageideen">{EXAMPLES.map(example => <button key={example.label} type="button" onClick={() => {
        if (!mounted.current || request.current || revision !== transcriptRevision.current || scope !== currentScope.current || question !== draft.current) return;
        changeQuestion(example.question);
        document.getElementById(QUESTION_ID)?.focus();
      }}>{example.label}</button>)}</div>}
      <div className={styles.actions}>
        <button type="submit" className={layout.primary} disabled={busy || loadingExam || !question.trim()}>Frage stellen</button>
        {busy && <button type="button" className={styles.textButton} onClick={() => stopRequest(pendingAtRender)}>Abbrechen</button>}
        {turns.length > 0 && <button type="button" className={styles.textButton} onClick={startAgain}>Neu beginnen</button>}
      </div>
      {busy && <p role="status">Passender Lerninhalt wird gesucht …</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </form>
    <div className={styles.turns} aria-live="polite" aria-relevant="additions">
      {turns[0] && <ChatAnswer key={turns[0].id} turn={turns[0]} headingRef={latestHeading} />}
      {turns.length > 1 && <details className={styles.history}>
        <summary>Bisherige Fragen ({turns.length - 1})</summary>
        {turns.slice(1).map(turn => <ChatAnswer key={turn.id} turn={turn} />)}
      </details>}
    </div>
  </LearningToolLayout>;
}
