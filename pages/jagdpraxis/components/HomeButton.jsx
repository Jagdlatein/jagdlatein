import Link from "next/link";
import AppIcon from "../../../components/AppIcon";
import styles from "../../../styles/PracticeElements.module.css";

export default function HomeButton() {
  return <Link href="/" className={styles.home}><AppIcon name="home" size={18} />Startseite</Link>;
}
