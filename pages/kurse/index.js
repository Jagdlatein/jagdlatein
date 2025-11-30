import Link from "next/link";
import styles from "./kurse.module.css";

export default function KurseOverview() {
  const kurse = [
    // Bestehende Kurse
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

    // 🔥 Neue Kurse (NEUE THEMEN!)
    { name: "🦊 Raubwildkunde kompakt", link: "/kurse/raubwild" },
    { name: "🦡 Dachs & Marder verstehen", link: "/kurse/kleinraubwild" },
    { name: "🦅 Greifvögel erkennen", link: "/kurse/greifvoegel" },
    { name: "🦆 Federwild Basics", link: "/kurse/federwild" },
    { name: "🦢 Wasservögel sicher bestimmen", link: "/kurse/wasservoegel" },
    { name: "🧭 Orientierung & Revierpraxis", link: "/kurse/orientierung" },
    { name: "🔍 Trittsiegel Intensivkurs", link: "/kurse/trittsiegel" },
    { name: "🌙 Nachtjagd Grundlagen", link: "/kurse/nachtjagd" },
    { name: "🔭 Wärmebild & Technik kompakt", link: "/kurse/technik" },
    { name: "🎯 Schießtechnik Basics", link: "/kurse/schiessen-basic" },
    { name: "🔥 Schießtechnik Aufbaukurs", link: "/kurse/schiessen-pro" },
    { name: "🪵 Lockjagd Basics", link: "/kurse/lockjagd" },
    { name: "🌾 Wildschäden erkennen", link: "/kurse/wildschaeden" },
    { name: "🧬 Wildbiologie kompakt", link: "/kurse/wildbiologie" },
    { name: "🏕 Tarnung & Ansitz", link: "/kurse/tarnung" }
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
