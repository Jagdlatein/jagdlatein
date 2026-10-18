# Kurze Wiederholung und Richtungskreis: 18. Oktober 2026

## Wissen direkt nach der Antwort

Die kurze Runde erhält zu den höchstens acht angeforderten Fragen jeweils den unveränderten ersten nicht leeren Absatz der tatsächlich zugeordneten Lektion und deren Titel. Erst nach einer Antwort erscheint dieser Auszug unter „Wissen dazu“. Er ersetzt weder die gesamte Lektion noch wird behauptet, jeder Satz dieses ersten Absatzes sei die einzelne gesuchte Antwort. Der vorhandene Link führt zur vollständigen, richtigen Lektion. Die Runde bleibt auf derselben Seite und behält Frageposition und Ergebnis.

Gibt es Claim-Belege an der Lektion, werden genau deren Quellen für den Quellenbereich zusammengefasst. Ältere Lektionen ohne solche Belege behalten die Kennzeichnung „Quellen der Lerneinheit“. Durch die neue Darstellung wird kein neues fachliches Prüfdatum erzeugt. Der Auszug ist vorhandenes redaktionelles Wissen, kein neuer Wissensblock und keine zusätzliche Frage oder Lernkarte für das Umfangsinventar.

Die statischen Seitenprops enthalten weiter nur gepackte Fragekennungen und Kategorien. Der Verlauf bleibt auf dem Gerät; die bestehende geschützte API lädt weiter höchstens acht ausdrücklich angeforderte Fragen, ausschließlich für gültigen bezahlten oder Betreiberzugang und ohne öffentlichen Cache. Antwort-/Punktelogik und regionale Ausschlüsse werden nicht geändert. Die neue Antwortvalidierung akzeptiert ältere Antworten ohne Lektionsauszug, aber keine fehlerhaften nicht leeren Lektionsobjekte.

## Eigenes schematisches Kompass-Lernmodell

Der neue Kompasskurs erhält in seiner Winkel-Lektion einen festen ebenen Richtungskreis. Ein Ganzzahlwert von 0 bis 360 Grad verändert sofort den eigenen SVG-Pfeil und den Winkelbogen. 0 beziehungsweise 360 ist N, 90 ist O, 180 ist S und 270 ist W; gezählt wird im Uhrzeigersinn. Die Gegenrichtung des gleichen ebenen Bezugssystems liegt 180 Grad gegenüber. Die Ergebnisse sind eigene geometrische Berechnungen und keine Standort-, Sensor- oder Magnetfeldmessungen. Es gibt keine reale Deklination, keine Störungssimulation und keine Routenfreigabe.

Tatsächlich gelesene Quellen für diese begrenzte Winkelkonvention:

- [USGS: Finding Your Way With Map and Compass](https://www.usgs.gov/educational-resources/finding-your-way-map-and-compass), vollständige öffentliche HTML-Seite am 18.10.2026 geöffnet, Einleitung mit allen vier Hauptwerten gelesen. Die verlinkte historische PDF war im Webleser nicht direkt abrufbar; deren unabhängige erneute Volllektüre wird hier nicht behauptet.
- [Ordnance Survey Mapzone: Compass Bearings, Seite 2](https://www.ordnancesurvey.co.uk/mapzone/map-skills/compass-bearings/page-two), öffentlich indexierter Originalabschnitt „How do we write bearings?“ am 18.10.2026 gelesen: im Uhrzeigersinn ab Nord, 360-Grad-Kreis, Nord als 000/360. Die direkte Webleseröffnung lieferte die JavaScript-Hülle. Keine dortige Grafik kopiert.

Der Ganzzahlbereich ist eine bewusst einfache Eingabegrenze dieses Modells, keine Behauptung über die erreichbare Genauigkeit echter Instrumente. Bei leerer, nicht endlicher, gebrochener oder außerhalb liegender Eingabe verschwinden der vorherige Richtungspfeil und das alte Ergebnis. Online-Lektion und vorhandener Offline-Leser verwenden denselben Renderer. Eine textliche Schrittfolge bleibt für das gespeicherte Diagramm erhalten.

## Technische Prüfungen, getrennt von Fachprüfung

Die Tests vergleichen alle vorhandenen Wiederholungsfragen mit dem Originalabsatz und den echten Lektionsquellen, prüfen die unmittelbare Anzeige nach einer Antwort und das unveränderte Fortschalten ohne neue Anfrage. Bestehende Zugriffsschutz-, Lokalverlaufs-, Ladefehler- und Stale-Response-Tests bleiben bestehen.

Für den Richtungskreis werden Haupt- und Zwischenrichtungen, 360/0, alle ganzzahligen Gegenrichtungen, Fehlerzustände, tatsächliche Eingabeänderungen im React-Baustein und die gemeinsame Diagrammzuordnung geprüft. Die Errechnung beziehungsweise Bildschirmprüfung ist kein fachliches Gütesiegel für den gesamten Katalog. Fachlicher Kreisreview, kompletter Build und aktuelle Bildschirmanpassung werden getrennt durchgeführt.

## Abgeschlossener Review dieser Runde

Die drei Autorenpakete wurden unabhängig im Kreis gegengelesen: Biologie durch den Hunde/Kompass-Autor, Habitat durch den Biologie-Autor sowie Hunde/Kompass durch den Habitat-Autor. Alle 24 neuen Lektionen und 96 richtigen Antworten samt Erklärungen wurden dabei geprüft. Ein präziserer zweiter Definitionsbeleg für das langfristige morphologische Gleichgewicht wurde im Habitat-Paket ergänzt; Lehrtext und Fragen blieben unverändert. Die Berichte der Autoren benennen tatsächliche Originalquellen und eingeschränkte Indexzugänge. Es bleibt kein gemeldeter fachlicher Blocker dieser sechs Kurse; dies bestätigt weder den gesamten Altbestand noch eine bestimmte Prüfungsabdeckung.

Die tatsächlich ausgeführten 141 Integrations- und Regressionstests bestanden am 18.10.2026. Darin enthalten sind Quellenzuordnung, eigenständig verwendbare Karten, genaue Kurs-/Lektionsziele, Suche, gemeinsame Quizpools, Wiederholungsverlauf und Zugriffsschutz sowie der Offline-Leser. Ein älterer Navigationstest hatte ausschließlich die überholte feste Kartenzahl 1.331 erwartet; er prüft jetzt weiterhin jede tatsächliche eindeutige Karten-ID und einen nicht leeren Mindestbestand.

Die beiden tatsächlichen React-Ansichten wurden mit dem erzeugten Produktions-CSS bei 320, 360, 390, 620 und 1.100 Pixeln in lokalen Browserrahmen geprüft: kein horizontaler Überlauf, Kompass-Eingabe 50 Pixel hoch, sichtbare Wissensabsätze und vorhandene Antwort-/Weiter-Bedienung. Der lokale Wiederholungszustand ist ausdrücklich eine kontrollierte Darstellungsprüfung mit echten redaktionellen Fragen, keine simulierte Produktionsanmeldung. Live-Prüfung und Veröffentlichungsstatus werden zusätzlich im Auslieferungsprotokoll des Arbeitsbereichs festgehalten.

Tatsächlicher Katalog nach diesem Ausbau: 162 Kurse, 716 Lektionen, 2.494 Kursfragen, 1.507 daraus beziehungsweise aus dem bestehenden Kartenbestand verwendbare Lernkarten. Der gemeinsame Quizpool umfasst 2.725 Fragen inklusive Kursfragen; diese Zahlen sind nicht zu addieren. Gegenüber dem veröffentlichten Ausgangsstand sind dies sechs Kurse, 24 Lektionen, 96 Kursfragen und 96 eigenständig verwendbare Karten zusätzlich. Das Langfristziel gegenüber Waidwissen ist damit nicht erreicht und wird nicht als erfüllt ausgewiesen.
