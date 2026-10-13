import { useState } from "react";
import Image from "next/image";
import { foodwebContext, foodwebNodes, foodwebQuestion, foodwebRelationships, foodwebReviewedOn, foodwebSources, foodwebTopic, getFoodwebSelection } from "../lib/foodweb-learning";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/FoodwebLearning.module.css";
import knowledge from "../styles/RevierKnowledge.module.css";

function Sources({ ids }) { return <span className={styles.sources}>{ids.map(id => <a key={id} href={foodwebSources[id].url} target="_blank" rel="noopener noreferrer">{foodwebSources[id].organization}</a>)}</span>; }
export default function FoodwebLearning({ selectedId, onSelect } = {}) {
  const [localSelected, setLocalSelected] = useState("regenwurm");
  const [answer, setAnswer] = useState(null);
  const view = getFoodwebSelection(selectedId ?? localSelected);
  function select(id) { setLocalSelected(id); onSelect?.(id); }
  const sourceIds = [...new Set([...foodwebRelationships.flatMap(item => item.sourceIds), ...foodwebContext.sourceIds])];
  const reviewed = new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${foodwebReviewedOn}T00:00:00Z`));
  return <article className={shared.panel} id="revierleben-inhalt" aria-labelledby="nahrungsnetz-title">
    <p className={shared.eyebrow}>Zusammenhänge im Revier</p><h2 id="nahrungsnetz-title">{foodwebTopic.title}</h2>
    <p>Ein Motiv wählen. Die zugehörigen Nahrungspfeile und ihre Erklärung erscheinen direkt darunter.</p>
    <p className={shared.muted}>Der Pfeil zeigt von der Nahrung zu ihrem Nutzer. Fotos sind Beispiele aus verschiedenen Orten; sie zeigen kein gemeinsames Revier und keine Mengen.</p>
    <fieldset className={styles.network}><legend>Motiv im Nahrungsnetz</legend><div className={styles.diagram}>
      <svg viewBox="0 0 900 460" preserveAspectRatio="none" aria-hidden="true" focusable="false" className={styles.arrows}><defs><marker id="nahrungsnetz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" /></marker></defs>{foodwebRelationships.map(item => <path key={item.id} d={item.path} markerEnd="url(#nahrungsnetz-arrow)" className={view.relationships.some(relation => relation.id === item.id) ? styles.activeArrow : styles.quietArrow} />)}</svg>
      {foodwebNodes.map(node => <label key={node.id} className={`${styles.node} ${node.id === view.node.id ? styles.selected : ""} ${view.connectedIds.includes(node.id) ? styles.connected : ""}`} style={{ "--node-left": `${node.x / 9}%`, "--node-top": `${node.y / 4.6}%` }}>
        <input type="radio" name="nahrungsnetz-motiv" value={node.id} checked={node.id === view.node.id} onChange={() => select(node.id)} aria-controls="nahrungsnetz-beziehungen" />
        <Image src={node.photo.src} alt={node.photo.alt} width={node.photo.width} height={node.photo.height} sizes="(max-width: 580px) 40vw, 180px" className={styles.photo} />
        <span>{node.label}</span>
      </label>)}
    </div></fieldset>
    <section id="nahrungsnetz-beziehungen" className={styles.explanation} aria-live="polite" aria-atomic="true"><h3>{view.node.label}: die Verbindungen</h3><p>{view.node.description}</p>
      <div className={styles.relationships}>{view.relationships.map(item => <section key={item.id}><h4>{item.title}</h4><p>{item.text}</p><Sources ids={item.sourceIds} /></section>)}</div>
    </section>
    <section className={styles.context}><h3>Ein Ausschnitt, keine ganze Natur</h3><p>{foodwebContext.text}</p><Sources ids={foodwebContext.sourceIds} /><p className={shared.muted}>{foodwebContext.limit}</p></section>
    <fieldset className={knowledge.question}><legend>{foodwebQuestion.prompt}</legend>{foodwebQuestion.choices.map((choice, index) => <label key={choice}><input type="radio" name="nahrungsnetz-lernfrage" checked={answer === index} onChange={() => setAnswer(index)} />{choice}</label>)}{answer !== null && <div className={knowledge.feedback} role="status"><strong>{answer === foodwebQuestion.answer ? "Das passt." : "Hier lohnt sich ein genauerer Blick."}</strong><p>{foodwebQuestion.explanation}</p>{answer !== foodwebQuestion.answer && <p><strong>Passend ist:</strong> {foodwebQuestion.choices[foodwebQuestion.answer]}</p>}<Sources ids={foodwebQuestion.sourceIds} /></div>}</fieldset>
    <details className={shared.sources}><summary>Fotos, Fachquellen und Prüfstand</summary><p>Eigene Lernskizze; die hier verknüpften Nahrungsaussagen wurden am {reviewed} fachlich abgeglichen. Die Auswahl verändert nur die Hervorhebung und zeigt keine berechneten Naturfolgen.</p><ul>{sourceIds.map(id => <li key={id}><a href={foodwebSources[id].url} target="_blank" rel="noopener noreferrer">{foodwebSources[id].organization}: {foodwebSources[id].title}</a></li>)}</ul><h3>Echte Originalaufnahmen</h3><ul>{foodwebNodes.map(node => <li key={node.id}><strong>{node.label}</strong>: {node.photo.author} · <a href={node.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Originalquelle</a> · <a href={node.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{node.photo.license}</a>. {node.photo.modifications}</li>)}</ul></details>
  </article>;
}
