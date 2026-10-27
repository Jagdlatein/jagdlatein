# Kursübungen nach Verlaufs- oder Kontolöschung

Technische Prüfung und Umsetzung am 27. Oktober 2026 gegen `6d85030dd72409231e96216b77d825bfe3a3669a`. Keine fachliche Neuprüfung und keine Änderung von Lerntexten, Fragen, Antwortschlüsseln, Quellen oder Prüfdatumswerten.

## Reproduzierter Fehler

Der vorhandene Lernkarten-Bewerter schreibt ausschließlich seine geräteweiten Kartenbewertungen; er ruft `recordReviewAnswer` nicht auf. Für ihn wurde daher keine vermeintliche Kontobindung eingeführt.

Der tatsächliche andere Schreiber des Wiederholungsverlaufs ist `LearningCourse.answerQuestion`. Mit echter React-/DOM-Montage, dem echten Fortschritts-Hook und ausschließlich isolierten Speicher-, Timer- und Fetch-Doubles wurde gegen den Ausgangsstand reproduziert: Nach empfangenem `storage`-Entfernungsereignis für `REVIEW_STORAGE_KEY`, `localStorage.clear` oder `jagdlatein-account-deleted` nahm ein aufbewahrter Antwort-Handler vor dem nächsten Render weiterhin eine Antwort an, legte den entfernten Wiederholungsverlauf neu an und plante einen Fortschritts-POST. Ein zuvor geplanter Fortschritt wurde nach einem Kontolöschungsereignis noch beim Unmount abgeschickt. Die ausführbaren Ausgangsnachweise liegen außerhalb des Repos im Chat-Arbeitsbereich unter `work/wild-year-oct27/audit-course-review-deletion-boundary.cjs` und `.json`.

Dies belegt lokale Wiederherstellung und veraltete Transportversuche. Es belegt keine serverseitige Annahme nach Kontolöschung und keine Umgehung der bestehenden Zugriffskontrollen.

## Eng begrenzte Änderung

- Die Kursübung entwertet beim tatsächlichen Empfang dieser drei Ereignisse synchron ihren aktuellen Lauf. Aufbewahrte Antwort-, Weiter-, Start- und Lektionsübungsaktionen können den Verlauf danach nicht neu schreiben. Das Lesen und Wechseln der vorhandenen Lektionen bleibt möglich.
- Die angezeigte Wiederöffnung ist ein gewöhnlicher interner Link zum konkreten Kurs und zur aktuellen Lektion. Erst eine echte Seitenöffnung durchläuft erneut den vorhandenen Zugriffsschutz. Ein lokaler Rundenneustart oder flacher Lektionswechsel hebt die Pause nicht auf.
- `useCourseProgress` hält ausstehende Daten, Timer, Rückmeldungen und Wiederholungsaktionen je konkretem Kurskontext. Das Ereignis entwertet dessen Ticket, verwirft noch nicht versendete Daten und bricht den laufenden Fetch kontrolliert ab. Späte Erfolge und Fehler können keinen weiteren Zustand oder Fehlerhinweis übernehmen.
- Ein gewöhnlicher Routenwechsel ohne Löschereignis behält das bisherige Fertigspeichern einer bereits gegebenen Antwort. Während eines noch laufenden asynchronen Abgangsspeicherns bleiben die beiden Lösch-Listener bestehen. Ein erst nach Unmount eintreffendes Ereignis sperrt damit auch eine bislang unversendete zweite Antwort. Nach Abschluss oder Invalidierung werden die Listener entfernt; unmontierte Kontexte aktualisieren keine Oberfläche.

Bereits beim Server eingegangene Arbeit wird dadurch nicht rückgängig gemacht. Die Grenze reagiert auf tatsächlich empfangene Ereignisse; sie erzeugt keinen neuen Broadcast, wenn ein schon fehlender Speicherschlüssel erneut entfernt wird. Es gibt keine zusätzliche automatische Ladung und keine Löschung gespeicherter Kursfortschritte, Notizen oder geräteweiter Kartenbewertungen. Ein vom Browser selbst ausgeführtes `localStorage.clear` bleibt naturgemäß eine vollständige Löschung seines Speichers.

## Regressionen und Bestand

`scripts/test-course-review-lifetime.cjs` enthält 17 echte React-/DOM- und Hook-Fälle. Geprüft sind die drei Entfernungsarten vor dem Render, aufbewahrte Aktionen und Timer, späte erfolgreiche und fehlgeschlagene Antworten, Retry, serielle neuere Antworten, Ereignisse während eines bereits unmontierten Abgangsspeicherns, Listenerabbau und A–B–A-Kontextwechsel einschließlich des Zwischenzustands vor passivem Effect-Cleanup. Gewöhnliche Speicheränderungen, fremde Schlüssel und `sessionStorage`-Ereignisse pausieren nicht. Der normale Abgangs-Flush bleibt positiv geprüft. Alle Daten sind flüchtige Testdaten; es wurden keine echten Konten, Browserdaten oder POST-Endpunkte angesprochen.

Zusammen mit `test-mini-courses.cjs`, `test-course-lesson-practice.cjs`, `test-course-menu-commit.cjs`, `test-course-breed-links.cjs` und `test-course-wildlife-links.cjs` bestanden 56 unterschiedliche Fälle ohne übersprungene Tests unter Node 22.23.3. Die unabhängige technische Gegenprüfung bestand elf zusätzliche eigene echte DOM-/Hook-Szenarien, darunter alle drei Löschereignisse nach Unmount mit spätem Erfolg und spätem Fehler, eine positive ununterbrochene Abgangsspeicherung und alte Aktionen vor Render. Der Prüfer führte außerdem diese 56 Fälle erneut erfolgreich aus. Eigener Nachweis außerhalb des Repos: `work/regional-law-qa/course-progress-independent-oct27.cjs`.

Die MiniCourse-Suite hatte bereits im vollständig aus Git geladenen Ausgangsstand einen unabhängigen Fehler: Sie verlangte einen früher entfernten oberen Kategorie-Link im SSR-HTML. Der Ausgangsfehler wurde außerhalb des Repos mit `work/wild-year-oct27/probe-mini-course-baseline.cjs` reproduziert. Ausschließlich diese Erwartung wurde auf die tatsächliche unveränderte Kategorieform `{slug, title}` gegen den Kategorienkatalog und die Übergabe an `LearningToolLayout` umgestellt. Alle Prüfungen zu 34 Mini-Kursen, 122 Originalfragen, Antwortreihenfolge, Fotos, Vertiefungskursen, Weiter-Aktionen und Länderwahl bleiben erhalten; MiniCourse-Produktcode wurde nicht verändert.

Kein Build, Installieren, Staging oder Commit wurde für diese Teilprüfung ausgeführt. Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` blieb unberührt; SHA-256 weiterhin `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`. Produktionsauslieferung und vollständiger Paketbuild sind gesondert zu prüfen.
