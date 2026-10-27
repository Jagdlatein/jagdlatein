import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import WildlifeJawModel from "../../components/WildlifeJawModel";
import WildlifeDentition from "../../components/WildlifeDentition";
import WildlifeJawComparison from "../../components/WildlifeJawComparison";
import PageMenu, { closePageMenu, openPageMenu } from "../../components/PageMenu";
import MenuChoice from "../../components/MenuChoice";
import useSelectionPageStart from "../../hooks/useSelectionPageStart";
import { europeanWildlife } from "../../lib/european-wildlife-discovery";
import { jawModelsBySlug, jawModelSpecies } from "../../lib/wildlife-jaw-models";
import styles from "../../styles/WildlifeJawModel.module.css";

export const jawAtlasSpecies = [...europeanWildlife].sort((a, b) => a.name.localeCompare(b.name, "de"));
export default function JawAtlas() {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query?.art;
  const species = ready && typeof requested === "string" ? jawAtlasSpecies.find(item => item.slug === requested) || null : null;
  const comparisonSlug = router.query?.vergleich;
  const comparison = species && typeof comparisonSlug === "string" && comparisonSlug !== species.slug ? jawAtlasSpecies.find(item => item.slug === comparisonSlug) || null : null;
  const valid = !!species && (comparisonSlug === undefined || comparisonSlug === "" || !!comparison);
  const selectionKey = valid ? JSON.stringify([species.slug, comparison?.slug || ""]) : null;
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const currentView = useRef({ key: viewKey });
  if (currentView.current.key !== viewKey) currentView.current = { key: viewKey };
  const origin = currentView.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const selectedHeading = useRef(null);
  const mounted = useRef(false), request = useRef(0), pending = useRef(null);
  const committedSelection = useRef(selectionKey); committedSelection.current = selectionKey;
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [viewerOwner, setViewerOwner] = useState(null);
  const canAct = () => mounted.current && ready && currentView.current === origin;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; pending.current = null; };
  }, []);
  useEffect(() => {
    if (pending.current && pending.current.origin !== origin) { pending.current = null; request.current++; setWorking(false); }
    setError("");
    if (!ready) return;
    if (!valid) {
      const timer = setTimeout(() => { if (mounted.current && currentView.current === origin) openPageMenu("kiefer-artauswahl"); }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu(); focusSelection(selectedHeading.current);
  }, [origin]);
  const available = jawAtlasSpecies.filter(item => jawModelsBySlug[item.slug]);
  const missing = jawAtlasSpecies.filter(item => !jawModelsBySlug[item.slug]);
  const mandibleCount = jawModelSpecies.filter(item => item.models.some(model => model.part === "mandible" || model.part === "right-mandible")).length;

  async function choose(slug, field = "art") {
    if (!canAct() || !["art", "vergleich"].includes(field) || typeof slug !== "string") return;
    if ((slug || field === "art") && !jawAtlasSpecies.some(item => item.slug === slug)) return;
    if (field === "vergleich" && (!species || slug === species.slug)) return;
    cancelSelectionFocus();
    setError("");
    const nextSpecies = field === "art" ? slug : species.slug;
    const nextComparison = field === "vergleich" ? slug : comparison?.slug && comparison.slug !== slug ? comparison.slug : "";
    const target = JSON.stringify([nextSpecies, nextComparison]);
    if (selectionKey === target && pending.current === null) { closePageMenu(); focusSelection(selectedHeading.current); return; }
    const attempt = ++request.current;
    pending.current = { attempt, origin }; setWorking(true);
    const query = { ...router.query, art: nextSpecies }; delete query.vergleich;
    if (nextComparison) query.vergleich = nextComparison;
    const hash = (router.asPath || "").split("#")[1];
    let waitForCommit = false;
    function failed() {
      if (!canAct() || request.current !== attempt) return;
      setError({ origin, message: "Die Auswahl konnte gerade nicht geöffnet werden. Bitte versuche es erneut." }); openPageMenu("kiefer-artauswahl");
    }
    try {
      const accepted = await router.push({ pathname: "/lernen/kiefer-3d", query, ...(hash ? { hash } : {}) }, undefined, { shallow: true, scroll: false });
      if (accepted === false) failed();
      else if (canAct() && request.current === attempt && committedSelection.current === target) { closePageMenu(); focusSelection(selectedHeading.current); }
      else waitForCommit = true;
    } catch (failure) { if (!failure?.cancelled) failed(); }
    finally { if (!waitForCommit && pending.current?.attempt === attempt) { pending.current = null; if (mounted.current) setWorking(false); } }
  }

  function modelPanel(item, secondary = false) {
    const headingId = secondary ? "modell-offen-vergleich" : "modell-offen";
    return jawModelsBySlug[item.slug] ? <WildlifeJawModel key={item.slug} slug={item.slug} name={item.name} showDirectoryLink={false} sectionId={secondary ? "kiefer-3d-vergleich" : "kiefer-3d"} viewerOwner={viewerOwner} onActivate={slug => { if (canAct() && valid && [species.slug, comparison?.slug].includes(slug)) setViewerOwner(slug); }} /> : <section className={styles.panel} aria-labelledby={headingId}><h2 id={headingId}>{item.name}: 3D-Modell noch offen</h2><p>Für diese Art ist derzeit kein eindeutig zugeordnetes und für die Anzeige geprüftes Kiefer- oder Schädelmodell eingebunden. Ein ähnliches Tier wird hier nicht als Ersatz ausgegeben.</p></section>;
  }

  return <LearningToolLayout title="Kiefer & Schädel in 3D" description="Artspezifische Sammlungspräparate von Wildarten untersuchen und Zahnformeln nachlesen." icon="cube" category="wildkunde" headingOnly>
    <PageMenu title="Kiefer & Schädel – Wildart wählen" openInitially={ready && !valid} initialFocusId="kiefer-artauswahl">
    <div className={styles.selectionGrid}><MenuChoice label="Wildart" id="kiefer-artauswahl" value={species?.slug || ""} disabled={!ready} onChange={event => choose(event.target.value)}>
      <optgroup label="Mit geprüftem 3D-Modell">{available.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>
      <optgroup label="3D-Modell noch offen">{missing.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>
    </MenuChoice>{species && <MenuChoice label="Vergleich" value={valid ? comparison?.slug || "" : null} disabled={!ready} onChange={event => choose(event.target.value, "vergleich")}><option value="">Kein Vergleich</option>{jawAtlasSpecies.filter(item => item.slug !== species.slug).map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</MenuChoice>}</div>
    <p>{jawModelSpecies.length} von {jawAtlasSpecies.length} Arten und Vergleichsformen haben hier ein geprüftes Kiefer- oder Schädelmodell; {mandibleCount} davon mit isoliertem Unterkiefer oder einer Kieferhälfte. Die übrigen Einträge bleiben ausdrücklich als offen erkennbar.</p>
    {error?.origin === origin && <p role="alert">{error.message}</p>}
    </PageMenu>
    {!valid ? <p role={ready ? undefined : "status"}>{!ready ? "Die gewählte Art wird geladen …" : requested === undefined && comparisonSlug === undefined ? "Wähle zuerst eine Wildart unten im Menü. Danach kannst du eine zweite Art vergleichen." : "Diese Auswahl ist nicht verfügbar. Wähle unten im Menü eine Wildart und bei Bedarf einen gültigen Vergleich."}</p> : <div aria-busy={working}>
    <p className={styles.object} ref={selectedHeading} tabIndex={-1}><strong>{species.name}</strong>{comparison && <> im Vergleich mit <strong>{comparison.name}</strong></>}</p>
    {comparison && <WildlifeJawComparison left={species.slug} right={comparison.slug} />}
    {comparison && <p>Zum Wechseln zwischen den Präparaten lade die gewünschte 3D-Ansicht. Es bleibt jeweils eine Ansicht geöffnet. Die Modelle werden unabhängig an ihren Bildschirm angepasst und haben keinen gemeinsamen Maßstab.</p>}
    <div className={comparison ? styles.comparisonGrid : undefined}>{modelPanel(species)}{comparison && modelPanel(comparison, true)}</div>
    <p><Link href={`/wildkunde/${species.slug}${jawModelsBySlug[species.slug] ? "#kiefer-3d" : "#gebiss"}`}>Zum vollständigen Artenporträt: {species.name}</Link></p>
    {comparison ? <p><Link href={`/wildkunde/${comparison.slug}${jawModelsBySlug[comparison.slug] ? "#kiefer-3d" : "#gebiss"}`}>Zum vollständigen Artenporträt: {comparison.name}</Link></p> : <WildlifeDentition key={`teeth-${species.slug}`} slug={species.slug} name={species.name} />}
    </div>}
  </LearningToolLayout>;
}
