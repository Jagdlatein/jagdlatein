// Curated comparisons, never image recognition. Each retained biological fact
// has claim-level provenance in data/reviews/revier-photo-guide-2026-10-22.json.
export const PHOTO_GUIDE_REVIEWED_ON = "2026-10-22";

const source = (id, title, url, organization) => ({ id, title, url, organization });
export const PHOTO_GUIDE_SOURCES = [
  source("wt-roe", "Woodland Trust: Roe deer", "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/mammals/roe-deer/", "Woodland Trust"),
  source("ptes-mammals", "PTES: Spotting wild mammals (2015)", "https://ptes.org/wp-content/uploads/2015/03/Spotting-Wild-Mammals-2015-low-res.pdf", "People’s Trust for Endangered Species"),
  source("ms-red", "Mammal Society: Red deer – Vergleichsarten", "https://mammal.org.uk/british-mammals/red-deer", "Mammal Society"),
  source("wt-red", "Woodland Trust: Red deer", "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/mammals/red-deer/", "Woodland Trust"),
  source("djv-red", "Deutscher Jagdverband: Rothirsch", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/rothirsch-cervus-elaphus", "Deutscher Jagdverband"),
  source("stadtfauna-red", "Stadtwildtiere / Stadtfauna: Rothirsch", "https://bern.stadtwildtiere.ch/artportraet/rothirsch", "Haupt Verlag / Stadtfauna, mit Genehmigung bei Stadtwildtiere (Verein StadtNatur)"),
  source("wt-fallow", "Woodland Trust: Fallow deer", "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/mammals/fallow-deer/", "Woodland Trust"),
  source("djv-fallow", "Deutscher Jagdverband: Damwild", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/damwild-dama-dama", "Deutscher Jagdverband"),
  source("bds-fallow", "British Deer Society: Identifying fallow deer", "https://bds.org.uk/wp-content/uploads/2020/05/Deer-Identification-sheets-Fallow-Deer.pdf", "British Deer Society"),
  source("djv-chamois", "Deutscher Jagdverband: Gämse", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/gaemse-rupicapra-rupicapra", "Deutscher Jagdverband"),
  source("oetztal-chamois", "Naturpark Ötztal: Alpengämse", "https://www.naturpark-oetztal.at/wissen/natur-im-fokus/tiere/alpengaemse/", "Naturpark Ötztal"),
  source("snp-ibex", "Schweizerischer Nationalpark / SCNAT: Der Steinbock (2011)", "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Steinbock.pdf", "Schweizerischer Nationalpark / SCNAT"),
  source("dws-ibex", "Deutsche Wildtier Stiftung: Alpensteinbock", "https://www.deutschewildtierstiftung.de/wildtiere/alpensteinbock", "Deutsche Wildtier Stiftung"),
  source("lbv-ibex", "LBV: Alpensteinbock", "https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/alpensteinbock/", "LBV – Landesbund für Vogel- und Naturschutz in Bayern"),
  source("dws-boar", "Deutsche Wildtier Stiftung: Wildschwein", "https://www.deutschewildtierstiftung.de/wildtiere/wildschwein", "Deutsche Wildtier Stiftung"),
  source("ms-boar", "Mammal Society: Wild boar", "https://mammal.org.uk/british-mammals/wild-boar", "Mammal Society"),
  source("wt-boar", "Woodland Trust: Wild boar", "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/mammals/wild-boar/", "Woodland Trust"),
  source("ms-hare", "Mammal Society: Brown hare", "https://mammal.org.uk/british-mammals/brown-hare", "Mammal Society"),
  source("twt-hare", "The Wildlife Trusts: Brown hare", "https://www.wildlifetrusts.org/wildlife-explorer/mammals/brown-hare", "The Wildlife Trusts"),
  source("ms-rabbit", "Mammal Society: European rabbit", "https://mammal.org.uk/british-mammals/european-rabbit", "Mammal Society"),
  source("twt-rabbit", "The Wildlife Trusts: Rabbit", "https://www.wildlifetrusts.org/wildlife-explorer/mammals/rabbit", "The Wildlife Trusts"),
  source("twt-tracks", "The Wildlife Trusts: Identify tracks", "https://www.wildlifetrusts.org/how-identify/identify-tracks", "The Wildlife Trusts"),
  source("maryland-tracks", "Maryland DNR: Animal Treks – Identifying tracks in the snow", "https://news.maryland.gov/dnr/2016/12/21/animal-treks/", "Maryland Department of Natural Resources"),
  source("wt-badger", "Woodland Trust: Badger – Trittmerkmale", "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/mammals/badger/", "Woodland Trust"),
];

export const PHOTO_GUIDE_GROUPS = [
  {
    id: "cervids", title: "Hirschartige", description: "Reh-, Rot- und Damwild vergleichen.",
    traits: [
      { id: "pale-rump", label: "Heller Fleck am Hinterteil", help: "Der helle Bereich heißt Spiegel. Vergleiche zusätzlich Schwanz und Geweih, falls sichtbar." },
      { id: "no-visible-tail", label: "Kein freier Schwanz erkennbar", help: "Nur auswählen, wenn das ganze Hinterteil klar zu sehen ist. Ein verdeckter Schwanz zählt nicht." },
      { id: "branched-antlers", label: "Verzweigte Geweihstangen", help: "Keine flächigen Schaufeln. Ein Geweih allein ist kein sicherer Artbeweis." },
      { id: "palmate-antlers", label: "Flächiges Schaufelgeweih", help: "Deutlich verbreiterte Geweihflächen statt nur einzelner Stangen und Enden." },
      { id: "dark-rump-border", label: "Dunkler Rand um hellen Spiegel", help: "Das gesamte Hinterteil betrachten; nicht nur einen dunklen Schatten auswählen." },
      { id: "visible-tail", label: "Schwanz deutlich sichtbar", help: "Der Schwanz muss selbst zu sehen sein, nicht nur ein Haarbüschel oder Schatten." },
    ],
  },
  {
    id: "mountain", title: "Hörner im Gebirge", description: "Gämse und Alpensteinbock vergleichen.",
    traits: [
      { id: "hooked-horns", label: "Schlanke Hörner mit Haken an der Spitze", help: "Die Hörner steigen zunächst auf; die Spitze ist deutlich nach hinten und unten gebogen." },
      { id: "dark-face-stripes", label: "Dunkle Streifen im hellen Gesicht", help: "Vergleiche die seitlichen Streifen über den Augen mit der hellen Gesichtsfläche." },
      { id: "broad-curved-horns", label: "Kräftige, weit nach hinten gebogene Hörner", help: "Die gesamte Hornform betrachten. Kleine oder verdeckte Hörner offenlassen." },
      { id: "horn-front-bumps", label: "Deutliche Wülste an der Hornvorderseite", help: "Die Vorderkante des Horns muss erkennbar sein. Daraus wird hier kein Alter berechnet." },
    ],
  },
  {
    id: "boar", title: "Rüssel und Borsten", description: "Sichtbare Merkmale mit Schwarzwild vergleichen.",
    traits: [
      { id: "pig-snout", label: "Ausgeprägter Rüssel", help: "Die Schnauze und ihre Endfläche müssen erkennbar sein." },
      { id: "coarse-bristles", label: "Grobes, borstiges Haarkleid", help: "Ein dunkler Fleck im Foto genügt nicht; die Haarstruktur sollte sichtbar sein." },
      { id: "longitudinal-stripes", label: "Helle Längsstreifen am Körper", help: "Gemeint sind Streifen entlang des Rumpfs, nicht Schatten von Pflanzen." },
    ],
  },
  {
    id: "lagomorphs", title: "Lange Ohren", description: "Feldhase und Wildkaninchen vergleichen.",
    traits: [
      { id: "long-black-tipped-ears", label: "Sehr lange Ohren mit schwarzen Spitzen", help: "Ohrspitzen und Ohrlänge gemeinsam betrachten." },
      { id: "long-limbs", label: "Im Vergleich langbeinige Gestalt", help: "Gemeint ist der längere Beinbau des Feldhasen gegenüber dem Wildkaninchen. Beide besitzen kräftige Hinterläufe; diese allein reichen nicht. Verdeckte Beine oder eine unklare Sitzhaltung offenlassen." },
      { id: "shorter-unmarked-ears", label: "Kürzere Ohren ohne schwarze Spitzen", help: "Im Vergleich zum Feldhasen. Verdeckte oder unscharfe Spitzen offenlassen." },
    ],
  },
  {
    id: "tracks", title: "Abdrücke im Boden", description: "Schalen oder Pfoten vergleichen; die genaue Art bleibt offen.",
    traits: [
      { id: "two-hoof-parts", label: "Zwei längliche Schalen nebeneinander", help: "Ein einzelnes, klares Trittsiegel betrachten; keine zwei überlagerten Abdrücke zusammenzählen." },
      { id: "four-toe-pads", label: "Vier Zehen vor einem Ballen", help: "Nur tatsächlich erkennbare Zehen zählen. Ergänze eine Aufnahme mehrerer klarer Abdrücke." },
      { id: "five-toe-pads", label: "Fünf Zehen vor einem Ballen", help: "Nur tatsächlich erkennbare Zehen zählen. Die Zehenzahl bestimmt hier keine Tierart." },
    ],
  },
];

const fact = (id, text, sourceIds) => ({ id, text, sourceIds });
const candidate = (id, group, title, scientificName, traits, facts, limitations, question, href = `/wildkunde/${id}`) => ({
  id, group, title, scientificName, href, traits, facts, limitations, question,
  sources: [...new Set([...facts.flatMap(item => item.sourceIds), ...(question?.sourceIds || [])])].map(sourceId => PHOTO_GUIDE_SOURCES.find(item => item.id === sourceId)),
});
const question = (prompt, answer, explanation, sourceIds) => ({ prompt, answer, explanation, sourceIds });

export const PHOTO_GUIDE_CANDIDATES = [
  candidate("rehwild", "cervids", "Rehwild", "Capreolus capreolus", ["pale-rump", "no-visible-tail", "branched-antlers"], [
    fact("roe-rump-tail", "Rehwild hat einen hellen Spiegel. Sein sehr kurzer Schwanz ist äußerlich gewöhnlich nicht als freier Schwanz zu erkennen.", ["wt-roe", "ptes-mammals", "ms-red"]),
    fact("roe-antlers", "Rehböcke können kurze, verzweigte Geweihstangen tragen. Die typische Stange hat bis zu drei Enden; nicht jedes Geweih zeigt diese Form.", ["wt-roe", "ptes-mammals"]),
  ], "Die Auswahl vergleicht drei Hirscharten. Ein verdecktes Hinterteil oder fehlendes Geweih reicht nicht zur Bestimmung. Weitere Arten und Entwicklungsstadien können ähnlich aussehen.",
  question("Welches Körperteil solltest du beim Vergleich von Reh- und Damwild zusätzlich zum Geweih betrachten?", "Das vollständig sichtbare Hinterteil mit Spiegel und Schwanz.", "Beim Reh ist der Schwanz sehr kurz; beim Damwild ist ein längerer Schwanz zusammen mit der Spiegelzeichnung ein nützlicher Vergleichspunkt.", ["ptes-mammals", "djv-fallow", "bds-fallow"])),
  candidate("rotwild", "cervids", "Rotwild", "Cervus elaphus", ["pale-rump", "branched-antlers", "visible-tail"], [
    fact("red-rump", "Beim Rotwild ist der Spiegel hell cremefarben. Ein kurzer Schwanz kann davor sichtbar sein.", ["wt-red", "ms-red", "stadtfauna-red"]),
    fact("red-antlers", "Das Geweih eines entsprechend entwickelten Rothirsches besteht aus verzweigten Stangen. Die ausgebildete Form unterscheidet sich von den flächigen Schaufeln eines Damhirsches.", ["wt-red", "ms-red", "djv-fallow", "wt-fallow"]),
    fact("red-colour", "Rotwild kann ein rotbraunes Haarkleid zeigen. Für diesen Vergleich entscheidet die Fellfarbe allein nicht über die Art.", ["wt-red", "djv-red"]),
  ], "Größe im Foto ist ohne verlässlichen Vergleich kein Körpermaß. Ein junger Hirsch muss noch kein stark verzweigtes Geweih tragen. Die Auswahl deckt nicht alle Hirscharten ab.",
  question("Welcher Vergleich ist bei deutlich ausgebildetem Rot- und Damhirschgeweih hilfreich?", "Verzweigte Stangen mit flächigen Schaufeln vergleichen.", "Rotwild entwickelt verzweigte Geweihstangen; die Schaufelbildung ist ein typischer Vergleichspunkt beim entsprechend entwickelten Damhirsch. Fehlende Schaufeln allein schließen Damwild nicht aus.", ["wt-red", "ms-red", "djv-fallow", "wt-fallow"])),
  candidate("damwild", "cervids", "Damwild", "Dama dama", ["pale-rump", "palmate-antlers", "dark-rump-border", "visible-tail"], [
    fact("fallow-rump-tail", "Typisches Damwild zeigt einen hellen, dunkel umrahmten Spiegel und einen vergleichsweise langen Schwanz mit dunkler Zeichnung.", ["djv-fallow", "bds-fallow", "wt-fallow"]),
    fact("fallow-palmation", "Entsprechend entwickelte Damhirsche tragen ein flächiges Schaufelgeweih. Junge Hirsche müssen noch keine Schaufeln zeigen.", ["djv-fallow", "wt-fallow", "bds-fallow"]),
    fact("fallow-colour", "Damwild kommt in unterschiedlichen Farbschlägen vor, auch sehr dunkel oder hell. Das typische Sommerkleid ist gefleckt. Die Fellfarbe allein entscheidet diesen Vergleich nicht.", ["djv-fallow", "wt-fallow"]),
  ], "Die typische Zeichnung ist nicht bei jedem Farbschlag gleich deutlich. Auch andere Arten können Flecken oder einen hellen Spiegel zeigen. Ein verdecktes Merkmal ist kein Ausschlussbeweis.",
  question("Schließt ein sehr dunkles Haarkleid Damwild aus?", "Nein. Damwild besitzt unterschiedliche Farbschläge.", "Neben der typischen gefleckten Form gibt es unter anderem dunkle und helle Formen. Vergleiche mehrere sichtbare Merkmale.", ["djv-fallow", "wt-fallow"])),
  candidate("gamswild", "mountain", "Gämse", "Rupicapra rupicapra", ["hooked-horns", "dark-face-stripes"], [
    fact("chamois-horns", "Die schlanken Gämshörner steigen zunächst auf und sind an den Spitzen hakenförmig nach hinten und unten gebogen.", ["djv-chamois", "oetztal-chamois"]),
    fact("chamois-face", "Typisch ist das helle Gesicht mit dunklen seitlichen Streifen über den Augen. Vergleiche Gesichtszeichnung und Hornform gemeinsam.", ["djv-chamois", "oetztal-chamois"]),
    fact("chamois-sexes", "Bei der Gämse tragen beide Geschlechter Hörner. Hörner allein bedeuten deshalb nicht, dass ein männliches Tier zu sehen ist.", ["djv-chamois", "oetztal-chamois"]),
  ], "Perspektive und Verdecken können Hornspitzen und Gesichtsstreifen unkenntlich machen. Diese Vergleichskarte berechnet weder Alter noch Geschlecht.",
  question("Beweisen sichtbare Gämshörner ein männliches Tier?", "Nein. Beide Geschlechter tragen Hörner.", "Die Hornform hilft beim Artvergleich. Eine einzelne sichtbare Hornstruktur genügt hier nicht zur Geschlechtsbestimmung.", ["djv-chamois", "oetztal-chamois"])),
  candidate("steinwild", "mountain", "Alpensteinbock", "Capra ibex", ["broad-curved-horns", "horn-front-bumps"], [
    fact("ibex-curve", "Die großen Hörner eines entsprechend entwickelten männlichen Alpensteinbocks sind weit nach hinten gebogen.", ["snp-ibex", "dws-ibex"]),
    fact("ibex-bumps", "An der Vorderseite der Hörner männlicher Alpensteinböcke fallen kräftige Wülste beziehungsweise Knoten auf.", ["snp-ibex", "lbv-ibex"]),
    fact("ibex-sexes", "Auch weibliche Alpensteinböcke tragen Hörner. Ihre Hörner bleiben deutlich kleiner als die großen Hörner ausgewachsener Böcke.", ["snp-ibex", "lbv-ibex"]),
  ], "Die typische große Bockhornform deckt Geißen und Jungtiere nicht ab. Kleine Hörner bleiben deshalb offen. Aus Schmuckknoten oder einem einzelnen Foto wird hier kein genaues Alter abgeleitet.",
  question("Tragen nur männliche Alpensteinböcke Hörner?", "Nein. Auch die weiblichen Tiere tragen Hörner.", "Die Hörner der weiblichen Tiere bleiben deutlich kleiner als die großen Hörner ausgewachsener Böcke. Ein kleines Horn ist deshalb hier kein Ausschlussgrund.", ["snp-ibex", "lbv-ibex"])),
  candidate("schwarzwild", "boar", "Schwarzwild", "Sus scrofa", ["pig-snout", "coarse-bristles", "longitudinal-stripes"], [
    fact("boar-snout-coat", "Ein ausgeprägter Rüssel und grobe Borsten gehören zu den sichtbaren Merkmalen des Wildschweins.", ["dws-boar", "ms-boar"]),
    fact("boar-stripes", "Junge Frischlinge können helle Längsstreifen auf bräunlichem Grund zeigen. Das gestreifte Haarkleid bleibt nicht dauerhaft erhalten.", ["dws-boar", "wt-boar", "ms-boar"]),
  ], "Die Karte vergleicht mit Schwarzwild und trennt keine Haus-, Gehege- oder Mischformen sicher ab. Borsten oder Streifen allein sind kein sicherer Zugehörigkeitsnachweis und bestimmen kein genaues Alter.",
  question("Ist ein fehlendes Streifenmuster ein Ausschlussgrund für Schwarzwild?", "Nein. Das Frischlingsmuster bleibt nicht dauerhaft erhalten.", "Die Längsstreifen gehören zum frühen Haarkleid. Vergleiche zusätzlich Rüssel, Körper und Borsten, ohne aus dem Foto ein genaues Alter abzulesen.", ["dws-boar", "wt-boar", "ms-boar"])),
  candidate("feldhase", "lagomorphs", "Feldhase", "Lepus europaeus", ["long-black-tipped-ears", "long-limbs"], [
    fact("hare-ears", "Der Feldhase hat im Vergleich zum Wildkaninchen lange Ohren mit schwarzen Spitzen.", ["ms-hare", "twt-hare"]),
    fact("hare-legs", "Im Vergleich zum Wildkaninchen ist der Feldhase langbeiniger und besitzt kräftige Hinterläufe.", ["ms-hare", "twt-hare"]),
  ], "Beine und Ohren können im Sitzen oder hinter Pflanzen verdeckt sein. Andere Hasenarten sind in dieser Auswahl nicht vollständig vertreten. Dunkle Ohrspitzen allein bestimmen deshalb keine Art.",
  question("Welche zwei Merkmalsgruppen vergleichst du bei Feldhase und Wildkaninchen gemeinsam?", "Ohren einschließlich Spitzen sowie den sichtbaren Beinbau.", "Der Feldhase besitzt vergleichsweise längere, schwarz gespitzte Ohren und längere Beine. Bildgröße ohne Maßstab ist kein Größenbeweis.", ["ms-hare", "twt-hare", "ms-rabbit", "twt-rabbit"])),
  candidate("wildkaninchen", "lagomorphs", "Wildkaninchen", "Oryctolagus cuniculus", ["shorter-unmarked-ears"], [
    fact("rabbit-ears", "Wildkaninchen haben im Vergleich zum Feldhasen kürzere Ohren ohne dessen schwarze Ohrspitzen.", ["ms-rabbit", "twt-rabbit", "ms-hare"]),
    fact("rabbit-build", "Im direkten Vergleich ist das Wildkaninchen kleiner und kürzerbeinig als der Feldhase.", ["ms-rabbit", "twt-rabbit", "ms-hare"]),
  ], "Die Entfernung zur Kamera kann Größe vortäuschen. Hauskaninchen und weitere Hasenarten sind in dieser Auswahl nicht vollständig vertreten. Unscharfe Ohrspitzen gelten als unbekannt.",
  question("Kann ein kleineres Tier im Foto allein sicher als Wildkaninchen gelten?", "Nein. Die Entfernung zur Kamera ist kein Körpermaß.", "Vergleiche stattdessen die im Bild erkennbaren Ohren und den Beinbau mit den beschriebenen Artmerkmalen; verdeckte Merkmale bleiben offen.", ["ms-rabbit", "twt-rabbit", "ms-hare"])),
  candidate("split-hoof-track", "tracks", "Geteilter Schalenabdruck", "", ["two-hoof-parts"], [
    fact("track-hoof", "Hirschartige hinterlassen Abdrücke der beiden Hauptschalen nebeneinander. Auch Schafe und andere Paarhufer können geteilte Hufabdrücke hinterlassen.", ["twt-tracks", "ptes-mammals"]),
    fact("track-hoof-limit", "Trittsiegel verschiedener Hirscharten können einander ähneln. Ein einzelner Schalenabdruck wird hier deshalb keiner Art zugewiesen.", ["twt-tracks", "ptes-mammals"]),
  ], "Notiere Form und gemessene Größe und fotografiere mehrere klare Trittsiegel samt Verlauf. Diese Karte ist eine Merkmalsgruppe, kein Nachweis für Reh, Hirsch oder Wildschwein.",
  question("Beweisen zwei Hauptschalen nebeneinander eine bestimmte Hirschart?", "Nein. Auch andere Paarhufer hinterlassen geteilte Hufabdrücke.", "Ähnliche Trittsiegel brauchen zusätzliche Beobachtungen. Der Fotohelfer lässt die genaue Art offen.", ["twt-tracks", "ptes-mammals"]), "/lernen/spurenwerkstatt"),
  candidate("four-toe-track", "tracks", "Pfotenabdruck mit vier sichtbaren Zehen", "", ["four-toe-pads"], [
    fact("track-four", "Bei klaren Hundeabdrücken können vier Zehen vor beziehungsweise um den größeren Ballen sichtbar sein.", ["ptes-mammals", "maryland-tracks"]),
    fact("track-four-confusion", "Auch Katzenabdrücke können vier Zehen und einen größeren Ballen zeigen. Vier sichtbare Zehen allein trennen diese Tiere nicht sicher.", ["ptes-mammals", "maryland-tracks"]),
  ], "Diese Auswahl benennt nur die sichtbare Abdruckform. Sie unterscheidet keine Hunde-, Katzen- oder Wildtierart sicher. Zähle keine überlagerten oder unscharfen Stellen als zusätzliche Zehen.",
  question("Sind vier sichtbare Zehen allein ein sicherer Wildtiernachweis?", "Nein. Auch Haustiere können solche Pfotenabdrücke hinterlassen.", "Hunde und Katzen sind wichtige Vergleichsmöglichkeiten. Die Formgruppe ersetzt keine Artbestimmung.", ["ptes-mammals", "maryland-tracks"]), "/lernen/spurenwerkstatt"),
  candidate("five-toe-track", "tracks", "Pfotenabdruck mit fünf sichtbaren Zehen", "", ["five-toe-pads"], [
    fact("track-five", "Ein klarer Dachstritt kann fünf Zehen vor einem breiten Ballen zeigen; oft kommen deutliche Krallenabdrücke hinzu.", ["twt-tracks", "wt-badger"]),
  ], "Das ist nur ein Vergleichsbeispiel für eine Pfote mit fünf Zehen, keine Bestätigung eines Dachses. Für die weitere Prüfung mehrere klare Abdrücke, Maße und den Spurverlauf dokumentieren.",
  question("Bestätigt diese Karte mit fünf Zehen bereits einen Dachs?", "Nein. Sie zeigt eine Vergleichsgruppe und beschreibt ein mögliches Beispiel.", "Der Dachstritt hat neben der Zehenzahl weitere Merkmale wie breiten Ballen und Krallen. Ein einzelnes Detail genügt hier nicht zur Artbestimmung.", ["twt-tracks", "wt-badger"]), "/lernen/spurenwerkstatt"),
];

export const PHOTO_GUIDE_LIMITATIONS = "Die Auswahl vergleicht deine selbst gewählten sichtbaren Merkmale mit geprüften Lernkarten. Sie analysiert das Foto nicht und bestätigt keine Tierart. Nicht sichtbare Merkmale bleiben unbekannt. Für Alter, Gesundheit oder jagdliche Entscheidungen ist dieser Vergleich nicht geeignet.";

/** Exact positive-trait intersection. No scoring, probabilities or inferred negatives. */
export function getPhotoGuideMatches({ group, traits } = {}) {
  const selectedGroup = PHOTO_GUIDE_GROUPS.find(item => item.id === group);
  const base = { group: selectedGroup?.id || "", selectedTraits: [], matches: [], limitations: PHOTO_GUIDE_LIMITATIONS };
  if (!selectedGroup) return { ...base, status: "needs-group", message: "Wähle zuerst eine Vergleichsgruppe." };
  if (traits == null || (Array.isArray(traits) && traits.length === 0)) {
    return { ...base, status: "needs-traits", message: "Wähle nur die Merkmale, die du tatsächlich klar erkennen kannst." };
  }
  const allowed = new Set(selectedGroup.traits.map(item => item.id));
  if (!Array.isArray(traits) || traits.some(item => typeof item !== "string" || !allowed.has(item))) {
    return { ...base, status: "no-match", message: "Diese Merkmalsauswahl ist für die Gruppe nicht gültig. Bitte wähle die sichtbaren Merkmale neu." };
  }
  const selectedTraits = [...new Set(traits)];
  const matches = PHOTO_GUIDE_CANDIDATES.filter(item => item.group === group && selectedTraits.every(id => item.traits.includes(id)))
    .map(item => ({ ...item, matchedTraits: selectedGroup.traits.filter(trait => selectedTraits.includes(trait.id)) }));
  return {
    ...base, selectedTraits, matches,
    status: matches.length ? "comparison" : "no-match",
    message: matches.length ? "Vergleiche die beschriebenen Merkmale mit deinem Foto. Die genaue Bestimmung bleibt offen." : "Für diese Kombination gibt es keine passende Vergleichskarte. Das schließt keine Art aus. Lass unsichere Merkmale offen oder wähle eine andere Gruppe.",
  };
}
