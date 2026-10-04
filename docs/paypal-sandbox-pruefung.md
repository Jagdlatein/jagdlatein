# PayPal: getrennte Testversion und vollständiger Abo-Test

Stand: 4. Oktober 2026. **Eine getrennte Testumgebung ist noch nicht eingerichtet.** `https://jagdlatein.vercel.app` ist die öffentliche App. Dieser Ablauf verändert dort keine Variablen, Pläne, Abos oder Daten. Die Live-Anleitung `setup-paypal-trial.ps1` gehört nicht in diesen Testablauf.

## Sofort nutzbare PowerShell-Prüfung

Nur die Befehlszeilen über die Kopierfunktion kopieren. Wörter wie `powershell`, die drei Markdown-Backticks und `PS C:\…>` nicht in die Konsole eingeben.

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-paypal-sandbox.ps1 -Step Prepare
& .\scripts\setup-paypal-sandbox.ps1 -Step Check
```

Die Vorlage und der ehrliche Prüfstatus stehen außerhalb des Projekts unter `%LOCALAPPDATA%\Jagdlatein\paypal-sandbox`. `Check` fragt keine Secrets ab und sendet keine Anfrage. Solange die getrennten Ziele fehlen, steht der Bericht auf `pending`.

Die lokalen Regressionen führen die echten App-Routen und beide PostgreSQL-Abo-Migrationen mit einem isolierten PostgreSQL im Arbeitsspeicher aus. **PayPal-Antworten und Signaturprüfung werden simuliert.** Dafür ist keine Datenbankadresse, kein Secret und kein Kundenkonto erforderlich. Einmalig wird eine festgelegte Testbibliothek außerhalb des Git-Projekts installiert; Node 22 und `npm.cmd` müssen vorhanden sein.

```powershell
& .\scripts\setup-paypal-sandbox.ps1 -Step LocalTests -InstallTestRuntime
```

Bei mehreren Node-Versionen kann `-NodePath 'C:\Pfad\zu\Node22\node.exe'` ergänzt werden. Folgeprüfungen benötigen `-InstallTestRuntime` nicht mehr. Es werden Ablauf nach genau 72 Stunden, Wiederholungen, reguläre Zahlung, Kündigung, Ausfall, Erstattung, falsche Preise, ungültige Signaturen und fremde Netzwerkknoten geprüft. Das erfolgreiche Testergebnis ersetzt keinen echten Sandbox-Zahlungsdurchlauf.

## Eigene Testumgebung vorbereiten

1. Ein **eigenes Vercel-Testprojekt** mit derselben Repository-Version anlegen. Seine separate Adresse in `config.json` bei `testUrl` eintragen. Die öffentliche Adresse bleibt bei `publicUrl` stehen. Keine Sandbox-Werte in Production oder All Environments der öffentlichen App setzen.
2. Ein **neues, leeres Supabase-Testprojekt** anlegen. Keine Kundenkonten oder Zahlungsdaten aus der öffentlichen Datenbank kopieren. Der besondere Testentwurf `supabase/test-only/paypal-sandbox-bootstrap.sql` legt die bisher nicht versionierten Basistabellen `userprofile` und `login_codes` an und lehnt vorhandene Tabellen strikt ab. Er gehört ausschließlich zur Einrichtung dieses frischen Testprojekts, nicht zu den Produktionsmigrationen.
3. Beide nicht geheimen Supabase-Projektadressen in `config.json` eintragen. Sie müssen verschiedene Projektkennungen besitzen. Die tatsächlichen Vercel-Werte für `SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_URL` mit der Testadresse vergleichen. Erst danach `separateDatabaseConfirmed` auf `true` setzen. Die automatische Prüfung liest die konfigurierte Testdatenbank; sie hat keinen Zugriff auf die geheimen Vercel-Einstellungen und kann diese Zuordnung nicht selbst beweisen.
4. Eine eigene **PayPal-Sandbox-App**, einen Sandbox-Händler und einen separaten Sandbox-Käufer verwenden. In dieser App zwei aktive Pläne anlegen: 5 EUR je Monat sowie einmal 3 Tage kostenlos, danach 5 EUR je Monat ohne festes Ende. Keine Einrichtungsgebühren, Steuerzuschläge, Versand oder variable Mengen. Die Sandbox-Plan-IDs in `regularPlanId` und `trialPlanId` eintragen; die vorhandenen Live-IDs werden vom Helfer gesperrt. Client-ID und Webhook-ID sind nicht geheim und gehören ebenfalls in `config.json`; **Secrets niemals dort speichern**.
5. Einen **isolierten Mail-Sink** konfigurieren, der ausschließlich Testnachrichten auffängt und keinen externen Versand zulässt. `ENABLE_SMTP=false` ist kein Laufzeit-Versandschalter. Die Testversion ohne Firebase-/Produktions-Pushzugang betreiben. Den Mail-Sink tatsächlich prüfen und erst dann `mailSinkConfirmed=true` setzen.

Im eigenen Vercel-Testprojekt folgende Werte setzen. Die Secrets dort als Secret speichern; ein eigener Sitzungsschlüssel muss mindestens 32 Bytes lang sein.

| Variable | Testwert |
| --- | --- |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` |
| `PAYPAL_CLIENT_ID`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | dieselbe Sandbox-App |
| `PAYPAL_SECRET` | Secret ausschließlich dieser Sandbox-App |
| `PAYPAL_WEBHOOK_ID` | Sandbox-Webhook mit Ziel `https://DEINE-TESTVERSION.vercel.app/api/paypal/webhook` |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID` | regulärer Sandbox-Monatsplan |
| `NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID` | Sandbox-Plan mit drei kostenlosen Tagen |
| `PAYPAL_PLAN_IDS` | beide Sandbox-Plan-IDs, mit Komma getrennt |
| `PAYPAL_TRIAL_PLAN_IDS` | ausschließlich die Sandbox-Testplan-ID |
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | eigene Supabase-Testadresse |
| `SUPABASE_SERVICE_ROLE_KEY` | ausschließlich Schlüssel der Testdatenbank |
| `JL_SESSION_SECRET` | eigener Testschlüssel |
| `NEXT_PUBLIC_PAYMENT_URL` | leer oder relative Adresse; kein Link zur öffentlichen App |

Der Sandbox-Webhook benötigt `BILLING.SUBSCRIPTION.ACTIVATED`, `UPDATED`, `CANCELLED`, `SUSPENDED`, `EXPIRED`, `PAYMENT.FAILED` sowie `PAYMENT.SALE.COMPLETED`, `REFUNDED`, `REVERSED`. Für die ersten sechs Namen ist jeweils das Präfix `BILLING.SUBSCRIPTION.` gemeint. Neue Testbereitstellung bauen, damit die öffentlichen Variablen eingebaut werden.

Nach dem Ausfüllen und Bestätigen der getrennten Ziele kann das vollständige Testschema vorbereitet werden:

```powershell
& .\scripts\setup-paypal-sandbox.ps1 -Step TestDatabaseSql
```

Das kopiert den Basisschema-Entwurf und alle sieben bestehenden Migrationen in der richtigen Reihenfolge als **eine gemeinsame Transaktion** in die Zwischenablage und speichert die lesbare Datei außerhalb des Git-Projekts. Vor „Run“ im Supabase SQL Editor die Projektkennung mit `testSupabaseUrl` vergleichen. Der Helfer selbst führt keine Datenbankänderung aus; ein vorhandenes öffentliches Tabellenschema lässt die Transaktion scheitern. Vor einem Wiederholungsversuch das Ergebnis prüfen: dieser Schritt ist ausschließlich für eine frische Testdatenbank gedacht.

Erst mit der ausgefüllten Vorlage kann die Anbieterprüfung ausdrücklich rein lesend gestartet werden:

```powershell
& .\scripts\setup-paypal-sandbox.ps1 -Step Check -Online
```

Secret und Testdatenbankschlüssel werden verdeckt abgefragt, nur für den Prüfprozess verwendet und weder gespeichert noch ausgegeben. Der Helfer liest die beiden Sandbox-Pläne, Webhook-Ziel und Ereignisse, Datenbankspalten mit `limit=0` und das öffentliche Tarifangebot der Testversion. Er folgt keinen Weiterleitungen und erstellt keine Produkte, Pläne, Abos oder Zahlungen. Einziger POST ist der Sandbox-Zugangstoken. Ein bestandener Einrichtungscheck lässt `providerLifecycle` bewusst auf `pending`.

## Echten Sandbox-Ablauf nachweisen

Für jeden Fall ein eigenes Sandbox-Abo verwenden und die Abo-ID sowie Ereignis-/Transaktions-ID nur im privaten Testprotokoll festhalten. Anmeldung immer mit der von PayPal bestätigten Käufer-E-Mail; den Code ausschließlich im Mail-Sink abrufen. Keine Test-Mail an reale Lernende senden.

| Fall | Durchführung | Erwarteter Nachweis |
| --- | --- | --- |
| Zustimmung | Auf der **Testversion** PayPal öffnen; vor Bestätigung 3 Tage gratis und anschließend 5 EUR monatlich vergleichen; zunächst abbrechen | Kein Zugang durch bloßes Öffnen/Abbrechen und kein gespeichertes aktives Abo |
| Trialbeginn | Neues Testabo in PayPal Sandbox ausdrücklich bestätigen | `ACTIVE`, Start von PayPal, festes `trial_until=start+72h`, `paid_until=null`, Konto zeigt Testende |
| Wiederholung | Bestätigung nochmals abrufen, anmelden und das echte Aktivierungsereignis erneut zustellen | Gleiches Testende; kein zweiter Zahlungsdatensatz; keine zusätzliche Gratiszeit |
| Ablauf ohne Zahlung | Eigenes abgelaufenes Trial ohne erfolgreiche Zahlung prüfen | Lernbereich gesperrt und Abo-Seite angeboten; Konto/Community bleiben erreichbar |
| Erste Abbuchung | Dasselbe ungekündigte Abo bis zur tatsächlichen ersten Sandbox-Transaktion beobachten | Provider-Transaktion `COMPLETED`, exakt 5 EUR; gleiche Transaktions-ID einmal in der Testdatenbank; `paid_until` genau ein verifiziertes Monatsintervall ab Zahlung |
| Kündigung im Trial | Separates Trial-Abo im Sandbox-Käuferkonto kündigen | Nach Provider-Verifizierung kostenloser Zugang beendet; Trialende unverändert; ohne Zahlung keine bezahlte Deckung |
| Kündigung nach Zahlung | Eigenes bezahltes Sandbox-Abo kündigen | Keine neue Monatsdeckung; bereits bestätigte Deckung bis zu ihrem Ablauf erhalten |
| Zahlungsausfall | Separates Sandbox-Abo mit dokumentierter Anbieterfehler-Konfiguration verwenden; aktuelle PayPal-Testmöglichkeiten prüfen | `FAILED`, `DECLINED` oder fehlende erfolgreiche Transaktion verlängert keinen Zeitraum; bereits bezahlter Zeitraum bleibt bis zum harten Ende |
| Erstattung | Separat bezahlte Sandbox-Zahlung vollständig erstatten und Ereignis erneut zustellen | Zahlungsstatus dauerhaft `REFUNDED`; die betroffene Deckung wird entfernt und durch ein altes Completion-Ereignis nicht wiederhergestellt |

Die drei Tage werden **nicht künstlich als abgeschlossen markiert**. Ein Modell mit verkürztem Tarif oder vorgestellten Testuhren beweist nicht den echten Drei-Tage-Providerzyklus. Kann PayPal einen bestimmten Zahlungsausfall nicht reproduzieren, wird dieser Fall als nicht nachgewiesen dokumentiert; API-Fehlersimulation, Webhook-Simulator und lokale Testantworten sind dafür eigene, schwächere Nachweise.

Das lesende SQL `scripts/paypal-sandbox-evidence.sql` liefert zu genau einer Sandbox-Abo-/Trial-Plan-ID einen Bericht ohne E-Mail oder Kundennamen. Die zwei Platzhalter ersetzen und **nur im separaten Testprojekt** ausführen. Den Bericht jeweils mit den aktuellen Transaktionen im Sandbox-Händlerkonto und der Anzeige der Test-App vergleichen. SQL allein ist kein Provider-Zahlungsnachweis. Erwartete Status-/Zugangsänderungen können wegen Providerprüfung und Sitzung bis zu sechs Minuten benötigen; das feste Trialende bleibt unverändert.

Der Webhook-Simulator liefert Beispielereignisse und keine echte Abo- oder Transaktionshistorie. Er dient dem Transport-/Fehlertest. Die App liest vor Freischaltung die aktuelle Sandbox-Abo-/Transaktionshistorie; ein frei erfundenes Simulatorereignis ersetzt diese nicht.

## Aktueller Prüfstand

30 lokale Tests bestanden: 5 Isolations-/Einrichtungsregressionen und 25 Ablauf-/Schemaschutzprüfungen mit dem frischen Testschema und allen sieben echten SQL-Migrationen. Keine Zahlung, keine Live-Datenbankänderung und kein Mail-/Pushversand. **Echte Sandbox-Zustimmung, zeitgesteuerte erste Abbuchung und Provider-Zahlungsausfall bleiben offen**, solange die eigene Testumgebung fehlt.

Anbietergrundlagen: [PayPal: Subscription-Tests](https://developer.paypal.com/subscriptions/test-go-live), [Subscriptions-API](https://developer.paypal.com/api/subscriptions/v1), [Webhook-Simulator](https://developer.paypal.com/api/rest/webhooks/simulator/). Diese Dokumentation unterscheidet API-Fehlersimulationen von echten Sandbox-Abos; daraus wird keine beschleunigte Drei-Tage-Abrechnung abgeleitet.
