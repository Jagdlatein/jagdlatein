# Navigation und Lernvideos: 18. Oktober 2026

## Nutzerwunsch und begrenzter Umfang

Die Kategorienavigation soll weniger Bilder und mehr Übersicht bieten. Die zwölf bisherigen Wissensbereiche behalten ihre Reihenfolge, direkten Ziele und Kursanzahlen. Große Navigationsfotos und deren Metadaten werden dort weggelassen; tatsächlich begründete Lehrfotos in Lektionen, Artenvergleichen und Galerien bleiben erhalten. Die Kategoriezeilen enthalten Icon, Titel, kurze vorhandene Beschreibung und Anzahl. Es entsteht keine neue Inhaltshierarchie.

Die Seite `/lernen/videos` bündelt die **neun bereits vorhandenen Originalaufnahmen**: fünf Wildtierszenen und vier Hundeszenen. Es sind keine neun neu recherchierten Filme. Keine neue biologische Aussage, kein neues Motiv und keine neue Lizenz werden aus dem Umbau abgeleitet. Die Hundeszenen sind ausdrücklich Bewegung/Verhalten, nicht pauschal vollständige jagdliche Prüfungsarbeiten. Titel, Rassen-/Artangaben und Dauer stammen unverändert aus den vorhandenen redaktionellen Datensätzen.

## Daten und Bedienung

- Die Startseite und das bestehende flache Menü erhalten einen direkten Videoeintrag. Die gemeinsame Wissenssuche findet die Videoübersicht; Einzelaufnahmen bleiben über ihre bisherigen Suchziele erreichbar.
- Sofortige Suche und Bereichswahl filtern die Liste ohne zusätzlichen Such- oder Öffnungsbutton. Listenzeilen öffnen direkt die ausgewählte vorhandene Szene mit Fragment zum Film. Jeder Player bietet einen Rücklink zur gemeinsamen Liste.
- Das Verzeichnis liefert nur neun kleine Metadatensätze, keine Videodateien, Poster, Quizantworten oder vollständigen Lektionen. Es hat keine Vorschaubilder und keinen Player. Die bestehenden Player verwenden weiterhin `controls`, `playsInline`, `preload="none"`, ohne Autoplay oder externe Frames.
- Die beiden vorhandenen Player behalten Herkunft, Urheber, Lizenz, Textfassung und fachliche Erklärung. Quellenkontext und tatsächlich sichtbare Beobachtung werden nicht vermischt. Es werden keine fremden Videos ohne Nutzungsnachweis eingebettet.

## Tatsächlich ausgeführte Gegenprüfung

Ein unabhängiger Review hat Verzeichnis-Daten und tatsächliches React-Rendering ausgeführt: neun eindeutige Szenen, 2.495 Byte Seitenprops, kein `undefined`, keine Medien-/Quizdaten im Verzeichnis. Alle neun Direktlinks wurden mit dem initialen Auswahl-Effekt und erneutem Rendern der echten Zielkomponenten geprüft; jeweils richtige Quelldatei und vorhandener Anker. Alle referenzierten lokalen Videos existieren. Suchproben zu Brunft, Körpersprache und Retriever lieferten passende Treffer; ein nicht vorhandener Begriff lieferte keinen.

76 gemeinsame Regressionen bestanden für Videoauswahl/Suche, globale Navigation, Bilderzweck, Quellen-/Datumspräzision der News und die drei neuen Wissenskurse samt Lernmodell. Der vollständige Build erzeugte 407 Seiten erfolgreich. Mit tatsächlichem React-Rendering und den erzeugten CSS-Dateien wurden Kategorien und Videoübersicht bei 320, 360, 390, 620 und 1100 Pixeln geprüft: kein horizontaler Überlauf, alle zwölf Kategorien beziehungsweise neun Filmzeilen vorhanden, Eingaben mindestens 48 Pixel hoch. Zusätzlich wurden beide Ansichten visuell betrachtet. Diese technischen Prüfungen sind keine erneute fachliche Zertifizierung des ganzen Katalogs oder Sichtprüfung jedes Videoframes. Nach Veröffentlichung folgt die Kontrolle der Live-Darstellung und der interaktiven Suche.

Der separate Quellen-/Abrufabgleich für aktuelle Meldungen steht in `news-navigation-2026-10-18.md`. Aktualisierung hängt von geöffnetem Browser, Netz und den Originalquellen ab; eine lückenlose Nachrichtenerfassung wird nicht behauptet.
