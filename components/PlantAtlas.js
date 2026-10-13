import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import NatureQuestionRound from "./NatureQuestionRound";
import DevelopmentPhotoSeries from "./DevelopmentPhotoSeries";
import { developmentPhotoSeries } from "../lib/development-photo-series";
import { NaturePhoto } from "./NatureMedia";
import { plantAtlasEntries, plantAtlasQuestions, plantSeasons, plantGroups, filterPlants } from "../lib/plant-atlas";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";

export default function PlantAtlas() {
  const router = useRouter();
  const [developmentId, setDevelopmentId] = useState(developmentPhotoSeries[0].id);
  const [mode, setMode] = useState("atlas");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("alle");
  const [selected, setSelected] = useState(plantAtlasEntries[0].id);
  const [season, setSeason] = useState("sommer");
  const detailTitle = useRef(null);
  const focusDetail = useRef(false);
  useEffect(() => { if (typeof window === "undefined") return; const params = new URLSearchParams(window.location.search); const id = params.get("eintrag"); if (plantAtlasEntries.some(entry => entry.id === id)) setSelected(id); if (developmentPhotoSeries.some(item => item.id === params.get("entwicklung"))) setMode("entwicklung"); }, []);
  useEffect(() => {
    if (!router.isReady) return;
    const series = developmentPhotoSeries.find(item => item.id === router.query.entwicklung);
    if (series) { setMode("entwicklung"); setDevelopmentId(series.id); }
    else { setMode(router.query.ansicht === "quiz" ? "quiz" : "atlas"); setSelected(plantAtlasEntries.find(item => item.id === router.query.eintrag)?.id || plantAtlasEntries[0].id); }
    setSeason(plantSeasons.find(item => item.id === router.query.jahreszeit)?.id || "sommer");
  }, [router.isReady, router.query.entwicklung, router.query.eintrag, router.query.ansicht, router.query.jahreszeit]);
  function showPlantDetail() {
    detailTitle.current?.focus({ preventScroll: true });
    detailTitle.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => { if (focusDetail.current && mode === "atlas") { focusDetail.current = false; showPlantDetail(); } }, [selected, mode]);
  function updateUrl(query, hash) {
    if (router.isReady) router.replace({ pathname: router.pathname, query, hash }, undefined, { shallow: true, scroll: false }).catch(() => {});
  }
  function chooseEntry(id) {
    if (!plantAtlasEntries.some(item => item.id === id)) return;
    if (id === selected) showPlantDetail();
    else { focusDetail.current = true; setSelected(id); }
    const { entwicklung, ansicht, ...query } = router.query;
    updateUrl({ ...query, eintrag: id, jahreszeit: season }, "plant-detail");
  }
  function chooseSeason(id) {
    if (!plantSeasons.some(item => item.id === id)) return;
    setSeason(id);
    updateUrl({ ...router.query, eintrag: selected, jahreszeit: id }, "plant-detail");
  }
  function chooseMode(value) {
    if (!["atlas", "quiz", "entwicklung"].includes(value)) return;
    setMode(value);
    if (router.isReady) {
      const { entwicklung, ansicht, ...query } = router.query;
      updateUrl({ ...query, ...(value === "entwicklung" ? { entwicklung: developmentId } : value === "quiz" ? { ansicht: "quiz" } : { eintrag: selected, jahreszeit: season }) }, value === "entwicklung" ? "pflanzen-entwicklung" : value === "atlas" ? "plant-detail" : "");
    }
  }
  const results = filterPlants(query, group);
  const entry = plantAtlasEntries.find(item => item.id === selected);
  return <LearningToolLayout title="Pflanzenatlas im Jahreslauf" description="Pflanzenmerkmale vergleichen und die Entwicklung einer Stieleiche an einer dokumentierten Folge echter Fotos verfolgen." icon="tree" category="wald-pflanzen" compact>
    <label className={styles.field}>Lernangebot<select value={mode} onChange={event => chooseMode(event.target.value)}><option value="atlas">Pflanzen nachschlagen</option><option value="quiz">Merkmale prüfen</option><option value="entwicklung">Entwicklung in echten Fotos</option></select></label>
    <p className={styles.note}>Mehrere Merkmale zusammen betrachten. Die Bilder zeigen ausgewählte Pflanzenteile und sind keine vollständige Bestimmungshilfe für jeden Fund. Der Atlas gibt keine Verzehr- oder Sammelfreigabe.</p>
    {mode === "entwicklung" ? <DevelopmentPhotoSeries key={developmentId} selectedId={developmentId} /> : mode === "quiz" ? <NatureQuestionRound entries={plantAtlasQuestions} label="Botanische Merkmale" renderMedia={(question, answered) => <NaturePhoto photo={plantAtlasEntries.find(item => item.id === question.plantId).photo} neutral={!answered}/>} /> : <>
      <section className={styles.panel}><h2>Pflanze finden</h2><div className={styles.toolbar}><label className={styles.field}>Name oder Merkmal suchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel: Nadel, Eiche, Fagus"/></label><label className={styles.field}>Pflanzengruppe<select value={group} onChange={event => setGroup(event.target.value)}>{plantGroups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><p className={styles.muted}>{results.length} Pflanzen gefunden</p><div className={nature.catalog}>{results.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} aria-controls="plant-detail" onClick={() => chooseEntry(item.id)}><strong>{item.name}</strong><small>{item.latin} · {item.group}</small><span>{item.features[0]}</span></button>)}</div>{results.length === 0 && <div className={styles.empty}>Keine Pflanze für diese Auswahl. Versuche einen anderen Namen oder ein einzelnes Merkmal.</div>}</section>
      <section className={styles.panel} id="plant-detail" aria-labelledby="plant-title"><h2 id="plant-title" className={nature.detailTitle} ref={detailTitle} tabIndex={-1}>{entry.name}</h2><p className={styles.muted}><i>{entry.latin}</i> · {entry.group}</p><NaturePhoto photo={entry.photo}/><div className={styles.grid}><div><h3>Merkmale gemeinsam prüfen</h3><ul>{entry.features.map(feature => <li key={feature}>{feature}</li>)}</ul><p><strong>Lebensraum:</strong> {entry.habitat}</p></div><div><h3>Ähnliches auseinanderhalten</h3><p>{entry.confusion}</p></div></div><h3>Im Jahreslauf</h3><label className={styles.field}>Jahreszeit<select value={season} aria-controls="plant-season" onChange={event => chooseSeason(event.target.value)}>{plantSeasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className={styles.feedback} id="plant-season" aria-live="polite"><strong>{plantSeasons.find(item => item.id === season).name}</strong><p>{entry.seasons[season]}</p></div><p className={styles.muted}>Blütezeiten sind ungefähre Orientierung. Witterung, Höhenlage und Standort verschieben die Entwicklung.</p><details className={styles.sources}><summary>Botanische Quelle</summary><a href={entry.source.url} target="_blank" rel="noreferrer">{entry.source.title}: {entry.name}</a><p>Eigene Kurzfassung, botanische Angaben geprüft am 4. Oktober 2026.</p></details><div className={styles.actions}><Link className={styles.secondary} href="/lernen/wald-pflanzen">Wald- und Pflanzenkurse öffnen</Link><button type="button" className={styles.primary} onClick={() => chooseMode("quiz")}>Merkmale im Quiz üben</button></div></section>
    </>}
  </LearningToolLayout>;
}
