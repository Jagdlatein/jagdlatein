# Kategorien, kurze Auswahl und zentrale Suche

## Auftrag und Umfang

Die vorhandenen zwölf Lernkategorien sollen im unteren Menü, im Lernbereich, im Quiz und in „Meine Kurse“ dieselben Namen und dieselbe Reihenfolge haben. Unterkategorien verwenden kurze Stichworte. Weitere Auswahlseiten entfallen, soweit die Auswahl direkt aufklappbar ist. Die gemeinsame Lernsuche steht vor den Kategorien am Anfang von `/lernen`; die zwölf Kategorieseiten wiederholen das Suchfeld nicht. Der untere Suchzugang führt weiter zur zentralen Suche.

## Umsetzung

- Die kanonische Liste in `learning-categories.js` bleibt unverändert. Quiz und persönliche Kursfilter verwenden diese Liste; vorhandene Altkategorien bleiben in historischen Kursdaten auffindbar.
- 27 der vorhandenen 63 Zweigbezeichnungen wurden ausschließlich als Navigationsbeschriftung verkürzt. IDs, Reihenfolge und Kurszuordnung bleiben erhalten.
- Für alle 198 bestehenden Kurse gibt es eigene kurze Navigationsbeschriftungen. Die vollständigen verfassten Kurstitel bleiben im Kurs, in der Suche und in den Lerninhalten erhalten. Beschriftungen sind innerhalb ihres Zweigs eindeutig; unbekannte Kurse behalten ihren vollständigen Titel.
- Ein Zweig zeigt native Kurs-Aufklapper mit den unveränderten direkten Lektionslinks. Eine zusätzliche Kurs-Auswahlseite wird nicht mehr erzeugt. Bereits gespeicherte `bereich`-/`kurs`-Links öffnen weiterhin den zugehörigen Aufklapper.
- Alte engere Quizthemen bleiben mit ihren exakten Fragenpools und Startlinks verfügbar. Sie erscheinen als Teilthema ihrer sichtbaren Kategorie. „Ganze Kategorie“ wechselt ausdrücklich in deren umfassenderen Pool. Die Rechtsfragen behalten ihre eigene Länderwahl.
- Die gemeinsame Navigation setzt neue Kategorie-, Zweig- und Rechtsregion-Auswahlen nach einem übernommenen, bereiten Routenwechsel ganz nach oben. Suchtext, reine Hashänderungen und lokale Aufklapper erzeugen keinen zusätzlichen Kategorienwechsel. Gewöhnliche Kurslektionen behalten ihre eigene Zielnavigation.
- Ein noch nicht ausgeführter Scrollauftrag wird bei einem weiteren URL-Commit oder Effect-Neustart erneut eingeplant; veraltete Aufträge und Unmounts dürfen keine andere Seite verschieben.

## Prüfung

Die Regressionen führen die tatsächlichen Komponenten und Helfer aus. Geprüft werden die zwölf kanonischen Auswahlreihenfolgen, alle unterstützten alten Quizteilthemen samt exakten Pools, die lokale Erweiterung auf die ganze Kategorie, alle alten Kursauswahlen und Lektionsziele sowie eine einzige zentrale Suche vor den Kategorien. Die unabhängige Prüfung kontrollierte zusätzlich den unveränderten Kursdaten- und Fragenbestand.

Eine unabhängige Scrollsuite trennt Render, übernommenen DOM-/URL-Stand, Effect-Cleanup und Browserframe. Sie prüft Routerbereitschaft, schnelle Wechsel, Rückkehr vor Ausführung, verspätete Aufträge, Such-/Hash-Commits, Effect-Neustart, Unmount und den Timer-Ersatzweg. Die bestehende Prüfung des unteren Menüs bleibt erhalten. Das sind isolierte Komponenten-/DOM-Prüfungen; eine visuelle Prüfung auf einem physischen Telefon wurde nicht durchgeführt.

Die Änderung enthält keine neue fachliche Aussage, keine neue Kategorie und keine Änderung fachlicher Prüfdaten. Sie verändert keine Konten, Zahlungen, gespeicherten Lernfortschritte oder persönlichen Notizen. Der fremde Stand in `learning-expansion-afternoon-2026-10-16.json` ist nicht Teil dieser Lieferung.

Der abschließende lokale Lauf bestand 552 unterschiedliche passende Tests ohne übersprungene Fälle. Der Produktionsbuild erzeugte erfolgreich 509 statische Seiten. Diese technischen Ergebnisse sind keine fachliche Neuprüfung des Gesamtbestands und keine visuelle Geräteprüfung.
