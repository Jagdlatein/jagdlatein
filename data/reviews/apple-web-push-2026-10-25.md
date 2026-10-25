# Apple- und Web-Mitteilungen – 25. Oktober 2026

## Umfang

Die bestehenden Android-Registrierungstokens bleiben erhalten. Web und die neue
Apple-Anbindung verwenden Firebase-Installationskennungen (`fid`) und werden
getrennt nach Plattform verarbeitet. Rohe APNs-Tokens werden nicht als
FCM-Registrierungstokens versendet. Titel und Nachricht enthalten keine
Lernantworten oder Kontodaten.

Web-Mitteilungen werden ausschließlich nach ausdrücklichem Klick auf der
veröffentlichten Website aktiviert. Die Kontoseite initialisiert weder Firebase
noch einen Service Worker und fordert keine Systemerlaubnis an. Eine Apple-App
erhält ihre eigene freiwillige Aktivierung im Konto. Die bisherigen Android-
Startregeln werden hier nicht als neue plattformübergreifende Einwilligung
ausgegeben.

## Tatsächlich eingerichtet

- Bestehendes Firebase-Projekt `jagdlatein-a17b1`, Sender `1084120782155`,
  unveränderter kostenloser Spark-Tarif, aktive Cloud-Messaging-V1-API.
- Web-App `1:1084120782155:web:ee1478c3213a25c6da44ce` und Apple-App
  `1:1084120782155:ios:1704651867d85968da44ce`, Paket `de.jagdlatein.app`.
- Der Betreiber hat die Erstellung der Web-/Apple-Schlüssel ausdrücklich
  freigegeben. Der öffentliche Web-VAPID-Schlüssel wurde danach tatsächlich in
  der Firebase-Konsole erzeugt und in die öffentliche Konfiguration übernommen.
  Der private VAPID-Schlüssel bleibt bei Firebase.
- Apples Push-Funktion für die vorhandene explizite App-ID `de.jagdlatein.app`
  wurde aktiviert und anschließend aus einer frischen App-ID-Ansicht positiv
  gegengeprüft. Apple weist darauf hin, dass dazugehörige Profile für zukünftige
  Signierung neu erzeugt werden müssen. Es wurde kein Signierungsprofil umgangen.
- Der zuerst erzeugte APNs-Schlüssel `PYTT575C8R` war von Apple als bereits
  heruntergeladen markiert, seine Datei aber nicht auffindbar. Der Betreiber
  erstellte und lud den ausdrücklich freigegebenen Ersatz `G22TT6GJ3C` über Chrome
  herunter. Er ist ausschließlich `Topic Specific`, `Production` und
  `de.jagdlatein.app` zugeordnet. Der Hauptagent prüfte den privaten P-256-Schlüssel
  lokal ohne Inhaltsausgabe und sicherte die unveränderte Datei außerhalb des
  Repositorys im geschützten lokalen Push-Schlüsselordner.
- Der Hauptagent hinterlegte `G22TT6GJ3C` für Team `82C698N8WB` in Firebase als
  Apple-Production-APNs-Schlüssel. Eine frische UI-Ansicht nach Reload bestätigte
  die gespeicherte Zuordnung. Der Nachweis liegt außerhalb des Repositorys als
  `firebase-apns-production-saved-2026-10-25.jpg`. Anschließend genehmigte der
  Betreiber ausdrücklich den Widerruf des alten `PYTT575C8R`; der Hauptagent
  führte Revoke und Confirm aus. Die frische Apple-Liste zeigt nur noch den
  Ersatz mit einem Production-Topic. Externer Nachweis:
  `apple-old-push-key-revoked-2026-10-25.jpg`. Kein teamweiter oder zusätzlicher
  Sandbox-Schlüssel wurde erzeugt. Diese UI-Schritte wurden im Hauptagenten
  ausgeführt, nicht durch die isolierten technischen Tests.
- Migration `20261025130000_push_platforms.sql` wurde im angemeldeten
  Supabase-SQL-Editor erfolgreich ausgeführt. Sie ergänzt die vorhandene private
  Tabelle um die Art der Registrierung, ohne Empfänger, Eigentümer oder Opt-ins
  umzuschreiben. Eine anschließende reine Metadatenabfrage bestätigte RLS,
  `registration_kind text DEFAULT 'token'`, keinen direkten Zugriff für `anon`
  oder `authenticated`, Serverrechte SELECT/INSERT/UPDATE ohne DELETE sowie den
  bestehenden aktiven Eigentümer-Trigger. Keine echten Empfängerzeilen wurden
  für diesen Nachweis gelesen oder ausgegeben.

## Geräte- und Kontogrenzen

Registrierung und Deaktivierung prüfen die aktuelle signierte Kontositzung,
Herkunft und begrenzte JSON-Nutzlast. Deaktivierung ist an Kennung, Art,
Plattform und Eigentümer gebunden und verrät keine fremde Zuordnung. Der eigene
Versandendpunkt verlangt zusätzlich zum bisherigen Versandschlüssel einen
aktuellen Administrator sowie die eigene Herkunft; er ist keine öffentliche
Versand-API. Empfänger werden in begrenzten Gruppen nochmals auf ihren aktuellen
Opt-in-Stand geprüft. Ungültige Kennungen werden nur mit übereinstimmender
Eigentümer-/Zeitstempelaufnahme deaktiviert.

Web und Apple speichern lokal ausschließlich einen begrenzten Geräte-Cleanup-
Handle, keine Konto-E-Mail. Erfolgsanzeigen setzen eine bestätigte Server-
Zuordnung voraus. Gesperrter Speicher, fehlende Konfiguration, abgelehnte
Erlaubnis und unbestätigte Deaktivierung erhalten eigene ehrliche Zustände.
Alte Ansichten, Abmeldung und Kontowechsel entwerten ihre Rückrufe. Bereits
gestartete, nicht abbrechbare Geräteoperationen bleiben bis zu ihrem tatsächlichen
Ende vor Nachfolgeoperationen gesperrt; eine sichtbare Zeitüberschreitung hebt
diese Schranke nicht auf.

Abmeldung versucht die Gerätebereinigung vor dem Entfernen des Kontocookies.
Eine fehlgeschlagene Cookie-Abmeldung löscht keine lokalen Lernstände oder
Downloads und meldet keinen Erfolg. Nach bestätigter Kontolöschung erfolgt nur
die lokale Gerätebereinigung; ein abgewiesener Löschversuch löst sie nicht aus.
Die automatisierten Prüfungen verwenden isolierte Doubles statt echter Konten.

## Web

Firebase-JavaScript-SDK 13.1.0 wird erst durch Aktivierung/Deaktivierung von der
offiziellen Google-CDN geladen, ohne Firebase-Analytics-SDK. Die tatsächlich gelieferten
SDK-Exports `register`, `onRegistered`, `unregister`, `onMessage`, `isSupported`
wurden geprüft. Der Worker `/firebase-messaging-sw.js` hat ausschließlich den
Bereich `/push/`, keine Fetch-/Cache-Behandlung und ersetzt nicht den vorhandenen
Offline-Worker unter `/lernen/`. Benachrichtigungsklicks öffnen den festen eigenen
Lerneinstieg; fremde Ziele werden nicht übernommen. Vorschau, lokale Website und
Testumgebung initialisieren das Produktions-Firebase nicht. Manifest und
Home-Bildschirm-Metadaten verwenden die vorhandenen lokalen Symbole. Unterstützte
iPhone-/iPad-Web-Push-Nutzung benötigt eine Home-Bildschirm-Web-App.

## Apple – verbleibende Freigabeschritte

FirebaseCore/Messaging 13.1.1 wird als exakte Swift-Package-Abhängigkeit eingebunden.
Der eigene WebKit-Bridge akzeptiert nur die eigene Produktionsseite im Hauptframe;
Status/Aktivierung außerdem nur die Kontoansicht mit vorhandener sicherer
HttpOnly-Kontositzung. Die tatsächliche Kontobindung bleibt Aufgabe des Servers.
Firebase-Auto-Initialisierung ist ausgeschaltet; das Firebase-Analytics-Produkt
wird nicht eingebunden. Preview,
Simulator, Debug und Sandbox sind für diese produktive Registrierung gesperrt.

`JL_NATIVE_PUSH_ENABLED` bleibt standardmäßig **NO**. Für eine aktivierte
Geräteversion hat der Hauptagent inzwischen die echte heruntergeladene
`GoogleService-Info.plist` mit 883 Originalbytes validiert und unverändert an den
ignorierten Quellpfad übernommen; der Quellencheck mit Flag YES bestand.
Auch die Firebase-APNs-Hinterlegung des Ersatzschlüssels ist bestätigt.
Es wurde keine Konfiguration nachgebaut. Diese Prüfung las keine privaten
Signierungsdateien und ersetzt keinen signierten Geräteexport.
Der Build darf ohne Datei nur mit ausgeschaltetem Merkmal bestehen. Bei vorhandenem
Original prüft er exakt Paket, Projekt, Sender und Apple-App-ID. Private APNs-
Schlüssel und Signierungsdateien gehören nicht ins Repository oder in den Chat.
Der Hauptagent las genau ein bestehendes App-Store-Profil `Jagdlatein App Store`,
Apple-ID `6427U7AZCK`, App-ID `82C698N8WB.de.jagdlatein.app`, Ablauf 6. Oktober 2027.
Nach der Fähigkeitsänderung zeigte es `Invalid`. Die Editansicht behielt das
ursprüngliche Distribution-Zertifikat `3423A965X7` ausgewählt; dafür wird kein
neues Zertifikat benötigt. Der Hauptagent bestätigte danach das regenerierte
Profil `64e1da80-ac30-40e8-a1f4-d8f00df5533b` vom 25. Oktober 2026 um 15:43:16 UTC:
Die kryptographische Signaturprüfung und `validateSigningProfile` mit Flag YES
und Production bestanden einschließlich Team, Bundle und Production-APS.
Das verwendete Distribution-Zertifikat hat den öffentlichen SHA-1-Fingerabdruck
`1E04AC6109CD9641DD4070A820449EEA0A6BC132`. Der Hauptagent prüfte beide
CMS-Signaturen und verglich altes und neues Profil: DeveloperCertificate-DER,
Zertifikatsfingerabdruck und Ablauf blieben gleich; der einzige abweichende
Entitlement-Schlüssel ist das hinzugekommene `aps-environment=production`.
Die Erneuerung erweitert damit nur diese Push-Berechtigung. Die Übernahme des Profils in den
geschützten Builddienst ist noch nicht bestätigt: Die Aktualisierung von
`IOS_PROFILE_BASE64` wartet an GitHubs erneuter Zugangsbestätigung auf den Betreiber.
Vor dieser bestätigten Profilübernahme wird kein aktivierter Export/Upload
ausgelöst. Ein erfolgreicher signierter aktivierter Export wird hier noch nicht
behauptet. Das Originalprofil mit 12239 Bytes und eine bytegleiche private
Sicherung sind vom Hauptagent bestätigt; diese Prüfung liest sie nicht.

## Original-Konfigurationsdatei im Builddienst

Die reine Quellenprüfung wurde unter Node 22 direkt gegengeprüft: ohne Datei
besteht sie mit Flag NO, mit Flag YES scheitert sie am tatsächlichen
`GoogleService-Info.plist`-Verweis. Zwei frische Workflow-Checkouts benötigten
deshalb denselben ausdrücklich begrenzten Transfer. Die öffentliche Original-
Clientdatei wird nur bei `native_push=true` aus dem benannten Repository-Actions-
Secret `IOS_FIREBASE_PLIST_BASE64` wiederhergestellt: einmal vor der bestehenden
Quellenprüfung und erneut im separaten geschützten Signierungsjob vor Export.
Die bisherige Environment-Freigabe `ios-testflight` und alle Team-, Bundle-,
Versions-, Production-APS-, Archiv- und IPA-Grenzen bleiben erhalten.

Obwohl die Clientkonfiguration öffentliche App-/Projektmetadaten enthält,
verwendet der Ablauf ein Repository-Secret zur automatischen Logmaskierung.
Eine gewöhnliche Actions-Variable könnte schon im Step-Environment-Logkopf als
vollständiges Base64 erscheinen. Ein nur im Environment gespeichertes Secret
wäre für den früheren checks-Job nicht verfügbar. Dieses zusätzliche Repository-
Secret enthält ausschließlich die öffentliche Original-Clientdatei; bestehende
private APNs-/Signierungszugänge bleiben außerhalb davon und hinter ihrem
unveränderten geschützten Freigabeschritt.

`mobile/scripts/prepare-firebase-ios-config.mjs` prüft kanonisches Base64,
höchstens 16 KiB dekodierte Daten, UTF-8, striktes XML und die vorhandene feste
Firebase-Identitätsprüfung einschließlich API-Key-Format. Private-Key- und
Servicekonto-Inhalte sind keine erlaubte Clientdatei. Die geprüften Originalbytes
werden nicht neu formatiert. Das einzige Ziel ist die ausdrücklich ignorierte
`mobile/ios/App/App/GoogleService-Info.plist`; Verknüpfungen, Ausbruchpfade und
das Überschreiben einer anderen Datei werden abgewiesen. Ohne ausdrückliche
Aktivierung liest der Helper keinen Konfigurationswert und schreibt keine Datei.
Plist-, API-Key- oder private Signierungsinhalte werden nicht protokolliert.

Das Repository-Secret `IOS_FIREBASE_PLIST_BASE64` wurde inzwischen vom Hauptagent
mit der tatsächlich validierten öffentlichen Originaldatei befüllt. Die unabhängigen
Helpertests verwendeten weiterhin nur synthetische, klar getrennte Testdaten und
sind kein Nachweis einer gültigen Apple-Auslieferung. Die
öffentliche Firebase-Clientkonfiguration ist keine APNs-/Servicekonto- oder
Signierungsdatei; solche privaten Daten gehören weder in dieses Clientdatei-Secret noch
ins Repository.

Die gesamte mobile Node-Suite unter Node 22.23.3 bestand mit 42 Tests ohne
übersprungene Fälle, darunter 13 neue Transfer-/XML-/Base64-/Dateipfad-/CLI- und
Workflowprüfungen. Zusätzlich bestand der vorhandene echte PowerShell-
Buildfunktionen-/Plist-CLI-Test mit isolierten Metadaten. Alle positiven
Transferproben verwendeten ausdrücklich synthetische Testdaten in eigenen
temporären Verzeichnissen; weder Originaldatei noch App-Ziel wurden damit
ersetzt. Kein echtes Profil, Schlüssel, Konto, Build-Upload oder Gerät wurde
für diese Prüfungen verwendet.

Eine veröffentlichte Website ist kein Nachweis einer neuen signierten Apple-App.
Noch keine echte Browser-/Apple-Registrierung, Systemerlaubnis, Pushnachricht oder
Zustellung an ein physisches Gerät wurde durch diese Arbeit ausgelöst.

Der reguläre TestFlight-Weg bietet einen ausdrücklich optionalen Schalter
`native_push=false`. Aktivierung ist ausschließlich für signierten Production-
Export/Upload mit dem genauen Paket zulässig. Die Quellenkonfiguration wird vor
privaten Signierungsschritten geprüft. Danach müssen sowohl Archiv als auch IPA
das tatsächliche Info-Flag, Production-APS in CodeSign und eingebettetem Profil
sowie die passende eingebettete Firebase-Datei bestätigen. Übernommene
Umgebungsvariablen, unsigned Archive, andere Pakete und Sandbox aktivieren nichts.
Die bestehende persönliche `ios-testflight`-Freigabe bleibt erhalten. Der neue
isolierte PowerShell-Test führt echte Buildfunktionen und den Plist-Datei-CLI mit
synthetischen Signierwerkzeugen aus; er behauptet keine echte Signierung.

Vor einer aktivierten Apple-Auslieferung müssen der tatsächliche Archiv-Privacy-
Report und die bisherigen App-Store-Connect-Antworten abgeglichen werden. Die
selbst gelesenen Originalmanifeste von Messaging 13.1.1 deklarieren Device ID für
App Functionality, Other Data Types für Analytics und Other Diagnostic Data für
App Functionality; Installations ergänzt Other Diagnostic Data für Analytics.
Kein Analytics-SDK bedeutet deshalb keine Zusage fehlender Diagnosedaten. Die
eigene FID-Kontoverknüpfung ist gesondert als verknüpfte Gerätekennung zu beurteilen;
generisches SDK-`linked=false` ersetzt diese App-Bewertung nicht. Das App-Manifest
wird nicht blind mit SDK-Einträgen überschrieben. Der Kontohinweis und die
Datenschutzerklärung benennen die Apple-SDK-Diagnostik bereits ausdrücklich.

## Eigener Manifestbeitrag für die Kontoverknüpfung

Der erneut gelesene native Sender übermittelt nach ausdrücklicher Aktivierung
die Installationskennung als `registration`, `kind=fid`, `platform=ios` an den
eigenen Registrierungsendpunkt. Dieser speichert sie zusammen mit der aus der
bestätigten Sitzung ermittelten `account_email`. Dafür enthält das App-Manifest
jetzt genau einen eigenen Sammlungseintrag: Device ID, App Functionality,
`linked=true`, `tracking=false`. Die bestehende UserDefaults-Begründung `CA92.1`
bleibt erhalten. Es wurden keine Vendor-Diagnostik-/Analytics-Einträge in das
App-Manifest kopiert und keine allgemeinen Tracking-Domains ergänzt.

Die Apple-Originaldefinition verlangt für den eigenen Beitrag Datentyp, Zwecke,
Linked- und Tracking-Angaben; die SDKs liefern ihre eigenen Manifeste. Diese enge
Ergänzung erklärt nur die tatsächlich geprüfte Push-Kontobindung. Sie vervollständigt
nicht die elf bisherigen App-Store-Datentypen und ist keine Gesamtzertifizierung
des App-Manifests oder der App-Store-Connect-Antworten.

`check-ios.mjs` liest die echte XML-Plist und verlangt genau eine eigene
Device-ID-Deklaration mit echten Booleanwerten, dem einen belegten Zweck und dem
vorhandenen UserDefaults-Grund. Isolierte Regressionen prüfen das Original-XML
sowie fehlende, doppelte und verfälschte Deklarationen. Unter Node 22.23.3
bestanden alle 42 bisherigen mobilen Tests sowie sechs neue unabhängige
Manifestprüfungen, jeweils ohne übersprungene Fälle. Die neue echte
Projektintegration kopiert ausschließlich erlaubte öffentliche Ressourcen in
ein temporäres Projekt ohne Original-Firebase-Datei; die Projektprüfung akzeptiert
das Original-XML, lehnt falsche Kontobindung und einen ausgetauschten API-Grund ab
und akzeptiert anschließend die wiederhergestellte Originaldatei. Zusätzlich
bestanden 61 passende Datenschutz-/native Push-/Web-Push-Regressionen. Die
Quellenprüfung des echten Projekts bestand erneut mit Flag YES; sie kompiliert
oder signiert keine App. Ein zweiter Reviewer las Apple-Definition, nativen Sender
und Serverbindung selbst und bestätigte den engen Umfang. Die Protokolle liegen
extern unter `work/regional-law-qa/tests-oct25-own-push-*`.
Der tatsächliche aggregierte Privacy Report aus dem zur Veröffentlichung
bestimmten aktivierten Archiv bleibt ein eigener noch offener Nachweis.

## Technische Quellen

- Firebase [Web-Client einrichten](https://firebase.google.com/docs/cloud-messaging/js/client)
  und [Web-Empfang](https://firebase.google.com/docs/cloud-messaging/js/receive).
- Firebase [Apple-Client einrichten](https://firebase.google.com/docs/cloud-messaging/ios/client)
  und [Datenschutz](https://firebase.google.com/support/privacy).
- Firebase [Client-API-Keys und ihre Sicherheitsgrenzen](https://firebase.google.com/docs/projects/api-keys):
  öffentliche Projekt-/App-Identifikation, getrennt von privaten Server-, APNs-
  und Signierungszugängen. API-Beschränkungen und Zugriffsregeln bleiben nötig.
- Tatsächlich gelesene [Apple-Datenhinweise](https://firebase.google.com/docs/ios/app-store-data-collection),
  [Messaging-Originalmanifest 13.1.1](https://raw.githubusercontent.com/firebase/firebase-ios-sdk/13.1.1/FirebaseMessaging/Sources/Resources/PrivacyInfo.xcprivacy)
  und [Installations-Originalmanifest 13.1.1](https://raw.githubusercontent.com/firebase/firebase-ios-sdk/13.1.1/FirebaseInstallations/Source/Library/Resources/PrivacyInfo.xcprivacy).
- Apple [eigene und SDK-Datensammlung im Manifest](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests),
  dessen verlinkte Original-Markdownfassung tatsächlich gelesen wurde, sowie die
  [Definition von Kontoverknüpfung und Datennutzung](https://developer.apple.com/app-store/app-privacy-details/):
  Grundlage des eigenen Device-ID-Beitrags; kein Ersatz für den Archivbericht.
- Apple [umgebungs- und themengebundene APNs-Schlüssel](https://developer.apple.com/news/?id=wy4tb0uo),
  [Token-Verbindung](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns)
  und [private Schlüssel erstellen](https://developer.apple.com/help/account/keys/create-a-private-key/).
- Apple [Profile nach geänderten Fähigkeiten regenerieren](https://developer.apple.com/help/account/provisioning-profiles/edit-download-or-delete-profiles/):
  Profilwahl und Regeneration, Original-Clientdownload und signierter Export sind
  getrennte Schritte mit jeweils eigenem Nachweis.

Automatisierte Struktur-, Lebenszyklus- und Buildprüfungen sind keine
Zustellbestätigung. Die externen Test-/Buildprotokolle liegen im Chat-Workspace
unter `work/regional-law-qa/` und werden nicht als Nutzerdaten ins Repository
übernommen.

Lokaler Abschlussstand unter Node 22.23.3: 458 unterschiedliche Web-/API-/Konto-/Kurs-
und Zahlungsregressionen sowie 29 mobile Node-Prüfungen bestanden, ohne
übersprungene Fälle. Die mobile
Projektprüfung und der Produktionsbuild der Website (509 statische Seiten)
bestanden. Zehn neue Swift-Tests für Herkunft, Konfiguration und Operationsrennen
sind angelegt. Der erste Mac-Lauf führte sie tatsächlich aus: neun bestanden,
ein positives Fixture war versehentlich 23 statt 22 Zeichen lang. Ausschließlich
dieses Testbeispiel wurde korrigiert; die Produktgrenzen blieben erhalten.
Der erste Ubuntu-Lauf zeigte einen fehlenden, von bereits gesperrten Abhängigkeiten
verlangten `@opentelemetry/api`-Eintrag. Die Sperrdatei wurde mit derselben
npm-10.9.9-Linie ergänzt und eine trockene `npm ci`-Validierung bestand, ohne
Anwendungsversionen oder die Node-22-Vorgabe zu ändern. Der zweite Mac-Lauf
bestand alle 40 Swift-Tests einschließlich der zehn neuen Tests und kompilierte
die native Anbindung tatsächlich in beiden Release-Gerätearchiven (Production
und Sandbox, jeweils unsigned/Flag NO) sowie im generischen Debug-Simulatorbuild
(arm64 und x86_64). Auch die anschließende öffentliche Simulator-Bedienung bestand.
Der zweite Ubuntu-Lauf fand ein bereits im Vor-Push-Stand 235bfad reproduziertes
veraltetes PayPal-Testdouble für die optionale Zugriffstabelle. Nur dessen
korrekte 42P01-Missing-Table-Antwort wurde ergänzt; Produkt- und parallele
Reservierungsbehauptungen blieben unverändert. Die gesamten 147 passenden
Zahlungs-/Checkoutprüfungen bestanden danach auch unter Node 22.
Ein zusätzlicher realer Send-Repro zeigte, dass ältere gültige Tokens ohne
gesetzte Plattform im neuen Nachprüfschritt ausgelassen wurden. Für all/android
bleiben sie jetzt berechtigt; rohe iOS/APNs-Zeilen bleiben ausgeschlossen,
geänderte Eigentümer/Plattform/Zeitstempel werden weiterhin nicht gesendet oder
deaktiviert. Die Regression und eine unabhängige Gegenprüfung bestätigen das.
Unabhängige Gegenprüfung fand und reproduzierte zusätzlich Fehler bei
verspäteter nativer Deaktivierung, gesperrtem Webspeicher, fehlender SDK-Unterstützung
und fehlgeschlagener Cookie-Abmeldung. Sie wurden behoben und durch echte
Regressionen abgesichert.

Erst der danach ausgeführte Store-Bildexport stoppte an der bestehenden Prüfung
auf saubere Quellen. Der nächste Lauf bewies den konkreten zusätzlichen Pfad
`mobile/ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/`.
Die tatsächlich von Xcode erzeugte `Package.resolved` wurde aus dessen normalem
Prüflog übernommen (Version 3, 13 Originalpins, Firebase 13.1.1 bei
`dc6dfd442b1f3ec215ed62b8beb2623ffab010d6`). Quelle und übernommene Datei haben
denselben SHA-256 `1222f0b4b8952d3b4441fa3f4d8de96306beb4e3f89645ef952a3633fe1c0266`.
Ein zusätzlicher abschließender Zeilenumbruch der ersten externen Exportkopie
wurde gegen den tatsächlich gespeicherten Original-Logtext korrigiert; die
übernommene Datei entspricht jetzt exakt dessen 3772 UTF-8-Bytes mit einem
abschließenden Zeilenumbruch. Alle 13 Pins blieben unverändert.
Es wurde kein Pin erfunden und keine Dirty-Prüfung abgeschwächt. Die in der
Paketauflösung ebenfalls sichtbaren Analytics-Repositories sind keine zusätzliche
Verknüpfung des Analytics-Produkts in die App.

Der neue PowerShell-Funktionstest bestand seine Assertions auch im Mac-Lauf;
der CI-Wrapper übernahm jedoch noch den Exitcode eines absichtlich abgewiesenen
negativen CLI-Falls. Nur nach erfolgreichem Durchlaufen aller Assertions und
der sicheren Bereinigung wird dieser externe Exitcode jetzt auf 0 gesetzt.
Fehlschläge werden nicht in `finally` maskiert. Der entsprechende tatsächliche
CI-Wrapper-Aufruf wurde unabhängig lokal erfolgreich gegengeprüft.

Im folgenden UI-Lauf war der öffentliche WebView laut originalem Video zum
einmaligen Freischalten-Tap noch ohne gerenderte Webpixel, obwohl Accessibility
den Link bereits als hittable meldete. Erst später erschien der sichtbare Inhalt.
Der Fehllauf belegt damit keine echte sichtbare Linkinteraktion. Der vorhandene
Zwei-Frame-Pixelguard des Store-Capturetests wurde deshalb gemeinsam auch vor
diesen einen Baseline-Tap gesetzt. Der anschließende Main-Lauf `40199289998`
für `6e3af0d33eb3818fbe8b94fd58f2c20fe6b7686a` bestand Backend, beide
unsignierten Gerätearchive und alle 40 Swift-Tests. Der öffentliche UI-Test
stoppte bereits vor dem Tap: Der aus dem älteren Capturetest übernommene Marker
„Lernbereich öffnen“ existiert auf der aktuellen Homepage nicht mehr. Das
tatsächlich gelesene Live-HTML (HTTP 200) und der vorhandene Seitenquelltext
bestätigen stattdessen den sichtbaren Link „Jetzt freischalten“ zu `/preise`.
Das XCTest-Log blieb bei jeder Guard-Runde an der Suche nach dem alten Link
stehen; der Lauf prüfte daher weder den anschließenden Tap noch Storebilder.

Ausschließlich dieser veraltete Inhaltsmarker wird nun im Capturetest und in
der gemeinsamen Readiness-Prüfung auf den tatsächlich vorhandenen
Jetzt-freischalten-Link umgestellt. Der Guard verlangt weiter zwei echte,
aufeinanderfolgende gerenderte Frames mit unveränderter Pixelgeometrie und
Schwelle. Sämtliche anschließenden Abo-, Kaufsperr- und Merkliste-Assertions,
der einzelne Tap sowie die gemeinsamen Zeitbudgets bleiben erhalten.
Produkt-Routing und Appfunktionen wurden nicht geändert. Lokaler
Sourcevergleich und 29 mobile Node-Prüfungen bestätigen diese enge Änderung;
die tatsächliche Mac-UI-Bestätigung für die korrigierte Markerauswahl stand beim
Abschluss dieses Testfixes noch aus.

Der anschließende Lauf `40201562301` für
`4ebc2d854c4b8b38762ad05cf615c50cb0caddbc` bestätigte danach die tatsächliche
öffentliche Baseline-Bedienprüfung einschließlich Abo-Kaufsperre und dauerhaftem
Lesezeichen. Backend und beide unsignierten Gerätearchive bestanden ebenfalls.
Der Hauptagent bestätigte inzwischen den vollständigen Erfolg dieses Laufs
einschließlich aller drei vorbereitenden Store-Captures und sauberem Quellenstand
(`SourceDirty=false`). Die Baseline ist keine signierte Push-Aktivierung und
kein Nachweis einer Benachrichtigungszustellung.
