# Begrenzte Sicherheitsprüfung: Upload, Ausgabe und Antwort-Header

Ausgangspunkt `c42efa5`, geprüft am 27. Oktober 2026. Kein Penetrationstest, keine Behauptung vollständiger Sicherheit. Ausschließlich Quellcode, synthetische lokale Requests, isolierte Datenbanktests und ein gewöhnlicher öffentlicher Homepage-Abruf; keine Konten, Nutzerbilder, Zahlungsvorgänge, Authentifizierungsumgehung oder kostenpflichtigen KI-Aufrufe.

## Befund und Änderung

`next.config.js` und `vercel.json` enthielten keine globalen Framing-, Referrer- oder MIME-Sicherheitsheader. Ein öffentlicher GET auf `https://jagdlatein.de/` vor der Änderung lieferte HTTP 200 ohne die vier jetzt gesetzten Header. Das ist eine fehlende zusätzliche Browserbarriere, kein Nachweis einer Kontoübernahme.

Für `/:path*` gelten jetzt ausschließlich:

- `Content-Security-Policy: frame-ancestors 'self';`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`

Die Frame-Regeln beschränken, wer Jagdlatein als Kindfenster einbetten darf. Sie beschränken nicht die von Jagdlatein geladenen Jitsi-/PDF-Frames. Keine neue `script-src`, `frame-src`, `media-src`, `connect-src` oder Permissions-Policy, keine Änderung von Zahlungen, Push, Weiterleitungen oder Bild-Hostmustern.

Tatsächlich gelesene technische Primärdokumentation: [MDN frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), insbesondere Abgrenzung zu `frame-src`; [MDN X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options), SAMEORIGIN und HTTP-Header statt Metaelement; [Next.js Header-Konfiguration](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers). Die tatsächliche installierte Next-Routenauflösung wird zusätzlich lokal ausgeführt; die Dokumentation der jeweils neuesten Framework-Version ersetzt diesen Nachweis nicht.

## Weitere tatsächlich geprüfte Grenzen

Fotohelfer: Zugang, exakte Origin, expliziter Übermittlungshinweis, gestreamte Größe/Zeit, JPEG-Struktur und Metadaten auch zwischen Scans, ICC-Entfernung, verteilte Quoten und Doppelanfragen, feste OpenAI-Adresse ohne Redirects, begrenzte und bereinigte Antwort. Nachrichten: feste konfigurierte Feeds, keine nutzerbestimmte Abrufadresse, Redirectverbot, Größen-/Zeitgrenzen, XML-Entitäten abgelehnt und Ausgabe als React-Text. Community-Ausgabe und Fotoergebnisse verwenden keine HTML-Ausführung; Schreibzugriffe besitzen Origin-/JSON-Grenzen. Keine belastbare neue SSRF-, XSS- oder Upload-Umgehung festgestellt. Das bestätigt nicht die Abwesenheit aller unbekannten Fehler.

Vor der Headeränderung bestanden 93 passende unterschiedliche vorhandene Regressionen: Foto-API, Provider, Normalisierung, Foto-UI, Community-Server und News. Verwendet wurden ausschließlich lokale Mocks und isoliertes SQL. Neue `scripts/test-security-response-headers.cjs` prüft die vier exakten Regeln, unveränderte Alt-Konfiguration und die tatsächliche installierte Next-Header-/Redirectauflösung für HTML, API, Assets, Service Worker, Fehler- und nicht vorhandene Pfade. Veröffentlichung und tatsächliche Produktionsauslieferung werden separat vom Hauptagenten überprüft.

Nach dem vom Hauptagenten vorgenommenen Paketupdate wurden diese 93 Fälle und die vier neuen Headerfälle unter **Next 15.5.28** erneut gemeinsam ausgeführt: **97 von 97 bestanden, keine übersprungenen Fälle**. Der Resolver-Fixture besitzt die von dieser Next-Version verlangte synthetische Build-ID; die echten Headerregeln und der echte Framework-Matcher werden nicht ersetzt. Weder ein Geräte-Sichttest noch ein Live-Test der Zahlungs- oder Konferenzdienste wird daraus abgeleitet.
