import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppIcon from "./AppIcon";
import { LearningPhotoCredit } from "./LearningMedia";
import { photoDetectiveRounds, getPhotoDetectiveSummary } from "../lib/photo-detective";
import styles from "../styles/PhotoDetective.module.css";

function PhotoEvidence({ round, revealed, activeTrait, onTrait }) {
  return <figure className={styles.figure}>
    <div className={styles.photoFrame}>
      <div className={styles.photo} style={{ maxWidth: round.photo.width }}>
        <Image src={round.photo.src} alt={revealed ? round.photo.alt : round.neutralAlt} width={round.photo.width} height={round.photo.height} sizes="(max-width: 600px) 88vw, 760px" loading="eager" />
        {revealed && round.traits.map((trait, index) => <button key={trait.title} type="button" className={[styles.marker, index === activeTrait ? styles.markerActive : ""].join(" ")} style={{ left: `${trait.x}%`, top: `${trait.y}%` }} aria-label={`Merkmal ${index + 1}: ${trait.title}`} aria-pressed={index === activeTrait} aria-controls="photo-trait-detail" onClick={() => onTrait(index)}>{index + 1}</button>)}
      </div>
    </div>
    <figcaption><LearningPhotoCredit media={round.photo} /></figcaption>
  </figure>;
}

function EvidenceDetails({ round, activeTrait, onTrait }) {
  return <section className={styles.evidence} aria-label="Sichtbare Merkmale">
    <h3>Am Foto entdecken</h3>
    <p>Tippe auf eine Zahl im Foto oder wähle das Merkmal hier.</p>
    <div className={styles.traitButtons}>{round.traits.map((trait, index) => <button key={trait.title} type="button" aria-pressed={index === activeTrait} aria-controls="photo-trait-detail" className={index === activeTrait ? styles.traitSelected : ""} onClick={() => onTrait(index)}><span>{index + 1}</span>{trait.title}</button>)}</div>
    <div id="photo-trait-detail" className={styles.traitDetail} aria-live="polite"><strong>{round.traits[activeTrait].title}</strong><p>{round.traits[activeTrait].text}</p></div>
  </section>;
}

function FurtherLearning({ round }) {
  return <div className={styles.further}>
    <p><strong>Was das Foto offenlässt:</strong> {round.limit}</p>
    <Link href={`/kurse/${round.course}`} className={styles.courseLink}><AppIcon name="book" size={18} />Im passenden Kurs vertiefen<AppIcon name="arrow-right" size={18} /></Link>
    <details className={styles.sources}><summary>Fachquellen zur Erklärung</summary><ul>{round.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
  </div>;
}

export default function PhotoDetective() {
  const [mode, setMode] = useState("quiz");
  const [roundIds, setRoundIds] = useState(photoDetectiveRounds.map(round => round.id));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [hint, setHint] = useState(false);
  const [activeTrait, setActiveTrait] = useState(0);
  const [finished, setFinished] = useState(false);
  const [practice, setPractice] = useState(false);
  const [exploreId, setExploreId] = useState(photoDetectiveRounds[0].id);
  const nextGuard = useRef(null);
  const hintGuard = useRef(false);
  const attemptGuard = useRef(0);
  const quizRoundGuard = useRef(null);
  const rounds = roundIds.map(id => photoDetectiveRounds.find(round => round.id === id));
  const round = mode === "explore" ? photoDetectiveRounds.find(item => item.id === exploreId) : rounds[index];
  const attempt = attemptGuard.current;
  quizRoundGuard.current = rounds[index].id;
  const answer = answers[round.id];
  const summary = getPhotoDetectiveSummary(rounds, answers);
  const revealed = mode === "explore" || Boolean(answer) || hint;

  function start(ids = photoDetectiveRounds.map(item => item.id), isPractice = false) {
    attemptGuard.current += 1;
    nextGuard.current = null;
    hintGuard.current = false;
    setRoundIds(ids); setIndex(0); setAnswers({}); setHint(false); setActiveTrait(0); setFinished(false); setPractice(isPractice); setMode("quiz");
  }
  function choose(choice) {
    if (answer || attemptGuard.current !== attempt || quizRoundGuard.current !== round.id) return;
    const assisted = hint || hintGuard.current;
    setAnswers(previous => previous[round.id] ? previous : ({ ...previous, [round.id]: { choice, assisted } }));
    setActiveTrait(0);
  }
  function next() {
    if (!answer || nextGuard.current === round.id || attemptGuard.current !== attempt || quizRoundGuard.current !== round.id) return;
    nextGuard.current = round.id;
    if (index + 1 === rounds.length) setFinished(true);
    else { setIndex(index + 1); setHint(false); hintGuard.current = false; setActiveTrait(0); }
  }
  function showHint() {
    if (attemptGuard.current !== attempt || quizRoundGuard.current !== round.id || answer) return;
    hintGuard.current = true; setHint(true);
  }
  function changeExplore(id) { setExploreId(id); setActiveTrait(0); }

  return <main className={styles.main}>
    <nav className={styles.nav} aria-label="Lernmenü"><Link href="/lernen"><AppIcon name="arrow-left" size={18} />Lernbereich</Link><Link href="/lernen/wildkunde">Wildkunde</Link></nav>
    <header className={styles.header}><p className={styles.eyebrow}>Mit echten Fotos lernen</p><h1><AppIcon name="camera" size={34} />Fotodetektiv</h1><p>Erkenne Wildarten an sichtbaren Merkmalen. Jede Antwort wird erklärt; die Zahlen im Foto zeigen dir anschließend, worauf es ankommt.</p></header>
    <div className={styles.modeButtons} role="group" aria-label="Lernweise wählen"><button type="button" aria-pressed={mode === "quiz"} onClick={() => setMode("quiz")}><AppIcon name="target" size={20} />Wissen testen</button><button type="button" aria-pressed={mode === "explore"} onClick={() => { setMode("explore"); setActiveTrait(0); }}><AppIcon name="eye" size={20} />Merkmale entdecken</button></div>

    {mode === "quiz" && finished ? <section className={styles.card} aria-labelledby="photo-result-heading">
      <p className={styles.eyebrow}>{practice ? "Deine Wiederholung" : "Deine Fotorunde"}</p><h2 id="photo-result-heading">{summary.correct} von {rounds.length} Arten richtig erkannt</h2>
      <div className={styles.resultStats}><span><strong>{summary.independent}</strong> ohne Merkmals-Hilfe</span><span><strong>{summary.assisted}</strong> mit Merkmals-Hilfe</span><span><strong>{rounds.length - summary.correct}</strong> noch zu üben</span></div>
      <p>Die Auswertung gilt für diese Fotorunde. Wiederhole unsichere Arten gezielt und versuche es beim nächsten Mal ohne Merkmals-Hilfe.</p>
      <div className={styles.actions}><button type="button" className={styles.primary} onClick={() => start()}>Alle Fotos neu üben</button>{summary.retryIds.length > 0 && <button type="button" className={styles.secondary} onClick={() => start(summary.retryIds, true)}>Fehler und Hilfefragen wiederholen ({summary.retryIds.length})</button>}</div>
      <h3>Deine Antworten nachlesen</h3>
      <div className={styles.reviewList}>{rounds.map(item => { const result = answers[item.id]; return <details key={item.id}><summary>{item.name} · {result.choice === item.name ? result.assisted ? "richtig mit Hilfe" : "richtig" : `deine Antwort: ${result.choice}`}</summary><p>{item.explanation}</p>{result.choice !== item.name && <p>{item.wrong[result.choice]}</p>}<Link href={`/kurse/${item.course}`}>Passenden Kurs öffnen</Link></details>; })}</div>
    </section> : <section className={styles.card} aria-labelledby="photo-question-heading">
      {mode === "explore" ? <><label className={styles.selectLabel} htmlFor="photo-species">Welche Art möchtest du ansehen?</label><select id="photo-species" className={styles.select} value={exploreId} onChange={event => changeExplore(event.target.value)}>{photoDetectiveRounds.map(item => <option key={item.id} value={item.id}>{item.name} · {item.group}</option>)}</select><h2 id="photo-question-heading">{round.name}: Merkmale im Bild</h2></> : <><div className={styles.progressLabel}><span>{practice ? "Wiederholung" : "Fotorunde"} · Foto {index + 1} von {rounds.length}</span><span>{summary.independent} richtig ohne Hilfe</span></div><progress className={styles.progress} max={rounds.length} value={summary.completed} aria-label="Beantwortete Fotos" /><h2 id="photo-question-heading">Welche Wildart zeigt das Foto?</h2></>}
      <PhotoEvidence key={round.id} round={round} revealed={revealed} activeTrait={activeTrait} onTrait={setActiveTrait} />
      {mode === "quiz" && <><div className={styles.answerGrid} role="group" aria-label="Art auswählen">{round.options.map(choice => <button key={choice} type="button" disabled={Boolean(answer)} className={[styles.answer, answer && choice === round.name ? styles.correctAnswer : "", answer && choice === answer.choice && choice !== round.name ? styles.wrongAnswer : ""].filter(Boolean).join(" ")} onClick={() => choose(choice)}>{choice}{answer && choice === round.name && <span>Richtig</span>}{answer && choice === answer.choice && choice !== round.name && <span>Deine Antwort</span>}</button>)}</div>{!answer && <button type="button" className={styles.hintButton} aria-expanded={hint} onClick={showHint} disabled={hint}>{hint ? "Merkmals-Hilfe aktiv – diese Antwort wird als unterstützt gezählt" : "Merkmale als Hilfe anzeigen"}</button>}</>}
      {answer && mode === "quiz" && <div className={[styles.feedback, answer.choice === round.name ? styles.feedbackCorrect : styles.feedbackWrong].join(" ")} role="status"><h3>{answer.choice === round.name ? "Richtig erkannt" : `Das ist ${round.name}`}</h3>{answer.choice !== round.name && <p><strong>Du hast {answer.choice} gewählt.</strong> {round.wrong[answer.choice]}</p>}<p>{round.explanation}</p>{answer.assisted && <small>Mit Merkmals-Hilfe beantwortet.</small>}</div>}
      {mode === "explore" && <p className={styles.explanation}>{round.explanation}</p>}
      {revealed && <EvidenceDetails round={round} activeTrait={activeTrait} onTrait={setActiveTrait} />}
      {(mode === "explore" || answer) && <FurtherLearning round={round} />}
      {mode === "quiz" && answer && <div className={styles.actions}><button type="button" className={styles.primary} onClick={next}>{index + 1 === rounds.length ? "Auswertung ansehen" : "Nächstes Foto"}<AppIcon name="arrow-right" size={18} /></button></div>}
    </section>}
    <aside className={styles.observation}><AppIcon name="binoculars" size={24} /><p><strong>Genau hinsehen, Unsicherheit erkennen.</strong> Vergleiche mehrere Merkmale. Ein Foto liefert nur einen Ausschnitt; die Artbestimmung ersetzt keine vollständige Ansprache im Revier.</p></aside>
  </main>;
}
