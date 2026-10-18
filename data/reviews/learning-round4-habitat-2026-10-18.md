# Habitat-Runde 4: botanisches Wissen, 18. Oktober 2026

Tatsächlich inhaltlich geprüft am 2026-10-18. Autorstand SHA256: `8f307ca0c706d3686caf37ba79b08ca742f7196c022ada4f82ca2f64c2ab1f28`. Die Prüfung gilt ausschließlich für diese neuen Lektionen und ihre passenden bestehenden Anschlussstellen, nicht für eine vollständige Neuprüfung der App.

## Ergebnis und Umfang

Drei neue Kurse, zwölf Lektionen mit insgesamt 36 unmittelbar lesbaren Wissensabsätzen. Jede Lektion besitzt ein eigenes Vergleichs-/Anwendungsmodell und nur eine ergänzende Frage: zwölf Fragen und zwölf tatsächliche Lernkarten. Die Wissensabsätze umfassen je Lektion 1147–1664 Zeichen; fachlicher Umfang wird nicht mit der Zahl der Quizvarianten verwechselt. Keine neuen Fotos, Videos, Grafiken oder fremden Aufgaben.

## Bestandsaudit und Abgrenzung

Vor der Themenwahl wurden die 168 damals geladenen Kurse inventarisiert und die Lektionstitel der verwandten Wald-, Natur- und Landwirtschaftsbereiche gelesen. Zusätzlich wurden Quellen-/Kursdateien nach Blattstellung, Blattspreite, Blattgliedern, Blattrand, Familiennamen, Lebensdauer und Speicherorganen durchsucht; die bekannte Phantomdatei wurde ausgeschlossen. Bereits vorhandene Holz-/Blattfunktionen, Winterknospen, Blüten-/Samen-Grundlagen, Moose, Farne, Gräser, Pilze/Flechten, Nährstoff- und Bodenwasserlehren werden hier nicht als neuer Vollbestand wiederholt.

Die Lücke liegt im zusammenhängenden morphologischen Beschreiben: ganzes Blatt gegenüber Blättchen; Stellung, Nervatur und Rand als getrennte Merkmale; Lebensdauer gegenüber Bauzustand; Organspeicher unterschiedlicher Herkunft; Familienbau gegenüber Einzelblüte/Blütenstand. Vorhandene Angaben zu gegenständigen Eschen-/Ahornknospen und gefiederten Eschenblättern widersprechen den neuen Modellen nicht. Die Familienmodelle ersetzen keine vollständigen europäischen Artenschlüssel. Regionale Kultur-/Bekämpfungsregeln aus US-Lehrseiten werden nicht auf DACH übertragen.

## Quellenverfahren und Zugangsgrenzen

24 verschiedene Original-URLs sind registriert. Mehrere URLs einer Institution werden nicht als unabhängige Bestätigungen gezählt. Für die einfachen morphologischen Merkmale wurden Museum, verschiedene botanische Ausbildungsinstitutionen, universitäre Extension und botanische Gärten kombiniert. Die engen, teilweise nahezu gleichlautenden Passagen der Oregon-/North-Carolina-Lehrtexte werden nicht allein als unabhängiges Belegpaar ausgegeben; AMNH, Texas, Illinois, Hamburg, RHS oder Maryland tragen die passenden zweiten Perspektiven. Die Claim-genauen Paare stehen im JSON unter `evidence` und werden durch den regulären Adapter den Lektionen zugeordnet.

Originalseiten wurden in ihren konkret verwendeten Abschnitten tatsächlich gelesen. Ausnahme beim Zugangsweg: Penn State liefert beim Direktabruf 403; der vollständige Original-Suchindex enthielt den gelesenen Lebenszyklusabschnitt. Er belegt ausschließlich Herbstkeimung/Überwinterung und Abschluss im folgenden Frühjahr bzw. Frühsommer. Keine weiteren dortigen Futter-, Gift-, Bekämpfungs- oder Regionalbehauptungen wurden übernommen. Das vollständige UC-Davis-Lab-6-Original wurde direkt als HTML abgerufen und in den Familienabschnitten gelesen, weil die Web-Textansicht zeitweise unvollständig war.

Der historische Hamburger Text wird nur für klar abgeglichene Morphologie benutzt. Die dortige Verwechslung zweizeilig/gegenständig sowie fehlerhafte Fibonacci-Brüche wurden ausdrücklich nicht übernommen. Ein anderer recherchierter Gartenbeitrag nennt Cyclamen irrtümlich als Kormus-Beispiel; er wurde nicht als Quelle registriert. Dies sind ausgeschlossene externe Formulierungen, keine als Fehler bestätigten Jagdlatein-Bestandsstellen.

Die Hawaii-Familientexte und die Davis-Labtexte sind hinsichtlich einfacher Baupläne brauchbar, enthalten aber historische Taxonomie und regionale Beispiele. Familiengrößen, alte Gattungsgrenzen, pauschale Arzneiwirkungen und Bilder bleiben ausgeschlossen. Für Apiaceae wurden die ausdrücklich benannte Kew-Handbuchfassung von 2023 und die Sydney-Familienbeschreibung gegengeprüft; andere, teils zusammengeführte historische POWO-Beschreibungen gelten nicht als weitere unabhängige Quelle. Auch die alte Gattungsabgrenzung in PlantNET wird nicht übernommen.

## Fachliche Geltungsgrenzen

- Einfache Blätter können gelappt sein; Nervatur, Stellung und Gliederung werden nicht gleichgesetzt. Zweizeilig und gegenständig sind verschiedene Merkmale. Keine starre Einschnitttiefenformel.
- Vegetationsperiode und Kalenderjahr sind verschieden. Rosette und Schossen beschreiben Bau-/Entwicklungszustände; sie beweisen für sich allein weder Lebensdauer noch feste Blühfrist. Saisonaler Triebverlust ist kein Beweis für den Tod des Individuums.
- Zwiebel, Kormus, Spross- und Wurzelknolle werden nach Organbau unterschieden. Keine Aussagen zu Vermehrungsverfahren, Ausgraben, Winterhärte oder Verwendung unbekannter Wildorgane.
- Familienmerkmale gelten ausdrücklich als typische Kombinationen mit Ausnahmen. Ober-/Unterlippe, Köpfchenhülle/Pappus und Dolde/Doppeldolde liegen auf benannten unterschiedlichen Bauebenen. Keine Familienzugehörigkeit allein aus Farbe, Aroma oder Stängelquerschnitt; keine Art-, Arznei- oder Verzehrfreigabe.
- Alle Modelle, Fragefassungen, Antwortalternativen und erklärenden Texte sind eigene Formulierungen; keine fremden Lehrfragen, Diagramme oder Fotos übernommen.

## Technische Prüfung, getrennt von der Fachprüfung

Der echte `prepareReviewedEvidenceModules`-Adapter wurde mit diesem Datensatz ausgeführt. Bestanden: 3 Kurse, je4 Lektionen/Fragen, 3 Absätze je Lektion, präzise `lessonId` je Frage, vier verschiedene Alternativen und genau eine richtige Position. Positionen nullbasiert: 2/0/3/1, 1/3/0/2 und 3/1/2/0; je Kurs jede Position genau einmal, ohne zyklische Wiederholung.

Die echte `getFlashcardExport()`-Pipeline wurde mit den adaptierten Modulen ausgeführt: 4+4+4 Karten, jede mit mindestens zwei zugeordneten Lektionenquellen, Prüfdatum und direktem Lektionenanker. Der Vergleich aller zwölf normalisierten Fragen gegen den aktuellen Bestand (eigene Round-4-Modul-IDs ausgeschlossen) ergab null identische Fragen; auch untereinander keine identischen normalisierten Stämme. Inhaltliche Abgrenzung wurde zusätzlich redaktionell vorgenommen. Diese Strukturprüfungen bescheinigen keine allgemeine Fehlerfreiheit. Kein Build, Commit oder Push durch diesen Autor.

## Konkrete Claim-Gruppen

### Laubblätter lesen: Stellung, Gliederung und Merkmale
- **Ein ganzes Blatt ist mehr als eine grüne Teilfläche** (`blatt-oder-blaettchen`): Spreite, Blattstiel und Ansatz am Spross sind verschiedene Strukturen; sitzende Blätter ohne abgesetzten Stiel. Einfache Blätter können gelappt, zusammengesetzte in Blättchen gegliedert sein. Achselknospen sitzen am ganzen Blattansatz, nicht an Blättchen. Gefiederte Blättchen stehen an einer Achse, handförmige an einem gemeinsamen Ansatzbereich. Das Fünf-Blättchen-Modell ist eine eigene Anwendung.
- **Die Blattstellung wird am Knoten gelesen** (`blattstellung`): Wechselständig: ein Blatt je Knoten; gegenständig: zwei gegenüber; quirlig: mindestens drei. Die Blättchen eines zusammengesetzten Blattes sind keine weiteren ganzen Blätter am Sprossknoten. Wechselständigkeit kann schraubig oder zweizeilig sein; dekussiert bedeutet ungefähr rechtwinklig gegeneinander gedrehte aufeinanderfolgende Blattpaare. Das Achsenmodell ist eine eigene Anwendung.
- **Blattadern bilden ein Muster innerhalb der Spreite** (`nervatur`): Nervatur ist die Anordnung leitbündelhaltiger Blattadern. Fiedernervig: Seitenadern an Hauptader; handnervig: mehrere kräftige Adern aus basalem Bereich. Von Blattgliederung unterscheiden. Annähernd parallele kräftigere Adern können feinere Querverbindungen besitzen. Das eigene Modell einer einfachen fiedernervigen Spreite ist kein zusammengesetztes Blatt.
- **Umriss, Rand und Einschnitte getrennt notieren** (`umriss-rand`): Eiförmig, verkehrt eiförmig, lanzettlich und linealisch beschreiben Umrisse; ganzrandig, gesägt, gekerbt und doppelt gesägt betreffen den Rand. Einfache Blätter können gelappt sein; eigene Merkmalsnotiz trennt Gliederung, Umriss und Rand, ohne vollständige Artbestimmung daraus abzuleiten.

### Krautpflanzen durchs Jahr: Lebensdauer, Rosetten und Speicherorgane
- **Einjährig und zweijährig beschreiben den Lebensweg** (`lebenszyklus`): Einjährige schließen den Zyklus in einer Vegetationsperiode ab, Zweijährige typischerweise in zwei; Ausdauernde leben länger. Überwinternde Einjährige zeigen die Grenze reiner Kalenderjahreszählung. Krautige und verholzte Ausdauernde sind möglich; saisonales Absterben oberirdischer Teile ist nicht zwingend Tod des ganzen Individuums. Eigenes Verlaufsmodell, keine universelle Blühgarantie.
- **Aus einer Rosette kann eine gestreckte Blütenachse werden** (`rosette-schossen`): Grundständige Rosetten besitzen dicht folgende Knoten mit stark verkürzten Internodien, keine fehlende Sprossachse. Bei vielen zweijährigen Kräutern folgt eine gestreckte blütentragende Achse; Grund- und Stängelblätter können verschieden sein. Bauzustand allein bestimmt keine Lebensdauer.
- **Echte Zwiebel und massive Sprossknolle speichern in verschiedenen Geweben** (`zwiebel-kormus`): Echte Zwiebel: kurze Sprossbasis mit fleischigen Speicherblättern/-basen. Kormus: massives verdicktes Sprossgewebe mit möglichen trockenen Blattresten. Krokus und Gladiole sind Kormus-Beispiele; gärtnerischer Sammelbegriff umfasst verschiedene Organbauten. Das Schnittmodell ist eine eigene Anwendung, keine Kultur-/Verzehrfreigabe.
- **Kartoffel und Süßkartoffel zeigen verschiedene Speicherorgane** (`spross-wurzelknolle`): Kartoffel: Sprossknolle mit Knospen an Augen/Knotenbereichen. Süßkartoffel: verdickte Speicherwurzel. Dahlien besitzen Speicherwurzeln ohne regelmäßige Knoten-/Internodiengliederung einer Sprossachse. Organherkunft, Speicherfunktion und praktische Vermehrung werden getrennt.

### Vier Pflanzenfamilien im Revier: Blütenbau und Merkmalskombinationen
- **Kreuzblütler: Blüte und Frucht gemeinsam lesen** (`kreuzbluetler`): Typischer Brassicaceae-Blütenbau: vier freie kreuzförmige Kronblätter, vier Kelchblätter, sechs Staubblätter mit vier längeren/zwei kürzeren; konkretes Kohl-Beispiel, keine universelle Regel. Oberständiger zweikarpelliger Fruchtknoten; Schote/Schötchen häufig zweiklappig mit Scheidewand, dabei abweichende Fruchttypen möglich. Eigenes Kombinationsmodell, kein Artenschlüssel.
- **Lippenblütler: Merkmale bündeln statt nur den Stängel fühlen** (`lippenbluetler`): Viele krautige Lamiaceae verbinden gegenständige Blätter, vierkantige Achsen und häufig aromatische Merkmale, mit Ausnahmen innerhalb der Familie. Häufig verwachsene zweilippige Krone mit fünf Zipfeln (zwei oben/drei unten), vier oder zwei Staubblätter sowie oberständiger tief vierlappiger Fruchtknoten und meist vier einsamige Teilfrüchte. Eigenes Kombinationsmodell, keine Nutzungsfreigabe.
- **Korbblütler: viele Einzelblüten in einem Köpfchen** (`korbbluetler`): Asteraceae-Köpfchen: viele Einzelblüten auf gemeinsamem Boden, umgeben von Hüllblättern; Röhren- und zungenförmige Blüten können in unterschiedlichen Kombinationen auftreten. Kelch der Einzelblüte kann fehlen oder als Pappus aus Haaren/Borsten/Schuppen vorliegen; unterständiger Fruchtknoten mit einer Samenanlage im typischen fruchtbildenden Bau, daneben männliche oder sterile Einzelblüten möglich. Pappus und Köpfchenhülle sind nicht dieselben Organe; eigenes Ebenenvergleichsmodell.
- **Doldenblütler: zwei Verzweigungsebenen erkennen** (`doldenbluetler`): Einfache Dolde: gestielte Blüten aus gemeinsamem Ansatz; Doppeldolde: Strahlen tragen Döldchen. Apiaceae besitzen häufig zusammengesetzte Dolden, mit einfachen und kopfigen Ausnahmen sowie möglichen Hüll-/Hüllchenblättern. Apiaceae-Blätter meist wechselständig, häufig geteilt und scheidiger Stielbasis, aber variable Gestalt; typischer fünfzähliger Blütenbau, unterständiger meist zweikarpelliger Fruchtknoten und zwei einsamige Teilfrüchte. Eigenes Strukturvergleichsmodell ohne Art-/Nutzungsbestimmung.

## Tatsächlich verwendete Originalquellen

Jede Quelle ist zusätzlich im JSON mit konkretem Verwendungsbereich registriert. Die folgende Liste zählt Seiten, keine unabhängigen Messungen oder Zertifikate.
- [AMNH: Plant Morphology – Leaf Type](https://www.amnh.org/learn-teach/curriculum-collections/biodiversity-counts/plant-identification/plant-morphology/leaf-type) – American Museum of Natural History.
- [NC State Extension Gardener Handbook: 3. Botany](https://content.ces.ncsu.edu/extension-gardener-handbook/3-botany) – North Carolina State University Extension.
- [UT Austin: Botany Basics – Understanding Leaves](https://biodiversity.utexas.edu/news/features/botany-basics-understanding-leaves) – University of Texas at Austin, Biodiversity Center.
- [University of Illinois: UIPlants – Botanic Terminology](https://woodyplantstutorial.nres.illinois.edu/glossary.asp) – University of Illinois at Urbana-Champaign.
- [Oregon State University: Vegetative plant parts, EM 9904](https://extension.oregonstate.edu/catalog/em-9904-vegetative-plant-parts) – Oregon State University Extension.
- [Universität Hamburg: Botanik online – Blätter (Archiv)](https://www-archiv.fdm.uni-hamburg.de/b-online/d02/02c.htm) – Universität Hamburg, Archiv von Peter von Sengbusch.
- [Oregon State University: Know the life cycles of plants, EM 9899](https://extension.oregonstate.edu/catalog/em-9899-know-life-cycles-plants-annuals-biennials-perennials) – Oregon State University Extension.
- [Royal Horticultural Society: How plants age](https://www.rhs.org.uk/advice/understanding-plants/how-plants-age) – Royal Horticultural Society.
- [South Dakota State University: Biennial Weed Species Have Started to Emerge](https://extension.sdstate.edu/biennial-weed-species-have-started-emerge) – South Dakota State University Extension.
- [University of Maryland Extension: Bulbs – Botanically speaking](https://extension.umd.edu/resource/bulbs) – University of Maryland Extension.
- [Royal Horticultural Society: How to grow bulbs – What are bulbs?](https://www.rhs.org.uk/plants/types/bulbs/growing-guide) – Royal Horticultural Society.
- [University of Illinois Extension: How sweet it is growing sweet potatoes, 17.04.2026](https://extension.illinois.edu/blogs/good-growing/2026-04-17-how-sweet-it-growing-sweet-potatoes) – University of Illinois Extension.
- [Penn State Extension: Weed Management in Pasture Systems](https://extension.psu.edu/weed-management-in-pasture-systems) – Pennsylvania State University Extension.
- [University of Hawaiʻi: Brassicaceae](https://manoa.hawaii.edu/lifesciences/faculty/carr/brassic.htm) – University of Hawaiʻi at Mānoa, Gerald D. Carr.
- [UC Davis PLB 102: Lab 3, Brassicaceae](https://psfaculty.plantsciences.ucdavis.edu/courses/plb102/lab3.html) – University of California, Davis, Department of Plant Sciences.
- [NC State Plant Toolbox: Brassica oleracea](https://plants.ces.ncsu.edu/plants/brassica-oleracea/) – North Carolina State University Extension.
- [University of Hawaiʻi: Lamiaceae](https://manoa.hawaii.edu/lifesciences/faculty/carr/lami.htm) – University of Hawaiʻi at Mānoa, Gerald D. Carr.
- [UC Davis PLB 102: Lab 5, Lamiaceae](https://psfaculty.plantsciences.ucdavis.edu/courses/plb102/lab5.html) – University of California, Davis, Department of Plant Sciences.
- [University of Hawaiʻi: Asteraceae](https://manoa.hawaii.edu/lifesciences/faculty/carr/aster.htm) – University of Hawaiʻi at Mānoa, Gerald D. Carr.
- [UC Davis PLB 102: Lab 6, Asteraceae und Apiaceae](https://psfaculty.plantsciences.ucdavis.edu/courses/plb102/lab6.html) – University of California, Davis, Department of Plant Sciences.
- [Kew: Apiaceae, Temperate Plant Families Identification Handbook](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:30000180-2/general-information) – Royal Botanic Gardens, Kew.
- [PlantNET: Apiaceae, Flora of New South Wales](https://plantnet.rbgsyd.nsw.gov.au/cgi-bin/NSWfl.pl?lvl=fm&name=apiaceae&page=nswfl) – Royal Botanic Gardens and Domain Trust, Sydney.
- [Universität Hamburg: Botanik online – Blütenstände (Archiv)](https://www-archiv.fdm.uni-hamburg.de/b-online/d02/02e.htm) – Universität Hamburg, Archiv von Peter von Sengbusch.

- [PlantNET: Asteraceae, Flora of New South Wales](https://plantnet.rbgsyd.nsw.gov.au/cgi-bin/NSWfl.pl?lvl=fm&name=Asteraceae&page=nswfl) – Royal Botanic Gardens and Domain Trust, Sydney.

## Unabhängiger Kreisreview

Unabhängiger Biologieautor hat am finalen JSON-SHA oben alle zwölf Lektionen, richtigen Antworten und Erklärungen gegengelesen und passende Originalquellen erneut geprüft: AMNH, UT Austin, Illinois-Glossar, Oregon, Maryland, SDSU, Hawaii-Familien, UC Davis Lab 3/5/6, Kew 2023 und PlantNET. Nach der unten dokumentierten Korbblütler-Präzisierung meldete er keine verbleibenden fachlichen Blocker. Dies ist ein konkreter Kreisreview dieses Datensatzes, keine Vollzertifizierung der App.

Erster konkreter Kreisreviewbefund umgesetzt: Im Korbblütlertext ist der Fruchtknotenbau jetzt ausdrücklich auf den typischen fruchtbildenden Bau eingegrenzt; männliche/sterile Einzelblüten werden nicht übergangen. Zusätzlich direkt gegen PlantNET Asteraceae gegengelesen und als passende weitere Quelle registriert. Fragen und richtige Antworten bleiben unverändert.
