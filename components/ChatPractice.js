import { useEffect, useId, useRef, useState } from "react";
import { answerOrder } from "../lib/answer-order";
import styles from "../styles/ChatPractice.module.css";

function isUsablePractice(practice) {
  return Boolean(practice && typeof practice.id === "string" && practice.id.trim() &&
    typeof practice.prompt === "string" && practice.prompt.trim() &&
    typeof practice.explanation === "string" && practice.explanation.trim() &&
    Array.isArray(practice.options) && practice.options.length === 4 &&
    practice.options.every(option => typeof option?.id === "string" && option.id.trim() &&
      typeof option.text === "string" && option.text.trim()) &&
    new Set(practice.options.map(option => option.id)).size === 4 &&
    new Set(practice.options.map(option => option.text.trim())).size === 4 &&
    practice.options.some(option => option.id === practice.correctId));
}

export default function ChatPractice({ practice, active = true }) {
  const questionId = useId();
  const mounted = useRef(false);
  const heading = useRef(null);
  const focusRequest = useRef(null);
  const scope = useRef({ practice, active });
  if (scope.current.practice !== practice || scope.current.active !== active) scope.current = { practice, active };
  const origin = scope.current;
  const [state, setState] = useState({ owner: practice, opened: false, selected: null });
  const view = state.owner === practice ? state : { owner: practice, opened: false, selected: null };
  const currentView = useRef(view);
  currentView.current = view;
  const usable = isUsablePractice(practice);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; focusRequest.current = null; };
  }, []);

  useEffect(() => {
    const pending = focusRequest.current;
    focusRequest.current = null;
    if (!pending || pending.view !== view || pending.origin !== origin || !active) return;
    const target = heading.current;
    target?.focus({ preventScroll: true });
    const bounds = target?.getBoundingClientRect();
    if (bounds && (bounds.top < 0 || bounds.bottom > window.innerHeight)) {
      target.scrollIntoView?.({ block: "nearest", behavior: "auto" });
    }
  }, [view, origin, active]);

  function change(next, focusHeading = false) {
    if (!mounted.current || !active || !usable || scope.current !== origin || currentView.current !== view) return;
    currentView.current = next;
    focusRequest.current = focusHeading ? { view: next, origin } : null;
    setState(next);
  }

  function choose(id) {
    if (!view.opened || view.selected !== null || !practice.options.some(option => option.id === id)) return;
    change({ ...view, selected: id });
  }

  if (!usable) return null;
  if (!active) return <p className={styles.inactive}>Diese Übung gehört zu einer früheren Prüfungsregion.</p>;

  const answered = view.selected !== null;
  return <section className={styles.practice} aria-label={view.opened ? undefined : "Kurze Übung"} aria-labelledby={view.opened ? questionId : undefined}>
    {!view.opened ? <button type="button" className={styles.start} onClick={() => change({ ...view, opened: true }, true)}>Kurz üben</button> : <>
      <p className={styles.eyebrow}>Kurzer Wissenscheck</p>
      {typeof practice.context === "string" && practice.context.trim() && <p className={styles.context}>{practice.context}</p>}
      <h3 className={styles.prompt} id={questionId} ref={heading} tabIndex={-1}>{practice.prompt}</h3>
      <div className={styles.options} role="group" aria-label="Antwort wählen">
        {answerOrder(practice.options, practice.id).map(index => {
          const option = practice.options[index];
          const correct = answered && option.id === practice.correctId;
          const selected = option.id === view.selected;
          return <button type="button" key={option.id} disabled={answered} aria-pressed={selected}
            className={[styles.option, correct ? styles.correct : "", selected && !correct ? styles.incorrect : ""].filter(Boolean).join(" ")}
            onClick={() => choose(option.id)}>
            <span>{option.text}</span>
            {correct && <span className={styles.label}>{selected ? "Richtige Antwort · Deine Antwort" : "Richtige Antwort"}</span>}
            {selected && !correct && <span className={styles.label}>Deine Antwort</span>}
          </button>;
        })}
      </div>
      {answered && <div className={styles.feedback} role="status">
        <p className={styles.result}>{view.selected === practice.correctId ? "Richtig beantwortet." : "Die richtige Antwort ist markiert."}</p>
        <p>{practice.explanation}</p>
        <button type="button" className={styles.repeat} onClick={() => change({ ...view, selected: null }, true)}>Noch einmal</button>
      </div>}
    </>}
  </section>;
}
