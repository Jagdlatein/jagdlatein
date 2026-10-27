# Hand-, Arm- und Steuerfedern · 27. Oktober 2026

## Abgrenzung und Bestand

Der Geweih-/Horn-Grundblock ist bereits im Kurs `wissen-vertiefung-geweih-horn-gewebe-2026`, im Detailatlas und im Wildjahr vorhanden. Er wurde nicht dupliziert. Die Suche in Kursen, Glossar, Artenwissen, Atlas und Wildjahr ergab hingegen keine zusammenhängende Lesestelle für die hier ergänzten Federgruppen. Die vorhandene Bekassinenfrage über vibrierende äußere Steuerfedern bleibt unverändert und widerspricht dem neuen Grundbegriff nicht.

Angehängt wurden im vorhandenen Kurs `wissen-ausbau-federaufbau-funktion-2026` genau `schwingen` und `steuerfedern`: jeweils147 Wörter, zusammen294; drei eigene Verständnisfragen und drei daraus erzeugte Karten. Die Übungen sind ausdrücklich eigene Skizzenmodelle. Keine neue Kategorie, Route, Fotografie oder Grafik.

## Tatsächlich gelesene Belegstellen

| Aussageblock | Geeignete, unabhängig verantwortete Quellen und konkrete Lesestellen |
| --- | --- |
| Anatomische Zuordnung in `schwingen` | [BTO, Ginn/Melville1983, Reprint1995](https://www.bto.org/sites/default/files/moult-in-birds-web.pdf), Kapitel Remiges: Primaries und Secondaries, gedruckte S.11–12; [USFWS Feather Atlas](https://www.fws.gov/lab/featheratlas/glossary.html), Glossary: Primary und Secondary. |
| Qualitative Flugbeiträge in `schwingen` | [Cornell Bird Academy](https://academy.allaboutbirds.org/feathers-article/), Flight, Absätze Primaries/Secondaries; [University of Waikato2011](https://www.sciencelearn.org.nz/resources/308-feathers-and-flight), Primary feathers und Secondary feathers. |
| Begriffe in `steuerfedern` | BTO, Remiges/Rectrices, S.11–13; USFWS, Remiges/Rectrices. |
| Steuerbeitrag in `steuerfedern` | Cornell, Tail feathers und Flight; Waikato, Rectrices. |

Die vier konkreten Claim-Paare und ihre Lesestellen stehen zusätzlich im Datensatz. Es handelt sich um Anatomie- und Funktionsdarstellungen; mehrere Lehrquellen sind keine experimentelle Replikation. BTO und Cornell waren schon vorhanden: ihre acht alten Kursquellenobjekte bleiben vollständig erhalten. Nur USFWS und Waikato wurden neu und ausschließlich auf die beiden Lektionen begrenzt angehängt.

Keine Zahlen, ausschließlichen Aufgaben, Tertial-Abgrenzung, Bremswirkung, Federverlust-/Flugunfähigkeitsgarantie, sichere Einzelfeder-Art- oder Altersbestimmung oder Eingriffsanleitung übernommen. Insbesondere werden die weitergehenden Sätze in den Quellen über Federzahlen und Federentfernung nicht gelehrt. Die neue Prüfung gilt nur den angegebenen Blöcken; das Kursdatum16.Oktober und alle älteren Lektionsdaten bleiben erhalten. Nur die zwei neuen Lektionen tragen den27.Oktober.

## Technische Nachweise

`scripts/test-flight-feather-learning.cjs`: acht Fälle bestanden, kein übersprungener Fall. Geprüft werden vollständige Rohdaten- und Kursobjekte, alle198 alten Kurse und1725 alten Karten samt116 Starterkarten und Reihenfolge gegen `ab9a214`. Dabei wird zusätzlich nur der separat autorisierte Anhang `laufprofil`/`flintenpatronen` mit seinem eigenen exakten Helper ausgenommen. Kein ganzer Kurs, unbekanntes Feld oder allgemeines Datum wird aus den Vergleichen entfernt. Sechs alte Lektionen,19 Fragen und acht Quellenobjekte des Federkurses bleiben exakt.

Die neuen Fragen/Karten, vorhandenen Länderpools, konkreten Such-Lektionsziele, statischen Kursdaten, vollständigen Offlinepakete mit Ablaufgrenze sowie beide wirklichen Kursansichten sind geprüft. Die Texte stehen jeweils vollständig vor dem geschlossenen abschließenden Quellenblock. Die foreign Afternoon-Datei hat unverändert SHA256 `23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9`.

Rohnachweise außerhalb des Repos: `work/regional-law-qa/flight-feather-baseline-ab9a214.json` und `flight-feather-tests-final.txt`. Historische Gemeinschaftstests wurden in diesem Schritt nicht geändert; keine visuelle Geräteprüfung oder vollständige fachliche Zertifizierung behauptet.

## Unabhängige Prüfung und historische Testfolgen

Ein zweiter Reviewer las die vier konkreten Quellenstellen selbst und bestätigte den engen Fachtext, Fragen-/Kartenkern und die Datumsrollen. Seine zusätzliche vollständige Bestandsprobe liegt außerhalb des Repos in `work/regional-law-qa/flight-feather-independent-oct27.json`. Die separat verfassten Waffen-Begriffslektionen wurden umgekehrt anhand ihrer acht Originalquellen und einer eigenen positiven Altobjektprobe gegengeprüft; Nachweis `firearm-terms-independent-review.json`.

Anschließend wurden in zehn ausdrücklich freigegebenen historischen Testdateien zunächst74 Fälle ausgeführt;18 scheiterten an den neu angehängten Objekten. Die Anpassung komponiert ausschließlich `flightFeatherBaselineFixture` und `firearmTermsBaselineFixture` mit den bereits vorhandenen älteren Projektionen. Drei direkt gelesene Wildlife-Dogs-Rohdatensatzfixtures verwenden dieselbe exakte Federprojektion. Es werden nur die vier benannten neuen Lektionen, sieben Fragen, zehn Quellen und ihre Evidence-/Kartenobjekte aus historischen Vergleichen genommen; sämtliche83 ursprünglichen Hash-Golden-Vorkommen bleiben unverändert. Die technische neue `miniCourseLinks`-Propsprüfung des Root-Agenten bleibt erhalten.

Die zehn historischen Dateien bestanden danach74/74 Fälle; zusammen mit den beiden neuen Inhaltsdateien92/92, ohne Skip. Keine Produktdaten wurden für diese Fixtureanpassung verändert. Logs und Golden-Nachweis: `flight-firearm-historical-initial.txt`, `flight-firearm-historical-final.txt`, `flight-firearm-historical-goldens.json` im genannten externen Arbeitsordner.
