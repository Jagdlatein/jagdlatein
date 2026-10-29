import { answerOrder, newAnswerSeed } from "../lib/answer-order";
import { useEffect, useRef, useState } from "react";
import LearningToolLayout from "./LearningToolLayout";
import { readOfflinePack, saveOfflinePack, clearOfflineLearning, prepareOfflineCache, validateOfflinePack, readCachedRetiredPhoto, OFFLINE_MAX_COURSES } from "../lib/offline-learning";
import styles from "../styles/LearningExperience.module.css";
import extra from "../styles/OfflineLearning.module.css";
import photoStyles from "../styles/LearningMedia.module.css";
import { learningAudioPaths } from "../lib/learning-audio-paths";
import LessonDiagram from "./LessonDiagram";
import LessonEvidence from "./LessonEvidence";
import { getCourseCountryNotes } from "../lib/learning-country-notes";
import { LessonPhotos, LessonPhotoSources } from "./LessonPhotos";
const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };
const date = value => new Date(value).toLocaleString("de-CH");
function supportsOfflineDownloads() {
  // Check capabilities rather than the device name: app views and browsers on
  // the same phone can expose different local storage and worker support.
  try {
    return typeof window !== "undefined" && window.isSecureContext === true
      && typeof navigator !== "undefined" && typeof navigator.serviceWorker?.register === "function"
      && typeof indexedDB !== "undefined" && typeof indexedDB.open === "function"
      && typeof caches !== "undefined" && typeof caches.open === "function"
      && typeof MessageChannel === "function";
  } catch {
    // Restricted views may expose a storage property that throws on access.
    return false;
  }
}
function offlineCreditUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password
      && (url.port === "" || url.port === "443") ? url.href : null;
  } catch { return null; }
}
function OfflinePhotoCredit({ photo }) {
  // Saved packs can predate optional license links; validate each external URL
  // at display time while retaining the original attribution as readable text.
  const creditUrl = offlineCreditUrl(photo.creditUrl);
  const licenseUrl = offlineCreditUrl(photo.licenseUrl);
  return <small className={photoStyles.photoCredit}>{photo.credit}{creditUrl && <> · <a href={creditUrl} target="_blank" rel="noopener noreferrer">Bildquelle</a></>}{licenseUrl && <> · <a href={licenseUrl} target="_blank" rel="noopener noreferrer">Lizenz</a></>}</small>;
}
function OfflinePhoto({ photo, retired }) {
  const [cachedUrl, setCachedUrl] = useState(null);
  useEffect(() => {
    if (!retired) return;
    let alive = true; let objectUrl;
    // A migrated picture is never fetched automatically. Only verified bytes
    // already on this device may be shown before an explicit fresh download.
    readCachedRetiredPhoto(photo.src).then(blob => {
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob); setCachedUrl(objectUrl);
    });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photo.src, retired]);
  return <figure className={styles.figure}>
    {retired && !cachedUrl ? <p className={styles.note}>Dieses Foto wurde aktualisiert. Lade deine Auswahl mit Internetverbindung erneut herunter, um es offline mitzunehmen.</p> : <img src={retired ? cachedUrl : photo.src} alt={photo.alt} loading="lazy" />}
    <figcaption>{photo.alt}{(!retired || cachedUrl) && <OfflinePhotoCredit photo={photo} />}</figcaption>
  </figure>;
}
function OfflineCourse({ course, expiresAt, onExpired, photoMap = {} }) {
  const legal = course.category === "Jagdrecht";
  const notes = getCourseCountryNotes(course);
  const [country, setCountry] = useState(course.countries[0]);
  const [lesson, setLesson] = useState(0);
  const [run, setRun] = useState({ index: 0, answers: {}, score: 0, answerSeed: 0 });
  const active = useRef(run);
  const mounted = useRef(false), reader = useRef(null), lessonHeading = useRef(null), readingRequest = useRef(null);
  const [readingRevision, setReadingRevision] = useState(0);
  const questions = legal ? course.questions.filter(question => question.countries.includes(country)) : course.questions;
  const question = questions[run.index]; const answer = question ? run.answers[question.id] : undefined;
  reader.current = { course, run, question, expiresAt };
  const questionLessonIndex = typeof question?.lessonId === "string" ? course.lessons.findIndex(item => item.id === question.lessonId) : -1;
  function allowed() { if (Date.now() < expiresAt) return true; onExpired(); return false; }
  function update(next) { active.current = next; setRun(next); }
  function choose(id) { if (!allowed() || active.current !== run || !question || answer !== undefined || !question.answers.some(item => item.id === id)) return; update({ ...run, answers: { ...run.answers, [question.id]: id }, score: run.score + Number(question.correct.includes(id)) }); }
  function currentFeedback() {
    const latest = reader.current;
    return mounted.current && lessonHeading.current?.isConnected && latest?.course === course
      && latest.run === run && active.current === run && latest.question === question && latest.expiresAt === expiresAt
      && answer !== undefined && questionLessonIndex >= 0;
  }
  function readQuestionLesson() {
    if (!currentFeedback() || !allowed()) return;
    readingRequest.current = { course, run, question, expiresAt, index: questionLessonIndex };
    setLesson(questionLessonIndex);
    setReadingRevision(value => value + 1);
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; readingRequest.current = null; };
  }, []);
  useEffect(() => {
    const request = readingRequest.current;
    if (!request) return;
    readingRequest.current = null;
    if (request.index !== lesson || request.course !== course || request.run !== run || request.question !== question || request.expiresAt !== expiresAt
      || !currentFeedback() || !allowed()) return;
    lessonHeading.current?.focus({ preventScroll: true });
    window.scrollTo?.({ left: 0, top: 0, behavior: "instant" });
  }, [readingRevision, lesson, course, run, question, expiresAt]);
  const current = course.lessons[lesson];
  return <>
    <section className={styles.panel}><h2>{course.title}</h2><p>{course.description}</p><h3>Das lernst du</h3><ul>{course.objectives.map(item => <li key={item}>{item}</li>)}</ul>
      {legal ? <><label className={styles.field}>Land<select value={country} onChange={event => { if (!allowed()) return; setCountry(event.target.value); update({ index: 0, answers: {}, score: 0, answerSeed: newAnswerSeed(run.answerSeed) }); }}>{course.countries.map(id => <option key={id} value={id}>{countryNames[id]}</option>)}</select></label><p className={styles.note}><strong>{countryNames[country]}:</strong> {course.countryNotes[country]}</p></> : notes.common ? <p className={styles.note}>{notes.common}</p> : notes.regional.length > 0 && <details><summary>Regionale Hinweise</summary>{notes.regional.map(id => <p key={id}><strong>{countryNames[id]}:</strong> {course.countryNotes[id]}</p>)}</details>}
      <label className={styles.field}>Lektion<select value={lesson} onChange={event => { if (allowed()) { readingRequest.current = null; setLesson(Number(event.target.value)); } }}>{course.lessons.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}</select></label>
      <h3 ref={lessonHeading} tabIndex={-1} data-offline-lesson-heading>{current.title}</h3>{current.paragraphs.map((paragraph, index) => <div key={index}><p>{paragraph}</p><LessonPhotos photos={(photoMap[current.id] || []).filter(photo => photo.afterParagraph === index)} context={`offline:${course.id}:${current.id}:paragraph:${index}`} /></div>)}<aside className={styles.note}><strong>Merke dir</strong><p>{current.takeaway}</p><strong>Zum Nachdenken</strong><p>{current.exercise}</p></aside>
      <LessonDiagram diagram={current.diagram} />
    </section>
    {question && <details className={styles.panel}><summary>Offline-Wissenscheck zum Kurs</summary><p className={styles.muted}>Ergebnisse gelten für diese Übungsrunde. Ein Kursabschluss wird hier nicht im Konto gespeichert.</p><p>Frage {run.index + 1} von {questions.length} · {run.score} richtig</p>{(question.topic === "Recht" || question.countries.length < 3) && <p className={styles.note}>Geltungsbereich dieser Frage: {question.countries.map(id => countryNames[id]).join(" · ")}</p>}<h3>{question.q}</h3>
      <div className={styles.choices}>{answerOrder(question.answers, question.id, run.answerSeed).map(answerIndex => { const item = question.answers[answerIndex]; return <button className={`${styles.choice} ${answer !== undefined && question.correct.includes(item.id) ? styles.correct : answer === item.id ? styles.wrong : ""}`} key={item.id} disabled={answer !== undefined} onClick={() => choose(item.id)}>{item.text}{answer !== undefined && question.correct.includes(item.id) && " ✓"}</button>; })}</div>
      {answer !== undefined && <div className={styles.feedback} role="status"><strong>{question.correct.includes(answer) ? "Richtig." : "Diese Antwort passt nicht."}</strong><p>{question.explain}</p><LessonPhotos photos={photoMap[question.lessonId] || []} context={`offline-feedback:${course.id}:${question.id}`} />{questionLessonIndex >= 0 && <button type="button" className={styles.secondary} data-offline-feedback-lesson={question.lessonId} onClick={readQuestionLesson}>Passende Lektion lesen</button>}{run.index + 1 < questions.length ? <button className={styles.primary} onClick={() => { if (allowed() && active.current === run) update({ ...run, index: run.index + 1 }); }}>Nächste Frage</button> : <><p>{run.score} von {questions.length} richtig.</p><button className={styles.secondary} onClick={() => { if (allowed() && active.current === run) update({ index: 0, answers: {}, score: 0, answerSeed: newAnswerSeed(run.answerSeed) }); }}>Noch einmal üben</button></>}</div>}
    </details>}
    <details className={styles.panel}><summary>Quellen und Prüfstand</summary><LessonEvidence lesson={current} reviewedOn={course.reviewedOn} embedded /><p>Zum Öffnen der Originalquellen brauchst du eine Internetverbindung.</p><ul className={styles.sources}>{course.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul><LessonPhotoSources photoMap={photoMap} /></details>
  </>;
}
export default function OfflineLearning({ courses }) {
  const [pack, setPack] = useState(null); const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState([]); const [sounds, setSounds] = useState(true);
  const [query, setQuery] = useState(""); const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [online, setOnline] = useState(true); const action = useRef(false);
  const [retiredPhotoPaths, setRetiredPhotoPaths] = useState([]);
  const [downloadSupport, setDownloadSupport] = useState("checking");
  const [view, setView] = useState("lernen");
  const [photoId, setPhotoId] = useState("");
  const [soundId, setSoundId] = useState("");
  useEffect(() => {
    let alive = true;
    setDownloadSupport(supportsOfflineDownloads() ? "supported" : "unsupported");
    readOfflinePack().then(({ pack: saved, expired, retiredPhotoPaths: retired }) => { if (alive) { setPack(saved); setRetiredPhotoPaths(retired); setCourseId(saved?.courses[0]?.id || ""); setSelected(saved?.courses.map(course => course.id) || []); if (expired) setMessage("Der gespeicherte Zugang ist abgelaufen. Bitte mit Internetverbindung neu herunterladen."); } }).catch(failure => { if (alive) setError(failure.message); }).finally(() => { if (alive) setLoaded(true); });
    const changeConnection = () => setOnline(navigator.onLine); changeConnection();
    window.addEventListener("online", changeConnection); window.addEventListener("offline", changeConnection);
    return () => { alive = false; window.removeEventListener("online", changeConnection); window.removeEventListener("offline", changeConnection); };
  }, []);
  useEffect(() => {
    if (!pack) return;
    const check = () => { if (!validateOfflinePack(pack)) { setPack(null); setMessage("Der gespeicherte Zugang ist abgelaufen. Bitte online erneuern."); } };
    check();
    const timer = setInterval(check, 30000); document.addEventListener("visibilitychange", check); window.addEventListener("pageshow", check);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", check); window.removeEventListener("pageshow", check); };
  }, [pack]);
  useEffect(() => {
    if (!pack || !online) return;
    let alive = true; const controller = new AbortController();
    fetch("/api/lernen/offline", { cache: "no-store", signal: controller.signal }).then(async response => {
      const identity = response.ok ? await response.json() : null;
      if (alive && ([401, 403].includes(response.status) || identity && identity.accountKey !== pack.accountKey)) {
        setPack(null); setMessage("Der gespeicherte Lernrucksack gehört zu einem anderen oder nicht mehr aktiven Zugang. Bitte online neu herunterladen.");
        try { if (!action.current) await clearOfflineLearning(); } catch { if (alive) setError("Alte Downloads bitte mit „Downloads entfernen“ löschen."); }
      }
    }).catch(() => {});
    return () => { alive = false; controller.abort(); };
  }, [pack, online]);
  async function download() {
    if (action.current || !selected.length || !online || downloadSupport !== "supported" || !supportsOfflineDownloads()) return;
    action.current = true; setBusy(true); setError(""); setMessage("Kurse und Mediendateien werden vorbereitet …");
    try {
      const response = await fetch("/api/lernen/offline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseIds: selected, sounds }), cache: "no-store" });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Download fehlgeschlagen.");
      if (!validateOfflinePack(body.pack)) throw new Error("Die heruntergeladenen Lerninhalte sind ungültig.");
      await prepareOfflineCache([...body.pack.photos.map(photo => photo.src), ...body.pack.sounds.map(sound => sound.src)]);
      await saveOfflinePack(body.pack); setPack(body.pack); setRetiredPhotoPaths([]); setCourseId(body.pack.courses[0].id); setView("lernen"); setPhotoId(""); setSoundId(""); setMessage("Dein Lernrucksack ist bereit. Du kannst diese Seite jetzt auch ohne Internet erneut öffnen.");
    } catch (failure) { setMessage(""); setError(failure.message || "Der Download konnte nicht abgeschlossen werden."); }
    finally { action.current = false; setBusy(false); }
  }
  async function remove() {
    if (action.current) return; action.current = true; setBusy(true); setError("");
    try { await clearOfflineLearning(); setPack(null); setSelected([]); setCourseId(""); setMessage("Downloads von diesem Gerät entfernt."); } catch (failure) { setError(failure.message); }
    finally { action.current = false; setBusy(false); }
  }
  const visible = courses.filter(course => [course.title, course.category].join(" ").toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de")));
  const course = pack?.courses.find(item => item.id === courseId);
  const photo = pack?.photos.find(item => item.src === photoId);
  const sound = pack?.sounds.find(item => item.id === soundId);
  function expire() { setPack(null); setMessage("Der gespeicherte Zugang ist abgelaufen. Bitte online erneuern."); }
  function canRead() { if (pack && Date.now() < pack.expiresAt) return true; expire(); return false; }
  return <LearningToolLayout title="Offline-Lernrucksack" description="Nimm ausgewählte Kurse, echte Fotos und Originalstimmen mit ins Revier oder auf die Reise." icon="download" category="ausruestung-technik" stats={[{ value: "8", label: "Kurse pro Paket" }, { value: "7 Tage", label: "maximal offline" }]}>
    <section className={styles.panel}><h2>{online ? "Für unterwegs vorbereiten" : "Du lernst gerade offline"}</h2><p>Downloads bleiben auf diesem Gerät. Für das Herunterladen brauchst du einen aktiven Zugang. Ein Paket gilt höchstens sieben Tage, bei kürzerem Test- oder Abo-Zugang bis zu dessen Ende. Online kannst du es erneuern.</p><p className={styles.muted}>Beim Abmelden werden die Downloads entfernt. Browserdaten oder Betriebssystembereinigung können sie ebenfalls löschen. Öffne für unterwegs diese Seite einmal über ihre gespeicherte Webadresse.</p>
      {message && <p className={styles.note} role="status">{message}</p>}{error && <p className={styles.wrong} role="alert">{error}</p>}{!loaded && <p role="status">Lokalen Lernrucksack laden …</p>}
      {downloadSupport !== "supported" && <p id="offline-download-support" className={styles.note} role="status">{downloadSupport === "checking" ? "Offline-Downloads auf diesem Gerät prüfen …" : <>Neue Offline-Downloads sind in dieser Ansicht nicht verfügbar. Öffne Jagdlatein dafür in einem aktuellen Browser mit Internetverbindung. Bereits gespeicherte Kurse kannst du bis zum Ablauf weiter nutzen und entfernen.</>}</p>}
      <label className={styles.field}>Kurse durchsuchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Kurstitel oder Kategorie" /></label>
      <p>{selected.length} von {OFFLINE_MAX_COURSES} ausgewählt</p><div className={extra.courseList}>{visible.map(item => <label key={item.id} className={extra.course}><input type="checkbox" checked={selected.includes(item.id)} disabled={busy || downloadSupport !== "supported" || (!selected.includes(item.id) && selected.length >= OFFLINE_MAX_COURSES)} onChange={event => setSelected(current => event.target.checked ? [...current.filter(id => id !== item.id), item.id].slice(0, 8) : current.filter(id => id !== item.id))} /><span><strong>{item.title}</strong><small>{item.category} · {item.lessonCount} Lektionen · {item.questionCount} Fragen</small></span></label>)}</div>
      {visible.length === 0 && <p>Kein Kurs passt zu diesem Suchbegriff.</p>}
      <label className={extra.check}><input type="checkbox" checked={sounds} disabled={busy || downloadSupport !== "supported"} onChange={event => setSounds(event.target.checked)} />Alle {learningAudioPaths.length} Originalstimmen mitnehmen</label>
      <div className={styles.actions}><button className={styles.primary} disabled={busy || !online || !loaded || !selected.length || downloadSupport !== "supported"} aria-describedby={downloadSupport !== "supported" ? "offline-download-support" : undefined} onClick={download}>{busy ? "Bitte warten …" : pack ? "Auswahl neu herunterladen" : "Lernrucksack herunterladen"}</button>{loaded && <button className={styles.secondary} disabled={busy} onClick={remove}>Downloads entfernen</button>}</div>
    </section>
    {pack && <><section className={styles.panel}><h2>Gespeicherte Kurse</h2><p>{pack.courses.length} Kurse · {pack.photos.length} Fotos · {pack.sounds.length} Aufnahmen<br />Heruntergeladen: {date(pack.createdAt)} · Verfügbar bis {date(pack.expiresAt)}</p>
      <div className={extra.readerSelection}>
        <label className={styles.field}>Ansicht<select value={view} onChange={event => { const value = event.target.value; if (!["lernen", "fotos", "stimmen"].includes(value) || value === "fotos" && !pack.photos.length || value === "stimmen" && !pack.sounds.length || !canRead()) return; setView(value); }}><option value="lernen">Lernen</option><option value="fotos" disabled={!pack.photos.length}>Fotos</option><option value="stimmen" disabled={!pack.sounds.length}>Stimmen</option></select></label>
        {view === "lernen" && <label className={styles.field}>Gespeicherten Kurs öffnen<select value={courseId} onChange={event => { if (pack.courses.some(item => item.id === event.target.value) && canRead()) setCourseId(event.target.value); }}>{pack.courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
        {view === "fotos" && <label className={styles.field}>Foto auswählen<select value={photoId} onChange={event => { if (pack.photos.some(item => item.src === event.target.value) && canRead()) setPhotoId(event.target.value); }}><option value="">Bitte ein Foto auswählen</option>{pack.photos.map(item => <option key={item.src} value={item.src}>{item.alt}</option>)}</select></label>}
        {view === "stimmen" && <label className={styles.field}>Stimme auswählen<select value={soundId} onChange={event => { if (pack.sounds.some(item => item.id === event.target.value) && canRead()) setSoundId(event.target.value); }}><option value="">Bitte eine Stimme auswählen</option>{pack.sounds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      </div></section>
      {view === "lernen" && course && <OfflineCourse key={`${pack.id}:${course.id}`} course={course} expiresAt={pack.expiresAt} onExpired={expire} photoMap={pack.lessonPhotos?.[course.id] || {}} />}
      {view === "fotos" && <section className={styles.panel}><h2>Mitgenommene Fotografien</h2>{photo ? <OfflinePhoto photo={photo} retired={retiredPhotoPaths.includes(photo.src)} key={`${pack.id}:${photo.src}`} /> : <p>Wähle ein Foto. Die Aufnahme und ihr Bildnachweis erscheinen hier.</p>}</section>}
      {view === "stimmen" && <section className={styles.panel}><h2>Originalstimmen unterwegs</h2>{sound ? <article className={styles.card} key={`${pack.id}:${sound.id}`}><h3>{sound.name}</h3><audio controls preload="none" src={sound.src} aria-label={`Originalaufnahme ${sound.name}`} /><p>{sound.explanation}</p><p className={styles.muted}>Aufnahme: {sound.author} · {sound.licenseUrl ? <a href={sound.licenseUrl} target="_blank" rel="noopener noreferrer">{sound.license}</a> : sound.license}</p>{sound.recording && <p className={styles.muted}>{sound.recording}</p>}{sound.modifications && <p className={styles.muted}>{sound.modifications}</p>}<p><a href={sound.sourceUrl} target="_blank" rel="noopener noreferrer">Originalquelle mit Aufnahme- und Lizenznachweis</a></p></article> : <p>Wähle eine Stimme. Die Originalaufnahme startet erst, wenn du sie abspielst.</p>}</section>}
    </>}
  </LearningToolLayout>;
}
