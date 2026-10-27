# Lokale Löschgrenzen der kurzen Wissensrunde

Technische Prüfung vom 27. Oktober 2026. Keine neuen Lernfakten, Prüfdatumsänderungen, Speicherschemata oder Kontorechte. Sämtliche Proben verwenden isolierte Speicher-, Ereignis- und Netzwerkdoubles; keine echten Browserdaten, Konten oder privaten Dateien wurden gelesen oder gelöscht.

## Reproduzierte Grenzen und eng begrenzte Änderungen

`clearOfflineLearning` versuchte bisher erst die eigene IndexedDB-Datenbank und danach den eigenen Mediencache zu leeren. Bei einer fehlgeschlagenen Datenbankoperation wurde der unabhängig löschbare Cache nicht mehr versucht. Beide Löschversuche werden nun unabhängig ausgeführt; danach wird ein aufgetretener Fehler weiterhin an den Aufrufer gemeldet. Die vorhandenen Warnungen bei einer unvollständigen Löschung bleiben wirksam. Es werden ausschließlich `jagdlatein-lernrucksack`/`packs` und `jagdlatein-rucksack-v1` angesprochen. Fremde Caches werden nicht aufgezählt oder gelöscht. Eine dauerhaft nicht beantwortete Speicheranfrage erhält durch diese Änderung keine neue Zeitgrenze.

Eine bereits geöffnete `DailyReview`-Runde konnte nach entferntem Wiederholungsverlauf weiterbewertet werden und damit erneut einen Verlaufseintrag anlegen. Ein empfangenes `storage`-Ereignis mit entferntem `REVIEW_STORAGE_KEY` oder `localStorage.clear`, sowie das bestehende Ereignis `jagdlatein-account-deleted`, entwerten nun synchron die lokale Requestgeneration und die temporäre Runde. Alte Ladungen werden abgebrochen, alte Antwort-/Weiter-/Neustarthandler blockiert und die Fehlernachlese entfernt. Die betroffene Runde wird nicht automatisch neu geladen. Eine verständliche leere Ansicht bietet den ausdrücklichen Start einer neuen kurzen Runde an.

Normale Verlaufsschreibvorgänge aus einem anderen Tab, andere Schlüssel und ausdrücklich erkennbare Session-Storage-Ereignisse stören die aktuelle Runde nicht. Beim Unmount werden die Listener entfernt. Der vorhandene eigene Knopf „Wiederholungsverlauf entfernen“ darf weiterhin ausdrücklich eine neue Runde starten. Tatsächlich geladene Fragen gehen unverändert über die zugangsgeschützte API. Bei leerem Fällig-/Fehlerpool gibt es keine IDs, keine Ersatzfragen und keinen unnötigen API-Aufruf.

Die Reaktion gilt für tatsächlich empfangene Ereignisse. Browser senden das native `storage`-Ereignis an andere Dokumente, nicht an das schreibende Dokument; ein erfolgloses Entfernen oder ein bereits fehlender Schlüssel ist kein verlässliches dokumentübergreifendes Löschsignal. Die Änderung führt keinen neuen Kontowechsel-Broadcast oder eine allgemeine Kontosynchronisierung ein. Sie behauptet auch keine erfolgreiche Speicherlöschung, wenn nur das Kontolöschereignis empfangen wurde.

## Nachweise

`scripts/test-local-learning-cleanup.cjs` enthält elf echte React-/DOM- und isolierte Speicherregressionen:

- Entfernen des Verlaufsschlüssels, vollständiges Local-Storage-Löschereignis und Kontolöschereignis sperren einen alten Antwortcallback noch vor Reacts Neuzeichnung.
- Späte erfolgreiche Ladungen können eine entwertete Runde nicht wieder öffnen; Abbruchsignal und fehlendes automatisches Nachladen werden konkret geprüft.
- Ein ausdrücklicher Neustart lädt über dieselbe authentifizierte API; HTTP 401 zeigt den bestehenden Anmeldelink und speichert keine Antwort.
- Normale Updates, fremde Schlüssel und Session Storage erhalten die Runde. Antwortschreiben behält das bestehende Schema.
- Entfernte Fehlernachlese, gesperrte alte Weiter-/Neustarthandler und Listenerabbau nach echtem Unmount sind geprüft.
- Der vorhandene eigene Löschknopf startet genau eine neue Runde und bewahrt fremde lokale Einträge.
- Alle vier Kombinationen aus erfolgreicher/fehlgeschlagener Datenbank- und Cachelöschung prüfen beide Versuche und die ehrliche Fehlerweitergabe. Fremde Caches bleiben erhalten.

Zusammen mit bestehenden Loading-, Navigation-, Abschluss- und Logoutprüfungen: 58 unterschiedliche Tests bestanden, keine übersprungen. Der Testlauf liegt außerhalb des Repos in `work/regional-law-qa/local-learning-cleanup-final.txt` des Chat-Workspaces. Frühere rein lesende Reproduktion: `local-learning-boundaries-independent.cjs`/`.json` im selben Ordner. Ein Produktionsbuild und die tatsächliche Auslieferungsprüfung erfolgen getrennt durch den Release-Verantwortlichen.

Eine unabhängige Gegenprüfung bestätigte die Fehlerpfade und tatsächlichen Browserereignis-/Requestgrenzen mit eigenen isolierten Proben. Der Hauptagent las die Produktänderungen separat und präzisierte den Hinweis, damit er bei einem Kontolöschereignis keine erfolgreiche lokale Löschung behauptet. Der abschließende gemeinsame Lauf mit Academy-, Wiederholungs-, Logout-, Offline- und Lernkartengrenzen besteht mit **170 unterschiedlichen Fällen, null übersprungen**; der Produktionsbuild mit **509 Seiten** ist erfolgreich. Die anschließende Auslieferung wird separat nachgewiesen.

## Bewahrter Umfang

Keine Änderungen an Authentifizierung oder API, Frageauswahl, Antwortrotation, Einmalwertung, Wiederholungsintervallen oder dauerhaftem Verlaufsschema. Gewählte Antwort-IDs der Abschlussnachlese bleiben ausschließlich im Arbeitsspeicher der aktuellen Runde. Journal, Foto-Tagebuch, lokale Lernkartenbewertungen, Exportdateien und andere Konten/Browser werden nicht gelöscht. Diese gezielte Prüfung ist keine vollständige Datenschutz- oder Sicherheitszertifizierung der App.
