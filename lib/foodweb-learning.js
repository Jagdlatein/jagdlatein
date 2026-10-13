import photoRecords from "../public/lernen/kleines-revierleben-2026/bildnachweise.json";

export const foodwebReviewedOn = "2026-10-13";
export const foodwebTopic = { id: "nahrungsnetz", title: "Wer frisst was? Ein Nahrungsnetz entdecken", summary: "Laub, Regenwürmer, Laufkäfer, Spinnen und Grasfrosch: Nahrungspfeile mit echten Fotos und unmittelbar sichtbarer Erklärung." };
export const foodwebSources = {
  muensterWorms: { organization: "Universität Münster", title: "Hypersoil: Regenwürmer, Streunahrung und verschiedene Lebensformen", url: "https://hypersoil.uni-muenster.de/0/07/04/05.htm" },
  kielWorms: { organization: "Hochschule für Angewandte Wissenschaften Kiel", title: "Was hat der Regenwurm mit Regen zu tun? Interview mit Dr. Ute Kropf: Nahrung und verschiedene Lebensformen", url: "https://www.haw-kiel.de/news/was-hat-der-regenwurm-mit-regen-zu-tun/" },
  lflBeetles: { organization: "Bayerische Landesanstalt für Landwirtschaft", title: "Laufkäfer in der Agrarlandschaft: Nahrung von Großlaufkäfern", url: "https://www.lfl.bayern.de/iab/boden/211545/index.php" },
  austriaBeetles: { organization: "Blühendes Österreich, gemeinnützige Privatstiftung", title: "Naturlexikon Goldlaufkäfer: Regenwürmer als mögliche Beute", url: "https://www.bluehendesoesterreich.at/naturlexikon/goldlaufkaefer" },
  lubwFrog: { organization: "Landesanstalt für Umwelt Baden-Württemberg", title: "Grasfrosch: Nahrung erwachsener Tiere und Larven", url: "https://www.lubw.baden-wuerttemberg.de/en/-/grasfrosch-rana-temporaria-linnaeus-1758" },
  lfuAmphibians: { organization: "Bayerisches Landesamt für Umwelt", title: "Amphibien im Garten: Spinnen und Würmer als Nahrung von Lurchen", url: "https://www.lfu.bayern.de/natur/bayaz/gartenvielfalt/arten_im_garten/amphibien/index.htm" },
  muensterNetwork: { organization: "Universität Münster", title: "Hypersoil: Nahrungskette und Nahrungsnetz im Boden", url: "https://www.hypersoil.uni-muenster.de/0/06/10.htm" },
  lwfLitter: { organization: "Bayerische Landesanstalt für Wald und Forstwirtschaft", title: "Wohin verschwindet das ganze Laub? Bodentiere und Mikroorganismen", url: "https://www.lwf.bayern.de/wissenstransfer/forstcastnet/239764/index.php" },
};
const photo = id => photoRecords.find(item => item.id === id);
export const foodwebNodes = [
  { id: "laub", label: "Laubstreu", photo: photo("streuabbau"), x: 30, y: 25, description: "Pflanzenreste sind eine Nahrungsgrundlage. Das Foto zeigt Streu ohne dokumentierten Aufnahmeort; die kleinen Zersetzer sind hier nicht sichtbar." },
  { id: "regenwurm", label: "Regenwürmer", photo: photo("regenwuermer"), x: 350, y: 25, description: "Beispielbild eines Tauwurms aus Dänemark. Die Nahrung unterscheidet sich zwischen Lebensformen; das Tier im Foto frisst nicht sichtbar an einem Blatt." },
  { id: "laufkaefer", label: "Goldlaufkäfer", photo: photo("laufkaefer"), x: 670, y: 25, description: "Das Originalfoto aus Norddeutschland zeigt den Goldlaufkäfer tatsächlich an einem Regenwurm. Dieser Kontakt ist ein Ereignis, keine Fangrate." },
  { id: "spinne", label: "Spinnen", photo: photo("spinnen"), x: 160, y: 265, description: "Eine Gartenkreuzspinne im Radnetz in Deutschland dient als Beispiel der Gruppe. Der Pfeil zum Frosch betrifft Spinnen als mögliche Beute, nicht einen beobachteten Fang dieses Tiers." },
  { id: "grasfrosch", label: "Erwachsener Grasfrosch", photo: photo("amphibien"), x: 540, y: 265, description: "Originalfoto aus Chemnitz, in der Bildquelle als ausgewachsenes Tier beschrieben. Der Frosch sitzt an Land; das Bild selbst zeigt keinen Beutefang." },
];
export const foodwebRelationships = [
  { id: "laub-wurm", from: "laub", to: "regenwurm", title: "Laubstreu → Regenwürmer", text: "Regenwürmer nutzen abgestorbene Pflanzenreste. Streu-, Flach- und Tiefenbewohner leben und fressen unterschiedlich; dieser Pfeil steht für einen Nahrungsweg, nicht für die Ernährung jeder Art ausschließlich von Laub.", sourceIds: ["muensterWorms", "kielWorms"], path: "M230 105 H340" },
  { id: "wurm-kaefer", from: "regenwurm", to: "laufkaefer", title: "Regenwürmer → Goldlaufkäfer", text: "Der Goldlaufkäfer kann Regenwürmer erbeuten. Im verwendeten Käferfoto ist genau ein solcher Nahrungskontakt dokumentiert. Er ist keine feste Nahrungsliste aller Laufkäfer und keine Aussage zur Häufigkeit im Revier.", sourceIds: ["lflBeetles", "austriaBeetles"], path: "M550 105 H660" },
  { id: "wurm-frosch", from: "regenwurm", to: "grasfrosch", title: "Würmer → erwachsener Grasfrosch", text: "Würmer gehören zur möglichen tierischen Nahrung erwachsener Grasfrösche. Das Foto eines Regenwurms veranschaulicht diese Beutegruppe. Die Beziehung wird nicht auf Grasfrosch-Kaulquappen übertragen.", sourceIds: ["lubwFrog", "lfuAmphibians"], path: "M450 195 Q450 230 590 260" },
  { id: "spinne-frosch", from: "spinne", to: "grasfrosch", title: "Spinnen → erwachsener Grasfrosch", text: "Erwachsene Grasfrösche können Spinnen fressen. Das Spinnenfoto steht für die Gruppe; die Quellen belegen damit weder den Fang dieser Gartenkreuzspinne noch einen garantierten Kontakt an jedem Standort.", sourceIds: ["lubwFrog", "lfuAmphibians"], path: "M360 345 H530" },
];
export const foodwebContext = {
  text: "Ein Nahrungsnetz enthält mehrere miteinander verbundene Nahrungswege. Dieser kleine Ausschnitt lässt viele Arten und Beziehungen weg. Pilze und Bakterien wirken beim Abbau organischer Reste mit; ohne sie ist das Bild des Streuabbaus unvollständig.",
  sourceIds: ["muensterNetwork", "lwfLitter"],
  limit: "Pfeile bedeuten hier: dient als mögliche Nahrung für. Sie beschreiben keine Tierzahlen, keine Stärke eines Bestandsrückgangs und keinen sicher beobachteten Kontakt zwischen den verschiedenen Fotoorten. Die Fotografien sind Beispiele, keine gemeinsame Aufnahme eines Reviers.",
};
export function getFoodwebSelection(id) {
  const node = foodwebNodes.find(item => item.id === id) || foodwebNodes.find(item => item.id === "regenwurm");
  const relationships = foodwebRelationships.filter(item => item.from === node.id || item.to === node.id);
  return { node, relationships, connectedIds: [...new Set([node.id, ...relationships.flatMap(item => [item.from, item.to])])] };
}
export const foodwebAssetPaths = foodwebNodes.map(item => item.photo.src);
export const foodwebSearchEntries = [{ id: "revierleben:nahrungsnetz", type: "entry", title: foodwebTopic.title, description: foodwebTopic.summary, href: "/lernen/kleines-revierleben?thema=nahrungsnetz#revierleben-inhalt", categories: ["natur-revier", "wald-pflanzen", "landwirtschaft-lebensraeume"], aliases: ["Wer frisst was", "Nahrungskette", "Nahrungspfeil", "Laubstreu", "Konsumenten", "Räuber", "Zersetzer"], text: [foodwebContext.text, foodwebContext.limit, ...foodwebRelationships.map(item => `${item.title} ${item.text}`)].join(" ") }];
