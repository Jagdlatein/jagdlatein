import Link from "next/link";
import { courses } from "../../lib/course-catalog";
import styles from "./kurse.module.css";

export default function KurseOverview() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>

        <h1 className={styles.title}>Jagdlatein – Mini-Kurse</h1>

        <p className={styles.subtitle}>
          Kompakte Lernmodule für Jungjäger und erfahrene Jäger.
          Jeder Kurs ist kurz, praxisnah und schließt mit einem Quiz ab.
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
                <span className={styles.term}>{course.title}</span>
                <span className={styles.arrow}>➜</span>
              </a>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
