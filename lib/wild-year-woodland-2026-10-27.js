// Narrow woodland mammal calendars checked on 27 October 2026. The bands
// combine overlapping biological processes, not dates for every individual.
const source = (label, url, organization) => ({ label, url, organization });
const months = [1,2,3,4,5,6,7,8,9,10,11,12];
const phase = (id, covered, title, text, sourceIds) => ({ id, months: covered, title, text, sourceIds });
const annual = (id, title, text, sourceIds) => [phase(id, months, title, text, sourceIds)];
const profile = (slug, name, fields) => ({ slug, name, coatLabel: "Aussehen", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27", ...fields });

export const wildYearWoodlandSources = {
  oct27wCatBfN: source("Bundesamt für Naturschutz · Wildkatze, Lebensraum und Fortpflanzung", "https://www.bfn.de/artenportraits/felis-silvestris", "bfn"),
  oct27wCatBY: source("Wildtierportal Bayern · Wildkatze, Merkmale und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildkatze", "stmelf-bayern"),
  oct27wCatEcology: source("StMELF · Ökologie der Wildkatze, Reproduktion und Entwicklung, S. 3", "https://www.wildtierportal.bayern.de/mam/cms12/wildtiere_bayern/dateien/oekologie_web.pdf", "stmelf-bayern"),
  oct27wCatDJV: source("Deutscher Jagdverband · Wildkatze, Fortpflanzung und Lebensweise", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildkatze-felis-silvestris", "djv"),
  oct27wCatDWS: source("Deutsche Wildtier Stiftung · Wildkatze, Ranzzeit und Gehecke", "https://www.deutschewildtierstiftung.de/wildtiere/wildkatze", "deutsche-wildtier-stiftung"),
  oct27wCatBN: source("BUND Naturschutz · Wildkatze, Steckbrief und Unterscheidungsgrenzen", "https://www.bund-naturschutz.de/tiere-in-bayern/wildkatze/steckbrief", "bund-naturschutz"),
  oct27wSquirrelDWS: source("Deutsche Wildtier Stiftung · Eichhörnchen, Fell und Fortpflanzung", "https://www.deutschewildtierstiftung.de/wildtiere/eichhoernchen", "deutsche-wildtier-stiftung"),
  oct27wSquirrelLBV: source("LBV · Eichhörnchen, Nahrung, Fortpflanzung und Verhalten", "https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/eichhoernchen/", "lbv"),
  oct27wSquirrelBN: source("BUND Naturschutz · Eichhörnchen, Fell und Ernährung", "https://www.bund-naturschutz.de/tiere-in-bayern/eichhoernchen", "bund-naturschutz"),
  oct27wSquirrelHofmann: source("Heini Hofmann, Redaktion WSL · Eichhörnchen – Kobolde im Wald, 2007", "https://www.waldwissen.net/de/lebensraum-wald/tiere-im-wald/saeugetiere/kobolde-im-wald", "hofmann-wsl"),
  oct27wSquirrelADW: source("University of Michigan, Joshua Seinfeld · Sciurus vulgaris, Reproduction, 1999", "https://animaldiversity.org/accounts/Sciurus_vulgaris/", "university-michigan-adw"),
};

export const wildYearWoodlandSpecies = [
  profile("wildkatze", "Wildkatze", {
    coat: annual("oct27w-wildkatze-schwanz", "Merkmale sind Hinweise", "Der buschige Schwanz trägt dunkle Ringe und ein stumpfes dunkles Ende. Wildfarbene Hauskatzen können ähnlich aussehen; einzelne Fellmerkmale sichern die Artzugehörigkeit nicht.", ["oct27wCatBY","oct27wCatBN"]),
    crown: annual("oct27w-wildkatze-beute", "Kleine Säugetiere als Beute", "Vor allem Mäuse und andere kleine Säugetiere gehören zur Nahrung. Ein einzelner Beutefund beschreibt nicht das gesamte Nahrungsspektrum.", ["oct27wCatBfN","oct27wCatDJV"]),
    reproduction: [
      phase("oct27w-wildkatze-ranz", [1,2,3], "Ranz und erste Würfe", "Die Hauptpaarungszeit liegt zwischen Januar und März. Erste Geburten können bereits im März auftreten; Paarung und Jungenaufzucht verschiedener Tiere überlappen.", ["oct27wCatBfN","oct27wCatDWS","oct27wCatBN"]),
      phase("oct27w-wildkatze-fruehjahr", [4,5], "Frühjahrswürfe", "Viele Würfe fallen ins Frühjahr. Die Mutter bringt ihre Jungen in geschützten Verstecken zur Welt, etwa in Höhlen oder Reisighaufen.", ["oct27wCatBfN","oct27wCatDJV"]),
      phase("oct27w-wildkatze-ersatzwuerfe", [6,7,8,9], "Aufzucht und mögliche Ersatzwürfe", "Nach Verlust eines Wurfs kann es erneut zur Paarung kommen. Solche Ersatzwürfe können bis in den September reichen; die Aufzucht ist keine ausschließlich frühsommerliche Phase.", ["oct27wCatDWS","oct27wCatBN"]),
      phase("oct27w-wildkatze-herbst", [10,11,12], "Unterschiedlich alter Nachwuchs", "Früh geborene Jungtiere können im Herbst selbständig werden und eigene Streifgebiete suchen. Bei späten Würfen verschiebt sich die Entwicklung.", ["oct27wCatEcology","oct27wCatDJV"]),
    ],
    behavior: annual("oct27w-wildkatze-aktiv", "Heimliche Einzelgänger", "Wildkatzen sind hauptsächlich in der Dämmerung und nachts aktiv. Erwachsene leben überwiegend einzeln; Mutter und Jungtiere bilden zeitweise einen Familienverband.", ["oct27wCatBfN","oct27wCatDJV","oct27wCatEcology"]),
    uncertainty: "Die Quellen nennen März–Mai für die üblichen Geburten, April/Mai beziehungsweise April als Schwerpunkt und spätere Ersatzwürfe bis September. Die Bänder verbinden überlappende Abläufe. Sie setzen weder einen festen Geburtstag noch einen einheitlichen Termin der Selbständigkeit; abhängige Junge sind nicht pauschal auf einen Sommermonat begrenzt.",
  }),
  profile("eichhoernchen", "Eichhörnchen", {
    coat: annual("oct27w-eichhoernchen-fell", "Fellwechsel im Jahreslauf", "Im Frühjahr und Herbst wechselt das Körperfell. Das Winterfell ist dichter; Ohrpinsel sind dann meist ausgeprägter. Die Fellfarbe allein bestimmt weder Alter noch einen genauen Monat.", ["oct27wSquirrelDWS","oct27wSquirrelBN"]),
    crown: annual("oct27w-eichhoernchen-nahrung", "Samen, Nüsse und weitere Nahrung", "Baumsamen und Nüsse sind wichtige Nahrung. Dazu kommen unter anderem Pilze und gelegentlich tierische Kost. Das erreichbare Angebot verändert die Zusammensetzung.", ["oct27wSquirrelLBV","oct27wSquirrelBN"]),
    reproduction: [
      phase("oct27w-eichhoernchen-fruehe-paarung", [12,1], "Frühe Paarungen möglich", "Erste Paarungen können Ende Dezember oder Anfang Januar stattfinden. Verfolgungsjagden gehören zum Paarungsverhalten; der Beginn ist kein fester Termin für jedes Tier.", ["oct27wSquirrelDWS","oct27wSquirrelLBV"]),
      phase("oct27w-eichhoernchen-wuerfe", [2,3,4,5,6,7,8], "Gestaffelte Würfe und Aufzucht", "Die Quellen nennen Geburten von Februar bis August. Ein zweiter Wurf ist möglich. Nicht alle Weibchen bekommen gleichzeitig Junge; diese wachsen als Nesthocker im Kobel heran.", ["oct27wSquirrelLBV","oct27wSquirrelHofmann"]),
      phase("oct27w-eichhoernchen-entwicklung", [9,10,11], "Nachlauf der Jungenentwicklung", "Nach Sommerwürfen wachsen Jungtiere weiter heran. Das erste Verlassen des Kobels bedeutet nicht, dass die Versorgung mit Milch bereits beendet ist.", ["oct27wSquirrelHofmann","oct27wSquirrelADW"]),
    ],
    behavior: annual("oct27w-eichhoernchen-winter", "Tagaktiv, auch im Winter", "Eichhörnchen halten keinen Winterschlaf. In der kalten Jahreszeit kann ihre Aktivität abnehmen; zur Nahrungssuche verlassen sie weiterhin den Kobel.", ["oct27wSquirrelLBV","oct27wSquirrelHofmann","oct27wSquirrelDWS"]),
    uncertainty: "Wetter und Nahrungsangebot beeinflussen die Fortpflanzung. Die Quellen unterscheiden sich bereits beim ersten Geburtszeitpunkt innerhalb des Februars. Das Herbstband erklärt den Entwicklungsnachlauf später Würfe, keinen festen Altersstand oder Stilltermin im November. Körperfellwechsel und Ohrpinsel erlauben keine sichere Monatsbestimmung eines Fotos.",
  }),
];
