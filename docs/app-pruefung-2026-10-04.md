# App-Prüfung vom 4. Oktober 2026

Geprüft wurde der lokale Stand nach `c04cc0413b86d1e557dc91514643fb7176592b37`. Die älteren Prüfprotokolle dokumentieren frühere, kleinere Ausbaustände.

Die anschließende [Nachprüfung](app-nachpruefung-2026-10-04.md) dokumentiert die Ergänzung aller 190 bisher unbelegten aktiven Altfragen, 47 vollständige Bildnachweise, Kontohilfe und den vorbereiteten isolierten PayPal-Test. Die unten genannten offenen Quellen-/Fotoaufgaben beschreiben den damaligen Stand.

## Behobene Fehler

- Die Anmeldung erhält das Rücksprungziel zur kostenlosen Community, einschließlich Themenauswahl und gültiger Beitragsadresse. Ein fehlendes Abo führt dabei nicht mehr zur Preisseite. Doppelte Codeprüfungen, späte Antworten nach Verlassen der Seite und hängende Anfragen sind abgesichert.
- Kontoseiten und Community-Beiträge benötigen eine gültige signierte Identität. Sie bleiben auch bei einem Ausfall der Abo-Prüfung erreichbar. Bezahlte Lernbereiche prüfen die Berechtigung weiterhin.
- Persönliche Fortschritts- und Ergebnis-APIs prüfen zusätzlich, ob das Konto aktuell noch besteht. Ein alter Cookie eines gelöschten Kontos reicht nicht mehr für Lesen oder Speichern.
- 35 bestehende Artenfotos wurden vom Bildoptimierer fälschlich zur Preisseite umgeleitet. Nur die tatsächlich benötigten, dekodierbaren JPEG-Dateien wurden zur öffentlichen Bildliste ergänzt. Kursdaten, unbekannte Bildpfade und das E-Book bleiben geschützt.
- Impressum, Datenschutz, robots.txt und sitemap.xml sind öffentlich erreichbar. Im Impressum steht auf ausdrücklichen Nutzerwunsch nur die Info-E-Mail.
- Fotorunden berücksichtigen bereits nachgeschlagene Merkmale als Hilfe. Landschaftsvorlagen zeigen nach eigenen Änderungen „Eigene Zusammenstellung“ und behalten diese Auswahl beim Wechsel des Lernmodus.
- Audio- und Videowiedergabe ignorieren alte Fehlerereignisse nach Wechsel oder erneutem Versuch. Abgebrochene Tagebuchimporte widerrufen ihren vorherigen Bestätigungsvorgang.
- Artenporträts trennen ihre Quizantworten beim Artwechsel. Der Ansitzsimulator ignoriert alte Antwortereignisse nach einem Neustart und während des Übergangs zur nächsten Situation; die Rückmeldung bleibt zehn Sekunden sichtbar.

## Einheitliche Darstellung

Anmeldung, Preise, Konto, persönliche Kurse, Auswertungen, E-Book und Informationsseiten nutzen den gemeinsamen Seitenrahmen mit goldenen Kopfbereichen, Systemschrift, Karten, Such-/Lernnavigation und abgestimmten Buttons. Alle 38 Praxisübungen und die Jagdpraxis-Übersicht wurden ebenfalls angeglichen. Ergebnis- und Fehlerfarben bleiben als verständliche Rückmeldungen erhalten. Die persönliche Kursliste verwendet dieselben Vektorsymbole statt gemischter Emojiüberschriften.

## Lerninhalte

Aktueller Bestand: 107 Kurse (34 Minikurse und 73 ausführliche Einheiten), 372 ausführliche Lektionen, 732 Vertiefungsfragen, 963 aktive Hauptquizfragen und 72 Glossarbegriffe. Die 122 ursprünglichen Minikursfragen bleiben unverändert.

Gezielt korrigiert wurden Trichinenverfahren in Deutschland, Jagdscheinprüfung, Dentalplatte, flexible Fortpflanzungszeiten des Schwarzwildes, Zuordnung einer Rotwildfrage, vorschnelle Verbissdeutung, Rotwild-Superlative, Wärmebildgrenzen, missverständliche Prüfungstipps und die Form der Fuchslosung. Die vollständigen Befunde und Primärquellen stehen in [der Inhaltsprüfung](../data/reviews/content-consistency-2026-10-04.json).

Alle aktiven Hauptquizfragen wurden auf Struktur, richtige Lösungen, Erklärungen und Geltungsbereich geprüft. Die alten Quizfragen und das Glossar wurden zusätzlich gelesen; 191 ursprünglich ungequellte Altfragen wurden nochmals nach fachlichen Risiken durchsucht. Die sechs Nachrichtenquellen konnten im aktuellen Lauf abgerufen werden; Originaldaten und DACH-Zuordnung bleiben erhalten.

## Prüfung und Veröffentlichung

- 189 Repositorytests unter Node 22.23.3: 189 bestanden, keine fehlgeschlagenen oder übersprungenen Prüfungen. Zusätzlich 218 bestehende Auth-/Abo-/Trialtests und 117 Checkout-/Konto-/Statistikprüfungen bestanden; diese Gruppen enthalten Überschneidungen und werden nicht als eindeutige Gesamtsumme addiert.
- Vollständiges `npm run build`: erfolgreich, 307 statische Seiten, keine Compilerfehler.
- `npm audit`: keine gemeldeten Sicherheitslücken, einschließlich Entwicklungsabhängigkeiten. Standard-Diffprüfung ohne Fehler.
- HTTP-Prüfung des Produktionsbuilds mit isolierten Testkonten: 322 reguläre Seiten, 752 interne Ziele und 718 lokale Ressourcen, keine defekten Ziele. Alle 70 vorher fehlgeschlagenen Bildoptimierungen funktionieren; öffentliche Informationsdokumente antworten Gästen direkt mit HTTP 200.
- Browserprüfung bei 360 und 1100 Pixeln: Konto, Kursfilter, Auswertungen, Preise, Ansitz, Landschaftswerkstatt, Fotodetektiv, Tierstimmen, Videos und Biberfoto. Die geprüften Seiten laufen nicht seitlich über; der gemeinsame Rahmen hat genau eine Hauptüberschrift.
- Die Community-Anmeldung erhält die Kategorie ohne aktives Abo. Fotohilfe und eigene Landschaftsauswahl werden korrekt berücksichtigt. Eine Originalaufnahme wurde tatsächlich abgespielt (MP3, 7,07 Sekunden, kein Medienfehler).
- Die abschließende Videoauswahl wurde im Browser nachgestellt: denselben ersten Fall erneut wählen, Textfassung lesen, Antworten öffnen und richtige Antwort erklären. Ein dabei entdeckter Renderzustandsfehler wurde vor der Veröffentlichung zusätzlich abgesichert.
- Produktionsveröffentlichung erfolgt über den geprüften Commit auf `main`; der finale Vercel-Status wird separat geprüft.

## Grenzen der Prüfung

- Keine echten Zahlungen, Kündigungen, E-Mails, Pushnachrichten, Communitybeiträge oder Datenbankänderungen ausgelöst. Zahlungsszenarien wurden mit isolierten Anbieterdaten geprüft. Ein vollständiger echter PayPal-Aboabschluss einschließlich späterer Abbuchung ist damit nicht bestätigt.
- Keine unabhängige fachliche Vollprüfung jedes Satzes aller 372 Lektionen. 190 ältere Fragen haben weiterhin keinen direkten Einzelquellenlink; fehlende Einzelquellen sind nicht mit einem nachgewiesenen Sachfehler gleichzusetzen.
- Die neuen Kategorienfotos haben Herkunfts- und Lizenznachweise. Bei den älteren Artenfotos fehlen teilweise vollständige Fotografen-/Lizenzangaben; die technische Bildprüfung ersetzt keinen solchen Nachweis. Es wurden keine KI-Fotos erzeugt.
- Die Sichtprüfung erfolgt im Desktopbrowser mit mobilen Breiten. Native Android-/iOS-Funktionen und tatsächliche Wiedergabe auf allen Endgeräten sind nicht vollständig geprüft.
- Impressum und Datenschutzhinweise sind keine bestätigte rechtliche Vollprüfung. Die Nutzerentscheidung, nur die Info-E-Mail anzugeben, ist dokumentiert.
