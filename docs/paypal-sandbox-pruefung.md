# PayPal: getrennte Testversion und vollständiger Abo-Test

Stand: 4. Oktober 2026. **Die PayPal-Seite der Sandbox ist eingerichtet: ein Produkt und zwei aktive Testpläne sind angelegt und durch einen zweiten lesenden Abruf bei PayPal verifiziert.** Eine vorhandene Sandbox-App und getrennte Schweizer Sandbox-Händler-/Käuferkonten sind verfügbar. Das separate Vercel-Testprojekt `jagdlatein-sandbox` mit der Adresse `https://jagdlatein-sandbox.vercel.app` ist vorbereitet; öffentliche Sandbox-Werte sind dort gespeichert. In der kostenfreien Supabase-Organisation `Jagdlatein Sandbox` (`hpwjlrdmadehssdplumz`) ist das Testprojekt `jagdlatein-sandbox` (`xwkvrsuplytalwploebw`) angelegt. Sein Schema wurde als eine Transaktion erfolgreich eingerichtet: 14 Tabellen, ohne Kopie von Nutzern oder Zahlungsdaten. Die fünf separaten Test-Secrets sind nach ausdrücklicher Bestätigung in Vercel als Secret für Production und Preview gespeichert; **die Test-App ist noch nicht bereitgestellt**. `https://jagdlatein.vercel.app` ist die öffentliche App. Den privaten Anbieterstatus und die Kennungen zeigt `%LOCALAPPDATA%\Jagdlatein\paypal-sandbox\plans-report.json`. Dieser Ablauf verändert in der öffentlichen App keine Variablen, Pläne, Abos oder Daten. Die Live-Anleitung `setup-paypal-trial.ps1` gehört nicht in diesen Testablauf.

## PayPal-Sandbox-Tarife anlegen

Im PayPal-Entwicklerbereich **Sandbox** auswählen und die vorhandene Sandbox-App öffnen. Ihre vollständige Client-ID über das Kopiersymbol übernehmen und in die lokale `config.json` eintragen. Eine über mehrere Zeilen angezeigte ID gehört vollständig zu diesem Wert. Keine Live-Client-ID, Live-Plan-ID oder Live-Secrets verwenden. Die vorhandenen Händler- und Käufer-Testkonten können weiterverwendet werden; ihre Passwörter bleiben bei PayPal.

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-paypal-sandbox-plans.ps1 -Step Prepare
```

`Prepare` sendet keine Anfrage. Es speichert außerhalb des Git-Projekts unter `%LOCALAPPDATA%\Jagdlatein\paypal-sandbox\plans-state.json` ein eigenes Sandbox-Produkt und zwei feste Tarifentwürfe: 5 EUR monatlich sowie einmal 3 Tage kostenlos, anschließend 5 EUR monatlich ohne festes Ende. Beide haben keine Einrichtungsgebühr oder Steuerzuschläge. PayPal vergibt die Produktkennung; die Tarifentwürfe werden danach an genau dieses Produkt gebunden. In dieser Datei stehen keine Secrets. Die Entwürfe und Wiederholungskennungen bleiben bei erneutem Aufruf erhalten.

Nach Prüfung der gespeicherten Bedingungen:

```powershell
& .\scripts\setup-paypal-sandbox-plans.ps1 -Step Create
& .\scripts\setup-paypal-sandbox-plans.ps1 -Step Status
```

Beide Schritte fragen das Secret **derselben Sandbox-App verdeckt** ab. `Create` legt ausschließlich ein Sandbox-Produkt und zwei aktive Sandbox-Pläne an und prüft danach die bei PayPal gespeicherten Bedingungen. Es schließt kein Abo ab, erstellt keine Zahlung oder Webhooks und greift auf keine Datenbank zu. `Status` liest die vorhandenen Ressourcen; sein einziger POST ist der Sandbox-Zugangstoken. Der Bericht `plans-report.json` unterscheidet vorbereitete, offene und bei PayPal verifizierte Ressourcen. Auch bei verifizierten Plänen bleibt der echte Zahlungsdurchlauf offen.

Die nicht geheimen Werte für das **getrennte** Vercel-Testprojekt stehen nach erfolgreicher Verifikation in `paypal-values.txt`; die beiden Plan-IDs werden auch in die lokale Sandbox-Vorlage übernommen. Das Secret steht in keiner Ausgabedatei. Diese Werte gehören nicht in die öffentliche App.

Bei mehreren Node-Versionen kann jeder Aufruf um `-NodePath 'C:\Pfad\zu\Node22\node.exe'` ergänzt werden. Der Helfer benötigt Node 22 oder neuer und wurde auch über Windows PowerShell 5.1 aufgerufen.

Bei einem Abbruch die Zustandsdatei **nicht löschen**: bestätigte IDs werden sofort gespeichert und nicht nochmals angelegt. Für unbestätigte Anfragen gelten dieselben gespeicherten Kennungen und Bedingungen. Nach 24 Stunden blockiert der Helfer eine erneute unbestätigte Anlage. Dann die vorhandenen IDs im Sandbox-Händlerkonto suchen und beispielsweise lesend wieder zuordnen:

```powershell
& .\scripts\setup-paypal-sandbox-plans.ps1 -Step Status -RegularPlanId 'P-DEINE_SANDBOX_PLAN_ID'
```

Erst eine erfolgreich geprüfte Zuordnung erlaubt die Fortsetzung fehlender Schritte. HTTP-Fehler nennen den festen Schritt, numerischen Status und gegebenenfalls bekannte feste Validierungscodes/Feldnamen; freie Antwortinhalte und Zugangsdaten werden nicht ausgegeben. `Zugangstoken; HTTP 401` bedeutet, dass PayPal die Anmeldung mit diesem Sandbox-Zugang nicht bestätigt hat. Dann zunächst die vollständige Client-ID und die Zuordnung beider Werte zur gleichen Sandbox-App prüfen. Neue oder geänderte Zugangsdaten direkt bei PayPal selbst anlegen, niemals in Chat, Git oder der Zustandsdatei speichern.

Der vorhandene Sandbox-Webhook `4DY22404SN0207804` wurde auf `https://jagdlatein-sandbox.vercel.app/api/paypal/webhook` umgestellt; die erforderlichen Abo-/Zahlungsereignisse bleiben ausgewählt. Dadurch erreichen künftige Sandbox-Ereignisse ausschließlich die eigene Testadresse. Live-Webhooks wurden nicht verändert. Die neue App ist noch nicht bereitgestellt; vor vollständiger Datenbank-/Mail-Konfiguration keine Testabos auslösen.

Anbietergrundlagen: [PayPal-Authentifizierung](https://developer.paypal.com/api/rest/authentication/), [Produktanlage](https://developer.paypal.com/api/catalog-products/v1/products-create/), [Plananlage](https://developer.paypal.com/api/subscriptions/v1/plans-create/). Das [Produktschema](https://developer.paypal.com/api/catalog-products/v1/schema.json) reserviert das Präfix `PROD-` für automatisch vergebene IDs. Produkt- und Plananlage dokumentieren 72 Stunden Speicherung der Wiederholungskennung; der Helfer verwendet vorsichtshalber ein Fenster unter 24 Stunden.

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
4. Die eigene **PayPal-Sandbox-App**, einen Sandbox-Händler und einen separaten Sandbox-Käufer verwenden. Die oben beschriebene Tarifanlage legt in dieser App zwei aktive Pläne an: 5 EUR je Monat sowie einmal 3 Tage kostenlos, danach 5 EUR je Monat ohne festes Ende. Keine Einrichtungsgebühren, Steuerzuschläge, Versand oder variable Mengen. Die Sandbox-Plan-IDs werden nach Verifikation in `regularPlanId` und `trialPlanId` übernommen; die vorhandenen Live-IDs werden vom Helfer gesperrt. Client-ID und Webhook-ID sind nicht geheim und gehören ebenfalls in `config.json`; **Secrets niemals dort speichern**.
5. Im eigenen Testprojekt `JL_TEST_ENVIRONMENT=paypal-sandbox` setzen. Dieser private Laufzeitmodus sperrt beide Pushrouten vor Datenbank/Firebase, blockiert die Live-PayPal-API und erlaubt Login-Mails ausschließlich über `smtp.ethereal.email:587` mit vollständigen eigenen Ethereal-Zugangsdaten, erzwungenem STARTTLS und gültigem TLS-Zertifikat. Fehlende oder falsche Werte brechen sicher ab; es gibt keinen Mail-/PayPal-Fallback. Die Preiseseite prüft jedes Angebot vor dem Laden des PayPal-SDK über den Server. Im Testmodus sind explizite passende öffentliche Sandbox-Werte erforderlich, bekannte Live-IDs werden gesperrt, und die tatsächlichen Sandbox-Planbedingungen werden geprüft. Der Link zur Aboverwaltung wird vom Server auf das Sandbox-Konto gesetzt; fehlende oder fremde URLs werden nicht angezeigt. Der Sender ist das Ethereal-Testpostfach. `ENABLE_SMTP=false` bleibt kein Laufzeit-Versandschalter. Produktions-Pushzugänge weglassen. Den Code der bereitgestellten Test-App tatsächlich im Testpostfach prüfen und erst dann `mailSinkConfirmed=true` setzen. [Ethereal fängt jede Nachricht ab und stellt sie keinem echten Empfänger zu](https://nodemailer.com/guides/testing-with-ethereal).

Im eigenen Vercel-Testprojekt folgende Werte setzen. Die Secrets dort als Secret speichern; ein eigener Sitzungsschlüssel muss mindestens 32 Bytes lang sein.

| Variable | Testwert |
| --- | --- |
| `JL_TEST_ENVIRONMENT` | `paypal-sandbox` |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` |
| `PAYPAL_CLIENT_ID`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | dieselbe Sandbox-App |
| `PAYPAL_SECRET` | Secret ausschließlich dieser Sandbox-App |
| `PAYPAL_WEBHOOK_ID` | Sandbox-Webhook ausschließlich mit Ziel `https://DEINE-TESTVERSION.vercel.app/api/paypal/webhook` |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID` | regulärer Sandbox-Monatsplan |
| `NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID` | Sandbox-Plan mit drei kostenlosen Tagen |
| `PAYPAL_PLAN_IDS` | beide Sandbox-Plan-IDs, mit Komma getrennt |
| `PAYPAL_TRIAL_PLAN_IDS` | ausschließlich die Sandbox-Testplan-ID |
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | eigene Supabase-Testadresse |
| `SUPABASE_SERVICE_ROLE_KEY` | ausschließlich Schlüssel der Testdatenbank |
| `JL_SESSION_SECRET` | eigener Testschlüssel |
| `NEXT_PUBLIC_PAYMENT_URL` | leer oder relative Adresse; kein Link zur öffentlichen App |
| `NEXT_PUBLIC_SITE_URL` | eigene Testadresse |
| `SMTP_HOST`, `SMTP_PORT` | `smtp.ethereal.email`, `587` |
| `SMTP_USER`, `SMTP_PASS` | eigenes frisches Ethereal-Testpostfach, keine Produktions-Zugangsdaten |

Der Sandbox-Webhook benötigt `BILLING.SUBSCRIPTION.ACTIVATED`, `UPDATED`, `CANCELLED`, `SUSPENDED`, `EXPIRED`, `PAYMENT.FAILED` sowie `PAYMENT.SALE.COMPLETED`, `REFUNDED`, `REVERSED`. Für die ersten sechs Namen ist jeweils das Präfix `BILLING.SUBSCRIPTION.` gemeint. Neue Testbereitstellung bauen, damit die öffentlichen Variablen eingebaut werden.

Sobald die beiden unterschiedlichen Supabase-Adressen eingetragen und mit `separateDatabaseConfirmed=true` bestätigt sind, kann das vollständige Testschema vorbereitet werden. Für diesen vorbereitenden Schritt werden noch keine Test-App, Webhook-ID oder bestätigte Login-Mail benötigt; der spätere vollständige Check verlangt sie weiterhin:

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

**132 zusammenhängende Regressionen und der vollständige `npm run build` mit 307 Seiten bestanden.** Die Tests umfassen 6 Isolations-/Einrichtungsregressionen, 25 Ablauf-/Schemaschutzprüfungen mit dem frischen Testschema und allen sieben echten SQL-Migrationen, 46 Regressionen für den Sandbox-Anlagehelfer, 20 Checkout-Prüfungen, 4 Prüfungen der sicheren Aboverwaltung, 8 Konto-/Middlewareprüfungen und 23 Kommunikationsregressionen. Sie prüfen unter anderem Teilabbrüche, verlorene Antworten, Wiederholungsschutz, sichere Fehlerphasen, falsche Tarife, den Login-Code-Hash sowie die Sperre beider Pushrouten vor Datenbank/Firebase. Automatische Providerantworten sind dabei simuliert. Der Build verwendete lokale Datenbank-Platzhalter und Sandbox-Werte; er führte keine Anbieter-Zahlungen oder Datenbankaktionen aus. Windows PowerShell 5.1 hat die Vorbereitung mit dem v2-Zustand und atomarem Berichtsaustausch erfolgreich ausgeführt.

Die echte Sandbox-Anlage und beide lesenden Tarifprüfungen waren erfolgreich; PayPals API-Protokoll bestätigt drei Ressourcenanlagen mit HTTP 201. Die separate Supabase-Testdatenbank `https://xwkvrsuplytalwploebw.supabase.co` ist mit dem vollständigen Schema aus Bootstrap und sieben Migrationen transaktional eingerichtet; 14 Tabellen sind vorhanden, ohne übernommene Kundenkonten. Der Sandbox-Webhook `4DY22404SN0207804` zeigt auf die eigene Vercel-Testadresse. Das Vercel-Testprojekt ist vorbereitet, aber noch nicht bereitgestellt. Die fünf ausdrücklich bestätigten Testzugänge sind als Secret ausschließlich im Testprojekt für Production und Preview gespeichert. Live-Konfiguration, Live-Datenbank und Live-Webhooks sind unverändert.

Das frisch angelegte Ethereal-Testpostfach wurde mit STARTTLS erfolgreich authentifiziert; eine Probe an eine `.invalid`-Adresse wurde im eigenen Postfach erfasst und ihre Vorschau lesend geprüft. **Mailversand der bereitgestellten Test-App, Login mit ihrem Code und der echte Sandbox-Aboablauf stehen weiterhin auf `pending`.** Die Mailprobe ersetzt diesen Nachweis nicht. Noch keine Zahlung, kein Mailversand an echte Empfänger und kein Pushversand. Echte Sandbox-Zustimmung, zeitgesteuerte erste Abbuchung, Kündigung, Erstattung und Provider-Zahlungsausfall sind noch nicht nachgewiesen.

Anbietergrundlagen: [PayPal: Subscription-Tests](https://developer.paypal.com/subscriptions/test-go-live), [Subscriptions-API](https://developer.paypal.com/api/subscriptions/v1), [Webhook-Simulator](https://developer.paypal.com/api/rest/webhooks/simulator/). Diese Dokumentation unterscheidet API-Fehlersimulationen von echten Sandbox-Abos; daraus wird keine beschleunigte Drei-Tage-Abrechnung abgeleitet.
