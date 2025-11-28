import Link from "next/link";
import styles from "./kurse.module.css";

export default function KurseOverview() {
  const kurse = [
    { name: "🦌 Wildkunde Basics", link: "/kurse/wildkunde" },
    { name: "📖 Jägersprache 100 Begriffe", link: "/kurse/jaegersprache" },
    { name: "🐗 Schwarzwild verstehen", link: "/kurse/schwarzwild" },
    { name: "👣 Fährten & Spuren", link: "/kurse/faehrten" },
    { name: "🔫 Waffenhandhabung sicher", link: "/kurse/waffen" },
    { name: "🩸 Anschusszeichen lesen", link: "/kurse/anschuss" },
    { name: "🦌 Rehwild ansprechen", link: "/kurse/rehwild" },
    { name: "🦌 Rotwild kompakt", link: "/kurse/rotwild" },
    { name: "🪤 Fallenjagd Basics", link: "/kurse/fallenjagd" },
    { name: "⚠️ Sicherheit im Revier", link: "/kurse/sicherheit" },
    { name: "🌲 Pirsch & Ansitz", link: "/kurse/pirsch" },
    { name: "📚 25 Prüfungstipps", link: "/kurse/pruefung" },
  ];

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>

        <h1 className={styles.title}>Jagdlatein – Mini-Kurse</h1>

        <p className={styles.subtitle}>
          Kompakte Lernmodule für Jungjäger und erfahrene Jäger.
          Jeder Kurs ist kurz, praxisnah und schließt mit einem Quiz ab.
        </p>

        <div className={styles.list}>
          {kurse.map((k, i) => (
            <Link key={i} href={k.link} legacyBehavior>
              <a className={styles.card}>
                <span className={styles.term}>{k.name}</span>
                <span className={styles.arrow}>➜</span>
              </a>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
