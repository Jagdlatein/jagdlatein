import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import { LearningPhotoCredit } from "./LearningPhoto";
import { getWildDetailTopic, wildDetailPhotos, wildDetailSources, wildDetailTopics } from "../lib/wild-detail-atlas";
import styles from "../styles/WildDetailAtlas.module.css";

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
        return <figure className={styles.figure} key={`${topic.id}-${panel.photoId}`}>
          <div className={styles.imageFrame}><div className={styles.imagePlane} style={{ "--photo-ratio": photograph.width / photograph.height }}><Image src={photograph.src} alt={`${photograph.name}. ${panel.caption}`} width={photograph.width} height={photograph.height} sizes="(max-width: 650px) 90vw, 530px" priority={panelIndex === 0} />{panel.markers.map((marker, index) => <span key={marker.label} className={styles.marker} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} aria-hidden="true">{index + 1}</span>)}</div></div>
          <figcaption><h3>{photograph.name}</h3><p>{panel.caption}</p>{panel.markers.length > 0 && <ol className={styles.legend}>{panel.markers.map(marker => <li key={marker.label}><strong>{marker.label}</strong> · {marker.detail}</li>)}</ol>}<p className={styles.limit}>{panel.limitations}</p><LearningPhotoCredit media={photograph} /></figcaption>
        </figure>;
      })}</div>
      <div className={styles.claims}>{topic.claims.map(fact => <article key={fact.id}><h3>{fact.title}</h3><p>{fact.text}</p><details><summary>Belege zu dieser Aussage</summary><ul>{fact.sourceIds.map(id => <li key={id}><a href={wildDetailSources[id].url} target="_blank" rel="noreferrer">{wildDetailSources[id].label}</a></li>)}</ul><small>Inhaltlich gegengeprüft: {fact.reviewedOn}</small></details></article>)}</div>
      <aside className={styles.compare}><h3>So vergleichst du</h3><p>{topic.comparison}</p><p>{topic.observation}</p><small>Die Beschriftungen beziehen sich auf sichtbare Merkmale dieser Aufnahmen. Größen sind nicht maßstabsgleich.</small></aside>
    </section>
  </LearningToolLayout>;
}
