# Tierstimmen: genaue Einzelansichten und direkte Kursverknüpfungen

Arbeitsstand: 1. November 2026. Ausgangsrevision: `a6adad695442ba0a90c638cba2e2c80e0e5758ab`.

## Konkreter Lernmehrwert

Die 37 bestehenden Originalaufnahmen erhalten bei einem ausdrücklichen Link `?stimme=ID` eine eigene genaue Lese- und Höransicht auf der bestehenden Tierstimmenseite. Der frühere Effekt setzte lediglich den Artnamen als Volltextsuche. Dadurch zeigte beispielsweise der Fasanlink auch Rebhuhn und Haselhuhn, weil deren Vergleichstexte das Wort Fasan enthalten. Der neue Reader bestimmt die Aufnahme ausschließlich über ihre vorhandene exakte ID.

Die bereite URL zeigt genau einen Player, die vollständigen unveränderten Hörmerkmale, Erklärung, Kontext und Bestimmungsgrenzen dieser Aufnahme. Das vorhandene gemessene Klangbild bleibt ergänzend zugänglich. Die neue Auswahl steht im bestehenden unteren PageMenu, der Hauptteil enthält keine zweite Auswahlleiste. Direkte Kurs-, Porträt- und Videolinks verwenden ausschließlich vorhandene Zuordnungen. Ton und Film werden ausdrücklich als verschiedene Originalaufnahmen bezeichnet, ohne Identität von Tier oder Zeitpunkt zu behaupten.

Elf bestehende Kurse erhalten im schon vorhandenen Artenmenü 23 direkte Aufnahmeverknüpfungen zu 18 unterschiedlichen Tonaufnahmen. Die Projektion gleicht ausschließlich exakte `speciesSlug`-Werte ab und enthält nur Titel und interne Links. Bestehende Lektionseingrenzungen bleiben wirksam: Ein auf die Ringeltauben-Kropfmilchlektion begrenzter Artzugang wird nicht auf benachbarte Blinddarm- oder andere Lektionen ausgeweitet. Es gibt keinen neuen Audioplayer im Kurs und keine zusätzliche Kategorie.

Für manche Tonobjekte ist das bestehende `lessonUrl` ein Artenporträt. Solche Ziele werden nicht fälschlich als Kurs bezeichnet oder doppelt angeboten. Die vorhandene Quelle wird beibehalten; es wird kein Kurs erfunden.

## URL und Ansicht

Erst ein bereiter Router darf die Auswahl bestimmen. Leere, unbekannte, mehrfache und prototypähnliche IDs zeigen Auswahlhilfe; ein noch unbereiter Router zeigt keinen geratenen Fremdplayer. Ein Link mit exakt einer gültigen ID bleibt gültig, einschließlich aller bisherigen Stimmlinks aus Suche und Artenangeboten.

Ein Wechsel schreibt einen tatsächlichen Push-Schritt. Der sichtbare Text, Player und die Weiterlernlinks ändern sich erst mit der übernommenen URL. False, Cancel und Fehler ersetzen keine Aufnahme. Mehrere ausstehende Wechsel haben getrennte Requestidentitäten. Ein akzeptierter Push vor tatsächlichem Commit bleibt als ausstehend erkennbar. Eine erneute Wahl der aktuellen Aufnahme erhält ihr Audioelement. Der untere eigene Zurück-Verlauf kennt nur das konkrete Feld `stimme`; es entsteht keine allgemeine Query-Regel.

Origin umfasst Readiness, Raw-URL, Query und tatsächliche Window-Adresse einschließlich Hash. Frühe Grenzen entwerten alte Handler schon vor dem nächsten React-Render. Eine beobachtete Abweichung darf durch eine unmittelbare Rückkehr zu denselben Adressbytes nicht wieder gültig werden. Nach tatsächlicher Übernahme wird wie bei den übrigen Kategorien der Seitenanfang fokussiert. Das genaue Ziel `#tierstimme-quellen` öffnet den echten Quellenbereich; ein neuer Stimmenfall beginnt wieder mit geschlossenem Nachweisbereich.

Der bare Einstieg ohne `stimme` bleibt die bestehende Bibliothek mit dem bisherigen lokalen Hörquiz, Artengruppen, Suche, Seiten und zehn/allen Treffern. Diese lokalen Filter und Quizschritte werden in diesem Paket nicht vollständig als neue URL-Auswahl modelliert. Die neue Einzelansicht wird aus dieser Bibliothek zusätzlich direkt erreichbar. Es gibt keine Behauptung eines komplett neu aufgebauten Hörquiz.

## Wiedergabe und lokale Runden

Der gemeinsame Player wurde aus der bestehenden Komponente extrahiert. Seine bisherige API bleibt über den alten Export erreichbar. Die neue optionale Scope-/Parentgrenze ergänzt Mounted-, Medien- und Retry-Tickets; ein alter Playhandler pausiert sein erfasstes Eventziel und darf keine neue Ansicht beeinflussen. Source- und Audiofehler sowie Retry werden früh geprüft. Der bestehende Cleanup pausiert weiterhin das konkret erfasste Audioelement. Eine lokale Antwortfreigabe oder veränderte Beschriftung allein ersetzt das Audioelement nicht. Die Aufnahmen starten ausschließlich durch die Wiedergabetaste und behalten `controls` sowie `preload="none"`.

Die bestehende Bibliothek und ihr Quiz erhalten ebenfalls frühe Mounted-, Live-Origin- und Rundengrenzen. Vor-Render-Wechsel von Query, URL, Hash und Readiness sowie Unmount sperren alte Start-, Filter-, Play-, Skip-, Antwort- und Nextaktionen. Bestehende Generation-, Index-, Heard-, Answered- und Doppelklickgrenzen bleiben erhalten. Synchrone Filterwerte erlauben kombinierte Änderungen; ein zurückbehaltener Start liest die tatsächlich aktuelle Auswahl. Unsichere Wiederholung, erklärte Antworten und lokale Ergebnismeldungen bleiben unverändert. Es wird kein Kursabschluss daraus gespeichert.

## Quellen und Bewahrung

Im neuen Reader stehen vollständige Lerntexte und wesentliche Grenzen vor den ergänzenden Nachweisen. Das zugehörige Klangbild folgt erst nach den Erklärungen; Aufnahme-, Lizenz- und Fachquellen stehen am Schluss in einem anfangs geschlossenen Bereich. Bestehende Aufnahmeorte, Urheber, Lizenzen, Klangbilder, Dateipfade, biologische Texte und Prüfdaten werden nicht neu datiert oder fachlich umgedeutet. Es wurden keine neuen Tondateien erzeugt, gekürzt oder KI-Stimmen als Tieraufnahmen eingeführt.

Der Zusammenhang mit der gleichzeitig ergänzten kurzen Nickhautlektion ist die Erklärung von Sinnesorganen und genauer Beobachtung. Deren neue Fachprüfung, Quellenrollen und Begrenzungen sind separat in `avian-nictitating-lesson-2026-11-01.md` und der unabhängigen Gegenprüfung dokumentiert. Die vorhandenen Tierfilme werden nicht als sichtbarer Nickhautnachweis ausgegeben.

## Technische Gegenprüfung

Die neuen Reader-, Player- und Bibliothekstests führen echte React-Effekte und DOM-Ereignisse mit isolierten Router- und Mediendoubles aus. Sie lesen oder ändern keine echten Browserdaten. Alle 37 Stimmen werden als genaue Einzelansicht durchlaufen. Zusätzliche Fälle prüfen URL-Schreiboperationen, echte Commits, History, Fehler, Cancel, Supersede, Readiness, A–B–A, vor Render geänderte Adressen, Quellenhash, Unmount, StrictMode und unveränderte Audioelemente bei gleichbleibender Aufnahme.

Der endgültige zusammengeführte Lauf über 23 passende Testdateien besteht mit 281 unterschiedlichen Tests ohne übersprungene Fälle. Der lokale Produktionsbuild erzeugt erfolgreich 510 statische Seiten. Eine frische unabhängige technische Gegenprüfung wiederholt die 30 Reader-, Bibliotheks- und Playerfälle und kontrolliert die tatsächlichen kompilierten JSON-Daten der elf betroffenen Kurse. Die eigenständige fachliche Gegenprüfung liest beide Originalarbeiten zur Nickhaut und gleicht die erzeugte Lernkarte mit ab.

Historische Audiofixtures ohne Effects würden einen echten Mountedguard nie aktivieren. Sie wurden eng für die Audiofälle um tatsächliche Effectausführung und einen bereiten Router ergänzt; Schutzprüfungen im Produkt werden dafür nicht aufgeweicht. Andere Werkzeuge behalten ihren bisherigen Testaufbau. Der fachliche Zusatz prüft die vollständige Bewahrung aller bisherigen 198 Kurse und 1756 Karten gegen die Git-Ausgangsrevision; lediglich die neue Lektion, Frage, Karte und ihre beiden Quellen werden hinzugefügt.

Zusammengeführte Tests, Produktionsbuild und tatsächliche Auslieferung liegen außerhalb des Repositorys unter `work/sound-learning-nov01/`. Die Auslieferungsprüfung verbindet den Produktions-Commitstatus mit Canonical/www-Version, Homepage, App-Chunk, relevanten Seitenmanifesten und Ressourcen sowie beispielhaften Original-Audiodateien und Range-Antworten. Geschützte Lehrseiten müssen ohne Anmeldung weiterhin regulär zu Preise führen. Daraus folgt keine angemeldete Lehransicht oder physische Geräteprüfung.

Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` bleibt unberührt und wird nicht mitgestagt. Ihr SHA-256 bleibt `23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9`. Konten, Zahlungen, Speicherkeys und persönliche Lerndaten werden nicht geändert.
