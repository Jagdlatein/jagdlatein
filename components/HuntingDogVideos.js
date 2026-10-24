import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { dogVideoSources, huntingDogVideoLessons } from "../lib/hunting-dog-video-lessons";
import styles from "../styles/DogCutLearning.module.css";

export function ObservationQuestion({ question, scope, canInteract }) {
  const mounted = useRef(false);
  const questionSession = useRef({ question });
  if (questionSession.current.question !== question) questionSession.current = { question };
  const session = questionSession.current;
  const latest = useRef({ question, scope });
  latest.current = { question, scope };
  const [answer, setAnswer] = useState(null);
  const selected = answer?.session === session ? answer.index : null;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  function choose(index) {
    if (!mounted.current || questionSession.current !== session || latest.current.question !== question || latest.current.scope !== scope || typeof canInteract !== "function" || !canInteract()) return;
    if (Number.isInteger(index) && index >= 0 && index < question.choices.length) setAnswer({ session, index });
  }
  const correct = selected === question.answer;
  return <details className={styles.question}>
    <summary>{question.question}</summary>
    <fieldset><legend className={styles.visuallyHidden}>{question.question}</legend>
      {question.choices.map((choice, index) => <label key={choice} className={styles.answer}>
        <input type="radio" name={question.id} value={index} checked={selected === index} onChange={() => choose(index)} />{choice}
      </label>)}
    </fieldset>
    {selected !== null && <p className={correct ? styles.correct : styles.feedback} role="status"><strong>{correct ? "Richtig eingeordnet. " : "Schau noch einmal auf den Ausschnitt. "}</strong>{question.explanation}</p>}
  </details>;
}

export default function HuntingDogVideos() {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query.eintrag;
  const lesson = ready ? requested === undefined ? huntingDogVideoLessons[0]
    : huntingDogVideoLessons.find(item => typeof requested === "string" && item.id === requested) || null : null;
  const requestedSection = (router.asPath || "").split("#")[1];
  const section = ["hundevideo-film", "hundevideo-handlung", "hundevideo-auswahl"].includes(requestedSection) ? requestedSection : "hundevideo-film";
  const [mediaFailure, setMediaFailure] = useState(null);
  const [navigationError, setNavigationError] = useState("");
  const heading = useRef(null);
  const transcriptHeading = useRef(null);
  const player = useRef(null);
  const mounted = useRef(false);
  const selectionRequest = useRef(0);
  const pendingRequest = useRef(null);
  // Missing fields keep the first entry. Explicit invalid fields do not
  // substitute another film, and unready router data never chooses a film.
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  function currentView() { return mounted.current && ready && !!lesson && committedView.current === origin; }
  function focusContent(targetSection = section) {
    const target = targetSection === "hundevideo-handlung" ? transcriptHeading.current : heading.current;
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; selectionRequest.current++; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    const previousPlayer = player.current;
    return () => { (previousPlayer || player.current)?.pause?.(); };
  }, [origin]);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!lesson || section === "hundevideo-auswahl") {
      const timer = setTimeout(() => {
        if (mounted.current && committedView.current === origin) openPageMenu("hundevideo-auswahl");
      }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu(); focusContent();
  }, [ready, origin, lesson?.id, section]);
  function mediaFailed() { if (currentView()) setMediaFailure(origin); }
  async function changeLesson(id) {
    if (!ready || !mounted.current || committedView.current !== origin || !huntingDogVideoLessons.some(item => item.id === id)) return;
    setNavigationError("");
    if (id === lesson?.id && pendingRequest.current === null) { closePageMenu(); focusContent(section === "hundevideo-handlung" ? section : "hundevideo-film"); return; }
    const request = ++selectionRequest.current;
    pendingRequest.current = request;
    try {
      // Push preserves one history step per chosen scene. A rejected/cancelled
      // route never displays content that disagrees with the address bar.
      const accepted = await router.push({ pathname: "/lernen/jagdhund-videos", query: { ...router.query, eintrag: id }, hash: "hundevideo-film" }, undefined, { shallow: true, scroll: false });
      if (accepted !== false && mounted.current && request === selectionRequest.current && committedView.current === origin && id === lesson?.id) {
        closePageMenu(); focusContent("hundevideo-film");
      }
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== selectionRequest.current || committedView.current !== origin) return;
      setNavigationError("Die Szene konnte nicht geöffnet werden. Bitte wähle sie erneut.");
      openPageMenu("hundevideo-auswahl");
    } finally {
      // Re-selecting the committed scene must still supersede another pending
      // push. An older completion cannot release the newer navigation's guard.
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  return <LearningToolLayout title="Jagdhunde im Video" description="Echte Aufnahmen: Arbeitsschritte beobachten, Körpersprache vorsichtig einordnen und hilfreiche Lernprinzipien verstehen." icon="hundewesen" category="hundewesen" headingOnly hideCommunity>
    <PageMenu title="Jagdhundvideos – Szene wählen" openInitially={ready && !lesson} initialFocusId="hundevideo-auswahl">
      <section className={styles.selector} aria-label="Video auswählen">
        <label htmlFor="hundevideo-auswahl">Welche Szene möchtest du ansehen?</label>
        <select id="hundevideo-auswahl" value={lesson?.id || ""} disabled={!ready} aria-controls="hundevideo-film" onChange={event => changeLesson(event.target.value)}><option value="" disabled>Szene wählen</option>{huntingDogVideoLessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        {navigationError && <p className={styles.feedback} role="alert">{navigationError}</p>}
      </section>
      <Link href="/lernen/videos">Alle Lernvideos</Link>
      <Link href="/lernen/jagdhunde">Jagdhunderassen und ihre Arbeitsgebiete</Link>
    </PageMenu>
    {lesson ? <article key={lesson.id} className={styles.videoLesson} id="hundevideo-film">
      <header className={styles.sectionHeader}><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p>{lesson.breed} · {Math.ceil(lesson.duration)} Sekunden · ohne Ton, mit Handlungstext</p></header>
      <video ref={player} className={styles.video} controls playsInline preload="none" poster={lesson.poster} aria-label={lesson.title} aria-describedby="hundevideo-handlung" onPlay={event => { if (!currentView()) event.currentTarget.pause?.(); }} onError={mediaFailed}>
        <source src={lesson.src} type="video/mp4" onError={mediaFailed} />
        <track kind="captions" src={lesson.captions} srcLang="de" label="Deutsch: sichtbare Handlung" default />
        Dein Browser kann dieses Video nicht abspielen. Die vollständige Handlung steht unter dem Video.
      </video>
      {mediaFailure === origin && <p className={styles.feedback} role="alert">Das Video lässt sich gerade nicht abspielen. Die Handlung und die geprüften Beobachtungen stehen hier auch als Text. Über die Originalquelle kannst du die Aufnahme aufrufen.</p>}
      <div className={styles.twoColumns}>
        <section className={styles.observation}><h3>Im Bild erkennbar</h3><ol>{lesson.observations.map(item => <li key={item.at}><strong>{item.at}</strong>{item.text}</li>)}</ol></section>
        <section className={styles.context}><h3>Hintergrund der Aufnahme</h3><p>{lesson.context}</p></section>
      </div>
      <section className={styles.learningText}><h3>Was du daraus lernen kannst</h3><p>{lesson.lesson}</p><p>{lesson.practice}</p></section>
      <section className={styles.learningText} id="hundevideo-handlung"><h3 ref={transcriptHeading} tabIndex={-1}>Handlung als Text</h3><p>{lesson.transcript}</p></section>
      <section className={styles.checks} aria-label="Beobachtung prüfen"><h3>Deine Beobachtung prüfen</h3>{lesson.questions.map(question => <ObservationQuestion key={`${lesson.id}-${question.id}`} question={question} scope={origin} canInteract={currentView} />)}</section>
      <details className={styles.details}><summary>Fachquellen, Bildnachweis und Prüfstand</summary><p>{lesson.media.author} · <a href={lesson.media.source} target="_blank" rel="noopener noreferrer">Originalquelle</a> · <a href={lesson.media.licenseUrl} target="_blank" rel="noopener noreferrer">{lesson.media.license}</a></p><p>{lesson.media.recordingDate}. {lesson.media.changes}</p><p>Inhalt und sichtbare Szenen geprüft am 12. Oktober 2026. Die Fachquellen erklären das jeweilige Thema; sie sind keine Bewertung dieses einzelnen Hundes.</p><ul>{lesson.sources.map(id => <li key={id}><a href={dogVideoSources[id].url} target="_blank" rel="noopener noreferrer">{dogVideoSources[id].organization}: {dogVideoSources[id].label}</a></li>)}</ul></details>
    </article> : <p className={styles.feedback}>{ready ? "Diese Szene ist nicht verfügbar. Wähle eine Szene unten im Menü." : "Die gewählte Szene wird geladen."}</p>}
  </LearningToolLayout>;
}
