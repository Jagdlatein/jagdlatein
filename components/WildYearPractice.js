import { useEffect, useRef, useState } from "react";
import { getWildYearPractice } from "../lib/wild-year-practice";
import styles from "../styles/LearningExperience.module.css";

function initialRound(context, questions) {
  return { context, ticket: {}, questions, index: 0, answers: {}, finished: false, revision: 0 };
}

export default function WildYearPractice({ speciesSlug, scope, isCurrent, disabled = false }) {
  const contextRef = useRef(null);
  if (!contextRef.current || contextRef.current.speciesSlug !== speciesSlug || contextRef.current.scope !== scope) {
    const context = { speciesSlug, scope };
    context.initial = initialRound(context, getWildYearPractice(speciesSlug));
    contextRef.current = context;
  }
  const context = contextRef.current;
  const mounted = useRef(false);
  const latest = useRef(null);
  latest.current = { speciesSlug, scope, isCurrent, disabled };
  const [stored, setStored] = useState(context.initial);
  const round = stored.context === context ? stored : context.initial;
  const live = useRef(round);
  live.current = round;
  const question = round.questions[round.index];
  const answer = question ? round.answers[question.id] : undefined;
  const heading = useRef(null);
  const focusNext = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; focusNext.current = null; };
  }, []);
  useEffect(() => {
    const intent = focusNext.current;
    focusNext.current = null;
    const active = live.current;
    const currentProps = latest.current;
    if (!intent || !mounted.current || currentProps.disabled || currentProps.scope !== context.scope
      || currentProps.speciesSlug !== context.speciesSlug || intent.context !== context || intent.ticket !== active.ticket
      || intent.index !== active.index || intent.finished !== active.finished || intent.revision !== active.revision
      || typeof currentProps.isCurrent !== "function" || !currentProps.isCurrent()) return;
    heading.current?.focus?.({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }, [context, round.ticket, round.index, round.finished]);

  function current() {
    const active = live.current;
    if (!mounted.current || disabled || latest.current.disabled || contextRef.current !== context || latest.current.speciesSlug !== speciesSlug
      || latest.current.scope !== scope || latest.current.isCurrent !== isCurrent || typeof isCurrent !== "function"
      || !isCurrent() || active.context !== context || active.ticket !== round.ticket
      || active.index !== round.index || active.finished !== round.finished) return null;
    return active;
  }
  function update(active, change, moveFocus = false) {
    const next = { ...change(active), revision: active.revision + 1 };
    live.current = next;
    if (moveFocus) focusNext.current = { context, ticket: next.ticket, index: next.index, finished: next.finished, revision: next.revision };
    setStored(previous => {
      if (!mounted.current || contextRef.current !== context) return previous;
      return previous.context !== context || previous.revision < next.revision ? next : previous;
    });
  }
  function choose(id) {
    const active = current();
    if (!active || active.finished || !question || active.questions[active.index] !== question
      || active.answers[question.id] !== undefined || !question.choices.some(choice => choice.id === id)) return;
    update(active, state => ({ ...state, answers: { ...state.answers, [question.id]: id } }));
  }
  function nextQuestion() {
    const active = current();
    if (!active || active.finished || !question || active.questions[active.index] !== question || active.answers[question.id] === undefined) return;
    update(active, state => state.index + 1 < state.questions.length
      ? { ...state, index: state.index + 1 } : { ...state, finished: true }, true);
  }
  function restart(wrongOnly) {
    const active = current();
    if (!active || !active.finished) return;
    const questions = wrongOnly ? active.questions.filter(item => active.answers[item.id] !== item.answerId) : context.initial.questions;
    if (!questions.length) return;
    update(active, () => initialRound(context, questions), true);
  }

  if (!round.questions.length) return null;
  const correct = round.questions.filter(item => round.answers[item.id] === item.answerId).length;
  const wrong = round.questions.filter(item => round.answers[item.id] !== undefined && round.answers[item.id] !== item.answerId);
  return <section id="wildjahr-uebung" className={styles.panel} aria-labelledby="wildjahr-practice-title">
    <h2 id="wildjahr-practice-title">Kalenderübung</h2>
    <p className={styles.muted}>Lies die Monatszuordnung des Jahresmodells. Die Phasen sind Orientierung, keine Jagdzeiten. Diese eigenen Übungen sind keine amtlichen Prüfungsfragen.</p>
    {round.finished ? <>
      <h3 id="wildjahr-practice-question" tabIndex={-1} ref={heading}>Runde abgeschlossen</h3>
      <p role="status">{correct} von {round.questions.length} Phasen richtig zugeordnet.</p>
      <div className={styles.actions}>
        {wrong.length > 0 && <button type="button" className={styles.primary} disabled={disabled} onClick={() => restart(true)}>Fehler wiederholen</button>}
        <button type="button" className={styles.secondary} disabled={disabled} onClick={() => restart(false)}>Neu beginnen</button>
      </div>
    </> : <>
      <p className={styles.muted}>Frage {round.index + 1} von {round.questions.length}</p>
      <h3 id="wildjahr-practice-question" tabIndex={-1} ref={heading}>{question.prompt}</h3>
      <fieldset className={styles.choices} aria-labelledby="wildjahr-practice-question" disabled={disabled || answer !== undefined}>
        <legend>Antwort wählen</legend>
        {question.choices.map(choice => <label key={choice.id} className={styles.choice}>
          <input type="radio" name={`wildjahr-practice-${question.id}`} value={choice.id} checked={answer === choice.id} onChange={() => choose(choice.id)} />{choice.title}
        </label>)}
      </fieldset>
      {answer !== undefined && <>
        <div className={styles.feedback} role="status">
          <p><strong>{answer === question.answerId ? "Richtig im Modell zugeordnet." : `Das Modell nennt: ${question.choices.find(choice => choice.id === question.answerId).title}.`}</strong></p>
          <p>{question.explanation}</p>
          <p className={styles.muted}>{question.uncertainty}</p>
        </div>
        <button type="button" className={styles.primary} disabled={disabled} onClick={nextQuestion}>{round.index + 1 < round.questions.length ? "Nächste Frage" : "Runde abschließen"}</button>
      </>}
    </>}
  </section>;
}
