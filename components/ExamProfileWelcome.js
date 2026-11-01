"use client";
import { useEffect, useRef, useState } from "react";
import LearningToolLayout from "./LearningToolLayout";
import useAccountExamProfile from "../hooks/useAccountExamProfile";
import { getAccountExamSnapshot, loadAccountExamProfile } from "../lib/account-exam-profile-client";
import { examCountries, normalizeExamProfile } from "../lib/exam-profile";
import { getLoginContinuation } from "../lib/login-destination";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import styles from "../styles/ExamProfileWelcome.module.css";

const alwaysCurrent = () => true;
// One full-page step; only the account's confirmed preference completes it.
export default function ExamProfileWelcome({ destination = "/konto", isCurrent = alwaysCurrent, freshLogin = false, inline = false }) {
  const account = useAccountExamProfile();
  const target = getLoginContinuation(destination);
  const [draft, setDraft] = useState({ country: "", region: "" });
  const [notice, setNotice] = useState("");
  const [navigationError, setNavigationError] = useState("");
  const [navigating, setNavigating] = useState(false);
  const mounted = useRef(false), revision = useRef(0), busy = useRef(false);
  const current = useRef({ key: "" });
  const key = JSON.stringify([target, account.accountKey]);
  if (current.current.key !== key || current.current.guard !== isCurrent) current.current = { key, guard: isCurrent };
  const origin = current.current, actionRevision = revision.current;
  const draftRef = useRef(draft); draftRef.current = draft;
  const content = useRef(null), focused = useRef(false), navigation = useRef(null);
  const { focusSelection } = useSelectionPageStart(origin, account.ready);
  const live = () => mounted.current && current.current === origin && isCurrent() && getAccountExamSnapshot().accountKey === account.accountKey;
  function canEdit() {
    const confirmed = getAccountExamSnapshot();
    return live() && account.ready && confirmed.ready && !confirmed.profile && !confirmed.saving && !account.profile && !account.saving && !busy.current && !navigating && revision.current === actionRevision;
  }
  function navigate(retry = false) {
    const confirmed = getAccountExamSnapshot();
    if (!live() || inline || !account.profile || confirmed.phase !== "ready" || confirmed.accountKey !== account.accountKey || !confirmed.profile || (retry && revision.current !== actionRevision) || (!retry && navigation.current === origin)) return;
    navigation.current = origin;
    revision.current++;
    setNavigationError(""); setNavigating(true);
    try { window.location.replace(target); }
    catch { if (live()) { setNavigating(false); setNavigationError("Die nächste Seite konnte nicht geöffnet werden. Bitte erneut versuchen."); } }
  }
  function retryLoad() {
    if (!live() || getAccountExamSnapshot().phase !== "error" || revision.current !== actionRevision) return;
    revision.current++;
    loadAccountExamProfile({ force: true });
  }
  useEffect(() => {
    mounted.current = true;
    loadAccountExamProfile({ force: freshLogin });
    return () => { mounted.current = false; revision.current++; };
  }, []);
  const priorAccount = useRef(null);
  useEffect(() => {
    if (!live()) return;
    if (!account.saving) busy.current = false;
    if (account.ready && account.accountKey) {
      if (priorAccount.current && priorAccount.current !== account.accountKey) {
        revision.current++; draftRef.current = { country: "", region: "" }; setDraft(draftRef.current); setNotice(""); focused.current = false;
      }
      priorAccount.current = account.accountKey;
    }
  }, [account.accountKey, account.ready, account.saving, origin]);
  useEffect(() => {
    if (!live() || !account.ready) return;
    if (account.profile) navigate();
    else if (!focused.current) { focused.current = true; focusSelection(content.current); }
  }, [account.ready, account.profile, origin]);
  function change(field, value) {
    if (!canEdit()) return;
    if (field === "country" && value !== "" && !examCountries.some(country => country.code === value)) return;
    const country = examCountries.find(country => country.code === draftRef.current.country);
    if (field === "region" && value !== "" && !country?.regions.some(region => region.code === value)) return;
    revision.current++;
    const next = field === "country" ? { country: value, region: "" } : { ...draftRef.current, region: value };
    draftRef.current = next; setDraft(next); setNotice("");
  }
  async function save(event) {
    event.preventDefault();
    if (!canEdit()) return;
    const next = normalizeExamProfile(draftRef.current);
    if (!next) { setNotice("Bitte Land und Prüfungsregion wählen."); return; }
    busy.current = true; revision.current++; setNotice("");
    const saved = await account.saveProfile(next);
    if (!live()) return;
    busy.current = false;
    if (!saved) setNotice("Dein Prüfungsziel wurde noch nicht übernommen. Bitte erneut versuchen.");
  }
  const country = examCountries.find(item => item.code === draft.country);
  const locked = account.saving || busy.current || navigating;
  return <LearningToolLayout title="Dein Prüfungsziel" description="Land und Prüfungsregion für deinen persönlichen Lernweg auswählen." category="pruefung-sprache" headingOnly robots="noindex,nofollow">
    {!account.ready ? <section className={styles.content}>
      {account.phase === "signed-out" ? <><p role="alert">{account.error}</p><a className={styles.button} href={`/login?next=${encodeURIComponent(target)}`}>Erneut anmelden</a></> : <>
        <p role={account.phase === "error" ? "alert" : "status"}>{account.error || "Dein Prüfungsziel wird geladen."}</p>
        {account.phase === "error" && <button className={styles.button} type="button" onClick={retryLoad}>Erneut laden</button>}
      </>}
    </section> : account.profile ? <p role="status">Dein gespeichertes Prüfungsziel ist bereit. Du wirst weitergeleitet.</p> : <section ref={content} className={styles.content} aria-label="Prüfungsziel wählen">
      <p>Wo legst du deine Jagdprüfung ab? Wähle zuerst dein Land und den Kanton beziehungsweise das Bundesland. Dein Prüfungsziel verbindet gemeinsames Fachwissen mit dem passenden regionalen Recht.</p>
      <form onSubmit={save} aria-label="Prüfungsziel wählen" aria-busy={locked}>
        <label className={styles.field} htmlFor="exam-welcome-country">Land<select id="exam-welcome-country" value={draft.country} required disabled={locked} onChange={event => change("country", event.target.value)}><option value="">Land wählen</option>{examCountries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <label className={styles.field} htmlFor="exam-welcome-region">{country?.regionLabel || "Kanton / Bundesland"}<select id="exam-welcome-region" value={draft.region} required disabled={locked || !country} onChange={event => change("region", event.target.value)}><option value="">{country ? `${country.regionLabel} wählen` : "Zuerst Land wählen"}</option>{country?.regions.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <p className={styles.privacy}>Die Auswahl wird in deinem Konto gespeichert und ist nach der Anmeldung auch auf anderen Geräten verfügbar. Du kannst sie jederzeit unter Mein Konto → Prüfungsziel oder Menü → Meine Prüfung ändern.</p>
        <p>Die regionalen Rechtsinhalte sind ausgewählte, geprüfte Lerninhalte. Sie ersetzen nicht sämtliche örtlichen Prüfungsunterlagen.</p>
        <button type="submit" className={styles.button} disabled={locked || !normalizeExamProfile(draft)}>{locked ? "Wird gespeichert …" : "Prüfungsziel speichern und weiter"}</button>
        {(notice || account.error) && <p className={styles.message} role="alert">{notice || account.error}</p>}
      </form>
    </section>}
    {navigationError && <section className={styles.message}><p role="alert">{navigationError}</p><button type="button" className={styles.button} onClick={() => { if (live()) navigate(true); }}>Erneut weiter</button></section>}
  </LearningToolLayout>;
}
