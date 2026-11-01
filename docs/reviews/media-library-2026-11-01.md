# Mediathek: Auffinden, Verknüpfen und vier neue Beobachtungsfilme

Redaktioneller und technischer Arbeitsstand: 1. November 2026. Ausgangsrevision: `2f5d8068555a02c800280b7b769fb49a38b9a4f1`.

## Lernangebot

Die bestehende Videothek enthält nach dieser Erweiterung 19 reale lizenzierte Aufnahmen: 15 Wildtierfälle und vier Hundevideos. Zu den vier neuen Aufnahmen gehören zwölf eigene Beobachtungsfragen mit szenennahen Antwortalternativen und Erklärungen. Zusammen stehen 53 Video-Beobachtungsfragen zur Verfügung: 45 bei den Wildtierfällen und acht bei den Hundevideos. Diese Zahlen sind vom Curriculum und vom regionalen Rechtskatalog getrennt.

Die neuen Fälle sind Mäusebussard im Flug, Fasane am Wegrand, Ringeltaube auf einem Ast und Wildkaninchen im Park. Sie beschreiben konkrete sichtbare Haltungen, Bewegung, Perspektiven und Verdeckung. Die drei Vogelfälle führen zum bestehenden Kurs `wissen-federwild-beobachtung`, der Kaninchenfall zu `wissen-ausbau-hasenartige`. Vorhandene Porträts für Fasan, Ringeltaube und Wildkaninchen erhalten ihre exakten Videolinks über den bestehenden Zuordnungsmechanismus. Für den Mäusebussard wird kein fehlendes Porträt erfunden.

Die vollständigen bisherigen elf Wildtier- und vier Hundeobjekte samt allen 41 bisherigen Fragen werden gegen die vollständige historische Git-Modulstruktur geprüft. Texte, Medienpfade, Quellen, Lizenzen, Reihenfolge und alte Prüfdaten bleiben erhalten. Die Erweiterung legt keinen neuen Kurs an und erhöht keine Curriculum-Fragenzahl.

## Auffinden und Auswahl

Die Videothek zeigt lokale Vorschaubilder, einen kurzen konkreten Lernfokus und genaue Links zum passenden Kurs. Sie lädt keinen Videoplayer; die einzelnen Filme starten weiterhin nur durch ausdrückliches Abspielen. Alle Thumbnails behalten das ganze Bild im Anzeigerahmen. Die beiden Kategorien heißen wie im übrigen Angebot Wildkunde und Hundewesen.

Die Suche berücksichtigt Titel, Art/Rasse, vorhandene Schlagworte, ausdrücklich zugeordnete Fachbegriffe, Lernfokus und Kurstitel. Beispielsweise findet „Spurlaut“ den bestehenden Labradorfall zur Unterscheidung des erlernten Lautsignals. Es erfolgt keine neue KI-Auswertung der Tieraufnahmen und keine automatische Bewertung persönlicher Prüfungsleistungen.

Die bereite Router-URL bestimmt die angezeigte Auswahl. Eingaben im unteren Menü bleiben bis zum tatsächlichen URL-Commit ein Entwurf. Die Anwendung schreibt echte Push-Schritte und übernimmt Back/Forward. Nur fehlende Filter erhalten die dokumentierten Standardwerte; leere, unbekannte oder mehrfache Filter führen zur Auswahlhilfe. Ein Fehler lässt die zuletzt angezeigten Ergebnisse bestehen. Fokus und Seitenanfang werden erst bei gültiger übernommener Auswahl hergestellt.

Mounted-, Origin- und Requestgrenzen sperren alte Handler und verspätete Promise-Fortsetzungen. Origin umfasst Readiness, Raw-URL, Query und tatsächlichen Window-Hash; eine beobachtete Abweichung entwertet alte Arbeit auch vor einem erneuten Render. Ein akzeptierter Push vor URL-Commit bleibt ausstehend. Synchrone Formularentwürfe verhindern, dass zurückbehaltene Submit-Handler alte Eingaben übernehmen. Unverwandte gültige URL-Kontexte bleiben erhalten; private Angaben werden nicht erzeugt oder übernommen.

Der untere eigene Zurück-Verlauf kennt nur das konkrete Feld `bereich` dieser Route. Änderungen der Suchfrage bleiben ein Menü-Verlaufsstopp; der native Browserverlauf behält seine tatsächlichen Push-Schritte. Es gibt keine globale Query-Heuristik und keinen zusätzlichen globalen Suchknopf.

## Quellen und sichtbare Grenzen

Alle dargestellten Thumbnails haben ihre jeweiligen Urheber-, Lizenz- und Originalquellenangaben in einem zunächst geschlossenen letzten Quellenbereich der Videothek. Die zugehörigen Videofälle behalten ihre vollständigen Nachweise ebenfalls am Ende. Lernaufträge, Erklärungen und wesentliche Grenzen stehen davor.

Die Quellenlektüre und unabhängige visuelle Stichprobenprüfung sind im separaten Bericht `wildlife-video-expansion-2026-11-01-independent-visual-review.md` dokumentiert. Dazu gehören alle zwölf Fragezeitpunkte und dichtere Originalbildfolgen zum Bussardschnitt, zur Gefiederänderung der Taube und zu den Kaninchensprüngen. Es wird keine ununterbrochene visuelle Vollsichtung, Tonprüfung oder Mobilgeräteprüfung behauptet. Es werden keine neuen allgemeinen biologischen Regeln aus einzelnen Videos abgeleitet.

Die Commons-Dateiseiten wurden tatsächlich gelesen. Nicht erreichbare Openbeelden-/YouTube-Ursprungsseiten zählen ausdrücklich nicht als gelesene Zweitquellen. Die Clips dienen als direkt überprüfbare Beobachtungsübungen mit gekennzeichnetem Urheberkontext; sie sind keine unabhängigen biologischen Experimente oder deren Replikation.

## Technische Medien- und Zugriffsprüfung

Die vier vollständigen Originaldateien wurden ohne zusätzliche Schnitte, Zuschnitt oder Geschwindigkeitsänderung als H.264/yuv420p mit gegebenenfalls AAC-Ton kodiert. Ursprüngliche Einstellungswechsel bleiben erhalten. Film und entnommenes Vorschaubild behalten jeweils ihre konkret dokumentierte Lizenz, einschließlich CC BY-SA 3.0 NL beim Mäusebussard.

Der Bussard-Ursprung hat nichtquadratische Quellpixel: 720 × 576, SAR 341:240, tatsächliche Anzeigebreite 1023 Pixel. Die veröffentlichte Bearbeitung hat codecbedingt 1024 × 576 quadratische Pixel. Eine verworfene erste lokale Kodierung mit falschem Seitenverhältnis wurde vor der Veröffentlichung ersetzt. Die Regression prüft den tatsächlichen MP4-Header gegen diesen konkreten Ausgangsbefund.

Alle vier fertigen MP4 wurden vollständig mit FFmpeg fehlerfrei dekodiert. Zusätzliche Tests lesen echte MP4-Atomstruktur, AVC-Konfiguration, Maße, Dauer und Faststart-Reihenfolge; sämtliche JPEGs wurden vollständig dekodiert. Hashes und Dateigrößen werden gegen die Mediennachweise geprüft. Diese technischen Nachweise ersetzen die separate Sichtprüfung nicht.

Öffentliche Ausnahmen bleiben auf die acht konkreten neuen Mediendateien und zwei exakten Nachweisdokumente begrenzt. Verzeichnisse, benachbarte JSON-Dateien, Sicherungskopien, Lernseiten und APIs erhalten dadurch keine neue Freigabe. Fragen, Antworten und vollständige Lerntexte werden nicht in die Metadaten der Videothek übernommen.

## Verifikation und Auslieferung

Echte React-/DOM-Lebenszyklen prüfen URL-Schreiboperationen, History, Readiness, Fehler, Cancel, überholte Requests, Vor-Render-Änderungen, Unmount und Fokus. Bestehende Player-, Fragen-, Such-/Offline-, untere Back-, Auth-/Middleware- und Sicherheitsheaderprüfungen werden mitgeführt. Historische Datums- und Zählererwartungen werden auf die bewusst additive Erweiterung präzisiert, nicht durch abgeschwächte Schutzprüfungen ersetzt.

Der zusammengeführte Lauf über 19 passende Testdateien besteht mit 249 unterschiedlichen Tests, ohne übersprungene Fälle. Der lokale Produktionsbuild erzeugt erfolgreich 510 statische Seiten. Nach der visuellen Endprüfung wurde nur das Ringeltauben-Vorschaubild vom angeschnittenen 6-Sekunden-Bild auf das vollständiger sichtbare 12-Sekunden-Bild derselben Aufnahme umgestellt; Manifest, Prüfsumme und Lizenznachweis wurden nachgeführt. Die 71 betroffenen Medien-, Fall- und Zugriffsprüfungen bestehen anschließend erneut. Die vier Videodateien blieben dabei unverändert.

Zusammengeführtes Testprotokoll, Produktionsbuild und tatsächliche HTTP-Auslieferungsnachweise liegen außerhalb des Repositorys im Chat-Arbeitsverzeichnis unter `work/media-library-nov01/`. Die Veröffentlichung wird erst nach erfolgreichem Produktions-Commitstatus und Abgleich von Canonical/www-API, Homepage, App-Chunk, Seitenmanifest, Medienbytes, Range-Antworten und geschützten Weiterleitungen als ausgeliefert bezeichnet. HTTP-Prüfungen belegen keine angemeldete Lehransicht und keine physische Geräteprüfung.

Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` wird weder geändert noch mitgestagt; ihr SHA-256 bleibt `23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9`.
