import { useState } from "react";
import Image from "next/image";
import { digestiveSources, digestiveTopics, getDigestiveTopic } from "../lib/digestive-learning";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/DigestiveLearning.module.css";

function SourceLinks({ ids }) {
  return <span className={styles.sourceLinks}>{[...new Set(ids)].map(id => <a key={id} href={digestiveSources[id].url} target="_blank" rel="noopener noreferrer">{digestiveSources[id].organization}</a>)}</span>;
}
function Content({ topic }) {
  const [answers, setAnswers] = useState({});
  const sourceIds = [...new Set([...topic.facts.flatMap(item => item.sourceIds), ...topic.pathway.sourceIds])];
  const reviewed = new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${topic.reviewedOn}T00:00:00Z`));
  return <article className={shared.panel} id="anatomie-verdauung" aria-labelledby="verdauung-title">
    <h2 id="verdauung-title">{topic.title}</h2><p>{topic.summary}</p>
    <figure className={styles.figure}><Image src={topic.photo.src} alt={topic.photo.alt} width={topic.photo.width} height={topic.photo.height} sizes="(max-width: 620px) 92vw, 980px" className={styles.photo} />
      <figcaption>{topic.photoContext}</figcaption>
    </figure>
    <div className={styles.facts}>{topic.facts.map(item => <section key={item.id}><h3>{item.title}</h3><p>{item.text}</p></section>)}</div>
    <section className={styles.pathway} aria-labelledby="verdauung-pathway"><h3 id="verdauung-pathway">{topic.pathway.title}</h3><ol className={styles.steps}>{topic.pathway.steps.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ol><p className={styles.caption}>{topic.pathway.note}</p></section>
    <div className={styles.facts}><section><h3>Im Bild betrachten</h3><p>{topic.observation}</p></section><section><h3>Grenzen der Ansicht</h3><p>{topic.limit}</p></section></div>
    <h3>Das Verständnis prüfen</h3><p className={shared.muted}>Eigene Lernfragen. Eine Antwort wählen; die Erklärung steht sofort darunter.</p>
    {topic.questions.map(question => <fieldset key={question.id} className={styles.question}><legend>{question.prompt}</legend>{question.choices.map((choice, index) => <label key={choice}><input type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => setAnswers(current => ({ ...current, [question.id]: index }))} />{choice}</label>)}{answers[question.id] !== undefined && <div className={styles.feedback} role="status"><strong>{answers[question.id] === question.answer ? "Das passt." : `Passend ist: ${question.choices[question.answer]}`}</strong><p>{question.explanation}</p></div>}</fieldset>)}
    <details className={shared.sources}><summary>Fachquellen und Prüfstand</summary><p>Diese Einheit wurde am {reviewed} inhaltlich abgeglichen. Bildnachweise belegen das fotografierte Motiv; Fachquellen erklären den Bauplan. Nutztier-Vergleichswerte werden nicht als Messwerte heimischer Wildtiere ausgegeben.</p>
      <h3>Belege zu den Wissensabschnitten</h3><ul>{topic.facts.map(item => <li key={item.id}><strong>{item.title}</strong><SourceLinks ids={item.sourceIds} /></li>)}</ul>
      <h3>Belege zur Lernskizze</h3><p>{topic.pathway.title}</p><SourceLinks ids={topic.pathway.sourceIds} />
      <h3>Belege zu den Lernfragen</h3><ul>{topic.questions.map(question => <li key={question.id}><strong>{question.prompt}</strong><SourceLinks ids={topic.facts.filter(item => question.factIds.includes(item.id)).flatMap(item => item.sourceIds)} /></li>)}</ul>
      <h3>Vollständige Fachquellen</h3><ul>{sourceIds.map(id => <li key={id}><a href={digestiveSources[id].url} target="_blank" rel="noopener noreferrer">{digestiveSources[id].title}</a><span className={styles.scope}>{digestiveSources[id].scope}</span></li>)}</ul>
      <h3>Foto, Urheber und Lizenz</h3><p className={styles.credit}>Foto: {topic.photo.author} · <a href={topic.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original und Motiv</a> · <a href={topic.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{topic.photo.license}</a><span>{topic.photo.modifications}</span></p>
    </details>
  </article>;
}
export default function DigestiveLearning({ selectedId, onSelect, hideSelector = false }) {
  const [selected, setSelected] = useState(digestiveTopics[0].id);
  const topic = getDigestiveTopic(selectedId ?? selected);
  function choose(id) { if (!digestiveTopics.some(item => item.id === id)) return; setSelected(id); onSelect?.(id); }
  return <>{!hideSelector && <section className={`${shared.panel} ${styles.selector}`} aria-label="Verdauungsthema auswählen"><label className={shared.field}>Bauplan<select value={topic.id} onChange={event => choose(event.target.value)}>{digestiveTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></section>}<Content key={topic.id} topic={topic} /></>;
}
