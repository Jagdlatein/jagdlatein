import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { openPageMenu, closePageMenu } from "./PageMenu";
import { findVenisonCuts, venisonCuts, venisonCutPhoto, venisonCutSources, venisonCookingMethods, venisonKitchenSafety } from "../lib/venison-cut-guide";
import styles from "../styles/DogCutLearning.module.css";
import reader from "../styles/FieldTopicReader.module.css";

export default function VenisonCutGuide() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [annotationId, setAnnotationId] = useState(null);
  const matches = findVenisonCuts(query);
  const selectedCut = venisonCuts.find(item => item.id === router.query.eintrag) || null;
  const cooking = router.query.ansicht === "garmethoden";
  const annotatedCut = !imageFailed && selectedCut?.id === annotationId ? selectedCut : null;
  const heading = useRef(null);
  const navigation = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  const selectionKey = `${router.isReady}:${cooking}:${selectedCut?.id || ""}`;
  const committedView = useRef({ key: selectionKey });
  if (committedView.current.key !== selectionKey) committedView.current = { key: selectionKey };

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; navigation.current++; }; }, []);

  useEffect(() => {
    if (router.isReady === false) return;
    setAnnotationId(current => current === selectedCut?.id ? current : null);
    if (!selectedCut && !cooking) {
      const timer = setTimeout(() => openPageMenu("venison-choices"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }, [router.isReady, selectedCut?.id, cooking]);

  function choose(id) {
    const request = ++navigation.current;
    const origin = committedView.current;
    const next = { ...router.query };
    if (id === "garmethoden") next.ansicht = id;
    else { next.eintrag = id; delete next.ansicht; }
    closePageMenu();
    if (!pending.current && (id === selectedCut?.id && !cooking || id === "garmethoden" && cooking)) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
      return;
    }
    pending.current = true;
    router.push({ pathname: "/lernen/wildbret-stuecke", query: next, hash: "wildbret-detail" }, undefined, { shallow: true, scroll: false }).catch(error => {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      openPageMenu("venison-choices");
    }).finally(() => { if (request === navigation.current) pending.current = false; });
  }

  return <LearningToolLayout title="Wildbret: Stücke erkennen" description="Teilstücke unterscheiden, Begriffe verstehen und die passende Zubereitung kennenlernen." icon="wildbret-gesundheit" category="wildbret-gesundheit" headingOnly hideCommunity>
    <PageMenu title="Wildbret – Stück oder Thema wählen" openInitially={router.isReady !== false && !selectedCut && !cooking} initialFocusId="venison-choices">
      <div id="venison-choices" tabIndex={-1}>
        <label className={styles.searchLabel} htmlFor="wildbret-stueck-suche">Stück oder Zubereitung suchen</label>
        <input className={styles.search} id="wildbret-stueck-suche" type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Schulter, Rücken oder Gulasch" autoComplete="off" />
        <p role="status">{matches.length} passende {matches.length === 1 ? "Auswahl" : "Teilstücke"}</p>
        <div className={reader.choices}>{matches.map(cut => <button type="button" key={cut.id} aria-current={!cooking && selectedCut?.id === cut.id ? "page" : undefined} onClick={() => choose(cut.id)}>{cut.title}</button>)}</div>
        {matches.length === 0 && <p role="status">Kein passendes Stück gefunden. Suche zum Beispiel nach „Hals“, „Schlegel“ oder „Schmoren“.</p>}
        <div className={reader.choices}><button type="button" aria-current={cooking ? "page" : undefined} onClick={() => choose("garmethoden")}>Garmethoden und Küchenhygiene</button></div>
      </div>
    </PageMenu>
    <div id="wildbret-detail" className={reader.detail}>
    {cooking ? <section className={styles.kitchen} aria-labelledby="wildbret-topic-title"><h2 id="wildbret-topic-title" ref={heading} tabIndex={-1}>Garmethoden und Küchenhygiene</h2><div className={styles.methodGrid}>{venisonCookingMethods.map(method => <div key={method.title}><h3>{method.title}</h3><p>{method.text}</p></div>)}</div><div className={styles.safety}><h3>{venisonKitchenSafety.title}</h3><p>{venisonKitchenSafety.text}</p></div></section> : selectedCut ? <>
      <article id={`wildbret-${selectedCut.id}`} className={`${styles.cutCard} ${styles.cutCardSelected}`}>
        <div className={styles.cutBody}><h2 id="wildbret-topic-title" ref={heading} tabIndex={-1}>{selectedCut.title}</h2><p>{selectedCut.location}</p></div>
        <figure><img src={selectedCut.photo} width="640" height="480" alt={selectedCut.photoAlt} loading="lazy" /><figcaption>Ausschnitt derselben dokumentierten Rehaufnahme. Bildnachweis am Ende.</figcaption></figure>
        <div className={styles.cutBody}><h3>Erkennen und unterscheiden</h3><p>{selectedCut.recognition}</p><p>{selectedCut.distinction}</p><h3>Passende Zubereitung</h3><ul className={styles.methods} aria-label="Geeignete Zubereitungsarten">{selectedCut.methods.map(method => <li key={method}>{method}</li>)}</ul><p>{selectedCut.cooking}</p><h3>{venisonKitchenSafety.title}</h3><p>{venisonKitchenSafety.text}</p><p>Die einzelnen Garmethoden findest du im unteren Menü.</p></div>
      </article>
      <details className={styles.details}><summary>Mit der vollständigen Rehaufnahme vergleichen</summary>
        <figure className={styles.overview}><div className={styles.photoMap}>
          {!imageFailed ? <img src={venisonCutPhoto.src} width="1920" height="1080" loading="lazy" alt={venisonCutPhoto.alt} onError={() => setImageFailed(true)} /> : <p className={styles.imageFallback}>Die Aufnahme ist gerade nicht verfügbar. Die Stücke sind in der Bildlegende und im Wissenstext beschrieben.</p>}
          {annotatedCut && <div className={styles.cutLocator} aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><line x1={annotatedCut.marker.x} y1={annotatedCut.marker.y} x2={annotatedCut.marker.x} y2="100" vectorEffect="non-scaling-stroke" /></svg><span style={{ left: `${annotatedCut.marker.x}%`, top: `${annotatedCut.marker.y}%` }} /></div>}
        </div>
        <div className={styles.cutRail} role="group" aria-label="Teilstück im Foto auswählen">{venisonCuts.map(cut => <button key={cut.id} type="button" data-cut-id={cut.id} aria-pressed={cut.id === annotatedCut?.id} aria-controls="wildbret-detail" onClick={() => { setAnnotationId(current => current === cut.id ? null : cut.id); if (selectedCut.id !== cut.id || pending.current) choose(cut.id); }}><span aria-hidden="true">{cut.number}</span>{cut.title}</button>)}</div>
        <figcaption><strong>Ein Reh, fünf zugeordnete Teilstücke.</strong><p className={styles.cutSelection} role="status">{annotatedCut ? "Im Foto markiert" : "Ausgewählt"}: {selectedCut.number} · {selectedCut.title}</p></figcaption></figure>
      </details>
    </> : <p>{router.query.eintrag ? "Dieses Teilstück ist nicht verfügbar. " : ""}Wähle ein Teilstück unten im Menü. Hier erscheint nur sein Wissenstext mit Erkennungsmerkmalen und Zubereitung.</p>}
    </div>
    {(selectedCut || cooking) && <details className={styles.details}><summary>Ergänzende Fachquellen, Foto und Prüfstand</summary><p>{venisonCutPhoto.author} · {venisonCutPhoto.location} · {venisonCutPhoto.date} · <a href={venisonCutPhoto.source} target="_blank" rel="noopener noreferrer">Originalaufnahme</a> · <a href={venisonCutPhoto.licenseUrl} target="_blank" rel="noopener noreferrer">{venisonCutPhoto.license}</a></p><p>{venisonCutPhoto.changes}</p><p>{venisonCutPhoto.provenance}</p><p>Begriffe und Zubereitungsprinzipien gelten als Orientierung für die genannten Stücke. Zuschnitt, Tierart und tatsächliche Beschaffenheit müssen bei einer konkreten Portion bekannt sein. Die Aufnahme zeigt Reh und kein Wildschwein. Inhalt geprüft am 12. Oktober 2026.</p><ul>{Object.values(venisonCutSources).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.label}</a></li>)}</ul></details>}
  </LearningToolLayout>;
}
