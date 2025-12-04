import { useState, useEffect } from "react";

export default function JagdrechtCH() {
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

  // 2. Artikel für ausgewählten Kanton laden
  useEffect(() => {
    if (!selectedKanton) {
      setArticles([]);
      return;
    }

    fetch(`/data/jagdrecht/ch/${selectedKanton}.json`)
      .then(r => r.json())
      .then(setArticles);
  }, [selectedKanton]);

  const filtered = articles.filter(a =>
    (a.title + " " + a.text)
      .toLowerCase()
      .includes(search.toLowerCase())
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
      <h1 style={styles.h1}>🇨🇭 Schweizer Jagdrecht – Kantone</h1>

      {/* Kantonsauswahl */}
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

      {/* Suche */}
      {selectedKanton && (
        <input
          type="text"
          placeholder="Suchbegriff eingeben…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      )}

      <div style={styles.list}>
        {filtered.map(article => (
          <div id={article.id} key={article.id} style={styles.card}>
            <h2 style={styles.articleTitle}>{highlight(article.title)}</h2>
            <p style={styles.text}>{highlight(article.text)}</p>
          </div>
        ))}
      </div>
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
};
