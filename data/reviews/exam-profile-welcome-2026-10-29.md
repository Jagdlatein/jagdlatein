# Prüfungsziel unmittelbar nach der Anmeldung

## Verhalten

Nach erfolgreicher Bestätigung des E-Mail-Codes zeigt die bestehende Anmelde- bzw. Registrierungskomponente die Prüfungszielwahl direkt im Hauptinhalt. Es gibt kein zusätzliches Fenster und keinen Weg über das untere Menü. Die vorhandene, validierte Auswahl aus Land und Kanton/Bundesland wird unverändert übernommen und führt ohne erneute Eingabe weiter. Fehlt sie, sind beide Felder zunächst leer.

„Speichern und weiter“ übernimmt das Profil ausdrücklich und setzt anschließend den bereits berechneten Anmeldeweg fort. „Später auswählen“ verändert keinen gespeicherten Wert. Die Auswahl bleibt später unter Menü → Meine Prüfung änderbar. Der bestehende Profilstore und seine 51 Auswahlregionen bleiben unverändert; es gibt weiterhin keinen Konto- oder Geräteabgleich.

Bei nicht verfügbarem dauerhaftem Speicher verspricht die Seite keinen Erhalt über den anschließenden Dokumentwechsel. Der tatsächlich nur im Arbeitsspeicher gehaltene Stand wird sichtbar erklärt; erst „Trotzdem weiter“ setzt die Navigation fort. Beim erstmaligen Anzeigen der Auswahl gehen Fokus und Scrollposition an den Seitenanfang. Vorhandene Profile erhalten keinen Auswahlflash.

## Authentifizierung, Rücksprung und Grenzen

- Die Auswahl wird erst nach bestätigtem OTP-Erfolg montiert. E-Mail-Anforderung, fehlgeschlagene Codes und verspätete ehemalige Anfragen öffnen sie nicht.
- Der bestehende `getLoginDestination` berechnet das Ziel genau einmal: registrierte Standardanmeldung zum Konto; bestätigter Lehrlink ohne Lernzugang zum bisherigen Checkout; vorhandene Preis-, Community- und andere zulässige Rücksprünge einschließlich Query und Hash bleiben erhalten.
- Auch die ausdrücklich konfigurierte externe HTTPS-Zahlungsadresse bleibt nur in der exakt vom bestehenden Loginhelfer erzeugten Form erhalten. Fremde absolute Ziele, Ziel-Lookalikes, Zugangsdaten im URL und zusätzliche eingeschleuste Weiterleitungsfelder werden nicht freigegeben.
- Es gibt keine neue öffentliche oder zahlungsfreie Lernroute, keine Änderung an Middleware, Auth-APIs, Benutzerrechten, Kaufbedingungen oder Zahlungsauslösung. Insbesondere ist dies kein Ersatz für Anmeldung oder aktiven Lernzugang.
- Die bestätigte Anmeldung bleibt während der Übergabe gesperrt. Beim Übergang endet der bisherige Resend-Timer. Das Herkunftsprädikat bleibt pro Anmeldekontext stabil, sodass ein normaler Parent-Render keine zweite Weiterleitung auslöst. Ein Wechsel des Rücksprungziels entwertet alte Aktionen bereits vor Effect-Cleanup.
- Alte Formular-, Speicher-, Überspringen-, Direktlink-, Timer- und Navigationsaktionen werden nach Herkunftswechsel oder Unmount gesperrt. Eine blockierte Weiterleitung hat eine ausdrücklich nutzbare Wiederholung bzw. einen sicheren Direktlink.

Die Anwendung unterscheidet nicht anhand einer erfundenen Neukundenkennung: Derselbe Registrierungsendpunkt bestätigt auch bestehende Mitglieder. Entscheidend ist das vorhandene validierte Geräteprofil. Die Übergabe an die Auswahl enthält nur das sichere Weiterleitungsziel und eine Lebenszeitprüfung; E-Mail, Code oder Kontoantwort werden nicht als Profil gespeichert.

## Prüfung

Der passende abschließende Lauf umfasst 429 bestandene Tests in 27 Dateien, ohne Fehler oder übersprungene Fälle. Dazu gehören die vorhandenen Registrierungs-, Anmelde-, Code-, Konto-, Zugangs-, Regions-, Profil-, Datenschutz- und Navigationsprüfungen sowie neue echte React/JSDOM-Flows mit ausschließlich synthetischen OTP-Antworten und isoliertem Speicher. Der tatsächliche Startfokus und das einmalige Scrollen nach oben wurden mit dem bestehenden Fokus-Hook geprüft. Kein echter Codeversand, keine Anmeldung eines realen Benutzers und keine Änderung echter Browserdaten wurden dafür durchgeführt.

Eine unabhängige Review hat zusätzlich 71 unterschiedliche fokussierte Fälle geprüft. Sie reproduzierte und bestätigte zwei eng behobene Integrationspunkte: Erhalt der konfigurierten Checkoutadresse und Vermeidung einer durch Countdown-Neurender ausgelösten wiederholten Weiterleitung. Beleg außerhalb des Repos: `work/regional-law-qa/login-welcome-review-oct29-independent.json` im Chat-Workspace. Die bisherigen Login-Harness prüfen nach dem Codeerfolg jetzt den exakten Übergabewert an die Auswahl; neue tatsächliche React-Tests prüfen die anschließende Navigation.

Es werden keine Wissensinhalte, fachlichen Prüfdaten, Fragen oder Quellen verändert. Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` bleibt bytegleich und unstaged. Keine visuelle Geräteprüfung oder echte Anmeldung in der Produktionsumgebung wird behauptet.
