import styles from "../../../styles/PracticeElements.module.css";

export default function ActionButton({ text, onClick, disabled = false }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={styles.button}>{text}</button>;
}
