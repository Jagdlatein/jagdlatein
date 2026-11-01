import { useEffect, useRef, useState } from "react";
import SoundSpectrogram from "./SoundSpectrogram";
import experienceStyles from "../styles/LearningExperience.module.css";
import styles from "../styles/AnimalSounds.module.css";

export function SoundCredit({ sound, full = true }) {
  return <div className={styles.credit}>
    <span>Aufnahme: {sound.author} · <a href={sound.licenseUrl} target="_blank" rel="noreferrer">{sound.license}</a></span>
    {full && <><span>{sound.recording}</span><span>{sound.modifications}</span><a href={sound.sourceUrl} target="_blank" rel="noreferrer">Originalquelle mit Aufnahme- und Lizenznachweis</a></>}
  </div>;
}

// `scope` and `isCurrent` let a URL-owned reader invalidate callbacks before
// React commits a new view. Existing library/quiz callers keep their old API.
export function SoundPlayer({ sound, label, onPlay, reveal = true, showCredit = true, showSpectrogram = true, scope, isCurrent }) {
  const [failedMedia, setFailedMedia] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const mediaKey = `${sound.id}:${sound.src}`;
  const playback = useRef(null);
  const audio = useRef(null);
  const mounted = useRef(false);
  if (!playback.current || playback.current.mediaKey !== mediaKey || playback.current.attempt !== attempt || playback.current.scope !== scope) {
    playback.current = { mediaKey, attempt, scope };
  }
  const renderedPlayback = playback.current;
  const failed = failedMedia === renderedPlayback;
  function current() {
    if (!mounted.current || playback.current !== renderedPlayback) return false;
    if (typeof isCurrent === "function" && isCurrent() !== true) {
      // An observed departure must not revive if the same address returns
      // before the next render. A current view receives a fresh ticket there.
      playback.current = null;
      return false;
    }
    return true;
  }
  function fail() {
    if (!current()) return;
    setFailedMedia(renderedPlayback);
  }
  function play(event) {
    if (!current()) { event.currentTarget?.pause?.(); return; }
    setFailedMedia(null);
    onPlay?.(event);
  }
  function retry() {
    if (!current()) return;
    // Revoke the old attempt synchronously, before React renders the retry.
    playback.current = null;
    setFailedMedia(null);
    setAttempt(value => value + 1);
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const element = audio.current;
    return () => element?.pause?.();
  }, [mediaKey, attempt, scope]);
  return <div className={styles.player}>
    <audio key={`${mediaKey}-${attempt}`} ref={audio} controls preload="none" aria-label={label} onPlay={play} onError={fail}>
      <source src={sound.src} type="audio/mpeg" onError={fail} />
      Dein Browser kann diese Aufnahme nicht direkt abspielen.
    </audio>
    <p className={styles.duration}>{Math.round(sound.duration)} Sekunden · Originalaufnahme · Start über die Wiedergabetaste</p>
    {failed && <div className={styles.error} role="alert">
      <p>Die Aufnahme konnte nicht abgespielt werden. Prüfe die Verbindung und versuche es erneut.</p>
      <button type="button" className={experienceStyles.secondary} onClick={retry}>Noch einmal laden</button>
      <a href={sound.sourceUrl} target="_blank" rel="noreferrer">Bei der Originalquelle abspielen{!reveal && " (verrät die Art)"}</a>
    </div>}
    {showCredit && <SoundCredit sound={sound} full={reveal} />}
    {reveal && showSpectrogram && <SoundSpectrogram key={sound.id} sound={sound} />}
  </div>;
}

export default SoundPlayer;
