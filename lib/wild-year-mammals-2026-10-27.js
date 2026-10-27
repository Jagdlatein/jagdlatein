// Narrow biological checks on 27 October 2026. The month bands are editorial
// orientation windows, not observations or fixed deadlines for every animal.
const source = (label, url, organization) => ({ label, url, organization });
export const wildYearMammalSources = {
  oct27mFuchsBayern: source("Wildtierportal Bayern · Fuchs, Erscheinungsbild und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/085227/index.php", "stmelf-bayern"),
  oct27mFuchsDJV: source("Deutscher Jagdverband · Fuchs, Kennzeichen und Fortpflanzung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/fuchs-vulpes-vulpes", "djv"),
  oct27mFuchsStiftung: source("Deutsche Wildtier Stiftung · Fuchs, Merkmale und Familienentwicklung", "https://www.deutschewildtierstiftung.de/wildtiere/fuchs", "deutsche-wildtier-stiftung"),
  oct27mKaninchenBayern: source("Wildtierportal Bayern · Wildkaninchen, Lebensweise und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/140874/index.php", "stmelf-bayern"),
  oct27mKaninchenDJV: source("Deutscher Jagdverband · Wildkaninchen", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildkaninchen-oryctolagus-cuniculus", "djv"),
  oct27mKaninchenWFS: source("Wildforschungsstelle Baden-Württemberg · Feldhase und Wildkaninchen, 2023, S. 4–5", "https://www.wildtierportal-bw.de/filefly/api?action=stream&path=%2Fwildarten%2Fpdfs%2F2023-wfs-hase-kaninchen.pdf", "lazbw"),
  oct27mMurmelBayern: source("Wildtierportal Bayern · Murmeltier, Aussehen und Pflanzenkost", "https://www.wildtierportal.bayern.de/wildtiere_bayern/100955/index.php", "stmelf-bayern"),
  oct27mMurmelPark: source("Schweizerischer Nationalpark · Murmeltier, Familien und Winterschlaf", "https://nationalpark.ch/flora-und-fauna/murmeltier/", "schweizerischer-nationalpark"),
  oct27mMurmelNuernberg: source("Tiergarten der Stadt Nürnberg · Alpenmurmeltier, Winterschlaf und Fettreserven", "https://tiergarten.nuernberg.de/entdecken/tiere-a-z/tier/murmeltier-alpenmurmeltier", "stadt-nuernberg"),
  oct27mMurmelTirol: source("Tiroler Jägerverband · Alpenmurmeltier, Fortpflanzung", "https://www.tjv.at/wild-jagd/wildtiere/haarwild/alpenmurmeltier/", "tiroler-jaegerverband"),
  oct27mMurmelStiftung: source("Deutsche Wildtier Stiftung · Alpenmurmeltier, Merkmale und Fortpflanzung", "https://www.deutschewildtierstiftung.de/wildtiere/alpenmurmeltier", "deutsche-wildtier-stiftung"),
  oct27mSchneehasePark: source("Schweizerischer Nationalpark · Alpenschneehase, Farbwechsel", "https://nationalpark.ch/flora-und-fauna/schneehase/", "schweizerischer-nationalpark"),
  oct27mSchneehaseBayern: source("Wildtierportal Bayern · Schneehase, saisonaler Fellwechsel und Aufzucht", "https://www.wildtierportal.bayern.de/wildtiere_bayern/126311/index.php", "stmelf-bayern"),
  oct27mSchneehaseSuedtirol: source("Südtiroler Jagdverband · Schneehase, Lebensweise und Nahrung", "https://jagdverband.it/schneehase-2/", "suedtiroler-jagdverband"),
  oct27mSchneehaseTirol: source("Tiroler Jägerverband · Schneehase, gebietsabhängige Fortpflanzung", "https://www.tjv.at/wild-jagd/wildtiere/haarwild/schneehase/", "tiroler-jaegerverband"),
  oct27mWaschbaerBayern: source("Wildtierportal Bayern · Waschbär, Kennzeichen und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/176023/index.php", "stmelf-bayern"),
  oct27mWaschbaerDJV: source("Deutscher Jagdverband · Waschbär, Ernährung und Jungenentwicklung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/waschbaer-procyon-lotor", "djv"),
  oct27mWaschbaerBerlin: source("Senatsverwaltung Berlin · Waschbär, Winterruhe und Ernährung", "https://www.berlin.de/sen/uvk/natur-und-gruen/jagd-und-wildtiere/wildtiere-im-stadtgebiet/waschbaer/", "land-berlin"),
  oct27mMarderhundBayern: source("Wildtierportal Bayern · Marderhund, Jahreslauf und Winterruhe", "https://www.wildtierportal.bayern.de/wildtiere_bayern/223538/index.php", "stmelf-bayern"),
  oct27mMarderhundDJV: source("Deutscher Jagdverband · Marderhund, Nahrung und Familienentwicklung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/marderhund-nyctereutes-procyonoides", "djv"),
  oct27mMarderhundNRW: source("Landesamt NRW · Marderhund, Winteraktivität", "https://linfos.naturschutzinformationen.nrw.de/neobiota/de/arten/tiere/159259/kurzbeschreibung", "lanuk-nrw"),
  oct27mMarderhundHaupt: source("Haupt Verlag / Wilde Nachbarn · Marderhund, unterbrochene Winterruhe", "https://bw.wildenachbarn.de/artportraet/marderhund", "haupt-verlag-stadtfauna"),
  oct27mSteinBayern: source("Wildtierportal Bayern · Steinmarder, Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/100869/index.php", "stmelf-bayern"),
  oct27mSteinDJV: source("Deutscher Jagdverband · Steinmarder, Kennzeichen und Fortpflanzung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/steinmarder-martes-foina", "djv"),
  oct27mBaumBayern: source("Wildtierportal Bayern · Baummarder, Lebensweise und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/100914/index.php", "stmelf-bayern"),
  oct27mBaumDJV: source("Deutscher Jagdverband · Baummarder, Ernährung und Keimruhe", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/baummarder-martes-martes", "djv"),
  oct27mBaumTirol: source("Tiroler Jägerverband · Baummarder, Ranz und Frühjahrswurf", "https://www.tjv.at/wild-jagd/wildtiere/haarwild/baummarder/", "tiroler-jaegerverband"),
};
const allMonths = [1,2,3,4,5,6,7,8,9,10,11,12];
const phase = (id, months, title, text, sourceIds) => ({ id, months, title, text, sourceIds });
const yearRound = (id, title, text, sourceIds) => [phase(id, allMonths, title, text, sourceIds)];
const profile = (slug, name, fields) => ({ slug, name, coatLabel: "Aussehen", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27", ...fields });

export const wildYearMammalSpecies = [
  profile("fuchs", "Fuchs", {
    coat: yearRound("oct27-fuchs-fell", "Sommer- und Winterpelz", "Das meist rötliche Fell und die buschige Lunte verändern sich mit dem Haarkleid. Der Winterpelz ist dichter als die kürzere Sommerbehaarung; Farbvarianten kommen vor.", ["oct27mFuchsDJV","oct27mFuchsStiftung"]),
    crown: yearRound("oct27-fuchs-nahrung", "Angebot bestimmt die Nahrung", "Mäuse, weitere Kleintiere, Wirbellose, Aas und Früchte gehören zum Nahrungsspektrum. Der Fuchs ist ein Allesfresser und nutzt örtlich verfügbare Nahrung.", ["oct27mFuchsBayern","oct27mFuchsStiftung"]),
    reproduction: [
      phase("oct27-fuchs-ranz", [1,2], "Winterliche Ranz", "Januar und Februar gehören zur typischen Paarungsphase. Bayern beschreibt einen möglichen Beginn schon im Dezember; das Monatsband ist kein fester Starttermin.", ["oct27mFuchsBayern","oct27mFuchsDJV"]),
      phase("oct27-fuchs-welpen", [3,4], "Welpen im Bau", "Die Jungen kommen typischerweise im März oder April zur Welt. Sie bleiben zunächst im geschützten Wurfplatz und sind anfangs noch blind.", ["oct27mFuchsDJV","oct27mFuchsStiftung"]),
      phase("oct27-fuchs-aufzucht", [5,6,7,8], "Aufzucht und Erkundung", "Die Welpen verlassen den Bau zunehmend und erkunden ihre Umgebung. Selbstständigkeit entwickelt sich schrittweise; die Familien lösen sich nicht an einem einheitlichen Datum auf.", ["oct27mFuchsDJV","oct27mFuchsStiftung"]),
      phase("oct27-fuchs-jugend", [9,10,11,12], "Unterschiedliche Abwanderung", "Jungfüchse können eigene Streifgebiete suchen; manche halten länger Kontakt zur Familie. Herbst und Winter bilden den Übergang zum nächsten Fortpflanzungszyklus.", ["oct27mFuchsDJV","oct27mFuchsStiftung","oct27mFuchsBayern"]),
    ],
    behavior: yearRound("oct27-fuchs-aktivitaet", "Dämmerung, Nacht und Rückzugsplätze", "Füchse sind überwiegend dämmerungs- und nachtaktiv. Wald, Feldflur und Siedlungen können genutzt werden; ein Bau ist besonders für die Jungenaufzucht bedeutsam.", ["oct27mFuchsBayern","oct27mFuchsStiftung"]),
    uncertainty: "Die Quellen unterscheiden sich besonders beim Zeitpunkt der Selbstständigkeit und Abwanderung. Die Bänder bündeln typische Abläufe; ein sichtbarer einzelner Fuchs belegt weder fehlende Familienbindung noch fehlenden Nachwuchs.",
  }),
  profile("wildkaninchen", "Wildkaninchen", {
    coat: yearRound("oct27-kaninchen-gestalt", "Kurze Ohren und kompakter Körper", "Wildkaninchen sind kleiner und gedrungener als Feldhasen. Graubraune Oberseite, hellere Unterseite und kurze Ohren gehören zu den typischen Merkmalen.", ["oct27mKaninchenBayern","oct27mKaninchenDJV"]),
    crown: yearRound("oct27-kaninchen-nahrung", "Pflanzenkost am Bauumfeld", "Gräser und weitere Pflanzen bilden die Nahrung. Das erreichbare Angebot verändert sich jahreszeitlich; die Nähe des Baus prägt die Nahrungssuche.", ["oct27mKaninchenBayern","oct27mKaninchenDJV"]),
    reproduction: [
      phase("oct27-kaninchen-rammeln", [2,3,4,5,6,7,8,9], "Lange Fortpflanzungsphase", "Die Paarung beginnt in Mitteleuropa oft im Februar oder März. Mehrere Würfe sind möglich. Nackte, blinde Junge liegen zunächst als Nesthocker in einer eigenen Setzröhre; Paarung und Aufzucht überlappen.", ["oct27mKaninchenBayern","oct27mKaninchenDJV","oct27mKaninchenWFS"]),
      phase("oct27-kaninchen-flexibel", [10,11,12,1], "Kein starrer Endtermin", "Die Quellen beschreiben verschiedene Fortpflanzungsfenster und wiederholte Würfe. Deshalb sind die übrigen Monate keine aus diesem Kalender ableitbare Garantie für einen Zeitraum ohne abhängige Jungtiere.", ["oct27mKaninchenBayern","oct27mKaninchenDJV","oct27mKaninchenWFS"]),
    ],
    behavior: yearRound("oct27-kaninchen-bau", "Kolonie und Gemeinschaftsbau", "Wildkaninchen leben in Gruppen mit unterirdischen Bauen. Lockere Böden erleichtern das Graben. Klopfen mit den Hinterläufen kann Gruppenmitglieder warnen.", ["oct27mKaninchenBayern","oct27mKaninchenDJV"]),
    uncertainty: "Bayern nennt Februar bis Juli als häufige Paarungsphase, der DJV den Beginn Februar/März; die WFS nennt Würfe bis September. Das längere Band fasst Paarung und Aufzucht zusammen und setzt keinen universellen Endtermin. Es beschreibt nicht die oberirdische Jungenstrategie des Feldhasen.",
  }),
  profile("murmeltier", "Alpenmurmeltier", {
    coat: yearRound("oct27-murmel-aussehen", "Dichtes Fell und kleine Ohren", "Ein gedrungener Körper, kleine Ohren und graubraunes, variabel gefärbtes Fell kennzeichnen das Alpenmurmeltier. Das hintere Schwanzende ist dunkel.", ["oct27mMurmelBayern","oct27mMurmelStiftung"]),
    crown: [
      phase("oct27-murmel-reserven", [11,12,1,2,3], "Von Fettreserven leben", "Während des echten Winterschlafs wird keine Nahrung aufgenommen. Die Tiere nutzen zuvor aufgebaute Körperreserven; dies ist keine tägliche Nahrungssuche zwischen Ruhepausen.", ["oct27mMurmelPark","oct27mMurmelNuernberg","oct27mMurmelBayern"]),
      phase("oct27-murmel-pflanzen", [4,5,6,7,8,9,10], "Pflanzen und Winterreserven", "Während der aktiven Zeit fressen Murmeltiere vor allem Gräser und Kräuter. Die sommerliche Nahrungsaufnahme dient auch dem Aufbau der Fettreserven für den nächsten Winterschlaf.", ["oct27mMurmelBayern","oct27mMurmelPark","oct27mMurmelNuernberg"]),
    ],
    reproduction: [
      phase("oct27-murmel-paarung", [4,5], "Paarung nach dem Erwachen", "Die Paarung folgt auf das Ende des Winterschlafs. Ihr Zeitpunkt hängt deshalb mit dem örtlichen Frühjahrsbeginn zusammen; sie findet nicht mitten in der tiefsten winterlichen Schlafphase statt.", ["oct27mMurmelTirol","oct27mMurmelStiftung","oct27mMurmelBayern"]),
      phase("oct27-murmel-familie", [6,7,8,9,10,11,12,1,2,3], "Nachwuchs im Familienverband", "Die Jungen gehören zu einer Familiengruppe und können mehrere Jahre bei ihr bleiben. Eine Familie umfasst deshalb nicht nur Tiere desselben Jahrgangs.", ["oct27mMurmelPark","oct27mMurmelStiftung"]),
    ],
    behavior: [
      phase("oct27-murmel-schlaf", [11,12,1,2,3], "Echter Winterschlaf", "Die kalte Jahreszeit wird im Bau mit stark verminderten Körperfunktionen verbracht. Zeitweilige Aufwachphasen gehören dazu; Winterschlaf bedeutet keinen ununterbrochenen Dauerschlaf.", ["oct27mMurmelPark","oct27mMurmelBayern"]),
      phase("oct27-murmel-uebergang", [4,5,9,10], "Übergang am Bau", "Erwachen im Frühjahr und Rückzug im Herbst sind örtlich verschieden. Die Familie nutzt ihre Baue weiterhin als Schutz; ein Monatswechsel legt den Beginn oder das Ende des Winterschlafs nicht fest.", ["oct27mMurmelPark","oct27mMurmelBayern","oct27mMurmelNuernberg"]),
      phase("oct27-murmel-aktiv", [6,7,8], "Tagaktive Familien", "In der aktiven Jahreszeit sind Murmeltiere tagsüber unterwegs. Bei Gefahr warnen sie Artgenossen und verschwinden im Bau.", ["oct27mMurmelBayern","oct27mMurmelNuernberg"]),
    ],
    uncertainty: "Winterschlafdaten unterscheiden sich nach Standort und Quelle. Bayern nennt selbst verschiedene Endmonate; deshalb bleiben April/Mai und September/Oktober Übergangsfenster. Die Bänder zeigen keine feste Zahl von Schlafmonaten für jedes einzelne Tier.",
  }),
  profile("schneehase", "Alpenschneehase", {
    coat: [
      phase("oct27-schneehase-winter", [12,1,2], "Weißes Winterfell", "Im alpinen Winterkleid ist das Fell überwiegend weiß; die Ohrspitzen bleiben schwarz. Schnee und Monatsangabe allein sichern keine Artbestimmung.", ["oct27mSchneehasePark","oct27mSchneehaseSuedtirol","oct27mSchneehaseBayern"]),
      phase("oct27-schneehase-wechsel", [3,4,5,10,11], "Fleckige Übergänge", "Beim saisonalen Fellwechsel können weiße und graubraune Bereiche nebeneinander sichtbar sein. Der Wechsel zum Sommer- und Winterkleid verläuft schrittweise.", ["oct27mSchneehasePark","oct27mSchneehaseBayern"]),
      phase("oct27-schneehase-sommer", [6,7,8,9], "Graubraunes Sommerkleid", "Das Sommerfell ist überwiegend graubraun. Kurze Ohren und die gedrungenere Gestalt ergänzen den Vergleich mit dem Feldhasen; Farbe allein genügt nicht.", ["oct27mSchneehaseBayern","oct27mSchneehaseSuedtirol"]),
    ],
    crown: yearRound("oct27-schneehase-nahrung", "Pflanzliche Nahrung", "Gräser und Kräuter sowie Gehölzteile und Rinde gehören zur Nahrung. Es handelt sich um Pflanzenkost, nicht um die Mischkost eines Fuchses oder Marders.", ["oct27mSchneehaseTirol","oct27mSchneehaseSuedtirol"]),
    reproduction: [
      phase("oct27-schneehase-junge", [3,4,5,6,7,8], "Paarung und Jungenaufzucht", "Die Fortpflanzung liegt vor allem im Frühjahr und Sommer. Junge werden behaart und sehend geboren und einzeln abgelegt. Mehrere Würfe können sich über die Saison verteilen.", ["oct27mSchneehaseBayern","oct27mSchneehaseTirol","oct27mSchneehaseSuedtirol"]),
      phase("oct27-schneehase-jahreszyklus", [9,10,11,12,1,2], "Gebietsabhängige Zeitfenster", "Paarungsbeginn und letzte Jungenaufzucht unterscheiden sich nach Gebiet und Höhenlage. Der Kalender bildet diese Spannweite nur grob ab und belegt nicht, dass außerhalb des Hauptbands kein abhängiges Jungtier vorkommt.", ["oct27mSchneehaseBayern","oct27mSchneehaseTirol"]),
    ],
    behavior: yearRound("oct27-schneehase-ruhe", "Deckung statt Gemeinschaftsbau", "Die Tiere sind überwiegend dämmerungs- und nachtaktiv und ruhen in geschützten Mulden oder anderen Verstecken. Ihre Lebensweise ist nicht die einer Wildkaninchenkolonie.", ["oct27mSchneehaseBayern","oct27mSchneehaseSuedtirol"]),
    uncertainty: "Gemeint ist der Alpenschneehase. Die Quellen nennen unterschiedliche Fortpflanzungsfenster: Tirol Februar–Juni, Bayern März bis in den September. Die Fellwechselbänder orientieren sich an Bayerns März–Mai/Oktober–November und sind keine festen alpinen Stichtage.",
  }),
  profile("waschbaer", "Waschbär", {
    coat: yearRound("oct27-waschbaer-maske", "Maske und geringelter Schwanz", "Die dunkle Gesichtsmaske, das graue bis graubraune Fell und der hell-dunkel geringelte Schwanz sind typische Merkmale. Die Fellfärbung variiert.", ["oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
    crown: yearRound("oct27-waschbaer-nahrung", "Tastend nach Nahrung suchen", "Tierische und pflanzliche Nahrung gehören zum Spektrum: etwa Wirbellose, kleine Wirbeltiere, Früchte und Samen. Die empfindlichen Vorderpfoten helfen beim Untersuchen der Nahrung.", ["oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
    reproduction: [
      phase("oct27-waschbaer-ranz", [1,2,3], "Ranz und erste Frühjahrswürfe", "Die Hauptpaarungsphase liegt im Winter, häufig im Februar. Bayern nennt erste Geburten bereits ab Mitte März: Paarung und Wurfphase überlappen zwischen verschiedenen Tieren.", ["oct27mWaschbaerBayern","oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
      phase("oct27-waschbaer-wurf", [4,5], "Junge am geschützten Wurfplatz", "Typisch sind Frühjahrswürfe. Die Jungen bleiben zunächst im Versteck und werden von der Mutter versorgt. Spätere Würfe sind ebenfalls möglich.", ["oct27mWaschbaerBayern","oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
      phase("oct27-waschbaer-aufzucht", [6,7,8,9,10,11,12], "Familie und selbstständiger Nachwuchs", "Später begleiten Jungtiere die Mutter außerhalb des Wurfplatzes. Die Bindung und das Abwandern unterscheiden sich; der Kalender setzt keinen einheitlichen Abschluss der Aufzucht voraus.", ["oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
    ],
    behavior: [
      phase("oct27-waschbaer-winter", [12,1,2], "Kälte kann Aktivität verringern", "Bei winterlicher Kälte können Waschbären längere Ruhephasen einlegen und Fettreserven nutzen. Das ist kein echter Winterschlaf; eine mildere Phase kann Nahrungssuche ermöglichen.", ["oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
      phase("oct27-waschbaer-nacht", [3,4,5,6,7,8,9,10,11], "Dämmerungs- und nachtaktiv", "Tagsüber dienen geschützte Plätze, etwa Baumhöhlen oder Gebäudeverstecke, der Ruhe. Überwiegend in Dämmerung und Nacht gehen die Tiere auf Nahrungssuche.", ["oct27mWaschbaerDJV","oct27mWaschbaerBerlin"]),
    ],
    uncertainty: "Bayern nennt Geburten Mitte März–Mitte Mai, der DJV April/Mai und mögliche Spätwürfe. Die Bänder dürfen nicht als frühester oder letzter Wurftermin gelesen werden. Milde Winter und örtliche Nahrung ermöglichen winterliche Aktivität; Familienbindung endet nicht an einer festen Monatsgrenze.",
  }),
  profile("marderhund", "Marderhund", {
    coat: yearRound("oct27-marderhund-gestalt", "Langhaariger Hundeartiger", "Lange Grannenhaare, dichte Unterwolle und eine dunkle Gesichtszeichnung prägen das Aussehen. Körperfett und Winterfell können die Gestalt im Winter kompakter erscheinen lassen.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
    crown: yearRound("oct27-marderhund-nahrung", "Tierische und pflanzliche Kost", "Zum breiten Nahrungsspektrum zählen Kleintiere, Wirbellose, Aas und Pflanzenkost wie Früchte. Die Zusammensetzung hängt vom Lebensraum und jahreszeitlichen Angebot ab.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
    reproduction: [
      phase("oct27-marderhund-ranz", [1,2], "Winterliche Ranz", "Die Ranz beginnt je nach Quelle im späten Januar oder Februar und kann bis ins Frühjahr reichen. Nach der Paarung folgen ungefähr zwei Monate Trächtigkeit.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
      phase("oct27-marderhund-welpen", [3,4,5], "Paarung, Geburt und frühe Aufzucht", "Der DJV nennt Geburten Ende März/Anfang April; Bayerns spätere Paarungsangaben ergeben ein längeres Frühjahrsfenster. Blind geborene Welpen werden im Versteck von beiden Eltern versorgt.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
      phase("oct27-marderhund-aufzucht", [6,7,8], "Heranwachsende Welpen", "Die Jungen bleiben während der Aufzucht bei den Eltern. Beide beteiligen sich an der Versorgung; erst später folgt die Suche nach eigenen Gebieten.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
      phase("oct27-marderhund-abwandern", [9,10,11,12], "Herbstliche Abwanderung", "Die Jungen können im Herbst eigene Gebiete suchen. Die erwachsenen Partner können zusammenbleiben und auch gemeinsam einen Winterunterschlupf nutzen.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
    ],
    behavior: [
      phase("oct27-marderhund-winter", [11,12,1,2], "Winterruhe bei Kälte", "Strenge Winter können die Aktivität stark reduzieren. Eine Winterruhe kann an wärmeren Tagen unterbrochen werden; bei mildem Klima können Tiere auch im Winter aktiv bleiben.", ["oct27mMarderhundBayern","oct27mMarderhundNRW","oct27mMarderhundHaupt"]),
      phase("oct27-marderhund-aktiv", [3,4,5,6,7,8,9,10], "Heimliche Nahrungssuche", "Marderhunde suchen überwiegend in Dämmerung und Nacht nach Nahrung. Geschützte Verstecke und Baue dienen auch der Jungenaufzucht.", ["oct27mMarderhundBayern","oct27mMarderhundDJV"]),
    ],
    uncertainty: "Der DJV nennt eine frühere Ranz als das Wildtierportal Bayern. Deshalb zeigt das Modell ein breites Winter-/Frühjahrsband statt einen festen Wurftermin. Winterruhe ist witterungsabhängig; im Winter sichtbare Tiere widersprechen ihr nicht.",
  }),
  profile("steinmarder", "Steinmarder", {
    coat: yearRound("oct27-steinmarder-gestalt", "Heller Kehlfleck und helle Nase", "Das Fell ist graubraun; der meist weiße Kehlfleck kann gegabelt sein. Dazu kommt der helle bis fleischfarbene Nasenspiegel. Einzelne Merkmale allein ersetzen keinen sorgfältigen Artenvergleich.", ["oct27mSteinBayern","oct27mSteinDJV"]),
    crown: yearRound("oct27-steinmarder-nahrung", "Anpassungsfähiger Allesfresser", "Kleinsäuger, Vögel, Eier, Aas und Früchte gehören zum Nahrungsspektrum. Genutzt wird, was im jeweiligen Lebensraum erreichbar ist.", ["oct27mSteinBayern","oct27mSteinDJV"]),
    reproduction: [
      phase("oct27-steinmarder-junge", [3,4,5], "Frühjahrswurf und Aufzucht", "Junge werden typischerweise im März oder April geboren. Der Wurf folgt auf die Paarung des vorangegangenen Sommers.", ["oct27mSteinBayern","oct27mSteinDJV"]),
      phase("oct27-steinmarder-ranz", [6,7,8], "Sommerliche Ranz", "Die Paarung fällt in den Sommer. DJV und Bayern nennen etwas unterschiedliche Teilfenster; deshalb fasst das Monatsband Juni bis August zusammen.", ["oct27mSteinBayern","oct27mSteinDJV"]),
      phase("oct27-steinmarder-keimruhe", [9,10,11,12,1,2], "Verzögerte Entwicklung", "Zwischen Sommerpaarung und Frühjahrswurf liegt eine Keimruhe. Das ist eine Verzögerung der frühen Embryonalentwicklung, kein Schlafzustand des Muttertiers.", ["oct27mSteinBayern","oct27mSteinDJV"]),
    ],
    behavior: yearRound("oct27-steinmarder-quartier", "Einzelgänger mit Ruhequartieren", "Meist sind Steinmarder dämmerungs- und nachtaktiv. Tagsüber können Dachböden, Schuppen oder geschützte Haufen als Ruheplatz dienen; Mütter leben zeitweise mit ihren Jungen.", ["oct27mSteinBayern","oct27mSteinDJV"]),
    uncertainty: "Ranzfenster reichen je nach Fachquelle von Juni/Juli bis Juli/August. Kehlfleck und Quartierwahl variieren; ein Dachbodengeräusch allein beweist keinen Steinmarder. Die Kalenderbänder beschreiben den Fortpflanzungszyklus ohne feste individuelle Stichtage.",
  }),
  profile("baummarder", "Baummarder", {
    coat: yearRound("oct27-baummarder-gestalt", "Braunes Fell und dunkle Nase", "Kastanienbraunes Fell und ein dunkler Nasenspiegel helfen beim Vergleich mit dem Steinmarder. Mehrere erkennbare Merkmale sind aussagekräftiger als Farbe oder Standort allein.", ["oct27mBaumBayern","oct27mBaumDJV"]),
    crown: yearRound("oct27-baummarder-nahrung", "Kleintiere und Früchte", "Kleinsäuger, Vögel, Eier, Insekten und Früchte gehören zum Nahrungsspektrum. Auch der Baummarder ist ein Allesfresser; seine Nahrung ist nicht auf Eichhörnchen beschränkt.", ["oct27mBaumBayern","oct27mBaumDJV"]),
    reproduction: [
      phase("oct27-baummarder-junge", [3,4,5], "Frühjahrswurf und Aufzucht", "Nach der vorjährigen Sommerpaarung und verzögerter Entwicklung werden die Jungen im Frühjahr geboren. Die Mutter betreut sie; ein neuer Wurf ist nicht schon aus einer einzelnen Sichtung abzuleiten.", ["oct27mBaumBayern","oct27mBaumTirol","oct27mBaumDJV"]),
      phase("oct27-baummarder-ranz", [6,7,8], "Sommerliche Ranz", "Die Ranz liegt im Sommer. Die Quellen reichen vom späten Juni bis in den August; danach folgt zunächst die verzögerte Entwicklung.", ["oct27mBaumBayern","oct27mBaumDJV","oct27mBaumTirol"]),
      phase("oct27-baummarder-keimruhe", [9,10,11,12,1,2], "Keimruhe und weitere Entwicklung", "Die Keimruhe verlängert den Abstand zwischen Paarung und Geburt bis zum nächsten Frühjahr. Sie ist kein Winterschlaf der Fähe.", ["oct27mBaumBayern","oct27mBaumDJV","oct27mBaumTirol"]),
    ],
    behavior: yearRound("oct27-baummarder-wald", "Ruheplätze in Waldstrukturen", "Baummarder nutzen besonders Wälder und sind überwiegend nachtaktiv. Alte Bäume mit Höhlen und andere geschützte Plätze können als Unterschlupf dienen.", ["oct27mBaumBayern","oct27mBaumDJV"]),
    uncertainty: "Die Keimruhe ist von Winterruhe und Winterschlaf zu unterscheiden. Die Quellen variieren bei Teilzeiten der Fortpflanzung; genaue Entwicklungsdauern oder eine starre jährliche Wurffolge werden hier nicht abgeleitet. Waldnähe allein ist kein sicherer Artennachweis.",
  }),
];
