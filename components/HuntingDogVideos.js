import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu } from "./PageMenu";
import { dogVideoSources, huntingDogVideoLessons } from "../lib/hunting-dog-video-lessons";
import styles from "../styles/DogCutLearning.module.css";

function ObservationQuestion({ question }) {
  const [selected, setSelected] = useState(null);
  const correct = selected === question.answer;
  return <details className={styles.question}>
    <summary>{question.question}</summary>
    <fieldset><legend className={styles.visuallyHidden}>{question.question}</legend>
      {question.choices.map((choice, index) => <label key={choice} className={styles.answer}>
        <input type="radio" name={question.id} value={index} checked={selected === index} onChange={() => setSelected(index)} />{choice}
      </label>)}
    </fieldset>
    {selected !== null && <p className={correct ? styles.correct : styles.feedback} role="status"><strong>{correct ? "Richtig eingeordnet. " : "Schau noch einmal auf den Ausschnitt. "}</strong>{question.explanation}</p>}
  </details>;
}

export default function HuntingDogVideos() {
  const router = useRouter();
  const [failedId, setFailedId] = useState(null);
  const [navigationError, setNavigationError] = useState("");
  const heading = useRef(null);
  const transcriptHeading = useRef(null);
  const initialized = useRef(false);
  const selectionRequest = useRef(0);
  const pendingRequest = useRef(null);
  const requested = router.isReady ? router.query.eintrag : undefined;
  // The committed URL is the selection, including reload and Back/Forward.
  // Arrays and unknown identifiers never select another or arbitrary resource.
  const lesson = huntingDogVideoLessons.find(item => typeof requested === "string" && item.id === requested) || huntingDogVideoLessons[0];
  const activeLesson = useRef({ id: lesson.id });
  if (activeLesson.current.id !== lesson.id) activeLesson.current = { id: lesson.id };
  const renderedLesson = activeLesson.current;
  function focusContent() {
    const target = window.location.hash === "#hundevideo-handlung" ? transcriptHeading.current : heading.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    if (!router.isReady) return;
    const shouldFocus = initialized.current || typeof requested === "string" || ["#hundevideo-film", "#hundevideo-handlung"].includes(window.location.hash);
    initialized.current = true;
    setFailedId(null);
    setNavigationError("");
    if (shouldFocus) { closePageMenu(); focusContent(); }
  }, [router.isReady, lesson.id, router.asPath]);
  useEffect(() => () => { selectionRequest.current += 1; pendingRequest.current = null; }, []);
  async function changeLesson(id) {
    if (!router.isReady || !huntingDogVideoLessons.some(item => item.id === id)) return;
    setNavigationError("");
    if (id === lesson.id && pendingRequest.current === null) { closePageMenu(); focusContent(); return; }
    const request = ++selectionRequest.current;
    pendingRequest.current = request;
    try {
      // Push preserves one history step per chosen scene. A rejected/cancelled
      // route never displays content that disagrees with the address bar.
      await router.push({ pathname: router.pathname, query: { ...router.query, eintrag: id }, hash: "hundevideo-film" }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (!error?.cancelled && request === selectionRequest.current) setNavigationError("Die Szene konnte nicht geöffnet werden. Bitte wähle sie erneut.");
    } finally {
      // Re-selecting the committed scene must still supersede another pending
      // push. An older completion cannot release the newer navigation's guard.
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  return <LearningToolLayout title="Jagdhunde im Video" description="Echte Aufnahmen: Arbeitsschritte beobachten, Körpersprache vorsichtig einordnen und hilfreiche Lernprinzipien verstehen." icon="hundewesen" category="hundewesen" headingOnly hideCommunity>
    <PageMenu title="Jagdhundvideos – Szene wählen">
      <section className={styles.selector} aria-label="Video auswählen">
        <label htmlFor="hundevideo-auswahl">Welche Szene möchtest du ansehen?</label>
        <select id="hundevideo-auswahl" value={lesson.id} onChange={event => changeLesson(event.target.value)}>{huntingDogVideoLessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        {navigationError && <p className={styles.feedback} role="alert">{navigationError}</p>}
      </section>
      <Link href="/lernen/videos">Alle Lernvideos</Link>
      <Link href="/lernen/jagdhunde">Jagdhunderassen und ihre Arbeitsgebiete</Link>
    </PageMenu>
    <article key={lesson.id} className={styles.videoLesson} id="hundevideo-film">
      <header className={styles.sectionHeader}><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p>{lesson.breed} · {Math.ceil(lesson.duration)} Sekunden · ohne Ton, mit Handlungstext</p></header>
      <video className={styles.video} controls playsInline preload="none" poster={lesson.poster} aria-label={lesson.title} aria-describedby="hundevideo-handlung" onError={() => { if (activeLesson.current === renderedLesson) setFailedId(lesson.id); }}>
        <source src={lesson.src} type="video/mp4" />
        <track kind="captions" src={lesson.captions} srcLang="de" label="Deutsch: sichtbare Handlung" default />
        Dein Browser kann dieses Video nicht abspielen. Die vollständige Handlung steht unter dem Video.
      </video>
      {failedId === lesson.id && <p className={styles.feedback} role="alert">Das Video lässt sich gerade nicht abspielen. Die Handlung und die geprüften Beobachtungen stehen hier auch als Text. Über die Originalquelle kannst du die Aufnahme aufrufen.</p>}
      <div className={styles.twoColumns}>
        <section className={styles.observation}><h3>Im Bild erkennbar</h3><ol>{lesson.observations.map(item => <li key={item.at}><strong>{item.at}</strong>{item.text}</li>)}</ol></section>
        <section className={styles.context}><h3>Hintergrund der Aufnahme</h3><p>{lesson.context}</p></section>
      </div>
      <section className={styles.learningText}><h3>Was du daraus lernen kannst</h3><p>{lesson.lesson}</p><p>{lesson.practice}</p></section>
      <section className={styles.learningText} id="hundevideo-handlung"><h3 ref={transcriptHeading} tabIndex={-1}>Handlung als Text</h3><p>{lesson.transcript}</p></section>
      <section className={styles.checks} aria-label="Beobachtung prüfen"><h3>Deine Beobachtung prüfen</h3>{lesson.questions.map(question => <ObservationQuestion key={`${lesson.id}-${question.id}`} question={question} />)}</section>
      <details className={styles.details}><summary>Fachquellen, Bildnachweis und Prüfstand</summary><p>{lesson.media.author} · <a href={lesson.media.source} target="_blank" rel="noopener noreferrer">Originalquelle</a> · <a href={lesson.media.licenseUrl} target="_blank" rel="noopener noreferrer">{lesson.media.license}</a></p><p>{lesson.media.recordingDate}. {lesson.media.changes}</p><p>Inhalt und sichtbare Szenen geprüft am 12. Oktober 2026. Die Fachquellen erklären das jeweilige Thema; sie sind keine Bewertung dieses einzelnen Hundes.</p><ul>{lesson.sources.map(id => <li key={id}><a href={dogVideoSources[id].url} target="_blank" rel="noopener noreferrer">{dogVideoSources[id].organization}: {dogVideoSources[id].label}</a></li>)}</ul></details>
    </article>
  </LearningToolLayout>;
}
