# Kurze Wiederholungsrunde: Mischung und lokaler Verlauf

Prüfdatum: 18. Oktober 2026. Dieser technische Bericht ist kein neuer fachlicher Prüfvermerk für bereits vorhandene Wissensinhalte.

## Reproduzierter Ausgangsbefund

Der veröffentlichte Algorithmus aus Commit `f363eba83cb732797fdf052d7160dd0007ceadc7` ordnete neue Fragen nach einem einfachen täglichen Hash ihrer Kennung. Wegen gemeinsamer langer Kurspräfixe und ähnlicher Frage-Endungen konnten mehrere Fragen desselben Kurses unmittelbar hintereinander stehen. Mit dem damaligen Bestand von 162 Kursen und 2.355 zulässigen Wiederholungsfragen sowie leerem synthetischem Verlauf wurden für den 18. Oktober alle acht neuen Fragen aus einem einzigen Hundesinne-Kurs ausgewählt. Das war eine technische Sortierungseigenschaft und keine Aussage über tatsächliche Lernende.

## Geändertes Verhalten

Ein täglicher Mischschlüssel verteilt ähnliche Kennungen besser. Unter den neuen Fragen werden verfügbare Kategorien zunächst reihum berücksichtigt, bevor eine Kategorie eine weitere Frage erhält. Bei ausdrücklich ausgewähltem Bereich bleibt die Auswahl vollständig darin. Fragen aus mehreren Kursen innerhalb dieses Bereichs werden durch den neuen ID-Schlüssel gemischt, ohne eine bestimmte Kurszahl für jede denkbare Auswahl zu versprechen.

Fällige Fehler behalten Vorrang vor sonstigen fälligen Wiederholungen. Innerhalb dieser beiden Gruppen bleibt die bestehende Fälligkeitsreihenfolge erhalten. Neue Fragen folgen danach; vorzeitig erneut angebotene, noch nicht fällige Fragen kommen zuletzt. Die Mischung darf einen fälligen Fehler nicht verdrängen. Bei wenigen noch neuen Kategorien kann auch die neue Auswahl nicht acht verschiedene Bereiche liefern. Das ist keine Garantie eines bestimmten Lernerfolgs und verändert nicht die bestehenden Wiederholungsabstände.

In gemischten Runden steht der vorhandene Kategoriename direkt an der Frage. Die Bedienung erhält keine weitere Schaltfläche. Antwortauswertung, genaue Lektionsverweise, unmittelbar sichtbarer Wissensabsatz nach der Antwort und freiwilliger Quellenbereich bleiben erhalten.

## Größerer, weiterhin begrenzter lokaler Verlauf

Der Verlauf darf nun bis zu 5.000 statt 1.000 Fragenkennungen innerhalb einer zusätzlichen Grenze von 1.750.000 JSON-Zeichen enthalten. Alte Datensätze im bisherigen Format bleiben gültig. Bei Überschreiten einer Grenze werden die ältesten Einträge verworfen; eine gerade gespeicherte Antwort bleibt auch bei gleichem Zeitstempel zuerst erhalten. Auch lange, noch gültige Kennungen und Ereignistoken dürfen keinen eigenen Datensatz erzeugen, den der nächste Lesevorgang anschließend vollständig verwirft. Der große Verlauf ersetzt keine frühere bereits erfolgte Löschung und kann verloren gegangene Daten nicht wiederherstellen.

Gespeichert werden dieselben lokalen Kennungen, Zähler und Zeitangaben wie vorher, keine gewählten Antworttexte und keine E-Mail-Adresse. Es gibt keinen neuen Empfänger und keine Übertragung des Verlaufs. Die vorhandenen Löschwege bei Logout/Kontolöschung bleiben unverändert. Bei verweigertem oder vollem Gerätespeicher bleibt Üben möglich und die vorhandene Hinweismeldung erscheint. Eine verfügbare Browser-Speicherquote wird nicht garantiert.

## Technische Nachweise

Die gezielten Prüfungen umfassen gleiche Auswahl bei gleichem Tag/Verlauf, unveränderte Eingaben, korrekt gefilterte Kategorien, sparse Gruppen ohne doppelte Kennungen, Fälligkeitsvorrang, Abwärtskompatibilität, 5.000 Einträge, Zeichengrenze bei langen IDs/Ereignissen und gleichzeitige Zeitstempel. Der reale Fragenkatalog wird mit leerem synthetischem Verlauf über 30 Tage geprüft. Es werden keine Nutzungsanalysen oder Erfolgsquoten erfunden.

Die bestehenden asynchronen UI-Prüfungen zu Zugriffsschutz, Ladefehlern, schnellen Themenwechseln, späten Antworten, Unmount, Doppelantwort und sichtbarem Wissensabschnitt bestehen fort. Statische Metadaten enthalten weiterhin ausschließlich Kennungen/Kategorien; höchstens acht Frage-IDs werden zum geschützten Laden übertragen. Der Kategorienname wird in der tatsächlichen gerenderten Fragenorientierung geprüft. Vor Veröffentlichung werden neue Kurse, gesamter Build, Bildschirmdarstellung und Live-Bedienung zusätzlich separat geprüft.

## Fachlicher und technischer Abschluss dieser Ausbaurunde

Die sechs neuen Kurse zu Säugerfortpflanzung, Leber/Galle, Laubmoosen, Farnen, Schall und Luftfeuchte/Taupunkt enthalten 24 Lektionen und 96 eigene erklärte Fragen. Der vorhandene unverändert konservative Kartenadapter erzeugt daraus 96 eigenständig verwendbare Lernkarten. Eine Frage nach gleichzeitigen unabhängigen Schallquellen wurde gleichwertig positiv als „unkorreliert“ formuliert; die Bedingungen gleicher Messgröße, Frequenzbewertung und Zeitbezug bleiben erhalten. Der Adapter wurde für diese Frage nicht gelockert.

Die drei Autorenpakete wurden unabhängig im Kreis geprüft: Biologie durch den Praxisautor, Habitat durch den Biologieautor, Praxis durch den Habitatautor. Sämtliche neuen Lektionen und 96 richtigen Antworten samt Erklärungen wurden gelesen und mit passenden Originalbelegen abgeglichen. Ein genauerer zweiter Originalbeleg für die Leq-Definition wurde ergänzt und der Herausgeber eines amtlichen Bayern-PDF berichtigt; fachliche Texte und richtige Antworten mussten dafür nicht geändert werden. Autorenberichte benennen Quellenfamilien, eingeschränkte Indexzugänge und Modellgrenzen. Kein verbleibender konkreter fachlicher Blocker dieser Runde wurde gemeldet. Daraus folgt keine Zertifizierung des gesamten Altbestands oder eine garantierte Prüfungsabdeckung.

Die neue Auswahl- und Verlaufslogik erhielt außerdem einen unabhängigen lesenden Codecheck ohne konkreten Korrektheits- oder Regressionsbefund. 150 gezielte Integrations-/Regressionstests bestanden; nach den abschließenden rein bibliografischen Evidence-Präzisierungen werden die betroffenen Integrationstests nochmals ausgeführt. Produktionsbuild, Bildschirmkontrolle und Live-Veröffentlichungsnachweis werden im Auslieferungsprotokoll des Arbeitsbereichs festgehalten.

Tatsächlicher Katalog: 168 Kurse, 740 Lektionen, 2.590 Kursfragen und 1.603 Lernkarten. Der gemeinsame Quizpool umfasst 2.821 Fragen einschließlich der Kursfragen; diese Zahlen sind nicht zu addieren. Dies sind gegenüber dem vorherigen veröffentlichten Stand sechs Kurse, 24 Lektionen, 96 Fragen und 96 daraus verwendbare Karten zusätzlich. Im synthetischen 30-Tage-Vergleich beider Algorithmen auf demselben aktuellen Bestand von 2.451 zulässigen Wiederholungsfragen lieferten leere gemischte Runden jeweils acht Kategorien; der gewählte Wildkunde-Bereich lieferte fünf bis acht Kurse. Dieser technische Reproduktionstest ist keine Nutzungsstatistik und kein Lernwirksamkeitsnachweis. Das langfristige Größenziel gegenüber Waidwissen bleibt offen.

Nach den letzten bibliografischen Präzisierungen bestanden alle vier neuen Kurs-Integrationstests erneut. Die tatsächliche Wiederholungsansicht wurde mit dem erzeugten Produktions-CSS und kontrolliertem lokalem Antwortzustand bei 320, 360, 390, 620 und 1.100 Pixeln geprüft: kein horizontaler Überlauf, auch der lange Kategoriename „Landwirtschaft & Lebensräume“ bleibt sichtbar, Antwortfelder passen sich mehrzeilig an. Die Themenauswahl ist 52 Pixel, die Weiter-Bedienung mindestens 54 Pixel hoch. Die neue Themenzeile verwendet 14 Pixel und größere Zeilenhöhe; eine zusätzliche Steuerung wurde nicht eingeführt. Sichtprüfung und Messung sind keine Geräteprüfung jeder einzelnen iOS-/Android-Version. Live-Prüfung erfolgt zusätzlich an der veröffentlichten Fassung.
