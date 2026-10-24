import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { getLearningCategory } from "../lib/learning-categories";
import { observationCases, observationCaseMatches, observationQuestionCount } from "../lib/observation-workshop";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

const caseGroups = [...new Set(observationCases.map(item => item.category))];

export default function ObservationWorkshop() {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query.eintrag;
  // A bare workshop starts the first case. Explicit unknown/repeated values
  // never silently substitute another case; restored URLs remain authoritative.
  const item = ready ? requested === undefined ? observationCases[0] : observationCases.find(entry => typeof requested === "string" && entry.id === requested) || null : null;
  const caseId = item?.id || null;
  const selectionKey = JSON.stringify([ready, caseId]);
  const committedView = useRef({ key: selectionKey });
  if (committedView.current.key !== selectionKey) committedView.current = { key: selectionKey };
  const view = committedView.current;
  const [progress, setProgress] = useState({ view, stageIndex: 0 });
  const stageIndex = progress.view === view ? progress.stageIndex : 0;
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState({});
  const [navigationError, setNavigationError] = useState("");
  const answered = useRef(new Set());
  const resetVersion = useRef(0);
  const active = useRef(null);
  if (!active.current || active.current.view !== view || active.current.stageIndex !== stageIndex || active.current.generation !== resetVersion.current) {
    active.current = { view, caseId, stageIndex, generation: resetVersion.current };
  }
  const renderedRound = active.current;
  const content = useRef(null);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const mounted = useRef(false);
  const stage = item?.stages[stageIndex];
  const answerKey = `${caseId}:${stageIndex}`;
  const selected = answers[answerKey];
  const matches = observationCases.filter(entry => observationCaseMatches(entry, query));
  const answeredCount = Object.keys(answers).length;
  const correct = observationCases.reduce((total, entry) => total + entry.stages.filter((question, index) => answers[`${entry.id}:${index}`] === question.answer).length, 0);
  const caseFinished = Boolean(item && item.stages.every((_, index) => answers[`${caseId}:${index}`] !== undefined));

  function focusContent() {
    content.current?.focus?.({ preventScroll: true });
    content.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!item) {
      const timer = setTimeout(() => openPageMenu("beobachtung-auswahl"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu(); focusContent();
  }, [view]);

  async function selectCase(id) {
    if (!ready || !observationCases.some(entry => entry.id === id)) return;
    setNavigationError(""); closePageMenu();
    if (caseId === id && pendingRequest.current === null) { focusContent(); return; }
    const request = ++navigation.current;
    const origin = committedView.current;
    pendingRequest.current = request;
    try {
      await router.push({ pathname: "/lernen/beobachtungswerkstatt", query: { ...router.query, eintrag: id }, hash: "beobachtung-fall" }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Der Fall konnte nicht geöffnet werden. Bitte wähle ihn erneut.");
      openPageMenu("beobachtung-auswahl");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  function submit(index) {
    if (!mounted.current || !item || active.current !== renderedRound || answered.current.has(answerKey) || !Number.isInteger(index) || index < 0 || index >= stage.choices.length) return;
    answered.current.add(answerKey); setAnswers(current => ({ ...current, [answerKey]: index }));
  }
  function revealNext() {
    if (!mounted.current || !item || active.current !== renderedRound || !answered.current.has(answerKey) || stageIndex >= item.stages.length - 1) return;
    active.current = { ...renderedRound, stageIndex: stageIndex + 1 };
    setProgress({ view, stageIndex: stageIndex + 1 });
  }
  function goBack() {
    if (!mounted.current || !item || active.current !== renderedRound || stageIndex === 0) return;
    active.current = { ...renderedRound, stageIndex: stageIndex - 1 };
    setProgress({ view, stageIndex: stageIndex - 1 });
  }
  function reset() {
    if (!mounted.current || active.current !== renderedRound) return;
    resetVersion.current++;
    active.current = { view, caseId, stageIndex: 0, generation: resetVersion.current };
    answered.current.clear(); setAnswers({}); setProgress({ view, stageIndex: 0 }); setQuery("");
  }

  return <LearningToolLayout title="Welche Information fehlt?" description="Beobachtungen von Vermutungen unterscheiden. Acht Fälle entwickeln sich Schritt für Schritt – und manchmal ist das begründete Eingeständnis von Unsicherheit die beste Antwort." icon="search" category="tierschutz-verantwortung" headingOnly>
    <PageMenu title="Beobachtungswerkstatt – Fall wählen" openInitially={ready && !item} initialFocusId="beobachtung-auswahl">
      <div id="beobachtung-auswahl" tabIndex={-1}>
        <label className={styles.field}>Fälle durchsuchen<input type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Kitz, Kühlkette oder Wärmebild" /></label>
        <p role="status">{matches.length} {matches.length === 1 ? "Lernfall gefunden" : "Lernfälle gefunden"}</p>
        <label className={styles.field}>Lernangebot<select id="beobachtung-case" value={caseId || ""} disabled={!ready} aria-controls="beobachtung-inhalt" onChange={event => selectCase(event.target.value)}><option value="" disabled>Fall auswählen</option>{item && !matches.some(entry => entry.id === caseId) && <optgroup label="Aktueller Fall"><option value={item.id}>{item.title}</option></optgroup>}{caseGroups.map(category => {
          const entries = matches.filter(entry => entry.category === category);
          return entries.length > 0 && <optgroup key={category} label={getLearningCategory(category)?.title || "Beobachtungsfälle"}>{entries.map(entry => <option key={entry.id} value={entry.id}>{entry.title}{entry.stages.every((_, index) => answers[`${entry.id}:${index}`] !== undefined) ? " · abgeschlossen" : ""}</option>)}</optgroup>;
        })}</select></label>
        {matches.length === 0 && <p>Kein passender Fall. Versuche einen anderen Begriff oder <button className={styles.secondary} type="button" onClick={() => setQuery("")}>Suche zurücksetzen</button></p>}
        {navigationError && <p className={styles.wrong} role="alert">{navigationError}</p>}
        <p>{answeredCount} von {observationQuestionCount} Entscheidungen beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={observationQuestionCount} aria-label="Beantwortete Entscheidungen" />
        {answeredCount > 0 && <section><h3>Die Lernrunde wiederholen</h3><p>Die Ergebnisse gelten nur für diese Runde in diesem Fenster. Bestehende Kursfortschritte werden dadurch nicht verändert.</p><button className={styles.secondary} type="button" onClick={reset}>Alle acht Fälle neu beginnen</button></section>}
      </div>
    </PageMenu>
    <div id="beobachtung-inhalt">
      {item ? <section className={styles.panel} aria-labelledby="beobachtung-fall"><div className={styles.tags}>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h2 id="beobachtung-fall" ref={content} tabIndex={-1}>{item.title}</h2><p className={styles.note}>Du erhältst zunächst nur einen Ausschnitt. Beantworte die Frage, lies die Erklärung und decke anschließend die nächste Information auf. Die Fälle sind ausdrücklich konstruierte Lernbeispiele. Bei einem echten Notfall hat die zuständige Fachhilfe Vorrang.</p><p className={styles.muted}>Information {stageIndex + 1} von {item.stages.length}</p><ol className={mediaStyles.evidence}>{item.stages.slice(0, stageIndex + 1).map((entry, index) => <li key={entry.evidence}><strong>Information {index + 1}</strong>{entry.evidence}</li>)}</ol><h3>{stage.question}</h3><div className={styles.choices}>{stage.choices.map((choice, index) => <button type="button" key={choice} disabled={selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === stage.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => submit(index)}>{choice}</button>)}</div>
        {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === stage.answer ? "Richtig beurteilt." : `Richtig ist: ${stage.choices[stage.answer]}`}</strong><p>{stage.explanation}</p></div>}
        <div className={styles.actions}><button className={styles.secondary} type="button" disabled={stageIndex === 0} onClick={goBack}>Vorige Information</button>{stageIndex < item.stages.length - 1 && <button className={styles.primary} type="button" disabled={selected === undefined} onClick={revealNext}>Nächste Information aufdecken</button>}{caseFinished && <Link className={styles.secondary} href={item.course}>Das Thema vertiefen</Link>}</div>
        {caseFinished && stageIndex === item.stages.length - 1 && <div className={styles.note} role="status"><strong>Fall abgeschlossen.</strong><p>Du hast gesehen, welche neuen Informationen die Beurteilung ändern. Wähle unten im Menü einen weiteren Fall.</p></div>}
        <details className={styles.sources}><summary>Fachliche Grundlage dieses Falls</summary><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Geprüft am 4. Oktober 2026. Allgemeine Lernfälle für den deutschsprachigen Raum. Konkrete örtliche Pflichten und zulässige Technik prüfst du im <Link href="/jagdrecht">Rechtsbereich</Link>.</p></details>
      </section> : <p className={styles.note}>{ready ? "Dieser Lernfall ist nicht verfügbar. Wähle einen Fall unten im Menü." : "Die Lernfälle werden vorbereitet."}</p>}
    </div>
  </LearningToolLayout>;
}
