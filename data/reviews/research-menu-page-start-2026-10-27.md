# Technische Menü- und Positionsprüfung am 27. Oktober 2026

Geprüfter Umfang: `ResearchUnderstanding`, `ResearchForPractice`, `SmallRevierLife`, `WildDetailAtlas`, `HuntingDogVideos` und `TopicSectionReader`. Keine fachliche Neuprüfung oder Änderung von Lehrtexten, Messreihen, Medien, Quellen, Fragen oder fachlichen Prüfdaten.

## Umsetzung

- Die bisherigen Themenauswahlen im vorhandenen unteren `PageMenu` verwenden ausdrücklich `MenuChoice`. Es gibt dafür keine native Auswahlliste und kein zusätzliches Fenster. Beschriftungen sind kurze Stichworte. Die Eigentümer der jeweiligen Auswahl prüfen weiterhin gültige IDs und behalten ihre Navigation mit `push`, alte Zieladressen und Fehlerbehandlung.
- Die nach tatsächlicher Auswahlübernahme ausgelöste Positionierung verwendet `useSelectionPageStart`. Eine Kategorie beginnt am Seitenanfang. Eine weitere Auswahl und das Entfernen der Ansicht entwerten einen noch ausstehenden letzten Positionsschritt.
- Direkte Forschungsfragen und bestehende Abschnittsziele sowie der Handlungstext der Hundevideos behalten ihre genauen Ziele. Eine neue Kategorie im Menü beginnt dagegen oben. Ein fremdes ausdrückliches Fragment wird nicht durch ein vermutetes Seitenanfangsziel ersetzt.
- Im Nahrungsnetz sind Menüauswahl und Modellbedienung getrennt: Ein Motiv aus dem Menü beginnt oben; die Bildradios am Modell führen nach wirklicher URL-Übernahme weiterhin zu dessen Beziehungen. Die bisherige Adresse mit `#revierleben-inhalt`, die Modellidentität und der bestehende Fragenzustand bleiben erhalten.
- `TopicSectionReader` erhält native Fragmentlinks, Aliase und Browser-Verlauf. Erkannte Themen beginnen oben; ein Gruppenwechsel setzt ausschließlich das Scrollfeld des bestehenden Menüs zurück. Ein fremdes Fragment löst keinen solchen Positionsreset aus.
- Der vollständige URL-Kontext entwertet alte Handler und Positionsaufträge. Reine Such-/Kontextänderungen verschieben den unveränderten Text nicht. Bei Hundevideos bleiben das gezielte Pausieren des alten Players und die bestehenden Lebenszeitgrenzen der Fragen erhalten.
- Lokale Diagrammfilter, Bildmerkmale und Übungen wurden nicht zu Navigationsschaltflächen umgebaut.

## Nachweis

121 unterschiedliche Tests in 14 gezielt betroffenen Testdateien bestanden, keine übersprungen. Dazu gehören die unveränderten Frageauswertungen und Medien-/Quelleneigenschaften. Fünf neue Tests führen die wirklichen Auswahlbesitzer, die wirkliche `MenuChoice`-Darstellung und den wirklichen Positions-Hook gemeinsam aus. Sie prüfen Schaltflächen, Pending-/Commit-Grenze, letzten Animationsschritt, direkte Ziele, Nahrungsnetzmodell, unveränderten Suchkontext, fremde Fragmente, alte Handler und Unmount. Eine weitere echte Fragment-Lebenszyklusprüfung testet Themen-/Gruppen-/Alias-/Zurückwechsel sowie das getrennte Menüscrollfeld.

Ältere Auswahltests wurden nur an den neuen Darstellungsbaustein beziehungsweise den gewünschten Seitenanfang angepasst; Quellen-, Lehrtext-, Fragen-, History-, Fehler- und Lebenszeitprüfungen bleiben bestehen. Ausführungsprotokoll außerhalb des Repositories: `work/research-selection-group-tests.txt` im Chat-Arbeitsordner.

Dies sind isolierte Komponentenprüfungen mit Browser-/Medien-Doubles. Daraus wird keine visuelle Geräteprüfung oder erfolgreiche Produktionsauslieferung abgeleitet; Build, unabhängige Gegenprüfung und tatsächliche Auslieferung prüft die Veröffentlichung separat.

## Unabhängige Gegenprüfung des Kursmenüs

Zusätzlich wurden vier echte Hook-/URL-Lebenszyklusfälle für `LearningCourse` ergänzt: ausstehende, abgelehnte und fehlgeschlagene Auswahl ohne vorzeitigen Textwechsel; tatsächliche Übernahme mit Seitenanfang, erneute aktuelle Wahl ohne weiteren URL-Schritt sowie direkte Quellen-/Quizziele; alte Handler und späte Fehler nach Unmount; schließlich eine externe Quellenbewegung während einer ausstehenden Auswahl mit späterem direkten Lektionslink.

Der letzte Fall fand einen echten Fehler: Die alte Menüabsicht blieb nach dem externen Quellenwechsel erhalten und machte den späteren direkten Lektionslink fälschlich zum Seitenanfang. Der zuständige Implementierer hat die Absicht an Index und konkrete Zieladresse gebunden; `readLesson` verwirft sie bei einer anderen tatsächlichen Adresse. Die Gegenprüfung hat den korrigierten Stand erneut ausgeführt: alle vier Kursfälle bestanden. Zusammen mit der oben dokumentierten Gruppe sind damit 125 unterschiedliche Tests bestanden; der abschließende unabhängige Teillauf mit Themenleser und Menü-/Positionsfällen enthält 17 bestandene Tests ohne Überspringen. Protokoll: `work/course-selection-independent-review-tests.txt` außerhalb des Repositories.
