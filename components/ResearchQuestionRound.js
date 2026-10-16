import { useEffect, useReducer, useRef } from "react";
import { answerOrder, newAnswerSeed } from "../lib/answer-order";
import { canGradeResearchQuestion, createResearchRound, currentResearchQuestion, researchRoundReducer } from "../lib/research-question-round";
import styles from "../styles/ResearchForPractice.module.css";

export default function ResearchQuestionRound({ questions, sources, daily = false, title, sectionId, notice }) {
  const [state, dispatch] = useReducer(researchRoundReducer, questions, createResearchRound);
  const question = currentResearchQuestion(state);
  const heading = useRef(null);
  const focusAfterMove = useRef(false);
  useEffect(() => {
    dispatch({ type: "freshen", generation: 0, seed: newAnswerSeed() });
  }, []);
  useEffect(() => {
    if (focusAfterMove.current) {
      focusAfterMove.current = false;
      heading.current?.focus();
    }
  }, [state.index, state.generation, state.finished]);
  if (!question || (daily && questions.length !== 1)) return null;
  const result = state.answers[question.id];
  const correctCount = state.ids.filter(id => state.answers[id]?.correct).length;
  const needsReview = state.ids.filter(id => !state.answers[id]?.correct);
  const sourceById = new Map(sources.map(source => [source.id, source]));
  function send(type, extra = {}) {
    if (["next", "continue", "retry", "restart"].includes(type)) focusAfterMove.current = true;
    dispatch({ type, generation: state.generation, questionId: question.id, ...extra });
  }
  function next() {
    send("next");
  }
  const orderedOptions = answerOrder(question.options, question.id, state.seed).map(index => question.options[index]);
  const expectedIds = question.format === "sequence" ? question.expectedOrder : question.correctIds;
  const titleId = sectionId ? `${sectionId}-title` : daily ? "revierwissen-tagesfall-title" : "revierwissen-quiz-title";
  return <section className={styles.quiz} id={sectionId || (daily ? "revierwissen-tagesfall" : "revierwissen-praxischeck")} aria-labelledby={titleId}>
    <div className={styles.sectionHeading}><div><p className={styles.kicker}>Wissen anwenden</p><h2 id={titleId}>{title || (daily ? "Dein Fall des Tages" : "Dein Praxischeck")}</h2></div>{!daily && <p>{questions.length} Fragen im Thema · kurze Runden mit bis zu 8 Fragen</p>}</div>
    {state.finished ? <div className={styles.result} role="status"><h3 tabIndex={-1} ref={heading}>{correctCount} von {state.ids.length} richtig</h3><p>Du hast diese Runde abgeschlossen. {state.remaining.length ? `${state.remaining.length} bisher nicht bearbeitete Fragen warten noch in diesem Thema.` : "Du hast den Fragenvorrat dieses Themas durchgearbeitet."} Die Auswertung gilt für diese Runde.</p><div className={styles.quizActions}><button type="button" className={styles.primaryAction} onClick={() => send(state.remaining.length ? "continue" : "restart", { seed: newAnswerSeed(state.seed) })}>{state.remaining.length ? "Weitere Fragen" : "Neu gemischt üben"}</button>{needsReview.length > 0 && <button type="button" className={styles.textAction} onClick={() => send("retry", { seed: newAnswerSeed(state.seed) })}>Unsichere Fragen wiederholen ({needsReview.length})</button>}</div>{state.ids.map(id => { const item = questions.find(value => value.id === id); return <details key={id} className={styles.reviewQuestion}><summary>{state.answers[id].correct ? "Richtig" : "Noch üben"} · {item.prompt}</summary><p>{item.explanation}</p></details>; })}</div> : <>
      {!daily && <><p className={styles.roundProgress}>Frage {state.index + 1} von {state.ids.length} <span>{question.skill}</span></p><progress max={state.ids.length} value={Object.keys(state.answers).length} aria-label="Beantwortete Fragen dieser Runde" /></>}
      <div className={styles.quizQuestion} key={`${state.generation}-${question.id}`}><h3 tabIndex={-1} ref={heading}>{question.prompt}</h3>{question.context && <p className={styles.caseContext}>{question.context}</p>}
        {question.format === "single" ? <><p className={styles.answerHint}>Eine Antwort ist richtig.</p><div className={styles.answerOptions} role="group" aria-label="Eine Antwort wählen">{orderedOptions.map(option => <button key={option.id} type="button" disabled={Boolean(result)} className={`${styles.answerOption}${result && expectedIds.includes(option.id) ? ` ${styles.answerCorrect}` : result?.selectedIds.includes(option.id) ? ` ${styles.answerWrong}` : ""}`} onClick={() => send("answer", { ids: [option.id] })}>{option.text}{result && expectedIds.includes(option.id) && <strong>Richtige Antwort</strong>}{result?.selectedIds.includes(option.id) && !expectedIds.includes(option.id) && <strong>Deine Antwort</strong>}</button>)}</div></> : question.format === "multiple" ? <fieldset className={styles.answerFieldset} disabled={Boolean(result)}><legend>Mehrere Antworten sind richtig. Wähle alle zutreffenden Aussagen.</legend><div className={styles.answerOptions}>{orderedOptions.map(option => <label key={option.id} className={`${styles.answerOption}${result && expectedIds.includes(option.id) ? ` ${styles.answerCorrect}` : result?.selectedIds.includes(option.id) ? ` ${styles.answerWrong}` : ""}`}><input type="checkbox" checked={state.selection.includes(option.id)} onChange={() => send("select", { id: option.id })} /><span>{option.text}{result && expectedIds.includes(option.id) && <strong>Richtige Aussage</strong>}</span></label>)}</div></fieldset> : <fieldset className={styles.answerFieldset} disabled={Boolean(result)}><legend>Bringe die Schritte in die richtige Reihenfolge. Verwende jeden genau einmal.</legend><div className={styles.sequenceOptions}>{question.options.map((_, position) => <label key={position}>{position + 1}. Schritt<select aria-label={`${position + 1}. Schritt`} value={state.selection[position] || ""} onChange={event => send("select", { position, id: event.target.value })}><option value="">Schritt auswählen</option>{orderedOptions.map(option => <option key={option.id} value={option.id}>{option.text}</option>)}</select>{state.selection[position] && <span className={styles.sequenceText}>{question.options.find(option => option.id === state.selection[position])?.text}</span>}</label>)}</div>{new Set(state.selection.filter(Boolean)).size < state.selection.filter(Boolean).length && <p className={styles.answerHint} role="status">Ein Schritt ist mehrfach gewählt. Verwende jeden Schritt genau einmal.</p>}</fieldset>}
      </div>
      {result ? <div className={styles.quizFeedback} role="status"><h4>{result.correct ? "Richtig eingeordnet" : result.skipped ? "Zum Nachlesen und Wiederholen" : "Das schauen wir genauer an"}</h4>{question.format === "sequence" && <ol>{expectedIds.map(id => <li key={id}>{question.options.find(option => option.id === id).text}</li>)}</ol>}<p>{question.explanation}</p><p className={styles.quizSources}>{question.sourceIds.map(id => sourceById.get(id)).filter(Boolean).map(source => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>)}</p>{daily && <p><strong>Für heute bearbeitet.</strong></p>}</div> : null}
      {(!daily || !result) && <div className={styles.quizActions}>{result ? <button type="button" className={styles.primaryAction} onClick={next}>{state.index + 1 === state.ids.length ? "Runde auswerten" : "Nächste Frage"}</button> : <>{question.format !== "single" && <button type="button" className={styles.primaryAction} disabled={!canGradeResearchQuestion(question, state.selection)} onClick={() => send("answer")}>Antwort prüfen</button>}<button type="button" className={styles.textAction} onClick={() => send("skip")}>Weiß ich noch nicht</button></>}</div>}
    </>}
    <p className={styles.localNotice}>{notice || (daily ? "Ein Lernfall, keine Ranglistenpunkte. Deine Antwort wird nicht dauerhaft gespeichert. Beim Neuladen beginnt der heutige Fall erneut." : "Lernübung auf diesem Gerät. Keine Prüfung und keine Prognose für dein Revier. Beim Verlassen der Seite beginnt die Runde neu.")}</p>
  </section>;
}
