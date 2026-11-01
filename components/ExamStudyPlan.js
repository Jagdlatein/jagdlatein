import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import ExamRegionPreparation from "./ExamRegionPreparation";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import useExamProfile from "../lib/use-exam-profile";
import { getAccountExamSnapshot } from "../lib/account-exam-profile-client";
import useExamReviewProgress from "../lib/use-exam-review-progress";
import { examReviewHref } from "../lib/exam-review-progress";
import { examCountries, normalizeExamProfile, getExamProfileDetails, examProfileLawHref } from "../lib/exam-profile";
import styles from "../styles/ExamStudyPlan.module.css";

const emptyDraft = () => ({ country: "", region: "" });
const profileKey = profile => profile ? `${profile.country}:${profile.region}` : "";
const resourceLabels = { "official-catalog": "Amtlicher Originalkatalog", "official-sample": "Amtliches Übungsangebot", "exam-rules": "Prüfungsregel oder Behördeninformation" };
const formatDate = date => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split("-").reverse().join(".") : "nicht angegeben";

function Sources({ region, federal, alignment }) {
  const groups = [{ name: region.name, sources: region.sources, resources: region.examResources }];
  if (region.includesFederal && federal) groups.push({ name: federal.name, sources: federal.sources, resources: federal.examResources });
  return <details className={styles.sources} id="exam-plan-sources">
    <summary>Originalquellen und Prüfungsunterlagen · {region.name}</summary>
    <p>Die Prüfstände stammen aus den bestehenden Rechtsnachweisen. Sie sind keine neue vollständige Prüfung der Unterlagen und keine Zusage künftiger Prüfungsfragen.</p>
    {alignment?.sources?.length > 0 && <section aria-labelledby="exam-plan-framework-sources">
      <h3 id="exam-plan-framework-sources">Nachweise zum Prüfungsrahmen</h3>
      <p>Am 1. November 2026 wurden die hier bezeichneten Abschnitte abgeglichen. Die Einordnung betrifft ausgewählte Prüfungsbausteine; sie ist keine vollständige Prüfung aller Zulassungs-, Bewertungs- und Anerkennungsregeln. Verbandsangaben sind eigenständig verfasste Erläuterungen und keine amtlichen Originalkataloge.</p>
      <ul>{alignment.sources.map(source => <li key={source.id}>
        <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
        <small>{source.publisher} · {source.kind === "norm" ? "Originalregelung" : source.kind === "norm-copy" ? "Originalnorm in bereitgestellter Kopie" : source.kind === "independent-explanation" ? "Eigenständige Erläuterung" : source.kind === "official-explanation" ? "Behördeninformation" : "Ergänzende Einordnung"} · Abschnittsabgleich {formatDate(source.reviewedOn)}</small>
        <p>{source.section}</p>
        {alignment.formats.some(format => format.sourceIds.includes(source.id)) && <p>Zuordnung: {alignment.formats.filter(format => format.sourceIds.includes(source.id)).map(format => format.label).join(" · ")}</p>}
      </li>)}</ul>
    </section>}
    {groups.map(group => <section key={group.name} aria-label={group.name}>
      <h3>{group.name}</h3>
      <ul>{group.sources.map(source => <li key={`${source.url}:${source.publisher}`}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small>{source.publisher} · übernommener Prüfstand {formatDate(source.reviewedOn)}</small></li>)}</ul>
      {group.resources.length > 0 && <><h3>Prüfungsunterlagen</h3><ul>{group.resources.map(resource => <li key={`${resource.url}:${resource.kind}`}><a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a><small>{resourceLabels[resource.kind]} · {resource.publisher} · übernommener Prüfstand {formatDate(resource.reviewedOn)}</small>{resource.notes && <p>{resource.notes}</p>}</li>)}</ul></>}
    </section>)}
  </details>;
}

export default function ExamStudyPlan({ data, reviewCatalog, examAlignment }) {
  const { profile: storedProfile, ready, persistence, saveProfile, clearProfile, saving: accountSaving, error: accountError, accountKey } = useExamProfile();
  const progress = useExamReviewProgress(reviewCatalog);
  const profile = normalizeExamProfile(storedProfile);
  const details = getExamProfileDetails(profile);
  const key = profileKey(profile);
  const [draft, setDraft] = useState(emptyDraft);
  const [notice, setNotice] = useState("");
  const [saveRequest, setSaveRequest] = useState(0);
  const mounted = useRef(false);
  const saving = useRef(false);
  const initialized = useRef(false);
  const dirty = useRef(false);
  const draftRevision = useRef(0);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const pendingFocus = useRef(null);
  const activeProfile = useRef({ key });
  if (activeProfile.current.key !== key) activeProfile.current = { key };
  const origin = activeProfile.current;
  const revision = draftRevision.current;
  const heading = useRef(null);
  const { focusSelection } = useSelectionPageStart(origin, ready);
  function current() {
    const confirmed = getAccountExamSnapshot();
    return mounted.current && ready && !saving.current && !accountSaving && activeProfile.current === origin && draftRevision.current === revision
      && (persistence !== "account" || (confirmed.ready && confirmed.accountKey === accountKey && !confirmed.saving && profileKey(confirmed.profile) === key));
  }

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; draftRevision.current++; pendingFocus.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Storage restoration and other live profile consumers may update the
    // selected target. A draft the person is editing always remains a draft.
    if (!initialized.current || !dirty.current) {
      initialized.current = true;
      draftRevision.current++;
      const next = profile || emptyDraft();
      draftRef.current = next;
      setDraft(next);
    }
  }, [ready, key]);
  useEffect(() => {
    if (!ready || pendingFocus.current?.key !== key || !mounted.current) return;
    pendingFocus.current = null;
    closePageMenu();
    focusSelection(heading.current);
  }, [ready, key, saveRequest, origin]);

  function changeCountry(value) {
    if (!current() || (value !== "" && !examCountries.some(country => country.code === value))) return;
    if (draftRef.current.country === value) return;
    pendingFocus.current = null;
    dirty.current = true;
    draftRevision.current++;
    const next = { country: value, region: "" };
    draftRef.current = next;
    setDraft(next);
    setNotice("");
  }
  function changeRegion(value) {
    if (!current()) return;
    const country = examCountries.find(item => item.code === draftRef.current.country);
    if (value !== "" && !country?.regions.some(region => region.code === value)) return;
    pendingFocus.current = null;
    dirty.current = true;
    draftRevision.current++;
    const next = { ...draftRef.current, region: value };
    draftRef.current = next;
    setDraft(next);
    setNotice("");
  }
  async function save(event) {
    event?.preventDefault();
    if (!current()) return;
    const next = normalizeExamProfile(draftRef.current);
    if (!next) { setNotice("Bitte Land und Prüfungsregion wählen."); return; }
    pendingFocus.current = { key: profileKey(next) };
    saving.current = true;
    let result;
    try { result = saveProfile(next); if (result && typeof result.then === "function") result = await result; }
    catch { result = false; }
    finally { saving.current = false; }
    if (!mounted.current) return;
    if (persistence === "account" && getAccountExamSnapshot().accountKey !== accountKey) { pendingFocus.current = null; return; }
    if (!result) { pendingFocus.current = null; setNotice("Das Prüfungsziel konnte nicht übernommen werden. Bitte erneut wählen."); return; }
    dirty.current = false;
    draftRevision.current++;
    setNotice("Prüfungsziel übernommen.");
    setSaveRequest(value => value + 1);
  }
  function clear() {
    if (!current()) return;
    pendingFocus.current = { key: "" };
    if (!clearProfile()) { pendingFocus.current = null; setNotice("Das Prüfungsziel konnte nicht entfernt werden."); return; }
    dirty.current = false;
    draftRevision.current++;
    draftRef.current = emptyDraft();
    setDraft(draftRef.current);
    setNotice("Prüfungsziel entfernt. Dein Lernwissen und bisherige Antworten bleiben erhalten.");
    setSaveRequest(value => value + 1);
  }
  function openSelection() { if (mounted.current && ready && activeProfile.current === origin) openPageMenu("exam-plan-country"); }
  const draftCountry = examCountries.find(country => country.code === draft.country);
  const countryData = data.countries.find(country => country.code === profile?.country);
  const regionData = countryData?.regions.find(region => region.code === profile?.region);
  const alignment = ready && profile ? examAlignment?.regions?.find(item => item.country === profile.country && item.region === profile.region) : null;
  const isDraftValid = Boolean(normalizeExamProfile(draft));

  return <LearningToolLayout title="Dein Prüfungsplan" description="Wissen, regionale Rechtsübungen und praktische Ausbildung für dein bewusst gewähltes Prüfungsziel verbinden." icon="book" category="pruefung-sprache" headingOnly robots="noindex,follow">
    <PageMenu title="Prüfungsziel">
      <form onSubmit={save} aria-label="Prüfungsziel wählen">
        <label className={styles.field} htmlFor="exam-plan-country">Land<select id="exam-plan-country" value={draft.country} disabled={!ready || accountSaving} onChange={event => changeCountry(event.target.value)}><option value="">Land wählen</option>{examCountries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label className={styles.field} htmlFor="exam-plan-region">{draftCountry?.regionLabel || "Region"}<select id="exam-plan-region" value={draft.region} disabled={!ready || !draftCountry || accountSaving} onChange={event => changeRegion(event.target.value)}><option value="">Region wählen</option>{draftCountry?.regions.map(region => <option key={region.code} value={region.code}>{region.name}</option>)}</select></label>
        <p className={styles.menuHint}>Die Auswahl ist zunächst ein Entwurf. Erst „Prüfungsziel speichern“ übernimmt sie. Deine bisherigen Antworten und andere geöffnete Lernansichten bleiben erhalten.</p>
        <div className={styles.actions}><button type="submit" className={styles.button} disabled={!ready || !isDraftValid || accountSaving}>{accountSaving ? "Wird gespeichert …" : "Prüfungsziel speichern"}</button>{profile && persistence !== "account" && <button type="button" className={`${styles.button} ${styles.secondary}`} disabled={!ready} onClick={clear}>Prüfungsziel entfernen</button>}</div>
      </form>
    </PageMenu>

    <section className={styles.section} aria-labelledby="exam-plan-target">
      <h2 ref={heading} id="exam-plan-target" tabIndex={-1}>{details ? `${details.region.name} · ${details.country.name}` : "Dein Prüfungsziel"}</h2>
      <p className={styles.lead}>{details ? "Dein Lernweg verbindet gemeinsames Fachwissen mit den Rechtsübungen deiner gewählten Region." : ready ? "Wähle dein Land und deine Prüfungsregion unten im Menü. Die gemeinsamen Lernkategorien kannst du bereits hier nutzen." : "Dein lokal gespeichertes Prüfungsziel wird geladen. Die gemeinsamen Lernkategorien stehen dir bereits zur Verfügung."}</p>
      <button type="button" className={`${styles.button} ${styles.secondary}`} disabled={!ready} onClick={openSelection}>{details ? "Prüfungsziel ändern" : "Prüfungsziel wählen"}</button>
      {ready && <p className={styles.note}>{persistence === "account" ? "Dein Prüfungsziel ist in deinem Konto gespeichert und nach der Anmeldung auch auf anderen Geräten verfügbar. Eine Änderung gilt für deine künftige Auswahl; bereits ausdrücklich geöffnete Rechtsansichten bleiben erhalten." : persistence === "device" ? "Dein Prüfungsziel ist eine lokale Geräteauswahl." : "Dein Prüfungsziel gilt nur in dieser Sitzung."}</p>}
      {(notice || accountError) && <p role="status">{notice || accountError}</p>}
    </section>

    {alignment && <ExamRegionPreparation region={alignment} learningCatalog={examAlignment.learningCatalog} />}

    {details && regionData && <section className={styles.section} aria-labelledby="exam-plan-law">
      <h2 id="exam-plan-law">Regionales Recht</h2>
      <p>{details.region.name} bestimmt deine Rechtsauswahl. {regionData.includesFederal ? "Das zugehörige Bundesrecht ist einmal einbezogen." : "Der Bestand bezieht sich auf das gewählte Bundesland."}</p>
      <dl className={styles.counts}><div><dt>Lesbare Originalpassagen</dt><dd>{regionData.totalArticleCount}</dd></div><div><dt>Eigene freigegebene Rechtsfragen</dt><dd>{regionData.totalQuestionCount}</dd></div></dl>
      <div className={styles.links}><Link href={examProfileLawHref(profile)} prefetch={false}>Recht lesen</Link><Link href={examProfileLawHref(profile, "uebung")} prefetch={false}>Recht üben</Link></div>
      <p className={styles.note}>Das sind ausgewählte eigene Lernfragen, kein amtlicher Originalkatalog und keine vollständige Abdeckung des örtlichen Prüfungsstoffs. Nur fachlich freigegebene Fragen sind enthalten. Recht, Prüfungsanforderungen und Termine zusätzlich bei der zuständigen Stelle prüfen. Ältere Originalkataloge sind nicht automatisch auf dem heutigen Rechtsstand.</p>
    </section>}

    <section className={styles.section} aria-labelledby="exam-plan-learning">
      <h2 id="exam-plan-learning">Dein Lernweg</h2>
      <p>Die Kategorien entsprechen dem Menü. Wildbiologie und andere gemeinsame Grundlagen lernst du länderübergreifend; örtlich unterschiedliche Rechtsvorgaben prüfst du gesondert.</p>
      <ol className={styles.steps}><li><strong>Verstehen:</strong> Lies den Lerntext und erkläre den Zusammenhang mit eigenen Worten.</li><li><strong>Anwenden:</strong> Löse die zugehörigen Fragen. Prüfe auch bei einem Treffer, warum die anderen Antworten nicht passen.</li><li><strong>Wiederholen:</strong> Kehre zu offenen Fragen zurück und verknüpfe das Wissen mit einem eigenen Prüfungsfall.</li></ol>
      <section aria-labelledby="exam-plan-progress" className={styles.progress}>
        <h3 id="exam-plan-progress">Deine Wiederholung</h3>
        {progress.phase === "loading" ? <p role="status">Dein lokaler Wiederholungsstand wird geladen …</p> : progress.phase === "unavailable" ? <p role="status">Dein Wiederholungsstand ist hier gerade nicht lesbar. Du kannst die Lernkategorien weiterhin öffnen.</p> : <>
          <dl className={styles.counts}><div><dt>Beantwortet</dt><dd>{progress.summary.total.answered}</dd></div><div><dt>Fällig</dt><dd>{progress.summary.total.due}</dd></div><div><dt>Zuletzt falsch</dt><dd>{progress.summary.total.mistakes}</dd></div></dl>
          <div className={styles.links}>{progress.summary.total.due > 0 && <Link href={examReviewHref("faellig")} prefetch={false}>Fällige Fragen</Link>}{progress.summary.total.mistakes > 0 && <Link href={examReviewHref("fehler")} prefetch={false}>Fehler üben</Link>}<Link href={examReviewHref("gemischt")} prefetch={false}>Kurze Wissensrunde</Link></div>
        </>}
        <p className={styles.menuHint}>Hier zählen unterschiedliche Fragen aus dem gemeinsamen Wiederholungskatalog, die du in diesem Browser beantwortet hast. Fällige und zuletzt falsche Fragen können sich überschneiden. Frühere Kursabschlüsse, Lernkarten und regionale Rechtsübungen werden nicht hinzugerechnet. Die Zahlen zeigen keine vollständige Prüfungsabdeckung oder Prüfungsreife. Der Verlauf bleibt auf diesem Gerät und wird beim Abmelden entfernt.</p>
      </section>
      <ul className={styles.categoryList}>{data.categories.map(category => {
        const status = progress.summary?.byCategory[category.slug];
        return <li key={category.slug}>
          <Link href={`/lernen/${category.slug}`} prefetch={false}>{category.title}</Link><p>{category.focus.join(" · ")}</p>
          {status && <><p className={styles.reviewCount}>{status.answered ? `${status.answered} beantwortet · ${status.due} fällig · ${status.mistakes} zuletzt falsch` : "Noch keine Antworten im Wiederholungsverlauf"}</p>
            <div className={styles.links}>{status.due > 0 && <Link href={examReviewHref("faellig", category.slug)} prefetch={false} aria-label={`Fällige Fragen: ${category.title}`}>Wiederholen</Link>}{status.mistakes > 0 && <Link href={examReviewHref("fehler", category.slug)} prefetch={false} aria-label={`Fehler üben: ${category.title}`}>Fehler</Link>}</div></>}
        </li>;
      })}</ul>
    </section>

    <section className={styles.section} aria-labelledby="exam-plan-practice">
      <h2 id="exam-plan-practice">Wissen verknüpfen</h2>
      <div className={styles.links}><Link href="/quiz-app" prefetch={false}>Quiz</Link><Link href="/lernen/pruefungsgespraech" prefetch={false}>Prüfungsgespräch</Link><Link href="/lernen/lernkarten" prefetch={false}>Lernkarten</Link><Link href="/lernen/wildjahr" prefetch={false}>Wildjahr</Link><Link href="/lernen/spurenwerkstatt" prefetch={false}>Spuren</Link></div>
      <p>Nutze das Gespräch zum freien Erklären, das Quiz und die Karten zum Abrufen und Wildjahr oder Spuren zum Vergleichen von Beobachtungen. Dein Prüfungsziel ist eine persönliche Orientierung und kein amtlicher Lehrplan.</p>
    </section>

    <section className={styles.section} aria-labelledby="exam-plan-field">
      <h2 id="exam-plan-field">Praxis und örtliche Vorgaben</h2>
      <p>Praktische Ausbildung, betreute Waffenhandhabung, Schießnachweise, Erste-Hilfe-Ausbildung und örtliche Prüfungsanforderungen klärst du mit deiner Ausbildungs- und Prüfungsstelle. Digitales Lernen ersetzt diese Nachweise nicht. Ein gespeichertes Ziel und richtige Quizantworten sind weder eine Prüfungszulassung noch eine Jagdberechtigung.</p>
    </section>
    {regionData && <Sources region={regionData} federal={countryData.federal} alignment={alignment} />}
  </LearningToolLayout>;
}
