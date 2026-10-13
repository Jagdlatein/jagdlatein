import photoRecords from "../public/lernen/pond-life-2026/bildnachweise.json";

export const pondLifeReviewedOn = "2026-10-13";
export const pondLifeGroups = [{ id: "pond", title: "Teich und Gewässerrand" }];
export const pondLifeSources = {
  pondIgbDragonflies: { organization: "Leibniz-Institut für Gewässerökologie und Binnenfischerei", title: "Eintagsfliegen, Libellen & Co. beginnen ihr Leben im Wasser: räuberische Larven und Fangmaske", url: "https://www.igb-berlin.de/news/eintagsfliegen-libellen-co-beginnen-ihr-leben-im-wasser" },
  pondViennaDragonflies: { organization: "Naturhistorisches Museum Wien", title: "Saal 24: Libellen und ihre Larven, räuberische Lebensweise und Fangmaske", url: "https://www.nhm.at/ausstellung/dauerausstellung_schausammlung/erster_stock/krebse_spinnentiere_insekten" },
  pondKielMask: { organization: "Christian-Albrechts-Universität zu Kiel / Senckenberg", title: "Büsse, Hörnschemeyer und Gorb (2017): Mundwerkzeuge und Fangmaske von Libellenlarven, Background und Labium", url: "https://link.springer.com/article/10.1186/s12983-017-0209-x" },
  pondSwissDragonflies: { organization: "Bundesamt für Umwelt BAFU / info fauna", title: "Rote Liste der Libellen (2021): Lebenszyklus und Gewässerlebensräume, Seiten 9–11", url: "https://www.infofauna.ch/sites/default/files/files/publications/rote_liste_der_libellen_0.pdf" },
  pondFribourgExuviae: { organization: "Naturhistorisches Museum Freiburg", title: "Libellen: Exuvien bestimmen – die nach dem Schlupf zurückgebliebene Haut", url: "https://www.fr.ch/de/nhmf/news/libellen-exuvien-bestimmen" },
  pondBavariaDevelopment: { organization: "Bayerisches Landesamt für Umwelt", title: "Art des Monats, Januar 2026: Libellenentwicklung ohne Puppenstadium, am Beispiel Sibirische Winterlibelle", url: "https://www.lfu.bayern.de/natur/bayaz/artdesmonats/index.htm" },
  pondBavariaHabitats: { organization: "Bayerisches Landesamt für Umwelt", title: "Naturschutzfachkartierung Regen (2. April 2026): Quell- und Bachlebensraum der Gestreiften Quelljungfer", url: "https://www.lfu.bayern.de/pressemitteilungen/c/2257115/15-26-ergebnisse-naturschutzfachkartierung-im-landkreis-regen-liegen-vor" },
  pondBavariaExuviae: { organization: "Bayerisches Landesamt für Umwelt", title: "Natura 2000 – Libellen (2012), Seite 2: Exuvien als Hüllen nach dem Schlupf", url: "https://www.lfu.bayern.de/natur/natura_2000/ffh/tier_pflanzenarten/doc/libellen.pdf" },
  pondMitStriders: { organization: "Massachusetts Institute of Technology, John W. M. Bush", title: "Water strider locomotion: Oberflächenspannung und Vortrieb, Originaluntersuchung Hu, Chan und Bush (2003)", url: "https://thales.mit.edu/bush/index.php/2003/04/14/water-strider-locomotion-paradox-lost/" },
  pondGaoJiangHairs: { organization: "Chinese Academy of Sciences, Xuefeng Gao und Lei Jiang", title: "Water-repellent legs of water striders (Nature 2004): feine Haarstruktur und Wasserabweisung, Originalabstract", url: "https://pubmed.ncbi.nlm.nih.gov/15525973/" },
  pondMaineStriders: { organization: "University of Maine Cooperative Extension", title: "Water Striders: wasserabweisende Behaarung, Nahrung und Aufgaben der Beinpaare", url: "https://extension.umaine.edu/home-and-garden-ipm/fact-sheets/common-name-listing/water-striders/" },
  pondNpsLegs: { organization: "U.S. National Park Service", title: "Species Spotlight – Water Striders: Funktionen der Vorder-, Mittel- und Hinterbeine", url: "https://www.nps.gov/articles/pecies-spotlight-water-strider.htm" },
  pondNajuStriders: { organization: "Naturschutzjugend im NABU", title: "Insekten und Spinnentiere am Gewässer: Wasserläufer, ruhige Kleingewässer und Nahrung", url: "https://www.najuversum.de/gewaesser/insekten-und-spinnentiere/" },
};

const photos = Object.fromEntries(photoRecords.map(photo => [photo.id, photo]));
const fact = (id, title, text, sourceIds) => ({ id, title, text, sourceIds });
const question = (prompt, choices, answer, explanation) => ({ prompt, choices, answer, explanation });

export const pondLifeTopics = [
  {
    id: "libellenlarven", group: "pond", title: "Libellenlarven: Räuber unter Wasser",
    aliases: ["Libellen", "Odonata", "Blaugrüne Mosaikjungfer", "Aeshna cyanea", "Fangmaske", "Exuvie", "Häutung", "Teichlarven"],
    reviewedOn: pondLifeReviewedOn, categories: ["wald-pflanzen", "landwirtschaft-lebensraeume"],
    summary: "Die Jugend liegt im Wasser. Zur geflügelten Libelle führt eine letzte Häutung, kein Puppenstadium.",
    photo: photos.libellenlarven,
    photoContext: "Das Originalfoto zeigt laut dokumentierter Bestimmung eine Larve der Blaugrünen Mosaikjungfer (Aeshna cyanea), knapp unter der Wasseroberfläche eines Gartenteichs. Kopf, Beine und Hinterleib sind sichtbar. Aufnahmeort und Alter des Tiers sind nicht dokumentiert; das Foto zeigt keinen Beutefang und keinen Schlupf.",
    facts: [
      fact("lebensphasen", "Vom Wasser in die Luft – ohne Puppe", "Heimische Libellen verbringen ihre Larvenentwicklung im Wasser. Für die letzte Häutung verlässt die ausgewachsene Larve das Gewässer; aus der Larvenhaut kommt die geflügelte Libelle. Dazwischen liegt kein Puppenstadium. Die zurückbleibende Haut ist eine Exuvie, kein Beweis für ein gestorbenes Tier.", ["pondSwissDragonflies", "pondBavariaDevelopment", "pondFribourgExuviae", "pondBavariaExuviae"]),
      fact("beutefang", "Eine umgebildete Unterlippe fängt Beute", "Libellenlarven leben räuberisch, ebenso wie die geflügelten Libellen. Ihre Fangmaske ist eine besondere Ausbildung der Unterlippe und wird beim Beutefang nach vorn bewegt. Diese Struktur ist kein Stachel. Ein ruhendes Larvenfoto zeigt den Körperbau, aber weder einen tatsächlich erfolgten Fang noch die Beutemenge.", ["pondIgbDragonflies", "pondViennaDragonflies", "pondKielMask"]),
      fact("lebensraeume", "Ein Teich passt nicht zu jeder Libellenart", "Libellen besiedeln unterschiedliche Fließ- und Stillgewässer. Quellen und kleine Bäche sind zum Beispiel Lebensräume der Gestreiften Quelljungfer; andere Arten nutzen Teiche oder Weiher. Art und Lebensraum müssen zusammen betrachtet werden. Eine einzelne fliegende Libelle oder ein Larvenfoto beschreibt deshalb noch nicht die ganze Lebensgemeinschaft eines Gewässers.", ["pondSwissDragonflies", "pondBavariaHabitats", "pondBavariaDevelopment"]),
    ],
    connections: [
      { label: "Geeignete Beute → Libellenlarve", text: "Räuberische Ernährung im Wasser; im gezeigten Foto ist kein Fang zu sehen." },
      { label: "Aquatische Larve → letzte Häutung → geflügelte Libelle", text: "Lebensphasen verbinden Gewässer und Landlebensraum. Eine Exuvie ist die zurückgebliebene Larvenhaut." },
      { label: "Unterschiedliche Gewässer → unterschiedliche Libellenarten", text: "Ein vorhandener Teich erfüllt nicht automatisch die Ansprüche aller Arten." },
    ],
    observe: "Vom vorhandenen sicheren Weg aus Wasserfläche und Uferstrukturen beschreiben. Bereits sichtbare Tiere oder leere Häute nur aus Abstand fotografieren. Larven nicht herausnehmen, Häute nicht ablösen und Pflanzen oder Verstecke nicht öffnen.",
    limit: "Das gezeigte Artbeispiel ist kein Bestimmungsschlüssel für alle Libellenlarven. Aus einem Foto folgen weder Larvenalter noch Wasserqualität. Entwicklungszeiten und Lebensraumansprüche lassen sich nicht pauschal auf alle Arten übertragen.",
    quiz: question("Was ist der Übergang einer ausgewachsenen Libellenlarve zum geflügelten Tier?", ["Eine letzte Häutung außerhalb des Wassers, ohne Puppenstadium.", "Jede Libelle verbringt vorher eine Puppenphase im Köcher.", "Die Larve bleibt unverändert und erhält nur längere Beine."], 0, "Libellen entwickeln sich ohne Puppenstadium. Bei der letzten Häutung kommt die geflügelte Libelle aus der Larvenhaut; diese bleibt als Exuvie zurück."),
  },
  {
    id: "wasserlaeufer", group: "pond", title: "Wasserläufer: Leben auf der Oberfläche",
    aliases: ["Gerridae", "Gerris lacustris", "Gemeiner Wasserläufer", "Oberflächenspannung", "hydrophob", "wasserabweisende Haare", "Teichoberfläche"],
    reviewedOn: pondLifeReviewedOn, categories: ["wald-pflanzen", "landwirtschaft-lebensraeume"],
    summary: "Ruhige Wasserflächen sind ein Lebensbereich. Oberflächenspannung und wasserabweisende Beine helfen dem Insekt, sich dort zu halten.",
    photo: photos.wasserlaeufer,
    photoContext: "Die echte Aufnahme zeigt einen als Gemeinen Wasserläufer (Gerris lacustris) dokumentierten Wasserläufer im Mangfalltal in Bayern. Beine berühren die Wasseroberfläche; mehrere kleine Insekten liegen dort, eines am Bereich der Vorderbeine. Das Foto belegt keinen vollständigen Fangablauf, keine Bestimmung aller Beutetiere und keine Fangrate.",
    facts: [
      fact("oberflaeche", "Die Oberfläche trägt – die Beine werden kaum benetzt", "Oberflächenspannung trägt einen Wasserläufer an der verformten Wasseroberfläche. Feine wasserabweisende Haare an den Beinen erschweren deren Benetzung. Der Körperbau und die Wasseroberfläche wirken zusammen; allein eine geringe Körpermasse erklärt das Stehen auf Wasser nicht. Das Foto zeigt keinen mikroskopischen Nachweis dieser Haare und misst keine Tragkraft.", ["pondMitStriders", "pondMaineStriders", "pondGaoJiangHairs"]),
      fact("nahrung", "Landinsekten können an der Oberfläche zur Beute werden", "Kleine Insekten, die auf die Wasseroberfläche fallen, gehören zur Nahrung von Wasserläufern. So entsteht ein Nahrungskontakt zwischen Land und Gewässeroberfläche. Nicht jedes sichtbare Teilchen ist Beute, und eine Momentaufnahme legt weder Speiseplan noch Fangmenge eines Tiers fest.", ["pondNajuStriders", "pondMaineStriders"]),
      fact("bewegung", "Beinpaare haben unterschiedliche Aufgaben", "Die kurzen Vorderbeine dienen zum Ergreifen und Festhalten von Beute. Das mittlere Beinpaar sorgt mit Ruderbewegungen für den Vortrieb auf der Oberfläche; die Hinterbeine helfen beim Steuern. Stehen, Fortbewegen und Fangen sind unterschiedliche Vorgänge. Ein Standbild kann die Lage der Beine zeigen, aber keine Geschwindigkeit messen.", ["pondMitStriders", "pondMaineStriders", "pondNpsLegs"]),
    ],
    connections: [
      { label: "Kleine Insekten auf dem Wasser → Wasserläufer", text: "Ein Nahrungskontakt zwischen Land und Gewässeroberfläche; keine feste Fangzahl." },
      { label: "Ruhige Gewässeroberfläche → Lebensbereich", text: "Teiche und ruhige Wasserstellen bieten einen anderen Aufenthaltsbereich als der Gewässergrund." },
    ],
    observe: "Von einem sicheren vorhandenen Weg aus ruhige Wasserstellen ansehen und sichtbare Bewegungen oder Ruhephasen beschreiben. Tiere nicht anfassen, keine Beute hineinwerfen und nichts ins Gewässer geben, um die Oberflächenspannung zu verändern.",
    limit: "Gemeint sind hier die Wasserläufer-Insekten der Familie Gerridae. Die Aufnahme ist kein vollständiger Artenschlüssel. Allgemeine Körperfunktionen sind keine Aussage über Größe, Tempo, Flügelausbildung oder Nahrung jeder einzelnen Art.",
    quiz: question("Welche Erklärung passt zum Wasserläufer auf der Wasseroberfläche?", ["Er muss ununterbrochen fliegen, um nicht einzusinken.", "Die Oberflächenspannung und wasserabweisende Beine wirken zusammen.", "Das Wasser ist an seiner Standstelle zu festem Eis geworden."], 1, "Die verformte Wasseroberfläche und die geringe Benetzung der Beine ermöglichen das Stehen. Das Foto zeigt die Situation, ersetzt aber keine mikroskopische oder physikalische Messung."),
  },
];
