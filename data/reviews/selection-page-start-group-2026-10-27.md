# Einfache Themenwahl und Seitenanfang: fünf Lernwerkzeuge

Technische Prüfung am 27. Oktober 2026. Dieser Bericht bezeichnet keine neue fachliche Prüfung der Lerninhalte.

## Abgegrenzte Änderung

- `AnatomyExplorer`, `DailyReview`, `DogTrainingJournal` und `OralExamTrainer` verwenden für ihre insgesamt sechs unteren Themen-/Runden-/Fragenauswahlen die gemeinsame `MenuChoice`-Darstellung mit unmittelbar sichtbaren Schaltflächen. `WildlifeVideoCases` hatte bereits eine Fallwahl mit Schaltflächen.
- Normale übernommene Auswahländerungen verwenden die gemeinsame Seitenanfang-Fokussierung. Neue zulässige Navigationsaktionen beenden zuerst eine noch ausstehende Seitenanfang-Korrektur. Die bestehenden URL-, Bereitschafts-, Commit-, Fehler-, Origin- und Unmount-Grenzen bleiben beim jeweiligen Werkzeug.
- Das ausdrückliche Anatomie-Fragenziel öffnet weiterhin seine konkrete Übung. Die Video-Textfassung öffnet weiterhin das echte `details`-Element und fokussiert es. Beim Prüfungsgespräch gehen Menüwahlen zum Seitenanfang; „Nächste Frage“, Rundenneustart, Wiederholung und Abschluss behalten den Übungsfokus. Dazu wird die Fokusabsicht der konkreten Navigationsoperation mit ihrer tatsächlichen URL-Übernahme verbunden.
- Trainingsentwurf, Notizfilter, gespeicherte Einträge, Import/Export und alle eigentlichen Formulare sind unverändert. Die innere Fünf-Minuten-Runde behält ihren lokalen Fragenfokus. Kamera, Modellbewegung, Wiedergabe und Antwortsteuerung werden nicht zu Menüauswahlen umgebaut.

## Nachweise

170 bestehende Tests in 14 Dateien bestanden ohne übersprungene Fälle: Anatomie-Navigation/Menü/Lesen/Viewer/Script-Retry; Journal-Navigation/Lebenszyklus; Prüfungsgespräch-Navigation/Runden/Sprache; tägliche Wiederholung/Datenladen/Navigieren sowie bestehende Praxistools und Videofall-Navigation. Bestehende Assertions wurden nur an den tatsächlichen Auswahlort bzw. das neue Seitenanfang-Verhalten angepasst; Bereitschaft, Inhaltserhalt, echte ausgehende URL-Schritte, Fehler, History, veraltete Callbacks, Unmount und Datensicherung bleiben geprüft.

`scripts/test-selection-page-start-group.cjs` ergänzt sechs Tests mit tatsächlichem React-DOM, der tatsächlichen `MenuChoice` und dem gemeinsamen Fokus-Hook in allen fünf Besitzern. Sie prüfen sichtbare Schaltflächen statt verschachtelter Auswahlfenster, keine Inhalts-/Fokusumschaltung vor der URL-Übernahme, Seitenanfang nach Übernahme, abgelehnte Navigation, alte Callbacks und ausstehende Fokusframes nach Unmount. Gesonderte Prüfungen erhalten Anatomie-Fragenanker, tatsächlich geöffnete Video-Textfassung und den Unterschied zwischen Themenmenü und bewerteter nächster Gesprächsfrage.

Die Fixtures verwenden ausschließlich synthetische Router-, Speicher-, Netzwerk- und Medien-Doubles. Es wurden keine persönlichen Browsernotizen oder fremden gespeicherten Nutzerdaten gelesen oder geändert. Die DOM-Prüfungen bestätigen keine reale Geräteprüfung oder angemeldete Produktionsansicht. Veröffentlichung und tatsächliche Auslieferung werden vom Hauptarbeitsabschnitt separat geprüft.

## Unabhängige gemeinsame Prüfung

`scripts/test-menu-choice-page-start.cjs` prüft zusätzlich neun Fälle im tatsächlichen React-DOM: 31 Optionen einschließlich Gruppen und Fragmenten in unveränderter Reihenfolge; numerische Null und zulässige leere Auswahl; unterdrückte gesperrte leere Anweisung; einzelne, gruppenweise und vollständige Sperrung; kontrollierte Auswahl ohne vorweggenommene Markierung; keine Formularübermittlung; keine automatische Markierung durch Array-/Objektumwandlung und erhaltene ARIA-Verknüpfungen. Der gemeinsame Fokus-Hook wird auf semantische Seitenüberschrift, ausdrückliche Anker, Scope/Bereitschaft/Unmount, geänderte echte Browseradresse ohne React-Neuzeichnung, entferntes Ziel, vier DOM-Interaktionsarten, alte gegen neue Frame-Tickets und abbrechbaren Timeout-Ersatz geprüft. Die Ereignisse sind DOM-Simulationen, keine Behauptung physischer Eingaben.

Die gemeinsame CSS-Darstellung wurde unabhängig im Code geprüft: unmittelbar sichtbare Schaltflächen, mindestens 48 Pixel Mindesthöhe, umbrechende Bezeichnungen, zwei flexible Spalten und eine Spalte unter 361 Pixeln; sichtbarer Tastaturfokus und gesonderter gedrückter Zustand. Das ist eine Struktur-/CSS-Prüfung und kein zusätzlicher Geräte- oder Kontrastmessnachweis. Der gemeinsame Hook und die Untermenü-Scrollfunktion wurden separat gelesen; in diesen abgegrenzten Prüfungen wurde kein weiterer Produktfehler reproduziert.

112 unterschiedliche bestehende Fälle in neun weiteren Dateien zu Lernkarten-UI/Navigation/Pakettransport, Online-Akademie, regionalem Recht, Community und Kiefervergleich/Modellen bestehen nach enger Fixture-Anpassung. Eigentliche Formularfelder, lokale Präparatwahl, Speicherung, Antworten und Fehlergrenzen bleiben geprüft. Rechts-Doubles erhalten die tatsächliche Location-Form und die neue gemeinsame Menüpositionsfunktion; der Kiefervergleichs-Harness führt jetzt Effect-Lebenszyklen aus. Der bestehende Kiefertest trennt dabei das legitime Schließen beim tatsächlichen externen URL-Commit ausdrücklich von der alten Navigation, deren spätere Promise-Auflösung kein zusätzliches Schließen auslösen darf.

## Inhaltlicher Umfang

Keine Änderung an Fragen, Antwortschlüsseln, Kriterien, Musterantworten, Übungsschritten, Modellen, Fachtexten, Quellen, Medienlizenzen oder fachlichen Prüfdaten. Alle bisherigen Direktlinks und Ziel-IDs bleiben erhalten. Ergänzende Quellen stehen weiterhin an den bestehenden nachgeordneten Stellen; diese technische Änderung führt keine neue fachliche Vollständigkeitsbehauptung ein.
