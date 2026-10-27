# Login-Code: Sperre gegen vorzeitigen Mailversand

Technische Prüfung vom 27. Oktober 2026. Ausgangsstand: `c42efa54269a04ae7d3af7916d39cd5ca2b331ae`.

## Bestätigter Befund und begrenzte Änderung

Die öffentliche Prüfung eines E-Mail-Codes löschte nach fünf Fehlversuchen die gesamte `login_codes`-Zeile. Damit verschwand auch `requested_at`, anhand dessen die Anforderung eines neuen Codes ihre bestehende 60-Sekunden-Sperre prüft. Eine nicht angemeldete Person mit Kenntnis einer registrierten Adresse konnte daher nach wiederholten Fehlversuchen vorzeitig weitere Codes versenden lassen. Folgen sind Mailmissbrauch und eine Störung der Anmeldung. Der Nachweis zeigt keine Kontoübernahme und kein Erraten eines richtigen Codes.

Der außerhalb des Repositorys gespeicherte Baseline-Nachweis führt beide tatsächlichen Route-Exporte mit einer festen Uhr und isolierten Datenbank-, Hash- und Mail-Doubles aus. Ein gewöhnlicher sofortiger Neuversand wurde zunächst korrekt gebremst. Zweimal sechs falsche Prüfungen mit anschließendem Neuversand erzeugten anschließend drei Mail-Aufrufe bei null verstrichenen Millisekunden. Es wurden keine wirklichen Mails, Konten oder entfernten Datenbanken verwendet.

Nur der Zweig für ausgeschöpfte Versuche in `app/api/auth/verify-code/route.js` wurde geändert: Er antwortet weiterhin mit 429, behält aber die Zeile samt Versandreservierung. Nach der bestehenden Sperrfrist darf `request-code` den Datensatz weiterhin über seine vorhandene atomare Reservierung ersetzen. Es ist keine Migration notwendig.

Unverändert bleiben die Bereinigung abgelaufener Codes, die auf Hash und Adresse begrenzte Einmalverwendung erfolgreicher Codes, der Compare-and-swap-Zähler vor dem Hashvergleich, die Kontogeneration der signierten Sitzung und die neutrale Antwort bei einer erneuten Codeanforderung. Die vorhandene Sperre ist kein vollständiger Schutz gegen verteilten Missbrauch oder alle Arten einer Anmeldestörung.

## Regressionen und Abgrenzung

`scripts/test-login-code-cooldown.cjs` enthält sieben neue Prüfungen mit den tatsächlichen beiden Routen und ausschließlich isolierten Doubles:

- Erster Versand und neutraler, gebremster Sofort-Neuversand.
- Fünf Fehlversuche und wiederholte 429-Antworten erhalten `requested_at`; kein weiterer Mailversand und kein weiterer Hashvergleich.
- Bei 59.999 Millisekunden kein Versand, bei 60.000 genau ein neuer Versand mit zurückgesetzten Versuchen; die vorherige Reservierung bleibt Teil der Update-Bedingung.
- Gleichzeitige erste und erneute Reservierungen erlauben jeweils nur einen Mail-Aufruf.
- Gleichzeitige Prüfungen können den Versuchszähler nicht umgehen.
- Ein erfolgreicher Code bleibt einmalig; die tatsächlich signierte Sitzung erhält die aktuelle Kontogeneration ohne Admin- oder Bezahlrechte.
- Ein abgelaufener, ausgeschöpfter Code wird weiterhin nur über Adresse und Hash bereinigt und setzt keine Sitzung.

Zusammen mit den unveränderten Suiten `test-sandbox-communications.cjs`, `test-account-generation.cjs`, `test-admin-trial-overview.cjs` und `test-online-academy-server.cjs`: **172 unterschiedliche Fälle bestanden, null übersprungen**. Die älteren Prüfungen mussten nicht abgeschwächt oder angepasst werden.

Eine zusätzliche lesende Prüfung betrachtete die aktuellen Objekt- und Rollenbindungen von Community, Quizrunden, Kursfortschritt, Kontodaten, Academy-Verwaltung, Admin-Übersicht und den Konto-Zuordnungen von Apple/PayPal. In diesem begrenzten Umfang wurde kein weiterer konkreter Fremdkontozugriff oder Admin-Bypass bestätigt. Dies ist keine vollständige Sicherheitszertifizierung und keine Prüfung der tatsächlich installierten Datenbankberechtigungen. Upload-/Netzwerkziele, Browser-Sitzungen und die gesonderte Abhängigkeitsprüfung gehören zu getrennten Prüfungen.

Keine Produktiv-POSTs, Mails, Nachrichten, Zahlungsänderungen oder Schutzumgehungen. `data/learning-expansion-afternoon-2026-10-16.json` wurde weder bearbeitet noch gestagt; der bekannte SHA256 blieb `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`.
