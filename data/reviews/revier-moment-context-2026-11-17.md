# Fall des Tages: im gewählten Thema weiterlernen

Technischer Prüfstand: 17. November 2026. Ausgang: `69e4417ffc881e88432dfc04e3e444f1b1357659`.

## Problem und Änderung

Der Fall des Tages zeigte eine konkrete Kursfrage und deren vollständige passende Lektion, verwies danach aber auf das unbeschränkte Kurztraining und die allgemeine Quizauswahl. Der bereits bekannte Themenbereich ging dabei verloren. Auch die Layout-Kategorie war immer Jagdpraxis, obwohl der 60er-Vorrat elf gemeinsame Lernbereiche enthält.

Die geschützte Serverprojektion ergänzt nur zwei Metadatenfelder:

- `categorySlug`: die exakte kanonische Kategorie des tatsächlich gefundenen Kurses und derselben Frage im gemeinsamen Wiederholungspool.
- `practice`: `categorySlug`, der kategoriengebundene `reviewHref` und nur bei tatsächlicher Quizunterstützung der `quizHref`.

Die bestehende zentrale `quizLearningOptions(QUESTIONS)` bestimmt die tatsächliche Unterstützung. Der Reader prüft die Übereinstimmung beider Kategorien und die exakten kanonischen lokalen Ziele. Zusätzliche Query-/Hash-Felder, eine andere Kategorie, Jagdrecht und externe Adressen werden nicht als Ersatzroute übernommen. Fehlt ein Ziel, wird der betreffende Link nicht angeboten. Der Layout-Bereich folgt derselben kanonischen Kategorie; es entsteht kein weiteres Menü und keine weitere Suche.

## Erhaltung und Schutzgrenzen

Der Tagesrhythmus nach Schweizer Ziviltag, alle 60 Frage-IDs in Reihenfolge, die vier Antworten, richtige Antwort, vollständige Erklärungen und Lesetexte, Quellenzuordnungen, vorhandene Prüfdaten und exakten Lektionslinks bleiben identisch. Der eigene externe Vollobjektvergleich zieht nur die zwei neuen Metadatenfelder ab und bestätigt alle 60 vorherigen Objekte positiv gegen HEAD. Nachweis ausserhalb des Repos: `work/category-transfer-nov17/ui-preservation.json` im Chat-Arbeitsordner.

`getRevierMomentPreview` und der öffentliche Homepage-Teaser bleiben exakt auf die bisherigen vier Felder begrenzt: Datumsschlüssel, Datumstext, Fragestellung und Themenüberschrift. Kursbank, Quizbank und die Serverprojektion werden weiterhin aus dem Next-Clienttransform entfernt. Es gibt keine zusätzliche API, kein neues Speichern und keine Umstellung von Benutzer- oder Zahlungsdaten. Jagdrecht kommt weiterhin nicht in den gemeinsamen DACH-Tages-/Kurzfragenpool.

## Tests

Neue Regressionen in `scripts/test-revier-moment-context-nov17.cjs` prüfen alle 60 tatsächlichen Fragen aus elf Bereichen, reale Quiz-/Wiederholungspools, die konkrete Layout-Kategorie, beschädigte Metadaten, externe/fremde/queryveränderte Ziele, einen tatsächlich nicht unterstützten Quizpool und den unveränderten öffentlichen Teaser. Die neue Projektion erlaubt ausschliesslich die benannten kleinen Felder.

Zwei bestehende Assertions wurden eng an die beabsichtigte Änderung angepasst: die vollständige Metadaten-Allowlist in `test-revier-moment.cjs` nennt nun genau die zwei zusätzlichen Felder und vergleicht ihren Inhalt; `test-revier-moment-pages.cjs` verlangt die exakten kontextgebundenen Ziele statt der alten allgemeinen URLs. Keine alten Inhalts-, Quellen-, Antwort-, Zugriffsschutz- oder Lebenszeitprüfungen wurden entfernt.

Zusammen mit den vier Transferauftragsprüfungen und den vier bisherigen Reviermoment-Suiten: 34 passende Tests bestanden, keine übersprungen. Darunter echte isolierte Hydration, Antworten/Überspringen, 60 vollständige beantwortete Reader, Schweizer Tages-/DST-Grenzen, unsigned SSR-/Next-Datenzugriff und Clienttransform. Alle Browser-/Speicherdoubles sind isoliert; keine tatsächliche Kundensitzung wurde verwendet.

Keine neue fachliche Prüfung des bestehenden 60er-Korpus behauptet. Keine angemeldete Lehransicht, visuelle Browser- oder Geräteprüfung. Fremdes Nachmittag-JSON und bestehendes Marketing bleiben unberührt.
