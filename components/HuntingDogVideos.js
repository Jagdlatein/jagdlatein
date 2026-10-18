import { useEffect, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { dogVideoSources, huntingDogVideoLessons } from "../lib/hunting-dog-video-lessons";
import styles from "../styles/DogCutLearning.module.css";

function Sources({ ids }) {
  return <p className={styles.sources}>Fachlich eingeordnet mit {ids.map((id, index) => <span key={id}>{index > 0 ? " · " : ""}<a href={dogVideoSources[id].url} target="_blank" rel="noopener noreferrer" title={dogVideoSources[id].label}>{dogVideoSources[id].organization}</a></span>)}</p>;
}

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
  const [selectedId, setSelectedId] = useState(huntingDogVideoLessons[0].id);
  const [failed, setFailed] = useState(false);
  const lesson = huntingDogVideoLessons.find(item => item.id === selectedId) || huntingDogVideoLessons[0];
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eintrag");
    if (huntingDogVideoLessons.some(item => item.id === id)) setSelectedId(id);
  }, []);
  function changeLesson(id) { setFailed(false); setSelectedId(id); }
  return <LearningToolLayout title="Jagdhunde im Video" description="Echte Aufnahmen: Arbeitsschritte beobachten, Körpersprache vorsichtig einordnen und hilfreiche Lernprinzipien verstehen." icon="hundewesen" category="hundewesen" compact hideCommunity>
    <section className={styles.selector} aria-label="Video auswählen">
      <label htmlFor="hundevideo-auswahl">Welche Szene möchtest du ansehen?</label>
      <select id="hundevideo-auswahl" value={lesson.id} onChange={event => changeLesson(event.target.value)}>{huntingDogVideoLessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
    </section>
    <p className={styles.continueLink}><Link href="/lernen/videos">Alle Lernvideos</Link></p>
    <article key={lesson.id} className={styles.videoLesson} id="hundevideo-film">
      <header className={styles.sectionHeader}><h2>{lesson.title}</h2><p>{lesson.breed} · {Math.ceil(lesson.duration)} Sekunden · ohne Ton, mit Handlungstext</p></header>
      <video className={styles.video} controls playsInline preload="none" poster={lesson.poster} aria-label={lesson.title} aria-describedby="hundevideo-handlung" onError={() => setFailed(true)}>
        <source src={lesson.src} type="video/mp4" />
        <track kind="captions" src={lesson.captions} srcLang="de" label="Deutsch: sichtbare Handlung" default />
        Dein Browser kann dieses Video nicht abspielen. Die vollständige Handlung steht unter dem Video.
      </video>
      {failed && <p className={styles.feedback} role="alert">Das Video lässt sich gerade nicht abspielen. Die Handlung und die geprüften Beobachtungen stehen hier auch als Text. Über die Originalquelle kannst du die Aufnahme aufrufen.</p>}
      <p className={styles.attribution}>{lesson.media.author} · <a href={lesson.media.source} target="_blank" rel="noopener noreferrer">Originalquelle</a> · <a href={lesson.media.licenseUrl} target="_blank" rel="noopener noreferrer">{lesson.media.license}</a></p>
      <div className={styles.twoColumns}>
        <section className={styles.observation}><h3>Im Bild erkennbar</h3><ol>{lesson.observations.map(item => <li key={item.at}><strong>{item.at}</strong>{item.text}</li>)}</ol></section>
        <section className={styles.context}><h3>Hintergrund der Aufnahme</h3><p>{lesson.context}</p></section>
      </div>
      <section className={styles.learningText}><h3>Was du daraus lernen kannst</h3><p>{lesson.lesson}</p><p>{lesson.practice}</p><Sources ids={lesson.sources} /></section>
      <section className={styles.checks} aria-label="Beobachtung prüfen"><h3>Deine Beobachtung prüfen</h3>{lesson.questions.map(question => <ObservationQuestion key={`${lesson.id}-${question.id}`} question={question} />)}</section>
      <details className={styles.details} id="hundevideo-handlung"><summary>Handlung als Text und Bildnachweis</summary><p>{lesson.transcript}</p><p>{lesson.media.recordingDate}. {lesson.media.changes}</p><p>Inhalt und sichtbare Szenen geprüft am 12. Oktober 2026. Die Fachquellen erklären das jeweilige Thema; sie sind keine Bewertung dieses einzelnen Hundes.</p><ul>{lesson.sources.map(id => <li key={id}><a href={dogVideoSources[id].url} target="_blank" rel="noopener noreferrer">{dogVideoSources[id].organization}: {dogVideoSources[id].label}</a></li>)}</ul></details>
    </article>
    <p className={styles.continueLink}><Link href="/lernen/jagdhund-kompass">Jagdhunderassen und ihre Arbeitsgebiete ansehen</Link></p>
  </LearningToolLayout>;
}
