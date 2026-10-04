import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { wildlifeVideoCases, wildlifeVideoQuestionCount, videoCaseMatches } from "../lib/wildlife-video-cases";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

export default function WildlifeVideoCases() {
  const [caseId, setCaseId] = useState(wildlifeVideoCases[0].id);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState({});
  const [observed, setObserved] = useState({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const video = useRef(null);
  const playback = useRef(null);
  const mounted = useRef(true);
  const active = useRef({ caseId: wildlifeVideoCases[0].id, questionIndex: 0, generation: 0, observed: new Set(), answered: new Set() });
  const generation = active.current.generation;
  if (!playback.current || playback.current.generation !== generation || playback.current.caseId !== caseId || playback.current.attempt !== attempt) playback.current = { generation, caseId, attempt };
  const renderedPlayback = playback.current;
  const item = wildlifeVideoCases.find(entry => entry.id === caseId);
  const question = item.questions[questionIndex];
  const answerKey = `${caseId}:${question.id}`;
  const selected = answers[answerKey];
  const matches = wildlifeVideoCases.filter(entry => videoCaseMatches(entry, query));
  const answeredCount = Object.keys(answers).length;
  const correct = wildlifeVideoCases.reduce((sum, entry) => sum + entry.questions.filter(current => answers[`${entry.id}:${current.id}`] === current.answer).length, 0);
  const caseFinished = item.questions.every(current => answers[`${caseId}:${current.id}`] !== undefined);

  useEffect(() => {
    mounted.current = true;
    const id = new URLSearchParams(window.location.search).get("eintrag");
    if (wildlifeVideoCases.some(entry => entry.id === id)) selectCase(id);
    return () => { video.current?.pause(); mounted.current = false; };
  }, []);

  function selectCase(id) {
    if (!mounted.current || !wildlifeVideoCases.some(entry => entry.id === id)) return;
    if (active.current.caseId === id && active.current.questionIndex === 0) return;
    video.current?.pause(); playback.current = null; active.current.generation += 1; active.current.caseId = id; active.current.questionIndex = 0;
    setCaseId(id); setQuestionIndex(0); setFailed(false); setAttempt(0);
  }
  function markObserved() {
    if (!mounted.current || active.current.generation !== generation || active.current.caseId !== caseId) return;
    active.current.observed.add(caseId); setObserved(current => ({ ...current, [caseId]: true }));
  }
  function mediaFailed() {
    if (mounted.current && playback.current === renderedPlayback && active.current.generation === generation && active.current.caseId === caseId) setFailed(true);
  }
  function submit(index) {
    const guard = active.current;
    if (!mounted.current || guard.generation !== generation || guard.caseId !== caseId || guard.questionIndex !== questionIndex || !guard.observed.has(caseId) || guard.answered.has(answerKey) || !Number.isInteger(index) || index < 0 || index >= question.choices.length) return;
    video.current?.pause(); guard.answered.add(answerKey); setAnswers(current => ({ ...current, [answerKey]: index }));
  }
  function changeQuestion(delta) {
    const guard = active.current;
    if (guard.generation !== generation || guard.caseId !== caseId || guard.questionIndex !== questionIndex || (delta > 0 && !guard.answered.has(answerKey))) return;
    const next = questionIndex + delta;
    if (next < 0 || next >= item.questions.length) return;
    video.current?.pause(); guard.questionIndex = next; setQuestionIndex(next);
  }
  function reviewMoment() {
    if (!video.current || active.current.generation !== generation || active.current.caseId !== caseId || active.current.questionIndex !== questionIndex) return;
    video.current.pause();
    const duration = video.current.duration;
    if (Number.isFinite(duration)) video.current.currentTime = Math.min(question.at, Math.max(0, duration - 0.1));
  }
  function reset() {
    video.current?.pause(); playback.current = null; active.current = { caseId: wildlifeVideoCases[0].id, questionIndex: 0, generation: generation + 1, observed: new Set(), answered: new Set() };
    setCaseId(wildlifeVideoCases[0].id); setQuestionIndex(0); setAnswers({}); setObserved({}); setQuery(""); setFailed(false); setAttempt(0);
  }

  return <LearningToolLayout title="Wildtier-Videofälle" description="Echte Naturaufnahmen anschauen, anhalten und sorgfältig beurteilen. Jede Antwort erklärt, was sichtbar ist und was aus einem kurzen Clip offenbleibt." icon="video" category="wildkunde" stats={[{ value: wildlifeVideoCases.length, label: "Originalvideos" }, { value: wildlifeVideoQuestionCount, label: "erklärte Fragen" }, { value: "CC", label: "dokumentierte Lizenzen" }]}>
    <section className={styles.note}><strong>Beobachten, ohne etwas hinzuzuerfinden</strong><p>Die Videos stammen aus echten Naturaufnahmen. Schau den Clip an oder lies die zugängliche Textfassung. Halte ihn an, prüfe die Frage und vergleiche nach deiner Antwort die Erklärung. Tierart und Aufnahmeort sind immer offen angegeben.</p></section>
    <section className={styles.panel} aria-labelledby="video-auswahl"><h2 id="video-auswahl">Eine Aufnahme finden</h2><label className={styles.field}>Videos durchsuchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Fuchs, Brunft oder Stockente" /></label><div className={mediaStyles.caseList}>{matches.map(entry => <button type="button" key={entry.id} aria-pressed={caseId === entry.id} className={caseId === entry.id ? styles.primary : styles.secondary} onClick={() => selectCase(entry.id)}>{entry.title}{entry.questions.every(current => answers[`${entry.id}:${current.id}`] !== undefined) ? " · abgeschlossen" : ""}</button>)}</div>{matches.length === 0 && <div className={styles.empty}><p>Kein passendes Video.</p><button className={styles.secondary} type="button" onClick={() => setQuery("")}>Suche zurücksetzen</button></div>}<p>{answeredCount} von {wildlifeVideoQuestionCount} Fragen beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={wildlifeVideoQuestionCount} aria-label="Beantwortete Videofragen" /></section>
    <section className={styles.panel} aria-labelledby="video-fall"><h2 id="video-fall">{item.title}</h2><p><strong>{item.species}</strong> · {item.location}</p><figure className={styles.figure}><video key={`${caseId}:${attempt}`} ref={video} controls playsInline preload="none" poster={item.poster} aria-label={item.title} aria-describedby="video-textfassung" className={mediaStyles.video} onTimeUpdate={event => { if (playback.current === renderedPlayback && event.currentTarget.currentTime >= 2) markObserved(); }} onError={mediaFailed}><source src={item.src} type="video/webm" onError={mediaFailed} />Die Originalaufnahme kann in diesem Browser nicht direkt abgespielt werden. Die Textfassung steht unten.</video><figcaption>{item.authorUrl ? <>© <a href={item.authorUrl} target="_blank" rel="noreferrer">{item.author}, gileslaurent.com</a>, License CC BY-SA</> : <>Aufnahme: {item.author}</>} · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a> · <a href={item.source} target="_blank" rel="noreferrer">Originalquelle</a><br />Unveränderte Wikimedia-WebM-Fassung in 480p; keine KI. Vorschaubild: Standbild derselben Aufnahme. Ungefähr {item.duration} Sekunden.</figcaption></figure>
      {failed && <div className={styles.note} role="alert"><p>Der Browser konnte das Video nicht abspielen. Prüfe die Verbindung oder nutze die Textfassung. Manche ältere Browser unterstützen WebM nicht.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => { playback.current = null; setFailed(false); setAttempt(value => value + 1); }}>Video neu laden</button><a className={styles.secondary} href={item.source} target="_blank" rel="noreferrer">Bei der Originalquelle ansehen</a></div></div>}
      <details className={mediaStyles.transcript} id="video-textfassung"><summary>Textfassung der Aufnahme lesen</summary><p>{item.transcript}</p><button className={styles.secondary} type="button" onClick={markObserved}>Textfassung gelesen – Fragen öffnen</button></details>
      <div className={styles.tags}>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h3>Darauf kommt es beim Beobachten an</h3><ul>{item.observations.map(text => <li key={text}>{text}</li>)}</ul><p className={styles.muted}>Frage {questionIndex + 1} von {item.questions.length}</p><h3>{question.question}</h3>{!observed[caseId] && <p className={styles.note}>Starte die Aufnahme oder lies die Textfassung, bevor du antwortest.</p>}<div className={styles.choices}>{question.choices.map((choice, index) => <button key={choice} type="button" disabled={!observed[caseId] || selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === question.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => submit(index)}>{choice}</button>)}</div>
      {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig beobachtet." : `Richtig ist: ${question.choices[question.answer]}`}</strong><p>{question.explanation}</p></div>}
      <div className={styles.actions}><button className={styles.secondary} type="button" disabled={questionIndex === 0} onClick={() => changeQuestion(-1)}>Vorige Frage</button><button className={styles.secondary} type="button" onClick={reviewMoment}>Beobachtungsmoment anhalten</button>{questionIndex < item.questions.length - 1 && <button className={styles.primary} type="button" disabled={selected === undefined} onClick={() => changeQuestion(1)}>Nächste Frage</button>}{caseFinished && <Link className={styles.secondary} href={item.course}>Im Kurs vertiefen</Link>}</div>
      {caseFinished && <p className={styles.note} role="status">Alle drei Fragen zu dieser Aufnahme beantwortet. Wähle oben einen weiteren Fall.</p>}
      <details className={styles.sources}><summary>Inhalt und Quellen prüfen</summary><p>Beobachtungsgrundlage ist die verlinkte Originalaufnahme samt Urheberbeschreibung. Fachliche Einordnung: <a href="https://www.waldwissen.net/de/lebensraum-wald/wald-und-wild/wildoekologie/der-rothirsch-cervus-elaphus" target="_blank" rel="noreferrer">Rothirsch – waldwissen.net</a> und <a href="https://www.waldwissen.net/assets/wald/wild/management/wsl_wildtiermanagement/download/wsl_wildtiermanagement_grundlagen.pdf.pdf" target="_blank" rel="noreferrer">WSL: Grenzen von Wildbeobachtungen und Bestandsangaben</a>. Geprüft am 4. Oktober 2026.</p><p>Beschrieben werden sichtbare beziehungsweise ausdrücklich von der Quelle dokumentierte Vorgänge. Unsichtbare Nahrung, exakte Altersjahre, Fortpflanzungs- und Gesundheitszustände werden nicht als gesicherte Beobachtung ausgegeben.</p></details>
    </section>
    {answeredCount > 0 && <section className={styles.panel}><h2>Die Beobachtungsrunde wiederholen</h2><p>Alle Erklärungen bleiben über die Fälle erreichbar. Eine neue Runde setzt nur die Ergebnisse in diesem Fenster zurück.</p><button className={styles.secondary} type="button" onClick={reset}>Alle Videofälle neu beginnen</button></section>}
  </LearningToolLayout>;
}
