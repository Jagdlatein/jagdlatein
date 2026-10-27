import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import WildlifeJawModel from "../../components/WildlifeJawModel";
import WildlifeDentition from "../../components/WildlifeDentition";
import WildlifeJawComparison from "../../components/WildlifeJawComparison";
import PageMenu, { closePageMenu } from "../../components/PageMenu";
import MenuChoice from "../../components/MenuChoice";
import useSelectionPageStart from "../../hooks/useSelectionPageStart";
import { europeanWildlife } from "../../lib/european-wildlife-discovery";
import { jawModelsBySlug, jawModelSpecies } from "../../lib/wildlife-jaw-models";
import styles from "../../styles/WildlifeJawModel.module.css";

export const jawAtlasSpecies = [...europeanWildlife].sort((a, b) => a.name.localeCompare(b.name, "de"));
export default function JawAtlas() {
  const router = useRouter();
  const requested = typeof router.query?.art === "string" ? router.query.art : "rehwild";
  const species = jawAtlasSpecies.find(item => item.slug === requested) || jawAtlasSpecies.find(item => item.slug === "rehwild");
  const comparisonSlug = typeof router.query?.vergleich === "string" ? router.query.vergleich : "";
  const comparison = jawAtlasSpecies.find(item => item.slug === comparisonSlug && item.slug !== species.slug) || null;
  const queryKey = JSON.stringify(router.query || {});
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(queryKey, router.isReady === true);
  const selectedHeading = useRef(null);
  const lastSelection = useRef(queryKey);
  useEffect(() => {
    if (router.isReady !== true || lastSelection.current === queryKey) return;
    lastSelection.current = queryKey;
    closePageMenu(); focusSelection(selectedHeading.current);
  }, [queryKey, router.isReady]);
  const currentQuery = useRef(queryKey);
  currentQuery.current = queryKey;
  const request = useRef(0);
  const [pendingRoute, setPendingRoute] = useState(null);
  const changing = pendingRoute === queryKey;
  const [error, setError] = useState("");
  const [viewerOwner, setViewerOwner] = useState(null);
  const errorQuery = useRef(null);
  const available = jawAtlasSpecies.filter(item => jawModelsBySlug[item.slug]);
  const missing = jawAtlasSpecies.filter(item => !jawModelsBySlug[item.slug]);
  const mandibleCount = jawModelSpecies.filter(item => item.models.some(model => model.part === "mandible" || model.part === "right-mandible")).length;

  function choose(slug, field = "art") {
    if (changing || !["art", "vergleich"].includes(field)) return;
    if ((slug || field === "art") && !jawAtlasSpecies.some(item => item.slug === slug)) return;
    if (field === "vergleich" && slug === species.slug) return;
    cancelSelectionFocus();
    const attempt = ++request.current;
    const origin = queryKey;
    setPendingRoute(origin); setError("");
    const query = { ...router.query, [field]: slug };
    if (!query.vergleich || query.vergleich === query.art) delete query.vergleich;
    try {
      Promise.resolve(router.replace({ pathname: "/lernen/kiefer-3d", query }, undefined, { shallow: true, scroll: false }))
        .then(completed => { if (completed !== false && request.current === attempt && [origin, JSON.stringify(query)].includes(currentQuery.current)) closePageMenu(); })
        .catch(failure => { if (!failure?.cancelled && currentQuery.current === origin && request.current === attempt) { errorQuery.current = origin; setError("Die Auswahl konnte gerade nicht geöffnet werden. Bitte versuche es erneut."); } })
        .finally(() => { if (request.current === attempt) setPendingRoute(null); });
    } catch { setPendingRoute(null); errorQuery.current = origin; setError("Die Auswahl konnte gerade nicht geöffnet werden. Bitte versuche es erneut."); }
  }

  function modelPanel(item, secondary = false) {
    const headingId = secondary ? "modell-offen-vergleich" : "modell-offen";
    return jawModelsBySlug[item.slug] ? <WildlifeJawModel key={item.slug} slug={item.slug} name={item.name} showDirectoryLink={false} sectionId={secondary ? "kiefer-3d-vergleich" : "kiefer-3d"} viewerOwner={viewerOwner} onActivate={setViewerOwner} /> : <section className={styles.panel} aria-labelledby={headingId}><h2 id={headingId}>{item.name}: 3D-Modell noch offen</h2><p>Für diese Art ist derzeit kein eindeutig zugeordnetes und für die Anzeige geprüftes Kiefer- oder Schädelmodell eingebunden. Ein ähnliches Tier wird hier nicht als Ersatz ausgegeben.</p></section>;
  }

  return <LearningToolLayout title="Kiefer & Schädel in 3D" description="Artspezifische Sammlungspräparate von Wildarten untersuchen und Zahnformeln nachlesen." icon="cube" category="wildkunde" headingOnly>
    <PageMenu title="Kiefer & Schädel – Wildart wählen">
    <div className={styles.selectionGrid}><MenuChoice label="Wildart" id="kiefer-artauswahl" value={species.slug} disabled={changing} onChange={event => choose(event.target.value)}>
      <optgroup label="Mit geprüftem 3D-Modell">{available.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>
      <optgroup label="3D-Modell noch offen">{missing.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>
    </MenuChoice><MenuChoice label="Vergleich" value={comparison?.slug || ""} disabled={changing} onChange={event => choose(event.target.value, "vergleich")}><option value="">Kein Vergleich</option>{jawAtlasSpecies.filter(item => item.slug !== species.slug).map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</MenuChoice></div>
    <p>{jawModelSpecies.length} von {jawAtlasSpecies.length} Arten und Vergleichsformen haben hier ein geprüftes Kiefer- oder Schädelmodell; {mandibleCount} davon mit isoliertem Unterkiefer oder einer Kieferhälfte. Die übrigen Einträge bleiben ausdrücklich als offen erkennbar.</p>
    </PageMenu>
    <p className={styles.object} ref={selectedHeading} tabIndex={-1}><strong>{species.name}</strong>{comparison && <> im Vergleich mit <strong>{comparison.name}</strong></>}</p>
    {error && errorQuery.current === queryKey && <p role="status">{error}</p>}
    {comparison && <WildlifeJawComparison left={species.slug} right={comparison.slug} />}
    {comparison && <p>Zum Wechseln zwischen den Präparaten lade die gewünschte 3D-Ansicht. Es bleibt jeweils eine Ansicht geöffnet. Die Modelle werden unabhängig an ihren Bildschirm angepasst und haben keinen gemeinsamen Maßstab.</p>}
    <div className={comparison ? styles.comparisonGrid : undefined}>{modelPanel(species)}{comparison && modelPanel(comparison, true)}</div>
    <p><Link href={`/wildkunde/${species.slug}${jawModelsBySlug[species.slug] ? "#kiefer-3d" : "#gebiss"}`}>Zum vollständigen Artenporträt: {species.name}</Link></p>
    {comparison ? <p><Link href={`/wildkunde/${comparison.slug}${jawModelsBySlug[comparison.slug] ? "#kiefer-3d" : "#gebiss"}`}>Zum vollständigen Artenporträt: {comparison.name}</Link></p> : <WildlifeDentition key={`teeth-${species.slug}`} slug={species.slug} name={species.name} />}
  </LearningToolLayout>;
}
