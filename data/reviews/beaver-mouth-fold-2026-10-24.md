# Biber: Mundhautfalte beim Unterwassernagen

Fachlicher Abgleich ausschließlich dieses neuen kurzen Lektionsblocks am **24. Oktober 2026**. Die bestehende Biberlektion und ihre Nachweise werden weder neu verfasst noch als vollständig neu geprüft ausgegeben.

## Tatsächlicher Bestand und enger Erkenntnisgewinn

Vor der Ergänzung wurden Biberporträt, `wildlife-depth`, Gebisswissen, bestehende Kurslektion, Fragen, Suchtexte und die Arten-Lernzuordnung nach Mundhautfalte, Backenfalte und Mundverschluss durchsucht. Der vorhandene Kurs `wissen-biber-schneidezaehne-2026` erklärte Schmelz, Dentin und Selbstschärfung; das Porträt ergänzte Nahrung, Spuren, Wintervorräte und Gewässernutzung. Eine verschließbare Mundhautfalte beim Unterwassernagen wurde dort nicht erklärt.

Der **bestehende Kurs** erhielt hinten genau eine zweite Lektion `mundhautfalte-unterwassernagen` mit 134 Wörtern Haupttext, einem Merksatz und einer eigenen begrifflichen Zuordnungsübung. Die enge Sachangabe lautet: Eine verschließbare Hautfalte im Maul ermöglicht dem Europäischen Biber, unter Wasser zu nagen. Als Verständnisbrücke werden Schneidwerkzeug und Mundverschluss nach ihren Aufgaben getrennt. Das bereits belegte Selbstschärfungswissen wird nicht erneut als neue Entdeckung erklärt.

Eine eigene Frage fragt nach der entsprechenden Struktur; eine daraus abgeleitete Lernkarte übernimmt dieselbe richtige Antwort und Erklärung. Kein künstliches Verdoppeln gleichartiger Fragen. Kein neuer Kurs, zusätzlicher Guidezugang oder neuer Navigationspfad.

## Erneut tatsächlich gelesene Quellen

| Fachquelle | Gelesener Abschnitt und Rolle |
| --- | --- |
| [info fauna / Schweizerische Biberfachstelle: Biologie](https://www.infofauna.ch/de/beratungsstellen/biberfachstelle/der-biber/biologie) | Abschnitt **Gebiss**, besonders der Absatz zur Hautfalte und zum Unterwassernagen, erneut am 24.10.2026 direkt gelesen. Die Fachstelle erklärt die Hautfalte als Verschluss gegen Wasser. Ein Veröffentlichungsdatum war auf der eingesehenen Seite nicht ausgewiesen; daraus wird kein neues Erscheinungsjahr abgeleitet. |
| [Oberösterreichische Umweltanwaltschaft: Handbuch von 2019](https://www.ooe-umweltanwaltschaft.at/Mediendateien/Biberhandbuch_web2.pdf) | **Kapitel 2.2, gedruckte S. 11 / physische PDF-Seite 21**: Aufzählung zur verschließbaren Hautfalte sowie Bildunterschrift 2.4 erneut gelesen. Auch das Impressum wurde abgeglichen: November 2019, Biologiekapitel Gerald Hölzler, Institut für angewandte Biologie und Umweltbildung; Handbuchautoren Hölzler, Habenicht und Baschinger, Herausgeber OÖ-Umweltanwaltschaft. Die Funktion beim Unterwassernagen wird ausdrücklich erläutert. |

Es handelt sich um zwei eigenständig redigierte Fachstellendarstellungen mit unterschiedlichen verantwortlichen Institutionen, **nicht** um zwei neue experimentelle Untersuchungen oder unabhängige Wiederholungen einer Anatomiemessung. Beide werden nur für ihre gemeinsam getragene Funktionsaussage herangezogen. Die ausführlichere Rachen-/Splitterformulierung der Schweizer Quelle wird nicht zu einer neuen präzisen Anatomie- oder Schlucklehre erweitert. Das ältere LWF-Werk wurde in der Vorrecherche als zusätzliche anatomische Einordnung gelesen, für die neue freigegebene Aussage jedoch nicht benötigt und nicht zusätzlich als Datenquelle eingebaut.

## Bewusste Grenzen

- Keine präzise Lage der Falte relativ zu Zähnen, Diastema oder übrigen Mundstrukturen; keine Abbildung oder anatomische Lagezeichnung übernommen.
- Keine Erklärung eines Schluckvorgangs, keine individuelle Tauchleistung und keine Tauchzeiten, Größen-, Häufigkeits- oder sonstigen Zahlenwerte.
- Keine Zahnchemie, Farbe, Härte-/Verschleißwerte oder andere Begleitangaben aus den beiden Fachtexten übernommen. Widersprüchliche oder hier nicht mehrfach geprüfte Begleitaussagen bleiben außerhalb dieses Blocks.
- Keine Diagnose, Behandlung, Eingriffs- oder Beobachtungsanleitung am Tier. Die Zuordnungsübung ist ein eigenes begriffliches Lernmodell.

Die Grenzen stehen auch im eigentlichen Lektions-/Fragentext. Quellen und konkrete Aussagezuordnung bleiben am bestehenden Quellenende; für das Verstehen muss kein externer Link geöffnet werden.

## Technische Integration und Bestandsschutz

Geändert wurden nur das vorhandene Dataset `data/learning-beaver-incisors-2026-10-24.json` und der einzeln autorisierte Wert `beaverTeeth: 2 → 3` in `lib/wildlife-learning-guide.js`. Loader, Kurs-ID, Kursname, Beschreibung, Länderhinweise, ursprüngliche Lektion, beide alten Fragen und deren Quellenzuordnung bleiben erhalten. Zwei neue Quellenrecords sind ausschließlich der neuen Lektion zugeordnet. Die beiden alten Karten behalten dadurch exakt ihre ursprünglichen zwei Fachquellen und sämtliche übrigen Felder.

Die neue Lektion trägt ausdrücklich `reviewedOn: 2026-10-24`; der bestehende Kurs war bereits auf diesen Tag datiert. Die Bereichsbeschreibung benennt beide getrennten Nachweisrollen und behauptet keine vollständige Biber-Neuprüfung. Historische Datensätze und Berichte werden nicht umdatiert.

Der vorhandene Porträt-Lesemechanismus erhält dieselben vollständigen Absätze, Merksätze, Übungen und Einzelbelege wie der Kurs. Der vorhandene bezahlte API-Endpunkt liefert nur Lesestoff, keine Quizschlüssel und keine fremden Arten. Suche, Quiz, Karten und Offlinepaket verwenden die bestehende Integration. Die drei Biber-Guideeinträge behalten sämtliche Felder und Reihenfolge; allein die tatsächliche Kartenzahl des vorhandenen Biberkurses steigt von zwei auf drei. **Alle 113 anderen Artenzuordnungen bleiben als vollständige Objekte exakt unverändert.**

## Positiver Abgleich gegen den tatsächlichen früheren HEAD

Das Original-Dataset wurde direkt aus HEAD **`c8a416b8cd7fb23525e37541b4ac1655ab97515f`** gelesen und mit dem historischen Loader im Speicher ausgewertet. Positiv gleich geblieben sind die komplette ursprüngliche 151-Wörter-Lektion, beide Fragen, beide ursprünglichen Quellen, die alte Evidenzzuordnung, alle 197 übrigen Kurse sowie alle 1710 bisherigen vollständigen Kartenobjekte in ihrer Reihenfolge einschließlich der 116 Starterkarten. Genau eine neue Lektion, Frage und Karte kommen hinzu.

Der neue Regressionstest hält zusätzlich feste JSON-Objekthashes fest:

| Bestand | SHA-256 |
| --- | --- |
| Unveränderte rohe ursprüngliche Lektion | `286f1051e8c15e42bd93a7fddc6266ae0f893cfcb2755217c9f831b7008ffaca` |
| Unveränderte rohe erste zwei Fragen | `3be537471869d4557489d42af2cfeab16eb8a35e47205a44e7d83b23effa4f3a` |
| Unveränderte erste zwei Quellenrecords | `59851f87dc808e3c42a64f2f705641a85b5ee682ff37a14e83a5435729d33650` |
| Beide alten vollständigen Karten | `96af31af82a5422df2edd9753e7d3cc177e55bfba3092f7313f8fc194515cd0b` |
| Alle 1710 alten Karten, nach ID sortiert | `9e6f8fde716b30bdb13238c0751522d35b88dcadc2b0d98cc578ce0affaf7a9f` |
| 116 Starterkarten in ihrer Reihenfolge | `54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9` |
| Alle 113 anderen vollständigen Artenguide-Zuordnungen | `d7bce2678395f5ebf109a2c4a44a464a78c00dbda55718be23a642cc7f9b6c6e` |

## Zählung und Prüfumfang

Der bestehende Biberkurs enthält nun **2 Lektionen / 3 Fragen / 3 Karten**. Das gesamte vorhandene Curriculum umfasst **198 Kurse / 847 Lektionen / 2703 Fragen**, die Kartenbank **1711 Karten**. Diese Zahlen beschreiben nur den technischen Bestand, keine fachliche Vollständigkeit.

Eigene neue Regression `scripts/test-beaver-mouth-fold-learning.cjs`: acht Fälle zu vollständigen Altobjekten, enger Quellenzuordnung und Datierung, unveränderten übrigen Kursen/Karten, Artenisolation und Guidebestand, eigener Frage/Karte, tatsächlichem bezahlten Leseendpunkt, tatsächlicher Porträtdarstellung/Suche sowie Offlinepaket einschließlich Ablauf. Die alten Biber-Testzählungen wurden ausschließlich an die tatsächlich neue zweite Lektion, dritte Frage/Karte und zwei zusätzlichen Quellen angepasst. Die ursprünglichen zwei Fragen werden weiterhin gesondert einschließlich ihrer Antwortpositionen geprüft. Der ältere Nasentest nimmt nur die exakte neue Biber-Lektions-ID aus seinem historischen 1709-Karten-Snapshot aus; sein Hash und sämtliche Starter-/Altobjektassertionen bleiben unverändert.

Eine weitere autorisierte enge Testfolge betrifft den historischen Komplett-Guidehash des Rehwild-Zahntests: Vor dessen unverändertem historischem Hash wird ausschließlich die inzwischen explizit erlaubte Biber-Kartenzahl für die exakte Biber-Kurs-ID von drei auf ihren alten Wert zwei normalisiert; der echte aktuelle Wert drei wird vorher ausdrücklich geprüft. Alle übrigen Felder und die alte Reh-Zuordnung bleiben gleich. Der neue Biber-Test weist unabhängig davon alle 113 Nicht-Biber-Zuordnungen als vollständige unveränderte Objekte nach.

Abschließender Lauf am 24.10.2026: **96/96 Tests bestanden**, keine übersprungenen Fälle. Enthaltene Dateien: `test-beaver-mouth-fold-learning`, `test-beaver-incisors-learning`, `test-dog-sniff-airflow`, `test-wildlife-learning-guide`, `test-wildlife-study-content`, `test-wildlife-knowledge`, `test-learning-topic-tree`, `test-learning-growth-oct18`, `test-learning-search-offline`, `test-red-deer-voice-learning`, `test-roe-premolar-learning`, `test-flashcard-review`, `test-flashcard-selection` und `test-flashcard-payload` (jeweils `scripts/*.cjs`). `git diff --check` erfolgreich. Die Produktionsprüfung erfolgt getrennt durch den Hauptarbeitsabschnitt.

Technische Tests bestätigen Integration und Bestandsschutz. Sie sind keine vollständige neue biologische Prüfung aller Inhalte. Keine Konten, Zahlungen, Medien oder Offline-Speicherrechte geändert; kein Commit oder Push durch diesen Arbeitsabschnitt.
