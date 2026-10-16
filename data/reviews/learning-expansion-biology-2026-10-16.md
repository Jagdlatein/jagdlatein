# Fachprüfung Biologieausbau – 16. Oktober 2026

Geprüfte Datei: `data/learning-expansion-biology-2026-10-16.json`. Tatsächliche inhaltliche Prüfung am **2026-10-16**. Die Datumsangabe bezeichnet den fachlichen Abgleich der unten begrenzten Blöcke, keine fachliche Zertifizierung der gesamten App.

## Umfang und Ergebnis

Sechs eigenständige Vertiefungskurse, 24 Lektionen mit jeweils zwei erklärenden Absätzen und 192 Fragen. Je Lektion acht verschiedene Abruffragen; pro Kurs acht richtige Antworten auf jeder Position. Alle Fragen, jeweils vier Optionen, Antwortschlüssel und eigenständigen Erklärungen wurden gelesen. Chemische Stoffwege, anatomische Lage, Fachbegriffe, Gewebefunktionen, Entwicklungsabfolgen und unmittelbare Zahnformelrechnungen bilden unterschiedliche Abrufaufgaben. Die Antwortpositionen sind ausgeglichen. Die Distraktoren wurden nach dem ersten Entwurf gezielt auf näherliegende Organ-, Gewebe-, Stoffgruppen- und Entwicklungsverwechslungen umgestellt.

| Kurs | Lektionen | Fragen | richtige Position A / B / C / D |
| --- | ---: | ---: | --- |
| Wiederkäuer: Aus Pflanzenfasern werden Nährstoffe | 4 | 32 | 8 / 8 / 8 / 8 |
| Hase, Schwarzwild und Vogel: Drei Verdauungswege | 4 | 32 | 8 / 8 / 8 / 8 |
| Vogelkörper: Skelett, Atemwege und Stimme | 4 | 32 | 8 / 8 / 8 / 8 |
| Fortpflanzung: Keimruhe, Plazenta und Vogelei | 4 | 32 | 8 / 8 / 8 / 8 |
| Hundegebiss: Zahnformel, Wechsel und Gewebe | 4 | 32 | 8 / 8 / 8 / 8 |
| Hundesinne: Riechgewebe, Auge, Ohr und Tastsinn | 4 | 32 | 8 / 8 / 8 / 8 |

Die Erweiterung bleibt in Wildkunde/Federwild und Hundewesen. Biologische Inhalte gelten gemeinsam für DACH. Es gibt keine künstliche Länderwahl für Anatomie, keine Rechtsaussagen und keine neuen Medien. Vorhandene lizenzierte Kategorie-Fotos können als Themenbild dienen, ohne innere Vorgänge oder individuelle Diagnosen zu beweisen. Root übernimmt Integration und technische Gesamttests; in diesem Auftrag wurden ausschließlich die beiden neuen Biologie-Dateien erstellt.

## Nachweisführung

Die JSON enthält **24 Evidenzblöcke**, jeweils eindeutig über `moduleId` und `lessonId` an die Lektion gebunden. Jeder konkrete Wissensblock benennt die geprüften Aussagen und die tatsächlich dafür benutzten URLs aus `module.sources`. Insgesamt sind **56 verschiedene URLs** registriert. Das ist eine Quelleninventarzahl, keine Zahl unabhängiger Forschungsreplikationen.

Tatsächlich gelesen wurden die relevanten Originaltexte beziehungsweise Originalabstracts sowie die ausdrücklich beschriebenen Anatomie-/Physiologieabschnitte offizieller Lehrseiten. Bei einzelnen CSU-, Minnesota-, Penn-State- oder PubMed/PMC-Adressen waren direkte Abrufe zeitweise durch Timeout, 403 oder eine Bot-Abfrage blockiert. In diesen Fällen wurden die im Webindex abrufbaren Originalabschnitte beziehungsweise der Originalabstract gelesen und gegen andere direkt lesbare Fachquellen geprüft. Ein solcher Zugriff ist keine vollständige Sichtprüfung jeder Seite oder jeder verlinkten PDF. Die bloße Erreichbarkeit war nie alleiniger Sachnachweis.

Die Daten enthalten eigene Formulierungen und selbst entworfene Fragen. Aus fremden Lehrbüchern wurden keine Kapitel, Abbildungen, Aufgaben, Antwortlisten oder längeren Formulierungen übernommen. Angaben wie 20/22 oder 12/4/16/10 sind ausdrücklich eigene unmittelbare Rechenableitungen der belegten Hundezahnformel.

## Fachlicher Abgleich je Kurs

### Wiederkäuer

- Minnesota/CSU beschreiben die mikrobielle Faserfermentation; BZL/BLE und die fachlich redigierte Rinderphysiologie bei Merck stützen Energieprodukte, Pansenaufnahme und Labmagenfunktion.
- Propionat als Glucosevorstufe wurde im physiologischen Originallehrtext gegengeprüft. Keine prozentuale Fettsäurequote, Literzahl oder pH-Grenze übernommen.
- Mikrobenprotein und nicht im Pansen abgebautes Nahrungsprotein bleiben getrennte Quellen. Die verkürzte Behauptung, sämtlicher Ammoniak werde über den Harnstoffzyklus unmittelbar Protein, wurde nicht übernommen.
- Wiederkauen, Speichelpuffer und Aufstoßen wurden gegen CSU, Minnesota und Penn State abgeglichen.
- Das Kälbermodell erklärt Schlundrinne und funktionelle Pansenentwicklung. Die Quellen behandeln Rinder; daraus werden keine identischen Entwicklungsalter oder Fütterungspläne für Reh/Gams abgeleitet.

### Verdauungsvergleich

- Zwei voneinander unabhängige Originalvergleiche von Feldhase und Kaninchen (Kuijper und andere; Miśta und andere) tragen Blinddarmgärung und Caecotrophie. Versuchsbedingungen sind keine allgemein gültigen Tageszeiten oder Passagefristen für Wildtiere.
- Abweichende Organproportionen zwischen Untersuchungsgruppen wurden nicht zu einem universellen Hasen-/Kaninchen-Größenverhältnis verdichtet.
- Der Schweinemagen wurde in den eigenen Anatomielehrangeboten der UZH und Minnesota verglichen. Die Drüsenlosigkeit eines kleinen Eingangsbereichs wird nicht als vollständig drüsenloser Magen missverstanden.
- Pankreas- und Gallensekrete wurden anhand der allgemeinen Säugetierphysiologie bei CSU und unabhängig redigierten Merck-Fachtexten verglichen. Klinische Abschnitte wurden nicht in Wildtiertherapie übersetzt.
- Kropf, Proventriculus, Ventriculus und Kloake wurden zwischen CSU und PoultryHub abgeglichen. Der Kropf sowie aufgenommene Steinchen sind keine universelle Vorschrift für jede Vogelart.

### Vogelkörper

- Skelett- und Flügelmuskelbau wurden zwischen PoultryHub, der universitären Biologie und dem anatomischen Lehrmaterial des Puget Sound Museums verglichen. Einzelne pneumatische Knochen werden nicht zu „alle Knochen hohl“.
- Luftsackventilation und gaswechselnde Lunge bleiben klar getrennt. Keine für sämtliche Arten gültige Luftsackzahl.
- Luftkapillaren und Blutkapillaren bleiben getrennte Räume; der Sauerstoff-/Kohlendioxidaustausch wird als Diffusion beschrieben. Keine unbestätigte Leistungsquote oder verallgemeinerte Strömungsgeometrie.
- Syrinxlage, Gewebeschwingung und Muskelkontrolle wurden zwischen UConn, PoultryHub und Museumsmaterial geprüft. Mechanisches Trommeln beziehungsweise Federgeräusche sind keine Syrinxstimmen.
- Einzelne fragliche Nebenformulierungen/Universalzahlen der breiten Vogellehrseiten wurden verworfen. Es wurden nur die hier gegengeprüften Anatomieblöcke übernommen.

### Fortpflanzung

- Der Kurs ist bewusst enger als eine vollständige Fortpflanzungsenzyklopädie: Rehdiapause, Plazentakontakt sowie Aufbau und Bildung des Vogeleies.
- Neuere Reh-Originaldaten (Rüegg und andere 2024) zeigen fortlaufende langsame Proliferation und Differenzierung. Aitkens unabhängige Cambridge-Originalarbeit 1975 beschreibt progressive Vergrößerung und ultrastrukturelle Veränderungen. Die ältere Arbeit ist keine molekulare Replikation der jüngeren; ihre eigenständigen Befunde stützen die Ablehnung eines unveränderten vollständigen Stillstands. Der ETH-Projekttext gehört zur selben neueren Gruppe und zählt nicht als zusätzliche unabhängige Replikation.
- Rehdiapause ist nicht verzögerte Befruchtung. Kein exakt gleiches Kalenderende für jedes Tier und keine Übertragung auf sämtliche Diapausearten.
- Kotyledon/Karunkel/Plazentom wurden an CSU und unabhängigen originalen Drost-Präparaten erklärt. UCSD trägt den Vergleich diffus/zonär/kotyledonär. Zahlen einzelner Rinderpräparate werden nicht zu Reh-Konstanten.
- Das Huhn ist für die Eibildung ausdrücklich Referenztier. PoultryHub und Kentucky tragen die unabhängige Erklärung der Abschnitte. Keine Legezeit, Brutdauer oder Prozentzusammensetzung für alle Wildvögel.
- Hagelschnur und Keimscheibe bleiben getrennt, Luftkammer liegt zwischen den Schalenhäuten, Schalenporen ermöglichen Gas-/Wasserdampfaustausch.

### Hundegebiss

- Dauerformel 2×(I3/3 C1/1 P4/4 M2/3)=42; Milchformel 2×(i3/3 c1/1 p3/3)=28. Formeln und Kieferhälftenverständnis gegen Merck/Ghent, WikiVet, CSU und Open University abgeglichen.
- 20 Oberkiefer-/22 Unterkieferzähne sowie Zahngruppensummen wurden selbst nachgerechnet.
- Keine Milchmolaren; P1 und bleibende Molaren haben keine Milchvorgänger. MSD und Merck sind dieselbe Quellenfamilie und zählen nicht unabhängig voneinander.
- AVDC und AAHA stützen Gewebenamen, Pulpa und Zahnhalteapparat. Das OSU-Lehrkapitel ergänzt unabhängig die Richtungsbegriffe. Die anatomische und die klinische Krone werden unterschieden.
- Reißzahnpaar oberer P4/unterer M1 bleibt klar von Eck-/Fangzähnen getrennt.
- Die benachbarte fehlerhafte Katzenzahnformel des OpenLearn-Abschnitts wurde ausdrücklich nicht übernommen. Geprüft wurden dessen Hundeaussagen im Vergleich zu den übrigen Fachquellen.

### Hundesinne

- Das MRT-Strömungsmodell von Craven und anderen ist ein Modell von Geometrie und Luftstrom. Die unabhängige Mikroskopie von Kavoi und anderen untersucht Schleimhautstrukturen. Beide Methoden ergänzen sich und messen keine gleiche universelle Suchleistung.
- Der Lektionstitel lautet nach Gegenprüfung „Riechschleimhaut: Sinneszellen im spezialisierten Epithel“. Die gesamte Mukosa wird nicht pauschal als reines Nervengewebe bezeichnet.
- Augenbau gegen Merck und das veterinärneuroanatomische Minnesota-Lehrmaterial geprüft. Cornell stützt den begrenzten Abschnitt zur Funktion von Stäbchen/Zapfen. Die zwei unabhängigen Originalarbeiten Neitz und andere 1989 und Siniscalchi und andere 2017 tragen die Dichromatie; begrenzte Verhaltensversuche sind keine Rasse-Rangliste.
- Im Minnesota-PDF wurden nur die gegengeprüften Augen-/Hundeabschnitte verwendet. Die pauschale Nebenbehauptung über Farbblindheit aller nachtaktiven Tiere wurde nicht übernommen.
- Cole/Ohio State und der unabhängige Merck-Ohrtext tragen Trommelfell, Knöchelchenkette, ovales Fenster, Cochlea, Vestibularsystem und Ohrtrompete. Keine pauschale Hörleistungszahl.
- Bei Vibrissen wurden drei Originalarbeiten gelesen. Döring 2025 und Müller 2026 überschneiden sich in Autorengruppe/Institution; sie werden nicht als unabhängige Replikationen gezählt. Ramírez 2016 ist die unabhängige Hautkartierung und trägt Merkelzellen/Nervenbeziehungen/regionale Variation. Die neueren Studien liefern speziell die Follikel-Sinus-Architektur und Gesichtsregionen. Daraus folgt keine gesicherte Verhaltensquote für jeden Hund. Anatomische Einzelbefunde werden nicht als selbst wiederholte Messreihe ausgegeben.

## Altbestand auf Überlappung und Widersprüche geprüft

Vor dem Schreiben wurden bestehende Kurstitel und die einschlägigen Verdauungs-, Wildbiologie-, Zahn-, Wildjahr-, Rehporträt-, Glossar- und Fragenbestände per Inventar und Textsuche betrachtet. Vorhandene einfache Magenmodelle in `lib/digestive-learning.js` werden durch Stoffwege und Gewebefunktionen vertieft, nicht bloß umbenannt. Allgemeine Jungtiergrundlagen wurden zugunsten des engeren Eibildungs-/Plazentakurses ausgelassen.

Gezielte Reh-Suche nach `Keimruhe`, `Embryonalruhe`, `Zellteilung`, `stillgelegt` und `Entwicklungsstillstand` in `lib`, `data` und `pages`: keine ausdrückliche bestehende Rehbehauptung „vollständig stillgelegt/keine Zellteilung“ gefunden. Der Fachbegriff Keimruhe allein wurde nicht als Fehler behandelt. Fundstellen wie `lib/learning-wildlife.js` beschreiben bereits Verzögerung.

Eine konkrete alte Rohfrage wurde Root gemeldet: `data/questions-full.js`, JL-1041, früher teleologisch „Warum setzt ...“ mit „Geburt im Juni maximal günstig“. Root übernimmt die Korrektur zum zeitlichen Effekt mit angemessener jahreszeitlicher Variation. In diesem Teilauftrag wurden fremde vorhandene Dateien nicht verändert.

## Redaktionelle Schlusskontrolle und technische Grenzen

- Alle 192 Schlüssel wurden zusammen mit Optionen und Erklärung gelesen; vier eindeutige Optionen je Frage.
- Pro Kurs exakt 8 A/B/C/D; keine identischen Fragezeichenketten oder mehrfachen Optionswerte beabsichtigt.
- Richtige Antworten sind nicht durchgehend am längsten; die Antwortlänge ist kein Redaktionsprinzip.
- Produkttexte wurden nach zweiter Lesung von wiederholten allgemeinen „keine private Diagnose/Behandlung/Fütterung“-Vorsätzen entlastet. Sachliche Art-, Modell- und Entwicklungsgrenzen bleiben im Lerntext.
- Übungen sind eigene Skizzen-/Zuordnungsaufgaben. Sie enthalten keine Anweisungen zur Manipulation lebender Tiere.
- Schema-, Link- und Zählprüfungen ersetzen keine fachliche Prüfung. Parent integriert und führt die App-Tests durch; dieser Bericht behauptet keinen von diesem Agenten ausgeführten End-to-End-Test.
- Keine neue Aussage, Jagdlatein sei vollständig oder inhaltlich bereits größer als ein bestimmter Mitbewerber.

## Tatsächlich verwendete Quellen

Die konkrete Claim-Zuordnung steht in der JSON. Die folgende Liste dokumentiert den jeweils gelesenen Gegenstand; sie ist keine Ersatzbegründung für diese Zuordnung.

- **University of Minnesota, Erin Malone: Minnesota: Fermentation** – https://open.lib.umn.edu/vetphysioapplied/chapter/fermentation/
  Gelesener Gegenstand: Mikrobielle Zellwandfermentation, flüchtige Fettsäuren und mikrobielles Protein; Rind als benanntes Referenztier.
- **University of Minnesota, Erin Malone: Minnesota: Forestomach motility and function** – https://open.lib.umn.edu/vetphysioapplied/chapter/forestomach-motility-and-function/
  Gelesener Gegenstand: Wiederkauphasen, Teilchentransport, Speichel und Entwicklung des Jungtiermagens.
- **Colorado State University, Richard Bowen: Colorado State: Digestive physiology of herbivores** – https://vivo.colostate.edu/hbooks/pathphys/digestion/herbivores/overview.html
  Gelesener Gegenstand: Ort der Fermentation; Mikroben, Substrate und Produkte; Vorder- und Hinterdarmvergärer.
- **Colorado State University, Richard Bowen: Colorado State: Rumination** – https://vivo.colostate.edu/hbooks/pathphys/digestion/herbivores/rumination.html
  Gelesener Gegenstand: Hochwürgen, Wiederkauen, Einspeicheln und Abschlucken; Teilchenzerkleinerung, Speichel und Gasabgabe.
- **Bundesinformationszentrum Landwirtschaft / BLE: Warum können Rinder von Gras leben?** – https://www.landwirtschaft.de/tier-und-pflanze/tier/rinder/warum-koennen-rinder-von-gras-leben
  Gelesener Gegenstand: Rinder: mikrobielle Zellwandverdauung, Fettsäurenaufnahme, Labmagen und Entwicklung vom Milch- zum Pflanzenfresser; Stand 22.08.2025.
- **Merck Veterinary Manual; Texas A&M University; Michigan State University: The digestive system of beef cattle** – https://www.merckvetmanual.com/management-and-nutrition/nutrition-beef-cattle/the-digestive-system-of-beef-cattle
  Gelesener Gegenstand: Gegenprüfung von Pansenpapillen, Fermentationsprodukten, mikrobiellem Protein und Enzymverdauung; aktualisiert Juli 2026.
- **Penn State Extension: From feed to milk: Understanding rumen function** – https://extension.psu.edu/from-feed-to-milk-understanding-rumen-function
  Gelesener Gegenstand: Speichelpuffer, Wiederkauvorgänge, mikrobielles und nicht im Pansen abgebautes Nahrungsprotein; Rindermodell.
- **University of Groningen; Wageningen University; Journal of Zoology: Kuijper, van Wieren und Bakker 2004: Digestive strategies in European hare and rabbit** – https://zslpublications.onlinelibrary.wiley.com/doi/10.1017/S0952836904005722
  Gelesener Gegenstand: Originalvergleich von Lepus europaeus und Oryctolagus cuniculus: Blinddarmfermentation, Caecotrophie und unterschiedliche Verdauungsstrategien; keine pauschalen Organquotienten.
- **Wrocław University of Environmental and Life Sciences und Mitautoren; Mammal Research: Miśta und andere 2018: Caecal fermentation in brown hares and rabbits** – https://link.springer.com/article/10.1007/s13364-018-0357-1
  Gelesener Gegenstand: Unabhängiger Originalvergleich: Blinddarm, kurzkettige Fettsäuren, Caecotrophie. Keine Generalisierung der gemessenen Organproportionen.
- **Universität Zürich, Veterinärmedizin: Anatomie des Digestitionsapparates des Schweines** – https://www.ictvet.uzh.ch/US_Schwein/html/git1.htm
  Gelesener Gegenstand: Allesfresser; einhöhlig zusammengesetzter Magen mit verschiedenartigen Schleimhautzonen. Keine Volumenwerte übertragen.
- **University of Minnesota College of Veterinary Medicine: Abdomen 1: Equine and Porcine** – https://pressbooks.umn.edu/largeanimalanatomy/chapter/abdomen-1/
  Gelesener Gegenstand: Eigenes Anatomielehrmaterial zu Schweinemagen, Duodenum, Dünn- und Dickdarm; benanntes Hausschweinmodell.
- **Merck Veterinary Manual: The digestive system in animals** – https://www.merckvetmanual.com/digestive-system/digestive-system-introduction/the-digestive-system-in-animals
  Gelesener Gegenstand: Motorik, Sekretion, enzymatische Verdauung, Dünndarmresorption und mikrobielle Dickdarmvorgänge beim Schwein; aktualisiert April 2026.
- **Colorado State University, Richard Bowen: Colorado State: Exocrine secretions of the pancreas** – https://vivo.colostate.edu/hbooks/pathphys/digestion/pancreas/exocrine.html
  Gelesener Gegenstand: Allgemeine Säugetierphysiologie: Proteasen, Lipase, Amylase und Bicarbonat; keine Dosierungen oder klinischen Eingriffe.
- **Colorado State University, Richard Bowen: Colorado State: Secretion of bile and bile acids** – https://vivo.colostate.edu/hbooks/pathphys/digestion/liver/bile.html
  Gelesener Gegenstand: Leber bildet Galle, Gallenblase speichert; Gallensäuren unterstützen Emulgierung und Fettaufnahme. Keine menschlichen Mengenangaben übertragen.
- **Merck Veterinary Manual; University of Guelph; Iowa State University: Merck: Physiology of malabsorption – normal digestion** – https://www.merckvetmanual.com/digestive-system/diseases-of-the-small-intestine-in-small-animals/malabsorption-syndromes-in-small-animals
  Gelesener Gegenstand: Nur der allgemeine physiologische Abschnitt zu pankreatischen Enzymen, Gallensalzen und Dünndarmaufnahme; keine klinischen Diagnosen oder Therapien auf Wildarten übertragen.
- **Colorado State University, Richard Bowen: Colorado State: Avian digestive system** – https://vivo.colostate.edu/hbooks/pathphys/digestion/birds.html
  Gelesener Gegenstand: Kropf ist keine universelle Vogelstruktur; Drüsen- und Muskelmagen, Darm und Kloake.
- **PoultryHub Australia, University of New England: PoultryHub: Digestive system** – https://www.poultryhub.org/anatomy-and-physiology/body-systems/digestive-system
  Gelesener Gegenstand: Huhn als Referenztier für Drüsen-/Muskelmagen, Kropf, Duodenum und Kloake.
- **PoultryHub Australia, University of New England: PoultryHub: Skeletal system** – https://www.poultryhub.org/anatomy-and-physiology/body-systems/skeletal-system
  Gelesener Gegenstand: Vogelskelett am Huhn: Oberarm/Unterarm, Schultergürtel, Furcula, Brustbein und Verwachsungen.
- **University of Hawaiʻi; OpenStax Biology: Birds – Biology** – https://pressbooks-dev.oer.hawaii.edu/biology/chapter/birds/
  Gelesener Gegenstand: Unabhängige universitäre Darstellung von Vogelskelett, Flugmuskulatur, Lunge und Luftsäcken; keine eigenen Beobachtungsdaten.
- **University of Puget Sound Museum of Natural History: Bird dissection – anatomical teaching collection** – https://www.pugetsound.edu/puget-sound-museum-natural-history/biodiversity-resources/birds/bird-dissection
  Gelesener Gegenstand: Anatomische Lage und Funktion von Brust-/Flügelmuskeln und Syrinx. Keine Präparationsanleitung übernommen.
- **PoultryHub Australia, University of New England: PoultryHub: Respiratory system and thermoregulation** – https://www.poultryhub.org/anatomy-and-physiology/body-systems/respiratory-system-thermoregulation
  Gelesener Gegenstand: Huhn: Bronchien, Parabronchien, Luft-/Blutkapillaren, Luftsäcke und Syrinx; fragliche Nebenformulierungen ausgeschlossen.
- **University of Connecticut, Rubega Lab: UConn: Respiration and circulation** – https://rubegalab.uconn.edu/2016/03/07/lecture-notes-respiration-and-circulation/
  Gelesener Gegenstand: Starre Vogellunge und Luftsackventilation; Anatomie von Luftwegen und Gaswechsel.
- **University of Connecticut, Rubega Lab: UConn: Visual and vocal communication** – https://rubegalab.uconn.edu/eeb-4260-visual-and-vocal-communication/
  Gelesener Gegenstand: Syrinx, vibrierende Gewebe, Luftstrom und Muskelkontrolle; Variation und nichtvokale Vogellaute.
- **Cornell Lab of Ornithology: Bird Academy's A-to-Z glossary of bird terms** – https://academy.allaboutbirds.org/bird-academys-a-to-z-glossary-of-bird-terms/
  Gelesener Gegenstand: Gegenprüfung der anatomischen Begriffe Luftsack, Parabronchien und Lautapparat; Begriffswerk, keine Messreihe.
- **ETH Zürich und Mitautoren; Communications Biology: Rüegg und andere 2024: Developmental progression continues during embryonic diapause in the roe deer** – https://www.nature.com/articles/s42003-024-05944-w
  Gelesener Gegenstand: Originaldaten: langsame fortlaufende Proliferation und Differenzierung während Rehdiapause; deutliche Beschleunigung bei Elongation. Keine Übertragung auf alle Diapausearten.
- **University of Cambridge; Journal of Anatomy: Aitken 1975: Ultrastructure of blastocyst and endometrium during delayed implantation** – https://pmc.ncbi.nlm.nih.gov/articles/PMC1231599/
  Gelesener Gegenstand: Unabhängige ältere Originaluntersuchung: progressive Vergrößerung und zelluläre Veränderungen der Rehblastozyste während verzögerter Implantation.
- **ETH Zürich, Animal Physiology: ETH: Embryonic diapause** – https://ap.ethz.ch/research/repro/diapause.html
  Gelesener Gegenstand: Artspezifischer Ablauf: Sommerpaarung, verzögerte frühe Entwicklung im Uterus, spätere Implantation; Forschungszusammenfassung derselben Gruppe wie Rüegg, keine unabhängige Replikation.
- **Colorado State University, Richard Bowen: Colorado State: Comparative placentation** – https://vivo.colostate.edu/hbooks/pathphys/reprod/placenta/
  Gelesener Gegenstand: Plazenta als mütterlich-fetale Kontaktfläche; Artvergleich diffus, kotyledonär, gürtelförmig.
- **Colorado State University, Richard Bowen: Colorado State: Ruminant placenta** – https://vivo.colostate.edu/hbooks/pathphys/reprod/placenta/ruminants.html
  Gelesener Gegenstand: Fetales Kotyledon und mütterliche Karunkel bilden Plazentom; keine universellen Zahlen.
- **University of Florida College of Veterinary Medicine, Drost Project: The Drost Project: Normal bovine placenta** – https://visgar.vetmed.ufl.edu/en_bovrep/normal-placenta/normal-placenta.html
  Gelesener Gegenstand: Originalpräparate des Rindes: fetales Kotyledon, mütterliche Karunkel, Plazentom und getrennt dargestellte Gefäßsysteme.
- **University of California San Diego, Kurt Benirschke: Comparative placentation: placental forms** – https://placentation.ucsd.edu/placenta.html
  Gelesener Gegenstand: Eigenständige vergleichende Pathologie/Präparatesammlung: Schwein diffus, Hund zonär, Wiederkäuer kotyledonär. Keine Zahlen aus Einzelfällen verallgemeinert.
- **PoultryHub Australia, University of New England: PoultryHub: The avian egg** – https://www.poultryhub.org/anatomy-and-physiology/the-avian-egg
  Gelesener Gegenstand: Huhn: Dotter, Eiklar, Schalen, Poren und Gasaustausch; keine universellen Prozent-/Zeitwerte.
- **PoultryHub Australia, University of New England: PoultryHub: Reproductive system** – https://www.poultryhub.org/anatomy-and-physiology/body-systems/reproductive-system
  Gelesener Gegenstand: Huhn als Referenztier: Dotterbildung im Ovar, Ovulation und Abschnitte des Eileiters; keine universellen Legezeiten.
- **University of Kentucky Cooperative Extension: Jacquie Jacob: Avian reproductive system, ASC-201** – https://www2.ca.uky.edu/agc/pubs/ASC/ASC201/ASC201.pdf
  Gelesener Gegenstand: Huhn: Eileiterabschnitte, Befruchtungsort, Eiklar, Hagelschnüre, Schalenhäute und Schale.
- **University of Kentucky, Poultry Extension: The egg and I – teaching material** – https://afs.mgcafe.uky.edu/files/eggandi.pdf
  Gelesener Gegenstand: Dotterhaut, Hagelschnüre, Luftkammer zwischen Schalenhäuten und poröse Kalkschale; dieselbe Institution wie ASC-201.
- **Merck Veterinary Manual, Sofie Muylle, Ghent University: Dental development of dogs** – https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/dental-development-of-dogs
  Gelesener Gegenstand: 28 Milchzähne und 42 bleibende Zähne als normale Formeln; keine Individualdiagnose nach Kalender.
- **MSD Veterinary Manual, Sofie Muylle, Ghent University: Dental development in animals – canine formula and succession** – https://www.msdvetmanual.com/digestive-system/dental-development-and-anatomy/dental-development-in-animals
  Gelesener Gegenstand: Gebissfolge und Formeln: bleibende Molaren und erster Prämolar ohne Milchzahnvorgänger. Merck/MSD ist dieselbe Quellenfamilie, keine zusätzliche unabhängige Bestätigung.
- **WikiVet, veterinärmedizinisches Hochschulprojekt: Dental formula – Dog** – https://en.wikivet.net/Dental_Formula_-_Dog
  Gelesener Gegenstand: Milch- und Dauergebissformeln sowie Zahngruppen; gegen Merck, CSU und Open University abgeglichen.
- **Colorado State University, Richard Bowen: Colorado State: Dental anatomy** – https://vivo.colostate.edu/hbooks/pathphys/digestion/pregastric/dentalanat.html
  Gelesener Gegenstand: Hund: Dauergebissformel; Schneide-, Eck-, Vorbacken-/Backenzähne und Gewebegrundlagen.
- **The Open University: OpenLearn: Carnivora** – https://www.open.edu/openlearn/mod/oucontent/view.php?id=2225&section=2.2
  Gelesener Gegenstand: Hund mit 42 bleibenden Zähnen; Reißzahnpaar oberer P4/unterer M1 und Scherwirkung. Fehlerhafte benachbarte Katzenformel ausdrücklich nicht übernommen.
- **American Veterinary Dental College: AVDC nomenclature** – https://avdc.org/avdc-nomenclature/
  Gelesener Gegenstand: Zahnkrone/-wurzel, Pulpa, Gewebenomenklatur, Zahngruppen, Gebisswechsel und anatomische Richtungen.
- **American Animal Hospital Association: AAHA Dental Care Guidelines: Anatomy and pathology** – https://www.aaha.org/resources/2019-aaha-dental-care-guidelines-for-dogs-and-cats/anatomy-pathology-2/
  Gelesener Gegenstand: Zahnhartgewebe, Pulpa sowie Gingiva, Wurzelzement, Desmodont und Alveolarknochen; keine Therapie übernommen.
- **The Ohio State University College of Veterinary Medicine: Dental anatomy – veterinary skills handbook** – https://ohiostate.pressbooks.pub/osuvcpslhandbook/chapter/saclin_oraldentalone_charting_dental-anatomy/
  Gelesener Gegenstand: Eigenes Lehrkapitel: Zahngewebe, Halteapparat und bukkal/labial/palatinal/lingual; unterstützt die präzise Richtungsbeschreibung.
- **Pennsylvania State University; Journal of the Royal Society Interface: Craven, Paterson und Settles 2010: The fluid dynamics of canine olfaction** – https://pmc.ncbi.nlm.nih.gov/articles/PMC2871809/
  Gelesener Gegenstand: Originalstudie mit MRT-basiertem Strömungsmodell: Nasenmuscheln, Riechregion und Luftwege beim Schnüffeln; keine allgemeine Leistungszahl.
- **University of Nairobi und Mitautoren; Annals of Anatomy: Kavoi und andere 2010: Canine and ovine olfactory mucosa** – https://pubmed.ncbi.nlm.nih.gov/20801626/
  Gelesener Gegenstand: Unabhängige Originalmikroskopie: Riech-, Stütz- und Basalzellen, Riechhärchen, Drüsen und Nervenbündel; keine universellen Zellzahlquotienten.
- **University of Tennessee; Frontiers in Veterinary Science: Jenkins und andere 2018: When the nose doesn't know** – https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2018.00056/full
  Gelesener Gegenstand: Eigenständige veterinärmedizinische Übersicht zur Riechschleimhaut und Signalweiterleitung; keine Krankheitsdiagnose oder Zellzahlversprechen.
- **University of California Santa Barbara; Visual Neuroscience: Neitz, Geist und Jacobs 1989: Color vision in the dog** – https://doi.org/10.1017/S0952523800004430
  Gelesener Gegenstand: Originalverhaltensversuche: zwei funktionelle Zapfenklassen und dichromatisches Farbsehen; begrenzte Versuchstierzahl.
- **University of Bari; Royal Society Open Science: Siniscalchi und andere 2017: Are dogs red-green colour blind?** – https://pmc.ncbi.nlm.nih.gov/articles/PMC5717654/
  Gelesener Gegenstand: Unabhängige Originalversuche zur Rot-Grün-Unterscheidung, konsistent mit Dichromatie; keine Leistungsrangliste von Rassen.
- **Merck Veterinary Manual, Kirk Gelatt, University of Florida: Eye structure and function in dogs** – https://www.merckvetmanual.com/dog-owners/eye-disorders-of-dogs/eye-structure-and-function-in-dogs
  Gelesener Gegenstand: Hornhaut, Iris/Pupille, Linse, Netzhaut und Sehnerv; Stäbchen/Zapfen.
- **University of Minnesota, Veterinary Anatomy: Minnesota: Visual system – veterinary neuroanatomy** – https://vanat.ahc.umn.edu/NeuroLectPDFs/LectVisualSys.pdf
  Gelesener Gegenstand: Gelesen: Augenquerschnitt/Netzhaut S.94–95 sowie Farbsehen/Pupillenweg S.98–99 der Lehrzählung. Nur gegenbestätigte Hundeanatomie, keine pauschalen Aussagen zu nachtaktiven Tierarten.
- **Cornell University College of Veterinary Medicine: Cornell: Progressive retinal atrophy – retinal cell functions** – https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-topics/progressive-retinal-atrophy
  Gelesener Gegenstand: Nur anatomischer Grundabschnitt: Netzhaut, Stäbchen für Dämmerungssehen, Zapfen für Farb-/Tagessehen; keine Diagnose-/Behandlungsaussage übernommen.
- **The Ohio State University; Veterinary Dermatology: Cole 2010: Anatomy and physiology of the canine ear** – https://pubmed.ncbi.nlm.nih.gov/20230592/
  Gelesener Gegenstand: Originalfachdarstellung des Hundeohres: äußerer Gehörgang, Trommelfell, Gehörknöchelchen, Ohrtrompete, Cochlea und Gleichgewichtsapparat.
- **Merck Veterinary Manual: Ear structure and function in dogs** – https://www.merckvetmanual.com/dog-owners/ear-disorders-of-dogs/ear-structure-and-function-in-dogs
  Gelesener Gegenstand: Unabhängige Gegenprüfung der äußeren, mittleren und inneren Ohranteile; keine pauschalen Hörleistungsfaktoren.
- **Ludwig-Maximilians-Universität München; Scientific Reports: Döring und andere 2025: Canine vibrissae** – https://pmc.ncbi.nlm.nih.gov/articles/PMC11914073/
  Gelesener Gegenstand: Originalbeobachtung und Mikroskopie zu Vibrissen und Follikel-Sinus-Komplexen; begrenzte Stichprobe, keine universelle Verhaltensquote.
- **Universidad de Las Palmas de Gran Canaria; The Anatomical Record: Ramírez und andere 2016: Merkel cells in canine skin and mucosa** – https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.23387
  Gelesener Gegenstand: Unabhängige Originalhistologie zu Merkelzellen und Nervenbeziehungen in Hundehaut einschließlich Tasthaarregionen.
- **LMU München mit Vetmeduni Wien und Tierärztlicher Hochschule Hannover; PLOS ONE: Müller und andere 2026: Histomorphological analysis of canine follicle-sinus complexes** – https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0355554
  Gelesener Gegenstand: Originalhistologie mit Follikeln verschiedener Gesichtsregionen, Bluträumen und Mechanorezeptoren. Überlappt Autorengruppe mit 2025; nicht als unabhängige Replikation gezählt.

