import { useEffect, useRef, useState } from "react";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import NatureQuestionRound from "./NatureQuestionRound";
import { habitatFeatures, habitatSpecies, habitatPresets, habitatSources, habitatQuestions, evaluateHabitat } from "../lib/habitat-workshop";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";
import workshop from "../styles/HabitatWorkshop.module.css";

const initialFeature = habitatPresets[1].ids[0];
const readingPrefix = "#habitat-lesen?";
export function resolveHabitatReading(hash) {
  const fallback = { feature: initialFeature, focus: "alle" };
  if (typeof hash !== "string" || hash.length > 300 || !hash.startsWith(readingPrefix)) return fallback;
  const params = new URLSearchParams(hash.slice(readingPrefix.length));
  const feature = params.getAll("baustein"), focus = params.getAll("art");
  return {
    feature: feature.length === 1 && habitatFeatures.some(item => item.id === feature[0]) ? feature[0] : fallback.feature,
    focus: focus.length === 1 && (focus[0] === "alle" || habitatSpecies.some(item => item.id === focus[0])) ? focus[0] : fallback.focus,
  };
}
export function habitatReadingHash(feature, focus) {
  const params = new URLSearchParams({ baustein: feature, art: focus });
  return `${readingPrefix}${params.toString()}`;
}

export function resolveHabitatView(hash) {
  const reading = resolveHabitatReading(hash);
  const params = typeof hash === "string" && hash.length <= 300 && hash.startsWith(readingPrefix)
    ? new URLSearchParams(hash.slice(readingPrefix.length)) : new URLSearchParams();
  const modes = params.getAll("ansicht"), topics = params.getAll("wissen");
  const mode = modes.length === 1 && ["lesen", "gestalten", "quiz"].includes(modes[0]) ? modes[0] : "lesen";
  const requestedTopic = topics.length === 1 && ["baustein", "art"].includes(topics[0]) ? topics[0] : null;
  return { ...reading, mode, topic: reading.focus !== "alle" && requestedTopic !== "baustein" ? "art" : "baustein" };
}

export function habitatViewHash(view) {
  const params = new URLSearchParams({ baustein: view.feature, art: view.focus, ansicht: view.mode, wissen: view.topic });
  return `${readingPrefix}${params.toString()}`;
}

function HabitatMap({ selected }) {
  const has = id => selected.includes(id);
  return <figure className={styles.figure}><svg className={nature.landscape} viewBox="0 0 640 300" role="img" aria-label={`Schematische Landschaft. Gewählte Bausteine: ${habitatFeatures.filter(feature => has(feature.id)).map(feature => feature.name).join(", ") || "keine"}.`}>
    <rect x="0" y="0" width="640" height="300" rx="18" fill="#faf4e4" /><path d="M0 150Q140 85 290 150T640 120V300H0Z" fill="#e5dfc9" />
    {has("offen") && <g><path d="M345 148H625V271H345Z" fill="#e5c86b" /><path d="M355 180h260m-260 30h260m-260 30h260" stroke="#baa050" strokeWidth="4"/><text x="405" y="260">Offene Feldzone</text></g>}
    {has("wiese") && <g><path d="M15 192Q150 155 285 200V280H15Z" fill="#adc092" />{[35,65,95,135,175,215,245].map((x,i) => <g key={x}><path d={`M${x} 250v-24`} stroke="#637957"/><circle cx={x} cy={226} r="5" fill={i%2 ? "#d1aa46" : "#eee4bc"}/></g>)}<text x="50" y="278">Artenreiche Wiese</text></g>}
    {has("wasser") && <g><ellipse cx="305" cy="223" rx="65" ry="29" fill="#9abdc2"/><path d="M249 218q55-20 112 0" fill="none" stroke="#e6f3f0" strokeWidth="3"/><text x="277" y="227">Gewässer</text></g>}
    {has("wald") && <g>{[40,88,136,190].map((x,i) => <g key={x}><path d={`M${x} 159v-48`} stroke="#826341" strokeWidth="10"/><circle cx={x} cy={91+i%2*9} r="33" fill={i%2?"#7d9164":"#617b55"}/></g>)}<text x="49" y="165">Wald</text></g>}
    {has("hecke") && <g><path d="M380 133h188" stroke="#7d9164" strokeWidth="25" strokeLinecap="round"/><path d="M374 151h204" stroke="#bbbe88" strokeWidth="11"/><text x="420" y="119">Hecke mit Saum</text></g>}
    {has("brache") && <g><path d="M352 280h261" stroke="#a59d72" strokeWidth="16"/><text x="420" y="295">Brache / Altgras</text></g>}
    {has("altholz") && <g><path d="m220 100 2 56m0-33-15-15m15 4 14-14" stroke="#7c6045" strokeWidth="12"/><ellipse cx="222" cy="136" rx="4" ry="6" fill="#423727"/><text x="199" y="180">Altholz</text></g>}
    {has("verbund") && <g><path d="M35 174Q225 136 326 180T590 170" fill="none" stroke="#ab832c" strokeWidth="5" strokeDasharray="9 7"/><text x="261" y="160">Verbund</text></g>}
  </svg><figcaption>Eigene schematische Zeichnung. Bausteine können in verschiedenen Teilflächen liegen; Größe und Anordnung sind hier nicht maßstabsgerecht.</figcaption></figure>;
}

export default function HabitatWorkshop() {
  const [selected, setSelected] = useState(habitatPresets[1].ids);
  const [preset, setPreset] = useState(habitatPresets[1].id);
  const [view, setView] = useState(() => resolveHabitatView(""));
  const reading = useRef(view);
  const committedView = useRef(view);
  const content = useRef(null);
  const pendingFocus = useRef(false);
  const restoredHash = useRef(null);
  const mounted = useRef(false);
  reading.current = view;
  committedView.current = view;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(view);
  const feature = habitatFeatures.find(item => item.id === view.feature);
  const results = evaluateHabitat(selected);
  const targetSpecies = results.find(species => species.id === view.focus);
  const activeSource = view.topic === "art" && targetSpecies ? targetSpecies.source : feature.source;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    function restore(event) {
      const hash = window.location.hash;
      if (restoredHash.current === hash && event?.type !== "pageshow") return;
      restoredHash.current = hash;
      const next = resolveHabitatView(hash);
      reading.current = next;
      committedView.current = next;
      // The legacy fragment includes parameters, so it has no matching DOM id.
      // Focus the rendered content after React has restored this selection.
      pendingFocus.current = typeof hash === "string" && hash.startsWith(readingPrefix);
      setView(next);
    }
    restore();
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  useEffect(() => {
    if (!pendingFocus.current || reading.current !== view || !content.current) return;
    const modelChange = pendingFocus.current === "model";
    pendingFocus.current = false;
    closePageMenu();
    focusSelection(content.current, { anchor: modelChange });
  }, [view]);

  function chooseView(change, modelChange = false) {
    if (!mounted.current || committedView.current !== view) return;
    const requested = { ...reading.current, ...change };
    if (!habitatFeatures.some(item => item.id === requested.feature) ||
      !(requested.focus === "alle" || habitatSpecies.some(item => item.id === requested.focus)) ||
      !["lesen", "gestalten", "quiz"].includes(requested.mode) ||
      !["baustein", "art"].includes(requested.topic) || requested.topic === "art" && requested.focus === "alle") return;
    cancelSelectionFocus();
    reading.current = requested;
    pendingFocus.current = modelChange ? "model" : true;
    closePageMenu();
    setView(requested);
    // Native fragments add ordinary Back/Forward entries. Model edits stay local.
    if (typeof window !== "undefined") {
      const hash = habitatViewHash(requested);
      restoredHash.current = hash;
      if (window.location.hash !== hash) window.location.hash = hash;
    }
  }
  function chooseTopic(value) {
    const [topic, id, extra] = String(value).split(":");
    if (extra || !id) return;
    if (topic === "baustein") chooseView({ feature: id, topic, mode: "lesen" });
    if (topic === "art") chooseView({ focus: id, topic, mode: "lesen" });
  }
  function toggle(id) {
    if (!mounted.current || committedView.current !== view || !habitatFeatures.some(item => item.id === id)) return;
    setPreset("custom");
    setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  }
  function loadPreset(id) {
    const next = habitatPresets.find(item => item.id === id);
    if (!mounted.current || committedView.current !== view || !next) return;
    setPreset(id); setSelected([...next.ids]);
    chooseView({ mode: "gestalten" }, true);
  }
  const topicValue = view.topic === "art" ? `art:${view.focus}` : `baustein:${view.feature}`;
  const readingSource = <details className={styles.sources}><summary>Ergänzende Fachquelle</summary><a href={habitatSources[activeSource].url} target="_blank" rel="noreferrer">{habitatSources[activeSource].title}</a></details>;
  return <LearningToolLayout title="Lebensraum-Werkstatt" description="Gestalte eine Lernlandschaft und entdecke, wie Nahrung, Deckung, Brutplätze und Verbindungen zusammenwirken." icon="leaf" category="natur-revier" headingOnly>
    <PageMenu title="Lebensraum – Thema wählen">
      <MenuChoice label="Lernangebot" value={view.mode} onChange={event => chooseView({ mode: event.target.value })} aria-controls="habitat-content"><option value="lesen">Wissen lesen</option><option value="gestalten">Landschaft gestalten</option><option value="quiz">Zusammenhänge prüfen</option></MenuChoice>
      <MenuChoice label="Wissen auswählen" value={topicValue} onChange={event => chooseTopic(event.target.value)} aria-controls={view.mode !== "lesen" ? "habitat-content" : view.topic === "art" ? "habitat-species-reading" : "habitat-feature-reading"}><optgroup label="Lebensraum-Bausteine">{habitatFeatures.map(item => <option key={item.id} value={`baustein:${item.id}`}>{item.name}</option>)}</optgroup><optgroup label="Tierarten">{habitatSpecies.map(species => <option key={species.id} value={`art:${species.id}`}>{species.name}</option>)}</optgroup></MenuChoice>
      {view.mode === "gestalten" && <MenuChoice label="Lernlandschaft laden" value={preset} onChange={event => loadPreset(event.target.value)}>{preset === "custom" && <option value="custom">Eigene Zusammenstellung</option>}{habitatPresets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</MenuChoice>}
    </PageMenu>
    <div id="habitat-content">
      {view.mode === "quiz" ? <section id="habitat-quiz-reading" ref={content} tabIndex={-1} aria-label="Zusammenhänge prüfen" className={workshop.focusTarget}><NatureQuestionRound entries={habitatQuestions} sources={habitatSources} label="Lebensraumfälle" /></section> : view.mode === "gestalten" ? <>
        <section className={`${styles.panel} ${workshop.focusTarget}`} id="habitat-landscape" ref={content} tabIndex={-1} aria-labelledby="habitat-landscape-heading"><h2 id="habitat-landscape-heading">Welche Funktionen bietet deine Landschaft?</h2><p className={styles.note}>Dieses qualitative Lernmodell zeigt Zusammenhänge. Die Anzeige zählt angebotene Funktionen und berechnet weder Tierzahlen noch eine Ansiedlungswahrscheinlichkeit.</p>
          <HabitatMap selected={selected}/>
          <fieldset className={workshop.featureChoices}><legend>Bausteine deiner Lernlandschaft</legend><div>{habitatFeatures.map(item => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)}/><AppIcon name={item.icon} size={22}/><span><strong>{item.name}</strong><small>{item.function}</small></span></label>)}</div></fieldset>
          <h3>Was passt zu welcher Art?</h3><p>„Baustein vorhanden“ bedeutet nur, dass eine passende Funktion ausgewählt ist. Ob ihre Qualität vor Ort reicht, bleibt offen.</p>
          <ul className={workshop.speciesOverview}>{results.map(species => <li key={species.id}><a href={habitatViewHash({ ...view, mode: "lesen", topic: "art", focus: species.id })}><strong>{species.name}</strong><span>{species.resources.filter(resource => resource.covered).length} von {species.resources.length} Funktionen im Modell vorhanden</span><AppIcon name="arrow-right" size={18}/></a></li>)}</ul>
        </section>
        <section className={styles.panel}><h2>Von der Lernlandschaft zur Beobachtung</h2><ol><li>Vorhandene Arten und Strukturen dokumentieren, ohne Brut- oder Ruheplätze zu stören.</li><li>Eine Zielart und ihre Bedürfnisse fachlich abgleichen; passende Maßnahmen unterscheiden sich zwischen Arten.</li><li>Eigentum, Schutzvorgaben und zuständige Fachstellen klären, bevor du draußen etwas veränderst.</li><li>Wirkung über wiederholte Beobachtungen prüfen. Die Auswahl in dieser Werkstatt ist kein Feldnachweis.</li></ol></section>
      </> : view.topic === "art" && targetSpecies ? <>
        <article id="habitat-species-reading" ref={content} tabIndex={-1} className={`${styles.panel} ${workshop.focusTarget}`} aria-labelledby="habitat-species-heading"><h2 id="habitat-species-heading"><AppIcon name={targetSpecies.icon} size={24}/>{targetSpecies.name}</h2><p>{targetSpecies.text}</p><h3>Funktionen im gewählten Landschaftsmodell</h3><p className={styles.note}>Die folgende Auswahl zeigt angebotene Modellfunktionen. Ob ihre Qualität vor Ort reicht, bleibt offen; sie ist kein Feldnachweis und keine Ansiedlungsprognose.</p><ul>{targetSpecies.resources.map(resource => <li key={resource.label}><strong>{resource.label}:</strong> {resource.covered ? `Baustein vorhanden (${resource.present.map(id => habitatFeatures.find(item => item.id === id).name).join(" oder ")})` : `Im Modell noch offen (${resource.ids.map(id => habitatFeatures.find(item => item.id === id).name).join(" oder ")})`}</li>)}</ul></article>
        {readingSource}
      </> : <>
        <article id="habitat-feature-reading" ref={content} tabIndex={-1} className={`${styles.panel} ${workshop.focusTarget}`} aria-labelledby="habitat-feature-heading"><h2 id="habitat-feature-heading">{feature.name}</h2><p><strong>{feature.function}</strong></p><p>{feature.text}</p></article>
        {readingSource}
      </>}
    </div>
  </LearningToolLayout>;
}
