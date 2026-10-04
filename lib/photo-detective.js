import { learningWildlifePhotos } from "./learning-wildlife-photos";

// Coordinates describe visible details in the unchanged original photographs.
// The image keeps its original aspect ratio so markers remain on those details.
const picture = (course, index = 0) => learningWildlifePhotos[course][index];
const source = (title, url) => ({ title, url });

export const photoDetectiveRounds = [
  {
    id: "gams", name: "Gämse", group: "Gebirgswild", course: "wissen-gams-steinbock",
    photo: picture("wissen-gams-steinbock"),
    neutralAlt: "Mehrere braune, horntragende Tiere auf einem felsigen Hang; helle und dunkle Gesichtspartien sind sichtbar.",
    options: ["Alpensteinbock", "Gämse", "Rehwild"],
    explanation: "Die schlanken, am Ende nach hinten gebogenen Hörner und die kontrastreiche Gesichtszeichnung passen zur Gämse. Die Hörner heißen in der Jägersprache Krucken. Vergleiche die Form an mehreren Tieren im Bild.",
    wrong: {
      "Alpensteinbock": "Die hier sichtbaren Hörner sind schlank und an der Spitze gehakelt. Die großen Steinböcke im Vergleichsfoto haben kräftige, weit nach hinten gebogene Hörner mit deutlichen Wülsten.",
      "Rehwild": "Rehböcke tragen ein verzweigtes Geweih. Hier sind unverzweigte, gehakelte Hörner zu sehen; das spricht gegen Rehwild.",
    },
    traits: [
      { x: 28, y: 10, title: "Schlanke Hörner", text: "Beim obersten Tier erkennst du die schmalen, nach hinten gehakelten Hornspitzen." },
      { x: 57, y: 60, title: "Gesichtszeichnung", text: "Beim mittleren Tier kontrastiert der dunkle Streifen vom Auge zur Nase mit den helleren Kopfpartien." },
      { x: 43, y: 63, title: "Fell allein reicht nicht", text: "Die Tiere zeigen unterschiedlich dunkles Fell. Nutze Hornform und Kopfzeichnung gemeinsam statt nur die Fellfarbe." },
    ],
    limit: "Ein Bild dieser Auflösung erlaubt keine genaue Altersbestimmung oder sichere Geschlechtsansprache aller Tiere.",
    sources: [source("Deutsche Wildtier Stiftung: Gämse", "https://www.deutschewildtierstiftung.de/wildtiere/gams"), source("Schweizerischer Nationalpark: Die Gämse", "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Gaemse.pdf")],
  },
  {
    id: "steinbock", name: "Alpensteinbock", group: "Gebirgswild", course: "wissen-gams-steinbock",
    photo: picture("wissen-gams-steinbock", 1),
    neutralAlt: "Eine Gruppe kräftiger, horntragender Tiere am Berghang; mehrere Tiere haben lange, gebogene Hörner.",
    options: ["Alpensteinbock", "Gämse", "Mufflon"],
    explanation: "Mehrere Tiere besitzen kräftige, lang nach hinten gebogene Hörner mit breiten Querwülsten. Gemeinsam mit dem Körperbau passt das zum Alpensteinbock. Die Form unterscheidet sich deutlich von den schlanken Krucken der Gämse.",
    wrong: {
      "Gämse": "Gämsen haben schlankere Hörner mit deutlich gehakelten Spitzen. Die langen, kräftigen und breit gewulsteten Hörner dieser Tiere passen zum Steinwild.",
      "Mufflon": "Bei einem ausgewachsenen Muffelwidder rollen sich die Hörner seitlich schneckenförmig ein. Hier verlaufen sie in langen Bögen nach hinten.",
    },
    traits: [
      { x: 69, y: 12, title: "Kräftiges Gehörn", text: "Am oberen Tier sind die nach hinten gebogenen Hörner gut sichtbar. Beide Geschlechter tragen Hörner, beim Bock werden sie deutlich größer." },
      { x: 47, y: 48, title: "Deutliche Wülste", text: "Das große Horn des mittleren Tieres zeigt breite Wülste auf der Vorderseite. Diese Wülste darfst du nicht einfach als Lebensjahre zählen." },
      { x: 57, y: 66, title: "Körperbau vergleichen", text: "Das mittlere Tier wirkt kräftig und kompakt. Der Körperbau unterstützt die Einordnung, die charakteristische Hornform ist hier aussagekräftiger." },
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
    neutralAlt: "Mehrere braune Hirschartige am Waldrand; das große stehende Tier besitzt ein weit verzweigtes Geweih.",
    options: ["Rehwild", "Rotwild", "Damwild"],
    explanation: "Das große Tier besitzt ein langes, mehrendig verzweigtes Stangengeweih und einen kräftigen Körper mit langem Kopf. In dieser Kombination passt es zu Rotwild. Die anderen Tiere im Bild tragen kein sichtbares Geweih.",
    wrong: {
      "Rehwild": "Ein Rehbock besitzt ein wesentlich kleineres Geweih mit gewöhnlich wenigen Enden. Das große, weit verzweigte Stangengeweih dieses Tieres passt zum Rothirsch.",
      "Damwild": "Ein ausgewachsener Damhirsch trägt typischerweise schaufelförmig verbreiterte Geweihteile. Das gezeigte Tier hat ein verzweigtes Stangengeweih ohne solche Schaufeln.",
    },
    traits: [
      { x: 59, y: 32, title: "Verzweigtes Stangengeweih", text: "Die vielen Enden sitzen an langen Stangen. Es sind keine bleibenden Hörner wie bei Gämse und Steinbock." },
      { x: 73, y: 57, title: "Körper und Kopf zusammen", text: "Der kräftige Rumpf und der langgestreckte Kopf unterstützen die Einordnung des großen Tieres." },
      { x: 40, y: 56, title: "Fehlendes Geweih", text: "Beim mittleren Tier ist kein Geweih sichtbar. Fehlendes Geweih allein genügt nicht, um Alter und Geschlecht jedes Hirschartigen sicher zu bestimmen." },
    ],
    limit: "Die Zahl der Geweihenden ist kein verlässlicher Alterszähler. Auch die familiäre Beziehung der Tiere lässt sich aus einem Standbild nicht sicher erkennen.",
    sources: [source("Deutsche Wildtier Stiftung: Rothirsch", "https://www.deutschewildtierstiftung.de/wildtiere/rothirsch"), source("Deutscher Jagdverband: Damwild", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/damwild-dama-dama")],
  },
  {
    id: "schwarzwild", name: "Schwarzwild", group: "Schwarzwild", course: "wissen-schwarzwild-lebensweise",
    photo: picture("wissen-schwarzwild-lebensweise"),
    neutralAlt: "Eine Gruppe gedrungener Tiere im Wald mit borstigem Fell, länglichen Köpfen und gut sichtbaren Rüsseln.",
    options: ["Dachs", "Rehwild", "Schwarzwild"],
    explanation: "Die Rüssel, die länglichen Köpfe und das borstige Fell passen zu Wildschweinen, jagdlich Schwarzwild. Mehrere unterschiedlich große Tiere stehen zusammen. Das Bild allein klärt weder das genaue Alter noch die Rolle des größten Tieres.",
    wrong: {
      "Dachs": "Ein Dachs hat eine andere Körper- und Kopfform sowie eine markante schwarz-weiße Kopfzeichnung. Hier sind stattdessen die typischen Rüssel der Wildschweine sichtbar.",
      "Rehwild": "Rehe haben einen schlankeren Körper, längere Beine und keinen Rüssel. Die gedrungene Gestalt und die Borsten sprechen hier für Schwarzwild.",
    },
    traits: [
      { x: 30, y: 46, title: "Rüssel", text: "Der Rüssel des großen linken Tieres ist von vorn gut erkennbar." },
      { x: 15, y: 29, title: "Borstiges Fell", text: "Das grobe Fell und der gedrungene Rumpf unterscheiden sich deutlich vom Erscheinungsbild eines Rehs." },
      { x: 70, y: 61, title: "Gruppe beobachten", text: "Die Tiere haben verschiedene Körpergrößen. Das ist eine Beobachtung, aber noch keine genaue Alters- oder Familienbestimmung." },
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
