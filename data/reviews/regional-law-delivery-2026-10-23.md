# Regionale Jagdrechts-Lernwege – technischer Abschluss vom 23. Oktober 2026

## Ausgelieferter Umfang

Die Länderwahl führt zu 26 Schweizer Kantonen, 16 deutschen und 9 österreichischen Bundesländern. Schweizer und deutsches Bundesrecht sind jeweils zusätzliche, getrennte Rechtsebenen. Die auf diesem Gerät gemerkte Prüfungsregion ist eine freiwillige lokale Auswahl; es werden weder Wohnadresse noch Standort ermittelt oder gespeichert.

| Land | Regionseinträge inklusive Bundesrecht | Gelesene Originalnormauszüge | Freigegebene eigene Fragen | Prüfungsressourcen |
| --- | ---: | ---: | ---: | ---: |
| CH | 27 | 65 | 70 | 28 |
| DE | 17 | 36 | 72 | 22 |
| AT | 9 | 29 | 46 | 10 |
| Summe | 53 | 130 | 188 | 60 |

Die 188 Aufgaben sind selbst erstellte Lernfragen. Es wurden keine fremden Originalprüfungsfragen in den Jagdlatein-Quizpool importiert. Die gesonderte Originalansicht verlinkt unveränderte Herausgeberdokumente und unterscheidet amtlichen Katalog, offizielles Muster, Verbandskatalog und Prüfungsanforderungen. Ältere Dokumentstände, fehlende Lösungen, Zugriffs- und Nachdruckbeschränkungen stehen bei den jeweiligen Quellen. Ein Kataloglink bestätigt keine vollständige heutige Richtigkeit aller enthaltenen Rechtsantworten.

Eine vollständige 1:1-Abdeckung sämtlicher amtlicher Rechtsprüfungsfragen aller Regionen ist damit **nicht erreicht**. Zahlreiche Regionen veröffentlichen in den tatsächlich geprüften Quellen keinen vollständigen frei zugänglichen amtlichen Katalog. Veröffentlichte Sammlungen können überholte Rechtsstände haben oder dürfen nicht ohne weiteres in eine kommerzielle App kopiert werden. Diese Lücken werden nicht durch angebliche Originalfragen ersetzt. Auch die 130 ausgewählten Gesetzesauszüge bilden nicht sämtliche regionalen Vorschriften, Jagdzeiten, Jahresanordnungen und Prüfungsthemen ab.

## Inhaltliche Quellenprüfung

Die inhaltlichen Einzelprüfungen, Fundstellen, Fassungswechsel und Grenzen stehen in den Länderberichten:

- `regional-law-ch-2026-10-23.md`
- `regional-law-de-2026-10-23.md`
- `regional-law-at-2026-10-23.md`

`originalVerified` bezeichnet einen tatsächlich eingesehenen amtlichen Normauszug. Ein Originalauszug wird getrennt von einer verständlichen Erklärung dargestellt. `verified` verlangt darüber hinaus den konkreten unabhängigen Quellenabgleich des Lerninhalts. Bei fehlendem Zweitabgleich liefert die API ausschließlich den amtlichen Primärtext und dessen Rechtsquellen; Erklärung und Entwurfsfragen werden entfernt. Technische Tests ersetzen diesen inhaltlichen Abgleich nicht.

## Umsetzung und Schutz

- Lernbaum: Land → Region → Thema → konkrete Gesetzesstelle. Lesen, Originalunterlagen, eigene Übung und eigener Lösungskatalog sind getrennte Ansichten.
- Deep Links erhalten Region, Thema und Norm; die untere Zurück-Navigation folgt den Auswahlstufen. Nach einer Auswahl scrollt die Ansicht zum ausgewählten Inhalt.
- Optionales Bundesrecht wird als eigene Ebene gekennzeichnet und getrennt gezählt. Ein fehlender regionaler Fragenpool wird nicht durch einen fremden Regionalpool ersetzt.
- Die statischen Länderprops enthalten nur Regionsmetadaten und Zähler. Gesetzesauszüge und Fragen kommen über `/api/jagdrecht/region` erst nach `requirePaidAccount` mit aktualisierter Berechtigungsprüfung.
- API-Antworten sind `private, no-store` mit `Vary: Cookie`. Kein neuer öffentlicher Inhaltsendpunkt, keine Änderung von Konto-, Zahlungs- oder Administrationsrechten.
- Abgebrochene oder verspätete Regionsantworten dürfen keine inzwischen neu gewählte Region überschreiben. Fehler bieten Wiederholung bzw. eine sichere Rückkehr nach erneuter Anmeldung.
- Bekannte künftige bzw. aufgehobene Normen bleiben außerhalb des heutigen Pools. Insbesondere endet die derzeitige RP-LJVO-Freigabe am 1. April 2027.

## Nachweise und Grenzen der technischen Prüfung

90 passende automatisierte Tests bestanden: Original-/Lernfreigabe und Entwurfsausschluss, Vollständigkeit der Regionsregister, API-Zugang/NoStore, Quellenklassifizierung, Regionswechsel/Race Conditions, lokale Auswahl, Deep Links/Zurück, Quizbewertung/Antwortmischung, bestehende Suche/Lernnavigation und bestehende Zugangsschranken.

Unabhängige Codeprüfungen der Länderbearbeiter ergaben keine bestätigten P1/P2-Findings. AT-Bundles wurden zusätzlich auf den Ausschluss aller gesperrten Fragen überprüft; einzelne CH-/DE-Normen wurden unabhängig nachgelesen.

Die lokale Sichtprüfung rendert die tatsächlich verfassten React-Komponenten mit ihren CSS-Dateien als statische Vorschau. Mobile Breiten 320/390 px wurden auf Umbruch und horizontales Überlaufen geprüft. Das ist kein Test mit einem angemeldeten Produktionskonto und keine Prüfung auf einem echten iPhone oder Android-Gerät. Die produktiven Authentifizierungsschranken wurden dafür weder ersetzt noch geöffnet. Die Webansicht wird von den vorhandenen App-Hüllen geladen; ein neuer nativer Store-Build ist für diese Webinhalte nicht erforderlich.
