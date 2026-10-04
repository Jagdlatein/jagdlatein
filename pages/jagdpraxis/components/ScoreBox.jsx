import styles from "../../../styles/PracticeElements.module.css";

export default function ScoreBox({ score, max }) {
  return <div className={styles.score}>Punktestand: {score} / {max}</div>;
}
