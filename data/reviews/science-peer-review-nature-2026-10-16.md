# Unabhängige Gegenprüfung: Applied-Paket

Fachliche Gegenprüfung am **16. Oktober 2026** durch den Ökologie-/Natur-Autor. Gegenstand: `data/learning-expansion-applied-2026-10-16.json` und zugehöriger Autorenbericht `data/reviews/learning-expansion-applied-2026-10-16.md`.

Gelesen wurden sämtliche 24 Lektionen sowie alle **192 Fragen, vier Alternativen, Antwortschlüssel und Erklärungen**. Die sechs Module enthalten jeweils 32 Fragen und acht richtige Antworten pro Position A/B/C/D. Die Prüfung hat keinen sicher belegten falschen Antwortschlüssel und keine sicher belegte gefährliche Labor-/Zeichenanweisung ergeben. Sie ist keine vollständige unabhängige Wiederholung jeder Quellenrecherche des Autors.

Geprüfter JSON-Stand vor etwaigen Root-Korrekturen: SHA-256 `340c19ce95ab90e4f71d322b9faadb88632af15457b49fe66a7e00f93a4d623e`.

## Gezielte Nachprüfung der Korrekturen

Am 16. Oktober 2026 gezielt erneut gelesen, ohne die vollständige Prüfung zu wiederholen:

- `wildkamera-datenschutz/q6`: Der Optionenverweis ist entfernt. Die Erklärung steht selbständig; der richtige Schlüssel bleibt Art. 32 DSGVO, Position B.
- `kartenprofile/q31`: Prüft nun die bereits eingeführte Flächensignatur als räumlich ausgedehnten Bereich statt einer eigens unbelegten konkreten swisstopo-Farbe. Position D bleibt richtig; die drei Alternativen beschreiben andere Kartengrößen.
- `trichinellenlabor/q7`: Fragt nun nach der Klärung örtlich gültiger Vorgaben bei der zuständigen Untersuchungs-/Fachstelle. Keine eigene Rechtsetzung durch das Labor behauptet. Position B bleibt richtig.
- Die gemeldeten Norm-/Zahlabstände wie `Art. 32verlangt`, `Art. 13betrifft`, `72Stunden` und `lit.fDSGVO` sind im aktuellen JSON bereinigt; gezielte Mustersuche ergab keine dieser Restformen.

Alle vier Befunde sind damit für den geprüften Stand erledigt. Final nachgeprüfter Applied-JSON-Hash: SHA-256 **`6da1a10939e8090c45e8e5462dd4c9d98003abfbb466ce5f9d6fc0606a5b1bd1`**. Die folgenden Befunde dokumentieren den zuvor gefundenen Zustand und gelten nach dieser Korrektur nicht als offene Punkte.

## Konkrete Befunde

### 1. Redaktionell zu korrigieren: Optionenverweis in einer Lernkartenerklärung

Ort: `wissen-ausbau-anwendung-wildkamera-datenschutz-2026`, Frage `q6`.

Die Erklärung enthält nach dem richtigen ersten Satz einen Verweis auf „Die anderen genannten Bestimmungen“. Bei der Umwandlung in eine Lernkarte fehlen die Alternativen; der Verweis ist dann unverständlich. Der Antwortschlüssel **Art. 32 DSGVO** ist richtig.

Vorschlag: Erklärung auf **„Art. 32 DSGVO verlangt risikogerechte technische und organisatorische Schutzmaßnahmen.“** ändern. Keine Änderung der Antwortposition erforderlich.

### 2. Beleg-/Lehrkontext präzisieren: konkrete Waldsignatur

Ort: `wissen-ausbau-anwendung-kartenprofile-2026`, Frage `q31`, Lektion `legende`.

Die Frage nennt ausdrücklich die konkrete swisstopo-Zeichenerklärung und erwartet eine grüne Wald-Flächensignatur. Die Lektion führt allgemeine Flächen- und Punktsymbole ein, nennt aber dieses konkrete Beispiel nicht. Die registrierte swisstopo-Quelle behandelt Höhenlinien; das Claim-Mapping benennt keine eigene offizielle Wald-Zeichenerklärung.

Dies ist **kein belegter falscher Farbschlüssel**, sondern eine Lücke zwischen konkreter Frage und nachvollziehbar dokumentiertem Lehr-/Quellenkontext. Allgemeine Kartenfarben dürfen zudem nicht etwa auf Orientierungslaufkarten übertragen werden.

Vorschläge: Entweder die konkrete offizielle swisstopo-Zeichenerklärung als Quelle und Lernbeispiel ergänzen oder die Frage auf den bereits belegten Unterschied **Flächensignatur versus einzelner Höhenpunkt** umstellen. Eine bloße allgemeine Quelle über Kartenfarben würde die ausdrücklich produktspezifische Frage nicht ausreichend präzisieren.

### 3. Redaktionelle Präzisierung: Fachstelle informiert über Vorgaben

Ort: `wissen-ausbau-anwendung-trichinellenlabor-2026`, Lektion `probe-und-ziel`, Frage `q7`.

Die Frage formuliert, welche Stelle das örtlich gültige Probenverfahren „bestimmt“. Die richtige Alternative nennt die zuständige Untersuchungs- oder Fachstelle. Der praktische Hinweis ist sinnvoll; sprachlich sollte zwischen geltenden rechtlichen/fachlichen Vorgaben und der Stelle, bei der diese abgeklärt werden, unterschieden werden.

Vorschlag: **„Wo sind die für den konkreten Fall geltenden Probenvorgaben zu klären?“** – richtige Antwort: **„Bei der zuständigen Untersuchungs- oder Fachstelle.“** Die Erklärung kann bleiben beziehungsweise ausdrücklich auf geltende Vorgaben verweisen. Dies ist keine Korrektur des biologischen Laborprinzips.

### 4. Lesbarkeit: fehlende Leerzeichen in Normbezügen

Mehrfach etwa `Art. 32verlangt`, `Art. 13betrifft`, `72Stunden`, `lit.fDSGVO` im Datenschutzmodul. Das verändert nicht den geprüften materiellen Inhalt, stört aber die lesbare Darstellung und eigenständige Lernkarten. Normbezüge und Fließtext vor Veröffentlichung typografisch trennen. Kein globales blindes Ersetzen von Zahlen innerhalb IDs oder URLs.

## Besonders geprüfte positive Punkte

- **Kartenprofile:** Alle eigenen Maßstabs-, Konturintervall-, Profil- und Prozentrechnungen nachgerechnet. Fünf Konturen begrenzen vier Intervalle; 500–520–510–540 m ergeben 50 m aufsummierten Anstieg, 10 m Abstieg und 40 m Nettohöhe. Horizontale Projektion und Hangstrecke sind getrennt.
- **Muskelbiologie:** Ebenen Muskel/Faser/Myofibrille/Sarkomer, Hüllen Endo-/Peri-/Epimysium, Aktin/Myosin, Glykogen, ATP und Rigor sind konsistent. pH und Tropfsaft werden nicht als pauschale Verzehrfreigabe behandelt. PSE/DFD bleiben Qualitätsbeschreibungen, keine Foto- oder Keimdiagnose.
- **Trichinellenlabor:** Ziel ist geeignete Muskulatur und Larvennachweis; klinische Diagnostik wird nicht als Ersatz verwendet. Keine Laborrezeptur, Probenmengen, DACH-weite Entnahmebefugnis oder pauschale Freigabe. Positiver Pool ist nicht gleich Einzelpositivität aller Tiere; Nichtnachweis bleibt probe-/ziel-/verfahrensgebunden. Falsch-positiv und falsch-negativ sowie qualitative und quantitative Auswertung sind richtig zugeordnet. Der eigene Fünf-/Eine-Larve-Fall ist qualitativ positiv, ohne vollständige Wiederfindung zu behaupten.
- **Sicherheitszeichen:** Form und Farbe der Warn-, Verbots-, Gebots-, Rettungs- und Brandschutzzeichen stimmen mit den gelesenen Grundregeln überein. Farbe Rot allein wird nicht zur eindeutigen Zuordnung benutzt. Schilder ergänzen Schutzmaßnahmen; sie verleihen keine praktische Befähigung. CE wird nicht als Herkunftsnachweis oder behördliche Einzelzulassung ausgegeben; keine allgemeine Schweizer CE-Pflicht.
- **Biologische Ebenen:** Typische kernhaltige Tierzelle vermeidet die falsche Behauptung eines Zellkerns in jeder Tierzelle. Cytoplasma, Organell, Gewebe, Organ, System und dynamische Homöostase sind nachvollziehbar getrennt. Keine pauschalen menschlichen Normalwerte für Wildarten.
- **Wildkamera-Datenschutz:** DE/AT/CH und die privaten Fallgruppen sind getrennt. Personenbezug kann indirekt entstehen; Grundstückseigentum und Schild ersetzen keine Verarbeitungsvoraussetzungen. Österreichs 72 Stunden sind ausdrücklich ein behördlicher Richtwert, keine universelle gesetzliche Kameraerlaubnis. Der Schweizer Sofortlösch-/Anonymisierungshinweis ist auf den konkret beschriebenen nichtpersonenbezogenen EDÖB-Fall begrenzt. Kantonale Jagdspezialregeln werden vorbehalten.

## Unabhängig erneut gelesene Quellen und Reichweite

- [BAuA, ASR A1.3, Ausgabe 2013 / Änderung 2022](https://www.baua.de/DE/Angebote/Regelwerk/ASR/pdf/ASR-A1-3.pdf%3F__blob%3DpublicationFile): 36-seitige amtliche Fachfassung, insbesondere Begriffe, Zeichenformen/-farben, Sichtbarkeit, Zusatzpfeile und Unterweisung. Die zunächst im Paket verlinkte URL lieferte im Webabruf 403; der indexierte BAuA-Alias lieferte denselben Fachtext. Kein daraus abgeleiteter Anspruch, jede private Jagdhütte müsse identisch ausgestattet sein.
- [Österreichische KennV, Anhang 1 im RIS](https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40172680/II_101_1997_Anlage_1.pdf): eigenständige nationale Normgrundlage für die übereinstimmenden Formen und Farben. Die Rechtsbereiche bleiben dennoch getrennt.
- [Europäische Kommission: CE marking](https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking_en) und [SECO: Konformitätsbewertung und Akkreditierung](https://www.seco.admin.ch/de/konformitaetsbewertung-und-akkreditierung): Verantwortung, einschlägige Produktregeln und unterschiedliche Bewertungs-/Zulassungsarten; keine pauschale Verwendungserlaubnis.
- [CDC DPDx: Trichinellosis](https://www.cdc.gov/dpdx/trichinellosis/): Darmstadium, Muskellarven und klinische Diagnostik; keine Übertragung klinischer Tests als Fleischkontrolle.
- [BfR: Originalbericht Ringversuch 2014](https://www.bfr.bund.de/cm/343/ringversuch-zum-nachweis-von-trichinellen-in-fleisch-2014.pdf): tatsächlicher Originalbericht, qualitative/quantitative Unterscheidung und codierte Proben. Historische Rechtsbezüge und Quoten werden nicht als heutige Wildschweinwerte verwendet.
- [Polnisches NRL: Originalstudie zu Pferdefleisch-Ringversuchen 2014–2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC9655762/): substanzielle im Suchabruf gelieferte Primärtextauszüge, besonders Methoden/qualitative und quantitative Bewertung sowie Identitätsfehler. Der direkte PMC-Aufruf zeigte eine Zugriffskontrolle; die Gegenprüfung behauptet keinen davon unabhängig vollständig heruntergeladenen Volltext. Keine Pferdefleisch-Leistungswerte auf Wildschweine übertragen.
- [ICT-Empfehlungen, PubMed-Originalabstract](https://pubmed.ncbi.nlm.nih.gov/32095629/): systemweite Qualitätssicherung bei Verdauungstests. Direktes PMC-Dokument war beim erneuten Abruf gesperrt. Die Detailprüfung wird deshalb primär auf den tatsächlich lesbaren BfR-Originalbericht und den substanziellen NRL-Primärtext gestützt.
- [DSK-Orientierungshilfe, Abschnitt 5.8 Wildkameras](https://www.baden-wuerttemberg.datenschutz.de/orientierungshilfe-videoueberwachung-nicht-oeffentlich/): veröffentlichter Stand 17.07.2020, Personenbezug und Interessenabwägung im öffentlich zugänglichen Wald. Keine pauschale Montagehöhe als Rechtsfreigabe.
- [Österreichisches DSG, konsolidierter RIS-Text](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001597): § 1 Abs. 2 gelindester zum Ziel führender Eingriff; Abgleich mit der [aktuellen DSB-FAQ Foto & Video](https://dsb.gv.at/faqs/foto-video) zu Richtwert, Hinweisen, Zugriff und Liveübertragung.
- [Schweizer DSG, amtlicher Fedlex-Text Stand 07.07.2025](https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/de/pdf-a/fedlex-data-admin-ch-eli-cc-2022-491-20250707-de-pdf-a.pdf): insbesondere Art. 19 und 31; Abgleich mit [EDÖB: Fotofallen und Wildtierkameras](https://www.edoeb.admin.ch/de/fotofallen-und-wildtierkameras). Die EDÖB-Seite wurde im substanziellen, von dieser Originalseite gelieferten Suchabruf gelesen; der normale Öffnungsabruf enthielt überwiegend die Navigation.

## Grenzen des Gegenchecks

Die erneute Quellenprüfung konzentrierte sich auf die sicherheits-, gesundheits- und rechtsnahen Abschnitte. Alle Antwortschlüssel wurden gelesen; das ist von einer erneuten Mehrquellenprüfung sämtlicher 192 Aussagen zu unterscheiden. Keine aktuelle Einzelfall-Rechtsberatung, Laborzulassung oder Standortfreigabe. Die Fassung der Schweizer Norm wurde konkret benannt; keine Vollprüfung aller Spezialänderungen oder sämtlicher kantonaler Jagdvorschriften. Autorenbericht und JSON wurden read-only geprüft. Änderungen am Paket übernimmt Root.

