import { useState } from 'react';
import { soundSpectrograms, soundSpectrogramSources } from '../lib/sound-spectrograms';
import styles from '../styles/SoundSpectrogram.module.css';

export default function SoundSpectrogram({ sound }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const chart = soundSpectrograms[sound.id];
  if (!chart) return null;
  return <details className={styles.panel} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Die Aufnahme als Klangbild ansehen</summary>
    {open && <div className={styles.content}>
      <p>Von links nach rechts vergeht die Zeit, von unten nach oben steigt die Frequenz. Helle Stellen zeigen stärkere Frequenzanteile innerhalb dieser Aufnahme. Höre dazu auf Ruflänge, Pausen und Wiederholungen.</p>
      <figure>{failed ? <p role="status">Das Klangbild konnte nicht geladen werden. Die Originalaufnahme kannst du weiterhin anhören.</p> : <a href={chart.src} target="_blank" rel="noreferrer" aria-label={`Klangbild von ${sound.name} in voller Größe öffnen`}><img src={chart.src} alt={`Gemessenes Spektrogramm der vollständigen ${sound.name}-Aufnahme: Zeit in Sekunden, Frequenz in Kilohertz, relativer Pegel von −80 bis 0 Dezibel.`} width="1296" height="528" onError={() => setFailed(true)} /></a>}<figcaption>{sound.name} · {chart.durationSeconds.toLocaleString('de-CH', { maximumFractionDigits: 1 })} Sekunden · tatsächliche Originalaufnahme, als Grafik berechnet.</figcaption></figure>
      <p>Die Farbskala bezieht sich auf das Maximum dieser Datei. Sie misst keine Lautstärke des Tieres in der Natur. Auch Wind, andere Tiere und Aufnahmegeräusche erscheinen im Bild. Das Klangbild allein ist keine sichere Artbestimmung.</p>
      <details><summary>Berechnung, Grenzen und Quellen</summary>
        <p>Kurze Fourier-Fenster (STFT): {chart.fftSize} Samples, Hann-Fenster, Schritt {chart.hopSize} Samples, Abtastrate {chart.sampleRate.toLocaleString('de-CH')} Hz. Bei mehreren Kanälen werden die Leistungen gemittelt. Ansicht bis {chart.maxFrequencyHz / 1000} kHz. Lange Aufnahmen werden in höchstens 1.000 Zeitspalten zusammengefasst; pro Spalte wird die stärkste Leistung gezeigt. Kurze Ereignisse bleiben sichtbar, feine Zeitdetails können verloren gehen.</p>
        <p>Fenstergröße und Darstellungsauflösung begrenzen, wie fein Zeiten und Frequenzen ablesbar sind. Die Audiodatei bleibt vollständig und unverändert. Grafik: Jagdlatein, aus der Aufnahme von {chart.author}; <a href={chart.licenseUrl} target="_blank" rel="noreferrer">{chart.license}</a>. <a href={chart.sourceUrl} target="_blank" rel="noreferrer">Originalnachweis</a>.</p>
        <ul>{soundSpectrogramSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Fachliche Erläuterung geprüft am 13. Oktober 2026. Die Messgrafik stammt ausschließlich aus der hier verlinkten Audiodatei.</p>
      </details>
    </div>}
  </details>;
}
