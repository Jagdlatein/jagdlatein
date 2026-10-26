# Sichtbarer Lerninhalt und ergänzende Endquellen

Diese technische Änderung vom 26. Oktober 2026 betrifft ausschließlich `pages/jagdrecht/wildarten.js` und `components/CommunityWeeklyCase.js`. Sie verschiebt vorhandenen Inhalt und vorhandene Nachweise. Es wurden keine fachlichen Aussagen, Quellenadressen, Rechtsstände oder fachlichen Prüfdaten geändert. Dies ist keine neue fachliche Prüfung der Rechtsübersicht oder der Wochenfälle und keine Prüfung sämtlicher Seiten von Jagdlatein.

## Wildarten und Jagdstatus

Die bisherigen Einordnungen, Erläuterungen, Landeshinweise, Statusangaben, Filter, Verlinkungen zu den Artenporträts und Seitenwechsel bleiben unverändert. Die Quellen stehen nicht mehr zwischen dem Inhalt einer Artenkarte und ihrem Lernlink. Ein einziger zunächst geschlossener Quellenbereich folgt nach dem gesamten Abschnitt „So liest du die Übersicht“ am Schluss.

Für jede auf der aktuellen Seite angezeigte Art enthält dieser Bereich einen eindeutig benannten Abschnitt mit den genau zugehörigen Quellen des gewählten Landes. Land, Art und Quellen wechseln weiterhin gemeinsam mit Auswahl und Seitennummer. Die vollständige Liste aller bisherigen amtlichen Quellen bleibt zusätzlich erhalten. Auch bei leerem Filterergebnis bleibt sie verfügbar. Die bisherige Prüfstandsanzeige im unveränderten Trefferstatus wurde ausdrücklich nicht als neuer Rechtsstand umgedeutet.

## Community-Lernfall

Alle bereits vorhandenen `item.facts` sind als vollständiger Lerninhalt sichtbar nach der Frage beziehungsweise ihrer Rückmeldung. Die zugehörige Lerneinheit ist dort direkt verlinkt. Zum Lesen dieser Tatsachen muss weder eine Antwort gegeben noch ein Quellenfenster geöffnet werden. Frage, Antwortauswahl, Rückmeldung, Aussagegrenze, Fallwechsel, Diskussion und bisheriger Wochenhinweis bleiben bestehen.

Der einzige zunächst geschlossene Nachweisbereich steht nach dem bisherigen Schluss-Hinweis. Er enthält alle bisherigen Fachquellen und das unveränderte tatsächliche Prüfdatum. Der Foto-Kontext bleibt als Bildunterschrift sichtbar. Autor, Lizenzbezeichnung, Lizenzadresse und Originalbildnachweis sind vollständig im Nachweisbereich erhalten; `aria-describedby` verbindet das gezeigte Foto ausdrücklich mit genau dieser Urheber- und Lizenzangabe. Es werden weder neue Bilder noch neue Medienbehauptungen eingeführt.

## Überprüfung und Grenzen

Vier neue unterschiedliche Regressionen in `scripts/test-final-learning-sources.cjs` bestanden ohne übersprungene Fälle. Zwei verwenden die tatsächliche serverseitige React-Ausgabe; zwei verwenden echte ReactDOM-Zustandswechsel und Effekte mit lokalen Daten. Geprüft wurden alle Katalogseiten für Deutschland, Österreich und die Schweiz einschließlich artgenauer Quellenzuordnung, der Wolf-Direktlink und eine leere Kombination sowie alle neun Wochenfälle mit sichtbaren vollständigen Texten, richtiger Rückmeldung, Fotozuordnung und Diskussionstarget. Die Quellen bleiben dabei geschlossen und jeweils das letzte Inhaltselement der betroffenen Seite beziehungsweise des Lernfalls.

Die gesamten Bestandsdateien `test-dach-wildlife.cjs` und `test-knowledge-expansion-oct13.cjs` wurden zusätzlich ausgeführt. Zusammen mit den vier neuen Fällen bestanden zunächst 14 von 15 Fällen. Der einzelne Fehler war eine schon vorher veraltete Anzahl in der vom Umbau nicht berührten Discovery-Liste. Ein unabhängiger Speicher-Loader las den tatsächlichen veröffentlichten HEAD `e8a23102c0221526fcaf3d6bbc8c76104b8edf20` samt importierten Daten direkt aus Git: Er enthält bereits 26 Einträge, nach Ausschluss von „Wissen fürs Revier“ 25, einschließlich der später hinzugefügten Videothek. Nur diese veraltete Erwartung wurde von 24 auf 25 präzisiert; alle eigentlichen Pfad- und Discoveryprüfungen bleiben erhalten. Anschließend wurde ausschließlich der betroffene Fall erneut ausgeführt und bestand. Damit sind alle 15 unterschiedlichen Fälle grün. Die vorhandenen Community-Tests für Rückmeldung, Moderation, Anmeldung und Schweizer Wochen-/Sommerzeitwechsel sowie alle vier Wildarten-Bestandstests bestanden bereits im ersten Durchlauf. Der unabhängige Baselinebeleg liegt außerhalb des Repositories unter `work/regional-law-qa/discovery-baseline-count-2026-10-26.json`.

Die DOM-Prüfungen sind keine visuelle Prüfung auf einem realen Telefon. Es wurden keine persönlichen Antworten oder Kontodaten gelesen, keine Nachricht versendet und keine Cloudänderung vorgenommen. Andere noch bestehende obere Auswahlfelder oder Navigationszustände dieser Komponenten wurden in diesem engen Quellenpaket nicht umgebaut.
