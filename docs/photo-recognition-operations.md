# Foto-Erkennung: Betrieb und Freischaltung

Stand: 23.10.2026. Diese Anleitung beschreibt den implementierten Ablauf; sie bestätigt weder eine ausgeführte Datenbankmigration noch einen Produktivstart, eine Store-Freigabe oder erfolgreiche echte Bilderkennung.

## Anbieter, Abrechnung und Datenweg

- Anbieter: OpenAI, festes Modell `gpt-6-astra`, Responses API `https://api.openai.com/v1/responses`. Die offizielle Modellseite führt derzeit keinen datierten Snapshot auf. Modelländerungen erfordern eine neue Prüfung.
- Bilddetail `high`, Reasoning `medium`, maximal 4.096 Ausgabetokens einschließlich Reasoning, 45 Sekunden Anbieter-Zeitlimit. Kein automatischer Wiederholungsversuch oder Ersatzanbieter.
- Service-Tier fest `default` (Standard-Verarbeitung); die Projektvoreinstellung `auto` wird nicht übernommen.
- Der Betreiber benötigt ein eigenes API-Projekt mit freigeschalteter Abrechnung und Modellzugang. Ein ChatGPT-Pro-Abonnement bezahlt diese API-Aufrufe nicht. Schlüssel niemals im Chat, Quelltext, Browsercode oder unter `NEXT_PUBLIC_*` speichern.
- Nach ausdrücklicher Zustimmung pro Foto: vorbereitete sRGB-JPEG-Kopie → authentifizierter Jagdlatein-Server → OpenAI. Die Servergrenze beträgt 3 MiB und höchstens 1.600 Pixel je Kante; andere Formate, EXIF, Kommentare und unbekannte Zusatzsegmente werden zurückgewiesen. Vollständige ICC-Farbprofilblöcke einer Browserausgabe werden vor der Übermittlung entfernt. Dateiname, Journalnotiz, E-Mail, Kontokennung und Standortdaten werden nicht absichtlich an OpenAI gesendet. Sichtbare persönliche Informationen im Bild bleiben dennoch Bildinhalt.
- Jagdlatein speichert über diesen Ablauf weder Foto, Prompt noch Analyseergebnis in der Datenbank. Das ausdrücklich gespeicherte Fototagebuch bleibt getrennt auf dem Gerät. Die Antwort ist ein fehleranfälliger Modellvorschlag; Lerntexte und Links stammen aus dem vorhandenen erlaubten Katalog.
- Bei fehlgeschlagenen Anbieteraufrufen enthalten Serverprotokolle ausschließlich feste technische Stufen-/Fehlercodes und erlaubte HTTP-Statuswerte; keine Schlüssel, Header, Kontodaten, Bilder, Prompts, Antworten oder Fehlermeldungstexte. Erfolgreiche Aufrufe erzeugen keinen solchen Diagnoseeintrag.
- `store:false` vermeidet die normale Speicherung als Responses-Anwendungszustand, bedeutet aber keine vollständige sofortige Löschung bei OpenAI: Sicherheitsprotokolle können standardmäßig bis zu 30 Tage aufbewahrt werden, unter bestimmten Umständen länger; Promptcache kann bis zu 24 Stunden bestehen. Bild-Sicherheitsprüfungen haben zusätzliche Aufbewahrungsausnahmen. API-Inhalte werden standardmäßig nicht zum Training verwendet, sofern nicht ausdrücklich zugestimmt wurde. Keine ausschließliche Verarbeitung in CH/EU versprechen.

Primärquellen: [Modell und Preise](https://developers.openai.com/api/docs/models/gpt-6-astra), [Bildeingaben](https://developers.openai.com/api/docs/guides/images-vision), [strukturierte Antworten](https://developers.openai.com/api/docs/guides/structured-outputs), [OpenAI-Datenkontrollen](https://developers.openai.com/api/docs/guides/your-data).

## Konfiguration und Datenbank

Standardmäßig bleibt die Funktion **aus**. Konfiguration in jeder Zielumgebung getrennt setzen und anschließend neu bereitstellen:

| Variable | Bedeutung |
| --- | --- |
| `PHOTO_RECOGNITION_ENABLED` | Nur der exakte Wert `true` erlaubt die Freischaltung; zunächst weglassen oder `false` setzen. |
| `PHOTO_RECOGNITION_TEST_ACCOUNT` | Optionaler interner Test: genau eine bereits berechtigte Konto-E-Mail in normalisierter Kleinschreibung. Bei gesetzter Variable sind alle anderen Konten gesperrt. Leer/ungültig sperrt vollständig; ohne Variable bleibt das normale Zugangsgate bestehen. |
| `OPENAI_API_KEY` | Neuer geheimer serverseitiger API-Schlüssel des Betreiberprojekts. |
| `SUPABASE_URL` | Bestehende Projektadresse; ersatzweise verwendet der Code `NEXT_PUBLIC_SUPABASE_URL`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Bestehender geheimer Serverschlüssel für die begrenzten Kontingent-RPCs. |
| `NEXT_PUBLIC_SITE_URL` | Bestehende kanonische Websiteadresse für die Prüfung gleichursprünglicher Anfragen. |
| `JL_SESSION_SECRET` | Bestehende funktionierende Kontoanmeldung; für diese Funktion nicht neu setzen oder austauschen. |

Die Websiteadresse muss zur jeweiligen Test-/Produktivadresse passen. Ein Preview-Aufruf mit der fremden Produktivadresse als Konfiguration wird absichtlich zurückgewiesen; die Ursprungsprüfung nicht für bequemere Tests lockern.

1. Zuerst die bestehende Konto-/Account-Generation-Einrichtung prüfen: `public.userprofile.account_generation` muss als UUID vorhanden sein; aktuelle bestätigte, berechtigte Sitzungen benötigen diese Kennung.
2. Die Migration `supabase/migrations/20261023190000_photo_recognition_quota.sql` gezielt im vorgesehenen Testprojekt anwenden und prüfen, danach im richtigen Produktivprojekt. Keine fremden oder bereits erledigten Migrationen ungeprüft mit ausführen.
3. Migration und Code müssen dieselbe Schemafassung und Grenzwerte melden. RLS schützt beide Zählertabellen; Browserrollen erhalten keine Rechte, nur `service_role` darf die eng begrenzten RPCs ausführen. Datenbankfehler oder fehlende Migration sperren die Erkennung; es gibt keinen ungesicherten Speicher-Ersatz.
4. `GET /api/fotohelfer/recognize` prüft Konfiguration, bestätigte Anmeldung mit aktivem Lernzugang und Kontingent-Einrichtung, ohne ein Bild an OpenAI zu senden. `POST` erfordert zusätzlich Bildzustimmung, vorbereitete Bilddaten und eine neue Anfrage-ID. Ein vorhandener Schlüssel allein aktiviert die Funktion nicht.
5. Vor dem ersten echten Test das optionale Testkonto setzen, bevor `PHOTO_RECOGNITION_ENABLED=true` bereitgestellt wird. Es erteilt keine Anmeldung, kein Abo und keine Rolle; alle bestehenden Kontoprüfungen und Kontingente gelten weiter. Erst nach erfolgreicher echter Prüfung und passenden Store-Freigaben die Beschränkung bewusst entfernen. Bei offener nativer Prüfung höchstens das ausdrücklich verwendete Betreiber-/Prüfkonto zulassen.

## Kontingente und Abschalten

Feste Grenzen in Code **und** Datenbank: **5 reservierte Versuche je Kontogeneration und UTC-Tag**, **50 insgesamt je UTC-Tag**, **100 insgesamt je UTC-Kalendermonat**. Die Reservierung erfolgt atomar vor dem Anbieteraufruf. Eine bereits verwendete Anfrage-ID wird nicht erneut ausgeführt. Auch Anbieterfehler und abgebrochene Versuche verbrauchen die Reservierung; ein Zeitablauf beweist nicht, dass OpenAI keine Kosten berechnet hat.

Diese Grenzen sind **keine Euro-/Dollar- oder Token-Kostengarantie**. Eingabebilder, Prompt, Reasoning, Anbieterpreise und weitere Verwendungen desselben API-Projekts beeinflussen die Rechnung. Ein eigenes API-Projekt, dessen aktuelle Budget-/Benachrichtigungseinstellungen und tatsächliche Nutzung zusätzlich kontrollieren; keine harte Zahlungssperre aus einer bloßen Budgetwarnung ableiten. Grenzwerte nicht durch Löschen der Zähler umgehen.

Gespeicherte Reservierungen enthalten nur Kontogeneration, zufällige Anfrage-ID und Zeitpunkt. Einträge älter als 48 Stunden werden bei späteren Status-/Reservierungsaufrufen bereinigt, nicht garantiert genau nach 48 Stunden. Monatszähler sind personenfreie Summen; alte Monate werden ebenfalls bei späteren Aufrufen bereinigt.

Zum Abschalten `PHOTO_RECOGNITION_ENABLED=false` setzen und neu bereitstellen. Danach fehlende Verfügbarkeit prüfen; lokales Tagebuch und Merkmalsvergleich müssen weiter funktionieren. Bereits angenommene Anbieteraufträge können noch enden und Kosten verursachen. Bei Schlüsselmissbrauch den API-Schlüssel zusätzlich beim Anbieter widerrufen; nur das Löschen aus einer noch nicht neu bereitgestellten Umgebung stoppt ihn nicht.

## Prüfung vor Freischaltung

Automatische Vertragstests ersetzen keinen realen Bildtest. Mit vorher vereinbartem kostenpflichtigem Testumfang eigene oder rechtmäßig nutzbare Bilder auf iOS, Android und Web prüfen: klare Arten, ähnliche Hirscharten, unscharfe/kleine/verdeckte Tiere, unbekannte Arten, Haustiere, Pflanzen, Optik, neutrale Spuren, mehrere Motive und Textanweisungen im Bild. Erwartetes Motiv, tatsächlichen Vorschlag, Fehlzuordnung und Laufzeit dokumentieren; keine Genauigkeitsquote ohne geeigneten unabhängigen Testbestand veröffentlichen.

Außerdem Ablehnung der Einwilligung, Anmeldung/Zugang, Abbruch, Zeitablauf, doppelte Anfrage und Kontingentgrenzen prüfen. Netzwerkprüfung: kein Bildversand vor Zustimmung; keine Fotos oder Anbieterantworten in Logs/Fehlermeldungen. Tieralter, Gesundheit oder jagdliche Freigaben dürfen nicht aus Vorschlägen abgeleitet werden. Erst nach dokumentiertem Ergebnis, passender Datenschutzerklärung und erledigten Store-Angaben bewusst freischalten.

## Store-Angaben und Prüfung

- **Apple:** „User Content → Photos or Videos“ für App Functionality erfassen, kein Tracking. „Nicht mit dem Nutzer verknüpft“ nicht allein aus der fehlenden E-Mail bei OpenAI ableiten; ohne belegte Entkopplung konservativ als verknüpft behandeln. Kontogebundene Zähler unter vorhandenen User-ID-/Product-Interaction-Angaben berücksichtigen. Kontrollierte WebViews zählen mit. Datenschutzantworten können ohne neue App-Datei aktualisiert werden. [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/)
- **Apple Review:** Die bisherige Erklärung „kein Upload / keine KI“ beschreibt diese Erweiterung nicht mehr. Anbieter, Einwilligung, Datenweg, Kontingente, Fehlerfälle und Prüfzugang konkret erklären und erreichbar zur Prüfung anbieten. Apple verlangt ausdrückliche Zustimmung vor Drittanbieter-KI-Übertragungen. Eine neue geprüfte Version oder ausdrückliche Klärung mit App Review vor breiter iOS-Freischaltung vorsehen; aus einer Datenschutzkorrektur allein keine Funktionsfreigabe ableiten. Die Regeln begründen keine pauschale Behauptung, jede Serverkorrektur benötige eine neue Binärdatei. [Richtlinien 2.3.1(a), 2.5.19 und 5.1.2(i)](https://developer.apple.com/app-store/review/guidelines/)
- **Google Data Safety:** Photos erfasst, nicht ausschließlich flüchtig verarbeitet, freiwillig; Zwecke App functionality sowie Fraud prevention, security and compliance. Keine Videos zusätzlich angeben, solange nur Fotos übertragen werden. Kontokennungen und Nutzungszähler berücksichtigen. „Nicht geteilt“ nur bei tatsächlich passender Dienstleister- oder ausdrücklich nutzerinitiierter Übertragungs-Ausnahme wählen; sonst teilen angeben. Die Datenschutzerklärung nennt OpenAI unabhängig von dieser Formularausnahme. [Google-Definitionen](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- **Google-Veröffentlichung:** In-App-Offenlegung, Zustimmung und Datenschutzerklärung müssen auch für Drittanbieter-KI stimmen. Data-Safety-Änderungen prüfen und veröffentlichen lassen. WebView-JavaScript ist von der Beschränkung externer ausführbarer Updates ausgenommen; daraus folgt keine Befreiung von Inhalts-/Datenschutzregeln. Ein neues AAB ist allein für diese Serverfunktion nicht pauschal vorgeschrieben. [User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en), [WebView-Ausnahme](https://support.google.com/googleplay/android-developer/answer/16559646?hl=en), [Datenschutzformular ohne App-Update](https://android-developers.googleblog.com/2021/10/launching-data-safety-in-play-console.html)
