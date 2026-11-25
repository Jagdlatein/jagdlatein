import { useState } from "react";
import Image from "next/image";
import { getParasiteTopic, parasiteSources, parasiteTopics } from "../lib/parasite-learning";
import { getParasiteChoiceSources, parasiteChoiceCheckedOn } from "../lib/parasite-choice-sources";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/ParasiteLearning.module.css";

function SourceLinks({ ids }) {
  return <span className={styles.sourceLinks}>{[...new Set(ids)].map(id => <a key={id} href={parasiteSources[id].url} target="_blank" rel="noopener noreferrer">{parasiteSources[id].organization}</a>)}</span>;
}
function Content({ topic }) {
  const [answers, setAnswers] = useState({});
  const sourceIds = [...new Set([...topic.facts.flatMap(item => item.sourceIds), ...topic.cycle.sourceIds])];
  const reviewed = new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${topic.reviewedOn}T00:00:00Z`));
  const choicesReviewed = new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${parasiteChoiceCheckedOn}T00:00:00Z`));
  return <article className={shared.panel} id="wildbret-parasiten" aria-labelledby="parasiten-title">
    <p className={shared.eyebrow}>{topic.scientificName}</p><h2 id="parasiten-title">{topic.title}</h2><p>{topic.summary}</p>
    <figure className={styles.figure}><Image src={topic.photo.src} alt={topic.photo.alt} width={topic.photo.width} height={topic.photo.height} sizes="(max-width: 620px) 92vw, 980px" className={styles.photo} />
      <figcaption>{topic.photoContext}<span className={styles.credit}>Foto: {topic.photo.author} · <a href={topic.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original und Motiv</a> · <a href={topic.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{topic.photo.license}</a><span>{topic.photo.modifications}</span></span></figcaption>
    </figure>
    <section className={styles.cycle} aria-labelledby="parasiten-cycle"><h3 id="parasiten-cycle">{topic.cycle.title}</h3><ol className={styles.steps}>{topic.cycle.steps.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ol>{topic.cycle.branch && <p className={styles.branch}><strong>{topic.cycle.branch.title}</strong><span>{topic.cycle.branch.text}</span></p>}<p className={styles.caption}>Eigene vereinfachte Lernskizze. Die Stationen erklären Wirtsrollen und Übertragungswege; Pfeile zeigen keine Häufigkeit, Geschwindigkeit oder sicheren Befall.</p></section>
    <div className={styles.facts}>{topic.facts.map(item => <section key={item.id}><h3>{item.title}</h3><p>{item.text}</p></section>)}</div>
    <p className={styles.boundary}>{topic.limit}</p>
    <h3>Den Übertragungsweg prüfen</h3><p className={shared.muted}>Eigene Lernfragen zum biologischen Zusammenhang.</p>
    {topic.questions.map(question => <fieldset key={question.id} className={styles.question}><legend>{question.prompt}</legend>{question.choices.map((choice, index) => <label key={choice}><input type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => setAnswers(current => ({ ...current, [question.id]: index }))} />{choice}</label>)}{answers[question.id] !== undefined && <div className={styles.feedback} role="status"><strong>{answers[question.id] === question.answer ? "Das passt." : `Passend ist: ${question.choices[question.answer]}`}</strong><p>{question.explanation}</p></div>}</fieldset>)}
    <details className={shared.sources}><summary>Fachquellen und Prüfstand</summary>
      <p>Fachtexte und Kreislauf wurden am {reviewed} inhaltlich abgeglichen. Sie erklären ausgewählte Kreisläufe; sie prüfen keinen Wildkörper und stellen keine individuelle Diagnose. Rechtliche Freigabeverfahren werden nicht pauschal auf DACH übertragen.</p>
      <h4>Erklärungen und Kreislauf</h4><ul>{topic.facts.map(item => <li key={item.id}><strong>{item.title}</strong><SourceLinks ids={item.sourceIds} /></li>)}<li><strong>{topic.cycle.title}</strong><SourceLinks ids={topic.cycle.sourceIds} /></li></ul>
      <h4>Lernfragen</h4><ul>{topic.questions.map(question => <li key={question.id}><strong>{question.prompt}</strong><SourceLinks ids={topic.facts.filter(fact => question.factIds.includes(fact.id)).flatMap(fact => fact.sourceIds)} /></li>)}</ul>
      <h4>Ergänzte Antwortauswahl</h4><p>Die ergänzten Antwortvergleiche dieser Fragen wurden am {choicesReviewed} geprüft.</p><ul>{topic.questions.map(question => <li key={question.id}><strong>{question.prompt}</strong><ul>{getParasiteChoiceSources(question.id).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></li>)}</ul>
      <h4>Quellenumfang</h4><ul>{sourceIds.map(id => <li key={id}><a href={parasiteSources[id].url} target="_blank" rel="noopener noreferrer">{parasiteSources[id].title}</a><span className={styles.scope}>{parasiteSources[id].scope}</span></li>)}</ul>
    </details>
  </article>;
}
export default function ParasiteLearning({ selectedId, onSelect, hideSelector = false }) {
  const [selected, setSelected] = useState(parasiteTopics[0].id);
  const topic = getParasiteTopic(selectedId ?? selected);
  function choose(id) { if (!parasiteTopics.some(item => item.id === id)) return; setSelected(id); onSelect?.(id); }
  return <>{!hideSelector && <section className={`${shared.panel} ${styles.selector}`} aria-label="Parasitenkreislauf auswählen"><label className={shared.field}>Parasit<select value={topic.id} onChange={event => choose(event.target.value)}>{parasiteTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></section>}<Content key={topic.id} topic={topic} /></>;
}
