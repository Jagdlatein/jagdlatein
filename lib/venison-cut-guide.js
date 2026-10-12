const root = "/lernen/wildbret-stuecke-2026";

export const venisonCutSources = {
  djv: { organization: "Deutscher Jagdverband", label: "Wild auf Wild: Verwertbare Teilstücke", url: "https://www.wild-auf-wild.de/kuechentipps/verwertbare-teilstuecke" },
  pennState: { organization: "Penn State Extension", label: "Anatomische Zuordnung von Schulter, Rücken, Filet und Keule", url: "https://extension.psu.edu/how-do-you-break-down-your-venison-carcass" },
  proviande: { organization: "Proviande", label: "Schweizer Fleisch: Bindegewebe und passende Gartechniken", url: "https://schweizerfleisch.ch/kochwissen/bindegewebereiches-fleisch" },
  proviandeSchmoren: { organization: "Proviande", label: "Schweizer Fleisch: Schmoren", url: "https://schweizerfleisch.ch/kochwissen/schmoren" },
  bfr: { organization: "Bundesinstitut für Risikobewertung", label: "Lebensmittelsicherheit Wildbret – Hygieneregeln", url: "https://www.bfr.bund.de/presse/infografiken/lebensmittelsicherheit-wildbret/" },
  ages: { organization: "AGES", label: "Fleisch: sorgfältige Küchenhygiene und Durcherhitzen", url: "https://www.ages.at/mensch/ernaehrung-lebensmittel/lebensmittelinformationen/fleisch" },
};

export const venisonCutPhoto = {
  src: `${root}/reh-teilstuecke.webp`, author: "Hans J. Klaiber", date: "2. Dezember 2015", location: "Wildkammer nahe Sigmaringen, Deutschland",
  source: "https://commons.wikimedia.org/wiki/File:Roe_deer_cuts_game-cleaning_facility_Germany_01.png",
  original: "https://www.youtube.com/watch?v=LOaacM5TzTA", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  changes: "Reale Einzelaufnahme aus dem Originalfilm, für die App in WebP umgewandelt. Einzelbilder sind Ausschnitte dieser Aufnahme; Nummern sind eine ergänzte Beschriftung. Kein Fleischstück wurde hinzugefügt oder ersetzt.",
  provenance: "Die Commons-Dateibeschreibung benennt ausdrücklich zwei Schultern, Rippen, zwei Keulen, Rücken und oben Hals. Die ursprüngliche YouTube-Lizenz wurde am 3. Januar 2022 auf Commons bestätigt.",
  alt: "Zerwirktes Reh: links zwei Schultern, daneben Rippen, in der Mitte zwei Keulen, rechts Rücken und oberhalb der Keulen Hals. Nummern 1 bis 5 ordnen diese Stücke zu.",
};

// Marker positions are percentages of the uncropped 1920 × 1080 photograph.
// Small photos are crops of the same documented recording, not stock substitutes.
export const venisonCuts = [
  {
    id: "schulter", number: 1, title: "Schulter / Blatt", aliases: ["Blätter", "Vorderlauf", "Schulterbraten"], marker: { x: 18, y: 52 }, photo: `${root}/schulter.webp`,
    photoAlt: "Die beiden Schultern links in der dokumentierten Rehaufnahme; Ausschnitt desselben Fotos.",
    location: "Vorderer Teil des Körpers am Schulterblatt. Im Bild liegen zwei Schultern links, jeweils mit einem Teil des Vorderlaufs.",
    recognition: "Die flächige Schulterpartie setzt sich vom schmaleren unteren Laufabschnitt ab. ‚Blatt‘ wird jagdlich für das Schulterblatt verwendet; als Küchenstück ist damit häufig die Schulterpartie gemeint.",
    methods: ["Schmoren", "Ragout / Gulasch", "Schulterbraten"],
    cooking: "Schulter eignet sich für ein Schmorgericht oder gewürfeltes Ragout. Bindegewebereiche Partien brauchen ausreichend Zeit mit feuchter Hitze, damit sie zart werden. Ein ganzes Schulterstück und kleine Ragoutwürfel haben unterschiedliche Garzeiten.",
    distinction: "Die Schulter gehört zum Vorderkörper, die Keule zum Hinterbein. Gleich große Fleischstücke sind deshalb nicht automatisch für dieselbe kurze Garzeit geeignet.",
    sources: ["djv", "pennState", "proviande"],
  },
  {
    id: "rippen", number: 2, title: "Rippen", aliases: ["Rippchen", "Brust", "Rippenbogen"], marker: { x: 37, y: 52 }, photo: `${root}/rippen.webp`,
    photoAlt: "Das kleine Rippenstück zwischen Schultern und Keulen in der dokumentierten Rehaufnahme.",
    location: "Seitliche Brustkorbpartie. In der Aufnahme liegt ein kleines Rippenstück zwischen den beiden Schultern und den Keulen.",
    recognition: "Parallel angeordnete Knochen und Fleisch zwischen beziehungsweise auf den Rippen sind die Merkmale. Hier ist ein zugeschnittenes Rippenstück zu sehen, nicht der vollständige Brustkorb.",
    methods: ["Ofenbraten", "Grillen", "Schmoren"],
    cooking: "DJV nennt Rippen als Stücke für Ofen und Grill. Für Partien mit mehr Bindegewebe ist auch eine längere, feuchte Zubereitung passend. Die Wahl richtet sich nach Zuschnitt und Stärke; die Bezeichnung ‚Rippchen‘ allein ist keine feste Minutenangabe.",
    distinction: "Rippen mit Knochen und ausgelöstes Brustfleisch sind unterschiedliche Zuschnitte. Beim Einkauf die genaue Portion benennen lassen, statt ein beliebiges Fleischfoto als Rippen zu lesen.",
    sources: ["djv", "pennState", "proviande"],
  },
  {
    id: "keule", number: 3, title: "Keule / Schlegel", aliases: ["Hinterlauf", "Oberschale", "Unterschale", "Nuss", "Keulenbraten", "Schnitzel"], marker: { x: 59, y: 57 }, photo: `${root}/keule.webp`,
    photoAlt: "Die beiden großen Keulen in der Mitte der dokumentierten Rehaufnahme.",
    location: "Fleisch des Hinterbeins. Die beiden großen Stücke in der Bildmitte sind die Keulen.",
    recognition: "Eine Keule besteht aus mehreren Muskelgruppen. Ober- und Unterschale sowie Nuss sind Teilstücke daraus. Die Grenze jeder einzelnen Muskelgruppe ist auf dieser Gesamtaufnahme nicht vollständig freigelegt.",
    methods: ["Braten", "Schmoren", "Schnitzel aus passendem Teilstück"],
    cooking: "Die Keule lässt sich als Braten oder in getrennten Muskelpartien verwenden. Für Schnitzel und Steaks wird ein dafür geeigneter, sauber zugeschnittener Muskel gewählt. Bei bindegewebereicheren Abschnitten bietet sich Schmoren an. ‚Aus der Keule‘ bedeutet nicht, dass jeder Abschnitt gleich zart ist.",
    distinction: "Schlegel bezeichnet die Keule, nicht das Rückenfilet. Das Foto zeigt ganze Keulen; es kennzeichnet keine einzelne Oberschale, Unterschale oder Nuss als bereits ausgelöstes Stück.",
    sources: ["djv", "pennState", "proviande"],
  },
  {
    id: "ruecken", number: 4, title: "Rücken", aliases: ["Rückenstrang", "Rückenbraten", "Medaillons", "Rückensteak", "Filet"], marker: { x: 88, y: 49 }, photo: `${root}/ruecken.webp`,
    photoAlt: "Der längliche Rücken rechts in der dokumentierten Rehaufnahme; kein separat ausgelegtes Filet.",
    location: "Entlang der Wirbelsäule. Das längliche Stück ganz rechts ist der Rücken.",
    recognition: "Die Rückenstränge liegen außen entlang der Wirbelsäule. Die kleineren Filets sitzen innen an deren Unterseite. Rückenstrang und Filet sind deshalb verschiedene Muskelstücke.",
    methods: ["Pfanne", "Grillen", "Braten im Ofen"],
    cooking: "Ausgelöste Rückenstränge eignen sich für Steaks oder Medaillons, ein größerer Rücken für den Ofen. Stückdicke und Zuschnitt bestimmen das Vorgehen. ‚Kurzbraten‘ beschreibt die Methode; es ersetzt das hygienisch notwendige Durcherhitzen nicht.",
    distinction: "In dieser Aufnahme ist kein separat ausgelegtes Filet dokumentiert. Das rechte Stück darf als Rücken bezeichnet werden; ein beliebiger schmaler Ausschnitt daraus wird nicht als Filet umetikettiert.",
    sources: ["djv", "pennState", "bfr"],
  },
  {
    id: "hals", number: 5, title: "Hals / Träger", aliases: ["Nacken", "Halsbraten", "Gulasch", "Wildpfeffer", "Ragout"], marker: { x: 58, y: 34 }, photo: `${root}/hals.webp`,
    photoAlt: "Der Hals oberhalb der Keulen in der dokumentierten Rehaufnahme.",
    location: "Verbindung zwischen Kopf und Rumpf. Das kleinere längliche Stück oberhalb der Keulen ist der Hals.",
    recognition: "‚Träger‘ ist die jagdliche Bezeichnung für den Hals. Der Halsbereich enthält mehrere kleinere Muskelpartien und Bindegewebe; er ist ein anderes Teilstück als Rücken oder Keule.",
    methods: ["Schmoren im Ganzen", "Gulasch / Ragout", "Wildpfeffer"],
    cooking: "Halsfleisch passt zu langsam gegartem Ragout oder einem ganzen Schmorstück. Feuchte Hitze und ausreichend Zeit machen bindegewebereiche Partien zarter. Wildpfeffer ist ein Gericht beziehungsweise eine Zubereitung, kein anatomisches Teilstück.",
    distinction: "Für Ragout können unterschiedliche geeignete Teilstücke verwendet werden. Die Bezeichnung des Gerichts verrät deshalb nicht allein, ob Hals oder Schulter verarbeitet wurde.",
    sources: ["djv", "proviande", "proviandeSchmoren"],
  },
].map(item => ({ ...item, reviewedOn: "2026-10-12" }));

export const venisonCookingMethods = [
  { title: "Braten / Grillen", text: "Hitze wirkt überwiegend ohne zusätzliche Garflüssigkeit. Geeignete zarte, passend zugeschnittene Partien wählen und die Temperatur im Inneren kontrollieren.", sources: ["djv", "pennState", "bfr"] },
  { title: "Schmoren", text: "Das angebratene Fleisch gart anschließend mit Flüssigkeit und geschlossenem Deckel weiter. Zeit und feuchte Hitze helfen, bindegewebereiche Partien weich zu garen.", sources: ["proviande", "proviandeSchmoren", "djv"] },
  { title: "Ragout / Gulasch", text: "Hier ist das Fleisch in Würfel oder Stücke geschnitten. Schulter und Hals sind mögliche Ausgangsstücke; das Gericht ist kein eigener Körperteil.", sources: ["djv", "pennState", "proviandeSchmoren"] },
];

export const venisonKitchenSafety = {
  title: "Die Garmethode muss auch hygienisch passen",
  text: "Für Wildbret empfiehlt das BfR mindestens 70 °C über zwei Minuten im gesamten Fleisch. Die Temperatur im Inneren mit einem geeigneten Lebensmittelthermometer prüfen. Rohe Stücke von verzehrfertigen Lebensmitteln getrennt halten, Hände und Geräte reinigen und gefrorenes Wildbret im Kühlschrank auftauen. Ein Foto beweist weder Kühlkette noch Genusstauglichkeit.",
  sources: ["bfr", "ages"],
};

export const venisonCutAssetPaths = [venisonCutPhoto.src, ...venisonCuts.map(item => item.photo)];
export const venisonCutSearchEntries = venisonCuts.map(item => ({
  id: `wildbret-stueck-${item.id}`, title: `${item.title} – Wildbret mit Bild`, description: `${item.location} ${item.cooking}`,
  href: `/lernen/wildbret-stuecke?eintrag=${item.id}`, category: "Wildbret & Gesundheit", categorySlug: "wildbret-gesundheit", type: "Bildwissen", keywords: [...item.aliases, ...item.methods, "Reh", "Wildfleisch", "Zerwirken", "Teilstücke"],
}));

export function findVenisonCuts(query) {
  const normal = value => String(value).toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
  const tokens = normal(query).split(/\s+/).filter(Boolean);
  return venisonCuts.filter(item => {
    const text = normal([item.title, ...item.aliases, ...item.methods, item.location, item.cooking].join(" "));
    return tokens.every(token => text.includes(token));
  });
}
