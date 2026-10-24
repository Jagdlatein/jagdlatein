# Hundetraining-Tagebuch: Übungsauswahl und lokale Notizen

Technische Prüfung am 24. Oktober 2026. Die zehn Übungen mit Zielen, Vorbereitung, Schritten, Erleichterungen, Beobachtungshinweisen und Kurslinks bleiben unverändert. Quellen und bisheriges fachliches Prüfdatum 4. Oktober werden nicht neu datiert. Dies ist keine neue fachliche Gesamtprüfung.

## Verbindliche Leseauswahl

Die bereite Routeradresse bestimmt ausschließlich die gelesene Übung. Bestehende `eintrag`-Links und das Ziel `exercise-title` bleiben erhalten. Ein Einstieg ohne Feld verwendet die erste Übung. Ausdrücklich unbekannte, leere oder mehrfache Werte zeigen eine Auswahlhilfe; ein noch nicht bereiter Router zeigt keine beliebige andere Übung. Die Auswahl und der Fortschritt stehen im bestehenden unteren Seitenmenü; oben wird kein weiteres Navigationsmenü eingeführt.

Eine bewusste Übungswahl schreibt einen echten `push`-Verlaufsschritt mit erhaltenem Suchkontext. Der Fachtext folgt erst der tatsächlich übernommenen Adresse. Fokus und Menüabschluss folgen der gültigen Übernahme. Navigation prüft ihren vollständigen Ursprung aus Readiness, Adresse, Query und Hash sowie die aktuelle Auftragsidentität und Lebenszeit. Fehler, Abbruch, verworfene oder überholte Aufträge können weder eine andere Übung anzeigen noch spätere Hinweise überschreiben. Auch ein Verlauf weg und zurück zur gleichen Übung entwertet frühere Aktionen.

Der untere Zurück-Pfeil kennt für diese eine zusätzliche Route ausschließlich `eintrag`. Die eigene untere Verlaufsliste und der Browserverlauf werden getrennt geprüft. Suchkontextänderungen erzeugen keinen zusätzlichen Themenstopp. Es wurde keine allgemeine Regel für beliebige Queryfelder eingeführt.

## Tagebuch getrennt vom Lesen

Die lokale Speicherwiederherstellung beginnt unabhängig von der Routerbereitschaft. Lesen, Übungswechsel und History verändern weder Entwurf noch gespeicherte Einträge, Bearbeitung, private Suche und Filter oder eine vorbereitete Importvorschau. Persönliche Angaben werden nicht in die Adresse aufgenommen. Nur die ausdrücklich betätigte Aktion „Für diese Übung einen Eintrag vorbereiten“ trägt die aktuell gelesene Übung in den Entwurf ein. Ihr früherer Handler darf nach einem anderen URL-Kontext nicht mehr handeln.

Speicherschlüssel, Version, Datenschema, Größen- und Eintragsgrenzen sowie der lokale Datenschutz bleiben erhalten. Speichern, Bearbeiten und Löschen prüfen den aktuellen Entwurf und eine eigene Bearbeitungsidentität. Ein alter Formularhandler darf nach Reset, Bearbeitungswechsel oder übernommener Sicherung keinen neuen Entwurf überschreiben. Funktionale Feldänderungen bleiben innerhalb desselben Entwurfs kombinierbar. Doppelte oder veraltete Speicher- und Löschaktionen werden früh abgefangen.

Importlesen behält seine Generation und die ausdrücklich erforderliche Übernahme. Eine native Dateiauswahl ohne Datei entwertet einen älteren noch laufenden Lesevorgang. Ein altes Übernehmen oder Abbrechen betrifft keine neuere Vorschau. Beim Verlassen werden Aufträge ungültig; frühere Formular-, Datei-, Export- oder Importaktionen dürfen anschließend weder Zustände ändern noch neue Dateilese- oder Downloadvorgänge starten. Ein bereits erstellter Download darf seine temporäre URL weiterhin freigeben.

## Prüfungen und Grenzen

- Zehn unabhängig erstellte Navigationstests prüfen sämtliche Übungsobjekte und Quellen gegen den veröffentlichten Vorgänger, Readiness, alle zehn Deep Links, ungültige Angaben, echte URL-Schreiboperationen, History, Fokus, Fehler, konkurrierende Aufträge und veraltetes Vorbereiten.
- 31 unabhängig erstellte Lebenszyklustests führen tatsächliche isolierte Hook-Effekte mit Cleanups aus. Sie prüfen Bearbeitung und Kennungen, aktuelle und alte Formulare, Quota, Importgeneration, explizite Übernahme, Export, Reset und Unmount. Auf dem unveränderten Vorgänger wurden konkrete Fehler reproduziert; dieselben Proben werden nach der Korrektur ausgeführt.
- Die bestehenden Praxistests wurden eng an den wirklichen Router und den neuen unteren Menüort angepasst. Das Seitenmenü wird in deren vereinfachter Hook-Umgebung ausdrücklich ersetzt, damit keine fremden Portal-Effekte in den Komponentenlebenszyklus geraten. Alle bisherigen Save-/Edit-/Quota-/Import-Prüfungen und die fünf anderen Werkzeuge bleiben erhalten.
- Der untere Navigationstest prüft zusätzlich Übungswahl, Suchkontext, nativen Verlauf und unmittelbares Zurück vor Effekten.

Alle Tagebuchprüfungen verwenden ausschließlich isolierte Speicher-, Datei- und Download-Doubles. Es werden keine realen persönlichen Notizen, Konten oder Zahlungsdaten gelesen oder verändert. Produktionsbuild und öffentliche Auslieferung werden zusätzlich außerhalb des Repositorys unter `work/regional-law-qa/` dokumentiert. Geschützte Seiten führen ohne Anmeldung zur Preisseite; deren HTTP200 beweist keine angemeldete Lehrtextanzeige. Eine visuelle Geräteprüfung wird nicht behauptet.

Der abschließende gemeinsame Lauf bestand mit **377 unterschiedlichen Tests ohne übersprungene Fälle**. Der vollständige lokale Produktionsbuild erstellte erfolgreich **509 statische Seiten**. Die öffentliche Auslieferung wird getrennt in `work/regional-law-qa/release-oct24-eleventh.json` festgehalten; Test- und Buildprotokolle heißen dort `tests-oct24-eleventh.txt` und `build-oct24-eleventh.txt`.
