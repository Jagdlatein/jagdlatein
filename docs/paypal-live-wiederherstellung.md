# PayPal in der öffentlichen App wiederherstellen

Prüfstand: 4. Oktober 2026. Die öffentliche Preiseseite zeigt „PayPal konnte nicht geladen werden“. Ihr PayPal-SDK-Aufruf liefert HTTP 400 mit der Anbieterantwort „client-id not recognized for either production or sandbox“. Die derzeit eingebaute öffentliche Client-ID ist damit kein verwendbarer SDK-Client. Die zuvor im Projekt verwendete Client-ID liefert mit denselben SDK-Parametern HTTP 200. Es wurde keine Zahlung ausgelöst.

Der gezielte Secret-Kompatibilitätsfix hat 109 Authentifizierungs- und Zahlungsregressionen unter Node 22.23.3 bestanden. Der vollständige Produktionsbuild ist ebenfalls erfolgreich. Die Änderung wurde lokal vorbereitet; eine Wiederherstellung der Live-Einstellungen ist noch nicht bestätigt.

## Button und Live-Konfiguration

Die ursprüngliche öffentliche Client-ID in PowerShell in die Zwischenablage kopieren:

```powershell
Set-Clipboard -Value 'AQx7R9V-b-x8NJmvXUkRrJ-Js68jqMq3udNpdVmONZrpS0y6zpUj5QMIAiunCQDCTPpwmiKFaJJybJBW'
```

Im bestehenden Vercel-Projekt der öffentlichen App unter Settings → Environment Variables für **Production** korrigieren:

- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: die kopierte ursprüngliche Client-ID.
- `PAYPAL_CLIENT_ID`: falls gesetzt, dieselbe Live-Client-ID. Der Server verwendet diesen Eintrag vorrangig.
- `PAYPAL_API_BASE`: `https://api-m.paypal.com`.
- `NEXT_PUBLIC_PAYPAL_PLAN_ID`: der bisherige Live-Plan `P-9XU38461YG7706134NESJQWA`, solange dies weiterhin der angebotene aktive Plan derselben Live-App ist. Die aktuelle veröffentlichte Preiseseite enthält diesen Plan. Eine gesetzte Liste `PAYPAL_PLAN_IDS` muss ihn zulassen.
- `PAYPAL_SECRET` oder `PAYPAL_CLIENT_SECRET`: ausschließlich das Secret derselben Live-App; in Vercel eingeben, nicht in den Chat oder Git. Nach dem Kompatibilitätsfix akzeptiert der Server beide Namen, `PAYPAL_SECRET` hat Vorrang.
- `PAYPAL_WEBHOOK_ID`: ID des Webhooks unter **Live** derselben PayPal-App. Die zuvor gezeigte Sandbox-ID ist für Production ungeeignet.

Live-Zuordnung im PayPal Developer Dashboard unter Apps & Credentials → Live kontrollieren. Ein erfolgreicher SDK-Download bestätigt das Laden des Skripts, nicht die Eigentümerschaft eines Plans oder eine Zahlung. Keine Ersatz-App und kein neuer Plan sind für die reine Wiederherstellung nötig.

Sandbox-Werte im öffentlichen Projekt nur der passend eingerichteten Preview zuordnen; nicht über All Environments an Production verteilen. Die bestätigte Adresse jagdlatein.vercel.app gehört zur öffentlichen App und ist keine getrennte Testversion.

## Zahlungsbestätigung und Datenbank

Der neu veröffentlichte Abo-Code benötigt die Tabellen `paypal_subscriptions`, `paypal_subscription_payments` und die Funktion `apply_paypal_subscription_snapshot`. Ohne die zugehörige Migration kann eine bereits erfolgreiche PayPal-Zahlung anschließend unbestätigt bleiben. Der Zugriff wird dabei nicht ohne Zahlungsnachweis freigegeben.

Falls noch nicht erfolgreich im bestehenden Supabase-Projekt ausgeführt:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-account.ps1 -Step SubscriptionSql
```

Das kopiert `supabase/migrations/20261004110000_subscription_access.sql`. Im SQL Editor der bestehenden Datenbank der öffentlichen App ausführen. Keine andere Datenbank auswählen und keine Kundendaten löschen. Die Funktion und Tabellen werden lokal in den Regressionstests tatsächlich mit PostgreSQL ausgeführt; der Zustand der Live-Datenbank konnte mangels verbundenem Zugriff nicht eingesehen werden.

## Veröffentlichung und Kontrolle

Erst die zusammengehörige Live-Konfiguration und die benötigte Datenbankeinrichtung fertigstellen. Der lokale Codefix verwendet `PAYPAL_SECRET || PAYPAL_CLIENT_SECRET`; er ändert weder API-Modus noch Zahlungsnachweise und führt keinen weiteren Versuch mit anderen Zugangsdaten aus. Lokale Änderungen sind für einen Commit vorbereitet, noch nicht übertragen.

Nach Veröffentlichung oder Redeploy die Preiseseite neu laden. Vercel-Variablen gelten erst für neue Deployments; öffentliche Client-ID und Plan-ID werden beim Build eingebaut. Nach erfolgreichem Laden muss der PayPal-Button erscheinen. Vor einer erneuten Bezahlung gegebenenfalls die bereits getätigte Zahlung und ihren Kontozugang klären, damit kein zweites Abo abgeschlossen wird.

Ein authentifizierter Vercel- oder Supabase-Zugriff war für diese Wiederherstellung nicht verbunden. Deshalb wurden keine Live-Einstellungen oder Kundendatensätze durch den Agenten geändert. Die PowerShell-CLI meldete bei der lesenden Prüfung „Logged out“.

Weitere Einzelheiten einschließlich Sandbox-Isolierung: [rest-einrichtung.md](rest-einrichtung.md).
Anbietergrundlagen: [Vercel-Umgebungsvariablen](https://vercel.com/docs/environment-variables), [PayPal-Webhooks](https://developer.paypal.com/api/rest/webhooks/rest/).
