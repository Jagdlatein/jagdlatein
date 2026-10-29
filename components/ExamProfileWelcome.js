import { useEffect, useRef, useState } from "react";
import LearningToolLayout from "./LearningToolLayout";
import useExamProfile from "../lib/use-exam-profile";
import { examCountries, normalizeExamProfile, getExamProfileDetails } from "../lib/exam-profile";
import { getLoginContinuation } from "../lib/login-destination";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import styles from "../styles/ExamProfileWelcome.module.css";

const alwaysCurrent = () => true;
const emptyDraft = () => ({ country: "", region: "" });
const keyFor = profile => profile ? `${profile.country}:${profile.region}` : "";

// The authenticated login owner mounts this inline after confirming the code.
// This component grants no access and never stores a login code or destination.
export default function ExamProfileWelcome({ destination, isCurrent = alwaysCurrent }) {
  const { profile: storedProfile, ready, persistence, saveProfile } = useExamProfile();
  const profile = normalizeExamProfile(storedProfile);
  const details = getExamProfileDetails(profile);
  const target = getLoginContinuation(destination);
  const profileKey = keyFor(profile);
  const [draft, setDraft] = useState(emptyDraft);
  const [notice, setNotice] = useState("");
  const [navigationError, setNavigationError] = useState("");
  const [, setNavigationAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(false);
  const revision = useRef(0);
  const actionRevision = revision.current;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const pendingSave = useRef(null);
  const key = JSON.stringify([ready, profileKey, persistence, target]);
  const active = useRef({ key, isCurrent });
  if (active.current.key !== key || active.current.isCurrent !== isCurrent) active.current = { key, isCurrent };
  const origin = active.current;
  const content = useRef(null);
  const focusStarted = useRef(false);
  const { focusSelection } = useSelectionPageStart(origin, ready);
  const navigation = useRef({ origin, attempted: false, failed: false });
  if (navigation.current.origin !== origin) navigation.current = { origin, attempted: false, failed: false };

  function live() { return mounted.current && active.current === origin && typeof isCurrent === "function" && isCurrent(); }
  function canEdit() { return live() && ready && !profile && !pendingSave.current && revision.current === actionRevision && !navigation.current.attempted; }
  function navigate({ retry = false } = {}) {
    if (!live() || !ready || typeof window === "undefined") return;
    const job = navigation.current;
    if (job.origin !== origin || (retry ? !job.failed : job.attempted)) return;
    job.attempted = true;
    job.failed = false;
    revision.current++;
    setNavigationAttempt(value => value + 1);
    setNavigationError("");
    try { window.location.replace(target); }
    catch {
      if (!live() || navigation.current !== job) return;
      job.failed = true;
      setNavigationError("Die nächste Seite konnte nicht geöffnet werden. Du kannst es erneut versuchen oder das Ziel direkt öffnen.");
    }
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; revision.current++; pendingSave.current = null; };
  }, []);
  useEffect(() => {
    if (!live() || !ready) return;
    const pending = pendingSave.current;
    if (pending && (pending.target !== target || profileKey === pending.profileKey || origin !== pending.origin)) {
      pendingSave.current = null;
      setSaving(false);
    }
    // Restoration of a valid device preference never paints the choice form.
    // A RAM-only preference must not be presented as surviving a document load.
    if (profile && persistence === "device") navigate();
  }, [ready, profileKey, persistence, target, origin]);
  useEffect(() => {
    if (!live() || !ready || profile || focusStarted.current) return;
    focusStarted.current = true;
    focusSelection(content.current);
  }, [ready, profileKey, origin]);

  function changeCountry(value) {
    if (!canEdit() || (value !== "" && !examCountries.some(country => country.code === value))) return;
    if (draftRef.current.country === value) return;
    revision.current++;
    const next = { country: value, region: "" };
    draftRef.current = next;
    setDraft(next);
    setNotice("");
  }
  function changeRegion(value) {
    if (!canEdit()) return;
    const country = examCountries.find(country => country.code === draftRef.current.country);
    if (value !== "" && !country?.regions.some(region => region.code === value)) return;
    revision.current++;
    const next = { ...draftRef.current, region: value };
    draftRef.current = next;
    setDraft(next);
    setNotice("");
  }
  function save(event) {
    event.preventDefault();
    if (!canEdit()) return;
    const next = normalizeExamProfile(draftRef.current);
    if (!next) { setNotice("Bitte Land und Prüfungsregion wählen."); return; }
    revision.current++;
    pendingSave.current = { profileKey: keyFor(next), target, origin };
    setSaving(true);
    setNotice("");
    if (!saveProfile(next) && live()) {
      pendingSave.current = null;
      setSaving(false);
      setNotice("Dein Prüfungsziel konnte nicht übernommen werden. Bitte versuche es erneut oder wähle es später aus.");
    }
  }
  function skip() { if (canEdit()) navigate(); }
  function continueSession() {
    if (!live() || !ready || !profile || persistence !== "session" || revision.current !== actionRevision) return;
    navigate();
  }
  function retry() {
    if (!live() || revision.current !== actionRevision) return;
    navigate({ retry: true });
  }
  function openDirect(event) {
    if (!live() || !ready || revision.current !== actionRevision) { event.preventDefault(); return; }
    revision.current++;
  }
  const draftCountry = examCountries.find(country => country.code === draft.country);
  const validDraft = Boolean(normalizeExamProfile(draft));
  const locked = saving || navigation.current.attempted;

  return <LearningToolLayout title="Dein Prüfungsziel" description="Wähle dein Land und deine Prüfungsregion für deinen persönlichen Lernweg." category="pruefung-sprache" headingOnly robots="noindex,nofollow">
    {!ready ? <p role="status" className={styles.message}>Dein Prüfungsziel wird geladen.</p> : <>
      {details ? <section className={styles.content} aria-label="Gewähltes Prüfungsziel">
        <h2>{details.region.name} · {details.country.name}</h2>
        {persistence === "device" ? <p role="status">Dein gespeichertes Prüfungsziel ist bereit. Du wirst weitergeleitet.</p> : <>
          <p className={styles.message} role="status">Dein Browser kann das Prüfungsziel nicht dauerhaft speichern. Die Auswahl steht nur auf dieser geöffneten Seite zur Verfügung und kann beim Weitergehen verloren gehen. Wähle sie dann später unter Menü → Meine Prüfung erneut aus.</p>
          <button type="button" className={styles.button} disabled={navigation.current.attempted} onClick={continueSession}>Trotzdem weiter</button>
        </>}
      </section> : <section ref={content} className={styles.content} aria-label="Prüfungsziel wählen">
        <p>Wo möchtest du die Jagdprüfung ablegen? Dein Ziel verbindet das gemeinsame Wissen mit dem passenden regionalen Recht. Du kannst es später unter Menü → Meine Prüfung ändern.</p>
        <form onSubmit={save} aria-label="Prüfungsziel wählen">
          <label className={styles.field} htmlFor="exam-welcome-country">Land<select id="exam-welcome-country" value={draft.country} disabled={locked} onChange={event => changeCountry(event.target.value)}><option value="">Land wählen</option>{examCountries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          <label className={styles.field} htmlFor="exam-welcome-region">{draftCountry?.regionLabel || "Region"}<select id="exam-welcome-region" value={draft.region} disabled={locked || !draftCountry} onChange={event => changeRegion(event.target.value)}><option value="">Region wählen</option>{draftCountry?.regions.map(region => <option key={region.code} value={region.code}>{region.name}</option>)}</select></label>
          <p className={styles.privacy}>Nur Land und Region werden in diesem Browser auf diesem Gerät gespeichert. Es gibt keinen Kontoabgleich mit anderen Geräten. Auf gemeinsam genutzten Geräten können andere Personen dieses Browsers das Ziel sehen.</p>
          <div className={styles.actions}><button type="submit" className={styles.button} disabled={locked || !validDraft}>Speichern und weiter</button><button type="button" className={`${styles.button} ${styles.secondary}`} disabled={locked} onClick={skip}>Später auswählen</button></div>
          {saving && <p role="status">Dein Prüfungsziel wird übernommen.</p>}
          {notice && <p role="status" className={styles.message}>{notice}</p>}
        </form>
      </section>}
      {navigationError && <section className={styles.message} aria-label="Weiterleitung wiederholen"><p role="alert">{navigationError}</p><div className={styles.actions}><button type="button" className={styles.button} onClick={retry}>Erneut weiter</button><a className={`${styles.button} ${styles.secondary}`} href={target} onClick={openDirect}>Ziel direkt öffnen</a></div></section>}
      {!navigationError && navigation.current.attempted && <p className={styles.message}>Falls die nächste Seite nicht öffnet: <a href={target} onClick={openDirect}>Weiter</a></p>}
    </>}
  </LearningToolLayout>;
}
