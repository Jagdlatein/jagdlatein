import { useEffect, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import NatureQuestionRound from "./NatureQuestionRound";
import { NaturePhoto } from "./NatureMedia";
import { plantAtlasEntries, plantAtlasQuestions, plantSeasons, plantGroups, filterPlants } from "../lib/plant-atlas";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";

export default function PlantAtlas() {
  const [mode, setMode] = useState("atlas");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("alle");
  const [selected, setSelected] = useState(plantAtlasEntries[0].id);
  const [season, setSeason] = useState("sommer");
  useEffect(() => { if (typeof window === "undefined") return; const id = new URLSearchParams(window.location.search).get("eintrag"); if (plantAtlasEntries.some(entry => entry.id === id)) setSelected(id); }, []);
  const results = filterPlants(query, group);
  const entry = plantAtlasEntries.find(item => item.id === selected);
  return <LearningToolLayout title="Pflanzenatlas im Jahreslauf" description="Lerne zwölf heimische Bäume und Sträucher kennen. Vergleiche Merkmale, Jahreszeiten und ähnliche Arten mit echten Originalfotos." icon="tree" category="wald-pflanzen" stats={[{value:12,label:"Pflanzenarten"},{value:4,label:"Jahreszeiten"},{value:12,label:"Lernfragen"}]}>
    <div className={styles.modeButtons} role="group" aria-label="Lernweise"><button type="button" aria-pressed={mode === "atlas"} onClick={() => setMode("atlas")}>Pflanzen nachschlagen</button><button type="button" aria-pressed={mode === "quiz"} onClick={() => setMode("quiz")}>Merkmale prüfen</button></div>
    <p className={styles.note}>Mehrere Merkmale zusammen betrachten. Die Bilder zeigen ausgewählte Pflanzenteile und sind keine vollständige Bestimmungshilfe für jeden Fund. Der Atlas gibt keine Verzehr- oder Sammelfreigabe.</p>
    {mode === "quiz" ? <NatureQuestionRound entries={plantAtlasQuestions} label="Botanische Merkmale" renderMedia={(question, answered) => <NaturePhoto photo={plantAtlasEntries.find(item => item.id === question.plantId).photo} neutral={!answered}/>} /> : <>
      <section className={styles.panel}><h2>Pflanze finden</h2><div className={styles.toolbar}><label className={styles.field}>Name oder Merkmal suchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel: Nadel, Eiche, Fagus"/></label><label className={styles.field}>Pflanzengruppe<select value={group} onChange={event => setGroup(event.target.value)}>{plantGroups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><p className={styles.muted}>{results.length} Pflanzen gefunden</p><div className={nature.catalog}>{results.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} aria-controls="plant-detail" onClick={() => setSelected(item.id)}><strong>{item.name}</strong><small>{item.latin} · {item.group}</small><span>{item.features[0]}</span></button>)}</div>{results.length === 0 && <div className={styles.empty}>Keine Pflanze für diese Auswahl. Versuche einen anderen Namen oder ein einzelnes Merkmal.</div>}</section>
      <section className={styles.panel} id="plant-detail" aria-labelledby="plant-title"><h2 id="plant-title">{entry.name}</h2><p className={styles.muted}><i>{entry.latin}</i> · {entry.group}</p><NaturePhoto photo={entry.photo}/><div className={styles.grid}><div><h3>Merkmale gemeinsam prüfen</h3><ul>{entry.features.map(feature => <li key={feature}>{feature}</li>)}</ul><p><strong>Lebensraum:</strong> {entry.habitat}</p></div><div><h3>Ähnliches auseinanderhalten</h3><p>{entry.confusion}</p></div></div><h3>Im Jahreslauf</h3><div className={nature.seasonTabs} role="group" aria-label="Jahreszeit auswählen">{plantSeasons.map(item => <button type="button" key={item.id} aria-pressed={season === item.id} aria-controls="plant-season" onClick={() => setSeason(item.id)}>{item.name}</button>)}</div><div className={styles.feedback} id="plant-season" aria-live="polite"><strong>{plantSeasons.find(item => item.id === season).name}</strong><p>{entry.seasons[season]}</p></div><p className={styles.muted}>Blütezeiten sind ungefähre Orientierung. Witterung, Höhenlage und Standort verschieben die Entwicklung.</p><details className={styles.sources}><summary>Botanische Quelle</summary><a href={entry.source.url} target="_blank" rel="noreferrer">{entry.source.title}: {entry.name}</a><p>Eigene Kurzfassung, botanische Angaben geprüft am 4. Oktober 2026.</p></details><div className={styles.actions}><Link className={styles.secondary} href="/lernen/wald-pflanzen">Wald- und Pflanzenkurse öffnen</Link><button type="button" className={styles.primary} onClick={() => setMode("quiz")}>Merkmale im Quiz üben</button></div></section>
    </>}
  </LearningToolLayout>;
}
