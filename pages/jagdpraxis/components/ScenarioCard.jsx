import styles from "../../../styles/PracticeElements.module.css";

export default function ScenarioCard({ title, text }) {
  return <div className={styles.card}><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}
