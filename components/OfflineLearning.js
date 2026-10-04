import { useEffect, useRef, useState } from "react";
import LearningToolLayout from "./LearningToolLayout";
import { readOfflinePack, saveOfflinePack, clearOfflineLearning, prepareOfflineCache, validateOfflinePack, OFFLINE_MAX_COURSES } from "../lib/offline-learning";
import styles from "../styles/LearningExperience.module.css";
import extra from "../styles/OfflineLearning.module.css";
const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };
const date = value => new Date(value).toLocaleString("de-CH");
function OfflineCourse({ course, expiresAt, onExpired }) {
  const legal = course.category === "Jagdrecht";
  const [country, setCountry] = useState(course.countries[0]);
  const [lesson, setLesson] = useState(0);
  const [run, setRun] = useState({ index: 0, answers: {}, score: 0 });
  const active = useRef(run);
  const questions = legal ? course.questions.filter(question => question.countries.includes(country)) : course.questions;
  const question = questions[run.index]; const answer = question ? run.answers[question.id] : undefined;
  function allowed() { if (Date.now() < expiresAt) return true; onExpired(); return false; }
  function update(next) { active.current = next; setRun(next); }
  function choose(id) { if (!allowed() || active.current !== run || !question || answer !== undefined || !question.answers.some(item => item.id === id)) return; update({ ...run, answers: { ...run.answers, [question.id]: id }, score: run.score + Number(question.correct.includes(id)) }); }
  const current = course.lessons[lesson];
  return <>
    <section className={styles.panel}><h2>{course.title}</h2><p>{course.description}</p><h3>Das lernst du</h3><ul>{course.objectives.map(item => <li key={item}>{item}</li>)}</ul>
      {legal ? <><label className={styles.field}>Land<select value={country} onChange={event => { if (!allowed()) return; setCountry(event.target.value); update({ index: 0, answers: {}, score: 0 }); }}>{course.countries.map(id => <option key={id} value={id}>{countryNames[id]}</option>)}</select></label><p className={styles.note}><strong>{countryNames[country]}:</strong> {course.countryNotes[country]}</p></> : <details><summary>Regionale Hinweise</summary>{course.countries.map(id => <p key={id}><strong>{countryNames[id]}:</strong> {course.countryNotes[id]}</p>)}</details>}
      <label className={styles.field}>Lektion<select value={lesson} onChange={event => { if (allowed()) setLesson(Number(event.target.value)); }}>{course.lessons.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}</select></label>
      <h3>{current.title}</h3>{current.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<aside className={styles.note}><strong>Merke dir</strong><p>{current.takeaway}</p><strong>Zum Nachdenken</strong><p>{current.exercise}</p></aside>
    </section>
    {question && <section className={styles.panel}><h2>Offline-Wissenscheck</h2><p className={styles.muted}>Ergebnisse gelten für diese Übungsrunde. Ein Kursabschluss wird hier nicht im Konto gespeichert.</p><p>Frage {run.index + 1} von {questions.length} · {run.score} richtig</p>{(question.topic === "Recht" || question.countries.length < 3) && <p className={styles.note}>Geltungsbereich dieser Frage: {question.countries.map(id => countryNames[id]).join(" · ")}</p>}<h3>{question.q}</h3>
      <div className={styles.choices}>{question.answers.map(item => <button className={`${styles.choice} ${answer !== undefined && question.correct.includes(item.id) ? styles.correct : answer === item.id ? styles.wrong : ""}`} key={item.id} disabled={answer !== undefined} onClick={() => choose(item.id)}>{item.text}{answer !== undefined && question.correct.includes(item.id) && " ✓"}</button>)}</div>
      {answer !== undefined && <div className={styles.feedback} role="status"><strong>{question.correct.includes(answer) ? "Richtig." : "Diese Antwort passt nicht."}</strong><p>{question.explain}</p>{run.index + 1 < questions.length ? <button className={styles.primary} onClick={() => { if (allowed() && active.current === run) update({ ...run, index: run.index + 1 }); }}>Nächste Frage</button> : <><p>{run.score} von {questions.length} richtig.</p><button className={styles.secondary} onClick={() => { if (allowed() && active.current === run) update({ index: 0, answers: {}, score: 0 }); }}>Noch einmal üben</button></>}</div>}
    </section>}
    <section className={styles.panel}><h2>Fachquellen</h2><p>Zum Öffnen der Originalquellen brauchst du eine Internetverbindung.</p><ul className={styles.sources}>{course.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></section>
  </>;
}
export default function OfflineLearning({ courses }) {
  const [pack, setPack] = useState(null); const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState([]); const [sounds, setSounds] = useState(true);
  const [query, setQuery] = useState(""); const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [online, setOnline] = useState(true); const action = useRef(false);
  useEffect(() => {
    let alive = true;
    readOfflinePack().then(({ pack: saved, expired }) => { if (alive) { setPack(saved); setCourseId(saved?.courses[0]?.id || ""); setSelected(saved?.courses.map(course => course.id) || []); if (expired) setMessage("Der gespeicherte Zugang ist abgelaufen. Bitte mit Internetverbindung neu herunterladen."); } }).catch(failure => { if (alive) setError(failure.message); }).finally(() => { if (alive) setLoaded(true); });
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
    if (action.current || !selected.length || !online) return;
    action.current = true; setBusy(true); setError(""); setMessage("Kurse und Mediendateien werden vorbereitet …");
    try {
      const response = await fetch("/api/lernen/offline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseIds: selected, sounds }), cache: "no-store" });
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Download fehlgeschlagen.");
      if (!validateOfflinePack(body.pack)) throw new Error("Die heruntergeladenen Lerninhalte sind ungültig.");
      await prepareOfflineCache([...body.pack.photos.map(photo => photo.src), ...body.pack.sounds.map(sound => sound.src)]);
      await saveOfflinePack(body.pack); setPack(body.pack); setCourseId(body.pack.courses[0].id); setMessage("Dein Lernrucksack ist bereit. Du kannst diese Seite jetzt auch ohne Internet erneut öffnen.");
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
  return <LearningToolLayout title="Offline-Lernrucksack" description="Nimm ausgewählte Kurse, echte Fotos und Originalstimmen mit ins Revier oder auf die Reise." icon="download" category="ausruestung-technik" stats={[{ value: "8", label: "Kurse pro Paket" }, { value: "7 Tage", label: "maximal offline" }]}>
    <section className={styles.panel}><h2>{online ? "Für unterwegs vorbereiten" : "Du lernst gerade offline"}</h2><p>Downloads bleiben auf diesem Gerät. Für das Herunterladen brauchst du einen aktiven Zugang. Ein Paket gilt höchstens sieben Tage, bei kürzerem Test- oder Abo-Zugang bis zu dessen Ende. Online kannst du es erneuern.</p><p className={styles.muted}>Beim Abmelden werden die Downloads entfernt. Browserdaten oder Betriebssystembereinigung können sie ebenfalls löschen. Öffne für unterwegs diese Seite einmal über ihre gespeicherte Webadresse.</p>
      {message && <p className={styles.note} role="status">{message}</p>}{error && <p className={styles.wrong} role="alert">{error}</p>}{!loaded && <p role="status">Lokalen Lernrucksack laden …</p>}
      <label className={styles.field}>Kurse durchsuchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Kurstitel oder Kategorie" /></label>
      <p>{selected.length} von {OFFLINE_MAX_COURSES} ausgewählt</p><div className={extra.courseList}>{visible.map(item => <label key={item.id} className={extra.course}><input type="checkbox" checked={selected.includes(item.id)} disabled={busy || (!selected.includes(item.id) && selected.length >= OFFLINE_MAX_COURSES)} onChange={event => setSelected(current => event.target.checked ? [...current.filter(id => id !== item.id), item.id].slice(0, 8) : current.filter(id => id !== item.id))} /><span><strong>{item.title}</strong><small>{item.category} · {item.lessonCount} Lektionen · {item.questionCount} Fragen</small></span></label>)}</div>
      {visible.length === 0 && <p>Kein Kurs passt zu diesem Suchbegriff.</p>}
      <label className={extra.check}><input type="checkbox" checked={sounds} disabled={busy} onChange={event => setSounds(event.target.checked)} />Alle acht Originalstimmen mitnehmen</label>
      <div className={styles.actions}><button className={styles.primary} disabled={busy || !online || !loaded || !selected.length} onClick={download}>{busy ? "Bitte warten …" : pack ? "Auswahl neu herunterladen" : "Lernrucksack herunterladen"}</button>{loaded && <button className={styles.secondary} disabled={busy} onClick={remove}>Downloads entfernen</button>}</div>
    </section>
    {pack && <><section className={styles.panel}><h2>Gespeicherte Kurse</h2><p>{pack.courses.length} Kurse · {pack.photos.length} Fotos · {pack.sounds.length} Aufnahmen<br />Heruntergeladen: {date(pack.createdAt)} · Verfügbar bis {date(pack.expiresAt)}</p><label className={styles.field}>Gespeicherten Kurs öffnen<select value={courseId} onChange={event => setCourseId(event.target.value)}>{pack.courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></section>
      {course && <OfflineCourse key={`${pack.id}:${course.id}`} course={course} expiresAt={pack.expiresAt} onExpired={() => { setPack(null); setMessage("Der gespeicherte Zugang ist abgelaufen. Bitte online erneuern."); }} />}
      {pack.photos.length > 0 && <section className={styles.panel}><h2>Mitgenommene Fotografien</h2><div className={styles.grid}>{pack.photos.map(photo => <figure className={styles.figure} key={photo.src}><img src={photo.src} alt={photo.alt} loading="lazy" /><figcaption>{photo.alt}<br />{photo.creditUrl ? <a href={photo.creditUrl} target="_blank" rel="noopener noreferrer">{photo.credit}</a> : photo.credit}</figcaption></figure>)}</div></section>}
      {pack.sounds.length > 0 && <section className={styles.panel}><h2>Originalstimmen unterwegs</h2><div className={styles.grid}>{pack.sounds.map(sound => <article className={styles.card} key={sound.id}><h3>{sound.name}</h3><audio controls preload="none" src={sound.src} aria-label={`Originalaufnahme ${sound.name}`} /><p>{sound.explanation}</p><p className={styles.muted}><a href={sound.sourceUrl} target="_blank" rel="noopener noreferrer">Aufnahme: {sound.author} · {sound.license}</a></p></article>)}</div></section>}
    </>}
  </LearningToolLayout>;
}
