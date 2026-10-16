# Unabhängige Gegenprüfung des Biologiepakets

Prüfer: Agent `expand_practice_health`, kein Autor des geprüften Pakets. Tatsächlicher Prüfstand: **16. Oktober 2026**.

Geprüft: `data/learning-expansion-biology-2026-10-16.json` und dessen Autorenbericht. Finaler geprüfter SHA-256 der JSON:

`b25555f1d9f69d6815b249115e184ec59ce5e39de7b3dd17c421b6d016cc7700`

## Ergebnis und Umfang

Alle 24 Lektionstexte und alle **192 Fragen einschließlich der jeweils vier Optionen, des Antwortschlüssels und der Erklärung** gelesen. Die konkreten anatomischen, physiologischen und entwicklungsbiologischen Kernaussagen aller sechs Kurse anhand der unten genannten Originalveröffentlichungen beziehungsweise institutionellen Originallehrangebote gegengeprüft. Keine verbleibende falsche richtige Antwort oder fachlich blockierende Kernaussage gefunden.

Ein präziser Befund wurde während der Prüfung gemeldet und vom Autor behoben: Die gesamte Riechschleimhaut ist kein reines Nervengewebe. Der endgültige Titel **„Riechschleimhaut: Sinneszellen im spezialisierten Epithel“** unterscheidet das Epithel und seine Sinneszellen vom gesamten Schleimhautkomplex korrekt. Der finale Hash enthält diese Änderung.

Keine fremde Inhaltsdatei geändert; kein App-Test erneut ausgeführt. Root hatte die gezielten Integrations- und Release-Tests bereits ausgeführt. Diese Prüfung ist eine fachliche Gegenlesung des begrenzten Pakets, keine medizinische Zertifizierung und keine vollständige Prüfung der gesamten App.

## Geprüfte Kernaussagen und Quellen

### Wiederkäuer

Mikrobielle Cellulase statt körpereigener Säugetier-Cellulase, Fermentation zu flüchtigen Fettsäuren, Aufnahme über Pansenwand und Propionat als Glucosevorstufe stimmen mit den gegengelesenen physiologischen Abschnitten überein. Mikrobenprotein und nicht im Pansen abgebautes Nahrungsprotein bleiben unterscheidbar. Wiederkauen ist vom Aufstoßen der Gase getrennt. Das Kälbermodell zur Schlundrinne und Entwicklung wird im Text nicht als identischer Altersplan für Reh oder Gams ausgegeben.

- [Minnesota: Fermentation](https://open.lib.umn.edu/vetphysioapplied/chapter/fermentation/) — relevante Originallehrabschnitte im Webindex gelesen; direkter Abruf war zeitweise gestört.
- [Colorado State: Microbial fermentation](https://vivo.colostate.edu/hbooks/pathphys/digestion/largegut/ferment.html) — institutioneller Originallehrtext zu mikrobieller Celluloseverwertung und Fettsäuren gegengelesen. Die Grundprinzipien stützen den im Paket angegebenen CSU-Physiologiekomplex.

Die bei Minnesota vorhandene verkürzte Nebenformulierung zur Harnstoff-/Proteinbildung ist im Paket nicht übernommen; keine unbelegten festen Fettsäurequoten oder Wildtierfütterungspläne gefunden.

### Feldhase, Schwein und Vogel: Verdauungsvergleich

Feldhase und Kaninchen nutzen Blinddarmfermentation und Caecotrophie, unterscheiden sich aber in ihren Strategien. Weichkotaufnahme wird nicht mit Wiederkauen gleichgesetzt. Die Beschreibung behauptet keine identischen Organproportionen, Passagezeiten oder Nährstoffquoten. Der Schweinemagen ist einhöhlig zusammengesetzt; kleiner drüsenloser Eingangsbereich und Diverticulum sind anatomisch korrekt. Vogel-Drüsenmagen und Muskelmagen sind getrennt, ein Kropf wird nicht jeder Vogelart zugeschrieben.

- [Miśta und andere: Vergleich der Blinddarmgärung von Hase und Kaninchen](https://link.springer.com/article/10.1007/s13364-018-0357-1) — Originalvolltext, einschließlich Methoden, Ergebnisse und Diskussion gelesen. Abweichende Proportionsbefunde wurden nicht universalisiert.
- [Kuijper und andere: Digestive strategies in two sympatrically occurring lagomorphs](https://zslpublications.onlinelibrary.wiley.com/doi/10.1017/S0952836904005722) — Originalabstract gelesen; unabhängig von der späteren Miśta-Arbeit. Belegt Blinddarmgärung, Weichkotaufnahme und unterschiedliche Strategien.
- [Universität Zürich: Anatomie des Digestitionsapparates beim Schwein](https://www.ictvet.uzh.ch/US_Schwein/html/git1.htm) — Originallehrtext direkt gelesen.
- [Minnesota: Abdomen 1, Equine and Porcine](https://pressbooks.umn.edu/largeanimalanatomy/chapter/abdomen-1/) — relevante Originalabschnitte im Webindex gelesen; direkter Abruf lieferte 403.
- [Colorado State: Digestive anatomy and physiology of birds](https://vivo.colostate.edu/hbooks/pathphys/digestion/birds.html) und [PoultryHub: Digestive system](https://www.poultryhub.org/anatomy-and-physiology/body-systems/digestive-system) — Originallehrabschnitte im Index gegengelesen, insbesondere Kropfvariation, Proventriculus, Gizzard und Duodenum.

### Vogelkörper

Oberarm/Unterarm, Furcula und die räumliche Zuordnung der Flugmuskeln sind korrekt. Pectoralis senkt, Supracoracoideus hebt den Flügel über eine umgelenkte Sehne. Nicht alle Knochen werden als hohl beschrieben. Luftsäcke übernehmen Ventilation; die Lunge mit Parabronchien, Luft- und Blutkapillaren den wesentlichen Gasaustausch. Die fehlende Säugetier-Zwerchfelltrennung und Beteiligung von Brustbein/Rippen sind stimmig. Syrinxstimme wird von Spechttrommeln beziehungsweise Federgeräuschen getrennt; keine allgemeine Zweistimmenfähigkeit behauptet.

- [PoultryHub: Skeletal system](https://www.poultryhub.org/anatomy-and-physiology/body-systems/skeletal-system) — direkt gelesene Abschnitte zu Flügel, Furcula, Brustbein und Pneumatisation.
- [OpenStax Biology 2e: Birds](https://openstax.org/books/biology-2e/pages/29-5-birds) — relevante Originalabschnitte im Index gelesen; bestätigt insbesondere beide Flugmuskeln und die Sehnenumlenkung. Dies ist dieselbe Lehrtextfamilie wie die im Paket genannte Hawaiʻi-Spiegelung, keine zusätzliche unabhängige Replikation.
- [PoultryHub: Respiratory system](https://www.poultryhub.org/anatomy-and-physiology/body-systems/respiratory-system-thermoregulation) — direkt gelesen: Parabronchien, getrennte Kapillarsysteme, geringe Luftsackdurchblutung, fehlendes Zwerchfell, Inspiration/Expiration.
- [UConn: Respiration and circulation](https://rubegalab.uconn.edu/2016/03/07/lecture-notes-respiration-and-circulation/) — direkt gelesener eigenständiger universitärer Lehrtext zu Luftstrom und Luftsäcken.
- [UConn: Visual and vocal communication](https://rubegalab.uconn.edu/eeb-4260-visual-and-vocal-communication/) — direkt gelesen: Syrinxlage, Luftstrom, vibrierendes Gewebe, Muskelkontrolle, Variation und mechanische Lauterzeugung.

Die breiten Vogellehrseiten enthalten vereinfachte oder problematische Nebenformulierungen; keine Übernahme solcher Universalzahlen oder vereinfachter Evolutions-/Leistungsbehauptungen in den geprüften Texten gefunden.

### Fortpflanzung

Die Rehdiapause betrifft eine bereits befruchtete Blastozyste im Uterus, keine bis zum Winter verschobene Befruchtung. Sehr langsame Weiterentwicklung ist durch die Originalbefunde gedeckt. Kotyledon ist fetal, Karunkel mütterlich, gemeinsam Plazentom. Diffuse Schweine- und zonäre Hundeplazenta sind korrekt; getrennte Kreisläufe werden nicht mit fehlendem Austausch verwechselt. Aufbau und Bildung des Eies sind ausdrücklich am Huhn erklärt. Ovulation, Befruchtung und Eiablage werden unterschieden; Infundibulum, Magnum, Isthmus, Schalendrüse und Ablageweg sind richtig zugeordnet.

- [Rüegg und andere 2024](https://www.nature.com/articles/s42003-024-05944-w), [Originalvolltext bei PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10914810/) — Ergebnisse und Diskussion im indexierten Originaltext gelesen: langsame fortlaufende Proliferation und Differenzierung.
- [Aitken 1975, Originalabstract](https://pubmed.ncbi.nlm.nih.gov/166066/) — gelesen; unabhängige ältere Ultrastruktur und progressive Vergrößerung, keine identische molekulare Replikation der neueren Arbeit.
- [Colorado State: Ruminant placenta](https://vivo.colostate.edu/hbooks/pathphys/reprod/placenta/ruminants.html) — relevante Originalabschnitte im Index gelesen.
- [Drost/University of Florida: Normal placenta](https://visgar.vetmed.ufl.edu/en_bovrep/normal-placenta/normal-placenta.html) — direkt gelesene Originalpräparate und Erläuterung zu Karunkel/Kotyledon/Plazentom sowie Gefäßsystemen.
- [UCSD: Comparative placentation](https://placentation.ucsd.edu/placenta.html) — direkt gelesen: vergleichende Kontaktverteilung und trennende Gewebeschichten.
- [PoultryHub: The avian egg](https://www.poultryhub.org/anatomy-and-physiology/the-avian-egg) und [Kentucky: The egg and I](https://afs.mgcafe.uky.edu/files/eggandi.pdf) — Originaltexte/Diagrammbeschriftung gelesen: Dotter/Eiklar, Häute, Luftkammer, Calciumcarbonat und Poren.
- [Penn State: Hen reproduction](https://extension.psu.edu/hen-reproduction) — zusätzlicher unabhängiger Originallehrtext im Index gegengelesen: Befruchtungsort und Funktionen der Eileiterabschnitte. Keine zusätzlichen Zeitkonstanten übernommen.

### Hundegebiss

Alle Formelfragen selbst nachgerechnet: 2 × (3/3 + 1/1 + 4/4 + 2/3) ergibt 42, davon 20 oben/22 unten; Milchformel 2 × (3/3 + 1/1 + 3/3) ergibt 28, jeweils 14 pro Kiefer. Vier Eckzähne und 16 Prämolaren stimmen. P1 und Molaren haben keine Milchvorgänger. Schmelz, Dentin, Pulpa, Zement und Zahnhalteapparat sind korrekt getrennt. Reißzähne oberer P4/unterer M1 werden nicht mit Eck-/Fangzähnen verwechselt. Mesial, lingual und palatinal sind passend definiert.

- [Merck: Dental development of dogs](https://www.merckvetmanual.com/dog-owners/digestive-disorders-of-dogs/dental-development-of-dogs) — direkt gelesen, 28/42; [MSD: Dental development in animals](https://www.msdvetmanual.com/digestive-system/dental-development-and-anatomy/dental-development-in-animals) — direkt gelesener Abschnitt zum fehlenden Milchvorgänger. Merck/MSD nicht unabhängig gezählt.
- [WSAVA Global dental guidelines 2020](https://onlinelibrary.wiley.com/doi/abs/10.1111/jsap.13132) — zusätzliche Originalleitlinie, im Index abgedruckte Hundezahnformeln gegengelesen. Verwendet wurde die veröffentlichte Fassung, nicht der als interner Reviewentwurf bezeichnete andere Suchtreffer.
- [AAHA: Anatomy and pathology](https://www.aaha.org/resources/2019-aaha-dental-care-guidelines-for-dogs-and-cats/anatomy-pathology-2/) — direkt gelesene Gewebe- und Halteapparatabschnitte.
- [AVDC: Nomenclature](https://avdc.org/avdc-nomenclature/) — direkt gelesene Abschnitte zur Richtungs- und Gewebenomenklatur.
- [Open University: Carnivora](https://www.open.edu/openlearn/mod/oucontent/view.php?id=2225&section=2.2) — direkt gelesener Reißzahnabschnitt. Die fehlerhafte benachbarte Katzenformel zählt ausdrücklich nicht als bestätigter Inhalt.

### Hundesinne

Riechrezeptoren, Stütz-/Basalzellen, Zilien und Bowman-Drüsen stimmen mit Mikroskopie überein. CFD-Strömungsmodell und Sinnesleistung werden korrekt auseinandergehalten. Augenstrukturen und Zweizapfen-Dichromatie sind konsistent; keine Behauptung reinen Schwarzweißsehens. Ohrabschnitte, drei Knöchelchen, Steigbügel/ovales Fenster, Cochlea, Gleichgewicht und Tuba auditiva sind richtig. Vibrissen werden als mechanosensorischer Follikelapparat mit Bluträumen beschrieben, nicht als nervenhaltige freie Haarspitze.

- [Craven und andere: Fluid dynamics of canine olfaction](https://pmc.ncbi.nlm.nih.gov/articles/PMC2871809/) — Originalvolltext gelesen; Modellgrenzen beachtet.
- [Kavoi und andere: Olfactory mucosa](https://pubmed.ncbi.nlm.nih.gov/20801626/) — Originalabstract direkt gelesen; unabhängige Histologie bestätigt Zelltypen, Zilien, Drüsen und Lamina propria.
- [Siniscalchi und andere: Are dogs red-green colour blind?](https://pmc.ncbi.nlm.nih.gov/articles/PMC5717654/) — Originalabschnitte im Index gelesen. Der Neitz-DOI-/PubMed-Direktabruf war hier gestört; dessen Befunde nicht als neu vollständig selbst gelesener Volltext ausgegeben. Die 2017-Arbeit trägt die aktuelle Dichromatieaussage und beschreibt die unabhängige ältere Versuchslinie.
- [Cole: Anatomy and physiology of the canine ear](https://pubmed.ncbi.nlm.nih.gov/20230592/) — Originalabstract direkt gelesen; enthält Trommelfell, Mittelohr, drei Knöchelchen, ovales Fenster und Ohrtrompete.
- [Döring und andere 2025: Canine vibrissal system](https://pmc.ncbi.nlm.nih.gov/articles/PMC11914073/) und [Müller und andere 2026: Follicle-sinus complexes](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0355554) — relevante Originalabschnitte im Index gelesen. Überlappende Autorengruppe, nicht zwei unabhängige Replikationen.
- [Ramírez und andere 2016: Merkel cells in dog skin and mucosae](https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.23387) — Originalabstract und Ergebnisabschnitt im Index gelesen. Unabhängige regionale Kartierung, starke Vorkommen in Gesichts-/Maulregion; Ballen liegen in der mittleren Dichtegruppe. Das Paket behauptet für die Ballen keinen Spitzenrang oder universellen Dichtewert.

## Grenzen der Gegenprüfung

Die Quellen wurden gezielt auf Kernclaims gelesen, nicht alle 56 Quellen des Autoreninventars vollständig von Anfang bis Ende erneut geöffnet. Originalabstract, direkt gelesener Volltext und indexierter Originalabschnitt sind oben getrennt bezeichnet. Zeitweilige 403-/Timeout-/Bot-Probleme sind keine Bestätigung des nicht sichtbaren Textes. Auch mehrere institutionelle Quellen zum selben Lehrstoff sind keine mehrfach wiederholten Experimente.

Die Fragen sind überwiegend selbstständige positive Abruffragen mit eindeutigen Antworten. Einige einfache Anatomiefragen verwenden bewusst leicht erkennbare Organverwechslungen; daraus folgt kein Sachfehler, aber kein gleichmäßig hoher Schwierigkeitsgrad aller 192 Fragen. Antwortpositionen sind in den Daten ausgeglichen; die Laufzeit-Mischung und tatsächliche Bildschirm-/Druckdarstellung wurden in dieser fachlichen Prüfung nicht erneut ausgeführt.
