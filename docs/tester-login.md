# Anmeldung für freigegebene TestFlight-Tester

Die TestFlight-Sandbox verwendet eigene Lernkonten und die feste Website `https://jagdlatein-sandbox.vercel.app`. Das bisherige Ethereal-Testpostfach stellt keine Nachricht an echte Empfänger zu. Für Tests direkt auf dem iPad ist deshalb ein ausdrücklich aktivierter SMTP-Versand an eine private Liste freigegebener Adressen vorgesehen.

## Einstellungen ausschließlich im Vercel-Testprojekt

| Schlüssel | Wert |
| --- | --- |
| `JL_TEST_ENVIRONMENT` | `paypal-sandbox` beibehalten |
| `JL_TEST_MAIL_MODE` | `tester-smtp` |
| `JL_TEST_SMTP_HOST` | `asmtp.mail.hostpoint.ch` |
| `JL_TEST_SMTP_PORT` | `587` für zwingendes STARTTLS oder `465` für TLS ab Verbindungsbeginn |
| `JL_TEST_SMTP_USER` | vollständige Adresse des ausdrücklich freigegebenen Versandpostfachs |
| `JL_TEST_SMTP_PASS` | zugehöriges Passwort als Secret |
| `JL_TEST_SMTP_FROM` | einzelne Absenderadresse ohne Anzeigenamen |
| `JL_TEST_MAIL_RECIPIENTS` | private, kommagetrennte Liste exakt freigegebener Testeradressen; höchstens 100 |

Hostpoint beschreibt den SMTP-Server, beide Ports und die Anmeldung mit der vollständigen Postfachadresse in seinen [E-Mail-Einstellungen](https://support.hostpoint.ch/de/technisches/e-mail/haeufig-gestellte-fragen/e-mail-einstellungen-auf-einen-blick). Die Transportkonfiguration verlangt eine gültige TLS-Verbindung und prüft das Serverzertifikat; [Nodemailer dokumentiert die TLS- und STARTTLS-Optionen](https://nodemailer.com/smtp).

Der Testmodus liest ausschließlich die eigenen `JL_TEST_SMTP_*`-Einstellungen. Er greift nicht auf die SMTP-Konfiguration der öffentlichen App zurück. Ein bestehendes Postfach wie `info@jagdlatein.de` darf nur nach ausdrücklicher Freigabe für das Testprojekt hinterlegt werden. Das Passwort und die Empfängerliste gehören weder in Git noch in Chatnachrichten. Die Freigabe eines Empfängers verschafft ihm keinen Lernzugang: Registrierung, E-Mail-Bestätigung und Apples tatsächlicher Sandbox-Abostatus bleiben erforderlich.

Ohne `JL_TEST_MAIL_MODE`, oder mit `sink`, bleibt das bisherige Ethereal-Verhalten bestehen. Unbekannte Modi und unvollständige Tester-Einstellungen brechen sicher ab. Im Tester-Modus erhalten nicht freigegebene Adressen dieselbe neutrale Codeantwort; es wird kein Code reserviert oder versendet. Die Empfängerliste ist ausschließlich serverseitig und wird nicht an die App übertragen.

## Ablauf auf dem iPad

1. Neue Tester öffnen „Kostenlos registrieren“ und verwenden ihre freigegebene Adresse. Bereits registrierte Tester wählen „Mit E-Mail anmelden“.
2. Die als Testnachricht gekennzeichnete E-Mail enthält einen individuellen, zehn Minuten gültigen Einmalcode. Bei Bedarf den Spamordner prüfen.
3. Nach der Anmeldung unter „Abo und Käufe“ vorhandene Käufe wiederherstellen oder einen neuen Sandbox-Kauf selbst bestätigen.

Die App-Anzeige unterscheidet den internen Mail-Sink vom direkten Versand an Tester. Der Mailmodus ändert keine Datenbank-, Apple-, PayPal- oder Push-Isolation. Er ersetzt keinen Kaufbeleg und verspricht keine kostenlose Verlängerung. Für diese Serveränderung ist kein neues natives TestFlight-Paket erforderlich.

## Prüfstatus

Die Zustellungserweiterung in Quellstand `fc0c56d` ist unabhängig geprüft und ausschließlich im getrennten Testprojekt bereitgestellt. **98 synthetische Versand-, Login- und Registrierungsprüfungen** bestehen mit Node **22.23.3**, einschließlich TLS, Empfängerbegrenzung, fehlender Einstellungen, unveränderter Produktion, neutraler Antworten ohne Code-Reservierung und bereinigter SMTP-Fehler. Zusätzlich besteht der vollständige bisherige Backend-Regressionslauf mit **184 von 184 Prüfungen aus elf Testdateien** unter derselben Node-Version. Diese breitere Prüfung ergänzt die 98 gezielten Prüfungen. Der vollständige Website-Build besteht mit **307 erzeugten Seiten**.

Am **8. Oktober 2026** hat der Nutzer die Verwendung des bestehenden Hostpoint-Postfachs `info@jagdlatein.de` und des ersten privaten Testempfängers ausdrücklich freigegeben, ausschließlich im Vercel-Testprojekt **`jagdlatein-sandbox`** für **Production und Preview**. Nach der eigenen Passworteingabe und Speicherbestätigung wurde die Vercel-Schlüsselliste unabhängig geprüft: Alle sieben neuen Schlüssel sind jeweils als **Secret** in **Production und Preview** vorhanden, insgesamt 14 Einträge im richtigen Testprojekt. Die anschließende Production-Bereitstellung **`GfX8KM77WM87XGcfMpY7ZVHAYu9L`** aus Quellstand `fc0c56d` ist **Ready** und der festen Adresse **https://jagdlatein-sandbox.vercel.app** zugeordnet. Sie bestand am 8. Oktober 2026 um **06:50:29 Uhr (Europe/Zurich)** nach **1 Minute 10 Sekunden**. Die frisch geladene `/login`-Seite zeigt den Tester-Versandhinweis statt des Ethereal-Hinweises. Quellstand und Serveranzeige sind damit im Testprojekt aktiviert. Es ist weder eine erfolgreiche Anmeldung am echten SMTP-Postfach noch eine tatsächliche Zustellung bestätigt. Passwort und private Empfängeradresse werden nicht dokumentiert. Der öffentliche Website-Stand und der geprüfte native Vorschauquellstand `2214ee5` bleiben unverändert.

Die anschließende Anforderung eines Anmeldecodes scheiterte mit „Serverfehler“. Der Laufzeitbericht bestätigt HTTP **500** für `POST /api/auth/request-code` und einen bereinigten Versandfehler mit Status **503**; die Registrierung meldet für denselben Versandfehler bereits HTTP 503. Die konkrete SMTP-Fehlerkategorie ist noch unbekannt. Rohmeldungen des Anbieters, Passwort und private Empfängeradresse werden nicht veröffentlicht.

Die unabhängig geprüfte Korrektur in Quellstand **`7a15d15`** ergänzt ausschließlich in Sandbox eine feste Fehlerkategorie, eine feste Versandstufe und einen numerischen SMTP-Status für das private Serverprotokoll. Anbieter-Rohmeldungen, Zugangsdaten und Empfänger werden nicht protokolliert oder an den Client übertragen. Fehlgeschlagener Codeversand bei Anmeldung oder Registrierung erhält jeweils eine bereinigte HTTP-503-Antwort; TLS-Prüfung und öffentliche Produktion bleiben unverändert. **115 von 115 gezielten Prüfungen**, der vollständige Backend-Regressionslauf mit **201 von 201 Prüfungen aus elf Testdateien** unter Node **22.23.3** und der Website-Build mit **307 Seiten** bestehen. Die Production-Bereitstellung **`BpKcz6ZnFRminFq7Z93m1YfkSmrm`** aus dem unveränderlich bestätigten Quellstand `7a15d15` ist ausschließlich im Vercel-Testprojekt `jagdlatein-sandbox` **Ready** und der festen Adresse **https://jagdlatein-sandbox.vercel.app** zugeordnet. Sie bestand am **8. Oktober 2026 um 06:59:44 Uhr (Europe/Zurich)** nach **1 Minute 9 Sekunden**. Die sichere Diagnose ist damit bereitgestellt. Der Nutzer wurde um eine einzelne neue Code-Anforderung gebeten; SMTP-Fehlerkategorie, erfolgreiche SMTP-Anmeldung, tatsächlicher Codeempfang und iPad-Anmeldung bleiben noch unbestätigt.

Nach der Korrektur fordert der freigegebene Tester selbst einen neuen Anmeldecode an. Eine erfolgreiche SMTP-Anmeldung bestätigt nur die Verbindung; erst der Empfang dieses Codes und die anschließende Anmeldung auf dem iPad bestätigen die tatsächliche Zustellung. Kaufwiederherstellung, Kündigung, Ablauf und Erstattung bleiben separate Prüfungen.
