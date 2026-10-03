import Link from "next/link";
import { courses, miniCourses } from "../../lib/course-catalog";
import { learningCounts } from "../../lib/learning-curriculum";
import styles from "./kurse.module.css";

export default function KurseOverview() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>

        <h1 className={styles.title}>Jagdlatein – Kurse</h1>

        <p className={styles.subtitle}>
          {miniCourses.length} Mini-Kurse und {learningCounts.modules} ausführliche Lerneinheiten
          für Deutschland, Österreich und die Schweiz. Lerne mit Lektionen, Denkaufgaben und Wissenschecks.
        </p>

        <p>
          <Link href="/lernen" className={styles.learningLink}>
            Neue Lerneinheiten durchsuchen und Lernpfade entdecken →
          </Link>
        </p>
        <p>
          <Link href="/meine-kurse" style={{ color: "#2e4d32", fontWeight: 700 }}>
            Meine Kurse und Abschlüsse ansehen
          </Link>
        </p>

        <div className={styles.list}>
          {courses.map((course) => (
            <Link key={course.id} href={course.href} legacyBehavior>
              <a className={styles.card}>
                <span>
                  <span className={styles.term}>{course.title}</span>
                  <span className={styles.courseMeta}>{course.id.startsWith("wissen-") ? "Ausführliche Lerneinheit" : "Mini-Kurs"} · {course.totalQuestions} Fragen</span>
                </span>
                <span className={styles.arrow}>➜</span>
              </a>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
