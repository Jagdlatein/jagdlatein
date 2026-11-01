import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import SoundPlayer, { SoundCredit } from "./AnimalSoundPlayer";
import SoundSpectrogram from "./SoundSpectrogram";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { animalSounds, animalSoundById } from "../lib/animal-sounds";
import { animalSoundAddressKey, resolveAnimalSoundRoute } from "../lib/animal-sound-navigation";
import { getWildlifeVideoLinks } from "../lib/learning-video-links";
import styles from "../styles/AnimalSoundDetail.module.css";

export default function AnimalSoundDetail() {
  const router = useRouter();
  const ready = router.isReady === true;
  const selection = resolveAnimalSoundRoute(router.query, ready);
  const sound = selection.sound;
  const key = animalSoundAddressKey(router);
  const active = useRef({ key });
  if (active.current.key !== key) active.current = { key };
  const origin = active.current;
  const mounted = useRef(false);
  const request = useRef(0);
  const pending = useRef(null);
  const heading = useRef(null);
  const sources = useRef(null);
  const [failure, setFailure] = useState(null);
  const [loading, setLoading] = useState(null);
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  if (pending.current?.origin !== origin) pending.current = null;
  const busy = loading?.origin === origin && pending.current?.origin === origin;
  const error = failure?.origin === origin ? failure.message : "";
  const videos = sound?.speciesSlug ? getWildlifeVideoLinks(sound.speciesSlug) : [];

  function isCurrent() {
    if (!mounted.current || !ready || active.current !== origin) return false;
    if (animalSoundAddressKey(router) !== key) {
      active.current = { key: null };
      cancelSelectionFocus();
      return false;
    }
    return true;
  }

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; pending.current = null; };
  }, []);
  useEffect(() => {
    if (!isCurrent()) return;
    if (!sound) {
      const timer = setTimeout(() => { if (isCurrent()) openPageMenu("tierstimme-auswahl"); }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    if ((router.asPath || "").split("#")[1] === "tierstimme-quellen" && sources.current) {
      sources.current.open = true;
      focusSelection(sources.current, { anchor: true });
    } else { if (sources.current) sources.current.open = false; focusSelection(heading.current); }
  }, [origin]);

  async function selectSound(id) {
    if (!isCurrent() || typeof id !== "string" || !Object.hasOwn(animalSoundById, id)) return;
    cancelSelectionFocus();
    setFailure(null);
    if (sound?.id === id && !pending.current) { closePageMenu(); focusSelection(heading.current); return; }
    const sequence = ++request.current;
    const attempt = { origin, sequence };
    pending.current = attempt;
    setLoading(attempt);
    const current = () => isCurrent() && pending.current === attempt && request.current === sequence;
    const finish = (showError = false) => {
      if (!current()) return;
      pending.current = null;
      setLoading(null);
      if (showError) {
        setFailure({ origin, message: "Die Aufnahme konnte nicht geöffnet werden. Die angezeigte Stimme bleibt erhalten. Bitte versuche es erneut." });
        openPageMenu("tierstimme-auswahl");
      }
    };
    const query = Object.fromEntries(Object.entries(router.query || {}).filter(([name, value]) => name !== "stimme" &&
      (typeof value === "string" || Array.isArray(value) && value.every(part => typeof part === "string"))));
    query.stimme = id;
    const canonical = value => JSON.stringify(Object.keys(value || {}).sort().map(name => [name, value[name]]));
    const sameAddress = canonical(router.query) === canonical(query) && (router.asPath || "").split("#")[1] === "tierstimme-title"
      && (typeof window === "undefined" || window.location?.hash === "#tierstimme-title");
    try {
      const accepted = await router.push({ pathname: "/lernen/tierstimmen", query, hash: "tierstimme-title" }, undefined, { shallow: true, scroll: false });
      if (accepted === false) finish(true);
      else if (sameAddress && current()) { finish(); closePageMenu(); focusSelection(heading.current); }
      // Acceptance alone never replaces the sound; the actual URL owns it.
    } catch (caught) { finish(!caught?.cancelled); }
  }

  return <LearningToolLayout title="Tierstimme kennenlernen" icon="sound" category="wildkunde" headingOnly>
    <PageMenu title="Tierstimmen – Aufnahme wählen" openInitially={ready && !sound} initialFocusId="tierstimme-auswahl">
      <label className={styles.picker} htmlFor="tierstimme-auswahl">Tierstimme<select id="tierstimme-auswahl" disabled={!ready} value={sound?.id || ""} onChange={event => selectSound(event.target.value)} aria-busy={busy || undefined}>
        <option value="" disabled>Aufnahme wählen</option>{animalSounds.map(item => <option key={item.id} value={item.id}>{item.name} · {item.call}</option>)}
      </select></label>
      {busy && <p role="status">Die Aufnahme wird geöffnet …</p>}
      {error && <p role="alert">{error}</p>}
      <p><Link href="/lernen/tierstimmen" prefetch={false}>Stimmenbibliothek und Hörquiz</Link></p>
      {sound && <nav aria-label="Zur Tierstimme weiterlernen"><h2>Weiterlernen</h2>{sound.lessonUrl?.startsWith("/kurse/") && <p><Link href={sound.lessonUrl} prefetch={false}>Lernkurs</Link></p>}{sound.speciesSlug && <p><Link href={`/wildkunde/${sound.speciesSlug}`} prefetch={false}>Artenwissen</Link></p>}{!sound.speciesSlug && !sound.lessonUrl?.startsWith("/kurse/") && sound.lessonUrl && <p><Link href={sound.lessonUrl} prefetch={false}>Passendes Wissen</Link></p>}{videos.map(video => <p key={video.id}><Link href={video.href} prefetch={false}>{video.title}</Link></p>)}</nav>}
    </PageMenu>
    {sound ? <article className={styles.detail} aria-labelledby="tierstimme-title">
      <h2 id="tierstimme-title" ref={heading} tabIndex={-1}>{sound.name} · {sound.call}</h2>
      <p><i>{sound.scientificName}</i></p>
      <SoundPlayer sound={sound} label={`${sound.name}: ${sound.call} abspielen`} showCredit={false} showSpectrogram={false} scope={origin} isCurrent={isCurrent} />
      <section className={styles.cue}><h3>Darauf hörst du</h3><p>{sound.cue}</p></section>
      <h3>Die Aufnahme verstehen</h3><p>{sound.explanation}</p><p>{sound.context}</p>
      <section className={styles.limit}><h3>Ähnliche Stimmen und Grenzen</h3><p>{sound.confusion}</p><p>Eine Originalaufnahme zeigt einen Ausschnitt des Rufrepertoires. Sie ist keine vollständige Art- oder Gesundheitsbestimmung. Spiele die Aufnahme zum Lernen zu Hause ab; vermeide es, Wildtiere draußen durch Wiedergabe zu stören.</p></section>
      {videos.length > 0 && <p>Die verknüpften Filme und diese Tonaufnahme stammen aus unterschiedlichen Aufnahmen. Sie zeigen nicht automatisch dasselbe Tier oder denselben Beobachtungszeitpunkt.</p>}
      <SoundSpectrogram key={sound.id} sound={sound} />
      <details className={styles.sources} id="tierstimme-quellen" ref={sources} tabIndex={-1}><summary>Quellen und Aufnahme</summary><SoundCredit sound={sound} /><p><a href={sound.factsUrl} target="_blank" rel="noopener noreferrer">{sound.factsTitle}</a></p></details>
    </article> : <p className={styles.limit} role={ready ? "alert" : "status"}>{ready ? "Diese Stimmenauswahl ist ungültig. Wähle eine Aufnahme unten im Menü." : "Die gewählte Tierstimme wird geladen."}</p>}
  </LearningToolLayout>;
}
