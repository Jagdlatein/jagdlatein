# Nachprüfung und Verbesserungen vom 4. Oktober 2026

Ausgangspunkt ist die veröffentlichte App-Version `fc57f8e87e87cc0e097537947dfd4be60cf58975`. Diese Nachprüfung ergänzt das [vorherige Prüfprotokoll](app-pruefung-2026-10-04.md), insbesondere dessen offene Punkte zu Quizquellen, Bildnachweisen und PayPal-Tests.

## Wissen und Quellen

- Die 190 bisher ungequellten, aktiven Altfragen haben jetzt direkte Quellen, Quellenbezeichnungen, einen festen redaktionellen Prüftag und Hinweise zum Geltungsbereich. Die 72 zugeordneten Quellen konnten am Prüftag vollständig abgerufen werden. [Abrufprotokoll](../data/reviews/legacy-quiz-references-2026-10-04.json).
- 61 Altfragen wurden zusätzlich in Wortlaut, Erklärung, Antwortmöglichkeiten oder Zuordnung präzisiert. Dazu gehören Jahrringe auf der Hornrückseite des Steinbocks, Kahlwild, unsichere Alters-/Artbestimmung, Verbiss, Waffen- und Munitionsaussagen, die variable Fortpflanzung des Schwarzwildes und regionale Rechtsfragen.
- Die Gegenprüfung fand eine Fuchsfrage mit unpassenden Antworten und eine Tauchentenfrage mit zwei richtigen Antwortmöglichkeiten. Beide haben nun eindeutige Antworten. Eine Gamsfrage steht in Gamswild, die biologische Aalfrage wieder im gemeinsamen Wildkundepool. Oberösterreichische Schonzeiten und Abschussplanung beziehen sich ausdrücklich auf das dortige Landesrecht und eine passende amtliche Quelle.
- Quizfeedback zeigt die Quelle und den dokumentierten Prüftag nach der Antwort. Metadaten stammen aus der gespeicherten Fragenversion; alte Runden erhalten keine nachträglich erfundene Prüfdatierung. Antwortschlüssel bleiben vor der Antwort verborgen.
- Die 732 ausführlichen Kursfragen verweisen über die zugehörige Lerneinheit auf deren Quellen. Insgesamt bleiben 963 Hauptquizfragen aktiv. Die bereits ausgeschlossenen 97 unzuverlässigen Fragen bleiben ausgeschlossen. Es wurden keine zusätzlichen ungeprüften Lernfragen eingeführt.

## Echte Fotos

Alle 47 Artenporträts verwenden nachvollziehbare Originalfotografien mit Fotograf, Lizenz und Quellenseite. Die veröffentlichten Dateien wurden dekodiert und anhand tatsächlicher Maße und SHA-256 mit dem [Bildnachweis](../data/reviews/wildlife-photo-provenance-2026-10-04.json) abgeglichen. Keine KI-Fotos wurden erzeugt oder verwendet.

Eine historische Birkhuhnzeichnung wurde durch ein echtes Foto ersetzt. Das frühere Nebelkrähenmotiv war als Hybrid dokumentiert; es wurde durch eine dokumentierte Nebelkrähenaufnahme ersetzt. Fotoquiz-Merkmale und Alternativtexte passen zu den neuen Motiven. Artenfotos in den zugehörigen Kursen verwenden dieselben nachgewiesenen Dateien. Die Anzeige bleibt proportional und unverzerrt.

Einige Originalfotos sind älter oder in Tierparks entstanden. Das Prüfdatum bedeutet weder Aufnahme im Jahr 2026 noch eine freilebende DACH-Aufnahme. Alte Bildpfade bleiben für bereits heruntergeladene Offlinepakete während ihrer begrenzten Nutzungszeit erhalten; daraus folgt keine rückwirkende Lizenzbestätigung dieser Altdateien.

## Konto und Datenschutz

Das Konto enthält eine Karte für Datenschutzhinweise und Kontohilfe. Die Hinweise erklären tatsächliche Konto-, Lern-, Community- und Abodaten, den notwendigen Anmeldecookie, lokale Offlinepakete und das ausschließlich lokal gespeicherte Hundejournal. Datenanfragen per E-Mail werden von der gesonderten PayPal-Abokündigung unterschieden. Vercel, Supabase, der Login-Maildienst, PayPal und Firebase Cloud Messaging werden entsprechend ihrer technischen Rolle genannt.

Die öffentlichen Betreiberangaben bleiben auf ausdrücklichen Nutzerwunsch bei Jagdlatein und der Info-E-Mail. Eine rechtliche Vollprüfung ist damit nicht bestätigt: vollständige Betreiberangaben, tatsächlich eingesetzter Mailanbieter, Verarbeitungsregionen, Auftragsverarbeitungsverträge und konkrete Aufbewahrungspraxis müssen vom Betreiber fachlich geklärt werden. Es wurden keine erfundenen Angaben oder unbelegten Löschfristen veröffentlicht.

## Technische Nachweise

- Node 22.23.3: 192 Repositorytests bestanden. Zusätzlich 25 eigenständige PostgreSQL-Ablauf-/Schemaschutztests bestanden. Die fünf Sandbox-Isolationstests sind bereits in den 192 enthalten: zusammen 217 verschiedene Tests, keine Doppelzählung.
- Produktionsbuild erfolgreich: 307 statische Seiten; Compiler-, Typ- und Lintprüfung erfolgreich.
- Alle 47 geänderten Porträtseiten antworten im Produktionsbuild mit HTTP 200 und enthalten den Fotografenhinweis. Alle 47 neuen Bilder sind auch als anonyme Bildoptimierungsanfragen erreichbar und liefern Bilddateien.
- Alle 47 Artenporträts bei 320 Pixeln im Browser geprüft: Foto und Bildnachweis vorhanden, keine horizontale Überbreite. Konto, Datenschutz, Gams, Birkhuhn und Nebelkrähe zusätzlich bei 320, 390, 768 und 1280 Pixeln geprüft: keine horizontale Überbreite.
- Isolierte Quizrunde im Browser: falsche Fuchsantwort mit Erklärung, Quelle und Prüftag; richtige Tafelentenantwort mit eindeutiger Auflösung; falsche Kursantwort mit Link zur passenden Lerneinheit; automatische Fortsetzung und manueller Abschluss funktionieren. Die Prüfung verwendet ausschließlich lokale Testdaten.
- Die Sandbox-Prüfung führt echte App-Routen und alle sieben SQL-Migrationen in einer isolierten PostgreSQL-Testdatenbank aus. Die erneute Einrichtung eines vorhandenen Schemas wird abgewiesen. Details: [PayPal-Testanleitung](paypal-sandbox-pruefung.md).

## Verbleibende Nachweise

Eine getrennte Vercel-/Supabase-/PayPal-Testumgebung ist nach Nutzerangabe noch nicht vorhanden. Die vollständige Einrichtung ist als PowerShell-Helfer und Anleitung vorbereitet. PayPal-Antworten und Signaturen der lokalen Tests sind simuliert; echte Zustimmung, die erste Abbuchung nach 72 Stunden und ein tatsächlicher Provider-Zahlungsausfall bleiben offen. Die öffentliche App wurde nicht auf Sandbox umgestellt; es wurden keine realen Zahlungen oder Nachrichten ausgelöst und keine Live-Daten geändert.

Mobile Browserbreiten ersetzen keine Prüfung auf tatsächlichen Android-/iOS-Geräten. Quellenabgleich und redaktionelle Korrekturen ersetzen keine unabhängige Fachzertifizierung sämtlicher App-Inhalte. Die Veröffentlichung erfolgt anschließend über den geprüften Commit auf `main`; ihr Vercel-Status wird separat kontrolliert.
