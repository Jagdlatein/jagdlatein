# Prüfungsgespräch: Themenwahl, Antworten und lokale Stimme

Technische Prüfung am 24. Oktober 2026. Die 20 eigenen Übungsfragen, zwölf Themenbereiche, Musterantworten, Denkfehler, Nachfragen, jeweils vier Kriterien, Kurslinks und Fachquellen bleiben unverändert. Das bisherige fachliche Prüfdatum 4. Oktober wird nicht neu datiert. Dies ist keine neue fachliche Gesamtprüfung oder ein amtlicher Fragenkatalog.

## Verbindliche Auswahl

Die bereite Routeradresse bestimmt Themenbereich und Frage. Bestehende `eintrag`-Links bleiben gültig. Ohne Auswahl wird die erste Frage des Bereichs verwendet; ohne Bereich die erste Frage insgesamt. Das zusätzliche optionale Feld `kategorie` akzeptiert nur die zwölf vorhandenen Bereiche oder `all`. Ausdrücklich leere, unbekannte, mehrfache oder widersprüchliche Angaben zeigen eine Auswahlhilfe statt einer anderen Frage. Ein noch nicht bereiter Router zeigt keine beliebige erste Frage.

Themenbereich, Fragenwahl und Fortschritt stehen im vorhandenen unteren Seitenmenü. Der Hauptteil zeigt den gewählten Sachverhalt und seine eigentlichen Übungssteuerungen. Eine bewusste Auswahl und „Nächste Frage“ erzeugen echte `push`-Verlaufsschritte mit erhaltenem Suchkontext. Der Text wechselt erst mit der übernommenen Adresse. Fokus und unterer Menüabschluss folgen dem übernommenen Ziel `exam-question-title`. Der untere Zurück-Pfeil kennt ausschließlich die zwei konkreten Auswahlfelder dieser zusätzlichen Route; keine allgemeine Regel für beliebige Parameter wurde eingeführt.

## Antworten und Runden

Eigene Antworten bleiben weiterhin nur im Arbeitsspeicher dieser geöffneten Seite und sind der Frage zugeordnet. Themen- und Fragenwechsel löschen sie nicht. Vergleich und Selbsteinschätzung prüfen eine aktuell vorhandene eigene Antwort beziehungsweise die Bestätigung einer selbst laut erklärten Antwort. Antwort- und Kriterienänderungen machen eine frühere Bewertung ungültig. Ein gespeicherter alter Weiter-Handler darf diese Bewertung nicht wiederverwenden; Kriterien werden aus dem aktuellen Zustand ergänzt, statt spätere Markierungen zu überschreiben.

Eine explizite Wiederholung setzt ausschließlich die ausgewählten unsicheren Fragen zurück. Muss sie eine andere Frage öffnen, geschieht der Reset erst nach dem angenommenen Navigationsauftrag und seinem einen tatsächlich passenden URL-Commit. Fehler und überholte Aufträge löschen keine Antworten. Eine unabhängige Gegenprüfung reproduzierte zusätzlich einen zeitlichen Grenzfall: Nach dem URL-Commit, aber vor einer künstlich verzögerten Annahme hätte eine neue Eingabe vom späteren Reset gelöscht werden können. Die Antwortsteuerung wartet in genau diesem Übergang auf die Annahme; nach einer Ablehnung ist die Eingabe wieder möglich.

„Neue Runde beginnen“ erhält die angezeigte URL-Frage. Der vollständige Bereichspool wird ab dieser Frage rotiert, damit ein Neustart nicht unbemerkt Fragen am Anfang auslässt. Er leert ausdrücklich die bisherigen Antworten. Rundenabschluss, Wiederholung und Reset haben eigene Identitäten; frühere Rundenaktionen dürfen eine neu begonnene Antwort nicht löschen.

## Vorlesen und Lebenszeit

Vorlesen verwendet ausschließlich eine vom Gerät als lokal ausgewiesene deutsche Stimme. Ohne eine solche Stimme oder bei einer fehlerhaften Gerätefunktion bleibt der Fragetext verfügbar. Es werden keine Antworttexte hochgeladen und keine entfernten Stimmen angefordert.

Navigation, Abschluss, Reset, Wiederholung und Verlassen brechen laufendes Vorlesen ab. Alte Start-/Stop-/Fehleraktionen können weder eine andere Frage noch eine neue Runde derselben Frage beeinflussen. Wiederholtes Vorlesen bekommt auch bei unverändertem Hinweistext eine neue Sprechidentität. Alle mutierenden Aktionen prüfen ihre Lebenszeit, den vollständigen URL-Ursprung und die Runde; auch ein Verlauf weg und zurück zur gleichen Frage macht alte Aktionen ungültig.

## Regressionen und Grenzen

- Zwölf unabhängige neue Navigationstests prüfen alle alten Frage-Links, alle zwölf Kategoriepools, Inhalts- und Quellenerhalt, Readiness, ungültige Angaben, echte URL-Schreiboperationen, History, Fokus, verzögerte Annahme und fehlgeschlagene Übergänge.
- Elf unabhängige neue Tests führen einen echten isolierten Hook-Lebenszyklus einschließlich Effekt-Cleanups aus. Sie prüfen aktuelle und überholte Antwort-, Kriterien-, Runden- und Stimmenaktionen sowie Unmount.
- Der bestehende Praxistest wurde eng an den tatsächlichen Router und den Fortschritt im unteren Menü angepasst. Seine übrigen fünf Werkzeuge bleiben unverändert. Bestehende Inhalts-, Antwortvorbedingungs- und Stimmenprüfungen bleiben erhalten.
- Ein zusätzlicher unterer Navigationstest prüft Fragen- und Bereichsverlauf einschließlich Suchkontext, unmittelbarem Zurück und wiederhergestelltem Browserverlauf.

Die Tests verwenden keine echten Konten, Zahlungen oder externen Sprachanbieter. Produktionsbuild und tatsächliche öffentliche Auslieferung werden zusätzlich außerhalb des Repositorys unter `work/regional-law-qa/` dokumentiert. Geschützte Inhalte führen ohne Anmeldung zur Preisseite; deren HTTP200 beweist keine angemeldete Lehrtextanzeige. Eine visuelle Geräteprüfung wird nicht behauptet.

Der abschließende gemeinsame Lauf bestand mit **325 unterschiedlichen Tests ohne übersprungene Fälle**. Der vollständige lokale Produktionsbuild erstellte erfolgreich **509 statische Seiten**. Die öffentliche Auslieferung wird getrennt in `work/regional-law-qa/release-oct24-tenth.json` festgehalten; Test- und Buildprotokolle heißen dort `tests-oct24-tenth.txt` und `build-oct24-tenth.txt`.
