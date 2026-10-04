import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import AppIcon from "./AppIcon";
import { dogBreeds, dogWorkTasks, dogCompassSources, dogCompassChecks, getDogTaskMatch, getCompassAdvice } from "../lib/dog-compass";
import styles from "../styles/DogCompass.module.css";

const taskName = id => dogWorkTasks.find(task => task.id === id)?.title || id;
const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss");

function BreedPhoto({ profile }) {
  const photo = profile.photo;
  if (!photo) return <div className={styles.symbol}><AppIcon name="paw" size={52} /><span>{profile.group}</span></div>;
  return <figure className={styles.photo}>
    <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" />
    <figcaption>Foto: {photo.author} · {photo.license}. <a href={photo.url} target="_blank" rel="noopener noreferrer">Originalaufnahme</a>{photo.licenseUrl && <> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">Lizenz</a></>}</figcaption>
  </figure>;
}

function ProfileFacts({ profile }) {
  return <dl className={styles.facts}>
    <div><dt>Arbeitsprofil</dt><dd>{profile.work}</dd></div>
    <div><dt>Ausbildung & Zusammenarbeit</dt><dd>{profile.training}</dd></div>
    <div><dt>Alltag & Betreuung</dt><dd>{profile.everyday}</dd></div>
    <div><dt>Pflege & Belastung</dt><dd>{profile.care}</dd></div>
    <div><dt>Vor einer Entscheidung klären</dt><dd>{profile.boundary}</dd></div>
  </dl>;
}

function KnowledgeCheck() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const answerLock = useRef({});
  const advanceLock = useRef(null);
  const cursorRef = useRef({ index: 0, run: 0 });
  const run = cursorRef.current.run;
  const question = dogCompassChecks[index];
  const selected = answers[question.id];
  const answered = selected !== undefined;
  const score = dogCompassChecks.filter(item => answers[item.id] === item.answer).length;
  function restart() { cursorRef.current = { index: 0, run: cursorRef.current.run + 1 }; answerLock.current = {}; advanceLock.current = null; setIndex(0); setAnswers({}); setFinished(false); }
  function chooseAnswer(optionIndex) {
    if (cursorRef.current.run !== run || cursorRef.current.index !== index || answerLock.current[question.id] !== undefined) return;
    answerLock.current[question.id] = optionIndex;
    setAnswers(previous => ({ ...previous, [question.id]: optionIndex }));
  }
  function advance() {
    if (cursorRef.current.run !== run || cursorRef.current.index !== index || answerLock.current[question.id] === undefined || advanceLock.current === question.id) return;
    advanceLock.current = question.id;
    if (index === dogCompassChecks.length - 1) setFinished(true);
    else { cursorRef.current.index = index + 1; setIndex(previous => previous + 1); }
  }
  return <section className={styles.panel} aria-labelledby="dog-check-title">
    <h2 id="dog-check-title">Kurz prüfen: Aufgabe vor Rassename</h2>
    {finished ? <div className={styles.feedback} role="status">
      <h3>{score} von {dogCompassChecks.length} Antworten richtig</h3>
      <p>Die Begründungen kannst du beim erneuten Durchgang wieder lesen. Dieser Kurzcheck wird nicht als Kursabschluss gespeichert.</p>
      <button type="button" className={styles.primary} onClick={restart}>Wissenscheck wiederholen</button>
    </div> : <>
      <p className={styles.muted}>Frage {index + 1} von {dogCompassChecks.length}</p>
      <h3>{question.question}</h3>
      <div className={styles.answers}>{question.options.map((option, optionIndex) => <button type="button" key={option} disabled={answered} className={`${styles.answer} ${answered && optionIndex === question.answer ? styles.correct : ""} ${answered && optionIndex === selected && selected !== question.answer ? styles.incorrect : ""}`} onClick={() => chooseAnswer(optionIndex)}>{option}</button>)}</div>
      {answered && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig beantwortet." : "Noch nicht richtig."}</strong><p><strong>Richtige Antwort:</strong> {question.options[question.answer]}</p><p>{question.explain}</p><button type="button" className={styles.primary} onClick={advance}>{index === dogCompassChecks.length - 1 ? "Ergebnis ansehen" : "Nächste Frage"}</button></div>}
    </>}
  </section>;
}

export default function DogCompass() {
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [comparison, setComparison] = useState([]);
  const comparisonRef = useRef([]);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState({ access: "", guidance: "", everyday: "" });
  const [showPlan, setShowPlan] = useState(false);
  const search = normalize(query.trim());
  const visible = dogBreeds.filter(profile => {
    const match = getDogTaskMatch(profile, tasks);
    const taskFits = !tasks.length || (onlyComplete ? match.missing.length === 0 : match.matched.length > 0);
    return taskFits && (!search || normalize(`${profile.name} ${profile.group} ${profile.summary}`).includes(search));
  });
  const compared = comparison.map(id => dogBreeds.find(profile => profile.id === id)).filter(Boolean);
  const advice = getCompassAdvice(plan);
  const completePlan = Boolean(plan.access && plan.guidance && plan.everyday);
  function toggleTask(id) { setTasks(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]); }
  function toggleCompare(id) {
    const current = comparisonRef.current;
    if (current.includes(id)) { comparisonRef.current = current.filter(item => item !== id); setComparison(comparisonRef.current); setMessage("Profil aus dem Vergleich entfernt."); return; }
    if (current.length >= 3) { setMessage("Drei Profile sind gewählt. Entferne zuerst eines, um ein anderes hinzuzufügen."); return; }
    comparisonRef.current = [...current, id];
    setComparison(comparisonRef.current);
    setMessage(`${dogBreeds.find(profile => profile.id === id).name} zum Vergleich hinzugefügt.`);
  }
  function resetFilters() { setTasks([]); setQuery(""); setOnlyComplete(false); }
  function setPlanValue(key, value) { setPlan(previous => ({ ...previous, [key]: value })); }
  return <>
    <Head><title>Jagdhund-Kompass – Jagdlatein</title><meta name="description" content="14 Jagdhunderassen nach Arbeitsgebieten kennenlernen, bis zu drei Profile vergleichen und Ausbildung, Alltag und Pflege gemeinsam planen." /></Head>
    <main className={styles.main}><div className={styles.wrap}>
      <nav className={styles.nav} aria-label="Lernmenü"><Link href="/lernen"><AppIcon name="arrow-left" size={18} />Lernbereich</Link><Link href="/lernen/hundewesen">Hundewesen</Link><Link href="/kurse/wissen-vertiefung-jagdhunderassen">Rassen ausführlich lernen</Link></nav>
      <header className={styles.header}><span className={styles.heroIcon}><AppIcon name="paw" size={44} /></span><p className={styles.eyebrow}>Hundewesen zum Entdecken</p><h1>Dein Jagdhund-Kompass</h1><p>Welche Aufgaben unterscheiden Jagdhunderassen? Lerne {dogBreeds.length} Profile kennen, vergleiche ihre Schwerpunkte und prüfe, was ein Hundeteam im Alltag braucht.</p><div className={styles.quickLinks}><a href="#dog-profiles">Rassen entdecken</a><a href="#dog-plan">Alltag prüfen</a><a href="#dog-check-title">Wissen testen</a></div></header>
      <section className={styles.panel} aria-labelledby="dog-task-title"><h2 id="dog-task-title">1. Was möchtest du mit dem Hund lernen?</h2><p>Wähle Arbeitsgebiete. Die Profile zeigen rassentypische Schwerpunkte; die tatsächliche Eignung hängt von Anlagen, Gesundheit, Ausbildung und Erfahrung des einzelnen Teams ab.</p>
        <fieldset className={styles.taskFieldset}><legend>Arbeitsgebiete auswählen</legend><div className={styles.taskGrid}>{dogWorkTasks.map(task => <label key={task.id} className={`${styles.task} ${tasks.includes(task.id) ? styles.taskSelected : ""}`}><span><input type="checkbox" checked={tasks.includes(task.id)} onChange={() => toggleTask(task.id)} /><strong>{task.title}</strong></span><small>{task.text}</small></label>)}</div></fieldset>
        <div className={styles.filters}><div className={styles.search}><label htmlFor="dog-search">Rasse oder Rassegruppe suchen</label><input id="dog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Retriever oder Münsterländer" /></div><label className={styles.checkLabel}><input type="checkbox" checked={onlyComplete} onChange={event => setOnlyComplete(event.target.checked)} />Nur Profile mit allen gewählten Schwerpunkten</label><button type="button" className={styles.secondary} onClick={resetFilters}>Auswahl zurücksetzen</button></div>
        <p className={styles.method}>So wird gefiltert: {tasks.length ? onlyComplete ? "Ein Profil muss alle gewählten Arbeitsgebiete als Schwerpunkt enthalten." : "Ein Profil erscheint, sobald mindestens ein gewähltes Arbeitsgebiet zu seinen Schwerpunkten gehört." : "Ohne gewähltes Arbeitsgebiet siehst du alle Rassen."} Die Reihenfolge ist keine Rangliste. Andere Aufgaben können erlernbar sein; sie werden hier nicht als Rassenschwerpunkt ausgewiesen.</p>
      </section>
      <section className={styles.profiles} id="dog-profiles" aria-labelledby="dog-profiles-title"><div className={styles.sectionHeading}><h2 id="dog-profiles-title">2. Arbeitsprofile entdecken</h2><p aria-live="polite">{visible.length} von {dogBreeds.length} Profilen sichtbar · {comparison.length} von 3 im Vergleich</p></div><div className={styles.message}><p role="status">{message || "Wähle bis zu drei Rassen für den Vergleich unterhalb der Profile."}</p>{comparison.length > 0 && <a href="#dog-comparison" className={styles.compareJump}>Zum Vergleich ({comparison.length}) <AppIcon name="arrow-right" size={18} /></a>}</div>
        {!visible.length && <div className={styles.empty}><h3>Kein Profil passt zu dieser Auswahl.</h3><p>Die gewählte Kombination ist hier nicht als Rassenschwerpunkt abgebildet. Weniger Arbeitsgebiete wählen oder den Filter für alle Schwerpunkte ausschalten.</p><button type="button" className={styles.secondary} onClick={resetFilters}>Alle Profile anzeigen</button></div>}
        <div className={styles.profileGrid}>{visible.map(profile => { const match = getDogTaskMatch(profile, tasks); const selected = comparison.includes(profile.id); return <article key={profile.id} className={styles.profile}>
          <BreedPhoto profile={profile} /><div className={styles.profileBody}><p className={styles.group}>{profile.group} · FCI {profile.standard.number}</p><h3>{profile.name}</h3><p>{profile.summary}</p><ul className={styles.tags} aria-label="Rassentypische Arbeitsgebiete">{profile.tasks.map(id => <li key={id} className={tasks.includes(id) ? styles.matchedTag : ""}>{taskName(id)}</li>)}</ul>
          {tasks.length > 0 && <div className={styles.match}><p><strong>Deine Auswahl trifft:</strong> {match.matched.map(taskName).join(", ") || "Kein ausgewiesener Schwerpunkt"}</p>{match.missing.length > 0 && <p><strong>Hier kein Schwerpunkt:</strong> {match.missing.map(taskName).join(", ")}</p>}</div>}
          <button type="button" className={selected ? styles.primary : styles.secondary} aria-pressed={selected} aria-label={`${profile.name} ${selected ? "aus dem Vergleich entfernen" : "vergleichen"}`} onClick={() => toggleCompare(profile.id)}>{selected ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}</button>
          {selected && <a href="#dog-comparison" className={styles.compareJump}>Zum Vergleich ({comparison.length}) <AppIcon name="arrow-right" size={18} /></a>}
          <details className={styles.details}><summary>Arbeit, Ausbildung, Alltag & Pflege</summary><ProfileFacts profile={profile} /><a href={profile.source.url} target="_blank" rel="noopener noreferrer">{profile.source.title} (PDF, Englisch)</a></details></div>
        </article>; })}</div>
      </section>
      <section className={styles.panel} id="dog-comparison" aria-labelledby="dog-comparison-title"><h2 id="dog-comparison-title">Dein Rassenvergleich</h2><p>Vergleiche dieselben Fragen für bis zu drei Profile. Die Hinweise beschreiben Ausbildungs- und Betreuungsaufgaben, keine garantierte Leistung oder Familienverträglichkeit.</p>{!compared.length ? <p className={styles.muted}>Wähle oben mindestens ein Profil aus.</p> : <><div className={styles.comparisonGrid}>{compared.map(profile => <article key={profile.id} className={styles.comparison}><h3>{profile.name}</h3><p><strong>Schwerpunkte:</strong> {profile.tasks.map(taskName).join(", ")}</p><ProfileFacts profile={profile} /><button type="button" className={styles.secondary} onClick={() => toggleCompare(profile.id)} aria-label={`${profile.name} aus dem Vergleich entfernen`}>Entfernen</button></article>)}</div><button type="button" className={styles.secondary} onClick={() => { comparisonRef.current = []; setComparison([]); setMessage("Der Vergleich wurde geleert."); }}>Vergleich leeren</button></>}</section>
      <section className={styles.panel} id="dog-plan" aria-labelledby="dog-plan-title"><h2 id="dog-plan-title">3. Passt der Plan zum wirklichen Alltag?</h2><p>Dieser Check gibt dir konkrete Gesprächspunkte. Er entscheidet weder über eine Anschaffung noch über die Eignung eines Hundes. Deine Auswahl bleibt nur für diesen Besuch erhalten.</p>
        <div className={styles.planGrid}><fieldset><legend>Passende Arbeitsmöglichkeiten</legend>{[["ready", "Konkrete Möglichkeiten sind geklärt"], ["planned", "Ich plane sie noch"], ["none", "Bisher keine passende Möglichkeit"]].map(([value, title]) => <label key={value}><input type="radio" name="dog-access" value={value} checked={plan.access === value} onChange={() => setPlanValue("access", value)} />{title}</label>)}</fieldset>
        <fieldset><legend>Fachliche Ausbildungsbegleitung</legend>{[["ready", "Eine passende Begleitung ist vorhanden"], ["planned", "Ich organisiere sie noch"], ["none", "Noch keine Begleitung"]].map(([value, title]) => <label key={value}><input type="radio" name="dog-guidance" value={value} checked={plan.guidance === value} onChange={() => setPlanValue("guidance", value)} />{title}</label>)}</fieldset>
        <fieldset><legend>Betreuung an jedem Tag</legend>{[["ready", "Bewegung, Kontakt, Pflege und Ruhe sind organisiert"], ["open", "Zeit oder Zuständigkeiten sind noch offen"]].map(([value, title]) => <label key={value}><input type="radio" name="dog-everyday" value={value} checked={plan.everyday === value} onChange={() => setPlanValue("everyday", value)} />{title}</label>)}</fieldset></div>
        <button type="button" className={styles.primary} onClick={() => setShowPlan(true)}>Meinen Plan einordnen</button>
        {showPlan && <div className={styles.feedback} role="status"><h3>{completePlan ? "Diese Punkte gehören in dein Gespräch" : "Ergänze die offenen Fragen"}</h3>{!completePlan && <p>Wähle in jeder der drei Gruppen eine Antwort. Bereits gewählte Punkte kannst du hier trotzdem prüfen.</p>}{advice.length > 0 && <ul>{advice.map(item => <li key={item}>{item}</li>)}</ul>}<p>Arbeitsgebiete und Rasseprofil geben eine Richtung. Gesundheit, individuelle Anlagen, passende Lernschritte und geltende örtliche Anforderungen werden zusätzlich geklärt.</p><Link href="/kurse/wissen-vertiefung-hundeteam-belastung">Hundeteam, Bedürfnisse und Belastung vertiefen <AppIcon name="arrow-right" size={18} /></Link></div>}
      </section>
      <KnowledgeCheck />
      <section className={styles.panel} aria-labelledby="dog-more-title"><h2 id="dog-more-title">Noch tiefer ins Hundewesen</h2><p>Die ausführliche Rassen-Lerneinheit erklärt weitere Gruppen, Jagdhundbegriffe und Auswahlfälle. Im Kompass sind Rassenschwerpunkte nach FCI zusammengefasst; Trainings- und Alltagshinweise sind eine praktische Einordnung für deine Planung.</p><Link className={styles.courseLink} href="/kurse/wissen-vertiefung-jagdhunderassen"><AppIcon name="book" size={24} /><span>Jagdhunderassen ausführlich lernen</span><AppIcon name="arrow-right" size={20} /></Link><h3>Grundlagen & Quellen</h3><p>Jedes Profil verlinkt seinen offiziellen FCI-Standard. Prüfungsordnungen beschreiben unterschiedliche Leistungsanforderungen; ihre örtliche Anerkennung ist gesondert zu prüfen.</p><ul className={styles.sources}>{dogCompassSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul><p className={styles.muted}>Quellen geprüft am 4. Oktober 2026. Fotos sind echte Originalaufnahmen mit Bildnachweis. Für weitere Profile wird ein neutrales Pfotensymbol verwendet.</p></section>
    </div></main>
  </>;
}
