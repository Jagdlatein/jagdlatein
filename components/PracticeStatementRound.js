import { useEffect, useReducer, useRef } from "react";
import styles from "../styles/PracticeStatementRound.module.css";

const EMPTY_SCENARIOS = [];

function createRound(scenarios, generation = 0) {
  return { scenarios, generation, index: 0, answers: [], finished: false };
}

function roundReducer(state, event) {
  if (event.type === "replace") {
    return event.scenarios === state.scenarios ? state : createRound(event.scenarios, state.generation + 1);
  }
  if (event.generation !== state.generation || event.index !== state.index) return state;
  if (event.type === "restart") {
    return state.finished ? createRound(state.scenarios, state.generation + 1) : state;
  }
  if (state.finished || !state.scenarios[state.index]) return state;
  if (event.type === "answer") {
    if (state.answers.length !== state.index || typeof event.selection !== "boolean") return state;
    return { ...state, answers: [...state.answers, {
      selection: event.selection,
      correct: event.selection === state.scenarios[state.index].correct,
    }] };
  }
  if (event.type === "next" && state.answers.length === state.index + 1) {
    return state.index + 1 < state.scenarios.length
      ? { ...state, index: state.index + 1 }
      : { ...state, finished: true };
  }
  return state;
}

export default function PracticeStatementRound({ scenarios }) {
  const pool = Array.isArray(scenarios) ? scenarios : EMPTY_SCENARIOS;
  const [state, dispatch] = useReducer(roundReducer, pool, createRound);
  const active = useRef(true);
  const latestPool = useRef(pool);
  const heading = useRef(null);
  const focusAfterMove = useRef(false);
  latestPool.current = pool;

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => { dispatch({ type: "replace", scenarios: pool }); }, [pool]);
  useEffect(() => {
    if (focusAfterMove.current) {
      focusAfterMove.current = false;
      heading.current?.focus();
    }
  }, [state.generation, state.index, state.finished]);

  function send(type, extra = {}) {
    if (!active.current || pool !== latestPool.current) return;
    if (type === "next" || type === "restart") focusAfterMove.current = true;
    dispatch({ type, generation: state.generation, index: state.index, ...extra });
  }

  const current = state.scenarios[state.index];
  const result = state.answers[state.index];
  const score = state.answers.filter(answer => answer.correct).length;
  const total = state.scenarios.length;

  return <section className={styles.round} aria-label="Wissen & Sicherheit">
    <div className={styles.heading}>
      <p className={styles.kicker}>Aussagen einordnen</p>
      <h2>Wissen &amp; Sicherheit</h2>
    </div>
    {!current ? <p>Für dieses Thema sind gerade keine Aussagen verfügbar.</p> : state.finished ? <div className={styles.result}>
      <h3 ref={heading} tabIndex={-1}>{score} von {total} Aussagen richtig eingeordnet</h3>
      <p>Du hast die Wissensrunde abgeschlossen. Das Ergebnis beschreibt nur diese Lernübung.</p>
      <button type="button" className={styles.primary} onClick={() => send("restart")}>Noch einmal üben</button>
    </div> : <>
      <div className={styles.progressText}><p>Aussage {state.index + 1} von {total}</p><span>{state.answers.length} bearbeitet</span></div>
      <progress className={styles.progress} value={state.answers.length} max={total} aria-label="Bearbeitete Aussagen" />
      <div className={styles.question}>
        <h3 ref={heading} tabIndex={-1}>{current.title}</h3>
        <p className={styles.statement}>{current.text}</p>
        <p className={styles.hint}>Passt die Aussage zur Frage?</p>
        <div className={styles.choices} role="group" aria-label="Aussage einordnen">
          {[true, false].map(selection => <button
            key={String(selection)}
            type="button"
            disabled={Boolean(result)}
            aria-pressed={result ? result.selection === selection : false}
            className={`${styles.choice}${result && current.correct === selection ? ` ${styles.correct}` : result && result.selection === selection ? ` ${styles.wrong}` : ""}`}
            onClick={() => send("answer", { selection })}
          >{selection ? "Stimmt" : "Stimmt nicht"}</button>)}
        </div>
      </div>
      {result && <>
        <div className={styles.feedback} role="status">
          <h4>{result.correct ? "Richtig eingeordnet" : "Noch einmal nachlesen"}</h4>
          <p><strong>{current.correct ? "Die Aussage stimmt." : "Die Aussage stimmt nicht."}</strong></p>
          <p>{current.explanation}</p>
          {typeof current.source === "string" && current.source.startsWith("https://") && <a href={current.source} target="_blank" rel="noopener noreferrer">Quelle nachlesen <span className={styles.newTab}>(neuer Tab)</span></a>}
        </div>
        <button type="button" className={styles.primary} onClick={() => send("next")}>{state.index + 1 === total ? "Runde auswerten" : "Weiter"}</button>
      </>}
      {(current.moduleTitle || current.countryLabel) && <details className={styles.context}>
        <summary>Thema und Quellenbezug</summary>
        {current.moduleTitle && <p>Thema: {current.moduleTitle}</p>}
        {current.countryLabel && <p>Länderbezug der vorhandenen Lerneinheit: {current.countryLabel}</p>}
      </details>}
    </>}
    <p className={styles.notice}>Ohne Zeitdruck. Beim Verlassen oder Neuladen beginnt die Runde neu.</p>
  </section>;
}
