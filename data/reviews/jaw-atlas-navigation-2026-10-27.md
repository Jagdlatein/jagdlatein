# Kieferatlas: verbindliche Arten- und Vergleichsauswahl

Technische Prüfung am 27. Oktober 2026. Keine neue fachliche Prüfung der Präparate, Zahnformeln oder Arttexte.

## Reproduzierter Ausgangszustand

Der isolierte tatsächliche React-DOM-Renderer für den veröffentlichten Stand `3983e1e0b5787a0e250166cb9fc8962d845bcf13` zeigte bei einer noch nicht bereiten URL für Wolf mit leerer Routerabfrage Rehwild. Die Auswahl war bereits bedienbar und schrieb eine Navigation. Leere, unbekannte und mehrfache Artenangaben wichen ebenfalls auf Rehwild aus. Ein aufbewahrter tatsächlicher Auswahlhandler navigierte noch nach History-Wechsel und echtem Unmount. Der Nachweis liegt außerhalb des Repositories unter `work/wild-year-oct27/audit-jaw-selection-3983e1e.json` im Chat-Arbeitsordner.

## Umsetzung

Der bereite Router bestimmt die Anzeige. `art` muss genau eine bekannte Art sein. `vergleich` darf fehlen oder leer sein; eine ausdrücklich angegebene zweite Art muss bekannt und verschieden von der ersten sein. Ohne Art öffnet sich die bestehende untere Auswahlhilfe. Ausdrücklich fehlerhafte Werte ergeben keine ersatzweise Art, kein Vergleichsmodell und keine zu einer anderen Auswahl gehörende Zahnformel. Der Vergleichswähler erscheint erst nach gültiger Hauptart; im bloßen Einstieg sind deshalb nur die 114 Hauptartenaktionen vorhanden.

Eine Auswahl schreibt einen echten `push`-Verlaufsschritt mit erhaltenem sonstigem URL-Kontext. Beim Hauptartenwechsel bleibt ein tatsächlich angezeigter gültiger Vergleich erhalten, solange er verschieden bleibt; ansonsten wird nur dieses Vergleichsfeld entfernt. Eine angenommene Navigation allein ändert noch keinen Lerninhalt. Erst die tatsächliche URL-Übernahme setzt Auswahl, Ansicht und den gemeinsamen Seitenanfang-Fokus. Derselbe bereits angezeigte Zustand braucht keinen zusätzlichen Verlaufsschritt; er kann eine ältere ausstehende Wahl ausdrücklich ablösen.

Bereitschaft, gesamte Raw-URL einschließlich Hash/Abfrage, konkrete Origin, Anfragefolge und Mounted-Zustand begrenzen Navigationshandler, verspätete Fehler und die Aktivierung eines Präparat-Viewers. Fehler erscheinen nur an ihrer aktuellen Origin. Abbruch, Fehler, History und Unmount schalten keine fremde Art ein. Der zentrale untere Zurück-Verlauf berücksichtigt ausschließlich für `/lernen/kiefer-3d` die konkreten Felder `art` und `vergleich`; Such-/Kontextänderungen bleiben derselbe Stopp.

## Erhaltener Umfang und Grenzen

Alle 114 vorhandenen Arten-/Vergleichseinträge bleiben erhalten. Katalog, Modellnachweise, Urheber, Lizenzen, Zahnformeln, Vergleichsdaten und die beiden vorhandenen Modell-/Vergleichskomponenten behalten ihren exakten Quelltext gegenüber `3983e1e`, abgesehen von normalen Checkout-Zeilenenden. Es wurden keine Modelle, Arttexte oder fachlichen Prüfdaten ergänzt oder neu bewertet. Die sichtbaren Grenzen fehlender Präparate, einzelner Sammlungsobjekte und unterschiedlicher Maßstäbe bleiben bestehen. Externe Viewer werden weiterhin ausschließlich ausdrücklich geöffnet; die lokale Präparatauswahl bleibt beim Modell.

## Prüfung

Neun neue Tests in `scripts/test-jaw-atlas-navigation.cjs` verwenden tatsächliches React-DOM, die reale gemeinsame Schaltflächenauswahl und den Fokus-Hook mit isolierten Router-/Präparat-Doubles sowie einen gesonderten Hook-Renderer für den Zustand vor Effect-Cleanup. Sie prüfen Einstieg/Bereitschaft, alle 114 expliziten Arten einschließlich tatsächlicher Modellverfügbarkeit und Porträtziele, ungültige und widersprüchliche Felder, echten Push/Commit, Fehler/Abbruch, angenommene Navigation vor URL-Commit, Vergleichsbereinigung, aktuelle Neuwahl und eine neuere andere Wahl, Raw-URL-/History-A–B–A-Grenzen bereits vor Cleanup, alte Vieweraktivierung, echte Unmounts und späte Frames. Die Quelltext-Erhaltungsprüfung normalisiert ausschließlich CRLF/LF.

Die bestehenden Modell-/Vergleichstests und der untere Verlauf bleiben aktiv. Alte Assertions zum unerwünschten Rehwild-Ersatz wurden durch ausdrückliche Auswahlhilfe ohne Ersatzfakten ersetzt; Modell-Lizenzen, lokale Präparatwechsel, iframe-Grenzen und Vergleichsmaßstäbe werden nicht abgeschwächt. Ein neuer enger Verlaufstest prüft Hauptart, Vergleich, Suchkontext, nativen History-Rückweg und den unteren Zurück-Pfeil vor dem nächsten Effect.

64 unterschiedliche Fälle in vier Dateien bestanden ohne übersprungene Fälle: die neun neuen Navigationsfälle sowie die bestehenden Modell-, Vergleichs- und globalen Verlaufstests einschließlich der engen neuen Kiefer-Verlaufsprüfung. Eine anfängliche Quelltextprüfung unterschied lediglich CRLF/LF an einer unveränderten Zeile; die endgültige Prüfung normalisiert nur diesen Checkout-Unterschied und lässt alle anderen Zeichen unverändert.

Es wurden keine realen Browsernotizen, Konten, externen Viewer oder kostenpflichtigen Dienste verwendet. DOM-Tests belegen keine Geräteansicht oder angemeldete Produktionsanzeige. Produktionsbuild, Veröffentlichung und tatsächliche Auslieferung werden im Hauptarbeitsabschnitt separat geprüft.
