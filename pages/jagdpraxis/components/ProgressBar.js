import styles from "../../../styles/PracticeElements.module.css";

export default function ProgressBar({ progress }) {
  const value = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  return <div className={styles.progress} role="progressbar" aria-label="Fortschritt der Übung" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className={styles.progressFill} style={{ width: String(value) + "%" }} /></div>;
}
