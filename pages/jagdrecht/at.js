import { useState, useEffect } from "react";

export default function JagdrechtAT() {
  const [mode, setMode] = useState("bundeslaender"); // bundes | bundeslaender | infos
  const [bundeslaender, setBundeslaender] = useState([]);
  const [selectedBL, setSelectedBL] = useState("");
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");

  // 1. Bundesländerindex laden
  useEffect(() => {
    fetch("/data/jagdrecht/at/bundeslaender.json")
      .then(r => r.json())
      .then(setBundeslaender);
  }, []);

  // 2. Inhalte dynamisch laden
  useEffect(() => {
    let path = "";

    if (mode === "bundes") path = "/data/jagdrecht/at/bundesjagdgesetz.json";

    if (mode === "bundeslaender" && selectedBL) {
      path = `/data/jagdrecht/at/${selectedBL}.json`;
    }

    if (!path || mode === "infos") {
      setArticles([]);
      return;
    }

    fetch(path)
      .then(r => r.json())
      .then(setArticles);
  }, [mode, selectedBL]);

  // Suche / Filter
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
      <h1 style={styles.h1}>🇦🇹 Österreichisches Jagdrecht</h1>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          style={mode === "bundes" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("bundes"); setSelectedBL(""); }}
        >
          Bundesrecht (Jagdgesetz Bund)
        </button>

        <button
          style={mode === "bundeslaender" ? styles.tabActive : styles.tab}
          onClick={() => setMode("bundeslaender")}
        >
          Bundesländer
        </button>

        <button
          style={mode === "infos" ? styles.tabActive : styles.tab}
          onClick={() => { setMode("infos"); setSelectedBL(""); }}
        >
          Länderinfos
        </button>
      </div>

      {/* Bundesländerauswahl */}
      {mode === "bundeslaender" && (
        <select
          value={selectedBL}
          onChange={(e) => setSelectedBL(e.target.value)}
          style={styles.select}
        >
          <option value="">Bitte Bundesland wählen…</option>
          {bundeslaender.map(b => (
            <option key={b.kurz} value={b.kurz}>
              {b.name} ({b.kurz})
            </option>
          ))}
        </select>
      )}

      {/* Suche */}
      {((mode !== "bundeslaender") || (selectedBL)) &&
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
          {bundeslaender.map(b => (
            <div key={b.kurz} style={styles.infoCard}>
              <h2 style={styles.articleTitle}>{b.name} ({b.kurz})</h2>

              <p><b>Jagsystem:</b> {b.system}</p>
              <p><b>Prüfung:</b> {b.pruefung}</p>
              <p><b>Besonderheiten:</b> {b.besonderheiten}</p>
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
