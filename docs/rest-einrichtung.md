# Rangliste und Abo-Laufzeiten einrichten

Die Änderungen wurden lokal geprüft. Vor dem Veröffentlichen müssen die zwei neuen Datenbankmigrationen im bestehenden Supabase-Projekt ausgeführt werden. Ohne diese Tabellen funktionieren der neue Quizablauf und die Abo-Prüfung nicht. Die bestehende Fortschritts- und Auswertungseinrichtung bleibt Voraussetzung.

## Datenbank über PowerShell vorbereiten

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-account.ps1 -Step RankedQuizSql
```

Das kopiert `supabase/migrations/20261004100000_ranked_quiz.sql` in die Zwischenablage. Im SQL Editor des vorhandenen Supabase-Projekts einfügen und ausführen. Anschließend:

```powershell
& .\scripts\setup-account.ps1 -Step SubscriptionSql
```

`supabase/migrations/20261004110000_subscription_access.sql` ebenfalls ausführen. Beide Migrationen sind Transaktionen und löschen keine früheren Ergebnisse oder Premiumflags. Eine fehlgeschlagene Transaktion darf nicht als erfolgreiche Einrichtung gelten.

Wer bereits die Supabase-CLI mit diesem Projekt verknüpft und eine korrekt abgeglichene Migrationshistorie hat, kann stattdessen die Migrationen über diesen vorhandenen Ablauf anwenden. Ein unbekanntes Projekt nicht automatisch verknüpfen.

## PayPal und Vercel

Der vorhandene PayPal-Webhook muss auf `/api/paypal/webhook` zeigen und folgende Ereignisse enthalten:

- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.REFUNDED`
- `PAYMENT.SALE.REVERSED`

Im Vercel-Projekt müssen Supabase-URL und `SUPABASE_SERVICE_ROLE_KEY`, `JL_SESSION_SECRET` (mindestens 32 Bytes), `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` und `PAYPAL_WEBHOOK_ID` passend konfiguriert sein. Die Preiseseite verwendet ausschließlich die öffentliche Client-ID; ein zusätzlich gesetztes `PAYPAL_CLIENT_ID` hat beim Server Vorrang und muss zur gleichen App gehören. Client-ID, Secret, Webhook und Plan müssen zum selben PayPal-Modus und Händlerkonto gehören. `NEXT_PUBLIC_PAYPAL_PLAN_ID` ist der vom Browser angebotene Plan; falls `PAYPAL_PLAN_IDS` gesetzt ist, muss diese serverseitige Liste denselben Plan zulassen. Ohne ausdrückliche öffentliche Client-ID oder Plan-ID verwendet die Preiseseite die bestehenden festen Live-Werte. `PAYPAL_API_BASE` ist ausschließlich eine freigegebene offizielle PayPal-API-URL; ohne Angabe verwendet der Server Live-PayPal. Zugangsdaten bleiben in den bisherigen Umgebungsvariablen, niemals in Git.

### Separate Sandbox-Testversion

Eine Vercel-Adresse allein belegt keine getrennte Testumgebung. Zuerst die konkrete Deployment-Adresse, den Umgebungstyp und die eigene Testdatenbank feststellen. Im Vercel-Projekt der öffentlich genutzten App gehören Sandbox-Werte ausschließlich in die separate Testumgebung, etwa eine passend eingerichtete Preview. Im eigenen separaten Testprojekt kann dessen Production-Deployment die Testversion sein. Die Auswahl All Environments verteilt einen Wert auch an die übrigen Umgebungen und ist deshalb keine gezielte Sandbox-Konfiguration. Sandbox-Webhooks müssen diese Testversion erreichen. Ein bestehender Sandbox-Webhook kann bearbeitet werden; kein zweiter identischer Eintrag ist nötig.

In der Vercel-Testumgebung explizit setzen:

| Variable | Wert in der Testversion |
| --- | --- |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Client-ID der vorhandenen Sandbox-App |
| `PAYPAL_CLIENT_ID` | Falls gesetzt: dieselbe Sandbox-Client-ID |
| `PAYPAL_SECRET` | Secret dieser Sandbox-App |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID` | Aktiver Plan aus demselben Sandbox-Händlerkonto |
| `PAYPAL_PLAN_IDS` | Falls gesetzt: ausschließlich die passenden Sandbox-Pläne, einschließlich des angebotenen Plans |
| `PAYPAL_WEBHOOK_ID` | ID des Sandbox-Webhooks dieser App mit der Testversion als Ziel |

Der aktuelle Servercode verwendet vorrangig `PAYPAL_SECRET` und akzeptiert für bestehende Einrichtungen alternativ `PAYPAL_CLIENT_SECRET`. Wenn beide gesetzt sind, gilt `PAYPAL_SECRET`; es findet kein zweiter Versuch mit einem anderen Secret statt. Das verwendete Secret muss zur Client-ID und zur API-Umgebung gehören. `PAYPAL_ENV` ersetzt die API-Basis nicht.

Der Testplan muss zur sichtbaren Preiseseite passen: 5,00 EUR je Monat, ein regulärer Abrechnungszyklus, keine Trialphase, Einrichtungsgebühr, Versand- oder Steuerzuschläge. Die Preiseseite verwendet EUR; der Server überprüft Zahlungen gegen den verifizierten Plan. Live-Plan-IDs lassen sich nicht einfach als Sandbox-Plan verwenden.

Die Sandbox-Testversion braucht eigene Supabase-Werte, die erforderlichen Migrationen und einen eigenen Sitzungsschlüssel. Anmeldung verwendet weiterhin E-Mail-Codes: Test-SMTP/Mail-Sink ausdrücklich konfigurieren, da `ENABLE_SMTP=false` den Versand zur Laufzeit nicht abschaltet. Der Zugang wird genau der vom PayPal-Abo bestätigten `subscription.subscriber.email_address` zugeordnet. Mit dieser Sandbox-Käuferadresse anmelden; bei einer Standard-Testadresse muss der Mail-Sink auch deren Code auffangen und für den Test bereitstellen. Eine andere App-E-Mail wird nicht automatisch als Eigentümer eingetragen.

Produktions-Firebase-Zugangsdaten in der Testversion weglassen. `NEXT_PUBLIC_PAYMENT_URL` in der Preview leer oder relativ halten, damit der Zahlungslink nicht auf die Produktionsseite führt. `ENABLE_PAYPAL` und `PAYPAL_BASE` konfigurieren die aktuelle PayPal-Laufzeit nicht; maßgeblich ist `PAYPAL_API_BASE`.

Vercel-Variablen passend zur Testumgebung setzen; bei einer Preview den Bereich Preview verwenden. Öffentliche Werte werden beim Build eingebaut: nach der Einrichtung die Testversion neu bauen und deployen. Das bereits vorhandene Deployment übernimmt diese Änderungen nicht rückwirkend.

Mit vollständig vorhandenen lokalen Werten kann die neue Datenbankeinrichtung rein lesend geprüft werden:

```powershell
node .\scripts\check-rest-setup.mjs
if ($LASTEXITCODE -ne 0) { throw 'Einrichtung noch nicht vollständig.' }
```

Der Test liest keine Kundendatensätze und sendet keine Zahlung, E-Mail oder Pushnachricht. Fehlende lokale Variablen belegen keine fehlenden Vercel-Variablen. Er ersetzt weder den PayPal-Sandboxtest noch die Kontrolle der Einstellungen in Vercel.

## Bedeutung für vorhandene Daten

Eine spätere, ausdrücklich gewünschte Bereinigung alter Quiztabellen wird separat vorbereitet. Der Datenbankcheck, die Absicherung der Kontotabellen und die manuelle Löschdatei sind in [supabase-aufraeumen.md](supabase-aufraeumen.md) beschrieben. Die Ranglistenmigration selbst löscht weiterhin keinen Altbestand.

Neue Ranglistenpunkte stammen aus vollständig ausgewerteten Serverrunden. Antwort und Zeitbonus werden serverseitig bestimmt. Quizname und Ranglistenland sind einem Konto zugeordnet. Alte Ranglistenwerte werden in ihren bisherigen Tabellen aufbewahrt und nicht in die neue Wertung übernommen. Alte Namen sind reserviert, da der ursprüngliche Besitzer bisher nicht verlässlich gespeichert wurde; zunächst ist ein neuer freier Quizname erforderlich. Eine belegte Zuordnung eines alten Namens kann später vor der neuen Registrierung gezielt durch einen Administrator migriert werden. Niemals einen alten Namen anhand eines Browserwerts oder einer Behauptung übertragen.

Die persönliche Auswertung behält frühere Quizresultate. Die Migration kennzeichnet sie als `self_reported`; neue Serverrunden als `server_verified`. Die bisherigen Summen enthalten beide, damit frühere Lernverläufe erhalten bleiben. Der Ansitzsimulator bleibt eine persönliche Übung mit vom Browser gemeldetem Ergebnis und ist keine Wettbewerbswertung.

Für neue, unterstützte PayPal-Abos gewährt eine vollständig bestätigte reguläre Zahlung genau das verifizierte Planintervall ab Zahlungszeitpunkt. `ACTIVE` und ein angekündigter nächster Abbuchungstermin allein schalten nichts frei. Eine Kündigung, Aussetzung oder ein Aboende lässt ausschließlich den bereits bezahlten Zeitraum bestehen. Vollständige Erstattung oder Rückbuchung entfernt die Deckung der betroffenen Zahlung; eine Teilerstattung belässt nach der aktuellen Produktregel den ursprünglichen Zeitraum. Dies ist die ausdrücklich implementierte Zugangsregel, kein aus PayPal-Statusnamen abgeleitetes Versprechen.

Der ausdrücklich konfigurierte neue Testplan ist die einzige zugelassene Ausnahme: drei kostenlose Tage ab dem von PayPal bestätigten Abostart, danach 5,00 EUR je Monat. Einrichtung, Zustimmung, Zeitgrenzen und Kündigung sind in [paypal-testzugang.md](paypal-testzugang.md) beschrieben. Andere Trials, Einrichtungsgebühren, mehrere weitere Abrechnungszyklen, Versand, Steuern, Mengenstaffeln oder unpassende Beträge werden weiterhin zur Prüfung markiert und nicht automatisch freigeschaltet. Geänderte Planintervalle rechnen bereits bekannte Zahlungen nicht rückwirkend um.

Vorhandene `userprofile.is_premium=true`-Konten bleiben als manuelle oder ungeklärte Altzugänge erhalten. Deshalb ist eine Kündigung eines solchen alten Abos noch kein automatischer Entzug dieses historischen Flags. Vor einer Bereinigung müssen ursprüngliche PayPal-Abo-ID, eigenes Händlerkonto, zahlende E-Mail und manuelle Ausnahmen eindeutig abgeglichen werden. Änderungen an der PayPal-E-Mail lösen keine automatische Übertragung des Zugangs auf ein anderes Konto aus.

## Veröffentlichen und anschließend prüfen

Erst nach erfolgreicher Einrichtung in PowerShell mit Node 22 bauen und die vorbereiteten Änderungen übertragen. Der folgende Block verwendet Node 22 nur für diesen Build:

```powershell
& {
    Set-Location 'C:\Projekte\jagdlatein-github'
    $taskNode22Exe = npx --yes --package=node@22 node -p 'process.execPath'
    if ($LASTEXITCODE -ne 0 -or !$taskNode22Exe) { throw 'Node 22 konnte nicht bereitgestellt werden.' }
    $taskPreviousPath = $env:PATH
    try {
        $env:PATH = (Split-Path -Parent $taskNode22Exe) + ';' + $taskPreviousPath
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Build fehlgeschlagen.' }
    } finally {
        $env:PATH = $taskPreviousPath
    }
    git commit -m "Rest prüfen: Abo-Laufzeiten, verifizierte Quizrunden und Fachquellen"
    if ($LASTEXITCODE -ne 0) { throw 'Commit fehlgeschlagen.' }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push fehlgeschlagen.' }
}
```

Nach dem erfolgreichen Vercel-Deployment: anmelden, einen freien Quiznamen wählen, eine Runde mit richtigen und falschen Antworten sowie einem Timeout abschließen, die Erklärung und 10 Sekunden Anzeige prüfen, dann Rangliste und persönliche Auswertung vergleichen. Die Zahl der Runden darf beim erneuten Laden oder Wiederholen einer Speicheranfrage nicht steigen. Die Wiederaufnahme zeigt den zuletzt gespeicherten Rundenstand; ein zweites Gerät kann diesen zwischenzeitlich weitergeschaltet haben.

PayPal-Aktivierung, Wiederabbuchung, Kündigung, Ablauf und Erstattung müssen anschließend mit einem passend konfigurierten Sandbox-Plan in einer Preview-Umgebung geprüft werden. Hier wurden keine echten oder Sandbox-Zahlungen ausgeführt und keine Live-Einstellungen verändert.

Technische Grundlagen: [Supabase-Datenbankfunktionen](https://supabase.com/docs/guides/database/functions), [PostgreSQL-Sperren](https://www.postgresql.org/docs/current/explicit-locking.html), [PayPal-Subscriptions-API](https://developer.paypal.com/docs/api/subscriptions/v1/), [PayPal-Webhookereignisse](https://developer.paypal.com/api/rest/webhooks/event-names/).
