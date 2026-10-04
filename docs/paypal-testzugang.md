# Drei Tage kostenlos, danach PayPal-Abo

Der neue Tarif beginnt mit drei kostenlosen Tagen. Der Kunde bestaetigt schon zu Beginn in PayPal, dass anschliessend **5 EUR pro Monat** bis zur Kuendigung abgebucht werden. Ohne diese Zustimmung beginnt kein Testzugang. Die App prueft das bestaetigte Abo bei PayPal und zeigt das Ende des Testzugangs im Konto.

PayPal bildet die drei Tage als einen kostenlosen Testzyklus ab; danach beginnt der normale Monatszyklus. Der bisherige Monatsplan bleibt fuer bestehende Abos erhalten. [PayPal: Testzeitraum](https://developer.paypal.com/subscriptions/trial-period/), [PayPal: Abrechnungszyklen](https://developer.paypal.com/platforms/subscriptions/customize/billing-cycles/).

## 1. Neuen Live-Plan vorbereiten

In PowerShell im Projekt ausfuehren:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-paypal-trial.ps1 -Step Prepare
```

Der Helfer fragt nach der **Client-ID und dem Secret derselben PayPal-Live-App**, sofern diese nicht bereits als `PAYPAL_CLIENT_ID`/`NEXT_PUBLIC_PAYPAL_CLIENT_ID` und `PAYPAL_SECRET`/`PAYPAL_CLIENT_SECRET` in dieser PowerShell-Sitzung gesetzt sind. Das Secret verdeckt in der Eingabe einfuegen. Es wird weder gespeichert noch ausgegeben. Eine `.env`-Datei wird nicht automatisch eingelesen. Keine Zugangsdaten in den Chat kopieren.

`Prepare` liest nur den bestehenden Live-Plan `P-9XU38461YG7706134NESJQWA` und dessen Produkt. Er muss weiterhin ein aktiver Tarif ueber 5 EUR pro Monat ohne zusaetzliche Gebuehren sein. Der Helfer schreibt die pruefbaren neuen Bedingungen nach `%LOCALAPPDATA%\Jagdlatein\paypal-trial\plan.json` und die Request-ID nach `state.json`; er legt noch keinen Plan an.

```powershell
Get-Content -LiteralPath "$env:LOCALAPPDATA\Jagdlatein\paypal-trial\plan.json" -Raw
```

Die Datei enthaelt genau zwei Zyklen: einmal 3 Tage fuer 0 EUR, danach monatlich 5 EUR ohne festes Ende. Keine Einrichtungsgebuehr und keine zusaetzliche Steuer werden aufgeschlagen. Die Dateien enthalten keine Kundendaten und kein Secret. Sie bleiben ausserhalb des Git-Projekts.

## 2. Geprueften Plan anlegen

```powershell
& .\scripts\setup-paypal-trial.ps1 -Step Create
```

Dieser ausdrueckliche Schritt legt den neuen **aktiven Live-Plan** an. Er startet kein Kundenabo, zieht kein Geld ein und aendert keinen bestehenden Plan. Danach liest der Helfer den neuen Plan erneut und prueft Preis, Waehrung, Dauer und Gebuehren, bevor er die neue Plan-ID ausgibt.

Die gespeicherte Request-ID wird bei einem erneuten Versuch wiederverwendet. PayPal bewahrt Plan-Request-IDs 72 Stunden auf; der Helfer sperrt unklare Wiederholungen nach 71 Stunden, um keinen zweiten Plan anzulegen. Die Vorbereitungsdateien deshalb bei einem unklaren Fehler nicht loeschen oder veraendern. [PayPal: Create plan](https://developer.paypal.com/api/subscriptions/v1/plans-create), [PayPal: Idempotenz](https://developer.paypal.com/api/rest/reference/idempotency/).

Ist der Plan schon angelegt, liest ein wiederholter `Create`-Aufruf nur dessen bekannten Zustand. Eine rein lesende Pruefung ist auch moeglich mit:

```powershell
& .\scripts\setup-paypal-trial.ps1 -Step Status
```

Falls PayPal den Plan angelegt hat, die Antwort aber verloren ging: den neuen Plan im PayPal-Live-Konto suchen und dessen ID ausdruecklich uebergeben. Das liest den Plan und speichert das gepruefte Ergebnis; es legt keinen weiteren Plan an.

```powershell
& .\scripts\setup-paypal-trial.ps1 -Step Status -CreatedPlanId 'P-NEUEPLANIDHIERERSETZEN'
```

## 3. Datenbank und Vercel verbinden

Vor der Freischaltung die neue SQL-Migration `supabase/migrations/20261004130000_subscription_trial.sql` fuer den Testzugang in Supabase ausfuehren. Sie ergaenzt die bestehende Aboverwaltung; bisherige bezahlte Zeitraeume, Konten und Lernfortschritte bleiben erhalten. Dieser PowerShell-Schritt kopiert den vorbereiteten SQL-Text in die Zwischenablage:

```powershell
& .\scripts\setup-account.ps1 -Step TrialSubscriptionSql
```

Den Text im Supabase SQL Editor einfuegen und ausfuehren.

In Vercel fuer das Projekt der oeffentlichen App und Umgebung **Production** setzen:

| Variable | Wert |
| --- | --- |
| `NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID` | Die vom Helfer bestaetigte neue `P-...`-ID |
| `PAYPAL_PLAN_IDS` | Bisherige erlaubte IDs einschliesslich `P-9XU38461YG7706134NESJQWA`, danach zusaetzlich die neue ID, mit Komma getrennt |
| `PAYPAL_TRIAL_PLAN_IDS` | Die neue Testplan-ID und gegebenenfalls bisherige Testplan-IDs, mit Komma getrennt; zur weiteren Verarbeitung dieser Abos beibehalten |

Der Helfer gibt die drei vorbereiteten Zeilen aus. Weitere bisher nur in Vercel eingetragene erlaubte Plan- und Testplan-IDs ebenfalls beibehalten. Die Live-Client-ID, das Live-Secret, `PAYPAL_API_BASE=https://api-m.paypal.com`, die Live-Webhook-ID und `NEXT_PUBLIC_PAYPAL_PLAN_ID` beibehalten.

Den neuen App-Code bereitstellen und nach Aenderung der Variablen ein neues Vercel-Deployment starten. Der neue kostenlose Tarif wird erst mit der neuen Trial-Plan-ID angeboten. Vor dem Checkout prueft die App die neue Datenbankstruktur ohne Kundendaten und den aktiven Plan direkt bei PayPal; ein falscher Preis oder Testzeitraum verhindert den Abschluss. Bestehende Abos wechseln dadurch nicht den Tarif.

Der lokale Build und die automatisierten Pruefungen sind erfolgreich. Die vorbereiteten Git-Aenderungen enthalten auch die vorherige PayPal-Kompatibilitaetskorrektur und die gepruefte Datenbankbereinigung. Nach der Einrichtung in PowerShell veroeffentlichen:

```powershell
& {
    Set-Location 'C:\Projekte\jagdlatein-github'
    git diff --cached --stat
    git commit -m "PayPal-Testzugang und gepruefte Datenbankbereinigung"
    if ($LASTEXITCODE -ne 0) { throw 'Commit fehlgeschlagen.' }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push fehlgeschlagen.' }
}
```

Anschliessend in Vercel pruefen, dass das neue Deployment erfolgreich ist. Hier wurde keine echte oder Sandbox-Zahlung ausgefuehrt; ein vollstaendiger Zahlungsdurchlauf ist damit noch nicht nachgewiesen.

## 4. Verhalten pruefen

Der reproduzierbare, getrennte Testablauf mit PowerShell-Helfer, lokalen SQL-/Webhookregressionen und einem ehrlichen offenen Anbieterstatus steht in [paypal-sandbox-pruefung.md](paypal-sandbox-pruefung.md). Die öffentliche App ist keine Sandbox-Testversion.

Die Preisseite muss **3 Tage kostenlos, danach 5 EUR/Monat** zeigen. PayPal muss vor Abschluss denselben Tarif zur ausdruecklichen Bestaetigung anzeigen. Im Konto steht nach der Bestaetigung das Ende des Testzugangs. Die Anmeldung verwendet die bei PayPal bestaetigte E-Mail-Adresse. Das Ende ist fest auf **die bei PayPal verifizierte Startzeit plus 72 Stunden** begrenzt; ein neuer Login oder erneut empfangener Webhook verschiebt es nicht. Anschliessend wird Zugang anhand bestaetigter Zahlungen gewaehrt.

Bei einer Kuendigung wird der kostenlose Zugriff nach der verifizierten Statusaenderung beendet. Ohne frueher eintreffenden Webhook kann die Aktualisierung einschliesslich kurzer Sitzungsgueltigkeit bis zu sechs Minuten dauern. Das feste Testende wird dadurch nicht verlaengert. Eine nicht moegliche Anbieterpruefung verlaengert den Testzugang ebenfalls nicht.

Fuer eine Zahlung ohne echtes Geld eine getrennte Sandbox-App, einen Sandbox-Plan, eine getrennte Testbereitstellung und eine getrennte Testdatenbank verwenden. Die oeffentliche App bleibt auf Live eingestellt. Der Live-Einrichtungshelfer erstellt keine Testzahlungen.

Zurueck zum bisherigen Angebot: `NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID` in Vercel entfernen und neu bereitstellen. Die neue Plan-ID **sowohl in `PAYPAL_PLAN_IDS` als auch in `PAYPAL_TRIAL_PLAN_IDS` behalten**, solange Abos dieses Plans bestehen; ihre Zahlungen werden weiter verarbeitet. Eine Entfernung der Anzeige kuendigt kein bereits bestaetigtes Kundenabo.
