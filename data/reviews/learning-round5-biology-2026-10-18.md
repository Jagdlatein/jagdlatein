# Runde 5: Schilddrüse und Nebennieren

Tatsächlicher fachlicher Abgleich: **18. Oktober 2026**. Diese Prüfung betrifft ausschließlich die beiden neuen Kurse, ihre acht Lektionen und acht ergänzenden Fragen. Sie ist keine Neuprüfung des gesamten Jagdlatein-Bestands und kein medizinisches Gutachten.

Datensatz: `data/learning-round5-biology-2026-10-18.json`.

## Auswahl nach Bestandsaudit

Alle **177 registrierten Kurs- und 776 Lektionstitel** des aktuellen Bestands wurden gelesen. Die zunächst gekürzte Konsolenausgabe wurde abschnittsweise nachgelesen. Zusätzlich wurden passende Volltexte, bestehende Fragen und Arteninhalte mit den Begriffen Schilddrüse, Nebenniere, Thyroxin, Cortisol/Kortisol, Hypothalamus und benachbarten Organthemen abgeglichen.

Schilddrüse und Nebenniere kamen bisher überwiegend als falsche Antwortalternativen vor. Echte Nachbarthemen sind bereits vorhanden: Thermoregulation, GnRH/FSH/LH und Keimdrüsen, ADH und Niere, Oxytocin und Milch, Leberstoffwechsel sowie Hundeneurone. Sie werden hier nicht zu neuen Kursen umbenannt. Die beiden Ergänzungen erklären bislang fehlende Funktionsketten:

- **Schilddrüse: Jod, Hormonspeicher und Rückkopplung** – Follikelpolarität und extrazellulärer Vorrat; Jodierung und Kopplung; Transport und örtliche Deiodierung; TRH–TSH-Regelkreis. Kategorie Wildkunde.
- **Nebennieren: Alarmantwort und Cortisol-Regelkreis** – Rinde/Mark und chemische Hormongruppen; sympathisch-chromaffine Signalübersetzung; Steroidbildung und wichtige Wirkwege; CRH–ACTH-Regelkreis. Kategorie Hundewesen, ausdrücklich Säugermodell mit Hundebezug.

Die aktuelle Nutzersteuerung „nicht immer Fragen, einfach und sehr lernreich“ bestimmt den Umfang: **vier gegliederte Wissensabsätze je Lektion, nur eine optionale Ergänzungsfrage je Lektion**. Die Beispiele sind eigenständig erstellte Lernmodelle, keine neuen Tierbeobachtungen oder Versuche. Es gibt keine Zusatzmedien.

## Konkreter Quellenabgleich

Der Datensatz enthält **20 Claim-Gruppen** mit ihren genauen Quellenseiten. Die folgende Übersicht fasst die geprüften Gegenstände zusammen; die Aussage-zu-URL-Zuordnung steht vollständig im JSON unter `evidence` und wird vom vorhandenen Adapter direkt an den jeweiligen Lektionen angezeigt.

| Lektion | Fachgegenstand | Unabhängige Gegenprüfung |
|---|---|---|
| Follikel und Speicher | einschichtiges Epithel, Blut-/Lumenseite, Thyreoglobulin/Kolloid, gebundener Vorrat, Aufnahme und Proteinabbau vor Freisetzung | Ohio State Veterinary Histology; Rousset/Dupuy/Miot/Dumont in Endotext; CSU; ergänzend Kemppainen/Auburn |
| Jod und Hormonbildung | Jodidtransport, iodierte Tyrosinreste/Kopplung, T4/T3 mit vier/drei Jodatomen, Material gegen Steuerung unterscheiden | Endotext-Synthesekapitel; Ohio State; CSU-Chemie/Synthese; Kemppainen/Auburn |
| Transport und Aktivierung | T4 als Hauptsekretionsprodukt, Transportbindung/freie Fraktion, T4→T3 gegenüber reverse T3, lokale Aktivierung und intrazelluläre Rezeptoren | Heseltine/Texas A&M; CSU-Chemie/Physiologie; Peeters/Visser in Endotext; Kemppainen/Auburn |
| TRH und TSH | Vorwärtsweg und negative Rückkopplung; mehrere TSH-gesteuerte Schritte; Stoffwechsel, Wärmebildung, Entwicklung | CSU-Regulation/Physiologie; Heseltine/Texas A&M; Endotext-Synthesekapitel |
| Rinde und Mark | paarige eigenständige Organe nahe den Nieren, Säugergliederung, drei Rindenzonen und Hormongruppen, chromaffine Zellen | Ohio State; CSU-Anatomie; Van Vertloo/Iowa State; Rice/OpenStax; Carbone und andere |
| Nervensignal zu Hormon | präganglionäres Acetylcholin, chromaffine Katecholamine, Tyrosinvorstufe, Granulenvorrat/Exozytose, adrenerge Zielzellrezeptoren | CSU-Markhormone; UTHealth-Originallehre; Carbone und andere, Comprehensive Physiology; ergänzend Kemppainen und OpenStax |
| Cortisolentstehung und -wirkung | Cholesterin als Steroidvorstufe, geringe Speicherung fertiger Steroide, Stoffwechselbeiträge, intrazellulärer Rezeptor/Genexpression und ergänzende schnelle nichtgenomische Wirkungen | CSU-Glucocorticoide; Kemppainen/Auburn; Van Vertloo/Iowa State; Carbone zum Katecholaminvergleich; Tulane-Originalreview-Zusammenfassung für schnelle Wirkwege |
| CRH/ACTH-Rückkopplung | CRH→Vorderlappen-ACTH→Rindenglucocorticoide, negative Rückmeldung, Peptid gegen Steroid und neuraler Markweg gegen hormonellen Rindenweg | Van Vertloo/Iowa State; CSU-ACTH/Glucocorticoide; Kemppainen/Auburn; Rice/OpenStax |

### Eingesehene Originalquellen und Zugang

Die **19 eindeutigen URLs** sind im Datensatz mit Titel, verantwortlicher Institution und konkreten gelesenen Abschnitten registriert. Einige Originalseiten liefern bei direktem Aufruf 403, Zeitüberschreitungen oder eine Botprüfung. Wo das geschah, wurde der umfangreiche öffentlich indexierte **Originaltext derselben Seite** gelesen, nicht eine fremde Zusammenfassung. Die Metadaten behaupten an diesen Stellen ausdrücklich keinen erfolgreichen direkten Volltextabruf. Ein bloßer Linkfund wurde nicht als fachliche Bestätigung gezählt.

- [Ohio State: Thyroid Gland](https://ohiostate.pressbooks.pub/vethisto/chapter/thyroid-gland/) und [Adrenal Gland](https://ohiostate.pressbooks.pub/vethisto/chapter/adrenal-gland/): Originalabschnitte zu Mikroanatomie und Funktion gelesen.
- [Endotext: Thyroid Hormone Synthesis and Secretion](https://www.ncbi.nlm.nih.gov/books/NBK285550/): Abstract, Einleitung und relevante Originalabschnitte zu Zellpolarität, Jodid, Thyreoglobulin, Vorrat und Freisetzung gelesen. Autoren am Originalkapitel überprüft.
- [Endotext: Metabolism of Thyroid Hormone](https://www.ncbi.nlm.nih.gov/books/NBK285545/): relevante Originalabschnitte zu aktivierender/inaktivierender Deiodierung und örtlicher Verfügbarkeit gelesen. Peeters/Visser zusätzlich im ursprünglichen PubMed-Kapiteleintrag bestätigt.
- CSU-Schilddrüsenlehre: [Synthese](https://vivo.colostate.edu/hbooks/pathphys/endocrine/thyroid/synthesis.html), [Chemie](https://vivo.colostate.edu/hbooks/pathphys/endocrine/thyroid/chem.html), [Physiologie](https://vivo.colostate.edu/hbooks/pathphys/endocrine/thyroid/physio.html), [Regulation](https://vivo.colostate.edu/hbooks/pathphys/endocrine/thyroid/control.html). Die jeweils relevanten öffentlich indexierten Originalabschnitte gelesen.
- [Heseltine/Texas A&M: Overview of the Thyroid Gland in Animals](https://www.merckvetmanual.com/endocrine-system/the-thyroid-gland/overview-of-the-thyroid-gland-in-animals): öffentliche Originalabschnitte Physiology und Action vollständig in der Suchausgabe gelesen; Autoren-/Institutionskopf verifiziert. Direkter Abruf teilweise blockiert.
- [Kemppainen/Auburn: General Chemical Structure and Function of the Endocrine System of Animals](https://www.merckvetmanual.com/endocrine-system/endocrine-system-introduction/general-chemical-structure-and-function-of-the-endocrine-system-of-animals): Originalabschnitte zu Protein-/Peptidhormonen, Steroiden und veränderten Aminosäuren gelesen. Diese einzelne Quelle wird kursübergreifend verwendet, nicht doppelt als zwei unabhängige Bestätigungen gezählt.
- [Van Vertloo/Iowa State: Overview of the Adrenal Glands in Animals](https://www.merckvetmanual.com/endocrine-system/the-adrenal-glands/overview-of-the-adrenal-glands-in-animals): öffentlich indexierte Originalabschnitte zu Anatomie, Glucocorticoiden/Regelkreis und Mark gelesen; direkter Abruf teilweise blockiert.
- CSU-Nebennierenlehre: [Anatomie](https://vivo.colostate.edu/hbooks/pathphys/endocrine/adrenal/anatomy.html), [Markhormone](https://vivo.colostate.edu/hbooks/pathphys/endocrine/adrenal/medhormones.html), [Glucocorticoide](https://vivo.colostate.edu/hbooks/pathphys/endocrine/adrenal/gluco.html), [ACTH](https://vivo.colostate.edu/hbooks/pathphys/endocrine/hypopit/acth.html). Relevante Originalabschnitte öffentlich indexiert gelesen.
- [Carbone, Borges, Eiden, García und Hernández-Cruz: Chromaffin Cells of the Adrenal Medulla](https://pmc.ncbi.nlm.nih.gov/articles/PMC13070227/): im öffentlichen Originalindex Introduction, Synthesis/Storage, Granules und Didactic Synopsis gelesen. Direkter PMC-Aufruf zeigte Botprüfung. Bibliografie beim Originalverlag verifiziert: Comprehensive Physiology 9 (2019), 1443–1502, DOI 10.1002/j.2040-4603.2019.tb00098.x, American Physiological Society. Der Review fasst unterschiedliche Versuchsarten/Zellmodelle zusammen; keine dieser Einzelmessungen wird als Jagdhundstudie dargestellt.
- [UTHealth: Medical Neuroscience 2013, Acetylcholine Neurotransmission](https://nba.uth.tmc.edu/Assets/pdf/courses/2013_neuro_blk_1_v13.1.0_SCR.pdf): öffentlich indexierter Original-PDF-Abschnitt Seite 91 und beschrifteter Nebennierenast gelesen. Kein fremdes Schaubild übernommen.
- [Rice/OpenStax: The Adrenal Glands 17.6](https://openstax.org/books/anatomy-and-physiology-2e/pages/17-6-the-adrenal-glands): öffentliche Originalabschnitte zu Gliederung, Mark und Rindenachse gelesen; unpassende Humanwerte und starre Stressphasen nicht verwendet.
- [Tulane: Minireview – Rapid Glucocorticoid Signaling via Membrane-Associated Receptors](https://pubmed.ncbi.nlm.nih.gov/16946006/): Originalzusammenfassung gelesen. Sie bestätigt neben transkriptionsabhängigen Wirkungen rasche nichtgenomische Wege in verschiedenen Arten/Modellen; offene Rezeptormechanismen werden nicht vereinfacht festgelegt.

### Unabhängigkeit und aufgelöste Grenzen

Mehrere CSU-Unterseiten sind **eine** Quellenfamilie, ebenso die beiden Ohio-State-Kapitel. Merck-Veterinary-Beiträge verschiedener Universitätsautoren werden wegen gemeinsamer Verlags-/Begutachtungsstruktur nicht als einziges unabhängiges Paar eingesetzt. Jedes Claim-Bündel enthält deshalb passende Gegenbestätigung außerhalb dieser Familie. Endotext-Kapitel sind Fachübersichten benannter Autorenteams, keine voneinander unabhängigen Wiederholungen derselben Messung. NCBI/PMC ist hier der Zugangsweg und nicht ein zusätzlicher fachlicher Autor.

Konkrete Grenzen wurden bei der Auswahl berücksichtigt:

- Der Ohio-State-Nebennierentext unterscheidet die Vogelanordnung, enthält aber zugleich eine missverständliche pauschale Zonenformulierung. Der Kurs beschränkt den räumlichen Aufbau ausdrücklich auf Säuger.
- Schilddrüsenhormone sind iodierte Aminosäurederivate. Das große Thyreoglobulin ist ihr Synthese-/Speicherprotein; T3/T4 werden nicht selbst als Proteinhormone ausgegeben.
- Die äußere Drüsenform und Lappenverbindung unterscheiden sich zwischen Arten. Keine universelle Schmetterlingsform, Zahl sichtbarer Lappenverbindungen oder Organlage nach einem Humanschema.
- Keine universellen prozentualen freien T3/T4-Anteile, T3/T4-Potenzfaktoren, Katecholaminmischungen, Hormonhalbwertszeiten oder Morgenhöchstwerte.
- CSU beschreibt Katecholamin-Blutbindung anders als die Merck-Übersicht. Das ist für die gewählten Lernziele entbehrlich und wird nicht als neue Aussage veröffentlicht.
- Schnelle nichtgenomische Glucocorticoidwirkungen wurden zusätzlich zum klassischen Rezeptor-/Genexpressionsmodell durch die Tulane-Originalzusammenfassung abgeglichen. Keine Gleichsetzung „Steroid = ausschließlich langsam“.
- Kein starres Nacheinander kurzzeitiger Markantwort und erst später einsetzender Rindenantwort. Keine experimentellen Zeitwerte oder Feststellung eines subjektiven Zustands aus einem Hormonwert.
- Die vereinfachte OpenStax-Formulierung zu Muskelglycogen/Blutglucose wird nicht übernommen. Der Kurs nennt bei Cortisol die Gluconeogenese der Leber und allgemein die Mobilisierung von Ausgangsstoffen.
- Keine Hormonbehandlung, Jodzufütterung, absichtliche Stressprovokation oder eigenständige Gesundheitsdiagnose. Die Grenzen schränken die Lehraussagen ein, ersetzen jedoch nicht die eigentlichen Funktionsbeschreibungen.

## Inhaltliche Eigenprüfung

Alle acht Lektionen, richtigen Antworten und Erklärungen nochmals vollständig gelesen. Vier Absätze je Lektion vermitteln Aufbau, Vorgang, Zusammenhang und ein konkretes selbst erstelltes Lernbeispiel. Die ergänzenden Fragen sind positiv formuliert und ohne unsichtbare Antwortalternativen verständlich. Erklärungen vergleichen keine „anderen Antworten“ und bleiben als Lernkarten eigenständig.

Die vier Antwortpositionen sind je Kurs genau einmal vertreten, in unterschiedlicher Reihenfolge: Schilddrüse **2, 0, 3, 1**, Nebennieren **1, 3, 0, 2**. Bei der Cortisol-Vorstufenfrage wurden vier fachliche chemische Ausgangsstoffe als gleichartige Optionen gewählt. Keine korrekte Antwort wird durch ein einheitliches Positions- oder Längenmuster verraten.

Bestehende ADH-, GnRH-, Oxytocin-, Leber- und Nervensysteminhalte liefern Nachbarwissen, widersprechen den neuen spezifischen Achsen nicht. Gleichartige Grundbegriffe wie negative Rückkopplung werden auf einen neuen konkreten Regelkreis angewandt, nicht als zusätzliche Mengenlektionen ausgegeben. Bei der gezielten Suche wurden keine zu korrigierenden widersprüchlichen Bestandsaussagen bestätigt.

## Tatsächlich ausgeführte technische Prüfung

Mit dem vorhandenen Projekt-Modullader und **`prepareReviewedEvidenceModules`** geladen und validiert:

- 2 Kurse, 8 Lektionen, 32 Absätze, **1712 Wörter** in den Wissenstexten.
- Jede Lektion vier Absätze und mehr als 1000 Zeichen; pro Lektion genau eine Frage.
- Vier eindeutige Optionen, gültige richtige Antwort, ausgeglichene Positionen je Kurs.
- 20 Claim-Gruppen mit mindestens zwei registrierten Quellen-URLs; **19 eindeutige URLs**. Die Prüfung der fachlichen Unabhängigkeit erfolgte zusätzlich redaktionell, nicht nur durch URL-Zählen.
- Keine exakten normalisierten neuen Fragendubletten untereinander oder gegen die Fragen der 177 bestehenden Kurse. Zusätzlich inhaltlicher Themenabgleich wie oben beschrieben; Normalisierung ist kein semantischer Vollständigkeitsbeweis.
- Die echten neuen Module mit dem üblichen Antwortadapter in **`lib/learning-flashcards.js`** eingesetzt: **genau 8 tatsächlich exportierte Lernkarten**, vier je Kurs. Keine künstlichen Zusatzfragen für Karten und kein versteckter Pflichtfortschritt.
- Keine gemeinsamen Importdateien, Komponenten oder Medien geändert; kein Build, Commit oder Push durch diesen Autor.

Die technischen Prüfungen bestätigen Struktur und Verknüpfungen. Sie zertifizieren keine wissenschaftliche Fehlerfreiheit.

## Unabhängiger Kreisreview

Am **18. Oktober 2026** prüfte ein zweiter Autor den finalen Datensatz ausschließlich lesend: alle acht Wissenstexte, richtigen Antworten, Erklärungen und Claim-Gruppen sowie die Originalpassagen von Ohio State, Endotext, CSU, Merck Veterinary, OpenStax, Tasker/Tulane und Carbone. Ergebnis: **keine fachlichen Blocker**. Insbesondere Säugergeltungsbereich, T3/T4 als Aminosäurederivate, aktivierende und inaktivierende Deiodierung, Acetylcholin-/Katecholaminweg, Cholesterinvorstufe und zusätzliche schnelle Glucocorticoidwirkungen waren passend begrenzt. Der alternative Verlags-DOI des Carbone-Kapitels wurde ausdrücklich bestätigt. Es erfolgten keine fremden Dateiedits oder nachträglichen Änderungen der Lehraussagen.

Der umgekehrte Kreisreview der beiden Habitatkurse wurde ebenfalls lesend abgeschlossen. Die konkreten Pflanzenmodelle, Grenzen und Nachweise waren ohne verbleibenden fachlichen Blocker; das ist eine getrennte Prüfung und verändert diesen Datensatz nicht.

Bei der abschließenden Bibliografieprüfung wurde der Verlag **Endotext / MDText.com mit dem benannten Autorenteam** für das Synthesekapitel eingetragen; keine ungesicherte aktuelle Hochschulzuordnung einer älteren Kapitelversion. Das ursprüngliche Kapitel-PDF wurde zusätzlich direkt geöffnet und seine Titelseite/Einleitung gelesen. Wissenstexte, Fragen und Evidence-URLs blieben unverändert.

Stabiler Autorenstand: SHA256 **84e200af4a506b8b84e3f3e689cdfbf9a9df4a57f64297354fe46c29bfa427fb**.
