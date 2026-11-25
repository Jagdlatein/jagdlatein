# Artenporträts: tatsächliche Lernkartenzahlen

Am 25. November 2026 wurden ausschliesslich vier Verfügbarkeitswerte in `lib/wildlife-learning-guide.js` berichtigt. Der Guide bleibt eine kleine Metadatenliste; vollständige Kurse, Fragen, Antwortschlüssel oder Lernkarten werden weiterhin nicht in den Browserguide importiert.

## Reproduzierter Vorherstand

Alle 22 vorhandenen Kurs-/Lektionsziele und alle 114 Arten wurden mit den tatsächlichen Karten verglichen. Die Auswahl entspricht der bestehenden Lernkartenroute: `readFlashcardSelection` und `matchesFlashcardSelection` wählen denselben Kurs und gegebenenfalls dieselbe Lektion.

| Ziel | Angegeben | Tatsächliche Karten | Herkunft der Abweichung |
| --- | ---: | ---: | --- |
| alpine |4|6|Bereits auf Git 6101989 falsch |
| birdBody |39|41|Bereits auf Git 6101989 falsch |
| chickens |0|2|Bereits auf Git 6101989 falsch |
| red |0|2|Die heute ergänzten zwei Flehmenfragen ergeben zwei zusätzliche Karten |

Der exakte virtuelle Git-610-Vergleich enthält 1798 Karten, der heutige Inhalt 1800. Das fremde Afternoon-JSON wurde für den Git-Vergleich ausschliesslich virtuell durch dessen Gitbytes ersetzt; die Arbeitsdatei blieb unberührt. Der historische Vergleich ist eine synthetische Read-only-Quellprojektion und keine Aussage über eine Browser- oder Geräteprüfung.

Vor der Korrektur schlug der bestehende positive Deckvergleich bei `gamswild` mit 4 statt 6 fehl (5/6Tests bestanden). Die drei alten Abweichungen und die heutige zusätzliche Abweichung sind getrennt in den externen Vorherdateien dokumentiert.

## Änderung und Grenzen

Die vier Zahlen sind nun 6, 41, 2 und 2. Die vorhandene erste positive Kurs-/Lektionsauswahl findet dadurch bei Rotwild und den vier Hühnerarten bereits vorhandene artbezogene Karten. Kurs-/Lektions-IDs, Kategorien, Querverweise, Texte, Quellennachweise, Prüfdaten, Zugangsgrenzen, Speicher und Filterlogik wurden nicht geändert. Alle übrigen Verfügbarkeitswerte bleiben erhalten. Eine 0 war Verfügbarkeitsmetadatum und keine Sicherheits- oder Zugangssperre.

Es wurden keine neuen Lernkarten, Lehrbehauptungen oder Quellen erfunden. Die Prüfung ist ein technischer Abgleich gegen den vorhandenen Kartenbestand und keine neue fachliche Zertifizierung der Kurse.

## Eng begrenzte historische Fixturepflege

Der bereits vorher rote Ganzobjektvergleich in `test-wildlife-study-lesson-identity.cjs` vergleicht alle 114 Guideobjekte und Kartenlinks gegen 6860695. Nach ausdrücklicher Abstimmung verwendet ausschliesslich dieser historische Vergleich einen benannten Metadatenprojektor. Alle ursprünglichen Ganzobjekt- und Linkassertionen bleiben erhalten; die Testbezeichnung nennt die historische Countprojektion ausdrücklich.

`scripts/helpers/wildlife-guide-counts-nov25.cjs` trennt zwei Phasen:

1. Die vier heutigen Korrekturen werden nur bei exakt den aktuellen Werten auf den Stand von 6101989 zurückprojiziert. Der gesamte resultierende Countblock muss den festgehaltenen SHA256 des veröffentlichten Originals besitzen. Die Array-Variante dient anderen ausdrücklich historischen Guidevergleichen; andere Ziel-/Lektionsbezüge und sämtliche Zusatzfelder bleiben erhalten.
2. Nur für den älteren 686-Vergleich folgt die schon vor 610 veröffentlichte Kette: birdBody 32→34 (25807fe), 34→36 (49b462f), 36→37 (6cb07b1), 37→38 (7d6c08a), 38→39 (6b27f67) und roe 0→2 (74dfb34), jeweils in Gegenrichtung. Der vierte Ringeltaube-Bezug bleibt durch die bisherigen gesonderten Assertions geschützt.

Die Fixture ändert ausschliesslich den Countblock im lokalen aktuellen Guidequelltext. Dadurch berechnen dieselben unveränderten Funktionen auch die historische erste Deckwahl. Sie entfernt keine anderen Felder oder Links, ändert keine Erwartungen und greift nicht in produktive Metadaten ein. Der aktuelle positive 22-Ziele-/114-Arten-Kartenbankvergleich verwendet weiterhin das echte aktuelle Modul ohne Projektion. Regressionen prüfen auch unerwartete Werte, andere Lektionen, unbekannte Zusatzfelder und unveränderte Eingaben.

## Prüfung

- `scripts/test-wildlife-learning-guide.cjs`: 9/9 Tests bestanden, keine übersprungenen Fälle. Alle sechs bisherigen Tests und Assertions bleiben erhalten. Hinzu kommen der echte Kartenroutenfilter für alle 22 Ziele und 114 Arten, die erste artbezogene Deckauswahl und ein vollständiger Git-Quelltextvergleich ausserhalb des genau benannten Metadatenblocks.
- Die Karten-IDs und Zielobjekte im Vorher-/Nachherinventar bleiben abgesehen von den vier Zählwerten identisch. Nachher gibt es keine Abweichung zwischen Metadaten und dem tatsächlichen Filter.
- Vier angrenzende Suiten zusätzlich: nach der unten genau beschriebenen historischen Fixturepflege insgesamt 48/48 Tests bestanden, keine übersprungenen Fälle. Der frühere zusätzliche Lauf mit 46/47 bleibt als Vorherbeleg erhalten.
- Ein erster zusätzlicher Nachbarschaftsaufruf ohne den benötigten DOM-Umgebungspfad konnte diese eine DOM-Suite nicht laden; dieser Diagnoseaufruf ist archiviert. Der anschliessende 46/47-Lauf verwendete den korrekten isolierten DOM-Pfad.

Nachweise ausserhalb des Repos: `work/wildlife-guide-counts-nov25/` mit Vorher-/Nachherinventaren, vollständigen Testereignissen, Originalkopien und Freeze-Manifest. Node 22.23.5; echte Netzaufrufe waren durch den bestehenden Testpreloader gesperrt. Keine echten Benutzer-, Konto- oder Browserdaten wurden verwendet.
