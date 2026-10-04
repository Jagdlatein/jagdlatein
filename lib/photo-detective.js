import { learningWildlifePhotos } from "./learning-wildlife-photos";

// Coordinates describe visible details in the unchanged original photographs.
// The image keeps its original aspect ratio so markers remain on those details.
const picture = (course, index = 0) => learningWildlifePhotos[course][index];
const source = (title, url) => ({ title, url });

export const photoDetectiveRounds = [
  {
    id: "gams", name: "Gämse", group: "Gebirgswild", course: "wissen-gams-steinbock",
    photo: picture("wissen-gams-steinbock"),
    neutralAlt: "Ein braunes, horntragendes Tier steht seitlich im Gebirge; helle und dunkle Gesichtspartien sind sichtbar.",
    options: ["Alpensteinbock", "Gämse", "Rehwild"],
    explanation: "Die schlanken, am Ende nach hinten gebogenen Hörner und die kontrastreiche Gesichtszeichnung passen zur Gämse. Die Hörner heißen in der Jägersprache Krucken. Vergleiche beide Merkmale am sichtbaren Tier.",
    wrong: {
      "Alpensteinbock": "Die hier sichtbaren Hörner sind schlank und an der Spitze gehakelt. Der Steinbock im Vergleichsfoto hat kräftige, weit nach hinten gebogene Hörner mit deutlichen Wülsten.",
      "Rehwild": "Rehböcke tragen ein verzweigtes Geweih. Hier sind unverzweigte, gehakelte Hörner zu sehen; das spricht gegen Rehwild.",
    },
    traits: [
      { x: 30, y: 23, title: "Schlanke Hörner", text: "Die schmalen Hörner haben nach hinten gehakelte Spitzen." },
      { x: 30, y: 35, title: "Gesichtszeichnung", text: "Der dunkle Streifen vom Auge zur Nase kontrastiert mit helleren Kopfpartien." },
      { x: 55, y: 50, title: "Fell allein reicht nicht", text: "Fellfarbe kann sich mit Jahreszeit und Individuum ändern. Nutze Hornform und Kopfzeichnung gemeinsam." },
    ],
    limit: "Ein Bild dieser Auflösung erlaubt keine genaue Altersbestimmung oder sichere Geschlechtsansprache des Tieres.",
    sources: [source("Deutsche Wildtier Stiftung: Gämse", "https://www.deutschewildtierstiftung.de/wildtiere/gams"), source("Schweizerischer Nationalpark: Die Gämse", "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Gaemse.pdf")],
  },
  {
    id: "steinbock", name: "Alpensteinbock", group: "Gebirgswild", course: "wissen-gams-steinbock",
    photo: picture("wissen-gams-steinbock", 1),
    neutralAlt: "Ein kräftiges Tier steht im Schnee; seine langen, nach hinten gebogenen Hörner zeigen auffällige Querwülste.",
    options: ["Alpensteinbock", "Gämse", "Mufflon"],
    explanation: "Das Tier besitzt kräftige, lang nach hinten gebogene Hörner mit breiten Querwülsten. Gemeinsam mit dem Körperbau passt das zum Alpensteinbock. Die Form unterscheidet sich deutlich von den schlanken Krucken der Gämse.",
    wrong: {
      "Gämse": "Gämsen haben schlankere Hörner mit deutlich gehakelten Spitzen. Die langen, kräftigen und breit gewulsteten Hörner dieses Tieres passen zum Steinwild.",
      "Mufflon": "Bei einem ausgewachsenen Muffelwidder rollen sich die Hörner seitlich schneckenförmig ein. Hier verlaufen sie in langen Bögen nach hinten.",
    },
    traits: [
      { x: 44, y: 32, title: "Kräftiges Gehörn", text: "Die nach hinten gebogenen Hörner sind gut sichtbar. Beide Geschlechter tragen Hörner, beim Bock werden sie deutlich größer." },
      { x: 67, y: 35, title: "Deutliche Wülste", text: "Auf der Hornvorderseite erkennst du breite Wülste. Diese Wülste darfst du nicht einfach als Lebensjahre zählen." },
      { x: 30, y: 67, title: "Körperbau vergleichen", text: "Das Tier wirkt kräftig und kompakt. Der Körperbau unterstützt die Einordnung, die charakteristische Hornform ist hier aussagekräftiger." },
    ],
    limit: "Für eine Altersbestimmung brauchst du die echten Jahrringe und eine geeignete Ansicht. Die auffälligen Querwülste auf der Hornvorderseite sind dafür kein einfacher Jahreszähler.",
    sources: [source("Schweizerischer Nationalpark: Steinbock", "https://nationalpark.ch/flora-und-fauna/steinbock/"), source("Deutscher Jagdverband: Mufflon", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/mufflon-ovis-ammon-musimon")],
  },
  {
    id: "feldhase", name: "Feldhase", group: "Hasenartige", course: "wissen-ausbau-hasenartige",
    photo: picture("wissen-ausbau-hasenartige"),
    neutralAlt: "Ein braunes Tier im Gras mit langen Ohren, dunklen Ohrspitzen und einem seitlich sichtbaren Auge.",
    options: ["Wildkaninchen", "Rehkitz", "Feldhase"],
    explanation: "Die langen Ohren mit dunklen Spitzen und das bernsteinfarbene Auge sprechen für den Feldhasen. Sein Körper wirkt gestreckter als der des Wildkaninchens. Die sitzende Haltung verdeckt einen Teil der langen Hinterläufe.",
    wrong: {
      "Wildkaninchen": "Wildkaninchen haben im Verhältnis zum Kopf kürzere Ohren und dunklere Augen. Hier sind die langen Ohren mit ausgeprägt dunklen Spitzen besonders hilfreich.",
      "Rehkitz": "Ein Rehkitz besitzt einen anderen Kopf- und Körperbau und Schalen statt der Pfoten eines Hasenartigen. Die langen, dunklen Ohrspitzen passen hier zum Feldhasen.",
    },
    traits: [
      { x: 46, y: 18, title: "Lange Löffel", text: "Die langen Ohren, jagdlich Löffel genannt, zeigen dunkle Spitzen." },
      { x: 64, y: 35, title: "Helles Auge", text: "Das seitliche Auge hat einen hellen, bernsteinfarbenen Bereich um die Pupille. Vergleiche es mit dem dunkleren Auge des Wildkaninchens." },
      { x: 40, y: 59, title: "Gestreckte Silhouette", text: "Der seitlich sichtbare Körper wirkt länglich. Eine einzelne Sitzhaltung ist jedoch kein Größenmaßstab." },
    ],
    limit: "Geschlecht und genaues Alter lassen sich aus diesem Bild nicht zuverlässig bestimmen. Ohne Größenvergleich kannst du Körpermaße nicht ablesen.",
    sources: [source("Deutscher Jagdverband: Feldhase", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/feldhase-lepus-europaeus")],
  },
  {
    id: "wildkaninchen", name: "Wildkaninchen", group: "Hasenartige", course: "wissen-ausbau-hasenartige",
    photo: picture("wissen-ausbau-hasenartige", 1),
    neutralAlt: "Ein graubraunes Tier sitzt im Gras; relativ kurze Ohren, ein rundlicher Kopf und ein dunkles Auge sind sichtbar.",
    options: ["Feldhase", "Wildkaninchen", "Rehkitz"],
    explanation: "Die relativ kurzen Ohren, das dunkle Auge und der rundlichere Kopf passen zum Wildkaninchen. Betrachte diese Merkmale zusammen. Die Körpergröße allein kannst du ohne einen Maßstab im Foto nicht beurteilen.",
    wrong: {
      "Feldhase": "Der Feldhase hat im Verhältnis längere Ohren, auffällig dunkle Ohrspitzen und meist ein helleres, bernsteinfarbenes Auge. Diese Kombination fehlt hier.",
      "Rehkitz": "Die rundliche Kopfform und die sichtbaren Pfoten passen zu einem Hasenartigen. Ein Rehkitz besitzt einen anderen Körperbau und Schalen. Hier helfen kurze Ohren und dunkles Auge bei der Einordnung als Wildkaninchen.",
    },
    traits: [
      { x: 45, y: 23, title: "Relativ kurze Ohren", text: "Die Ohren sind im Verhältnis zum Kopf kürzer als beim Feldhasen. Stark schwarze Ohrspitzen wie beim Feldhasen fehlen." },
      { x: 53, y: 37, title: "Dunkles Auge", text: "Das gut sichtbare Auge erscheint dunkel. Nutze es gemeinsam mit Ohrlänge und Kopfproportionen." },
      { x: 41, y: 65, title: "Kompakter Eindruck", text: "Das sitzende Tier wirkt kompakt. Perspektive und Haltung können diesen Eindruck verändern." },
    ],
    limit: "Auch Hauskaninchen stammen vom Europäischen Wildkaninchen ab. Die Merkmale im Foto belegen keine Herkunft oder Lebensweise eines einzelnen Tieres.",
    sources: [source("Deutscher Jagdverband: Wildkaninchen", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildkaninchen-oryctolagus-cuniculus")],
  },
  {
    id: "stockente", name: "Stockente", group: "Federwild", course: "wissen-federwild-beobachtung",
    photo: picture("wissen-federwild-beobachtung"),
    neutralAlt: "Zwei übereinander dargestellte Vögel: oben grün schimmernder Kopf und gelber Schnabel, unten braun gemustertes Gefieder; beide haben einen blauen Flügelfleck.",
    options: ["Fasan", "Krickente", "Stockente"],
    explanation: "Oben erkennst du einen Stockentenerpel im Prachtkleid mit grünem Kopf, gelbem Schnabel und brauner Brust. Unten ist eine braun gemusterte weibliche Stockente zu sehen. Bei beiden fällt der blau gefärbte Flügelspiegel auf.",
    wrong: {
      "Fasan": "Fasane sind Hühnervögel mit einer anderen Schnabelform und einem langen Schwanz. Der breite Entenschnabel und die Flügelspiegel passen hier zur Stockente.",
      "Krickente": "Der Krickerpel im Prachtkleid hat einen kastanienbraunen Kopf mit grünem Seitenstreifen. Der obere Vogel zeigt stattdessen den weitgehend grünen Kopf und gelben Schnabel der Stockente.",
    },
    traits: [
      { x: 64, y: 12, title: "Kopf und Schnabel", text: "Beim oberen Vogel passen der grün schimmernde Kopf und der gelbe, breite Schnabel zum Erpel im Prachtkleid." },
      { x: 57, y: 35, title: "Braune Brust", text: "Die braune Brust grenzt sich beim oberen Vogel vom helleren Körper ab." },
      { x: 36, y: 73, title: "Blauer Spiegel", text: "Der untere Vogel zeigt einen blauen Flügelfleck mit heller Begrenzung. Auch beim oberen Vogel ist der Spiegel erkennbar." },
    ],
    limit: "Das Prachtkleid gilt nicht das ganze Jahr. Erpel im Schlichtkleid ähneln weiblichen Tieren; ein grüner Kopf ist deshalb kein ganzjähriges Pflichtmerkmal.",
    sources: [source("NABU: Stockente", "https://www.nabu.de/tiere-und-pflanzen/voegel/portraets/stockente/"), source("NABU: Krickente", "https://www.nabu.de/tiere-und-pflanzen/voegel/portraets/krickente/")],
  },
  {
    id: "fasan", name: "Fasan", group: "Federwild", course: "wissen-federwild-beobachtung",
    photo: picture("wissen-federwild-beobachtung", 1),
    neutralAlt: "Ein bunt gemusterter Vogel mit roter Gesichtshaut, grünlich schimmerndem Hals und hellem Halsring; der hintere Körper liegt außerhalb des Fotos.",
    options: ["Fasan", "Stockente", "Rebhuhn"],
    explanation: "Die rote Haut seitlich am Kopf und das bunt gemusterte Gefieder sind hier typische Merkmale eines Fasanenhahns. Auch der helle Halsring ist in diesem Foto sichtbar. Halsringe sind je nach Unterart oder Mischform unterschiedlich ausgeprägt.",
    wrong: {
      "Stockente": "Ein Stockentenerpel zeigt einen breiten, gelben Entenschnabel und eine andere Gefiederzeichnung. Hier erkennst du rote Gesichtshaut und den kurzen Schnabel eines Hühnervogels.",
      "Rebhuhn": "Rebhühner zeigen keine solche rote Gesichtshaut und kein derart buntes, glänzendes Hahnengefieder. Beim Fasan ist außerdem gewöhnlich ein langer Schwanz hilfreich; er fehlt in diesem Bildausschnitt.",
    },
    traits: [
      { x: 27, y: 24, title: "Rote Gesichtshaut", text: "Die kräftig rote, unbefiederte Partie seitlich am Kopf ist im Foto gut sichtbar." },
      { x: 39, y: 62, title: "Heller Halsring", text: "Dieses Tier hat einen hellen Halsring. Er ist kein zwingendes Merkmal jedes Fasans." },
      { x: 70, y: 37, title: "Gemustertes Gefieder", text: "Das kupferbraune Gefieder ist kontrastreich gemustert. Fasanenhennen sind deutlich unauffälliger gefärbt." },
    ],
    limit: "Der lange Schwanz liegt außerhalb des Bildausschnitts. Behaupte keine Merkmale, die du im Foto nicht tatsächlich erkennen kannst.",
    sources: [source("LBV: Fasan", "https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/fasan/")],
  },
  {
    id: "rotwild", name: "Rotwild", group: "Hirschartige", course: "wissen-rotwild-sozialverhalten",
    photo: picture("wissen-rotwild-sozialverhalten"),
    neutralAlt: "Ein braunes Hirschartiges steht zwischen Bäumen und besitzt ein weit verzweigtes Geweih.",
    options: ["Rehwild", "Rotwild", "Damwild"],
    explanation: "Das Tier besitzt ein langes, mehrendig verzweigtes Stangengeweih und einen kräftigen Körper mit langem Kopf. In dieser Kombination passt es zu Rotwild. Der Hirsch ist ein Einzelmotiv; über eine Rudelstruktur sagt dieses Foto nichts aus.",
    wrong: {
      "Rehwild": "Ein Rehbock besitzt ein wesentlich kleineres Geweih mit gewöhnlich wenigen Enden. Das große, weit verzweigte Stangengeweih dieses Tieres passt zum Rothirsch.",
      "Damwild": "Ein ausgewachsener Damhirsch trägt typischerweise schaufelförmig verbreiterte Geweihteile. Das gezeigte Tier hat ein verzweigtes Stangengeweih ohne solche Schaufeln.",
    },
    traits: [
      { x: 44, y: 20, title: "Verzweigtes Stangengeweih", text: "Die vielen Enden sitzen an langen Stangen. Es sind keine bleibenden Hörner wie bei Gämse und Steinbock." },
      { x: 42, y: 45, title: "Kopf und Geweih zusammen", text: "Der langgestreckte Kopf und das Stangengeweih unterstützen die Einordnung des Tieres." },
      { x: 67, y: 62, title: "Körperbau", text: "Der kräftige Rumpf ergänzt die Merkmale des Kopfes. Aus einem Einzelmotiv lässt sich keine Beziehung zu anderen Tieren ablesen." },
    ],
    limit: "Die Zahl der Geweihenden ist kein verlässlicher Alterszähler. Über die Zusammensetzung eines Rudels sagt dieses Einzelmotiv nichts aus.",
    sources: [source("Deutsche Wildtier Stiftung: Rothirsch", "https://www.deutschewildtierstiftung.de/wildtiere/rothirsch"), source("Deutscher Jagdverband: Damwild", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/damwild-dama-dama")],
  },
  {
    id: "schwarzwild", name: "Schwarzwild", group: "Schwarzwild", course: "wissen-schwarzwild-lebensweise",
    photo: picture("wissen-schwarzwild-lebensweise"),
    neutralAlt: "Ein großes, gedrungenes Tier mit borstigem Fell und Rüssel steht im Vordergrund; dahinter sind kleinere gestreifte Tiere zu sehen.",
    options: ["Dachs", "Rehwild", "Schwarzwild"],
    explanation: "Die Rüssel, die länglichen Köpfe und das borstige Fell passen zu Wildschweinen, jagdlich Schwarzwild. Mehrere unterschiedlich große Tiere stehen zusammen. Das Bild allein klärt weder das genaue Alter noch die Rolle des größten Tieres.",
    wrong: {
      "Dachs": "Ein Dachs hat eine andere Körper- und Kopfform sowie eine markante schwarz-weiße Kopfzeichnung. Hier sind stattdessen die typischen Rüssel der Wildschweine sichtbar.",
      "Rehwild": "Rehe haben einen schlankeren Körper, längere Beine und keinen Rüssel. Die gedrungene Gestalt und die Borsten sprechen hier für Schwarzwild.",
    },
    traits: [
      { x: 63, y: 62, title: "Rüssel", text: "Der Rüssel des großen Tieres im Vordergrund ist gut erkennbar." },
      { x: 40, y: 35, title: "Borstiges Fell", text: "Das grobe Fell und der gedrungene Rumpf unterscheiden sich deutlich vom Erscheinungsbild eines Rehs." },
      { x: 74, y: 71, title: "Frischlinge beobachten", text: "Das kleinere Tier zeigt ein gestreiftes Jugendkleid. Die Zeichnung erlaubt kein taggenaues Alter; die Rolle des großen Tieres bleibt allein im Foto ungeklärt." },
    ],
    limit: "Ein großes Tier in einer Gruppe ist nicht automatisch sicher als führende Bache oder Keiler angesprochen. Dafür brauchst du weitere verlässliche Merkmale und Beobachtungen.",
    sources: [source("Deutsche Wildtier Stiftung: Wildschwein", "https://www.deutschewildtierstiftung.de/wildtiere/wildschwein")],
  },
];

export function getPhotoDetectiveSummary(rounds, answers) {
  const completed = rounds.filter(round => answers[round.id]);
  const correct = completed.filter(round => answers[round.id].choice === round.name);
  return {
    completed: completed.length,
    correct: correct.length,
    independent: correct.filter(round => !answers[round.id].assisted).length,
    assisted: correct.filter(round => answers[round.id].assisted).length,
    retryIds: completed.filter(round => answers[round.id].choice !== round.name || answers[round.id].assisted).map(round => round.id),
  };
}
