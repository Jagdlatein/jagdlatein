# Einheitliche Kategorien- und Themenauswahl

Abgeschlossenes technisches Paket vom 27. Oktober 2026 auf Grundlage von `674be0c253d2f64f8a4e6049b70c8bb56ec218e3`. Keine neuen fachlichen Lernbehauptungen, Rechtsfreigaben, Medien oder fachlichen Prüfdaten.

## Verhalten

Die zwölf bestehenden Lernkategorien behalten ihre vertrauten Namen und Reihenfolge. Ihre Unterkategorien verwenden weiterhin kurze Links. Nach einem tatsächlichen Kategorien- oder Themenwechsel beginnt die Lernseite oben. Die Arten- und Rassenporträts verwenden dafür ihren gemeinsamen Themenleser; die einzelnen Lernwerkzeuge rufen die gleiche geschützte Fokussteuerung erst an ihrem vorhandenen Übernahmepunkt auf. Ein fehlgeschlagener Wechsel schaltet weiterhin keinen neuen Lehrtext vorzeitig um.

Alle 31 zuvor nativen Auswahlfelder im unteren Menü sind ausdrücklich durch die gemeinsame kontrollierte Schaltflächenauswahl ersetzt. Die abschließende unabhängige AST-Gegenprobe fand keine verbleibenden nativen Auswahlfelder unter `PageMenu` oder im dort eingebundenen `CommunitySearch`. Es handelt sich um Körperbau, kurze Wiederholung, Community-Filter, Hundeübungsleser, Wildbretfälle, Lebensraum, Kiefervergleich, Hundevideos, Druckkarten, Kurslektion, digitale Karten, Beobachtungsfälle, Prüfungsgespräch, Pflanzen, Revierwissen, Forschung, Revierleben, Spuren und Detailatlas. Die vorhandenen Schaltflächen der Rechtsauswahl und des Wildjahrs blieben unverändert.

Die Auswahl bleibt in der vorhandenen unteren Menüansicht. Es entsteht weder ein zweites Dialogfenster noch eine zusätzliche Suche. Optionsgruppen, gültige leere Werte, numerische Lektionswerte, deaktivierte Einträge, bestehende Fokus-IDs und Abhängigkeiten bleiben erhalten. Auswahlknöpfe sind ausdrücklich `type="button"` und senden keine Such- oder Druckformulare ab. Sie speichern selbst keinen Zustand und lösen ausschließlich den vorhandenen Besitzer-Handler aus.

## Geschützte Bedienung

`useSelectionPageStart` verwaltet je Ansicht einen abbrechbaren Auftrag. Er fokussiert nach Menüfreigabe den semantischen Seitenanfang und setzt die Fensterposition sofort sowie nach dem Layout auf null. Mountstatus, übernommene Ansicht, Bereitschaft, vollständige aktuelle Adresse, Zielknoten und Auftragsidentität schützen vor verspäteten Aktionen. Weitere Navigation oder Bedienung entwertet einen ausstehenden Auftrag. Ein alter abgebrochener Frame kann den neueren Auftrag nicht löschen.

Explizite Quellen-, Quiz-, Fragen-, Handlungs-, Lektions- und Textfassungslinks behalten ihren tatsächlichen Zielabschnitt; erforderliche Details werden weiterhin geöffnet. Der globale Kategorien-Reset nimmt solche Fragmente aus und prüft dies auch in einem schon vorgemerkten Frame. Frageweiter, Bewertung, Wiederholung, Vorlesen, Medien- und Modellsteuerung bleiben lokale Bedienung. Filter und Landschaftsvorlagen behalten ihre bisherigen Zustandsänderungen. Private Journalformulare, Import/Export/Löschen, Verwaltung, Abos und Offlinepakete wurden nicht in eine generische Auswahl umgewandelt.

Beim Kursleser übernimmt erst die tatsächlich geänderte Browseradresse die neue Lektion. Ablehnung oder Fehler belassen den alten Text. Die unabhängige Gegenprüfung fand zusätzlich einen veralteten Menüauftrag nach einem zwischenzeitlichen Quellenaufruf: Er hätte einen späteren direkten Lektionslink fälschlich als Menüwahl behandelt. Der Auftrag ist nun an Index und konkrete Zieladresse gebunden und wird bei einem anderen übernommenen Fragment entwertet. Die genaue Regression sowie drei weitere tatsächliche Lebenszyklusfälle bestehen.

Untergruppen innerhalb des geöffneten Menüs setzen dessen eigenen Scrollbereich zurück. Die Lernseite dahinter wird dabei nicht verschoben. Antworten, Entwürfe, Lernkartenbewertungen, Forschungsrunden und Modellbedienungen behalten ihre bisherigen fachlichen und lokalen Daten.

## Nachweise

Der abschließende gemeinsame Lauf bestand unter Node 22 mit vier parallelen Testprozessen: **617 unterschiedliche Fälle in 61 Testdateien**, keine Fehler, Abbrüche oder übersprungenen Fälle. Die Liste und vollständige Ausgabe liegen außerhalb des Repositories im Chat-Arbeitsordner unter `work/regional-law-qa/tests-oct27-all-category-files.txt` und `tests-oct27-all-category-navigation.txt`. Darin sind tatsächliche React-/DOM-/Portal- und Besitzer-Lebenszyklen, alle Menüwerte und bestehenden Fragen-/Medienprüfungen enthalten. Die endgültige Produktionskompilierung nach der Kurskorrektur erzeugte erfolgreich **509 statische Seiten** (`build-oct27-all-category-navigation-final.txt`). `git diff --check` ist fehlerfrei.

Weitere unabhängige Teilberichte: `nature-menu-navigation-2026-10-27.md`, `research-menu-page-start-2026-10-27.md` und `selection-page-start-group-2026-10-27.md`. Diese Teilzählungen überlappen teilweise; die 617 Fälle des gemeinsamen Laufs sind die maßgebliche eindeutige Abschlusszählung.

Der gesamte fachliche Datenbestand ist unverändert. Die fremde Änderung in `data/learning-expansion-afternoon-2026-10-16.json` blieb unberührt und wird nicht gestagt. SHA256: `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`.

Diese technischen Nachweise sind keine vollständige fachliche Zertifizierung oder authentifizierte Android-/iOS-Geräteprüfung. Die tatsächliche öffentliche Vercel-Auslieferung des Veröffentlichungscommits wird nach dem Push gesondert anhand Versionsauskunft, Startseite, Manifest und eindeutig zugeordneten Ressourcen geprüft und außerhalb des Repositories dokumentiert.
