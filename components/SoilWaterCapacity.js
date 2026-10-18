import { useId, useState } from "react";
import { calculateSoilWaterCapacity } from "../lib/soil-water-capacity";
import styles from "../styles/SoilWaterCapacity.module.css";

const format = value => new Intl.NumberFormat("de-CH", { maximumFractionDigits: 1 }).format(value);

export default function SoilWaterCapacity({ title = "Wasserspeicher selbst vergleichen" }) {
  const id = useId();
  const [values, setValues] = useState({ fieldCapacity: "30", wiltingPoint: "10", depthCm: "50" });
  const result = calculateSoilWaterCapacity(values);
  const change = key => event => setValues(previous => ({ ...previous, [key]: event.target.value }));
  return <section className={styles.example} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{title}</h3>
    <p id={`${id}-help`}>Eigenes Lernmodell mit einem gleichförmigen, durchwurzelten Bodenprofil. Die Ausgangswerte sind vorgegeben, keine Messwerte.</p>
    <div className={styles.inputs}>
      <label htmlFor={`${id}-fc`}>Feldkapazität (Vol.-%)<input id={`${id}-fc`} type="number" min="0" max="100" step="any" value={values.fieldCapacity} onChange={change("fieldCapacity")} aria-describedby={`${id}-help`} /></label>
      <label htmlFor={`${id}-wp`}>Welkepunkt (Vol.-%)<input id={`${id}-wp`} type="number" min="0" max="100" step="any" value={values.wiltingPoint} onChange={change("wiltingPoint")} aria-describedby={`${id}-help`} /></label>
      <label htmlFor={`${id}-depth`}>Durchwurzelte Tiefe (cm)<input id={`${id}-depth`} type="number" min="0" max="1000" step="any" value={values.depthCm} onChange={change("depthCm")} aria-describedby={`${id}-help`} /></label>
    </div>
    {result.valid ? <>
      <div className={styles.bar} aria-hidden="true"><span className={styles.bound} style={{ width: `${result.wiltingPoint}%` }} /><span className={styles.available} style={{ width: `${result.availablePercent}%` }} /><span className={styles.rest} style={{ width: `${100 - result.fieldCapacity}%` }} /></div>
      <p className={styles.legend}><span><i className={styles.bound} />Wasser am Welkepunkt</span><span><i className={styles.available} />Nutzbarer Speicher</span><span><i className={styles.rest} />Übriges Bodenvolumen</span></p>
      <div className={styles.result} role="status" aria-live="polite" aria-atomic="true">
        <strong>{format(result.capacityMm)} mm</strong><span>rechnerische nutzbare Speicherkapazität im Wurzelraum</span>
        <p>({format(result.fieldCapacity)} − {format(result.wiltingPoint)}) Vol.-% × {format(result.depthCm)} cm ÷ 10 = {format(result.capacityMm)} mm</p>
      </div>
      <p>Die farbigen Anteile beziehen sich auf das Bodenvolumen bei Feldkapazität. Bei gleichem positivem nutzbarem Wasseranteil nimmt die Speichermenge mit der Tiefe zu.</p>
    </> : <p className={styles.error} role="status" aria-live="polite">{result.message}</p>}
    <p className={styles.note}>Gerundetes Rechenbeispiel zur Kapazität, kein aktueller Füllstand. Es bestimmt weder Trockenstress noch einen Bewässerungsbedarf.</p>
  </section>;
}
