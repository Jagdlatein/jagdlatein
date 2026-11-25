# Begrenzte Quizanfragen · 25. November 2026

Geprüft wurde der gemeinsame JSON-Leser der vier bestehenden POST-Routen für Ranglisten-Anmeldung, Rundenstart, Antwort und nächste Frage. Ein lokaler Request mit 65 582 Bytes Leerraum und einem sonst gültigen kurzen Befehl erreichte bisher den isolierten RPC-Adapter. Das war ein fehlendes Leselimit, kein nachgewiesener Zugangsbypass oder Belastungstest der Produktion.

Der Leser akzeptiert höchstens 4096 tatsächlich gelesene Bytes und wartet insgesamt höchstens 8000 Millisekunden auf den Body. Eine zu grosse oder ungültige deklarierte Content-Length wird bereits vor Erwerb des Readers abgewiesen. Eine fehlende oder falsch kleine Längenangabe umgeht die tatsächliche Bytezählung nicht. Die Frist beginnt einmal; einzelne neue Chunks verlängern sie nicht. UTF-8 wird erst nach vollständigem Empfang streng dekodiert. Erlaubt bleibt ein JSON-Objekt, kein Array, Skalar oder null.

Überlauf führt zu 413, Fristablauf zu 408, ungültiger Body oder ein schon anderweitig gesperrter Reader zu 400. Fehler enthalten keine internen Transportdetails. Das Abbrechen des eigenen Readers wird angestossen, aber ein nie auflösendes oder abgelehntes cancel-Promise hält die Fehlerantwort nicht auf. Nur ein selbst erworbener Reader wird freigegeben; Timer werden auch nach erfolgreichem Lesen und Transportfehlern entfernt. Alle Antworten bewahren `private, no-store`.

Origin- und bestehende Kontozugangsprüfungen bleiben in allen vier Routen vor dem Body-Lesen. Ungültige oder zu grosse Bodies erreichen keine Ranglistenmutation. Rollen, Konten, Fristen, Preise, Datenbankschema und Auswertung der Antworten wurden nicht geändert. Die Prüfungen verwenden echte lokale Request-/ReadableStream-Objekte mit isolierten Konto-/RPC-Doubles; es wurden keine Testmutationen an Produktionskonten oder Ranglisten gesendet.

Die tatsächlich verwendeten Clientbefehle wurden separat gelesen. Der konservative gültige Grenzfall der vorhandenen Antwortfelder mit jeweils sechs JSON-Bytes je erlaubter UTF-16-Codeeinheit sowie zwei UUIDs umfasst 1931 Bytes und bleibt unter dem neuen Limit. Anmeldung, Start und Weiter liegen ebenfalls darunter. Das ist eine Prüfung der bestehenden Client-/Serverfelder, keine Garantie für beliebige zukünftige Nutzlasten oder vollständigen Schutz vor Ressourcenangriffen.

Die unabhängigen Request-/Stream-Verträge waren vor dem Fix rot und danach grün. Sie prüfen normale und exakt 4096 Byte grosse Befehle, geteilte UTF-8-Zeichen, falsche Header, Überlauf, Syntax-/Typfehler, Transportfehler, blockierte Reader, echte Gesamtfristen, nie auflösende und abgelehnte Abbrüche, Timerbereinigung sowie alle vier realen Routen vor isolierten RPC-Adaptern.

Für die anschliessenden lokalen Prüfungen und den Produktionsbuild wurde die isolierte Node-Laufzeit von 22.23.3 auf die offizielle Sicherheitsversion 22.23.5 aktualisiert. ZIP und ausführbare Datei wurden unabhängig gegen die offiziellen Prüfsummen geprüft. Die bestehende Vercel-Auswahl `22.x` bleibt erhalten: Vercel verwaltet Minor-/Patchversionen selbst. Die tatsächlich ausgelieferte Node-Patchversion ist damit nicht nachgewiesen. Ein npm-Abhängigkeitsaudit prüft nicht die Node-Binärdatei.

## Originalquellen und genauer Umfang

- [Node.js Web Streams API](https://nodejs.org/docs/latest-v22.x/api/webstreams.html): Reader, read, cancel und releaseLock; cancel kann von der zugrunde liegenden Quelle abhängen. Grundlage der Abbruch- und Besitzgrenzen, kein Sicherheitszertifikat für Jagdlatein.
- [Node.js 22.23.5, Sicherheitsveröffentlichung vom 11. November 2026](https://nodejs.org/en/blog/release/v22.23.5) und [offizielle SHA256-Prüfsummen](https://nodejs.org/dist/v22.23.5/SHASUMS256.txt): Herkunft und Stand der lokalen Laufzeit. Keine eigene Ausnutzung der genannten Node-Schwachstellen behauptet.
- [Vercel: Node.js-Versionen](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions): Auswahl der Hauptversion und automatische Verwaltung unterstützter Minor-/Patchversionen. Keine Behauptung einer exakt beobachteten Produktions-Patchversion.

Technische Einzelbelege und die unabhängigen Vorher-/Nachherläufe liegen ausserhalb des Repositories unter `work/digestive-practice-nov25/`, der offizielle Laufzeitdownload unter `work/runtime-nov25/`. Die Vorabprüfung der bisherigen Laufzeit und der unabhängige Clientgrössenvergleich liegen unter `work/avian-parasite-nov25/`.
