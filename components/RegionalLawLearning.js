import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Seo from "./Seo";
import ResearchQuestionRound from "./ResearchQuestionRound";
import { legalCountries, legalTopics, legalSelection, legalSelectionHref, readLegalRegionPreference,
  saveLegalRegionPreference } from "../lib/regional-law-core";
import styles from "../styles/RegionalLaw.module.css";

function ArticleSources({ article }) {
  return <details className={styles.sources}><summary>Quellen und Prüfstand</summary>
    <p>{article.learningReviewed ? "Wortlaut und Lerninhalt abgeglichen" : "Amtlichen Wortlaut eingesehen"}: {article.reviewedOn}. Geltungsbereich: {article.regionName}.</p>
    {article.effectiveFrom && <p>Diese Normfassung gilt ab {article.effectiveFrom}.</p>}
    {article.effectiveUntil && <p>Diese Normfassung tritt am {article.effectiveUntil} außer Kraft.</p>}
    <ul>{article.sources.map((source, index) => <li key={`${source.url}-${index}`}>
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · {source.publisher}
      {source.kind === "law" ? " · Rechtsquelle" : " · Erläuterung / Abgleich"}
    </li>)}</ul>
  </details>;
}

function LegalArticle({ article, headingRef }) {
  const original = article.sources.find(source => source.kind === "law");
  return <article className={styles.article} aria-labelledby={`law-${article.id}`}>
    <p className={styles.scope}>{article.regionName} · {article.lawTitle}</p>
    <h2 id={`law-${article.id}`} ref={headingRef} tabIndex={-1}>{article.title}</h2>
    <p className={styles.citation}>{article.citation}</p>
    <h3>Amtlicher Wortlaut – Auszug</h3>
    <p className={styles.scope}>{article.officialTextCitation}</p>
    <blockquote className={styles.original} lang={article.officialLanguage || undefined}>{article.officialText}</blockquote>
    <a className={styles.sourceLink} href={original.url} target="_blank" rel="noopener noreferrer">Amtliche Norm vollständig öffnen</a>
    {article.learningReviewed ? <><h3>Verständlich erklärt</h3>
      <p className={styles.explanation}>{article.summary}</p></> :
      <p className={styles.notice}>Der amtliche Auszug ist zugänglich. Der ergänzende Abgleich für Erklärung und Lernfragen ist noch offen; dazu werden hier noch keine Fragen freigegeben.</p>}
    <ArticleSources article={article} />
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
          <ArticleSources article={article} /></>}
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
  const selection = legalSelection(router.query, regions);
  const requestKey = `${country}:${selection.region}:${selection.includeFederal ? 1 : 0}`;
  const [response, setResponse] = useState({ key: "", bundle: null, error: "", status: 0 });
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const restored = useRef(false);
  const heading = useRef(null);
  const articleHeading = useRef(null);
  const contentHeading = useRef(null);
  const moved = useRef(false);
  const firstContent = useRef(true);
  const selectedRegion = regions.find(region => region.code === selection.region);

  useEffect(() => {
    if (!router.isReady || restored.current) return;
    restored.current = true;
    if (router.query.region !== undefined) return;
    let saved;
    try { saved = readLegalRegionPreference(window.localStorage); } catch { return; }
    if (saved?.country === country && regions.some(region => region.code === saved.region))
      router.replace(legalSelectionHref(country, { ...selection, region: saved.region }), undefined, { shallow: true, scroll: false });
  }, [router.isReady, country, regions]);

  useEffect(() => {
    if (!router.isReady || !selection.region) return;
    try { saveLegalRegionPreference(window.localStorage, country, selection.region, regions); } catch { /* Optional on-device preference. */ }
  }, [router.isReady, country, selection.region, regions]);

  useEffect(() => {
    if (!router.isReady || !selection.region) return;
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
        if (!controller.signal.aborted) setResponse({ key: requestKey, bundle: data, error: "", status: 200 });
      })
      .catch(error => {
        if (!controller.signal.aborted || timedOut) setResponse({ key: requestKey, bundle: null,
          error: timedOut ? "Das Laden dauert zu lange. Bitte erneut versuchen." : ["TypeError", "SyntaxError"].includes(error.name)
            ? "Die Rechtsinhalte sind gerade nicht erreichbar. Prüfe deine Verbindung und lade erneut." : error.message, status: error.status || 503 });
      }).finally(() => clearTimeout(deadline));
    return () => { controller.abort(); clearTimeout(deadline); };
  }, [router.isReady, requestKey, retry]);

  const active = response.key === requestKey ? response : { bundle: null, error: "", status: 0 };
  const bundle = active.bundle;
  const localArticles = bundle?.articles.filter(article => article.regionCode === selection.region) || [];
  const localQuestions = bundle?.questions.filter(question => question.regionCode === selection.region) || [];
  const currentTopic = legalTopics.find(topic => topic.id === selection.topic);
  const query = search.trim().toLocaleLowerCase("de");
  const topicArticles = bundle?.articles.filter(article => (!currentTopic || article.topic === currentTopic.id) &&
    (!query || `${article.title} ${article.lawTitle} ${article.citation} ${article.summary} ${article.officialText}`.toLocaleLowerCase("de").includes(query))) || [];
  const article = topicArticles.find(article => article.id === selection.article);
  const questionPool = bundle?.questions.filter(question => (!currentTopic || question.topic === currentTopic.id) &&
    (!query || `${question.prompt} ${question.explanation} ${question.context}`.toLocaleLowerCase("de").includes(query))) || [];

  useEffect(() => {
    if (!bundle) return;
    if (moved.current || (firstContent.current && article)) {
      moved.current = false;
      const target = article ? articleHeading.current : contentHeading.current || heading.current;
      target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "start", behavior: "auto" });
    }
    firstContent.current = false;
  }, [bundle, selection.topic, selection.article, selection.view]);

  function choose(change) {
    moved.current = true;
    setSearch("");
    router.push(legalSelectionHref(country, { ...selection, ...change }), undefined, { shallow: true, scroll: false });
  }
  function prepareContentMove(event) {
    if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey)
      moved.current = true;
  }
  const hasFederal = regions.some(region => region.code === "BUND") && selection.region !== "BUND";
  const sectionTitle = selectedRegion ? `${selectedRegion.name}${currentTopic ? ` · ${currentTopic.title}` : ""}` : "Deine Lernregion";
  return <main className={styles.main}>
    <Seo title={`Jagdrecht ${name} – nach ${regionLabel} lernen`} description={`Jagdrecht und eigene Rechtsfragen für deine Prüfungsregion in ${name}. Mit amtlichen Originalauszügen und genauen Fundstellen.`} />
    <header className={styles.header}><h1>Jagdrecht {name}</h1><p>Wähle deine Lernregion. Danach lernst du gezielt nach Thema und konkreter Gesetzesstelle.</p></header>
    <section className={styles.selection} aria-label="Prüfungsregion auswählen">
      <label className={styles.field}>Land<select value={country} onChange={event => router.push(legalSelectionHref(event.target.value))}>
        {legalCountries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select></label>
      <label className={styles.field}>Wohn- oder Prüfungs{regionLabel === "Kanton" ? "kanton" : "bundesland"}<select value={selection.region}
        onChange={event => choose({ region: event.target.value, topic: "all", article: "" })}>
        <option value="">Bitte {regionLabel} wählen …</option>
        {regions.map(region => <option key={region.code} value={region.code}>{region.name}{region.code === "BUND" ? " (Bundesrecht)" : ` (${region.code})`}</option>)}
      </select></label>
      <p className={styles.regionHint}>Für die Vorbereitung wählst du den Ort deiner Prüfung. Deine Auswahl wird auf diesem Gerät gemerkt; du kannst sie jederzeit ändern.</p>
    </section>
    {selection.invalidRegion && <p role="status" className={styles.notice}>Diese Region ist nicht verfügbar. Bitte wähle einen Eintrag aus der Liste.</p>}
    {selection.region && <>
      <div className={styles.controls}>
        <label className={styles.field}>Lernform<select value={selection.view} onChange={event => choose({ view: event.target.value, article: "" })}>
          <option value="wissen">Wissen und Gesetzestexte</option><option value="originale">Originalkataloge und Prüfungsunterlagen</option>
          <option value="uebung">Eigene Rechtsfragen üben</option><option value="fragen">Eigener Fragenkatalog mit Lösungen</option>
        </select></label>
        {hasFederal && selection.view !== "originale" && <label className={styles.check}><input type="checkbox" checked={selection.includeFederal} onChange={event => choose({ includeFederal: event.target.checked, article: "" })} />Bundesrecht ergänzend mitlernen</label>}
      </div>
      <h2 ref={heading} tabIndex={-1} className={styles.regionTitle}>{sectionTitle}</h2>
      {!bundle && !active.error && <p role="status">Rechtsinhalte für diese Auswahl werden geladen …</p>}
      {active.error && <div className={styles.error} role="alert"><p>{active.error}</p>
        {active.status === 401 ? <Link className={styles.button} href={`/login?next=${encodeURIComponent(legalSelectionHref(country, selection))}`}>Erneut anmelden</Link>
          : active.status === 403 ? <Link className={styles.button} href="/konto">Zugang im Konto prüfen</Link>
            : <button type="button" className={styles.button} onClick={() => setRetry(value => value + 1)}>Erneut laden</button>}
      </div>}
      {bundle && <>
        {selection.view === "originale" ? <OriginalExamResources region={bundle.region} headingRef={contentHeading} /> : <>
        <p className={styles.scope}><strong>{bundle.region.name}</strong> · {localArticles.length} Gesetzesstellen · {localQuestions.length} eigene Lernfragen
          {bundle.includesFederal ? ` · zusätzlich ${bundle.articles.length - localArticles.length} Gesetzesstellen und ${bundle.questions.length - localQuestions.length} Fragen zum Bundesrecht` : " · nur diese Rechtsebene"}</p>
        {bundle.region.notes && <details className={styles.sources}><summary>Abdeckung und Rechtsstand dieser Region</summary><p>{bundle.region.notes}</p></details>}
        {bundle.includesFederal && localQuestions.length === 0 && <p className={styles.notice}>Für diese Region sind noch keine eigenen Lernfragen freigegeben. Die Übung enthält derzeit nur das ergänzende Bundesrecht; sie ersetzt keine Vorbereitung auf das regionale Recht.</p>}
        <label className={styles.field}>In dieser Auswahl suchen<input type="search" value={search} maxLength={160} onChange={event => setSearch(event.target.value)} placeholder="Thema, Artikel, Paragraph oder Begriff" /></label>
        {selection.view !== "wissen" && <label className={styles.field}>Prüfungsthema<select value={selection.topic} onChange={event => choose({ topic: event.target.value, article: "" })}>
          <option value="all">Alle freigegebenen Rechtsthemen dieser Auswahl</option>
          {legalTopics.filter(topic => bundle.questions.some(question => question.topic === topic.id)).map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
        </select></label>}
        <div ref={contentHeading} tabIndex={-1} aria-label="Ausgewählter Rechtsinhalt">
        {selection.view === "wissen" ? article ? <LegalArticle article={article} headingRef={articleHeading} /> : !currentTopic && !query ? <>
          <ul className={styles.topics} aria-label="Rechtsthemen">{legalTopics.map(topic => {
            const count = bundle.articles.filter(article => article.topic === topic.id).length;
            return count ? <li key={topic.id}><Link prefetch={false} shallow scroll={false} onClick={prepareContentMove} href={legalSelectionHref(country, { ...selection, topic: topic.id, article: "" })}>
              <strong>{topic.title}</strong><span>{count} {count === 1 ? "Gesetzesstelle" : "Gesetzesstellen"}</span></Link></li> : null;
          })}</ul>
        </> : <>
          {selection.article && !article && <p role="status">Diese Gesetzesstelle gehört nicht zur aktuellen Auswahl.</p>}
          <ul className={styles.articles} aria-label="Gesetzesstellen">{topicArticles.map(article => <li key={article.id}><Link prefetch={false} shallow scroll={false} onClick={prepareContentMove} href={legalSelectionHref(country, { ...selection, topic: article.topic, article: article.id })}>
            <strong>{article.title}</strong><span>{article.regionName} · {article.citation}</span></Link></li>)}</ul>
        </> : selection.view === "fragen" ? <LegalQuestionCatalog questions={questionPool} articles={bundle.articles} />
          : questionPool.length > 0 && <ResearchQuestionRound key={`${requestKey}:${selection.topic}:${questionPool.map(question => question.id).join(",")}`}
            questions={questionPool} sources={bundle.sources} title={`Rechtsfragen: ${bundle.region.name}`} sectionId="regional-law-practice"
            notice="Eigene Lernfragen zur gewählten Rechtsebene, keine amtlichen Originalprüfungsfragen. Antworten und Erklärungen beziehen sich auf die jeweils angegebene Norm. Beim Verlassen beginnt die Übungsrunde neu." />}
        </div>
        {((selection.view === "wissen" && !topicArticles.length) || (selection.view !== "wissen" && !questionPool.length)) &&
          <p className={styles.notice} role="status">{query ? "Kein Treffer in dieser Auswahl. Ändere den Suchbegriff oder das Thema." : "Für diese Auswahl sind noch keine ausreichend belegten Lernabschnitte und Fragen freigegeben. Die amtliche Gesetzessammlung bleibt direkt erreichbar."}</p>}
        </>}
        <p><a href={bundle.region.officialUrl} target="_blank" rel="noopener noreferrer">{bundle.region.lawTitle} – amtliche Gesamtsammlung öffnen</a></p>
        <details className={styles.lowerPath}><summary>Andere Themen und Einordnung</summary>
          <p>Die freigegebenen Abschnitte sind eine gezielte Lernsammlung. Sie bilden noch nicht sämtliche Gesetze, Verordnungen und Prüfungsanforderungen der Region ab.</p>
          <Link shallow prefetch={false} onClick={event => { prepareContentMove(event); setSearch(""); }} href={legalSelectionHref(country, { ...selection, topic: "all", article: "" })}>Alle Themen dieser Region</Link>
          <Link prefetch={false} href="/jagdrecht">Andere Prüfungsregion wählen</Link>
        </details>
      </>}
    </>}
  </main>;
}
