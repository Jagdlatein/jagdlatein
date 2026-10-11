# Neue PayPal-Tarife: 10 EUR monatlich

Neue Abschlüsse erhalten einen eigenen Monatsplan über **10 EUR** und einen eigenen Testplan über **einmal drei Tage kostenlos, danach 10 EUR pro Monat**. Die vorhandenen Pläne werden nicht preislich geändert. Eine [Preisänderung am bestehenden PayPal-Plan](https://developer.paypal.com/subscriptions/change-price) würde auch dessen bestehende Abonnenten betreffen.

Dieser Helfer legt ausschließlich neue Preispläne an. Er startet keinen Kundenvertrag, kündigt kein Abo, zieht kein Geld ein und löscht keine Konten oder Zahlungsbelege. Eine gewünschte Kündigung bestehender Verträge ist ein getrennter, persönlich bestätigter Vorgang. Bereits bezahlter Zugang bleibt bis zum geprüften Ablauf erhalten.

## Vorbereitung

Beide Tarife verwenden das Produkt des bisherigen regulären Live-Plans. Der Helfer liest diesen Tarif und das Produkt, verlangt weiterhin 5 EUR monatlich ohne Zusatzkosten und schreibt zwei getrennte Vorbereitungen außerhalb des Repos:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-paypal-live-prices.ps1 -Step Prepare -PlanKind Regular
& .\scripts\setup-paypal-live-prices.ps1 -Step Prepare -PlanKind Trial
```

Client-ID und Secret müssen zur bestehenden Live-App gehören. Das Secret wird verdeckt eingegeben, nicht gespeichert und nicht ausgegeben. Die prüfbaren Bedingungen liegen unter `%LOCALAPPDATA%\Jagdlatein\paypal-live-10\regular\plan.json` und `trial\plan.json`. Die historische Vorbereitung unter `paypal-trial` bleibt erhalten. Eigene `OutputDirectory`-Werte müssen getrennte Geschwisterordner `regular` und `trial` verwenden.

## Geprüfte neue Pläne erstellen

Nach Kontrolle der Bedingungen:

```powershell
& .\scripts\setup-paypal-live-prices.ps1 -Step Create -PlanKind Regular
& .\scripts\setup-paypal-live-prices.ps1 -Step Create -PlanKind Trial
```

Jeder neue Plan erhält seine eigene gespeicherte Request-ID. Bei unklarem Ergebnis dieselbe Vorbereitung behalten. Ein wiederholter Aufruf verwendet dieselbe ID; nach 71 Stunden ist eine unklare Neuanlage gesperrt. Zur Wiederherstellung eine persönlich geprüfte neue Plan-ID mit `-Step Status -CreatedPlanId 'P-...'` angeben. [PayPal speichert Plan-Request-IDs 72 Stunden.](https://developer.paypal.com/api/subscriptions/v1/plans-create)

Der Helfer liest beide neuen Pläne erneut und prüft Produkt, Aktivstatus, Preis, EUR, Monatsintervall, Testdauer und Zusatzkosten. Erst wenn beide Tarife eindeutig bestätigt sind, gibt er die gemeinsame App-Konfiguration aus.

## App-Konfiguration und Bestandsverträge

Im öffentlichen Vercel-Projekt ausschließlich für Production übernehmen:

- `NEXT_PUBLIC_PAYPAL_PLAN_ID`: neuer regulärer 10-EUR-Plan.
- `NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID`: neuer 10-EUR-Testplan.
- `PAYPAL_PLAN_IDS`: bisherige erlaubte IDs plus beide neue IDs.
- `PAYPAL_TRIAL_PLAN_IDS`: historische Testplan-IDs plus neuer Testplan.
- `PAYPAL_PLAN_PRICES`: explizites JSON-Objekt mit Plan-ID als Schlüssel und `"5.00"` beziehungsweise `"10.00"` als Wert. Der Helfer gibt die vollständige Zuordnung der bekannten Tarife aus.

Die historischen Live-IDs `P-9XU38461YG7706134NESJQWA` und `P-0SN76115U1905643NNLBEIGQ` behalten fest 5 EUR. Weitere bestehende IDs benötigen ebenfalls ihre geprüfte Zuordnung; bestehende IDs nicht entfernen, solange Abrechnung, bereits bezahlter Zugang oder Ereignisse noch abgewickelt werden. Die App bietet ausschließlich explizit konfigurierte neue 10-EUR-Pläne an und überprüft deren Bedingungen vor dem PayPal-Dialog. Historische Testverträge werden weiterhin zu ihrem ursprünglichen Preis geprüft.

Client-ID, Secret, API-Basis und Webhook bleiben erhalten. Nach gemeinsam geprüftem Code und Konfiguration neu bereitstellen. Ohne passende neue IDs bleibt das Neuangebot gesperrt. Wenn Android dieselbe Website und Preiseseite nutzt, gilt dort derselbe PayPal-Tarif; eine gesondert gepackte Android-App muss zusätzlich auf ihren tatsächlichen Zahlungsweg geprüft werden.

## Bereits neu angelegte Live-Pläne

Am 11. Oktober wurden im Händlerbereich der bestehenden Jagdlatein-Live-App zwei neue Pläne angelegt und die Bedingungen dort geprüft:

- Regulär: `P-84865681MX852314DNLFYXIA`, 10 EUR monatlich ohne festes Ende.
- Testangebot: `P-97A89881XM305571TNLFYX3I`, ein kostenloser Drei-Tage-Zyklus, danach 10 EUR monatlich ohne festes Ende.

Diese Pläne nicht zusätzlich mit dem Helfer neu anlegen. Die zusammengeführte Production-Konfiguration mit den zwei bekannten historischen IDs lautet:

```dotenv
NEXT_PUBLIC_PAYPAL_PLAN_ID=P-84865681MX852314DNLFYXIA
NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID=P-97A89881XM305571TNLFYX3I
PAYPAL_PLAN_IDS=P-9XU38461YG7706134NESJQWA,P-0SN76115U1905643NNLBEIGQ,P-84865681MX852314DNLFYXIA,P-97A89881XM305571TNLFYX3I
PAYPAL_TRIAL_PLAN_IDS=P-0SN76115U1905643NNLBEIGQ,P-97A89881XM305571TNLFYX3I
PAYPAL_PLAN_PRICES={"P-9XU38461YG7706134NESJQWA":"5.00","P-0SN76115U1905643NNLBEIGQ":"5.00","P-84865681MX852314DNLFYXIA":"10.00","P-97A89881XM305571TNLFYX3I":"10.00"}
```

Zusätzliche bereits erlaubte Bestands-IDs samt geprüften Preisen ergänzen, falls vorhanden. Diese Live-Werte gehören ausschließlich in das öffentliche Production-Projekt, nicht in das getrennte Sandbox-Projekt. Öffentliche Plan-IDs werden beim Build eingebaut; Code und Einstellungen daher gemeinsam neu bereitstellen. Die Plananlage beweist noch keine erfolgte Bereitstellung, keinen neuen Kundenabschluss und keine Kündigung bestehender Abos.

Lokale Tests simulieren PayPal und verwenden ausschließlich entbehrliche Daten. Sie beweisen weder erfolgte Live-Plananlage noch Kündigungen, tatsächlichen Zahlungsabschluss oder Veröffentlichung.
