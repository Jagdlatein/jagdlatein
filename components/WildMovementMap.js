import { useId, useState } from "react";
import { formatMovementTimestamp, getWildMovementDataset, movementCountryPaths, movementMapCountries, projectMovementPoint, selectMovementPoints, wildMovementSources } from "../lib/wild-movement";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/MovementDevelopment.module.css";

export function MovementMapGraphic({ points, index }) {
  const uniqueId = useId().replace(/:/g, "");
  const clipId = `movement-clip-${uniqueId}`;
  const selected = points[index] || points[0];
  return <svg viewBox="0 0 760 490" className={styles.map} role="img" aria-labelledby={`movement-title-${uniqueId} movement-description-${uniqueId}`}>
    <title id={`movement-title-${uniqueId}`}>Historische Weißstorch-Messpunkte auf einer vereinfachten Europakarte</title>
    <desc id={`movement-description-${uniqueId}`}>{selected ? `Ausgewählt: ${formatMovementTimestamp(selected.timestamp)}, Länge ${selected.longitude}, Breite ${selected.latitude}. Goldene Punkte liegen zeitlich vor oder bei der Auswahl, graue Punkte danach. Es sind keine Fluglinien eingezeichnet. Alle Messungen sind als Tabelle verfügbar.` : "Keine Messpunkte."}</desc>
    <defs><clipPath id={clipId}><rect width="760" height="490" rx="12" /></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
      <rect width="760" height="490" className={styles.water} />
      {movementMapCountries.map(country => <g key={country.id}>{movementCountryPaths(country.geometry).map((path, part) => <path key={part} d={path} className={country.id === "DEU" || country.id === "CHE" || country.id === "AUT" ? styles.dachLand : styles.land}><title>{country.name}</title></path>)}</g>)}
      {[40, 45, 50].map(latitude => { const start = projectMovementPoint(-3, latitude), end = projectMovementPoint(11.5, latitude); return <g key={latitude}><line className={styles.graticule} x1={start.x} x2={end.x} y1={start.y} y2={end.y} /><text x="8" y={start.y - 5}>{latitude}° N</text></g>; })}
      {[0, 5, 10].map(longitude => { const start = projectMovementPoint(longitude, 38.5), end = projectMovementPoint(longitude, 50.5); return <g key={longitude}><line className={styles.graticule} x1={start.x} x2={end.x} y1={start.y} y2={end.y} /><text x={start.x + 4} y="478">{longitude}°{longitude ? " E" : ""}</text></g>; })}
      {points.map((point, pointIndex) => { const location = projectMovementPoint(point.longitude, point.latitude); return <circle key={point.eventId} cx={location.x} cy={location.y} r={pointIndex === index ? 8 : 3.5} className={pointIndex === index ? styles.currentPoint : pointIndex < index ? styles.pastPoint : styles.futurePoint}><title>{`${formatMovementTimestamp(point.timestamp)} · Originalereignis ${point.eventId}`}</title></circle>; })}
    </g>
  </svg>;
}
export default function WildMovementMap({ selectedId }) {
  const dataset = getWildMovementDataset(selectedId);
  const [sampling, setSampling] = useState("four");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const points = selectMovementPoints(dataset, sampling);
  const safeIndex = Math.min(index, Math.max(0, points.length - 1));
  const current = points[safeIndex];
  function changeSampling(value) {
    if (value !== "four" && value !== "daily") return;
    const previousTime = current?.timestamp;
    const newPoints = selectMovementPoints(dataset, value);
    const exactIndex = newPoints.findIndex(point => point.timestamp === previousTime);
    setSampling(value); setIndex(exactIndex >= 0 ? exactIndex : 0);
  }
  return <article className={shared.panel} id="wildbewegung" aria-labelledby="wildbewegung-heading">
    <p className={shared.eyebrow}>Veröffentlichte Originaldaten · {dataset.observedPeriod}</p><h2 id="wildbewegung-heading">{dataset.title}</h2><p>{dataset.description}</p>
    <p className={styles.dataNote}><strong>Ein Vogel:</strong> {dataset.shortName}. <strong>Projekt:</strong> Südwestdeutschland. Der dargestellte Ausschnitt reicht über Deutschland und die Schweiz nach Frankreich und Spanien.</p>
    <label className={shared.field}>Messungen vergleichen<select value={sampling} onChange={event => changeSampling(event.target.value)}><option value="four">Vier ausgewählte Messungen je Tag · 52 Punkte</option><option value="daily">Eine ausgewählte Messung je Tag · 13 Punkte</option></select></label>
    <figure className={styles.mapFigure}><MovementMapGraphic points={points} index={safeIndex} /><figcaption>Gold: bis zur Auswahl. Grau: spätere Messungen. Großer Punkt: ausgewähltes Originalereignis. Punkte bleiben unverbunden. Kartengrundlage: Natural Earth, stark vereinfachte Länderumrisse; Mercator-Übersicht.</figcaption></figure>
    <label className={styles.timeline}><strong>Messung {safeIndex + 1} von {points.length}</strong><span>{formatMovementTimestamp(current.timestamp)}</span><input type="range" min="0" max={points.length - 1} step="1" value={safeIndex} onChange={event => setIndex(Number(event.target.value))} aria-label="Veröffentlichte Messung auswählen" aria-valuetext={`${safeIndex + 1} von ${points.length}: ${formatMovementTimestamp(current.timestamp)}`} /></label>
    <p className={styles.dataNote}><strong>Veröffentlichte Koordinaten:</strong> {current.latitude}° Breite, {current.longitude}° Länge. <strong>Geräteangabe horizontale Genauigkeitsschätzung:</strong> {current.horizontalAccuracyEstimateMetres === null ? "nicht angegeben" : `${current.horizontalAccuracyEstimateMetres} m`}.</p>
    <p className={shared.muted}>{dataset.timeBasis}</p>
    <div className={styles.factGrid}>{dataset.facts.map(fact => <section key={fact.id}><h3>{fact.title}</h3><p>{fact.text}</p><p className={styles.sourceLinks}>{fact.sourceIds.map(id => <a key={id} href={wildMovementSources[id].url} target="_blank" rel="noopener noreferrer">{wildMovementSources[id].organization}</a>)}</p></section>)}</div>
    <fieldset className={styles.question}><legend>{dataset.question.prompt}</legend>{dataset.question.choices.map((choice, choiceIndex) => <label key={choice}><input type="radio" name={`movement-${dataset.id}`} checked={answer === choiceIndex} onChange={() => setAnswer(choiceIndex)} />{choice}</label>)}{answer !== null && <p className={shared.feedback} role="status"><strong>{answer === dataset.question.answer ? "Richtig eingeordnet. " : "Diese Aussage ist nicht belegt. "}</strong>{dataset.question.explanation}{answer !== dataset.question.answer && ` Passend ist: ${dataset.question.choices[dataset.question.answer]}`}</p>}</fieldset>
    <details className={shared.sources}><summary>Originalwerte, Auswahl und Grenzen</summary><p>{dataset.sampling}</p><p>{dataset.unit}</p><div className={styles.tableWrap}><table><caption>Alle {points.length} in dieser Auswahl gezeigten Originalmessungen</caption><thead><tr><th scope="col">Zeitstempel der Datei</th><th scope="col">Breite</th><th scope="col">Länge</th><th scope="col">Ereignis</th></tr></thead><tbody>{points.map(point => <tr key={point.eventId}><th scope="row">{formatMovementTimestamp(point.timestamp)}</th><td>{point.latitude}</td><td>{point.longitude}</td><td>{point.eventId}</td></tr>)}</tbody></table></div><p><a href="/lernen/bewegung-entwicklung-2026/weissstorch-originalausschnitt.csv">52 unveränderte Originalzeilen als CSV</a> · <a href="/lernen/bewegung-entwicklung-2026/bewegungsdaten-nachweis.json">Auswahlverfahren und Dateinachweise</a> · <a href="/lernen/bewegung-entwicklung-2026/lifetrack-original-readme.txt">README der Datenautoren</a></p><ul>{dataset.boundaries.map(text => <li key={text}>{text}</li>)}</ul></details>
    <details className={shared.sources}><summary>Quellen und fachliche Prüfung</summary><p>Inhaltlich abgeglichen am 13. Oktober 2026. {dataset.publicationState}</p><p><strong>Datenautoren:</strong> {dataset.producer} · <a href={dataset.licenseUrl} target="_blank" rel="noopener noreferrer">{dataset.license}</a>. Die Fachquellen erklären die Methode; sie sind keine zweite Aufnahme dieser Messungen.</p><ul>{Object.entries(wildMovementSources).map(([id, source]) => <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · {source.organization}. {source.role}.</li>)}</ul></details>
  </article>;
}
