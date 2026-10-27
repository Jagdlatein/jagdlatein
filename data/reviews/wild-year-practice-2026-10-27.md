# Kalenderübung im Wildjahr

Technischer und redaktioneller Projektionsabgleich am 27. Oktober 2026. Keine neue biologische Prüfung und kein amtlicher Fragenkatalog.

## Lernzweck und Herleitung

Die Übung fragt ausdrücklich, welche Phase das bestehende Jahresmodell einem Monat und einem bestimmten Bereich zuordnet. Sie behauptet keinen für jedes Tier geltenden Termin. Der gewählte Monat liegt tatsächlich in genau einem passenden vorhandenen Phasenband; das ist eine Prüfung der Modellzuordnung, keine neue Felderhebung.

`lib/wild-year-practice.js` verwendet ausschließlich `wildYearSpecies` und `wildYearMonths`. Ein Bereich wird nur verwendet, wenn mindestens zwei eindeutig benannte, tatsächlich hinterlegte Phasen mit eindeutigen Monatszuordnungen vorhanden sind. Ganzjährig gleiche Bereiche erzeugen keine scheinbar jahreszeitliche Frage. Alternativen stammen aus demselben Bereich derselben Art, niemals aus erfundenen Aussagen oder einer anderen Art.

Eine Runde enthält höchstens vier unterschiedliche Phasenfragen. Zuerst werden verschiedene geeignete Bereiche berücksichtigt; weitere Fragen behandeln tatsächlich andere Phasen. Bei nur zwei geeigneten Phasen gibt es zwei Antwortmöglichkeiten und gegebenenfalls nur zwei Fragen. Weder Fragenzahl noch Antwortzahl wird aufgefüllt. Die richtige Position wird reproduzierbar variiert.

Erklärung und sichtbare Einschränkung werden unverändert aus dem betreffenden Wissensblock und Artenprofil übernommen, einschließlich der vorhandenen Quellenschlüssel und historischen Prüfdaten. Die Projektion verändert diese Daten nicht. `getWildYearPracticeEvidence` erfasst auch die Belege der angezeigten Alternativtitel; die übergeordnete Wildjahransicht führt ergänzende Quellen weiterhin geschlossen am Schluss.

## Bedienung und Lebensdauer

`WildYearPractice` bleibt auf derselben Seite. Es öffnet keine Auswahlfenster, schreibt keine Adresse, liest oder schreibt keine lokalen Speicher und vergibt keine Ranglistenpunkte. Eigene Übungen und amtliche Prüfungsfragen werden ausdrücklich unterschieden. Die erste angenommene Antwort wird ausgewertet; die Rückmeldung enthält den vollständigen vorhandenen Erklärungstext und seine Einschränkung. Am Rundenende können falsche Zuordnungen wiederholt oder alle Ausgangsfragen neu begonnen werden.

Die übergeordnete Ansicht übergibt `speciesSlug`, eine Identität `scope`, den aktuellen Kontextprüfer `isCurrent` und optional `disabled`. Gleichbleibender Kontext erhält Antworten bei lokalen oder übergeordneten Neuzeichnungen. Wirklicher Kontextwechsel erzeugt eine neue Runde. Frühe Prüfungen von Montage, Kontext, übergeordnetem Zustand, Runde und aktueller Frage sperren überholte Radio-, Weiter- und Wiederholungsaktionen auch vor der nächsten Effektbereinigung. Eine angenommene Aktion aktualisiert ihre aktuelle Identität sofort, sodass Doppelklicks weder Antworten überschreiben noch Fragen überspringen. Zustandsübernahme erfolgt funktional mit monotoner Revision.

## Verifikation

`scripts/test-wild-year-practice.cjs` enthält fünfzehn bestandene Regressionen ohne übersprungene Fälle:

- Alle vorhandenen detaillierten Arten werden gegen ihre echten Monatskarten, Alternativen, Erklärungstexte und Belege geprüft.
- Zweiphasige Modelle behalten zwei echte Alternativen; unbekannte und reine Überblickseinträge erhalten keine fremde Ersatzübung.
- Quellen aller angezeigten Möglichkeiten sind vollständig und ohne doppelte Gruppen abgebildet; Ausgabedaten verändern die ursprünglichen Fachtexte nicht.
- Der tatsächliche Komponentenrenderer führt Zustandshooks, Effekte und Bereinigungen aus. Rückmeldung, Fehlerwiederholung, vollständiger Neustart, unveränderte Ansicht, A–B–A-Kontextwechsel vor Effektbereinigung, frühe Elternsperre, Bereitschaftssperre und echte Demontage werden über die bedienbaren Ereignisse überprüft.
- Alte Antworten und Weiterknöpfe verändern keine andere Frage; alte Rundenabschlüsse überschreiben keine neue Runde, auch bei gleicher Art in einem neuen URL-Kontext. Fokus wandert nach Weiter zur Frage, nicht nach jeder lokalen Antwort. Eine alte Fokusabsicht darf nach einem Kontextwechsel keine neue Ansicht fokussieren. Bereits vorgemerkte Effekte prüfen auch nach einer reinen Eigenschaftsänderung die aktuelle Bereitschaft und den aktuellen übergeordneten Kontextprüfer.

Diese Prüfungen belegen Datenprojektion und Komponentenverhalten in einer isolierten Laufzeit. Sie behaupten weder eine visuelle Geräteprüfung noch eine erneute fachliche Zertifizierung der übernommenen Kalender.
