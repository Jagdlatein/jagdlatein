# Veraltete Auswahlaktionen in der kurzen Wiederholung

Technischer Abgleich: 25. November 2026. Ausgang: `7b69962b0fee40db63096d512b852a4241c90fcb`.

## Reproduzierter Fehler

Die bestehende kurze Wissensrunde prüfte bei Antwortaktionen bereits den vollständigen Routerzustand. Der Auswahlhandler für Runde und Thema prüfte dagegen nur den letzten Render-Origin. Änderten sich URL oder Routerdaten vor dem nächsten React-Render, konnte ein aufbewahrter Wildkunde-Handler eine inzwischen ausgewählte Hundewesen-Ansicht mit einem neuen Push überschreiben. Ein später fehlgeschlagener Push konnte im gleichen Zwischenzustand zudem die alte Ansicht neu rendern und die Auswahlhilfe öffnen.

Die isolierte Reproduktion verwendet die tatsächliche React-Komponente und das bestehende untere PageMenu mit künstlichem Router, Fragenantworten und Gerätespeicher. Es wurden keine echten Browser-, Konto-, Profil-, Umgebungs- oder Datenbankdaten gelesen. Nach dem Rohwechsel von Gemischt/Wildkunde auf Gemischt/Hundewesen mit neuem Kontext und Hash erzeugte der alte Fehler-Handler einen unerwarteten Push auf Fehler/Wildkunde. Es gab keine Speicheränderung. Externer Nachweis: `work/practice-audit-nov25/reproduce-review-raw-origin.cjs`.

## Änderung und Grenzen

`components/DailyReview.js` benutzt für Auswahl und Antwortaktionen dieselbe vollständige Originprüfung: Mountzustand, aktueller Render-Origin, Routerbereitschaft, unveränderter `asPath`, vollständige Querywerte und tatsächliche Browseradresse. Browserpfad, Query und Hash müssen zusätzlich zur Routerauswahl passen. Eine beobachtete Abweichung verwirft den alten Origin unmittelbar, auch wenn später vor einem neuen Render dieselben URL-Bytes zurückkehren. Die Prüfung gilt vor Menü-, Fokus-, State- und Push-Aktionen, auch bei Wahl der bereits angezeigten Auswahl. Die vorübergehend noch bestätigte Runde wird durch reine Kontextänderungen nicht zurückgesetzt; Aktionen warten auf die tatsächlich wieder übereinstimmende Ansicht.

Eine Push-Fortsetzung gehört nur noch zur Ansicht, wenn Ticket, Pendingoperation und vollständiger Origin weiterhin passen. Ein früher eingetroffener Roh-URL-Commit wird vom tatsächlich nachfolgenden Render übernommen. Die alte Fortsetzung darf diesen Render nicht durch einen eigenen Statewechsel erzwingen, keine Fehlermeldung setzen und keinen Fokus verschieben. Der vorhandene Commit-Effekt löst die alte Pendingoperation und die Arbeitssperre auf. Aktuelle Fehler und Abbrüche, neuere Auswahlversuche, echtes History-Verhalten und die bereits vorhandenen Antwort-/Ladegrenzen bleiben erhalten.

Keine neuen Fenster, Kategorien, Fragen, Fachtexte, Prüfdaten, Kataloge, Speicherformate, Accountzugriffe oder Netzwerkendpunkte. Die Produktänderung ist ausschliesslich auf die vorhandene kurze Wiederholung begrenzt. Dieser Bericht ist keine fachliche Neuprüfung der Lerninhalte und keine Geräte- oder Produktionsprüfung.

## Regressionen

Die bestehende echte React-/DOM-Navigationssuite behält ihre zwölf bisherigen Prüfungen und ergänzt zunächst zwei gezielte Regressionen:

- Aufbewahrte Runden-, Themen- und aktuelle Auswahlhandler nach einem Rohwechsel ohne Render: anderes Thema, Mutation desselben Queryobjekts, reiner Kontextwechsel, reiner Hashwechsel und verlorene Routerbereitschaft. Die Aktionen erzeugen weder Push noch Request, Speicheränderung, Repaint oder Fokusbewegung. Ein beobachteter Weggang mit anschliessender Rückkehr zu denselben Bytes reaktiviert die alten Handler nicht. Eine anschliessende tatsächlich gerenderte Wahl funktioniert weiterhin.
- Ein Roh-URL-Commit vor dem nächsten Render bei verspätetem Push-Erfolg, `false`, Fehler und explizitem Abbruch. Die Fortsetzung öffnet keine Auswahlhilfe und ändert weder Text noch Fokus. Erst der neue tatsächliche Render löst die Arbeitssperre; ein Kontextwechsel erhält die bisherige Runde ohne zusätzliche Fragenanfrage.

Die beiden neuen Regressionen scheitern am unveränderten Ausgangsstand; alle zwölf alten Navigationstests bestehen dort. Der Baselinevergleich ersetzte nur die gelesenen Komponentenbytes innerhalb eines isolierten Testprozesses, ohne den Checkout oder Guards zu ändern: `work/practice-audit-nov25/tests-navigation-baseline-red.txt`.

Root ergänzt als fünfzehnten Navigationstest die getrennt geprüfte Browser-voraus-Phase: alte Menü-, Antwort- und Verlauf-Entfernen-Aktionen bleiben vor dem Render sowie bei noch inkonsistentem Browser-/Routerzustand ohne Wirkung. Es gibt auch keinen Fokuswechsel im inkonsistenten Render. Ein anschliessend tatsächlich übernommener aktueller Antwortklick funktioniert weiter. Alle Speicherzugriffe bleiben ausschliesslich isolierte Doubles.

Die anschliessende unabhängige Gegenprüfung reproduzierte zusätzlich eine verspätete Auswahlhilfe: Der Effekt hatte seinen Origin vor dem Planen geprüft, der Timer aber nicht vor dem tatsächlichen Öffnen. Nach einer Roh-URL-Änderung vor dem nächsten Render konnte der alte Timer das untere Menü erneut öffnen und den Fokus versetzen. Root ergänzt deshalb denselben frühen Origincheck direkt im Timer. Die unveränderte externe Gegenprobe scheitert davor und besteht danach: `work/continued-learning-nov25/independent-daily-invalid-menu-timer-initial.txt` beziehungsweise `-final.txt`. Der sechzehnte echte Navigationstest hält nur diesen Hilfetimer zurück und prüft den verworfenen Origin, eine weiterhin funktionierende aktuelle Auswahlhilfe und die echte Unmountgrenze. Kein Menü öffnet sich aus der verlassenen Ansicht.

Der vorhandene Fehlerwiederholungsfall stellt zunächst nur den Router-Hash voraus. Die neue Browserprüfung lehnt dessen alte Anfrage weiterhin wie beabsichtigt ab. Für den anschliessenden frischen Wiederholungsversuch vervollständigt der isolierte Harness jetzt auch den tatsächlichen Browser-URL-Commit. Sämtliche bisherigen Aussagen zu erhaltenem Abschluss, ignorierter Antwort, Reihenfolge, Seeds und erneutem Laden bleiben bestehen; kein Produktguard wird dafür gelockert.

Der erste gezielte Node-22-Lauf umfasst Navigation, Ladegrenzen, Fehlerwiederholung, Abschluss, Rückkehrziele, nachträgliche Lektüre, Ländergrenzen und den bestehenden Wiederholungsalgorithmus: **101 Tests bestanden, keine Fehler und keine übersprungenen Fälle**. Log: `work/practice-audit-nov25/tests-focused-final.txt`. Nach Browser-/Timerergänzung und der koordinierten Sicherheitsinstallation bestehen die finalen sechzehn Navigationstests gemeinsam mit allen achtzehn Fehlerwiederholungsfällen: **34 Tests bestanden, keine Fehler und keine übersprungenen Fälle**, `work/continued-learning-nov25/daily-origin-navigation-repeat-final.txt`. Die umfassenden Abschlussprüfungen erfolgen nach diesem Freeze im gemeinsamen Root-Lauf; vorherige Diagnoseläufe ersetzen sie nicht. Verwendet wurde der vorhandene vollständige DOM-Runtime-Bestand `work/dein-moment-qa/dom-deps/node_modules/jsdom`; die alte temporäre Installation ohne `xhr-sync-worker.js` wurde nicht als Produktfehler gezählt. Für diese Navigationskorrektur wurde kein zusätzliches Paket eingeführt.

Das fremde Nachmittag-JSON und der vorhandene Marketingordner wurden nicht bearbeitet oder gestagt. Kein Commit, Push oder Deployment durch diesen Arbeitsabschnitt.
