import { useEffect, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import NatureQuestionRound from "./NatureQuestionRound";
import { NaturePhoto, TrackSchema } from "./NatureMedia";
import { tracksWorkshopEntries, tracksSources, tracksChecklist, filterTracks } from "../lib/tracks-workshop";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";

function Evidence({ entry, neutral = false }) { return entry.photo ? <NaturePhoto photo={entry.photo} neutral={neutral} kind="Spuren"/> : <TrackSchema type={entry.schema}/>; }

export default function TracksWorkshop() {
  const [mode, setMode] = useState("entdecken");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("alle");
  const [selected, setSelected] = useState(tracksWorkshopEntries[0].id);
  const [checked, setChecked] = useState([]);
  useEffect(() => { if (typeof window === "undefined") return; const id = new URLSearchParams(window.location.search).get("eintrag"); if (tracksWorkshopEntries.some(entry => entry.id === id)) setSelected(id); }, []);
  const entry = tracksWorkshopEntries.find(item => item.id === selected);
  const results = filterTracks(query, group);
  function toggle(id) { setChecked(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); }
  return <LearningToolLayout title="Spurenwerkstatt" description="Entdecke Trittsiegel, Spurverläufe und andere Feldzeichen. Lerne, sichere Beobachtungen von offenen Vermutungen zu unterscheiden." icon="paw" category="wildkunde" stats={[{value:10,label:"Spurenfälle"},{value:8,label:"Originalfotos"},{value:2,label:"Vergleichsschemata"}]}>
    <div className={styles.modeButtons} role="group" aria-label="Lernweise"><button type="button" aria-pressed={mode === "entdecken"} onClick={() => setMode("entdecken")}>Spuren entdecken</button><button type="button" aria-pressed={mode === "quiz"} onClick={() => setMode("quiz")}>Spurenwissen prüfen</button><button type="button" aria-pressed={mode === "checkliste"} onClick={() => setMode("checkliste")}>Fund dokumentieren</button></div>
    {mode === "quiz" ? <NatureQuestionRound entries={tracksWorkshopEntries} sources={tracksSources} label="Spurenwissen" renderMedia={(item, answered) => <Evidence entry={item} neutral={!answered}/>}/> : mode === "checkliste" ? <section className={styles.panel}><h2>Eine Spur nachvollziehbar dokumentieren</h2><p>Diese Checkliste bleibt für deine aktuelle Sitzung. Sie ist eine Gedächtnisstütze und wird nicht als amtlicher Nachweis oder Fundmeldung gespeichert.</p><div className={nature.checklist}>{tracksChecklist.map(item => <label key={item.id}><input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)}/>{item.text}</label>)}</div><p className={styles.feedback} aria-live="polite">{checked.length} von {tracksChecklist.length} Dokumentationspunkten bedacht.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setChecked([])}>Checkliste leeren</button></div><p className={styles.note}>Für einen wichtigen Artennachweis die zuständige Fachstelle kontaktieren. Unsichere Funde und sensible Standorte fachlich prüfen lassen.</p></section> : <>
      <section className={styles.panel}><h2>Spur oder Merkmal finden</h2><div className={styles.toolbar}><label className={styles.field}>Spur suchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel: Biber, Schnee, Schalen"/></label><label className={styles.field}>Feldzeichen<select value={group} onChange={event => setGroup(event.target.value)}><option value="alle">Alle Feldzeichen</option>{[...new Set(tracksWorkshopEntries.map(item => item.group))].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div><p className={styles.muted}>{results.length} Spurenfälle gefunden</p><div className={nature.catalog}>{results.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} aria-controls="tracks-detail" onClick={() => setSelected(item.id)}><strong>{item.title}</strong><small>{item.group} · {item.photo ? "echte Fotografie" : "eigene schematische Zeichnung"}</small></button>)}</div>{results.length === 0 && <div className={styles.empty}>Keine passende Spur. Versuche ein anderes Wort oder „Alle Feldzeichen“.</div>}</section>
      <section className={styles.panel} id="tracks-detail" aria-labelledby="tracks-title"><h2 id="tracks-title">{entry.title}</h2><Evidence entry={entry}/><div className={styles.grid}><div><h3>Worauf du achten kannst</h3><ul>{entry.traits.map(trait => <li key={trait}>{trait}</li>)}</ul></div><div><h3>Was offenbleibt</h3><p>{entry.caution}</p></div></div><details className={styles.sources}><summary>Fachliche Grundlage</summary><a href={tracksSources[entry.source].url} target="_blank" rel="noreferrer">{tracksSources[entry.source].title}</a><p>Eigene Erklärung, fachliche Angaben geprüft am 4. Oktober 2026.</p></details><div className={styles.actions}><button type="button" className={styles.primary} onClick={() => setMode("quiz")}>Spurenwissen üben</button><Link className={styles.secondary} href="/lernen/wildkunde">Wildkundekurse öffnen</Link></div></section>
    </>}
  </LearningToolLayout>;
}
