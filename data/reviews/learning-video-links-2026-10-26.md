# Lernvideos mit Arten, Rassen und vorhandenen Kursen verbinden

Technisches Teilpaket vom 26. Oktober 2026, Ausgangsstand `c4caeda`. Die Prüfung dieser Verknüpfung ist keine neue fachliche Prüfung der vorhandenen Kurse, Rassenprofile oder Videoaufnahmen. Die sechs neuen Wildaufnahmen und ihre Sichtprüfung werden gesondert dokumentiert.

## Verknüpfung

Der neue leichte Katalog `lib/learning-video-links.js` enthält 15 konkrete Videoziele: die fünf vorhandenen Wildtierfälle, vier vorhandenen Hundevideos und sechs im selben Arbeitspaket separat geprüfte neue Wildtierfälle. Er importiert weder Videofragen noch Medien, Kursdaten oder Spieler. Die Metadaten enthalten ausschließlich ID, Titel, Art-/Rasse-/Kurszuordnung und den vollständigen lokalen Direktlink zum vorhandenen URL-gesteuerten Player.

Die neun betroffenen Wildarten bekommen genau ein zusätzliches Thema **Videos** im bestehenden unteren Themenbereich ihres Artenporträts. Dabei bleiben alle alten Themenziele erhalten. Rehwild und Stockente haben jeweils zwei passende Aufnahmen unter demselben Thema; es entsteht dafür kein weiterer Menübaum. Das ausgewählte Thema zeigt kurze Direktlinks, keinen zweiten Player und kein zusätzliches Fenster.

In den vorhandenen Profilen **Labrador** und **Golden Retriever** steht dasselbe kurze Thema im bestehenden Rassenbereich. Die Zuordnung verwendet die in den ursprünglichen Aufnahmebeschreibungen benannten Rassen, keine Bildschätzung. Für den Basset-Hound-Clip besteht im aktuellen 59-Rassen-Bestand kein passendes Profil; er bleibt im vorhandenen Hundeteam-Kurs verknüpft. Der Rutenclip nennt ausdrücklich keine Rasse und wird ausschließlich dem vorhandenen Körpersprachekurs zugeordnet. Eine unbestimmte Rasse wird weder ergänzt noch vermutet.

In 13 tatsächlich vorhandenen Kursen erscheinen die passenden Videolinks unter **Videos** im bereits bestehenden unteren Kursmenü. Der gelesene Lektionstext, Quiz, Fortschritt, Lernkarten und abschließende Quellen bleiben an ihrem bisherigen Platz. Alle Links führen in derselben Ansicht direkt zu `?eintrag=…#video-fall` beziehungsweise `?eintrag=…#hundevideo-film`. Es gibt kein Autoplay, keinen eingebetteten Parallelplayer, kein Popup und keine externe Quelle als Voraussetzung zum Ansehen. Die Player selbst werden durch dieses Teilpaket nicht geändert.

Der bestehende gemeinsame Videoindex wird weiterhin aus den wirklichen Wild- und Hundedaten abgeleitet. Zusätzliche neue Index- oder Suchkopien werden nicht angelegt.

## Erhaltung und Tests

`scripts/test-learning-video-links.cjs` prüft die echte Katalog-, Komponenten- und Suchintegration in sieben Fällen:

1. Jede reale Aufnahme entspricht genau einer leichten Linkzeile. Titel, existierende Kurs-/Art-/Rasseziele und exakte URL einschließlich Playerziel stimmen überein. Der leichte Katalog besitzt keine Imports und enthält keine Mediendateien oder Antwortdaten.
2. SHA-256 über sämtliche vollständigen Objekte der neun ursprünglichen Videos bestätigt unveränderte Texte, Fragen, Lösungen, Zeiten, Pfade, Urheber, Lizenzen und Datumsfelder. Nur die sechs eigenständigen neuen Wildobjekte kommen hinzu.
3. Tatsächliche Porträtthemen aller 114 Arten enthalten ausschließlich bei konkreten Treffern das neue Blatt. Die alten Stimmen-, Weiterlernen- und Rechtsziele bleiben auflösbar; es gibt keine leeren Videothemen und keinen neuen Menübereich.
4. Alle 59 Rassen behalten ihre ursprünglichen fünf Profilthemen. Nur Labrador und Golden bekommen das zusätzliche Blatt. Es entstehen weder ein erfundenes Basset-Profil noch eine Rassenzuordnung für den unbekannten Hund.
5. Tatsächliche serverseitige Kursausgabe zeigt die Direktlinks nur im vorhandenen unteren Menü. Ausgewählter Lerntext und Quellenreihenfolge bleiben erhalten; ein nicht zugeordneter Kurs erhält keinen leeren Videobereich.
6. Der bestehende gemeinsame Videoindex, seine Suchfunktion und die allgemeine Lernsuche führen zu jeder verknüpften Aufnahme unter der gleichen kanonischen Adresse.
7. Unbekannte, mehrfache und prototypähnliche Auswahlwerte ergeben keine zufälligen Fremdvideos.

Der historische Test `scripts/test-dog-breed-profiles.cjs` wurde ausschließlich an die zwei neuen konkreten Videoblätter angepasst: Die ursprünglichen fünf Themen aller Rassen, sämtliche Texte, Quellen, Fotos und vorhandenen Routen werden weiter vollständig geprüft. Für die 57 übrigen Rassen bleibt die Themenzahl fünf.

Weitere ausgeführte Bestandssuiten: `test-topic-section-reader.cjs`, `test-dog-breed-profiles.cjs`, `test-wildlife-learning-guide.cjs` und `test-learning-ui-state.cjs`: **37 bestanden, 0 fehlgeschlagen, 0 übersprungen**. Dazu gehören tatsächliche Reader-History-/Fokusfälle, alte Porträtanker, Kursquiz und beibehaltene Quellen am Ende.

Nach dem vollständigen Import der sechs neuen Clipobjekte wurde der gemeinsame Testlauf mit Node 22 ausgeführt:

```text
node --test scripts/test-learning-video-links.cjs scripts/test-learning-video-library.cjs scripts/test-topic-section-reader.cjs scripts/test-dog-breed-profiles.cjs scripts/test-wildlife-learning-guide.cjs scripts/test-learning-ui-state.cjs
48 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen.
```

Dabei stimmen 15 Katalogzeilen mit 11 wirklichen Wildaufnahmen und 4 wirklichen Hundevideos überein. Sämtliche 13 Kursziele bestehen; alle 15 Aufnahmen sind über die Video- und allgemeine Lernsuche auffindbar. Die neun vollständigen Altobjekte stimmen weiterhin mit ihren vor der Erweiterung erfassten Hashes überein.

Es erfolgte keine Geräte- oder Browserprüfung durch dieses Teilpaket und keine Änderung echter Benutzer- oder Zahlungsdaten. Die fremde Afternoon-Datei blieb unberührt. Kein Commit, Push oder Cloudschreibzugriff wurde von diesem Teilpaket ausgeführt.
