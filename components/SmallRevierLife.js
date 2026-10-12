import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import { getRevierLifeTopic, revierLifeGroups, revierLifeSources, revierLifeTopics } from "../lib/small-revier-life";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/RevierKnowledge.module.css";

function SourceLinks({ ids }) {
  return <span className={styles.inlineSources}>{[...new Set(ids)].map(id => <a href={revierLifeSources[id].url} key={id} target="_blank" rel="noopener noreferrer">{revierLifeSources[id].organization}</a>)}</span>;
}
function TopicContent({ topic }) {
  const [answer, setAnswer] = useState(null);
  const sources = [...new Set(topic.facts.flatMap(item => item.sourceIds))];
  return <article className={shared.panel} id="revierleben-inhalt" aria-labelledby="revierleben-title">
    <p className={shared.eyebrow}>{revierLifeGroups.find(group => group.id === topic.group).title}</p>
    <h2 id="revierleben-title">{topic.title}</h2><p>{topic.summary}</p>
    <figure className={styles.photoFigure}><Image src={topic.photo.src} alt={topic.photo.alt} width={topic.photo.width} height={topic.photo.height} sizes="(max-width: 620px) 92vw, 980px" className={styles.photo} />
      <figcaption>{topic.photoContext}<span className={styles.credit}>Foto: {topic.photo.author} · <a href={topic.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original</a> · <a href={topic.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{topic.photo.license}</a> · Originalaufnahme bzw. proportionale Vorschau; kein generativer Bildinhalt.</span></figcaption>
    </figure>
    <div className={styles.factGrid}>{topic.facts.map(item => <section key={item.id}><h3>{item.title}</h3><p>{item.text}</p><SourceLinks ids={item.sourceIds} /></section>)}</div>
    <section className={styles.connections} aria-labelledby="revierleben-connections"><h3 id="revierleben-connections">So hängt es zusammen</h3><p className={shared.muted}>Vereinfachte fachliche Beziehungen, keine berechneten Tierzahlen oder Vorhersagen.</p><ul>{topic.connections.map(item => <li key={item.label}><strong>{item.label}</strong><span>{item.text}</span></li>)}</ul></section>
    <div className={styles.factGrid}><section><h3>Draußen beobachten</h3><p>{topic.observe}</p></section><section><h3>Was offenbleibt</h3><p>{topic.limit}</p></section></div>
    <fieldset className={styles.question}><legend>{topic.quiz.prompt}</legend><p className={shared.muted}>Eigene Lernfrage. Eine Antwort wählen; die Erklärung erscheint sofort.</p>{topic.quiz.choices.map((choice, index) => <label key={choice}><input type="radio" name={`revierleben-${topic.id}`} value={index} checked={answer === index} onChange={() => setAnswer(index)} />{choice}</label>)}{answer !== null && <div className={styles.feedback} role="status"><strong>{answer === topic.quiz.answer ? "Das passt." : "Hier lohnt sich ein genauerer Blick."}</strong><p>{topic.quiz.explanation}</p>{answer !== topic.quiz.answer && <p><strong>Passend ist:</strong> {topic.quiz.choices[topic.quiz.answer]}</p>}</div>}</fieldset>
    <details className={shared.sources}><summary>Fachquellen und Prüfstand</summary><p>Eigene Kurzfassungen; fachlich abgeglichen am 12. Oktober 2026. Quellen von verschiedenen Organisationen werden je Aussage verknüpft. Bildquelle und Fachquelle erfüllen unterschiedliche Aufgaben.</p><ul>{sources.map(id => <li key={id}><a href={revierLifeSources[id].url} target="_blank" rel="noopener noreferrer">{revierLifeSources[id].organization}: {revierLifeSources[id].title}</a></li>)}</ul></details>
  </article>;
}
export default function SmallRevierLife() {
  const router = useRouter();
  const [selected, setSelected] = useState(revierLifeTopics[0].id);
  useEffect(() => { if (router.isReady) setSelected(getRevierLifeTopic(typeof router.query.thema === "string" ? router.query.thema : "").id); }, [router.isReady, router.query.thema]);
  const topic = getRevierLifeTopic(selected);
  function select(id) {
    if (!revierLifeTopics.some(item => item.id === id)) return;
    setSelected(id);
    if (router.isReady) router.replace({ pathname: router.pathname, query: { ...router.query, thema: id } }, undefined, { shallow: true, scroll: false }).catch(() => {});
  }
  return <LearningToolLayout title="Das kleine Leben im Revier" description="Insekten, Pilze und Bodenlebewesen mit echten Fotos entdecken und ihre ökologischen Beziehungen verstehen." category="natur-revier" icon="nature" compact>
    <section className={`${shared.panel} ${styles.selector}`} aria-label="Thema auswählen"><label className={shared.field}>Lebewesen oder Zusammenhang<select value={topic.id} onChange={event => select(event.target.value)}>{revierLifeGroups.map(group => <optgroup key={group.id} label={group.title}>{revierLifeTopics.filter(item => item.group === group.id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup>)}</select></label></section>
    <TopicContent key={topic.id} topic={topic} />
  </LearningToolLayout>;
}
