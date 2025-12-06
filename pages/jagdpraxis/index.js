export default function Jagdpraxis() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 
        style={{
          fontSize: 36,
          marginBottom: 10,
          color: "#1f2b23",
          fontFamily: "Georgia, serif"
        }}
      >
        🦌 Jagdpraxis-Simulator
      </h1>

      <p style={{ color: "#4b4b4b", marginBottom: 28 }}>
        Realistische Jagdszenarien – Schießen oder nicht? Ansprechen, Verhalten, Sicherheit.
      </p>

      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 18, 
          marginTop: 32 
        }}
      >
        {[
          // Bestehende Einträge
          ["ansitz", "🎯 Ansitz-Simulator"],
          ["drueckjagd", "🐗 Drückjagd-Simulator"],
          ["pirsch", "👣 Pirsch-Simulator"],
          ["keiler", "🐗 Keiler-Erkennung"],
          ["schusszeichen", "💥 Schusszeichen-Trainer"],
          ["trefferzonen", "🎯 Trefferzonen-Trainer"],
          ["wild", "🦌 Wildkunde"],
          ["wildansprache", "🦌 Wildansprache-Trainer"],
          ["nachsuche", "🐕 Nachsuche-Simulator"],

          // Erweiterungen
          ["schussfeld", "🎯 Schussfeld-Beurteilung"],
          ["revier", "🌲 Revierkunde & Geländeformen"],
          ["trophäen", "🦌 Trophäenbewertung"],
          ["nachtjagd", "🌙 Nachtjagd-Simulator"],
          ["waermebild", "🔥 Wärmebild-Ansprechen"],
          ["entfernung", "📏 Entfernungsschätzung"],
          ["beschuss", "💥 Kugelfang & Sicherheitstrainer"],
          ["krankeswild", "🩸 Krankes Wild erkennen"],
          ["familienverbaende", "🦌 Wildfamilien & Sozialstrukturen"],
          ["verhalten", "👀 Wildverhalten beurteilen"],
          ["lauscher", "🦌 Lauscher- und Zeichendeutung"],
          ["wind", "💨 Wind & Pirschrichtung"],
          ["mond", "🌕 Mondphasen-Revieraktivität"],
          ["ansprache_rehwild", "🦌 Rehwild-Ansprechen"],
          ["ansprache_schwarzwild", "🐗 Schwarzwild-Ansprechen"],
          ["ansprache_rotwild", "🦌 Rotwild-Ansprechen"],
          ["wildspuren", "👣 Fährten- & Spurenkunde"],
          ["kugelwirkung", "💥 Geschosswirkung-Demo"],
          ["wildalarm", "⚠️ Wild reagiert – was nun?"],
          ["optik", "🔭 Optik richtig nutzen"],
          ["waffenhandhabung", "🔫 Waffenhandhabungs-Simulator"],
        ].map(([slug, label]) => (
          <a
            key={slug}
            href={`/jagdpraxis/${slug}`}
            style={{
              display: "block",
              background: "#fff",
              padding: "14px 20px",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: "600",
              color: "#1f2b23",
              textDecoration: "none",
              borderLeft: "6px solid #caa53b",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.18)";
              e.currentTarget.style.background = "#faf4e4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
              e.currentTarget.style.background = "#fff";
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </main>
  );
}
