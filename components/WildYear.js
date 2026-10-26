import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { LearningPhotoCredit } from "./LearningPhoto";
import { wildlifePhotographs } from "../lib/wildlife-photographs";
import { getWildYearProfile, wildYearMonths, wildYearSources, wildYearSpecies } from "../lib/wild-year";
import { readWildYearSelection, validWildYearMonth } from "../lib/wild-year-selection";
import { getWildlifeVideoLinks } from "../lib/learning-video-links";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/WildYear.module.css";

export default function WildYear({ currentMonth = 1, initialSelection = null }) {
  const router = useRouter();
  const ready = router.isReady === true;
  const fallbackMonth = validWildYearMonth(currentMonth) ? currentMonth : 1;
  // One request selection renders on the server and first hydration. Once
  // ready, the router is authoritative, including History and invalid links.
  const selection = ready ? readWildYearSelection(router.query, fallbackMonth) : initialSelection;
  const slug = wildYearSpecies.some(item => item.slug === selection?.slug) ? selection.slug : null;
  const month = validWildYearMonth(selection?.month) ? selection.month : null;
  const view = slug && month ? getWildYearProfile(slug, month) : null;
  const videos = view ? getWildlifeVideoLinks(slug) : [];
  const photograph = view ? wildlifePhotographs[slug] : null;
  const viewKey = JSON.stringify([ready, router.asPath, router.query, slug, month]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  const displayedOrigin = useRef(null);
  const content = useRef(null);
  const mounted = useRef(false);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const focusIntent = useRef(null);
  const [navigationError, setNavigationError] = useState("");

  function focusContent() {
    content.current?.focus?.({ preventScroll: true });
    content.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pendingRequest.current = null; focusIntent.current = null; };
  }, []);
  useEffect(() => {
    const previousOrigin = displayedOrigin.current;
    displayedOrigin.current = origin;
    const intent = focusIntent.current;
    focusIntent.current = null;
    if (!ready) return;
    setNavigationError("");
    if (!view) {
      const timer = setTimeout(() => {
        if (mounted.current && committedView.current === origin) openPageMenu("wildjahr-choices");
      }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    // Keep keyboard/drag focus on the existing range for its own month commit.
    // Species changes, direct links and History instead focus the new result.
    const rangeCommit = intent?.kind === "month" && intent.origin === previousOrigin && intent.slug === slug && intent.month === month;
    if (!rangeCommit) focusContent();
  }, [ready, slug, month, origin]);

  async function select(nextSlug, nextMonth, kind) {
    if (!ready || !mounted.current || committedView.current !== origin || !wildYearSpecies.some(item => item.slug === nextSlug) || !validWildYearMonth(nextMonth)) return;
    setNavigationError("");
    if (nextSlug === slug && nextMonth === month && pendingRequest.current === null) {
      closePageMenu();
      if (kind !== "month") focusContent();
      return;
    }
    const request = ++navigation.current;
    pendingRequest.current = request;
    focusIntent.current = { request, origin, slug: nextSlug, month: nextMonth, kind };
    try {
      const accepted = await router.push({ pathname: "/lernen/wildjahr", query: { ...router.query, art: nextSlug, monat: String(nextMonth) }, hash: "wildjahr-current" }, undefined, { shallow: true, scroll: false });
      if (accepted === false) {
        if (focusIntent.current?.request === request) focusIntent.current = null;
        return;
      }
      // Reselecting the committed pair can cancel a pending different pair
      // without a new render. Only this already displayed result can be focused.
      if (mounted.current && request === navigation.current && committedView.current === origin && nextSlug === slug && nextMonth === month) {
        if (focusIntent.current?.request === request) focusIntent.current = null;
        closePageMenu();
        if (kind !== "month") focusContent();
      }
    } catch (error) {
      if (focusIntent.current?.request === request) focusIntent.current = null;
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Die Auswahl konnte nicht geöffnet werden. Bitte wähle Art oder Monat erneut.");
      openPageMenu("wildjahr-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }

  return <LearningToolLayout title="Das biologische Wildjahr" description="Art und Monat wählen. Merkmale, Fortpflanzung und Verhalten im Jahreslauf erscheinen direkt darunter." icon="wildkunde" category="wildkunde" headingOnly hideCommunity>
    <PageMenu title="Wildjahr – Art wählen" openInitially={ready && !view} initialFocusId="wildjahr-choices"><section id="wildjahr-choices" tabIndex={-1} aria-label="Wildjahr auswählen">
      <label className={styles.species}>Wildart<select id="wildjahr-species" value={slug || ""} disabled={!ready} aria-controls="wildjahr-current" onChange={event => select(event.target.value, month || fallbackMonth, "species")}><option value="" disabled>Wildart wählen</option>{wildYearSpecies.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      {!view && <label className={styles.species}>Monat<select id="wildjahr-repair-month" value={month || ""} disabled={!ready || !slug} onChange={event => select(slug, Number(event.target.value), "species")}><option value="" disabled>Monat wählen</option>{wildYearMonths.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>}
      {navigationError && <p className={shared.wrong} role="alert">{navigationError}</p>}
      {view && <nav aria-label="Wildjahr vertiefen"><h3>Weiterlernen</h3><p><Link href={`/wildkunde/${slug}`}>Artenwissen</Link></p>{videos.length > 0 && <><h4>Videos</h4><p className={shared.muted}>Die Aufnahmen zeigen eigene Beobachtungszeitpunkte, nicht automatisch den gewählten Monat.</p><ul>{videos.map(video => <li key={video.id}><Link href={video.href} prefetch={false}>{video.title}</Link></li>)}</ul></>}</nav>}
    </section></PageMenu>
    {view ? <>
    <section className={styles.controls} aria-label="Monat im Jahresmodell">
      <div className={styles.month}><label htmlFor="wildjahr-month">Monat <output htmlFor="wildjahr-month">{view.monthName}</output></label><input id="wildjahr-month" type="range" min="1" max="12" step="1" value={month} disabled={!ready} aria-valuetext={view.monthName} aria-controls="wildjahr-current" onChange={event => select(slug, Number(event.target.value), "month")} /><div className={styles.monthNames} aria-hidden="true">{wildYearMonths.map(item => <span key={item}>{item.slice(0, 3)}</span>)}</div></div>
    </section>
    <section className={styles.result} aria-labelledby="wildjahr-current">
      <div className={styles.bio}>
        <h2 id="wildjahr-current" tabIndex={-1} ref={content}>{view.species.name} im {view.monthName}</h2>
        <p className={styles.orientation}>Typische Phasen in Mitteleuropa. Wetter, Höhenlage, Alter und Individuum verschieben die Übergänge. Die Monatsbänder sind eine Orientierung.</p>
        <div className={styles.cards}>{view.sections.map(section => <article key={section.key} className={styles.card}><p className={styles.label}>{section.label}</p><h3>{section.claim.title}</h3><p>{section.claim.text}</p></article>)}</div>
      </div>
      <figure className={styles.portrait}><Image src={photograph.src} alt={`${photograph.name}: dokumentarisches Artporträt, unabhängig vom ausgewählten Monat`} width={photograph.width} height={photograph.height} sizes="(max-width: 850px) 90vw, 350px" priority /><figcaption><strong>{photograph.name}</strong><p>Artporträt zur Orientierung. Dieses Foto belegt weder den gewählten Monat noch eine Fortpflanzungsphase.</p></figcaption></figure>
    </section>
    <aside className={styles.note}><strong>Genau hinschauen</strong><p>{view.species.uncertainty}</p><p>Ein Tier zeigt nicht immer alle Merkmale der typischen Jahresphase. Beobachtungen am besten mit Datum, Ort und erkennbaren Merkmalen festhalten.</p></aside>
    <details className={shared.sources}><summary>Quellen und Bildnachweis</summary><p>Inhaltlich gegengeprüft: {view.species.reviewedOn}</p>{view.sections.map(section => <section key={section.key}><h3>{section.label}: {section.claim.title}</h3><ul>{section.claim.sourceIds.map(id => <li key={id}><a href={wildYearSources[id].url} target="_blank" rel="noopener noreferrer">{wildYearSources[id].label}</a></li>)}</ul></section>)}<h3>Bildnachweis</h3><LearningPhotoCredit media={photograph} /></details>
    </> : <p className={shared.note}>{ready ? "Diese Auswahl ist nicht verfügbar. Wähle eine gültige Wildart und einen Monat unten im Menü." : "Das gewählte Wildjahr wird geladen."}</p>}
  </LearningToolLayout>;
}
