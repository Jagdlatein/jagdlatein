import { useState, useEffect } from "react";

export default function JagdrechtCH() {
  const [mode, setMode] = useState("kantone"); // jsg | jsv | kantone | infos
  const [kantone, setKantone] = useState([]);
  const [selectedKanton, setSelectedKanton] = useState("");
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");

  // 1. Kantonsindex laden
  useEffect(() => {
    fetch("/data/jagdrecht/ch/kantone.json")
      .then(r => r.json())
      .then(setKantone);
  }, []);

  // 2. Inhalt dynamisch laden je nach Modus
  useEffect(() => {
    let path = "";

    if (mode === "jsg") path = "/data/jagdrecht/jsg.json";
    if (mode === "jsv") path = "/data/jagdrecht/jsv.json";

    if (mode === "kantone" && selectedKanton) {
      path = `/data/jagdrecht/ch/${selectedKanton}.json`;
    }

    if (!path || mode === "infos") {
      setArticles([]);
      return;
    }

    fetch(path)
      .then(r => r.json())
      .then(setArticles);
  }, [mode, selectedKanton]);

  // Suche
  const filtered = articles.filter(a =>
    (a.title + " " + a.text)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Highlight
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
      <h1 style={styles.h1}>🇨🇭 Schweizer Jagdrecht</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={mode === "jsg" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("jsg"); setSelectedKanton(""); }}
        >
          Bundesgesetz (JSG)
        </button>

        <button
          style={mode === "jsv" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("jsv"); setSelectedKanton(""); }}
        >
          Verordnung (JSV)
        </button>

        <button
          style={mode === "kantone" ? styles.tabActive : styles.tab}
          onClick={() => setMode("kantone")}
        >
          Kantone
        </button>

        <button
          style={mode === "infos" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("infos"); setSelectedKanton(""); }}
        >
          Kantonsinfos
        </button>
      </div>

      {/* Kantonsauswahl */}
      {mode === "kantone" && (
        <select
          value={selectedKanton}
          onChange={(e) => setSelectedKanton(e.target.value)}
          style={styles.select}
        >
          <option value="">Bitte Kanton wählen…</option>
          {kantone.map(k => (
            <option key={k.kurz} value={k.kurz}>
              {k.name} ({k.kurz})
            </option>
          ))}
        </select>
      )}

      {/* Suche */}
      {((mode !== "kantone") || (mode === "kantone" && selectedKanton)) &&
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

      {/* Kantonsinfos */}
      {mode === "infos" && (
        <div style={styles.infoList}>
          {kantone.map(k => (
            <div key={k.kurz} style={styles.infoCard}>
              <h2 style={styles.articleTitle}>{k.name} ({k.kurz})</h2>

              <p><b>Jagdsystem:</b> {k.system}</p>
              <p><b>Prüfung:</b> {k.prüfung}</p>
              <p><b>Besonderheiten:</b> {k.besonderheiten}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 32,
    fontFamily: "system-ui",
  },
  h1: {
    fontSize: 34,
    marginBottom: 20,
    fontWeight: 700,
  },
  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
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
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid #bbb",
    fontSize: 17,
    marginBottom: 20,
    background: "#fff",
  },
  search: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid #bbb",
    fontSize: 17,
    marginBottom: 30,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  card: {
    background: "#fff",
    padding: 18,
    borderRadius: 14,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    borderLeft: "6px solid #caa53b",
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  text: {
    whiteSpace: "pre-line",
    fontSize: 16,
    color: "#333",
  },

  // Infos
  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  infoCard: {
    background: "#fff",
    padding: 18,
    borderRadius: 16,
    border: "3px solid #caa53b",
    boxShadow: "0 0 18px rgba(202,165,59,0.25)",
  },
};
