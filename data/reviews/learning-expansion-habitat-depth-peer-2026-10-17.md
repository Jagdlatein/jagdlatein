# Unabhängige Gegenprüfung: Habitat-Vertiefung, 17. Oktober 2026

## Geprüfter Stand und Ergebnis

Prüfer: unabhängiger Arbeitsgang `review_flashcard_paging`; Autor: `habitat_courses`. Tatsächlicher Prüfungstag: **17. Oktober 2026**. AGENTS.md und KNOWLEDGE_POLICY.md wurden angewandt. Der Autorenbericht wurde als Prüfgegenstand gelesen, nicht als unabhängiger Beleg seiner eigenen Aussagen behandelt.

- Vollständig gelesener JSON-Ausgangsstand: `eb752bafb9fce52b700779a9c2bbf0f7c1241b1b39f5c1f831536dc14b5842fb`.
- Nach begrenzter Korrektur zusätzlich semantisch verglichener und nachabgenommener JSON-Endstand: **`26653b409d483d00f48938acd132a68a481f52ace477cb6455310ba68331eec2`**.
- Zugehöriger Autorenbericht nach dem Delta: `34682db6a03ccec749e409e7a6d9da8405a73cf8f01ebd7210ee12e93ea92dcb`.

Im beschriebenen Umfang wurde **kein verbleibender fachlicher Blocker und kein falsch geschlüsselter Antwortsatz** festgestellt. Zwei didaktisch schwache Fragenoptionen wurden konkret gemeldet und in einem begrenzten Delta verbessert. Nachabnahme dieses Deltas erfolgreich. Das ist keine Zertifizierung der gesamten App, keine unabhängige Wiederholung aller zitierten Studien und keine Zusicherung vollständiger Fehlerfreiheit.

## Vollständige Leseprüfung

Alle sechs Kurse, alle 24 Lektionen mit sämtlichen Absätzen, Merksätzen und Übungen sowie alle **192 Fragen einschließlich jeder der vier Optionen, Antwortindex und Erklärung** wurden gelesen. Zusätzlich wurden alle 24 Evidenzeinträge, ihre konkreten Claimtexte und Quellenzuordnungen, die Quelleninventare, die ausgeschlossenen Aussagen und der vollständige Autorenbericht geprüft. Je Kurs wurden 32 Fragen betrachtet, nicht bloß ausgewählte richtige Antworten.

| Kurs-ID nach `wissen-ausbau-habitat-` | Vollständig gelesene Lektionen | Fragen | Schwerpunkt der Gegenprüfung |
| --- | --- | ---: | --- |
| `bluete-samen-frucht-2026` | `bluetenbau`, `pollenweg`, `doppelte-befruchtung`, `samen-frucht` | 32 | Bestäubung/Befruchtung; Samenanlage/Fruchtknoten; Zygote/Endosperm; typischer Lehrbauplan gegenüber Ausnahmen |
| `flechtenbiologie-2026` | `partner`, `lagerbau`, `ausbreitung`, `standort` | 32 | Pilz-/Photopartner; begrenzte Stickstofffixierung; zusätzliche Mikroorganismen; vegetative/sexuelle Ausbreitung; konkreter Lungenflechtenstandort |
| `moore-torf-wasser-2026` | `torfbilanz`, `moortypen`, `bodenbewegung`, `wirkungskontrolle` | 32 | Vorrat/Fluss; mechanische Höhenänderung gegenüber Kohlenstoffänderung; Wasserquellen; Grenzen einzelner Erfolgsindikatoren |
| `bodenentwicklung-2026` | `entstehung`, `profilmodell`, `stoffverlagerung`, `wassermerkmale` | 32 | Horizonte gegenüber Ablagerungsschichten; Verlehmung/Lessivierung/Podsolierung; Grund-/Stauwasser; unterschiedliche nationale Notationen |
| `mobile-energie-2026` | `groessen`, `laufzeit`, `zelltechnik`, `umgang` | 32 | A/Ah/V/W/Wh; nominale gegenüber nutzbarer Energie; Systemgrenze bei Verlusten; Bauform/Chemie; allgemeine sichere Nutzung |
| `insektenentwicklung-2026` | `haeutung`, `metamorphose`, `diapause`, `kaeltestrategien` | 32 | Apolyse/Ecdysis/Instar; Hemi-/Holometabolie; Diapause/Quieszenz; Gefriervermeidung/-toleranz; Zeit und Mikroklima |

Die richtigen Antworten wurden nicht anhand ihrer Buchstabenverteilung als fachlich richtig angenommen. Die Rohverteilung ist je Kurs 8/8/8/8; die bestehende Darstellung in `components/LearningCourse.js` ruft außerdem `answerOrder` mit Frage-ID und wechselndem Lauf-Seed auf. Daher ist die wiederkehrende rohe Indexfolge kein Beleg für eine immer gleich angezeigte richtige Antwort. Eine vollständige gerätebezogene Bedienprüfung war nicht Teil dieses Auftrags.

## Tatsächlich unabhängig eingesehene Originalquellen

Die folgenden Quellen wurden in diesem Gegenprüfungsdurchgang selbst geöffnet und in den benannten Teilen gelesen. Mehrere Darstellungen desselben Artikels oder mehrere Seiten einer Organisation zählen nicht als unabhängige Wiederholung. Diese Liste ist die tatsächlich erfolgte Stichprobe, keine Behauptung, sämtliche URLs des Autorenpakets nochmals vollständig gelesen zu haben.

### Blüte, Samen und Frucht

- [Universität Hamburg, historisches Botanik-online: Fertilisation](https://www-archiv.fdm.uni-hamburg.de/b-online/e48/48e.htm): zwei Kernfusionen und unterschiedliche Produkte; abweichende Endosperm-Ploidie ausdrücklich vorhanden. Historischer Lehrtext, keine neue Untersuchung von 2026. Der Kurs behandelt 2n/3n als häufiges Modell und behauptet keine ausnahmslose 3n-Regel.
- [OpenStax Biology 2e, Pollination and Fertilization](https://openstax.org/books/biology-2e/pages/32-2-pollination-and-fertilization): Bestäubung, Selbst-/Fremdbestäubung, doppelte Befruchtung, Embryo, Reserven, Integumente und Fruchtentwicklung in den zugehörigen Abschnitten. Einzelne vereinfachende oder problematische Nebenformulierungen des Lehrbuchs wurden nicht als zusätzliche Kursbehauptung übernommen.
- [Royal Botanic Gardens Kew, What is a seed?, 15. Juli 2025](https://www.kew.org/read-and-watch/what-is-a-seed): Embryo, Vorrat, Samenschale sowie Bedeckt-/Nacktsamer-Kontext. Damit unabhängig von OpenStax gegen die Raum- und Funktionszuordnungen gegengelesen.

### Flechten

- [British Lichen Society, What is a lichen?](https://britishlichensociety.org.uk/learning/what-is-a-lichen): Pilzanteil, Algen/Cyanobakterien, mögliche Kombination mehrerer Partner und begrenzte Stickstofffixierung; zusätzliche Hefen und Bakterien ausdrücklich angesprochen. Dies wird nicht auf jede Flechte als identischer Pflichtbestand übertragen.
- [WSL SwissLichens, What is a lichen?](https://swisslichens.wsl.ch/en/about-lichens/what-is-a-lichen/): vereinfachtes Zweipartnermodell, Wuchsformen und Ausbreitung. Der vereinfachte Einstieg allein bestätigt weder die Abwesenheit noch die vollständige Vielfalt weiterer Mikroorganismen.
- [Australian National Botanic Gardens, What is a lichen?, 2011](https://www.anbg.gov.au/lichen/what-is-lichen.html): Myko-/Photobiont, mehr als ein Photobiont, Kohlenstoffversorgung, typische Schichtung mit Ausnahmen, Rhizinen sowie Soredien/Isidien. Nicht als unabhängiger eigener Mikroben-Zensus gezählt.
- [Bates und Mitautoren, Bacterial Communities Associated with the Lichen Symbiosis, 2011, ASM-Originalartikel](https://journals.asm.org/doi/10.1128/aem.02257-10): Abstract, Einleitung, Probenrahmen, Methoden und Ergebnis-/Diskussionstext tatsächlich gelesen. Zusätzliche Bakteriengemeinschaften wurden an vier untersuchten Flechtenarten nachgewiesen; die Einleitung nennt außerdem auf/im Thallus lebende weitere Pilze. Das stützt hier zusammen mit der BLS die begrenzte Aussage in `partner`, Absatz 3, dass ein Thallus mehr als exakt zwei Arten enthalten kann. Keine Übertragung der Häufigkeiten auf sämtliche DACH-Flechten und kein aus dem Sequenznachweis abgeleiteter Funktionsbeweis jeder Bakteriengruppe. Diese zusätzliche unabhängige Zuordnung gehört zu diesem Peerprotokoll; der Kurs wurde dafür nicht um neue Behauptungen erweitert.
- [WSL, Echte Lungenflechte](https://totholz.wsl.ch/de/artenportraets/echte-lungenflechte/) und [Woodland Trust, Lungwort lichens](https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/fungi-and-lichens/lungwort-lichens/): konkrete Wald-/Altbaum-/Feuchteansprüche gegengeprüft. Historische Verbreitungskarten, Heilkundeaussagen und eine vereinfachende Bildunterschrift wurden nicht als Kursbeleg übernommen. Das Artbeispiel bedeutet nicht, sämtliche Flechten hätten dieselben Ansprüche.

### Moore

- [Thünen-Institut, Moorböden in Bewegung / Messung der Geländehöhenänderungen](https://moorbodenmonitoring.thuenen.de/standard-titel): Haupttext zu Verdichtung, Quellung, Wiedervernässung und biologischer Akkumulation/Mineralisierung gelesen. Physische Volumenänderung kann ohne entsprechende Kohlenstoffänderung auftreten; für Kohlenstoffvorräte sind weitere Größen erforderlich.
- [NatureScot Research Report 1355, 2025](https://www.nature.scot/doc/naturescot-research-report-1355-summary-surface-motion-remote-sensing-methods-monitoring-peatland): Hintergrund, Einleitung, Kernergebnisse und Grenzen der Oberflächenbewegungsmethoden gelesen. Mechanische Reaktion auf Wasserhaushalt ergänzt Hydrologie/Ökologie; eine Bewegung ist nicht schon der Nachweis guten Zustands oder gemessener Kohlenstoffbindung. Britischer Methodenrahmen, keine neue DACH-Feldvalidierung.

Kein Kursabsatz und keine richtige Antwort setzt Mooroberflächenbewegung mit einer direkten Kohlenstoffmessung gleich. CO₂-/CH₄-Bilanz, Torfvorrat, Wasserstand, Höhe und biologische Indikatoren bleiben getrennte Größen. Die WSL-Arbeit von 2021 wird als solche benannt und nicht als neue Erhebung von 2026 ausgegeben.

### Bodenhorizonte

- [BFW Österreich, Horizonte](https://geo.bfw.ac.at/bodenseminar/horizonte.html): Definitionen A/B/C, Bv/Bt/Bh/Bs, Go/Gr, historische österreichische P-/S-Kennzeichnungen und Übergangshorizont gelesen. Die Kursdarstellung behauptet daraus keine heutige einheitliche DACH-Norm.
- [Bodensystematik, Horizontkriterien, historischer deutscher Lehrtext](https://www.bodensystematik.de/horizontkriterien.html): prozessbezogene Horizonte und deutsche Übergangs-/Zusatzzeichen gelesen. Eine Horizontbezeichnung ist keine bloße geologische Schichtnummer.
- [BAFU/WSL, Physikalischer Bodenschutz im Wald, 2016](https://www.bafu.admin.ch/dam/de/sd-web/JYR9aX5iul9U/physikalischer_bodenschutzimwald.pdf): einschlägige Profilabschnitte und insbesondere Tabelle A4 auf gedruckter Seite 144 gelesen. Dort Bv, Bt, Bh/Bs, Go/Gr, Schweizer Sw/Sd und AB gegengeprüft. Kennzeichnung und physikalische Beschreibung werden nicht in eine aktuelle rechtliche Befahrungsfreigabe umgedeutet.
- [Bayerisches LfU, Bodentypen](https://www.lfu.bayern.de/boden/was_sind_boeden/bodentypen/index.htm): Braunerde sowie Grundwasser-/Stauwasserabgrenzung gelesen. Gley und Pseudogley werden im Kurs nicht allein anhand eines einzelnen Fotos oder einer einzelnen Farbfläche diagnostiziert.

Die Kursfragen bewahren die ausdrücklich benannten deutschen, österreichischen und Schweizer Bezugsrahmen. Bv gegenüber Bt, Tonbildung gegenüber Tonverlagerung und Go/Gr gegenüber den jeweiligen Stauwasserzeichen werden nicht gleichgesetzt. Alte Unterlagen werden als Lehrgrundlagen, nicht als vollständig aktualisierte nationale Vorschriften behandelt.

### Mobile Energie

- [Fraunhofer Batterie-Allianz, Medien/Glossar](https://www.batterien.fraunhofer.de/de/presse_medien/medien.html): Kapazität, Energie-/Leistungsgrößen, Primär-/Sekundärzelle, Separator, Innenwiderstand und Selbstentladung gegengelesen. Fehleranfällige vereinfachende Formulierungen einzelner Glossareinträge wurden nicht blind übernommen.
- [OpenStax College Physics 2e, Current](https://openstax.org/books/college-physics-2e/pages/20-1-current) und [Electric Power and Energy](https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy): I = Q/t, A = C/s, P = UI und Energie als Leistung mal Zeit in den jeweiligen Modellbedingungen. Eine Organisation, keine zwei unabhängigen Messungen.
- [US Department of Energy, DOE Explains… Batteries](https://www.energy.gov/science/doe-explainsbatteries): chemische Energiespeicherung, äußere Elektronen-/innere Ionenbewegung gelesen. Keine Lehrbuchgrafiken oder Formulierungen kopiert.
- [BAM, Sicherer Umgang mit Lithium-Batterien](https://bam.de/aktuelles/sicherer-umgang-mit-lithium-batterien) und [Umweltbundesamt, Batterien und Akkus](https://www.umweltbundesamt.de/en/batterien-akkus): passende Ladegeräte, mechanische/thermische Beschädigung, Entladung, Rückgabe und Trennung von Bauform/Chemie gelesen. Keine Übernahme konkreter Brandbekämpfungs-, Gefahrgut-, Eich- oder ausländischer Rechtsanleitungen.

Ah ist im gesamten geprüften Kurs eine Ladungsmenge und Wh eine Energie. Die eigenen Rechnungen wurden nachgerechnet, unter anderem 5 Ah × 3,7 V = 18,5 Wh als nominales Beispiel und 12 Wh / 3 W = 4 h unter ausdrücklich vereinfachten Bedingungen. Nutzungsgrad, Lastprofil und Systemgrenze werden berücksichtigt; derselbe Verlust wird nicht zweimal angesetzt. Keine reale Herstellerlaufzeit wird erfunden.

### Insekten

- [North Carolina State University, Morphogenesis](https://genent.cals.ncsu.edu/bug-bytes/morphogenesis/): Instar, Ablösung der alten Hülle von der Epidermis, neue Kutikula, Häutungsabfolge, Expansion und Härtung sowie Hemi-/Holometabolie gelesen. Zu breite Nebenformulierungen über adulte Geschlechtsreife oder unbewegliche Puppen wurden im Kurs gerade nicht pauschal übernommen.
- [USDA NALT, Apolysis](https://lod.nal.usda.gov/nalt/en/page/11225): terminologische Abgrenzung der Apolyse gegenüber dem späteren Abstreifen gelesen. Historischer Definitionsstand, keine neue biologische Erhebung.
- [Purdue Extension, Understanding Insect Metamorphosis, 21. Juni 2024](https://www.extension.purdue.edu/news/county/whitley/2024/06/understanding-insect-metamorphosis.html): Entwicklungsfolgen Ei–Larve–Puppe–Adult beziehungsweise Ei–Nymphe–Adult und Häutungsstadien gelesen. Nebenverallgemeinerungen zu Körperanhängen wurden nicht übernommen.
- [North Carolina State University, Survival](https://genent.cals.ncsu.edu/bug-bytes/survival/) und [Iowa State University, Cold Hardiness of Insects and the Impact of Fluctuating Temperatures](https://crops.extension.iastate.edu/encyclopedia/cold-hardiness-insects-and-impact-fluctuating-temperatures): saisonale Programme gegenüber unmittelbarer Quieszenz, verschiedene Diapausestadien, Mikroklima, Kälteverletzung, Gefriervermeidung/-toleranz und Zeitbezug gelesen. Der Iowa-Beitrag nennt als letzte Prüfung den 5. Juni 2026. Keine US-Arten-Grenztemperatur wird zum allgemeinen DACH-Grenzwert gemacht.
- [Mun und Mitautoren, 2015, DOI 10.1038/srep10484](https://www.nature.com/articles/srep10484): Nur über die Suchausgabe zugängliche indexierte Originaltextabschnitte zu Epidermis/Kutikula und Proteinvernetzung tatsächlich gelesen; kein erfolgreicher Volltextabruf im Peerzugang. Der eng begrenzte Mechanismus stimmt mit dem geöffneten NC-State-Lehrtext überein. Die experimentellen Tribolium-Daten wurden nicht nachgerechnet oder unabhängig reproduziert.

Die Fragen unterscheiden Apolyse und Ecdysis, Nymphe und Puppe, Diapause und Kälteschaden. Sie erklären weder jede Puppe als bewegungslos noch jedes adulte Insekt unmittelbar als fortpflanzungsbereit. Diapause wird nicht als vollständiger Stoffwechselstopp oder unbegrenzte Frosthärte ausgegeben.

## Konkrete Befunde und Nachabnahme

### P3: Flechtenpartner, `partner-q5`

Im Ausgangsstand waren drei falsche Optionen ohne Kenntnis der Flechtenbiologie leicht auszuschließen: Photosyntheseprodukte ohne Licht, Umwandlung von Stickstoff in Kohlenstoffatome und eine pflanzliche Pfahlwurzel. Gemeldet an Autor und Root. Nach Freigabe wurden ausschließlich die falschen Optionen durch drei naheliegende Verwechslungen mit Pilzfunktionen ersetzt: geschlechtliche Pilzsporen im Apothecium, Rhizinen und pilzliche Rindenschicht. Die Frage bleibt ausdrücklich bei einer möglichen zusätzlichen Fähigkeit cyanobakterieller Partner. **Stickstofffixierung, Index B, und die begrenzende Erklärung bleiben unverändert und fachlich passend.**

### P3: Lungenflechtenstandort, `standort-q3`

Meeresüberflutung, beliebiges Holz und ausnahmslos trockene Neupflanzungen waren im Ausgangsstand zu leicht auszuschließen. Ersetzt wurden nur diese drei falschen Optionen durch trockene besonnte Borke junger isolierter Bäume, bewegten trockenen Sand und trockenes freiliegendes Gestein ohne Baumbestand. Gefragt wird nach dem **beschriebenen** Artanspruch. Die richtigen feuchten Waldverhältnisse mit geeigneten alten Laubbäumen, **Index D**, bleiben unverändert. Daraus wird kein absoluter Ausschluss jedes denkbaren Gesteinsvorkommens abgeleitet.

Der programmgestützte semantische Vergleich zwischen den beiden oben genannten JSON-Ständen ergab **genau sechs geänderte falsche Optionswerte an diesen zwei Fragen**. Sämtliche anderen Werte sind identisch: keine neuen Faktenzahlen, Fragen, IDs, Quellen, Lektionen, richtigen Antworttexte, Indizes oder Erklärungen. Alle sechs neuen Optionen und ihr fachlicher Bezug wurden nachgelesen; die betroffenen Originalquellen sind oben benannt. Damit sind beide gemeldeten P3-Befunde für diesen Endstand erledigt.

## Ergänzende Strukturkontrolle

Nach dem Delta erneut kontrolliert: 6 eindeutige Kurse, 24 Lektionen, 192 Fragen, jeweils vier unterschiedliche Optionen, zulässiger Index 0–3, vorhandene Erklärung und gültiger Lektionsbezug. Je Kurs bleiben 8/8/8/8 richtige Rohpositionen. Die Evidenzprüfung ergab 24 vorhandene Einträge; die zusammengeführten Claimtexte stimmen exakt mit den jeweiligen Lektionsabsätzen überein, alle zugeordneten URLs sind im betreffenden Kurs registriert. Strukturkonformität ist von fachlicher Bestätigung getrennt.

Keine Inhaltsdatei des Autors wurde durch den Prüfer geändert; nur dieses Peerprotokoll wurde neu angelegt. Keine Medien, Adapterintegration, Veröffentlichung oder Commits. Die Originalquellen wurden zur Faktenprüfung gelesen, nicht als Lizenz zur Übernahme ihrer Abbildungen, Tabellen oder Aufgaben behandelt.

## Grenzen

Die unabhängige Quellenprüfung ist eine konkrete Stichprobe innerhalb einer vollständigen Text-/Fragenlektüre, keine vollständige neue Lektüre aller Autoren-URLs. Die Universität-Minnesota-Samenmorphologie-Seite war im Peerzugriff mit 403 nicht lesbar und wird hier nicht als neu gelesener Beleg gezählt. Bei zwei PMC-Zugriffen erschienen Botprüfungen; sie wurden nicht umgangen. Bates wurde anschließend erfolgreich beim Originalverlag ASM gelesen; Mun blieb auf indexierte Originalauszüge begrenzt. Kein gesperrter Zugriff wird als Volltextprüfung ausgegeben.

Alte Fachtexte belegen zeitlich stabile Grundlagen in ihrem angegebenen Rahmen und sind keine aktuellen Normenprüfungen. Für spezifische DACH-Rechtsfragen ergibt dieser Biologie-/Physikblock keine eigenständige Erlaubnis. Keine Einzelstudie wird als unabhängige Messwiederholung durch die ergänzende Erklärungsquelle ausgegeben. Vor Veröffentlichung bleiben die gesonderten Integrations-, Medien- und Darstellungsprüfungen durch Root erforderlich.
