import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { dogBreeds, dogWorkTasks, dogCompassSources, dogCompassChecks, getDogTaskMatch, getCompassAdvice } from "../lib/dog-compass";
import experienceStyles from "../styles/LearningExperience.module.css";
import styles from "../styles/DogCompass.module.css";

const taskName = id => dogWorkTasks.find(task => task.id === id)?.title || id;
const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");

function BreedPhoto({ profile }) {
  const photo = profile.photo;
  if (!photo) return <div className={styles.symbol}><AppIcon name="paw" size={52} /><span>{profile.group}</span></div>;
  return <figure className={styles.photo}>
    <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" />
    <figcaption>Foto: {photo.author} · {photo.license}. <a href={photo.url} target="_blank" rel="noopener noreferrer">Originalaufnahme</a>{photo.licenseUrl && <> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">Lizenz</a></>}{photo.modifications && <span> {photo.modifications}</span>}</figcaption>
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
      <button type="button" className={experienceStyles.primary} onClick={restart}>Wissenscheck wiederholen</button>
    </div> : <>
      <p className={styles.muted}>Frage {index + 1} von {dogCompassChecks.length}</p>
      <h3>{question.question}</h3>
      <div className={styles.answers}>{question.options.map((option, optionIndex) => <button type="button" key={option} disabled={answered} className={`${styles.answer} ${answered && optionIndex === question.answer ? styles.correct : ""} ${answered && optionIndex === selected && selected !== question.answer ? styles.incorrect : ""}`} onClick={() => chooseAnswer(optionIndex)}>{option}</button>)}</div>
      {answered && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig beantwortet." : "Noch nicht richtig."}</strong><p><strong>Richtige Antwort:</strong> {question.options[question.answer]}</p><p>{question.explain}</p><button type="button" className={experienceStyles.primary} onClick={advance}>{index === dogCompassChecks.length - 1 ? "Ergebnis ansehen" : "Nächste Frage"}</button></div>}
    </>}
  </section>;
}

export default function DogCompass() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [comparison, setComparison] = useState([]);
  const comparisonRef = useRef([]);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState({ access: "", guidance: "", everyday: "" });
  const [requestedId, setRequestedId] = useState(null);
  const requestRevealed = useRef(null);
  useEffect(() => {
    const id = typeof router.query?.rasse === "string" ? router.query.rasse : "";
    const profile = dogBreeds.find(item => item.id === id);
    if (!profile) return;
    setTasks([]); setGroup("all"); setQuery(profile.name); setRequestedId(profile.id);
  }, [router.query?.rasse]);
  useEffect(() => {
    if (typeof document === "undefined" || !requestedId || requestRevealed.current === requestedId) return;
    const article = document.getElementById(`dog-${requestedId}`);
    const detail = article?.querySelector("details");
    const summary = detail?.querySelector("summary");
    if (!summary || query !== dogBreeds.find(item => item.id === requestedId)?.name) return;
    requestRevealed.current = requestedId;
    detail.open = true; summary.focus({ preventScroll: true }); article.scrollIntoView({ block: "start", behavior: "auto" });
  }, [requestedId, query]);
  const search = normalize(query.trim());
  const namedTask = dogWorkTasks.find(task => normalize(task.title) === search || normalize(task.id) === search);
  const visible = dogBreeds.filter(profile => {
    const match = getDogTaskMatch(profile, tasks);
    const taskFits = !tasks.length || (onlyComplete ? match.missing.length === 0 : match.matched.length > 0);
    const queryFits = !search || (namedTask ? profile.tasks.includes(namedTask.id) : normalize([profile.name, ...(profile.aliases || []), profile.group, profile.summary, profile.work, ...profile.tasks.map(taskName)].join(" ")).includes(search));
    return taskFits && (group === "all" || profile.group === group) && queryFits;
  });
  const groups = [...new Set(dogBreeds.map(profile => profile.group))];
  const compared = comparison.map(id => dogBreeds.find(profile => profile.id === id)).filter(Boolean);
  const advice = getCompassAdvice(plan);
  const completePlan = Boolean(plan.access && plan.guidance && plan.everyday);
  const showPlan = Boolean(plan.access || plan.guidance || plan.everyday);
  function toggleTask(id) { setTasks(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]); }
  function toggleCompare(id) {
    const current = comparisonRef.current;
    if (current.includes(id)) { comparisonRef.current = current.filter(item => item !== id); setComparison(comparisonRef.current); setMessage("Profil aus dem Vergleich entfernt."); return; }
    if (current.length >= 3) { setMessage("Drei Profile sind gewählt. Entferne zuerst eines, um ein anderes hinzuzufügen."); return; }
    comparisonRef.current = [...current, id]; setComparison(comparisonRef.current);
    setMessage(`${dogBreeds.find(profile => profile.id === id).name} zum Vergleich hinzugefügt.`);
  }
  function resetFilters() { setTasks([]); setQuery(""); setGroup("all"); setOnlyComplete(false); }
  function setPlanValue(key, value) { setPlan(previous => ({ ...previous, [key]: value })); }
  return <LearningToolLayout title="Jagdhunderassen" description="Arbeitsweisen, Rassen und die Zusammenarbeit im Hundeteam verstehen. Öffne eine Rasse, um ihr Arbeitsprofil, Ausbildung und Alltag kennenzulernen." icon="paw" category="hundewesen" compact stats={[{ value: dogBreeds.length, label: "Rassenprofile" }]}>
    <section className={styles.panel} aria-labelledby="dog-task-title">
      <h2 id="dog-task-title">Rasse finden</h2>
      <div className={styles.filters}>
        <div className={styles.search}><label htmlFor="dog-search">Rasse oder Arbeitsweise</label><input id="dog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Setter, Dackel oder Vorstehen" /></div>
        <div className={styles.search}><label htmlFor="dog-group">Rassegruppe</label><select id="dog-group" value={group} onChange={event => setGroup(event.target.value)}><option value="all">Alle Rassegruppen</option>{groups.map(item => <option key={item}>{item}</option>)}</select></div>
      </div>
      <details className={styles.filterDisclosure}><summary>Nach Arbeitsgebiet filtern{tasks.length > 0 ? ` (${tasks.length})` : ""}</summary>
        <fieldset className={styles.taskFieldset}><legend>Arbeitsgebiete</legend><div className={styles.taskGrid}>{dogWorkTasks.map(task => <label key={task.id} className={`${styles.task} ${tasks.includes(task.id) ? styles.taskSelected : ""}`}><span><input type="checkbox" checked={tasks.includes(task.id)} onChange={() => toggleTask(task.id)} /><strong>{task.title}</strong></span><small>{task.text}</small></label>)}</div></fieldset>
        <label className={styles.checkLabel}><input type="checkbox" checked={onlyComplete} onChange={event => setOnlyComplete(event.target.checked)} />Nur Profile mit allen gewählten Schwerpunkten</label>
        <p className={styles.method}>Rassenschwerpunkte sind keine Leistungszusage. Die tatsächliche Eignung hängt von Anlagen, Gesundheit, Ausbildung und Erfahrung des Teams ab. Arbeitsweisen und örtliche Anerkennung werden gesondert geprüft.</p>
      </details>
      {(query || tasks.length > 0 || group !== "all" || onlyComplete) && <button type="button" className={styles.textAction} onClick={resetFilters}>Auswahl zurücksetzen</button>}
    </section>
    <section className={styles.profiles} id="dog-profiles" aria-labelledby="dog-profiles-title">
      <div className={styles.sectionHeading}><h2 id="dog-profiles-title">Rassen entdecken</h2><p aria-live="polite">{visible.length} von {dogBreeds.length} Profilen sichtbar</p></div>
      {message && <p className={styles.message} role="status">{message}{comparison.length > 0 && <a href="#dog-comparison" className={styles.compareJump}>Vergleich ansehen ({comparison.length})</a>}</p>}
      {!visible.length && <div className={styles.empty}><h3>Kein Profil passt zu dieser Auswahl.</h3><p>Versuche einen kürzeren Begriff oder wähle weniger Arbeitsgebiete.</p></div>}
      <div className={styles.breedList}>{visible.map(profile => <article key={profile.id} id={`dog-${profile.id}`} className={styles.breedRow}>
        <details className={styles.breedDetails}><summary><AppIcon name="paw" size={23} /><span><strong>{profile.name}</strong><span>{profile.group} · {profile.tasks.map(taskName).join(" / ")}</span></span></summary>
          <div className={styles.breedContent}>{profile.photo && <BreedPhoto profile={profile} />}<p>{profile.summary}</p><ProfileFacts profile={profile} />
            <label className={styles.compareChoice}><input type="checkbox" checked={comparison.includes(profile.id)} onChange={() => toggleCompare(profile.id)} aria-label={`${profile.name} vergleichen`} />Im Rassenvergleich zeigen</label>
            <a href={profile.source.url} target="_blank" rel="noopener noreferrer">{profile.source.title}</a>
          </div>
        </details>
      </article>)}</div>
    </section>
    {compared.length > 0 && <section className={styles.panel} id="dog-comparison" aria-labelledby="dog-comparison-title"><h2 id="dog-comparison-title">Dein Rassenvergleich</h2><div className={styles.comparisonGrid}>{compared.map(profile => <article key={profile.id} className={styles.comparison}><h3>{profile.name}</h3><p><strong>Schwerpunkte:</strong> {profile.tasks.map(taskName).join(", ")}</p><ProfileFacts profile={profile} /><label className={styles.compareChoice}><input type="checkbox" checked onChange={() => toggleCompare(profile.id)} />Im Vergleich</label></article>)}</div><button type="button" className={styles.textAction} onClick={() => { comparisonRef.current = []; setComparison([]); setMessage("Der Vergleich wurde geleert."); }}>Vergleich leeren</button></section>}
    <details className={styles.optionalPanel} id="dog-plan"><summary>Passt ein Jagdhund in deinen Alltag?</summary><div className={styles.optionalBody}><p>Arbeitsmöglichkeiten, Ausbildungsbegleitung und tägliche Betreuung gemeinsam planen.</p>
      <div className={styles.planGrid}><fieldset><legend>Passende Arbeitsmöglichkeiten</legend>{[["ready", "Konkrete Möglichkeiten sind geklärt"], ["planned", "Ich plane sie noch"], ["none", "Bisher keine passende Möglichkeit"]].map(([value, title]) => <label key={value}><input type="radio" name="dog-access" value={value} checked={plan.access === value} onChange={() => setPlanValue("access", value)} />{title}</label>)}</fieldset>
        <fieldset><legend>Fachliche Ausbildungsbegleitung</legend>{[["ready", "Eine passende Begleitung ist vorhanden"], ["planned", "Ich organisiere sie noch"], ["none", "Noch keine Begleitung"]].map(([value, title]) => <label key={value}><input type="radio" name="dog-guidance" value={value} checked={plan.guidance === value} onChange={() => setPlanValue("guidance", value)} />{title}</label>)}</fieldset>
        <fieldset><legend>Betreuung an jedem Tag</legend>{[["ready", "Bewegung, Kontakt, Pflege und Ruhe sind organisiert"], ["open", "Zeit oder Zuständigkeiten sind noch offen"]].map(([value, title]) => <label key={value}><input type="radio" name="dog-everyday" value={value} checked={plan.everyday === value} onChange={() => setPlanValue("everyday", value)} />{title}</label>)}</fieldset></div>
      {showPlan && <div className={styles.feedback} role="status"><h3>{completePlan ? "Diese Punkte gehören in dein Gespräch" : "Ergänze die offenen Fragen"}</h3>{!completePlan && <p>Wähle in jeder Gruppe eine Antwort.</p>}{advice.length > 0 && <ul>{advice.map(item => <li key={item}>{item}</li>)}</ul>}<Link href="/kurse/wissen-vertiefung-hundeteam-belastung">Bedürfnisse und Belastung vertiefen</Link></div>}
    </div></details>
    <details className={styles.optionalPanel}><summary>Dein Rassenwissen prüfen</summary><KnowledgeCheck /></details>
    <p className={styles.moreLink}><Link href="/lernen/hundewesen">Alle Lerneinheiten zum Hundewesen<AppIcon name="arrow-right" size={18} /></Link></p>
    <details className={styles.optionalPanel}><summary>Quellen & Einordnung</summary><div className={styles.optionalBody}><p>Die Auswahl umfasst Rassen mit unterschiedlichen jagdlichen Arbeitsweisen in DACH und weiteren Ländern. Sie ist kein vollständiges weltweites Rassenverzeichnis. Jeder Eintrag verlinkt den offiziellen FCI-Standard. Der einzelne Hund, seine Ausbildung und die örtlichen Voraussetzungen entscheiden über die praktische Eignung.</p><ul className={styles.sources}>{dogCompassSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul><p className={styles.muted}>Erweiterung geprüft am 12. Oktober 2026. Fotos sind echte Aufnahmen mit Bildnachweis; Rassen ohne verifiziertes Foto werden ohne Ersatzfoto dargestellt.</p></div></details>
  </LearningToolLayout>;
}
