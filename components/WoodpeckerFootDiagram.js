import { useState } from "react";
import styles from "../styles/WoodpeckerFootDiagram.module.css";

export function WoodpeckerFootDrawing({ showMovement = false }) {
  return <svg viewBox="0 0 360 330" role="img" aria-label={showMovement
    ? "Vierzehiges Grundschema: zwei Zehen vorn, zwei hinten. Ein gestrichelter Pfeil zeigt mögliche Beweglichkeit der äusseren Zehe, keine genaue Kletterhaltung."
    : "Vierzehiges Grundschema: zwei Zehen nach vorn und zwei nach hinten."}>
    <rect x="1" y="1" width="358" height="328" rx="18" fill="#fffdf7" stroke="#dfd5b8" />
    <g fill="#2b4738" fontFamily="Arial, sans-serif" textAnchor="middle">
      <text x="164" y="33" fontSize="19" fontWeight="700">zwei nach vorn</text>
      <text x="164" y="304" fontSize="19" fontWeight="700">zwei nach hinten</text>
    </g>
    <g fill="none" stroke="#2b4738" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M164 154 L111 70" /><path d="M164 154 L199 70" />
      <path d="M164 154 L104 252" /><path d="M164 154 L230 252" />
    </g>
    <circle cx="164" cy="154" r="13" fill="#e8d59f" stroke="#2b4738" strokeWidth="3" />
    {showMovement && <g fill="none" stroke="#94621c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M252 239 Q300 216 297 164" strokeDasharray="7 7" />
      <path d="M286 179 L297 164 L308 180" />
    </g>}
    {showMovement && <g fill="#704a17" fontFamily="Arial, sans-serif" fontSize="16" textAnchor="middle">
      <text x="278" y="113">äussere Zehe</text><text x="278" y="135">beweglich</text>
    </g>}
  </svg>;
}

export default function WoodpeckerFootDiagram({ diagram }) {
  const [showMovement, setShowMovement] = useState(false);
  return <aside className={styles.example} aria-label={diagram.title}>
    <h3>{diagram.title}</h3><p>{diagram.note}</p>
    <div className={styles.comparison}>
      <figure><WoodpeckerFootDrawing showMovement={showMovement} /><figcaption>Abstrakte Zehensymbole, kein anatomischer Fussabdruck. Der Pfeil ergänzt das Grundschema; er zeigt keine vermessene Stellung eines bestimmten Vogels.</figcaption></figure>
      <div><label className={styles.control}><input type="checkbox" checked={showMovement} onChange={event => setShowMovement(event.target.checked)} />Beweglichkeit einblenden</label>
        <p className={styles.reading} aria-live="polite">{showMovement ? "Die äussere Zehe kann beim Klettern seitwärts gerichtet sein. Grundanordnung und momentane Haltung sind verschiedene Betrachtungen." : "Zwei Zehen nach vorn, zwei nach hinten: das zygodactyle Grundschema am vierzehigen Vergleichsmodell."}</p>
        <ul>{diagram.steps.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ul>
      </div>
    </div>
  </aside>;
}
