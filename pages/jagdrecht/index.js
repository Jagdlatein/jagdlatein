import { useState, useEffect } from "react";

export default function JagdrechtDE() {
  const [mode, setMode] = useState("laender"); // bjagdg | verordnung | laender | infos
  const [laender, setLaender] = useState([]);
  const [selectedLand, setSelectedLand] = useState("");
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");

  // Länderindex laden
  useEffect(() => {
    fetch("/data/jagdrecht/de/laender.json")
      .then(r => r.json())
      .then(setLaender);
  }, []);

  // Inhalt BJagdG / Verordnung / Länderartikel laden
  useEffect(() => {
    let path = "";

    if (mode === "bjagdg") path = "/data/jagdrecht/de/bjagdg.json";
    if (mode === "verordnung") path = "/data/jagdrecht/de/bundesverordnung.json";

    if (mode === "laender" && selectedLand) {
      path = `/data/jagdrecht/de/${selectedLand}.json`;
    }

    if (!path || mode === "infos") {
      setArticles([]);
      return;
    }

    fetch(path)
      .then(r => r.json())
      .then(setArticles);
  }, [mode, selectedLand]);

  // Suche
  const filtered = articles.filter(a =>
    (a.title + " " + a.text).toLowerCase().includes(search.toLowerCase())
  );

  const highlight = (text) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} style={{ backgroundColor: "#ffeb3b" }}>{p}</mark>
        : p
    );
  };

  return (
    <main style={styles.container}>
      <h1 style={styles.h1}>🇩🇪 Deutsches Jagdrecht</h1>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          style={mode === "bjagdg" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("bjagdg"); setSelectedLand(""); }}
        >
          Bundesjagdgesetz (BJagdG)
        </button>

        <button
          style={mode === "verordnung" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("verordnung"); setSelectedLand(""); }}
        >
          Verordnungen
        </button>

        <button
          style={mode === "laender" ? styles.tabActive : styles.tab}
          onClick={() => setMode("laender")}
        >
          Bundesländer
        </button>

        <button
          style={mode === "infos" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("infos"); setSelectedLand(""); }}
        >
          Länderinfos
        </button>
      </div>

      {/* Land Auswahl */}
      {mode === "laender" && (
        <select
          value={selectedLand}
          onChange={(e) => setSelectedLand(e.target.value)}
          style={styles.select}
        >
          <option value="">Bitte Bundesland wählen…</option>
          {laender.map(l => (
            <option key={l.kurz} value={l.kurz}>
              {l.name} ({l.kurz})
            </option>
          ))}
        </select>
      )}

      {/* Suche */}
      {((mode !== "laender") || (mode === "laender" && selectedLand)) &&
        mode !== "infos" && (
          <input
            type="text"
            placeholder="Suchbegriff eingeben…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />
        )}

      {/* Artikel */}
      {mode !== "infos" && (
        <div style={styles.list}>
          {filtered.map(article => (
            <div id={article.id} key={article.id} style={styles.card}>
              <h2 style={styles.articleTitle}>{highlight(article.title)}</h2>
              <p style={styles.text}>{highlight(article.text)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Länderinfos */}
      {mode === "infos" && (
        <div style={styles.infoList}>
          {laender.map(l => (
            <div key={l.kurz} style={styles.infoCard}>
              <h2 style={styles.articleTitle}>{l.name} ({l.kurz})</h2>
              <p><b>Jagsystem:</b> {l.system}</p>
              <p><b>Prüfung:</b> {l.pruefung}</p>
              <p><b>Besonderheiten:</b> {l.besonderheiten}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// Styles 1:1 wie Schweiz, inkl. goldener Rand
const styles = {
  container: { maxWidth: 900, margin: "0 auto", padding: 32, fontFamily: "system-ui" },
  h1: { fontSize: 34, marginBottom: 20, fontWeight: 700 },
  tabs: { display: "flex", gap: 12, marginBottom: 20 },
  tab: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #bbb",
    background: "#f7f7f7",
    fontSize: 16,
    cursor: "pointer",
  },
  tabActive: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #caa53b",
    background: "#caa53b",
    color: "white",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  select: {
    width: "100%", padding: 14, borderRadius: 12, marginBottom: 20,
    border: "1px solid #bbb", fontSize: 17
  },
  search: {
    width: "100%", padding: 14, borderRadius: 12, marginBottom: 30,
    border: "1px solid #bbb", fontSize: 17
  },
  list: { display: "flex", flexDirection: "column", gap: 22 },
  card: {
    background: "#fff", padding: 18, borderRadius: 14,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    borderLeft: "6px solid #caa53b"
  },
  articleTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  text: { whiteSpace: "pre-line", fontSize: 16, color: "#333" },

  // Länderinfos (goldene Premiumkarten)
  infoList: { display: "flex", flexDirection: "column", gap: 18 },
  infoCard: {
    background: "#fff",
    padding: 18,
    borderRadius: 16,
    border: "3px solid #caa53b",
    boxShadow: "0 0 18px rgba(202,165,59,0.25)",
    transition: "0.25s ease",
  },
};
