import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { wildlifeVideoCases, wildlifeVideoQuestionCount, videoCaseMatches } from "../lib/wildlife-video-cases";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

export default function WildlifeVideoCases() {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query.eintrag;
  const item = ready ? requested === undefined ? wildlifeVideoCases[0]
    : wildlifeVideoCases.find(entry => typeof requested === "string" && entry.id === requested) || null : null;
  const caseId = item?.id || null;
  const requestedSection = (router.asPath || "").split("#")[1];
  const section = ["video-fall", "video-textfassung", "video-auswahl"].includes(requestedSection) ? requestedSection : "video-fall";
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const committed = useRef({ key: viewKey });
  if (committed.current.key !== viewKey) committed.current = { key: viewKey };
  const origin = committed.current;
  const mounted = useRef(false);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const round = useRef({ observed: new Set(), answered: new Set() });
  const renderedRound = round.current;
  const active = useRef(null);
  // Selection is URL-owned. Local controls have a synchronous identity so that
  // two clicks before React commits cannot skip a question or revive old media.
  if (active.current?.origin !== origin) active.current = {
    origin, caseId, questionIndex: active.current?.caseId === caseId ? active.current.questionIndex : 0,
    generation: (active.current?.generation || 0) + 1, attempt: 0, failed: false,
  };
  const renderedView = active.current;
  const { questionIndex, generation, attempt, failed } = renderedView;
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState({});
  const [observed, setObserved] = useState({});
  const [navigationError, setNavigationError] = useState("");
  const [, setRevision] = useState(0);
  const video = useRef(null);
  const heading = useRef(null);
  const transcript = useRef(null);
  const playback = useRef(null);
  if (!playback.current || playback.current.origin !== origin || playback.current.round !== renderedRound || playback.current.generation !== generation || playback.current.attempt !== attempt) {
    playback.current = { origin, round: renderedRound, generation, attempt };
  }
  const renderedPlayback = playback.current;
  const question = item?.questions[questionIndex];
  const answerKey = question ? `${caseId}:${question.id}` : null;
  const selected = answers[answerKey];
  const matches = wildlifeVideoCases.filter(entry => videoCaseMatches(entry, query));
  const answeredCount = Object.keys(answers).length;
  const correct = wildlifeVideoCases.reduce((sum, entry) => sum + entry.questions.filter(current => answers[`${entry.id}:${current.id}`] === current.answer).length, 0);
  const caseFinished = item?.questions.every(current => answers[`${caseId}:${current.id}`] !== undefined);
  const refresh = () => setRevision(value => value + 1);
  function currentView() {
    return mounted.current && ready && !!item && committed.current === origin && round.current === renderedRound && active.current === renderedView;
  }
  function currentPlayback() { return currentView() && playback.current === renderedPlayback; }
  function focusContent(targetSection = section) {
    const target = targetSection === "video-textfassung" ? transcript.current : heading.current;
    if (targetSection === "video-textfassung" && transcript.current) transcript.current.open = true;
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    const player = video.current;
    return () => { (player || video.current)?.pause?.(); };
  }, [renderedPlayback]);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!item || section === "video-auswahl") {
      const timer = setTimeout(() => {
        if (mounted.current && committed.current === origin) openPageMenu("video-auswahl");
      }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusContent();
  }, [ready, origin, caseId, section]);

  async function selectCase(id) {
    if (!ready || !mounted.current || committed.current !== origin || round.current !== renderedRound || !wildlifeVideoCases.some(entry => entry.id === id)) return;
    setNavigationError("");
    const destination = section === "video-textfassung" ? "video-textfassung" : "video-fall";
    if (id === caseId && pendingRequest.current === null) { closePageMenu(); focusContent(destination); return; }
    const request = ++navigation.current;
    pendingRequest.current = request;
    try {
      const accepted = await router.push({ pathname: "/lernen/wildtier-videofaelle", query: { ...router.query, eintrag: id }, hash: destination }, undefined, { shallow: true, scroll: false });
      if (accepted !== false && mounted.current && request === navigation.current && committed.current === origin && round.current === renderedRound && id === caseId) {
        closePageMenu(); focusContent(destination);
      }
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committed.current !== origin || round.current !== renderedRound) return;
      setNavigationError("Die Aufnahme konnte nicht geöffnet werden. Bitte wähle sie erneut.");
      openPageMenu("video-auswahl");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  function markObserved() {
    if (!currentView()) return;
    renderedRound.observed.add(caseId);
    setObserved(current => ({ ...current, [caseId]: true }));
  }
  function mediaFailed() {
    if (!currentPlayback() || renderedView.failed) return;
    renderedView.failed = true; refresh();
  }
  function retry() {
    if (!currentPlayback()) return;
    video.current?.pause?.(); playback.current = null;
    active.current = { ...renderedView, attempt: attempt + 1, failed: false }; refresh();
  }
  function submit(index) {
    if (!currentView() || !renderedRound.observed.has(caseId) || renderedRound.answered.has(answerKey) || !Number.isInteger(index) || index < 0 || index >= question.choices.length) return;
    video.current?.pause?.(); renderedRound.answered.add(answerKey);
    setAnswers(current => ({ ...current, [answerKey]: index }));
  }
  function changeQuestion(delta) {
    if (!currentView() || ![-1, 1].includes(delta) || (delta > 0 && !renderedRound.answered.has(answerKey))) return;
    const next = questionIndex + delta;
    if (next < 0 || next >= item.questions.length) return;
    video.current?.pause?.(); active.current = { ...renderedView, questionIndex: next }; refresh();
  }
  function reviewMoment() {
    if (!currentPlayback() || !video.current) return;
    video.current.pause();
    const duration = video.current.duration;
    if (Number.isFinite(duration)) video.current.currentTime = Math.min(question.at, Math.max(0, duration - 0.1));
  }
  function reset() {
    if (!currentView()) return;
    video.current?.pause?.(); playback.current = null;
    round.current = { observed: new Set(), answered: new Set() };
    active.current = { ...renderedView, questionIndex: 0, generation: generation + 1, attempt: 0, failed: false };
    setAnswers({}); setObserved({}); refresh();
  }
  function search(value) {
    if (ready && mounted.current && committed.current === origin && round.current === renderedRound) setQuery(value);
  }

  return <LearningToolLayout title="Wildtier-Videofälle" description="Echte Naturaufnahmen anschauen, anhalten und sorgfältig beurteilen. Jede Antwort erklärt, was sichtbar ist und was aus einem kurzen Clip offenbleibt." icon="video" category="wildkunde" headingOnly hideCommunity>
    <PageMenu title="Wildtier-Videofälle – Aufnahme wählen" openInitially={ready && !item} initialFocusId="video-auswahl">
      <section aria-labelledby="video-auswahl"><h2 id="video-auswahl" tabIndex={-1}>Eine Aufnahme finden</h2><label className={styles.field}>Videos durchsuchen<input type="search" value={query} disabled={!ready} onChange={event => search(event.target.value)} placeholder="Zum Beispiel Fuchs, Brunft oder Stockente" /></label><div className={mediaStyles.caseList}>{matches.map(entry => <button type="button" key={entry.id} disabled={!ready} aria-pressed={caseId === entry.id} className={caseId === entry.id ? styles.primary : styles.secondary} onClick={() => selectCase(entry.id)}>{entry.title}{entry.questions.every(current => answers[`${entry.id}:${current.id}`] !== undefined) ? " · abgeschlossen" : ""}</button>)}</div>{matches.length === 0 && <div className={styles.empty}><p>Kein passendes Video.</p><button className={styles.secondary} type="button" onClick={() => search("")}>Suche zurücksetzen</button></div>}{navigationError && <p className={styles.wrong} role="alert">{navigationError}</p>}
      <p>{answeredCount} von {wildlifeVideoQuestionCount} Fragen beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={wildlifeVideoQuestionCount} aria-label="Beantwortete Videofragen" /></section>
      <Link href="/lernen/videos">Alle Lernvideos</Link>
      <section className={styles.note}><strong>Beobachten, ohne etwas hinzuzuerfinden</strong><p>Die Videos stammen aus echten Naturaufnahmen. Schau den Clip an oder lies die zugängliche Textfassung. Halte ihn an, prüfe die Frage und vergleiche nach deiner Antwort die Erklärung. Tierart und Aufnahmeort sind immer offen angegeben.</p></section>
      {answeredCount > 0 && <section><h2>Die Beobachtungsrunde wiederholen</h2><p>Alle Erklärungen bleiben über die Fälle erreichbar. Eine neue Runde setzt nur die Ergebnisse in diesem Fenster zurück. Die gewählte Aufnahme bleibt geöffnet.</p><button className={styles.secondary} type="button" onClick={reset}>Alle Videofälle neu beginnen</button></section>}
    </PageMenu>
    {item ? <section className={styles.panel} aria-labelledby="video-fall"><h2 id="video-fall" ref={heading} tabIndex={-1}>{item.title}</h2><p><strong>{item.species}</strong> · {item.location}</p><figure className={styles.figure}><video key={`${caseId}:${generation}:${attempt}`} ref={video} controls playsInline preload="none" poster={item.poster} aria-label={item.title} aria-describedby="video-textfassung" className={mediaStyles.video} onTimeUpdate={event => { if (currentPlayback() && event.currentTarget.currentTime >= 2) markObserved(); }} onPlay={event => { if (!currentPlayback()) event.currentTarget.pause?.(); }} onError={mediaFailed}><source src={item.src} type="video/webm" onError={mediaFailed} />Die Originalaufnahme kann in diesem Browser nicht direkt abgespielt werden. Die Textfassung steht unten.</video><figcaption>Unveränderte Wikimedia-WebM-Fassung in 480p; keine KI. Vorschaubild: Standbild derselben Aufnahme. Ungefähr {item.duration} Sekunden.</figcaption></figure>
      {failed && <div className={styles.note} role="alert"><p>Der Browser konnte das Video nicht abspielen. Prüfe die Verbindung oder nutze die Textfassung. Manche ältere Browser unterstützen WebM nicht.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={retry}>Video neu laden</button><a className={styles.secondary} href={item.source} target="_blank" rel="noreferrer">Bei der Originalquelle ansehen</a></div></div>}
      <details className={mediaStyles.transcript} id="video-textfassung" ref={transcript} tabIndex={-1}><summary>Textfassung der Aufnahme lesen</summary><p>{item.transcript}</p><button className={styles.secondary} type="button" onClick={markObserved}>Textfassung gelesen – Fragen öffnen</button></details>
      <div className={styles.tags}>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h3>Darauf kommt es beim Beobachten an</h3><ul>{item.observations.map(text => <li key={text}>{text}</li>)}</ul>
      <p className={styles.note}>Beschrieben werden sichtbare beziehungsweise ausdrücklich von der Quelle dokumentierte Vorgänge. Unsichtbare Nahrung, exakte Altersjahre, Fortpflanzungs- und Gesundheitszustände werden nicht als gesicherte Beobachtung ausgegeben.</p>
      <p className={styles.muted}>Frage {questionIndex + 1} von {item.questions.length}</p><h3>{question.question}</h3>{!observed[caseId] && <p className={styles.note}>Starte die Aufnahme oder lies die Textfassung, bevor du antwortest.</p>}<div className={styles.choices}>{question.choices.map((choice, index) => <button key={choice} type="button" disabled={!observed[caseId] || selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === question.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => submit(index)}>{choice}</button>)}</div>
      {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig beobachtet." : `Richtig ist: ${question.choices[question.answer]}`}</strong><p>{question.explanation}</p></div>}
      <div className={styles.actions}><button className={styles.secondary} type="button" disabled={questionIndex === 0} onClick={() => changeQuestion(-1)}>Vorige Frage</button><button className={styles.secondary} type="button" onClick={reviewMoment}>Beobachtungsmoment anhalten</button>{questionIndex < item.questions.length - 1 && <button className={styles.primary} type="button" disabled={selected === undefined} onClick={() => changeQuestion(1)}>Nächste Frage</button>}{caseFinished && <Link className={styles.secondary} href={item.course}>Im Kurs vertiefen</Link>}</div>
      {caseFinished && <p className={styles.note} role="status">Alle drei Fragen zu dieser Aufnahme beantwortet. Wähle unten im Menü einen weiteren Fall.</p>}
      <details className={styles.sources}><summary>Inhalt und Quellen prüfen</summary><p>{item.authorUrl ? <>© <a href={item.authorUrl} target="_blank" rel="noreferrer">{item.author}, gileslaurent.com</a>, License CC BY-SA</> : <>Aufnahme: {item.author}</>} · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a> · <a href={item.source} target="_blank" rel="noreferrer">Originalquelle</a></p><p>Beobachtungsgrundlage ist die verlinkte Originalaufnahme samt Urheberbeschreibung. Fachliche Einordnung: <a href="https://www.waldwissen.net/de/lebensraum-wald/wald-und-wild/wildoekologie/der-rothirsch-cervus-elaphus" target="_blank" rel="noreferrer">Rothirsch – waldwissen.net</a> und <a href="https://www.waldwissen.net/assets/wald/wild/management/wsl_wildtiermanagement/download/wsl_wildtiermanagement_grundlagen.pdf.pdf" target="_blank" rel="noreferrer">WSL: Grenzen von Wildbeobachtungen und Bestandsangaben</a>. Geprüft am 4. Oktober 2026.</p></details>
    </section> : <p className={styles.note}>{ready ? "Diese Aufnahme ist nicht verfügbar. Wähle eine Aufnahme unten im Menü." : "Die gewählte Aufnahme wird geladen."}</p>}
  </LearningToolLayout>;
}
