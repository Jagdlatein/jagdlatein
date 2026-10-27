// Additional biological profiles checked on 27 October 2026. These bands
// explain overlapping annual processes, never legal hunting permissions.
const source = (label, url, organization) => ({ label, url, organization });
const allMonths = [1,2,3,4,5,6,7,8,9,10,11,12];
const phase = (id, months, title, text, sourceIds) => ({ id, months, title, text, sourceIds });
const annual = (id, title, text, sourceIds) => [phase(id, allMonths, title, text, sourceIds)];
const profile = (slug, name, fields) => ({ slug, name, coatLabel: "Aussehen", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27", ...fields });

export const wildYearMammalFollowupSources = {
  oct27fBiberInfofauna: source("Info fauna · Biberfachstelle, Biologie", "https://www.infofauna.ch/de/beratungsstellen/biberfachstelle/der-biber/biologie", "infofauna-biberfachstelle"),
  oct27fBiberLfU: source("Bayerisches Landesamt für Umwelt · Europäischer Biber, Lebensweise", "https://www.lfu.bayern.de/natur/sap/arteninformationen/steckbrief/zeige?stbname=Castor+fiber", "lfu-bayern"),
  oct27fBiberDJV: source("Deutscher Jagdverband · Biber, Merkmale und Fortpflanzung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/biber-castor-fiber", "djv"),
  oct27fHermelinBY: source("Wildtierportal Bayern · Hermelin, Fell und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/101466/index.php", "stmelf-bayern"),
  oct27fHermelinBW: source("Wildforschungsstelle Baden-Württemberg · Hermelin, Steckbrief", "https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=62", "lazbw"),
  oct27fHermelinOO: source("OÖ Landesjagdverband · Großes Wiesel, Hermelin", "https://www.ooeljv.at/home/rund-um-die-jagd/wild-und-natur/jagdbare-tierarten-2/haar-raubwild/groses-wiesel-hermelin/", "ooeljv"),
  oct27fIltisBY: source("Wildtierportal Bayern · Iltis, Nahrung und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/101494/index.php", "stmelf-bayern"),
  oct27fIltisDJV: source("Deutscher Jagdverband · Iltis, Merkmale und Fortpflanzung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/iltis-oder-waldiltis-mustela-putorius", "djv"),
  oct27fIltisTirol: source("Tiroler Jägerverband · Iltis, Fortpflanzung", "https://www.tjv.at/wild-jagd/wildtiere/haarwild/iltis/", "tiroler-jaegerverband"),
  oct27fNutriaBY: source("Wildtierportal Bayern · Nutria, Lebensweise und Fortpflanzung", "https://www.wildtierportal.bayern.de/wildtiere_bayern/218365/", "stmelf-bayern"),
  oct27fNutriaBW: source("Wildforschungsstelle Baden-Württemberg · Nutria, Steckbrief", "https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=5", "lazbw"),
  oct27fNutriaDJV: source("Deutscher Jagdverband · Nutria, Merkmale und Jahresaktivität", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/nutria-myocastor-coypus", "djv"),
};

export const wildYearMammalFollowupSpecies = [
  profile("biber", "Biber", {
    coat: annual("oct27f-biber-kelle", "Kelle und dichtes Fell", "Der breite, flache Schwanz heißt Kelle. Das dichte Fell gehört zur Anpassung an das Wasserleben. Ein Artporträt zeigt diese Merkmale, beweist aber keinen Aufnahmemonat.", ["oct27fBiberInfofauna","oct27fBiberDJV"]),
    crown: [
      phase("oct27f-biber-winterkost", [11,12,1,2,3], "Rinde und erreichbare Vorräte", "Im Winter gehören Rinde und weitere Gehölzteile zur Nahrung. Unter Wasser abgelegte Zweige können bei Eis erreichbar bleiben. Nicht jede Familie legt einen gleich großen Wintervorrat an.", ["oct27fBiberInfofauna","oct27fBiberLfU","oct27fBiberDJV"]),
      phase("oct27f-biber-gruenkost", [4,5,6,7,8,9,10], "Krautige Pflanzen und Gehölze", "Biber fressen Pflanzen: unter anderem Wasserpflanzen, Kräuter und junge Gehölzteile. Mit dem jahreszeitlichen Angebot verschieben sich die Anteile; Fische gehören nicht zur Nahrung.", ["oct27fBiberInfofauna","oct27fBiberLfU"]),
    ],
    reproduction: [
      phase("oct27f-biber-paarung", [1,2,3], "Winterliche Paarung", "Die Paarung fällt in den Winter. Info fauna und LfU nennen Januar bis März, der DJV enger Januar/Februar. Die Geburt folgt erst im Frühjahr.", ["oct27fBiberInfofauna","oct27fBiberLfU","oct27fBiberDJV"]),
      phase("oct27f-biber-junge", [4,5,6], "Geburt und erste Aufzucht", "Der jährliche Wurf liegt gewöhnlich im Frühjahr bis Frühsommer. Die Jungen werden gesäugt und beginnen später zusätzlich Pflanzen zu fressen.", ["oct27fBiberInfofauna","oct27fBiberDJV"]),
      phase("oct27f-biber-familie", [7,8,9,10,11,12], "Mehrere Jahrgänge in der Familie", "Jungbiber bleiben über ihre erste Saison hinaus bei den Eltern. Zur Familie gehören deshalb auch ältere Geschwister; ein gemeinsames Auftreten bedeutet nicht denselben Geburtsjahrgang.", ["oct27fBiberInfofauna","oct27fBiberLfU","oct27fBiberDJV"]),
    ],
    behavior: annual("oct27f-biber-aktiv", "Auch im Winter aktiv", "Biber halten keinen Winterschlaf. Sie müssen auch in der kalten Jahreszeit Nahrung erreichen; Eis verändert die Zugänglichkeit, beendet aber nicht ihren Jahreszyklus.", ["oct27fBiberInfofauna","oct27fBiberDJV"]),
    uncertainty: "Die Quellen nennen Geburt April–Juni beziehungsweise Mai/Juni. Das breite Band umfasst Geburt und Aufzucht und setzt keinen festen Geburtstag. Nahrungskarten bündeln Sommer- und Winterangebot; Wetter und örtliche Vegetation verschieben den Übergang.",
  }),
  profile("hermelin", "Hermelin", {
    coat: annual("oct27f-hermelin-fell", "Schwarze Schwanzspitze bleibt", "Im Sommer sind Rücken und Flanken braun, die Unterseite hell. Im Winter kann das Fell weiß werden; die Schwanzspitze bleibt schwarz. Der Weißwechsel ist regional unterschiedlich ausgeprägt.", ["oct27fHermelinBY","oct27fHermelinOO"]),
    crown: annual("oct27f-hermelin-beute", "Kleinsäuger als wichtige Beute", "Vor allem Mäuse und weitere kleine Säugetiere gehören zur Nahrung. Das erreichbare Beuteangebot beeinflusst, wo Hermeline Nahrung suchen; der kleine Körper bedeutet nicht rein pflanzliche Kost.", ["oct27fHermelinBY","oct27fHermelinBW"]),
    reproduction: [
      phase("oct27f-hermelin-winter", [1,2], "Keimruhe im Jahreszyklus", "Zwischen Vorjahrespaarung und Frühjahrswurf liegt eine lange Keimruhe. Sie verzögert die frühe Entwicklung des Nachwuchses und ist kein Schlafzustand des Weibchens.", ["oct27fHermelinBY","oct27fHermelinBW","oct27fHermelinOO"]),
      phase("oct27f-hermelin-fruehjahr", [3,4,5], "Frühjahrswurf und neue Paarungen", "Die Jungen kommen im Frühjahr zur Welt und werden gesäugt. Gleichzeitig kann bereits die nächste Paarungsphase beginnen. Geburt und Ranz verschiedener Tiere überlappen.", ["oct27fHermelinBY","oct27fHermelinBW","oct27fHermelinOO"]),
      phase("oct27f-hermelin-sommer", [6,7,8], "Ranz und Jungenaufzucht", "Paarungen fallen vor allem ins Frühjahr und in den Sommer. Nach der Befruchtung verzögert die Keimruhe den nächsten Wurf bis zum folgenden Frühjahr; die bisherigen Jungen wachsen weiter heran.", ["oct27fHermelinBY","oct27fHermelinBW","oct27fHermelinOO"]),
      phase("oct27f-hermelin-herbst", [9,10,11,12], "Verzögerter Fortpflanzungszyklus", "Der Abstand zwischen Paarung und Geburt umfasst einen langen Entwicklungsaufschub. Der Nachwuchs des nächsten Jahres ist nicht schon aus einer herbstlichen Sichtung zu erkennen.", ["oct27fHermelinBY","oct27fHermelinBW","oct27fHermelinOO"]),
    ],
    behavior: annual("oct27f-hermelin-lebensraum", "Einzelgänger mit Deckung", "Hermeline leben überwiegend einzeln. Strukturreiche Landschaften mit Hecken, Säumen und Verstecken bieten Lebensraum. Nahrungssuche ist zu unterschiedlichen Tageszeiten möglich.", ["oct27fHermelinBY","oct27fHermelinBW","oct27fHermelinOO"]),
    uncertainty: "Bayern nennt Ranz Mai–Juli, Baden-Württemberg Mai–August und OÖ April–Juli. Auch Wurfangaben variieren innerhalb des Frühjahrs. Die Bänder fassen überlappende Abläufe zusammen; sie sind keine einheitliche Frist und keine Garantie eines Zeitraums ohne abhängige Junge.",
  }),
  profile("iltis", "Iltis", {
    coat: annual("oct27f-iltis-maske", "Helle Maske, dunkles Deckhaar", "Die helle Gesichtszeichnung steht im Kontrast zum dunklen Deckhaar. Darunter kann gelblich-helle Unterwolle durchscheinen; Blickwinkel und Fellstellung verändern den Farbeindruck.", ["oct27fIltisBY","oct27fIltisDJV"]),
    crown: annual("oct27f-iltis-nahrung", "Amphibien und Kleinsäuger", "Frösche, Kröten und kleine Säugetiere gehören zum Nahrungsspektrum. Gewässerränder und strukturreiche Landschaften bieten unterschiedliche Beutemöglichkeiten; eine einzelne Sichtung zeigt nicht die gesamte Nahrung.", ["oct27fIltisBY","oct27fIltisDJV","oct27fIltisTirol"]),
    reproduction: [
      phase("oct27f-iltis-ranz", [3,4], "Beginn der Ranz", "Die Paarungsphase beginnt typischerweise im März und kann über April hinausreichen. Nach ungefähr sechs Wochen Trächtigkeit werden die Jungen geboren; der Übergang zur Wurfphase ist fließend.", ["oct27fIltisBY","oct27fIltisDJV","oct27fIltisTirol"]),
      phase("oct27f-iltis-junge", [5,6,7,8], "Wurf und Aufzucht", "Mai und Juni sind typische Wurfmonate. Die Jungen liegen zunächst blind im geschützten Versteck. Anschließend entwickeln sie sich über mehrere Wochen weiter; die Aufzucht endet nicht mit dem Wurf.", ["oct27fIltisBY","oct27fIltisDJV","oct27fIltisTirol"]),
      phase("oct27f-iltis-zyklus", [9,10,11,12,1,2], "Zwischen den Hauptphasen", "Der Jahreslauf führt von der Jungenentwicklung zur nächsten Frühjahrsranz. Aus dem Kalender allein lässt sich weder das Alter eines gesehenen Iltisses noch ein sicher jungtierfreier Zeitraum bestimmen.", ["oct27fIltisBY","oct27fIltisDJV"]),
    ],
    behavior: annual("oct27f-iltis-verstecke", "Deckung am Gewässer und im Offenland", "Iltisse sind überwiegend dämmerungs- und nachtaktiv. Holz- und andere Haufen, Baue oder Gebäudeverstecke können als Ruheplatz dienen; der Name Waldiltis bedeutet keine Bindung an geschlossenen Hochwald.", ["oct27fIltisBY","oct27fIltisDJV"]),
    uncertainty: "Tirol beschreibt die Ranz enger mit März/April, Bayern und DJV bis Juni. Der Kalender bündelt deshalb Paarung, Wurf und Aufzucht. Er berechnet keine Geburtsdaten aus pauschalen Tragzeiten und behandelt die Sommermonate nicht als abgeschlossene Aufzuchtgarantie.",
  }),
  profile("nutria", "Nutria", {
    coat: annual("oct27f-nutria-schwanz", "Runder Schwanz und auffällige Nagezähne", "Die Nutria besitzt einen runden, beschuppten und wenig behaarten Schwanz. Das Fell wirkt meist braun, die großen Schneidezähne orange. Diese Merkmale sind mit weiteren Körpermerkmalen gemeinsam zu betrachten.", ["oct27fNutriaBY","oct27fNutriaDJV"]),
    crown: annual("oct27f-nutria-pflanzen", "Vorwiegend Pflanzenkost", "Wasserpflanzen und weitere erreichbare Pflanzen bilden den Hauptteil der Nahrung. Auch Wurzeln oder unterirdische Pflanzenteile werden genutzt. Gelegentlich gehören etwa Muscheln und Schnecken dazu; reine Fleischkost wäre falsch.", ["oct27fNutriaBY","oct27fNutriaBW","oct27fNutriaDJV"]),
    reproduction: annual("oct27f-nutria-ganzjaehrig", "Fortpflanzung ganzjährig möglich", "Paarung und Geburten sind grundsätzlich in allen Monaten möglich. Mehrere Würfe können sich über ein Jahr verteilen. Die Jungen sind schon bei der Geburt weit entwickelt, können sehen und beginnen früh, der Mutter zu folgen; sie werden dennoch gesäugt.", ["oct27fNutriaBY","oct27fNutriaBW","oct27fNutriaDJV"]),
    behavior: [
      phase("oct27f-nutria-kaelte", [11,12,1,2,3], "Kälte beeinflusst die Bedingungen", "Lange, strenge Frostperioden können Nutrias stark belasten. Wie ein Winter überstanden wird, hängt von den örtlichen Bedingungen ab; das ist kein fester Zeitpunkt einer winterlichen Fortpflanzungspause.", ["oct27fNutriaBY","oct27fNutriaBW"]),
      phase("oct27f-nutria-ufer", [4,5,6,7,8,9,10], "Gewässer und Uferbaue", "Ruhigere Gewässer mit pflanzenreichen Ufern bieten Nahrung und Rückzug. Erdbauten am Ufer dienen als Versteck und Wurfplatz; örtlich können mehrere Tiere nahe beieinander leben.", ["oct27fNutriaBY","oct27fNutriaBW","oct27fNutriaDJV"]),
    ],
    uncertainty: "Die ganzjährige Fortpflanzung wird nicht künstlich in feste Ranz- und Wurfmonate zerlegt. Frostempfindlichkeit bedeutet weder einen allgemeinen Winterschlaf noch, dass jeder Winter eine örtliche Population beseitigt. Die kalte Phase ist ein Orientierungsband, keine Temperaturmessung.",
  }),
];
