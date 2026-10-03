import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getLearningModule, learningCategories, learningCounts, learningModules, learningPaths } from "../../lib/learning-curriculum";
import styles from "../../styles/LearningOverview.module.css";

const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss");
}

export default function LearningOverview() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const search = normalize(query.trim());
  const visible = learningModules.filter((module) => (
    (category === "all" || module.category === category)
    && (country === "all" || module.countries.includes(country))
    && (!search || normalize([module.title, module.description, ...module.lessons.map((lesson) => lesson.title)].join(" ")).includes(search))
  ));
  const visibleIds = new Set(visible.map((module) => module.id));
  const paths = learningPaths.map((path) => {
    const allModules = path.moduleIds.map((id, index) => ({ module: getLearningModule(id), position: index + 1 })).filter((entry) => entry.module);
    return { ...path, total: allModules.length, modules: allModules.filter((entry) => visibleIds.has(entry.module.id)) };
  }).filter((path) => path.modules.length > 0);
  const filtered = Boolean(query || category !== "all" || country !== "all");

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setCountry("all");
  }

  return (
    <>
      <Head>
        <title>Lernbereich – Jagdlatein</title>
        <meta name="description" content="Lerne Jagdwissen für Deutschland, Österreich und die Schweiz mit Lektionen, Wissenschecks und persönlichen Kursabschlüssen." />
      </Head>
      <main className={styles.main}>
        <div className={styles.wrap}>
          <nav className={styles.nav} aria-label="Lernmenü">
            <Link href="/kurse">Alle Kurse</Link>
            <Link href="/meine-kurse">Meine Kurse</Link>
            <Link href="/auswertungen">Auswertungen</Link>
            <Link href="/">Startseite</Link>
          </nav>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Schritt für Schritt zum Jagdwissen</p>
            <h1>Dein Lernbereich</h1>
            <p className={styles.intro}>Vertiefe dein Wissen mit ausführlichen Lektionen, praktischen Denkaufgaben und Wissenschecks. Wähle einzelne Themen oder folge einem Lernpfad für Deutschland, Österreich oder die Schweiz.</p>
            <dl className={styles.counts}>
              <div><dt>Lerneinheiten</dt><dd>{learningCounts.modules}</dd></div>
              <div><dt>Lektionen</dt><dd>{learningCounts.lessons}</dd></div>
              <div><dt>Übungsfragen</dt><dd>{learningCounts.questions}</dd></div>
            </dl>
          </header>
          <section className={styles.filterCard} aria-labelledby="learning-search-heading">
            <h2 id="learning-search-heading">Finde dein nächstes Lernthema</h2>
            <div className={styles.filters}>
              <div className={styles.searchField}>
                <label htmlFor="learning-search">Thema suchen</label>
                <input id="learning-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zum Beispiel Wildkunde oder Nachsuche" />
              </div>
              <div>
                <label htmlFor="learning-category">Kategorie</label>
                <select id="learning-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="all">Alle Kategorien</option>
                  {learningCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="learning-country">Land</label>
                <select id="learning-country" value={country} onChange={(event) => setCountry(event.target.value)}>
                  <option value="all">Alle Länder</option>
                  {Object.entries(countryNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.filterStatus}>
              <p role="status" aria-live="polite">{visible.length} von {learningModules.length} Lerneinheiten {filtered ? "passen zu deiner Auswahl" : "stehen für dich bereit"}.</p>
              {filtered && <button type="button" className={styles.textButton} onClick={resetFilters}>Auswahl zurücksetzen</button>}
            </div>
          </section>
          {visible.length === 0 ? (
            <section className={styles.empty} aria-labelledby="learning-empty-heading">
              <h2 id="learning-empty-heading">Keine Lerneinheiten gefunden</h2>
              <p>Versuche einen anderen Suchbegriff oder wähle eine andere Kategorie beziehungsweise ein anderes Land.</p>
              <button type="button" className={styles.button} onClick={resetFilters}>Alle Lerneinheiten anzeigen</button>
            </section>
          ) : (
            <>
              {paths.length > 0 && <section aria-labelledby="learning-paths-heading" className={styles.section}>
                <h2 id="learning-paths-heading">Deine Lernpfade</h2>
                <p className={styles.muted}>Diese Reihenfolgen helfen dir beim Einstieg. Du kannst jederzeit eine einzelne Lerneinheit öffnen. Deine Auswahl oben gilt auch für die Lernpfade.</p>
                <div className={styles.pathGrid}>
                  {paths.map((path) => <article key={path.id} className={styles.pathCard}>
                    <h3>{path.title}</h3>
                    <p className={styles.muted}>{path.description}</p>
                    {path.modules.length < path.total && <p className={styles.pathHint}>{path.modules.length} von {path.total} Lerneinheiten passen zu deiner Auswahl. Die ursprüngliche Reihenfolge bleibt erhalten.</p>}
                    <ol className={styles.pathModules}>
                      {path.modules.map(({ module, position }) => <li key={module.id} value={position}><Link href={`/kurse/${module.id}`}>{module.title}</Link></li>)}
                    </ol>
                  </article>)}
                </div>
              </section>}
              <section className={styles.section} aria-labelledby="learning-modules-heading">
                <h2 id="learning-modules-heading">{filtered ? "Passende Lerneinheiten" : "Alle Lerneinheiten"}</h2>
                <div className={styles.moduleGrid}>
                  {visible.map((module) => <article key={module.id} className={styles.moduleCard}>
                    <div className={styles.tags}><span>{module.category}</span><span>{module.level}</span></div>
                    <h3>{module.title}</h3>
                    <p className={styles.muted}>{module.description}</p>
                    <p className={styles.countries}>{module.countries.map((item) => countryNames[item] || item).join(" · ")}</p>
                    <p className={styles.moduleFacts}>{module.lessons.length} Lektionen · {module.questions.length} Fragen · etwa {module.minutes} Minuten</p>
                    <ul className={styles.lessonPreview}>{module.lessons.slice(0, 3).map((lesson) => <li key={lesson.id}>{lesson.title}</li>)}</ul>
                    <Link href={`/kurse/${module.id}`} className={styles.button} aria-label={`Lerneinheit öffnen: ${module.title}`}>Lerneinheit öffnen</Link>
                  </article>)}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
