# Prüfungsplan mit gerätebezogener Wiederholungsübersicht

1. November 2026. Der bestehende persönliche Prüfungsplan erhält eine Übersicht der bereits gespeicherten Wiederholungsantworten. Die zwölf Menü-Kategorien, 51 auswählbaren Prüfungsregionen und bisherigen regionalen Rechtslinks bleiben bestehen. Es gibt keine zusätzliche Ansicht, kein neues Fenster und keine automatische Änderung des Prüfungsziels.

## Was die Zahlen bedeuten

Gezählt werden ausschließlich unterschiedliche, weiterhin im gemeinsamen Wiederholungskatalog vorhandene Fragen mit gültigem lokalem Antwortdatensatz. „Fällig“ folgt genau dem vorhandenen Fälligkeitszeitpunkt einschließlich Gleichheit. „Zuletzt falsch“ bedeutet die vorhandene aktuelle Fehlerkennzeichnung `streak === 0`, nicht die Summe aller früheren Fehlversuche. Eine inzwischen richtig beantwortete Frage bleibt daher nicht wegen eines früheren Fehlers in der Fehlerzahl. Fällige und zuletzt falsche Fragen können dieselben Fragen sein; die Mengen werden nicht als unabhängige Teilmengen zusammengerechnet.

Die Auswertung umfasst den gesamten gültigen Katalog, nicht nur die höchstens acht Fragen einer kurzen Runde. Entfernte oder unbekannte IDs und ungültige gespeicherte Datensätze zählen nicht. Doppelte Katalogbindungen, fremde Kategorien und regionale Rechtsfragen machen einen ungeeigneten Katalog nicht zu einem gültigen Gesamtstand. Prototyp-Eigenschaften eines JavaScript-Objekts sind keine gespeicherten Antworten.

Die Anzeige nennt bewusst keine Prüfungserfolgswahrscheinlichkeit, Vollständigkeitsquote oder Bewertung der praktischen Befähigung. Frühere Kursabschlüsse, Lernkarten und regionale Rechtsübungen werden nicht nachträglich in diese Wiederholungszahlen umgerechnet. Die vorhandene regionale Rechtsauswahl bleibt eigenständig. Es wurden keine Lerntexte, Fragen, richtigen Antworten, Quellen, fachlichen Prüfdaten oder Rechtsfreigaben geändert.

## Verknüpfung und Darstellung

Fällige Wiederholungen und aktuelle Fehler führen mit genauem Modus-/Kategorie-Link zur bestehenden kurzen Runde. Die vorhandenen Kategorie-Lernlinks bleiben jeweils einmal erhalten. Kategorien ohne einen gemeinsamen Wiederholungskatalog erhalten keine erfundenen Nullquoten. Die Gesamtsicht verlinkt zusätzlich zur gemischten kurzen Runde. Nach fehlgeschlagener Anmeldung oder Zugangserneuerung bleibt die gültige Rundenauswahl erhalten; diese gesondert reproduzierte Korrektur ist in `daily-review-return-target-2026-11-01.md` dokumentiert.

Die Übersicht wartet beim ersten HTML-/Hydrationsstand auf den lokalen Lesevorgang. Ein gesperrter oder unlesbarer Speicher ist ein nicht verfügbarer Stand, keine Nullleistung. Änderungen aus anderen Tabs werden aus dem aktuellen Speicher gelesen, nicht aus möglicherweise veralteten Ereigniswerten. Fensterfokus, erneute Sichtbarkeit und ein sichtbarkeitsabhängiger Minutenabgleich aktualisieren den Stand einschließlich neu erreichter Fälligkeiten. Listener und Timer werden beim Unmount entfernt; frühere Katalogkontexte können nach einem Wechsel keinen neuen Stand überschreiben.

## Datenschutz und Datenmenge

Es wird ausschließlich der bestehende Wiederholungsschlüssel gelesen. Die Übersicht schreibt oder löscht nichts und erzeugt weder API-Anfragen noch neue Cookies oder Kontodatensätze. Persönliche Antworten, Zählungen, Zeitpunkte und Geräteverläufe gelangen nicht in URLs oder statische Seitenprops. Deren neuer komprimierter Katalog enthält nur die vorhandenen öffentlichen Fragenkennungen und Kategorien. Die serverseitige Fragebank wird nicht in den Client importiert. Speicherung, Löschung beim Abmelden und vorhandene Zugriffskontrollen bleiben unverändert.

## Prüfung

Eigene Regressionen prüfen Mengen und Fälligkeitsgrenzen, behobene gegenüber offenen Fehlern, unbekannte/entfernte IDs, mehr als eine Rundengröße, doppelte/ungültige Kataloge, geerbte Objektnamen, begrenzte und beschädigte Speicherwerte sowie ausschließlich gültige lokale Übungslinks. Die echte statische Seitenprojektion wird mit dem vorhandenen komprimierten Wiederholungskatalog verglichen; der Next-Clienttransform enthält keine Fragebank oder Rechtsdatenbank. Unabhängige React-/DOM-Lebenszyklustests prüfen den tatsächlichen Prüfungsplan und den neuen lokalen Hook mit isolierten Speichern und Ereignissen. Bestehende Profil-, Plan-, Wiederholungs-, Login- und Zugriffstests werden mit ausgeführt. Alle Versuche verwenden synthetische Gerätespeicher; keine echten lokalen Lerndaten werden ausgelesen.

Die technische Prüfung ist keine fachliche Gesamtprüfung des Curriculums. Eine Veröffentlichung wird erst nach erfolgreichem Produktionsbuild, unabhängiger Gegenprüfung und Prüfung der tatsächlich ausgelieferten Ressourcen als online bezeichnet. Ohne Anmeldung ist eine reguläre Weiterleitung der geschützten Lernseiten kein Nachweis sichtbaren Lehrtexts. Eine Geräte- oder angemeldete Browserprüfung wird nicht behauptet.

Abschließender gemeinsamer Testlauf: 311 unterschiedliche Tests in 20 Dateien, keine Fehler oder übersprungenen Fälle. Darunter sind 38 neue Regressionen: sieben zur Auswertung/Projektion, acht unabhängige echte Hook-/DOM-Lebenszyklen und 23 zu den Rückkehrzielen. Die bestehende Profil-Integrationsprüfung verwendet jetzt auch den wirklichen Katalog und erwartet genau einen gemeinsamen Profil-Listener plus einen eigenen schreibgeschützten Wiederholungs-Listener; Entwurfsschutz, explizites Speichern und unangetastete andere Speicherschlüssel werden weiter geprüft. Der lokale Produktionsbuild erzeugte erfolgreich 510 statische Seiten. Nachweise liegen außerhalb des Repos unter `work/regional-law-qa/tests-nov01-progress-final.txt` und `build-nov01-progress-final.txt` im Chat-Workspace.
