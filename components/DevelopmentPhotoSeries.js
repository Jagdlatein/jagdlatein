import { useState } from "react";
import Image from "next/image";
import { developmentSources, getDevelopmentFrame, getDevelopmentPhotoSeries } from "../lib/development-photo-series";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/MovementDevelopment.module.css";

const dateLabel = value => { const [year, month, day] = value.split("-"); return `${day}.${month}.${year}`; };
export default function DevelopmentPhotoSeries({ selectedId }) {
  const series = getDevelopmentPhotoSeries(selectedId);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const frame = getDevelopmentFrame(series, index);
  return <article className={shared.panel} id="pflanzen-entwicklung" aria-labelledby="pflanzen-entwicklung-heading">
    <p className={shared.eyebrow}>Dokumentierte Originalfotoreihe · <i>{series.latin}</i></p><h2 id="pflanzen-entwicklung-heading">{series.title}</h2><p>{series.description}</p>
    <label className={styles.timeline}><strong>Aufnahme {index + 1} von {series.frames.length} · Tag {frame.dayAfterSowing} nach Aussaat</strong><span>{dateLabel(frame.capturedOn)} · {frame.title}</span><input type="range" min="0" max={series.frames.length - 1} step="1" value={index} onChange={event => setIndex(Number(event.target.value))} aria-label="Dokumentierte Eichenaufnahme auswählen" aria-valuetext={`Aufnahme ${index + 1}: Tag ${frame.dayAfterSowing} nach Aussaat, ${dateLabel(frame.capturedOn)}`} /></label>
    <figure className={styles.photoFigure}><div className={styles.photoFrame}><Image src={frame.src} width={frame.width} height={frame.height} alt={frame.alt} className={styles.photo} unoptimized /></div><figcaption><strong>Unmittelbar sichtbar:</strong> {frame.observation}<br />{frame.credit} · <a href={frame.sourceUrl} target="_blank" rel="noopener noreferrer">Original und Tagesangabe</a> · <a href={frame.licenseUrl} target="_blank" rel="noopener noreferrer">Lizenz</a>. Proportionale WebP-Vorschau; vollständiger Bildausschnitt.</figcaption></figure>
    <p className={styles.dataNote}>Die Auswahl springt von Tag 39 zu Tag 221. Dazwischen sind in dieser Ansicht keine Aufnahmen vorhanden. Sie zeigt keine gleichmäßige Wachstumsgeschwindigkeit.</p>
    <div className={styles.factGrid}>{series.facts.map(fact => <section key={fact.id}><h3>{fact.title}</h3><p>{fact.text}</p></section>)}</div>
    <section aria-labelledby="development-scope-heading"><h3 id="development-scope-heading">Was diese Fotoreihe belegt – und was offen bleibt</h3><p>{series.scope}</p><ul>{series.boundaries.map(text => <li key={text}>{text}</li>)}</ul></section>
    <fieldset className={styles.question}><legend>{series.question.prompt}</legend>{series.question.choices.map((choice, choiceIndex) => <label key={choice}><input type="radio" name={`development-${series.id}`} checked={answer === choiceIndex} onChange={() => setAnswer(choiceIndex)} />{choice}</label>)}{answer !== null && <p className={shared.feedback} role="status"><strong>{answer === series.question.answer ? "Richtig eingeordnet. " : "Diese Übertragung ist nicht belegt. "}</strong>{series.question.explanation}{answer !== series.question.answer && ` Passend ist: ${series.question.choices[series.question.answer]}`}</p>}</fieldset>
    <details className={shared.sources}><summary>Alle fünf Aufnahmen vergleichen</summary><div className={styles.comparison}>{series.frames.map(photo => <figure key={photo.id}><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} unoptimized /><figcaption><strong>Tag {photo.dayAfterSowing}</strong><br />{dateLabel(photo.capturedOn)}<br />{photo.credit} · <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">Lizenz</a></figcaption></figure>)}</div></details>
    <details className={shared.sources}><summary>Ergänzende Fachquellen und Bildnachweise</summary><p>Die biologische Einordnung wurde am 13. Oktober 2026 gegen unabhängige Institutionen abgeglichen. Fotografische Identität und Tagesangaben stammen aus der Dokumentation des Urhebers; die Fachquellen bestätigen diese einzelne Fotoreihe nicht als zweite Aufnahme.</p><p>{series.identityEvidence}</p><p><a href="/lernen/bewegung-entwicklung-2026/eichenserie-bildnachweise.json">Urheber, Originaldateien, Lizenzen und Dateinachweise</a></p>{series.facts.map(fact => <section key={fact.id}><h4>{fact.title}</h4><ul>{fact.sourceIds.map(id => <li key={id}><a href={developmentSources[id].url} target="_blank" rel="noopener noreferrer">{developmentSources[id].organization}: {developmentSources[id].title}</a></li>)}</ul></section>)}<p>{frame.modifications}</p></details>
  </article>;
}
