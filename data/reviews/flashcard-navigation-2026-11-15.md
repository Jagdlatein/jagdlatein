# Lernkarten: bestätigte Auswahl und echte Abfrage

Technischer Prüfstand: 15. November 2026. Ausgangspunkt: `18bfbdb`.
Diese Prüfung betrifft Navigation, Lebenszeit und lokale Selbsteinschätzung.
Sie ist keine neue fachliche Zertifizierung der Karten oder des Lehrplans.

## Reproduzierter Fehler

Die bisherige Ansicht änderte Kategorie, Suchfilter und Karte lokal, bevor
`router.replace` die Adresse tatsächlich übernahm. Ein abgelehnter Wechsel
von Wildkunde zu Hundewesen liess deshalb die Hundefrage unter der alten
Wildkunde-Adresse stehen. Unbereite oder ausdrücklich ungültige Angaben
konnten Ersatzkarten anzeigen. Die bisherigen Router-Doubles bestätigten
diese Lücke nicht zuverlässig, weil sie keine echten `push`-Commits abbildeten.

## Verhalten der Änderung

- Der leere Einstieg bietet zuerst die vorhandene Kategorieauswahl in der
  Seite. Es entsteht kein zusätzliches Fenster und keine neue Kategorie.
- Die bereite, syntaktisch gültige URL bestimmt die gelesene Kategorie,
  Suche, den Modus und eine ausdrücklich gewählte Karte. `query` und
  `asPath` müssen für diese Angaben übereinstimmen. Kurs-/Lektionsprops
  und deren URL müssen in beiden Richtungen denselben Bereich bezeichnen.
- Leere, unbekannte, mehrfache, widersprüchliche oder als Array gelieferte
  Auswahlangaben öffnen keinen fremden Lehrtext. Eine noch nicht geladene
  ausdrücklich angeforderte Karte wartet auf den Bestand; eine im
  vollständigen passenden Bestand unbekannte Karte erhält eine Auswahlhilfe.
- Bewusste Kategorie-, Modus- und Kartenwechsel verwenden `push`.
  Suchtext bleibt zunächst ein eigener Entwurf; sein verzögerter Commit
  verwendet `replace`. Ein positiver Promise ohne übernommene URL reicht
  nicht zum Wechsel des Lehrtexts. Während eines tatsächlichen Commits vor
  Promise-Annahme ist der neue Lesetext möglich, die Bewertung bleibt gesperrt.
- Pending oder Fehler schliessen keine vorhandene Antwort vorschnell und
  setzen keine andere Frage unter die alte Kartenadresse. Ein Fehler ist
  sichtbar; die betreffende Kategorie lässt sich erneut wählen. Fehler
  überholter Wünsche erzeugen keine irreführende Meldung beim neueren Wunsch.
- Eine ausdrücklich vorgenommene Bewertung darf lokal gespeichert werden.
  Die bisherige bestätigte Karte bleibt bis zum nächsten URL-Commit sichtbar,
  auch wenn sie bereits aus dem fälligen Bestand gefallen ist. Dieselbe alte
  Bewertungsaktion zählt nicht ein zweites Mal. Ein fehlgeschlagener Vorschub
  lässt sich ohne erneute Bewertung fortsetzen, auch zur letzten offenen Karte.
- Erfolgreiche Auswahl und Sucheingabe mit «Karten anzeigen» führen erst
  nach dem bestätigten Commit zum Seitenanfang. Alte Fokus-Callbacks wirken
  nach fremdem Kontext, neuer Auswahl oder Unmount nicht mehr.
- Native History stellt die passende Karte wieder her. Überholte hängende
  Router-Promises blockieren keine neue aktuelle Auswahl. Erfolgreiche eigene
  Adressen werden anschliessend als spätere externe Ziele korrekt erkannt.
- Antwort-, Auswahl-, Such-, Bewertungs-, Weiter-, Link- und Formaktionen
  prüfen ihre tatsächliche Lebenszeit und den vollständigen URL-Ursprung.
  Alte Links/Formulare verhindern zudem ihre native Standardnavigation.
  Late Promises rufen nach Cleanup keine Zustandsänderungen mehr auf.
- Antwortbindung verwendet den tatsächlichen Karteninhalt einschliesslich
  Optionen und Metadaten. Derselbe Inhalt in neuen Seed-/Full-Objekten bleibt
  dieselbe Abfrage, auch bei anderer Objekt-Key-Reihenfolge. Inhaltlicher
  Ersatz bei gleicher ID übernimmt keine alte Antwort oder Bewertung.
- Druckziel und digitaler Rückweg verwenden beim sofortigen Drucken den
  tatsächlich geflushten Such-/Auswahlsnapshot. Ein sichtbarer Kurslink
  bleibt beim gelesenen Kurs. Der begrenzte Browser-Fallback bei hängendem
  Router bleibt erhalten und bewahrt den vorhandenen Next-History-Key.

## Bewahrter Umfang

Keine Fachtexte, Karten, Kurse, Fragen, Quellen, Lizenzen oder fachlichen
Prüfdaten wurden geändert. Keine neue Behauptung zu einer vollständigen
Jagdprüfungsvorbereitung wird daraus abgeleitet. Die ursprüngliche
`flashcard-review`-Speicherkennung, das Schema und die Wiederholungsintervalle
bleiben gleich. Kein Benutzerkonto, keine Zahlung und keine Datenbank wurden
gelesen oder verändert. Alle Speicher-/Browser-/Router-/Dateitestflächen sind
isolierte Doubles; die Tests greifen auf keine echten Kundendaten zu.

Bestehende Antwortauswahl und ausdrückliche Auflösung, Selbsteinschätzung,
Gross-/Kleinschreibung genetischer Optionen, fällige Karten, lokale
«Noch üben»-Reihenfolge, Start-/Vollbestand, Kurs-/Lektionslinks, bezahlter
API-Schutz, Druckvollständigkeit und die geschlossenen Quellen unten bleiben
erhalten. Nach Abschluss eines teilweise geladenen Bestands werden später
nachgeladene offene Karten weiterhin angeboten.

Die bekannte fremde Änderung an
`data/learning-expansion-afternoon-2026-10-16.json` wurde nicht bearbeitet
und gehört nicht zum Paket.

## Ausgeführte Prüfungen

Gesamter fokussierter Lauf mit Node.js 24.11.0: **135 Tests bestanden,
0 fehlgeschlagen, 0 übersprungen**. Befehl:

```text
node --test scripts/test-flashcard-selection.cjs scripts/test-flashcard-loading.cjs scripts/test-flashcard-navigation.cjs scripts/test-flashcards-ui.cjs scripts/test-flashcard-commit-independent.cjs scripts/test-flashcard-navigation-lifecycle.cjs scripts/test-flashcard-paging.cjs scripts/test-flashcard-payload.cjs scripts/test-flashcard-review.cjs
```

Davon sind 37 Fälle die separat geschriebene unabhängige
Commit-/Lifecycle-Gegensuite in `test-flashcard-commit-independent.cjs`;
sie wurde zusätzlich mit Node.js 22 unabhängig ausgeführt. Zehn weitere
Navigation-/Lifecycle-Fälle prüfen den Serializer und die Controllergrenzen,
einschliesslich neuerer wartender Schritte, identischer alter/neuer Ziel-URLs,
roher externer URL vor Promise-Annahme und aufgelöster Flushes nach Cleanup.

Die bestehenden Harnesses wurden eng an tatsächliche Router-Commits angepasst:
`test-flashcard-navigation.cjs` unterscheidet `push`/`replace`, enthält echte
bereit übernommene Adressen und prüft weiterhin History, Druck und hängende
Kurslinks. `test-flashcards-ui.cjs` besitzt einen bereiten Router und wartet
bei Vorschub auf den Commit; die Fokusprüfung verlangt nun Seitenanfang statt
Ankersprung. Die zwei UI-Fixtures in `test-flashcard-loading.cjs` und
`test-flashcard-selection.cjs` erhalten passende bereite URL-/Scopeangaben.
Ihre bisherigen Lade-, Persistenz-, Quellen-, Zugangs- und Druckprüfungen
bleiben erhalten.

Keine visuelle Geräteprüfung wird behauptet. Ein finaler Produktionsbuild
und die tatsächlich ausgelieferte Version sind getrennte Release-Prüfungen.
