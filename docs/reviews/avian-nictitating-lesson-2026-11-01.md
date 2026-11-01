# Nickhaut: enge Ergänzung des bestehenden Vogelkörperkurses

Inhaltlicher Abgleich: 1. November 2026. Ausgangsrevision: `a6adad695442ba0a90c638cba2e2c80e0e5758ab`.

## Umfang und Lerninhalt

Im vorhandenen Kurs `wissen-ausbau-biologie-vogelkoerper-2026` wird hinten eine kurze Lektion `nickhaut` mit 114 Wörtern, einer eigenen erklärten Frage und einer daraus übernommenen Lernkarte ergänzt. Die neue Lektion trägt das tatsächliche Prüfdatum 1. November 2026. Das Kursdatum und das Datum der ursprünglichen Biologie-Erweiterung bleiben 16. Oktober 2026. Es wird kein neuer Kurs angelegt und kein vorhandener Prüfstand pauschal neu datiert.

Die Lektion unterscheidet Oberlid, Unterlid und die bewegliche Nickhaut. Sie erklärt die Bewegung der Nickhaut über die Hornhaut sowie deren Beitrag zur Verteilung des Tränenfilms und zur Entfernung kleiner Fremdpartikel. Die unmittelbaren Grenzen stehen im Lerntext: unterschiedliche Ausprägung und Durchsichtigkeit, begrenzte Erkennbarkeit in kurzen entfernten Aufnahmen und keine Diagnose oder Sehschärfenmessung aus einem unscharfen Augenbild. Quellenmethodik steht im ergänzenden Nachweisbereich; dort wird die Funktionsdeutung nicht als wiederholtes experimentelles Tränenfilmergebnis ausgegeben.

Die Frage verlangt die Zuordnung der Oberflächenfunktion. Die Ablenker verwechseln diese mit Pupillenöffnung, Linsenverformung oder bloßer Oberlidstellung. Die richtige Antwort und Erklärung bleiben auch als eigenständige Karte verständlich; Fragezeitpunkte oder nicht beigefügte Bildausschnitte werden nicht vorausgesetzt.

## Tatsächlich gelesene Originalquellen

1. **Morris, J. G. L.; Parsons, J. J. (2023): The Various Ways in Which Birds Blink. Animals 13(23), 3656. DOI 10.3390/ani13233656.** [Verlagsseite](https://www.mdpi.com/2076-2615/13/23/3656), [öffentlicher archivierter Originalvolltext](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10705787/fullTextXML).
   - Tatsächlich gelesen: Simple Summary, Methods, Results 3.2, Discussion und Conclusions. Der öffentliche Europe-PMC-Endpunkt wurde mit HTTP200 abgerufen und als XML geparst. Direkte Abrufe von PMC lieferten zuvor eine Prüfseite und vom Verlag eine Drosselungsantwort; diese zählen nicht als erfolgreiche Direktlektüre.
   - Quellenrolle: eigene Video-Beobachtungen zu Lidbewegungen, Richtung des Nickhautblinzelns und Unterschieden der Erkennbarkeit. Die Erklärung der Tränenfilmfunktion steht in der Diskussion; sie ist keine neue isolierte Tränenfilm-Leistungsmessung. Keine Stichprobenzahlen, Blinkfrequenzen oder evolutionären Hypothesen werden übernommen.

2. **Klećkowska-Nawrot, J. E.; Kroczak-Zdańkowska, A.; Urantówka, A. D.; Barszcz, K.; Goździewska-Harłajczuk, K. (2025): Descriptive histological analysis of the upper, lower, and third eyelids and the conjunctiva-associated lymphoid tissue in birds of prey. DOI 10.1186/s12917-025-04677-0.** [Verlagsseite](https://bmcvetres.biomedcentral.com/articles/10.1186/s12917-025-04677-0), [öffentlicher archivierter Originalvolltext](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11951785/fullTextXML).
   - Tatsächlich gelesen: Abstract, Background, Functions of the eyelids in birds, Collection of specimens, Microscopic study, Tissue processing, gemeinsame und unterschiedliche Lidbefunde sowie Conclusions. Der öffentliche XML-Endpunkt wurde mit HTTP200 abgerufen. Die leitende Bearbeitung hat zusätzlich die entsprechenden Abschnitte über den Verlag selbst gelesen.
   - Quellenrolle: unabhängige anatomische Originaluntersuchung mit getrennten Lidstrukturen und Unterschieden zwischen untersuchten Greifvögeln und Eulen. Oberflächenschutz und Tränenfilmverteilung werden anatomisch eingeordnet. Die Autoren begrenzen die Übertragung wegen kleiner Individuenzahlen; es werden keine Gewebemaße, Immunmechanismen oder klinischen Maßnahmen übernommen.

Die beiden Arbeiten stammen von getrennten Autorengruppen und verwenden unterschiedliche Methoden. Ihre Unabhängigkeit bedeutet keine experimentelle Wiederholung desselben Versuchs. Die konkreten drei Aussagenblöcke sind im JSON jeweils genau diesen beiden Quellen zugeordnet. Die zwei neuen Kursquellen haben ausschließlich `lessonIds: ["nickhaut"]`; ältere Lektionen oder Karten erhalten dadurch keine neuen Belege.

Ein zusätzlich gelesenes universitäres Lehrblatt und eine Pinguin-Histologie waren Recherchehilfen. Sie werden nicht als Produktquellen aufgenommen. Die leitende Bearbeitung hat den Lehrblatt-Link nicht positiv lesen können; daraus wird keine gemeinsame Lektürebehauptung abgeleitet.

## Medien und Einordnung

Es wird kein Foto, keine fremde Abbildung und kein Diagramm übernommen. Die bestehenden Wildtierfilme werden nicht nachträglich als sichtbarer Nickhautnachweis beschriftet. Der allgemeine Schutzmechanismus ist nicht mit einer garantierten, unveränderten Unterwassersicht oder einer allgemeinen Krankheitsdiagnose gleichzusetzen.

Die bestehende Kategorie, die Kursroute und sämtliche Artenzugänge bleiben erhalten. Der bereits vorhandene Zählwert des Vogelkörper-Kartensatzes wird lediglich auf den tatsächlichen zusätzlichen Kartenbestand nachgeführt; es entsteht kein weiterer Guidezugang.

## Technische Prüfung und Bewahrung

Das neue Testskript `scripts/test-avian-nictitating-lesson.cjs` liest die vollständige historische Modulstruktur aus Git. Nach Abzug ausschließlich der neuen Lektion, Frage, zwei Quellen und Evidenzzuordnung muss das komplette Biologie-JSON dem Ausgangsobjekt entsprechen. Dasselbe gilt für sämtliche 198 vollständigen bisherigen Kurse, alle bisherigen Fragen und 1756 alten Karten in ihrer Reihenfolge, einschließlich der 116 Startkarten.

Weitere Prüfungen betreffen die gemeinsame CH/AT/DE-Fragenmenge, exakte Lektionssuche, unveränderte Kursrouten und Guideziele, genau eine neue datierte Karte mit zwei passenden Quellen, Druckquellenindex, vollständige Online-Anzeige vor geschlossenem Quellenbereich sowie gespeicherte Offlinekurse mit unverändertem Ablauf des Zugriffsrechts. Dies sind technische Bewahrungs- und Integrationsprüfungen, keine zusätzliche fachliche Gesamtzertifizierung.

Die vorhandenen Cäca- und Harnwege-Prüfungen isolieren die neue Nickhaut-Ergänzung ausschließlich über ihre konkrete Lektions-ID, eine konkrete Frage und zwei ausschließlich dieser Lektion zugeordnete Quellen. Historische Zugriffe auf die zuletzt angehängte Lektion wurden durch die exakte damalige Lektions-ID ersetzt.

Zwei Harnwege-Snapshotfehler bestanden bereits auf der unveränderten Ausgangsrevision `a6adad6`: Der originale Testquelltext wurde außerhalb des Repositorys mit dem vollständigen damaligen Git-Modulgraphen und dem damaligen rohen Biologie-JSON ausgeführt; beide Snapshotprüfungen schlugen mit `ERR_ASSERTION` fehl. Nach Entfernung ausschließlich der namentlich bekannten Harnwege- und der späteren Cäca-Ergänzung entspricht das gesamte damalige JSON wieder dem erwarteten alten Git-Objekt `25807fe`. Ein separater enger Cäca-Testhelfer führt diesen historischen Vergleich nach. Die positive vollständige Cäca-Prüfung und die neue vollständige Bewahrungsprüfung gegen `a6adad6` bleiben bestehen. Der Vorherbeleg liegt unter `work/bird-nickhaut-candidate-nov01/urinary-baseline-before-after.json`; es wurden keine Cäca-Produktdaten verändert oder Objektprüfungen abgeschwächt.

Die tatsächlichen Quellenabrufe und Testprotokolle liegen außerhalb des Repositorys unter `work/bird-nickhaut-candidate-nov01/`. Historische Tests werden nicht allein wegen ihrer veralteten Gesamtzählung abgeschwächt; erforderliche additive Anpassungen sind gesondert zu prüfen.

Der abschließende gemeinsame Lauf des neuen Nickhaut-Skripts und der beiden betroffenen älteren Skripte besteht mit 21 von 21 unterschiedlichen Tests, ohne übersprungene Fälle. Die endgültige neue Lektion umfasst 114 Wörter. Methoden- und Quellenrollen stehen im ergänzenden Nachweisbereich, nicht als Einschub im erklärenden Lerntext.

Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` bleibt unverändert und wird nicht mitgestagt. Ihr SHA-256 ist weiterhin `23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9`.
