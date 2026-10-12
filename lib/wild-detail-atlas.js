import { wildYearSources } from "./wild-year";
import { wildlifePhotographs } from "./wildlife-photographs";

export const wildDetailReviewedOn = "2026-10-12";
const source = (label, url, organization) => ({ label, url, organization });
export const wildDetailSources = {
  ...wildYearSources,
  solothurn: source("Naturmuseum Solothurn · Das Reh, S. 7 und 10", "https://naturpark-detektive.de/wp-content/uploads/2021/12/das-reh-durch-anpassung-zum-erfolg-unterlagen-fr-kindergarten-und-schule.pdf", "naturmuseum-solothurn"),
  basel: source("Naturhistorisches Museum Basel · Blick ins Maul, S. 25–26 und 32", "https://www.nmbs.ch/dam/jcr:03c7ec9b-195d-4509-b2b3-a86c66162471/Anleitung_TatortMuseum_Schauplatz_Natur_Sek.pdf", "naturhistorisches-museum-basel"),
  amnh: source("American Museum of Natural History · Horns and Antlers", "https://www.amnh.org/research/science-conservation/projects/case-studies/horns-and-antlers", "amnh"),
  npsHorns: source("US National Park Service · Horns vs. Antlers", "https://home.nps.gov/articles/hornsvantlers.htm", "us-national-park-service"),
  npsTeeth: source("US National Park Service · Mammal Teeth", "https://www.nps.gov/articles/000/mammal-teeth.htm", "us-national-park-service"),
  cornell: source("Cornell Lab of Ornithology · Aufbau der Federn", "https://academy.allaboutbirds.org/features/all-about-feathers/how-feathers-are-built.php/1000", "cornell-university"),
  kiel: source("Universität Kiel · Kovalev, Filippov und Gorb: Unzipping bird feathers (2014)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC3899865/", "kiel-university"),
};
const photo = (id, name, src, width, height, author, license, licenseUrl, sourcePage, originalUrl, sourceDate, sha256) => ({
  id, name, src, width, height, author, license, licenseUrl, sourcePage, creditUrl: sourcePage,
  credit: `Foto: ${author} · ${license}`, originalUrl, sourceDate, checkedAt: wildDetailReviewedOn,
  sha256, aiGenerated: false, modifications: "Proportional verkleinert; nummerierte Hinweise werden separat über dem unveränderten Foto angezeigt.",
});
export const wildDetailPhotos = {
  rehSkull: photo("rehSkull", "Rehbock-Schädel · Museum Wiesbaden", "/lernen/wilddetails-2026/reh-schaedel.jpg", 1280, 850,
    "Klaus Rassinger und Gerhard Cammerer, Museum Wiesbaden", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/",
    "https://commons.wikimedia.org/wiki/File:Capreolus_135_02_MWNH.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/83/Capreolus_135_02_MWNH.jpg", "2011 (Quellseite und Metadaten nennen unterschiedliche Tagesdaten)", "447fa9e3e35a24658cb53cf4b6a63af81c83d069c9113fbb3be6a655b87f8477"),
  boarSkull: photo("boarSkull", "Wildschwein-Schädel · unvollständiges Fundstück", "/lernen/wilddetails-2026/wildschwein-schaedel.jpg", 1280, 960,
    "Minghong", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/",
    "https://commons.wikimedia.org/wiki/File:Wild_boar_skull_1.jpg", "https://upload.wikimedia.org/wikipedia/commons/b/b7/Wild_boar_skull_1.jpg", "2008-09-21", "067cc1058e5a026abb6033709ea46e8ea8c021623009ec2ecc5c0ca601a6d3f2"),
  mallardFeather: photo("mallardFeather", "Stockentenfeder · Makroaufnahme", "/lernen/wilddetails-2026/stockente-feder.jpg", 1280, 1527,
    "Tony Hisgett", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/",
    "https://commons.wikimedia.org/wiki/File:Mallard_feather_(3691786570).jpg", "https://upload.wikimedia.org/wikipedia/commons/a/a2/Mallard_feather_%283691786570%29.jpg", "2009-07-05", "d1a66eb11ba1c7930d33637e60a28e652a40ae58039e6bc16b7f807b6ea5e5d4"),
  gams: { ...wildlifePhotographs.gamswild, id: "gams" },
  stein: { ...wildlifePhotographs.steinwild, id: "stein" },
  dam: { ...wildlifePhotographs.damwild, id: "dam" },
  mallard: { ...wildlifePhotographs.stockente, id: "mallard" },
};
const mark = (label, x, y, detail) => ({ label, x, y, detail });
const panel = (photoId, caption, limitations, markers) => ({ photoId, caption, limitations, markers });
const claim = (id, title, text, sourceIds) => ({ id, title, text, sourceIds, reviewedOn: wildDetailReviewedOn });
export const wildDetailTopics = [
  {
    id: "geweih-und-horn", title: "Geweih oder Horn?", subtitle: "Rehbock und Gämse im direkten Vergleich",
    panels: [
      panel("rehSkull", "Am Museumsschädel sind das verzweigte Geweih und sein Ansatz oberhalb der Augenhöhle zu erkennen.", "Ein präparierter Schädel zeigt die Knochenform. Die Basthaut und das lebende Gewebe sind hier nicht erhalten.", [mark("Geweihstange", 36, 35, "Verzweigter Kopfschmuck des Rehbocks"), mark("Geweihansatz", 47, 59, "Ansatz auf dem Stirnbein"), mark("Augenhöhle", 54, 70, "Seitlich am Schädel sichtbar")]),
      panel("gams", "Die Gämse zeigt zwei schlanke Hörner mit zurückgebogenen Spitzen, die sogenannten Krucken.", "Das Fell verdeckt den Ansatz; der knöcherne Hornkern ist im Foto nicht sichtbar. Die Krümmung allein bestimmt das Geschlecht nicht sicher.", [mark("Gehakte Spitze", 29, 17, "Rückwärts gerichteter Haken"), mark("Hornschaft", 30, 24, "Äußere Hornhülle, kein Geweihast")]),
    ],
    claims: [
      claim("geweih-knochen", "Geweih: Knochen mit Jahreszyklus", "Beim Reh besteht das Geweih aus Knochen. Es wird jährlich abgeworfen und aus den bleibenden Rosenstöcken neu gebildet. Während des Wachstums versorgt die durchblutete Basthaut das Geweih.", ["solothurn","amnh"]),
      claim("horn-aufbau", "Horn: Knochenkern und Hornhülle", "Bei den hier gezeigten Hornträgern sitzt eine Hülle aus Keratin auf einem knöchernen Stirnzapfen. Diese Hörner werden nicht jährlich wie ein Geweih abgeworfen.", ["amnh","npsHorns"]),
      claim("gams-beide", "Gamsbock und Geiß tragen Krucken", "Bei der Gämse haben beide Geschlechter Hörner. Die Enden sind nach hinten gehakt; eine sichere Geschlechtsansprache braucht mehrere Merkmale und einen geeigneten Blickwinkel.", ["gamsBayern","gamsDJV"]),
    ],
    comparison: "Vergleiche zuerst Verzweigung und Bauprinzip. Die Farbe eines Präparats oder einer Hornoberfläche beweist das Material nicht. Das Foto wird hier zusammen mit dem biologischen Beleg gelesen.",
    observation: "Suche am Reh den Geweihansatz und an der Gämse den Haken. Ein Horn ist kein Geweih, auch wenn beides im Alltag manchmal gleich bezeichnet wird.",
  },
  {
    id: "gebiss-und-schaedel", title: "Gebiss und Schädel", subtitle: "Pflanzennahrung, Mischkost und unterschiedliche Zahnaufgaben",
    panels: [
      panel("rehSkull", "Die seitliche Aufnahme zeigt die Backenzahnreihen im Ober- und Unterkiefer des Rehs.", "Nur eine Seite ist zu sehen. Diese Ansicht eignet sich nicht zum vollständigen Zählen der Zähne oder zur genauen Altersbestimmung.", [mark("Oberkiefer-Backenzähne", 62, 83, "Seitliche Zahnreihe unterhalb der Augenhöhle"), mark("Unterkiefer-Backenzähne", 62, 86, "Gegenüberliegende Zahnreihe im Unterkiefer")]),
      panel("boarSkull", "Am Wildschwein-Fundstück fällt ein aufwärts gebogener Unterkiefereckzahn neben den Backenzähnen auf.", "Der Schädel ist verwittert und unvollständig; Knochen und mehrere Zähne fehlen. Fehlende Teile sind kein arttypisches Merkmal. Die Fotos haben keinen gemeinsamen Maßstab.", [mark("Unterkiefereckzahn", 74, 62, "Sichtbarer gebogener Eckzahn"), mark("Backenzähne", 53, 58, "Erhaltene Zahnreihe hinter dem Eckzahn")]),
    ],
    claims: [
      claim("reh-mahlen", "Reh: Pflanzen zermahlen", "Die Backenzähne des Rehs sind für das Zerkleinern pflanzlicher Nahrung eingerichtet. Ihre Mahlflächen und Kanten sind entscheidend; das Geweih hat mit der Nahrungsverarbeitung nichts zu tun.", ["solothurn","npsTeeth"]),
      claim("sau-mahlen", "Wildschwein: Schneiden und Mahlen", "Das Wildschwein nimmt pflanzliche und tierische Nahrung auf. Vorderes und hinteres Backenzahngebiss übernehmen unterschiedliche Aufgaben: Zerschneiden sowie Zermahlen der Nahrung.", ["basel","npsTeeth"]),
      claim("sau-hauer", "Hauer sind Zähne", "Die auffälligen Hauer des Wildschweins sind vergrößerte Eckzähne, keine Hörner. Bei männlichen Tieren sind diese Eckzähne gewöhnlich kräftiger ausgebildet als bei weiblichen.", ["sauBayern","sauStiftung","sauDJV"]),
    ],
    comparison: "Vergleiche die Zahnreihen und den Eckzahn. Die Seitenansicht eines unvollständigen Fundstücks darf nicht mit einer vollständigen Zahnformel verwechselt werden.",
    observation: "Beschreibe zunächst nur, was im Foto erhalten und sichtbar ist. Ein fehlender Zahn kann am Präparat verloren gegangen sein; daraus folgt weder eine Artbestimmung noch eine Alterszahl.",
  },
  {
    id: "gams-und-steinbock", title: "Gams und Steinbock", subtitle: "Zwei alpine Hornträger mit verschiedenen Hornformen",
    panels: [
      panel("gams", "Schlanke, am Ende deutlich gehakte Krucken kennzeichnen die abgebildete Gämse.", "Perspektive und Überschneidungen verändern die scheinbare Länge. Dieses Foto bietet keine Grundlage für ein exaktes Alter.", [mark("Kruckenhaken", 29, 17, "Spitze nach hinten gebogen"), mark("Zweites Horn", 32, 24, "Zweites sichtbares Horn am Kopf")]),
      panel("stein", "Der abgebildete Steinbock trägt lange, kräftig nach hinten gebogene Hörner mit auffälligen Wülsten an der Vorderseite.", "Die sichtbaren Vorderseitenwülste werden hier nicht als Lebensjahre gezählt. Dafür müssten geeignete Wachstumsmerkmale und das gesamte Horn ausreichend erkennbar sein.", [mark("Bogen des Bockhorns", 51, 32, "Langer rückwärts gebogener Verlauf"), mark("Vorderseitenwülste", 59, 40, "Auffällige Oberflächenstruktur")]),
    ],
    claims: [
      claim("gams-hornform", "Gämse: schlank und gehakt", "Gamsbock und Geiß besitzen schlanke Hörner, deren Spitzen nach hinten umgebogen sind. Die Krucken bleiben am Tier; es gibt keinen jährlichen Geweihabwurf.", ["gamsBayern","gamsDJV"]),
      claim("stein-hornform", "Steinbock: Bock und Geiß unterscheiden", "Beim Alpensteinbock tragen beide Geschlechter Hörner. Die Bockhörner sind gewöhnlich erheblich kräftiger und länger als die der Geißen; auch eine Steinbockgeiß gehört zu den Hornträgern.", ["steinBayern","steinPark"]),
      claim("alpine-hornstruktur", "Gleiches Bauprinzip, andere Form", "Beide Arten gehören zu den Hornträgern. Der knöcherne Kern und die äußere Hornhülle unterscheiden ihre Hörner vom unverkleideten Knochen eines fertig gefegten Hirschgeweihs.", ["amnh","npsHorns"]),
    ],
    comparison: "Die Fotos zeigen Hornformen, keine maßstabsgerechten Größen. Für die Unterscheidung werden Kopf, Körper und Hornverlauf gemeinsam betrachtet.",
    observation: "Ordne den klaren Endhaken der Gämse zu und den langen Hornbogen dem abgebildeten Steinbock. Eine Silhouette mit wenig Bilddetails reicht für Alter und Geschlecht oft nicht aus.",
  },
  {
    id: "schaufel-und-stangen", title: "Schaufel oder Stangen?", subtitle: "Damhirsch und Rehbock mit zwei Geweihformen",
    panels: [
      panel("dam", "Beim abgebildeten Damhirsch sind die verbreiterten Schaufeln des Geweihs sichtbar.", "Junge Damhirsche tragen noch keine ausgeprägten Schaufeln. Dieses Bild zeigt ein Beispiel, keine Geweihform aller Altersstufen.", [mark("Schaufelfläche", 61, 11, "Verbreiterter oberer Geweihabschnitt"), mark("Geweihstange", 68, 25, "Trägt die Schaufel")]),
      panel("rehSkull", "Der Rehbock-Schädel zeigt verzweigte Stangen ohne solche Schaufelflächen.", "Die Endenzahl ist kein Kalender für Lebensjahre. Ein einzelnes Präparat bildet die natürliche Variation nicht vollständig ab.", [mark("Stange mit Enden", 34, 28, "Verzweigung statt breiter Schaufel"), mark("Ansatz", 47, 59, "Verbindung zum bleibenden Stirnzapfen")]),
    ],
    claims: [
      claim("dam-schaufel", "Damhirsch: Schaufeln im ausgebildeten Geweih", "Ausgewachsene Damhirsche tragen typischerweise Schaufelgeweihe. Diese Form entwickelt sich mit dem Alter; weibliche Damhirsche tragen kein Geweih.", ["damBayern","damZoo"]),
      claim("reh-geweihzyklus", "Rehbock: jährlich neu gebildete Stangen", "Das Rehgeweih wächst nach dem Abwurf neu. Seine verzweigten Stangen bestehen aus Knochen; während des Wachstums werden sie vom Bast versorgt.", ["solothurn","amnh"]),
      claim("beide-abwurf", "Form und Jahreszyklus getrennt betrachten", "Reh- und Damgeweih unterscheiden sich in der Form, folgen aber beide einem Abwurf- und Neubildungszyklus. Die Zeitfenster sind artspezifisch und nicht bei beiden Arten identisch.", ["damBayern","solothurn","damDJV","rehStiftung"]),
    ],
    comparison: "Schaufelform und Stangenform sind nützliche Merkmale. Die sichere Artzuordnung nutzt zusätzlich Körpermerkmale; fehlende Schaufeln allein schließen einen jungen Damhirsch nicht aus.",
    observation: "Sieh auf die Fläche zwischen den Enden: Beim Damhirsch ist sie verbreitert. Zähle die Enden als sichtbares Merkmal, nicht als Lebensjahre.",
  },
  {
    id: "federbau", title: "Eine Feder genau ansehen", subtitle: "Vom sichtbaren Schaft bis zur mikroskopischen Verbindung",
    panels: [
      panel("mallardFeather", "Die Makroaufnahme einer Stockentenfeder zeigt den Schaft, die Fahnenflächen und parallel verlaufende Federäste.", "Der hohle untere Federkiel ist nicht im Bild. Die mikroskopischen Häkchen lassen sich bei dieser Auflösung nicht einzeln erkennen.", [mark("Schaft", 46, 53, "Stabile Mitte der Feder"), mark("Fahne", 33, 52, "Fläche aus nebeneinanderliegenden Ästen"), mark("Federäste", 63, 60, "Feine Verzweigungen vom Schaft")]),
      panel("mallard", "Das Artporträt zeigt die Stockente mit ihrem äußeren Federkleid; es ergänzt den Detailblick auf die einzelne Feder.", "Das Tierfoto zeigt weder die mikroskopische Struktur noch jede einzelne Federart. Die Makroaufnahme stammt nicht nachweislich von diesem Individuum.", []),
    ],
    claims: [
      claim("feder-schaft", "Schaft, Äste, Fahne", "Vom zentralen Schaft zweigen Federäste ab. Ihre dicht angeordneten Verzweigungen bilden bei einer geschlossenen Fahne die flächige Struktur, die im Makrofoto erkennbar ist.", ["cornell","kiel"]),
      claim("feder-haekchen", "Der Zusammenhalt liegt im Kleinen", "An den Federästen sitzen weitere feine Verzweigungen. Bei geschlossenen Fahnen greifen mikroskopische Häkchen ineinander und verbinden benachbarte Äste. Die einzelnen Häkchen sind hier nicht aufgelöst.", ["cornell","kiel"]),
      claim("feder-reparatur", "Verbindungen können sich wieder schließen", "Die Häkchenverbindungen können sich lösen und erneut verhaken. Dadurch lässt sich eine getrennte Fahne häufig wieder ordnen; das ist keine Neubildung einer zerbrochenen Feder.", ["cornell","kiel"]),
    ],
    comparison: "Verwechsle den sichtbaren Federast nicht mit einem mikroskopischen Häkchen. Die beiden Bilder verbinden den Maßstab des Vogels mit dem einer einzelnen Feder; sie zeigen verschiedene Aufnahmen.",
    observation: "Verfolge den Schaft und einen Ast bis zur Fahnenfläche. Was sich auf diesem Foto nicht auflösen lässt, bleibt ausdrücklich als mikroskopisches Wissen beschrieben.",
  },
];

export function getWildDetailTopic(id) { return wildDetailTopics.find(item => item.id === id) || wildDetailTopics[0]; }
export const wildDetailAssetPaths = Object.values(wildDetailPhotos).filter(item => item.src.startsWith("/lernen/wilddetails-2026/")).map(item => item.src);
export const wildDetailSearchEntries = wildDetailTopics.map(item => ({
  id: `wilddetails-${item.id}`, title: item.title, category: "Wildkunde", type: "Werkzeug", href: `/lernen/wildtier-details?thema=${item.id}`,
  imageKey: "wildkunde", description: item.subtitle, keywords: [item.title, item.subtitle, "Detailatlas", "Wildtier", "Anatomie", ...item.claims.map(fact => `${fact.title} ${fact.text}`)],
}));
