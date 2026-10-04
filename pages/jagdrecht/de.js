import { useState, useEffect } from "react";
import { readJagdrechtArray, splitLiteralSearch } from "../../lib/jagdrecht-reader";
import layout from "../../styles/JagdrechtTabs.module.css";

export default function JagdrechtDE() {
  const [mode, setMode] = useState("laender");
  const [laender, setLaender] = useState([]);
  const [selectedLand, setSelectedLand] = useState("");
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [indexError, setIndexError] = useState("");
  const [contentError, setContentError] = useState("");
  const [loading, setLoading] = useState(false);

  // Länderindex laden
  useEffect(() => {
    const controller = new AbortController();
    readJagdrechtArray("/data/jagdrecht/de/laender.json", controller.signal, ["kurz", "name", "pruefung"])
      .then(data => { if (!controller.signal.aborted) { setLaender(data); setIndexError(""); } })
      .catch(error => { if (!controller.signal.aborted) setIndexError(error.message); });
    return () => controller.abort();
  }, []);

  // Inhalte laden
  useEffect(() => {
    const controller = new AbortController();
    setArticles([]);
    setContentError("");
    setLoading(false);
    let path = "";

    if (mode === "bjagdg") path = "/data/jagdrecht/de/bjagdg.json";
    if (mode === "verordnung") path = "/data/jagdrecht/de/bundesverordnung.json";

    if (mode === "laender" && selectedLand) {
      path = `/data/jagdrecht/de/${selectedLand}.json`;
    }

    if (!path || mode === "infos") {
      return () => controller.abort();
    }

    setLoading(true);
    readJagdrechtArray(path, controller.signal, ["id", "title", "text", "source"])
      .then(data => { if (!controller.signal.aborted) setArticles(data); })
      .catch(error => { if (!controller.signal.aborted) setContentError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mode, selectedLand]);

  const filtered = articles.filter(a =>
    (a.title + " " + a.text).toLowerCase().includes(search.toLowerCase())
  );

  const highlight = (text) => {
    if (!search) return text;
    const parts = splitLiteralSearch(text, search);
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} style={{ backgroundColor: "#ffeb3b" }}>{p}</mark>
        : p
    );
  };

  return (
    <main lang="de" style={styles.container}>
      <h1 style={styles.h1}>🇩🇪 Deutsches Jagdrecht</h1>
      <p style={{ lineHeight: 1.6 }}>Lernübersichten mit amtlichen Quellen. Für die konkrete Jagd gelten die aktuelle Rechtsfassung und örtliche Vorgaben. Die Karten geben keine vollständigen Gesetzestexte wieder.</p>
      {indexError && <p role="alert">{indexError}</p>}
      {contentError && <p role="alert">{contentError}</p>}
      {loading && <p role="status">Inhalte werden geladen…</p>}

      {/* Tabs */}
      <div className={layout.tabs}>
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

      {/* Länder Auswahl */}
      {mode === "laender" && (
        <select
          aria-label="Region auswählen"
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

      {/* Suchfeld */}
      {mode !== "infos" && (
        <input
          type="text"
          placeholder="Suchbegriff eingeben…"
            aria-label="Rechtsübersichten durchsuchen"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      )}

      {/* Artikelanzeige */}
      {mode !== "infos" && (
        <div style={styles.list}>
          {filtered.map(a => (
            <div key={a.id} style={styles.card}>
              <h2 style={styles.articleTitle}>{highlight(a.title)}</h2>
              <p style={styles.text}>{highlight(a.text)}</p>
              <a href={a.source} target="_blank" rel="noopener noreferrer">Amtliche Quelle öffnen</a>
              <p style={{ fontSize: 13 }}>Lernübersicht geprüft: {a.reviewedOn}</p>
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
              <p><b>Jagdsystem:</b> {l.system}</p>
              <p><b>Prüfung:</b> {l.pruefung}</p>
              <p><b>Hinweise:</b> {l.besonderheiten}</p>
              <a href={l.source} target="_blank" rel="noopener noreferrer">Zuständige Rechtsquellen öffnen</a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// Styling identisch zur Schweiz!
const styles = {
  container: {
    maxWidth: 900, width: "100%", boxSizing: "border-box",
    margin: "0 auto", padding: "24px 16px 96px",
    fontFamily: "system-ui", overflowWrap: "anywhere",
  },
  h1: {
    fontSize: "clamp(26px, 6vw, 34px)",
    margin: "0 0 20px", fontWeight: 700,
  },
  tab: {
    width: "100%", minWidth: 0, minHeight: 56, boxSizing: "border-box",
    whiteSpace: "normal", overflowWrap: "anywhere", hyphens: "auto",
    padding: "10px 12px", borderRadius: 10,
    border: "1px solid #bbb", background: "#f7f7f7",
    fontSize: 16, cursor: "pointer",
  },
  tabActive: {
    width: "100%", minWidth: 0, minHeight: 56, boxSizing: "border-box",
    whiteSpace: "normal", overflowWrap: "anywhere", hyphens: "auto",
    padding: "10px 12px", borderRadius: 10,
    border: "1px solid #caa53b", background: "#caa53b",
    color: "white", fontSize: 16, fontWeight: 600, cursor: "pointer",
  },
  select: {
    width: "100%", maxWidth: "100%", minWidth: 0,
    boxSizing: "border-box", padding: 14, borderRadius: 12,
    border: "1px solid #bbb", fontSize: 17,
    marginBottom: 20, background: "#fff",
  },
  search: {
    width: "100%", maxWidth: "100%", minWidth: 0,
    boxSizing: "border-box", padding: 14, borderRadius: 12,
    border: "1px solid #bbb", fontSize: 17, marginBottom: 30,
  },
  list: { display: "flex", flexDirection: "column", gap: 22 },
  card: {
    background: "#fff", padding: 18, borderRadius: 14,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    borderLeft: "6px solid #caa53b",
  },
  articleTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  text: { whiteSpace: "pre-line", fontSize: 16, color: "#333" },
  infoList: { display: "flex", flexDirection: "column", gap: 18 },
  infoCard: {
    background: "#fff", padding: 18, borderRadius: 16,
    border: "3px solid #caa53b",
    boxShadow: "0 0 18px rgba(202,165,59,0.25)",
    transition: "0.25s ease",
  },
};
