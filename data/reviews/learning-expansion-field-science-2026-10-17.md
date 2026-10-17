# Fachprüfung: Revierpraxis, Lebensmittelbiologie und Einheiten, 17. Oktober 2026

## Begrenzte Korrekturen nach unabhängiger Gegenprüfung

Der vollständig gegengelesene Ausgangsstand der Datendatei trägt SHA-256 `69548c5942b4f7288ea35f06e70318ecd746a30813625eff26a57a5940dcb957`. Die Gegenprüfung durch `body_function_courses` ergab vier eng begrenzte Präzisierungen. Root hat ihre Bearbeitung freigegeben; am 17. Oktober 2026 wurden ausschließlich folgende Stellen angepasst:

- **Größen/Einheiten, `dichte`, Absatz 2:** „äußerer Gesamtumfang“ wurde durch das äußere Hüllvolumen einschließlich Hohlraum ersetzt. Damit werden Volumenbezüge verglichen, ohne eine Länge als Volumen zu bezeichnen. Zahlen, Rechnung und Kernaussage bleiben unverändert.
- **Zecken, `vorsorge`, Absatz 1 und `q21`:** Der missverständliche Ausdruck „Stichgarantie“ heißt jetzt „vollständiger Schutz vor Stichen“. Es wird weiterhin keine absolute Schutzwirkung behauptet.
- **Blei, `q10`:** Die Vorgabe „harnbildend“ verriet das Lösungsorgan; sie wurde entfernt. Gefragt wird ausdrücklich nach den von WHO und EFSA genannten längerfristigen Wirkungen. Der Ablenker „Leber“ wurde durch „Schilddrüse“ ersetzt, um die in der WHO-Information zusätzlich benannte Verteilung in die Leber nicht mit der hervorgehobenen Nierenwirkung zu vermischen. Richtige Antwort Niere, Position A, und Erklärung bleiben unverändert. Es wird nicht behauptet, dies sei eine abschließende Liste möglicher Organwirkungen.
- **Lebensmittelbakterien, `q18`:** Statt die Rohmilch über die bereits in der Frage enthaltene fehlende Wärmebehandlung zu verraten, prüft ein eigener Anwendungsfall die in der Lektion und ihrem Quellenmapping bereits belegte Kreuzkontamination: belastetes rohes Geflügelfleisch, gemeinsame Arbeitsfläche und verzehrfertiger Salat. Die Ablenker verwechseln Herkunft, Übertragung und die vermeintliche Notwendigkeit vorherigen Wachstums. Keine Kochparameter, keine neue Keimzahl, kein zusätzlicher Übertragungsmechanismus. Richtige Position C unverändert.

Der semantische Vergleich des JSON-Ausgangsstands mit dem ersten Textdelta ergab genau diese elf geänderten Textwerte; IDs, Lektionenanzahl, Fragenanzahl und alle Antwortindizes blieben unverändert. Die weiterhin 6 Kurse, 24 Lektionen und 144 Fragen besitzen pro Kurs die Antwortverteilung 6/6/6/6.

Bei der gezielten Nachabnahme identifizierte der unabhängige Prüfer eine engere Belegstelle für die Nierenwirkung: Die zuvor verlinkte EFSA-Pressemitteilung nennt sie im eigenen Text nicht ausdrücklich; der tatsächlich anschließend von Autor und Prüfer gelesene Abstract der [Original-Opinion, DOI 10.2903/j.efsa.2010.1570](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2010.1570), nennt adulte Nephrotoxizität und chronische Nierenerkrankung. Der vorhandene EFSA-Eintrag wurde deshalb auf die Original-Opinion umgestellt: Label, URL und Reichweitenbeschreibung sowie zwei vorhandene Evidenz-URLs. Der Bericht behauptet keine Volllektüre der gesamten Opinion. Historische Benchmark-/Expositionszahlen wurden nicht in den Kurs aufgenommen. Die Quelle stützt die schon vorhandene Aussage direkt; kein weiterer Lehr- oder Fragentext wurde in dieser Quellenrunde geändert.

Der endgültige semantische Vergleich umfasst damit 16 geänderte Textwerte: elf eng begrenzte Inhalts-/Optionspräzisierungen und fünf Quellen-/Zuordnungswerte. Eingefrorener JSON-Endstand: SHA-256 **`922eb9a6c1c64bf844532db1435e461025360082ec7f6a66294ada973b3aa2c0`**. Der unabhängige Prüfer erhält genau diesen Endstand für die gezielte Nachabnahme; der Zwischenstand `d152d1f06d098ac6213e71475a1eb2ad4042af9b9bddfd9c3d1ba49049e3dee7` ist überholt.

## Umfang

6 neue Vertiefungskurse, 24 Lektionen und **144 eigene Single-Choice-Fragen**. Jeder Kurs enthält vier Lektionen mit jeweils sechs Fragen. Die richtigen Antworten stehen pro Kurs jeweils sechsmal auf A, B, C und D. Die Anzahl wurde bewusst unter dem anfänglich vorgeschlagenen Ziel von 192 gehalten, um keine sachfremden Ablenker oder bloßen Zahlenvarianten zum Auffüllen zu erzeugen.

Die Texte, fiktiven Datenblätter, Rechenfälle und Fragen wurden eigens formuliert. Das tatsächliche Datum des inhaltlichen Quellenabgleichs ist der **17.10.2026**. Dieser Bericht betrifft ausschließlich das benannte Paket; er bestätigt weder die gesamte App noch sämtliche bestehenden Lehrinhalte. Nur die zwei zugewiesenen neuen Dateien wurden bearbeitet. Adapterintegration und Veröffentlichung sind nicht Bestandteil dieses Fachauftrags.

## Bestehender Inhalt und Eigenständigkeit

Tatsächlich betrachtet wurden die passenden Abschnitte in `lib/learning-practice.js`, `lib/learning-deepening-practice.js`, `lib/learning-expansion-practice.js`, `lib/learning-expansion-care.js`, `lib/parasite-learning.js`, `lib/learning-curriculum.js` sowie das Paket `data/learning-expansion-applied-2026-10-16.json` mit seinem Prüfbericht. Eine ergänzende Begriffssuche in den JS-/JSON-Wissensdateien prüfte Blei, Salmonellen, Campylobacter, Listerien, Zecken, Beschuss, Pascal, Massendichte und Gewichtskraft.

- **Ansitzeinrichtungen:** Zugang, sichtbare Schäden, Unterlassen bei ungeklärter Eignung und Meldung an Verantwortliche bestehen bereits im Ansitz-Entscheidungsprotokoll. Neu vertieft werden Bauteilrollen, Kraftübertragung, Unterstützung gegenüber einzelner Tragfähigkeit, Material-/Verbindungsbefunde und die ausdrücklich getrennten deutschen Pflichten und österreichischen Präventionsempfehlungen. Der Kurs wird nicht als erstmaliges Hochsitzwissen der App gezählt.
- **Beschuss:** Sicherheitsorganisation und allgemeine CE-Einordnung sind vorhanden. Neu ist das zusammenhängende Lesen von Beschusszweck, Hersteller, Modell, Seriennummer, Munitionsbezeichnung, Fertigungslos, Packungsmenge und technischem Anerkennungsrahmen. Persönliche Berechtigung bleibt eine eigene Rechtsfrage. Keine Wiederholung des bestehenden allgemeinen CE-Kurses als eigener Kennzeichnungsfund.
- **Blei:** `wissen-ausbau-wildbretqualitaet` behandelt bereits, dass Erhitzen stoffliche Risiken nicht automatisch beseitigt, und verweist auf das BLV. Neu sind die getrennten Eintragswege, begrenzte Partikelbeobachtungen einer benannten Originalstudie, Speicherung/Freisetzung und die Unterscheidung Konzentration–Portionsmasse–innere Aufnahme. Es wird keine vermeintlich frühere pauschale Verzehrfreigabe korrigiert; eine solche wurde in den betrachteten bestehenden Abschnitten nicht gefunden.
- **Bakterien:** Bestehende Wildbretkurse erklären Prozesshygiene, Kreuzkontamination und sensorische Grenzen. Die neuen Lektionen führen von diesen bekannten Grundbegriffen zur spezifischen Biologie von Salmonellen, Campylobacter und Listerien. Der neue Umfang liegt vor allem in Reservoir, Serovar, Wachstums-/Überlebensunterschied und Kältewachstum; ein allgemeines Hygienethema wird nicht als unbekanntes Alleinstellungsmerkmal ausgegeben.
- **Zecken:** Einzelne Hinweise zur Zeckenkontrolle von Hunden bestehen bereits. Der Kurs behandelt Menschen, den Ixodes-Kontaktweg, Witterungsbezug, erregerspezifische Vorsorge und die Trennung Stich–Übertragung–Infektion–Erkrankung. Er ist kein weiterer Hundeparasitenteil und keine aktuelle Risikogebietskarte.
- **Einheiten:** Maßstab, Höhenprofile und optische Grundlagen sind vorhanden. Das neue Paket behandelt ausdrücklich Masse/Kraft, Fläche/Volumen, Dichte und Druck. Keine Fragen zu Batterie-V/Ah/Wh, Laufzeit, Kartenprofilen oder statistischen Kennzahlen.

Bei diesem gezielten Bestandsabgleich wurde kein sicher belegter Widerspruch festgestellt, der eine Änderung gemeinsamer Altdateien erfordert. Das ist keine vollständige Fehlerfreiheitsprüfung des Gesamtbestands.

## Quellenzugang und Unabhängigkeit

Die im Datensatz registrierten Quellen wurden tatsächlich inhaltlich gelesen, jeweils im nachfolgend dokumentierten Umfang; bei der ergänzten EFSA-Original-Opinion wurde der Abstract, nicht der gesamte Artikel gelesen. Bei dynamisch knapp dargestellten AGES-/RKI-Seiten und den deutschen Normtexten wurden zusätzlich die öffentlich verfügbaren Original-HTML-Inhalte im Arbeitsspeicher ausgelesen. SVS, SVLFG, PTB, BIPM, DGUV und die ergänzenden Campylobacter-Seiten 63–64 des FSANZ-Kompendiums wurden als Original-PDF-Text gelesen. Eine versuchte Fedlex-PDF ohne verwertbaren PDF-Inhalt wurde nicht als Quelle aufgenommen. Es wurden keine Zugangsdaten benutzt und keine Forschungsdateien als App-Medien gespeichert.

- **Ansitzeinrichtungen:** SVLFG ist eine Organisation, auch wenn Vorschrift und Presseinformation zwei Links besitzen. SVS, HSE und Suva sind getrennte Präventionsinstitutionen. OpenStax dient nur dem allgemeinen Kraftmodell. Britische Leiterhinweise gelten nicht als DACH-Hochsitzvorschrift. Bei Suva wurde die öffentliche Beschreibung gelesen; ungelesene Einzelfragen einer Checklisten-PDF werden nicht beansprucht.
- **Beschuss:** Bayerisches Beschussamt und österreichische zuständige Behörde bestätigen unabhängig den technischen Prüfzweck. Die deutschen und österreichischen Originalnormen sind jeweils die Grundlage der örtlichen Kennzeichnungspflichten. Eine österreichische Erläuterung bestätigt nicht den Wortlaut einer deutschen Norm. Die zwei CIP-Seiten zählen als **eine** Organisation. Ihre Mitgliederliste ist die Originalquelle der Mitgliedschaftsangabe; andere Beschussstellen erklären den technischen Kontext, ohne als unabhängige neue Mitgliedererhebung ausgegeben zu werden. CE wird zusätzlich aus der zuständigen Kommissionsinformation eingeordnet; Schweizer Erwerbs-/Besitzrahmen aus fedpol.
- **Blei:** BfR, BLV, WHO und EFSA sind getrennte Institutionen. Die Fasanenstudie ist eine eigene Originaluntersuchung. Ihre Probenzahlen werden ausschließlich dieser Originalarbeit zugeschrieben. BfR/BLV bestätigen den allgemeinen Partikelmechanismus, sind keine unabhängige Wiederholung derselben acht CT-Untersuchungen. WHO bestätigt Vulnerabilität, nicht eine unabhängig erlassene Schweizer Verzehrsempfehlung.
- **Bakterien:** BfR und AGES sind getrennte zuständige Fachinstitutionen. Ergänzend stützt FSANZ ausdrücklich die nicht sporenbildende Campylobacter-Eigenschaft und Überleben ohne übliches Lebensmittelwachstum. Mehrere Seiten derselben Behörde zählen nicht mehrfach. Ausländische Grenzwerte und Lebensmittel-Verfahrensvorschriften werden nicht nach DACH übertragen.
- **Zecken:** RKI, BAG und DGUV sind getrennte Stellen; AGES ergänzt den viralen FSME-Gegenstand. ECDC bestätigt konkret den Vergleich aktiv suchender erwachsener Hyalomma mit lauernden Ixodes. Historische Verbreitungs- und Häufigkeitsangaben wurden dabei nicht übernommen.
- **Einheiten:** PTB, NIST, BEV und BIPM sind getrennt verantwortete metrologische Institutionen. Eigene Zahlenfälle sind mathematische Anwendungen der Definitionen, keine übernommenen Natur- oder Materialmesswerte. Mehrere NIST-Seiten zählen als eine Organisation.

## Fachliche Präzisierungen und zurückgehaltene Angaben

1. **Hochsitze:** SVLFG VSG 4.4, Ausgabe 22.08.2024, § 7: Unternehmerpflicht, fachgerechte Errichtung/Absturzsicherung, Standsicherheit ortsveränderlicher Einrichtungen, Prüfung vor jeder Benutzung und mindestens jährlich sowie Abbau nicht mehr benötigter Einrichtungen. SVS, Stand 2026-2, gedruckte Seiten 22–24: mindestens zweimal jährlich eingehend prüfen plus Sichtprüfung vor jeder Benutzung als österreichischer Präventionshinweis. Das ist weder eine neue deutsche Frist noch eine einheitliche kantonale Schweizer Regel. Keine Zahlen für Querschnitte, Leiterwinkel oder Überstiegsmaße. Kein Foto und kein qualitatives Modell ist eine Belastungsfreigabe.
2. **Kennzeichnung:** Der aktuell tatsächlich gelesene § 24 WaffG nennt die Munitionsverpackung in **Absatz 4**. Ein älterer Absatzverweis im § 39 BeschussV wurde deshalb nicht ungeprüft wiederholt. Österreichischer RIS-Text im bereitgestellten Stand 16.10.2026: Patronenprüfordnung 2013, insbesondere §§ 2, 9 und 11. Keine Behauptung einer Rechtsänderung am Prüfdatum. Keine Deutung nicht vorliegender Beschusszeichenbilder und keine operative Munitionswahl oder Waffenhandhabung.
3. **Bleiquellen:** BfR-FAQ vom 19.09.2011 bleibt eine historische Quelle; ihre alten pauschalen Portionsfreigaben und Grenzwertformulierungen werden nicht übernommen. Die aktuelle BLV-Webseite rät empfindlichen Gruppen vorsorglich vom Wildfleischverzehr ab, weil die verwendete Munition nicht immer feststellbar ist. Dies wird ausdrücklich als Schweizer Empfehlung bezeichnet. Die im Umfeld verlinkte BLV-PDF hat intern Stand 2015; ihr neueres Bereitstellungsdatum macht sie nicht zu einer neuen Studie von 2026.
4. **Originalstudie:** Green und Mitautoren, publiziert 2022, untersuchten acht in Großbritannien verkaufte und 2016 erlegte Fasane. CT-Nachweis kleiner Metallfragmente und chemische Analyse geborgener größerer Stücke werden unterschieden. Die kleinsten Partikel wurden nicht ausnahmslos einzeln chemisch bestimmt. Keine Übertragung von Häufigkeiten auf heutiges DACH-Wildbret, keine vermeintlich garantierte Ausschneidedistanz und keine Rekonstruktion einer persönlichen Dosis aus einem Foto.
5. **Toxikologie:** WHO-Information vom 10.06.2026 und EFSA-Einordnung vom 20.04.2010 werden zeitlich benannt. Fehlende bekannte unschädliche Exposition bedeutet nicht, jede einzelne Portion müsse bei jeder Person die gleiche akute Vergiftung auslösen. Eigener Rechenfall: 0,4 mg/kg × 0,25 kg = 0,1 mg **enthaltene** Bleimenge, ohne Sicherheits- oder Diagnoseaussage.
6. **Bakterien:** Campylobacter-Aussagen gelten für die hier beschriebenen lebensmittelrelevanten, thermotoleranten Keime und übliche Lebensmittelbedingungen. Kein allgemeines Unvermögen jeder Campylobacter-Art zu Wachstum unter jedem denkbaren Laborzustand. BfR/AGES wurden hinsichtlich Salmonellenvermehrung, Überleben bei Einfrieren und Listerien-Kältewachstum verglichen. Alte Serovar-Anzahlen, feste Infektionsdosen, Verdoppelungszeiten und Koch-/Laborparameter wurden nicht übernommen. FSANZ, März 2022, dient nur den benannten biologischen Punkten; keine lokalen Grenzwerte.
7. **Zecken:** RKI-Frageabschnitte tragen unterschiedliche ältere Bearbeitungsdaten; DGUV-Information ist Ausgabe April 2020. Ihre allgemeine Biologie wird nicht als neue Erhebung 2026 ausgegeben. Die historische DGUV-Karte und feste Übertragungswahrscheinlichkeiten bleiben unbenutzt. Keine starre saisonale Unbedenklichkeitsregel, keine individuelle Impfserie oder Behandlungsvorschrift. Die einfache öffentliche Prävention bleibt von medizinischer Diagnose und Behandlung getrennt.
8. **Physik:** Die PTB-Tabellen bestätigen Größen und Einheiten; historische rechtliche Verweise und die dortige alte Konstantentabelle werden nicht als aktuelle DACH-Rechtsprüfung verwendet. Das NIST-Video mit historischer Kilogramm-Darstellung wurde nicht als heutige Definition übernommen; die fehleranfällige Einheitenschreibweise eines NIST-Volumenbeispiels wurde nicht abgeschrieben. BIPM bestätigt die SI-Definitionen, BEV Dichte und Druck. Das angenommene g = 10 m/s² ist ausdrücklich nur eine Rechenvereinfachung. Eigene Modellbox: 0,6 × 0,4 × 0,3 m³ = 0,072 m³ = 72 Liter. Eigene Probe: 540 g / 600 cm³ = 0,9 g/cm³ = 900 kg/m³. Eigener gleichmäßig senkrechter Druckfall: 200 N / 0,02 m² = 10000 Pa = 0,1 bar. Keine Tragfähigkeitsfreigabe.
9. **Quellenrechte:** Es wurden keine Lehrbuchformulierungen, Bilder, Aktivitäten oder bestehenden Prüfungsaufgaben übernommen. OpenStax dient der Überprüfung allgemeiner physikalischer Fakten; eine Quellenangabe wird nicht als kommerzielle Nachdrucklizenz ausgegeben. Alle Fragen, Zahlenfälle und Erklärungen sind eigenständig.

## Medien

**Keine neuen Fotos, Videos, Diagramme oder sonstigen Medien importiert.** Die Kurse verwenden bei Integration die bereits vorhandenen realen Kategorie-Medien. Es werden keine neuen Herkunfts-, Lizenz- oder visuellen Prüfbehauptungen für diese Bestandsdateien erhoben. Keine Bildfrage verlangt, dass ein ungesehenes Foto eine innere Materialeigenschaft, Erregerfreiheit, Bleikonzentration oder ein historisches Prüfzeichen belegt.

## Technische Prüfung

- JSON erfolgreich eingelesen; 6 eindeutige Modul-IDs und 24 passende Lektion-IDs.
- Je Lektion sechs Fragen, je Frage vier unterschiedliche Optionen, gültige richtige Position, keine doppelte Frage innerhalb dieses Pakets.
- Je Kurs Antwortverteilung A/B/C/D = 6/6/6/6.
- Tatsächliche Verarbeitung durch den vorhandenen `prepareEvidenceModules`-Adapter: 6 Kurse, 24 Lektionen, 144 Fragen.
- 48 Claim-Blöcke mit mindestens zwei registrierten Quellen-URLs pro Block. Die URL-Zahl ist keine automatische Bestätigung von Unabhängigkeit oder Inhalt; die Rollen stehen oben und im Mapping.
- Ortsgebundene Fragen nennen Deutschland, Österreich, Schweiz oder DE/AT im Fragetext und tragen entsprechend begrenzte `countries`. Allgemeine biologische und physikalische Fragen bleiben DACH-übergreifend.
- Frage-IDs sind rohe kurze `q1` bis `q24`; mit dem späteren Modulpräfix maximal 58 Zeichen und damit unter 160.
- Normalisierter Stammvergleich mit dem tatsächlich geladenen bestehenden Lehrplan und zentralen Quizbestand: keine exakt gleich normalisierten neuen Fragestämme gefunden. Das ist ein Textvergleich, keine automatische Aussage über pädagogische Eigenständigkeit.
- Keine gemeinsamen Adapterdateien geändert, keine neuen Infrastrukturtests und kein Commit. Fachlicher Quellenabgleich und technische Prüfungen werden getrennt gewertet.

## Claim-Zuordnung je Lektion

### Ansitzeinrichtungen: Bauteile, Schäden und Verantwortung
Kategorie: Jagdpraxis. Vier Lektionen, 24 Fragen; A/B/C/D jeweils sechs.

**Vom Tritt zum Boden: Bauteile und Kraftübertragung** (`tragstruktur`)

- Bauteilrollen und Verbindungsmängel von Leitern: getrennte Funktionen von Holmen, Tritten und Auflagern. Die Kraftwegfolge ist ein eigenes qualitatives Lernmodell auf Grundlage des Kräftegleichgewichts; keine Dimensionierung.
  Quellen: [SVS · Wissenswertes für Jäger, Stand 2026-2](https://www.svs.at/cdscontent/load?contentid=10008.765752&version=1770814564), [HSE · How to check your ladder is safe before use](https://www.hse.gov.uk/work-at-height/ladders/how-to-check-ladder-is-safe-before-use.htm), [OpenStax · First Condition for Equilibrium](https://openstax.org/books/college-physics-2e/pages/9-1-the-first-condition-for-equilibrium).

- Trag- und Standsicherheit sowie Absturzsicherung beantworten unterschiedliche technische Schutzziele; auch Zugang gehört zur Einrichtung.
  Quellen: [SVLFG · VSG 4.4 Jagd, Ausgabe 22.08.2024](https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/4602f00372a5a47d/3ae5d95e332a/vsg4_4-jagd.pdf), [SVS · Wissenswertes für Jäger, Stand 2026-2](https://www.svs.at/cdscontent/load?contentid=10008.765752&version=1770814564), [Suva · Tragbare Leitern und Tritte,67028.D](https://www.suva.ch/de-ch/download/checklisten/tragbare-leitern-und-tritte/tragbare-leitern-und-tritte--67028.D/null).

**Schaden, Oberflächenspur und verdeckte Schwachstelle** (`material`)

- Sprossen-, Holm-, Verbindungs- und Auflagermängel als verschiedene Gefahren; nicht benutzen und verantwortliche Person informieren statt Belastungsversuch.
  Quellen: [SVLFG · An Hochsitzprüfung denken, 09.09.2025](https://www.svlfg.de/pm-jagd-hochsitze), [HSE · How to check your ladder is safe before use](https://www.hse.gov.uk/work-at-height/ladders/how-to-check-ladder-is-safe-before-use.htm).

- Gesundes tragendes Holz, Witterungseinfluss und sichere Gesamtkonstruktion; äußerer Anstrich ist kein Tragfähigkeitsnachweis als eigene Schlussfolgerung aus den Prüfanforderungen.
  Quellen: [SVLFG · VSG 4.4 Jagd, Ausgabe 22.08.2024](https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/4602f00372a5a47d/3ae5d95e332a/vsg4_4-jagd.pdf), [SVS · Wissenswertes für Jäger, Stand 2026-2](https://www.svs.at/cdscontent/load?contentid=10008.765752&version=1770814564), [SVLFG · An Hochsitzprüfung denken, 09.09.2025](https://www.svlfg.de/pm-jagd-hochsitze).

**Der Zugang endet nicht an der ersten Sprosse** (`zugang`)

- Glätte und Unebenheiten im Zugang, verschmutzte Tritte, bewegte Leiterfüße und Überstiegsrisiken; geänderte Bedingungen verlangen erneute Betrachtung.
  Quellen: [SVLFG · An Hochsitzprüfung denken, 09.09.2025](https://www.svlfg.de/pm-jagd-hochsitze), [HSE · How to check your ladder is safe before use](https://www.hse.gov.uk/work-at-height/ladders/how-to-check-ladder-is-safe-before-use.htm), [Suva · Tragbare Leitern und Tritte,67028.D](https://www.suva.ch/de-ch/download/checklisten/tragbare-leitern-und-tritte/tragbare-leitern-und-tritte--67028.D/null).

- Winterkleidung und Hängepunkte beim Übergang zum Sitz als konkrete organisatorisch-technische Gesichtspunkte; keine Übernahme numerischer Konstruktionsvorgaben.
  Quellen: [SVS · Wissenswertes für Jäger, Stand 2026-2](https://www.svs.at/cdscontent/load?contentid=10008.765752&version=1770814564), [Suva · Tragbare Leitern und Tritte,67028.D](https://www.suva.ch/de-ch/download/checklisten/tragbare-leitern-und-tritte/tragbare-leitern-und-tritte--67028.D/null).

**Prüfung, Meldung und Zuständigkeit richtig einordnen** (`verantwortung`)

- DE-Unternehmerpflichten aus § 7 VSG 4.4; jährliche Prüfung und Prüfung vor jeder Benutzung sind zusammen zu lesen. AT-SVS beschreibt andere Präventionshäufigkeit; Suva-Leiterbeschreibung ist keine kantonale Hochsitzregel.
  Quellen: [SVLFG · VSG 4.4 Jagd, Ausgabe 22.08.2024](https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/4602f00372a5a47d/3ae5d95e332a/vsg4_4-jagd.pdf), [SVS · Wissenswertes für Jäger, Stand 2026-2](https://www.svs.at/cdscontent/load?contentid=10008.765752&version=1770814564), [Suva · Tragbare Leitern und Tritte,67028.D](https://www.suva.ch/de-ch/download/checklisten/tragbare-leitern-und-tritte/tragbare-leitern-und-tritte--67028.D/null).

- Mangel an verantwortliche Person weitergeben; genaue Bauteil-/Ortsbeschreibung ist ein eigener Dokumentationsfall, keine amtliche Formularpflicht.
  Quellen: [SVLFG · An Hochsitzprüfung denken, 09.09.2025](https://www.svlfg.de/pm-jagd-hochsitze), [HSE · How to check your ladder is safe before use](https://www.hse.gov.uk/work-at-height/ladders/how-to-check-ladder-is-safe-before-use.htm).

### Beschuss und Kennzeichnung richtig lesen
Kategorie: Waffen & Sicherheit. Vier Lektionen, 24 Fragen; A/B/C/D jeweils sechs.

**Was ein Beschuss prüft und was er offenlässt** (`pruefzweck`)

- Technischer Sicherheitszweck, Maße/Funktion/Haltbarkeit und Abgrenzung von Treffleistung/Finish.
  Quellen: [Beschussamt München · Aufgaben und Prüfgrenzen](https://lmg.bayern.de/lmg/beschussaemter/muenchen/index.html), [BMWET · Beschussämter und Schießstätten](https://www.bmwet.gv.at/Themen/Technik-und-Vermessung/beschussaemter/).

- CE-Konformitätskennzeichnung und Beschussprüfung sind getrennte Systeme; keine pauschale Waffen-CE-Pflicht behauptet.
  Quellen: [Beschussamt München · Aufgaben und Prüfgrenzen](https://lmg.bayern.de/lmg/beschussaemter/muenchen/index.html), [BMWET · Beschussämter und Schießstätten](https://www.bmwet.gv.at/Themen/Technik-und-Vermessung/beschussaemter/), [Europäische Kommission · CE marking](https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking_en).

**Hersteller, Seriennummer und Kaliber unterscheiden** (`identitaet`)

- Identität, Typenbezeichnung und Kaliber als verschiedene Angaben in deutschen Kennzeichnungsvorgaben und österreichischem Prüfkontext. Fiktives Datenblatt ist eine eigene Begriffsübung.
  Quellen: [BMWET · Beschussämter und Schießstätten](https://www.bmwet.gv.at/Themen/Technik-und-Vermessung/beschussaemter/), [Deutschland · § 24 Waffengesetz](https://www.gesetze-im-internet.de/waffg_2002/__24.html), [Österreich · Patronenprüfordnung 2013, insbesondere §§ 2/9/11](https://ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008706).

- DE § 24 Abs. 1: benannter Geltungsrahmen und ausdrücklich vorhandene Ausnahmen; keine Ableitung einer globalen Pflicht für jedes Altstück.
  Quellen: [Deutschland · § 24 Waffengesetz](https://www.gesetze-im-internet.de/waffg_2002/__24.html), [BMWET · Beschussämter und Schießstätten](https://www.bmwet.gv.at/Themen/Technik-und-Vermessung/beschussaemter/).

**Eine Munitionspackung enthält mehrere Informationsebenen** (`packung`)

- DE Kennzeichnung kleinster Verpackungen aus § 24 Abs. 4 WaffG und § 39 BeschussV; AT § 2 Los/Packung und § 9 Angaben. Normen sind örtliche Rechtsquellen, BMWET erläutert unabhängig vom deutschen Recht die Prüfaufgabe.
  Quellen: [Deutschland · § 24 Waffengesetz](https://www.gesetze-im-internet.de/waffg_2002/__24.html), [Deutschland · § 39 Beschussverordnung](https://www.gesetze-im-internet.de/beschussv/__39.html), [Österreich · Patronenprüfordnung 2013, insbesondere §§ 2/9/11](https://ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008706), [BMWET · Beschussämter und Schießstätten](https://www.bmwet.gv.at/Themen/Technik-und-Vermessung/beschussaemter/).

- Losnummer zur Fertigungszuordnung gegenüber Stückzahl und Typ; eigenes Beispiel einer gemischten Packung als Grenze der Zuordnung.
  Quellen: [Österreich · Patronenprüfordnung 2013, insbesondere §§ 2/9/11](https://ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008706), [Deutschland · § 24 Waffengesetz](https://www.gesetze-im-internet.de/waffg_2002/__24.html).

**Anerkanntes Prüfzeichen und nationale Berechtigung** (`anerkennung`)

- CIP-Regeln und Mitgliederliste: technische gegenseitige Anerkennung, DE/AT-Mitgliedschaft, CH nicht auf eingesehener Liste; keine Gleichsetzung mit EU. Prüfstand von aktueller unbeschädigter Funktion unterscheiden.
  Quellen: [CIP · Aufgaben der Ständigen Internationalen Kommission](https://cip-bobp.org/de/cip), [CIP · Mitglieder des Übereinkommens](https://cip-bobp.org/de/membres), [Beschussamt München · Aufgaben und Prüfgrenzen](https://lmg.bayern.de/lmg/beschussaemter/muenchen/index.html), [BMWET · Beschussämter und Schießstätten](https://www.bmwet.gv.at/Themen/Technik-und-Vermessung/beschussaemter/).

- Technische Prüfung und nationale persönliche Waffenberechtigung sind getrennte Geltungsbereiche; Schweizer Waffenbesitz unterliegt eigenem Waffengesetz.
  Quellen: [CIP · Aufgaben der Ständigen Internationalen Kommission](https://cip-bobp.org/de/cip), [fedpol · Waffen und Munition](https://www.fedpol.admin.ch/de/waffen-munition).

### Blei im Wildbret: Eintrag, Aufnahme und Wirkung
Kategorie: Wildbret & Gesundheit. Vier Lektionen, 24 Fragen; A/B/C/D jeweils sechs.

**Umwelteintrag und Geschossreste sind verschiedene Quellen** (`eintragswege`)

- Blei als chemische Kontamination; Umwelt-/Nahrungsaufnahme und zusätzlicher Munitionseintrag; sichtbare große Stücke gegenüber kleinen Fragmenten.
  Quellen: [BfR · Blei aus jagdlich gewonnenem Wildbret,FAQ 19.09.2011](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zum-verzehr-von-wild-das-mit-bleihaltiger-munition-geschossen-wurde/), [BLV · Blei im Wildfleisch](https://www.blv.admin.ch/de/blei), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health), [Green und Mitautoren 2022 · Originaluntersuchung an Fasanen](https://pmc.ncbi.nlm.nih.gov/articles/PMC9394810/).

- Originalbefund 2022: acht UK-Fasane, Erlegung 2016, Micro-CT und chemisch analysierte geborgene Metallstücke; untere Partikel nicht einzeln analysiert. Primärstudie trägt diese Datenaussage, BfR bestätigt unabhängig den allgemeinen Partikelmechanismus; keine unabhängige Wiederholung derselben Messung behauptet.
  Quellen: [Green und Mitautoren 2022 · Originaluntersuchung an Fasanen](https://pmc.ncbi.nlm.nih.gov/articles/PMC9394810/), [BfR · Blei aus jagdlich gewonnenem Wildbret,FAQ 19.09.2011](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zum-verzehr-von-wild-das-mit-bleihaltiger-munition-geschossen-wurde/).

**Warum Knochen, Niere und Entwicklung eine Rolle spielen** (`wirkung`)

- Verteilung und Speicherung in Knochen/Zähnen; Freisetzung in Schwangerschaft und Empfindlichkeit der fetalen Entwicklung.
  Quellen: [BfR · Blei aus jagdlich gewonnenem Wildbret,FAQ 19.09.2011](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zum-verzehr-von-wild-das-mit-bleihaltiger-munition-geschossen-wurde/), [BLV · Blei im Wildfleisch](https://www.blv.admin.ch/de/blei), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health).

- Entwicklungsneurotoxizität, Nierenschädigung und fehlende bekannte unschädliche Exposition; Abwesenheit von Symptomen erlaubt keine persönliche sichere Dosis.
  Quellen: [BLV · Blei im Wildfleisch](https://www.blv.admin.ch/de/blei), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health), [EFSA CONTAM · Scientific Opinion on Lead in Food, 20.04.2010, Abstract](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2010.1570).

**Konzentration, gegessene Menge und Aufnahme trennen** (`exposition`)

- Exposition über mehrere Lebensmittel und Verzehrsmengen, innere Aufnahme und Empfindlichkeit als getrennte Begriffe. Rechenwert 0,4 mg/kg × 0,25 kg = 0,1 mg ist eigene dimensionsgerechte Anwendung, keine Quellenmessung.
  Quellen: [BLV · Blei im Wildfleisch](https://www.blv.admin.ch/de/blei), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health), [EFSA CONTAM · Scientific Opinion on Lead in Food, 20.04.2010, Abstract](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2010.1570).

- Räumliche Partikelverteilung begrenzt Aussagen einzelner Proben; verschlucktes und resorbiertes Blei nicht gleichsetzen, keine feste Aufnahmequote.
  Quellen: [Green und Mitautoren 2022 · Originaluntersuchung an Fasanen](https://pmc.ncbi.nlm.nih.gov/articles/PMC9394810/), [BfR · Blei aus jagdlich gewonnenem Wildbret,FAQ 19.09.2011](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zum-verzehr-von-wild-das-mit-bleihaltiger-munition-geschossen-wurde/), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health).

**Behördenempfehlung und Originalbefund mit ihrem Rahmen lesen** (`vorsorge`)

- Schweizer BLV-Empfehlung und empfindliche Gruppen; WHO bestätigt besondere Vulnerabilität, ist keine unabhängige Quelle einer Schweizer Behördenentscheidung.
  Quellen: [BLV · Blei im Wildfleisch](https://www.blv.admin.ch/de/blei), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health).

- Zeitliche Einordnung: BfR 2011, Green 2022/Proben 2016, WHO 2026; keine Übertragung beschränkter Proben auf sämtliche DACH-Arten und keine Gleichsetzung von Munitionsherkunft mit umfassender Lebensmittelsicherheit.
  Quellen: [BfR · Blei aus jagdlich gewonnenem Wildbret,FAQ 19.09.2011](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zum-verzehr-von-wild-das-mit-bleihaltiger-munition-geschossen-wurde/), [BLV · Blei im Wildfleisch](https://www.blv.admin.ch/de/blei), [WHO · Lead poisoning, 10.06.2026](https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health), [Green und Mitautoren 2022 · Originaluntersuchung an Fasanen](https://pmc.ncbi.nlm.nih.gov/articles/PMC9394810/).

### Lebensmittelbakterien: Eintrag, Überleben und Wachstum
Kategorie: Wildbret & Gesundheit. Vier Lektionen, 24 Fragen; A/B/C/D jeweils sechs.

**Vier Vorgänge, die oft verwechselt werden** (`begriffe`)

- Kontamination/Kreuzkontamination, Vermehrung, Überleben und keimabtötende Wirkung als unterschiedliche Sachverhalte; pathogener Nachweis ist nicht gleich sensorischem Verderb.
  Quellen: [BfR · Salmonellen](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/salmonellen/), [AGES · Salmonellen](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/salmonellen), [BfR · Campylobacter](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/campylobacter/), [AGES · Campylobacter](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/campylobacter), [BfR · Fragen und Antworten zu verdorbenem Fleisch](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch/).

- Erkrankungsentstehung hängt neben dem Erreger von Dosis und betroffener Person ab; Kontamination ist keine Aussage, jede Person werde gleich erkranken.
  Quellen: [BfR · Salmonellen](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/salmonellen/), [AGES · Salmonellen](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/salmonellen), [AGES · Listerien](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/listerien).

**Salmonellen: Reservoir, Serovar und Lebensmittelbedingungen** (`salmonellen`)

- Salmonella als Gattung, Serovare und Abgrenzung enteritischer gegenüber Typhi/Paratyphi-Erkrankungen; Reservoir und asymptomatisches Tragen.
  Quellen: [BfR · Salmonellen](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/salmonellen/), [AGES · Salmonellen](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/salmonellen).

- Wachstum unter passenden Bedingungen, kein sicherer Abtötungsnachweis durch Einfrieren und variable Dosis nach Mensch/Matrix.
  Quellen: [BfR · Salmonellen](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/salmonellen/), [AGES · Salmonellen](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/salmonellen).

**Campylobacter: Überleben ohne übliches Lebensmittelwachstum** (`campylobacter`)

- Gebogene gramnegative, nicht sporenbildende Campylobacter und mikroaerobe Bedingungen als Merkmale.
  Quellen: [BfR · Campylobacter](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/campylobacter/), [AGES · Campylobacter](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/campylobacter), [FSANZ · Compendium of Microbiological Criteria for Food, März 2022](https://www.foodstandards.gov.au/sites/default/files/publications/Documents/Compendium_revised%20Dec%202022.pdf).

- Asymptomatische Darmreservoire warmblütiger Tiere, Lebensmittel-/Kreuzkontaktwege und fehlendes übliches Lebensmittelwachstum bei möglichem Überleben.
  Quellen: [BfR · Campylobacter](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/campylobacter/), [AGES · Campylobacter](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/campylobacter), [FSANZ · Compendium of Microbiological Criteria for Food, März 2022](https://www.foodstandards.gov.au/sites/default/files/publications/Documents/Compendium_revised%20Dec%202022.pdf).

**Listerien: Umweltreservoir und Wachstum bei Kälte** (`listerien`)

- L. monocytogenes, Boden-/Wasser-/Pflanzen-/Betriebsreservoir und nachträgliche Verunreinigung.
  Quellen: [BfR · Listerien](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/listerien/), [AGES · Listerien](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/listerien).

- Wachstum bei Kühltemperaturen, Besonderheit verzehrfertiger Produkte und besonders gefährdete Gruppen; keine universelle Zeit-/Temperaturgarantie.
  Quellen: [BfR · Listerien](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/listerien/), [AGES · Listerien](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/listerien).

### Zecken im Revier: Kontakt, Erreger und Vorsorge
Kategorie: Wildbret & Gesundheit. Vier Lektionen, 24 Fragen; A/B/C/D jeweils sechs.

**Wie der Gemeine Holzbock seinen Wirt erreicht** (`kontakt`)

- Ixodes-Kontakt durch Abstreifen statt Sprung/Baumfall, vorherige Suche auf dem Wirt, Zeckenstich und Speichelübertragung.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908).

- Spinnentierzuordnung und artabhängige Unterschiede: aktive Annäherung anderer Gattungen nach RKI; keine Generalisierung aller Zecken als reine Lauerjäger.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908), [ECDC · Hyalomma marginatum, Factsheet for experts](https://www.ecdc.europa.eu/en/disease-vectors/facts/tick-factsheets/hyalomma-marginatum).

**Zeckenaktivität ist keine starre Kalenderregel** (`ort-zeit`)

- Habitate über geschlossenen Wald hinaus und saisonale/witterungsabhängige Aktivität; mögliche Kontakte auch im milden Winter.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908).

- Krankheitsbezogene aktuelle Risikoinformation getrennt von Zeckenvorkommen und weiteren Erregern; alte DGUV-Karte 2020 nicht aktualisiert übernommen.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908).

**FSME und Borreliose sind verschiedene Krankheiten** (`erreger`)

- Virus-FSME gegenüber bakterieller Lyme-Borreliose; erregerspezifische Wirkung der FSME-Impfung.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [AGES · FSME](https://www.ages.at/mensch/krankheit/krankheitserreger-von-a-bis-z/fsme).

- Stich/Übertragung/Infektion/Erkrankung nicht gleichsetzen, frühzeitige Entfernung ohne Schutzgarantie und mögliche fehlende Wanderröte.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908).

**Kontakt verringern und Veränderungen nachvollziehbar melden** (`vorsorge`)

- Bedeckende/helle Kleidung, geschlossene Schuhe, Sockenüberstand und zeitlich begrenzte Repellentienwirkung; keine Schutzgarantie.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908).

- Ganzkörperkontrolle, kleine Stadien, rasche Entfernung ohne Öl/Klebstoff sowie Zeitpunkt/Ort/Veränderung für ärztliche Klärung; keine Schrittfolge einer Behandlung.
  Quellen: [RKI · FAQ zu Zecken, Zeckenstich und Infektion](https://www.rki.de/SharedDocs/FAQs/DE/Zecken/Zecken.html), [BAG · FAQ Zecken und übertragene Krankheitserreger](https://www.bag.admin.ch/de/faq-zeckenuebertragene-krankheiten), [DGUV · Vorsicht Zecken,Information 214-078,AusgabeApril 2020](https://publikationen.dguv.de/widgets/pdf/download/article/2908).

### Größen und Einheiten: Masse, Dichte und Druck
Kategorie: Prüfung & Sprache. Vier Lektionen, 24 Fragen; A/B/C/D jeweils sechs.

**Masse ist nicht Gewichtskraft** (`masse-kraft`)

- Kilogramm/Masse und Newton/Gewichtskraft, lokale Fallbeschleunigung und 1 N = 1 kg·m/s².
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [NIST · SI Units – Mass](https://www.nist.gov/pml/owm/si-units-mass), [BIPM · SI-Kurzfassung,aktualisiert 2026](https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-concise-EN.pdf/2fda4656-e236-0fcb-3867-36ca74eea4e3?download=true&t=1780473467684&version=4.1).

- Eigene Anwendungen F = m · g mit ausdrücklich angenommenem g sowie einfache Massendifferenz bei einem gedachten Behälter. Zahlen sind keine Messdaten.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [NIST · SI Units – Mass](https://www.nist.gov/pml/owm/si-units-mass).

**Eine Länge wird zur zweiten oder dritten Potenz** (`flaeche-volumen`)

- SI-Flächen-/Volumeneinheiten, Hektar, Liter/dm³ und Milliliter/cm³; potenzierte Umrechnungsfaktoren.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [NIST · SI Units – Volume](https://www.nist.gov/pml/owm/si-units-volume), [BIPM · SI-Kurzfassung,aktualisiert 2026](https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-concise-EN.pdf/2fda4656-e236-0fcb-3867-36ca74eea4e3?download=true&t=1780473467684&version=4.1).

- Eigene geometrische Beispiele: Quaderprodukt und Formähnlichkeit bei Verdopplung aller Längen. Es sind elementare Ableitungen aus Fläche/Volumen, keine Hersteller-Kapazitätsangaben.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [NIST · SI Units – Volume](https://www.nist.gov/pml/owm/si-units-volume).

**Dichte verbindet zwei Messgrößen** (`dichte`)

- Dichte als Masse/Volumen, kg/m³, Verhältnisbetrachtung bei gleichem Volumen und Skalierung.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [BEV · Dichte](https://www.bev.gv.at/en/Topics/Metrology-Service/Metrological-Subject-Fields/Mass,-Density,-Viscosity/Density.html).

- Eigene Zahlenrechnung 540 g/600 cm³ = 0,9 g/cm³ = 900 kg/m³; Bezugsvolumen explizit benennen. Keine reale Materialdichte angegeben.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [NIST · SI Units – Volume](https://www.nist.gov/pml/owm/si-units-volume), [BEV · Dichte](https://www.bev.gv.at/en/Topics/Metrology-Service/Metrological-Subject-Fields/Mass,-Density,-Viscosity/Density.html).

**Druck ist Kraft auf eine Fläche bezogen** (`druck`)

- Druck = senkrechte Kraft/Fläche, Pa = N/m², bei gleichmäßiger Verteilung; Verhältnis bei geänderter Fläche.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [BIPM · SI-Kurzfassung,aktualisiert 2026](https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-concise-EN.pdf/2fda4656-e236-0fcb-3867-36ca74eea4e3?download=true&t=1780473467684&version=4.1), [BEV · Druck](https://www.bev.gv.at/Themen/Mess-und-Eichwesen/Messtechnische-Fachbereiche/Druck-Kraft-Haerte/Druck.html).

- Eigenes Modell 200 N/0,02 m² = 10000 Pa = 0, 1 bar, 1 bar = 100000 Pa; Mittelwert nicht automatisch lokaler Spitzenwert bei ungleichmäßiger Verteilung.
  Quellen: [PTB · Die gesetzlichen Einheiten in Deutschland](https://www.ptb.de/cms/fileadmin/internet/presse_aktuelles/broschueren/intern_einheitensystem/Die_gesetzlichen_Einheiten.pdf), [BEV · Druck](https://www.bev.gv.at/Themen/Mess-und-Eichwesen/Messtechnische-Fachbereiche/Druck-Kraft-Haerte/Druck.html).
