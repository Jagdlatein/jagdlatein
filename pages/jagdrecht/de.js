import { useState, useEffect } from "react";

export default function JagdrechtDE() {
  const [mode, setMode] = useState("laender");
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

  // Inhalte laden
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

    fetch(path).then(r => r.json()).then(setArticles);
  }, [mode, selectedLand]);

  const filtered = articles.filter(a =>
    (a.title + " " + a.text).toLowerCase().includes(search.toLowerCase())
  );

  const highlight = (text) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i}>{p}</mark>
        : p
    );
  };

  return (
    <main style={styles.container}>
      <h1 style={styles.h1}>🇩🇪 Deutsches Jagdrecht</h1>

      <div style={styles.tabs}>
        <button
          style={mode === "bjagdg" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("bjagdg"); setSelectedLand(""); }}
        >
          BJagdG
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

      {mode !== "infos" && (
        <input
          type="text"
          placeholder="Suchbegriff eingeben…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      )}

      {mode !== "infos" && (
        <div style={styles.list}>
          {filtered.map(a => (
            <div key={a.id} style={styles.card}>
              <h2>{highlight(a.title)}</h2>
              <p>{highlight(a.text)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles = {
  container: { maxWidth: 900, margin: "0 auto", padding: 32 },
  h1: { fontSize: 34, marginBottom: 20 },
  tabs: { display: "flex", gap: 12, marginBottom: 20 },
  tab: { padding: "10px 16px", borderRadius: 10, border: "1px solid #bbb" },
  tabActive: {
    padding: "10px 16px",
    borderRadius: 10,
    background: "#caa53b",
    color: "white",
    border: "1px solid #caa53b"
  },
  select: { width: "100%", padding: 14, borderRadius: 12, marginBottom: 20 },
  search: { width: "100%", padding: 14, borderRadius: 12, marginBottom: 20 },
  list: { display: "flex", flexDirection: "column", gap: 20 },
  card: { padding: 18, borderLeft: "6px solid #caa53b", background: "#fff" }
};
