import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useAdminOverview from "../hooks/useAdminOverview";
import { adminOverviewCsv, overviewCell, overviewDate, overviewNumber, OVERVIEW_PRESETS } from "../lib/admin-overview-client";
import styles from "../styles/AdminOverview.module.css";

const labels = { accounts: "Konten", learning: "Lernen", courses: "Kurse", subscriptions: "Abos", payments: "Zahlungen", usage: "Nutzung", community: "Community", system: "Datenstand" };
const statusLabels = { not_configured: "Noch nicht eingerichtet", unavailable: "Gerade nicht verfügbar", not_recorded: "Noch nicht erfasst", not_applicable: "Nicht anwendbar" };

function Series({ section }) {
  const points = section.series || [];
  if (!points.length) return null;
  const known = points.filter(point => point.value !== null);
  const maximum = Math.max(1, ...known.map(point => point.value));
  const width = 600 / points.length;
  const titleId = `admin-series-${section.id}`;
  return <figure className={styles.figure}>
    <figcaption id={titleId}>{section.seriesLabel || "Verlauf pro Tag"}</figcaption>
    {known.length > 0 ? <svg className={styles.chart} viewBox="0 0 640 164" role="img" aria-labelledby={titleId} aria-describedby={`${titleId}-description`}>
      <desc id={`${titleId}-description`}>Tageswerte im gewählten Zeitraum. Fehlende Werte bleiben Lücken. Alle Werte stehen auch in der Tabelle darunter.</desc>
      <line x1="20" x2="620" y1="130" y2="130" className={styles.axis} />
      {points.map((point, index) => point.value === null ? null : <rect key={point.date} x={20 + index * width} y={130 - point.value / maximum * 110} width={Math.max(.7, width - Math.min(3, width / 4))} height={point.value / maximum * 110} className={styles.bar}><title>{`${overviewDate(point.date)}: ${overviewNumber(point.value)}`}</title></rect>)}
      <text x="20" y="151">{overviewDate(points[0].date)}</text>
      <text x="620" y="151" textAnchor="end">{overviewDate(points[points.length - 1].date)}</text>
    </svg> : <p className={styles.muted}>Für diesen Zeitraum sind keine Tageswerte bestätigt.</p>}
    <details className={styles.seriesDetails}>
      <summary>Tageswerte</summary>
      <div className={styles.tableWrap}><table><caption className={styles.srOnly}>{section.seriesLabel || section.title}: Tageswerte</caption><thead><tr><th scope="col">Datum</th><th scope="col">Wert</th></tr></thead><tbody>{points.map(point => <tr key={point.date}><th scope="row">{overviewDate(point.date)}</th><td>{overviewNumber(point.value)}</td></tr>)}</tbody></table></div>
    </details>
  </figure>;
}

function Section({ section }) {
  const ready = section.status === "ready";
  return <section id={`admin-${section.id}`} className={styles.panel} aria-labelledby={`admin-${section.id}-title`}>
    <div className={styles.sectionHeading}><h3 id={`admin-${section.id}-title`}>{labels[section.id]}</h3>{!ready && <span className={styles.badge}>{statusLabels[section.status]}</span>}</div>
    {section.note && <p className={styles.note}>{section.note}</p>}
    {section.metrics.length > 0 && <dl className={styles.metrics}>{section.metrics.map(metric => <div key={metric.key}><dt>{metric.label}</dt><dd>{ready ? overviewNumber(metric.value, metric.format) : "—"}</dd>{metric.note && <p>{metric.note}</p>}</div>)}</dl>}
    {ready && <>
      <Series section={section} />
      {section.rows.length > 0 && <div className={styles.tableWrap}><table><caption className={styles.srOnly}>{section.title}</caption><thead><tr>{section.columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{section.rows.map((row, index) => <tr key={index}>{section.columns.map((column, cell) => cell === 0 ? <th scope="row" key={column.key}>{overviewCell(row[column.key], column, row)}</th> : <td key={column.key}>{overviewCell(row[column.key], column, row)}</td>)}</tr>)}</tbody></table></div>}
    </>}
    {section.id === "subscriptions" && <p className={styles.sectionLink}><Link href="/admin/testabos">Aktive Testabos ansehen</Link></p>}
  </section>;
}

function ErrorNotice({ error, reload }) {
  if (error.status === 401) return <div role="alert" className={styles.notice}><p>Deine Anmeldung ist abgelaufen. Private Auswertungen wurden ausgeblendet.</p><Link href="/login?reauth=1&next=%2Fadmin" className={styles.button}>Erneut anmelden</Link></div>;
  if (error.status === 403) return <div role="alert" className={styles.notice}><p>Diese Auswertung ist nur für das bestehende Betreiberkonto verfügbar.</p><Link href="/konto" className={styles.button}>Zum Konto</Link></div>;
  return <div role="alert" className={styles.notice}><p>{error.code === "REQUEST_TIMEOUT" ? "Das Laden hat zu lange gedauert." : error.code === "INVALID_RESPONSE" ? "Die Antwort konnte nicht sicher zugeordnet werden." : "Die Übersicht ist gerade nicht erreichbar."} Vorherige Werte werden nicht als aktuell angezeigt.</p><button type="button" className={styles.button} onClick={reload}>Erneut versuchen</button></div>;
}

export default function AdminOverview({ testEnvironment = false }) {
  const overview = useAdminOverview(testEnvironment);
  const heading = useRef(null);
  const downloads = useRef(new Map());
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (!overview.focusId || !overview.data || !overview.takeFocus(overview.focusId)) return;
    heading.current?.focus?.({ preventScroll: true });
    if (typeof window !== "undefined") window.scrollTo?.({ left: 0, top: 0, behavior: "instant" });
  }, [overview.focusId, overview.snapshotId, overview.data]);

  useEffect(() => { setExportError(""); }, [overview.snapshotId, overview.error]);
  useEffect(() => () => {
    for (const [url, timer] of downloads.current) { clearTimeout(timer); URL.revokeObjectURL(url); }
    downloads.current.clear();
  }, []);

  function downloadCsv() {
    const snapshot = overview.currentSnapshot();
    if (!snapshot) return;
    let url, anchor;
    try {
      const csv = adminOverviewCsv(snapshot.data, snapshot.filters);
      if (overview.currentSnapshot()?.id !== snapshot.id) return;
      url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Jagdlatein-Auswertung-${snapshot.filters.from}-${snapshot.filters.to}-${snapshot.filters.environment}.csv`;
      if (overview.currentSnapshot()?.id !== snapshot.id) { URL.revokeObjectURL(url); return; }
      document.body.appendChild(anchor);
      anchor.click();
      const owned = url;
      downloads.current.set(owned, setTimeout(() => { URL.revokeObjectURL(owned); downloads.current.delete(owned); }, 1000));
      url = null;
    } catch {
      if (overview.currentSnapshot()?.id === snapshot.id) setExportError("Die CSV konnte nicht heruntergeladen werden. Bitte versuche es erneut.");
    } finally {
      anchor?.remove?.();
      if (url) URL.revokeObjectURL(url);
    }
  }

  return <section className={styles.overview} aria-labelledby="admin-overview-title">
    <div className={styles.heading}><h2 id="admin-overview-title" ref={heading} tabIndex={-1}>Gesamtübersicht</h2><div className={styles.actions}><button type="button" className={styles.secondary} onClick={overview.reload} disabled={!overview.initialized || overview.denied || overview.loading}>Aktualisieren</button><button type="button" className={styles.button} onClick={downloadCsv} disabled={!overview.canExport}>CSV</button></div></div>
    {!overview.denied && <form className={styles.filters} onSubmit={event => { event.preventDefault(); overview.apply(); }}>
      <div className={styles.presets} role="group" aria-label="Zeitraum">{OVERVIEW_PRESETS.map(days => <button type="button" key={days} className={styles.preset} aria-pressed={overview.preset === String(days)} onClick={() => overview.choosePreset(days)} disabled={!overview.initialized}>{days} Tage</button>)}</div>
      <div className={styles.fields}>
        <label>Von<input type="date" value={overview.draft.from} min="2000-01-01" max={overview.today || undefined} onChange={event => overview.change("from", event.target.value)} disabled={!overview.initialized} /></label>
        <label>Bis<input type="date" value={overview.draft.to} min="2000-01-01" max={overview.today || undefined} onChange={event => overview.change("to", event.target.value)} disabled={!overview.initialized} /></label>
        <label>Umgebung<select value={overview.draft.environment} onChange={event => overview.change("environment", event.target.value)} disabled={testEnvironment || !overview.initialized}>{!testEnvironment && <option value="live">Live</option>}<option value="sandbox">Test</option></select></label>
        <button type="submit" className={styles.button} disabled={!overview.initialized}>Anzeigen</button>
      </div>
      <p className={styles.filterHint}>Kalendertage in Schweizer Zeit · höchstens 366 Tage{overview.draft.environment === "sandbox" ? " · Sandbox/TestFlight, keine echten Kundenzahlungen" : ""}</p>
      {overview.validation && <p role="alert" className={styles.notice}>{overview.validation}</p>}
    </form>}
    <div className={styles.results} aria-busy={overview.loading}>
      {overview.loading ? <p role="status" className={styles.status}>Auswertung wird geladen …</p> : overview.error ? <ErrorNotice error={overview.error} reload={overview.reload} /> : overview.data ? <>
        <p role="status" className={styles.status}>{overviewDate(overview.data.period.from)} – {overviewDate(overview.data.period.to)} · {overview.data.environment === "Production" ? "Live" : "Test"}<span>Datenstand: {overviewDate(overview.data.asOf, true)}</span></p>
        <nav className={styles.anchors} aria-label="Auswertungsbereiche">{["usage", "learning", "subscriptions", "payments", "system"].filter(id => overview.data.sections.some(section => section.id === id)).map(id => <a key={id} href={`#admin-${id}`}>{labels[id]}</a>)}</nav>
        {overview.data.sections.length ? overview.data.sections.map(section => <Section key={section.id} section={section} />) : <p className={styles.notice}>Für diese Auswahl ist noch kein Auswertungsbereich bestätigt.</p>}
      </> : <p role="status" className={styles.status}>Wähle „Anzeigen“, um den Zeitraum zu übernehmen.</p>}
    </div>
    {exportError && <p role="alert" className={styles.notice}>{exportError}</p>}
  </section>;
}
