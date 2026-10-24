import { europeanWildlifeBySlug } from "./european-wildlife-discovery";
import { birdDentitionSlugs } from "./wildlife-dentition";
import { jawModelsBySlug } from "./wildlife-jaw-models";

// Display metadata copied from existing courses/lesson takeaways. Tests compare
// these records with the actual curriculum; no lesson bodies or quiz keys belong here.
export const wildlifeGuideTargets = {
  "alpine": {
    "moduleId": "wissen-vertiefung-wild-alpine-winterstrategien",
    "title": "Gams, Steinbock und alpine Winterstrategien",
    "description": "Hornmerkmale, jahreszeitliche Einstände und fünf unterschiedliche Wege durch den Bergwinter anhand konkreter Beobachtungen vergleichen."
  },
  "deer": {
    "moduleId": "wissen-vertiefung-wild-hirsche-vergleichen",
    "title": "Reh, Rot-, Dam- und Sikawild im Vergleich",
    "description": "Körperbau, Jahresmerkmale, Nahrung und räumliche Nutzung der vier Hirscharten systematisch auseinanderhalten."
  },
  "boar": {
    "moduleId": "wissen-vertiefung-wild-schwarzwild-fortpflanzung",
    "title": "Schwarzwild: Nachwuchs, Nahrung und Fortpflanzung",
    "description": "Fortpflanzungsphasen und Familienbeobachtungen ohne starre Monatsregeln erklären; Nahrungsangebot und Forschungsbefunde richtig einordnen."
  },
  "predators": {
    "moduleId": "wissen-vertiefung-wild-kleine-beutegreifer",
    "title": "Dachs, Marder und Wiesel genauer verstehen",
    "description": "Wohnplätze, Keimruhe, Nahrungsspezialisierung und Bestimmungsgrenzen der kleinen Beutegreifer an praktischen Fällen vergleichen."
  },
  "chickens": {
    "moduleId": "wissen-vertiefung-wild-huehner-nachwuchs",
    "title": "Rebhuhn, Fasan und Raufußhühner: Nachwuchs und Lebensraum",
    "description": "Vom Kükenbedarf zur Brut- und Winterstrategie: erklären, warum Huhn nicht gleich Huhn und Wald nicht gleich geeigneter Wald ist."
  },
  "water": {
    "moduleId": "wissen-vertiefung-wild-wasservoegel-jahreslauf",
    "title": "Wasservögel: Nahrung, Mauser und Familien",
    "description": "Stockente, Krickente, Reiherente und Graugans anhand von Nahrungszonen, Entwicklung und saisonaler Gewässernutzung vergleichen."
  },
  "roe": {
    "moduleId": "wissen-rehwild-jahreslauf",
    "title": "Rehwild im Jahreslauf verstehen",
    "description": "Verbinde Körpermerkmale, Fortpflanzung und Lebensraumnutzung zu einem nachvollziehbaren Beobachtungsbild."
  },
  "roePremolar": {
    "moduleId": "wissen-rehwild-milchpraemolar-2026",
    "title": "Rehwild: Milchprämolar und bleibenden Ersatz unterscheiden",
    "description": "Die dreiteilige Milchzahnform und den zweiteiligen bleibenden Ersatz an der richtigen Unterkieferposition zuordnen."
  },
  "red": {
    "moduleId": "wissen-rotwild-sozialverhalten",
    "title": "Rotwild: Familien, Rudel und Raumnutzung",
    "description": "Lerne, Gruppenzusammensetzung und Verhalten zu beschreiben, ohne Rang, Alter oder Bestand vorschnell zu erraten."
  },
  "redVoice": {
    "moduleId": "wissen-rotwild-stimme-formanten-2026",
    "title": "Rotwild: Grundfrequenz, Formanten und beweglicher Kehlkopf",
    "description": "Die Schallquelle von den Resonanzen unterscheiden und verstehen, was sich beim Röhren im Hals verändert."
  },
  "beaverTeeth": {
    "moduleId": "wissen-biber-schneidezaehne-2026",
    "title": "Biberzähne: Warum die Schneide scharf bleibt",
    "description": "Harten Schmelz und weicheres Dentin räumlich zuordnen und die Selbstschärfung durch unterschiedlichen Abrieb verstehen."
  },
  "wildboar": {
    "moduleId": "wissen-schwarzwild-lebensweise",
    "title": "Schwarzwild: Rotte, Nahrung und Verhalten",
    "description": "Untersuche Familienverbände und Nahrungssuche anhand nachvollziehbarer Hinweise statt einfacher Schwarzwildmythen."
  },
  "mountain": {
    "moduleId": "wissen-gams-steinbock",
    "title": "Gämse und Steinbock im Gebirgslebensraum",
    "description": "Verbinde Hornmerkmale, Gruppen und Gelände mit einer ruhigen, sorgfältigen Beobachtung im Bergraum."
  },
  "rumination": {
    "moduleId": "wissen-ausbau-biologie-wiederkaeuer-2026",
    "title": "Wiederkäuer: Aus Pflanzenfasern werden Nährstoffe",
    "description": "Fermentation, Energie, mikrobielles Protein und die Entwicklung des Vormagensystems verständlich verbinden."
  },
  "birdBody": {
    "moduleId": "wissen-ausbau-biologie-vogelkoerper-2026",
    "title": "Vogelkörper: Skelett, Atemwege und Stimme",
    "description": "Flügelmuskeln, Luftsäcke, Lungenkapillaren und Syrinx als zusammenhängende Anatomie verstehen."
  },
  "birdStomach": {
    "moduleId": "wissen-ausbau-biologie-verdauungsvergleich-2026",
    "lessonId": "vogelmagen",
    "title": "Vögel trennen chemische und mechanische Magenarbeit",
    "description": "Drüsenmagen und Muskelmagen erfüllen unterschiedliche, aufeinanderfolgende Aufgaben.",
    "modelNote": "Allgemeiner Grundbauplan am Modell Huhn."
  },
  "birdEgg": {
    "moduleId": "wissen-ausbau-biologie-fortpflanzung-2026",
    "lessonId": "eiaufbau",
    "title": "Das Vogelei ist ein System aus Hüllen und Vorräten",
    "description": "Dotter, Eiklar, Hagelschnüre, Häute und poröse Schale erfüllen verschiedene Aufgaben."
  },
  "hareDigestion": {
    "moduleId": "wissen-ausbau-biologie-verdauungsvergleich-2026",
    "lessonId": "blinddarm",
    "title": "Der Feldhase vergärt hinter dem Dünndarm",
    "description": "Hinterdarmgärung nutzt Mikroben nach dem ersten Dünndarmdurchgang."
  },
  "boarStomach": {
    "moduleId": "wissen-ausbau-biologie-verdauungsvergleich-2026",
    "lessonId": "schweinemagen",
    "title": "Schweinemagen und Verdauungsdrüsen arbeiten zusammen",
    "description": "Ein einhöhliger Schweinemagen arbeitet mit Darm, Enzymdrüse, Galle und Hinterdarmmikroben zusammen."
  },
  "genetics": {
    "moduleId": "wissen-ausbau-wildtiergenetik-2026",
    "title": "Wildtiergenetik: Was eine DNA-Spur wirklich verrät",
    "description": "Art, Individuum, Wiederfund und Hybridisierung anhand nachvollziehbarer Laborfragen auseinanderhalten."
  },
  "biology": {
    "moduleId": "wissen-ausbau-anwendung-biologische-ebenen-2026",
    "title": "Biologie verstehen: Zelle, Gewebe, Organ und Stoffwechsel",
    "description": "Fachbegriffe verbinden, statt biologische Ebenen und Funktionen zu verwechseln."
  }
};

const depthGroups = [
  ["alpine", ["gamswild", "steinwild", "murmeltier", "schneehase", "schneehuhn"]],
  ["deer", ["rehwild", "rotwild", "damwild", "sikawild"]],
  ["boar", ["schwarzwild"]],
  ["predators", ["fuchs", "dachs", "steinmarder", "baummarder", "hermelin", "mauswiesel"]],
  ["chickens", ["rebhuhn", "fasan", "auerhuhn", "birkhuhn"]],
  ["water", ["stockente", "krickente", "reiherente", "graugans"]],
];
const depthBySlug = Object.fromEntries(depthGroups.flatMap(([target, slugs]) => slugs.map(slug => [slug, target])));
const directBySlug = {
  rehwild: "roe", rotwild: "red", schwarzwild: "wildboar",
  gamswild: "mountain", steinwild: "mountain", feldhase: "hareDigestion",
  biber: "beaverTeeth",
};
// Explicit assignment: Schalenwild also contains Schwarzwild and must never be
// treated as a synonym for ruminants. Unlisted forms receive general biology.
const ruminants = new Set([
  "rehwild", "rotwild", "damwild", "sikawild", "elchwild", "rentier",
  "muffelwild", "gamswild", "steinwild", "wisent", "pyrenaeengaemse", "iberiensteinbock",
]);

// Availability from the existing card bank, checked against its actual course /
// lesson selections in tests. Do not import questions or answer keys here.
const flashcardCounts = {
  alpine: 4, deer: 2, rumination: 31, birdBody: 32, birdStomach: 7,
  birdEgg: 8, hareDigestion: 8, boarStomach: 7, genetics: 13, biology: 27,
  redVoice: 2, beaverTeeth: 3, roePremolar: 1,
};

export function getWildlifeLearningGuide(slug) {
  if (!Object.prototype.hasOwnProperty.call(europeanWildlifeBySlug, slug)) return [];
  const specific = [directBySlug[slug], depthBySlug[slug]].filter(Boolean);
  const foundations = birdDentitionSlugs.has(slug) ? ["birdBody", "birdStomach", "birdEgg"]
    : ruminants.has(slug) ? ["rumination"]
      : slug === "schwarzwild" ? ["boarStomach"]
        : ["genetics", "biology"];
  // Preserve the three established targets for both deer species. Only these
  // exact additions have a fourth place; all other species keep their limit.
  const additionalSpecies = slug === "rotwild" ? ["redVoice"] : slug === "rehwild" ? ["roePremolar"] : [];
  return [...new Set([...specific, ...foundations, ...additionalSpecies])].slice(0, slug === "rotwild" || slug === "rehwild" ? 4 : 3).map(key => {
    const target = wildlifeGuideTargets[key];
    const isSpecies = specific.includes(key) || additionalSpecies.includes(key);
    return {
      ...target,
      flashcardCount: flashcardCounts[key] || 0,
      href: `/kurse/${target.moduleId}${target.lessonId ? `#lesson-${encodeURIComponent(target.lessonId)}` : ""}`,
      scope: isSpecies ? "species" : "foundation",
      label: isSpecies ? "Vertiefung zur Art" : "Biologische Grundlagen",
    };
  });
}

export function getWildlifeStudyLinks(slug) {
  const guide = getWildlifeLearningGuide(slug);
  if (!guide.length) return [];
  const cards = guide.find(target => target.flashcardCount > 0);
  const links = jawModelsBySlug[slug] ? [{ kind: "model", href: `/lernen/kiefer-3d?art=${encodeURIComponent(slug)}`, title: "3D-Präparat", context: "Kiefer- oder Schädelpräparat dieser Art" }] : [];
  if (cards) {
    const query = new URLSearchParams({ kurs: cards.moduleId, ...(cards.lessonId ? { lektion: cards.lessonId } : {}), modus: "alle" });
    links.push({ kind: "cards", href: `/lernen/lernkarten?${query}`, title: cards.scope === "species" ? "Lernkarten zur Art" : "Lernkarten: Biologie", context: cards.title, count: cards.flashcardCount });
  }
  return links;
}
