import { useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import WildlifeJawModel from "../../components/WildlifeJawModel";
import WildlifeDentition from "../../components/WildlifeDentition";
import { europeanWildlife } from "../../lib/european-wildlife-discovery";
import { jawModelsBySlug, jawModelSpecies } from "../../lib/wildlife-jaw-models";
import styles from "../../styles/WildlifeJawModel.module.css";

export const jawAtlasSpecies = [...europeanWildlife].sort((a, b) => a.name.localeCompare(b.name, "de"));
export default function JawAtlas() {
  const router = useRouter();
  const requested = typeof router.query?.art === "string" ? router.query.art : "rehwild";
  const species = jawAtlasSpecies.find(item => item.slug === requested) || jawAtlasSpecies.find(item => item.slug === "rehwild");
  const queryKey = JSON.stringify(router.query || {});
  const currentQuery = useRef(queryKey);
  currentQuery.current = queryKey;
  const request = useRef(0);
  const [pendingRoute, setPendingRoute] = useState(null);
  const changing = pendingRoute === queryKey;
  const [error, setError] = useState("");
  const errorQuery = useRef(null);
  const available = jawAtlasSpecies.filter(item => jawModelsBySlug[item.slug]);
  const missing = jawAtlasSpecies.filter(item => !jawModelsBySlug[item.slug]);
  const mandibleCount = jawModelSpecies.filter(item => item.models.some(model => model.part === "mandible" || model.part === "right-mandible")).length;

  function choose(slug) {
    if (changing || !jawAtlasSpecies.some(item => item.slug === slug)) return;
    const attempt = ++request.current;
    const origin = queryKey;
    setPendingRoute(origin); setError("");
    try {
      Promise.resolve(router.replace({ pathname: "/lernen/kiefer-3d", query: { ...router.query, art: slug } }, undefined, { shallow: true, scroll: false }))
        .catch(failure => { if (!failure?.cancelled && currentQuery.current === origin && request.current === attempt) { errorQuery.current = origin; setError("Die Auswahl konnte gerade nicht geöffnet werden. Bitte versuche es erneut."); } })
        .finally(() => { if (request.current === attempt) setPendingRoute(null); });
    } catch { setPendingRoute(null); errorQuery.current = origin; setError("Die Auswahl konnte gerade nicht geöffnet werden. Bitte versuche es erneut."); }
  }

  return <LearningToolLayout title="Kiefer & Schädel in 3D" description="Artspezifische Sammlungspräparate von Wildarten untersuchen und Zahnformeln nachlesen." icon="cube" category="wildkunde" headingOnly searchHref="#kiefer-artauswahl">
    <label className={styles.field} id="kiefer-artauswahl">Wildart auswählen<select value={species.slug} disabled={changing} onChange={event => choose(event.target.value)}>
      <optgroup label="Mit geprüftem 3D-Modell">{available.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>
      <optgroup label="3D-Modell noch offen">{missing.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</optgroup>
    </select></label>
    <p>{jawModelSpecies.length} von {jawAtlasSpecies.length} Arten und Vergleichsformen haben hier ein geprüftes Kiefer- oder Schädelmodell; {mandibleCount} davon mit isoliertem Unterkiefer oder einer Kieferhälfte. Die übrigen Einträge bleiben ausdrücklich als offen erkennbar.</p>
    {error && errorQuery.current === queryKey && <p role="status">{error}</p>}
    {jawModelsBySlug[species.slug] ? <WildlifeJawModel key={species.slug} slug={species.slug} name={species.name} showDirectoryLink={false} /> : <section className={styles.panel} aria-labelledby="modell-offen"><h2 id="modell-offen">{species.name}: 3D-Modell noch offen</h2><p>Für diese Art ist derzeit kein eindeutig zugeordnetes und für die Anzeige geprüftes Kiefer- oder Schädelmodell eingebunden. Ein ähnliches Tier wird hier nicht als Ersatz ausgegeben.</p></section>}
    <p><Link href={`/wildkunde/${species.slug}${jawModelsBySlug[species.slug] ? "#kiefer-3d" : "#gebiss"}`}>Zum vollständigen Artenporträt: {species.name}</Link></p>
    <WildlifeDentition key={`teeth-${species.slug}`} slug={species.slug} name={species.name} />
  </LearningToolLayout>;
}
