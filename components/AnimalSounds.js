import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { animalSounds, animalSoundById, shuffledSoundIds, soundFeedback } from "../lib/animal-sounds";
import experienceStyles from "../styles/LearningExperience.module.css";
import styles from "../styles/AnimalSounds.module.css";

function SoundCredit({ sound, full = true }) {
  return <div className={styles.credit}>
    <span>Aufnahme: {sound.author} · <a href={sound.licenseUrl} target="_blank" rel="noreferrer">{sound.license}</a></span>
    {full && <><span>{sound.recording}</span><span>{sound.modifications}</span><a href={sound.sourceUrl} target="_blank" rel="noreferrer">Originalquelle mit Aufnahme- und Lizenznachweis</a></>}
  </div>;
}

export function SoundPlayer({ sound, label, onPlay, reveal = true }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div className={styles.player}>
    <audio key={`${sound.id}-${attempt}`} controls preload="none" aria-label={label} onPlay={onPlay} onError={() => setFailed(true)}>
      <source src={sound.src} type="audio/mpeg" />
      Dein Browser kann diese Aufnahme nicht direkt abspielen.
    </audio>
    <p className={styles.duration}>{Math.round(sound.duration)} Sekunden · Originalaufnahme · Start über die Wiedergabetaste</p>
    {failed && <div className={styles.error} role="alert">
      <p>Die Aufnahme konnte nicht abgespielt werden. Prüfe die Verbindung und versuche es erneut.</p>
      <button type="button" className={experienceStyles.secondary} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Noch einmal laden</button>
      <a href={sound.sourceUrl} target="_blank" rel="noreferrer">Bei der Originalquelle abspielen{!reveal && " (verrät die Art)"}</a>
    </div>}
    <SoundCredit sound={sound} full={reveal} />
  </div>;
}

export default function AnimalSounds() {
  const [mode, setMode] = useState("library");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(animalSounds.map(sound => sound.id));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [heard, setHeard] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const playing = useRef(null);
  useEffect(() => () => { playing.current?.pause(); }, []);
  // Native double clicks and callbacks from an older question must not count
  // an answer twice or advance a newly restarted round.
  const quizGuard = useRef({ generation: 0, index: 0, answered: false, heard: false });
  const generation = quizGuard.current.generation;
  const sound = animalSoundById[order[index]];
  const mistakes = results.filter(result => !result.correct).map(result => result.id);
  const correct = results.filter(result => result.correct).length;
  const filtered = animalSounds.filter(item => `${item.name} ${item.scientificName} ${item.call}`.toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de").trim()));

  function pauseAudio() {
    if (playing.current) playing.current.pause();
    playing.current = null;
  }

  function playAudio(event, quiz = false) {
    if (quiz && (quizGuard.current.generation !== generation || quizGuard.current.index !== index)) {
      event.currentTarget.pause();
      return;
    }
    if (playing.current && playing.current !== event.currentTarget) playing.current.pause();
    playing.current = event.currentTarget;
    if (quiz) { quizGuard.current.heard = true; setHeard(true); }
  }

  function startQuiz(ids = animalSounds) {
    pauseAudio();
    quizGuard.current = { generation: quizGuard.current.generation + 1, index: 0, answered: false, heard: false };
    setOrder(shuffledSoundIds(ids));
    setIndex(0);
    setAnswer(null);
    setHeard(false);
    setResults([]);
    setFinished(false);
    setMode("quiz");
  }

  function submitAnswer(id) {
    const guard = quizGuard.current;
    if (guard.generation !== generation || guard.index !== index || guard.answered || (id && !guard.heard)) return;
    guard.answered = true;
    setAnswer(id || "skipped");
    setResults(current => [...current, { id: sound.id, selected: id, correct: id === sound.id }]);
  }

  function nextSound() {
    const guard = quizGuard.current;
    if (guard.generation !== generation || guard.index !== index || !guard.answered) return;
    guard.index = index + 1;
    guard.answered = false;
    guard.heard = false;
    pauseAudio();
    if (index + 1 === order.length) setFinished(true);
    else { setIndex(index + 1); setAnswer(null); setHeard(false); }
  }

  function openLibrary() { pauseAudio(); quizGuard.current.generation += 1; setMode("library"); }

  return <LearningToolLayout title="Tierstimmen entdecken" description="Höre echte Originalaufnahmen aus der Natur, entdecke typische Hörmerkmale und übe im erklärten Hörquiz." icon="sound" category="wildkunde" stats={[{ value: animalSounds.length, label: "Originalaufnahmen" }, { value: "immer", label: "erklärte Antworten" }, { value: "ohne", label: "Zeitdruck" }]}>
      <div className={experienceStyles.modeButtons} aria-label="Lernmodus">
        <button type="button" aria-pressed={mode === "library"} onClick={openLibrary}>Stimmen entdecken</button>
        <button type="button" aria-pressed={mode === "quiz"} onClick={() => { if (mode !== "quiz") startQuiz(); }}>Hörquiz starten</button>
      </div>

      {mode === "library" ? <>
        <section className={styles.strategy} aria-labelledby="hearing-strategy">
          <h2 id="hearing-strategy">So hörst du genauer hin</h2>
          <ol><li><strong>Klang:</strong> tief oder hoch, weich oder rau?</li><li><strong>Rhythmus:</strong> einzelne Rufe, Rufgruppen oder längere Strophen?</li><li><strong>Zusammenhang:</strong> Welche anderen Stimmen sind im Hintergrund zu hören?</li></ol>
          <p>Eine Aufnahme zeigt einen Ausschnitt aus dem Repertoire. Ähnliche Arten, Nachahmung und Nebengeräusche können täuschen. Im Revier ergänzen Sichtbeobachtung, Lebensraum und Verhalten das Hören. Spiele die Aufnahmen zum Lernen zu Hause ab; vermeide es, Wildtiere draußen durch Wiedergabe zu stören.</p>
        </section>
        <div className={styles.libraryHeading}><h2>Deine Stimmenbibliothek</h2><label>Stimme suchen<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Zum Beispiel Waldkauz oder Gurren" /></label></div>
        <div className={styles.library}>{filtered.map(item => <article key={item.id} className={styles.soundCard}>
          <div className={styles.cardHeading}><span className={styles.speciesIcon}><AppIcon name={item.group === "Säugetiere" ? "deer" : "sound"} size={27} /></span><div><h3>{item.name}</h3><p><i>{item.scientificName}</i> · {item.call}</p></div></div>
          <SoundPlayer sound={item} label={`${item.name}: ${item.call} abspielen`} onPlay={event => playAudio(event)} />
          <div className={styles.cue}><strong>Darauf hörst du</strong><p>{item.cue}</p></div>
          <p>{item.context}</p>
          <details><summary>Ähnliche Stimmen und Grenzen der Bestimmung</summary><p>{item.confusion}</p></details>
          <a className={styles.sourceLink} href={item.factsUrl} target="_blank" rel="noreferrer">{item.factsTitle}</a>
        </article>)}</div>
        {filtered.length === 0 && <p className={styles.empty}>Keine passende Stimme gefunden. Suche mit einem anderen Begriff oder <button type="button" onClick={() => setSearch("")}>zeige alle Stimmen</button>.</p>}
        <div className={styles.startPanel}><h2>Bereit, nur mit den Ohren zu bestimmen?</h2><p>Die Reihenfolge wird bei jedem Start neu gemischt. Du kannst jede Aufnahme mehrmals hören.</p><button type="button" className={experienceStyles.primary} onClick={() => startQuiz()}>Hörquiz mit 8 Stimmen starten<AppIcon name="arrow-right" size={20} /></button></div>
      </> : finished ? <section className={styles.result} aria-labelledby="sound-result">
        <span className={styles.resultIcon}><AppIcon name="sound" size={38} /></span>
        <h2 id="sound-result">Deine Hörrunde ist abgeschlossen</h2>
        <p className={styles.score}>{correct} von {order.length} Stimmen erkannt</p>
        <p>{mistakes.length ? "Vergleiche die Hörmerkmale noch einmal. Bei der Wiederholung kommen nur die Stimmen vor, die du noch nicht erkannt oder übersprungen hast." : "Du hast alle Stimmen in dieser Runde erkannt. Eine neue Runde mischt die Reihenfolge erneut."}</p>
        <ul className={styles.resultList}>{results.map(result => <li key={result.id}><strong>{animalSoundById[result.id].name}</strong><span>{result.correct ? "Erkannt" : result.selected ? "Noch einmal hören" : "Übersprungen"}</span></li>)}</ul>
        <div className={styles.actions}>{mistakes.length > 0 && <button type="button" className={experienceStyles.primary} onClick={() => startQuiz(mistakes)}>Unsichere Stimmen wiederholen</button>}<button type="button" className={experienceStyles.secondary} onClick={() => startQuiz()}>Neue Runde mit allen Stimmen</button><button type="button" className={experienceStyles.secondary} onClick={openLibrary}>Zur Stimmenbibliothek</button></div>
        <p className={styles.sessionNote}>Das Ergebnis gilt für diese Übungsrunde und wird nicht als Kursabschluss gespeichert.</p>
      </section> : <section className={styles.quiz} aria-labelledby="sound-question">
        <div className={styles.quizTop}><span>Aufnahme {index + 1} von {order.length}</span><span>{correct} richtig erkannt</span></div>
        <progress value={index + (answer !== null ? 1 : 0)} max={order.length} aria-label="Fortschritt der Hörrunde" />
        <h2 id="sound-question">Welche Art hörst du im Vordergrund?</h2>
        <p>Starte die Aufnahme und höre sie bei Bedarf noch einmal. Wähle danach deine Antwort.</p>
        <SoundPlayer key={sound.id} sound={sound} label={`Quizaufnahme ${index + 1} abspielen`} onPlay={event => playAudio(event, true)} reveal={answer !== null} />
        <div className={styles.answers} aria-label="Antwortmöglichkeiten">{sound.options.map(id => <button key={id} type="button" className={[styles.answer, answer !== null && id === sound.id ? styles.right : "", answer === id && id !== sound.id ? styles.wrong : ""].filter(Boolean).join(" ")} disabled={answer !== null || !heard} onClick={() => submitAnswer(id)}>{animalSoundById[id].name}{answer !== null && id === sound.id && <span>Richtige Antwort</span>}{answer === id && id !== sound.id && <span>Deine Antwort</span>}</button>)}</div>
        {answer === null && <><p className={styles.hint}>{heard ? "Welche Hörmerkmale passen? Deine Antwort wird anschließend erklärt." : "Die Antworten werden freigeschaltet, sobald die Wiedergabe startet."}</p><button type="button" className={styles.skip} onClick={() => submitAnswer(null)}>Ich weiß es noch nicht / Aufnahme überspringen</button></>}
        {answer !== null && <div className={styles.feedback} role="status" aria-live="polite">
          <h3>{answer === sound.id ? "Richtig erkannt" : answer === "skipped" ? "Gemeinsam nachhören" : `Es ist ${sound.name}`}</h3>
          <p>{soundFeedback(sound, answer === "skipped" ? null : answer)}</p><p><strong>Beachte:</strong> {sound.confusion}</p>
          <div className={styles.feedbackLinks}><a href={sound.factsUrl} target="_blank" rel="noreferrer">Fachquelle zur Art</a><Link href={sound.lessonUrl}>Passende Lerneinheit</Link></div>
          <button type="button" className={experienceStyles.primary} onClick={nextSound}>{index + 1 === order.length ? "Ergebnis ansehen" : "Nächste Aufnahme"}<AppIcon name="arrow-right" size={20} /></button>
        </div>}
      </section>}
      <aside className={styles.more}><AppIcon name="book" size={24} /><div><strong>Hören mit Beobachten verbinden</strong><p>Vertiefe Körpermerkmale, Lebensweise und Verhalten in Wildkunde.</p><Link href="/lernen/wildkunde">Zur Kategorie Wildkunde<AppIcon name="arrow-right" size={18} /></Link></div></aside>
  </LearningToolLayout>;
}
