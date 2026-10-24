# Jagdhundvideos: verbindliche Auswahl und geschützte Beobachtungsfragen

Technische Prüfung am 24. Oktober 2026. Die fachlichen Texte, vier Filme, Poster, deutschen Untertitel, Handlungstexte, Mediennachweise und der vorhandene fachliche Prüfstand vom 12. Oktober bleiben unverändert. Diese Navigationsprüfung ist keine neue fachliche Gesamtprüfung.

## Auswahl und Verlauf

Die bereite Routeradresse bestimmt die Szene. Ohne `eintrag` bleibt der dokumentierte erste Einstieg erhalten; leere, unbekannte oder mehrfach angegebene Werte zeigen die Auswahlhilfe statt eines fremden Films. Ein noch nicht bereiter Router zeigt keinen beliebigen Film. Die vorhandene Auswahl bleibt im unteren Seitenmenü.

Ein Szenenwechsel schreibt einen eigenen Verlaufsschritt und übernimmt den Text erst nach der tatsächlichen Adressänderung. Der vollständige URL-Kontext einschließlich roher Parameter und Hash erhält eine eigene Identität, auch bei einem Verlauf weg und zurück zur gleichen Szene. Ausstehende, abgebrochene, überholte oder nach dem Verlassen abgeschlossene Aktionen dürfen die neue Ansicht nicht verändern. Eine erneute Wahl der schon angezeigten Szene erzeugt keinen unnötigen Verlaufsschritt; sie kann aber einen anderen ausstehenden Wechsel ersetzen.

Die alten Ziele `hundevideo-film` und `hundevideo-handlung` bleiben erhalten. Das Auswahlziel öffnet die Auswahl im unteren Menü. Der Fokus folgt der übernommenen Routeradresse, nicht einem möglicherweise veralteten globalen Hash.

## Film und lokale Fragen

Ein Kontextwechsel oder Verlassen pausiert den erfassten bisherigen Player. Lokale Antwortwechsel ersetzen den Player nicht. Die Wiedergabe startet weiterhin ausschließlich durch die Nutzerin oder den Nutzer; `controls`, `playsInline` und `preload="none"` bleiben erhalten. Überholte Video- und Quellenfehler können keine Fehlermeldung in eine andere Ansicht schreiben.

Die Beobachtungsfragen erhalten eigene Lebenszeit-, Frageobjekt- und Ansichtsschranken. Ein früher gespeicherter Radiohandler darf nach einem Fragewechsel, Kontextwechsel oder Unmount keinen Zustand mehr schreiben. Beim unveränderten Frageobjekt bleibt eine aktuelle Antwort erhalten und revidierbar. Bereits vorhandene Szenenschlüssel trennen Fragen verschiedener Filme; eine zuvor nicht nachgewiesene Antwortübertragung zwischen Filmen wird daraus nicht behauptet.

## Nachweise

- Der bestehende Navigationstest wurde gezielt korrigiert: Seine früheren Erwartungen für ungültige und noch unbereite Adressen hatten den unbeabsichtigten ersten Film bestätigt.
- Zehn unabhängige neue Parentregressionen prüfen URL-Validierung, History, Raw-Kontext, Pending-/Origin-/Unmount-Grenzen, Fehler, Fokus und den konkreten Player. Alle vier Medien- und Inhaltsobjekte werden unverändert verglichen.
- Fünf unabhängige Kinderfragenregressionen führen die echte Komponente mit eigenem Hook-Lebenszyklus aus. Sie prüfen alle acht bestehenden Fragen einschließlich richtiger, falscher und revidierter Antworten sowie veralteter Handler vor und nach einem erneuten Render.
- Zwei bereits vorher fehlschlagende Erwartungen in `test-daily-review-loading.cjs` und `test-flashcard-selection.cjs` wurden am bestehenden unteren Menüvertrag geprüft und eng aktualisiert. Ein Lauf mit den unveränderten Tests und den betroffenen Komponenten direkt aus HEAD `4f4d5e3` reproduzierte dieselben zwei Fehler. Die Tests verlangen nun die tatsächlichen Such-, Lektions-, Druck- und Rückwege am unteren Menü beziehungsweise an den echten PageMenu-Portalen; es wurde dafür keine Produktnavigation verändert.
- Die vorhandenen Video-, Medien- und Lernoberflächentests werden zusätzlich ausgeführt. Ein Produktionsbuild und die tatsächlich veröffentlichte Auslieferung werden getrennt dokumentiert.

Dies ist eine automatisierte Komponenten- und Auslieferungsprüfung. Eine visuelle Prüfung auf physischen iOS- oder Android-Geräten wird nicht behauptet.

Der abschließende gemeinsame Lauf bestand mit **244 unterschiedlichen Tests, ohne übersprungene Fälle**. Er umfasst die drei Jagdhundvideo-Dateien, Video-/Medien-/Lernoberflächenprüfungen sowie die betroffenen Quellen-, Karten-, Online-/Offline- und unteren Navigationswege. Der lokale Produktionsbuild erstellte erfolgreich **509 statische Seiten**. Die öffentliche Auslieferungsprüfung wird außerhalb des Repositorys unter `work/regional-law-qa/release-oct24-ninth.json` dokumentiert; sie ersetzt keinen authentifizierten Gerätetest.
