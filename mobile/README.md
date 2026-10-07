# Jagdlatein für iPhone und iPad

Die iOS-Entwicklungsversion lädt **https://www.jagdlatein.de/** direkt in einer nativen `WKWebView`. Die Website leitet auf `https://jagdlatein.de/` weiter; beide eigenen HTTPS-Adressen werden unterstützt. Inhalte, Fotos, Menü und laufende Website-Änderungen stammen somit aus dem bestehenden Angebot. Es gibt keinen zweiten Lernkatalog und keine Kopie der kostenpflichtigen Kursinhalte im App-Paket.

**Stand am 7. Oktober 2026: Version `0.1.0`, Build `3`, mit dem vom Nutzer bereitgestellten Original-Logo ist in der internen TestFlight-Gruppe `Jagdlatein iPad-Test` mit dem Status `Im Test` verfügbar. Der [signierte Mac-Lauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37590947299) erstellte und prüfte Archiv und IPA; Apple nahm den Upload an und verarbeitete den Build erfolgreich. Die fünf lokalen Node-Prüfungen und die Projekt-/Assetprüfung bestehen. Für den unveränderten nativen Kopfzeilencode bestanden im [Mac-Lauf für `d988d85`](https://github.com/Jagdlatein/jagdlatein/actions/runs/37589988575) neun Swift-/WebKit-Tests, ein Simulator-Bedienungstest und fünf Node-Prüfungen. Die Logo-Änderung in Commit `05cccab` betrifft Bildquelle, Assets, Vorbereitung und Dokumentation, keinen Swift-Code. Der Nutzer bestätigte Installation, Start, Anmeldung, Kurszugang und Merkliste nach einem App-Neustart auf seinem iPad für Build `1`. Installation und Logo-Anzeige von Build `3` sind noch nicht vom Nutzer bestätigt; weitere Geräteprüfungen und die App-Store-Veröffentlichung stehen aus.**

## Umsetzung

### Nächster Stand: Apple-Abos und Konto

Die nächste Änderung bereitet StoreKit-2-Kauf, Wiederherstellung und Apple-Aboverwaltung vor. Der Server prüft Apples Signatur mit den öffentlichen Apple-Stammzertifikaten, die aktuelle Anbieterantwort, Produkt, Umgebung und die zufällige Kennung des verifizierten Lernkontos. Eine abgelaufene oder widerrufene Transaktion gewährt keinen Zugang. Alte Zahlungsnachrichten können gelöschte Konten nicht wieder zuordnen. Die Registrierung erstellt erst nach Bestätigung per E-Mail ein kostenloses Konto; sie löst keine Zahlung aus. Die Kontolöschung braucht einen frischen E-Mail-Code und eine ausdrückliche Löschbestätigung. Laufende Abos müssen separat beim Anbieter gekündigt werden.

Alle drei Funktionen sind im Quellcode standardmäßig ausgeschaltet. Die vier Aktivierungsschalter sind inzwischen ausschließlich im getrennten Vercel-Testprojekt gespeichert und mit dem neuen Testserver bereitgestellt. Die bisherige TestFlight-Version `0.1.0 (3)` enthält die Funktionen noch nicht. Für den Quellcode in Commit `e45814ff` besteht der [vollständige Prüflauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37621080388): 127 Konto-/API-/PostgreSQL-Prüfungen, sechs mobile Node-Prüfungen, 20 Swift-/WebKit-Prüfungen und ein Simulator-Bedienungstest. Die Website kompiliert erfolgreich; beide unsignierten Gerätearchive für Production und Sandbox bestehen einschließlich der jeweiligen Umgebungs- und App-Namensprüfung. Die Kontoprüfungen verwenden ausschließlich synthetische Konten und eine lokale PostgreSQL-Testdatenbank. Ein echter Apple-Sandbox-Kauf, Wiederherstellung, Kündigung und Erstattung sind noch nicht ausgeführt.

Auch der [vollständige Prüflauf für den aktuellen Quellstand `6870a27`](https://github.com/Jagdlatein/jagdlatein/actions/runs/37647269729) ist am 7. Oktober 2026 um **16:03:59 UTC erfolgreich abgeschlossen**: Backendprüfungen, Website-Build, beide unsignierten Gerätearchive für Production und Sandbox sowie Swift-/WebKit- und Simulatorprüfungen.

In App Store Connect ist das Monatsprodukt am 7. Oktober 2026 als **unveröffentlichter Entwurf** angelegt: Abo-Gruppe `Jagdlatein Lernzugang` (`22450923`), Produkt `de.jagdlatein.premium.monthly` (Produkt-Apple-ID `6820087892`), Laufzeit ein Monat. Der deutsche Anzeigename lautet `Jagdlatein Monatsabo`. Die Verfügbarkeit und das dreitägige kostenlose Einführungsangebot sind auf Deutschland, Österreich und die Schweiz begrenzt; das Angebot beginnt am 7. Oktober 2026 ohne festes Enddatum. Der Monatspreis beträgt in Deutschland und Österreich 5 EUR; Apples automatisch berechneter Schweizer Preis beträgt 3 CHF. Mehrplatzlizenzen und Vertrieb über Apple Business/School Manager sind deaktiviert; Familienfreigabe ist nicht aktiviert. Die Server-App-ID bleibt **`6819820561`**, sie ist nicht mit der Produkt-Apple-ID zu verwechseln.

Der am 7. Oktober 2026 in App Store Connect geprüfte Vertragsstand ist: kostenlose Vereinbarung **Active**, gebührenpflichtige Apps **Benutzerinfos ausstehend**, beide US-Steuerformulare **Active**, Bankverbindung **In Bearbeitung**. Apple nennt für die Bankprüfung bis zu 24 Stunden; der EU-Händlerstatus bleibt offen. Die optimierte externe Kauffunktion bleibt bei Apple aktiviert: Apple weist ihre Deaktivierung ausdrücklich ab, weil die zuletzt genehmigte Binärdatei die erforderlichen `PurchaseIntent`-APIs noch nicht enthält. Vor öffentlicher Freigabe muss ein entsprechender Build genehmigt und diese Einstellung tatsächlich deaktiviert sein. Angebotscodes, Aktions- und Rückgewinnungsangebote werden im Testaufbau nicht eingerichtet. [Apple: optimierte Kauffunktion](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-streamlined-purchasing/).

Der separate In-App-Purchase-Schlüssel **`6B6T2DAFB7`** ist angelegt und seine lokale Datei auf Gültigkeit sowie geschützte Dateiberechtigungen geprüft. `APPLE_IAP_PRIVATE_KEY` ist ausschließlich im Vercel-Testprojekt `jagdlatein-sandbox` für **Production und Preview als Secret** gespeichert. Auch die sechs Server-Metadaten `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_STORE_ENVIRONMENT`, `APPLE_BUNDLE_ID`, `APPLE_APP_ID` und `APPLE_PRODUCT_IDS` sind dort gespeichert. Private Schlüsselinhalte gehören nicht in Git oder die Dokumentation. Ein echter Apple-Kauf und die Apple-Authentifizierung sind weiterhin nicht nachgewiesen.

Der neue Testserver ist unter **https://jagdlatein-sandbox.vercel.app** bereitgestellt: Deployment `7prVJDjrUzoikWFaXYNMyUNfpd6g` aus Quellstand `6870a27` hat den Status **Ready** und ist ausschließlich die Production-Bereitstellung des Testprojekts. Ohne Anmeldung antwortet `GET /api/apple/context` erwartungsgemäß mit HTTP **401 und JSON**; die Serverkonfiguration wird angenommen. Die öffentliche Jagdlatein-Website wurde dadurch nicht umgestellt.

Für die native **Sandbox-Version `0.1.0`, Build `4`**, wurde der [manuelle TestFlight-Lauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37649197141) mit dem erlaubten Vorschau-Quellstand `6870a27` gestartet. Seine Prüfungen sind nach **17 Sekunden erfolgreich**; die Signierung wartet auf die tatsächliche persönliche Freigabe der geschützten GitHub-Umgebung `ios-testflight`, für die der Nutzer um Selbstfreigabe über **Approve and deploy** gebeten wurde. Der Schutz wurde nicht geändert. Erfolgreicher Upload, Apple-Verarbeitung und Installation dieses Builds sind noch nicht bestätigt.

Die Vorbereitung läuft in dieser Reihenfolge:

1. Codeprüfung und Schemaeinrichtung sind erfolgt: Die geschützte Testbasis sowie die drei Migrationen `20261007105000_account_registration.sql`, `20261007110000_apple_subscriptions.sql`, `20261007120000_account_deletion.sql` wurden am 7. Oktober 2026 ausschließlich in der bestätigten Testdatenbank `xwkvrsuplytalwploebw` erfolgreich angewendet. Der unten beschriebene Helfer stellt die richtige Reihenfolge her. Das legt keine zahlungspflichtigen Konten an und löscht keine Konten. Die Löschvorbereitung vergibt Kontogenerationen und deaktiviert alte Push-Tokens ohne bekannte Kontozuordnung; neue Registrierungen benötigen den passenden Backendstand.
2. Den bereits angelegten Monatsprodukt-Entwurf prüfen und den Vertrag für gebührenpflichtige Apps durch den Kontoinhaber vervollständigen, bis Apple den Status **Aktiv** bestätigt. Die App zeigt den von Apple gelieferten Preis und das aktuell zulässige Einführungsangebot. Apple beurteilt die Berechtigung je Abo-Gruppe; eine früher abgelaufene PayPal-Probezeit wird dadurch nicht automatisch ausgeschlossen. Ein vorhandener aktiver Lernzugang verhindert einen zusätzlichen Kauf.
3. Den bereits gespeicherten separaten **In-App-Purchase**-API-Schlüssel und seine Metadaten für die Prüfung des aktuellen Abostatus verwenden. Der bestehende TestFlight-Uploadschlüssel wird nicht verwendet; der private Schlüssel bleibt ausschließlich als Server-Secret im Testprojekt.
4. Nach der erfolgreichen Schemaeinrichtung und Prüfung der öffentlichen Testadresse sind im Vercel-Projekt `jagdlatein-sandbox` `ACCOUNT_GENERATION_ENABLED=true`, `ACCOUNT_REGISTRATION_ENABLED=true`, `ACCOUNT_DELETION_ENABLED=true`, `APPLE_SUBSCRIPTIONS_ENABLED=true` für **Production und Preview gespeichert** und mit dem neuen Testserver bereitgestellt. Die bereits gespeicherten Apple-Metadaten verwenden `APPLE_STORE_ENVIRONMENT=Sandbox`, `APPLE_BUNDLE_ID=de.jagdlatein.app`, `APPLE_APP_ID=6819820561`, `APPLE_PRODUCT_IDS=de.jagdlatein.premium.monthly`. `JL_TEST_ENVIRONMENT=paypal-sandbox` bleibt für die vorhandene getrennte Testdatenbank aktiv. Der neue Native-Build muss ausdrücklich auf die getrennte Testwebsite zeigen; ein Sandbox-Kauf wird von der öffentlichen Produktionswebsite abgewiesen. Nach der ersten Aktivierung bleibt `ACCOUNT_GENERATION_ENABLED=true` dauerhaft gesetzt, auch wenn Käufe oder Löschungen später vorübergehend deaktiviert werden.
5. Das Sandbox-Benachrichtigungsziel `https://jagdlatein-sandbox.vercel.app/api/apple/notifications` ist bei Apple gespeichert und blieb nach erneutem Laden erhalten. Das Bearbeitungsformular enthält nur die URL und keine Versionsauswahl; die Benachrichtigungsversion und die tatsächliche Zustellung sind weiterhin nicht bestätigt. Danach im Testaufbau Anmeldung, Kauf, Wiederherstellung, Kontowechsel, Erstattung, Ablauf und Kontolöschung prüfen. Eine Aktivierung der Kontogeneration verlangt für ältere Sitzungen einmalig eine neue Anmeldung; die vorhandenen Lern- und Zahlungsdaten bleiben erhalten.

Zwei echte Sandbox-Anfragen `RequestTestNotification` antworteten beide mit HTTP **404**, API-Code **`4040007 SERVER_NOTIFICATION_URL_NOT_FOUND`**, zuletzt am 7. Oktober 2026 gegen **16:00 UTC**. Es wurden weder ein Testbenachrichtigungs-Token noch eine signierte Nachricht erzeugt; eine Zustellung ist nicht nachgewiesen und keine Transaktion wurde ausgeführt. Apples Dokumentation nennt für die Übernahme geänderter Benachrichtigungs-URLs bis zu eine Stunde; ob diese Verzögerung den Fehler erklärt, ist noch offen. Benachrichtigungszustellung und Apple-Authentifizierung sind damit weiterhin nicht bestätigt.

Die Helfer verbinden sich nicht mit einem Anbieter und führen keine Datenbankänderung aus:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-ios-account.ps1 -Step Check
& .\scripts\setup-ios-account.ps1 -Step TestSql -NoClipboard
```

Der zweite Befehl speichert den SQL-Text unter `%LOCALAPPDATA%\Jagdlatein\ios-account\test-setup.sql`; `-NoClipboard` lässt die Zwischenablage unverändert. Erst nach Prüfung der Projektkennung im richtigen Supabase-Testprojekt ausführen. Beim Einfügen den bisherigen Editorinhalt vollständig mit Strg+A ersetzen und vor „Run“ den vollständigen Text mit der vorbereiteten Datei vergleichen. Vor der Einrichtung bestätigte der lesende Schemakatalog am 7. Oktober 2026 dort 14 alte Tabellen mit RLS; `push_tokens` und das neue Registrierungs-/Apple-/Löschschema fehlten damals. Nach der erfolgreichen Anwendung bestätigte eine weitere lesende Prüfung **20 Tabellen mit RLS**, die neuen Registrierungs-, Apple-, Lösch- und Sitzungsprüfungs-RPCs sowie `userprofile.account_generation`. Die öffentliche Datenbank wurde nicht verändert.

Der Helfer stellt `scripts/sql/ios-test-push-base.sql` vor die drei Migrationen. Die Testbasis liegt bewusst außerhalb von `supabase/migrations`, erstellt eine fehlende leere `push_tokens`-Tabelle mit RLS und privaten Serverrechten und verändert bei kompatiblen Wiederholungen keine vorhandenen Zeilen oder Spalten. Unpassende Tabellen, Rollen oder Rechte brechen vor den Kontomigrationen ab. Die vorbereitete Datei enthält vier getrennte Transaktionen; nach einem Fehler zuerst den Schemakatalog prüfen, bevor sie erneut ausgeführt wird.

Die acht gezielten lokalen PostgreSQL-Prüfungen für diese Testbasis bestanden unter Node **22.23.3**: private Anlage, unveränderte Daten bei Wiederholung, Wiederholung nach der echten Löschmigration und sichere Ablehnung unpassender Tabellen oder Rechte. Sie benötigen die bereits vorhandene isolierte PGlite-Testlaufzeit und keine Anbieterzugänge:

```powershell
npx --yes --package=node@22 node --test scripts/test-ios-test-push-base.cjs
```

Die öffentliche Website und ihre Datenbank bleiben bis zur gesonderten geprüften Aktivierung auf dem bisherigen Zugang. Für die spätere App-Store-Prüfung fehlt außerdem noch eine ausdrücklich geprüfte Regel für Apples Sandbox-Reviewkäufe auf dem Produktionsbackend; die aktuelle strikte Umgebungstrennung wird dafür nicht aufgeweicht.

- Native iPhone-/iPad-Projektdateien: `ios/App/App.xcodeproj`.
- UIKit und WebKit mit lokalem Foundation-Paket `core` für Navigation und Merkliste. Kein externer Capacitor-Webserver und kein JavaScript-Zugriff auf eine native Plugin-Brücke.
- Die Website bleibt in ihrem echten HTTPS-Ursprung. Der reguläre persistente WebKit-Datenspeicher verwaltet die Cookies; die Website-Anmeldung wird nicht nachgebaut. Eine Anmeldung in Safari gilt nicht automatisch auch in dieser App.
- Native Bedienung: Zurück, Vorwärts, Aktualisieren, Merkliste und Teilen; Fehler-/Wiederholenansicht bei fehlender Verbindung. Die Nutzung der Website erfordert Internet. Im aktuellen Quellcode ist zusätzlich die native Übersicht „Abo und Käufe“ vorbereitet; sie ist noch nicht in Build `3` enthalten.
- Eigene Hauptseiten müssen genau `www.jagdlatein.de` oder `jagdlatein.de` sein. Fremde Fachlinks werden nach einer Nutzeraktion extern geöffnet. Es gibt keine HTTP-/TLS-Ausnahme, allgemeine CORS-Freigabe oder übernommenen Server-Secrets.
- App-Icon, native Kopfzeile und Startbild verwenden die vom Nutzer bereitgestellte Illustration aus `IMG_20250715_104310_496.webp` mit Jäger, Hirsch und dem Schriftzug „Jagd-Latein“. Die Bildpixel sind als PNG-Quelle `mobile/branding/jagdlatein-logo.png` übernommen; daraus werden die App-Ressourcen gerendert, einschließlich `BrandLogo.imageset` in drei Skalierungen. Die Illustration wurde nicht neu generiert. Build `3` enthält dieses Original-Logo und ist für den internen Test verfügbar; seine Installation und Logo-Anzeige auf dem iPad sind noch unbestätigt. Der [Build `2`](https://github.com/Jagdlatein/jagdlatein/actions/runs/37590245969) mit dem Buchsymbol bleibt ein nicht zugeordneter Zwischenstand. Die Fotos der Website werden dort weiter gepflegt.
- `/preise`, `/paytest` und PayPal-Kaufziele bleiben im WebView gesperrt. Vor dem ersten Laden wird ein nativer WebKit-Netzwerkfilter für PayPal-Ressourcen und `/api/paypal` aktiviert. Die URL-Prüfung erfasst außerdem interne Next-Seitenwechsel. Der vorhandene Webcheckout wird nicht verändert. Der neue Quellcode öffnet stattdessen die native Abo-Übersicht; Apple-Käufe bleiben ohne ausdrücklich aktivierte und vollständige Serverkonfiguration deaktiviert.

Die ursprüngliche Projektstruktur wurde mit dem offiziellen Capacitor-iOS-Template angelegt. Die App verwendet jetzt einen eigenen UIKit-/WebKit-Controller; die Capacitor-Laufzeit und die lokale React-Katalogvorschau sind nicht Teil des iOS-Projekts.

## Apple-Abo: Vorbereitung im Quellcode

`AppleSubscriptions.swift` verwendet StoreKit 2 ab iOS/iPadOS 15. Preise, Laufzeit und ein berechtigtes Einführungsangebot kommen aus dem tatsächlichen Apple-Produkt `de.jagdlatein.premium.monthly`. Es gibt keine fest eingetragene Preis- oder Testzeitbehauptung. Vorhandener Jagdlatein-Zugang verhindert ein zusätzliches Abo; ein bereits vorhandener Apple-Kauf muss zuerst wiederhergestellt werden. Kauf und Wiederherstellung prüfen das angemeldete Jagdlatein-Konto vor jedem Abgleich. Apple-Käufe eines anderen Kontos werden nicht übertragen. Eine Kontolöschung kündigt ein Apple-Abo nicht automatisch; die Übersicht verlinkt die Apple-Aboverwaltung.

Die Kaufanbindung ruft ausschließlich `/api/apple/context` und `/api/apple/transactions` am eigenen, gerade geöffneten HTTPS-Ursprung auf. Sie verwendet die vorhandenen WebKit-Sitzungscookies nur für diese beiden festen API-Aufrufe, folgt keinen Weiterleitungen und installiert keine JavaScript-Brücke. Der stabile `appAccountToken` bindet den Kauf an das vom Server bestätigte Konto. Erst nach erfolgreicher serverseitiger Prüfung wird eine Apple-Transaktion abgeschlossen; Fehler und ausstehende Genehmigungen bleiben erneut abgleichbar. Ein anschließender, fest vorgegebener WebKit-Aufruf von `/api/auth/status` erneuert die bestehende HttpOnly-Anmeldesitzung, ohne ihren Wert an JavaScript oder native Seitenschnittstellen zu übergeben. Vor und nach diesem Aufruf wird das angemeldete Konto erneut geprüft. Freischaltungen stammen weiterhin aus dem Server, nicht aus einer lokalen Kaufbehauptung.

Ab iOS/iPadOS 16.4 nimmt die App zusätzlich `PurchaseIntent`-Anfragen aus dem App Store entgegen. Eine Anfrage öffnet ausschließlich die Abo-/Anmeldeübersicht. Erst eine ausdrückliche Kaufaktion verwendet das ursprüngliche Monatsprodukt, mit erneut geprüftem Konto und Zugangsstatus unmittelbar vor Apples Bestätigung. Unbekannte Produkte und zusätzliche Sonderangebote werden abgewiesen, bis die Anfrage ausdrücklich verworfen wird; der Abschluss einer älteren Anfrage verwirft keine neuere Anfrage. Der normale Abo-Weg ab iOS 15 bleibt erhalten. Die sechs Strukturprüfungen, die fünf zusätzlichen Swift-Prüfungen und die native Kompilierung für beide Umgebungen bestehen im verlinkten Mac-Lauf für `e45814ff`.

Diese Vorbereitung ist noch kein abgeschlossener Zahlungs- oder App-Store-Test. Apple-Produkt und Einführungsangebot sind als Entwurf konfiguriert; Server-Schlüssel, Metadaten und Aktivierungsschalter sind im Testprojekt bereitgestellt, das Testdatenbankschema ist angewendet und lesend bestätigt. Der Testserver ist **Ready** und der vollständige Prüflauf für `6870a27` erfolgreich. Vertragsabschluss, verifizierte Benachrichtigungszustellung, Abschluss des gestarteten Sandbox-TestFlight-Laufs für Build `4` und die tatsächlichen Apple-Kaufprüfungen stehen aus. Der Mac-Builddienst bestätigt die Swift-Prüfungen für feste API-Ursprünge, Kontobindung, Umgebungstrennung und die manuelle Behandlung externer Kaufanfragen. Der Bedienungstest auf einem iPhone-17-Pro-Simulator mit iOS 26.2 prüft die echte öffentliche Startseite, den Wechsel zur nativen Abo-Übersicht ohne Kaufmöglichkeit sowie die Merkliste nach einem vollständigen App-Neustart. Ein echter Kauf und der erfolgreiche Upload des neuen TestFlight-Builds sind noch nicht nachgewiesen.

### Getrennte native Testversion

Der Buildparameter `IOS_WEBSITE_ENVIRONMENT` akzeptiert ausschließlich `Production` (Standard) oder `Sandbox`. Production lädt nur die beiden öffentlichen Jagdlatein-Hosts. Sandbox lädt ausschließlich das bereits getrennt eingerichtete Testprojekt `https://jagdlatein-sandbox.vercel.app/`, zeigt den App-Namen **Jagdlatein Test** und in der Kopfzeile **Testumgebung**. Konto-, Datenschutz- und Kaufabgleiche verwenden denselben gewählten Ursprung. Es gibt keinen frei eintragbaren Website-Link. Native API-Aufrufe, WebKit-Netzwerkfilter und Navigation sperren den jeweils anderen Ursprung; die Merkliste ist ebenfalls getrennt. Ein Sandbox-Build verlangt beim Kaufabgleich die Serverumgebung `Sandbox`.

Im manuellen TestFlight-Workflow muss `website_environment` vor dem Archivieren ausdrücklich ausgewählt werden. Gerätearchiv und exportierte IPA werden erneut gegen den angeforderten Umgebungswert und den sichtbaren App-Namen geprüft. Team-, Bundle-, Profil-, Zertifikats- und Signaturprüfungen gelten unverändert. Die Vorbereitung dieser Auswahl hat noch keinen Testbuild hochgeladen und keine bestehenden Test-/Produktionsdienste verändert.

## Vorbereitung mit PowerShell auf Windows

Nur die Befehle innerhalb der Blöcke kopieren. Node.js 22 ab 22.12 oder Node.js 24 muss vorhanden sein.

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-ios.ps1 -Step Prepare
```

Das installiert ausschließlich die Entwicklungswerkzeuge im separaten `mobile`-Ordner, rendert das vorhandene Symbol und prüft Projektdateien/Ressourcen. Es verändert keine Vercel-/Supabase-/PayPal-Einstellungen und erstellt keine Apple-Konten.

Erneute lokale Prüfung:

```powershell
& .\scripts\setup-ios.ps1 -Step Check
```

Die Website im Browser ansehen:

```powershell
& .\scripts\setup-ios.ps1 -Step Preview
```

Danach `http://127.0.0.1:4180/` öffnen. Diese Windows-Vorschau leitet auf die Originalwebsite weiter. Sie zeigt **keine simulierte native iPhone-Bedienleiste** und beweist noch keine WebKit-/iOS-Funktion. Mit Strg+C beenden.

`npm run build` im `mobile`-Ordner ist hier eine **Quellen-/Projektstrukturprüfung**, keine Swift-Kompilierung.

## Mac-Builddienst statt eigenem Mac

`.github/workflows/ios-preview.yml` startet den GitHub-Actions-Build auf `macos-15` ausschließlich für Änderungen am Entwicklungsbranch `codex/ios-website-preview` oder manuell. Die iOS-Projektdateien und der manuelle TestFlight-Workflow wurden mit [PR #2](https://github.com/Jagdlatein/jagdlatein/pull/2) in `main` übernommen. Standard-Runner sind bei diesem öffentlichen Repository kostenlos; der Workflow lädt keine kostenpflichtigen Build-Artefakte hoch.

Der Workflow verwendet PowerShell, Node.js 22 und ausdrücklich Xcode 26.3. Ein eigener paralleler Job erstellt zusätzlich mit `build-ios-testflight.ps1 -Step DeviceArchive` ein unsigniertes Release-Archiv für echte iPhone-/iPad-Geräte und prüft die Geräte-Metadaten; auch dieser Job hat keine Apple-Secrets. Der Simulator-Job führt die Swift-/WebKit-Tests aus, kompiliert eine **unsignierte Simulator-App** und prüft im iPhone-Simulator den echten Website-Link „Jetzt freischalten“ sowie die dauerhafte Merkliste vor und nach einem vollständigen App-Neustart. Das verwendete Gerät und die Laufzeit stehen im Build-Ergebnis. Ein frischer Simulatorstart im Builddienst kann mehrere Minuten dauern. Tests auf echten Geräten bleiben vor der Veröffentlichung erforderlich. Die Tests legen kein Konto an und lösen keine Zahlung aus. Das Buildskript erzeugt außerdem lokal auf dem Mac `Jagdlatein-Simulator.zip`; diese Datei dient dem Simulator und ist **keine installierbare iPhone-IPA**, keine TestFlight-Version und keine Store-Veröffentlichung. Der Workflow benötigt keine Apple-, Supabase- oder PayPal-Secrets.

Auf einem vorhandenen Mac mit Xcode und PowerShell:

```powershell
& .\scripts\setup-ios.ps1 -Step MacCheck
```

Projekt in Xcode öffnen: `mobile/ios/App/App.xcodeproj`. Die Projektvorlage verwendet für die unsignierte Vorschau `de.jagdlatein.preview`. Der signierte TestFlight-Ablauf setzt bereits die bestätigte App-ID `de.jagdlatein.app` und das zugehörige Apple-Team beim Archivieren ein; beide wurden an der tatsächlich exportierten IPA geprüft. Ein eigener manueller Xcode-Build muss dieselben bestätigten Signierungsangaben verwenden.

## TestFlight

Die Apple-Developer-Mitgliedschaft wurde am 6. Oktober 2026 im angemeldeten Konto als aktiv geprüft. Die feste App-ID `de.jagdlatein.app` ist registriert; der deutschsprachige App-Store-Connect-Eintrag **Jagdlatein** ist unter der Apple-App-ID `6819820561` angelegt. Apple hat den Upload von Version `0.1.0`, Build `1`, angenommen. Am 7. Oktober 2026 wurde Apples Verarbeitung als erfolgreich bestätigt (`VALID`, Mindestversion iOS/iPadOS 15.0). Die interne Gruppe **Jagdlatein iPad-Test** enthält zwei Builds der Version `0.1.0`: Build `1` und den erfolgreich verarbeiteten Build `3` mit dem Status **Im Test**. Build `2` ist nicht zugeordnet. Automatische Verteilung ist ausgeschaltet. Der eigene Kontoinhaber ist der einzige Tester und wurde am 7. Oktober 2026 um 08:48 Uhr (Europe/Zurich) eingeladen. Der Nutzer bestätigte am 7. Oktober 2026 Installation, Start, Anmeldung, Kurszugang und die Merkliste nach einem vollständigen App-Neustart auf seinem iPad für Build `1`. Installation und sichtbares Original-Logo von Build `3` stehen als Nutzerbestätigung noch aus. Das ist eine erste Geräteprüfung, keine vollständige Geräteabnahme.

`scripts/build-ios-testflight.ps1` und `.github/workflows/ios-testflight.yml` führen diesen Ablauf aus. **Apple-Distribution-Zertifikat und passendes App-Store-Profil für `de.jagdlatein.app` sind angelegt. Der private RSA-Schlüssel und die erfolgreich exportierte P12 liegen verschlüsselt lokal. Die vier erforderlichen Apple-Secrets wurden nach ausdrücklicher Freigabe ausschließlich in der geschützten GitHub-Umgebung `ios-testflight` gespeichert. Der [signierte Mac-Lauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37526321075) mit Xcode 26.3 erstellte und prüfte Archiv und IPA für Version `0.1.0`, Build `1`; Apple nahm den Upload am 6. Oktober 2026 um 20:29:17 UTC an. Apples Verarbeitung wurde am 7. Oktober 2026 als erfolgreich bestätigt. Der [signierte Lauf für Build `3`](https://github.com/Jagdlatein/jagdlatein/actions/runs/37590947299) bestand ebenfalls; Apple nahm den Upload an und verarbeitete den Build erfolgreich. App Store Connect zeigt als Upload-Datum den 7. Oktober 2026 um 10:05 Uhr (Europe/Zurich). Die tatsächliche TestFlight-Installation und ersten iPad-Prüfungen sind nur für Build `1` vom Nutzer bestätigt. Weitere Geräteprüfungen stehen noch aus; eine App-Store-Einreichung wurde nicht vorgenommen.** Im [vorherigen erfolgreichen Mac-Lauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37518700151) wurden sowohl das unsignierte Release-Gerätearchiv als auch die Simulator-App erstellt und geprüft. Der Simulator-Bedienungstest besteht nach vollständiger Startbereitschaft des Simulators. Ein unsigniertes Gerätearchiv bestätigt weiterhin keine Installation oder echte Gerätemessung. Die CMS-Signatur des heruntergeladenen Apple-Profils wurde auf Integrität geprüft; Team/App-ID und Distribution-Zertifikat stimmen mit den tatsächlich heruntergeladenen Dateien überein. Diese Prüfung ist keine Apple-Vertrauensketten- oder Sperrprüfung.

Lokale Vorbereitung prüfen, ohne Apple-Zugangsdaten:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\build-ios-testflight.ps1 -Step Check
```

Ein Signierungszertifikat lässt sich auch ohne eigenen Mac vorbereiten. `scripts/setup-ios-signing.ps1` verwendet unter Windows PowerShell 7.4 oder neuer und die integrierten .NET-Kryptografiefunktionen. Sein Standardmodus `Check` erzeugt keine Schlüssel. Die 13 lokalen Kryptografieprüfungen verwenden ausschließlich synthetische Zertifikate; sie bestätigen keine echte Apple-Signierung.

```powershell
pwsh -NoProfile -File .\scripts\setup-ios-signing.ps1 -Step Check
```

Erst für die tatsächliche Apple-Zertifikatsanfrage wird ausdrücklich `CreateCsr` aufgerufen. Der Benutzer gibt und bestätigt dabei selbst ein Passwort mit mindestens zwölf Zeichen. Die Anfrage und der mit AES-256/PBKDF2 verschlüsselte private RSA-2048-Schlüssel werden in einem eigenen geschützten Ordner unter `%LOCALAPPDATA%\Jagdlatein\ios-signing` abgelegt. Vorhandene Dateien werden nicht überschrieben; es werden keine Schlüssel oder Passwörter an Apple übertragen.

```powershell
pwsh -NoProfile -File .\scripts\setup-ios-signing.ps1 -Step CreateCsr -CommonName 'Jagdlatein iOS' -ContactEmail 'info@jagdlatein.de'
```

Nur die ausgegebene `.certSigningRequest` wird nach ausdrücklicher Freigabe im Apple-Formular für ein **Apple Distribution**-Zertifikat hochgeladen. Nach dem Download der `.cer` kann `ExportP12` diese mit genau dem vorhandenen privaten Schlüssel verbinden. Dafür werden die ausgegebene Anfrage-ID, der tatsächliche Downloadpfad und ein selbst festgelegtes P12-Passwort benötigt. Das Skript prüft Schlüsselzuordnung, Gültigkeit und Signaturverwendung. Es prüft weder Apples Vertrauenskette noch den Sperrstatus. Der Mac-Build prüft die gültige Signierungsidentität, das Apple-Profil und die App-Signatur; beim Upload erfolgt zusätzlich Apples Annahmeprüfung. Eine gesonderte Sperrprüfung ist nicht eingerichtet. Privater Schlüssel, P12 und Passwörter werden nicht in Git oder im Chat abgelegt. Die Speicherung als GitHub-Secrets erfordert die Freigabe des vorgesehenen Speicherorts.


Für die Secret-Speicherung bereitet `scripts/setup-ios-github.ps1` die geprüfte portable GitHub CLI 2.102.0 vor. Sie liegt ausschließlich unter `%LOCALAPPDATA%\Jagdlatein\ios-tools`; der Download wird gegen den offiziellen SHA-256 geprüft. `Check` ist unverändernd und greift weder auf die Anmeldung noch auf private Dateiinhalte zu.

```powershell
pwsh -NoProfile -File .\scripts\setup-ios-github.ps1 -Step Check
pwsh -NoProfile -File .\scripts\setup-ios-github.ps1 -Step InstallTools
```

Erst nach Freigabe der konkreten Dateien und des Speicherorts wird `-Step SaveSecrets` mit deren vollständigen Pfaden aufgerufen. Der Helfer prüft den tatsächlich angemeldeten Eigentümer, Adminzugriff, den erforderlichen Reviewer und die beiden Branchregeln. Er verwendet den vorhandenen Git-Credential-Manager-Token nur im Kindprozess, übergibt Secret-Werte über stdin und speichert keine `gh`-Anmeldung. Ein P12-Passwort wird verdeckt abgefragt und vor der ersten Speicherung gegen die P12 samt privatem Schlüssel geprüft. Bereits bestehende ausgewählte Secret-Namen werden abgewiesen; Ersetzen ist nur mit dem ausdrücklichen `-AllowUpdate` möglich. Die 26 synthetischen Prüfungen sowie die Prüfung der tatsächlichen GitHub-Zielmetadaten bestanden. Nach ausdrücklicher Freigabe speicherte der Helfer die vier echten Secrets; zuvor bestätigte er das eingegebene P12-Passwort und den vorhandenen privaten Schlüssel. Die vier gespeicherten Secret-Namen wurden anschließend über GitHubs Metadaten bestätigt, ohne ihre Werte auszulesen. Die gesonderte Dateirechteprüfung der Signierung besteht auch beim wiederholten Aufruf.

Die manuell gestartete GitHub-Aktion hat vier getrennte Modi:

| Modus | Wirkung |
| --- | --- |
| `Check` (Vorgabe) | Prüft Quellen und Werkzeuge; keine Apple-Verbindung. |
| `DeviceArchive` | Kompiliert auf dem Mac für echte iPhone-/iPad-Prozessoren, ohne Signierung. Keine installierbare TestFlight-Version. |
| `Export` | Erstellt mit vorhandenen Apple-Dateien ein signiertes Archiv und eine IPA. Kein Upload. |
| `Upload` | Erstellt die IPA, prüft sie mit Apples Werkzeug und sendet sie ausdrücklich an App Store Connect. Keine App-Store-Einreichung und keine automatische Testereinladung. |

Der Workflow hat keinen Push-/PR-Auslöser. Er ist seit der Übernahme von PR #2 im Standardbranch `main` vorhanden und über GitHubs manuelle Workflow-Auswahl verfügbar. Er nimmt ausschließlich den geprüften Entwicklungsbranch oder `main` an. Die bestehende Simulator-Aktion bleibt getrennt.

Die GitHub-Umgebung `ios-testflight` wurde am 6. Oktober 2026 angelegt und auf die Branches `main` und `codex/ios-website-preview` begrenzt. Ein signierter Lauf verlangt die Freigabe des Kontoinhabers `Jagdlatein`. Die Administrator-Ausnahme wurde deaktiviert; der Kontoinhaber bestätigt daher auch selbst gestartete signierte Läufe. Die vier Apple-Secrets sind dort nach ausdrücklicher Freigabe gespeichert. Die nicht geheimen Apple-Team-/App- und API-Schlüssel-Kennungen wurden bereits als folgende **Variablen** eingerichtet:

- `IOS_TEAM_ID`: Apple-Team-ID des aktivierten Kontos.
- `IOS_BUNDLE_ID`: bestätigte finale App-ID, übereinstimmend in Apple-Profil und App Store Connect. Der Platzhalter `de.jagdlatein.preview` wird für die Signierung abgelehnt.
- `ASC_KEY_ID` und `ASC_ISSUER_ID`: Kennungen eines vorhandenen Team-API-Schlüssels für den ausdrücklich gewählten Upload.

Der API-Zugang wurde von Apple genehmigt. Der Team-API-Schlüssel **Jagdlatein TestFlight Ersatz** wurde nach Freigabe mit derselben Rolle `Developer` erstellt; eine Admin-Rolle ist für den Upload nicht erforderlich. Ein Team-API-Schlüssel kann auf alle Apps dieses Apple-Kontos zugreifen und ist nicht auf Jagdlatein beschränkt. Die heruntergeladene `.p8` liegt im geschützten lokalen Signierungsordner mit Zugriff ausschließlich für den aktuellen Windows-Benutzer. Ihr privater P-256-Schlüssel wurde lokal eingelesen; der damit authentifizierte, rein lesende Zugriff auf den App-Store-Connect-Eintrag bestätigte die App-ID `de.jagdlatein.app`. Der alte, nicht auffindbare Schlüssel wurde nach Freigabe widerrufen, und die GitHub-Variable `ASC_KEY_ID` wurde auf den Ersatz umgestellt. P12, Apple-Profil und API-Schlüsseldatei sind lokal vorhanden. Diese Dateien und das P12-Passwort wurden nach ausdrücklicher Freigabe ausschließlich als die vier vorgesehenen Secrets in `Jagdlatein/jagdlatein`, Umgebung `ios-testflight`, gespeichert. Signierter Export und Apple-Upload wurden im verlinkten TestFlight-Lauf erfolgreich ausgeführt.

Gespeicherte **Secrets**, nach gesonderter Einrichtung und Freigabe des Speicherorts:

- `IOS_CERTIFICATE_BASE64`: Apple-Distribution-Zertifikat mit passendem privatem Schlüssel als Base64-kodierte `.p12`-Datei.
- `IOS_CERTIFICATE_PASSWORD`: Passwort dieser `.p12`-Datei.
- `IOS_PROFILE_BASE64`: gültiges App-Store-Connect-Provisioningprofil als Base64-kodierte `.mobileprovision`-Datei.
- `ASC_PRIVATE_KEY_BASE64`: privater `.p8`-API-Schlüssel, ausschließlich im Upload-Schritt verfügbar. Für einen manuellen Export ist er nicht erforderlich.

Diese Dateien werden nicht in Git abgelegt oder im Chat eingefügt. Das Skript prüft die tatsächlichen Profilangaben und die Signierung; ein iPad-Testprofil/Ad-hoc-Profil ersetzt kein App-Store-Connect-Profil. Es erzeugt keine Apple-Zertifikate oder Profile und beantragt keine zusätzlichen Apple-Rechte. Die Schlüssel liegen während der Ausführung nur im temporären Bereich des Mac-Runners und werden nach dem Schritt bereinigt. Der Workflow lädt keine IPA oder Schlüssel als GitHub-Artefakt hoch; `Export` prüft somit nur die Erstellung auf dem Runner. Für die Installation wird anschließend ausdrücklich `Upload` verwendet.

Für jeden Export/Upload wird eine noch nicht verwendete Apple-Buildnummer angegeben. Der angenommene erste Upload verwendet Version `0.1.0`, Build `1`. Apple hat diesen Build erfolgreich verarbeitet. Der Kontoinhaber hat die Verschlüsselungsfragen am 7. Oktober 2026 selbst im Browser beantwortet und gespeichert; fehlende Compliance wird für diesen Build nicht mehr angezeigt. Die interne Gruppe **Jagdlatein iPad-Test** wurde ohne automatische Verteilung angelegt. Sie enthält jetzt Build `1` und Build `3` der Version `0.1.0` und weiterhin genau den eigenen Kontoinhaber als einzigen Tester. Für die unveränderte Verschlüsselung wurde die bereits bestätigte Angabe auch für Build `3` gespeichert; der Build hat den Status **Im Test**. Build `2` ist nicht zugeordnet. Der Nutzer hat TestFlight-Installation, App-Start, Anmeldung, Kurszugang und die Merkliste nach einem App-Neustart am 7. Oktober 2026 auf seinem iPad für Build `1` bestätigt. Installation und Logo-Anzeige von Build `3` stehen als Nutzerbestätigung noch aus. Lernfortschritt/Quiz, Audio/Video/PDF, Rotation und Netzwerkfehler sind noch nicht auf dem echten Gerät bestätigt. Es wurden weder externe Tester eingeladen noch eine App-Store-Prüfung eingereicht. Externe Testgruppen können eine zusätzliche Apple-Beta-Prüfung erfordern.

Quellen: [GitHub: Apple-Signierung auf Mac-Runners](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications), [Apple: TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/), [Apple: App-Store-Connect-API](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/).

## Vor TestFlight und App Store noch erforderlich

1. Auf dem echten iPad bestätigte der Nutzer am 7. Oktober 2026 Installation, App-Start, Anmeldung, Kurszugang und den Erhalt der Merkliste nach einem App-Neustart für Build `1`. Für Build `3` sind Installation und sichtbares Original-Logo noch zu bestätigen. Noch zu prüfen sind Lernfortschritt/Quiz, Audio/Video/PDF, Rotation und Netzwerkfehler sowie Community, externe Quellen, Tastatur und Safe Areas. Auf einem echten iPhone ist die Geräteprüfung weiterhin offen.
2. Die vorbereiteten Apple-Abos mit realen Sandbox-Transaktionen, Kaufwiederherstellung, Kündigung und Erstattung prüfen. Die kostenlose Registrierung und Kontogeneration zunächst im Testprojekt aktivieren. Bestehende berechtigte Webzugänge verhindern einen zusätzlichen Kauf. Apples Einführungsberechtigung gilt je Abo-Gruppe; eine abgelaufene PayPal-Probezeit schließt sie nicht automatisch aus. Die genaue Storefront-Regelung und der Umgang mit Apples Sandbox-Reviewkäufen auf dem Produktionsbackend sind vor Veröffentlichung zu prüfen.
3. Die vorbereitete direkte Kontolöschung mit einem ausdrücklich entbehrlichen Testkonto in der getrennten Testdatenbank prüfen. Community-Meldung/Blockieren/Moderation, Datenschutzhinweise und App-Store-Datenangaben prüfen bzw. vervollständigen. Das vorhandene `PrivacyInfo.xcprivacy` beschreibt zunächst die lokale UserDefaults-Nutzung; es ist **keine abschließende Erklärung der über die Website verarbeiteten Kontodaten**.
4. Screenshots, Store-Beschreibung und Review-Zugang für eine spätere App-Store-Einreichung vorbereiten. Mitgliedschaft, finale App-ID und Signierung sind bereits eingerichtet und am echten Export geprüft. Apple prüft auch den eigenständigen Nutzen gegenüber einer bloß eingebetteten Website. Eine Annahme im App Store ist nicht zugesichert.

`npm run check:release` scheitert deshalb absichtlich. Diese Sperre erst nach den tatsächlichen Integrations- und Gerätetests durch einen konkreten Freigabecheck ersetzen.

## Quellen

- [Apple: App-Prüfungsrichtlinien, insbesondere Zahlungen, Mindestfunktionalität und Kontolöschung](https://developer.apple.com/app-store/review/guidelines/de/)
- [Apple Developer Program und Veröffentlichung](https://developer.apple.com/programs/)
- [PayPal: Die eigene Website im eigenen WebView ist für den JavaScript-Checkout nicht unterstützt](https://developer.paypal.com/reference/guidelines/browser-support/)
- [GitHub: Mac-Runner und vorinstallierte Werkzeuge](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md)
- [GitHub: kostenlose Standard-Runner für öffentliche Repositorys](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Apple: Datenschutzmanifest und erforderliche API-Gründe](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)
