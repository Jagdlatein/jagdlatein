import Image from "next/image";
import styles from "../styles/LearningExperience.module.css";
import nature from "../styles/NatureWorkshop.module.css";

export function NaturePhoto({ photo, neutral = false, kind = "Botanische" }) {
  if (!photo) return null;
  return <figure className={styles.figure}><Image className={nature.photo} src={photo.src} alt={neutral ? `${kind} Originalaufnahme für diese Lernfrage` : photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 600px) 88vw, 900px" loading="eager"/><figcaption className={nature.credit}>Foto: {photo.author} · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Original und Nachweis</a><a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>{photo.modifications && <span> · Proportional für die Webanzeige verkleinert.</span>}{!neutral && photo.displayCaption && <p>{photo.displayCaption}</p>}</figcaption></figure>;
}

export function TrackSchema({ type }) {
  return <figure className={styles.figure}><svg className={nature.schema} viewBox="0 0 550 310" role="img" aria-label={type === "dachs" ? "Eigene schematische Zeichnung eines Trittsiegels: fünf Zehen und längere Krallenabdrücke." : "Eigene schematische Zeichnung: zwei Hauptschalen und zwei zusätzliche Afterklauenabdrücke."}>
    {type === "dachs" ? <><ellipse cx="250" cy="210" rx="80" ry="43" fill="#7c6240"/>{[160,205,250,295,340].map((x,i) => <g key={x}><ellipse cx={x} cy={135 + Math.abs(2-i)*12} rx="17" ry="24" fill="#7c6240"/><path d={`M${x} ${95+Math.abs(2-i)*12}v-36`} stroke="#7c6240" strokeWidth="7" strokeLinecap="round"/></g>)}<path d="M377 91h88m-88 57h88" stroke="#ab8535" strokeWidth="2"/><text x="379" y="76">Krallen</text><text x="379" y="179">Zehen</text><text x="205" y="279">Hauptballen</text></> : <><path d="M230 55c-40 48-55 95-47 139 3 19 16 37 44 28 12-30 16-109 3-167Z" fill="#7c6240"/><path d="M263 55c40 48 55 95 47 139-3 19-16 37-44 28-12-30-16-109-3-167Z" fill="#7c6240"/><ellipse cx="165" cy="244" rx="16" ry="21" fill="#7c6240"/><ellipse cx="329" cy="244" rx="16" ry="21" fill="#7c6240"/><text x="340" y="136">Hauptschalen</text><text x="340" y="253">Afterklauen</text><path d="M308 145h25m8 99h20" stroke="#ab8535" strokeWidth="2"/></>}
  </svg><figcaption>Eigene Vergleichszeichnung · ausgewählte Merkmale · ohne Größenmaßstab. Keine Fotografie eines Fundes.</figcaption></figure>;
}
