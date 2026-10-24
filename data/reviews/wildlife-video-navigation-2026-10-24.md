# Wildtier-Videofälle: Auswahl, Runde und Wiedergabe

## Enger technischer Umfang

Am 24. Oktober 2026 wurde die Auswahl der vorhandenen fünf Wildtier-Videofälle an die bereite, validierte Adresse gebunden. Ein tatsächlicher Fallwechsel schreibt einen eigenen `eintrag`-Verlaufsschritt und übernimmt weiteren Suchkontext. Erst die übernommene URL bestimmt den Film und seinen Lehrtext. Ein fehlender Parameter behält den dokumentierten ersten Einstieg; leere, unbekannte oder mehrfache Werte zeigen eine Auswahlhilfe statt eines anderen Films. Ohne bereiten Clientrouter erscheint kein fremder Standardfall.

Suche, Fallauswahl, Gesamtfortschritt, Verzeichnislink und Rundenreset liegen im vorhandenen unteren Menü. Die aktuelle Aufnahme, Textfassung, Beobachtungsgrenzen und Fragen bleiben direkt im Hauptteil. Fragewechsel und Anhalten sind lokale Modellsteuerungen und bleiben am Film. Die untere Zurück-Navigation berücksichtigt ausdrücklich nur das Feld `eintrag` dieser zusätzlichen Route; keine allgemeine Query-Regel wurde eingeführt.

## URL, Frage und Runde getrennt

`#video-fall` bleibt das Ergebnisziel. `#video-textfassung` öffnet die echte Textfassung und fokussiert sie nach Übernahme. Das alte Ziel `#video-auswahl` führt zur unteren Auswahl. Bei einem fehlgeschlagenen oder abgebrochenen Wechsel bleiben der gerade angezeigte Fall und seine laufende Frage erhalten. Erneute Wahl des bereits aktuellen Falls schreibt keinen unnötigen Verlaufsschritt und setzt die Frage nicht zurück. Eine Auswahl des aktuellen Falls während einer anderen ausstehenden Auswahl kann deren Ziel durch einen neuen gültigen Routerwechsel ablösen.

Ein echter Fallwechsel beginnt bei dessen erster Frage, erhält aber die bisher gegebenen Antworten und den Beobachtungsstatus anderer Fälle in derselben Fensterrunde. Ein reiner Kontext-/Hashwechsel beim gleichen Fall erhält auch den Frageindex. Nur der ausdrückliche Rundenreset löscht Antworten und Beobachtungsstatus. Dieser Reset bleibt beim in der URL gewählten Fall; er schaltet nicht heimlich auf Fall 1 um und schreibt selbst keine neue Adresse.

Eine getrennte Rundengrenze und synchrone Ansichtsidentitäten sichern Medien-, Textfassungs-, Frage-, Such-, Retry-, Reset- und Navigationsereignisse gegen veraltete Callbacks ab. Das schließt mehrere Ereignisse vor einem weiteren React-Render ein. Ein altes Ereignis nach einem Verlaufsschritt A–B–A darf sich nicht als aktuelles A ausgeben. Navigationsergebnisse nach Kontextwechsel, Abbruch, neuerer Auswahl oder Unmount dürfen keine nachträgliche Fehlermeldung über die aktuelle Ansicht legen.

## Medien und Lehrinhalt bewahrt

Die fünf Datensätze und alle 15 Fragen samt Antwortreihenfolge, richtigen Antworten und Erklärungen bleiben unverändert. Dasselbe gilt für Video-/Posterdateien, Urheber, Lizenzen, Herkunft, Textfassungen und Beobachtungstexte. Es gibt keine neu erzeugten Lehrbilder oder Videos und keine fachliche Umdatierung. Der bisherige Prüfstand 4. Oktober 2026 bleibt ausdrücklich bestehen.

Die Wiedergabe beginnt weiterhin bewusst durch den Nutzer, mit `controls`, `playsInline` und `preload="none"`. Alte Spieler werden beim Wechsel ihres Wiedergabeversuchs und beim Unmount angehalten; ein verspätetes Play-Ereignis eines alten Spielers stoppt diesen. Retry erneuert den Versuch sofort, bevor alte Fehler-/Zeitereignisse wieder ankommen können. Fragewechsel remounten den Spieler nicht unnötig. Der Suchkontext und die Beobachtungsrunde sind keine Berechtigung oder Ranglistenleistung; es wurden keine Konten-, Zahlungs- oder Punkteänderungen vorgenommen.

Die bereits vorhandenen Grenzen unsichtbarer Nahrung, genauer Altersjahre sowie Fortpflanzungs- und Gesundheitszustände stehen jetzt unmittelbar im Leseteil. Ergänzende Fachquellen und vollständige Mediennachweise stehen geschlossen am Ende mit unveränderter Aussagenrolle.

## Prüfung und Grenzen des Nachweises

Die vorhandenen Medien-/Fragenregressionen bleiben erhalten: sämtliche falschen und richtigen Antworten, Erklärungen, Gesamtstände, Doppel-/Stale-Ereignisse, Reset, konkrete Wiedergabeversuche, reale lokale Medien und Verzeichnisziele. Ausschließlich die alten Video-Harnesses wurden gezielt auf den echten Router und korrekte Hook-Lebenszeiten umgestellt. Eine im selben Alt-Test noch überholte Lebensraum-Erwartung wurde an dessen bereits veröffentlichten unteren Lernangebot-Selektor angepasst; kein oberes Menü und keine frühere Produktdarstellung wurde zurückgebaut.

Die zusätzliche unabhängige Navigationstestdatei prüft ausstehende und fehlerhafte Routerwechsel, Bereitschaft/History/Hash/Origin/Unmount, Inhaltserhalt, Beobachtungsrunden sowie Pause-/Fokus-/Retry-/Reset-Grenzen. Lokaler Build, technische Regressionen und öffentlich beobachtete Auslieferung sind getrennte Nachweise. Geschützte Live-Seiten leiten ohne Anmeldung regulär zur Preisseite; deren HTTP200 ist kein Nachweis sichtbaren Lehrtextes. Eine visuelle Geräteprüfung oder fachliche Gesamtprüfung der App wird nicht behauptet.

Die unabhängige Gegenprüfung ergänzte zwölf neue Navigationsregressionen und fand keinen konkreten Produktfehler. Ihr enger gemeinsamer Lauf mit Medien-, Bibliotheks- und UI-Zustandstests bestand 44 Tests. Abschließend wurden **280 unterschiedliche passende Tests** erfolgreich ausgeführt, einschließlich der gezielt ergänzten Rehwild- und NÖ-Inhalte, der bereits veröffentlichten Wildjahr-/Revierwissen-Grenzen, des Artenlesers und der unteren Navigation. Der Produktionsbuild erzeugte lokal erfolgreich **509 statische Seiten**. Die Ergebnisse und der spätere reale Auslieferungsnachweis werden getrennt im Chat-Arbeitsverzeichnis festgehalten.
