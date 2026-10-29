import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Seo from "./Seo";
import ResearchQuestionRound from "./ResearchQuestionRound";
import PageMenu, { closePageMenu, openPageMenu, resetPageMenuPosition } from "./PageMenu";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { useExamProfile } from "../lib/use-exam-profile";
import ExamProfileSummary from "./ExamProfileSummary";
import { legalCountries, legalTopics, legalSelection, legalSelectionHref, readLegalRegionPreference,
  saveLegalRegionPreference } from "../lib/regional-law-core";
import styles from "../styles/RegionalLaw.module.css";

function ArticleSources({ article }) {
  return <div className={styles.sources}>
    <p>{article.learningReviewed ? "Wortlaut und Lerninhalt abgeglichen" : "Amtlichen Wortlaut eingesehen"}: {article.reviewedOn}. Geltungsbereich: {article.regionName}.</p>
    {article.effectiveFrom && <p>Diese Normfassung gilt ab {article.effectiveFrom}.</p>}
    {article.effectiveUntil && <p>Diese Normfassung tritt am {article.effectiveUntil} außer Kraft.</p>}
    <ul>{article.sources.map((source, index) => <li key={`${source.url}-${index}`}>
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · {source.publisher}
      {source.kind === "law" ? " · Rechtsquelle" : " · Erläuterung / Abgleich"}
    </li>)}</ul>
  </div>;
}

function LegalArticle({ article, headingRef }) {
  return <article className={styles.article} aria-labelledby={`law-${article.id}`}>
    <p className={styles.scope}>{article.regionName} · {article.lawTitle}</p>
    <h2 id={`law-${article.id}`} ref={headingRef} tabIndex={-1}>{article.title}</h2>
    <p className={styles.citation}>{article.citation}</p>
    <h3>Amtlicher Wortlaut – Auszug</h3>
    <p className={styles.scope}>{article.officialTextCitation}</p>
    <blockquote className={styles.original} lang={article.officialLanguage || undefined}>{article.officialText}</blockquote>
    {article.learningReviewed ? <><h3>Verständlich erklärt</h3>
      <p className={styles.explanation}>{article.summary}</p></> :
      <p className={styles.notice}>Der amtliche Auszug ist zugänglich. Der ergänzende Abgleich für Erklärung und Lernfragen ist noch offen; dazu werden hier noch keine Fragen freigegeben.</p>}
  </article>;
}

function LegalQuestionCatalog({ questions, articles }) {
  return <section aria-labelledby="law-catalog-heading">
    <h2 id="law-catalog-heading">Rechtsfragen zum Nachlesen ({questions.length})</h2>
    <p className={styles.hint}>Eigene Lernfragen mit Lösung und genauer Rechtsgrundlage. Keine amtlichen Originalprüfungsfragen.</p>
    {questions.map((question, index) => {
      const article = articles.find(article => article.id === question.articleId);
      return <details key={question.id} className={styles.question}><summary>{index + 1}. {question.prompt}</summary>
        <p className={styles.scope}>{question.context}</p>
        <ul>{question.options.map(option => <li key={option.id}>{option.text}</li>)}</ul>
        <p><strong>Richtige Antwort:</strong> {question.options.find(option => question.correctIds.includes(option.id))?.text}</p>
        <p>{question.explanation}</p>
        {article && <><p className={styles.citation}>{article.lawTitle} · {article.citation}</p>
          <p className={styles.scope}>Amtlicher Auszug: {article.officialTextCitation}</p>
          <blockquote className={styles.original} lang={article.officialLanguage || undefined}>{article.officialText}</blockquote>
          </>}
      </details>;
    })}
  </section>;
}

function OriginalExamResources({ region, headingRef }) {
  const resources = region.examResources || [];
  const originals = resources.filter(resource => resource.kind !== "exam-rules");
  const hasOfficial = originals.some(resource => ["official-catalog", "official-sample"].includes(resource.kind));
  const requirements = resources.filter(resource => resource.kind === "exam-rules");
  function resourceItem(resource) {
    return <li key={resource.url} className={styles.examResource}>
      <p className={styles.scope}>{resource.kind === "official-catalog" ? "Amtlicher Fragenkatalog" : resource.kind === "official-sample" ? "Offizielles Muster / Beispiel" : resource.kind === "association-catalog" ? "Verbandskatalog – keine amtlichen Originalfragen" : "Prüfungsanforderungen / zuständige Stelle"}</p>
      <h3><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a></h3>
      <p>{resource.publisher} · Quelle eingesehen: {resource.reviewedOn}</p>
      {resource.notes && <p>{resource.notes}</p>}
    </li>;
  }
  return <section aria-labelledby="original-law-questions"><h2 id="original-law-questions" tabIndex={-1} ref={headingRef}>Originalfragen und Prüfungsunterlagen</h2>
    <p>Die Links öffnen die unveränderten Veröffentlichungen der zuständigen Herausgeber. Ein Muster ist kein vollständiger Fragenkatalog. Veröffentlichungsstand und Rechtsstand können voneinander abweichen.</p>
    {region.examNotes && <p className={styles.notice}>{region.examNotes}</p>}
    {!hasOfficial && <p className={styles.notice}>Für diese Region ist hier noch kein öffentlich zugänglicher amtlicher Original-Rechtsfragenkatalog bestätigt. Die eigenen Jagdlatein-Lernfragen werden nicht als Originalprüfungsfragen ausgegeben.</p>}
    {originals.length > 0 && <ul className={styles.examList}>{originals.map(resourceItem)}</ul>}
    {requirements.length > 0 && <><h3>Anforderungen und zuständige Prüfungsstelle</h3><ul className={styles.examList}>{requirements.map(resourceItem)}</ul></>}
  </section>;
}

export default function RegionalLawLearning({ country, name, regionLabel, regions = [] }) {
  const router = useRouter();
  const examProfile = useExamProfile();
  const countryPath = `/jagdrecht/${country.toLowerCase()}`;
  const routePath = typeof router.asPath === "string" ? router.asPath.split(/[?#]/)[0] : countryPath;
  const ready = router.isReady === true && routePath === countryPath;
  const selection = legalSelection(router.query, regions);
  const requestKey = `${country}:${selection.region}:${selection.includeFederal ? 1 : 0}`;
  const [response, setResponse] = useState({ key: "", bundle: null, error: "", status: 0 });
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [menuChoice, setMenuChoice] = useState(null);
  const [navigationError, setNavigationError] = useState(null);
  const [pendingView, setPendingView] = useState(null);
  const originKey = JSON.stringify([country, ready, router.asPath || "", Object.keys(router.query || {}).sort().map(key => [key, router.query[key]])]);
  const currentOrigin = useRef({ key: originKey });
  if (currentOrigin.current.key !== originKey) currentOrigin.current = { key: originKey };
  const origin = currentOrigin.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const menuStage = !ready ? "loading" : menuChoice?.origin === origin ? menuChoice.stage : selection.region ? "main" : "region";
  const stageIdentity = useRef({ origin, stage: menuStage });
  if (stageIdentity.current.origin !== origin || stageIdentity.current.stage !== menuStage) stageIdentity.current = { origin, stage: menuStage };
  const stage = stageIdentity.current;
  const mounted = useRef(false), navigation = useRef(0), pending = useRef(null);
  const dataScopeKey = JSON.stringify([ready, requestKey, retry]);
  const dataScope = useRef({ key: dataScopeKey });
  if (dataScope.current.key !== dataScopeKey) dataScope.current = { key: dataScopeKey };
  const fetchScope = dataScope.current;
  const restored = useRef(false);
  const heading = useRef(null);
  const articleHeading = useRef(null);
  const contentHeading = useRef(null);
  const moved = useRef(false);
  const firstContent = useRef(true);
  const selectedRegion = regions.find(region => region.code === selection.region);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pending.current = null; };
  }, []);

  useEffect(() => {
    const job = pending.current;
    if (!job || job.origin === origin) return;
    pending.current = null;
    setPendingView(null);
    if (job.href === legalSelectionHref(country, selection)) {
      moved.current = true;
      if (job.clearSearch) setSearch("");
      setMenuChoice(null);
    }
  }, [origin]);

  useEffect(() => {
    if (!ready || !examProfile.ready || restored.current) return;
    restored.current = true;
    if (router.query.region !== undefined) return;
    // A personal target is distinct from the last law page viewed. A country
    // path remains explicit; a profile from another country never redirects it.
    if (examProfile.profile) {
      if (examProfile.profile.country === country && regions.some(region => region.code === examProfile.profile.region)) {
        try { Promise.resolve(router.replace(legalSelectionHref(country, { ...selection, region: examProfile.profile.region }), undefined, { shallow: true, scroll: false })).catch(() => {}); }
        catch { /* The explicit region picker remains available. */ }
      }
      return;
    }
    let saved;
    try { saved = readLegalRegionPreference(window.localStorage); } catch { return; }
    if (saved?.country === country && regions.some(region => region.code === saved.region)) {
      try { Promise.resolve(router.replace(legalSelectionHref(country, { ...selection, region: saved.region }), undefined, { shallow: true, scroll: false })).catch(() => {}); }
      catch { /* A remembered choice is optional; the region list stays usable. */ }
    }
  }, [ready, country, regions, examProfile.ready, examProfile.profile]);

  useEffect(() => {
    if (!ready || !selection.region) return;
    try { saveLegalRegionPreference(window.localStorage, country, selection.region, regions); } catch { /* Optional on-device preference. */ }
  }, [ready, country, selection.region, regions]);

  useEffect(() => {
    if (!ready || !selection.region) return;
    const controller = new AbortController();
    let timedOut = false;
    const deadline = setTimeout(() => { timedOut = true; controller.abort(); }, 18000);
    setResponse({ key: requestKey, bundle: null, error: "", status: 0 });
    const params = new URLSearchParams({ land: country, region: selection.region, bund: selection.includeFederal ? "1" : "0" });
    fetch(`/api/jagdrecht/region?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async result => {
        const data = await result.json();
        if (!result.ok) throw Object.assign(new Error(data.message || "Die Rechtsinhalte konnten nicht geladen werden."), { status: result.status });
        if (data.country !== country || data.region?.code !== selection.region || !Array.isArray(data.articles) ||
          !Array.isArray(data.questions) || !Array.isArray(data.sources)) throw new Error("Die Antwort gehört nicht zur gewählten Lernregion.");
        if (mounted.current && dataScope.current === fetchScope && !controller.signal.aborted) setResponse({ key: requestKey, bundle: data, error: "", status: 200 });
      })
      .catch(error => {
        if (mounted.current && dataScope.current === fetchScope && (!controller.signal.aborted || timedOut)) setResponse({ key: requestKey, bundle: null,
          error: timedOut ? "Das Laden dauert zu lange. Bitte erneut versuchen." : ["TypeError", "SyntaxError"].includes(error.name)
            ? "Die Rechtsinhalte sind gerade nicht erreichbar. Prüfe deine Verbindung und lade erneut." : error.message, status: error.status || 503 });
      }).finally(() => clearTimeout(deadline));
    return () => { controller.abort(); clearTimeout(deadline); };
  }, [ready, requestKey, retry]);

  const active = ready && response.key === requestKey ? response : { bundle: null, error: "", status: 0 };
  const bundle = active.bundle;
  const localArticles = bundle?.articles.filter(article => article.regionCode === selection.region) || [];
  const localQuestions = bundle?.questions.filter(question => question.regionCode === selection.region) || [];
  const currentTopic = legalTopics.find(topic => topic.id === selection.topic);
  const query = search.trim().toLocaleLowerCase("de");
  const topicArticles = bundle?.articles.filter(article => (!currentTopic || article.topic === currentTopic.id) &&
    (!query || `${article.title} ${article.lawTitle} ${article.citation} ${article.summary} ${article.officialText}`.toLocaleLowerCase("de").includes(query))) || [];
  // Searching narrows the menu, not the text already chosen for reading.
  const article = bundle?.articles.find(article => article.id === selection.article && (!currentTopic || article.topic === currentTopic.id));
  const questionPool = bundle?.questions.filter(question => (!currentTopic || question.topic === currentTopic.id) &&
    (!query || `${question.prompt} ${question.explanation} ${question.context}`.toLocaleLowerCase("de").includes(query))) || [];

  useEffect(() => {
    if (!ready || !bundle) return;
    if (selection.view === "wissen" && !article) {
      firstContent.current = false;
      moved.current = false;
      const timer = setTimeout(() => { if (mounted.current && currentOrigin.current === origin) openPageMenu("regional-law-topics"); }, 0);
      return () => clearTimeout(timer);
    }
    if (moved.current || (firstContent.current && article)) {
      moved.current = false;
      closePageMenu();
      const target = article ? articleHeading.current : contentHeading.current || heading.current;
      focusSelection(target, { anchor: Boolean(typeof window !== "undefined" && window.location.hash) });
    }
    firstContent.current = false;
  }, [ready, bundle, selection.topic, selection.article, selection.view]);

  function live() {
    return mounted.current && ready && currentOrigin.current === origin && stageIdentity.current === stage;
  }
  function cancelOutstandingNavigation() {
    const previous = pending.current;
    const id = ++navigation.current;
    pending.current = null;
    setPendingView(null);
    if (!previous || previous.href === legalSelectionHref(country, selection)) return;
    // Clearing a ref does not cancel Next's actual navigation. A fresh request
    // for the exact current address supersedes the unfinished other destination
    // without adding an internal selection step or changing its search context.
    const currentHref = typeof router.asPath === "string" ? router.asPath : legalSelectionHref(country, selection);
    try {
      Promise.resolve(router.push(currentHref, undefined, { shallow: true, scroll: false })).catch(error => {
        if (mounted.current && currentOrigin.current === origin && navigation.current === id && !error?.cancelled)
          setNavigationError({ origin, message: "Die laufende Auswahl konnte nicht abgebrochen werden. Bitte wähle deine Region erneut." });
      });
    } catch {
      if (mounted.current && currentOrigin.current === origin && navigation.current === id)
        setNavigationError({ origin, message: "Die laufende Auswahl konnte nicht abgebrochen werden. Bitte wähle deine Region erneut." });
    }
  }
  function showStage(next) {
    if (!live()) return;
    cancelSelectionFocus();
    setNavigationError(null); cancelOutstandingNavigation();
    stageIdentity.current = { origin, stage: next };
    setMenuChoice({ origin, stage: next, focus: true });
  }
  async function navigate(href, clearSearch = true) {
    if (!live()) return;
    cancelSelectionFocus();
    if (href === legalSelectionHref(country, selection)) {
      setNavigationError(null); cancelOutstandingNavigation();
      if (selection.region && (selection.view !== "wissen" || article)) {
        stageIdentity.current = { origin, stage: "main" };
        setMenuChoice({ origin, stage: "main", focus: false });
        closePageMenu();
        const target = article ? articleHeading.current : contentHeading.current || heading.current;
        focusSelection(target);
      } else showStage(selection.region ? "main" : "region");
      return;
    }
    const job = { origin, href, clearSearch, id: ++navigation.current };
    pending.current = job;
    setPendingView(job); setNavigationError(null);
    function fail(message) {
      if (!mounted.current || currentOrigin.current !== origin || pending.current !== job || navigation.current !== job.id) return;
      pending.current = null; setPendingView(null);
      if (message) setNavigationError({ origin, message });
    }
    try {
      const accepted = await router.push(href, undefined, { shallow: href.startsWith(`/jagdrecht/${country.toLowerCase()}?`), scroll: false });
      if (accepted === false) fail("Die Auswahl konnte nicht geöffnet werden. Bitte wähle sie erneut.");
      // A successful promise alone is not a URL commit. Keep this list and its
      // current facts until the actual router selection changes.
    } catch (error) { fail(error?.cancelled ? "" : "Die Auswahl konnte nicht geöffnet werden. Bitte wähle sie erneut."); }
  }
  function choose(change) {
    if (!live()) return;
    navigate(legalSelectionHref(country, { ...selection, ...change }));
  }
  function prepareContentMove(event, href) {
    if (!live()) { event.preventDefault?.(); return; }
    if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault?.(); navigate(href);
    }
  }
  function changeCountry(value) {
    if (!live() || !legalCountries.some(item => item.code === value)) return;
    if (value === country) { showStage("region"); return; }
    navigate(legalSelectionHref(value));
  }
  function changeSearch(value) { if (live()) setSearch(value); }
  function selectRegion(value) {
    if (!live() || !regions.some(item => item.code === value)) return;
    if (value === selection.region) { showStage("main"); return; }
    choose({ region: value, topic: "all", article: "" });
  }
  function selectForm(value) {
    if (!live()) return;
    if (value === selection.view) { showStage("main"); return; }
    choose({ view: value, article: "" });
  }
  function selectTopic(value) {
    if (!live()) return;
    if (value === selection.topic) { showStage("main"); return; }
    choose({ topic: value, article: "" });
  }
  const hasFederal = regions.some(region => region.code === "BUND") && selection.region !== "BUND";
  const forms = [{ id: "wissen", title: "Wissen & Gesetzestexte" }, { id: "originale", title: "Originale & Prüfungsunterlagen" },
    { id: "uebung", title: "Rechtsfragen üben" }, { id: "fragen", title: "Fragen & Lösungen" }];
  const formTitle = forms.find(item => item.id === selection.view)?.title;
  const pendingChoice = pendingView?.origin === origin && pending.current === pendingView;
  useEffect(() => {
    if (!mounted.current || currentOrigin.current !== origin || menuChoice?.origin !== origin || menuChoice.focus === false) return;
    const target = { country: "regional-law-country", region: "regional-law-region", form: "regional-law-form", topic: "regional-law-topic", main: "regional-law-topics" }[menuStage];
    openPageMenu(target);
    resetPageMenuPosition(target);
  }, [menuChoice, menuStage, origin]);
  return <main className={styles.main}>
    <Seo title={`Jagdrecht ${name} – nach ${regionLabel} lernen`} description={`Jagdrecht und eigene Rechtsfragen für deine Prüfungsregion in ${name}. Mit amtlichen Originalauszügen und genauen Fundstellen.`} />
    <header className={styles.header}><h1 ref={heading} tabIndex={-1} data-learning-page-start>{!ready ? "Jagdrecht" : selectedRegion ? `Jagdrecht · ${selectedRegion.name}` : `Jagdrecht ${name}`}</h1></header>
    <PageMenu key={country} title="Jagdrecht – Auswahl" openInitially={ready && !selection.region} initialFocusId="regional-law-region">
      <ExamProfileSummary />
    <div className={styles.menuStage} aria-busy={pendingChoice}>
    {menuStage === "loading" && <p role="status">Die Rechtsauswahl wird vorbereitet …</p>}
    {ready && menuStage !== "main" && <button type="button" className={styles.stageBack} onClick={() => showStage(selection.region ? "main" : menuStage === "country" ? "region" : "country")}>{selection.region ? "Zur Auswahl" : menuStage === "country" ? `${regionLabel} wählen` : "Land wählen"}</button>}
    {menuStage === "country" && <section aria-labelledby="regional-law-country">
      <h3 id="regional-law-country" tabIndex={-1}>Land</h3>
      <ul className={styles.choiceList}>{legalCountries.map(item => <li key={item.code}><button type="button" disabled={!ready} aria-pressed={country === item.code} onClick={() => changeCountry(item.code)}>{item.name}</button></li>)}</ul>
    </section>}
    {menuStage === "region" && <section aria-labelledby="regional-law-region">
      <h3 id="regional-law-region" tabIndex={-1}>{name} · {regionLabel}</h3>
      <p className={styles.regionHint}>Wähle eine Leseregion. Dein persönliches Prüfungsprofil bleibt dabei erhalten.</p>
      <ul className={styles.choiceList} aria-label="Prüfungsregion auswählen">{regions.map(region => <li key={region.code}><button type="button" disabled={!ready} aria-pressed={selection.region === region.code}
        onClick={() => selectRegion(region.code)}>{region.name}{region.code === "BUND" ? " (Bundesrecht)" : ` (${region.code})`}</button></li>)}</ul>
    </section>}
    {menuStage === "form" && <section aria-labelledby="regional-law-form">
      <h3 id="regional-law-form" tabIndex={-1}>Lernform</h3>
      <ul className={styles.choiceList}>{forms.map(item => <li key={item.id}><button type="button" disabled={!ready} aria-pressed={selection.view === item.id} onClick={() => selectForm(item.id)}>{item.title}</button></li>)}</ul>
    </section>}
    {menuStage === "topic" && <section aria-labelledby="regional-law-topic">
      <h3 id="regional-law-topic" tabIndex={-1}>Prüfungsthema</h3>
      <ul className={styles.choiceList}>{[{ id: "all", title: "Alle Rechtsthemen" }, ...legalTopics.filter(topic => bundle?.questions.some(question => question.topic === topic.id))].map(item => <li key={item.id}><button type="button" disabled={!ready} aria-pressed={selection.topic === item.id} onClick={() => selectTopic(item.id)}>{item.title}</button></li>)}</ul>
    </section>}
    {menuStage === "main" && selection.region && <div id="regional-law-topics" tabIndex={-1}>
      <div className={styles.menuFields} aria-label="Aktuelle Auswahl">
        <button type="button" className={styles.selectionButton} onClick={() => showStage("country")}>Land <strong>{name}</strong></button>
        <button type="button" className={styles.selectionButton} onClick={() => showStage("region")}>{regionLabel} <strong>{selectedRegion?.name}</strong></button>
        <button type="button" className={styles.selectionButton} onClick={() => showStage("form")}>Lernform <strong>{formTitle}</strong></button>
        {hasFederal && selection.view !== "originale" && <label className={styles.check}><input type="checkbox" checked={selection.includeFederal} onChange={event => choose({ includeFederal: event.target.checked, article: "" })} />Bundesrecht ergänzend mitlernen</label>}
      </div>
      {bundle && selection.view !== "originale" && <div className={styles.menuFields}>
        <label className={styles.field}>In dieser Auswahl suchen<input type="search" value={search} maxLength={160} onChange={event => changeSearch(event.target.value)} placeholder="Thema, Artikel, Paragraph oder Begriff" /></label>
        {selection.view !== "wissen" && <button type="button" className={styles.selectionButton} onClick={() => showStage("topic")}>Prüfungsthema <strong>{currentTopic?.title || "Alle Rechtsthemen"}</strong></button>}
        {selection.view === "wissen" && <div>
          <h3>{currentTopic ? currentTopic.title : query ? "Gefundene Gesetzesstellen" : "Thema wählen"}</h3>
          {!currentTopic && !query ? <ul className={styles.menuList} aria-label="Rechtsthemen">{legalTopics.map(topic => {
            const count = bundle.articles.filter(article => article.topic === topic.id).length;
            return count ? <li key={topic.id}><Link prefetch={false} shallow scroll={false} onClick={event => prepareContentMove(event, legalSelectionHref(country, { ...selection, topic: topic.id, article: "" }))} href={legalSelectionHref(country, { ...selection, topic: topic.id, article: "" })}>
              <strong>{topic.title}</strong><span>{count} {count === 1 ? "Gesetzesstelle" : "Gesetzesstellen"}</span></Link></li> : null;
          })}</ul> : <ul className={styles.menuList} aria-label="Gesetzesstellen">{topicArticles.map(item => <li key={item.id}><Link prefetch={false} shallow scroll={false} aria-current={article?.id === item.id ? "page" : undefined} onClick={event => prepareContentMove(event, legalSelectionHref(country, { ...selection, topic: item.topic, article: item.id }))} href={legalSelectionHref(country, { ...selection, topic: item.topic, article: item.id })}>
            <strong>{item.title}</strong><span>{item.regionName} · {item.citation}</span></Link></li>)}</ul>}
          {!topicArticles.length && <p role="status">{query ? "Kein Treffer. Ändere deinen Suchbegriff." : "Für diese Auswahl sind noch keine belegten Abschnitte freigegeben."}</p>}
        </div>}
        {selection.view !== "wissen" && <p className={styles.scope}>{questionPool.length} eigene Fragen in dieser Auswahl</p>}
      </div>}
      <Link shallow prefetch={false} onClick={event => prepareContentMove(event, legalSelectionHref(country, { ...selection, topic: "all", article: "" }))} href={legalSelectionHref(country, { ...selection, topic: "all", article: "" })}>Alle Rechtsthemen dieser Region</Link>
    </div>}
    {pendingChoice && <p role="status">Auswahl wird geöffnet …</p>}
    {navigationError?.origin === origin && <p role="alert" className={styles.error}>{navigationError.message}</p>}
    <Link prefetch={false} href="/jagdrecht">Länderübersicht</Link>
    </div>
    </PageMenu>
    {!ready && <p role="status">Die Rechtsauswahl wird vorbereitet …</p>}
    {ready && selection.invalidRegion && <p role="status" className={styles.notice}>Diese Region ist nicht verfügbar. Wähle deine Lernregion unten im Menü.</p>}
    {ready && !selection.region && <p className={styles.hint}>Wähle dein Land und deine Prüfungsregion im unteren Menü.</p>}
    {ready && selection.region && <>
      {!bundle && !active.error && <p role="status">Rechtsinhalte für diese Auswahl werden geladen …</p>}
      {active.error && <div className={styles.error} role="alert"><p>{active.error}</p>
        {active.status === 401 ? <Link className={styles.button} href={`/login?next=${encodeURIComponent(legalSelectionHref(country, selection))}`}>Erneut anmelden</Link>
          : active.status === 403 ? <Link className={styles.button} href="/konto">Zugang im Konto prüfen</Link>
            : <button type="button" className={styles.button} onClick={() => { if (live()) setRetry(value => value + 1); }}>Erneut laden</button>}
      </div>}
      {bundle && <>
        {selection.view === "originale" ? <OriginalExamResources region={bundle.region} headingRef={contentHeading} /> : <>
        <p className={styles.scope}><strong>{bundle.region.name}</strong> · {localArticles.length} Gesetzesstellen · {localQuestions.length} eigene Lernfragen
          {bundle.includesFederal ? ` · zusätzlich ${bundle.articles.length - localArticles.length} Gesetzesstellen und ${bundle.questions.length - localQuestions.length} Fragen zum Bundesrecht` : " · nur diese Rechtsebene"}</p>
        {selection.view !== "wissen" && <p className={styles.hint}>Verfügbare eigene Lernfragen: {bundle.questions.length}{bundle.includesFederal ? " einschließlich Bundesrecht" : " auf dieser Rechtsebene"}. Die genaue regionale Abdeckung steht am Ende.</p>}
        {bundle.includesFederal && localQuestions.length === 0 && <p className={styles.notice}>Für diese Region sind noch keine eigenen Lernfragen freigegeben. Die Übung enthält derzeit nur das ergänzende Bundesrecht; sie ersetzt keine Vorbereitung auf das regionale Recht.</p>}
        <div ref={contentHeading} tabIndex={-1} aria-label="Ausgewählter Rechtsinhalt">
        {selection.view === "wissen" ? article ? <LegalArticle article={article} headingRef={articleHeading} /> : <>
          {selection.article && !article && <p role="status">Diese Gesetzesstelle gehört nicht zur aktuellen Auswahl.</p>}
          <p className={styles.hint}>Wähle {currentTopic ? "die gewünschte Gesetzesstelle" : "dein Thema"} im unteren Menü. Hier erscheint anschließend nur der ausgewählte Inhalt.</p>
        </> : selection.view === "fragen" ? <LegalQuestionCatalog questions={questionPool} articles={bundle.articles} />
          : questionPool.length > 0 && <ResearchQuestionRound key={`${requestKey}:${selection.topic}:${questionPool.map(question => question.id).join(",")}`}
            questions={questionPool} sources={bundle.sources} title={`Rechtsfragen: ${bundle.region.name}`} sectionId="regional-law-practice"
            notice="Eigene Lernfragen zur gewählten Rechtsebene, keine amtlichen Originalprüfungsfragen. Antworten und Erklärungen beziehen sich auf die jeweils angegebene Norm. Beim Verlassen beginnt die Übungsrunde neu." />}
        </div>
        {((selection.view === "wissen" && !article && !topicArticles.length) || (selection.view !== "wissen" && !questionPool.length)) &&
          <p className={styles.notice} role="status">{query ? "Kein Treffer in dieser Auswahl. Ändere den Suchbegriff oder das Thema." : "Für diese Auswahl sind noch keine ausreichend belegten Lernabschnitte und Fragen freigegeben. Die amtliche Gesetzessammlung bleibt direkt erreichbar."}</p>}
        </>}
        <details className={styles.lowerPath}><summary>Ergänzende Quellen, Rechtsstand und Umfang</summary>
          {bundle.region.notes && <p>{bundle.region.notes}</p>}
          <p>Die freigegebenen Abschnitte sind eine gezielte Lernsammlung. Sie bilden noch nicht sämtliche Gesetze, Verordnungen und Prüfungsanforderungen der Region ab.</p>
          <p><a href={bundle.region.officialUrl} target="_blank" rel="noopener noreferrer">{bundle.region.lawTitle} – amtliche Gesamtsammlung</a></p>
          {(selection.view === "wissen" ? (article ? [article] : []) : bundle.articles.filter(item => questionPool.some(question => question.articleId === item.id))).map(item => <div key={item.id}><h3>{item.title} · {item.citation}</h3><ArticleSources article={item} /></div>)}
        </details>
      </>}
    </>}
  </main>;
}
