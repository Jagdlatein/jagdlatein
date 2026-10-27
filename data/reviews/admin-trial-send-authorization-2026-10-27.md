# Aktuelle Betreiberberechtigung vor manuellem Benachrichtigungsversand

Technische Sicherheitsprüfung am 27. Oktober 2026 gegen `a0a656337754af0bb22710aa6a9836bb53f9cb61`. Keine Änderung an Lerninhalten, Quellen, fachlichen Prüfständen, Rollen, Konten, Empfängern oder Datenbankschemata.

## Konkreter Ausgangsbefund und Grenzen

`POST /api/admin/trials` prüfte die aktuelle Betreiberrolle vor dem Lesen der Versandbereitschaft und erst nach dem vollständigen Benachrichtigungslauf erneut. Wurde die Rolle während eines bereits begonnenen Abrufs widerrufen, konnte der Lauf daher noch bis zu zwei bestehende Outboxnachrichten versenden und anschließend mit 403 antworten. Ebenso konnte nach einem Widerruf zwischen dem ersten und dem zweiten Versand noch die zweite Nachricht beginnen.

Vier isolierte Ausgangsproben verwenden die echte Route, den echten `requireCurrentTrialAdmin`-Guard und den echten Versandablauf. Der Code wird dafür vollständig aus dem genannten Git-Stand gelesen. Zwei positive Schutzkontrollen und zwei Fehlerreproduktionen bestanden: Ein aktueller Betreiber durfte zwei vorhandene Nachrichten versenden; eine bereits vor dem Aufruf widerrufene Rolle erreichte keinerlei Outbox- oder SMTP-Aufruf. Ein Widerruf während der Statusvorbereitung beziehungsweise nach dem ersten Outboxabschluss verhinderte dagegen erst die spätere HTTP-Erfolgsantwort, nicht die folgenden Sendestarts. Der ausführbare Nachweis liegt außerhalb des Repos unter `work/regional-law-qa/audit-trial-admin-send-boundary-oct27.cjs` im Chat-Arbeitsbereich.

Voraussetzung ist eine zunächst gültige Betreiberanmeldung mit einem Berechtigungswechsel während ihrer bereits laufenden Anfrage. Die vorhandene signierte Kontozuordnung, aktuelle Profil-/Generationsprüfung, feste Betreiberadresse, validierte Outbox, begrenzte Stapelgröße und Leasing bleiben wirksam. Dies ist kein anonym nutzbarer Mailversand, keine freie Empfängerwahl und kein nachgewiesener Datenabfluss an Dritte. Für die ebenfalls gelesenen Kurs-, Aktivitäts-, Push- und Academy-Schreiber wurde in dieser begrenzten Prüfung keine weitere reproduzierte Umgehung behauptet; dies ist keine vollständige Sicherheitszertifizierung.

## Änderung

Nur der manuelle Betreiber-POST übergibt `authorizeSend` an `drainOperatorTrialNotifications`. Dieser ruft den bestehenden aktuellen Betreiber-Guard nach den asynchronen Outbox- und Gültigkeitsprüfungen unmittelbar vor jedem SMTP-Start auf. Ein Widerruf oder eine Kontolöschung in diesen Vorbereitungsschritten kann dadurch sowohl die erste als auch eine spätere Nachricht desselben Stapels stoppen.

Ein fehlgeschlagener Autorisierungsaufruf ist ausdrücklich kein erfolgreich beendeter Versand und wird nicht als gewöhnlicher SMTP-Fehler verschluckt. Der noch unversendete Claim wird mit dem bestehenden Retry-Verfahren und einer festen, nicht personenbezogenen Diagnose zurückgegeben; danach propagiert der ursprüngliche Autorisierungsfehler an die Route. Erreicht die Rückgabe die Datenbank nicht, bleibt die vorhandene Wiederaufnahme nach Ablauf des Leases erhalten und der ursprüngliche Fehler wird ebenfalls weitergegeben. Ein unversendeter Claim wird niemals als `sent` bestätigt.

Bereits gestarteter SMTP-Versand kann nicht zurückgerufen werden. Die Änderung bietet eine erneute aktuelle Prüfung an der Versandgrenze, keine atomare Transaktion zwischen Profiländerung und externer Mailzustellung. Worker und Provider-Hintergrundpfade übergeben keinen Benutzer-Callback und behalten ihr bisheriges Autorisierungs-, Claim-, Lease-, Suppressions-, Finish- und Retry-Verhalten. Es gibt keinen neuen Endpunkt und keine zusätzliche Nachricht.

## Regressionen

`scripts/test-admin-trial-send-authorization.cjs` enthält 20 Fälle mit tatsächlichen Modulen und ausschließlich synthetischen Request-, Profil-, Outbox- und SMTP-Doubles:

- Aktuelle und bereits widerrufene Betreiberrolle als Positiv-/Negativkontrolle.
- Rollenwiderruf und Kontolöschung jeweils während Status, Reconcile, erster Claim und dessen erneuter Gültigkeitsprüfung: kein erster SMTP-Start, Retry statt Zustellung, korrekte 403-/401-Antwort.
- Dieselben Änderungen nach erstem Finish, während zweitem Claim und dessen Gültigkeitsprüfung: nur die bereits gestartete erste Nachricht bleibt; keine zweite Zustellung.
- Autorisierungsfehler trotz fehlgeschlagener Claim-Rückgabe, ursprünglicher 503-Fehler, ungültiger Callbacktyp ohne Outbox-Arbeit.
- Unveränderte Workerzustellung ohne Benutzer-Callback sowie bestehende Account-Suppression und normale SMTP-Retrybehandlung.

Zusammen mit `test-admin-trial-overview.cjs`, `test-operator-trial-notifications.cjs`, `test-online-academy-server.cjs` und `test-push-platforms.cjs` bestanden 117 unterschiedliche Tests ohne übersprungene Fälle unter Node 22.23.3. Darunter sind die vorhandenen isolierten PostgreSQL-Prüfungen für Outbox-/Leasingverhalten und Rechte. Keine echten Konten, Datenbanken, Mailprovider, API-POSTs oder Benachrichtigungen wurden benutzt.

Die unabhängige Gegenprüfung bestand elf weitere eigene Proben mit tatsächlicher Route, Guard und Drain: neue Kontogeneration, Rolle und Profil-Ausfall vor dem ersten sowie zwischen zwei Sendestarts; unverändertes Fehlerobjekt auch bei fehlgeschlagenem Retryabschluss; normale manuelle Autorisierung unmittelbar vor SMTP sowie unveränderte Worker- und echte Provider-schedule-/waitUntil-Pfade über Doubles. Der Prüfer führte auch die 117 Fälle erneut erfolgreich aus. Ausführbarer eigener Nachweis außerhalb des Repos: `work/regional-law-qa/admin-trial-send-independent-oct27.cjs`.

Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` bleibt unberührt; SHA-256 `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`. Kein Build, Installieren, Staging, Commit oder Push durch den Autor dieses Teilpakets. Die tatsächliche Produktionsauslieferung wird gesondert geprüft.
