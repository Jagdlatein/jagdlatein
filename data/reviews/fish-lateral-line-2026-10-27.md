# Seitenliniensinn im vorhandenen Gewässervergleich

Inhaltlich geprüft am 27. Oktober 2026. Ein eng begrenzter Anhang im bestehenden Kurs `wissen-ausbau-oekologie-tierbewegungen-2026` in `learning-expansion-ecology-2026-10-16.json`: Lektion `seitenliniensinn`, 126 Wörter, eine eigene Verständnisfrage und eine daraus abgeleitete Lernkarte. Keine neue Kategorie, Route, Guidefläche oder Abbildung.

## Quellen und konkreter Umfang

Die relevanten Originalseiten beider Hochschulen wurden tatsächlich geöffnet und gelesen:

| Wissensblock | Eingesehene Stellen | Quellenrolle und Grenze |
| --- | --- | --- |
| Mechanischer Sinnesreiz | [University of Hawaiʻi at Mānoa, Exploring Our Fluid Earth: Structure and Function – Fish](https://www.manoa.hawaii.edu/exploringourfluidearth/biological/fish/structure-and-function-fish), Abschnitt **Lateral line**, Absatz bei Abb. 4.32; [University of Texas at Austin, Marine Science Institute: Fish Sense](https://utmsi.utexas.edu/science-and-the-sea/radio-program/fish-sense/), Damond Benningfield, 24. April 2011, Absätze zum Seitenliniensystem und den Sinneshaaren. | Zwei unabhängig verantwortete Hochschulerklärungen des gleichen Grundprinzips; keine zwei experimentellen Replikationen. |
| Funktionskontext | UHM: beide Textabsätze des Abschnitts **Lateral line** bei Abb. 4.31–4.32; UTMSI: Schlussabsatz zur Beute-/Räuber-/Schwarmfunktion, vor dem gesonderten Hai-/Rochenabsatz. | Allgemeiner biologischer Zusammenhang; keine Leistungswerte einzelner heimischer Arten. |

Gelesen wurden bei UHM die beiden Textabsätze im Abschnitt **Lateral line** und bei UTMSI die Absätze zur Seitenlinie, den Sinneshaaren und zur Beute-/Räuber-/Schwarmfunktion vor dem gesonderten Hai-/Rochenabsatz. Die Evidenz enthält zwei getrennte Claims mit beiden Quellen und genauen Lesestellen. Neue Quellenobjekte tragen `checkedOn: 2026-10-27` und ausschließlich `lessonIds: ["seitenliniensinn"]`.

Bewusst nicht übernommen: umliegende UHM-Aussagen über Augen oder Chemosinn, UTMSI-Darstellungen von Reflexwellen und Haiherz-/Elektrorezeption, Frequenz- oder Reichweitenangaben, einzelne DACH-Artenleistungen, Fang- oder Behandlungspraxis. Die sichtbare Einschränkung steht unmittelbar im Lerntext. Die kurze begriffliche Abgrenzung verweist auf die unveränderte vorherige Lektion `fischwege`; das eigene Zwei-Skizzen-Beispiel ist eine Lernhilfe, kein Messversuch oder Wirksamkeitsnachweis für ein Querbauwerk. Der bestehende Begriff der lateralen Vernetzung wurde ergänzend im [BfN-Originalabschnitt Laterale Vernetzung](https://www.bfn.de/oekologische-durchgaengigkeit) nachgelesen.

## Erhaltener Bestand und Datumsrollen

Vergleichsbasis ist `6d85030`. Die vier vollständigen alten Lektionen, alle 32 alten Fragen mit ihren Antwortoptionen und ihrer Reihenfolge, alle elf alten Quellenobjekte und deren Evidenz sowie alle anderen Kursfelder bleiben exakt erhalten. Der Kurs und die Datei behalten den 16. Oktober 2026; ausschließlich die neue Lektion erhält den tatsächlich geprüften 27. Oktober. Der Anhang wird hinten eingefügt und verändert keine alten Fragenrotationen.

Der positive Vollobjektvergleich bewahrt alle 198 bisherigen Kursobjekte und alle 1721 bisherigen Karten in Reihenfolge, einschließlich der 116 Starterobjekte. Das neue Kartenobjekt übernimmt exakt Frage, korrekte Antwort, Erklärung, Lektionsdatum, zwei passende Quellen und `/kurse/wissen-ausbau-oekologie-tierbewegungen-2026#lesson-seitenliniensinn`. Alte Lektionen/Karten erhalten keine neuen Quellen. Die fremde Afternoon-Datei bleibt unberührt.

## Technische Prüfung

`scripts/test-fish-lateral-line-learning.cjs`: sieben gezielte Regressionen zu vollständigem Altbestand, genauem Ergänzungsumfang, Frage/Karte, Länder-Quizpools, bestehendem Themenzweig/Suche/SSG, vollständigem Offlinepaket und tatsächlichem Kursrenderer mit zuerst sichtbarem Lerntext und geschlossenem Quellenbereich am Ende. Der Offlinezugang wird durch die Ergänzung nicht verlängert.

Der erste passende Querlauf belegte elf historische Snapshot-/Zählungsabweichungen. Acht ältere Testdateien wurden eng angepasst: Science prüft genau die eine neue Frage/Datumsausnahme zusätzlich; sieben historische Vollobjektprüfungen verwenden eine ausdrücklich benannte Projektion, die ausschließlich den exakten neuen Kurs-/Lektions-/Frageanhang, seine beiden Quellen und seine Evidenz entfernt. Alle bisherigen Goldens und Reihenfolgevergleiche bleiben erhalten. Die neue unabhängige Ergänzungsprüfung verwendet den echten vollständigen Datensatz.

Finaler passender Lauf: 68 unterschiedliche Tests in zehn Dateien bestanden, keine übersprungen. Rohprotokolle außerhalb des Repos: `work/regional-law-qa/fish-lateral-line-initial.txt` und `fish-lateral-line-final.txt` im Chat-Workspace. Der unabhängige Fachprüfer hat beide konkreten Quellenabschnitte selbst gelesen, den vollständigen Erhalt gegen tatsächlich aus Git geladenes `6d85030` geprüft und die sieben Ergänzungsfälle erneut bestanden; Nachweis: `work/regional-law-qa/fish-lateral-line-independent.cjs`. Keine UI-, Medien-, Authentifizierungs- oder Speicherschemaänderung; kein Produktionsbuild durch den Inhaltsautor. Die tatsächliche Auslieferungsprüfung erfolgt getrennt. Diese einzelne Ergänzung ist keine fachliche Gesamtzertifizierung des Curriculums.
