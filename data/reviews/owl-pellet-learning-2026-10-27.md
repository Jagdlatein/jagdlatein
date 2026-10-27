# Gewölle im vorhandenen Verdauungsvergleich

Inhaltliche Prüfung vom 27. Oktober 2026. Der vorhandene Kurs `wissen-ausbau-biologie-verdauungsvergleich-2026` erhält hinten eine Lektion `gewoelle` mit 127 Wörtern, zwei eigenen Verständnisfragen und zwei daraus abgeleiteten Karten. Keine neue Kategorie, Route, Fotografie oder Artenporträtzuordnung.

## Bestand und genaue Lücke

Die vorhandene Lektion `vogelmagen` erklärt Drüsen-/Muskelmagen, Säure und Enzymvorstufen, Steinchen, variable Kropfausbildung und Kloake bereits mit acht Fragen. Dieser Block wird nicht wiederholt oder umgeschrieben. Auch die neue Kropfmilch-Lektion bleibt vollständig erhalten. Die Suche über Biologie-/Federwildkurse, Glossar und Artenwissen nach Gewölle/Gewoelle, Speiballen, Pellet und verschiedenen Formen von „ausgewürgt“ ergab dagegen keine vorhandene vollständige Lesestelle dieses Zusammenhangs.

## Tatsächlich gelesene Quellen und Zuordnung

| Konkreter Wissensblock | Originallektüre und voneinander unabhängige Quellen |
| --- | --- |
| Bildungsort und Materialbeispiele im Eulenbeispiel | [Cornell Lab of Ornithology: Owl Pellet Teaching Tips](https://www.birds.cornell.edu/k12/pellet-teaching-tips/), Sachabsatz direkt nach dem Barn-Owl-Bild; [Loyola University New Orleans: Owl Pellets](https://lucec.loyno.edu/natural-history-writings/owl-pellets), Bob Thomas, 7. April 2008, erster Sachabsatz. |
| Abgabeweg und Abgrenzung zum Kot | Derselbe Cornell-Absatz; [Natural History Museum London: Do birds pee?](https://www.nhm.ac.uk/discover/do-birds-pee.html), Emily Osterloff, ausschließlich der Abschnitt **What is an owl pellet?**. |
| Weitere Vogelgruppen, keine Universalregel | Loyola, letzter Sachabsatz; derselbe NHM-Gewölleabschnitt. |

Die drei Originalseiten wurden tatsächlich geöffnet und die genannten Absätze selbst gelesen. Die Quellen sind institutionelle Fachvermittlung, keine drei unabhängigen Experimente oder neuen DACH-Messreihen. Drei Claims dokumentieren jeweils zwei konkret passende Quellen. Die neuen Quellenobjekte sind ausschließlich `gewoelle` zugeordnet; nur sie tragen das tatsächliche neue Abrufprüfdatum.

Bewusst ausgelassen: Zahlen zu Zeit, Größe, Häufigkeit oder Beutezahl; pauschale Ganzschluck- und Allknochenbehauptungen; Säureleistungsvergleiche; Aussagen über eine sichere Artzuordnung allein nach Form/Farbe; Sammel-, Berührungs-, Präparations- oder Hygieneverfahren. Die Quellen nennen teils unterschiedliche allgemeine Häufigkeiten; daraus wird keine Tagesregel gebildet. Benachbarte NHM-Ausscheidungsaussagen werden nicht übernommen. Die Grenze „Ein Fundbild allein liefert hier keinen sicheren Artbeweis“ bleibt im Lerntext sichtbar und negiert keine fachliche Bestimmung mit zusätzlichen Merkmalen.

## Positiver Bestandsschutz

Basis: `a0a656337754af0bb22710aa6a9836bb53f9cb61`. Alle fünf vorherigen Lektionen, 34 Fragen, 15 vollständigen Quellenobjekte, alte Evidenz und sämtliche übrigen Kursfelder bleiben exakt erhalten. Der Kurs und die Datei behalten den 16. Oktober; Kropfmilch behält ihren schon vorhandenen 27. Oktober. Nur die angehängte neue Lektion erhält den tatsächlichen neuen Lektionsprüfstand.

Der Test vergleicht alle 198 alten vollständigen Kursobjekte und alle 1722 vorherigen Karten samt Reihenfolge und 116 Starterobjekten. Neben dem eigenen exakten Anhang isoliert er ausschließlich die parallel autorisierte Zündungsarten-Lektion des anderen Autors: konkrete Kurs-/Lektions-/Fragekennung und vier konkrete Quellen-URLs. Kein ganzer Kurs wird ausgenommen. Die fremde Afternoon-Datei bleibt bytegenau unverändert.

## Prüfung und Integration

Sieben gezielte Fälle in `scripts/test-owl-pellet-learning.cjs` bestanden: vollständiger Roh-/Kurs-/Kartenaltbestand, genauer Ergänzungsumfang, zwei unterschiedliche Fragefunktionen, bestehende Länder-Quizpools, Suche und SSG, vollständiges Offlinepaket mit unveränderter Ablaufgrenze sowie tatsächlicher Kursrenderer. Die neuen Lerntexte stehen vor dem geschlossenen Quellenbereich am Ende; das Lektionsdatum wird dort korrekt verwendet. Die Karten führen exakt zu `#lesson-gewoelle` im vorhandenen Kurs. Die gesonderte Pflege historischer Vergleichstests ist nachfolgend dokumentiert.

## Eng begrenzte historische Regressionen

Ein tatsächlicher Lauf der zehn historischen Vergleichsdateien belegte zunächst 18 Abweichungen unter 70 Fällen. Betroffen waren alte Vollobjekt-/Kartenvergleiche, ein historischer letzter-Lektions-/Quellen-Fixture und das explizite Science-Inventar. Es gab keine Änderung der alten Lernobjekte.

Der benannte Helper `digestiveIgnitionBaselineFixture(overrides)` in `scripts/helpers/digestive-ignition-additions-oct27.cjs` projiziert ausschließlich die beiden autorisierten Anhänge heraus. Er nutzt die exakte Kurs-/Lektions-/Fragekennung, drei beziehungsweise vier konkret benannte Quellen-URLs und den passenden Evidenzeintrag. Auch vorhandene eng begrenzte Caller-Fixtures bleiben erhalten. `stripGewoelleDataset` und `stripIgnitionDataset` ermöglichen dieselbe exakte Rohdatenprojektion. Kein ganzer Kurs, unbekanntes Feld oder pauschaler Datumsbereich wird entfernt.

Diese Projektion wurde in den nachgewiesen betroffenen historischen Tests für Kropfmilch, Seitenlinie, Biber-Mundhautfalte, Rassenrücklinks, Hundeschlaf, Enten-Gegenstrom, Federwachstum, Feder-Wasserschutz und Holzgefäßmuster verwendet. Alle alten Hash-Goldens, vollständigen Objektprüfungen und Reihenfolgevergleiche bleiben bestehen. Die Science-Prüfung verwendet dagegen den echten neuen Datenstand: Ihre 18 Biology-/Ecology-/Applied-Module enthalten jetzt 583 Fragen, also 576 historische plus sieben genau benannte Anhängefragen; die zwei Gewöllefragen sind die einzige neue Science-Ausnahme. Die eine Zündungsartenfrage gehört zum getrennten Field-Science-Datensatz und wird dort positiv geprüft.

Final bestanden alle 85 Fälle aus diesen zehn historischen und den beiden neuen Fachtestdateien, ohne übersprungene Fälle. Die neuen Fachtests verwenden den tatsächlichen vollständigen Datenstand und bewahren im positiven Vergleich alle alten Kurse und Karten. Rohprotokolle außerhalb des Repos: `work/regional-law-qa/digestive-ignition-historical-initial.txt` und `digestive-ignition-historical-final.txt`. Der kompakte Reporter hält Fallnamen, konkrete Assertions und tatsächliche Zähler fest, statt die vollständigen mehrmegabytegroßen Curriculumobjekte in Fehlermeldungen zu wiederholen.

Die direkte Mini-Kurs-Verknüpfung und die unabhängige Gegenprüfung erfolgen getrennt durch Root beziehungsweise den anderen Fachautor. Kein Produktionsbuild, Stage, Commit oder Push durch diesen Autor. Der eng geprüfte Anhang ist weder ein amtlicher Prüfungsfragenkatalog noch eine vollständige fachliche Zertifizierung der App.
