// Biological orientation for Central Europe, never a hunting-season table.
// Bands group overlapping processes; the text and uncertainty retain their scope.
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const phase = (id, selectedMonths, title, text, sourceIds) => ({ id, months: selectedMonths, title, text, sourceIds });
const annual = (id, title, text, sourceIds) => [phase(id, months, title, text, sourceIds)];
const source = (label, url, organization) => ({ label, url, organization });

export const wildYearBirdSources = {
  oct27bStockBY: source("Wildtierportal Bayern · Stockente, Erscheinungsbild und Jahresverlauf", "https://www.wildtierportal.bayern.de/wildtiere_bayern/101065/index.php", "stmelf-bayern"),
  oct27bStockDJV: source("Deutscher Jagdverband · Stockente, Nahrung und Fortpflanzung", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/stockente-anas-platyrhynchos", "djv"),
  oct27bStockOO: source("OÖ Landesjagdverband · Stockente", "https://www.ooeljv.at/home/rund-um-die-jagd/wild-und-natur/jagdbare-tierarten-2/wasservogel-2/stockente/", "ooeljv"),
  oct27bStockLFU: source("Bayerisches Landesamt für Umwelt · Stockente, Phänologie", "https://www.lfu.bayern.de/natur/sap/arteninformationen/steckbrief/zeige?stbname=Anas+platyrhynchos", "lfu-bayern"),
  oct27bStockSTMK: source("Steirische Landesjägerschaft · Stockente, Lebensraum und Merkmale", "https://www.jagd-stmk.at/wildtiere/stock-und-krickenten/", "steirische-landesjaegerschaft"),
  oct27bFasanBY: source("Wildtierportal Bayern · Fasan", "https://www.wildtierportal.bayern.de/wildtiere_bayern/102449/index.php", "stmelf-bayern"),
  oct27bFasanDJV: source("Deutscher Jagdverband · Fasan", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/fasan-phasianus-colchicus", "djv"),
  oct27bFasanVBN: source("Vogelbescherming Nederland · Fazant, Leefwijze", "https://www.vogelbescherming.nl/ontdek-vogels/kennis-over-vogels/vogelgids/vogel/fazant", "vogelbescherming"),
  oct27bRebBY: source("Wildtierportal Bayern · Rebhuhn", "https://www.wildtierportal.bayern.de/wildtiere_bayern/102425/index.php", "stmelf-bayern"),
  oct27bRebDJV: source("Deutscher Jagdverband · Rebhuhn", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/rebhuhn-perdix-perdix", "djv"),
  oct27bRebVBN: source("Vogelbescherming Nederland · Patrijs, Leefwijze", "https://www.vogelbescherming.nl/ontdek-vogels/kennis-over-vogels/vogelgids/vogel/patrijs", "vogelbescherming"),
  oct27bRingDJV: source("Deutscher Jagdverband · Ringeltaube", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/ringeltaube-columba-palumbus", "djv"),
  oct27bRingBW: source("Wildforschungsstelle Baden-Württemberg · Ringeltaube", "https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=19", "lazbw"),
  oct27bRingVBN: source("Vogelbescherming Nederland · Houtduif", "https://www.vogelbescherming.nl/ontdek-vogels/kennis-over-vogels/vogelgids/vogel/houtduif", "vogelbescherming"),
  oct27bGansBirdlife: source("BirdLife Österreich · Graugans", "https://www.birdlife.at/voegel/graugans/", "birdlife-oesterreich"),
  oct27bGansDJV: source("Deutscher Jagdverband · Graugans", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/graugans-anser-anser", "djv"),
  oct27bGansBW: source("Wildforschungsstelle Baden-Württemberg · Graugans", "https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=39", "lazbw"),
  oct27bGansWien: source("Haupt Verlag / StadtWildTiere Wien · Graugans, Biologie aus Stadtfauna", "https://wien.stadtwildtiere.at/artportraet/graugans", "haupt-verlag-stadtfauna"),
  oct27bSchnepfeDJV: source("Deutscher Jagdverband · Waldschnepfe", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/waldschnepfe-scolopax-rusticola", "djv"),
  oct27bSchnepfeOO: source("OÖ Landesjagdverband · Waldschnepfe", "https://www.ooeljv.at/home/rund-um-die-jagd/wild-und-natur/jagdbare-tierarten-2/wasservogel-2/waldschnepfe/", "ooeljv"),
  oct27bSchnepfeLJN: source("Landesjägerschaft Niedersachsen · Waldschnepfe, Verbreitung und Zug", "https://www.wildtiermanagement.com/wildtiere/federwild/waldschnepfe/verbreitung", "ljn"),
  oct27bSchnepfeVBN: source("Vogelbescherming Nederland · Houtsnip, Leefwijze", "https://www.vogelbescherming.nl/ontdek-vogels/kennis-over-vogels/vogelgids/vogel/houtsnip", "vogelbescherming"),
  oct27bKrickBY: source("Wildtierportal Bayern · Krickente", "https://www.wildtierportal.bayern.de/wildtiere_bayern/213492/index.php", "stmelf-bayern"),
  oct27bKrickBW: source("Wildforschungsstelle Baden-Württemberg · Krickente", "https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=57", "lazbw"),
  oct27bKrickLFU: source("Bayerisches Landesamt für Umwelt · Krickente, Phänologie", "https://www.lfu.bayern.de/natur/sap/arteninformationen/steckbrief/zeige?stbname=Anas+crecca", "lfu-bayern"),
  oct27bKrickGoldau: source("Natur- und Tierpark Goldau · Krickente, Merkmale, Ernährung und Teilzug", "https://www.tierpark.ch/tierarten/krickente-2/", "tierpark-goldau"),
  oct27bBirkBY: source("Wildtierportal Bayern · Birkwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/102436/index.php", "stmelf-bayern"),
  oct27bBirkDJV: source("Deutscher Jagdverband · Birkhuhn", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/birkhuhn-lyrurus-tetrix", "djv"),
  oct27bBirkVBN: source("Vogelbescherming Nederland · Korhoen, Brutablauf", "https://www.vogelbescherming.nl/ontdek-vogels/kennis-over-vogels/vogelgids/vogel/korhoen", "vogelbescherming"),
};

export const wildYearBirdSpecies = [
  {
    slug: "stockente", name: "Stockente", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("stock-kleider", "Erpelkleider unterscheiden", "Grüner Kopf und weißer Halsring kennzeichnen den Erpel im Prachtkleid. Im sommerlichen Schlichtkleid wirkt er brauner. Die Ente trägt ein braunes Tarngefieder; beide Geschlechter zeigen einen blauen Flügelspiegel.", ["oct27bStockBY", "oct27bStockDJV"]),
    crown: annual("stock-nahrung", "Gründeln und vielseitige Nahrung", "Stockenten nehmen Pflanzen und kleine Tiere auf. Beim Gründeln erreichen Kopf und Vorderkörper Nahrung im flachen Wasser; Hornlamellen am Schnabel helfen beim Herausfiltern kleiner Nahrungsteile.", ["oct27bStockBY", "oct27bStockDJV", "oct27bStockSTMK"]),
    reproduction: [
      phase("stock-brut", [3,4,5,6,7], "Brut und Küken", "Die Brut beginnt typischerweise im Frühjahr. Das Weibchen bebrütet das Gelege und führt die Nestflüchter; der Erpel übernimmt diese Jungenführung nicht. Späte Bruten und die Aufzucht reichen über den ersten Schlupftermin hinaus.", ["oct27bStockBY", "oct27bStockDJV", "oct27bStockLFU"]),
      phase("stock-paar", [8,9,10,11,12,1,2], "Übergang zur nächsten Paarbildung", "Nach der sommerlichen Nachwuchsphase folgt die erneute Paarbildung: Paare können sich bereits im Herbst finden. Winterliche Balz bedeutet deshalb nicht, dass schon ein Gelege vorhanden ist.", ["oct27bStockBY", "oct27bStockDJV", "oct27bStockOO"]),
    ],
    behavior: annual("stock-teilzug", "Bleibende und ziehende Vögel", "Neben örtlich bleibenden Vögeln treten Durchzügler und Wintergäste auf. Eine winterliche Ansammlung muss daher nicht aus denselben Tieren bestehen wie der örtliche Brutbestand.", ["oct27bStockLFU", "oct27bStockSTMK"]),
    uncertainty: "Die Brutfenster unterscheiden sich: OÖ nennt März/April–Juni, das LfU für Bayern März–Juli. August gehört hier zum Übergangsband, nicht zu einem behaupteten festen Paarbildungsbeginn. Gefieder und Flugfähigkeit wechseln individuell; das Monatsband ist keine Aussage über ein bestimmtes Tier.",
  },
  {
    slug: "fasan", name: "Fasan", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("fasan-kleider", "Bunter Hahn, getarnte Henne", "Der Hahn hat ein auffälliges Gefieder und einen langen Schwanz. Die Henne ist braun gemustert und unauffälliger.", ["oct27bFasanBY", "oct27bFasanDJV"]),
    crown: annual("fasan-kost", "Küken brauchen Insekten", "Erwachsene Fasane nutzen Pflanzen, Samen und tierische Nahrung. In den ersten Lebenswochen sind für Küken Insekten und andere kleine Tiere besonders wichtig; bloßes Körnerangebot ersetzt diesen Teil der Nahrung nicht.", ["oct27bFasanBY", "oct27bFasanDJV"]),
    reproduction: [
      phase("fasan-balz", [3,4], "Balz und Brutbeginn", "Ein Hahn kann mehrere Hennen um sich sammeln. Revierrufe und Balz bereiten die Brut vor; bereits Ende April können Eier im Bodennest liegen. Der Hahn übernimmt keine Jungenführung.", ["oct27bFasanBY", "oct27bFasanDJV", "oct27bFasanVBN"]),
      phase("fasan-brut", [5,6,7], "Bodenbrut und Aufzucht", "Die Henne brütet in einem verborgenen Bodennest und führt die Küken. Die Nestflüchter verlassen das Nest früh, brauchen aber weiterhin Führung und Wärme durch die Henne.", ["oct27bFasanBY", "oct27bFasanDJV", "oct27bFasanVBN"]),
      phase("fasan-jahreswechsel", [8,9,10,11,12,1,2], "Nachwuchsphase und Wintergruppen", "Brutverluste können Nachgelege auslösen; die Aufzucht hat deshalb keinen überall gleichen Endtag. Im Winter können Fasane gesellige, auch nach Geschlechtern getrennte Gruppen bilden.", ["oct27bFasanDJV", "oct27bFasanVBN"]),
    ],
    behavior: annual("fasan-deckung", "Deckung und erhöhte Ruheplätze", "Hecken, Feldgehölze und andere Deckung gehören zum Lebensraum. Fasane suchen zum Ruhen auch Bäume oder hohe Büsche auf; Feldhühner leben deshalb nicht alle ausschließlich am Boden.", ["oct27bFasanBY", "oct27bFasanDJV"]),
    uncertainty: "Die Bänder bündeln Balz, Brut und anschließende Aufzucht. Die Quellen beschreiben unterschiedliche Gelegezahlen und Brutdauern; daraus wird hier kein fester individueller Schlupfkalender berechnet. Ein spät geführtes Gesperre widerspricht dem Jahresmodell nicht.",
  },
  {
    slug: "rebhuhn", name: "Rebhuhn", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("reb-tarnung", "Braungraues Feldhuhn", "Das Rebhuhn ist ein kompakter, kurzschwänziger Hühnervogel mit braungrauem Tarngefieder. Hahn und Henne sehen sich ähnlich; ein Bauchfleck allein ist keine zuverlässige Geschlechtsbestimmung.", ["oct27bRebBY", "oct27bRebDJV"]),
    crown: annual("reb-insekten", "Unterschied zwischen Küken und Altvogel", "Erwachsene Tiere fressen überwiegend Pflanzen und Samen. Junge Küken benötigen besonders viele Insekten und andere kleine Tiere. Nahrungsreiche, deckende Feldränder sind deshalb mehr als ein bloßer Ruheplatz.", ["oct27bRebBY", "oct27bRebDJV", "oct27bRebVBN"]),
    reproduction: [
      phase("reb-paare", [2,3], "Ketten lösen sich, Paare entstehen", "Zum Ende des Winters beginnt die Paarbildung. Die Familienverbände lösen sich auf; Hahn und Henne bleiben während der Brutsaison als Paar zusammen.", ["oct27bRebBY", "oct27bRebDJV", "oct27bRebVBN"]),
      phase("reb-brut", [4,5,6,7,8], "Bodennest und geführte Küken", "Die Eiablage beginnt typischerweise im Frühjahr; Nachgelege können später folgen. Die Henne brütet, während der Hahn wacht. Beide Eltern führen die Nestflüchter.", ["oct27bRebBY", "oct27bRebDJV", "oct27bRebVBN"]),
      phase("reb-familie", [9,10,11,12,1], "Familienverband als Kette", "Jungvögel können bei den Eltern bleiben, obwohl sie bereits selbst Nahrung suchen. Die Kette besteht bis in den Winter; Selbstständigkeit und Auflösung des Familienverbandes sind verschiedene Schritte.", ["oct27bRebBY", "oct27bRebDJV", "oct27bRebVBN"]),
    ],
    behavior: annual("reb-boden", "Bodenleben in strukturreicher Feldflur", "Nester und Ruheplätze liegen am Boden. Brachen, Säume, Altgras und niedrige Deckung bieten Rückzug; ein offener Acker allein beschreibt den benötigten Lebensraum nicht vollständig.", ["oct27bRebBY", "oct27bRebDJV"]),
    uncertainty: "Die Bänder schließen späte Nachgelege und eine längere Kükenphase ein. Die niederländische Fachquelle nennt Eiablage bis Juli und empfindliche Küken bis August; das ist keine einheitliche Frist für jedes Revier. Monatsanfänge lösen keine Kette schlagartig auf.",
  },
  {
    slug: "ringeltaube", name: "Ringeltaube", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("ring-zeichnung", "Halsfleck und Flügelband", "Erwachsene Ringeltauben tragen weiße Halsflecken und ein weißes Flügelband. Jungvögeln fehlt der weiße Halsfleck zunächst. Sein Fehlen allein schließt die Ringeltaube deshalb nicht aus.", ["oct27bRingDJV", "oct27bRingVBN"]),
    crown: annual("ring-pflanzen", "Samen, Grünpflanzen und Baumfrüchte", "Pflanzliche Nahrung überwiegt: Samen, grüne Pflanzenteile sowie Eicheln und Bucheckern gehören zum Angebot. Ernte und Baumfruchtangebot verändern die erreichbaren Nahrungsplätze.", ["oct27bRingDJV", "oct27bRingBW", "oct27bRingVBN"]),
    reproduction: annual("ring-mehrfachbrut", "Mehrere Bruten, beide Eltern beteiligt", "Ringeltauben können mehrfach hintereinander brüten. Das Nest liegt meist im Geäst; beide Eltern beteiligen sich an Brut und Jungenversorgung. Frühling und Sommer bilden den Schwerpunkt, doch die Brutsaison kann weit darüber hinausreichen.", ["oct27bRingDJV", "oct27bRingBW", "oct27bRingVBN"]),
    behavior: [
      phase("ring-saison", [3,4,5,6,7,8,9,10], "Brutreviere und Nahrungsflächen", "Während einer Brut verteidigen Paare ihr Revier. Die Nahrungssuche kann trotzdem auf offenen Flächen stattfinden; Brutplatz und Nahrungsplatz erfüllen verschiedene Funktionen.", ["oct27bRingBW", "oct27bRingVBN"]),
      phase("ring-winter", [11,12,1,2], "Schwärme und unterschiedliche Zugwege", "Außerhalb der Brutzeit bilden sich größere Gruppen. Ein Teil der europäischen Vögel zieht, andere bleiben. Ein winterlicher Schwarm ist deshalb kein Nachweis, dass zuvor alle örtlichen Brutvögel abgezogen sind.", ["oct27bRingDJV", "oct27bRingVBN", "oct27bRingBW"]),
    ],
    uncertainty: "Die Wildforschungsstelle nennt für Baden-Württemberg eine Reproduktionsspanne von Ende Februar bis Ende Oktober; Vogelbescherming beschreibt auch Bruten außerhalb des Schwerpunktes. Deshalb gibt es hier keine angeblich sichere winterliche Brutpause. Die Verhaltensbänder bezeichnen typische Zusammenhänge, keine Ausnahmen ausschließenden Regeln.",
  },
  {
    slug: "graugans", name: "Graugans", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("gans-grau", "Graubraun bei beiden Geschlechtern", "Gans und Ganter tragen ein ähnliches graubraunes Gefieder. Der kräftige Schnabel ist rosa bis orange gefärbt. Eine einzelne grau wirkende Gans ist ohne weitere Merkmale noch nicht sicher bestimmt.", ["oct27bGansBirdlife", "oct27bGansDJV"]),
    crown: annual("gans-aesen", "Pflanzen an Land und Wasser", "Gräser, Kräuter, Samen und weitere Pflanzenteile bilden die Nahrung. Häufig äsen Graugänse an Land; das Gewässer dient daneben als Brut-, Ruhe- oder Rückzugsraum.", ["oct27bGansBirdlife", "oct27bGansDJV", "oct27bGansBW"]),
    reproduction: [
      phase("gans-brut", [3,4,5,6,7], "Brut und Gössel", "Die Brut beginnt im Frühjahr an einem geschützten Platz. Das Weibchen brütet, der Ganter bleibt in der Nähe. Die Gössel sind Nestflüchter und werden von beiden Eltern begleitet.", ["oct27bGansWien", "oct27bGansDJV", "oct27bGansBW"]),
      phase("gans-familie", [8,9,10,11,12,1,2], "Paare und Familiengruppen", "Graugänse bilden länger bestehende Paare. Außerhalb der Brutzeit treten größere Gruppen auf, in denen auch Familienverbände zusammenbleiben. Der Kalender setzt keinen einheitlichen Termin für die Auflösung einer Familie voraus.", ["oct27bGansBW", "oct27bGansDJV", "oct27bGansBirdlife"]),
    ],
    behavior: annual("gans-zug", "Teilzug statt allgemeiner Winterabreise", "Graugänse können ziehen oder im weiteren Brutgebiet überwintern. Herkunft, Lebensraum und Winterbedingungen beeinflussen das Zuggeschehen. Aus einer örtlichen Sichtung lässt sich deshalb nicht der Zugweg aller Graugänse ableiten.", ["oct27bGansBirdlife", "oct27bGansDJV"]),
    uncertainty: "Das Band März–Juli fasst Brutvorbereitung und Jungenphase zusammen. Einzelne Quellen nennen enger April/Mai für die Brut selbst. Es wird keine feste Monatsgrenze der Selbstständigkeit und keine europaweit gleiche Winterwanderung behauptet.",
  },
  {
    slug: "waldschnepfe", name: "Waldschnepfe", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("schnepfe-tarnung", "Tarnmuster und langer Schnabel", "Das braun gesprenkelte Gefieder tarnt die gedrungene Waldschnepfe am Boden. Der Scheitel ist quer gebändert, der Schnabel lang. Die Längsstreifen der Bekassine sind ein anderer Zeichnungstyp.", ["oct27bSchnepfeDJV", "oct27bSchnepfeOO"]),
    crown: annual("schnepfe-boden", "Wirbellose im erreichbaren Boden", "Regenwürmer und andere kleine Bodentiere bilden wichtige Nahrung. Feuchter, durchdringbarer Boden und Deckung gehören zusammen zum Lebensraum; ein beliebiger geschlossener Wald genügt als Beschreibung nicht.", ["oct27bSchnepfeDJV", "oct27bSchnepfeOO", "oct27bSchnepfeLJN"]),
    reproduction: [
      phase("schnepfe-brut", [3,4,5,6,7], "Balzflug und versteckte Bodenbrut", "Die typische Brutphase reicht von März bis Juli. Balzende Männchen fliegen in der Dämmerung über Waldöffnungen; das Gelege liegt dagegen verborgen am Boden. Das Weibchen übernimmt Brut und Jungenführung.", ["oct27bSchnepfeDJV", "oct27bSchnepfeOO", "oct27bSchnepfeVBN"]),
      phase("schnepfe-nachbrut", [8,9,10,11,12,1,2], "Nach der Hauptbrutphase", "Die sommerliche Brutphase und das spätere Zuggeschehen sind zu unterscheiden. Ein im Herbst beobachteter Vogel kann aus einem anderen Brutgebiet stammen; seine Anwesenheit beweist keine örtliche Brut.", ["oct27bSchnepfeLJN", "oct27bSchnepfeDJV", "oct27bSchnepfeOO"]),
    ],
    behavior: annual("schnepfe-teilzug", "Zug mit regionalen Unterschieden", "Waldschnepfen sind je nach Herkunft Zug-, Teilzug- oder verbleibende Vögel. Nordische Vögel können weiter südlich überwintern, auch in Teilen Mitteleuropas. Eine allgemeine vollständige Winterabwesenheit wäre deshalb falsch.", ["oct27bSchnepfeLJN", "oct27bSchnepfeDJV"]),
    uncertainty: "Brutbeginn, Zugbewegung und Winteranwesenheit unterscheiden sich nach Herkunft und Bedingungen. Die Monate bezeichnen eine breite mitteleuropäische Brutphase. Balzflug allein ist kein Fund eines Nestes; ein Artporträtfoto belegt weder Brut noch Aufnahmemonat.",
  },
  {
    slug: "krickente", name: "Krickente", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("krick-kleider", "Erpel und Ente", "Der Erpel im Prachtkleid zeigt einen kastanienbraunen Kopf mit grünem Seitenfeld. Das Weibchen wirkt unauffälliger braun. Die Ähnlichkeit mit anderen kleinen Enten verlangt mehrere Bestimmungsmerkmale.", ["oct27bKrickBY", "oct27bKrickGoldau"]),
    crown: annual("krick-seicht", "Nahrung im Seichtwasser", "Krickenten nutzen kleine Wirbellose und Pflanzen, besonders Samen. Sie suchen im Seichtwasser und feuchten Schlamm. Deckungsreiche Ufer und flache Nahrungsbereiche erfüllen unterschiedliche Bedürfnisse derselben Art.", ["oct27bKrickBY", "oct27bKrickBW"]),
    reproduction: [
      phase("krick-brut", [4,5,6,7,8], "Verborgene Brut und Jungenführung", "Die mitteleuropäische Nachwuchsphase liegt im Frühjahr und Sommer. Das Weibchen brütet am Boden, meist verborgen in Ufervegetation, und führt die Jungen.", ["oct27bKrickBY", "oct27bKrickBW", "oct27bKrickLFU"]),
      phase("krick-ausserhalb", [9,10,11,12,1,2,3], "Zug, Wintergemeinschaften und neue Paare", "Außerhalb der Brutzeit treten Krickenten in Trupps auf. Manche Paare finden sich bereits im Winterquartier; eine Paarbeobachtung bedeutet noch keinen Nachweis eines Geleges am selben Gewässer.", ["oct27bKrickBY", "oct27bKrickBW", "oct27bKrickGoldau"]),
    ],
    behavior: annual("krick-wintergast", "Brut- und Winterbestand unterscheiden", "In Mitteleuropa können sich örtliche Brutvögel mit Durchzüglern und Wintergästen abwechseln. Die Anwesenheit vieler Krickenten im Winter darf daher nicht als entsprechend großer örtlicher Brutbestand gelesen werden.", ["oct27bKrickBW", "oct27bKrickLFU", "oct27bKrickGoldau"]),
    uncertainty: "Die Reproduktionsspanne April–August bündelt Eiablage, Brut und Aufzucht; Goldau nennt enger April/Mai für das Legen. Die Quellen verorten Mauserbeginn und Schlichtkleid nicht einheitlich. Hier wird deshalb kein für alle Individuen gültiger Kleiderwechselmonat angegeben.",
  },
  {
    slug: "birkhuhn", name: "Birkhuhn", coatLabel: "Gefieder", secondaryLabel: "Nahrung", reviewedOn: "2026-10-27",
    coat: annual("birk-hahn-henne", "Glänzender Hahn, gebänderte Henne", "Der Hahn trägt blauschwarzes Gefieder, weißen Unterschwanz und gebogene äußere Schwanzfedern. Die Henne ist braun und gebändert getarnt.", ["oct27bBirkBY", "oct27bBirkDJV"]),
    crown: annual("birk-pflanzen", "Saisonale Pflanzenkost, Insekten für Küken", "Erwachsene fressen überwiegend Pflanzen. Im Winter gehören Knospen, Triebe und Nadeln zum Angebot, im Sommer auch frische Kräuter und Beeren. Küken benötigen in den ersten Wochen besonders tierische Nahrung.", ["oct27bBirkBY", "oct27bBirkDJV"]),
    reproduction: [
      phase("birk-fruehbalz", [3,4,5], "Balz und beginnende Bodenbrut", "Die Hähne sammeln sich auf Balzplätzen; die Paarung liegt vor allem im April/Mai. Daraus entsteht kein gemeinsam brütendes Paar. Die Henne verlässt den Balzplatz und kann im Mai bereits brüten.", ["oct27bBirkBY", "oct27bBirkDJV", "oct27bBirkVBN"]),
      phase("birk-junge", [6,7,8,9], "Henne mit Gesperre", "Die Henne brütet am Boden und führt die Nestflüchter allein. Küken können früh kurze Strecken fliegen, bleiben aber länger geführt. Flugfähigkeit bedeutet noch keine Unabhängigkeit.", ["oct27bBirkBY", "oct27bBirkDJV", "oct27bBirkVBN"]),
      phase("birk-herbstwinter", [10,11,12,1,2], "Nachwuchsphase und Herbstbalz trennen", "Nach der Aufzucht lösen sich die Familienverbände. Im Herbst können Hähne erneut balzen. Diese Herbstbalz darf nicht einfach als zweite gleichartige Brutphase verstanden werden.", ["oct27bBirkBY", "oct27bBirkDJV"]),
    ],
    behavior: annual("birk-schnee", "Waldgrenze und Schneedecke", "Birkhühner nutzen halboffene Übergänge zwischen Gehölzen und offenen Flächen. Im Winter können sie sich unter die Schneedecke zurückziehen; aus einer geschlossenen Schneedecke folgt daher nicht, dass dort keine Tiere sind.", ["oct27bBirkBY", "oct27bBirkDJV"]),
    uncertainty: "März steht für Hahnenbalz, nicht für überall laufende Paarung. Höhenlage und Witterung verschieben Brut und Schlüpfen. Die Sommerbänder bündeln Aufzucht; Rückzugsräume im Schnee hängen von geeigneter Schneelage ab.",
  },
];
