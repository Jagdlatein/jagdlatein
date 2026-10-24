import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import NatureQuestionRound from "./NatureQuestionRound";
import { NaturePhoto, TrackSchema } from "./NatureMedia";
import { tracksWorkshopEntries, tracksSources, tracksChecklist, filterTracks } from "../lib/tracks-workshop";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";
import reader from "../styles/FieldTopicReader.module.css";

function Evidence({ entry, neutral = false }) { return entry.photo ? <NaturePhoto photo={entry.photo} neutral={neutral} kind="Spuren"/> : <TrackSchema type={entry.schema}/>; }

export default function TracksWorkshop() {
  const router = useRouter();
  const mode = ["quiz", "checkliste"].includes(router.query.ansicht) ? router.query.ansicht : "entdecken";
  const entry = tracksWorkshopEntries.find(item => item.id === router.query.eintrag) || null;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("alle");
  const [checked, setChecked] = useState([]);
  const detail = useRef(null);
  const navigation = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  const results = filterTracks(query, group);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; navigation.current++; }; }, []);

  useEffect(() => {
    if (router.isReady === false) return;
    if (mode === "entdecken" && !entry) {
      const timer = setTimeout(() => openPageMenu("tracks-choices"), 0);
      return () => clearTimeout(timer);
    }
    if (mode !== "entdecken" || entry) {
      closePageMenu();
      detail.current?.focus({ preventScroll: true });
      detail.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
    }
  }, [router.isReady, mode, entry?.id]);

  function choose(change) {
    const request = ++navigation.current;
    const next = { ...router.query, ...change };
    if (next.ansicht === "entdecken") delete next.ansicht;
    closePageMenu();
    if (!pending.current && (next.ansicht || "entdecken") === mode && next.eintrag === router.query.eintrag) {
      detail.current?.focus({ preventScroll: true });
      detail.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
      return;
    }
    pending.current = true;
    router.push({ pathname: "/lernen/spurenwerkstatt", query: next, hash: "tracks-detail" }, undefined, { shallow: true, scroll: false }).catch(error => {
      if (error?.cancelled || !mounted.current || request !== navigation.current) return;
      openPageMenu("tracks-choices");
    }).finally(() => { if (request === navigation.current) pending.current = false; });
  }
  function toggle(id) { setChecked(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); }

  return <LearningToolLayout title="Spurenwerkstatt" description="Trittsiegel, Spurverläufe und andere Feldzeichen verstehen." icon="paw" category="wildkunde" headingOnly>
    <PageMenu title="Spurenwerkstatt – Thema wählen" openInitially={router.isReady !== false && mode === "entdecken" && !entry} initialFocusId="tracks-choices">
      <div id="tracks-choices" tabIndex={-1}>
        <label className={styles.field}>Lernweise<select value={mode} onChange={event => choose({ ansicht: event.target.value })}><option value="entdecken">Spuren entdecken</option><option value="quiz">Spurenwissen prüfen</option><option value="checkliste">Fund dokumentieren</option></select></label>
        {mode === "entdecken" && <>
          <label className={styles.field}>Spur suchen<input type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Biber, Schnee oder Schalen"/></label>
          <label className={styles.field}>Feldzeichen<select value={group} onChange={event => setGroup(event.target.value)}><option value="alle">Alle Feldzeichen</option>{[...new Set(tracksWorkshopEntries.map(item => item.group))].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <p role="status">{results.length} Spurenfälle gefunden</p>
          <div className={reader.choices}>{results.map(item => <button type="button" key={item.id} aria-current={entry?.id === item.id ? "page" : undefined} onClick={() => choose({ eintrag: item.id, ansicht: "entdecken" })}><strong>{item.title}</strong><small>{item.group} · {item.photo ? "echte Fotografie" : "eigene schematische Zeichnung"}</small></button>)}</div>
          {results.length === 0 && <p role="status">Keine passende Spur. Versuche ein anderes Wort oder „Alle Feldzeichen“.</p>}
        </>}
        <Link href="/lernen/wildkunde" prefetch={false}>Wildkundekurse</Link>
      </div>
    </PageMenu>
    {mode === "quiz" ? <div id="tracks-detail" ref={detail} tabIndex={-1} aria-label="Spurenwissen prüfen"><NatureQuestionRound entries={tracksWorkshopEntries} sources={tracksSources} label="Spurenwissen" renderMedia={(item, answered) => <Evidence entry={item} neutral={!answered}/>}/></div> : mode === "checkliste" ? <section className={styles.panel} id="tracks-detail" aria-labelledby="tracks-title"><h2 id="tracks-title" ref={detail} tabIndex={-1}>Eine Spur nachvollziehbar dokumentieren</h2><p>Diese Checkliste bleibt für deine aktuelle Sitzung. Sie ist eine Gedächtnisstütze und wird nicht als amtlicher Nachweis oder Fundmeldung gespeichert.</p><div className={nature.checklist}>{tracksChecklist.map(item => <label key={item.id}><input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)}/>{item.text}</label>)}</div><p className={styles.feedback} aria-live="polite">{checked.length} von {tracksChecklist.length} Dokumentationspunkten bedacht.</p><button type="button" className={styles.secondary} onClick={() => setChecked([])}>Checkliste leeren</button><p className={styles.note}>Für einen wichtigen Artennachweis die zuständige Fachstelle kontaktieren. Unsichere Funde und sensible Standorte fachlich prüfen lassen.</p></section> : entry ? <>
      <section className={styles.panel} id="tracks-detail" aria-labelledby="tracks-title"><h2 id="tracks-title" ref={detail} tabIndex={-1} className={nature.detailTitle}>{entry.title}</h2><Evidence entry={entry}/><h3>Worauf du achten kannst</h3><ul>{entry.traits.map(trait => <li key={trait}>{trait}</li>)}</ul><h3>Was offenbleibt</h3><p>{entry.caution}</p></section>
      <details className={styles.sources}><summary>Ergänzende Quelle und Prüfstand</summary><a href={tracksSources[entry.source].url} target="_blank" rel="noreferrer">{tracksSources[entry.source].title}</a><p>Eigene Erklärung, fachliche Angaben geprüft am 4. Oktober 2026.</p></details>
    </> : <p className={styles.note}>{router.query.eintrag ? "Diese Spur ist nicht verfügbar. " : ""}Wähle einen Spurenfall unten im Menü. Hier erscheint nur der dazugehörige Wissenstext.</p>}
  </LearningToolLayout>;
}
