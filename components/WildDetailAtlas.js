import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import { LearningPhotoCredit } from "./LearningPhoto";
import { getWildDetailTopic, wildDetailPhotos, wildDetailSources, wildDetailTopics } from "../lib/wild-detail-atlas";
import styles from "../styles/WildDetailAtlas.module.css";

export function DetailPhoto({ panel, photograph, priority, prefix }) {
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
    <figcaption><h3>{photograph.name}</h3><p>{panel.caption}</p>{panel.markers.length > 0 && <><p className={styles.annotationHint}>Zahl unter dem Foto wählen: Eine feine Linie zeigt das Merkmal. Erneut wählen blendet sie aus.</p><ol className={styles.legend}>{panel.markers.map((item, index) => <li key={item.label} id={`${prefix}-detail-${index}`} className={active === index ? styles.activeLegend : undefined}><strong>{item.label}</strong> · {item.detail}</li>)}</ol></>}<p className={styles.limit}>{panel.limitations}</p><LearningPhotoCredit media={photograph} /></figcaption>
  </figure>;
}

export default function WildDetailAtlas() {
  const router = useRouter();
  const [topicId, setTopicId] = useState(wildDetailTopics[0].id);
  useEffect(() => {
    if (typeof router.query.thema === "string" && wildDetailTopics.some(item => item.id === router.query.thema)) setTopicId(router.query.thema);
  }, [router.query.thema]);
  const topic = getWildDetailTopic(topicId);
  return <LearningToolLayout title="Wildtier-Detailatlas" description="Gebiss, Schädel, Hörner, Geweih und Federn an echten Aufnahmen vergleichen. Ein Thema wählen – der Vergleich steht direkt darunter." icon="wildkunde" category="wildkunde" compact hideCommunity>
    <label className={styles.selector}>Thema ansehen<select value={topicId} onChange={event => setTopicId(event.target.value)}>{wildDetailTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <section aria-labelledby="wilddetails-title"><h2 id="wilddetails-title" className={styles.title}>{topic.title}</h2><p className={styles.subtitle}>{topic.subtitle}</p>
      <div className={styles.photos}>{topic.panels.map((panel, panelIndex) => {
        const photograph = wildDetailPhotos[panel.photoId];
        return <DetailPhoto key={`${topic.id}-${panel.photoId}`} panel={panel} photograph={photograph} priority={panelIndex === 0} prefix={`${topic.id}-${panelIndex}`} />;
      })}</div>
      <div className={styles.claims}>{topic.claims.map(fact => <article key={fact.id}><h3>{fact.title}</h3><p>{fact.text}</p><details><summary>Belege zu dieser Aussage</summary><ul>{fact.sourceIds.map(id => <li key={id}><a href={wildDetailSources[id].url} target="_blank" rel="noreferrer">{wildDetailSources[id].label}</a></li>)}</ul><small>Inhaltlich gegengeprüft: {fact.reviewedOn}</small></details></article>)}</div>
      <aside className={styles.compare}><h3>So vergleichst du</h3><p>{topic.comparison}</p><p>{topic.observation}</p><small>Die Beschriftungen beziehen sich auf sichtbare Merkmale dieser Aufnahmen. Größen sind nicht maßstabsgleich.</small></aside>
    </section>
  </LearningToolLayout>;
}
