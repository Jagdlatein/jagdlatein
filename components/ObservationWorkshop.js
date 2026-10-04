import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { observationCases, observationCaseMatches, observationQuestionCount } from "../lib/observation-workshop";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

export default function ObservationWorkshop() {
  const [caseId, setCaseId] = useState(observationCases[0].id);
  const [stageIndex, setStageIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState({});
  const answered = useRef(new Set());
  const active = useRef({ caseId: observationCases[0].id, stageIndex: 0, generation: 0 });
  const generation = active.current.generation;
  const item = observationCases.find(entry => entry.id === caseId);
  const stage = item.stages[stageIndex];
  const answerKey = `${caseId}:${stageIndex}`;
  const selected = answers[answerKey];
  const matches = observationCases.filter(entry => observationCaseMatches(entry, query));
  const answeredCount = Object.keys(answers).length;
  const correct = observationCases.reduce((total, entry) => total + entry.stages.filter((question, index) => answers[`${entry.id}:${index}`] === question.answer).length, 0);
  const caseFinished = item.stages.every((_, index) => answers[`${caseId}:${index}`] !== undefined);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eintrag");
    if (observationCases.some(entry => entry.id === id)) selectCase(id);
  }, []);

  function selectCase(id) {
    if (!observationCases.some(entry => entry.id === id)) return;
    active.current = { ...active.current, caseId: id, stageIndex: 0 };
    setCaseId(id); setStageIndex(0);
  }
  function submit(index) {
    const guard = active.current;
    if (guard.generation !== generation || guard.caseId !== caseId || guard.stageIndex !== stageIndex || answered.current.has(answerKey) || !Number.isInteger(index) || index < 0 || index >= stage.choices.length) return;
    answered.current.add(answerKey); setAnswers(current => ({ ...current, [answerKey]: index }));
  }
  function revealNext() {
    const guard = active.current;
    if (guard.generation !== generation || guard.caseId !== caseId || guard.stageIndex !== stageIndex || !answered.current.has(answerKey) || stageIndex >= item.stages.length - 1) return;
    guard.stageIndex += 1; setStageIndex(guard.stageIndex);
  }
  function goBack() {
    if (active.current.generation !== generation || active.current.caseId !== caseId || active.current.stageIndex !== stageIndex || stageIndex === 0) return;
    active.current.stageIndex -= 1; setStageIndex(active.current.stageIndex);
  }
  function reset() {
    active.current = { caseId: observationCases[0].id, stageIndex: 0, generation: generation + 1 };
    answered.current.clear(); setAnswers({}); setCaseId(observationCases[0].id); setStageIndex(0); setQuery("");
  }

  return <LearningToolLayout title="Welche Information fehlt?" description="Beobachtungen von Vermutungen unterscheiden. Acht Fälle entwickeln sich Schritt für Schritt – und manchmal ist das begründete Eingeständnis von Unsicherheit die beste Antwort." icon="search" category="tierschutz-verantwortung" stats={[{ value: observationCases.length, label: "Lernfälle" }, { value: observationQuestionCount, label: "Entscheidungen" }, { value: 3, label: "Informationsstufen je Fall" }]}>
    <section className={styles.note}><strong>So funktioniert die Werkstatt</strong><p>Du erhältst zunächst nur einen Ausschnitt. Beantworte die Frage, lies die Erklärung und decke anschließend die nächste Information auf. Die Fälle sind ausdrücklich konstruierte Lernbeispiele. Bei einem echten Notfall hat die zuständige Fachhilfe Vorrang.</p></section>
    <section className={styles.panel} aria-labelledby="beobachtung-auswahl"><h2 id="beobachtung-auswahl">Einen Fall finden</h2><label className={styles.field}>Fälle durchsuchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Kitz, Kühlkette oder Wärmebild" /></label><div className={mediaStyles.caseList}>{matches.map(entry => <button key={entry.id} className={entry.id === caseId ? styles.primary : styles.secondary} type="button" aria-pressed={entry.id === caseId} onClick={() => selectCase(entry.id)}>{entry.title}{entry.stages.every((_, index) => answers[`${entry.id}:${index}`] !== undefined) ? " · abgeschlossen" : ""}</button>)}</div>{matches.length === 0 && <p className={styles.empty}>Kein passender Fall. Versuche einen anderen Begriff oder <button className={styles.secondary} type="button" onClick={() => setQuery("")}>Suche zurücksetzen</button></p>}<p>{answeredCount} von {observationQuestionCount} Entscheidungen beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={observationQuestionCount} aria-label="Beantwortete Entscheidungen" /></section>
    <section className={styles.panel} aria-labelledby="beobachtung-fall"><div className={styles.tags}>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h2 id="beobachtung-fall">{item.title}</h2><p className={styles.muted}>Information {stageIndex + 1} von {item.stages.length}</p><ol className={mediaStyles.evidence}>{item.stages.slice(0, stageIndex + 1).map((entry, index) => <li key={entry.evidence}><strong>Information {index + 1}</strong>{entry.evidence}</li>)}</ol><h3>{stage.question}</h3><div className={styles.choices}>{stage.choices.map((choice, index) => <button type="button" key={choice} disabled={selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === stage.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => submit(index)}>{choice}</button>)}</div>
      {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === stage.answer ? "Richtig beurteilt." : `Richtig ist: ${stage.choices[stage.answer]}`}</strong><p>{stage.explanation}</p></div>}
      <div className={styles.actions}><button className={styles.secondary} type="button" disabled={stageIndex === 0} onClick={goBack}>Vorige Information</button>{stageIndex < item.stages.length - 1 && <button className={styles.primary} type="button" disabled={selected === undefined} onClick={revealNext}>Nächste Information aufdecken</button>}{caseFinished && <Link className={styles.secondary} href={item.course}>Das Thema vertiefen</Link>}</div>
      {caseFinished && stageIndex === item.stages.length - 1 && <div className={styles.note} role="status"><strong>Fall abgeschlossen.</strong><p>Du hast gesehen, welche neuen Informationen die Beurteilung ändern. Wähle oben einen weiteren Fall.</p></div>}
      <details className={styles.sources}><summary>Fachliche Grundlage dieses Falls</summary><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Geprüft am 4. Oktober 2026. Allgemeine Lernfälle für den deutschsprachigen Raum. Konkrete örtliche Pflichten und zulässige Technik prüfst du im <Link href="/jagdrecht">Rechtsbereich</Link>.</p></details>
    </section>
    {answeredCount > 0 && <section className={styles.panel}><h2>Die Lernrunde wiederholen</h2><p>Die Ergebnisse gelten nur für diese Runde in diesem Fenster. Bestehende Kursfortschritte werden dadurch nicht verändert.</p><button className={styles.secondary} type="button" onClick={reset}>Alle acht Fälle neu beginnen</button></section>}
  </LearningToolLayout>;
}
