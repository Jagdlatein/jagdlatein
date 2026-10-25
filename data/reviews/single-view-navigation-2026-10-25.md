# Eine ganze Auswahlansicht statt gestapelter Fenster

## Ursache und Auftrag

Nach einer Länder- oder Regionswahl wirkte Jagdrecht wie zwei gleichzeitig offene Fenster. Der vorhandene Seitenmenü-Portal erzeugte keinen zweiten Dialog: Er steckte im gemeinsamen unteren Menü, dessen Fläche auf 340 Pixel Breite und höchstens 70 Prozent Fensterhöhe begrenzt war. Die eigentliche Inhaltsseite blieb dahinter sichtbar. Die nativen Auswahlfelder für Land, Region, Lernform und Thema konnten zusätzlich die Betriebssystemauswahl darüber öffnen.

Der Betreiber wünscht überall in der gemeinsamen Navigation eine ganze Seitenansicht. Die untere Hauptnavigation bleibt erreichbar; bestehende URLs, Übungszustände und Rechtsinhalte bleiben erhalten.

## Gemeinsame Navigation

- Die einzige bestehende Menüfläche füllt nun die Breite und den verfügbaren Bereich oberhalb der unteren Navigation. Keine neue Navigation, kein zusätzlicher Dialog und kein zweiter Portal-Auslass werden angelegt.
- Der dahinterliegende Inhalt wird während der geöffneten Auswahl ausgeblendet, für Interaktion deaktiviert und aus dem zugänglichen Lesebaum genommen. Der Hintergrund scrollt nicht mit. Bestehende Attribute und Inline-Stile werden beim Schließen oder Unmount wiederhergestellt; erkennbar zwischenzeitlich geänderte fremde Werte und Style-Prioritäten werden nicht überschrieben.
- Die ursprüngliche Auslassstelle bleibt im App-Shell erhalten. Neu gemounteter Hintergrund wird ebenfalls ausgeblendet. Die untere Navigation bleibt bedienbar.
- Öffnen und Schließen durch PageMenu erfolgen synchron. Dadurch ist die Inhaltsseite bereits wieder fokussierbar, wenn ein Lernwerkzeug unmittelbar nach `closePageMenu()` seine Inhaltsüberschrift fokussiert.
- Escape, Tastaturumlauf, versteckte Auswahlzweige, CSS-versteckte und über deaktivierte Fieldsets gesperrte Elemente sowie Druck und StrictMode-Neustart sind geprüft. Drucken schließt die Menüansicht und gibt die eigentliche Seite frei.
- Nur ein tatsächliches Öffnen setzt die Menüposition zurück. Suchquery- und Trefferänderungen in der weiterhin geöffneten Auswahl lassen deren Scrollposition und Fokus bestehen. Die vorhandenen gesonderten Regeln zum Seitenanfang bei einer neuen Kategorie bleiben erhalten.
- Die tatsächliche Dockhöhe, Bildschirmtastatur und sichere Bildschirmränder begrenzen die Fläche; in sehr kleinen verfügbaren Höhen wird keine feste Mindesthöhe erzwungen.

## Jagdrecht

Land, Kanton/Bundesland, Lernform und Prüfungsthema verwenden direkte Listen in derselben Fläche. Es ist jeweils nur eine dieser lokalen Auswahllisten aktiv. „Zur Auswahl“ wechselt innerhalb der Fläche, ohne die Seite zu verlassen oder Quizantworten zu löschen. Eine Landroute ohne Region beginnt direkt mit deren Regionsliste.

Die Fakten folgen weiterhin der übernommenen URL. Eine erfolgreich beendete Navigations-Promise allein übernimmt noch keine andere Auswahl. Fehlgeschlagene oder abgebrochene Wechsel erhalten die aktuelle Auswahl und Such-/Übungszustände. Die erneute Wahl der aktuellen Region, Lernform oder des Themas setzt Artikel und Quiz nicht zurück. Eine inzwischen überholte ausstehende Navigation wird durch die tatsächliche aktuelle Adresse abgelöst. Alte Klicks, Antworten und verspätete Lade-/Öffnungsaktionen werden anhand von Montagezustand und aktueller URL-/Stufenidentität abgegrenzt.

Der vorhandene Regionsspeicher, das optionale Bundesrecht, die Rechtsthemen, Artikelziele, Frageformen, Anmeldeschutz und ergänzenden Quellen bleiben erhalten. Keine Rechtsdaten, Gesetzestexte, Frageobjekte, fachlichen Prüfdaten oder Länder-/Regionsdefinitionen wurden geändert.

## Prüfung und praktische Grenzen

Zwei unabhängige technische Prüfungen haben die tatsächlichen Komponenten und reale React-/DOM-/Portal-Lebenszyklen geprüft. Die globale Suite umfasst 14 neue Regressionen; die Rechtssuite enthält ebenfalls 14 neue Fälle und verwendet für die Antworterhaltung auch die tatsächliche ResearchQuestionRound. Daten, Speicher, Routen und Netzantworten sind isolierte Test-Doubles.

Die lokale echte Browserprüfung bestätigte die gemeinsame Menüfläche bei 390 × 844, 320 × 640 und 1280 × 720 Pixeln. Bei 390 Pixeln füllte die Fläche den Bereich x=0 bis x=390, y=0 bis y=752; der 76 Pixel hohe Dock begann bei y=760. Bei 320 Pixeln gab es keinen horizontalen Überlauf. Schließen stellte Attribute und Hintergrundscroll wieder her; ein tatsächlicher Linkwechsel übernahm die nächste Seite und schloss die Auswahl. Das sind Browser-Viewport-Prüfungen, keine physischen iPhone-/Android-Gerätetests. Geschützte Rechtsseiten führten ohne Anmeldung regulär zur Preisseite; deren Antwort ist kein Nachweis angezeigten angemeldeten Lehrtextes.

Konten, Zahlungsdaten, Foto-Tagebücher, API-Schlüssel und Nutzungsgrenzen wurden nicht verändert. Es wurden keine kostenpflichtigen KI-Aufrufe ausgeführt. Der fremde Stand in `learning-expansion-afternoon-2026-10-16.json` bleibt außerhalb der Lieferung.

Abschluss: 698 unterschiedliche passende Tests bestanden, keine übersprungenen Fälle. Der lokale Produktionsbuild erzeugte erfolgreich 509 statische Seiten. Diese technischen Ergebnisse sind keine fachliche Gesamtprüfung oder physische Geräteprüfung.
