# Wissen fürs Revier und unteres Zurück-Menü

Technischer Bedienungsabgleich am 24. Oktober 2026. Keine Neudatierung der vorhandenen Forschungsdossiers oder ihrer Fragen. Die getrennte neue Rotwild-Lektion und ihre fachlichen Nachweise stehen in `red-deer-voice-2026-10-24.md`.

## Konkrete Verbesserungen

- `ResearchForPractice` wartet auf die bereite URL. Der bisherige erste Einstieg ohne Parameter bleibt erhalten. Ausdrücklich unbekannte, leere oder mehrfach angegebene Themen zeigen eine Auswahlhilfe statt eines fremden Dossiers mit dessen Fragen.
- Die Themenwahl liegt ausschließlich im bestehenden unteren Menü. Ein bestätigter Themenwechsel erzeugt einen echten URL-Verlaufsschritt und übernimmt vorhandene Kontextparameter. Vor der URL-Übernahme bleibt das bisherige Dossier mit seiner laufenden Fragerunde montiert.
- Nach der Übernahme wird der passende Inhalt fokussiert und das Menü geschlossen. Alte Ziele zu Inhalt, Praxisableitung, Befunden und Grenzen bleiben erhalten. `#revierwissen-fragen` und `#revierwissen-praxischeck` fokussieren ausdrücklich die Überschrift der lokalen Übung; die davor stehende Einladung zum separaten Ranglistenquiz ist nicht das Fokusziel.
- Fehlgeschlagene Wechsel behalten Text, Adresse und Antworten und bieten erneute Auswahl an. Abgebrochene, überholte oder nach dem Verlassen endende Anfragen dürfen keine alte Fehlermeldung öffnen. Die Ursprungsidentität berücksichtigt auch Kontext- und Hashänderungen sowie den Verlauf weg und zurück zur identischen Adresse.
- Erneute Wahl des aktuellen Themas und reine Abschnittswechsel erhalten den Typ, Schlüssel und Elternpfad der bestehenden Fragerunde. Nur ein tatsächlicher Themenwechsel montiert die passende neue lokale Runde.

## Zusätzlich gefundener zentraler Zurück-Fehler

Die Werkzeuge konnten bereits einzelne Themen in die Browserhistorie schreiben. Das untere Zurück-Menü führte jedoch eine eigene, nach Pfad zusammengefasste Liste und übersprang dabei diese Themen. Beispiel: Rehwild-Frühling → Wildkameras → unten Zurück führte zum Lernbereich statt zum vorherigen Dossier. Dieser Unterschied wurde vor der Änderung unabhängig mit der vorhandenen Navigations-Fixture reproduziert.

Das untere Menü unterscheidet jetzt die konkret verwendeten Themen-/Modusfelder von zehn bereits umgestellten Werkzeugen: Spurenwerkstatt, Wildbretstücke, Pflanzenatlas, Beobachtungswerkstatt, Wildbretfälle, Forschung verstehen, kleines Revierleben, Wildtierdetails, Jagdhundvideos und Wissen fürs Revier. Fall, Motiv, Jahreszeit und Lesemodus sind dadurch eigene Rückkehrschritte. Sucheingaben, Kontextparameter und bloße Parameterumordnung bleiben innerhalb des ausgewählten Themas zusammengefasst. Wiederhergestellte bekannte Verlaufseinträge werden wie bei der bestehenden Rechts-/Porträtnavigation gekürzt, damit Zurück nicht in das gerade verlassene Thema zurückspringt.

Keine allgemeine Regel „jede Query ist ein neuer Schritt“ eingeführt. Konto-, Zahlungs-, Rechts- und Suchabläufe sowie die vorhandene Porträt-/Lebensraum-Hashnavigation behalten ihre bisherigen Regeln.

## Bewahrter Inhalt

Die drei Dossiers, ihre vorhandenen Texte, die 60 Fragen mit drei Interaktionsformaten, acht Fragen je Runde, Antwortrotation, Wiederholung unsicherer Fragen, zwei vorbereitete lizenzierte Fotos, Bildnachweise und abschließende Fachquellen bleiben unverändert. Fachlicher Dossierstand weiterhin 15.10.2026, Fragenstand 16.10.2026. Die lokale Fragerunde erhält keine Ranglistenbuchung. Die neue Rotwild-Lektion hat einen ausdrücklich getrennten Prüfstand.

## Prüfung und Grenzen

- Neuer Navigationsschutz mit neun gezielten Regressionen: bereite/ungültige URL, alle Dossiers und Fragenpools, verzögerte Übernahme, Kontext, Fokus, Hashwechsel, Fehler, Abbruch, Unmount, überholte Ursprünge und aktuelle Auswahl während einer laufenden Navigation.
- Sechs unabhängig ergänzte Kontinuitätstests führen die unveränderte echte `ResearchQuestionRound` mit ihren Hooks, Reducer und Bedien-Callbacks aus. Einzelantwort sowie offene Mehrfach-/Reihenfolgeauswahl überstehen Pending, Fehler und erneute aktuelle Wahl. Ein lokaler Reconciliation-Harness kontrolliert Elternpfad, Elementtyp und Schlüssel; dies ist keine Browser- oder Geräteprüfung.
- Zwei neue zentrale Verlaufstests nutzen vorhandene Themen-IDs aus allen zehn Werkzeugen und prüfen außerdem Such-/Kontextänderungen, Parameterumordnung, sofortiges Zurück vor dem nächsten Effekt sowie wiederhergestellten Verlauf. Der zentrale Diff und seine Feldsätze wurden unabhängig gegen die tatsächlich lesenden/pushenden Komponenten geprüft.
- Bestehende Tests wurden gezielt an Hooks und `push` angepasst. Eine bereits zuvor veraltete Erwartung eines oberen Suchlinks auf der Tagesfallseite wurde auf den vorhandenen reduzierten Kopf präzisiert. Kein oberer Navigationsbalken wieder eingeführt.
- Abschließender gemeinsamer Lauf: **172 Tests bestanden, 0 fehlgeschlagen**. Enthalten sind die betroffenen Lernwerkzeuge, das untere Menü, der Reviermoment, tatsächliche Frageninteraktionen und die getrennte neue Rotwild-/bestehende Hundeintegration. Tests ersetzen keinen fachlichen Quellenabgleich.
- Vollständige lokale Produktions-Erstellung und wirkliche Vercel-Auslieferung werden zusätzlich kontrolliert; ein Git-Push allein ist kein Auslieferungsnachweis. Für diesen Abschnitt wurde kein Browserinventar oder Desktopzugriff nachträglich umgangen.
- Die vollständige lokale Produktions-Erstellung mit Next.js 15.5.24 ist erfolgreich abgeschlossen: **507 statische Seiten**, keine Kompilierungs- oder Typfehler. Die zusätzliche Kursseite gehört zur gesondert belegten Rotwild-Lektion. Die anschließende Live-Auslieferung wird außerhalb des Repos protokolliert.

Nicht Teil dieser Lieferung: WildYear speichert seine lokale Arten-/Monatswahl noch nicht durchgehend in der URL; Wildtier-Videofälle haben weitere lokale Auswahl-/Verlaufsgrenzen. Beide wurden als getrennte nächste Pakete dokumentiert, statt ihren Zustand hier als erledigt auszugeben.
