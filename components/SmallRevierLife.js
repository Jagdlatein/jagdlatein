import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import FoodwebLearning from "./FoodwebLearning";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { foodwebTopic, foodwebNodes } from "../lib/foodweb-learning";
import { getRevierLifeTopic, revierLifeGroups, revierLifeSources, revierLifeTopics } from "../lib/small-revier-life";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/RevierKnowledge.module.css";

function SourceLinks({ ids }) {
  return <span className={styles.inlineSources}>{[...new Set(ids)].map(id => <a href={revierLifeSources[id].url} key={id} target="_blank" rel="noopener noreferrer">{revierLifeSources[id].organization}</a>)}</span>;
}
function TopicContent({ topic }) {
  const [answer, setAnswer] = useState(null);
  const sources = [...new Set(topic.facts.flatMap(item => item.sourceIds))];
  const reviewedOn = new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${topic.reviewedOn}T00:00:00Z`));
  return <article className={shared.panel} id="revierleben-inhalt" aria-labelledby="revierleben-title">
    <p className={shared.eyebrow}>{revierLifeGroups.find(group => group.id === topic.group).title}</p>
    <h2 id="revierleben-title">{topic.title}</h2><p>{topic.summary}</p>
    <figure className={styles.photoFigure}><Image src={topic.photo.src} alt={topic.photo.alt} width={topic.photo.width} height={topic.photo.height} sizes="(max-width: 620px) 92vw, 980px" className={styles.photo} />
      <figcaption>{topic.photoContext}</figcaption>
    </figure>
    <div className={styles.factGrid}>{topic.facts.map(item => <section key={item.id}><h3>{item.title}</h3><p>{item.text}</p></section>)}</div>
    <section className={styles.connections} aria-labelledby="revierleben-connections"><h3 id="revierleben-connections">So hängt es zusammen</h3><p className={shared.muted}>Vereinfachte fachliche Beziehungen, keine berechneten Tierzahlen oder Vorhersagen.</p><ul>{topic.connections.map(item => <li key={item.label}><strong>{item.label}</strong><span>{item.text}</span></li>)}</ul></section>
    <div className={styles.factGrid}><section><h3>Draußen beobachten</h3><p>{topic.observe}</p></section><section><h3>Was offenbleibt</h3><p>{topic.limit}</p></section></div>
    <fieldset className={styles.question}><legend>{topic.quiz.prompt}</legend><p className={shared.muted}>Eigene Lernfrage. Eine Antwort wählen; die Erklärung erscheint sofort.</p>{topic.quiz.choices.map((choice, index) => <label key={choice}><input type="radio" name={`revierleben-${topic.id}`} value={index} checked={answer === index} onChange={() => setAnswer(index)} />{choice}</label>)}{answer !== null && <div className={styles.feedback} role="status"><strong>{answer === topic.quiz.answer ? "Das passt." : "Hier lohnt sich ein genauerer Blick."}</strong><p>{topic.quiz.explanation}</p>{answer !== topic.quiz.answer && <p><strong>Passend ist:</strong> {topic.quiz.choices[topic.quiz.answer]}</p>}</div>}</fieldset>
    <details className={shared.sources}><summary>Fotos, Fachquellen und Prüfstand</summary><p>Eigene Kurzfassungen; fachlich abgeglichen am {reviewedOn}. Quellen von verschiedenen Organisationen werden je Aussage verknüpft. Bildquelle und Fachquelle erfüllen unterschiedliche Aufgaben.</p>
      <h3>Nachweise zu den Aussagen</h3><ul>{topic.facts.map(item => <li key={item.id} data-source-for={item.id}><strong>{item.title}</strong><SourceLinks ids={item.sourceIds} /></li>)}</ul>
      <h3>Fachquellen</h3><ul>{sources.map(id => <li key={id}><a href={revierLifeSources[id].url} target="_blank" rel="noopener noreferrer">{revierLifeSources[id].organization}: {revierLifeSources[id].title}</a></li>)}</ul>
      <h3>Bildnachweis</h3><p className={styles.credit}>Foto: {topic.photo.author} · <a href={topic.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original</a> · <a href={topic.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{topic.photo.license}</a> · Originalaufnahme bzw. proportionale Vorschau; kein generativer Bildinhalt.</p>
    </details>
  </article>;
}
export default function SmallRevierLife() {
  const router = useRouter();
  const [navigationError, setNavigationError] = useState("");
  const content = useRef(null);
  const mounted = useRef(false);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const selectionFocus = useRef(null);
  const lastFoodwebNode = useRef("regenwurm");
  const ready = router.isReady === true;
  const selected = ready && typeof router.query.thema === "string" && (router.query.thema === foodwebTopic.id || revierLifeTopics.some(item => item.id === router.query.thema)) ? router.query.thema : null;
  const foodwebNode = selected === foodwebTopic.id ? router.query.motiv === undefined ? "regenwurm" : foodwebNodes.find(item => typeof router.query.motiv === "string" && item.id === router.query.motiv)?.id || null : null;
  if (foodwebNode) lastFoodwebNode.current = foodwebNode;
  const requestedSection = (router.asPath || "").split("#")[1];
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  if (selectionFocus.current && selectionFocus.current.origin !== origin && (selectionFocus.current.thema !== selected || selectionFocus.current.motiv !== foodwebNode)) selectionFocus.current = null;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const validView = Boolean(selected && (selected !== foodwebTopic.id || foodwebNode));
  const topic = selected && selected !== foodwebTopic.id ? getRevierLifeTopic(selected) : null;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pendingRequest.current = null; };
  }, []);
  function focusContent(relationships = requestedSection === "nahrungsnetz-beziehungen", category = false) {
    if (!category && !relationships && requestedSection && !["revierleben-inhalt", "revierleben-title", "nahrungsnetz", "nahrungsnetz-title"].includes(requestedSection)) {
      const target = Array.from(content.current?.querySelectorAll?.("[id]") || []).find(element => element.id === requestedSection);
      if (!target) return;
      target.setAttribute?.("tabindex", "-1");
      focusSelection(target, { anchor: true });
      return;
    }
    const target = content.current?.querySelector?.(relationships ? "#nahrungsnetz-beziehungen" : "h2") || content.current;
    target?.setAttribute?.("tabindex", "-1");
    focusSelection(target, { anchor: relationships });
  }
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!validView) {
      const timer = setTimeout(() => openPageMenu("revierleben-choices"), 0);
      return () => clearTimeout(timer);
    }
    const requestedFocus = selectionFocus.current;
    selectionFocus.current = null;
    const relationships = requestedSection === "nahrungsnetz-beziehungen" || Boolean(requestedFocus?.relationships && requestedFocus.thema === selected && requestedFocus.motiv === foodwebNode);
    closePageMenu();
    focusContent(relationships);
  }, [ready, selected, foodwebNode, requestedSection]);
  async function navigate(query, sameSelection, relationships = false) {
    if (!ready || !mounted.current || committedView.current !== origin) return;
    cancelSelectionFocus();
    setNavigationError(""); closePageMenu();
    if (sameSelection && pendingRequest.current === null) { focusContent(relationships, true); return; }
    const request = ++navigation.current;
    pendingRequest.current = request;
    const focusIntent = { origin, thema: query.thema, motiv: query.motiv, relationships };
    selectionFocus.current = focusIntent;
    try {
      const accepted = await router.push({ pathname: "/lernen/kleines-revierleben", query, hash: "revierleben-inhalt" }, undefined, { shallow: true, scroll: false });
      if (accepted === false && selectionFocus.current === focusIntent) selectionFocus.current = null;
    } catch (error) {
      if (selectionFocus.current === focusIntent) selectionFocus.current = null;
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Das Thema konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("revierleben-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  function select(id) {
    if (id !== foodwebTopic.id && !revierLifeTopics.some(item => item.id === id)) return;
    const { motiv, ...query } = router.query;
    const nextNode = id === foodwebTopic.id ? lastFoodwebNode.current : null;
    return navigate({ ...query, thema: id, ...(nextNode ? { motiv: nextNode } : {}) }, selected === id && (id !== foodwebTopic.id || foodwebNode === nextNode));
  }
  function selectFoodwebNode(id, relationships = true) {
    if (selected !== foodwebTopic.id || !foodwebNodes.some(node => node.id === id)) return;
    return navigate({ ...router.query, thema: foodwebTopic.id, motiv: id }, foodwebNode === id, relationships);
  }
  return <LearningToolLayout title="Das kleine Leben im Revier" description="Kleine Tiere, Pilze und Bodenleben mit echten Fotos entdecken und ihre ökologischen Beziehungen verstehen." category="natur-revier" icon="nature" headingOnly>
    <PageMenu title="Kleines Revierleben – Thema wählen" openInitially={ready && !validView} initialFocusId="revierleben-choices"><div id="revierleben-choices" tabIndex={-1}><MenuChoice label="Thema" id="revierleben-thema" value={selected || ""} disabled={!ready} onChange={event => select(event.target.value)}><option value="" disabled>Thema wählen</option>{revierLifeGroups.map(group => <optgroup key={group.id} label={group.title}>{revierLifeTopics.filter(item => item.group === group.id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup>)}<optgroup label="Zusammenhänge"><option value={foodwebTopic.id}>{foodwebTopic.title}</option></optgroup></MenuChoice>{selected === foodwebTopic.id && <MenuChoice label="Motiv" id="revierleben-motiv" value={foodwebNode || ""} disabled={!ready} onChange={event => selectFoodwebNode(event.target.value, false)} aria-controls="nahrungsnetz-beziehungen"><option value="" disabled>Motiv wählen</option>{foodwebNodes.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}</MenuChoice>}{navigationError && <p className={shared.wrong} role="alert">{navigationError}</p>}</div></PageMenu>
    <div ref={content} tabIndex={-1}>{validView ? selected === foodwebTopic.id ? <FoodwebLearning selectedId={foodwebNode} onSelect={selectFoodwebNode} /> : <TopicContent key={topic.id} topic={topic} /> : <p className={shared.note}>{ready && (router.query.thema !== undefined || router.query.motiv !== undefined) ? "Dieses Thema oder Nahrungsnetzmotiv ist nicht verfügbar. " : ""}Wähle unten im Menü ein Thema. Hier erscheint nur sein Wissenstext.</p>}</div>
  </LearningToolLayout>;
}
