import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import { getPaidPageProps } from "../../lib/account-access";
import { getExamProfileDetails } from "../../lib/exam-profile";
import { MAX_JAGDLATEIN_QUESTION_LENGTH } from "../../lib/jagdlatein-chat-limits";
import { useExamProfile } from "../../lib/use-exam-profile";
import layout from "../../styles/LearningExperience.module.css";
import styles from "../../styles/JagdlateinChat.module.css";

const MAX_TURNS = 8;

export async function getServerSideProps(context) {
  return getPaidPageProps(context);
}

function isLearningLink(link) {
  return typeof link?.href === "string" && /^\/(?![\/\\])/.test(link.href) && !/[\\\u0000-\u001f]/.test(link.href);
}

function AnswerLinks({ links }) {
  const entries = Array.isArray(links) ? links.filter(link => typeof link?.label === "string" && link.label.trim()) : [];
  const learning = entries.filter(isLearningLink);
  const sources = entries.filter(link => typeof link.href === "string" && link.href.startsWith("https://"));
  return <>
    {learning.length > 0 && <ul className={styles.learningLinks}>{learning.map((link, index) => (
      <li key={`${link.href}:${index}`}><Link href={link.href}>{link.label}</Link></li>
    ))}</ul>}
    {sources.length > 0 && <details className={styles.sources}>
      <summary>Quellen</summary>
      <ul>{sources.map(link => <li key={link.href}><a href={link.href} rel="noreferrer">{link.label}</a></li>)}</ul>
    </details>}
  </>;
}

export default function JagdlateinChatPage() {
  const { profile, ready, phase } = useExamProfile();
  const loadingExam = phase === "loading";
  const exam = ready ? getExamProfileDetails(profile) : null;
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  const mounted = useRef(false);
  const draft = useRef("");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, []);

  function changeQuestion(text) {
    draft.current = text;
    setQuestion(text);
  }

  async function ask(event) {
    event.preventDefault();
    const text = question.trim();
    if (!mounted.current || question !== draft.current || !text || text.length > MAX_JAGDLATEIN_QUESTION_LENGTH || loadingExam || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/lernen/jagdlatein-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ question: text, examProfile: exam ? profile : null }),
      });
      if (request.current !== controller) return;
      if (response.status === 401 || response.status === 403) {
        setError(response.status === 401 ? "Bitte melde dich erneut an." : "Für den Lernchat brauchst du einen aktiven Lernzugang.");
        return;
      }
      if (!response.ok) throw new Error("Chat unavailable");
      const reply = await response.json();
      if (request.current !== controller) return;
      if (typeof reply?.text !== "string" || !reply.text.trim()) throw new Error("Missing answer");
      setTurns(previous => [{ id: (previous[0]?.id ?? 0) + 1, question: text, reply }, ...previous].slice(0, MAX_TURNS));
      changeQuestion("");
    } catch {
      if (request.current === controller) setError("Die Frage konnte gerade nicht beantwortet werden. Versuche es erneut.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return <LearningToolLayout title="Jagdlatein" description="Stell eine Frage zur Jagdprüfung und finde den passenden Lerninhalt." headingOnly className={styles.page} robots="noindex">
    <form onSubmit={ask} className={`${layout.panel} ${styles.form}`} aria-busy={busy}>
      <label htmlFor="jagdlatein-chat-question">Deine Frage an Jagdlatein</label>
      <p id="jagdlatein-chat-hint">Stell eine konkrete Frage oder gib einen Fachbegriff ein. Jagdlatein sucht in den vorhandenen Lerntexten.</p>
      <textarea id="jagdlatein-chat-question" aria-describedby="jagdlatein-chat-hint" value={question} onChange={event => changeQuestion(event.target.value)} readOnly={busy} rows={3} maxLength={MAX_JAGDLATEIN_QUESTION_LENGTH} placeholder="Zum Beispiel: Wozu hat die Stockente Schnabellamellen?" required />
      <div className={styles.actions}>
        <button type="submit" className={layout.primary} disabled={busy || loadingExam || !question.trim()}>Frage stellen</button>
        <Link href="/lernen/pruefungsplan">{exam ? `Prüfungsregion: ${exam.region.name}` : "Prüfungsregion wählen"}</Link>
      </div>
      {busy && <p role="status">Passender Lerninhalt wird gesucht …</p>}
      {error && <p role="alert">{error}</p>}
    </form>
    <div className={styles.turns} aria-live="polite" aria-relevant="additions">
      {turns.map(({ id, question: asked, reply }) => <article key={id} className={layout.panel}>
        <p className={styles.asked}><strong>Du</strong> {asked}</p>
        <h2>Jagdlatein</h2>
        <p className={styles.answer}>{reply.text}</p>
        <AnswerLinks links={reply.links} />
      </article>)}
    </div>
  </LearningToolLayout>;
}
