import Link from "next/link";

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
    <main className="min-h-screen px-4 py-12 bg-gradient-to-b from-[#faf8f1] to-[#f4efe3]">
      <div className="max-w-3xl mx-auto">
        
        <h1 className="text-3xl font-extrabold mb-3 text-[#1a1a1a]">
          📚 Jagdlatein – Mini-Kurse
        </h1>

        <p className="text-lg text-gray-700 mb-8 max-w-xl">
          Kompakte Lernmodule für Jungjäger und erfahrene Jäger.
          Jeder Kurs ist kurz, praxisnah und schließt mit einem Quiz ab.
        </p>

        <div className="flex flex-col gap-3">
          {kurse.map((kurs, i) => (
            <Link key={i} href={kurs.link}>
              <div className="
                bg-white border border-[#e0ddcf] rounded-xl 
                px-5 py-4 text-[18px]
                flex items-center justify-between
                hover:shadow-md transition-shadow
                cursor-pointer
              ">
                <span>{kurs.name}</span>
                <span className="text-gray-500">➜</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
