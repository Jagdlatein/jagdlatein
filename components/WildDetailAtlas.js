import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { LearningPhotoCredit } from "./LearningPhoto";
import { wildDetailPhotos, wildDetailSources, wildDetailTopics } from "../lib/wild-detail-atlas";
import styles from "../styles/WildDetailAtlas.module.css";
import shared from "../styles/LearningExperience.module.css";

export function DetailPhoto({ panel, photograph, priority, prefix, showCredit = true }) {
  const [active, setActive] = useState(null);
  const marker = panel.markers[active];
  const labelX = active === null ? 50 : (active + 0.5) / panel.markers.length * 100;
  return <figure className={styles.figure}>
    <div className={styles.imageFrame} style={{ "--photo-ratio": photograph.width / photograph.height }}><div className={styles.imagePlane}>
      <Image src={photograph.src} alt={`${photograph.name}. ${panel.caption}`} width={photograph.width} height={photograph.height} sizes="(max-width: 650px) 90vw, 530px" priority={priority} />
      {marker && <svg className={styles.callout} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${marker.x} ${marker.y + 2} L ${labelX} 100`} /><circle cx={marker.x} cy={marker.y} r="2" /></svg>}
    </div>
    {panel.markers.length > 0 && <div className={styles.numberRail} role="group" aria-label={`Bildmerkmale: ${photograph.name}`} style={{ gridTemplateColumns: `repeat(${panel.markers.length}, minmax(0, 1fr))` }}>{panel.markers.map((item, index) => <button key={item.label} type="button" aria-label={`Merkmal ${index + 1}: ${item.label}`} aria-pressed={active === index} aria-describedby={`${prefix}-detail-${index}`} onClick={() => setActive(value => value === index ? null : index)}><span>{index + 1}</span></button>)}</div>}
    </div>
    <figcaption><h3>{photograph.name}</h3><p>{panel.caption}</p>{panel.markers.length > 0 && <><p className={styles.annotationHint}>Zahl unter dem Foto wählen: Eine feine Linie zeigt das Merkmal. Erneut wählen blendet sie aus.</p><ol className={styles.legend}>{panel.markers.map((item, index) => <li key={item.label} id={`${prefix}-detail-${index}`} className={active === index ? styles.activeLegend : undefined}><strong>{item.label}</strong> · {item.detail}</li>)}</ol></>}<p className={styles.limit}>{panel.limitations}</p>{showCredit && <LearningPhotoCredit media={photograph} />}</figcaption>
  </figure>;
}

export default function WildDetailAtlas() {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query.thema;
  const topic = ready ? requested === undefined ? wildDetailTopics[0] : wildDetailTopics.find(item => typeof requested === "string" && item.id === requested) || null : null;
  const viewKey = JSON.stringify([ready, topic?.id]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const [navigationError, setNavigationError] = useState("");
  const contentHeading = useRef(null);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const mounted = useRef(false);

  function focusContent() {
    contentHeading.current?.focus?.({ preventScroll: true });
    contentHeading.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!topic) {
      const timer = setTimeout(() => openPageMenu("wilddetails-choices"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusContent();
  }, [ready, topic?.id]);

  async function selectTopic(id) {
    if (!ready || !mounted.current || !wildDetailTopics.some(item => item.id === id)) return;
    setNavigationError("");
    closePageMenu();
    if (topic?.id === id && pendingRequest.current === null) { focusContent(); return; }
    const request = ++navigation.current;
    const origin = committedView.current;
    pendingRequest.current = request;
    try {
      await router.push({ pathname: "/lernen/wildtier-details", query: { ...router.query, thema: id }, hash: "wilddetails-title" }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Das Thema konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("wilddetails-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  return <LearningToolLayout title="Wildtier-Detailatlas" description="Gebiss, Schädel, Hörner, Geweih und Federn an echten Aufnahmen vergleichen. Das Thema wählst du im unteren Menü." icon="wildkunde" category="wildkunde" headingOnly hideCommunity>
    <PageMenu title="Detailatlas – Thema wählen" openInitially={ready && !topic} initialFocusId="wilddetails-choices">
      <div id="wilddetails-choices" tabIndex={-1}>
        <label className={styles.selector}>Thema ansehen<select id="wilddetails-topic" value={topic?.id || ""} disabled={!ready} aria-controls="wilddetails-content" onChange={event => selectTopic(event.target.value)}><option value="" disabled>Thema wählen</option>{wildDetailTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        {navigationError && <p className={shared.wrong} role="alert">{navigationError}</p>}
      </div>
    </PageMenu>
    {topic ? <><section id="wilddetails-content" aria-labelledby="wilddetails-title"><h2 id="wilddetails-title" className={styles.title} ref={contentHeading} tabIndex={-1}>{topic.title}</h2><p className={styles.subtitle}>{topic.subtitle}</p>
      <div className={styles.photos}>{topic.panels.map((panel, panelIndex) => {
        const photograph = wildDetailPhotos[panel.photoId];
        return <DetailPhoto key={`${topic.id}-${panel.photoId}`} panel={panel} photograph={photograph} priority={panelIndex === 0} prefix={`${topic.id}-${panelIndex}`} showCredit={false} />;
      })}</div>
      <div className={styles.claims}>{topic.claims.map(fact => <article key={fact.id}><h3>{fact.title}</h3><p>{fact.text}</p></article>)}</div>
      <aside className={styles.compare}><h3>So vergleichst du</h3><p>{topic.comparison}</p><p>{topic.observation}</p><small>Die Beschriftungen beziehen sich auf sichtbare Merkmale dieser Aufnahmen. Größen sind nicht maßstabsgleich.</small></aside>
    </section>
    <details className={shared.sources}><summary>Fachquellen, Bildnachweise und Prüfstand</summary>
      {topic.claims.map(fact => <section key={fact.id}><h3>{fact.title}</h3><ul>{fact.sourceIds.map(id => <li key={id}><a href={wildDetailSources[id].url} target="_blank" rel="noreferrer">{wildDetailSources[id].label}</a></li>)}</ul><p>Inhaltlich gegengeprüft: {fact.reviewedOn}</p></section>)}
      <h3>Originalaufnahmen</h3>{[...new Set(topic.panels.map(panel => panel.photoId))].map(id => <section key={id}><h4>{wildDetailPhotos[id].name}</h4><LearningPhotoCredit media={wildDetailPhotos[id]} /></section>)}
    </details></> : <p className={shared.note}>{ready ? "Dieses Thema ist nicht verfügbar. Wähle ein Thema unten im Menü." : "Das gewählte Thema wird geladen."}</p>}
  </LearningToolLayout>;
}
