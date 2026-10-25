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
- APNs-Schlüssel `Jagdlatein Push Production`, ID `PYTT575C8R`, wurde mit
  `Topic Specific`, Umgebung `Production` und ausschließlich `de.jagdlatein.app`
  erstellt. Die danach gespeicherte Detailansicht bestätigt `Topic specific
  [Production]`, die Liste genau ein Topic. Kein teamweiter oder zusätzlicher
  Sandbox-Schlüssel wurde erzeugt. Der einmalige private Download bleibt zur
  sicheren lokalen Speicherung durch den Betreiber offen; Firebase hat diesen
  Schlüssel noch nicht erhalten.
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
Geräteversion fehlen zum Stand dieses Berichts noch der positiv abgeschlossene
Apple-Developer-Schlüssel-/Signierungsweg und die tatsächliche heruntergeladene
`GoogleService-Info.plist`. Der Downloadknopf im Firebase-Browser erzeugte keine
für diese Sitzung zugängliche Datei; es wurde keine Konfiguration nachgebaut.
Der Build darf ohne Datei nur mit ausgeschaltetem Merkmal bestehen. Bei vorhandenem
Original prüft er exakt Paket, Projekt, Sender und Apple-App-ID. Private APNs-
Schlüssel und Signierungsdateien gehören nicht ins Repository oder in den Chat.
Die zunächst abgelaufene Apple-Developer-Sitzung wurde vom Betreiber erneut
angemeldet. Der eng gebundene APNs-Schlüssel ist erstellt; sein privater Download
und die öffentliche Original-Konfigurationsdatei müssen noch lokal gespeichert
werden, bevor die freigegebene Firebase-Hinterlegung abgeschlossen werden kann.

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

## Technische Quellen

- Firebase [Web-Client einrichten](https://firebase.google.com/docs/cloud-messaging/js/client)
  und [Web-Empfang](https://firebase.google.com/docs/cloud-messaging/js/receive).
- Firebase [Apple-Client einrichten](https://firebase.google.com/docs/cloud-messaging/ios/client)
  und [Datenschutz](https://firebase.google.com/support/privacy).
- Tatsächlich gelesene [Apple-Datenhinweise](https://firebase.google.com/docs/ios/app-store-data-collection),
  [Messaging-Originalmanifest 13.1.1](https://raw.githubusercontent.com/firebase/firebase-ios-sdk/13.1.1/FirebaseMessaging/Sources/Resources/PrivacyInfo.xcprivacy)
  und [Installations-Originalmanifest 13.1.1](https://raw.githubusercontent.com/firebase/firebase-ios-sdk/13.1.1/FirebaseInstallations/Source/Library/Resources/PrivacyInfo.xcprivacy).
- Apple [umgebungs- und themengebundene APNs-Schlüssel](https://developer.apple.com/news/?id=wy4tb0uo),
  [Token-Verbindung](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns)
  und [private Schlüssel erstellen](https://developer.apple.com/help/account/keys/create-a-private-key/).

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
denselben SHA-256 `0366471edfc1c1c2190781bd85ff8db4443d0902fc89a4f2834c4681eae8250b`.
Es wurde kein Pin erfunden und keine Dirty-Prüfung abgeschwächt. Die in der
Paketauflösung ebenfalls sichtbaren Analytics-Repositories sind keine zusätzliche
Verknüpfung des Analytics-Produkts in die App.

Der neue PowerShell-Funktionstest bestand seine Assertions auch im Mac-Lauf;
der CI-Wrapper übernahm jedoch noch den Exitcode eines absichtlich abgewiesenen
negativen CLI-Falls. Nur nach erfolgreichem Durchlaufen aller Assertions und
der sicheren Bereinigung wird dieser externe Exitcode jetzt auf 0 gesetzt.
Fehlschläge werden nicht in `finally` maskiert. Der entsprechende tatsächliche
CI-Wrapper-Aufruf wurde unabhängig lokal erfolgreich gegengeprüft.
