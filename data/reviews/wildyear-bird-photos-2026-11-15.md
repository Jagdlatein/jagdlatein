# Wildjahr: 24 ergänzende echte Vogelfotos

Quellen- und Sichtprüfung am 15. November 2026. Dieser Bericht umfasst ausschliesslich den autorisierten `contentBatch` aus dem ausserhalb des Repos liegenden `work/wildyear-photos-nov15/photo-audit.json`: Waldschnepfe bis Rackelwild. Die übrigen Fotos, UI und Integration werden von anderen Teamteilen separat geprüft.

## Vorgehen und Grenzen

`AGENTS.md` und `KNOWLEDGE_POLICY.md` wurden gelesen. Die neuen Bilder sind tatsächliche Fotografien. Es wurden keine generierten Lehrbilder, historischen Zeichnungen, Elternarten als Ersatz für einen Hybrid oder kostenpflichtigen Quellen verwendet. Die Artenzuordnung beruht auf der tatsächlich gelesenen Originaldateibeschreibung und den ursprünglichen Kategorien; bei den meisten Arten wurde zusätzlich der exakte wissenschaftliche Taxonname mit der Wikidata-P225/P18-Zuordnung abgeglichen. P18 war ein Suchhinweis, keine automatische inhaltliche Freigabe.

Die tatsächlich gelesenen Commons-Originalmetadaten enthalten Urheber, Beschreibung, Lizenz und Dateiinformationen. Der erfolgreiche erste gemeinsame ImageInfo-Abruf ist unverändert ausserhalb des Repos gesichert. Später drosselte Wikimedia weitere API-Abfragen mit HTTP 429; es wurden keine Zugriffsbeschränkungen umgangen. Für die zwei bewusst gewechselten Motive wurden die normalen öffentlich erreichbaren Originaldateiseiten samt vollständigem HTML gelesen und gesichert. Suchtreffer allein waren keine Lizenzfreigabe. Die verwendeten CC-BY-, CC-BY-SA- und CC0-Lizenzbedingungen wurden auf den jeweiligen Creative-Commons-Originalseiten geprüft; auch kommerzielle Verwendung ist unter ihren Bedingungen erlaubt. Bei ShareAlike bleibt die lokale Fassung unter derselben Bildlizenz.

Alle 24 tatsächlichen lokalen Bilder wurden visuell angesehen: vier Kontaktbögen mit jeweils sechs Bildern, die gewechselte Stadttaube zusätzlich einzeln und im erneuerten Kontaktbogen sowie Rackelwild zusätzlich als Einzelbild. Es wurden keine Alters-, Gesundheits-, Monats-, Aufnahmezeit-, Verhaltensabsichts- oder DACH-Standortangaben aus dem blossen Bild erfunden. Beschreibungen aus den Ursprungsmetadaten bleiben als Herkunftsnachweis getrennt; das Artenfoto ist kein Nachweis des gerade ausgewählten Wildjahr-Monats. Insbesondere ähnliche Möwen wurden nicht allein anhand einer generischen Suchbeschriftung zugeordnet: wissenschaftliche Artkategorien und Originalbeschreibungen stimmen jeweils mit dem Ziel überein.

## Bewusste Auswahlkorrekturen

- **Kuckuck:** Das zunächst gefundene P18-Foto war nur GFDL 1.2-lizenziert. Es wird nicht verwendet. Ersatz ist die tatsächliche Fotografie `Common cuckoo Cuculus canorus.jpg` von Иван Везенковић (VezeIvan), ausdrücklich CC BY-SA 4.0 und in der Originalbeschreibung als Cuculus canorus aus Serbien bezeichnet.
- **Verwilderte Haustaube:** Ein eindeutig zugeordneter Erstkandidat zeigte die Taube im ganzen Bildrahmen zu klein; ein zweiter war stark im Gegenlicht. Statt diese Bilder für die App zuzuschneiden, wurde ein klar erkennbares vollständiges Portrait `Feral pigeon.jpg` gewählt. Die Originalseite nennt ausdrücklich Feral pigeon (Columba livia), Urheber Von.grzanka und eine freie Lizenzwahl. Verwendet wird ausschliesslich CC BY-SA 3.0 aus der angebotenen Doppellizenz. Das Bild wird nicht als wildlebende Felsentaube ausgegeben.
- **Mittelsäger:** Die Commons-Angabe Artist lautet Channel City Camera Club, die Originalbeschreibung nennt ausdrücklich Photo by Steve Colwell. Deshalb bleiben **Steve Colwell / Channel City Camera Club** zusammen erhalten.
- **Rackelwild:** `Rackelhuhn.jpg` ist eine tatsächliche Fotografie von F. C. Robiller. Die Originalbeschreibung nennt ausdrücklich den Hybrid Tetrao urogallus × Lyrurus tetrix. Es handelt sich um keine Naumann-Zeichnung und kein nur umbeschriftetes Auer- oder Birkhuhn. Die Bildunterschrift kennzeichnet den Hybrid und behauptet keine eigenständige Art oder aus dem Bild allein bewiesene Abstammung. Die Quellfassung enthält laut Commons-Historie eine frühere Rotstichkorrektur durch MPF; dieser vorhandene Hinweis bleibt in den vollständigen Metadaten erhalten.

## Lokale Fassungen und Nachweise

Nur die 24 JPEG-Dateien `public/wildkunde/wildjahr-2026-11-15/{slug}.jpg` wurden neu geschrieben. Der gesamte veröffentlichte Bildrahmen bleibt erhalten; proportional verkleinert und als JPEG neu kodiert, ohne zusätzlichen Ausschnitt, künstlerische Bearbeitung oder Ergänzung. Die UI soll diese Bilder mit `object-fit: contain` anzeigen. Breite 640 bis 1280 Pixel, grösste Datei 364404 Bytes, zusammen 4542793 Bytes. Die natürliche kleinere Auflösung des Rackelbilds wurde nicht künstlich hochgerechnet.

Die vollständigen neuen Metadatensätze liegen ausserhalb des Repos in `work/wildyear-photos-nov15/content-photo-records.json` (24 Datensätze, SHA256 `1070a5cd14ef1060bacfa78df697b8aaf770bd1442999da7a2b5650a3ca92651`). Sie enthalten pro Foto die kanonische Ziel-ID und den Namen, lokale URL, Breite/Höhe, Bytes, SHA256, Originaldateititel, Urheber, Lizenz und Lizenz-URL, Original-/Credit-URL, Quellenbeschreibung und ursprüngliche Kategorien, Originalabmessungen, Download-/Originalmediendaten, Änderungen, Bildunterschrift und die tatsächlich erfolgte Sichtprüfung. Root übernimmt diese Angaben anschliessend in das kompakte Foto-Inventar und den vollständigen Nachweis. Insbesondere bei älteren CC-Versionen bleiben Originaltitel, Urheber und Lizenz im vollständigen Nachweis erhalten.

Kontaktbögen: `content-contact-01.jpg` bis `content-contact-04.jpg`. Tatsächlich gelesene API-/HTML-Nachweise: `content-source-evidence/`. Verwendete lokale Downloads und die bewusst verworfenen Kandidaten bleiben getrennt ausserhalb des Repos dokumentiert. Die Integrität der finalen JPEGs wurde vor Übergabe gegen jede im Manifest stehende SHA256 sowie Abmessungen und 500-KB-Grenze geprüft. Das ist eine technische Dateiprüfung und keine zusätzliche fachliche Zertifizierung oder Geräteprüfung.

## Verwendete Originale

| Ziel | Urheber | Gewählte Lizenz | Tatsächlich geprüfte Originaldatei |
| --- | --- | --- | --- |
| Waldschnepfe | Stephan Sprinz | CC BY-SA 4.0 | [Waldschnepfe (scolopax rusticola) - Spiekeroog, Nationalpark Niedersächsisches Wattenmeer.jpg](https://commons.wikimedia.org/wiki/File:Waldschnepfe_(scolopax_rusticola)_-_Spiekeroog,_Nationalpark_Nieders%C3%A4chsisches_Wattenmeer.jpg) |
| Bekassine | Hobbyfotowiki | CC0 1.0 | [Bekassine (Blick nach oben).jpg](https://commons.wikimedia.org/wiki/File:Bekassine_(Blick_nach_oben).jpg) |
| Haubentaucher | caroline legg | CC BY 2.0 | [Great Crested Grebe (52909695022).jpg](https://commons.wikimedia.org/wiki/File:Great_Crested_Grebe_(52909695022).jpg) |
| Kormoran | MPF | CC BY-SA 4.0 | [2021-05-05 Phalacrocorax carbo carbo, Killingworth Lake, Northumberland 1-2.jpg](https://commons.wikimedia.org/wiki/File:2021-05-05_Phalacrocorax_carbo_carbo,_Killingworth_Lake,_Northumberland_1-2.jpg) |
| Graureiher | Bengt Nyman from Vaxholm, Sweden | CC BY 2.0 | [Ardea cinerea EM1A2714 (27349354381).jpg](https://commons.wikimedia.org/wiki/File:Ardea_cinerea_EM1A2714_(27349354381).jpg) |
| Kolkrabe | Accipiter (R. Altenkamp, Berlin) | CC BY-SA 3.0 | [Corvus corax ad berlin 090516.jpg](https://commons.wikimedia.org/wiki/File:Corvus_corax_ad_berlin_090516.jpg) |
| Saatkrähe | Brian Snelson from Hockley, Essex, England | CC BY 2.0 | [Corvus frugilegus -Dartmoor, Devon, England-8.jpg](https://commons.wikimedia.org/wiki/File:Corvus_frugilegus_-Dartmoor,_Devon,_England-8.jpg) |
| Turteltaube | MPF | CC BY-SA 4.0 | [2015-05-21 Streptopelia turtur, Sutton Bank, Yorkshire 06.jpg](https://commons.wikimedia.org/wiki/File:2015-05-21_Streptopelia_turtur,_Sutton_Bank,_Yorkshire_06.jpg) |
| Verwilderte Haustaube | Von.grzanka | CC BY-SA 3.0 | [Feral pigeon.jpg](https://commons.wikimedia.org/wiki/File:Feral_pigeon.jpg) |
| Wacholderdrossel | Frankie Fouganthin | CC BY-SA 4.0 | [Björktrast (Turdus pilaris)-4.jpg](https://commons.wikimedia.org/wiki/File:Bj%C3%B6rktrast_(Turdus_pilaris)-4.jpg) |
| Lachmöwe | Andreas Trepte | CC BY-SA 2.5 | [Lachmöwe Chroicocephalus ridibundus.jpg](https://commons.wikimedia.org/wiki/File:Lachm%C3%B6we_Chroicocephalus_ridibundus.jpg) |
| Sturmmöwe | Andreas Trepte | CC BY-SA 2.5 | [Larus canus Common Gull in Norway.jpg](https://commons.wikimedia.org/wiki/File:Larus_canus_Common_Gull_in_Norway.jpg) |
| Silbermöwe | Rhododendrites | CC BY-SA 4.0 | [European herring gull vocalizing (00170).jpg](https://commons.wikimedia.org/wiki/File:European_herring_gull_vocalizing_(00170).jpg) |
| Mantelmöwe | Andreas Trepte | CC BY-SA 2.5 | [Great Black-backed Gull Larus marinus.jpg](https://commons.wikimedia.org/wiki/File:Great_Black-backed_Gull_Larus_marinus.jpg) |
| Heringsmöwe | Arild Vågen | CC BY-SA 3.0 | [Larus fuscus Finnboda 2012.jpg](https://commons.wikimedia.org/wiki/File:Larus_fuscus_Finnboda_2012.jpg) |
| Mittelmeermöwe | Jörg Hempel | CC BY-SA 2.0 DE | [Larus michahellis LC0046.jpg](https://commons.wikimedia.org/wiki/File:Larus_michahellis_LC0046.jpg) |
| Gänsesäger | Tony Hisgett | CC BY 2.0 | [Mergus merganser -Sandwell -England -male-8.jpg](https://commons.wikimedia.org/wiki/File:Mergus_merganser_-Sandwell_-England_-male-8.jpg) |
| Mittelsäger | Steve Colwell / Channel City Camera Club | CC BY 2.0 | [Merganser (53630992394).jpg](https://commons.wikimedia.org/wiki/File:Merganser_(53630992394).jpg) |
| Zwergsäger | Andreas Trepte | CC BY-SA 2.5 | [Mergellus albellus, Zevenhuizen, Texel, Netherlands 1.jpg](https://commons.wikimedia.org/wiki/File:Mergellus_albellus,_Zevenhuizen,_Texel,_Netherlands_1.jpg) |
| Waldkauz | Anil Öztas | CC BY-SA 4.0 | [Strix aluco, Neuss (DE) -- 2022 -- 0132.jpg](https://commons.wikimedia.org/wiki/File:Strix_aluco,_Neuss_(DE)_--_2022_--_0132.jpg) |
| Amsel | Kahvilokki | CC BY-SA 4.0 | [20190722 Turdus Merula 02.jpg](https://commons.wikimedia.org/wiki/File:20190722_Turdus_Merula_02.jpg) |
| Kuckuck | Иван Везенковић (VezeIvan) | CC BY-SA 4.0 | [Common cuckoo Cuculus canorus.jpg](https://commons.wikimedia.org/wiki/File:Common_cuckoo_Cuculus_canorus.jpg) |
| Wildtruthuhn | Caleb Putnam | CC BY-SA 2.0 | [Wild Turkey, Creekside Park, 8 May 2014 (14145843695).jpg](https://commons.wikimedia.org/wiki/File:Wild_Turkey,_Creekside_Park,_8_May_2014_(14145843695).jpg) |
| Rackelwild – Auer-/Birkhuhn-Hybrid | F. C. Robiller | CC BY-SA 3.0 | [Rackelhuhn.jpg](https://commons.wikimedia.org/wiki/File:Rackelhuhn.jpg) |

Die unabhängige Foto-/Metadaten-Gegenprüfung erfolgt vor der Veröffentlichung durch einen anderen Agenten. Es wurden keine Curriculumtexte, Prüfdaten alter Inhalte, Rechtsaussagen, Konten, Datenbanken oder Schutzregeln verändert. Die fremde Nachmittagsdatei und `marketing/` bleiben unberührt und ungestagt. Dieser Teilauftrag führte keinen Commit und keine Veröffentlichung aus.
