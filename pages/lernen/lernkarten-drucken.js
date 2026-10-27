import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "../../components/LearningToolLayout";
import PageMenu, { closePageMenu } from "../../components/PageMenu";
import MenuChoice from "../../components/MenuChoice";
import useSelectionPageStart from "../../hooks/useSelectionPageStart";
import AppIcon from "../../components/AppIcon";
import { filterFlashcards, formatFlashcardDate, FlashcardImage, FlashcardSelectionNotice } from "../../components/LearningFlashcards";
import useFlashcardDeck from "../../components/useFlashcardDeck";
import { getFlashcardPageData } from "../../lib/flashcard-page-data";
import { getPaidPageProps } from "../../lib/account-access";
import { flashcardSelectionQuery, readFlashcardSelection } from "../../lib/flashcard-selection";
import { readFlashcardNavigation } from "../../lib/flashcard-navigation";
import styles from "../../styles/LearningFlashcards.module.css";

export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context);
  return access.props ? { props: getFlashcardPageData(readFlashcardSelection(context.query)) } : access;
}

export function getPrintSourceIndex(cards) {
  const sourceList = [];
  const sourceByUrl = new Map();
  function add(url, label) {
    if (!url) return;
    const existing = sourceByUrl.get(url);
    if (existing) {
      if (!existing.labels.includes(label)) existing.labels.push(label);
      return;
    }
    const item = { id: sourceList.length + 1, url, labels: [label] };
    sourceList.push(item); sourceByUrl.set(url, item);
  }
  for (const card of cards) {
    card.sources.forEach(source => add(source.url, source.label));
    if (card.image) {
      add(card.image.creditUrl, `Fotografischer Nachweis: ${card.image.author}`);
      add(card.image.licenseUrl, `Fotolizenz: ${card.image.license}`);
    }
  }
  return { sourceList, sourceByUrl };
}

function SourceReference({ source }) {
  return source ? <a href={`#lernkarten-quelle-${source.id}`} title={source.labels.join(" / ")}>[{source.id}]</a> : null;
}

export default function PrintableFlashcards(props) {
  const { cards, categories, selection, incomplete, loading, loadError, onReload } = useFlashcardDeck(props);
  const router = useRouter();
  const [category, setCategory] = useState(() => !selection && categories.some(item => item.id === (router.query?.kategorie || router.query?.category)) ? (router.query.kategorie || router.query.category) : "all");
  const [query, setQuery] = useState(() => typeof router.query?.q === "string" ? router.query.q.slice(0, 160) : "");
  const printHeading = useRef(null), requestedFocus = useRef(false);
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(JSON.stringify([category, query, selection?.courseId, selection?.lessonId]));
  function showSelection() { closePageMenu(); requestedFocus.current = true; }
  useEffect(() => {
    if (!requestedFocus.current) return;
    requestedFocus.current = false;
    focusSelection(printHeading.current);
  }, [category, query]);
  useEffect(() => {
    if (router.isReady === false) return;
    const value = router.query?.kategorie || router.query?.category;
    setCategory(!selection && categories.some(item => item.id === value) ? value : "all");
    setQuery(typeof router.query?.q === "string" ? router.query.q.slice(0, 160) : "");
  }, [router.isReady, router.query?.kategorie, router.query?.category, router.query?.q, selection?.courseId, selection?.lessonId, selection?.invalid, categories]);
  const filtered = filterFlashcards(cards, category, query, selection);
  const { sourceList, sourceByUrl } = getPrintSourceIndex(filtered);
  const selectedCategory = selection?.title ? [selection.title, selection.lessonTitle].filter(Boolean).join(" · ") : categories.find(item => item.id === category)?.title || "Alle Kategorien";
  const navigation = readFlashcardNavigation(router.query, categories, selection);
  const sameSelection = navigation.category === category && navigation.query.trim() === query.trim();
  const backQuery = { ...flashcardSelectionQuery(selection), ...(!selection && category !== "all" ? { kategorie: category } : {}), ...(query.trim() ? { q: query.trim() } : {}), ...(navigation.mode === "all" ? { modus: "alle" } : {}), ...(sameSelection && navigation.cardId ? { karte: navigation.cardId } : {}) };
  return <LearningToolLayout title="Lernkarten drucken" description="Frage und Antwort nebeneinander auf A4 drucken, ausschneiden und zu einer Karte zusammenfalten." icon="book" category={{ href: "/lernen", title: "Lernbereich" }} headingOnly searchHref="#lernkarten-druckauswahl" hideCommunity robots="noindex,follow" className={styles.printPage}>
    <FlashcardSelectionNotice selection={selection} />
    <PageMenu title="Druckauswahl ändern"><form className={styles.filters} id="lernkarten-druckauswahl" onSubmit={event => { event.preventDefault(); closePageMenu(); requestedFocus.current = false; focusSelection(printHeading.current); }}>
      {!selection && <MenuChoice label="Kategorie" value={category} onChange={event => { cancelSelectionFocus(); if (event.target.value === category) { closePageMenu(); focusSelection(printHeading.current); } else { setCategory(event.target.value); showSelection(); } }}><option value="all">Alle Kategorien</option>{categories.map(item => <option value={item.id} key={item.id}>{item.title} ({item.count})</option>)}</MenuChoice>}
      <label className={styles.field}>Karten suchen<input type="search" value={query} placeholder="Thema eingrenzen" enterKeyHint="search" onChange={event => { requestedFocus.current = false; cancelSelectionFocus(); setQuery(event.target.value.slice(0, 160)); }} /></label>
      <button type="submit" className={styles.textButton}>Auswahl anzeigen</button>
    </form></PageMenu>
    <div className={styles.printToolbar}>
      <button type="button" className={styles.primary} onClick={() => window.print()} disabled={!filtered.length || incomplete}><AppIcon name="book" size={22} />{incomplete ? "Druckauswahl wird geladen" : `${filtered.length} ${filtered.length === 1 ? "Karte" : "Karten"} drucken`}</button>
    </div>
    <div className={styles.printInstructions}><p>Auf A4 im Hochformat und einseitig drucken. Jedes Frage-Antwort-Paar an der Außenkante ausschneiden und an der Mittellinie falten. So bleibt die Frage vorn und die Antwort hinten.</p><p>Du kannst im Druckdialog auch „Als PDF speichern“ wählen. {incomplete ? "Der vollständige Kartenbestand wird vor dem Drucken geladen." : `Die Auswahl enthält ${filtered.length} ${filtered.length === 1 ? "Karte" : "Karten"}.`}</p>{incomplete && <p role="status">{loadError || (loading ? "Druckauswahl wird geladen …" : "Die Auswahl ist noch unvollständig.")}{loadError && <button type="button" className={styles.textButton} onClick={onReload}>Erneut laden</button>}</p>}</div>
    <PageMenu title="Weitere Lernkarten"><nav className={styles.exportLinks} aria-label="Zurück zu den digitalen Lernkarten"><Link href={{ pathname: "/lernen/lernkarten", query: backQuery }}><AppIcon name="arrow-left" size={20} />Digital wiederholen</Link><a href="/lernen/lernkarten/jagdlatein-lernkarten.pdf" download><AppIcon name="download" size={20} />Starterset als PDF</a></nav></PageMenu>
    <div className={styles.printHeading}><h2 ref={printHeading} tabIndex={-1}>Jagdlatein-Lernkarten · {selectedCategory}</h2><p>Einseitig drucken · außen ausschneiden · Mittellinie falten · jagdlatein.de</p></div>
    {!incomplete && filtered.length ? <div className={styles.printList}>{filtered.map((card, index) => <article className={styles.printPair} key={card.id}>
      <div className={styles.printFace}><p className={styles.printMeta}><span>{index + 1} · Frage</span><span>{card.categoryTitle}</span></p>{card.context && <p className={styles.printContext}>{card.context}{card.lessonTitle && card.lessonTitle !== card.context ? ` · ${card.lessonTitle}` : ""}</p>}<h2>{card.question}</h2><FlashcardImage image={card.image} printing /></div>
      <div className={styles.printFace}><p className={styles.printMeta}><span>{index + 1} · Antwort</span><span>{formatFlashcardDate(card.reviewedOn) ? `${card.sourceScope === "photo" ? "Bildnachweis geprüft" : card.sourceScope === "lesson" ? "Stand der Ausgangslektion" : "Übernommener Prüfstand"}: ${formatFlashcardDate(card.reviewedOn)}` : "Quellen beim Ausgangskurs"}</span></p><p className={styles.printAnswer}>{card.answer}</p><p className={styles.printExplanation}>{card.explanation}</p>
        <div className={styles.printSources}><p>{card.sourceScope === "photo" ? "Bildnachweis und Artenporträt" : card.sourceScope === "lesson" ? "Quellen der Ausgangslektion" : "Quellen des Ausgangskurses"} ({new Set(card.sources.map(source => source.url)).size}): <span className={styles.printReferences}>{[...new Set(card.sources.map(source => source.url))].map(url => <SourceReference key={url} source={sourceByUrl.get(url)} />)}</span></p><p>Links im Quellenverzeichnis.</p>{card.image && <p>Foto: {card.image.author} · {card.image.license}{" "}<SourceReference source={sourceByUrl.get(card.image.creditUrl)} />{" "}<SourceReference source={sourceByUrl.get(card.image.licenseUrl)} /></p>}</div>
        <p className={styles.printCourse}>{card.moduleTitle}<br /><a href={`https://jagdlatein.de${card.courseHref}`}>jagdlatein.de{card.courseHref}</a></p>
      </div>
    </article>)}</div> : <p className={styles.empty}>{incomplete ? "Bitte warte mit dem Drucken, bis die vollständige Auswahl angezeigt wird." : "Keine passenden Karten. Verkürze den Suchbegriff oder wähle eine andere Kategorie."}</p>}
    {!incomplete && sourceList.length > 0 && <section className={styles.sourceAppendix} aria-labelledby="lernkarten-quellen"><h2 id="lernkarten-quellen">Quellenverzeichnis</h2><p>Die Nummern auf den Karten führen zu diesen vollständigen Nachweisen. Quellen eines Ausgangskurses sind als Kursquellen gekennzeichnet und keine neue Einzelprüfung der Karte.</p><ol>{sourceList.map(source => <li id={`lernkarten-quelle-${source.id}`} key={source.url}><span className={styles.appendixNumber}>[{source.id}]</span><div><strong>{source.labels.join(" / ")}</strong><a href={source.url} className={styles.appendixUrl}>{source.url}</a></div></li>)}</ol></section>}
  </LearningToolLayout>;
}
