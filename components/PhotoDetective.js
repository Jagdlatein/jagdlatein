import { answerOrder, newAnswerSeed } from "../lib/answer-order";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { LearningPhotoCredit } from "./LearningPhoto";
import { photoDetectiveRounds, getPhotoDetectiveSummary } from "../lib/photo-detective";
import { photoDetectiveRoute, photoDetectiveTarget, photoDetectiveFocusIntent } from "../lib/photo-detective-navigation";
import experienceStyles from "../styles/LearningExperience.module.css";
import styles from "../styles/PhotoDetective.module.css";

const wrongFeedback = (round, choice) => round.wrong[choice] || "Vergleiche die sichtbaren Merkmale mit der Erklärung zum Foto.";

function PhotoEvidence({ round, revealed, activeTrait, onTrait }) {
  const trait = revealed && activeTrait !== null ? round.traits[activeTrait] : null;
  const railX = ((activeTrait + .5) / round.traits.length) * 100;
  return <figure className={styles.figure}>
    <div className={styles.photoFrame}>
      <div className={styles.photo} style={{ maxWidth: round.photo.width }}>
        <div className={styles.imagePlane}>
          <Image src={round.photo.src} alt={revealed ? round.photo.alt : round.neutralAlt} width={round.photo.width} height={round.photo.height} sizes="(max-width: 600px) 88vw, 760px" loading="eager" />
          {trait && <><svg className={styles.leader} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><line x1={trait.x} y1={trait.y} x2={railX} y2="100" vectorEffect="non-scaling-stroke" /></svg><span className={styles.locator} style={{ left: `${trait.x}%`, top: `${trait.y}%` }} aria-hidden="true" /></>}
        </div>
        {revealed && <div className={styles.markerRail} style={{ gridTemplateColumns: `repeat(${round.traits.length}, minmax(0, 1fr))` }} role="group" aria-label="Bildmerkmal auswählen">{round.traits.map((item, index) => <button key={item.title} type="button" className={[styles.marker, index === activeTrait ? styles.markerActive : ""].join(" ")} aria-label={`Merkmal ${index + 1}: ${item.title}`} aria-pressed={index === activeTrait} aria-controls="photo-trait-detail" onClick={() => onTrait(index)}>{index + 1}</button>)}</div>}
      </div>
    </div>
    <figcaption><LearningPhotoCredit media={round.photo} /></figcaption>
  </figure>;
}

function EvidenceDetails({ round, activeTrait, onTrait }) {
  return <section className={styles.evidence} aria-label="Sichtbare Merkmale">
    <h3>Am Foto entdecken</h3>
    <p>Tippe auf eine Zahl unter dem Foto oder wähle das Merkmal hier. Nochmals auf dieselbe Zahl tippen blendet den Hinweis aus.</p>
    <div className={styles.traitButtons}>{round.traits.map((trait, index) => <button key={trait.title} type="button" aria-pressed={index === activeTrait} aria-controls="photo-trait-detail" className={index === activeTrait ? styles.traitSelected : ""} onClick={() => onTrait(index)}><span>{index + 1}</span>{trait.title}</button>)}</div>
    <div id="photo-trait-detail" className={styles.traitDetail} aria-live="polite"><strong>{round.traits[activeTrait].title}</strong><p>{round.traits[activeTrait].text}</p></div>
  </section>;
}

function FurtherLearning({ round }) {
  return <div className={styles.further}>
    <p><strong>Was das Foto offenlässt:</strong> {round.limit}</p>
    <Link href={`/kurse/${round.course}`} className={styles.courseLink}><AppIcon name="book" size={18} />Im passenden Kurs vertiefen<AppIcon name="arrow-right" size={18} /></Link>
  </div>;
}

function PhotoSources({ rounds }) {
  return <details className={styles.sources}><summary>Fachquellen zur Erklärung</summary>{rounds.map(round => <section key={round.id} aria-label={`Fachquellen: ${round.name}`}><h3>{round.name}</h3><ul>{round.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></section>)}</details>;
}

export default function PhotoDetective() {
  const router = useRouter(), route = photoDetectiveRoute(router), { ready, selection } = route;
  const view = useRef(null);
  if (!view.current || view.current.key !== route.origin) view.current = { key: route.origin };
  const origin = view.current, mounted = useRef(false), navigation = useRef(0), pending = useRef(null), focusIntent = useRef(null), top = useRef(null), lastFocus = useRef(null);
  const [working, setWorking] = useState(false), [navigationError, setNavigationError] = useState("");
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const mode = selection.view === "merkmale" ? "explore" : "quiz";
  const [roundIds, setRoundIds] = useState(photoDetectiveRounds.map(round => round.id));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [hint, setHint] = useState(false);
  const [feature, setFeature] = useState(null);
  const [finished, setFinished] = useState(false);
  const [practice, setPractice] = useState(false);
  const [answerSeed, setAnswerSeed] = useState(0);
  const nextGuard = useRef(null);
  const hintGuard = useRef(false);
  const attemptGuard = useRef(0);
  const quizRoundGuard = useRef(null);
  const exploredThisRound = useRef(new Set());
  const rounds = roundIds.map(id => photoDetectiveRounds.find(round => round.id === id));
  const round = !ready || !selection.valid ? null : mode === "explore" ? photoDetectiveRounds.find(item => item.id === selection.art) : rounds[index];
  const attempt = attemptGuard.current;
  quizRoundGuard.current = rounds[index].id;
  const answer = round ? answers[round.id] : null;
  const featureKey = JSON.stringify([mode, round?.id, attempt]);
  const activeTrait = feature?.key === featureKey ? feature.index : 0;
  const visibleTrait = feature?.key === featureKey ? feature.visible : null;
  const summary = getPhotoDetectiveSummary(rounds, answers);
  const revealed = mode === "explore" || Boolean(answer) || hint;
  const sourceRounds = !round ? [] : mode === "explore" ? [round] : finished ? rounds : answer ? [round] : [];
  const sourceScope = JSON.stringify([mode, mode === "quiz" && finished ? "result" : "photo", attempt, sourceRounds.map(item => item.id)]);

  function current() {
    if (!mounted.current || view.current !== origin) return false;
    if (!ready || photoDetectiveRoute(router).origin !== route.origin) { view.current = null; return false; }
    return true;
  }
  function currentRound() {
    return current() && selection.valid && Boolean(round) && attemptGuard.current === attempt
      && (mode === "explore" || quizRoundGuard.current === round.id);
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pending.current = null; focusIntent.current = null; };
  }, []);
  useEffect(() => {
    const live = photoDetectiveRoute(router), marker = focusIntent.current;
    const transition = marker && ["path", "query", "browser"].every(key => live.scope[key] === marker.source[key] || live.scope[key] === marker.target[key]);
    if (marker && !transition) focusIntent.current = null;
    if (pending.current && (pending.current.origin !== origin || live.origin !== route.origin)) { pending.current = null; navigation.current++; setWorking(false); }
    if (!current()) return;
    const ownCommit = selection.valid && focusIntent.current && ["path", "query", "browser"].every(key => live.scope[key] === focusIntent.current.target[key]);
    if (ownCommit) focusIntent.current = null;
    setNavigationError("");
    const key = JSON.stringify(selection);
    if ((lastFocus.current !== key || ownCommit) && current()) { lastFocus.current = key; focusSelection(top.current); }
    if (round) { if (current()) closePageMenu(); return; }
    const timer = setTimeout(() => { if (current()) openPageMenu("photo-detective-selection"); }, 0);
    return () => clearTimeout(timer);
  }, [route.origin]);
  useEffect(() => {
    // Only a committed, still-current visible photograph supplies help. URL
    // requests, hidden native handlers and failed navigation cannot do so.
    if (currentRound() && mode === "explore") exploredThisRound.current.add(round.id);
  }, [route.origin]);

  async function selectView(nextView, art = null) {
    if (!current()) return false;
    const target = photoDetectiveTarget(router, nextView, art);
    if (!target) return false;
    cancelSelectionFocus(); focusIntent.current = null; setNavigationError("");
    if (pending.current === null && selection.valid && selection.view === nextView && selection.art === art) {
      if (round) { closePageMenu(); focusSelection(top.current); } else openPageMenu("photo-detective-selection");
      return true;
    }
    const marker = photoDetectiveFocusIntent(router, target), ticket = ++navigation.current;
    const operation = { origin, ticket, target }; pending.current = operation; focusIntent.current = marker; setWorking(true);
    let finished = false;
    const owns = () => current() && pending.current === operation && navigation.current === ticket;
    const fail = () => {
      if (!owns()) return;
      setNavigationError("Die Fotoauswahl konnte nicht geöffnet werden. Bitte wähle sie erneut.");
      openPageMenu("photo-detective-selection");
    };
    try {
      const accepted = await router.push(target, undefined, { shallow: true, scroll: false });
      if (accepted === false) { finished = true; fail(); return false; }
      // The router/browser commit, rather than this promise, owns the content.
      return true;
    } catch (error) { finished = true; if (!error?.cancelled) fail(); return false; }
    finally {
      if (finished && focusIntent.current === marker) focusIntent.current = null;
      if (finished && owns()) { pending.current = null; setWorking(false); }
    }
  }

  function start(ids = photoDetectiveRounds.map(item => item.id), isPractice = false) {
    if (!currentRound() || mode !== "quiz" || !Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(id => !photoDetectiveRounds.some(item => item.id === id))) return;
    setAnswerSeed(seed => newAnswerSeed(seed));
    attemptGuard.current += 1;
    nextGuard.current = null;
    hintGuard.current = false;
    exploredThisRound.current.clear();
    setRoundIds(ids); setIndex(0); setAnswers({}); setHint(false); setFeature(null); setFinished(false); setPractice(isPractice);
  }
  function choose(choice) {
    if (!currentRound() || mode !== "quiz" || finished || !round.options.includes(choice) || answer) return;
    const assisted = hint || hintGuard.current || exploredThisRound.current.has(round.id);
    setAnswers(previous => previous[round.id] ? previous : ({ ...previous, [round.id]: { choice, assisted } }));
    setFeature(null);
  }
  function next() {
    if (!currentRound() || mode !== "quiz" || finished || !answer || nextGuard.current === round.id) return;
    nextGuard.current = round.id;
    if (index + 1 === rounds.length) setFinished(true);
    else { setIndex(index + 1); setHint(false); hintGuard.current = false; setFeature(null); }
  }
  function showHint() {
    if (!currentRound() || mode !== "quiz" || finished || answer) return;
    hintGuard.current = true; setHint(true); setFeature(null);
  }
  function changeMode(nextMode) {
    if (!current() || !["quiz", "explore"].includes(nextMode)) return;
    selectView(nextMode === "explore" ? "merkmale" : "quiz", nextMode === "explore" && mode === "explore" ? selection.art : null);
  }
  function changeExplore(id) {
    if (!current() || selection.view !== "merkmale" || !photoDetectiveRounds.some(item => item.id === id)) return;
    selectView("merkmale", id);
  }
  function togglePhotoTrait(traitIndex) {
    if (!currentRound() || !revealed || !Number.isInteger(traitIndex) || !round.traits[traitIndex]) return;
    setFeature(previous => ({ key: featureKey, index: traitIndex, visible: previous?.key === featureKey && previous.visible === traitIndex ? null : traitIndex }));
  }
  function selectTrait(traitIndex) {
    if (!currentRound() || !revealed || !Number.isInteger(traitIndex) || !round.traits[traitIndex]) return;
    setFeature({ key: featureKey, index: traitIndex, visible: traitIndex });
  }

  return <LearningToolLayout title="Fotodetektiv" description="Erkenne Wildarten an echten Fotos und entdecke die sichtbaren Merkmale. Jede Antwort wird erklärt." icon="camera" category="wildkunde" headingOnly>
    <PageMenu title="Fotoauswahl" openInitially={ready && !round} initialFocusId="photo-detective-selection">
      <section id="photo-detective-selection" tabIndex={-1}>
        <MenuChoice label="Lernweise" id="photo-detective-view" value={selection.view || ""} disabled={!ready} aria-controls="fotodetektiv-title" onChange={event => changeMode(event.target.value === "merkmale" ? "explore" : event.target.value)}>
          {!selection.view && <option value="" disabled>Lernweise wählen</option>}<option value="quiz">Quiz</option><option value="merkmale">Merkmale</option>
        </MenuChoice>
        {selection.view === "merkmale" && <MenuChoice label="Wildart" id="photo-detective-species" value={selection.art || ""} disabled={!ready} aria-controls="photo-question-heading" onChange={event => changeExplore(event.target.value)}>
          <option value="" disabled>Wildart wählen</option>{photoDetectiveRounds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </MenuChoice>}
        {navigationError && <p role="alert" className={experienceStyles.wrong}>{navigationError}</p>}
      </section>
    </PageMenu>
    <div id="fotodetektiv-title" tabIndex={-1} ref={top} aria-busy={working}>
    {!round ? <section className={styles.card}><h2>Foto auswählen</h2><p role={!ready ? "status" : undefined}>{!ready ? "Deine Fotoauswahl wird geladen …" : selection.valid ? "Wähle eine Wildart unten im Menü." : "Diese Fotoauswahl ist nicht verfügbar. Wähle Lernweise und Wildart unten im Menü."}</p></section> : mode === "quiz" && finished ? <section className={styles.card} aria-labelledby="photo-result-heading">
      <p className={styles.eyebrow}>{practice ? "Deine Wiederholung" : "Deine Fotorunde"}</p><h2 id="photo-result-heading">{summary.correct} von {rounds.length} Arten richtig erkannt</h2>
      <div className={styles.resultStats}><span><strong>{summary.independent}</strong> ohne Merkmals-Hilfe</span><span><strong>{summary.assisted}</strong> mit Merkmals-Hilfe</span><span><strong>{rounds.length - summary.correct}</strong> noch zu üben</span></div>
      <p>Die Auswertung gilt für diese Fotorunde. Wiederhole unsichere Arten gezielt und versuche es beim nächsten Mal ohne Merkmals-Hilfe.</p>
      <div className={styles.actions}><button type="button" className={experienceStyles.primary} onClick={() => start()}>Alle Fotos neu üben</button>{summary.retryIds.length > 0 && <button type="button" className={experienceStyles.secondary} onClick={() => start(summary.retryIds, true)}>Fehler und Hilfefragen wiederholen ({summary.retryIds.length})</button>}</div>
      <h3>Deine Antworten nachlesen</h3>
      <div className={styles.reviewList}>{rounds.map(item => { const result = answers[item.id]; return <details key={item.id}><summary>{item.name} · {result.choice === item.name ? result.assisted ? "richtig mit Hilfe" : "richtig" : `deine Antwort: ${result.choice}`}</summary><p>{item.explanation}</p>{result.choice !== item.name && <p>{wrongFeedback(item, result.choice)}</p>}<Link href={`/kurse/${item.course}`}>Passenden Kurs öffnen</Link></details>; })}</div>
    </section> : <section className={styles.card} aria-labelledby="photo-question-heading">
      {mode === "explore" ? <h2 id="photo-question-heading">{round.name}: Merkmale im Bild</h2> : <><div className={styles.progressLabel}><span>{practice ? "Wiederholung" : "Fotorunde"} · Foto {index + 1} von {rounds.length}</span><span>{summary.independent} richtig ohne Hilfe</span></div><progress className={styles.progress} max={rounds.length} value={summary.completed} aria-label="Beantwortete Fotos" /><h2 id="photo-question-heading">Welche Wildart zeigt das Foto?</h2></>}
      <PhotoEvidence key={round.id} round={round} revealed={revealed} activeTrait={visibleTrait} onTrait={togglePhotoTrait} />
      {mode === "quiz" && <><div className={styles.answerGrid} role="group" aria-label="Art auswählen">{answerOrder(round.options, round.id, answerSeed).map(index => { const choice = round.options[index]; return <button key={choice} type="button" disabled={Boolean(answer)} className={[styles.answer, answer && choice === round.name ? styles.correctAnswer : "", answer && choice === answer.choice && choice !== round.name ? styles.wrongAnswer : ""].filter(Boolean).join(" ")} onClick={() => choose(choice)}>{choice}{answer && choice === round.name && <span>Richtig</span>}{answer && choice === answer.choice && choice !== round.name && <span>Deine Antwort</span>}</button>; })}</div>{!answer && <button type="button" className={styles.hintButton} aria-expanded={hint} onClick={showHint} disabled={hint}>{hint ? "Merkmals-Hilfe aktiv – diese Antwort wird als unterstützt gezählt" : "Merkmale als Hilfe anzeigen"}</button>}</>}
      {answer && mode === "quiz" && <div className={[styles.feedback, answer.choice === round.name ? styles.feedbackCorrect : styles.feedbackWrong].join(" ")} role="status"><h3>{answer.choice === round.name ? "Richtig erkannt" : `Das ist ${round.name}`}</h3>{answer.choice !== round.name && <p><strong>Du hast {answer.choice} gewählt.</strong> {wrongFeedback(round, answer.choice)}</p>}<p>{round.explanation}</p>{answer.assisted && <small>Mit Merkmals-Hilfe beantwortet.{exploredThisRound.current.has(round.id) && " Die Art wurde in dieser Runde bereits nachgeschlagen."}</small>}</div>}
      {mode === "explore" && <p className={styles.explanation}>{round.explanation}</p>}
      {revealed && <EvidenceDetails round={round} activeTrait={activeTrait} onTrait={selectTrait} />}
      {(mode === "explore" || answer) && <FurtherLearning round={round} />}
      {mode === "quiz" && answer && <div className={styles.actions}><button type="button" className={experienceStyles.primary} onClick={next}>{index + 1 === rounds.length ? "Auswertung ansehen" : "Nächstes Foto"}<AppIcon name="arrow-right" size={18} /></button></div>}
    </section>}
    </div>
    <aside className={styles.observation}><AppIcon name="binoculars" size={24} /><p><strong>Genau hinsehen, Unsicherheit erkennen.</strong> Vergleiche mehrere Merkmale. Ein Foto liefert nur einen Ausschnitt; die Artbestimmung ersetzt keine vollständige Ansprache im Revier.</p></aside>
    {sourceRounds.length > 0 && <PhotoSources key={sourceScope} rounds={sourceRounds} />}
  </LearningToolLayout>;
}
