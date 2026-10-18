import Link from "next/link";
import { Children, Fragment, isValidElement } from "react";
import LearningToolLayout from "./LearningToolLayout";
import { SoundPlayer } from "./AnimalSounds";
import { animalSounds } from "../lib/animal-sounds";
import { europeanWildlifeBySlug } from "../lib/european-wildlife-discovery";
import { birdDentitionSlugs, dentitionBySlug, dentitionWithheld } from "../lib/wildlife-dentition";
import WildlifeDentition from "./WildlifeDentition";
import WildlifeDepth, { wildlifeDepthFields } from "./WildlifeDepth";
import WildlifeKnowledgeExpansion from "./WildlifeKnowledgeExpansion";
import WildlifeLearningGuide from "./WildlifeLearningGuide";
import WildlifeJawModel from "./WildlifeJawModel";
import { jawModelsBySlug } from "../lib/wildlife-jaw-models";
import { wildlifeKnowledgeDiscovery } from "../lib/wildlife-knowledge-discovery";
import { wildlifeDepthBySlug } from "../lib/wildlife-depth";
import TopicSectionReader from "./TopicSectionReader";
import styles from "../styles/LearningExperience.module.css";
import portrait from "../styles/WildlifePortrait.module.css";

function textOf(node) {
  return Children.toArray(node).map(child => isValidElement(child) ? textOf(child.props.children) : typeof child === "string" || typeof child === "number" ? String(child) : "").join(" ").trim();
}

function headingOf(node) {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    if (child.type === "h2" || child.type === "h3" || child.type === "summary") return textOf(child.props.children);
    if (typeof child.type === "string" || child.type === Fragment) {
      const nested = headingOf(child.props.children);
      if (nested) return nested;
    }
  }
  return "";
}

// Legacy portraits already contain authored section elements. Split only their
// transparent wrappers; never inspect or mutate the rendered DOM or their text.
export function createPortraitTopics(children) {
  const nodes = [];
  function collect(items) {
    Children.forEach(items, node => {
      if (node == null || typeof node === "boolean" || typeof node === "string" && !node.trim()) return;
      if (isValidElement(node) && (node.type === Fragment || node.type === "div")) collect(node.props.children);
      else nodes.push(node);
    });
  }
  collect(children);
  const seen = new Map();
  return nodes.map((node, index) => {
    const title = isValidElement(node) && (node.type === "section" || node.type === "details") ? headingOf(node.props.children) : "";
    const label = title || "Foto und Überblick";
    const base = isValidElement(node) && node.props.id || `portrait-${title ? title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : `ueberblick-${index + 1}`}`;
    const occurrence = seen.get(base) || 0;
    seen.set(base, occurrence + 1);
    return { id: occurrence ? `${base}-${occurrence + 1}` : base, title: label, render: () => <div className={portrait.body}>{node}</div> };
  });
}

export default function WildlifePortraitLayout({ slug, title, subtitle, children, portraitSections }) {
  const species = europeanWildlifeBySlug[slug];
  const hasDentition = dentitionBySlug[slug] || dentitionWithheld.some(record => record.slug === slug) || birdDentitionSlugs.has(slug);
  const sounds = animalSounds.filter(sound => sound.speciesSlug === slug);
  const name = species?.name || title;
  const depth = wildlifeDepthBySlug[slug];
  const baseTopics = portraitSections || createPortraitTopics(children);
  const groups = [
    { id: "portrait-grundlagen", title: "Art kennenlernen", topics: baseTopics },
    { id: "artenwissen-vertiefung", title: "Biologie genauer verstehen", topics: (wildlifeKnowledgeDiscovery[slug] || []).map(section => ({ id: `art-wissen-${section.id}`, title: section.title, render: () => <WildlifeKnowledgeExpansion slug={slug} name={name} sectionId={section.id} /> })) },
    { id: "portrait-koerperbau", title: "Gebiss und Kiefer", topics: [
      ...(hasDentition ? [{ id: "gebiss", title: birdDentitionSlugs.has(slug) ? "Schnabel und Zähne" : "Gebiss im Detail", render: () => <WildlifeDentition slug={slug} name={name} /> }] : []),
      ...(jawModelsBySlug[slug] ? [{ id: "kiefer-3d", title: "Kiefer in 3D betrachten", render: () => <WildlifeJawModel key={slug} slug={slug} name={name} /> }] : []),
    ] },
    { id: "wildlife-depth", title: "Lebensweise und Unterscheidung", topics: depth ? [
      ...wildlifeDepthFields.filter(([key]) => depth[key]?.length).map(([key, label]) => ({ id: `wildlife-depth-${key}`, title: label, render: () => <WildlifeDepth slug={slug} name={name} section={key} /> })),
      ...(depth.learningQuestions?.length ? [{ id: "wildlife-depth-questions", title: "Kurze Wissensfragen", render: () => <WildlifeDepth slug={slug} name={name} section="questions" /> }] : []),
    ] : [] },
    { id: "portrait-stimmen-lernen", title: "Stimme und Weiterlernen", topics: [
      { id: "portrait-sounds", title: "Die Stimme dieser Art", render: () => <section className={styles.panel} aria-labelledby="portrait-sounds"><h2 id="portrait-sounds">Die Stimme dieser Art</h2>{sounds.length ? sounds.map(sound => <article key={sound.id}><h3>{sound.name}: {sound.call}</h3><SoundPlayer sound={sound} label={`Originalaufnahme ${sound.name}`} /><p>{sound.explanation}</p><p className={styles.muted}>{sound.confusion}</p></article>) : <p>Für diese Art ist noch keine geprüfte Originalaufnahme in der Stimmenbibliothek verfügbar. Ihre Bestimmung erfolgt zusätzlich über sichtbare Merkmale, Verhalten und Lebensraum.</p>}</section> },
      { id: "art-weiterlernen", title: "Passendes Wissen weiterlernen", render: () => <WildlifeLearningGuide slug={slug} name={name} /> },
      { id: "portrait-jagdstatus", title: "Artenkenntnis und Jagdstatus", render: () => <aside className={styles.note}><h2>Artenkenntnis und Jagdstatus</h2><p>Biologische Merkmale gelten unabhängig von Landesgrenzen. Ob eine Art bejagt werden darf, hängt dagegen von den geltenden örtlichen Bestimmungen ab. Die Rechtsübersicht von Jagdlatein behandelt Deutschland, Österreich und die Schweiz.</p><Link href={species?.europeanOnly ? "/jagdrecht/wildarten" : `/jagdrecht/wildarten?art=${slug}`}>{species?.europeanOnly ? "Zur Rechtsübersicht für DACH" : "Rechtsübersicht für diese Art →"}</Link></aside> },
    ] },
  ];
  return <LearningToolLayout title={title || `${species?.name} (${species?.scientificName})`} description={subtitle || species?.identification || "Merkmale, Lebensweise und sichere Unterscheidung kennenlernen."} icon="deer" category="wildkunde" className={portrait.page} headingOnly searchHref="/lernen#lernen-suche">
    <nav className={portrait.quietLinks} aria-label="Artenwissen"><Link href="/wildkunde">Alle Wildarten</Link></nav>
    <TopicSectionReader key={slug} id="arten-themenbaum" title="Themen dieser Art" groups={groups} />
  </LearningToolLayout>;
}
