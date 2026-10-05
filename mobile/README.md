# Jagdlatein für iPhone und iPad

Die iOS-Entwicklungsversion lädt **https://www.jagdlatein.de/** direkt in einer nativen `WKWebView`. Die Website leitet auf `https://jagdlatein.de/` weiter; beide eigenen HTTPS-Adressen werden unterstützt. Inhalte, Fotos, Menü und laufende Website-Änderungen stammen somit aus dem bestehenden Angebot. Es gibt keinen zweiten Lernkatalog und keine Kopie der kostenpflichtigen Kursinhalte im App-Paket.

**Stand: Website-basierte Entwicklungsversion, erfolgreich auf dem Mac gebaut und im iPhone-Simulator geprüft. Am 5. Oktober 2026 bestanden [neun Swift-/WebKit-Tests und der vollständige Bedienungstest](https://github.com/Jagdlatein/jagdlatein/actions/runs/37334489446) mit Xcode 26.3, iPhone 17 Pro und iOS 26.2. Geprüfte native Quellen: Commit `3df56e0`. Die zwei Windows-Projekttests bestehen ebenfalls; npm audit meldet keine bekannten Sicherheitslücken in den mobilen Entwicklungswerkzeugen. Noch keine auf einem echten iPhone getestete oder im App Store veröffentlichte Version.**

## Umsetzung

- Native iPhone-/iPad-Projektdateien: `ios/App/App.xcodeproj`.
- UIKit und WebKit mit lokalem Foundation-Paket `core` für Navigation und Merkliste. Kein externer Capacitor-Webserver und kein JavaScript-Zugriff auf eine native Plugin-Brücke.
- Die Website bleibt in ihrem echten HTTPS-Ursprung. Der reguläre persistente WebKit-Datenspeicher verwaltet die Cookies; die Website-Anmeldung wird nicht nachgebaut. Eine Anmeldung in Safari gilt nicht automatisch auch in dieser App.
- Native Bedienung: Zurück, Vorwärts, Aktualisieren, Merkliste und Teilen; Fehler-/Wiederholenansicht bei fehlender Verbindung. Die Nutzung der Website erfordert Internet.
- Eigene Hauptseiten müssen genau `www.jagdlatein.de` oder `jagdlatein.de` sein. Fremde Fachlinks werden nach einer Nutzeraktion extern geöffnet. Es gibt keine HTTP-/TLS-Ausnahme, allgemeine CORS-Freigabe oder übernommenen Server-Secrets.
- Das App-Icon und Startbild verwenden das bestehende Buchsymbol aus `public/app-icon.svg`. Keine KI-Fotos. Die Fotos der Website werden dort weiter gepflegt.
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

`.github/workflows/ios-preview.yml` startet den GitHub-Actions-Build auf `macos-15` ausschließlich für Änderungen am Entwicklungsbranch `codex/ios-website-preview` oder manuell. Der öffentliche Website-Branch `main` bleibt unverändert. Standard-Runner sind bei diesem öffentlichen Repository kostenlos; der Workflow lädt keine kostenpflichtigen Build-Artefakte hoch.

Der Workflow verwendet PowerShell, Node.js 22 und ausdrücklich Xcode 26.3. Er führt die Swift-/WebKit-Tests aus, kompiliert eine **unsignierte Simulator-App** und prüft im iPhone-Simulator den echten Website-Link „Jetzt freischalten“ sowie die dauerhafte Merkliste vor und nach einem vollständigen App-Neustart. Das verwendete Gerät und die Laufzeit stehen im Build-Ergebnis. Ein frischer Simulatorstart im Builddienst kann mehrere Minuten dauern. Tests auf echten Geräten bleiben vor der Veröffentlichung erforderlich. Die Tests legen kein Konto an und lösen keine Zahlung aus. Das Buildskript erzeugt außerdem lokal auf dem Mac `Jagdlatein-Simulator.zip`; diese Datei dient dem Simulator und ist **keine installierbare iPhone-IPA**, keine TestFlight-Version und keine Store-Veröffentlichung. Der Workflow benötigt keine Apple-, Supabase- oder PayPal-Secrets.

Auf einem vorhandenen Mac mit Xcode und PowerShell:

```powershell
& .\scripts\setup-ios.ps1 -Step MacCheck
```

Projekt in Xcode öffnen: `mobile/ios/App/App.xcodeproj`. Die vorläufige Bundle-ID `de.jagdlatein.preview` muss vor einer echten Veröffentlichung durch die bestätigte Apple-App-ID ersetzt werden. Ein Signing-Team ist noch nicht hinterlegt.

## Vor TestFlight und App Store noch erforderlich

1. Auf echtem iPhone und iPad: E-Mail-Code-Anmeldung, bestehendes Abo, Kursnavigation, Lernfortschritt, Community, Audio/Video/PDF, externe Quellen, Merkliste, Netzwerkfehler, Tastatur, Rotation und Safe Areas prüfen.
2. Digitale iOS-Abos mit verifizierten Apple-Transaktionen, Kontozuordnung und Kaufwiederherstellung anbinden. Bestehende Webkonten sollen denselben berechtigten Zugang erhalten; ein zweiter Testzugang darf dadurch nicht entstehen. Die genaue Storefront-Regelung ist vor Veröffentlichung erneut zu prüfen.
3. Kontolöschung innerhalb der App, Community-Meldung/Blockieren/Moderation, Datenschutzhinweise und App-Store-Datenangaben prüfen bzw. vervollständigen. Das vorhandene `PrivacyInfo.xcprivacy` beschreibt zunächst die lokale UserDefaults-Nutzung; es ist **keine abschließende Erklärung der über die Website verarbeiteten Kontodaten**.
4. Apple-Developer-Mitgliedschaft, finale App-ID, Signing, Screenshots, Store-Beschreibung und Review-Zugang einrichten. Apple prüft auch den eigenständigen Nutzen gegenüber einer bloß eingebetteten Website. Eine Annahme im App Store ist nicht zugesichert.

`npm run check:release` scheitert deshalb absichtlich. Diese Sperre erst nach den tatsächlichen Integrations- und Gerätetests durch einen konkreten Freigabecheck ersetzen.

## Quellen

- [Apple: App-Prüfungsrichtlinien, insbesondere Zahlungen, Mindestfunktionalität und Kontolöschung](https://developer.apple.com/app-store/review/guidelines/de/)
- [Apple Developer Program und Veröffentlichung](https://developer.apple.com/programs/)
- [PayPal: Die eigene Website im eigenen WebView ist für den JavaScript-Checkout nicht unterstützt](https://developer.paypal.com/reference/guidelines/browser-support/)
- [GitHub: Mac-Runner und vorinstallierte Werkzeuge](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md)
- [GitHub: kostenlose Standard-Runner für öffentliche Repositorys](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Apple: Datenschutzmanifest und erforderliche API-Gründe](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)
