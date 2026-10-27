import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import NatureQuestionRound from "./NatureQuestionRound";
import DevelopmentPhotoSeries from "./DevelopmentPhotoSeries";
import { developmentPhotoSeries } from "../lib/development-photo-series";
import { NaturePhoto } from "./NatureMedia";
import { plantAtlasEntries, plantAtlasQuestions, plantSeasons, plantGroups, filterPlants } from "../lib/plant-atlas";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";

export default function PlantAtlas() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("alle");
  const [navigationError, setNavigationError] = useState("");
  const content = useRef(null);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const mounted = useRef(false);
  const ready = router.isReady === true;
  const entry = ready ? plantAtlasEntries.find(item => typeof router.query.eintrag === "string" && item.id === router.query.eintrag) || null : null;
  const series = ready ? developmentPhotoSeries.find(item => typeof router.query.entwicklung === "string" && item.id === router.query.entwicklung) || null : null;
  const mode = series ? "entwicklung" : ready && router.query.ansicht === "quiz" ? "quiz" : "atlas";
  const season = plantSeasons.find(item => ready && item.id === router.query.jahreszeit)?.id || "sommer";
  const viewKey = JSON.stringify([ready, mode, entry?.id, season, series?.id]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const results = filterPlants(query, group);

  function focusContent() {
    const target = content.current?.querySelector?.("h2") || content.current;
    target?.setAttribute?.("tabindex", "-1");
    focusSelection(target);
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current += 1; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    if (!ready || !mounted.current || committedView.current !== origin) return;
    cancelSelectionFocus();
    setNavigationError("");
    if (mode === "atlas" && !entry) {
      const timer = setTimeout(() => openPageMenu("plant-choices"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusContent();
  }, [ready, mode, entry?.id, season, series?.id]);

  async function navigate(next, hash, sameSelection) {
    if (!ready || !mounted.current || committedView.current !== origin) return;
    cancelSelectionFocus();
    setNavigationError("");
    closePageMenu();
    if (sameSelection && pendingRequest.current === null) { focusContent(); return; }
    const request = ++navigation.current;
    pendingRequest.current = request;
    try {
      await router.push({ pathname: "/lernen/pflanzenatlas", query: next, hash }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Das Thema konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("plant-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  function chooseEntry(id) {
    if (!plantAtlasEntries.some(item => item.id === id)) return;
    const { entwicklung, ansicht, ...next } = router.query;
    return navigate({ ...next, eintrag: id, jahreszeit: season }, "plant-detail", mode === "atlas" && entry?.id === id);
  }
  function chooseSeason(id) {
    if (mode !== "atlas" || !entry || !plantSeasons.some(item => item.id === id)) return;
    const { entwicklung, ansicht, ...next } = router.query;
    return navigate({ ...next, eintrag: entry.id, jahreszeit: id }, "plant-detail", season === id);
  }
  function chooseMode(value) {
    if (!["atlas", "quiz", "entwicklung"].includes(value)) return;
    const { entwicklung, ansicht, ...next } = router.query;
    if (value === "entwicklung") next.entwicklung = series?.id || developmentPhotoSeries[0].id;
    if (value === "quiz") next.ansicht = "quiz";
    return navigate(next, value === "entwicklung" ? "pflanzen-entwicklung" : value === "quiz" ? "plant-quiz" : "plant-detail", mode === value);
  }

  return <LearningToolLayout title="Pflanzenatlas im Jahreslauf" description="Pflanzenmerkmale vergleichen und die Entwicklung einer Stieleiche an einer dokumentierten Folge echter Fotos verfolgen." icon="tree" category="wald-pflanzen" headingOnly>
    <PageMenu title="Pflanzenatlas – Thema wählen" openInitially={ready && mode === "atlas" && !entry} initialFocusId="plant-choices">
      <div id="plant-choices" tabIndex={-1}>
        <MenuChoice label="Lernangebot" id="plant-mode" value={mode} disabled={!ready} onChange={event => chooseMode(event.target.value)}><option value="atlas">Pflanzen nachschlagen</option><option value="quiz">Merkmale prüfen</option><option value="entwicklung">Entwicklung in echten Fotos</option></MenuChoice>
        {mode === "atlas" && <>
          <label className={styles.field}>Name oder Merkmal suchen<input type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Nadel, Eiche oder Fagus" /></label>
          <MenuChoice label="Pflanzengruppe" id="plant-group" value={group} onChange={event => setGroup(event.target.value)}>{plantGroups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</MenuChoice>
          <p role="status">{results.length} Pflanzen gefunden</p>
          <div className={nature.catalog}>{results.map(item => <button type="button" key={item.id} aria-current={entry?.id === item.id ? "page" : undefined} aria-controls="plant-detail" onClick={() => chooseEntry(item.id)}><strong>{item.name}</strong><small>{item.latin} · {item.group}</small></button>)}</div>
          {results.length === 0 && <p role="status">Keine Pflanze für diese Auswahl. Versuche einen anderen Namen oder ein einzelnes Merkmal.</p>}
          {entry && <MenuChoice label="Jahreszeit" id="plant-season-choice" value={season} disabled={!ready} aria-controls="plant-season" onChange={event => chooseSeason(event.target.value)}>{plantSeasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</MenuChoice>}
        </>}
        {navigationError && <p className={styles.wrong} role="alert">{navigationError}</p>}
        <Link href="/lernen/wald-pflanzen" prefetch={false}>Wald- und Pflanzenkurse</Link>
      </div>
    </PageMenu>
    <p className={styles.note}>Mehrere Merkmale zusammen betrachten. Die Bilder zeigen ausgewählte Pflanzenteile und sind keine vollständige Bestimmungshilfe für jeden Fund. Der Atlas gibt keine Verzehr- oder Sammelfreigabe.</p>
    <div ref={content} tabIndex={-1}>
      {mode === "entwicklung" ? <DevelopmentPhotoSeries key={series.id} selectedId={series.id} /> : mode === "quiz" ? <section id="plant-quiz" aria-label="Botanische Merkmale prüfen"><NatureQuestionRound entries={plantAtlasQuestions} label="Botanische Merkmale" renderMedia={(question, answered) => <NaturePhoto photo={plantAtlasEntries.find(item => item.id === question.plantId).photo} neutral={!answered} />} /></section> : entry ? <section className={styles.panel} id="plant-detail" aria-labelledby="plant-title">
        <h2 id="plant-title" className={nature.detailTitle}>{entry.name}</h2><p className={styles.muted}><i>{entry.latin}</i> · {entry.group}</p><NaturePhoto photo={entry.photo} />
        <h3>Merkmale gemeinsam prüfen</h3><ul>{entry.features.map(feature => <li key={feature}>{feature}</li>)}</ul><p><strong>Lebensraum:</strong> {entry.habitat}</p>
        <h3>Ähnliches auseinanderhalten</h3><p>{entry.confusion}</p>
        <h3>Im Jahreslauf</h3><div className={styles.feedback} id="plant-season" aria-live="polite"><strong>{plantSeasons.find(item => item.id === season).name}</strong><p>{entry.seasons[season]}</p></div>
        <p className={styles.muted}>Blütezeiten sind ungefähre Orientierung. Witterung, Höhenlage und Standort verschieben die Entwicklung.</p>
      </section> : <p className={styles.note}>{ready && (router.query.eintrag !== undefined || router.query.entwicklung !== undefined) ? "Dieses Pflanzenthema ist nicht verfügbar. " : ""}Wähle eine Pflanze unten im Menü. Hier erscheint nur ihr Wissenstext.</p>}
    </div>
    {mode === "atlas" && entry && <details className={styles.sources}><summary>Ergänzende botanische Quelle und Prüfstand</summary><a href={entry.source.url} target="_blank" rel="noreferrer">{entry.source.title}: {entry.name}</a><p>Eigene Kurzfassung, botanische Angaben geprüft am 4. Oktober 2026.</p></details>}
  </LearningToolLayout>;
}
