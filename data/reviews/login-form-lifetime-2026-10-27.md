# Anmeldung: Lebenszeit und Formularwechsel

27. Oktober 2026. Enges Folgepaket für `pages/login.js`; keine neue serverseitige Authentifizierungs- oder Berechtigungslücke behauptet. Keine Konten, echten Codes, E-Mails, Datenbank- oder Zahlungsvorgänge wurden benutzt.

## Konkreter Vorher-Befund

Ein vor dem Unmount erfasster Submit-Handler konnte nach dem tatsächlichen React-Cleanup noch eine Code-Anfrage mit seiner alten E-Mail starten. Ein erfasster Registrierungs-Handler startete nach Wechsel zum Login weiterhin eine Anfrage an den alten Registrierungspfad. Die bestehenden Grenzen verwarfen spätere Antworten, verhinderten diese ausgehende Anfrage aber nicht. Beide Fälle wurden vor der Änderung mit echtem React/JSDOM und einem ausschließlich synthetischen Fetch-Double reproduziert. Externer Nachweis im Chat-Workspace: `work/account-form-lifetime-react-oct27.cjs`.

Die separat betrachtete Registrierung besaß keinen zum korrigierten Login-Cooldown analogen Löschfehler: 15 vorhandene und zwei zusätzliche isolierte bcrypt-/PGlite-Prüfungen bestätigten Zeilenerhalt nach ausgeschöpften Versuchen und eine erneute Ablaufprüfung beim atomaren Verbrauch. Dafür wurde kein Produktcode geändert.

## Enge Änderung

Submit, Wiederholungsanforderung, Eingabefelder und E-Mail-Wechsel prüfen früh die aktuelle Mounted-, Flow- und Formularschritt-Identität. Der Flow erhält synchron beim Renderwechsel eine neue Identität; A–B–A belebt eine alte A-Closure nicht wieder. Bis zum passenden Effect-Setup ist eine neue Flow-Ansicht noch nicht handlungsbereit. Formularschritte werden bereits beim angenommenen lokalen Schrittwechsel entwertet. Gewöhnliche weitere Eingaben im selben aktuellen Feld bleiben kombinierbar; das Feld wird dafür nicht neu gemountet.

Warteanzeigen besitzen ein eigenes Revisionsticket. Ein schon erfasster alter Timer darf weder eine neue E-Mail-Warteanzeige löschen noch deren Timer ersetzen. Anfrage- und Weiterleitungstimer prüfen weiterhin ihren konkreten Request. Bestehende Abbruchbehandlung, neutrale Servertexte, 60-Sekunden-Wartezeit, Korrektur eines falschen Codes, Checkout-/Prüfkonto-Routing und Zehn-Minuten-Hinweis bleiben erhalten. Keine neue Speicherung, Kategorie oder sichtbare Zusatzabfrage.

Die separate Prüfung des Hauptagenten fand zusätzlich einen alten Submit desselben Flows/Formschritts nach einer sichtbaren Adresskorrektur. Submit und Neuversand sind deshalb auch an die aktuelle Entwurfsrevision gebunden. Echte E-Mail-/Codeänderungen erneuern diese Revision synchron; A–B–A macht einen früheren Submit nicht wieder gültig. Die normalen Change-Handler selbst werden nicht an einzelne Entwurfsrevisionen gebunden und bleiben für aufeinanderfolgende Eingaben nutzbar.

## Nachweis und Grenzen

`scripts/test-login-form-lifetime.cjs` verwendet den tatsächlichen Seitenquellcode. Der steuerbare Hook-Harness bewahrt und führt Effect-Cleanups aus und prüft ausdrücklich den Zustand vor deren Ausführung sowie A–B–A. Ein zusätzlicher tatsächlicher React-DOM-Test prüft Unmount und unveränderte Input-Montage. Alle Fetches sind isolierte Doubles. Vorhandene Login-/Routing-/Auth-Prüfungen werden ergänzend ausgeführt. Eine lokale Lebenszeitprüfung ersetzt keine vollständige Sicherheitsprüfung oder Geräteprüfung; die unabhängige Gegenprüfung erfolgt separat durch den Hauptagenten.

Ergebnis des eigenen gezielten Laufs: zwölf neue Lebenszeitregressionen, 32 unveränderte Login-/Routingfälle und 33 vorhandene Auth-Performance-/Schutzgrenzen gemeinsam **77 von 77 bestanden, keine übersprungenen Fälle**. Der konkrete zusätzliche Draft-Befund stammt aus der separaten React-Prüfung des Hauptagenten; dessen erneute Freigabe wird nicht aus diesem eigenen Testergebnis abgeleitet.

Anschließend prüfte der Hauptagent den Code unabhängig und wiederholte seine drei tatsächlichen React-DOM-Fälle erfolgreich: Unmount, Flow A–B–A und der vorher fehlgeschlagene Submit nach Adresskorrektur. Der abschließende gemeinsame Lauf mit den fachlichen Integrationsprüfungen besteht mit **221 unterschiedlichen Fällen, null übersprungen**; der Produktionsbuild mit **509 Seiten** ist erfolgreich. Veröffentlichung und tatsächliche Auslieferung werden getrennt nachgewiesen.
