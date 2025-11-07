// pages/quiz/index.js
import prisma from "../../lib/prisma";
import Link from "next/link";

// --- Helpers ---
function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean);
  return [String(x)];
}
function int(v, d = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

export async function getServerSideProps({ query }) {
  const page = int(query.page, 1);
  const pageSize = Math.min(int(query.pageSize, 20), 100);
  const q = (query.q || "").toString().trim();
  const random = query.mode === "random";

  const country = toArray(query.country);
  const category = toArray(query.category);
  const topic = toArray(query.topic);

  const where = {};
  if (country.length) where.country = { in: country };
  if (category.length) where.category = { in: category };
  if (topic.length) where.topic = { in: topic };
  if (q) {
    where.OR = [
      { question: { contains: q, mode: "insensitive" } },
      { option_a: { contains: q, mode: "insensitive" } },
      { option_b: { contains: q, mode: "insensitive" } },
      { option_c: { contains: q, mode: "insensitive" } },
      { option_d: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { topic: { contains: q, mode: "insensitive" } },
    ];
  }

  let total = 0;
  let items = [];
  let filters = { country: [], category: [], topic: [] };
  let error = null;

  try {
    // Anzahl
    total = await prisma.quizQuestion.count({ where });

    // Pagination
    let skip = (page - 1) * pageSize;
    if (random && total > pageSize) {
      skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - pageSize)));
    }

    // Datensätze
    items = await prisma.quizQuestion.findMany({
      where,
      orderBy: random ? undefined : [{ id: "asc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        country: true,
        category: true,
        topic: true,
        question: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        correct: true,
      },
    });

    // Filterlisten stabil laden
    try {
      // bevorzugt groupBy (performant und sauber)
      const [countries, categories, topics] = await Promise.all([
        prisma.quizQuestion.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { country: "asc" } }),
        prisma.quizQuestion.groupBy({ by: ["category"], _count: { _all: true }, orderBy: { category: "asc" } }),
        prisma.quizQuestion.groupBy({ by: ["topic"], _count: { _all: true }, orderBy: { topic: "asc" } }),
      ]);
      filters = {
        country: countries.map((x) => x.country).filter(Boolean),
        category: categories.map((x) => x.category).filter(Boolean),
        topic: topics.map((x) => x.topic).filter(Boolean),
      };
    } catch {
      // Fallback falls groupBy in deiner Umgebung zickt
      const [cAll, catAll, tAll] = await Promise.all([
        prisma.quizQuestion.findMany({ select: { country: true } }),
        prisma.quizQuestion.findMany({ select: { category: true } }),
        prisma.quizQuestion.findMany({ select: { topic: true } }),
      ]);
      const uniq = (arr) => Array.from(new Set(arr)).filter(Boolean).sort((a, b) => a.localeCompare(b));
      filters = {
        country: uniq(cAll.map((x) => x.country)),
        category: uniq(catAll.map((x) => x.category)),
        topic: uniq(tAll.map((x) => x.topic)),
      };
    }
  } catch (e) {
    // Fehler an UI weiterreichen (aber Seite rendert weiter)
    error = String(e?.message || e);
  }

  return {
    props: {
      page,
      pageSize,
      total,
      q,
      random,
      selected: { country, category, topic },
      filters,
      items,
      error,
    },
  };
}

export default function QuizIndex({
  page,
  pageSize,
  total,
  q,
  random,
  selected,
  filters,
  items,
  error,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function qs(next = {}) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    (selected.country || []).forEach((v) => p.append("country", v));
    (selected.category || []).forEach((v) => p.append("category", v));
    (selected.topic || []).forEach((v) => p.append("topic", v));
    if (random) p.set("mode", "random");
    p.set("pageSize", String(pageSize));
    const merged = new URLSearchParams(p);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      merged.set(k, String(v));
    });
    return `?${merged.toString()}`;
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "16px", maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>🧠 Jagdlatein – Quiz</h1>

        {error ? (
          <div style={errorBox}>
            <b>Fehler beim Laden:</b>
            <div style={{ marginTop: 6, fontFamily: "monospace" }}>{error}</div>
            <div style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
              Tipp: <code>DATABASE_URL</code> korrekt? Tabelle <code>QuizQuestion</code> vorhanden?
              Einmal <code>npx prisma db push</code> gegen die Produktions-DB ausführen und erneut laden.
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: "#6b7280" }}>
            {total} Frage(n){q ? ` · Suche: "${q}"` : ""}{random ? " · Zufallsmodus" : ""}
          </p>
        )}

        {/* Such- & Filterleiste */}
        <form method="GET" style={{ display: "grid", gap: 8 }}>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Suche in Frage/Antwort/Kategorie/Thema…"
            style={input}
          />

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
            <select name="country" defaultValue={selected.country?.[0] || ""} style={selectStyle}>
              <option value="">Land (alle)</option>
              {filters.country.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="category" defaultValue={selected.category?.[0] || ""} style={selectStyle}>
              <option value="">Kategorie (alle)</option>
              {filters.category.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="topic" defaultValue={selected.topic?.[0] || ""} style={selectStyle}>
              <option value="">Thema (alle)</option>
              {filters.topic.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select name="pageSize" defaultValue={String(pageSize)} style={selectStyle}>
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / Seite</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={checkboxPill}>
              <input type="checkbox" name="mode" value="random" defaultChecked={random} />
              <span>Zufall</span>
            </label>
            <button type="submit" style={btnPrimary}>Filtern</button>
            <Link href="/quiz" style={btnGhost}>Zurücksetzen</Link>
          </div>
        </form>
      </header>

      {/* Liste */}
      {(!error && items.length === 0) ? (
        <div style={emptyBox}>Keine Einträge gefunden. Filter anpassen oder Import ausführen.</div>
      ) : null}

      {(!error && items.length > 0) ? (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          {items.map((q) => (
            <li key={q.id} style={card}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                #{q.id} · {q.country} · {q.category} · {q.topic}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.question}</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                <li>A) {q.option_a}</li>
                <li>B) {q.option_b}</li>
                <li>C) {q.option_c}</li>
                <li>D) {q.option_d}</li>
              </ul>
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer" }}>Lösung anzeigen</summary>
                <div style={{ marginTop: 6 }}><b>Korrekt:</b> {q.correct}</div>
              </details>
            </li>
          ))}
        </ol>
      ) : null}

      {/* Pagination */}
      {!error && total > 0 && (
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            Seite {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={page > 1 ? qs({ page: page - 1 }) : "#"} aria-disabled={page <= 1} style={btnGhost}>
              ← Zurück
            </Link>
            <Link href={page < Math.ceil(total / pageSize) ? qs({ page: page + 1 }) : "#"} aria-disabled={page >= Math.ceil(total / pageSize)} style={btnGhost}>
              Weiter →
            </Link>
          </div>
        </nav>
      )}

      {/* Fuß-Menü */}
      <footer style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" style={linkMuted}>Start</Link>
        <Link href="/preise" style={linkMuted}>Preise</Link>
        <Link href="/kontakt" style={linkMuted}>Kontakt</Link>
      </footer>
    </main>
  );
}

// --- Inline Styles ---
const input = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#fff",
};
const selectStyle = { ...input };
const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  textDecoration: "none",
};
const btnGhost = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
  textDecoration: "none",
};
const checkboxPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #d1d5db",
  padding: "8px 12px",
  borderRadius: 999,
  background: "#fff",
};
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
};
const emptyBox = {
  border: "1px dashed #d1d5db",
  borderRadius: 12,
  padding: 20,
  textAlign: "center",
  color: "#6b7280",
};
const linkMuted = {
  color: "#6b7280",
  textDecoration: "none",
};
const errorBox = {
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#7f1d1d",
  padding: 12,
  borderRadius: 8,
};

// Ende der Datei
