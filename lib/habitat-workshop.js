// Qualitatives Lernmodell: keine Bestands-, Flächen- oder Ansiedlungsprognose.
// Fachquellen zuletzt abgeglichen am 2026-10-04; alle Texte sind eigene Kurzfassungen.
export const habitatSources = {
  network: { title: "BfN: Pflege und Biotopverbund", url: "https://www.bfn.de/pflege-und-verbund" },
  meadow: { title: "BfN Naturdetektive: Wiesen und Hecken", url: "https://naturdetektive.bfn.de/lexikon/zum-lesen/lebensraeume/land/wiesen-und-hecken.html" },
  wood: { title: "LWF auf Waldwissen: Totholz als Nahrung, Brutraum und Trommelplatz", url: "https://www.waldwissen.net/de/lebensraum-wald/naturschutz/artenschutz/waldvoegel-und-totholz" },
  frog: { title: "info fauna / karch: Erdkröte und ihre Lebensräume", url: "https://www.infofauna.ch/de/beratungsstellen/amphibien-karch/die-amphibien/arten/erdkroete" },
  deer: { title: "Deutsche Wildtier Stiftung: Reh", url: "https://www.deutschewildtierstiftung.de/wildtiere/reh" },
  hare: { title: "Deutsche Wildtier Stiftung: Feldhase", url: "https://www.deutschewildtierstiftung.de/wildtiere/feldhase" },
  partridge: { title: "Deutsche Wildtier Stiftung: Rebhuhn", url: "https://www.deutschewildtierstiftung.de/wildtiere/rebhuhn" },
  lark: { title: "Schweizerische Vogelwarte: Leitartenkarte Feldlerche", url: "https://www.vogelwarte.ch/wp-content/uploads/2023/11/Feldlerche.pdf" },
  squirrel: { title: "Deutsche Wildtier Stiftung: Eichhörnchen", url: "https://www.deutschewildtierstiftung.de/wildtiere/eichhoernchen" },
  hedgehog: { title: "Deutsche Wildtier Stiftung: Igel", url: "https://www.deutschewildtierstiftung.de/wildtiere/igel" },
};

export const habitatFeatures = [
  { id: "wald", name: "Strukturreicher Wald", icon: "tree", function: "Unterschiedliche Baumarten und Altersstufen", text: "Fruchttragende Bäume, Sträucher und ein gegliederter Waldrand bieten verschiedene Nahrung und Rückzugsorte. Welche Baumarten passen, hängt vom Standort ab.", source: "squirrel" },
  { id: "hecke", name: "Niedrige Hecke mit Saum", icon: "leaf", function: "Deckung und Übergang", text: "Einheimische Sträucher mit einem ungespritzten, krautigen Rand verbinden Lebensräume. Form, Breite und Pflege entscheiden mit; eine hohe Baumreihe ist kein Ersatz für jede niedrige Hecke.", source: "meadow" },
  { id: "wiese", name: "Artenreiche Wiese", icon: "wheat", function: "Pflanzen- und Insektenangebot", text: "Blüten, unterschiedliche Wuchshöhen und zeitlich versetzte Pflege schaffen Nahrungs- und Rückzugsbereiche. Der passende Schnittzeitpunkt muss zum Standort und zu vorhandenen Brutplätzen passen.", source: "meadow" },
  { id: "brache", name: "Brachen und Altgras", icon: "leaf", function: "Nahrung und bodennahe Deckung", text: "Krautreiche, zeitweise ungenutzte Teilflächen können Insekten, Samen und Deckung liefern. Sie brauchen eine zum Schutzziel passende Pflege; dauerhaftes Verbuschen hilft Offenlandarten nicht automatisch.", source: "partridge" },
  { id: "wasser", name: "Vegetationsreiches Gewässer", icon: "wind", function: "Laichraum und Uferstruktur", text: "Ein dauerhaftes Gewässer mit geeigneter Ufervegetation kann Erdkröten einen Laichplatz bieten. Andere Amphibien brauchen andere Gewässertypen. Wasser allein ersetzt den Landlebensraum nicht.", source: "frog" },
  { id: "offen", name: "Offene Feldzone", icon: "wheat", function: "Raum für Offenlandarten", text: "Die Feldlerche benötigt offene Bereiche mit geeigneter, nicht zu dichter Vegetation. Hohe Gehölze gehören für dieses Lernziel an andere Stellen, nicht unmittelbar in ihren Brutbereich.", source: "lark" },
  { id: "altholz", name: "Alt- und Totholz", icon: "tree", function: "Höhlen und Holzlebewesen", text: "Alte Bäume, Höhlen und unterschiedliche Totholzformen stellen Nahrung und Quartiere bereit. Geeignete Strukturen erhalten, wo die Verkehrssicherheit fachlich geklärt ist; ein einzelner Holzstapel erfüllt nicht alle Funktionen.", source: "wood" },
  { id: "verbund", name: "Verbindung und Ruhe", icon: "shield", function: "Erreichbare Teilräume", text: "Passierbare Verbindungen und störungsarme Rückzugsräume gehören zu einer funktionsfähigen Landschaft. Straßen, Zäune und Beleuchtung können Wege unterbrechen; ihre Wirkung bleibt im Einzelfall zu prüfen.", source: "network" },
];

const need = (label, ids) => ({ label, ids });
export const habitatSpecies = [
  { id: "reh", name: "Reh", icon: "deer", needs: [need("Äsungsflächen", ["wiese", "brache"]), need("Deckung", ["wald", "hecke"]), need("Erreichbare Rückzugsorte", ["verbund"])], text: "Rehe nutzen Wald, Feldflur und ihre Übergänge. Nahrung, Deckung und Ruhe ergänzen einander. Ein Waldfleck allein sagt weder etwas über die Tragfähigkeit noch über den Wildbestand aus.", source: "deer" },
  { id: "feldhase", name: "Feldhase", icon: "leaf", needs: [need("Vielfältige Pflanzenkost", ["wiese", "brache"]), need("Bodennahe Deckung", ["brache", "hecke"]), need("Verbund", ["verbund"])], text: "Feldhasen profitieren von vielfältiger, strukturreicher Feldflur. Kräuter, Säume und ungestörte Teilflächen erfüllen unterschiedliche Aufgaben. Wetter, Nutzung und räumliche Anordnung beeinflussen den tatsächlichen Nutzen.", source: "hare" },
  { id: "rebhuhn", name: "Rebhuhn", icon: "eye", needs: [need("Offene Feldflur", ["offen"]), need("Insekten und Samen", ["brache", "wiese"]), need("Niedrige Deckung", ["brache", "hecke"])], text: "Rebhühner brauchen Nahrung und bodennahe Deckung in offener Feldflur; besonders Küken sind auf Insekten angewiesen. Niedrige Strukturen gezielt planen. Hohe Bäume können zusätzliche Ansitzwarten für Beutegreifer schaffen.", source: "partridge" },
  { id: "feldlerche", name: "Feldlerche", icon: "eye", needs: [need("Offene Brutzone", ["offen"]), need("Geeignete Vegetationsstruktur", ["brache", "wiese"]), need("Rücksicht bei Pflege und Nutzung", ["verbund"])], text: "Die Feldlerche ist ein Bodenbrüter offener Landschaften und meidet die Nähe hoher Strukturen. Eine hohe Hecke ist deshalb keine allgemeine Verbesserung ihres Brutplatzes. Vegetationsdichte und Nutzung bleiben entscheidend.", source: "lark" },
  { id: "erdkroete", name: "Erdkröte", icon: "health", needs: [need("Geeigneter Laichplatz", ["wasser"]), need("Landlebensraum", ["wald", "hecke"]), need("Sichere Wanderverbindung", ["verbund"])], text: "Erdkröten nutzen Gewässer zum Laichen und verbringen viel Zeit an Land. Straßen zwischen beiden Teilräumen sind ein Problem. Ein neuer Teich garantiert keine Besiedlung; bestehende Wanderwege und Laichorte mit Fachleuten abgleichen.", source: "frog" },
  { id: "eichhoernchen", name: "Eichhörnchen", icon: "paw", needs: [need("Samentragende Bäume", ["wald"]), need("Alte Baumstrukturen", ["altholz"]), need("Erreichbare Baumgruppen", ["verbund"])], text: "Eichhörnchen finden Samen, Nüsse und andere Nahrung in Baumlandschaften. Alte, fruchttragende Mischbestände und Plätze für Kobel sind wertvoll. Totholz allein liefert noch keinen ganzjährig passenden Baumlebensraum.", source: "squirrel" },
  { id: "igel", name: "Igel", icon: "paw", needs: [need("Bodennahe Unterschlüpfe", ["hecke", "brache"]), need("Wirbellose als Nahrung", ["wiese", "brache"]), need("Durchgängige Wege", ["verbund"])], text: "Igel nutzen gegliederte Landschaften und Gärten mit Verstecken und Wirbellosen. Dichte Zäune und Verkehr können Teilräume trennen. Eine aufgeräumte Fläche ohne Deckung erfüllt ihre Bedürfnisse schlechter.", source: "hedgehog" },
  { id: "buntspecht", name: "Buntspecht", icon: "tree", needs: [need("Baumlebensraum", ["wald"]), need("Nahrung und Höhlenstrukturen", ["altholz"]), need("Störungsarme Teilräume", ["verbund"])], text: "Buntspechte nutzen Bäume zur Nahrungssuche und zum Höhlenbau. Alte und abgestorbene Baumteile unterstützen diese Funktionen. Auch Holzart, Zustand und lebender Baumbestand zählen; mehr Totholz ist kein pauschaler Bestandsrechner.", source: "wood" },
];

export const habitatPresets = [
  { id: "leer", name: "Von vorn beginnen", ids: [] },
  { id: "feld", name: "Feldflur entdecken", ids: ["offen", "wiese", "brache", "hecke", "verbund"] },
  { id: "wald", name: "Wald und Gewässer", ids: ["wald", "altholz", "wasser", "verbund"] },
];

export function evaluateHabitat(selected) {
  const known = new Set(habitatFeatures.map(feature => feature.id));
  const ids = new Set(Array.from(selected || []).filter(id => known.has(id)));
  return habitatSpecies.map(species => ({ ...species, resources: species.needs.map(resource => ({ ...resource, covered: resource.ids.some(id => ids.has(id)), present: resource.ids.filter(id => ids.has(id)) })) }));
}

export const habitatQuestions = [
  { id: "offene-zone", title: "Gleiche Maßnahme für alle Arten?", question: "Du willst eine offene Feldlerchen-Brutzone verbessern. Was ist sachgerecht?", options: ["Die Brutzone vollständig mit hohen Bäumen bepflanzen", "Den offenen Charakter und geeignete Vegetationsstruktur erhalten", "Nur einen Teich anlegen und die übrige Nutzung ignorieren"], answer: 1, explanation: "Feldlerchen meiden hohe Strukturen. Offenheit, passende Vegetation und abgestimmte Nutzung gehören zusammen. Gehölze können an anderen Stellen der Landschaft sinnvoll sein.", source: "lark" },
  { id: "amphibien-verbund", title: "Wasser reicht nicht", question: "Ein Laichgewässer und ein Wald werden von einer stark befahrenen Straße getrennt. Was ist noch offen?", options: ["Die sichere Wanderverbindung zwischen Wasser und Land", "Nur die Farbe des Wassers", "Ob ein Holzstapel im Gewässer liegt"], answer: 0, explanation: "Erdkröten wechseln zwischen Land- und Wasserlebensraum. Ein geeigneter Teich beseitigt die Gefahr auf einer Wanderroute nicht. Schutzmaßnahmen müssen fachlich und örtlich abgestimmt werden.", source: "frog" },
  { id: "beweis", title: "Modell und Wirklichkeit", question: "Alle Lernbausteine sind ausgewählt. Welche Aussage ist zulässig?", options: ["Alle acht Arten werden sicher einziehen", "Der Wildbestand steigt genau um 30 Prozent", "Das Modell zeigt angebotene Funktionen; reales Vorkommen muss untersucht werden"], answer: 2, explanation: "Das Lernmodell ordnet Funktionen zu. Flächengröße, räumliche Lage, Wasserqualität, Nutzung und bereits vorhandene Tiere fehlen als Messdaten. Eine Besiedlungs- oder Bestandsprognose lässt sich daraus nicht ableiten.", source: "network" },
];
