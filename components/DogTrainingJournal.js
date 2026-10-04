import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { DOG_JOURNAL_KEY, DOG_JOURNAL_LIMIT, DOG_JOURNAL_MAX_BYTES, dogTrainingExercises, dogTrainingSources, createDogJournalDraft, parseDogJournalBackup, makeDogJournalRecord } from "../lib/dog-training-journal";
import styles from "../styles/LearningExperience.module.css";

const outcomeLabels = { "kleiner-schritt": "Kleiner Lernschritt", "gut-bewaeltigt": "Gut bewältigt", "pause-noetig": "Pause / leichterer Schritt nötig" };
function uniqueId() { return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `training_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`; }

export default function DogTrainingJournal() {
  const [exerciseId, setExerciseId] = useState(dogTrainingExercises[0].id);
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
  const exercise = dogTrainingExercises.find(item => item.id === exerciseId);
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("eintrag");
    if (dogTrainingExercises.some(item => item.id === selected)) setExerciseId(selected);
    try { const saved = window.localStorage.getItem(DOG_JOURNAL_KEY); if (saved) { const restored = parseDogJournalBackup(saved); setRecords(restored.records); setDraft(restored.draft); } }
    catch { setPersist(false); setNotice("Der lokale Speicher ist nicht verfügbar oder enthält eine unlesbare Sicherung. Neue Angaben bleiben vorerst nur in dieser geöffneten Seite. Exportiere sie vor dem Schließen."); }
    setReady(true);
    return () => { importGeneration.current++; };
  }, []);
  useEffect(() => {
    if (!ready || !persist) return;
    try { window.localStorage.setItem(DOG_JOURNAL_KEY, JSON.stringify({ version: 1, records, draft })); }
    catch { setPersist(false); setNotice("Speichern auf diesem Gerät ist nicht möglich. Deine Angaben bleiben in dieser geöffneten Seite; nutze die Sicherung vor dem Schließen."); }
  }, [ready, persist, records, draft]);
  function change(key, value) { revision.current++; actionGuard.current = null; setDraft(previous => ({ ...previous, [key]: value })); }
  function resetDraft() { revision.current++; actionGuard.current = null; setDraft(createDogJournalDraft()); setEditing(null); }
  function save(event) {
    event.preventDefault();
    if (revision.current !== token || actionGuard.current === token) return;
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
      resetDraft();
    } catch (error) { setNotice(error.message); }
  }
  function edit(record) { if (revision.current !== token) return; revision.current++; actionGuard.current = null; setEditing(record.id); setDraft({ date: record.date, dog: record.dog, exerciseId: record.exerciseId, minutes: record.minutes, observation: record.observation, nextStep: record.nextStep, outcome: record.outcome }); setDeleteId(null); }
  function remove(id) {
    if (deleteId !== id || revision.current !== token) return;
    revision.current++; setRecords(previous => previous.filter(item => item.id !== id)); setDeleteId(null); if (editing === id) resetDraft(); setNotice("Eintrag entfernt.");
  }
  function download() {
    try {
      const text = JSON.stringify({ version: 1, records, draft });
      const blob = new Blob([text], { type: "application/json" }); const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `jagdlatein-hundetraining-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Sicherung zum Herunterladen bereit. Bewahre die Datei geschützt auf.");
    } catch { setNotice("Die Sicherung konnte hier nicht heruntergeladen werden. Bitte einen Browser mit Dateidownload verwenden."); }
  }
  async function readFile(event) {
    const file = event.target.files?.[0]; event.target.value = ""; const generation = ++importGeneration.current; pendingRef.current = null; setPending(null);
    if (!file) return;
    try { if (file.size > DOG_JOURNAL_MAX_BYTES) throw new Error("Bitte eine JSON-Sicherung mit höchstens 2 MB wählen."); const parsed = parseDogJournalBackup(await file.text()); if (importGeneration.current !== generation) return; pendingRef.current = parsed; setPending(parsed); setNotice(""); }
    catch (error) { if (importGeneration.current === generation) setNotice(error.message || "Die Datei konnte nicht gelesen werden."); }
  }
  function applyImport() { if (!pending || pendingRef.current !== pending) return; const snapshot = pending; pendingRef.current = null; importGeneration.current++; revision.current++; actionGuard.current = null; setRecords(snapshot.records); setDraft(snapshot.draft); setEditing(null); setDeleteId(null); setPending(null); setPersist(true); setNotice("Sicherung übernommen. Sie ersetzt den bisherigen Stand dieses lokalen Tagebuchs."); }
  const needle = query.trim().toLocaleLowerCase("de");
  const shown = records.filter(record => (filter === "all" || record.exerciseId === filter) && (!needle || `${record.dog} ${record.observation} ${record.nextStep}`.toLocaleLowerCase("de").includes(needle))).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return <LearningToolLayout title="Hundetraining-Tagebuch" description="Kleine, faire Lernschritte planen und Beobachtungen im eigenen Hundeteam festhalten." icon="paw" category="hundewesen" stats={[{ value: dogTrainingExercises.length, label: "Alltagsübungen" }, { value: records.length, label: "eigene Einträge" }, { value: "lokal", label: "auf diesem Gerät" }]}>
    <p className={styles.note}>Dein Tagebuch wird nur im Browser auf diesem Gerät gespeichert, ohne Übertragung an Jagdlatein und ohne Abgleich mit anderen Geräten. Auf gemeinsam genutzten Geräten ist es für andere Personen mit demselben Browser zugänglich. Sichere wichtige Einträge als Datei.</p>
    <section className={styles.panel} aria-labelledby="exercise-title"><label className={styles.field}>Übung entdecken<select value={exerciseId} onChange={event => setExerciseId(event.target.value)}>{dogTrainingExercises.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><h2 id="exercise-title">{exercise.title}</h2><p><strong>Ziel:</strong> {exercise.goal}</p><p><strong>Vorbereitung:</strong> {exercise.preparation}</p><ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>Leichter machen:</strong> {exercise.easier}</p><p><strong>Beobachten:</strong> {exercise.observe}</p><button type="button" className={styles.secondary} onClick={() => change("exerciseId", exercise.id)}>Für diese Übung einen Eintrag vorbereiten</button><p className={styles.muted}>Die Beispiele sind eigene kurze Alltagsaufgaben auf Grundlage belohnungsbasierten Lernens. Pausen, Wohlbefinden und freiwilliges Mitmachen gehen vor. Bei Schmerz, anhaltender Angst oder Aggression passende fachliche Hilfe einholen.</p><Link className={styles.secondary} href={`/kurse/${exercise.course}`}>Lernverhalten im Kurs vertiefen</Link></section>
    <section className={styles.panel} aria-labelledby="journal-entry-title"><h2 id="journal-entry-title">{editing ? "Eintrag bearbeiten" : "Training festhalten"}</h2><form onSubmit={save}><div className={styles.grid}><label className={styles.field}>Datum<input type="date" required value={draft.date} onChange={event => change("date", event.target.value)} /></label><label className={styles.field}>Hund / Team<input maxLength={80} required value={draft.dog} onChange={event => change("dog", event.target.value)} placeholder="Zum Beispiel: Lotte" /></label><label className={styles.field}>Geübte Aufgabe<select value={draft.exerciseId} onChange={event => change("exerciseId", event.target.value)}>{dogTrainingExercises.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className={styles.field}>Minuten<input type="number" min="1" max="180" required value={draft.minutes} onChange={event => change("minutes", event.target.value)} /></label></div><p className={styles.muted}>Die Zeitangabe dokumentiert den Termin und empfiehlt keine Trainingsdauer. Kurze Aufgaben und passende Erholung individuell planen.</p><label className={styles.field}>Was war sichtbar? <textarea maxLength={2000} required value={draft.observation} onChange={event => change("observation", event.target.value)} placeholder="Ort, Ablenkung, freiwillige Reaktion, Körpersprache und Pausen beschreiben." /></label><label className={styles.field}>Wie ging es?<select value={draft.outcome} onChange={event => change("outcome", event.target.value)}>{Object.entries(outcomeLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label className={styles.field}>Nächster kleiner Schritt<textarea maxLength={1000} value={draft.nextStep} onChange={event => change("nextStep", event.target.value)} placeholder="Zum Beispiel: weniger Ablenkung, kürzerer Abstand, neue Pause." /></label><div className={styles.actions}><button type="submit" className={styles.primary} disabled={!ready}>{editing ? "Änderung speichern" : "Eintrag speichern"}</button><button type="button" className={styles.secondary} onClick={resetDraft}>Entwurf verwerfen</button></div></form></section>
    {notice && <p role="status" className={styles.feedback}>{notice}{!persist && " Dauerhafte Speicherung ist derzeit nicht aktiv."}</p>}
    <section className={styles.panel} aria-labelledby="journal-backup-title"><h2 id="journal-backup-title">Sicherung und Gerätewechsel</h2><p>Die Datei enthält deine Einträge und den aktuellen Entwurf. Eine eingelesene Sicherung wird erst nach deiner Übernahme angewendet.</p><div className={styles.actions}><button type="button" className={styles.secondary} disabled={!ready} onClick={download}>Sicherung herunterladen</button><label className={styles.field}>Sicherung auswählen<input type="file" accept="application/json,.json" disabled={!ready} onChange={readFile} /></label></div>{pending && <div className={styles.feedback}><h3>Geprüfte Sicherung</h3><p>{pending.records.length} Einträge und ein Entwurf. Bei Übernahme werden die aktuell {records.length} Einträge dieses lokalen Tagebuchs ersetzt. Lade vorher bei Bedarf eine Sicherung herunter.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={applyImport}>Diesen Stand übernehmen</button><button type="button" className={styles.secondary} onClick={() => { importGeneration.current++; setPending(null); }}>Abbrechen</button></div></div>}</section>
    <section className={styles.panel} aria-labelledby="journal-history-title"><h2 id="journal-history-title">Deine Trainingsnotizen</h2><div className={styles.grid}><label className={styles.field}>Eigene Notizen durchsuchen<input value={query} maxLength={200} onChange={event => setQuery(event.target.value)} /></label><label className={styles.field}>Aufgabe filtern<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Alle Aufgaben</option>{dogTrainingExercises.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div><p className={styles.muted}>{shown.length} von {records.length} Einträgen · höchstens {DOG_JOURNAL_LIMIT} Einträge pro Sicherung.</p>{shown.length === 0 ? <p className={styles.empty}>Noch keine passenden Einträge. Beginne mit einer leichten Übung und einer kurzen Beobachtung.</p> : shown.map(record => <article className={styles.card} key={record.id}><h3>{record.dog} · {record.date.split("-").reverse().join(".")}</h3><p>{dogTrainingExercises.find(item => item.id === record.exerciseId).title} · {record.minutes} Minuten · {outcomeLabels[record.outcome]}</p><p><strong>Beobachtung:</strong> {record.observation}</p>{record.nextStep && <p><strong>Nächster Schritt:</strong> {record.nextStep}</p>}<div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => edit(record)}>Bearbeiten</button><button type="button" className={styles.secondary} onClick={() => setDeleteId(record.id)}>Entfernen</button></div>{deleteId === record.id && <div className={styles.feedback}><p>Diesen Eintrag vom {record.date.split("-").reverse().join(".")} entfernen?</p><button type="button" className={styles.secondary} onClick={() => remove(record.id)}>Eintrag endgültig entfernen</button> <button type="button" className={styles.secondary} onClick={() => setDeleteId(null)}>Behalten</button></div>}</article>)}</section>
    <details className={styles.sources}><summary>Fachgrundlagen · geprüft am 04.10.2026</summary><ul>{dogTrainingSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
  </LearningToolLayout>;
}
