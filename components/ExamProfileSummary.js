import Link from "next/link";
import { getExamProfileDetails, examProfileLawHref } from "../lib/exam-profile";
import useExamProfile from "../lib/use-exam-profile";
import styles from "../styles/ExamStudyPlan.module.css";

// A local preference is an explicit learning target. This summary never changes
// the host page's URL, filters, answers or selection when it is restored.
export default function ExamProfileSummary({ className = "" }) {
  const { profile, ready, persistence } = useExamProfile();
  const details = ready ? getExamProfileDetails(profile) : null;
  return <section className={`${styles.summary} ${className}`} aria-label="Dein Prüfungsziel">
    {details ? <>
      <p><strong>Prüfungsziel: {details.region.name} · {details.country.name}</strong>{persistence === "session" && <span> · nur diese Sitzung</span>}</p>
      <div className={styles.links}><Link href={examProfileLawHref(profile)} prefetch={false}>Regionales Recht</Link><Link href="/lernen/pruefungsplan" prefetch={false}>Prüfungsplan ändern</Link></div>
    </> : <p><Link href="/lernen/pruefungsplan" prefetch={false}>{ready ? "Prüfungsziel wählen" : "Dein Prüfungsplan"}</Link></p>}
  </section>;
}
