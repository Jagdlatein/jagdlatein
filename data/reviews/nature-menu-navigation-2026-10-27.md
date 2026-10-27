# Auswahl und Seitenanfang der Naturwerkzeuge

Technische Prüfung am 27. Oktober 2026. Keine neue fachliche Prüfung der vorhandenen Lehrtexte.

## Umfang

- Spurenwerkstatt, Pflanzenatlas, Beobachtungswerkstatt, Wildbret-Fallwerkstatt, Lebensraum-Werkstatt und Wildbret-Teilstücke.
- Die bisherigen Auswahlfelder im unteren Menü verwenden die gemeinsame zustandslose `MenuChoice`-Darstellung. Gruppierungen, kontrollierte Werte und vorhandene Auswahlhandler bleiben erhalten. Wildbret-Teilstücke hatte bereits unmittelbare Schaltflächen.
- Die bisherigen Ergebnisanker und URL-Auswahlwerte bleiben gültig. Eine bestätigte Themenwahl setzt die Seite über den gemeinsamen Fokushelfer nach oben, anstatt unter frühere Inhalte zur Ergebnisüberschrift zu scrollen.
- Veraltete oder nach dem Unmount aufbewahrte Auswahlhandler werden vor weiteren Navigationseffekten gesperrt. Eine neue Navigation beendet einen noch ausstehenden Fokusauftrag.

## Bewahrte lokale Bedienung

Pflanzengruppen- und Feldzeichenfilter ändern nur die Menüauswahl. Sie ersetzen den gelesenen Inhalt nicht, schreiben keine URL und lösen keinen Sprung nach oben aus.

In der Lebensraum-Werkstatt bleiben selbst gewählte Bausteine beim Lesen und bei Vor-/Zurück erhalten. Zwei unmittelbar aufeinanderfolgende Auswahlaktionen dürfen weiterhin die neueste Auswahl kombinieren. Eine externe Wiederherstellung entwertet dagegen den früheren Handler. Checkboxen bleiben lokale Modellbedienung; das ausdrückliche Laden einer Lernlandschaft behält den bisherigen Fokus beim Modell.

In der Wildbret-Fallrunde behalten lokale Fragenwechsel und Wiederholungen den Fokus bei der Übung. Antworten, Wiederholung falscher Fälle, eigene Bildmarkierungen und Quellen sind keine Kategorienavigation.

## Nachweise

- 62 bestehende Prüfungen aus sieben unmittelbar betroffenen Testdateien bestanden: `test-field-topic-navigation`, `test-plant-atlas-navigation`, `test-observation-navigation`, `test-game-meat-navigation`, `test-habitat-topic-reader`, `test-venison-photo-controls`, `test-nature-tools`.
- Sechs neue Prüfungen in `test-nature-menu-selection.cjs` führen die echte zustandslose Menükomponente aus. Sie prüfen vorhandene Optionen, bestätigte URL-Übernahme vor Inhalts-/Fokuswechsel, absoluten Seitenanfang, lokale Filter, Fehler, alte Handler, Unmount sowie unveränderte Modell-/Fragenpositionen.
- 28 bestehende gemeinsame Prüfungen aus `test-learning-ui-state.cjs` und `tests/media-experiences.test.cjs` bestanden. Die Adapter betätigen gültige Auswahlwerte über tatsächlich gerenderte Menüschaltflächen. Absichtlich ungültige Eingaben werden weiterhin gegen die ursprüngliche Validierung geprüft. Die Prüfungen für Offlineinhalte, Bilder, Modelle, Fragerunden, tief verlinkte Lektionen und Quellen bleiben erhalten.
- Insgesamt 96 unterschiedliche Prüfungen, keine übersprungen. Die Tests verwenden isolierte Ersatzumgebungen für Browser, Router und flüchtige Zustände; dies ist keine Geräteprüfung.

Die sechs Produktkomponenten ändern keine Wissensdaten, Prüfstände, Fragen, Fotos, Quellen oder persönlichen Speicherformate. Vorhandene fremde Änderungen bleiben unberührt.
