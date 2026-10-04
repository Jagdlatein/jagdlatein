import { useRef, useState } from "react";
import styles from "../styles/LearningExperience.module.css";

export function summarizeNatureQuiz(entries, answers) {
  const completed = entries.filter(entry => Number.isInteger(answers[entry.id]));
  const correct = completed.filter(entry => answers[entry.id] === entry.answer).length;
  return { completed: completed.length, correct, retryIds: completed.filter(entry => answers[entry.id] !== entry.answer).map(entry => entry.id) };
}

export default function NatureQuestionRound({ entries, sources = {}, label = "Wissensrunde", renderMedia }) {
  const [roundIds, setRoundIds] = useState(entries.map(entry => entry.id));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const guard = useRef({ attempt: 0, answered: new Set(), advanced: new Set(), current: null });
  const attempt = guard.current.attempt;
  const rounds = roundIds.map(id => entries.find(entry => entry.id === id)).filter(Boolean);
  const entry = rounds[index];
  guard.current.current = entry?.id;
  const summary = summarizeNatureQuiz(rounds, answers);
  function restart(ids = entries.map(item => item.id)) {
    guard.current = { attempt: guard.current.attempt + 1, answered: new Set(), advanced: new Set(), current: null };
    setRoundIds(ids); setIndex(0); setAnswers({}); setFinished(false);
  }
  function answer(choice) {
    if (!entry || guard.current.attempt !== attempt || guard.current.current !== entry.id || guard.current.answered.has(entry.id) || !Number.isInteger(choice) || choice < 0 || choice >= entry.options.length) return;
    guard.current.answered.add(entry.id);
    setAnswers(previous => Object.hasOwn(previous, entry.id) ? previous : { ...previous, [entry.id]: choice });
  }
  function next() {
    if (!entry || guard.current.attempt !== attempt || guard.current.current !== entry.id || !Object.hasOwn(answers, entry.id) || guard.current.advanced.has(entry.id)) return;
    guard.current.advanced.add(entry.id);
    if (index + 1 >= rounds.length) setFinished(true); else setIndex(index + 1);
  }
  if (!entry) return <div className={styles.empty}>Für diese Auswahl sind keine Fragen vorhanden.</div>;
  const selected = answers[entry.id];
  const answered = Object.hasOwn(answers, entry.id);
  const source = typeof entry.source === "string" ? sources[entry.source] : entry.source;
  return <section className={styles.panel} aria-label={label}>
    {finished ? <><h2>{summary.correct} von {rounds.length} Fragen richtig</h2><p>Diese Auswertung gilt für deine aktuelle Wissensrunde. Lies die Erklärungen nach und übe unsichere Zusammenhänge erneut.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={() => restart()}>Alle Fragen neu üben</button>{summary.retryIds.length > 0 && <button type="button" className={styles.secondary} onClick={() => restart(summary.retryIds)}>Fehler gezielt wiederholen ({summary.retryIds.length})</button>}</div>{rounds.map(item => <details key={item.id} className={styles.sources}><summary>{item.title} · {answers[item.id] === item.answer ? "richtig" : "noch üben"}</summary><p><strong>Deine Antwort:</strong> {item.options[answers[item.id]]}</p><p><strong>Richtig:</strong> {item.options[item.answer]}</p><p>{item.explanation}</p></details>)}</> : <>
      <p className={styles.muted}>{label} · Frage {index + 1} von {rounds.length}</p><progress className={styles.progress} max={rounds.length} value={summary.completed} aria-label="Beantwortete Fragen"/><h2>{entry.question}</h2>{renderMedia && renderMedia(entry, answered)}
      <div className={styles.choices} role="group" aria-label="Antwort wählen">{entry.options.map((option, choice) => <button type="button" key={option} disabled={answered} className={[styles.choice, answered && choice === entry.answer ? styles.correct : "", answered && choice === selected && selected !== entry.answer ? styles.wrong : ""].filter(Boolean).join(" ")} onClick={() => answer(choice)}>{option}{answered && choice === entry.answer && <span> · Richtige Antwort</span>}{answered && choice === selected && selected !== entry.answer && <span> · Deine Antwort</span>}</button>)}</div>
      {answered && <div className={styles.feedback} role="status"><h3>{selected === entry.answer ? "Richtig" : "Das gehört noch zur Wiederholung"}</h3>{selected !== entry.answer && <p><strong>Du hast gewählt:</strong> {entry.options[selected]}</p>}<p><strong>{entry.options[entry.answer]}</strong></p>{entry.wrong?.[selected] && selected !== entry.answer && <p>{entry.wrong[selected]}</p>}<p>{entry.explanation}</p>{source && <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>}</div>}
      <div className={styles.actions}>{answered && <button type="button" className={styles.primary} onClick={next}>{index + 1 === rounds.length ? "Auswertung ansehen" : "Nächste Frage"}</button>}<button type="button" className={styles.secondary} onClick={() => restart()}>Runde neu beginnen</button></div>
    </>}
  </section>;
}
