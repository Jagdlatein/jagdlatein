# Lernchat: begrenzte Übertragung und Abbruch

Technische Prüfung am 25. November 2026 gegen Ausgangscommit
`61019897797d9fe851ff3bb25e46a5a5a534e578`, lokal mit Node 22.23.5.
Dies ist keine neue fachliche Prüfung des Lern- oder Rechtswissens.

## Tatsächlicher Befund

Eine isolierte echte `Request` mit nativer `ReadableStream` enthielt bereits
eine gültige Chatfrage, hielt aber das Dateiende offen. Die alte Route wartete
auch nach dem tatsächlichen Request-Abbruch weiter, behielt den Reader gesperrt
und registrierte keine eigene Lesefrist. Nach ausdrücklich nachgereichtem EOF
antwortete sie mit 200 und rief die lokale Antwortsuche auf. Eine bereits vor
dem Einstieg abgebrochene gültige Request wurde ebenfalls noch beantwortet.

Die reproduzierte Lücke liegt hinter der bestehenden Anmeldung und dem aktiven
Lernzugang, bei gleichursprünglichen Anfragen. Sie belegt keinen Authentifizierungs-
oder Berechtigungsumgehungsweg. Eine etwaige zusätzliche Hosting-Zeitgrenze
wurde damit nicht geprüft.

## Eng begrenzte Änderung

Nur die Chatroute benutzt den neuen eigenen Helfer `lib/chat-request-body.js`.
Die vorhandene Reihenfolge bleibt erhalten: Origin und Fetch-Site, JSON-Medientyp,
deklarierte 2048-Byte-Grenze, Anmeldung und aktiver Zugang, tatsächliches Lesen,
Schema und Prüfungsprofil, anschliessend lokale Antwortsuche.

- Höchstens 2048 tatsächlich gelesene Bytes; fehlende oder falsch kleine
  Content-Length-Angaben setzen diese Grenze nicht ausser Kraft.
- Eine totale Lesefrist von 8000 ms beginnt beim eigenen Body-Reader, nach der
  Zugangskontrolle. Ankommende Teilstücke verlängern sie nicht. Sie ist keine
  neue Zeitgrenze für die vorgelagerte Authentifizierung oder die Antwortsuche.
- Request-Abbruch wird vor dem Lesen, während eines ausstehenden Lesevorgangs,
  nach dessen Fortsetzung und EOF sowie direkt vor der Antwortsuche geprüft.
  Abbruch und Fristüberschreitung ergeben eine kurze sichere 408-Antwort mit
  denselben privaten No-Store-Headern wie die übrigen Antworten.
- Der Helfer beendet und entsperrt nur seinen selbst erworbenen Reader.
  `cancel()` wird einmal aufgerufen und nicht abgewartet; ein hängender oder
  ablehnender Transport-Cancel hält die Antwort nicht auf. Timer und
  Abort-Listener werden im eigenen abschliessenden Cleanup entfernt.
- Ein schon anderweitig gesperrter Body bleibt ein ungültiger Input (400),
  ohne den fremden Reader zu entsperren oder abzubrechen. Es gibt keinen
  unbeschränkten `json()`-Fallback.

240-Zeichen-Fragegrenze, erlaubte JSON-Felder, genaue Profilvalidierung,
Antwortfunktionen, Quellen, Inhalte, Regionen und Fachprüfdaten bleiben erhalten.
Fotohelfer, Quiz und andere API-Parser werden durch diesen Helfer nicht geändert.

## Nachweis

Alle Requests verwenden ausschliesslich `https://isolated.invalid` und lokale
Zugangs-/Antwort-Doubles. Keine Live-POSTs, Kundenkonten, Datenbank, Secrets,
neue Modellaufrufe oder Zahlungen wurden verwendet.

Der gezielte Vorherlauf acht neuer Abort-/Fristfälle war gegen die unveränderte
alte Route 0/8 erfolgreich. Der endgültige Lauf ist 34/34 erfolgreich ohne
übersprungene Fälle: 22 neue native Request-/Stream-Regressionen und alle 12
bestehenden Chatprüfungen.

Die neuen Prüfungen decken unter anderem den exakten Byte-Grenzwert und
stückweise mehrbytekodierte UTF-8-Zeichen, echte Origin-/Auth-Reihenfolge,
ungültige Profile, fremdes Reader-Eigentum, bereits erfolgten und laufenden
Abbruch, die Listener-Setup-Grenze, totalen Timeout trotz Teilstücken,
ausbleibendes EOF, verspätete Leseergebnisse nach Abbruch und Timeout,
ablehnenden oder dauerhaft hängenden Cancel, EOF-/Cleanup-/Profil-Abbruch und
die einmalige Timer-/Listener-Freigabe ab.

Erneut ausführbar mit Node 22.23.5 im Repository:

```text
node --test scripts/test-chat-request-limits-nov25.cjs scripts/test-jagdlatein-chat.cjs
```

Externe technische Nachweise im Chat-Arbeitsordner:

```text
work/chat-input-audit-nov25/read-only-request-probe.cjs
work/chat-input-audit-nov25/read-only-request-probe.json
work/chat-input-audit-nov25/tests-before.txt
work/chat-input-audit-nov25/tests-final.txt
```

Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` und das
vorhandene Marketingmaterial bleiben unberührt. Dieser lokale Review enthält
noch keinen Veröffentlichungs- oder Geräteprüfnachweis.
