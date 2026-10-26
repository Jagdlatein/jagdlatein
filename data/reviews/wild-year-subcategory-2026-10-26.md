# Wildjahr als eigene Wildkunde-Unterkategorie

## Umfang

Der vorhandene Einstieg `/lernen/wildjahr` ist unter Wildkunde jetzt unmittelbar als **Wildjahr** sichtbar. Er steht neben den sieben unveränderten Kurszweigen und führt direkt zum vorhandenen Jahresmodell, ohne zusätzliche Auswahlseite oder neues Fenster.

Das bestehende Experience-Objekt ist die gemeinsame Definition für Titel, Ziel und die Zuordnung `subcategoryOf: "wildkunde"`. Die Kategorie erhält ausschließlich die daraus vorbereitete Zusammenfassung `{ href, title }`; der Client lädt dadurch keinen vollständigen Werkzeug- oder Lehrdatenkatalog. Die zentrale Suche verwendet dasselbe Objekt und behält „Das Wildjahr“ als Suchalias.

Das bisherige zusätzliche Wildjahr-Angebot im geschlossenen Wildkunde-Werkzeugverzeichnis entfällt dort. Der bestehende Einstieg und seine Fotovorschau unter Natur & Revier bleiben erhalten. Die zwölf Hauptkategorien und sämtliche Kurszuordnungen bleiben unverändert.

## Bewahrtes Verhalten

- Keine Änderung an `WildYear`, seinen fachlichen Texten, Quellen, Fotos oder Prüfdaten.
- Die vorhandene Route und gültige `art`-/`monat`-Links bleiben unverändert.
- Serverseitige Auswahl, erste Hydration und Schweizer Kalendermonat bleiben erhalten.
- Der direkte Unterkategorielink verwendet die normale Navigation mit Zurücksetzen der Scrollposition. Das vorhandene Jahresmodell fokussiert seine bestätigte Auswahl erst bei bereitem Router.
- Sieben bisherige Wildkunde-Kurszweige, ihre Kurs- und Lektionsziele und die anderen Kategorien bleiben erhalten.
- Keine zusätzliche Suche, neue Hauptkategorie, Datenbank-, Konto-, Zahlungs- oder Speicheränderung.

## Technische Prüfung

Fünf neue Regressionen in `scripts/test-wild-year-subcategory.cjs` prüfen die kanonische Zuordnung, tatsächliche SSR-Ausgabe mit acht Unterkategorien und genau einem Wildjahr-Link, erhaltene Kurszweige und Natur-&-Revier-Ausgabe, echte Suchergebnisse sowie die Link-/Scroll- und Ziel-Fokusgrenzen. Zwei tatsächlich überholte Erwartungen in `test-knowledge-navigation.cjs` berücksichtigen, dass die Fotovorschau und der Werkzeug-Zusatzlink unter Wildkunde jetzt entfallen.

Der finale gemeinsame Lauf enthält 109 unterschiedliche Tests, alle bestanden, keine übersprungen:

- `scripts/test-wild-year-subcategory.cjs`
- `scripts/test-learning-topic-tree.cjs`
- `scripts/test-knowledge-navigation.cjs`
- `scripts/test-category-scroll-reset.cjs`
- `scripts/test-wild-year-navigation.cjs`
- `scripts/test-wild-year-month-ui.cjs`
- `scripts/test-wild-year-details.cjs`
- `scripts/test-category-navigation-consistency.cjs`
- `scripts/test-law-country-subcategories.cjs`
- `scripts/test-learning-navigation-labels.cjs`
- `scripts/test-learning-experiences.cjs`
- `scripts/test-global-navigation.cjs`

Dies ist eine Navigationsänderung und keine neue fachliche Prüfung der Wildjahr-Inhalte. Die Prüfung verwendet lokale, isolierte Renderer und keine echten Konten oder persönlichen Browserdaten. Ein neuer Build, eine spätere Veröffentlichung und deren tatsächliche Auslieferung sind gesondert zu bestätigen; eine Geräteprüfung wird hier nicht behauptet.
