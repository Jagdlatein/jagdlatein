import photographRecords from "../public/lernen/bewegung-entwicklung-2026/eichenserie-bildnachweise.json";

export const developmentReviewedOn = "2026-10-13";
export const developmentSources = {
  goettingen: { organization: "Georg-August-Universität Göttingen · Forstbotanischer Garten", title: "Stieleiche – Blüten, Samen und Früchte", url: "https://www.uni-goettingen.de/de/bl%C3%BCten%2C%2Bsamen%2Bund%2Bfr%C3%BCchte/16692.html" },
  lwf: { organization: "Bayerische Landesanstalt für Wald und Forstwirtschaft", title: "Naturverjüngung: Bestimmungshilfe Keimlinge und Sämlinge", url: "https://www.lwf.bayern.de/mam/cms04/service/dateien/mb32_naturverjuengung_bestimmungshilfe_bf.pdf" },
  wsl: { organization: "Eidgenössische Forschungsanstalt WSL", title: "Mastweb: Stieleiche", url: "https://mastweb.wsl.ch/de/samenmast-erkennen/stieleiche/" },
  smnk: { organization: "Staatliches Museum für Naturkunde Karlsruhe", title: "Heldbock und Eichenschutz – Infos zur Bestimmung von Stiel- und Traubeneiche", url: "https://www.smnk.de/forschung/botanik/wissenswertes-aus-der-botanik/heldbock/" },
  bayreuth: { organization: "Universität Bayreuth · BayCEER", title: "Qualifizierung Feldbotanik: Artensteckbriefe Bronze Nordbayern · Quercus robur", url: "https://www.bayceer.uni-bayreuth.de/zertifizierung_artenkenntnis/de/allgemein/5001/0/7521/Artensteckbriefe_Bronze_Nordbayern_final.pdf" },
};
const observations = {
  29: { title: "Ein schlanker Spross", observation: "Über der geöffneten Eichel steht ein schlanker Spross. An seiner Spitze sitzen noch eng zusammenliegende junge Blätter.", alt: "Dokumentierte Stieleiche gland 1 am 29. Tag nach Aussaat: schlanker Spross und eng zusammenliegende junge Blätter neben einer geöffneten Eichel im Topf" },
  32: { title: "Blätter öffnen sich", observation: "Mehrere helle junge Blätter stehen weiter auseinander. Die geöffnete Eichel bleibt in dieser Aufnahme sichtbar.", alt: "Dieselbe dokumentierte Stieleiche gland 1 am 32. Tag nach Aussaat mit mehreren sich öffnenden jungen Blättern und sichtbarer Eichel" },
  39: { title: "Gelappte Blätter", observation: "Mehrere breite, deutlich gelappte Blätter sind entfaltet. Die Aufnahme zeigt auch den Topf und die Eichel an der Bodenoberfläche.", alt: "Dieselbe dokumentierte Stieleiche gland 1 am 39. Tag nach Aussaat mit mehreren entfalteten gelappten Blättern und sichtbarer Eichel im Topf" },
  221: { title: "Späterer Austrieb", observation: "Die Originalbeschreibung nennt einen erneuten Austrieb nach dem ersten Winter. Sichtbar sind kleine helle Blätter am oberen Spross. Die lange Zwischenzeit ist hier nicht bebildert.", alt: "Dokumentierte Stieleiche gland 1 am 221. Tag nach Aussaat: kleine helle Blätter am oberen Spross im Topf" },
  227: { title: "Sechs Tage später", observation: "Sechs dokumentierte Tage nach der vorherigen Aufnahme stehen mehrere größere Blattflächen auseinander. Das ist ein Vergleich dieser Pflanze, kein allgemeiner Wachstumstakt.", alt: "Dieselbe dokumentierte Stieleiche gland 1 am 227. Tag nach Aussaat mit weiter entfalteten gelappten Blättern" },
};
export const developmentPhotoSeries = [{
  id: "stieleiche-gland1", plantId: "stieleiche", title: "Eine Eichel wird zur jungen Stieleiche", category: "wald-pflanzen", latin: "Quercus robur", reviewedOn: developmentReviewedOn,
  description: "Fünf echte Aufnahmen derselben vom Fotografen als „gland 1“ dokumentierten Pflanze. Vergleiche den ersten Austrieb mit den späteren Aufnahmen – die Tage stammen aus den jeweiligen Originalbeschreibungen.",
  identityEvidence: "Alle fünf Originaldateien sind als Quercus robur, gland 1 bezeichnet; derselbe Urheber dokumentiert 29, 32, 39, 221 und 227 Tage nach Aussaat. Dies ist die Dokumentation eines Fotografen, keine wissenschaftliche Wiederholung und keine nachträglich zusammengestellte Reihe verschiedener Pflanzen.",
  photographedPeriod: "5. Dezember 2014 bis 21. Juni 2015", scope: "Ein in einem Topf gezogenes Individuum einer auch im DACH-Raum vorkommenden Art. Aufnahmeort und Kulturbedingungen sind nicht genauer belegt; daraus folgt kein Freilandkalender.",
  frames: photographRecords.map(photo => ({ ...photo, ...observations[photo.dayAfterSowing], credit: `Foto: ${photo.author} · ${photo.license}` })),
  facts: [
    { id: "oak-cotyledons", title: "Die Eichel als Vorrat", text: "Bei Eichen bleiben die verdickten Keimblätter in der Eichel. Sie dienen als Speicherorgane und versorgen die Jungpflanze. Die später am Spross sichtbaren grünen Blätter sind Laubblätter; sie sind nicht die aus der Erde gehobenen Keimblätter. Diese Keimungsform heißt hypogäisch.", sourceIds: ["goettingen", "lwf"] },
    { id: "oak-leaf-character", title: "Mehrere Blattmerkmale zusammen", text: "Bei der Stieleiche helfen gelappte Blätter, ein kurzer Blattstiel und kleine Öhrchen am Blattgrund bei der Einordnung. Ein einzelnes Blattfoto oder ein Entwicklungsstadium genügt nicht zur sicheren Bestimmung jedes unbekannten Eichenfunds. Diese Serie übernimmt die dokumentierte Artangabe des Urhebers.", sourceIds: ["smnk", "bayreuth"] },
    { id: "oak-fruit-stalk", title: "Welcher Stiel gibt den Namen?", text: "Die Früchte der Stieleiche sitzen an langen Stielen. Der Name bezieht sich auf die Eichelstände, nicht auf besonders lange Blattstiele. Die geöffnete Eichel im Topf zeigt keinen vollständigen Fruchtstand am Mutterbaum; dieses Merkmal muss dort zusätzlich betrachtet werden.", sourceIds: ["wsl", "goettingen", "smnk"] },
  ],
  boundaries: ["Die angegebenen Tage beschreiben ausschließlich diese vom Fotografen dokumentierte Aussaat, keine Entwicklungsfrist für jede Eiche.", "Zwischen Tag 39 und Tag 221 fehlen hier Aufnahmen. Der Regler wählt fünf Dokumentationspunkte; er simuliert kein Wachstum zwischen ihnen.", "Die späteren Aufnahmen zeigen einen erneuten Austrieb. Blattflächen wachsen in dieser Serie nicht über die gesamte Zeit gleichmäßig.", "Topf, Blickwinkel, Abstand und Ausschnitt der Originalaufnahmen unterscheiden sich. Ohne Maßstab wird keine Pflanzenhöhe oder Wachstumsgeschwindigkeit berechnet.", "Wurzeln, Gesundheit, Temperatur, Beleuchtung und Bewässerung sind aus diesen Bildern nicht vollständig bekannt. Die Serie gibt keine Saat- oder Pflegeanweisung."],
  question: { prompt: "Belegt das Foto von Tag 39, dass jede Stieleiche nach 39 Tagen so aussieht?", choices: ["Ja, die Tageszahl ist eine allgemeine Entwicklungsregel.", "Nein, die Aufnahme dokumentiert dieses eine Individuum unter nicht vollständig bekannten Bedingungen.", "Ja, solange die Eichel dieselbe Farbe hat."], answer: 1, explanation: "Die Tageszahl ist eine Angabe zur konkreten Fotoreihe. Sie lässt sich ohne vergleichbare Bedingungen und weitere Daten nicht zu einer Regel für andere Pflanzen machen." },
  aliases: ["Eichel", "Eiche", "Stieleiche", "Keimung", "Keimblätter", "hypogäisch", "Sämling", "Saemling", "Austrieb", "Entwicklung", "Fotoreihe", "Quercus robur", "gland 1"],
}];
export function getDevelopmentPhotoSeries(id) {
  return developmentPhotoSeries.find(series => series.id === id) || developmentPhotoSeries[0];
}
export function getDevelopmentFrame(series, index) {
  const safeIndex = Number.isInteger(index) && index >= 0 && index < series.frames.length ? index : 0;
  return series.frames[safeIndex];
}
export const developmentSearchEntries = developmentPhotoSeries.map(series => ({ id: `entwicklung:${series.id}`, type: "entry", title: series.title, description: series.description, href: `/lernen/pflanzenatlas?entwicklung=${series.id}#pflanzen-entwicklung`, categories: ["wald-pflanzen"], aliases: series.aliases, text: [series.latin, series.scope, ...series.facts.map(fact => fact.text)].join(" ") }));
export const developmentAssetPaths = [...photographRecords.map(photo => photo.src), "/lernen/bewegung-entwicklung-2026/eichenserie-bildnachweise.json"];
