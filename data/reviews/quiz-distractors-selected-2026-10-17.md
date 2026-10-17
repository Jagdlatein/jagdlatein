# Gezielte Verbesserung von vier bestehenden Fragen

Am 17.10.2026 wurden vier bereits veröffentlichte Fragen im Anwendungspaket erneut betrachtet. Drei falsche Optionen je Frage wurden von sachfremden Körperteilen zu verwechslungsnahen Strukturen oder Funktionen geändert. Das ergänzt den heutigen Ausbau um Pflege des Bestands; es ist keine erneute Prüfung aller 192 Fragen dieser Datei.

## Umfang und Stabilität

- `wissen-ausbau-anwendung-muskelbiologie-2026-q2`: Myofibrille gegenüber Muskelfaserbündel, motorischer Endplatte und kollagener Bündelhülle.
- `wissen-ausbau-anwendung-biologische-ebenen-2026-q4`: Zellkern gegenüber anderen Strukturen derselben Zelle. Die Frage sagt bewusst „ein großer Teil“, weil Mitochondrien eigene DNA besitzen.
- `wissen-ausbau-anwendung-biologische-ebenen-2026-q5`: Ribosom gegenüber Golgi-Apparat, Lysosom und Centrosom. Kein raues ER als falsche Option, da es durch seine Ribosomen unmittelbar an der Proteinsynthese beteiligt ist.
- `wissen-ausbau-anwendung-biologische-ebenen-2026-q6`: Mitochondrienfunktion gegenüber Exportverpackung, lysosomalem Abbau und Mikrotubuliorganisation.

Fragestamm, ursprüngliche Frage-ID, Antwort-ID, richtige Position, richtiger Antworttext und Erklärung bleiben jeweils gleich. Auch übrige Lektionen und Quellenzuordnungen wurden nicht umgeschrieben. Die alten Prüfdaten bleiben als Datum der umfassenderen Autorenprüfung erhalten. Es gibt vier bessere Auswahlaufgaben, keine vier neuen Fragen oder Lernkarten.

## Tatsächlich gelesener Quellenabgleich

| Originalquelle | Gelesener Abschnitt und konkret geprüfter Zusammenhang |
| --- | --- |
| [Texas A&M, Structure and Composition of Muscle](https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/structure-and-composition-of-muscle/) | Skeletal muscle fiber und Muscle organization: Faser, Myofibrille, Sarkomer, Endplatte und Bindegewebshüllen. Die fehlerhafte Zuordnung der T-Tubuli zum calciumfreisetzenden SR wird nicht übernommen. |
| [OpenStax, Skeletal Muscle](https://openstax.org/books/anatomy-and-physiology-2e/pages/10-2-skeletal-muscle) | Skeletal Muscle Fibers, The Sarcomere und Neuromuscular Junction: wiederkehrende Einheiten, Ebenen und Kontakt zur Nervenzelle. Unabhängiger Abgleich zu Texas A&M; keine Humanlängen, Bilder oder Buchaufgaben übernommen. |
| [NCI/SEER, Cell Structure](https://training.seer.cancer.gov/anatomy/cells_tissues_membranes/cells/structure.html) | Nucleus and Nucleolus sowie Cytoplasmic organelles: Erbinformation im Zellkern und Abgrenzung der Strukturen. Allgemeines Zellmodell, keine klinische Anwendung. |
| [OpenStax, Eukaryotic Cells](https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells) | Nucleus, Ribosomes, Mitochondria, Centrosome und Lysosomes: DNA, Proteinsynthese, ATP, Abbau und Mikrotubuliorganisation. Die pauschalen Begleitaussagen über alle Tier-/Pflanzenzellen sowie „Mitochondrien produzieren Nahrung“ werden nicht übernommen. |
| [University of Leeds, Organelles](https://histology.leeds.ac.uk/home/cell/cell_organelles/) | Haupttext Mitochondrium, rough ER, Golgi und Lysosomen: unabhängiger Abgleich der Energie-, Synthese-, Verpackungs- und Abbaufunktionen. Keine Übernahme fester Größen/pH-Werte oder der ungenauen Formulierung zur Enzymproduktion im Golgi. |

Rice/OpenStax bildet eine Quellenfamilie. NCI, Leeds und Texas A&M sind davon unabhängig. Die Quellen liefern die allgemeinen biologischen Zusammenhänge; die falschen Zuordnungen der Auswahlaufgaben sind eigene didaktische Konstruktionen. Kein fremder Aufgabentext und keine Abbildung wird übernommen. Über die vier konkreten Aufgaben hinaus wird keine heutige Vollprüfung beansprucht.

## Dateien und Prüfung

Ausgangsdatei aus Git-HEAD `7356a4268f5cc0efef5ab7dc0384c6e74a025f44`: SHA256 der Git-Bytes `0bd14b8c51844ab655ff6ffb9c2d1c6b349896d730a9e34bc335df865bf67c49`.

Geänderte lokale JSON-Datei `data/learning-expansion-applied-2026-10-16.json`: SHA256 `07719ddf18cc665371ec4f460d8e32f7e7d28b9c07404510c0d81b45d42f50c4`.

Der tatsächliche semantische Vorher-Nachher-Vergleich fand nur diese vier Optionenlisten verändert und bestätigte die unveränderten richtigen Antworten. Struktur-, Integrations- und Veröffentlichungskontrollen werden separat im heutigen Ausbaubericht dokumentiert; sie sind keine fachliche Zertifizierung.

Eine getrennte Gegenprüfung am selben End-SHA bestätigte diese zwölf geänderten falschen Optionen, die Eindeutigkeit der vier richtigen Antworten und die unveränderten Bestands-IDs. Dabei wurden die relevanten Haupttexte von Texas A&M, NCI, Leeds und OpenStax unabhängig erneut eingesehen. Es wurde kein zusätzlicher Befund in diesem engen Delta festgestellt. Diese Gegenprüfung ist keine vollständige Neuprüfung des Anwendungspakets.
