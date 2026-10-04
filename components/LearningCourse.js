import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import CourseProgressNotice from "./CourseProgressNotice";
import useCourseProgress from "../hooks/useCourseProgress";
import styles from "../styles/Learning.module.css";
import { getLearningCategoryByTitle } from "../lib/learning-categories";
import { getLearningMedia } from "../lib/learning-media";
import { LearningCover, LearningDiagram, BreedGallery } from "./LearningMedia";

const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };

function makeRun(questions, mode = "full") {
  return { questions, mode, index: 0, answers: {}, score: 0, started: false, complete: false, showResult: false };
}

export default function LearningCourse({ module }) {
  return <LearningContent key={module.id} module={module} />;
}

function LearningContent({ module }) {
  const category = getLearningCategoryByTitle(module.category);
  const media = getLearningMedia(module);
  const countrySelection = category?.slug === "jagdrecht";
  const regionalNotes = module.countries.filter((item) => module.countryNotes?.[item]);
  const [country, setCountry] = useState(module.countries[0]);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [run, setRun] = useState(() => makeRun(module.questions));
  const currentRun = useRef(run);
  const [fullProgress, setFullProgress] = useState({
    started: false, answeredQuestions: 0, totalQuestions: module.questions.length, score: 0, completed: false,
  });
  const courseProgress = useCourseProgress(module.id, fullProgress);
  const lesson = module.lessons[lessonIndex];
  const question = run.questions[run.index];
  const selected = question ? run.answers[question.id] : undefined;
  const answered = Object.keys(run.answers).length;
  const wrongQuestions = run.questions.filter((item) => run.answers[item.id] !== undefined && !item.correct.includes(run.answers[item.id]));
  const practice = run.mode === "practice";

  function updateRun(next) {
    currentRun.current = next;
    setRun(next);
  }

  function startRun(questions, mode) {
    if (currentRun.current !== run) return;
    updateRun({ ...makeRun(questions, mode), started: true });
  }

  function answerQuestion(answerId) {
    // A stale button cannot answer twice or answer the next question before it renders.
    if (currentRun.current !== run || !run.started || run.complete || selected !== undefined) return;
    if (!question.answers.some((answer) => answer.id === answerId)) return;
    const answers = { ...run.answers, [question.id]: answerId };
    const score = run.score + (question.correct.includes(answerId) ? 1 : 0);
    const count = Object.keys(answers).length;
    const complete = count === run.questions.length;
    updateRun({ ...run, answers, score, complete });
    if (!practice) {
      setFullProgress({
        started: true,
        answeredQuestions: count,
        totalQuestions: module.questions.length,
        score,
        completed: complete,
      });
    }
  }

  function nextQuestion() {
    if (currentRun.current !== run || selected === undefined) return;
    updateRun(run.complete ? { ...run, showResult: true } : { ...run, index: run.index + 1 });
  }

  return (
    <>
      <Head><title>{`${module.title} – Lernen mit Jagdlatein`}</title></Head>
      <main className={styles.main}>
        <div className={styles.wrap}>
          <nav className={styles.topNav} aria-label="Lernmenü">
            <Link href="/lernen">Lernbereich</Link>
            {category && <Link href={`/lernen/${category.slug}`}>{category.title}</Link>}
            <Link href="/kurse">Alle Kurse</Link>
            <Link href="/meine-kurse">Meine Kurse</Link>
          </nav>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{module.category} · {module.level} · etwa {module.minutes} Minuten</p>
            <h1>{module.title}</h1>
            <p className={styles.description}>{module.description}</p>
          </header>
          <LearningCover media={media} />
          <section className={styles.card} aria-labelledby="learning-objectives">
            <h2 id="learning-objectives">Das lernst du</h2>
            <ul className={styles.objectives}>{module.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
            {module.id === "wissen-vertiefung-jagdhunderassen" && <p><a href="#breed-gallery-heading" className={styles.secondaryButton}>Rassebilder ansehen</a></p>}
            {countrySelection && module.countries.length > 1 && <fieldset className={styles.countryChoice}>
              <legend>Länderschwerpunkt</legend>
              <div className={styles.countryButtons}>
                {module.countries.map((item) => (
                  <button type="button" key={item} aria-pressed={country === item} onClick={() => setCountry(item)}>{countryNames[item] || item}</button>
                ))}
              </div>
            </fieldset>}
            {countrySelection && module.countryNotes?.[country] && <p className={styles.countryNote}><strong>{countryNames[country] || country}:</strong> {module.countryNotes[country]}</p>}
            {!countrySelection && regionalNotes.length > 0 && <details className={styles.regionalNotes}>
              <summary>Regionale Vorschriften und Hinweise</summary>
              <p>Für die praktische Anwendung beachtest du die örtlichen Vorgaben und den Geltungsbereich der Quellen.</p>
              <dl>{regionalNotes.map((item) => <div key={item}><dt>{countryNames[item] || item}</dt><dd>{module.countryNotes[item]}</dd></div>)}</dl>
            </details>}
          </section>
          <div className={styles.lessonGrid}>
            <nav className={styles.lessonNav} aria-label="Lektionen">
              <h2>Lektionen</h2>
              <div className={styles.mobileLessonChoice}>
                <label htmlFor="lesson-selection">Lektion auswählen</label>
                <select id="lesson-selection" value={lessonIndex} onChange={event => setLessonIndex(Number(event.target.value))}>
                  {module.lessons.map((item, index) => <option value={index} key={item.id}>{index + 1}. {item.title}</option>)}
                </select>
              </div>
              <ol>
                {module.lessons.map((item, index) => (
                  <li key={item.id}><button type="button" aria-current={index === lessonIndex ? "step" : undefined} onClick={() => setLessonIndex(index)}><span className={styles.lessonNumber}>{index + 1}</span><span>{item.title}</span></button></li>
                ))}
              </ol>
            </nav>
            <article className={styles.card} aria-labelledby="current-lesson-heading">
              <p className={styles.eyebrow}>Lektion {lessonIndex + 1} von {module.lessons.length}</p>
              <h2 id="current-lesson-heading">{lesson.title}</h2>
              <div className={styles.lessonText}>{lesson.paragraphs.map((paragraph, index) => <p key={`${lesson.id}:${index}`}>{paragraph}</p>)}</div>
              <aside className={styles.takeaway}><h3>Merke dir</h3><p>{lesson.takeaway}</p></aside>
              <aside className={styles.exercise}><h3>Zum Nachdenken</h3><p>{lesson.exercise}</p></aside>
              <div className={styles.actions}>
                {lessonIndex > 0 && <button type="button" className={styles.secondaryButton} onClick={() => setLessonIndex(lessonIndex - 1)}>Vorherige Lektion</button>}
                {lessonIndex + 1 < module.lessons.length ? <button type="button" className={styles.button} onClick={() => setLessonIndex(lessonIndex + 1)}>Nächste Lektion</button> : <a href="#wissenscheck" className={styles.button}>Zum Wissenscheck</a>}
              </div>
            </article>
          </div>
          <LearningDiagram media={media} />
          {module.id === "wissen-vertiefung-jagdhunderassen" && <BreedGallery />}
          <section id="wissenscheck" className={styles.card} aria-labelledby="quiz-heading">
            <h2 id="quiz-heading">Wissenscheck</h2>
            {!run.started ? (
              <>
                <p className={styles.muted}>Beantworte {module.questions.length} Fragen zu dieser Lerneinheit. Du bekommst nach jeder Antwort eine Erklärung und bestimmst selbst, wann es weitergeht.</p>
                <p className={styles.muted}>Dein Kurs ist abgeschlossen, sobald du alle Fragen beantwortet hast. Dein Ergebnis wird separat in „Meine Kurse“ gespeichert.</p>
                <button type="button" className={styles.button} onClick={() => startRun(module.questions, "full")}>Wissen prüfen</button>
              </>
            ) : run.showResult ? (
              <div className={styles.result}>
                <h3>{practice ? "Übungsrunde beendet" : "Lerneinheit abgeschlossen"}</h3>
                <p className={styles.resultScore}>{run.score} von {run.questions.length} richtig <span>({Math.round(run.score / run.questions.length * 100)} %)</span></p>
                <p>{practice ? "Diese Übungsrunde verändert deinen gespeicherten Kursabschluss nicht." : "Dein Abschluss und dein bestes Ergebnis erscheinen in „Meine Kurse“. Wenn das Speichern fehlschlägt, kannst du es unten erneut versuchen."}</p>
                <div className={styles.actions}>
                  {wrongQuestions.length > 0 && <button type="button" className={styles.button} onClick={() => startRun(wrongQuestions, "practice")}>Nur Fehler üben ({wrongQuestions.length})</button>}
                  <button type="button" className={styles.secondaryButton} onClick={() => startRun(module.questions, "full")}>Alle Fragen wiederholen</button>
                  <Link href="/meine-kurse" className={styles.secondaryButton}>Meine Kurse ansehen</Link>
                </div>
              </div>
            ) : (
              <>
                {practice && <p className={styles.trainingNotice}><strong>Fehlertraining:</strong> Du übst nur die zuvor falsch beantworteten Fragen. Dein gespeicherter Kursabschluss bleibt erhalten.</p>}
                <p className={styles.eyebrow}>Frage {run.index + 1} von {run.questions.length} · {answered} beantwortet</p>
                <progress className={styles.progress} value={answered} max={run.questions.length} aria-label={`${answered} von ${run.questions.length} Fragen beantwortet`} />
                <h3 id="current-question" className={styles.question}>{question.q}</h3>
                <div className={styles.answers} role="group" aria-labelledby="current-question">
                  {question.answers.map((answer) => {
                    const correct = selected !== undefined && question.correct.includes(answer.id);
                    const wrong = selected === answer.id && !correct;
                    return (
                      <button type="button" key={answer.id} disabled={selected !== undefined} aria-pressed={selected === answer.id} onClick={() => answerQuestion(answer.id)} className={`${styles.answer} ${correct ? styles.correctAnswer : ""} ${wrong ? styles.wrongAnswer : ""}`}>
                        <span>{answer.text}</span>
                        {correct ? <span className={styles.answerLabel}>Richtige Antwort</span> : wrong ? <span className={styles.answerLabel}>Deine Antwort</span> : null}
                      </button>
                    );
                  })}
                </div>
                {selected !== undefined && (
                  <div className={styles.feedback} role="status" aria-live="polite">
                    <h4>{question.correct.includes(selected) ? "Richtig beantwortet." : "Das ist noch nicht richtig."}</h4>
                    {!question.correct.includes(selected) && <p><strong>Richtig ist:</strong> {question.answers.filter((answer) => question.correct.includes(answer.id)).map((answer) => answer.text).join(", ")}</p>}
                    <p>{question.explain}</p>
                    {question.lessonId && <a href="#current-lesson-heading" className={styles.textButton} onClick={() => {
                      const index = module.lessons.findIndex((item) => item.id === question.lessonId);
                      if (index >= 0) setLessonIndex(index);
                    }}>Passende Lektion öffnen</a>}
                    <div className={styles.actions}><button type="button" className={styles.button} onClick={nextQuestion}>{run.complete ? "Ergebnis ansehen" : "Nächste Frage"}</button></div>
                  </div>
                )}
              </>
            )}
            <CourseProgressNotice courseId={module.id} {...courseProgress} />
          </section>
          <section className={styles.card} aria-labelledby="learning-sources">
            <h2 id="learning-sources">Quellen und weiterführende Informationen</h2>
            <p className={styles.muted}>Eigene Lerntexte und Übungsfragen zur Vertiefung deiner Ausbildung. Die verlinkten Quellen dienen zum Nachschlagen; verbindliche örtliche Vorgaben prüfst du vor der praktischen Anwendung.</p>
            <ul className={styles.sources}>{module.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span className={styles.externalLabel}> (öffnet einen neuen Tab)</span></a></li>)}</ul>
          </section>
        </div>
      </main>
    </>
  );
}
