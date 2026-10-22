import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import AppIcon from "./AppIcon";
import { PHOTO_GUIDE_GROUPS, PHOTO_GUIDE_REVIEWED_ON, getPhotoGuideMatches } from "../lib/revier-photo-guide";
import {
  prepareRevierPhoto, saveRevierObservation, listRevierObservations,
  deleteRevierObservation, clearRevierObservations, getRevierPhotoErrorMessage,
} from "../lib/revier-photo-storage";
import styles from "../styles/RevierPhotoHelper.module.css";

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function useLocalPhoto(blob) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!blob) { setPreview(null); return; }
    const url = URL.createObjectURL(blob);
    setPreview({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return preview && preview.blob === blob ? preview.url : null;
}

function SavedPhoto({ record }) {
  const url = useLocalPhoto(record.photo);
  return url ? <img src={url} alt="Dein gespeichertes Revierfoto" loading="lazy" /> : null;
}

export function PhotoComparison({ candidate }) {
  return <article className={styles.comparison}>
    <p className={styles.kicker}>Zum Vergleichen</p>
    <h3>{candidate.title}</h3>
    {candidate.scientificName && <p className={styles.scientific}><i>{candidate.scientificName}</i></p>}
    {candidate.facts.map(fact => <p key={fact.id || fact.text}>{fact.text}</p>)}
    <p className={styles.limit}>{candidate.limitations}</p>
    <Link className={styles.learningLink} href={candidate.href}>Im Lernwissen vertiefen <AppIcon name="arrow-right" size={18} /></Link>
    {candidate.question && <details className={styles.question}>
      <summary>Eine Lernfrage dazu</summary>
      <p><strong>{candidate.question.prompt}</strong></p>
      <details><summary>Antwort lesen</summary><p>{candidate.question.answer}</p><p>{candidate.question.explanation}</p></details>
    </details>}
    <details className={styles.sources}>
      <summary>Geprüfte Fachquellen</summary>
      <ul>{candidate.sources.map(source => <li key={source.id || source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      <p>Inhaltlich abgeglichen am {new Intl.DateTimeFormat("de-CH").format(new Date(`${PHOTO_GUIDE_REVIEWED_ON}T12:00:00Z`))}. Die Quellen belegen die Vergleichsmerkmale; sie bestimmen dein Foto nicht.</p>
    </details>
  </article>;
}

export default function RevierPhotoHelper() {
  const [photo, setPhoto] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [group, setGroup] = useState("");
  const [traits, setTraits] = useState([]);
  const [candidateId, setCandidateId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [notice, setNotice] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [journalError, setJournalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [oldIosApp, setOldIosApp] = useState(false);
  const [environmentReady, setEnvironmentReady] = useState(false);
  const mounted = useRef(false), generation = useRef(0), journalGeneration = useRef(0), saveGuard = useRef(false), deleteGuard = useRef(false);
  const cameraInput = useRef(null), photoInput = useRef(null), features = useRef(null);
  const preview = useLocalPhoto(photo?.blob);
  const selectedGroup = PHOTO_GUIDE_GROUPS.find(item => item.id === group);
  const result = useMemo(() => getPhotoGuideMatches({ group, traits }), [group, traits]);
  const matches = result.matches || [];

  useEffect(() => {
    mounted.current = true;
    setDate(localDate());
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setOldIosApp(ios && !/Safari\//.test(navigator.userAgent) && window.jagdlateinPhotoCapture !== true);
    setEnvironmentReady(true);
    return () => { mounted.current = false; generation.current++; journalGeneration.current++; };
  }, []);

  function changeObservation(change) {
    generation.current++;
    setNotice("");
    change();
  }

  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const request = ++generation.current;
    setPreparing(true); setPhotoError(""); setNotice("");
    // A new image never inherits an earlier observation or species label.
    setPhoto(null); setGroup(""); setTraits([]); setCandidateId(""); setNote(""); setDate(localDate());
    try {
      const prepared = await prepareRevierPhoto(file);
      if (!mounted.current || request !== generation.current) return;
      setPhoto(prepared);
      setNotice("Foto bereit. Wähle jetzt die Merkmale, die du selbst erkennst.");
      features.current?.focus();
    } catch (error) {
      if (mounted.current && request === generation.current) setPhotoError(getRevierPhotoErrorMessage(error));
    } finally {
      if (mounted.current && request === generation.current) setPreparing(false);
    }
  }

  function removePhoto() {
    generation.current++; setPreparing(false); setPhoto(null); setGroup(""); setTraits([]); setCandidateId(""); setNote("");
    setPhotoError(""); setNotice("Foto aus dieser Ansicht entfernt. Bereits gespeicherte Beobachtungen bleiben im Tagebuch.");
  }

  async function loadJournal() {
    const request = ++journalGeneration.current;
    setJournalLoading(true); setJournalError("");
    try {
      const rows = await listRevierObservations();
      if (mounted.current && request === journalGeneration.current) setSaved(rows);
    } catch (error) {
      if (mounted.current && request === journalGeneration.current) setJournalError(getRevierPhotoErrorMessage(error));
    } finally {
      if (mounted.current && request === journalGeneration.current) setJournalLoading(false);
    }
  }

  async function saveObservation(event) {
    event.preventDefault();
    if (!photo || preparing || saveGuard.current) return;
    const candidate = matches.find(item => item.id === candidateId);
    saveGuard.current = true; setSaving(true); setJournalError(""); setNotice("");
    const request = generation.current;
    try {
      await saveRevierObservation({ photo: photo.blob, note, observedAt: date, candidateId: candidate?.id || "", candidateLabel: candidate?.title || "" });
      if (!mounted.current) return;
      if (request === generation.current) setNotice("Beobachtung auf diesem Gerät gespeichert. Du findest sie unten in deinem lokalen Tagebuch.");
      if (journalOpen) await loadJournal();
    } catch (error) {
      if (mounted.current) setJournalError(getRevierPhotoErrorMessage(error));
    } finally {
      saveGuard.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  async function removeSaved() {
    if (!deleting || deleteGuard.current) return;
    const target = deleting;
    deleteGuard.current = true; setDeleteBusy(true); setJournalError("");
    try {
      if (target === "all") await clearRevierObservations();
      else await deleteRevierObservation(target);
      if (!mounted.current) return;
      setDeleting(null); setNotice(target === "all" ? "Das lokale Foto-Tagebuch wurde geleert." : "Beobachtung entfernt.");
      await loadJournal();
    } catch (error) {
      if (mounted.current) setJournalError(getRevierPhotoErrorMessage(error));
    } finally {
      deleteGuard.current = false;
      if (mounted.current) setDeleteBusy(false);
    }
  }

  return <LearningToolLayout title="Revier-Fotohelfer" description="Eigene Revierfotos mit geprüften Merkmalen vergleichen und das passende Wissen direkt lesen." icon="camera" category="wildkunde" compact hideCommunity>
    <p className={styles.intro}>Foto auswählen, sichtbare Merkmale anklicken, Wissen lesen. Die Vergleiche folgen deiner Auswahl – das Foto wird nicht automatisch analysiert.</p>
    <section className={styles.photoPanel} aria-labelledby="photo-helper-upload">
      <div className={styles.sectionTitle}><span aria-hidden="true">1</span><h2 id="photo-helper-upload">Dein Revierfoto</h2></div>
      {oldIosApp ? <div className={styles.compatibility}><p>Für Fotos benötigt deine iPhone-/iPad-App die neue Foto-Unterstützung. Bis zum App-Update kannst du den Fotohelfer unter <strong>jagdlatein.de/fotohelfer</strong> in Safari öffnen. Die Merkmalsvergleiche unten funktionieren bereits hier.</p></div> : <>
        <input ref={cameraInput} className={styles.fileInput} type="file" accept="image/*" capture="environment" disabled={!environmentReady || preparing || saving} aria-label="Revierfoto mit der Kamera aufnehmen" onChange={selectPhoto} />
        <input ref={photoInput} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={!environmentReady || preparing || saving} aria-label="Revierfoto aus deinen Dateien auswählen" onChange={selectPhoto} />
        <div className={styles.photoActions}><button type="button" className={styles.primary} disabled={!environmentReady || preparing || saving} onClick={() => cameraInput.current?.click()}><AppIcon name="camera" size={21} />Foto aufnehmen</button><button type="button" className={styles.secondary} disabled={!environmentReady || preparing || saving} onClick={() => photoInput.current?.click()}>Foto auswählen</button></div>
        <p className={styles.small}>JPG, PNG oder WebP, bis 12 MB. Dein Foto bleibt auf diesem Gerät und wird nicht hochgeladen.</p>
      </>}
      {preparing && <p role="status">Foto wird auf deinem Gerät vorbereitet …</p>}
      {photoError && <p role="alert" className={styles.error}>{photoError}</p>}
      {preview && <figure className={styles.preview}><img src={preview} alt="Dein ausgewähltes Revierfoto zum Merkmalsvergleich" /><figcaption><span>Dein Foto · nur auf diesem Gerät</span><button type="button" className={styles.textButton} disabled={saving} onClick={removePhoto}>Foto entfernen</button></figcaption></figure>}
    </section>

    <section className={styles.panel} aria-labelledby="photo-helper-features">
      <div className={styles.sectionTitle}><span aria-hidden="true">2</span><h2 id="photo-helper-features" ref={features} tabIndex={-1}>Was kannst du erkennen?</h2></div>
      <label className={styles.label} htmlFor="photo-helper-group">Tier oder Spur eingrenzen</label>
      <select id="photo-helper-group" value={group} disabled={preparing || saving} onChange={event => changeObservation(() => { setGroup(event.target.value); setTraits([]); setCandidateId(""); })}>
        <option value="">Bitte eine Gruppe wählen</option>{PHOTO_GUIDE_GROUPS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      {selectedGroup && <><p>{selectedGroup.description}</p><fieldset className={styles.traits} disabled={preparing || saving}><legend>Nur eindeutig sichtbare Merkmale auswählen</legend>{selectedGroup.traits.map(trait => <label key={trait.id}><input type="checkbox" checked={traits.includes(trait.id)} onChange={() => changeObservation(() => { setCandidateId(""); setTraits(previous => previous.includes(trait.id) ? previous.filter(id => id !== trait.id) : [...previous, trait.id]); })} /><span><strong>{trait.label}</strong>{trait.help && <small>{trait.help}</small>}</span></label>)}</fieldset></>}
      <p className={styles.small}>Unklare Merkmale lässt du frei. Du kannst die Vergleiche auch ohne eigenes Foto verwenden.</p>
    </section>

    <section className={styles.results} aria-labelledby="photo-helper-results">
      <div className={styles.sectionTitle}><span aria-hidden="true">3</span><h2 id="photo-helper-results">Vergleichen und verstehen</h2></div>
      <p role="status" className={styles.resultStatus}>{result.status === "needs-group" ? "Wähle oben eine Gruppe. Dann siehst du die passenden Merkmale." : result.status === "needs-traits" ? "Wähle mindestens ein sichtbares Merkmal. Die passenden Vergleiche erscheinen hier direkt." : !matches.length ? "Diese Kombination passt zu keinem der hinterlegten Vergleiche. Prüfe deine Auswahl oder suche im Wildartenatlas weiter. Das schließt keine Art sicher aus." : `${matches.length === 1 ? "Ein Vergleich passt" : `${matches.length} Vergleiche passen`} zu deinen gewählten Merkmalen. Das ist noch keine bestätigte Bestimmung deines Fotos.`}</p>
      <div className={styles.comparisonList}>{matches.map(candidate => <PhotoComparison key={candidate.id} candidate={candidate} />)}</div>
      {matches.length > 0 && <p className={styles.limit}>Die Auswahl enthält ausgewählte häufige Wildarten und Spurentypen, nicht alle möglichen Tiere. Weitere Arten können ähnlich aussehen. Eine genaue Alters-, Gesundheits- oder jagdliche Beurteilung wird daraus nicht abgeleitet.</p>}
      <Link href="/wildkunde" className={styles.learningLink}>Alle Wildarten nachschlagen <AppIcon name="arrow-right" size={18} /></Link>
    </section>

    {photo && <details className={styles.panel}>
      <summary>Beobachtung auf diesem Gerät speichern</summary>
      <p>Nur wenn du auf „Beobachtung speichern“ tippst, bleibt eine verkleinerte Kopie im lokalen Tagebuch. Das Original wird nicht verändert. Aufnahme-Metadaten werden nicht übernommen; einen Standort fragt der Fotohelfer nicht ab.</p>
      <form onSubmit={saveObservation} className={styles.saveForm}>
        <label className={styles.label} htmlFor="photo-observed-date">Beobachtungsdatum</label><input id="photo-observed-date" type="date" value={date} required disabled={saving} onChange={event => changeObservation(() => setDate(event.target.value))} />
        <label className={styles.label} htmlFor="photo-observed-candidate">Deine eigene Einordnung</label><select id="photo-observed-candidate" value={candidateId} disabled={saving} onChange={event => changeObservation(() => setCandidateId(event.target.value))}><option value="">Unbestimmt</option>{matches.map(item => <option key={item.id} value={item.id}>{item.title} · eigene Vermutung</option>)}</select>
        <label className={styles.label} htmlFor="photo-observed-note">Notiz (freiwillig)</label><textarea id="photo-observed-note" value={note} maxLength={1000} rows={3} disabled={saving} placeholder="Was hast du selbst beobachtet?" onChange={event => changeObservation(() => setNote(event.target.value))} />
        <p className={styles.small}>Privat auf diesem Gerät, ohne Kontosynchronisierung. Andere Personen mit demselben Browserprofil können die Einträge ebenfalls öffnen. Browserdaten löschen oder eine Deinstallation kann die Einträge entfernen.</p>
        <button className={styles.primary} disabled={saving || preparing} type="submit">{saving ? "Wird gespeichert …" : "Beobachtung speichern"}</button>
      </form>
    </details>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <details className={styles.journal} open={journalOpen} onToggle={event => { const open = event.currentTarget.open; if (open !== journalOpen) { setJournalOpen(open); if (open) loadJournal(); } }}>
      <summary>Mein lokales Foto-Tagebuch</summary>
      <p>Die Einträge gehören zu diesem Gerät und Browserprofil, nicht zu einem Jagdlatein-Konto. Sie bleiben auch nach dem Abmelden erhalten. Höchstens 30 Beobachtungen.</p>
      {journalLoading && <p role="status">Gespeicherte Beobachtungen werden geladen …</p>}
      {!journalLoading && !journalError && !saved.length && <p>Noch keine Beobachtung gespeichert.</p>}
      {journalError && <p role="alert" className={styles.error}>{journalError}</p>}
      <div className={styles.savedList}>{saved.map(record => <article key={record.id} className={styles.savedCard}><SavedPhoto record={record} /><div><p className={styles.small}><time dateTime={record.observedAt}>{new Intl.DateTimeFormat("de-CH").format(new Date(`${record.observedAt}T12:00:00Z`))}</time></p><h3>{record.candidateLabel || "Unbestimmt"}</h3><p className={styles.small}>Eigene Beobachtung, keine bestätigte Bestimmung</p>{record.note && <p className={styles.savedNote}>{record.note}</p>}<button type="button" className={styles.textButton} disabled={deleteBusy || saving} onClick={() => setDeleting(record.id)}>Eintrag entfernen</button></div></article>)}</div>
      {(saved.length > 0 || journalError) && <button type="button" className={styles.textButton} disabled={deleteBusy || saving} onClick={() => setDeleting("all")}>Lokales Foto-Tagebuch leeren</button>}
      {deleting && <div className={styles.deleteConfirm} role="group" aria-label="Löschen bestätigen"><p>{deleting === "all" ? "Alle auf diesem Gerät gespeicherten Foto-Beobachtungen endgültig entfernen?" : "Diese gespeicherte Beobachtung endgültig entfernen?"} Das Originalfoto in deiner Fotoablage bleibt erhalten.</p><div className={styles.photoActions}><button type="button" className={styles.secondary} disabled={deleteBusy} onClick={() => setDeleting(null)}>Behalten</button><button type="button" className={styles.danger} disabled={deleteBusy} onClick={removeSaved}>{deleteBusy ? "Wird entfernt …" : "Endgültig entfernen"}</button></div></div>}
    </details>
    {journalError && !journalOpen && <p role="alert" className={styles.error}>{journalError}</p>}
  </LearningToolLayout>;
}
