import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import JagdakademiePromotion from "./JagdakademiePromotion";
import { oralExamQuestions, getOralExamSummary } from "../lib/oral-exam-trainer";
import { getLearningCategory } from "../lib/learning-categories";
import styles from "../styles/LearningExperience.module.css";

const route = "/lernen/pruefungsgespraech";
const categories = [...new Set(oralExamQuestions.map(entry => entry.categorySlug))];
const blankResponse = () => ({ answer: "", spoken: false, revealed: false, criteria: [], rating: "" });
const queryKey = query => JSON.stringify(Object.keys(query).sort().map(key => [key, query[key]]));

export default function OralExamTrainer() {
  const router = useRouter();
  const ready = router.isReady === true;
  const requestedCategory = router.query.kategorie;
  const category = requestedCategory === undefined ? "all" : typeof requestedCategory === "string" && (requestedCategory === "all" || categories.includes(requestedCategory)) ? requestedCategory : null;
  const baseQuestions = category ? oralExamQuestions.filter(entry => category === "all" || entry.categorySlug === category) : [];
  const requested = router.query.eintrag;
  const item = ready ? requested === undefined ? baseQuestions[0] || null : baseQuestions.find(entry => typeof requested === "string" && entry.id === requested) || null : null;
  const [responses, setResponses] = useState({});
  const responsesRef = useRef(responses);
  responsesRef.current = responses;
  const [practice, setPractice] = useState({ category: "all", ids: null, repeating: false, finishedOrigin: null });
  const practiceValid = practice.category === category && (!practice.ids || practice.ids.includes(item?.id));
  const activePractice = practiceValid ? practice : { category, ids: null, repeating: false, finishedOrigin: null };
  const practiceRef = useRef(activePractice);
  practiceRef.current = activePractice;
  const questions = activePractice.ids ? activePractice.ids.map(id => oralExamQuestions.find(entry => entry.id === id)) : baseQuestions;
  const index = item ? questions.findIndex(entry => entry.id === item.id) : -1;
  const response = responses[item?.id] || blankResponse();
  const summary = getOralExamSummary(questions, responses);
  const [canSpeak, setCanSpeak] = useState(false);
  const [speechNotice, setSpeechNotice] = useState("");
  const [navigationError, setNavigationError] = useState("");
  const mounted = useRef(false);
  const heading = useRef(null);
  const roundHeading = useRef(null);
  const roundRef = useRef({});
  const round = roundRef.current;
  const speechGeneration = useRef(0);
  const [speechToken, setSpeechToken] = useState(0);
  const pending = useRef(null);
  const focusIntent = useRef(null);
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) {
    const previousOrigin = committedView.current;
    const nextOrigin = { key: viewKey };
    const operation = pending.current;
    if (operation) {
      // A deferred round reset belongs to exactly one accepted URL commit.
      // Moving elsewhere, even back to the same question, retires that action.
      const hash = (router.asPath || "").split("#")[1];
      if (!operation.invalidated && !operation.commitOrigin && operation.origin === previousOrigin && ready && queryKey(router.query) === operation.target && hash === "exam-question-title") {
        operation.commitOrigin = nextOrigin;
        focusIntent.current = { origin: nextOrigin, anchor: operation.anchor };
      }
      else { operation.invalidated = true; pending.current = null; }
    }
    committedView.current = nextOrigin;
  }
  const origin = committedView.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const finished = activePractice.finishedOrigin === origin;
  function currentView() { return mounted.current && ready && !!item && committedView.current === origin && roundRef.current === round; }
  function canAnswer() {
    // Wait for the accepted repeat/reset before admitting a fresh draft that
    // this same deferred action would otherwise immediately erase.
    return currentView() && practiceRef.current.finishedOrigin !== origin && !(pending.current?.action && pending.current.commitOrigin === origin);
  }
  function ownAnswer(value) { return !!value && (value.answer.trim() || value.spoken); }
  function currentResponse() { return responsesRef.current[item.id] || blankResponse(); }
  function writeResponses(next) { responsesRef.current = next; setResponses(next); }
  function writePractice(next) { practiceRef.current = next; setPractice(next); }
  function cancelSpeech() {
    speechGeneration.current++;
    try { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); } catch { /* Text remains available. */ }
  }
  function focusContent(anchor = finished || (focusIntent.current?.origin === origin ? focusIntent.current.anchor : (router.asPath || "").split("#")[1] === "exam-question-title")) {
    const target = finished ? roundHeading.current : heading.current;
    focusSelection(target, { anchor });
  }
  function applyRound(action) {
    roundRef.current = {};
    focusIntent.current = { origin: committedView.current, anchor: true };
    cancelSpeech(); setSpeechNotice("");
    if (action.type === "reset") writeResponses({});
    else {
      const next = { ...responsesRef.current };
      action.ids.forEach(id => { next[id] = blankResponse(); });
      writeResponses(next);
    }
    writePractice({ category: action.category, ids: action.ids, repeating: action.type === "repeat", finishedOrigin: null });
  }
  function completeNavigation(operation) {
    if (!operation || !mounted.current || pending.current !== operation || operation.invalidated || !operation.accepted || operation.commitOrigin !== committedView.current) return;
    pending.current = null;
    if (operation.action) applyRound(operation.action);
    return !!operation.action;
  }
  useEffect(() => {
    mounted.current = true;
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => { mounted.current = false; pending.current = null; cancelSpeech(); };
  }, []);
  useEffect(() => { cancelSpeech(); setSpeechNotice(""); }, [origin, round, finished]);
  useEffect(() => {
    if (!ready) return;
    const appliedRound = completeNavigation(pending.current);
    if (!appliedRound && (!practiceValid || (practice.finishedOrigin && practice.finishedOrigin !== origin))) {
      writePractice({ category, ids: practiceValid ? practice.ids : null, repeating: practiceValid && practice.repeating, finishedOrigin: null });
    }
    setNavigationError("");
  }, [origin]);
  useEffect(() => {
    if (!ready) return;
    if (!item) {
      const timer = setTimeout(() => { if (mounted.current && committedView.current === origin) openPageMenu("exam-question-select"); }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu(); focusContent();
  }, [origin, round, finished]);

  async function navigate(id, nextCategory = category, action = null, anchor = !!action) {
    if (!mounted.current || !ready || committedView.current !== origin || roundRef.current !== round || !(nextCategory === "all" || categories.includes(nextCategory))) return;
    const targetItem = oralExamQuestions.find(entry => entry.id === id && (nextCategory === "all" || entry.categorySlug === nextCategory));
    if (!targetItem) return;
    cancelSelectionFocus();
    setNavigationError("");
    if (item?.id === id && category === nextCategory && !pending.current) {
      if (action) applyRound(action); else { closePageMenu(); focusContent(anchor); }
      return;
    }
    const query = { ...router.query, eintrag: id };
    if (nextCategory === "all") delete query.kategorie; else query.kategorie = nextCategory;
    const operation = { origin, target: queryKey(query), action, anchor, accepted: false, commitOrigin: null, invalidated: false };
    pending.current = operation;
    cancelSpeech(); setSpeechNotice("");
    try {
      const accepted = await router.push({ pathname: route, query, hash: "exam-question-title" }, undefined, { shallow: true, scroll: false });
      if (!mounted.current || pending.current !== operation || operation.invalidated) return;
      if (accepted === false) { pending.current = null; return; }
      operation.accepted = true;
      if (!operation.commitOrigin && committedView.current === origin && item?.id === id && queryKey(router.query) === operation.target && (router.asPath || "").split("#")[1] === "exam-question-title") operation.commitOrigin = origin;
      completeNavigation(operation);
      if (!action && operation.commitOrigin === origin && committedView.current === origin) { closePageMenu(); focusContent(anchor); }
    } catch (error) {
      if (!mounted.current || pending.current !== operation || operation.invalidated) return;
      pending.current = null;
      if (committedView.current !== origin) return;
      if (!error?.cancelled) { setNavigationError("Die Frage konnte nicht geöffnet werden. Bitte wähle sie erneut."); openPageMenu("exam-question-select"); }
    }
  }
  function updateResponse(transform) {
    if (!canAnswer()) return;
    writeResponses({ ...responsesRef.current, [item.id]: transform(currentResponse()) });
  }
  function change(patch) { updateResponse(value => ({ ...value, ...patch })); }
  function reveal() { if (canAnswer() && ownAnswer(currentResponse())) change({ revealed: true }); }
  function rate(rating) {
    if (!canAnswer() || !["offen", "teilweise", "sicher"].includes(rating)) return;
    const value = currentResponse();
    if (value.revealed && ownAnswer(value)) change({ rating });
  }
  function toggleCriterion(position, checked) {
    if (!canAnswer() || !currentResponse().revealed || !Number.isInteger(position) || position < 0 || position >= item.criteria.length) return;
    updateResponse(value => ({ ...value, criteria: checked ? [...new Set([...value.criteria, position])] : value.criteria.filter(entry => entry !== position), rating: "" }));
  }
  function next() {
    if (!canAnswer() || pending.current || !currentResponse().rating || !currentResponse().revealed || !ownAnswer(currentResponse())) return;
    if (index + 1 < questions.length) { navigate(questions[index + 1].id, category, null, true); return; }
    roundRef.current = {}; cancelSpeech(); setSpeechNotice("");
    writePractice({ ...practiceRef.current, finishedOrigin: origin });
  }
  function restart() {
    if (!currentView()) return;
    const start = baseQuestions.findIndex(entry => entry.id === item.id);
    const ids = [...baseQuestions.slice(start), ...baseQuestions.slice(0, start)].map(entry => entry.id);
    navigate(item.id, category, { type: "reset", category, ids });
  }
  function repeat() {
    if (!currentView()) return;
    const ids = getOralExamSummary(questions, responsesRef.current).repeatIds;
    if (ids.length) navigate(ids[0], category, { type: "repeat", category, ids });
  }
  function readPrompt() {
    if (!canSpeak || !canAnswer()) return;
    try {
      const voice = window.speechSynthesis.getVoices().find(entry => entry.localService === true && typeof entry.lang === "string" && /^de(?:-|$)/i.test(entry.lang));
      if (!voice) { setSpeechNotice("Keine lokale deutsche Gerätestimme verfügbar. Die Frage steht vollständig als Text bereit."); return; }
      cancelSpeech(); const ticket = speechGeneration.current; setSpeechToken(ticket);
      const utterance = new window.SpeechSynthesisUtterance(item.prompt);
      utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.95;
      utterance.onerror = () => { if (canAnswer() && speechGeneration.current === ticket) setSpeechNotice("Vorlesen ist gerade nicht verfügbar. Nutze den Text der Frage."); };
      window.speechSynthesis.speak(utterance); setSpeechNotice("Die Frage wird mit einer lokalen Gerätestimme vorgelesen.");
    } catch { if (canAnswer()) setSpeechNotice("Vorlesen ist hier nicht verfügbar. Nutze den Text der Frage."); }
  }
  function stopReading() {
    if (!canAnswer() || speechGeneration.current !== speechToken) return;
    cancelSpeech(); setSpeechNotice("Vorlesen beendet.");
  }

  return <LearningToolLayout title="Prüfungsgespräch üben" description="Wissen in eigenen Worten erklären, mit Musterantworten vergleichen und konkrete Lernlücken erkennen." icon="book" category="pruefung-sprache" headingOnly>
    <PageMenu title="Prüfungsgespräch – Themen und Fragen" openInitially={ready && !item} initialFocusId="exam-question-select">
      <p>{oralExamQuestions.length} eigene offene Fragen · {categories.length} Themenbereiche · 4 Kriterien pro Antwort</p>
      {item && <p>{finished ? "Runde abgeschlossen" : "Frage " + (index + 1) + " von " + questions.length + (activePractice.repeating ? " · Wiederholung" : "")}</p>}
      <MenuChoice label="Themenbereich" disabled={!ready} value={category || ""} onChange={event => { const selected = event.target.value; const first = oralExamQuestions.find(entry => selected === "all" || entry.categorySlug === selected); if (first) navigate(first.id, selected); }}><option value="" disabled>Themenbereich wählen</option><option value="all">Alle Themen</option>{categories.map(slug => <option key={slug} value={slug}>{getLearningCategory(slug).title}</option>)}</MenuChoice>
      <MenuChoice label="Frage wählen" id="exam-question-select" disabled={!ready} value={item?.id || ""} aria-controls="exam-question-title" onChange={event => navigate(event.target.value)}><option value="" disabled>Frage wählen</option>{questions.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</MenuChoice>
      {navigationError && <p role="alert" className={styles.note}>{navigationError}</p>}
    </PageMenu>
    <p className={styles.note}>Eigene Übungsfragen mit Selbsteinschätzung, kein amtlicher Fragenkatalog. Deine Antworttexte bleiben nur in dieser geöffneten Seite und werden nicht hochgeladen. Vorlesen nutzt, soweit verfügbar, eine lokale Gerätestimme; es ist keine menschliche Originalaufnahme.</p>
    {!item ? <p className={styles.note}>{ready ? "Diese Frage oder Themenauswahl ist nicht verfügbar. Wähle unten im Menü einen Themenbereich und eine Frage." : "Die gewählte Frage wird geladen."}</p> : finished ? <section className={styles.panel} aria-live="polite"><h2 ref={roundHeading} tabIndex={-1}>Deine Gesprächsrunde</h2><p>{summary.practiced} Fragen verglichen; {summary.secure} davon selbst als sicher eingeschätzt. Diese Einschätzung ersetzt keine Prüfung durch eine ausbildende Person.</p><div className={styles.actions}>{summary.repeatIds.length > 0 && <button type="button" className={styles.primary} onClick={repeat}>Offene Fragen erneut erklären</button>}<button type="button" className={styles.secondary} onClick={restart}>Neue Runde beginnen</button></div></section> : <section className={styles.panel} aria-labelledby="exam-question-title"><p className={styles.muted}>{getLearningCategory(item.categorySlug).title}</p><h2 id="exam-question-title" ref={heading} tabIndex={-1}>{item.title}</h2><p>{item.prompt}</p>{canSpeak && <div className={styles.actions}><button className={styles.secondary} type="button" onClick={readPrompt}>Frage vorlesen</button><button type="button" className={styles.secondary} onClick={stopReading}>Vorlesen stoppen</button></div>}{speechNotice && <p role="status" className={styles.muted}>{speechNotice}</p>}
      <label className={styles.field}>Deine Antwort in eigenen Worten<textarea maxLength={4000} value={response.answer} onChange={event => change({ answer: event.target.value, rating: "" })} placeholder="Sachverhalt, Begründung, offene Voraussetzungen und nächster Schritt." /></label><label><input type="checkbox" checked={response.spoken} onChange={event => change({ spoken: event.target.checked, rating: "" })} /> Ich habe meine Antwort selbst laut erklärt.</label><div className={styles.actions}><button type="button" className={styles.primary} disabled={!response.answer.trim() && !response.spoken} onClick={reveal}>Mit der Musterantwort vergleichen</button></div>
      {response.revealed && <><div className={styles.feedback}><h3>Eine mögliche strukturierte Antwort</h3><p>{item.model}</p><p><strong>Typischer Denkfehler:</strong> {item.mistake}</p><p><strong>Nachfrage:</strong> {item.followUp}</p></div><h3>Was war in deiner Antwort enthalten?</h3><p className={styles.muted}>Hake nur Punkte ab, die du selbst erklärt hast. Die App bewertet deinen Text nicht automatisch.</p><div className={styles.choices}>{item.criteria.map((criterion, position) => <label className={styles.choice} key={criterion}><input type="checkbox" checked={response.criteria.includes(position)} onChange={event => toggleCriterion(position, event.target.checked)} />{criterion}</label>)}</div><p>{response.criteria.length} von {item.criteria.length} Punkten selbst wiedergegeben.</p><h3>Wie sicher war deine eigene Erklärung?</h3><div className={styles.modeButtons}>{[["offen", "Noch offene Lücken"], ["teilweise", "Teilweise sicher"], ["sicher", "Sicher erklärt"]].map(([value, label]) => <button key={value} type="button" aria-pressed={response.rating === value} className={response.rating === value ? styles.primary : styles.secondary} onClick={() => rate(value)}>{label}</button>)}</div><Link className={styles.secondary} href={`/kurse/${item.course}`}>Im passenden Kurs vertiefen</Link><details className={styles.sources}><summary>Fachquellen · geprüft am 04.10.2026</summary><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details><div className={styles.actions}><button type="button" className={styles.primary} disabled={!response.rating || !ownAnswer(response)} onClick={next}>{index + 1 === questions.length ? "Runde auswerten" : "Nächste Frage"}</button></div></>}
    </section>}
    <JagdakademiePromotion />
  </LearningToolLayout>;
}
