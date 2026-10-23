import { useRef, useState } from "react";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { jawModelEmbedURL, jawModelsBySlug, preferredJawModel } from "../lib/wildlife-jaw-models";
import styles from "../styles/WildlifeJawModel.module.css";

export default function WildlifeJawModel({ slug, name, showDirectoryLink = true, sectionId = "kiefer-3d", viewerOwner, onActivate }) {
  const species = jawModelsBySlug[slug];
  const [chosen, setChosen] = useState(() => preferredJawModel(species)?.id);
  const [active, setActive] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const currentFrame = useRef({ signature: "", token: 0 });
  if (!species) return null;
  const model = species.models.find(item => item.id === chosen) || preferredJawModel(species);
  const visible = active && (!viewerOwner || viewerOwner === slug);
  const signature = `${visible}:${model?.id}`;
  if (currentFrame.current.signature !== signature) currentFrame.current = { signature, token: currentFrame.current.token + 1 };
  const frameToken = currentFrame.current.token;
  const titleId = `${sectionId}-title`;
  const src = jawModelEmbedURL(model);
  if (!model || !src) return null;

  function changeModel(value) {
    if (!species.models.some(item => item.id === value)) return;
    setChosen(value); setFrameReady(false); setFailed(false);
  }

  return <section id={sectionId} className={styles.panel} aria-labelledby={titleId}>
    <h2 id={titleId}><AppIcon name="cube" size={26} />{name || species.name}: Kiefer & Schädel in 3D</h2>
    <p className={styles.intro}>Echte Sammlungspräparate drehen und ihre sichtbaren Strukturen vergleichen.</p>
    {species.models.length > 1 && <label className={styles.field}>Präparat auswählen<select value={model.id} onChange={event => changeModel(event.target.value)}>{species.models.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
    <p className={styles.object}><strong>{model.title}</strong> · <i>{model.scientificName || species.scientificName}</i>{model.specimen && <> · {model.specimen}</>}</p>
    {model.note && <p>{model.note}</p>}
    {species.note && <p>{species.note}</p>}
    {!visible ? <div className={styles.opening}>
      <p>Die 3D-Ansicht wird erst auf deinen Wunsch von Sketchfab geladen. Dabei erhält der Anbieter technische Verbindungsdaten, etwa deine IP-Adresse. Es werden keine Jagdlatein-Kontodaten an das Modell übergeben.</p>
      <button type="button" aria-describedby={titleId} onClick={() => { onActivate?.(slug); setActive(true); setFrameReady(false); setFailed(false); }} className={styles.load}><AppIcon name="cube" size={22} />3D-Modell laden</button>
    </div> : <>
      {!failed && <iframe key={model.id} className={styles.viewer} title={`${model.title} von ${name || species.name} – drehbarer Sammlungs-Scan`} src={src} referrerPolicy="no-referrer" allow="autoplay; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms" onLoad={() => { if (currentFrame.current.token === frameToken) setFrameReady(true); }} onError={() => { if (currentFrame.current.token === frameToken) setFailed(true); }} />}
      <p role="status" className={styles.hint}>{failed ? "Die externe Ansicht konnte nicht geöffnet werden. Nutze den Link zum Originalmodell unten." : !frameReady ? "Die externe Modellansicht wird geöffnet …" : "Im Modell ziehen zum Drehen, mit zwei Fingern oder dem Mausrad zoomen. Die Anzeige passt das Präparat an den Bildschirm an; sie ist kein gemeinsamer Maßstab mit anderen Modellen."}</p>
    </>}

    <p className={styles.scope}>Das Präparat zeigt ein einzelnes Sammlungsobjekt mit seinem Erhaltungszustand. Fehlende oder abgenutzte Zähne sind keine allgemeine Zahnformel der Art. Ein Schädelmodell enthält nicht automatisch einen separat drehbaren Unterkiefer.</p>
    {showDirectoryLink && <Link href={`/lernen/kiefer-3d?art=${slug}`} className={styles.allSpecies}>Weitere Wildarten vergleichen<AppIcon name="arrow-right" size={18} /></Link>}
    <details className={styles.credit}><summary>Modellquelle und Lizenznachweis</summary><p className={styles.credit}>Scan: {model.creator} · <a href={model.licenseURL} target="_blank" rel="noopener noreferrer">{model.license}</a> · <a href={model.sourceURL} target="_blank" rel="noopener noreferrer">Originalmodell</a>{model.catalogURL && <> · <a href={model.catalogURL} target="_blank" rel="noopener noreferrer">Sammlungsnachweis</a></>}{model.licenseBasis !== "model-api" && model.licenseSourceURL && <> · <a href={model.licenseSourceURL} target="_blank" rel="noopener noreferrer">Lizenznachweis</a></>}</p></details>
  </section>;
}
