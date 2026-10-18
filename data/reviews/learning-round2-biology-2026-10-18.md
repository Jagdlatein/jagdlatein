# Biologie-Ausbau Runde 2 – Quellen- und Geltungsprüfung

Tatsächlich geprüft am **18. Oktober 2026**. Gegenstand sind ausschließlich die zwei neuen Kurse in `data/learning-round2-biology-2026-10-18.json`: acht Lektionen, 32 eigene Fragen und deren Erklärungen. Dies ist keine fachliche Zertifizierung des übrigen Appbestands.

## Auswahl nach Bestandsaudit

Die Titel und Lektionstitel der aktuell geladenen 156 Kurse wurden gelesen; verwandte Inhalte anschließend gezielt im Volltext durchsucht. Vorhanden sind bereits Kreislauf, Niere, Genetik, Hundeimmunität, Hundebewegung, Thermoregulation, biologische Ebenen, Hunde-Sinnesorgane sowie Vogelatmung und Embryonalentwicklung. Die Ergänzung wiederholt weder den Herzblutweg noch die Vogellunge. Sie vertieft zwei bislang nicht zusammenhängend ausgearbeitete Grundlagen: **Säuger-Luftwege/Alveolen/Atemgastransport** und **Neuron/ZNS-PNS/Dehnungsreflex/chemische Synapse**. Einzelne Grundbegriffe kommen naturgemäß bereits in Organ- oder Sinneskursen vor; die 32 neuen Fragen behandeln eigenständige konkrete Funktionen und sind keine bloßen Umformulierungen bestehender Quizstämme.

## Tatsächlich eingesehene Originalquellen

Die vollständigen Titel, URLs, verantwortlichen Institutionen und engen Verwendungsbereiche stehen zusätzlich direkt in `modules[].sources`. Mehrere Kapitel derselben Universität oder desselben Lehrbuchs zählen nicht als unabhängige Bestätigungen. MSD und Merck sind dieselbe redaktionelle Quellenfamilie; NCBI ist bei Lehrbüchern nur der Gastgeber, nicht ihr Autor.

### Atmung

- [Merck Veterinary Manual, Tonozzi / Carney: The Respiratory System in Animals](https://www.merckvetmanual.com/respiratory-system/respiratory-system-introduction/the-respiratory-system-in-animals): April-2026-Fassung im öffentlichen Originalindex gelesen; Luftwege, Nasenmuscheln, Flimmertransport, Alveolen und artabhängige Architektur.
- Ohio State, Jennings / Premanandan, *Veterinary Histology*: [Air conduction](https://ohiostate.pressbooks.pub/vethisto/chapter/10-larynx-trachea-bronchi-and-bronchioles/), [Alveoli](https://ohiostate.pressbooks.pub/vethisto/chapter/10-respiratory-tract-gas-exchange/), [Pleura](https://ohiostate.pressbooks.pub/vethisto/chapter/10-pleura/). Die vollständigen öffentlich indexierten Originalabschnitte wurden gelesen. Direkte Aufrufe lieferten zeitweise 403; keine fremde Abschrift als Ersatz verwendet.
- [Duke University: Respiratory System Histology](https://histology.oit.duke.edu/DPT/Respiratory/Respiratory.html): Originalabschnitte Trachea, Bronchi, Bronchioles und Alveoli gelesen; unabhängige Histologie-Bestätigung. Verlinkte Präparate wurden nicht übernommen.
- OpenStax/Rice University, Betts und andere, *Anatomy and Physiology 2e*: [22.1 Luftwege](https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system), [22.2 Pleura](https://openstax.org/books/anatomy-and-physiology-2e/pages/22-2-the-lungs), [22.3 Atemmechanik](https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing), [22.4 Gasaustausch](https://openstax.org/books/anatomy-and-physiology-2e/pages/22-4-gas-exchange), [22.5 Gastransport](https://openstax.org/books/anatomy-and-physiology-2e/pages/22-5-transport-of-gases). Relevante Originalabschnitte gelesen. Die fünf Seiten sind eine Lehrbuchquelle. Keine Fragen, Abbildungen, Tabellen oder spezifischen Humanwerte übernommen.
- [MSD Manual, Rebecca Dezube / Johns Hopkins: Control of Breathing](https://www.msdmanuals.com/home/lung-and-airway-disorders/biology-of-the-lungs-and-airways/control-of-breathing): Abschnitt Respiratory muscles gelesen; unabhängiger Abgleich der Zwerchfell-/Volumen-/Druckmechanik gegenüber Rice. Nicht unabhängig vom Merck-Veterinärtext gezählt.
- StatPearls: [Doyle / Cooper, Carbon Dioxide Transport](https://www.ncbi.nlm.nih.gov/books/NBK532988/?report=classic) und [Rhodes / Denault / Varacallo, Oxygen Transport](https://www.ncbi.nlm.nih.gov/sites/books/NBK538336/?report=reader). Öffentlich indexierte Originalabschnitte Mechanism gelesen; direkte NCBI-Aufrufe zeigten zeitweise Browserprüfung. Zwei Autorenteams, ein Verlag; nicht als unabhängige Wiederholung einer Messreihe ausgegeben.
- Cornell Veterinary Medicine, eClinpath: [Bicarbonate](https://eclinpath.com/chemistry/acid-base/chemistry-tests/bicarbonate/) und [Erythrocytes – Function](https://eclinpath.com/hematology/physiology/erythrocytes/). Originalabschnitte gelesen, keine klinische Interpretation oder Behandlung übernommen. Die Bicarbonatseite bestätigt die Enzymreaktion. Die Erythrozytenseite bestätigt reversible Häm-Eisen-Bindung; ihre vereinfachende CO2-Formulierung wurde ausdrücklich nicht als Nachweis der Bicarbonatverteilung benutzt.
- [Ramsook und andere 2023: The oxygen transport cascade and exercise](https://pmc.ncbi.nlm.nih.gov/articles/PMC10330610/), Mayo Clinic/University of Waterloo, *Comparative Biochemistry and Physiology A*, DOI 10.1016/j.cbpa.2023.111442: Originalabstract, Einleitung und Abschnitt 3 über den öffentlichen Originalindex gelesen. Vergleichende Säugerphysiologie belegt die Einordnung von Sauerstoffdiffusion und Hämoglobin; keine Höhen-, Belastungs- oder Affinitätsdaten von Hirschmäusen übertragen.

### Nervensystem

- [John H. Byrne, UTHealth Houston: Introduction to Neurons and Neuronal Networks](https://med.uth.edu/nba/cellular-and-molecular-neurobiology/): The Neuron und Abschnitte zur elektrischen Signalübertragung gelesen. Keine menschlichen Zellzahlen, Leitungslängen oder Spannungen verwendet.
- [Thomas Schubert / University of Florida, Merck Veterinary Manual: Parts of the Nervous System in Dogs](https://www.merckvetmanual.com/dog-owners/brain-spinal-cord-and-nerve-disorders-of-dogs/parts-of-the-nervous-system-in-dogs): Originalabschnitte Neurons und Types of Neurons gelesen. Die vereinfachte Behauptung über den Fortsatzbau aller Neuronen wurde anhand der folgenden Quellen eingegrenzt.
- University of Minnesota, Beitz/Fletcher, veterinärmedizinisches Neurohistologielabor: [Neurons](https://vanat.ahc.umn.edu/neurLab1/neuron.html) und [Peripheral Nerves](https://vanat.ahc.umn.edu/neurLab1/nerves.html). Originaltexte gelesen; verschiedene Neuronenformen, Axone und periphere Nerven an benannten Tierpräparaten. Diese beiden Seiten sind eine Ausbildungsquelle.
- [Washington University in St. Louis: Myelin & Schwann Cell Components](https://neuromuscular.wustl.edu/lab/schcell.html): Mature Schwann cells sowie myelinisierende und nichtmyelinisierende Formen gelesen. Keine molekularen oder krankheitsbezogenen Sonderbefunde übertragen.
- [OpenStax/Rice, Kirby und andere: Organization of the Nervous System](https://openstax.org/books/introduction-behavioral-neuroscience/pages/1-2-organization-of-the-nervous-system): Abschnitte CNS and PNS, Basic building blocks und Simple human circuit example gelesen; keine Menschen-Wirbelzahl übernommen.
- Purves und andere, *Neuroscience*, 2e, Sinauer: [Nerve Cells](https://www.ncbi.nlm.nih.gov/books/NBK11103/), [Muscle Stretch Reflexes](https://www.ncbi.nlm.nih.gov/books/NBK10809/), [Neurotransmitter Receptors](https://www.ncbi.nlm.nih.gov/books/NBK11099/). Originalkapitel über die vom Verleger ausdrücklich vorgesehene öffentliche Suchansicht gelesen; direkte Aufrufe zeitweise Browserprüfung. Alle drei sind eine Lehrbuchfamilie.
- [Walkowski / Munakomi: Monosynaptic Reflex](https://www.ncbi.nlm.nih.gov/books/NBK541028/), StatPearls: Originalabschnitt Definition/Introduction über den öffentlichen Index gelesen. Keine Reflexgrade oder Durchführung übernommen.
- [NLM MeSH: Reflex, Monosynaptic](https://meshb.nlm.nih.gov/record/ui?ui=D012023): Originaldefinition 2026 gelesen; Begriffsabgleich, keine zusätzliche empirische Studie.
- [Alberts und andere, Garland Science: Ion Channels and the Electrical Properties of Membranes](https://www.ncbi.nlm.nih.gov/books/NBK26910/): Originalabschnitt Chemical Synapses Can Be Excitatory or Inhibitory im öffentlichen Index gelesen. Rezeptor-/Ionenabhängigkeit; keine universell starre Transmitterwirkung behauptet.

## Konkrete Claim-Zuordnung

Die maschinenlesbaren 20 Claims unter `evidence` verknüpfen jeden Wissensblock mit mindestens zwei unabhängigen geeigneten Quellenfamilien. Die Zuordnung gilt auch für die jeweils vier Fragen einer Lektion.

| Lektion | Konkreter Inhalt | Unabhängiger Abgleich |
| --- | --- | --- |
| Luftwege | Reihenfolge und Übergang zur Austauschregion | Merck Vet + Ohio State + Rice |
| Luftwege | Nasale Aufbereitung und rachenwärtiger Schleimtransport | Merck Vet + Rice |
| Luftwege | Knorpel in Bronchien, knorpelfreie Bronchiolen | Ohio State + Duke |
| Atemmechanik | Zwerchfellkontraktion, Volumen und Druckgefälle | Rice + Dezube/MSD |
| Atemmechanik | Pleurablätter und reibungsarme Flüssigkeit | Ohio State + Rice |
| Alveolen | Typ I und kurze Blut-Luft-Schranke | Ohio State + Duke + Rice |
| Alveolen | Typ II, Surfactant und Oberflächenspannung | Ohio State + Duke + Rice |
| Alveolen | Gasspezifisches Gefälle und Austauschrichtung | Rice + Merck Vet; Sauerstoff zusätzlich Ramsook, CO2 zusätzlich Doyle/Cooper |
| Gastransport | Hämoglobin in Erythrozyten, reversible Häm-Eisen-Bindung | Rice + Rhodes und andere + Cornell + Ramsook |
| Gastransport | CO2-Transportformen und Rückumwandlung | Rice + Doyle/Cooper |
| Gastransport | Carboanhydrase und Bicarbonatsystem | Cornell + Doyle/Cooper + Rice |
| Nervenzelle | Soma/Dendrit/Axon; multipolar als Modell | UTHealth + Purves + Minnesota + Merck Vet |
| Nervenzelle | Periphere Nervenfasern und Schwannzellen | Minnesota + Washington University |
| Zentrale/Peripherie | ZNS/PNS und anatomische Einordnung | Merck Vet + Rice + Minnesota |
| Zentrale/Peripherie | Afferent/efferent; lokale und weiterleitende Schaltung | Rice + Merck Vet + Purves |
| Dehnungsreflex | Muskelspindel und afferente Dehnungsmeldung | Purves + Walkowski/Munakomi |
| Dehnungsreflex | Direkter zentraler monosynaptischer Erregungsweg | Purves + Walkowski/Munakomi + MeSH |
| Dehnungsreflex | Interneuronvermittelte Gegenspielerhemmung | Purves + Rice |
| Chemische Synapse | Vesikel, Spalt, Transmitter und Rezeptor | UTHealth + Purves + Merck Vet |
| Chemische Synapse | Erregung/Hemmung, Rezeptorabhängigkeit, elektrische Alternative | UTHealth + Purves + Alberts |

## Bewusst eingegrenzte Aussagen

Keine feste Lungenlappung, respiratorische Bronchiolenausstattung, Atemfrequenz, Gastransportquote oder universelle Ruhausatmungsmechanik. Humanquellen erklären nur konservierte Vorgänge und ersetzen keine artspezifischen Befunde. Die zu einfache Nervenzellbeschreibung des Merck-Haltertextes wird durch das ausdrücklich multipolare Modell ersetzt; Ausnahmen werden benannt. Monosynaptisch bezeichnet den direkten zentralen Erregungsweg, nicht sämtliche Kontakte einschließlich neuromuskulärer Endplatte oder indirekter Gegenspielerhemmung. Ein Reflex ist kein Beleg für Bewusstsein, Schmerzfreiheit oder Gesundheit; keine Anleitung zu Reflexprovokation.

Keine künstlichen Lehrbilder, Fremdaufgaben oder Behandlungen. Alle Fragen und Beispiele wurden selbst formuliert. Richtige Antwort und Erklärung sind auch ohne die drei falschen Alternativen verständlich.

## Technische Eigenprüfung

`prepareEvidenceModules` verarbeitet beide Module ohne Fehler. Acht Lektionen mit je vier zugeordneten Fragen, jeweils mehr als 600 Zeichen Wissenstext, eindeutige IDs, vier verschiedene Antwortoptionen, genau ein gültiger Antwortindex und Quellenmatrix geprüft. Beide Antwortpositionsverteilungen sind 4/4/4/4 und nicht zyklisch. Gegenüber dem bestehenden geladenen Curriculum sowie untereinander: keine identischen normalisierten Fragestämme. Über den tatsächlichen Flashcardadapter mit normalisierten neuen Modulen entstehen **32 von 32** eigene Lernkarten, alle mit Lektionsquellen und mindestens zwei Links. Dies prüft Struktur und Darstellbarkeit, nicht fachliche Unfehlbarkeit. Kein Build, Commit oder Push durch diesen Autor.
