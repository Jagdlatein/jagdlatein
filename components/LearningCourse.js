import { answerOrder, newAnswerSeed } from "../lib/answer-order";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import CourseProgressNotice from "./CourseProgressNotice";
import useCourseProgress from "../hooks/useCourseProgress";
import styles from "../styles/Learning.module.css";
import { getLearningCategoryByTitle } from "../lib/learning-categories";
import { getLearningMedia } from "../lib/learning-media";
import { LearningCover, LearningDiagram, BreedGallery, WildlifeGallery } from "./LearningMedia";
import { lessonHash, lessonIndexFromHash } from "../lib/learning-lesson-navigation";
import { recordReviewAnswer } from "../lib/daily-review";
import LessonEvidence from "./LessonEvidence";
import PageMenu, { closePageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import LessonDiagram from "./LessonDiagram";
import { getCourseCountryNotes } from "../lib/learning-country-notes";
import { getCourseVideoLinks } from "../lib/learning-video-links";
import CourseWildlifeLinks from "./CourseWildlifeLinks";

const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };

function makeRun(questions, mode = "full", answerSeed = 0, lessonPractice = null) {
  return { questions, mode, answerSeed, index: 0, answers: {}, score: 0, started: false, complete: false, showResult: false,
    ...(lessonPractice ? { lessonPractice } : {}) };
}

export default function LearningCourse({ module, flashcards, wildlifeLinks = [] }) {
  return <LearningContent key={module.id} module={module} flashcards={flashcards} wildlifeLinks={wildlifeLinks} />;
}

function LearningContent({ module, flashcards, wildlifeLinks = [] }) {
  const router = useRouter();
  const category = getLearningCategoryByTitle(module.category);
  const media = getLearningMedia(module);
  const videos = getCourseVideoLinks(module.id);
  const countrySelection = category?.slug === "jagdrecht";
  const { common: commonNote, regional: regionalNotes } = getCourseCountryNotes(module);
  const [country, setCountry] = useState(module.countries[0]);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [panelRevision, setPanelRevision] = useState(0);
  const panelTarget = useRef(null);
  const lessonHeading = useRef(null);
  const revealLesson = useRef(null);
  const menuLesson = useRef(null);
  const lessonMounted = useRef(false), lessonRequest = useRef(0);
  const [lessonError, setLessonError] = useState("");
  const lessonRoute = `${module.id}:${router.asPath || ""}`;
  const currentLessonRoute = useRef(lessonRoute);
  currentLessonRoute.current = lessonRoute;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(`${module.id}:${lessonIndex}`, router.isReady !== false);
  useEffect(() => { lessonMounted.current = true; return () => { lessonMounted.current = false; lessonRequest.current++; }; }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    function readLesson() {
      const href = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (menuLesson.current?.href && menuLesson.current.href !== href) menuLesson.current = null;
      if (window.location.hash === "#wissenscheck") { cancelSelectionFocus(); panelTarget.current = "quiz-heading"; setQuizOpen(true); }
      if (["#quellen", "#learning-sources"].includes(window.location.hash)) { cancelSelectionFocus(); panelTarget.current = "learning-sources"; setSourcesOpen(true); }
      const index = lessonIndexFromHash(module.lessons, window.location.hash);
      if (index >= 0) { revealLesson.current = index; setLessonIndex(index); }
    }
    readLesson();
    window.addEventListener("hashchange", readLesson);
    window.addEventListener("popstate", readLesson);
    return () => { window.removeEventListener("hashchange", readLesson); window.removeEventListener("popstate", readLesson); };
  }, [module.id, module.lessons, router.asPath]);
  useEffect(() => {
    if (!panelTarget.current || typeof document === "undefined") return;
    if (panelTarget.current === "quiz-heading" && !quizOpen || panelTarget.current === "learning-sources" && !sourcesOpen) return;
    const target = document.getElementById(panelTarget.current);
    if (!target) return;
    panelTarget.current = null;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: "auto" });
  }, [quizOpen, sourcesOpen, router.asPath, panelRevision]);
  useEffect(() => {
    if (revealLesson.current !== lessonIndex || !lessonHeading.current) return;
    revealLesson.current = null;
    const fromMenu = menuLesson.current?.index === lessonIndex;
    menuLesson.current = null;
    closePageMenu(); setLessonError("");
    focusSelection(lessonHeading.current, { anchor: !fromMenu });
  }, [lessonIndex, router.asPath]);
  async function selectLesson(index) {
    if (!Number.isInteger(index) || !module.lessons[index]) return;
    if (typeof window !== "undefined" && (!lessonMounted.current || currentLessonRoute.current !== lessonRoute || router.isReady === false)) return;
    cancelSelectionFocus();
    menuLesson.current = { index, href: null };
    setLessonError("");
    if (typeof window !== "undefined" && typeof router.replace === "function") {
      const href = `${window.location.pathname}${window.location.search}${lessonHash(module.lessons[index].id)}`;
      menuLesson.current.href = href;
      if (index === lessonIndex && window.location.hash === lessonHash(module.lessons[index].id)) {
        menuLesson.current = null; closePageMenu(); focusSelection(lessonHeading.current); return;
      }
      const ticket = ++lessonRequest.current;
      try {
        const accepted = await router.replace(href, undefined, { shallow: true, scroll: false });
        if (accepted === false && lessonMounted.current && lessonRequest.current === ticket && currentLessonRoute.current === lessonRoute) {
          menuLesson.current = null; setLessonError("Die Lektion konnte nicht geöffnet werden. Bitte wähle sie erneut.");
        }
      } catch (error) {
        if (lessonMounted.current && lessonRequest.current === ticket && currentLessonRoute.current === lessonRoute) {
          menuLesson.current = null;
          if (!error?.cancelled) setLessonError("Die Lektion konnte nicht geöffnet werden. Bitte wähle sie erneut.");
        }
      }
      // Only readLesson adopts the lesson when the actual URL is committed.
      return;
    }
    // Static isolated readers have no browser/router navigation.
    closePageMenu(); revealLesson.current = index;
    if (index === lessonIndex && lessonHeading.current) {
      revealLesson.current = null;
      menuLesson.current = null;
      focusSelection(lessonHeading.current);
    }
    setLessonIndex(index);
  }
  const [run, setRun] = useState(() => makeRun(module.questions));
  const currentRun = useRef(run);
  const [fullProgress, setFullProgress] = useState({
    started: false, answeredQuestions: 0, totalQuestions: module.questions.length, score: 0, completed: false,
  });
  const courseProgress = useCourseProgress(module.id, fullProgress);
  const lesson = module.lessons[lessonIndex];
  const currentLesson = useRef(lesson);
  currentLesson.current = lesson;
  const lessonQuestions = module.questions.filter(item => item.lessonId === lesson.id);
  const question = run.questions[run.index];
  const selected = question ? run.answers[question.id] : undefined;
  const answered = Object.keys(run.answers).length;
  const wrongQuestions = run.questions.filter((item) => run.answers[item.id] !== undefined && !item.correct.includes(run.answers[item.id]));
  const practice = run.mode !== "full";
  const lessonPractice = run.lessonPractice;

  function updateRun(next) {
    currentRun.current = next;
    setRun(next);
  }

  function startRun(questions, mode, lessonContext = null) {
    if (currentRun.current !== run || typeof window !== "undefined" && !lessonMounted.current) return false;
    cancelSelectionFocus();
    updateRun({ ...makeRun(questions, mode, newAnswerSeed(run.answerSeed), lessonContext), started: true });
    return true;
  }

  function practiceCurrentLesson() {
    if (typeof window === "undefined" || !lessonMounted.current || router.isReady === false
      || currentLessonRoute.current !== lessonRoute || currentLesson.current !== lesson || !lessonQuestions.length) return;
    // A just-committed lesson address can precede its reading effect. Do not
    // start the previous lesson's pool in that intermediate render.
    if (window.location.hash.startsWith("#lesson-") && lessonIndexFromHash(module.lessons, window.location.hash) !== lessonIndex) return;
    const lessonContext = { id: lesson.id, title: lesson.title, questions: lessonQuestions };
    if (!startRun(lessonQuestions, "lesson", lessonContext)) return;
    closePageMenu();
    panelTarget.current = "quiz-heading";
    setSourcesOpen(false); setQuizOpen(true);
    setPanelRevision(value => value + 1);
  }

  function answerQuestion(answerId) {
    // A stale button cannot answer twice or answer the next question before it renders.
    if (currentRun.current !== run || typeof window !== "undefined" && !lessonMounted.current || !run.started || run.complete || selected !== undefined) return;
    if (!question.answers.some((answer) => answer.id === answerId)) return;
    const answers = { ...run.answers, [question.id]: answerId };
    const score = run.score + (question.correct.includes(answerId) ? 1 : 0);
    const count = Object.keys(answers).length;
    const complete = count === run.questions.length;
    updateRun({ ...run, answers, score, complete });
    recordReviewAnswer(question.id, question.correct.includes(answerId));
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
    if (currentRun.current !== run || typeof window !== "undefined" && !lessonMounted.current || selected === undefined) return;
    cancelSelectionFocus();
    updateRun(run.complete ? { ...run, showResult: true } : { ...run, index: run.index + 1 });
  }

  return (
    <LearningToolLayout title={module.title} description={module.description} icon={category?.slug || "book"} category={category?.slug} className={styles.course} headingOnly searchHref="/lernen#lernen-suche">
          {countrySelection && module.countryNotes?.[country] && <p className={styles.countryNote}><strong>{countryNames[country] || country}:</strong> {module.countryNotes[country]}</p>}
          <PageMenu title="Lektion wählen">
            {countrySelection && module.countries.length > 1 && <fieldset className={styles.countryChoice}>
              <legend>Länderschwerpunkt</legend>
              <div className={styles.countryButtons}>
                {module.countries.map((item) => (
                  <button type="button" key={item} aria-pressed={country === item} onClick={() => setCountry(item)}>{countryNames[item] || item}</button>
                ))}
              </div>
            </fieldset>}
            <nav className={styles.lessonNav} aria-label="Lektionen">
              <div className={styles.mobileLessonChoice}>
                <MenuChoice label="Lektion" id="lesson-selection" value={lessonIndex} onChange={event => selectLesson(Number(event.target.value))}>
                  {module.lessons.map((item, index) => <option value={index} key={item.id}>{index + 1}. {item.title}</option>)}
                </MenuChoice>
              </div>
            </nav>
            {lessonError && <p role="alert">{lessonError}</p>}
            {lessonQuestions.length > 0 && <button type="button" className={styles.secondaryButton} data-course-lesson-practice={lesson.id} disabled={router.isReady === false} aria-label={`${lesson.title}: ${lessonQuestions.length} Fragen üben`} onClick={practiceCurrentLesson}>Lektion üben</button>}
            {videos.length > 0 && <nav aria-label="Videos"><h3>Videos</h3><ul className={styles.sources}>{videos.map(video => <li key={video.id}><Link href={video.href} prefetch={false}>{video.title}</Link></li>)}</ul></nav>}
            <CourseWildlifeLinks links={wildlifeLinks} lessonId={module.lessons[lessonIndex].id} />
          </PageMenu>
          <div className={styles.lessonGrid}>
            <article id={`lesson-${lesson.id}`} className={styles.card} aria-labelledby="current-lesson-heading">
              <p className={styles.eyebrow}>Lektion {lessonIndex + 1} von {module.lessons.length}</p>
              <h2 id="current-lesson-heading" tabIndex={-1} ref={lessonHeading}>{lesson.title}</h2>
              <div className={styles.lessonText}>{lesson.paragraphs.map((paragraph, index) => <p key={`${lesson.id}:${index}`}>{paragraph}</p>)}</div>
              {media?.coursePhotoUse?.lessonId === lesson.id && (!media.pictures || media.pictures.length < 2) && <LearningCover media={media} />}
              <LessonDiagram diagram={lesson.diagram} />
              <aside className={styles.takeaway}><h3>Merke dir</h3><p>{lesson.takeaway}</p></aside>
              <aside className={styles.exercise}><h3>Zum Nachdenken</h3><p>{lesson.exercise}</p></aside>
              {flashcards?.lessons?.[lesson.id] > 0 && <p className={styles.lessonCards}><Link href={{ pathname: "/lernen/lernkarten", query: { kurs: module.id, lektion: lesson.id } }} prefetch={false}>Diese Lektion mit {flashcards.lessons[lesson.id]} Lernkarten wiederholen</Link></p>}
              <div className={styles.actions}>
                {lessonIndex > 0 && <button type="button" className={styles.secondaryButton} onClick={() => selectLesson(lessonIndex - 1)}>Vorherige Lektion</button>}
                {lessonIndex + 1 < module.lessons.length ? <button type="button" className={styles.button} onClick={() => selectLesson(lessonIndex + 1)}>Nächste Lektion</button> : <a href="#wissenscheck" onClick={() => setQuizOpen(true)} className={styles.button}>Zum Wissenscheck</a>}
              </div>
            </article>
          </div>
          <details className={`${styles.card} ${styles.supplement}`}>
            <summary>Über dieses Thema</summary>
            <h2 id="learning-objectives">Das lernst du</h2>
            <ul className={styles.objectives}>{module.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
            <Link href="/meine-kurse">Meine Kurse und Fortschritt</Link>
          </details>
          {!countrySelection && (commonNote || regionalNotes.length > 0) && <details className={`${styles.card} ${styles.supplement}`}>
            <summary>{regionalNotes.length > 0 ? "Regionale Vorschriften und Hinweise" : "Geltungsbereich dieses Wissens"}</summary>
            {commonNote && <p className={styles.countryNote}>{commonNote}</p>}
            {regionalNotes.length > 0 && <><p>Für die praktische Anwendung beachtest du die örtlichen Vorgaben und den Geltungsbereich der Quellen.</p><dl>{regionalNotes.map(item => <div key={item}><dt>{countryNames[item] || item}</dt><dd>{module.countryNotes[item]}</dd></div>)}</dl></>}
          </details>}
          {(module.showCategoryDiagram !== false && media?.diagram || media?.pictures?.length > 1 || module.id === "wissen-vertiefung-jagdhunderassen") && <details className={`${styles.card} ${styles.supplement}`}>
          <summary>Weitere Abbildungen zu diesem Thema</summary>
          {module.showCategoryDiagram !== false && <LearningDiagram media={media} />}
          {module.id === "wissen-vertiefung-jagdhunderassen" && <BreedGallery />}
          <WildlifeGallery pictures={media?.pictures} />
          </details>}
          <details id="wissenscheck" className={`${styles.card} ${styles.supplement}`} open={quizOpen} onToggle={event => setQuizOpen(event.currentTarget.open)}>
            <summary>Wissen zu diesem Thema prüfen</summary>
          <section aria-labelledby="quiz-heading">
            <h2 id="quiz-heading" tabIndex={-1}>Wissenscheck</h2>
            {!run.started ? (
              <>
                <p className={styles.muted}>Beantworte {module.questions.length} Fragen zu dieser Lerneinheit. Du bekommst nach jeder Antwort eine Erklärung und bestimmst selbst, wann es weitergeht.</p>
                <p className={styles.muted}>Dein Kurs ist abgeschlossen, sobald du alle Fragen beantwortet hast. Dein Ergebnis wird separat in „Meine Kurse“ gespeichert.</p>
                <button type="button" className={styles.button} onClick={() => startRun(module.questions, "full")}>Wissen prüfen</button>
              </>
            ) : run.showResult ? (
              <div className={styles.result}>
                <h3>{lessonPractice ? "Lektionsrunde abgeschlossen" : practice ? "Übungsrunde beendet" : "Lerneinheit abgeschlossen"}</h3>
                <p className={styles.resultScore}>{run.score} von {run.questions.length} richtig <span>({Math.round(run.score / run.questions.length * 100)} %)</span></p>
                <p>{practice ? "Diese Übungsrunde verändert deinen gespeicherten Kursabschluss nicht." : "Dein Abschluss und dein bestes Ergebnis erscheinen in „Meine Kurse“. Wenn das Speichern fehlschlägt, kannst du es unten erneut versuchen."}</p>
                <div className={styles.actions}>
                  {wrongQuestions.length > 0 && <button type="button" className={styles.button} onClick={() => startRun(wrongQuestions, "practice", lessonPractice)}>Nur Fehler üben ({wrongQuestions.length})</button>}
                  <button type="button" className={styles.secondaryButton} onClick={() => lessonPractice ? startRun(lessonPractice.questions, "lesson", lessonPractice) : startRun(module.questions, "full")}>{lessonPractice ? "Lektion wiederholen" : "Alle Fragen wiederholen"}</button>
                  <Link href="/meine-kurse" className={styles.secondaryButton}>Meine Kurse ansehen</Link>
                </div>
              </div>
            ) : (
              <>
                {run.mode === "lesson" ? <p className={styles.trainingNotice}><strong>Lektionsübung: {lessonPractice.title}</strong> Du übst nur die Fragen dieser Lektion. Dein gespeicherter Kursabschluss bleibt erhalten.</p>
                  : practice && <p className={styles.trainingNotice}><strong>Fehlertraining{lessonPractice ? `: ${lessonPractice.title}` : ""}:</strong> Du übst nur die zuvor falsch beantworteten Fragen. Dein gespeicherter Kursabschluss bleibt erhalten.</p>}
                <p className={styles.eyebrow}>Frage {run.index + 1} von {run.questions.length} · {answered} beantwortet</p>
                <progress className={styles.progress} value={answered} max={run.questions.length} aria-label={`${answered} von ${run.questions.length} Fragen beantwortet`} />
                {(question.topic === "Recht" || question.countries.length < 3) && <p className={styles.countryNote}><strong>Geltungsbereich dieser Frage:</strong> {question.countries.map(item => countryNames[item] || item).join(" · ")}</p>}
                <h3 id="current-question" className={styles.question}>{question.q}</h3>
                <div className={styles.answers} role="group" aria-labelledby="current-question">
                  {answerOrder(question.answers, question.id, run.answerSeed).map(answerIndex => {
                    const answer = question.answers[answerIndex];
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
                    {question.lessonId && <a href={lessonHash(question.lessonId)} className={styles.textButton} onClick={event => {
                      event.preventDefault();
                      const index = module.lessons.findIndex((item) => item.id === question.lessonId);
                      if (index >= 0) selectLesson(index);
                    }}>Passende Lektion öffnen</a>}
                    <div className={styles.actions}><button type="button" className={styles.button} onClick={nextQuestion}>{run.complete ? "Ergebnis ansehen" : "Nächste Frage"}</button></div>
                  </div>
                )}
              </>
            )}
            <CourseProgressNotice courseId={module.id} {...courseProgress} />
          </section>
          </details>
          <details id="quellen" className={`${styles.card} ${styles.supplement}`} open={sourcesOpen} onToggle={event => setSourcesOpen(event.currentTarget.open)}>
            <summary>Alle Quellen dieses Themenbereichs</summary>
          <section aria-labelledby="learning-sources">
            <h2 id="learning-sources" tabIndex={-1}>Quellen und weiterführende Informationen</h2>
            <LessonEvidence lesson={lesson} reviewedOn={module.reviewedOn} embedded />
            <p className={styles.muted}>Eigene Lerntexte und Übungsfragen zur Vertiefung deiner Ausbildung. Die verlinkten Quellen dienen zum Nachschlagen; verbindliche örtliche Vorgaben prüfst du vor der praktischen Anwendung.</p>
            <ul className={styles.sources}>{module.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span className={styles.externalLabel}> (öffnet einen neuen Tab)</span></a>{source.scope && <p>{source.scope}</p>}</li>)}</ul>
            {module.sourceReview && <details><summary>Welche Aussagen wurden gegengeprüft?</summary><p>{module.sourceReview.scope}</p>{module.sourceReview.lessons.map(review => <div key={review.lesson}><h3>{module.lessons.find(lesson => lesson.id.endsWith(`-${review.lesson}`))?.title || review.lesson}</h3><ul>{review.confirmedClaims.map(claim => <li key={claim}>{claim}</li>)}</ul>{review.standardOnly.length > 0 && <p>Beleggrenze: {review.standardOnly.join(" ")}</p>}</div>)}</details>}
            <p className={styles.muted}><Link href="/hilfe#wissensquellen">Wie wir Wissen und Quellen prüfen</Link></p>
          </section>
          </details>
    </LearningToolLayout>
  );
}
