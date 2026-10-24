import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { DOG_JOURNAL_KEY, DOG_JOURNAL_LIMIT, DOG_JOURNAL_MAX_BYTES, dogTrainingExercises, dogTrainingSources, createDogJournalDraft, parseDogJournalBackup, makeDogJournalRecord } from "../lib/dog-training-journal";
import styles from "../styles/LearningExperience.module.css";

const outcomeLabels = { "kleiner-schritt": "Kleiner Lernschritt", "gut-bewaeltigt": "Gut bewältigt", "pause-noetig": "Pause / leichterer Schritt nötig" };
function uniqueId() { return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `training_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`; }

export default function DogTrainingJournal() {
  const router = useRouter();
  const routerReady = router.isReady === true;
  const requested = router.query.eintrag;
  const exercise = routerReady ? requested === undefined ? dogTrainingExercises[0]
    : dogTrainingExercises.find(item => typeof requested === "string" && item.id === requested) || null : null;
  const [draft, setDraft] = useState(() => createDogJournalDraft());
  const [records, setRecords] = useState([]);
  const [ready, setReady] = useState(false);
  const [persist, setPersist] = useState(true);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const actionGuard = useRef(null);
  const importGeneration = useRef(0);
  const pendingRef = useRef(null);
  const revision = useRef(0);
  const token = revision.current;
  const mounted = useRef(false);
  const draftSession = useRef({});
  const formSession = draftSession.current;
  const deleteRef = useRef(deleteId);
  deleteRef.current = deleteId;
  const heading = useRef(null);
  const initializedSelection = useRef(false);
  const selectionRequest = useRef(0);
  const pendingSelection = useRef(null);
  const [navigationError, setNavigationError] = useState("");
  const viewKey = JSON.stringify([routerReady, router.asPath, router.query]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  function canEdit() { return mounted.current && ready && draftSession.current === formSession; }
  function focusExercise() {
    heading.current?.focus?.({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    try { const saved = window.localStorage.getItem(DOG_JOURNAL_KEY); if (saved) { const restored = parseDogJournalBackup(saved); setRecords(restored.records); setDraft(restored.draft); } }
    catch { setPersist(false); setNotice("Der lokale Speicher ist nicht verfügbar oder enthält eine unlesbare Sicherung. Neue Angaben bleiben vorerst nur in dieser geöffneten Seite. Exportiere sie vor dem Schließen."); }
    setReady(true);
    return () => { mounted.current = false; importGeneration.current++; revision.current++; pendingRef.current = null; selectionRequest.current++; pendingSelection.current = null; };
  }, []);
  useEffect(() => {
    if (!ready || !persist) return;
    try { window.localStorage.setItem(DOG_JOURNAL_KEY, JSON.stringify({ version: 1, records, draft })); }
    catch { setPersist(false); setNotice("Speichern auf diesem Gerät ist nicht möglich. Deine Angaben bleiben in dieser geöffneten Seite; nutze die Sicherung vor dem Schließen."); }
  }, [ready, persist, records, draft]);
  useEffect(() => {
    if (!routerReady) return;
    setNavigationError("");
    if (!exercise) {
      const timer = setTimeout(() => { if (mounted.current && committedView.current === origin) openPageMenu("journal-exercise-select"); }, 0);
      return () => clearTimeout(timer);
    }
    const shouldFocus = initializedSelection.current || requested !== undefined || (router.asPath || "").split("#")[1] === "exercise-title";
    initializedSelection.current = true;
    if (shouldFocus) { closePageMenu(); focusExercise(); }
  }, [routerReady, origin]);
  async function selectExercise(id) {
    if (!mounted.current || !routerReady || committedView.current !== origin || !dogTrainingExercises.some(item => item.id === id)) return;
    setNavigationError("");
    if (exercise?.id === id && pendingSelection.current === null) { closePageMenu(); focusExercise(); return; }
    const request = ++selectionRequest.current;
    pendingSelection.current = request;
    try {
      const accepted = await router.push({ pathname: "/lernen/hundetraining-tagebuch", query: { ...router.query, eintrag: id }, hash: "exercise-title" }, undefined, { shallow: true, scroll: false });
      if (accepted !== false && mounted.current && request === selectionRequest.current && committedView.current === origin && exercise?.id === id) { closePageMenu(); focusExercise(); }
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== selectionRequest.current || committedView.current !== origin) return;
      setNavigationError("Die Übung konnte nicht geöffnet werden. Bitte wähle sie erneut."); openPageMenu("journal-exercise-select");
    } finally { if (pendingSelection.current === request) pendingSelection.current = null; }
  }
  function change(key, value) { if (!canEdit()) return; revision.current++; actionGuard.current = null; setDraft(previous => ({ ...previous, [key]: value })); }
  function clearDraft() { draftSession.current = {}; revision.current++; actionGuard.current = null; setDraft(createDogJournalDraft()); setEditing(null); }
  function resetDraft() { if (canEdit() && revision.current === token) clearDraft(); }
  function prepareExercise() { if (canEdit() && routerReady && exercise && committedView.current === origin && revision.current === token) change("exerciseId", exercise.id); }
  function save(event) {
    if (!canEdit() || revision.current !== token || actionGuard.current === token) return;
    event.preventDefault();
    try {
      if (!editing && records.length >= DOG_JOURNAL_LIMIT) throw new Error("500 Einträge sind erreicht. Sichere das Tagebuch und entferne bei Bedarf alte Einträge.");
      const old = records.find(item => item.id === editing);
      if (editing && !old) throw new Error("Der zu bearbeitende Eintrag ist nicht mehr vorhanden.");
      const record = makeDogJournalRecord(draft, old?.id || uniqueId(), old?.createdAt);
      const updated = old ? records.map(item => item.id === old.id ? record : item) : [record, ...records];
      if (new Blob([JSON.stringify({ version: 1, records: updated, draft })]).size > DOG_JOURNAL_MAX_BYTES - 20000) throw new Error("Die Sicherung erreicht 2 MB. Bitte zuerst sichern und ältere Einträge entfernen.");
      actionGuard.current = token;
      setRecords(previous => old ? previous.map(item => item.id === old.id ? record : item) : [record, ...previous]);
      setNotice(old ? "Eintrag geändert." : "Training eingetragen.");
      clearDraft();
    } catch (error) { setNotice(error.message); }
  }
  function edit(record) { if (!canEdit() || revision.current !== token) return; draftSession.current = {}; revision.current++; actionGuard.current = null; setEditing(record.id); setDraft({ date: record.date, dog: record.dog, exerciseId: record.exerciseId, minutes: record.minutes, observation: record.observation, nextStep: record.nextStep, outcome: record.outcome }); deleteRef.current = null; setDeleteId(null); }
  function requestRemove(id) { if (!canEdit() || revision.current !== token || !records.some(record => record.id === id)) return; deleteRef.current = id; setDeleteId(id); }
  function cancelRemove(id) { if (!canEdit() || deleteRef.current !== id) return; deleteRef.current = null; setDeleteId(null); }
  function remove(id) {
    if (!canEdit() || deleteRef.current !== id || revision.current !== token) return;
    deleteRef.current = null; revision.current++; setRecords(previous => previous.filter(item => item.id !== id)); setDeleteId(null); if (editing === id) clearDraft(); setNotice("Eintrag entfernt.");
  }
  function download() {
    if (!canEdit() || revision.current !== token) return;
    try {
      const text = JSON.stringify({ version: 1, records, draft });
      const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `jagdlatein-hundetraining-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Sicherung zum Herunterladen bereit. Bewahre die Datei geschützt auf.");
    } catch { setNotice("Die Sicherung konnte hier nicht heruntergeladen werden. Bitte einen Browser mit Dateidownload verwenden."); }
  }
  async function readFile(event) {
    if (!mounted.current || !ready) return;
    const file = event.target.files?.[0]; event.target.value = ""; const generation = ++importGeneration.current; pendingRef.current = null; setPending(null);
    if (!file) return;
    try { if (file.size > DOG_JOURNAL_MAX_BYTES) throw new Error("Bitte eine JSON-Sicherung mit höchstens 2 MB wählen."); const parsed = parseDogJournalBackup(await file.text()); if (!mounted.current || importGeneration.current !== generation) return; pendingRef.current = parsed; setPending(parsed); setNotice(""); }
    catch (error) { if (mounted.current && importGeneration.current === generation) setNotice(error.message || "Die Datei konnte nicht gelesen werden."); }
  }
  function applyImport() { if (!canEdit() || revision.current !== token || !pending || pendingRef.current !== pending) return; const snapshot = pending; pendingRef.current = null; importGeneration.current++; draftSession.current = {}; revision.current++; actionGuard.current = null; setRecords(snapshot.records); setDraft(snapshot.draft); setEditing(null); deleteRef.current = null; setDeleteId(null); setPending(null); setPersist(true); setNotice("Sicherung übernommen. Sie ersetzt den bisherigen Stand dieses lokalen Tagebuchs."); }
  function cancelImport() { if (!mounted.current || !ready || !pending || pendingRef.current !== pending) return; importGeneration.current++; pendingRef.current = null; setPending(null); }
  const needle = query.trim().toLocaleLowerCase("de");
  const shown = records.filter(record => (filter === "all" || record.exerciseId === filter) && (!needle || `${record.dog} ${record.observation} ${record.nextStep}`.toLocaleLowerCase("de").includes(needle))).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return <LearningToolLayout title="Hundetraining-Tagebuch" description="Kleine, faire Lernschritte planen und Beobachtungen im eigenen Hundeteam festhalten." icon="paw" category="hundewesen" headingOnly>
    <PageMenu title="Hundetraining – Übung wählen" openInitially={routerReady && !exercise} initialFocusId="journal-exercise-select">
      <p>{dogTrainingExercises.length} Alltagsübungen · {records.length} eigene Einträge · lokal auf diesem Gerät</p>
      <label className={styles.field}>Übung entdecken<select id="journal-exercise-select" value={exercise?.id || ""} disabled={!routerReady} aria-controls="exercise-title" onChange={event => selectExercise(event.target.value)}><option value="" disabled>Übung wählen</option>{dogTrainingExercises.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {navigationError && <p className={styles.note} role="alert">{navigationError}</p>}
    </PageMenu>
    <p className={styles.note}>Dein Tagebuch wird nur im Browser auf diesem Gerät gespeichert, ohne Übertragung an Jagdlatein und ohne Abgleich mit anderen Geräten. Auf gemeinsam genutzten Geräten ist es für andere Personen mit demselben Browser zugänglich. Sichere wichtige Einträge als Datei.</p>
    {exercise ? <section className={styles.panel} aria-labelledby="exercise-title"><h2 id="exercise-title" ref={heading} tabIndex={-1}>{exercise.title}</h2><p><strong>Ziel:</strong> {exercise.goal}</p><p><strong>Vorbereitung:</strong> {exercise.preparation}</p><ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>Leichter machen:</strong> {exercise.easier}</p><p><strong>Beobachten:</strong> {exercise.observe}</p><button type="button" className={styles.secondary} onClick={prepareExercise}>Für diese Übung einen Eintrag vorbereiten</button><p className={styles.muted}>Die Beispiele sind eigene kurze Alltagsaufgaben auf Grundlage belohnungsbasierten Lernens. Pausen, Wohlbefinden und freiwilliges Mitmachen gehen vor. Bei Schmerz, anhaltender Angst oder Aggression passende fachliche Hilfe einholen.</p><Link className={styles.secondary} href={`/kurse/${exercise.course}`}>Lernverhalten im Kurs vertiefen</Link></section> : <p className={styles.note}>{routerReady ? "Diese Übung ist nicht verfügbar. Wähle unten im Menü eine Übung." : "Die gewählte Übung wird geladen."}</p>}
    <section className={styles.panel} aria-labelledby="journal-entry-title"><h2 id="journal-entry-title">{editing ? "Eintrag bearbeiten" : "Training festhalten"}</h2><form onSubmit={save}><div className={styles.grid}><label className={styles.field}>Datum<input type="date" required value={draft.date} onChange={event => change("date", event.target.value)} /></label><label className={styles.field}>Hund / Team<input maxLength={80} required value={draft.dog} onChange={event => change("dog", event.target.value)} placeholder="Zum Beispiel: Lotte" /></label><label className={styles.field}>Geübte Aufgabe<select value={draft.exerciseId} onChange={event => change("exerciseId", event.target.value)}>{dogTrainingExercises.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className={styles.field}>Minuten<input type="number" min="1" max="180" required value={draft.minutes} onChange={event => change("minutes", event.target.value)} /></label></div><p className={styles.muted}>Die Zeitangabe dokumentiert den Termin und empfiehlt keine Trainingsdauer. Kurze Aufgaben und passende Erholung individuell planen.</p><label className={styles.field}>Was war sichtbar? <textarea maxLength={2000} required value={draft.observation} onChange={event => change("observation", event.target.value)} placeholder="Ort, Ablenkung, freiwillige Reaktion, Körpersprache und Pausen beschreiben." /></label><label className={styles.field}>Wie ging es?<select value={draft.outcome} onChange={event => change("outcome", event.target.value)}>{Object.entries(outcomeLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label className={styles.field}>Nächster kleiner Schritt<textarea maxLength={1000} value={draft.nextStep} onChange={event => change("nextStep", event.target.value)} placeholder="Zum Beispiel: weniger Ablenkung, kürzerer Abstand, neue Pause." /></label><div className={styles.actions}><button type="submit" className={styles.primary} disabled={!ready}>{editing ? "Änderung speichern" : "Eintrag speichern"}</button><button type="button" className={styles.secondary} onClick={resetDraft}>Entwurf verwerfen</button></div></form></section>
    {notice && <p role="status" className={styles.feedback}>{notice}{!persist && " Dauerhafte Speicherung ist derzeit nicht aktiv."}</p>}
    <section className={styles.panel} aria-labelledby="journal-backup-title"><h2 id="journal-backup-title">Sicherung und Gerätewechsel</h2><p>Die Datei enthält deine Einträge und den aktuellen Entwurf. Eine eingelesene Sicherung wird erst nach deiner Übernahme angewendet.</p><div className={styles.actions}><button type="button" className={styles.secondary} disabled={!ready} onClick={download}>Sicherung herunterladen</button><label className={styles.field}>Sicherung auswählen<input type="file" accept="application/json,.json" disabled={!ready} onChange={readFile} /></label></div>{pending && <div className={styles.feedback}><h3>Geprüfte Sicherung</h3><p>{pending.records.length} Einträge und ein Entwurf. Bei Übernahme werden die aktuell {records.length} Einträge dieses lokalen Tagebuchs ersetzt. Lade vorher bei Bedarf eine Sicherung herunter.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={applyImport}>Diesen Stand übernehmen</button><button type="button" className={styles.secondary} onClick={cancelImport}>Abbrechen</button></div></div>}</section>
    <section className={styles.panel} aria-labelledby="journal-history-title"><h2 id="journal-history-title">Deine Trainingsnotizen</h2><div className={styles.grid}><label className={styles.field}>Eigene Notizen durchsuchen<input value={query} maxLength={200} onChange={event => { if (mounted.current) setQuery(event.target.value); }} /></label><label className={styles.field}>Aufgabe filtern<select value={filter} onChange={event => { if (mounted.current) setFilter(event.target.value); }}><option value="all">Alle Aufgaben</option>{dogTrainingExercises.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div><p className={styles.muted}>{shown.length} von {records.length} Einträgen · höchstens {DOG_JOURNAL_LIMIT} Einträge pro Sicherung.</p>{shown.length === 0 ? <p className={styles.empty}>Noch keine passenden Einträge. Beginne mit einer leichten Übung und einer kurzen Beobachtung.</p> : shown.map(record => <article className={styles.card} key={record.id}><h3>{record.dog} · {record.date.split("-").reverse().join(".")}</h3><p>{dogTrainingExercises.find(item => item.id === record.exerciseId).title} · {record.minutes} Minuten · {outcomeLabels[record.outcome]}</p><p><strong>Beobachtung:</strong> {record.observation}</p>{record.nextStep && <p><strong>Nächster Schritt:</strong> {record.nextStep}</p>}<div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => edit(record)}>Bearbeiten</button><button type="button" className={styles.secondary} onClick={() => requestRemove(record.id)}>Entfernen</button></div>{deleteId === record.id && <div className={styles.feedback}><p>Diesen Eintrag vom {record.date.split("-").reverse().join(".")} entfernen?</p><button type="button" className={styles.secondary} onClick={() => remove(record.id)}>Eintrag endgültig entfernen</button> <button type="button" className={styles.secondary} onClick={() => cancelRemove(record.id)}>Behalten</button></div>}</article>)}</section>
    <details className={styles.sources}><summary>Fachgrundlagen · geprüft am 04.10.2026</summary><ul>{dogTrainingSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
  </LearningToolLayout>;
}
