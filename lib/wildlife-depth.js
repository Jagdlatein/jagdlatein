// Eigene Vertiefungen, geprüft am 12.10.2026. Biologie ist keine Jagdfreigabe.
// Die vollständige Artenliste und die Länderregeln bleiben in dach-wildlife.js.
import { wildYearSources } from "./wild-year";
const bayern = (label, id) => ({ label: `Wildtierportal Bayern: ${label}`, url: `https://www.wildtierportal.bayern.de/wildtiere_bayern/${id}/index.php` });
const park = (label, slug) => ({ label: `Schweizerischer Nationalpark: ${label}`, url: `https://nationalpark.ch/flora-und-fauna/${slug}/` });
const profile = (seasonalLife, fieldSigns, comparisons, observation, q, answer, explain, sources, courseIds = []) => ({
  reviewedOn: "2026-10-12", seasonalLife, fieldSigns, comparisons, observation,
  learningQuestions: [{ q, answer, explain }], sources, courseIds,
});
const alpine = "wissen-vertiefung-wild-alpine-winterstrategien";
const deer = "wissen-vertiefung-wild-hirsche-vergleichen";
const boar = "wissen-vertiefung-wild-schwarzwild-fortpflanzung";
const predators = "wissen-vertiefung-wild-kleine-beutegreifer";
const birds = "wissen-vertiefung-wild-huehner-nachwuchs";
const water = "wissen-vertiefung-wild-wasservoegel-jahreslauf";

export const wildlifeDepthBySlug = {
  gamswild: profile(
    ["Die Novemberbrunft liegt vor der winterlichen Nahrungsknappheit; Kitze kommen im späten Frühjahr beziehungsweise Frühsommer zur Welt.", "Auch Wintereinstände können hoch liegen: Windgefegte Grate und freigescharrte Stellen ermöglichen Zugang zu Pflanzen."],
    ["Krucken wachsen lebenslang. Beide Geschlechter tragen sie; eine dunkle Hornsilhouette allein bestimmt das Geschlecht nicht.", "Harter Schalenrand und weicherer Sohlenbereich unterstützen den Halt auf Fels. Schnee verändert dennoch das sichtbare Trittsiegel."],
    ["Gämsen nutzen Bergwald, Krummholz und offene Gebirgsflächen; Steinwild ist stärker an offene Felsräume gebunden.", "Die deutlich gehakte Spitze der Gamskrucke unterscheidet sich von den langen, bogenförmigen Bockhörnern des Steinwilds."],
    ["Notiere Höhenlage, Schneebedeckung, Äsungs- und Ruhephasen zusammen; Höhe allein erklärt die Nutzung nicht.", "Unterbrich eine Annäherung, sobald Tiere sichern oder ausweichen. Ein besseres Hornfoto rechtfertigt keine zusätzliche Flucht."],
    "Müssen Gämsen im Winter immer ins Tal ziehen?", "Nein. Auch hoch gelegene, zugängliche Nahrungsstellen können genutzt werden.", "Schneelage, Nahrung und Rückzugsmöglichkeiten sind aussagekräftiger als eine feste Höhenregel.",
    [park("Gämse", "gaemse"), bayern("Gamswild", "085402"), { label: "Nationalpark und SCNAT: Fokus Gämse", url: "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Gaemse.pdf" }], [alpine]),
  steinwild: profile(
    ["Bock- und Geißengruppen leben außerhalb der Brunft überwiegend getrennt. Die Brunft liegt später als bei der Gämse, vor allem im Dezember.", "Im Sommer und Winter werden unterschiedliche Einstände genutzt. Besonders Böcke können zwischen ihnen größere Strecken zurücklegen."],
    ["Schmuckknoten an der Hornvorderseite und Jahresringe sind unterschiedliche Strukturen; nicht jeden Wulst als Lebensjahr zählen.", "Steingeißen tragen kleinere Hörner. Der Größenunterschied macht Geschlechtsmerkmale bei erwachsenen Tieren deutlicher als bei jungen."],
    ["Anders als ein Hirschgeweih bleiben die Hörner erhalten. Das Horn wächst über einem knöchernen Zapfen.", "Gams und Steinbock sind beide Hornträger, unterscheiden sich aber in Hornform, Körperbau und Raumnutzung."],
    ["Erfasse beim Hornvergleich Seitenansicht und erkennbare Ringabschnitte. Verdeckt oder unscharf bleibt eine Altersangabe offen.", "Nähe oder ruhiges Verhalten ist keine Einladung zum Anfassen; genügend Raum für ungestörte Bewegungen lassen."],
    "Ist jeder Schmuckknoten am Steinbockhorn ein Jahresring?", "Nein; Schmuckknoten liegen an der Vorderkante, Jahresringe entstehen durch Wachstumspausen.", "Eine Altersbeurteilung verlangt die passende Hornstruktur und ausreichende Sicht.",
    [park("Steinbock", "steinbock"), bayern("Steinwild", "143521"), { label: "Nationalpark und SCNAT: Fokus Steinbock", url: "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Steinbock.pdf" }], [alpine]),
  rotwild: profile(
    ["Die Herbstbrunft verändert Gruppierung und Verhalten. Hirsch- und Kahlwildrudel sind außerhalb dieser Phase häufig getrennt.", "In der untersuchten Nationalparkregion wechseln viele Tiere zwischen Sommer- und Wintergebieten. Das ist ein regionaler Befund, keine Pflichtwanderung jedes Hirsches."],
    ["Röhren gehört zur Brunftkommunikation; ein Ruf liefert keine vollständige Alters- oder Bestandsangabe.", "Verbiss und Rindenschälung sind unterschiedliche Nutzungszeichen. Eine betroffene Pflanze allein verrät noch keine Tierzahl."],
    ["Rotwild ist ein ausdauernder Läufer; Rehwilds Körperbau erleichtert dagegen kurze Fluchtwege in dichte Deckung.", "Ein verzweigtes Geweih unterscheidet sich von der typischen Schaufel erwachsener Damhirsche; weibliche Tiere benötigen andere Merkmale."],
    ["Vergleiche Hirsch- und Kahlwildbeobachtungen getrennt und notiere Jahreszeit und Landschaftsausschnitt.", "Eine Ansammlung an einer Äsungsfläche kann räumliche Konzentration zeigen; verallgemeinere sie nicht auf das gesamte Gebirge."],
    "Beweist ein großes Brunftrudel einen ganzjährigen örtlichen Bestand gleicher Größe?", "Nein; saisonale Gruppierung und Wanderungen verändern die örtliche Anwesenheit.", "Ein Termin beschreibt die sichtbaren Tiere am Beobachtungsort.",
    [bayern("Rotwild", "087879"), { label: "Nationalpark: Höhenverbreitung besenderter Hirsche", url: "https://nationalpark.ch/forschung/hoehenverbreitung-der-hirsche-im-jahresverlauf/" }], [deer]),
  rehwild: profile(
    ["Sommerliche Paarung und Geburt im folgenden Frühjahr sind durch Keimruhe voneinander getrennt.", "Winterliche Sprünge und sommerliche Territorialität der Böcke erklären unterschiedliche Gruppenbilder."],
    ["Fegespuren entstehen beim Bearbeiten von Gehölzen mit dem Gehörn; sie unterscheiden sich von abgefressenen Trieben.", "Schrecken ist ein bellender Laut, den beide Geschlechter äußern können. Der Ruf identifiziert keinen Bock."],
    ["Rehe wählen vor allem geeignete Kräuter, Knospen und junge Triebe; grüne Fläche allein beschreibt das Äsungsangebot schlecht.", "Ein Reh ist kein junges Rotwild: Körperproportionen und Artmerkmale zählen, nicht nur geringe Größe."],
    ["Bei kurzer Sichtung erst Körperform und Spiegel dokumentieren; Gehörnstärke nicht als genaue Altersuhr verwenden.", "Ein abgelegtes Kitz aus Distanz beobachten; eine unsichtbare Mutter ist kein Nachweis für Verwaisung."],
    "Ist ein bellender Rehlaut ein sicherer Hinweis auf ein männliches Tier?", "Nein, Bock und weibliches Reh können schrecken.", "Laut, Situation und sichtbare Körpermerkmale gemeinsam beurteilen.",
    [bayern("Rehwild", "084667"), { label: "Deutscher Jagdverband: Reh", url: "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/reh-capreolus-capreolus" }], [deer]),
  damwild: profile(
    ["Die Brunft liegt vor allem im Oktober und November; Kälber werden meist um Mai und Juni gesetzt.", "Das Geweih wird im Frühjahr abgeworfen und bis zum Spätsommer neu aufgebaut."],
    ["Fellfarben reichen von sehr hell bis dunkel. Flecken im Sommerfell erlauben keine verlässliche Altersbestimmung.", "Schaufelbildung ist ein wichtiges Merkmal erwachsener Hirsche; junge Hirsche müssen sie noch nicht zeigen."],
    ["Weiße Sommerflecken kommen auch beim Sikawild vor; deshalb Spiegel, Wedel und Körperform zusätzlich vergleichen.", "Damwild nutzt gern lichte Wälder und Offenland und lebt häufig in Rudeln; Rehwild zeigt ein anderes saisonales Sozialbild."],
    ["Erstelle getrennte Notizen zu Geweihform und Deckenfarbe. Ein Merkmal darf das andere nicht ersetzen.", "Unterscheide frei lebende Tiere und Gehegehaltung; ein Foto hinter einem Zaun belegt kein örtliches Wildvorkommen."],
    "Zeigen weiße Fellflecken sicher einen jungen Damhirsch?", "Nein; die Flecken sind kein verlässliches Altersmerkmal.", "Sommerkleid, Farbvariante und weitere Körpermerkmale einbeziehen.", [bayern("Damwild", "083840")], [deer]),
  sikawild: profile(
    ["Sommerfell kann Fleckenreihen zeigen; im dunkleren Winterfell sind diese häufig wenig sichtbar.", "Mehr Störung kann Aktivitäten in die Nacht verschieben; eine Tagsichtung ist dennoch biologisch plausibel."],
    ["Ein auffälliger heller, häufig dunkel eingefasster Spiegel und der Wedel ergänzen die Fellzeichnung.", "Hohe Rufe gehören zum vielfältigen Lautrepertoire; Rufhöhe allein beweist kein Geschlecht."],
    ["Sikawild und Damwild können beide gefleckt wirken. Beim Vergleich nicht ausschließlich die Sommerdecke verwenden.", "Sikawild lebt oft in kleineren Verbänden als Rotwild; ein einzelner älterer Hirsch ist kein ungewöhnlicher Befund."],
    ["Vermerke Fellzustand und Datum, damit Sommer- und Winteraufnahmen nicht wie verschiedene Arten wirken.", "Dichtes Unterholz kann die Sicht begrenzen; fehlende Beobachtungen sind kein Beweis für Abwesenheit."],
    "Schließt eine ungefleckte dunkle Winterdecke Sikawild aus?", "Nein; die Flecken können im Winter kaum sichtbar sein.", "Spiegel, Wedel, Gestalt und Jahreszeit ergänzen die Bestimmung.", [bayern("Sikawild", "118649")], [deer]),
  muffelwild: profile(
    ["Widder und weibliche Tiere mit Lämmern bilden oft getrennte Gruppen.", "Muffelwildvorkommen Mitteleuropas gehen auf Einbürgerungen zurück; der Lebensraum unterscheidet sich von trockenen, steinigen Herkunftsräumen."],
    ["Ältere Widder tragen eingerollte Hörner und häufig eine helle Schabracke an den Flanken.", "Weibliche Tiere können kleine Hörner tragen oder hornlos sein. Hornlosigkeit allein unterscheidet sie nicht von anderen Schafen."],
    ["Muffelwild gehört zu den Hornträgern, nicht zu den geweiherneuernden Hirschen.", "Bockhornform beim Steinwild und Schneckenhornform beim Muffelwidder dürfen nicht gleichgesetzt werden."],
    ["Beschreibe Boden, Beweglichkeit und tatsächlich sichtbare Klauen; eine sichtbare Veränderung ist keine Ferndiagnose.", "Gruppenaufnahmen aus Distanz helfen beim Vergleich von Widdern, Schafen und Lämmern ohne Nachstellen."],
    "Wirft ein Muffelwidder seine Hörner jedes Frühjahr ab?", "Nein; die Hörner bleiben erhalten.", "Horn und Geweih sind verschiedene Kopfschmucktypen.", [bayern("Muffelwild", "096779")]),
  schwarzwild: profile(
    ["Geburten sind nicht auf einen einzigen Monat begrenzt. Die durchschnittliche Tragzeit beträgt ungefähr 115 Tage.", "Getreide, Waldfrüchte und andere Ressourcen verändern das Nahrungsangebot im Jahreslauf; Körperentwicklung beeinflusst die Fortpflanzung."],
    ["Wühlstellen zeigen Nahrungssuche, aber weder sicher die Rottenzahl noch die genaue gefressene Nahrung.", "Gestreifte Frischlinge sind ein Hinweis auf Nachwuchs; das Fehlen sichtbarer Streifen schließt abhängige Jungtiere nicht aus."],
    ["Schwarzwild ist ein Allesfresser, kein Wiederkäuer wie Reh, Rothirsch oder Gämse.", "Eine Rotte enthält oft Bachen und Jungtiere. Ein einzeln auftretendes Tier ist deshalb nicht automatisch ein Keiler."],
    ["Notiere Größenklassen, begleitende Tiere und Beobachtungsdauer; aus einem abgeschnittenen Kamerabild keine vollständige Familienstruktur ableiten.", "Frischkessel und dichte Rückzugsbereiche nicht aufsuchen. Beobachtung von vorhandenen Wegen wahrt den Abstand."],
    "Sind Frischlinge nur im Frühjahr zu erwarten?", "Nein; Fortpflanzung kann grundsätzlich zu verschiedenen Jahreszeiten stattfinden.", "Typische Schwerpunktzeiten sind keine Garantie für einen jungtierfreien Zeitraum.", [bayern("Schwarzwild", "084682"), { label: "Vetmeduni: Wildschweinforschung 2021", url: "https://www.vetmeduni.ac.at/fiwi-forschungsinstitut-fuer-wildtierkunde-und-oekologie/publikationen/fiwi-news-archiv/2021" }], [boar]),
  fuchs: profile(
    ["Ranz im Winter und Welpenaufzucht im Frühjahr verändern die Bedeutung des Baus.", "Füchse nutzen tierische und pflanzliche Nahrung; das Angebot reicht von Kleinsäugern bis Früchten und zugänglichen Abfällen."],
    ["Eine Laufspur kann geradlinig sein, doch ein einzelner hundeartiger Abdruck unterscheidet nicht sicher Fuchs und Hund.", "Auch ein vom Fuchs genutzter Bau kann ursprünglich von einem Dachs angelegt worden sein."],
    ["Der Fuchs gehört zu den Hundeartigen; der Dachs zu den Marderartigen, obwohl beide Baue nutzen können.", "Ein einzeln Nahrung suchender Fuchs bedeutet nicht, dass keinerlei soziale Bindungen bestehen."],
    ["Notiere wiederholte Nutzung und Umgebung statt ein beliebiges Erdloch sofort zum besetzten Fuchsbau zu erklären.", "Nahrungsreste und Abfälle sichern; weder locken noch füttern, um eine Beobachtung zu erzwingen."],
    "Beweist ein Erdbau eindeutig den Fuchs als Erbauer und aktuellen Bewohner?", "Nein; Baue können übernommen oder von mehreren Arten genutzt werden.", "Erbauer, frühere Nutzung und jetzige Nutzung sind getrennte Fragen.", [bayern("Fuchs", "085227")], [predators]),
  dachs: profile(
    ["Dachse halten Winterruhe und können sie für Aktivität unterbrechen; dies ist kein durchgehender Winterschlaf.", "Keimruhe trennt Paarung und spätere Embryonalentwicklung; Jungdachse werden im Frühjahr geboren."],
    ["Ein Bau kann mehrere Zugänge und Nebenbaue besitzen; ihre Zahl entspricht nicht der Anzahl der Dachse.", "Die kräftigen Vorderpfoten sind fürs Graben geeignet; bei Spuren die Folge und den Boden mitbeschreiben."],
    ["Dachs und Murmeltier nutzen unterirdische Baue, überwintern physiologisch aber verschieden.", "Als Allesfresser nimmt der Dachs auch Regenwürmer, Früchte und andere saisonale Ressourcen auf."],
    ["Beobachte weit genug vom Bau entfernt und blockiere keine Zugänge.", "Ein leerer Zugang bei einer kurzen Tageskontrolle sagt wenig über einen überwiegend heimlichen Bewohner aus."],
    "Sind zehn sichtbare Baueingänge gleich zehn Dachse?", "Nein; eine Bauanlage kann von wenigen Tieren mit mehreren Zugängen genutzt werden.", "Die Bauarchitektur ist keine direkte Bestandszählung.", [bayern("Dachs", "101575")], [predators]),
  steinmarder: profile(
    ["Sommerliche Ranz und Keimruhe führen zur Geburt der Jungen im folgenden Frühjahr.", "Tagsüber werden geschützte Ruheplätze genutzt; Nahrungssuche liegt oft in Dämmerung und Nacht."],
    ["Ein meist weißer, oft gegabelter Kehlfleck kann bis zu den Vorderläufen reichen.", "Schuppen, Dachböden und Reisighaufen sind mögliche Verstecke; Geräusche allein erlauben keine sichere Artansprache."],
    ["Baummarder haben typischerweise einen gelblichen Kehlfleck und dunklere Nase; mehrere Merkmale zusammen prüfen.", "Siedlungsnähe passt zum Steinmarder, ersetzt aber keine Bestimmung."],
    ["Bei Kameraaufnahmen Kehlfleck und Kopf erfassen; Schwarzweiß-Nachtbilder geben die Kehlfarbe nicht zuverlässig wieder.", "Ein vermeintlicher Dachbodenbewohner darf zur Bestimmung nicht eingesperrt oder aus dem Versteck getrieben werden."],
    "Reicht eine nachts helle Kehle im Infrarotbild zur sicheren Steinmarderbestimmung?", "Nein; Farbmerkmale können im Infrarotbild anders erscheinen.", "Form des Flecks, Kopfmerkmale und bessere Aufnahmen ergänzen die Beobachtung.", [bayern("Steinmarder", "100869")], [predators]),
  baummarder: profile(
    ["Ranz im Sommer und verzögerte Entwicklung verschieben die Geburt in das kommende Frühjahr.", "Ruhestätten können hoch in Bäumen liegen, etwa in Höhlen oder vorhandenen Nestern."],
    ["Der meist gelbliche Kehlfleck, die dunkle Nase und größere Ohren ergänzen sich als Bestimmungsmerkmale.", "Behaarte Pfoten können den Abdruck verwaschen erscheinen lassen; auch Schneequalität verändert Spuren."],
    ["Baummarder nutzen besonders strukturreiche Wälder, Steinmarder häufiger menschliche Siedlungsstrukturen.", "Ein Waldstandort beweist keinen Baummarder; auch Steinmarder können außerhalb von Siedlungen auftreten."],
    ["Baumhöhlen und Nester aus Distanz belassen; ihre Funktion nicht durch Öffnen überprüfen.", "Beschreibe eine unscharfe Spur als Marderhinweis, wenn eindeutige Merkmale fehlen."],
    "Ist ein verwischtes Trittsiegel ein allein ausreichender Baummardernachweis?", "Nein; auch der Untergrund kann Abdrücke verwischen.", "Spurfolge und weitere Befunde sind nötig.", [bayern("Baummarder", "100914")], [predators]),
  hermelin: profile(
    ["Das Winterkleid kann weiß werden; die Schwanzspitze bleibt schwarz.", "Keimruhe verschiebt nach sommerlicher Paarung die eigentliche Entwicklung der Jungen bis ins folgende Frühjahr."],
    ["Die schwarze Schwanzspitze ist ein wichtiger Vergleichspunkt zum Mauswiesel.", "Kleinsäuger bilden einen wesentlichen Teil der Nahrung; ein kurzes Auftauchen am Mäusegang passt zur Nahrungssuche."],
    ["Mauswiesel haben einen kürzeren Schwanz ohne die schwarze Endquaste des Hermelins.", "Körpergröße allein ist unsicher, weil Geschlecht, Perspektive und fehlender Maßstab die Einschätzung verändern."],
    ["Versuche in einer vorhandenen Aufnahme den gesamten Schwanz zu erkennen, bevor du die Art benennst.", "Stein- und Holzhaufen nicht auseinandernehmen, um das Tier erneut zu sehen."],
    "Welches sichtbare Merkmal hilft besonders beim Vergleich mit dem Mauswiesel?", "Die schwarze Schwanzspitze des Hermelins.", "Kopf, Gestalt und vollständiger Schwanz ergänzen die Größenbeurteilung.", [bayern("Hermelin", "101466")], [predators]),
  mauswiesel: profile(
    ["Gutes Nahrungsangebot kann mehrere Würfe ermöglichen. Die Entwicklung folgt nicht dem Keimruhemodell des Hermelins.", "Mauswiesel bleiben auch im Winter aktiv und können unter der Schneedecke jagen."],
    ["Der schlanke Körper ermöglicht es, Beute in Kleinnagergänge zu verfolgen.", "Dichte Vegetation, Spalten und vorhandene Gänge dienen als Deckung und Bewegungswege."],
    ["Der kurze Schwanz trägt keine schwarze Endquaste wie beim Hermelin.", "Ein sehr kleines Raubtier ist dennoch kein Jungtier eines Steinmarders; Körperproportionen prüfen."],
    ["Mehrere kurze Beobachtungen an einer Struktur gemeinsam dokumentieren, ohne sie zu öffnen.", "Bei fehlender Schwanzsicht die Zuordnung offen lassen statt nur nach vermeintlicher Größe entscheiden."],
    "Hält das Mauswiesel im Winter Winterschlaf?", "Nein; es bleibt aktiv und sucht auch unter Schnee nach Beute.", "Ein überdeckter Lebensraum bedeutet keine dauernde Inaktivität.", [bayern("Mauswiesel", "101647")], [predators]),
  wildkatze: profile(
    ["Die Hauptpaarungszeit liegt im Spätwinter; geschützte Wurfplätze werden für die Jungenaufzucht benötigt.", "Kleinsäugerreiche Waldränder und Lichtungen dienen der Jagd, dichte Vegetation und Höhlen der Ruhe."],
    ["Ein buschiger, stumpf wirkender Schwanz und Fellzeichnung liefern Hinweise, keine allein sichere Abgrenzung zur Hauskatze.", "Ein Katzenabdruck ohne Krallen unterscheidet Wild- und Hauskatze nicht zuverlässig."],
    ["Getigerte Hauskatzen können sehr ähnlich aussehen; fachliche Nachweise verlangen mehrere Befundarten.", "Wildkatzen nutzen vernetzte Waldstrukturen; eine Waldsichtung einer Hauskatze ist trotzdem möglich."],
    ["Foto, Ort und Datum an geeignete Fachstellen geben, ohne einen sicheren Nachweis vorzutäuschen.", "Holzstapel und Höhlen können Wurfplätze sein; nicht zur Kontrolle öffnen."],
    "Macht ein Waldstandort eine getigerte Katze zur Wildkatze?", "Nein; auch Hauskatzen können dort auftreten.", "Ähnlichkeit und Lebensraum ersetzen keinen fachlich abgesicherten Nachweis.", [{ label: "Bundesamt für Naturschutz: Wildkatze", url: "https://www.bfn.de/artenportraits/felis-silvestris" }, bayern("Wildkatze – Vergleichsmerkmale", "102627")]),
  luchs: profile(
    ["Während der Ranz im Frühjahr können Luchse häufiger auch tagsüber aktiv sein; überwiegende Nachtaktivität schließt Tagsichtungen nicht aus.", "Die Jungen werden meist im späten Mai oder Juni geboren und über Monate von der Mutter geführt; Mutter mit Jungen ist eine Ausnahme zur einzelgängerischen Lebensweise."],
    ["Runde Trittsiegel mit asymmetrischen Zehenballen und meist fehlenden Krallenabdrücken sind typische Hinweise.", "In steilem Gelände oder besonderem Schnee können Krallen dennoch abzeichnen."],
    ["Hundespuren können ohne deutliche Krallenabdrücke ähnlich wirken; die ganze Spur betrachten.", "Ein großer Katzenabdruck ist ein Verdachtsbefund, keine automatische Bestätigung des Luchses."],
    ["Maßstab neben die Spur legen, nicht hinein; Übersicht und mehrere aufeinanderfolgende Abdrücke dokumentieren.", "Spurverläufe nicht zum Verfolgen des Tieres nutzen. Vorhandene Bilder fachlich prüfen lassen."],
    "Schließen sichtbare feine Krallen im Schnee einen Luchs sicher aus?", "Nein; unter bestimmten Bedingungen können sie abzeichnen.", "Die Regel meist ohne Krallen ist kein ausnahmsloses Ausschlussmerkmal.", [{ label: "KORA: Luchsnachweise im Feld", url: "https://www.kora.ch/de/arten/luchs/nachweise-im-feld" }, { label: "KORA: Luchs – Jahreslauf und Familien", url: "https://www.kora.ch/de/arten/luchs/portrait" }]),
  feldhase: profile(
    ["Ernte und Vegetationswechsel verändern Nahrung und Deckung; Aktionsräume können sich daraufhin vergrößern.", "Die Jungen werden behaart und mit offenen Augen oberirdisch geboren; die Sasse ist kein unterirdischer Gemeinschaftsbau."],
    ["Eine flache Sasse dient als Ruheplatz. Ohne Beobachtung kann eine kleine Bodenmulde mehrere Ursachen haben.", "Lange Ohren und kräftige Hinterläufe ergänzen den Vergleich zum kleineren Wildkaninchen."],
    ["Feldhase und Kaninchen unterscheiden sich in Fortpflanzungsstrategie und Baugebrauch, nicht nur in der Größe.", "Der Schneehase besitzt relativ kürzere Ohren und im alpinen Winter ein weißes Fell."],
    ["Beim Landschaftsvergleich stehen nach der Ernte verbleibende Säume und Deckung im Mittelpunkt.", "Ein allein liegender Junghase ist nicht allein deshalb verlassen; Abstand halten."],
    "Ist die Sasse eines Feldhasen ein Kaninchenbau?", "Nein; sie ist ein oberirdischer Ruheplatz in einer Mulde.", "Ähnliche Artengruppe bedeutet nicht dieselbe Wohn- und Jungenaufzuchtstrategie.", [bayern("Feldhase", "102456"), { label: "Deutscher Jagdverband: Feldhase", url: "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/feldhase-lepus-europaeus" }]),
  wildkaninchen: profile(
    ["Gemeinschaftsbaue und Kolonien prägen die Lebensweise; lockerer Boden erleichtert das Graben.", "Junge Kaninchen sind zunächst hilflose Nesthocker im geschützten Wurfnest."],
    ["Mehrere Eingänge können zu derselben Bauanlage gehören; Eingänge nicht als Tierzählung verwenden.", "Klopfen mit den Hinterläufen kann als Warnsignal dienen."],
    ["Feldhasenjunge sind bereits behaart und sehen; Kaninchenjunge beginnen ihr Leben geschützt im Nest.", "Kürzere Ohren und kompaktere Gestalt helfen beim Vergleich, wenn ein Größenmaßstab vorhanden ist."],
    ["Kolonien aus Distanz vergleichen und Zugänge frei halten; keine Gegenstände in Röhren einführen.", "Schwere nasse Böden unterscheiden sich als Baugrund von trockenen lockeren Erdwällen."],
    "Warum ist die Jungenstrategie nicht einfach die des Feldhasen?", "Kaninchenjunge sind zunächst Nesthocker, Hasenjunge weit entwickelter.", "Wurfplatz und Entwicklungsstand erklären unterschiedliche Schutzbedürfnisse.", [bayern("Wildkaninchen", "140874"), { label: "Deutscher Jagdverband: Wildkaninchen", url: "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildkaninchen-oryctolagus-cuniculus" }]),
  schneehase: profile(
    ["Weißes Winterfell, graubraunes Sommerkleid und fleckige Übergänge gehören zum selben Tier.", "Schneehasen bleiben im Winter aktiv; der Fellwechsel ist kein Winterschlafmechanismus."],
    ["Stark behaarte, breite Hinterfüße erleichtern das Laufen auf Schnee.", "Im Winterfell bleiben die Ohrspitzen dunkel; im Übergang kann die Gesamtfarbe uneinheitlich sein."],
    ["Gedrungenere Form und relativ kurze Ohren unterscheiden sich vom Feldhasen; Farbe allein reicht im Sommer nicht.", "Schneehase und Alpenschneehuhn wechseln beide ihre Tarnfarbe, gehören jedoch zu ganz verschiedenen Tiergruppen."],
    ["Bei Spuren Untergrund und Abdrücke mehrerer Sprünge dokumentieren; Wind oder Tauwetter verändern Größe und Form.", "Keinen Hasen für eine vollständigere Aufnahme aus Deckung scheuchen."],
    "Ist ein weiß-braun gefleckter Schneehase automatisch krank?", "Nein; dieses Bild kann während des saisonalen Fellwechsels entstehen.", "Datum, Verteilung der Färbung und weitere Merkmale berücksichtigen.", [park("Alpenschneehase", "schneehase")], [alpine]),
  murmeltier: profile(
    ["Fettreserven tragen den echten Winterschlaf; währenddessen werden keine Nahrungsvorräte aufgefressen.", "Familienverbände nutzen Bauten; Sommer- und Winterbau können verschieden sein."],
    ["Bauöffnungen und kurze Fluchtröhren haben unterschiedliche Funktionen; ein Loch allein zeigt keinen Winterbau.", "Der als Pfiff bezeichnete Warnlaut warnt Artgenossen vor Gefahr."],
    ["Der Dachs hält Winterruhe, das Murmeltier echten Winterschlaf mit stark verminderten Körperfunktionen.", "Tiere derselben Familie gehören nicht zwingend alle zum selben Geburtsjahrgang."],
    ["Von einem festen Weg aus Äsung, Sicherungsverhalten und Rückkehr in den Bau vergleichen.", "Baue nicht betreten oder verschließen; Hunde auf Abstand halten."],
    "Warum muss das Murmeltier vor dem Winter Reserven aufbauen?", "Es lebt während des Winterschlafs von gespeicherter Energie.", "Die winterliche Pause ist kein tägliches Ausruhen zwischen Fressgängen.", [park("Murmeltier", "murmeltier")], [alpine]),
  biber: profile(
    ["Biber halten keinen Winterschlaf. Im Herbst können Zweige als erreichbare Wintervorräte unter Wasser abgelegt werden.", "Im Winter gewinnen Rinde und Gehölznahrung gegenüber dem sommerlichen Pflanzenangebot an Bedeutung."],
    ["Nagespuren und gefällte Gehölze zeigen Aktivität; ihr Alter ist von frischen Spänen und Verwitterung getrennt zu beschreiben.", "Die breite, flache Kelle unterscheidet sich von den schmalen Schwänzen von Nutria und Bisam."],
    ["Nutrias besitzen einen runden Schwanz, Bisame einen seitlich abgeflachten; Körpergröße allein bleibt unsicher.", "Nicht jeder Biberlebensraum benötigt einen auffälligen Damm; dessen Fehlen schließt einen Biber nicht aus."],
    ["Am Gewässerweg bleiben und Baueingänge beziehungsweise Dämme nicht verändern.", "Frische und alte Spuren getrennt kartieren; viele alte Stümpfe belegen keine große gegenwärtige Familie."],
    "Beweist das Fehlen eines Damms, dass kein Biber vorkommt?", "Nein; Dämme sind kein zwingendes Merkmal jedes genutzten Gewässers.", "Weitere Aktivitätszeichen und Gewässerbedingungen vergleichen.", [{ label: "LfU Bayern: Europäischer Biber", url: "https://www.lfu.bayern.de/natur/sap/arteninformationen/steckbrief/zeige?stbname=Castor+fiber" }, { label: "LfU Bayern: Biber im Winter", url: "https://www.lfu.bayern.de/natur/bayaz/artdesmonats/adventskalender_2023/index.htm" }]),
  nutria: profile(
    ["Ganzjährige Fortpflanzung ist möglich; strenge Winter können die Art stark belasten.", "Nutrias sind an Gewässer gebunden und nutzen pflanzliche Ressourcen im und am Wasser."],
    ["Der lange Schwanz ist rund im Querschnitt, kaum behaart und beschuppt.", "Helle Tasthaare und auffällige Schneidezähne ergänzen den Schwanzvergleich, wenn sie sichtbar sind."],
    ["Biber haben eine breite Kelle; Bisame sind meist kleiner und haben seitlich abgeflachte Schwänze.", "Ein schwimmender brauner Kopf ohne weitere Merkmale erlaubt oft keine sichere Zuordnung dieser drei Arten."],
    ["Vorhandene Bilder seitlich und frontal vergleichen; für den Schwanzblick kein Tier ans Ufer treiben.", "Eine Artbestimmung ist getrennt von einer behördlich zulässigen Maßnahme zu beurteilen."],
    "Welche Schwanzform passt zur Nutria?", "Ein langer, drehrunder Schwanz.", "Die Biberkelle ist breit flach, der Bisamschwanz seitlich abgeplattet.", [bayern("Nutria", "218365")]),
  bisam: profile(
    ["Die Nahrung umfasst Wasser- und Uferpflanzen; zeitweise werden auch tierische Bestandteile genutzt.", "Wasserstand und Vegetationszustand verändern, welche Nutzungszeichen sichtbar werden."],
    ["Der nackte Schwanz ist seitlich abgeflacht; der Körper wirkt gedrungen und der Hals kurz.", "Schwimmborsten an den Zehen unterstützen die Fortbewegung im Wasser."],
    ["Nutria und Biber sind gewöhnlich größer, doch Distanz und fehlender Maßstab verzerren den Eindruck.", "Der seitlich flache Bisamschwanz unterscheidet sich vom runden Nutriaschwanz und der breiten Biberkelle."],
    ["Schwimmende Tiere nur dann bestimmen, wenn ausreichend Merkmale erkennbar sind.", "Ein Uferloch kann mehrere Ursachen haben; bei Infrastrukturfragen Fachstellen einschalten statt selbst graben."],
    "Ist der Schwanz wie eine breite Biberkelle geformt?", "Nein; er ist schmal und seitlich abgeflacht.", "Die räumliche Form ist aussagekräftiger als die bloße Aussage flacher Schwanz.", [{ label: "LfU Brandenburg: Bisam", url: "https://lfu.brandenburg.de/lfu/de/aufgaben/natur/artenschutz/invasive-arten/steckbriefe/bisam/" }]),
  rebhuhn: profile(
    ["Paare im Frühjahr und Familien beziehungsweise Ketten im Herbst und Winter zeigen saisonal unterschiedliches Sozialverhalten.", "Die Küken verlassen das Nest früh, benötigen aber weiterhin Begleitung, Deckung und geeignete Nahrung."],
    ["Kurzschwänzige Gestalt und rostfarbene Kopfpartien ergänzen das tarnende Gefieder.", "Staubbadestellen gehören zur Gefiederpflege; eine Bodenmulde allein bestimmt die Art nicht."],
    ["Rebhühner leben stark bodenbezogen; Fasane nutzen auch erhöhte Ruheplätze.", "Für Küken ist Insektennahrung viel wichtiger als der überwiegend pflanzliche Speiseplan erwachsener Rebhühner."],
    ["Durchgängige Deckung und bewegliche, nicht völlig dichte Vegetation gemeinsam betrachten.", "Eine Kette nicht zum Auffliegen bringen, um die Tiere leichter zu zählen."],
    "Bedeutet Nestflüchter, dass die Küken keine elterliche Hilfe brauchen?", "Nein; Nestverlassen und Selbstständigkeit sind verschiedene Entwicklungsstufen.", "Deckung, Wärme und altersgerechte Nahrung bleiben entscheidend.", [bayern("Rebhuhn", "102425")], [birds]),
  fasan: profile(
    ["Bei Brut und Kükenführung übernimmt die Henne die Versorgung; der Hahn betreut nicht einfach gleichberechtigt dasselbe Gesperre.", "Küken brauchen anfangs besonders viele wirbellose Nahrungstiere und Schutz vor Auskühlung."],
    ["Der lange spitze Schwanz ergänzt die Bestimmung auch bei unauffällig gefärbten Hennen.", "Erhöhte Schlafplätze in Bäumen oder Gebüschen unterscheiden sich von der stark bodennahen Rebhuhnstrategie."],
    ["Braune Henne und bunter Hahn gehören zur selben Art; Farbunterschiede sind kein Altersvergleich.", "Ein Feld mit Körnern erfüllt noch nicht alle Bedürfnisse eines Küken führenden Gesperres."],
    ["Bei Lebensraumvergleichen Deckung, Insektenangebot und erreichbare trockene Bereiche getrennt notieren.", "Hennen nicht von ihren Küken trennen; Beobachtung abbrechen, wenn die Gruppe ausweicht."],
    "Genügen Körner allein als Erklärung eines guten Kükenlebensraums?", "Nein; frühe Küken benötigen besonders tierische Nahrung und Schutz.", "Der Bedarf ändert sich mit dem Entwicklungsstadium.", [bayern("Fasan", "102449")], [birds]),
  auerhuhn: profile(
    ["Winterliche Nadelnahrung und sommerliche Pflanzenkost stehen in einem anderen Verhältnis als die Insektenkost junger Küken.", "Hennen kümmern sich um Brut und Nachwuchs; die Hahnenbalz ist kein Beleg für gemeinsame Jungenpflege."],
    ["Großer Körper und gefächerter, abgerundeter Hahnenschwanz unterscheiden sich vom kleineren Birkhahn mit Leierstoß.", "Losung unter Ruheplätzen kann Hinweise geben, muss aber fachlich zugeordnet und zeitlich eingeordnet werden."],
    ["Lichte Wälder mit Nadelbäumen und einer nutzbaren Krautschicht verbinden Winternahrung, Deckung und Bewegungsraum.", "Birkhühner nutzen besonders den Wald-Offenland-Übergang; die Lebensraumansprüche sind nicht austauschbar."],
    ["Balzplätze nicht durch Annäherung oder Klangwiedergabe erkunden.", "Ruhe-, Nahrungs- und Kükenbereiche zusammen betrachten; eine große Waldfläche allein genügt als Beschreibung nicht."],
    "Warum ist ein gleichmäßig dunkler dichter Wald nicht automatisch besonders geeignet?", "Licht, Krautschicht, Nahrung und Bewegungsraum müssen ebenfalls passen.", "Lebensraumqualität ist mehr als die Angabe Wald.", [bayern("Auerwild", "096750")], [birds]),
  birkhuhn: profile(
    ["Gemeinschaftsbalz im Frühjahr und mögliche Herbstbalz erfüllen nicht dieselbe Fortpflanzungsfunktion.", "Schneehöhlen können im Winter als isolierende Ruheplätze dienen."],
    ["Der Leierstoß des Hahns und helle Unterschwanzdecken fallen während der Balz auf.", "Die braun gebänderte Henne benötigt einen anderen Merkmalsvergleich als der dunkle Hahn."],
    ["Birkhühner nutzen Übergänge aus Wald, Gebüsch und offenen Bereichen; Alpenschneehühner leben stärker oberhalb der Waldgrenze.", "Auerhuhn und Birkhuhn sind verschiedene Arten; ungewöhnliche Mischmerkmale können fachliche Klärung erfordern."],
    ["Offene Balzflächen und benachbarte Deckung gemeinsam einzeichnen.", "Schneehöhlen nicht untersuchen oder befahren; ein unsichtbarer Vogel kann im Ruheplatz sein."],
    "Ist die offene Balzarena der gesamte notwendige Lebensraum?", "Nein; Nahrung, Deckung und sichere Ruheplätze gehören dazu.", "Unterschiedliche Funktionen liegen in benachbarten Teilflächen.", [bayern("Birkwild", "102436")], [birds]),
  schneehuhn: profile(
    ["Winterweiß und graubraune Sommerzeichnung ändern die Sichtbarkeit in derselben Landschaft.", "Kalte Ruhephasen werden in Schneehöhlen verbracht; Unterbrechungen kosten zusätzliche Energie."],
    ["Befiederte Beine und Zehen unterstützen Isolation und Bewegung auf Schnee.", "Ein fast unsichtbarer Vogel im weißen Gelände kann trotzdem vorhanden sein; Tarnung verändert die Nachweisbarkeit."],
    ["Alpenschneehuhn und Birkhuhn unterscheiden sich in Raumnutzung und Gefieder, obwohl beide Schneehöhlen nutzen.", "Weiße Wintertarnung beim Schneehasen erfüllt eine ähnliche Schutzfunktion, entsteht aber aus Fell statt Federn."],
    ["Touren auf vorgesehenen Routen führen und Ruhebereiche aussparen.", "Übergangskleider mit Datum dokumentieren; keine fehlenden weißen Partien als automatische Fehlbestimmung werten."],
    "Warum ist das Aufscheuchen aus einer Schneehöhle besonders nachteilig?", "Es unterbricht eine energiesparende Ruhephase.", "Flucht und Wärmeverlust treffen auf begrenztes winterliches Nahrungsangebot.", [park("Alpenschneehuhn", "alpenschneehuhn")], [alpine]),
  stockente: profile(
    ["Im sommerlichen Schlichtkleid wirken Erpel unauffälliger als im Prachtkleid; Schnabel und weitere Merkmale mitprüfen.", "Während der Schwingenmauser entsteht eine vorübergehende Phase ohne Flugfähigkeit."],
    ["Gründeln bedeutet Nahrungssuche mit eingetauchtem Vorderkörper, oft bei sichtbarem Hinterkörper.", "Ein ausbleibender Start bei Störung ist kein verlässlicher Krankheitsbeweis; Mauser kann die Flugfähigkeit begrenzen."],
    ["Stock- und Krickente gehören zu den Gründelenten; Reiherenten tauchen häufiger vollständig zur Nahrungssuche.", "Dunenjunge nehmen selbst Nahrung auf, benötigen dennoch Führung und Schutz durch die Ente."],
    ["Familien und mausernde Gruppen von geeigneten Beobachtungsstellen aus betrachten.", "Ruhegewässer und flache Nahrungszonen getrennt notieren; keine Tiere für Flugmerkmale aufscheuchen."],
    "Ist eine nicht auffliegende Stockente automatisch verletzt?", "Nein; während der Schwingenmauser kann sie flugunfähig sein.", "Verhalten, Jahreszeit und weitere sichtbare Befunde gemeinsam beurteilen.", [bayern("Stockente", "101065")], [water]),
  krickente: profile(
    ["Brutvorkommen und große Winter- oder Rasttrupps beantworten unterschiedliche Fragen zur örtlichen Nutzung.", "Dichte Ufervegetation kann während der Brutzeit die heimliche Lebensweise besonders schwer beobachtbar machen."],
    ["Die kleine, kompakte Gründelente kann auch geringe offene Wasserflächen nutzen.", "Das hohe krilik des Erpels ist ein zusätzlicher Hinweis, aber kein vollständiger Bestandsnachweis."],
    ["Kleinere Gestalt hilft im direkten Stockentenvergleich; Entfernung ohne Maßstab kann täuschen.", "Ein Wintergast auf einem großen See beweist keine Brut an genau diesem Gewässer."],
    ["Zählungen nach Jahreszeit und Beobachtungsaufwand vergleichen statt Winterzahlen als Brutpaare auszugeben.", "Vegetationsreiche kleine Gewässer aus Distanz kontrollieren; nicht ins Brutversteck eindringen."],
    "Sind 50 Krickenten im Januar ein Nachweis für 25 örtliche Brutpaare?", "Nein; Wintergäste und Brutbestand sind unterschiedliche Größen.", "Für Brutnachweise braucht es geeignete saisonale Beobachtungen und Kriterien.", [bayern("Krickente", "213492")], [water]),
  reiherente: profile(
    ["Brut, Jungenaufzucht und Mauser können verschiedene Gewässer betreffen.", "Erpel und Ente sehen im Prachtkleid unterschiedlich aus; der kurze Schopf der Ente kann unauffällig bleiben."],
    ["Gelbe Augen, Kopfform, Schopf und Flankenzeichnung zusammen vergleichen.", "Vollständiges Abtauchen passt zur Nahrungssuche nach Muscheln, anderen Wirbellosen und weiteren Ressourcen."],
    ["Reiher- und Bergente können verwechselt werden; eine kleine dunkle Silhouette genügt nicht zur Bestimmung.", "Ein Entenküken kann früh tauchen und ist dennoch noch nicht flugfähig oder unabhängig."],
    ["Tauch- und Ruhephasen protokollieren, ohne aus einem Tauchen eine bestimmte Beuteart abzulesen.", "Bei unklaren Weibchen Details offen lassen und Fotoqualität beziehungsweise Vergleichsansicht verbessern."],
    "Zeigt frühes Tauchen eines Kükens bereits vollständige Selbstständigkeit?", "Nein; Bewegungsfähigkeiten entwickeln sich nicht alle gleichzeitig.", "Tauchen, Fliegen und Unabhängigkeit sind verschiedene Entwicklungsschritte.", [bayern("Reiherente", "101081")], [water]),
  graugans: profile(
    ["Familien bleiben auch nach dem Flüggewerden zusammen; Flugfähigkeit ist nicht gleich soziale Unabhängigkeit.", "Während der Schwingenmauser sind sichere Gewässer und erreichbare Nahrung besonders wichtig."],
    ["Kräftiger heller Schnabel, relativ heller Kopf und rosafarbene Füße ergänzen die Bestimmung.", "Fraß- und Kotzeichen auf Grünflächen belegen Nutzung; die Anzahl einzelner Gänse bleibt daraus offen."],
    ["Graugänse nutzen Grasflächen und sichere Ruhegewässer als verbundenes System.", "Eine Keilformation zeigt keinen Art- oder Brutnachweis; auch andere Gänse fliegen in Verbänden."],
    ["Wege zwischen Nahrung und Wasser beobachten, ohne Familien vom Gewässer abzuschneiden.", "Bei gemischten Trupps jede Art getrennt bestimmen und unbekannte Tiere ausdrücklich offen lassen."],
    "Warum genügt eine gute Wiese allein nicht als vollständige Lebensraumbeschreibung?", "Sichere Gewässer und erreichbare Verbindungen werden ebenfalls benötigt.", "Nahrung, Ruhe und Familienbewegungen liegen oft in verschiedenen Teilflächen.", [bayern("Graugans", "085417")], [water]),
  waldschnepfe: profile(
    ["Der Schnepfenstrich ist ein Balzflug, kein gewöhnlicher Zugflug und keine direkte Zählung verschiedener Männchen.", "Zug und Witterung verändern die örtliche Anwesenheit; feuchte Waldböden beeinflussen die Nahrungserreichbarkeit."],
    ["Ein langer Schnabel, hoch liegende Augen und Querbänder auf dem Oberkopf ergänzen die Tarnzeichnung.", "Beim Stochern ertastet sie Bodentiere; Regenwürmer sind wichtige Nahrung."],
    ["Waldschnepfe und Bekassine sind verschiedene Arten mit unterschiedlichen typischen Lebensräumen.", "Mehrere Flüge können von demselben Tier stammen; Kontakte sind nicht automatisch Individuen."],
    ["Balzflüge von einem festen Standort mit Uhrzeit und Richtung notieren, ohne Klangattrappen.", "Bodennester nicht suchen; eine Sichtung aus einer Waldmulde nicht durch weiteres Aufscheuchen wiederholen."],
    "Sind fünf Schnepfenflüge sicher fünf verschiedene Vögel?", "Nein; dasselbe Tier kann mehrfach vorbeifliegen.", "Beobachtungskontakte müssen von unterscheidbaren Individuen getrennt werden.", [bayern("Waldschnepfe", "131696"), { label: "FVA: Waldschnepfe und Waldstruktur", url: "https://wnsinfo.fva-bw.de/arten/waldschnepfe/" }, { label: "FVA: Waldschnepfenmonitoring – Überflüge und Individuen", url: "https://www.fva-bw.de/waldschnepfe" }]),
};

// Targeted second-source checks of the stated aspects below, not a new review
// of every paragraph or of the other 25 species. Sources retain organization IDs.
const evidenceCheck = (section, index, verifiedAspect, sourceIds) => ({
  section, index, verifiedAspect, sourceIds, reviewedOn: "2026-10-12",
});
export const wildlifeDepthEvidenceChecks = {
  gamswild: [
    evidenceCheck("seasonalLife", 0, "Brunft häufig November/Dezember; Geburten meist Mai/Juni", ["gamsBayern", "gamsDJV"]),
    evidenceCheck("fieldSigns", 0, "Beide Geschlechter tragen bleibende Hörner", ["gamsBayern", "gamsDJV"]),
    evidenceCheck("comparisons", 1, "Gehakte Gamskrucken gegenüber langen, gebogenen Steinbockhörnern", ["gamsBayern", "gamsDJV", "steinBayern", "steinPark"]),
  ],
  steinwild: [
    evidenceCheck("seasonalLife", 0, "Sexuell getrennte Gruppen außerhalb der Hauptbrunft im Dezember", ["steinBayern", "steinFocus"]),
    evidenceCheck("fieldSigns", 1, "Steingeißen tragen kleinere Hörner als erwachsene Böcke", ["steinBayern", "steinPark"]),
  ],
  rotwild: [
    evidenceCheck("seasonalLife", 0, "Hirsch- und weiblich geprägte Rudel außerhalb der Herbstbrunft überwiegend getrennt", ["rotBayern", "rotStiftung"]),
    evidenceCheck("comparisons", 1, "Rothirsch-Stangengeweih und typisches Schaufelgeweih erwachsener Damhirsche", ["rotBayern", "rotDJV", "damBayern", "damZoo"]),
  ],
  rehwild: [
    evidenceCheck("seasonalLife", 0, "Juli-/Augustpaarung, Keimruhe und Geburt meist im Mai/Juni", ["rehBayern", "rehStiftung"]),
    evidenceCheck("seasonalLife", 1, "Winterliche Gruppen und territoriale Böcke im Frühjahr/Sommer", ["rehDJV", "rehStiftung"]),
    evidenceCheck("comparisons", 0, "Selektive Wahl nährstoffreicher Kräuter, Knospen und Triebe", ["rehDJV", "rehStiftung"]),
  ],
  damwild: [
    evidenceCheck("seasonalLife", 0, "Brunft Oktober/November; Geburtsphase Mai/Juni", ["damBayern", "damDJV"]),
    evidenceCheck("seasonalLife", 1, "Frühjahrsabwurf und Neubildung bis gegen Ende des Sommers", ["damBayern", "damDJV"]),
    evidenceCheck("fieldSigns", 1, "Schaufelgeweih als typische Form erwachsener Hirsche, keine Voraussetzung bei jungen", ["damBayern", "damZoo"]),
  ],
  sikawild: [
    evidenceCheck("seasonalLife", 0, "Sommerflecken und schwächere Flecken im dunkleren Winterfell", ["sikaBayern", "sikaGoldauArt"]),
    evidenceCheck("seasonalLife", 1, "Grundsätzlich tagaktiv; Störung kann Dämmerungs-/Nachtaktivität verstärken", ["sikaBayern", "sikaBW"]),
    evidenceCheck("comparisons", 1, "Kleine Gruppen und häufig einzelgängerische ältere Hirsche", ["sikaBayern", "sikaBW"]),
  ],
  muffelwild: [
    evidenceCheck("seasonalLife", 0, "Widder können sich außerhalb der Brunft von weiblichen Tieren mit Nachwuchs absondern", ["muffBayern", "muffGoldau"]),
    evidenceCheck("fieldSigns", 1, "Weibliche Tiere können hornlos sein oder kurze Hörner tragen", ["muffBayern", "muffDJV"]),
    evidenceCheck("comparisons", 0, "Bleibende Hörner statt jährlich erneuerter Geweihe", ["muffBayern", "muffDJV"]),
  ],
  schwarzwild: [
    evidenceCheck("seasonalLife", 0, "Fortpflanzung nicht auf einen einzelnen Monat begrenzt; Tragzeit ungefähr vier Monate", ["sauBayern", "sauStiftung"]),
    evidenceCheck("comparisons", 0, "Allesfresser mit pflanzlichen und tierischen Nahrungsbestandteilen", ["sauBayern", "sauDJV"]),
    evidenceCheck("comparisons", 1, "Bachen und Nachwuchs als typische Familienrotte", ["sauDJV", "sauGoldau"]),
  ],
};
for (const [slug, checks] of Object.entries(wildlifeDepthEvidenceChecks)) {
  const item = wildlifeDepthBySlug[slug];
  item.verifiedClaims = checks.map(check => ({ ...check, sources: check.sourceIds.map(id => wildYearSources[id]) }));
  for (const id of new Set(checks.flatMap(check => check.sourceIds))) {
    const checkedSource = wildYearSources[id];
    if (!item.sources.some(existing => existing.url === checkedSource.url)) item.sources.push({ ...checkedSource });
  }
}

export const wildlifeDepthSlugs = Object.keys(wildlifeDepthBySlug);
