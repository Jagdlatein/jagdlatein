# Wildjahr: nächster Monat

Technische Inhaltsprojektion am 27. Oktober 2026; keine neue fachliche Prüfung oder Änderung der biologischen Ausgangsaussagen.

## Nutzen und Grenzen

Die bestehende Arten- und Monatsauswahl kann unmittelbar zeigen, welche hinterlegten Phasen im nächsten Monat anders zugeordnet sind. Die Ergänzung braucht keine weitere Auswahl, kein Fenster, keine neue Route und keinen Speicher. Sie vergleicht die vier vorhandenen Felder derselben Art; unterschiedliche Funktionen verschiedener Arten werden nicht gleichgesetzt.

`getWildYearTransition` akzeptiert nur eine ausdrücklich vorhandene Art mit detailliertem Monatskalender und einen ganzzahligen Monat von 1 bis 12. Die Validierung erfolgt vor dem historischen Profilhelfer, damit unbekannte Angaben nicht dessen Gams-/Januar-Ersatz erhalten.

Angezeigt werden ausschließlich Felder mit einer anderen gespeicherten Phasen-ID. Der Titel der bisherigen Phase und der vollständige unveränderte Text der nächsten Phase bleiben direkt sichtbar. Die Behauptungen, IDs und Quellenzuordnungen stammen aus den ursprünglichen Phasenobjekten. Es werden keine neuen Zeiten, Zahlen oder biologischen Schlussfolgerungen berechnet.

Bei unveränderten Zuordnungen spricht die Oberfläche ausdrücklich vom Modell. Sie behauptet keinen Stillstand in der Natur. Dezember und Januar werden ausdrücklich als benachbarte Monate eines wiederkehrenden Jahresmodells eingeordnet; es wird kein konkretes Folgejahr erfunden. Die allgemeinen Modellgrenzen bleiben beim vorhandenen Wildjahrtext.

## Belege und Darstellung

Die neue Komponente enthält keine Quellenlinks zwischen den Lerntexten. Alle verwendeten nächsten Phasen gehören bereits zum vollständigen Phasenkatalog im abschließenden geschlossenen Quellenbereich des Elternwerkzeugs. Die Einbindung bleibt Aufgabe dieses Elternwerkzeugs; die Ergänzung verändert dessen Navigation und Fokus nicht selbst.

## Technische Prüfung

Fünf neue Tests in `scripts/test-wild-year-next-month.cjs` bestehen:

- Alle 32 vorhandenen Monatskalender und 384 benachbarten Monatspaare: genaue Zuordnung, Feldbezeichnungen, ursprüngliche Objektidentität, Text und Quellen-IDs; Ausgangsdaten bleiben unverändert.
- Tatsächlicher Komponenteninhalt: nur geänderte Felder, vollständige nächste Erklärung, bewusste Modellgrenze und keine Bedienelemente, zusätzlichen Fenster, Fotos oder Quellenlinks.
- Dezember/Januar bei allen Arten, einschließlich unveränderter Phasen.
- Fehlende, unbekannte, wiederholte und ungültige Eingaben sowie reine Artenüberblicke liefern keinen erfundenen Ersatzinhalt.
- Identisches Markup aus derselben validierten Auswahl ohne Browserzustand oder Systemzeit.

Im aktuellen Datenbestand ändern sich bei 137 Monatspaaren mindestens eine hinterlegte Phase; bei 247 bleiben die Zuordnungen gleich. Das sind Eigenschaften des vorhandenen Modells, keine Messwerte aus Wildtierbeobachtungen. Die Tests bestätigen keine vollständige fachliche oder regionale Prüfungsabdeckung.

## Abgeschlossene Einbindung

Das Elternwerkzeug zeigt die Monatsvorschau unmittelbar nach den sichtbaren Modellgrenzen, vor Jahresübersicht und Übung. Die Nachweise jeder nächsten Phase stehen genau einmal im vorhandenen geschlossenen Quellenbereich am Schluss; dessen Hinweis nennt nun auch die Monatsvorschau. Vier zusätzliche Integrationsfälle in `scripts/test-wild-year-growth-integration.cjs` prüfen alle 384 tatsächlichen Elternansichten, die genaue Quellenzuordnung, Anzeige erst nach URL-Übernahme, Fehler und History, unterdrückten Ersatzinhalt sowie eigene Suchbegriffe für die beiden ergänzten Arten.

Der gemeinsame Abschlusslauf bestand 191 unterschiedliche Tests in 22 Dateien ohne übersprungene Fälle. Der vollständige Produktionsbuild mit 509 Seiten wurde erfolgreich abgeschlossen. Fachliche Gegenprüfung der neuen Kalender und unabhängige technische Gegenprüfung der Projektion erfolgten getrennt. Protokolle außerhalb des Repositories: `work/regional-law-qa/tests-oct27-learning-growth.txt` und `build-oct27-learning-growth.txt` im Chat-Arbeitsordner. Diese Prüfungen sind kein Nachweis einer angemeldeten Geräteansicht oder vollständiger Prüfungsabdeckung; die tatsächliche Produktionsauslieferung wird nach Veröffentlichung zusätzlich kontrolliert.
