# Letzte Zugangsprüfung vor der Unterrichtsraum-Antwort

Technische Prüfung am 27. Oktober 2026 gegen `ab9a2143417ce5f8bd0aeb92c431bd16eddfe492`. Die Änderung betrifft nur die serverseitige Freigabe einer Raumantwort, keine Unterrichtsdaten, Rollen, Zahlungen, Konten, Quellen oder fachlichen Prüfstände.

## Ausgangsbefund

`getAcademyRoom` prüfte den aktuellen bezahlten Zugang am Anfang und nach den ersten Termin-/Angebots-/Schuldaten. Anschließend las es diese drei Datensätze nochmals parallel, um Storno, Veröffentlichung, Elternbeziehungen und Raumidentität zu kontrollieren. Eine während genau dieser letzten Lesevorgänge eintretende Kontolöschung, Neuanlage mit anderer Kontogeneration oder ein Zugangsverlust wurde vor der Rückgabe des Raumnamens jedoch nicht mehr geprüft.

Acht isolierte Ausgangsproben laden die tatsächlichen Module aus dem genannten Git-Stand. Sie verwenden eine tatsächlich mit dem echten Sessioncode signierte `g1`-Identität, das echte `requirePaidAccount` und `getAcademyRoom`; ausschließlich Datenbank, Zugangsprovider und Request sind synthetisch. Die Positivkontrolle erhält den vorgesehenen Raum. Eine bereits vorhandene `g2`-Neuanlage sowie Veränderungen vor dem zweiten Zugangskontrollpunkt werden durch die vorhandenen Schutzmaßnahmen abgewiesen. Dieselben drei Änderungen erst während der letzten Raumnachlese führen im Ausgangsstand noch zu HTTP 200 und Raumname. Der ausführbare Nachweis liegt außerhalb des Repos unter `work/regional-law-qa/audit-academy-room-final-access-oct27.cjs` im Chat-Arbeitsbereich.

Voraussetzung ist eine zu Beginn gültige, zugangsberechtigte Anfrage. Dies ist keine anonyme Raumabfrage oder generelle Umgehung des Bezahlzugangs. Die bestehenden Session-, Generations-, Publikations-, Objekt- und Zeitgrenzen werden ausdrücklich erhalten. Andere private Lernstatistik-RPCs besitzen zusätzlich transaktionsgebundene Generationsprüfungen und Profil-Lesesperren; diese wurden nicht als fehlende Eigentümerbindung dargestellt.

## Kleine Änderung

Nach dem letzten `Promise.all` wird das bestehende `verifySameAccess(req, access)` erneut aufgerufen. Es überprüft den aktuellen Zugang und vergleicht ihn weiterhin mit der ursprünglich signierten Identität der Anfrage. Eine neu angelegte `g2` wird nicht als Ersatz für das alte `g1`-Cookie übernommen. Die bisherigen beiden Kontrollpunkte bleiben bestehen.

Erst danach werden die bereits vorhandenen Prüfungen der Elternbezüge, Veröffentlichung, Terminabsage, unveränderten Raumidentität und aktuellen Uhrzeit ausgewertet. Dadurch zählt auch ein während dieser abschließenden asynchronen Zugangsprüfung eingetretenes Terminende. Die App-Route bleibt unverändert; Fehlerantworten behalten `private, no-store` und `Vary: Cookie` und enthalten keinen Raumnamen.

Diese erneute Prüfung schließt das konkret untersuchte letzte Lesefenster. Sie verspricht keine atomare Transaktion zwischen Datenbank, HTTP-Auslieferung und externem Videodienst. Bereits bekannte Raumnamen werden nicht zurückgerufen und ein bereits betretenes Videogespräch wird dadurch nicht technisch beendet. Es werden keine Datensätze geschrieben oder Eigentümer neu zugeordnet.

## Regressionen und Erhalt

`scripts/test-academy-room-final-access.cjs` enthält 26 neue Fälle mit echter signierter Session, echtem Zugangsreader und tatsächlicher GET-Route:

- Normale Raumausgabe nach allen drei aktuellen Zugangskontrollen; ausschließlich ursprüngliche `g1`-/E-Mail-Header.
- Bereits vorhandene `g2`, frühere Kontolöschung/Neuanlage/Zugangsverlust sowie jede dieser Änderungen während jedes der drei späten Datensätze.
- Storno, unveröffentlichtes Angebot, nicht freigegebene Schule, beide Elternzuordnungen und ersetzter Raumname.
- Fehler bei jeder späten Datensatzlese, Ausfall der letzten Profil- beziehungsweise Providerprüfung sowie Terminende während dieser letzten Prüfung.
- Private/no-store/Vary-Antworten und keine Raumdaten in Ablehnungen.

Zusammen mit `test-online-academy-server.cjs` und `test-online-academy-access.cjs` bestanden 50 unterschiedliche Tests ohne übersprungene Fälle unter Node 22.23.3. Die bestehenden Daten- und Zeitprüfungen, anonymen/ungezahlten Sperren, Adminmutationen und Metadatenbeschränkungen bleiben positiv beziehungsweise negativ geprüft. Sämtliche Module wurden ausschließlich mit isolierten Request-/Datenbank-/Provider-/Clock-Doubles ausgeführt: keine echten Konten, Raumaufrufe, POSTs, Zahlungen oder Rollenänderungen.

Nur `lib/online-academy-server.js` wurde als Produktdatei geändert. Kein Build, Installieren, Staging, Commit oder Push durch diesen Teilautor. Die fremde Afternoon-Datei bleibt bytegleich mit SHA-256 `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`. Unabhängige Gegenprüfung und tatsächliche Auslieferung werden gesondert dokumentiert.

## Unabhängige Gegenprüfung

Ein anderer Prüfer hat den tatsächlichen signierten g1-Sessionpfad und die ursprüngliche Account-/Generationsprüfung selbst gelesen. Seine 19 zusätzlichen isolierten Modul-/GET-Proben bestanden: bewusst angehaltene letzte Session-/Angebots-/Schullesungen mit erst danach eintreffender Löschung, g2-Neuanlage oder Zugangsverlust; aktuelle Zeit nach dem letzten Zugangs-Await; Profil-/Provider-/Datenbankfehler und Storno. Eine unveränderte eigene Gegenprobe gegen den tatsächlich aus Git gelesenen `ab9a214` liefert nach später Löschung noch einen Raum, der aktuelle Code weist sie ab. Alle Datenbankheader behalten die ursprüngliche Generation. Zusätzlich bestanden die 26 neuen und 24 bereits vorhandenen Fälle erneut. Nachweise außerhalb des Repos: `work/regional-law-qa/academy-room-independent-oct27.cjs` und `.txt`.
