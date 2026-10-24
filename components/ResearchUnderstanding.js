import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import WildMovementMap from "./WildMovementMap";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { wildMovementDatasets, getWildMovementDataset } from "../lib/wild-movement";
import { formatResearchValue, getResearchDataset, researchDatasets, researchSources, selectResearchPoints } from "../lib/research-understanding";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/RevierKnowledge.module.css";

export function ResearchChart({ dataset, points }) {
  const width = 780, height = 330, left = 66, right = 20, top = 32, bottom = 82;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const step = plotWidth / Math.max(1, points.length), barWidth = Math.min(78, step * 0.65);
  const ticks = Array.from({ length: 5 }, (_, index) => dataset.scaleMax * index / 4);
  const titleId = `chart-${dataset.id}-title`, descriptionId = `chart-${dataset.id}-description`;
  return <figure><div className={styles.chartWrap}><svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
    <title id={titleId}>{`${dataset.title} · ${dataset.unit}`}</title><desc id={descriptionId}>{`${points.map(point => `${point.label || point.year}: ${formatResearchValue(dataset, point.value)} ${dataset.unit}`).join("; ")}. Eigene Darstellung veröffentlichter Werte; alle Werte auch als Tabelle verfügbar.`}</desc>
    {ticks.map(value => { const y = top + plotHeight * (1 - value / dataset.scaleMax); return <g key={value}><line className={styles.gridline} x1={left} x2={width - right} y1={y} y2={y} /><text x={left - 12} y={y + 4} textAnchor="end">{value.toLocaleString("de-DE")}</text></g>; })}
    <text x={left} y={18}>{dataset.unit}</text>
    {points.map((point, index) => { const x = left + step * (index + 0.5), barHeight = plotHeight * point.value / dataset.scaleMax; return <g key={point.id || point.year}><rect className={styles.bar} x={x - barWidth / 2} y={top + plotHeight - barHeight} width={barWidth} height={barHeight} rx={3} /><text x={x} y={top + plotHeight - barHeight - 9} textAnchor="middle">{formatResearchValue(dataset, point.value)}</text><text x={x} y={height - bottom + 25} textAnchor="middle">{point.label ? (point.id === "roteliste" ? "Rote-Liste-Arten" : point.id === "alle" ? "Regelmäßige Brutvögel" : point.label) : point.year}</text>{point.species && <text x={x} y={height - bottom + 45} textAnchor="middle">{point.species} Arten</text>}</g>; })}
  </svg></div><figcaption className={styles.chartNote}>Eigene Grafik aus veröffentlichten Werten. Balken beginnen bei null; keine geglättete Trendlinie, keine Prognose.{dataset.id === "brutvoegel" && " Vergleich: Mittel 1990–1992 → Mittel 2023–2025. Gruppen können sich überschneiden."}</figcaption></figure>;
}
function DatasetView({ dataset }) {
  const [period, setPeriod] = useState("all");
  const [group, setGroup] = useState("all");
  const [answer, setAnswer] = useState(null);
  const points = selectResearchPoints(dataset, period, group);
  const hasStatusDates = points.some(point => point.statusOn);
  return <article className={shared.panel} id="forschung-inhalt" aria-labelledby="forschung-title">
    <p className={shared.eyebrow}>Originaldaten · {dataset.region}</p><h2 id="forschung-title">{dataset.title}</h2><p>{dataset.description}</p>
    <div className={styles.dataSummary}><p><strong>Erfasst:</strong> {dataset.observedPeriod}</p><p><strong>Einheit:</strong> {dataset.unit}</p></div>
    <div className={styles.range}>{dataset.periods.length > 1 && <label className={shared.field}>Zeitraum<select value={period} onChange={event => { if (dataset.periods.some(item => item.id === event.target.value)) setPeriod(event.target.value); }}>{dataset.periods.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}{dataset.id === "brutvoegel" && <label className={shared.field}>Vogelgruppe<select value={group} onChange={event => { if (event.target.value === "all" || dataset.points.some(item => item.id === event.target.value)) setGroup(event.target.value); }}><option value="all">Alle drei Gruppen vergleichen</option>{dataset.points.map(item => <option key={item.id} value={item.id}>{item.label} ({item.species} Arten)</option>)}</select></label>}</div>
    <ResearchChart dataset={dataset} points={points} />
    <div className={styles.valueTable}><table><caption>In der Grafik gezeigte Originalwerte</caption><thead><tr><th scope="col">{dataset.id === "brutvoegel" ? "Vogelgruppe" : "Jahr"}</th><th scope="col">{dataset.unit}</th>{hasStatusDates && <th scope="col">Bilanzstand</th>}</tr></thead><tbody>{points.map(point => <tr key={point.id || point.year}><th scope="row">{point.label || point.year}{point.species && ` (${point.species} Arten)`}</th><td>{formatResearchValue(dataset, point.value)}</td>{hasStatusDates && <td>{point.statusOn || "—"}</td>}</tr>)}</tbody></table></div>
    <div className={styles.factGrid}><section><h3>Was wurde erfasst?</h3><p>{dataset.method}</p></section><section><h3>Wie liest du das Ergebnis?</h3><p>{dataset.interpretation}</p></section></div>
    {dataset.areaComparison && <div className={styles.valueTable}><table><caption>Zusätzlicher Flächenvergleich: neigungskorrigierte Waldbrandfläche</caption><thead><tr><th scope="col">Jahr</th><th scope="col">Veröffentlichte Fläche</th></tr></thead><tbody>{dataset.areaComparison.map(point => <tr key={point.year}><th scope="row">{point.year}</th><td>{point.approximate ? "rund " : ""}{point.value} Hektar</td></tr>)}</tbody></table></div>}
    <section className={styles.boundary}><h3>Was die Daten nicht beantworten</h3><ul>{dataset.boundaries.map(text => <li key={text}>{text}</li>)}</ul></section>
    <fieldset className={styles.question}><legend>{dataset.question.prompt}</legend><p className={shared.muted}>Eigene Lernfrage zur Interpretation. Eine Antwort wählen.</p>{dataset.question.choices.map((choice, index) => <label key={choice}><input type="radio" name={`research-${dataset.id}`} value={index} checked={answer === index} onChange={() => setAnswer(index)} />{choice}</label>)}{answer !== null && <div className={styles.feedback} role="status"><strong>{answer === dataset.question.answer ? "Richtig eingeordnet." : "Diese Folgerung geht über die Daten hinaus."}</strong><p>{dataset.question.explanation}</p>{answer !== dataset.question.answer && <p><strong>Passend ist:</strong> {dataset.question.choices[dataset.question.answer]}</p>}</div>}</fieldset>
    <details className={shared.sources}><summary>Quellen, Datenstand und fachliche Prüfung</summary><p><strong>Quelle:</strong> {dataset.producer}</p><p><strong>Veröffentlichungsstand:</strong> {dataset.publicationState}</p><p><strong>Fachlich geprüft:</strong> 12. Oktober 2026. Die Originalwerte und die Erklärung ihrer Grenzen wurden getrennt geprüft.</p><p>{dataset.provenance}</p>
      <h3>Originalbelege zu den gezeigten Werten</h3><ul>{points.map(point => { const source = researchSources[point.source || dataset.originalSourceIds[0]]; return <li key={point.id || point.year} data-source-for={`point-${point.id || point.year}`}><strong>{point.label || point.year}{point.species && ` (${point.species} Arten)`}: {formatResearchValue(dataset, point.value)} {dataset.unit}</strong> · <a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}</a>{point.statusOn && ` · Bilanzstand ${point.statusOn}`}</li>; })}</ul>
      {dataset.areaComparison && <><h3>Belege zum Flächenvergleich</h3><ul>{dataset.areaComparison.map(point => <li key={point.year} data-source-for={`area-${point.year}`}><strong>{point.year}: {point.approximate ? "rund " : ""}{point.value} Hektar</strong> · <a href={researchSources[point.source].url} target="_blank" rel="noopener noreferrer">BOKU-Bilanz</a></li>)}</ul></>}
      <p><a href="/lernen/forschung-2026/originaldaten.json" target="_blank" rel="noopener noreferrer">Übernommene Werte mit Herkunft ansehen</a>{dataset.id === "temperatur" && <> · <a href="/lernen/forschung-2026/dwd-gebietsmittel-2026-10-12.txt" target="_blank" rel="noopener noreferrer">DWD-Originaldatei dieses Prüfstands</a></>}</p>
      <h3>Fachquellen</h3><ul>{dataset.sourceIds.map(id => <li key={id}><strong>{researchSources[id].role}:</strong> <a href={researchSources[id].url} target="_blank" rel="noopener noreferrer">{researchSources[id].organization} – {researchSources[id].title}</a></li>)}</ul>
    </details>
  </article>;
}
export default function ResearchUnderstanding() {
  const router = useRouter();
  const [navigationError, setNavigationError] = useState("");
  const content = useRef(null);
  const mounted = useRef(false);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const ready = router.isReady === true;
  const selected = ready && typeof router.query.datensatz === "string" && [...researchDatasets, ...wildMovementDatasets].some(item => item.id === router.query.datensatz) ? router.query.datensatz : null;
  const viewKey = JSON.stringify([ready, selected]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const movement = selected && wildMovementDatasets.some(item => item.id === selected) ? getWildMovementDataset(selected) : null;
  const dataset = selected && !movement ? getResearchDataset(selected) : null;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current += 1; pendingRequest.current = null; };
  }, []);
  function focusContent() {
    const target = content.current?.querySelector?.("h2") || content.current;
    target?.setAttribute?.("tabindex", "-1");
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!selected) {
      const timer = setTimeout(() => openPageMenu("research-choices"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusContent();
  }, [ready, selected]);
  async function select(id) {
    if (!ready || ![...researchDatasets, ...wildMovementDatasets].some(item => item.id === id)) return;
    setNavigationError("");
    closePageMenu();
    if (id === selected && pendingRequest.current === null) { focusContent(); return; }
    const request = ++navigation.current;
    const origin = committedView.current;
    pendingRequest.current = request;
    const hash = wildMovementDatasets.some(item => item.id === id) ? "wildbewegung" : "forschung-inhalt";
    try {
      await router.push({ pathname: "/lernen/forschung-verstehen", query: { ...router.query, datensatz: id }, hash }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Das Forschungsbeispiel konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("research-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  return <LearningToolLayout title="Forschung verstehen" description="Originaldaten aus DACH erkunden: genau lesen, passende Schlüsse ziehen und Grenzen erkennen." category="natur-revier" icon="stats" headingOnly>
    <PageMenu title="Forschung – Beispiel wählen" openInitially={ready && !selected} initialFocusId="research-choices"><div id="research-choices" tabIndex={-1}><label className={shared.field}>Forschungsbeispiel<select id="forschung-datensatz" value={selected || ""} onChange={event => select(event.target.value)} aria-controls={movement ? "wildbewegung" : "forschung-inhalt"}><option value="" disabled>Beispiel wählen</option><optgroup label="Messreihen und Diagramme">{researchDatasets.map(item => <option key={item.id} value={item.id}>{item.title} · {item.region}</option>)}</optgroup><optgroup label="Wildbewegungen auf Karten">{wildMovementDatasets.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup></select></label>{navigationError && <p className={shared.wrong} role="alert">{navigationError}</p>}</div></PageMenu>
    <div ref={content} tabIndex={-1}>{movement ? <WildMovementMap key={movement.id} selectedId={movement.id} hideSelector /> : dataset ? <DatasetView key={dataset.id} dataset={dataset} /> : <p className={shared.note}>{ready && router.query.datensatz !== undefined ? "Dieses Forschungsbeispiel ist nicht verfügbar. " : ""}Wähle ein Beispiel unten im Menü. Hier erscheint nur die ausgewählte Messreihe oder Bewegungskarte.</p>}</div>
  </LearningToolLayout>;
}
