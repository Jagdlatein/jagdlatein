import { useState } from "react";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import NatureQuestionRound from "./NatureQuestionRound";
import { habitatFeatures, habitatSpecies, habitatPresets, habitatSources, habitatQuestions, evaluateHabitat } from "../lib/habitat-workshop";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";

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
  const [focus, setFocus] = useState("alle");
  const [mode, setMode] = useState("gestalten");
  const results = evaluateHabitat(selected).filter(species => focus === "alle" || species.id === focus);
  function toggle(id) { setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); }
  return <LearningToolLayout title="Lebensraum-Werkstatt" description="Gestalte eine Lernlandschaft und entdecke, wie Nahrung, Deckung, Brutplätze und Verbindungen zusammenwirken." icon="leaf" category="natur-revier" stats={[{value:8,label:"Bausteine"},{value:8,label:"Tierarten"},{value:3,label:"Wissensfälle"}]}>
    <div className={styles.modeButtons} role="group" aria-label="Lernweise"><button type="button" aria-pressed={mode === "gestalten"} onClick={() => setMode("gestalten")}>Landschaft gestalten</button><button type="button" aria-pressed={mode === "quiz"} onClick={() => setMode("quiz")}>Zusammenhänge prüfen</button></div>
    {mode === "quiz" ? <NatureQuestionRound entries={habitatQuestions} sources={habitatSources} label="Lebensraumfälle" /> : <>
      <section className={styles.panel}><h2>Welche Funktionen bietet deine Landschaft?</h2><p className={styles.note}>Dieses qualitative Lernmodell zeigt Zusammenhänge. Die Anzeige zählt angebotene Funktionen und berechnet weder Tierzahlen noch eine Ansiedlungswahrscheinlichkeit.</p>
        <div className={styles.toolbar}><label className={styles.field}>Lernlandschaft laden<select onChange={event => setSelected([...habitatPresets.find(item => item.id === event.target.value).ids])} defaultValue="feld">{habitatPresets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className={styles.field}>Tierart hervorheben<select value={focus} onChange={event => setFocus(event.target.value)}><option value="alle">Alle Tierarten</option>{habitatSpecies.map(species => <option key={species.id} value={species.id}>{species.name}</option>)}</select></label></div>
        <HabitatMap selected={selected}/>
        <div className={styles.grid}>{habitatFeatures.map(feature => <div key={feature.id} className={nature.feature}><label><input type="checkbox" checked={selected.includes(feature.id)} onChange={() => toggle(feature.id)}/><AppIcon name={feature.icon} size={24}/><strong>{feature.name}</strong></label><p><strong>{feature.function}</strong></p><p>{feature.text}</p><a href={habitatSources[feature.source].url} target="_blank" rel="noreferrer">Fachliche Grundlage</a></div>)}</div>
      </section>
      <section className={styles.panel} aria-labelledby="habitat-results-heading"><h2 id="habitat-results-heading">Was passt zu welcher Art?</h2><p>„Baustein vorhanden“ bedeutet nur, dass eine passende Funktion ausgewählt ist. Ob ihre Qualität vor Ort reicht, bleibt offen.</p><div className={styles.grid} aria-live="polite">{results.map(species => <article key={species.id} className={nature.species}><h3><AppIcon name={species.icon} size={24}/>{species.name}</h3><p>{species.text}</p><ul>{species.resources.map(resource => <li key={resource.label}><strong>{resource.label}:</strong> {resource.covered ? `Baustein vorhanden (${resource.present.map(id => habitatFeatures.find(item => item.id === id).name).join(" oder ")})` : `Im Modell noch offen (${resource.ids.map(id => habitatFeatures.find(item => item.id === id).name).join(" oder ")})`}</li>)}</ul><a href={habitatSources[species.source].url} target="_blank" rel="noreferrer">Art und Lebensraum nachlesen</a></article>)}</div></section>
      <section className={styles.panel}><h2>Von der Lernlandschaft zur Beobachtung</h2><ol><li>Vorhandene Arten und Strukturen dokumentieren, ohne Brut- oder Ruheplätze zu stören.</li><li>Eine Zielart und ihre Bedürfnisse fachlich abgleichen; passende Maßnahmen unterscheiden sich zwischen Arten.</li><li>Eigentum, Schutzvorgaben und zuständige Fachstellen klären, bevor du draußen etwas veränderst.</li><li>Wirkung über wiederholte Beobachtungen prüfen. Die Auswahl in dieser Werkstatt ist kein Feldnachweis.</li></ol></section>
    </>}
  </LearningToolLayout>;
}
