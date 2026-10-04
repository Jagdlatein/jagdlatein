import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import CourseProgressNotice from "./CourseProgressNotice";
import useCourseProgress from "../hooks/useCourseProgress";
import { LearningCover } from "./LearningMedia";
import styles from "../styles/LearningExperience.module.css";
import miniStyles from "../styles/MiniCourse.module.css";

const initialRun = () => ({ index: 0, selected: null, answers: [], score: 0, finished: false });

export default function MiniCourse({ courseId, questions, details, children }) {
  const [run, setRun] = useState(initialRun);
  const currentRun = useRef(run);
  const mounted = useRef(true);
  const questionHeading = useRef(null);
  const resultHeading = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (run.finished) resultHeading.current?.focus();
    else if (run.index > 0) questionHeading.current?.focus();
  }, [run.index, run.finished]);

  const courseProgress = useCourseProgress(courseId, {
    started: run.answers.length > 0,
    answeredQuestions: run.answers.length,
    totalQuestions: questions.length,
    score: run.score,
    completed: run.answers.length === questions.length,
  });

  function update(next) {
    currentRun.current = next;
    setRun(next);
  }
  function choose(answerIndex) {
    if (!mounted.current || currentRun.current !== run || run.finished || run.selected !== null) return;
    const question = questions[run.index];
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.antworten.length) return;
    update({ ...run, selected: answerIndex, answers: [...run.answers, answerIndex], score: run.score + (question.antworten[answerIndex].richtig ? 1 : 0) });
  }
  function advance() {
    if (!mounted.current || currentRun.current !== run || run.finished || run.selected === null) return;
    update(run.index + 1 === questions.length
      ? { ...run, finished: true }
      : { ...run, index: run.index + 1, selected: null });
  }
  function restart() {
    if (!mounted.current || currentRun.current !== run || !run.finished) return;
    update(initialRun());
  }

  if (!details) return null;
  const question = questions[run.index];
  const correct = question.antworten.find(answer => answer.richtig);
  const answered = run.selected !== null;
  const related = <div className={miniStyles.related}>{details.modules.map(module => <Link className={styles.button} href={`/kurse/${module.id}`} key={module.id}>{module.title}</Link>)}</div>;
  const photo = details.photo;

  return <LearningToolLayout title={details.title} description={details.description} icon={details.category.slug} category={details.category} stats={[
    { label: "Fragen", value: questions.length },
    { label: "Format", value: "Mini-Kurs" },
    { label: "Tempo", value: "Du bestimmst" },
  ]}>
    <section className={`${styles.panel} ${miniStyles.lesson}`} aria-label="Lerninhalt">
      {photo && <div className={miniStyles.photo}><LearningCover media={photo} compact /></div>}
      <div className={miniStyles.introduction}>{children}</div>
    </section>

    {!run.finished ? <section className={styles.panel} aria-labelledby="mini-question-title">
      <p className={miniStyles.status}>Frage {run.index + 1} von {questions.length} · {run.score} richtig beantwortet</p>
      <progress className={styles.progress} value={run.answers.length} max={questions.length} aria-label="Beantwortete Fragen" />
      <h2 ref={questionHeading} tabIndex={-1} id="mini-question-title" className={miniStyles.question}>{question.frage}</h2>
      <div className={styles.choices}>{question.antworten.map((answer, index) => <button key={index} type="button" disabled={answered} aria-pressed={run.selected === index} onClick={() => choose(index)} className={`${styles.choice} ${answered && answer.richtig ? styles.correct : answered && run.selected === index ? styles.wrong : ""}`}>
        {answer.text}{answered && answer.richtig ? " · Richtige Lösung" : answered && run.selected === index ? " · Deine Antwort" : ""}
      </button>)}</div>
      {answered && <div className={styles.feedback} role="status" aria-live="polite">
        <h3>{question.antworten[run.selected].richtig ? "Richtig beantwortet" : "Noch einmal nachlesen"}</h3>
        <p>Richtige Lösung: <strong>{correct.text}</strong></p>
        <p>In der passenden Vertiefung kannst du das Themengebiet ausführlicher lernen.</p>
        {question.source && <p><a className={styles.button} href={question.source} target="_blank" rel="noopener noreferrer">Quelle zu dieser Frage öffnen</a></p>}
      </div>}
      <div className={styles.actions}><button type="button" className={styles.primary} disabled={!answered} onClick={advance}>{run.index + 1 === questions.length ? "Ergebnis ansehen" : "Nächste Frage"}</button></div>
      <CourseProgressNotice courseId={courseId} {...courseProgress} />
    </section> : <section className={styles.panel} aria-labelledby="mini-result-title">
      <h2 ref={resultHeading} tabIndex={-1} id="mini-result-title">Mini-Kurs abgeschlossen</h2>
      <p>Du hast <strong>{run.score} von {questions.length}</strong> Fragen richtig beantwortet.</p>
      <p>Du kannst deine Antworten noch einmal prüfen und das Wissen in einer passenden Vertiefung ausbauen.</p>
      <details className={styles.sources}><summary>Alle Antworten prüfen</summary>{questions.map((item, index) => <article key={index}>
        <h3>{index + 1}. {item.frage}</h3>
        <p>Deine Antwort: {item.antworten[run.answers[index]].text}</p>
        <p>Richtige Lösung: <strong>{item.antworten.find(answer => answer.richtig).text}</strong></p>
        {item.source && <p><a href={item.source} target="_blank" rel="noopener noreferrer">Quelle zu dieser Frage</a></p>}
      </article>)}</details>
      <div className={styles.actions}><button type="button" className={styles.primary} onClick={restart}>Mini-Kurs wiederholen</button><Link className={styles.secondary} href="/meine-kurse">Meine Kurse</Link></div>
      <CourseProgressNotice courseId={courseId} {...courseProgress} />
    </section>}

    <section className={styles.panel} aria-labelledby="mini-related-title"><h2 id="mini-related-title">Passende Vertiefung</h2><p>Ausführliche Lerneinheiten mit Hintergründen, Quellen und erklärten Übungsfragen.</p>{related}</section>
  </LearningToolLayout>;
}
