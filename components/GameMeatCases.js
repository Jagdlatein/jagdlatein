import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { gameMeatCases, getGameMeatSummary } from "../lib/game-meat-cases";
import styles from "../styles/LearningExperience.module.css";

export default function GameMeatCases() {
  const [mode, setMode] = useState("practice");
  const [ids, setIds] = useState(gameMeatCases.map(item => item.id));
  const [index, setIndex] = useState(0);
  const [exploreId, setExploreId] = useState(gameMeatCases[0].id);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const generation = useRef(0);
  const advance = useRef(null);
  const active = useRef(null);
  const cases = ids.map(id => gameMeatCases.find(item => item.id === id));
  const item = mode === "discover" ? gameMeatCases.find(entry => entry.id === exploreId) : cases[index];
  const token = generation.current;
  active.current = item.id;
  const answer = answers[item.id];
  const answered = Number.isInteger(answer);
  const summary = getGameMeatSummary(cases, answers);
  useEffect(() => { const selected = new URLSearchParams(window.location.search).get("eintrag"); if (gameMeatCases.some(entry => entry.id === selected)) { generation.current++; setExploreId(selected); setMode("discover"); } }, []);
  function start(nextIds = gameMeatCases.map(entry => entry.id)) { generation.current++; advance.current = null; setIds(nextIds); setIndex(0); setAnswers({}); setFinished(false); setMode("practice"); }
  function choose(value) { if (generation.current !== token || active.current !== item.id || answered) return; setAnswers(previous => Number.isInteger(previous[item.id]) ? previous : { ...previous, [item.id]: value }); }
  function next() { if (!answered || generation.current !== token || active.current !== item.id || advance.current === item.id) return; advance.current = item.id; if (index + 1 === cases.length) setFinished(true); else setIndex(index + 1); }
  return <LearningToolLayout title="Wildbret-Fallwerkstatt" description="Hygiene, Kühlkette und Rückverfolgbarkeit in nachvollziehbaren Fällen üben." icon="health" category="wildbret-gesundheit" stats={[{ value: gameMeatCases.length, label: "Praxisfälle" }, { value: "3", label: "Fachstellen" }, { value: "10", label: "erklärte Entscheidungen" }]}>
    <div className={styles.modeButtons} aria-label="Lernmodus"><button type="button" className={mode === "practice" ? styles.primary : styles.secondary} aria-pressed={mode === "practice"} onClick={() => start()}>Fälle lösen</button><button type="button" className={mode === "discover" ? styles.primary : styles.secondary} aria-pressed={mode === "discover"} onClick={() => { generation.current++; setMode("discover"); }}>Nachschlagen</button></div>
    <p className={styles.note}>Die Fälle trainieren allgemeine Hygienelogik. Untersuchungspflichten, Kennzeichnung und Abgabewege richten sich nach dem Ort und dem konkreten Betrieb. Die App erteilt keine Freigabe für ein reales Stück.</p>
    {finished && mode === "practice" ? <section className={styles.panel} aria-live="polite"><h2>Deine Fallrunde</h2><p>{summary.correct} von {cases.length} Entscheidungen richtig begründet.</p><div className={styles.actions}>{summary.wrongIds.length > 0 && <button className={styles.primary} type="button" onClick={() => start(summary.wrongIds)}>Offene Fälle wiederholen</button>}<button className={styles.secondary} type="button" onClick={() => start()}>Alle Fälle neu beginnen</button></div></section> : <>
      {mode === "discover" && <label className={styles.field}>Fall wählen<select value={exploreId} onChange={event => setExploreId(event.target.value)}>{gameMeatCases.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>}
      <section className={styles.panel} aria-labelledby="game-meat-title"><p className={styles.muted}>{item.topic}{mode === "practice" && ` · Fall ${index + 1} von ${cases.length}`}</p><h2 id="game-meat-title">{item.title}</h2><p>{item.situation}</p><h3>{item.question}</h3>
        {mode === "practice" ? <div className={styles.choices}>{item.choices.map((choice, position) => <button key={choice.text} type="button" disabled={answered} className={[styles.choice, answered && position === item.answer ? styles.correct : "", answered && position === answer && answer !== item.answer ? styles.wrong : ""].join(" ")} onClick={() => choose(position)}>{choice.text}</button>)}</div> : <p><strong>{item.choices[item.answer].text}</strong></p>}
        {(answered || mode === "discover") && <div className={styles.feedback} role="status"><h3>{mode === "discover" ? "Begründung" : answer === item.answer ? "Richtig begründet" : "Hier ist ein anderer Schritt nötig"}</h3>{mode === "practice" && <p>{item.choices[answer].explanation}</p>}{(mode === "discover" || answer !== item.answer) && <p>{item.choices[item.answer].explanation}</p>}<strong>{item.takeaway}</strong></div>}
        {(answered || mode === "discover") && <><h3>Für einen geordneten Ablauf</h3><ul>{item.checklist.map(text => <li key={text}>{text}</li>)}</ul><Link className={styles.secondary} href={`/kurse/${item.course}`}>Im Hygienekurs vertiefen</Link><details className={styles.sources}><summary>Fachquellen · geprüft am 04.10.2026</summary><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details></>}
        {answered && mode === "practice" && <div className={styles.actions}><button type="button" className={styles.primary} onClick={next}>{index + 1 === cases.length ? "Runde auswerten" : "Nächster Fall"}</button></div>}
      </section>
    </>}
  </LearningToolLayout>;
}
