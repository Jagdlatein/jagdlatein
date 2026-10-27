# Wildjahr: Artenauswahl, Jahresübersicht und Kalenderübung

Abgeschlossenes lokales Veröffentlichungspaket vom 27. Oktober 2026, aufbauend auf `c27c76483e26102a073070d0ddcdf3021d520fdf`.

## Ergebnis

- Der Einstieg ohne Art öffnet die bestehende untere Artenauswahl. Serverdarstellung und erste Clientdarstellung wählen keine Gämse mehr. Ausdrückliche alte Artenlinks einschließlich Gams bleiben gültig; ein allein angegebener gültiger Monat bleibt erhalten.
- Eine zwölfmonatige Übersicht projiziert die vorhandenen Phasen zu Fortpflanzung und Verhalten. Monatswechsel verwenden die bestehende verbindliche URL, echte Verlaufsschritte und Fokus nach tatsächlicher Übernahme. Fehlgeschlagene Wechsel ändern den gelesenen Inhalt nicht.
- Eigene Kalenderübungen fragen ausschließlich das Lesen der verfassten Modelle ab. Antworten, Erklärungen und sichtbare Einschränkungen kommen aus diesen Daten. Fehlerwiederholung und Neustart bleiben lokal im Arbeitsspeicher. Es gibt keine Ranglistenpunkte, Speicherung persönlicher Angaben oder Behauptung eines amtlichen Fragenkatalogs.
- Biber, Hermelin, Iltis und Nutria ergänzen vier fachlich eng geprüfte Monatskalender. Der Bestand umfasst weiterhin 114 Arten- und Vergleichseinträge: nun 30 Monatskalender mit 360 Monatsansichten sowie 32 Jahres- und 52 Artenübersichten. Die übrigen Einträge erhalten keine erfundenen Monatsphasen.
- Ergänzende Nachweise bleiben geschlossen am Ende. Dort sind auch die Phasen der Jahresübersicht und sämtliche angebotenen Übungsalternativen konkret belegt. Wesentliche Grenzen bleiben direkt beim Lerninhalt sichtbar.

## Fachliche und unabhängige Gegenprüfung

Die zwölf tatsächlich gelesenen Quellen und 25 neuen Wissensblöcke der vier ergänzten Arten sind in `wild-year-mammals-followup-2026-10-27.md` zugeordnet. Autor, Hauptbearbeiter und unabhängiger Gegenprüfer haben die engen Aussagen abgeglichen. Regionale und saisonale Abweichungen werden beschrieben; weder Jagdbarkeit noch Jagdzeiten werden aus den biologischen Bändern abgeleitet. Bestehende betroffene Arten- und Vertiefungstexte wurden auf Widersprüche betrachtet. Es wurden keine neuen Fotos oder Videos eingeführt.

`wild-year-overview-practice-2026-10-27.md` dokumentiert die unabhängige technische Gegenprüfung: unveränderte alte 26 Profile und ihre Quellen, echte ausgehende Navigation, alle 114 Auswahlen, Lebenszeitgrenzen sowie die Nachweise für 268 tatsächlich angebotene Antwortmöglichkeiten. Ein dabei reproduzierter verspäteter Fokuseffekt wurde behoben und durch die genaue Regression abgesichert. Der Autorbericht zur Übung steht in `wild-year-practice-2026-10-27.md`.

## Abschließende lokale Prüfung

Unter Node 22 bestanden 192 unterschiedliche Fälle in 22 passenden Testdateien, ohne Fehler, Abbruch oder übersprungene Fälle. Die vollständige Produktionskompilierung erzeugte erfolgreich 509 statische Seiten. Zusätzlich ist `git diff --check` fehlerfrei. Die externen vollständigen Protokolle liegen im Chat-Arbeitsordner unter `work/regional-law-qa/tests-oct27-wildyear-next-final.txt` und `build-oct27-wildyear-next-final.txt`.

Die fremde Änderung in `data/learning-expansion-afternoon-2026-10-16.json` blieb unberührt und wird nicht mitgestagt. Ihr SHA256 ist unverändert `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`.

Dieser Bericht bestätigt lokale Tests und fachliche Teilprüfungen, keine vollständige fachliche Zertifizierung, authentifizierte Produktions-Lehrtextansicht oder Geräteprüfung. Die tatsächliche Vercel-Auslieferung des resultierenden Commits wird nach dem Push gesondert über öffentliche Versionsauskunft, Startseite, Manifest und Ressourcen geprüft und außerhalb des Repositories dokumentiert. Der regionale Rechtskatalog und Benutzer-/Zahlungsdaten sind unverändert.
