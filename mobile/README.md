# Jagdlatein für iPhone und iPad

Die iOS-Entwicklungsversion lädt **https://www.jagdlatein.de/** direkt in einer nativen `WKWebView`. Die Website leitet auf `https://jagdlatein.de/` weiter; beide eigenen HTTPS-Adressen werden unterstützt. Inhalte, Fotos, Menü und laufende Website-Änderungen stammen somit aus dem bestehenden Angebot. Es gibt keinen zweiten Lernkatalog und keine Kopie der kostenpflichtigen Kursinhalte im App-Paket.

**Stand: Website-basierte Entwicklungsversion, erfolgreich auf dem Mac gebaut und im iPhone-Simulator geprüft. Am 6. Oktober 2026 bestanden im [Mac-Lauf für Commit `e69641c`](https://github.com/Jagdlatein/jagdlatein/actions/runs/37518700151) neun Swift-/WebKit-Tests, der vollständige Simulator-Bedienungstest und fünf Node-Prüfungen mit Xcode 26.3, iPhone 17 Pro und iOS 26.2. Auch das parallele unsignierte Release-Archiv für iPhone-/iPad-Geräte wurde erfolgreich erstellt und geprüft. Im [TestFlight-Lauf für Commit `acd67dc`](https://github.com/Jagdlatein/jagdlatein/actions/runs/37526321075) wurden anschließend die signierte IPA, Signatur und Profil erfolgreich geprüft; Apple nahm den Upload von Version `0.1.0`, Build `1`, an. Am 7. Oktober 2026 wurde Apples Verarbeitung bestätigt und der Build für den internen Test freigeschaltet. Der Nutzer bestätigte am 7. Oktober 2026 die TestFlight-Installation und den Start auf seinem echten iPad sowie Anmeldung, Kurszugang und den Erhalt der Merkliste nach einem App-Neustart. Weitere Geräteprüfungen stehen noch aus. Die fünf lokalen Prüfungen unter Windows bestehen ebenfalls, einschließlich der TestFlight-Profilprüfung; npm audit meldet keine bekannten Sicherheitslücken in den mobilen Entwicklungswerkzeugen. Erste Geräteprüfungen wurden vom Nutzer bestätigt; eine vollständige Geräteabnahme und App-Store-Veröffentlichung stehen noch aus.**

## Umsetzung

- Native iPhone-/iPad-Projektdateien: `ios/App/App.xcodeproj`.
- UIKit und WebKit mit lokalem Foundation-Paket `core` für Navigation und Merkliste. Kein externer Capacitor-Webserver und kein JavaScript-Zugriff auf eine native Plugin-Brücke.
- Die Website bleibt in ihrem echten HTTPS-Ursprung. Der reguläre persistente WebKit-Datenspeicher verwaltet die Cookies; die Website-Anmeldung wird nicht nachgebaut. Eine Anmeldung in Safari gilt nicht automatisch auch in dieser App.
- Native Bedienung: Zurück, Vorwärts, Aktualisieren, Merkliste und Teilen; Fehler-/Wiederholenansicht bei fehlender Verbindung. Die Nutzung der Website erfordert Internet.
- Eigene Hauptseiten müssen genau `www.jagdlatein.de` oder `jagdlatein.de` sein. Fremde Fachlinks werden nach einer Nutzeraktion extern geöffnet. Es gibt keine HTTP-/TLS-Ausnahme, allgemeine CORS-Freigabe oder übernommenen Server-Secrets.
- Das App-Icon und Startbild verwenden das bestehende goldene Buchsymbol aus `public/app-icon.svg`. Im aktuellen Arbeitsbaum erscheint dasselbe Symbol zusätzlich in der nativen Kopfzeile; `BrandLogo.imageset` stellt es in drei Skalierungen bereit. Die fünf Node-Prüfungen und die Projekt-/Assetprüfung unter Windows bestehen. Diese Logo-Erweiterung ist noch nicht auf dem Mac gebaut oder als Build `2` zu TestFlight hochgeladen und gehört damit noch nicht zur installierten Version `0.1.0 (1)`. Keine KI-Fotos. Die Fotos der Website werden dort weiter gepflegt.
- `/preise`, `/paytest` und PayPal-Kaufziele sind in dieser Entwicklungsversion gesperrt. Vor dem ersten Laden wird ein nativer WebKit-Netzwerkfilter für PayPal-Ressourcen und `/api/paypal` aktiviert. Die URL-Prüfung erfasst außerdem interne Next-Seitenwechsel. Der vorhandene Webcheckout wird nicht verändert. Die iOS-Kaufanbindung ist noch offen.

Die ursprüngliche Projektstruktur wurde mit dem offiziellen Capacitor-iOS-Template angelegt. Die App verwendet jetzt einen eigenen UIKit-/WebKit-Controller; die Capacitor-Laufzeit und die lokale React-Katalogvorschau sind nicht Teil des iOS-Projekts.

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

Die Apple-Developer-Mitgliedschaft wurde am 6. Oktober 2026 im angemeldeten Konto als aktiv geprüft. Die feste App-ID `de.jagdlatein.app` ist registriert; der deutschsprachige App-Store-Connect-Eintrag **Jagdlatein** ist unter der Apple-App-ID `6819820561` angelegt. Apple hat den Upload von Version `0.1.0`, Build `1`, angenommen. Am 7. Oktober 2026 wurde Apples Verarbeitung als erfolgreich bestätigt (`VALID`, Mindestversion iOS/iPadOS 15.0). Die interne Gruppe **Jagdlatein iPad-Test** enthält genau Version `0.1.0`, Build `1`, mit dem Status **Bereit zum Testen**. Automatische Verteilung ist ausgeschaltet. Der eigene Kontoinhaber ist der einzige Tester und wurde am 7. Oktober 2026 um 08:48 Uhr (Europe/Zurich) eingeladen. Der Nutzer bestätigte am 7. Oktober 2026 die Installation über TestFlight und den erfolgreichen Start auf seinem echten iPad. Anmeldung, Kurszugang und die Merkliste nach einem vollständigen App-Neustart wurden ebenfalls vom Nutzer bestätigt. Das ist eine erste Geräteprüfung, keine vollständige Geräteabnahme.

`scripts/build-ios-testflight.ps1` und `.github/workflows/ios-testflight.yml` führen diesen Ablauf aus. **Apple-Distribution-Zertifikat und passendes App-Store-Profil für `de.jagdlatein.app` sind angelegt. Der private RSA-Schlüssel und die erfolgreich exportierte P12 liegen verschlüsselt lokal. Die vier erforderlichen Apple-Secrets wurden nach ausdrücklicher Freigabe ausschließlich in der geschützten GitHub-Umgebung `ios-testflight` gespeichert. Der [signierte Mac-Lauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37526321075) mit Xcode 26.3 erstellte und prüfte Archiv und IPA für Version `0.1.0`, Build `1`; Apple nahm den Upload am 6. Oktober 2026 um 20:29:17 UTC an. Apples Verarbeitung wurde am 7. Oktober 2026 als erfolgreich bestätigt. Die tatsächliche TestFlight-Installation und erste iPad-Prüfungen wurden am 7. Oktober 2026 vom Nutzer bestätigt. Weitere Geräteprüfungen stehen noch aus; eine App-Store-Einreichung wurde nicht vorgenommen.** Im [vorherigen erfolgreichen Mac-Lauf](https://github.com/Jagdlatein/jagdlatein/actions/runs/37518700151) wurden sowohl das unsignierte Release-Gerätearchiv als auch die Simulator-App erstellt und geprüft. Der Simulator-Bedienungstest besteht nach vollständiger Startbereitschaft des Simulators. Ein unsigniertes Gerätearchiv bestätigt weiterhin keine Installation oder echte Gerätemessung. Die CMS-Signatur des heruntergeladenen Apple-Profils wurde auf Integrität geprüft; Team/App-ID und Distribution-Zertifikat stimmen mit den tatsächlich heruntergeladenen Dateien überein. Diese Prüfung ist keine Apple-Vertrauensketten- oder Sperrprüfung.

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

Für jeden Export/Upload wird eine noch nicht verwendete Apple-Buildnummer angegeben. Der angenommene erste Upload verwendet Version `0.1.0`, Build `1`. Apple hat diesen Build erfolgreich verarbeitet. Der Kontoinhaber hat die Verschlüsselungsfragen am 7. Oktober 2026 selbst im Browser beantwortet und gespeichert; fehlende Compliance wird für diesen Build nicht mehr angezeigt. Die interne Gruppe **Jagdlatein iPad-Test** wurde ohne automatische Verteilung angelegt. Genau dieser Build ist mit dem Status **Bereit zum Testen** zugeordnet; genau der eigene Kontoinhaber wurde als einziger Tester eingeladen. Der Nutzer hat TestFlight-Installation, App-Start, Anmeldung, Kurszugang und die Merkliste nach einem App-Neustart am 7. Oktober 2026 auf seinem iPad bestätigt. Lernfortschritt/Quiz, Audio/Video/PDF, Rotation und Netzwerkfehler sind noch nicht auf dem echten Gerät bestätigt. Es wurden weder externe Tester eingeladen noch eine App-Store-Prüfung eingereicht. Externe Testgruppen können eine zusätzliche Apple-Beta-Prüfung erfordern.

Quellen: [GitHub: Apple-Signierung auf Mac-Runners](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications), [Apple: TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/), [Apple: App-Store-Connect-API](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/).

## Vor TestFlight und App Store noch erforderlich

1. Auf dem echten iPad bestätigte der Nutzer am 7. Oktober 2026 Installation, App-Start, Anmeldung, Kurszugang und den Erhalt der Merkliste nach einem App-Neustart. Noch zu prüfen sind Lernfortschritt/Quiz, Audio/Video/PDF, Rotation und Netzwerkfehler sowie Community, externe Quellen, Tastatur und Safe Areas. Auf einem echten iPhone ist die Geräteprüfung weiterhin offen.
2. Digitale iOS-Abos mit verifizierten Apple-Transaktionen, Kontozuordnung und Kaufwiederherstellung anbinden. Bestehende Webkonten sollen denselben berechtigten Zugang erhalten; ein zweiter Testzugang darf dadurch nicht entstehen. Die genaue Storefront-Regelung ist vor Veröffentlichung erneut zu prüfen.
3. Kontolöschung innerhalb der App, Community-Meldung/Blockieren/Moderation, Datenschutzhinweise und App-Store-Datenangaben prüfen bzw. vervollständigen. Das vorhandene `PrivacyInfo.xcprivacy` beschreibt zunächst die lokale UserDefaults-Nutzung; es ist **keine abschließende Erklärung der über die Website verarbeiteten Kontodaten**.
4. Screenshots, Store-Beschreibung und Review-Zugang für eine spätere App-Store-Einreichung vorbereiten. Mitgliedschaft, finale App-ID und Signierung sind bereits eingerichtet und am echten Export geprüft. Apple prüft auch den eigenständigen Nutzen gegenüber einer bloß eingebetteten Website. Eine Annahme im App Store ist nicht zugesichert.

`npm run check:release` scheitert deshalb absichtlich. Diese Sperre erst nach den tatsächlichen Integrations- und Gerätetests durch einen konkreten Freigabecheck ersetzen.

## Quellen

- [Apple: App-Prüfungsrichtlinien, insbesondere Zahlungen, Mindestfunktionalität und Kontolöschung](https://developer.apple.com/app-store/review/guidelines/de/)
- [Apple Developer Program und Veröffentlichung](https://developer.apple.com/programs/)
- [PayPal: Die eigene Website im eigenen WebView ist für den JavaScript-Checkout nicht unterstützt](https://developer.paypal.com/reference/guidelines/browser-support/)
- [GitHub: Mac-Runner und vorinstallierte Werkzeuge](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md)
- [GitHub: kostenlose Standard-Runner für öffentliche Repositorys](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Apple: Datenschutzmanifest und erforderliche API-Gründe](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)
