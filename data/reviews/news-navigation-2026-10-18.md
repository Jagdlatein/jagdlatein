# News und Videonavigation: begrenzter Abgleich vom 18. Oktober 2026

## Tatsächlich geprüft

Gelesen wurden `lib/jagd-news-server.js`, Feedadapter und Fallbackdaten, `lib/news-catalog.js`, `components/JagdNews.js`, `components/HomeNews.js`, News-Seite/API und die vorhandenen News-Tests. Alle neun konfigurierten Originalquellen wurden am **18.10.2026 zwischen 10:25:48 und 10:25:49 UTC** mit dem vorhandenen, unveränderten Feedadapter erfolgreich abgerufen.

| Quelle | Passende Meldungen bei diesem Abruf |
| --- | ---: |
| Bayerische Landesanstalt für Wald und Forstwirtschaft | 13 |
| Bundesforschungszentrum für Wald | 0 |
| Schweizerische Vogelwarte | 10 |
| Waldwissen.net | 9 |
| Leibniz-Institut für Zoo- und Wildtierforschung | 5 |
| Veterinärmedizinische Universität Wien | 0 |
| SWAROVSKI OPTIK Presse | 4 |
| WALDKAUZ | 2 |
| Leica Hunting Blog | 1 |
| **Momentaufnahme insgesamt** | **44** |

Das sind vom bestehenden Themen-/Datumsfilter akzeptierte Schlagzeilen, keine Anzahl neuer fachlich verifizierter Aussagen und keine Zusage, dass jederzeit 44 Meldungen vorliegen. BFW und Vetmed lieferten erfolgreich abrufbare Inhalte, aktuell aber keine vom vorhandenen Filter akzeptierten Einträge. Ein leeres Ergebnis ist daher nicht pauschal als Transportfehler einzustufen. Pro Quelle werden höchstens 24 passende Artikel übernommen; zukünftige und mehr als 366 Tage alte Veröffentlichungen werden ausgeschlossen.

Zusätzlich wurden die Originalseiten [IZW: Wildvögel und Segelflug](https://www.izw-berlin.de/de/pressemitteilung/wildvoegel-schreiben-die-regeln-der-fortbewegung-neu-segelflug-kann-die-effizienteste-bewegungsart-fuer-tiere-sein.html), [LWF: INTERFORST-Sonderschau](https://www.lwf.bayern.de/cms04/service/presse/407522/index.php) und [Vetmed: Presseinformationen](https://www.vetmeduni.ac.at/universitaet/infoservice/presseinformationen) geöffnet. Die beiden abgerufenen neuesten Titel passen zu ihren Originalseiten vom 15.10.2026. Dies ist keine vollständige fachliche Prüfung aller verlinkten Artikel. Der Webleser unterstützte den BFW-RSS-Medientyp nicht; der direkte Adapterabruf war erfolgreich.

## Abruf- und Fehlergrenzen

- Die Anzeige trennt Veröffentlichungsdatum, letzten erfolgreichen Quellenabruf und Zusammenstellung der Übersicht. Ein Fallback behält seinen tatsächlichen früheren Abrufzeitpunkt.
- Im sichtbaren Browser wird planmäßig alle 30 Minuten erneut abgerufen; versteckte Tabs lösen keine automatischen Abrufe aus. Es handelt sich nicht um eine ständige Hintergrundüberwachung außerhalb einer geöffneten Seite.
- Der Server benutzt je 30-Minuten-Zeitfenster einen neuen Cache-Schlüssel. Einzelne Quellanfragen haben sechs Sekunden Zeitlimit und eine Größenbegrenzung. Die öffentliche API darf zusätzlich bis zu 60 Sekunden am gemeinsamen Auslieferungscache liegen. Die Browseranfrage hat 15 Sekunden Zeitlimit.
- Der Quellenstatus berücksichtigt gespeicherte Antworten und kennzeichnet erfolgreiche Abrufstände nach mehr als 60 Minuten als veraltet. Eine aktuelle Zusammenstellungszeit ist kein aktueller Quellenabruf.
- Bei einem Browser-Abruffehler bleiben vorhandene Meldungen erhalten. Herstellerangaben werden als Herstellermeldungen gekennzeichnet; es werden keine Feedbilder oder Artikelvolltexte übernommen.

## Kleine umgesetzte Verbesserung

Die vollständige News-Seite wartete bei einer gerade neu zusammengestellten Übersicht auch dann auf den normalen nächsten 30-Minuten-Termin, wenn darin alte gespeicherte oder nicht verfügbare Quellen steckten. `useJagdNews` versucht nun bei `fallback`, `stale`, `unavailable` oder `refreshPending` nach einer Sekunde einen Abruf. War die Seite dabei versteckt, erfolgt dieser Versuch beim Zurückkehren. Gleichzeitig laufende Versuche werden zusammengefasst. Frische erfolgreiche Antworten behalten das normale Intervall und lösen nicht bei jeder Rückkehr einen weiteren Abruf aus.

Ein zusätzlicher Lifecycle-Regressionstest prüft diese Fälle einschließlich verstecktem Tab, gemeinsamer laufender Anfrage und erfolgreicher Erholung. **Alle elf Tests in `scripts/test-news.cjs` bestanden.** Keine Feed- oder Themenauswahl, Authentifizierung oder Fachangabe geändert.

## Videos: separater rein lesender Befund

Der parallele Audit von `hunting-dog-video-lessons` / `wildlife-video-cases` und beiden Playern fand neun vorhandene lokale Videos samt lokalen Postern und Textspuren, ohne fehlende referenzierte Assets. Die Player verwenden `controls`, `playsInline` und `preload="none"`; kein Autoplay, kein automatischer `.play()`-Aufruf und keine externen Videoframes beim Seitenaufruf. Externe Quellen- und Lizenzseiten werden aktiv angeklickt. Für die lokale Videowiedergabe wird daher kein externer Anbieter ohne Entscheidung geladen. Angaben trennen das tatsächliche Motiv und den Quellenkontext; die erwähnten Nicht-DACH-Aufnahmeorte werden nicht umgedeutet. Heute wurde kein erneutes visuelles Einzelbildaudit behauptet. Die separate externe Sketchfab-Ansicht bleibt ausdrücklich freizuschalten und ist kein Video.

## Zweiter enger Aktualitätspunkt, ebenfalls behoben

Bei HTML-Quellen ohne Uhrzeit setzt der Adapter intern 12:00 UTC für das sichtbare Kalenderdatum. Zusammen mit der bisherigen Zeitpunktprüfung auf Zukunft wurden bereits erschienene Meldungen des heutigen Tages am Vormittag bis 12:00 UTC ausgefiltert. Das betraf die Tagesschreibweise bei Vetmed beziehungsweise SWAROVSKI.

Taggenaue Angaben tragen nun ausdrücklich `publishedDate` im Format YYYY-MM-DD. `lib/news-publication-date.js` prüft diese gegen den tatsächlichen Kalendertag in Europe/Zurich, einschließlich Sommer-/Winterzeit. Der weiterhin vorhandene interne Mittagwert dient nur der bisherigen Datumsdarstellung/Sortierung und ist keine beobachtete Veröffentlichungsuhrzeit. Echte Zeitstempel behalten den Zeitpunktvergleich bis auf die Sekunde. Zukünftige Kalendertage, unmögliche Daten und widersprüchliche Präzisionsfelder werden ausgeschlossen. Dieselbe Funktion prüft Live- und gespeicherte Einträge bei der Serverzusammenstellung. Vorhandene Altdaten ohne Präzisionsfeld werden konservativ als Zeitstempel behandelt; ein alter Mittagwert wird nicht nachträglich erraten oder umgedeutet. Der Servercache hat für das ergänzte Datumsformat eine neue Version.

Die Übersicht erhält `latestPublishedDate`, die Quellenmetadaten `lastPublishedDate`, damit auch maschinenlesbare Datumsangaben die ursprüngliche Präzision verwenden können. Der anschließende Root-Review hat die HTML-`time`-Attribute in Meldung, Übersichtsstand und Quellenstand auf das jeweilige Tagesdatum umgestellt, sofern es vorliegt. Ein zusätzlicher Rendering-Test prüft diesen Fall und die weiterhin unveränderte Ausgabe echter Zeitstempel.

Zusätzliche Regressionen prüfen Morgenanzeige, ISO- und deutsche Tagesdaten, Herstellerkarten, echte zukünftige Zeitpunkte, ungültige Tage, DACH-Mitternacht im Sommer/Winter und an Zeitumstellungstagen sowie die unveränderte Präzision im gespeicherten Fallback. **30 Tests aus `scripts/test-news.cjs` und `scripts/test-navigation-news-growth.cjs` bestanden.** Kein Build, Commit oder Push ausgeführt.
