import { useId, useState } from "react";
import { readCompassLearningAngle } from "../lib/compass-learning";
import styles from "../styles/CompassLearning.module.css";

const format = value => new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(value);
const circumference = 2 * Math.PI * 92;

export default function CompassLearning({ title = "Richtungswinkel sichtbar machen" }) {
  const id = useId();
  const [value, setValue] = useState("45");
  const result = readCompassLearningAngle(value);
  return <section className={styles.model} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{title}</h3>
    <p id={`${id}-help`}>Eigener ebener Lernkreis: N ist hier fest vorgegeben. Winkel zählen im Uhrzeigersinn von N aus.</p>
    <div className={styles.body}>
      <div className={styles.diagram}>
        <svg viewBox="0 0 340 340" role="img" aria-label={result ? `Lernkreis: ${format(result.angle)} Grad im Uhrzeigersinn von N` : "Lernkreis mit den vier Hauptrichtungen"}>
          <circle cx="170" cy="170" r="112" className={styles.ring} />
          <path d="M170 58V282M58 170H282" className={styles.axes} />
          <text x="170" y="28" textAnchor="middle">N</text><text x="170" y="46" textAnchor="middle" className={styles.degree}>0° / 360°</text>
          <text x="319" y="170" textAnchor="middle">O</text><text x="319" y="189" textAnchor="middle" className={styles.degree}>90°</text>
          <text x="170" y="313" textAnchor="middle">S</text><text x="170" y="332" textAnchor="middle" className={styles.degree}>180°</text>
          <text x="21" y="170" textAnchor="middle">W</text><text x="21" y="189" textAnchor="middle" className={styles.degree}>270°</text>
          {result && <>
            <circle cx="170" cy="170" r="92" className={styles.arc} strokeDasharray={`${result.angle / 360 * circumference} ${circumference}`} transform="rotate(-90 170 170)" />
            <g transform={`rotate(${result.direction} 170 170)`} className={styles.pointer}><path d="M170 170V82" /><path d="M170 62L158 87H182Z" /></g>
          </>}
          <circle cx="170" cy="170" r="5" className={styles.center} />
        </svg>
      </div>
      <div className={styles.values}>
        <label htmlFor={`${id}-angle`}>Richtungswinkel (ganze Grad)<input id={`${id}-angle`} type="number" min="0" max="360" step="1" value={value} onChange={event => setValue(event.target.value)} aria-describedby={`${id}-help`} /></label>
        <div className={styles.result} role="status" aria-live="polite" aria-atomic="true">{result ? <><strong>{format(result.angle)}°</strong><p>Gewählte Richtung im Lernkreis.</p><p>Gegenrichtung: <b>{format(result.reverse)}°</b></p><p>0° und 360° zeigen beide nach N. Für die Gegenrichtung wird um 180° gedreht.</p></> : <p>Bitte einen ganzen Winkel von 0 bis 360 Grad eingeben.</p>}</div>
      </div>
    </div>
    <p className={styles.note}>Der Pfeil zeigt deine gewählte Richtung, keine Magnetnadel. Das Lernmodell misst keinen Standort und berücksichtigt keine Deklination oder örtlichen Störungen.</p>
  </section>;
}
