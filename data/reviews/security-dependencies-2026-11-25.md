# Abhängigkeiten: begrenzte Sicherheitsprüfung vom 25. November 2026

Ausgangsbasis ist Commit `7b69962b0fee40db63096d512b852a4241c90fcb`. Der Produktionsaudit meldete sechs betroffene Paketdatensätze, davon einen niedrig und fünf mittel, keine hohen oder kritischen Befunde. Abhängige Elternpakete sind dabei keine zusätzlichen nachgewiesenen Angriffe.

## Änderung und Geltungsbereich

- Next 15.5.28 → 15.5.29. Drei Herstellerhinweise betreffen bedingte SVG-, Edge-Routen-Cookie- beziehungsweise vorgeschaltete HTTP/1.1-Proxy-Szenarien. Die Paketbetroffenheit begründet das Update; ein Angriff auf Jagdlatein wurde weder versucht noch festgestellt. Ein Vercel-Betrieb ist kein Nachweis aller vom Hersteller beschriebenen Self-Hosting-Bedingungen.
- fast-xml-parser 5.11.1 → 5.12.1. Der Herstellerbefund erfordert nicht standardmässige `stopNodes`. Der vorhandene Nachrichtenleser setzt diese Option nicht, begrenzt Eingaben auf 1 MiB, lehnt DOCTYPE/ENTITY ab und behält seine bisherigen Parsergrenzen. Keine künstlichen Laufzeitmessungen oder Angriffsversuche.
- Das unveränderte Firebase-Admin-Paket erlaubt optional Firestore `^9.1.0`. Die normale Aktualisierung innerhalb dieses Bereichs wählt 9.4.1, dessen veröffentlichte Bereiche Firestore-api 0.7.1 und google-gax 6.17.0 zulassen. Dadurch entfällt die alte rimraf/glob/minimatch-Kette. Es gibt keine erzwungenen Hauptversions-Overrides. Die neue Kette verlangt Node 22; die bestehende Projektvorgabe bleibt 22.x.
- Sonstige direkte Abhängigkeiten, Skripte, React, Nodemailer und alle vorhandenen Overrides bleiben unverändert.

## Installation und unabhängige Gegenprüfung

Ein isolierter erster Kandidat war auditfrei, aber unvollständig: npm hatte die weiterhin erforderliche transitive `@opentelemetry/api` entfernt. Ein echter Firestore-Import und die unabhängige Baumprüfung erkannten dies. Das vollständige bisherige Lockobjekt für 1.10.0 wurde unverändert übernommen; es erfüllt die veröffentlichten `^1.9.0`-Anforderungen. Es wurde keine zusätzliche direkte Abhängigkeit eingeführt. Erst der reparierte Kandidat bestand eine frische Installation, die vollständige Baumprüfung und die Imports von Firebase App, Messaging, Firestore, Next und XML. Dabei wurden keine Firebase-Apps initialisiert und keine Nachrichten versendet.

Die unabhängige Prüfung las die Originalhinweise, veröffentlichten Elternbereiche und alle geänderten Lockobjekte selbst. Ihre vollständigen Nachweise liegen ausserhalb des Repositories unter `work/continued-learning-nov25/independent-dependency-security-review.json`. Die abschliessenden Projektprüfungen umfassen den realen Sharp-Bildpfad, Parser-/Nachrichtenregressionen, Push-/Zugangsregressionen, den Produktionsbuild und die tatsächliche Auslieferung. Deren jeweiliges Ergebnis steht im Release-Nachweis, nicht als vorweggenommene Behauptung hier.

Ein Audit ohne gemeldete Befunde bescheinigt weder vollständige Anwendungssicherheit noch die Abwesenheit früherer Angriffe. Es gab keine Konto-, Schlüssel-, Rollen- oder Schutzregeländerung.

## Tatsächlich gelesene Originalhinweise

- Next: [SVG-Bedingungen](https://github.com/vercel/next.js/security/advisories/GHSA-7qx7-33qx-rqx2), [Edge-Routen und Cookies](https://github.com/vercel/next.js/security/advisories/GHSA-f3mh-rxg3-f5g2), [Proxy-Antwortframing](https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385).
- XML: [stopNodes-Bedingungen und Korrektur](https://github.com/NaturalIntelligence/fast-xml-parser/security/advisories/GHSA-474x-hrwr-fgx4).
- Glob: [Abbruch und asynchrone Traversierung](https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4).
- Minimatch: [Herstellerhinweis](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249). Der Hersteller nennt insbesondere 10.2.6; die [überprüfte GitHub-Datenbank](https://github.com/advisories/GHSA-g3hv-75wg-m249) und npm führen den weiteren Bereich ab 7 bis vor 11.0.1. Für die zuvor installierte 9.0.9 wird deshalb keine selbst nachgewiesene Ausnutzbarkeit behauptet.
- Öffentliche Paketmetadaten: [Firebase Admin 14.4.0](https://registry.npmjs.org/firebase-admin/14.4.0), [Firestore 9.4.1](https://registry.npmjs.org/@google-cloud%2ffirestore/9.4.1), [Firestore-api 0.7.1](https://registry.npmjs.org/@google-cloud%2ffirestore-api/0.7.1), [google-gax 6.17.0](https://registry.npmjs.org/google-gax/6.17.0).
