import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import AppIcon from "./AppIcon";
import { duellRoute } from "../lib/revierduell-navigation";
import { DUELL_QUESTION_COUNT, DUELL_QUESTION_MS, DUELL_HIGHSCORE_KEY, createDuellSeed, createDuellState, duellReducer, duellRemainingMs, duellRank, compareDuellTarget, duellChallengeUrl, parseDuellHighscore, isDuellScore, normaliseDuellTopic } from "../lib/revierduell";
import { emitDuellAnalytics } from "../lib/revierduell-analytics";
import { usagePreferenceClient } from "../lib/usage-analytics";
import styles from "../styles/RevierDuell.module.css";

const clock = () => typeof performance !== "undefined" ? performance.now() : NaN;
const number = value => new Intl.NumberFormat("de-CH").format(value);
function ownedReducer(state, event) { return event.isCurrent && !event.isCurrent() ? state : duellReducer(state, event); }
const reviewDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-").reverse().join(".") : "nicht angegeben";
const lessonLink = value => typeof value === "string" && /^\/kurse\/[a-z0-9-]+#lesson-[a-zA-Z0-9%_-]+$/.test(value) ? value : null;

function Sources({ questions }) {
  return <details className={styles.sources} id="revierduell-quellen"><summary>Quellen und übernommener Prüfstand</summary>
    <p>Die Fragen stammen aus den bestehenden Lerninhalten. Die Auswahl ist keine neue vollständige Fachprüfung.</p>
    {questions.map(question => <section key={question.id}><h3>{question.prompt}</h3><p>{question.sourceScope === "lesson" ? "Nachweise der zugeordneten Lektion." : "Nachweise aus dem Kurs; keine zusätzliche Einzelzuordnung jeder Quelle zu dieser Frage."} Übernommener Prüfstand: <time dateTime={question.reviewedOn}>{reviewDate(question.reviewedOn)}</time>.</p>
      <ul>{(question.sources || []).filter(source => /^https:\/\//.test(source.url || "")).map((source, index) => <li key={`${question.id}:${source.id || source.url}:${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
    </section>)}
  </details>;
}

function TopicSelect({ topic, topics = [], disabled, onChange }) {
  const available = topics.filter(item => item && normaliseDuellTopic(item.slug) && typeof item.title === "string" && Number.isSafeInteger(item.count) && item.count >= 0);
  const count = topic ? available.find(item => item.slug === topic)?.count : available.reduce((sum, item) => sum + item.count, 0);
  return <div className={styles.topicField}><label htmlFor="revierduell-topic">Thema</label><select id="revierduell-topic" value={topic || ""} disabled={disabled} onChange={event => onChange(event.target.value)} aria-describedby="revierduell-topic-count">
    <option value="">Gemischt</option>{available.map(item => <option key={item.slug} value={item.slug} disabled={item.count < DUELL_QUESTION_COUNT}>{item.title}</option>)}
  </select><p className={styles.small} id="revierduell-topic-count">{Number.isSafeInteger(count) ? `${number(count)} Fragen verfügbar · 7 je Runde` : "Wähle ein Thema für deine nächste Runde."}</p></div>;
}

function DuellRound({ seed, revision, target, topic = null, topics = [], questions, analyticsEnabled, ownerIdentity, ownerCurrent, navigationBusy, navigationPending, onNewRound, onTopicChange }) {
  const [state, dispatch] = useReducer(ownedReducer, questions, createDuellState);
  const [now, setNow] = useState(0), [best, setBest] = useState(null), [storageUnavailable, setStorageUnavailable] = useState(false);
  const [shareNotice, setShareNotice] = useState(""), [shareBusy, setShareBusy] = useState(false), [manualUrl, setManualUrl] = useState("");
  const mounted = useRef(false), currentState = useRef(state), sharing = useRef(null), serial = useRef(0);
  const viewPhase = useRef(null), seenEvents = useRef(new Set()), savedResults = useRef(new WeakSet());
  const readyHeading = useRef(null), questionHeading = useRef(null), feedbackHeading = useRef(null), resultHeading = useRef(null);
  currentState.current = state;
  const context = () => mounted.current && ownerCurrent();
  const current = captured => context() && currentState.current === captured;
  const canAct = captured => current(captured) && !navigationPending() && sharing.current === null;
  const question = state.questions[state.index], answer = state.answers[state.index];
  const remaining = duellRemainingMs(state, now);
  const validTarget = isDuellScore(target) ? target : null;

  function emit(name, captured) {
    if (analyticsEnabled !== true || !current(captured)) return false;
    const consent = usagePreferenceClient.getSnapshot();
    if (!consent.known || !consent.enabled || !consent.accountKey || usagePreferenceClient.isBlocked()) return false;
    return emitDuellAnalytics(name, { enabled: true, isCurrent: () => {
      const live = usagePreferenceClient.getSnapshot();
      return current(captured) && live.enabled === true && live.accountKey === consent.accountKey && live.consentVersion === consent.consentVersion && !usagePreferenceClient.isBlocked();
    } });
  }
  function send(type, extra = {}) {
    const captured = state;
    if (!canAct(captured)) return;
    const time = clock();
    if (!Number.isFinite(time)) { setShareNotice("Die Zeitmessung ist hier nicht verfügbar. Bitte lade die Seite erneut."); return; }
    setNow(time);
    dispatch({ type, generation: captured.generation, index: captured.index, now: time, ...extra, isCurrent: () => canAct(captured) });
  }

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sharing.current = null; serial.current++; }; }, []);
  useEffect(() => {
    const announce = () => {
      const consent = usagePreferenceClient.getSnapshot();
      if (!context() || !consent.known || !consent.enabled || !consent.accountKey || usagePreferenceClient.isBlocked()) { viewPhase.current = null; return; }
      const key = JSON.stringify([consent.accountKey, consent.consentVersion]);
      if (viewPhase.current?.owner !== ownerIdentity || viewPhase.current?.key !== key) viewPhase.current = { owner: ownerIdentity, key, emitted: false };
      if (!viewPhase.current.emitted && emit("revierduell_view", currentState.current)) viewPhase.current.emitted = true;
    };
    announce(); return usagePreferenceClient.subscribe(announce);
  }, [ownerIdentity, analyticsEnabled]);
  useEffect(() => {
    if (!current(state)) return;
    const events = [];
    if (state.phase === "asking") {
      if (state.index === 0 && state.answers.length === 0) events.push([`start:${state.generation}`, "revierduell_start"]);
      events.push([`question:${state.generation}:${state.index}`, "revierduell_question_view"]);
    } else if (state.phase === "feedback") events.push([`answer:${state.generation}:${state.index}`, "revierduell_answer"]);
    else if (state.phase === "finished") events.push([`complete:${state.generation}`, "revierduell_complete"]);
    for (const [key, name] of events) if (!seenEvents.current.has(key)) { seenEvents.current.add(key); emit(name, state); }
  }, [state, ownerCurrent, analyticsEnabled]);
  useEffect(() => {
    if (!context()) return;
    try { const value = parseDuellHighscore(window.localStorage.getItem(DUELL_HIGHSCORE_KEY)); if (context()) setBest(value); }
    catch { if (context()) setStorageUnavailable(true); }
  }, [ownerCurrent]);
  useEffect(() => {
    if (state.phase !== "finished" || !current(state) || savedResults.current.has(state)) return;
    savedResults.current.add(state);
    try {
      const previous = parseDuellHighscore(window.localStorage.getItem(DUELL_HIGHSCORE_KEY));
      if (!current(state)) return;
      const value = Math.max(previous || 0, state.score);
      if (previous === null || value > previous) window.localStorage.setItem(DUELL_HIGHSCORE_KEY, String(value));
      if (current(state)) setBest(value);
    } catch { if (current(state)) setStorageUnavailable(true); }
  }, [state, ownerCurrent]);
  useEffect(() => {
    sharing.current = null; serial.current++; setShareBusy(false); setShareNotice(""); setManualUrl("");
  }, [ownerCurrent, state.generation]);
  useEffect(() => {
    if (state.phase !== "asking" || !current(state)) return;
    const captured = state;
    const update = () => {
      if (!canAct(captured)) return;
      const time = clock(); if (!Number.isFinite(time)) return;
      setNow(time);
      if (time >= captured.deadline) dispatch({ type: "timeout", generation: captured.generation, index: captured.index, now: time, isCurrent: () => canAct(captured) });
    };
    update(); const timer = setInterval(update, 250);
    window.addEventListener("focus", update); document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, [state, ownerCurrent, navigationBusy]);
  useEffect(() => {
    const handler = event => {
      if (!canAct(state) || event.repeat || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target, editing = target?.closest?.('input,textarea,select,[contenteditable="true"]');
      if (editing || target?.isContentEditable) return;
      if (target?.closest?.('[role="dialog"],dialog') || target?.closest?.('a,button,summary') && !target?.closest?.('[data-duell-play]')) return;
      if (state.phase === "asking" && /^[1-4]$/.test(event.key)) { event.preventDefault(); send("answer", { optionId: question.options[Number(event.key) - 1].id }); }
      else if (state.phase === "feedback" && event.key === "Enter" && !target?.closest?.("a,button,summary")) { event.preventDefault(); send("next"); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [state, ownerCurrent, navigationBusy]);
  useEffect(() => {
    if (!current(state)) return;
    const node = state.phase === "ready" ? readyHeading.current : state.phase === "asking" ? questionHeading.current : state.phase === "feedback" ? feedbackHeading.current : state.phase === "finished" ? resultHeading.current : null;
    if (node) {
      if (state.phase === "ready") { node.focus({ preventScroll: true }); window.scrollTo?.({ top: 0, left: 0, behavior: "auto" }); }
      else { node.focus(); node.scrollIntoView?.({ block: "start", behavior: "auto" }); }
    }
  }, [state.phase, state.index, state.generation, ownerCurrent]);

  async function share(copyOnly = false) {
    const captured = state;
    if (!canAct(captured) || captured.phase !== "finished" || sharing.current) return;
    const url = duellChallengeUrl({ seed, score: captured.score, revision, topic }), ticket = { serial: ++serial.current };
    sharing.current = ticket; setShareBusy(true); setShareNotice(""); setManualUrl(url);
    const stillCurrent = () => current(captured) && !navigationPending() && sharing.current === ticket;
    try {
      if (!copyOnly && typeof navigator.share === "function") {
        await navigator.share({ title: "Jagdlatein Revierduell", text: `Schaffst du mehr als ${number(captured.score)} Punkte?`, url });
        if (stillCurrent()) { setShareNotice("Challenge geteilt."); emit("revierduell_share", captured); }
      } else {
        if (typeof navigator.clipboard?.writeText !== "function") { if (stillCurrent()) setShareNotice("Kopiere den Link aus dem Feld."); return; }
        await navigator.clipboard.writeText(url);
        if (stillCurrent()) { setShareNotice("Challenge-Link kopiert."); emit("revierduell_copy", captured); }
      }
    } catch (error) {
      if (stillCurrent()) setShareNotice(error?.name === "AbortError" ? "Teilen abgebrochen." : "Der Link konnte nicht geteilt werden. Du kannst ihn unten kopieren.");
    } finally { if (stillCurrent()) { sharing.current = null; setShareBusy(false); } }
  }

  return <>
    {state.phase === "ready" ? <section className={styles.card} aria-labelledby="revierduell-intro"><p className={styles.kicker}>Eine kleine Runde Jagdwissen</p><h2 id="revierduell-intro" tabIndex={-1} ref={readyHeading}>Sieben Fragen. Deine Spur zählt.</h2><p>Du hast 12 Sekunden je Frage. Nach jeder Antwort kannst du die Erklärung in Ruhe lesen.</p>
      <TopicSelect topic={topic} topics={topics} disabled={navigationBusy} onChange={value => { if (canAct(state) && state.phase === "ready") onTopicChange(value); }} />
      <ul className={styles.facts}><li><strong>7</strong> Fragen</li><li><strong>12 s</strong> je Frage</li><li><strong>4</strong> Antworten</li></ul>
      {validTarget !== null && <p className={styles.challenge} data-duell-target>Deine Challenge: <strong>{number(validTarget)} Punkte</strong> schlagen. Die geteilte Punktzahl ist unverbindlich.</p>}
      <p className={styles.small}>Richtig: 500 Punkte, dazu 35 pro voller Restsekunde und 90 je vorheriger richtiger Antwort in Serie. Falsch oder Zeitablauf beendet die Serie.</p>
      <button type="button" className={styles.primary} onClick={() => send("start")} disabled={navigationBusy}>Duell starten<AppIcon name="arrow-right" size={20} /></button>
      {best !== null && <p className={styles.small}>Dein Bestwert auf diesem Gerät: <strong>{number(best)} Punkte</strong></p>}
    </section> : state.phase === "finished" ? <section className={styles.card} aria-labelledby="revierduell-result"><p className={styles.kicker}>Dein Ergebnis</p><h2 id="revierduell-result" tabIndex={-1} ref={resultHeading}>{duellRank(state.correctCount).label}</h2><p className={styles.score}>{number(state.score)} <span>Punkte</span></p><p><strong>{state.correctCount} von {DUELL_QUESTION_COUNT}</strong> Antworten richtig. Dein Spielrang beschreibt nur diese Runde, keine Prüfungsreife.</p>
      <TopicSelect topic={topic} topics={topics} disabled={navigationBusy || shareBusy} onChange={value => { if (canAct(state) && state.phase === "finished") onTopicChange(value); }} />
      {validTarget !== null && <p className={styles.challenge} role="status">{compareDuellTarget(state.score, validTarget) === "won" ? "Challenge gewonnen!" : compareDuellTarget(state.score, validTarget) === "tied" ? "Punktgleich!" : "Challenge-Ziel verfehlt."} Ziel: {number(validTarget)} Punkte. Der Vergleich ist unverbindlich.</p>}
      {best !== null && <p>Bestwert auf diesem Gerät: <strong>{number(best)} Punkte</strong></p>}
      <div className={styles.actions}><button type="button" className={styles.primary} disabled={shareBusy || navigationBusy} onClick={() => share(false)}>Challenge teilen</button><button type="button" className={styles.secondary} disabled={shareBusy || navigationBusy} onClick={() => share(true)}>Link kopieren</button></div>
      {manualUrl && <label className={styles.linkField}>Dein Challenge-Link<input type="text" readOnly value={manualUrl} onFocus={event => event.target.select()} /></label>}
      <p role="status" className={styles.small}>{shareNotice}</p>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={navigationBusy || shareBusy} onClick={() => { if (canAct(state) && state.phase === "finished") onNewRound(); }}>{navigationBusy ? "Neue Runde wird geladen …" : "Neue Runde"}</button><button type="button" className={styles.textButton} disabled={navigationBusy || shareBusy} onClick={() => send("restart")}>Diese Runde nochmals</button></div>
      <Link href="/quiz-app" prefetch={false} className={styles.quizLink}>Im vollständigen Quiz weiterlernen<AppIcon name="arrow-right" size={20} /></Link>
      <p className={styles.small}>Das vollständige Quiz behält seine Anmeldung und Zugangsregeln. Duellpunkte zählen nicht zur offiziellen Rangliste.</p>
    </section> : <section className={styles.card} data-duell-play aria-labelledby="revierduell-question"><div className={styles.roundInfo}><p>Frage {state.index + 1} von {DUELL_QUESTION_COUNT}</p><p><strong>{number(state.score)}</strong> Punkte · Serie {state.streak}</p></div><progress className={styles.roundProgress} max={DUELL_QUESTION_COUNT} value={state.index + (state.phase === "feedback" ? 1 : 0)} aria-label="Bearbeitete Fragen" />
      <p className={styles.context}>{question.courseTitle}</p><h2 id="revierduell-question" tabIndex={-1} ref={questionHeading}>{question.prompt}</h2>
      {state.phase === "asking" ? <div className={styles.timer}><span role="timer" aria-live="off" aria-label={`Noch ${Math.ceil(remaining / 1000)} Sekunden`}>{Math.ceil(remaining / 1000)} s</span><progress max={DUELL_QUESTION_MS} value={remaining} aria-label="Verbleibende Antwortzeit" /></div> : <p className={styles.small}>Antwortzeit beendet · Erklärung in Ruhe lesen</p>}
      <p className={styles.small}>Eine Antwort ist richtig. Tastatur: 1 bis 4, danach Enter für weiter.</p><div className={styles.options} role="group" aria-label="Eine Antwort wählen">{question.options.map((option, index) => { const right = answer && question.correctIds.includes(option.id), chosen = answer?.selectedId === option.id; return <button type="button" key={option.id} disabled={state.phase !== "asking" || navigationBusy} className={`${styles.option}${right ? ` ${styles.correct}` : chosen ? ` ${styles.wrong}` : ""}`} onClick={() => send("answer", { optionId: option.id })}><span className={styles.optionNumber} aria-hidden="true">{index + 1}</span><span>{option.text}{right && <strong>{chosen ? "Deine richtige Antwort" : "Richtige Antwort"}</strong>}{chosen && !right && <strong>Deine Antwort</strong>}</span></button>; })}</div>
      {state.phase === "feedback" && <div className={styles.feedback}><h3 tabIndex={-1} ref={feedbackHeading} role="status">{answer.timedOut ? "Zeit abgelaufen." : answer.correct ? "Richtig!" : "Die richtige Antwort ist markiert."}</h3><p>{question.explanation}</p><p><strong>+{number(answer.points)} Punkte</strong>{answer.timedOut ? " · Keine Antwort innerhalb der 12 Sekunden." : ""}</p>{lessonLink(question.href) && <Link href={question.href} prefetch={false} onClick={event => { if (!canAct(state)) event.preventDefault(); }}>In der passenden Lektion weiterlernen</Link>}<button type="button" className={styles.primary} disabled={navigationBusy} onClick={() => send("next")}>{state.index + 1 === DUELL_QUESTION_COUNT ? "Ergebnis ansehen" : "Nächste Frage"}<AppIcon name="arrow-right" size={20} /></button></div>}
    </section>}
    {storageUnavailable && <p className={styles.small} role="status">Dein Bestwert ist hier nicht dauerhaft verfügbar. Du kannst trotzdem spielen.</p>}
    {state.phase !== "finished" && shareNotice && <p role="status" className={styles.small}>{shareNotice}</p>}
    {state.phase === "finished" && <Sources questions={state.questions} />}
  </>;
}

export default function RevierDuell(props) {
  const router = useRouter(), route = duellRoute(router, props);
  const [, refresh] = useState(0), [navigationBusy, setNavigationBusy] = useState(false), [navigationNotice, setNavigationNotice] = useState("");
  const mounted = useRef(false), origin = useRef(null), pending = useRef(null);
  const signature = JSON.stringify([props.seed, props.revision, props.target, props.topic, props.topics, props.questions, props.unavailable]);
  const ownerKey = route.origin + signature;
  if (origin.current?.key !== ownerKey) origin.current = { key: ownerKey };
  const owner = origin.current;
  const ownerCurrent = useCallback(() => origin.current === owner && route.ready && duellRoute(router, props).ready && duellRoute(router, props).origin === route.origin, [owner]);
  const navigationPending = useCallback(() => pending.current !== null, []);
  useEffect(() => { mounted.current = true; const invalidate = () => { origin.current = null; refresh(value => value + 1); }; window.addEventListener("popstate", invalidate); window.addEventListener("hashchange", invalidate); return () => { mounted.current = false; pending.current = null; window.removeEventListener("popstate", invalidate); window.removeEventListener("hashchange", invalidate); }; }, []);
  useEffect(() => { pending.current = null; setNavigationBusy(false); setNavigationNotice(""); }, [owner]);
  async function newRound(nextTopic = props.topic ?? null) {
    if (!mounted.current || !ownerCurrent() || pending.current) return;
    if (nextTopic !== null && (!normaliseDuellTopic(nextTopic) || !props.topics?.some(item => item.slug === nextTopic && Number.isSafeInteger(item.count) && item.count >= DUELL_QUESTION_COUNT))) return;
    let seed; try { seed = createDuellSeed(window.crypto); } catch { setNavigationNotice("Eine sichere neue Runde ist hier nicht verfügbar. Bitte lade die Seite erneut."); return; }
    const url = new URL(router.asPath, "https://jagdlatein.invalid");
    for (const key of ["duell", "ziel", "v", "thema"]) url.searchParams.delete(key);
    url.searchParams.set("duell", seed);
    if (nextTopic) url.searchParams.set("thema", nextTopic);
    const ticket = {}; pending.current = ticket; setNavigationBusy(true); setNavigationNotice("");
    let committed = false;
    try { const result = await router.push(url.pathname + url.search + url.hash, undefined, { scroll: false }); if (result === false) throw Error("Navigation cancelled"); committed = true; }
    catch { if (mounted.current && ownerCurrent() && pending.current === ticket) setNavigationNotice("Die neue Runde konnte nicht geladen werden. Bitte versuche es erneut."); }
    finally { if (!committed && mounted.current && ownerCurrent() && pending.current === ticket) { pending.current = null; setNavigationBusy(false); } }
  }
  function changeTopic(value) {
    if (value !== "" && !normaliseDuellTopic(value)) return;
    const topic = value || null;
    if (topic === (props.topic ?? null)) return;
    void newRound(topic);
  }
  return <LearningToolLayout title="Jagdlatein Revierduell" description="Sieben Fragen, zwölf Sekunden und eine gemeinsame Challenge." icon="trophy" headingOnly hideCommunity className={styles.page}>
    <p className={styles.intro}>Allgemeines Jagd- und Naturwissen für CH, Österreich und Deutschland. Ein Spiel, keine amtliche Prüfung oder Anleitung für eine praktische Jagdentscheidung.</p>
    {!route.ready && <p role="status">Dein Revierduell wird vorbereitet.</p>}
    <div data-revierduell-reader data-usage-private hidden={!route.ready} inert={!route.ready} aria-hidden={!route.ready ? true : undefined} style={{ display: route.ready ? "contents" : "none" }}>
      {props.linkNotice && <p role="status" className={styles.small}>{props.linkNotice}</p>}
      {props.unavailable ? <section className={styles.card}><h2>Diese Challenge ist nicht mehr verfügbar.</h2><p>Die Fragen wurden überarbeitet. Eine neue Runde beginnt mit dem aktuellen Stand und ohne alte Zielpunktzahl.</p><button type="button" className={styles.primary} disabled={navigationBusy} onClick={() => newRound()}>{navigationBusy ? "Neue Runde wird geladen …" : "Neue Runde starten"}</button><Link href="/quiz-app" prefetch={false} className={styles.quizLink}>Zum vollständigen Quiz</Link></section> : <DuellRound key={signature} {...props} ownerIdentity={owner} ownerCurrent={ownerCurrent} navigationBusy={navigationBusy} navigationPending={navigationPending} onNewRound={newRound} onTopicChange={changeTopic} />}
      {navigationBusy && <p role="status" className={styles.small}>Neue Runde wird geladen …</p>}
      {navigationNotice && <p role="status" className={styles.small}>{navigationNotice}</p>}
    </div>
  </LearningToolLayout>;
}
