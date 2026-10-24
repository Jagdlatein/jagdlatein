# Fotohelfer: Wildbret, Kategorie und aktuelle Fotoanfrage

## Konkreter Anlass

Ein Wildbretfoto erhielt keine passende Einordnung. Der bisherige erlaubte Motivausgang enthielt weder Fleisch noch Wildbret und nur fünf Lernkategorien. Die Anweisung musste solche Motive als unbekannt behandeln. Ein leistungsfähigeres Modell allein hätte diese Kataloglücke nicht behoben.

Daneben reproduzierte eine unabhängige technische Prüfung mit isolierten Komponenten tatsächlich zwei Lebenszeitfehler: Ein aufbewahrter Erkennen-Handler konnte nach Unmount noch einen POST starten; nach einem Wechsel A → B konnte er das frühere Foto A senden und die Ansicht B im Vorbereitungszustand belassen. Die bisherigen Tests waren trotz dieser Lücken erfolgreich. Bei einer Limitmeldung gab es bisher keinen erneuten bildfreien Verfügbarkeitscheck.

## Begrenzte Änderungen

- Das neue allgemeine Motiv `meat` führt zum unveränderten kanonischen Lernbereich Wildbret & Gesundheit. Es umfasst die Motivgruppe Fleisch, auch verpackt, ohne Herkunft von Wildtieren, Tierart, genaues Teilstück oder Genusstauglichkeit zu behaupten.
- Die KI-Anweisung betrachtet zuerst die gesamte Bildfläche einschließlich Rand und Verpackung, dann die Motivgruppe und erst danach unterscheidbare Einzelmerkmale. Unklar erkennbare Inhalte bleiben unbekannt. Erkennbares Fleisch muss nicht mehr wegen fehlender Motiv-ID verworfen werden.
- Die vorhandenen 54 Motive und fünf Kategorien bleiben vollständig erhalten; hinzu kommen genau ein Motiv und eine bestehende Lernkategorie. In kompakten Katalogzeilen bleiben ID, Typ, Titel, Kategorie und wissenschaftlicher Name erhalten. Der gemessene Requestteil ohne Bild umfasst 8.514 UTF-8-Bytes und bleibt unter der vorhandenen konservativen 11.000-Byte-Prüfgrenze.
- Unsichere Alternativen dürfen eine gemeinsame vorhandene Lernkategorie behalten. Daraus wird keine bestätigte Art abgeleitet. Gemischte Kategorien bleiben ohne abgeleitete gemeinsame Kategorie; `unknown` bleibt unbekannt.
- Wildbretresultate führen direkt zu den vorhandenen Teilstückvergleichen und Hygienefällen. Das Modell erzeugt keine Lern-URLs oder neuen Fachtexte. Die vorhandenen geprüften Vergleichsfakten bleiben unverändert.
- Fotoidentität, aktuelle Aktionsrunde, Montagezustand und laufende Anfrage werden vor UUID, Fotoübertragung oder Zustandsänderung geprüft. A → B → A vor Effect-Ausführung, alte Retryhandler und Unmount sind eigene Regressionen. Der Versand verlangt weiterhin den ausdrücklichen aktuellen Klick; kein automatischer Upload oder Wiederholungsversuch.
- Das bestehende Modell GPT-6 Astra bleibt erhalten. `reasoning.effort` ist nun `high`; Bilddetail `high`, höchstens 1.600 Pixel pro Kante, 4.096 maximale Outputtokens einschließlich Reasoning, 45 Sekunden Anbieterzeitlimit, Standard-Tier und alle Kontingente bleiben unverändert. Mehr Reasoning ist keine gemessene Genauigkeits- oder Latenzgarantie.
- Erlaubte Anbieter-Fehlercodes unterscheiden Kontingent/Guthaben/Ausgabenlimit von vorübergehender Auslastung. Authentifizierung und bekannte Modell-/Konfigurationsfehler sind eigene sichere Dienstfehler. Keine beliebigen Fehlermeldungen, Bilder, Schlüssel, Header oder Kontodaten gelangen in Antwort oder Diagnoseprotokoll. Eine Dienstfehlermeldung ist kein Nachweis einer aktuell solchen Produktivstörung.

## Quellen und technische Gegenprüfung

Am 24. Oktober tatsächlich gelesen: [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [Images and vision](https://developers.openai.com/api/docs/guides/images-vision) und [Error codes](https://developers.openai.com/api/docs/guides/error-codes). Modellfähigkeit, unterstütztes Reasoning und Bildverarbeitung stammen aus den offiziellen OpenAI Docs; die neue Lernzuordnung bleibt eine Katalogentscheidung der App. Es wurden keine neuen biologischen oder lebensmittelkundlichen Tatsachen ergänzt oder fachlichen Prüfdaten geändert.

Die unabhängige Gegenprüfung bestätigte vollständige Erhaltung aller alten Motive/Kategorien und aller fünf Katalogfelder. Zusätzliche isolierte Prüfungen untersuchten 3.025 unsichere Kandidatenpaare und die eng erlaubte Fehlerstatusmatrix. Die Regressionen prüfen echte Komponenten und API-/SQL-Grenzen mit Doubles, keine künstlichen Erfolgsquoten. Ein echter neuer Anbieter-Bildtest benötigt eine eigene Freigabe: Das frühere begrenzte Kontingent von fünf bezahlten Testanfragen ist vollständig verwendet. Ohne einen solchen neuen Test wird keine erfolgreiche Live-Wildbreterkennung dieses Stands behauptet.

Das lokale Fototagebuch, Benutzer-/Zahlungsdaten, Konfiguration, verteilte Tages-/Monatsquoten und der fremde afternoon-JSON-Stand wurden nicht verändert. Es gibt keinen neuen Anbieter und keinen neuen kostenpflichtigen Dienst.

Der abschließende lokale gemeinsame Lauf bestand 670 unterschiedliche Tests ohne übersprungene Fälle, einschließlich Fotoaufbereitung, nativer Fotoübergabe, Einwilligung, SQL-Kontingenten, Fehlercodes und dem getrennten Länder-Unterkategorienpaket. Der Produktionsbuild erzeugte erfolgreich 509 statische Seiten. Die Ergebnisse sind keine Live-Genauigkeitsmessung.
