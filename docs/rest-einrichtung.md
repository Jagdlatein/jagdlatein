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

- `BILLING.SUBSCRIPTION.ACTIVATED`, `UPDATED`, `CANCELLED`, `SUSPENDED`, `EXPIRED`, `PAYMENT.FAILED` (jeweils mit dem vollständigen Präfix `BILLING.SUBSCRIPTION.`).
- `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`, `PAYMENT.SALE.REVERSED`.

Im Vercel-Projekt müssen Supabase-URL und `SUPABASE_SERVICE_ROLE_KEY`, `JL_SESSION_SECRET` (mindestens 32 Bytes), `PAYPAL_CLIENT_ID` oder `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` und `PAYPAL_WEBHOOK_ID` vorhanden sein. Client-ID, Secret, Webhook und Plan müssen zum selben PayPal-Modus und Händlerkonto gehören. `PAYPAL_PLAN_IDS` oder `NEXT_PUBLIC_PAYPAL_PLAN_ID` muss den angebotenen Plan zulassen; ohne diese Angaben bleibt die bereits vorhandene feste Plan-ID aktiv. `PAYPAL_API_BASE` ist ausschließlich eine freigegebene offizielle PayPal-API-URL; ohne Angabe verwendet der Server Live-PayPal. Zugangsdaten bleiben in den bisherigen Umgebungsvariablen, niemals in Git.

Mit vollständig vorhandenen lokalen Werten kann die neue Datenbankeinrichtung rein lesend geprüft werden:

```powershell
node .\scripts\check-rest-setup.mjs
if ($LASTEXITCODE -ne 0) { throw 'Einrichtung noch nicht vollständig.' }
```

Der Test liest keine Kundendatensätze und sendet keine Zahlung, E-Mail oder Pushnachricht. Fehlende lokale Variablen belegen keine fehlenden Vercel-Variablen. Er ersetzt weder den PayPal-Sandboxtest noch die Kontrolle der Einstellungen in Vercel.

## Bedeutung für vorhandene Daten

Neue Ranglistenpunkte stammen aus vollständig ausgewerteten Serverrunden. Antwort und Zeitbonus werden serverseitig bestimmt. Quizname und Ranglistenland sind einem Konto zugeordnet. Alte Ranglistenwerte werden in ihren bisherigen Tabellen aufbewahrt und nicht in die neue Wertung übernommen. Alte Namen sind reserviert, da der ursprüngliche Besitzer bisher nicht verlässlich gespeichert wurde; zunächst ist ein neuer freier Quizname erforderlich. Eine belegte Zuordnung eines alten Namens kann später vor der neuen Registrierung gezielt durch einen Administrator migriert werden. Niemals einen alten Namen anhand eines Browserwerts oder einer Behauptung übertragen.

Die persönliche Auswertung behält frühere Quizresultate. Die Migration kennzeichnet sie als `self_reported`; neue Serverrunden als `server_verified`. Die bisherigen Summen enthalten beide, damit frühere Lernverläufe erhalten bleiben. Der Ansitzsimulator bleibt eine persönliche Übung mit vom Browser gemeldetem Ergebnis und ist keine Wettbewerbswertung.

Für neue, unterstützte PayPal-Abos gewährt eine vollständig bestätigte reguläre Zahlung genau das verifizierte Planintervall ab Zahlungszeitpunkt. `ACTIVE` und ein angekündigter nächster Abbuchungstermin allein schalten nichts frei. Eine Kündigung, Aussetzung oder ein Aboende lässt ausschließlich den bereits bezahlten Zeitraum bestehen. Vollständige Erstattung oder Rückbuchung entfernt die Deckung der betroffenen Zahlung; eine Teilerstattung belässt nach der aktuellen Produktregel den ursprünglichen Zeitraum. Dies ist die ausdrücklich implementierte Zugangsregel, kein aus PayPal-Statusnamen abgeleitetes Versprechen.

Trials, Einrichtungsgebühren, mehrere Abrechnungszyklen, Versand, Steuern, Mengenstaffeln oder unpassende Beträge werden zur Prüfung markiert und nicht automatisch freigeschaltet. Das Produkt muss einen einfachen regulären Festpreisplan anbieten. Geänderte Planintervalle rechnen bereits bekannte Zahlungen nicht rückwirkend um.

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
