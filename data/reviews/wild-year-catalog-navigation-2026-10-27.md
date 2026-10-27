# Wildjahr: Artenbestand, Inhaltsprojektion und Navigation

Technische Gegenprüfung am 27. Oktober 2026. Sie ist keine neue fachliche Gesamtprüfung der bestehenden Artenporträts und keine Prüfung der örtlichen Jagdbarkeit.

## Tatsächlicher Umfang

- Die Auswahl enthält exakt die 114 kanonischen Arten- und Vergleichseinträge der Artenporträts: 106 DACH-Einträge und acht europäische Ergänzungen. Darunter befinden sich geschützte Arten, ein Hybrideintrag und rechtlich relevante Vergleichsformen; die Auswahl ist keine Liste pauschal jagdbarer Tiere.
- 26 Einträge besitzen Monatskalender: die zehn unverändert erhaltenen bisherigen Profile und 16 gesondert fachlich geprüfte neue Profile. Deren fachliche Nachweise stehen in den jeweiligen Säugetier- und Vogelberichten; diese technische Gegenprüfung ersetzt sie nicht.
- Die verbleibenden 88 Einträge besitzen 36 ungeteilte Jahresübersichten und 52 ausdrücklich als Artenwissen bezeichnete Übersichten. Bei diesen Ansichten erzeugt ein ausgewählter Monat keine erfundene Monatsphase. Fehlende Monatskalender bleiben unmittelbar sichtbar gekennzeichnet.
- Die vorhandene gemeinsame Fotodatei enthält 47 Artporträts. Die übrigen Ansichten verwenden vollständige Lerntexte ohne erfundenes Ersatzfoto; dies ist keine Behauptung einer Fotovollabdeckung.

## Bewahrung und Quellenrollen

Die zehn bisherigen vollständigen Profilobjekte, sämtliche 120 daraus abgeleiteten Monatsansichten und alle bisherigen Quellenobjekte wurden positiv gegen den veröffentlichten Commit `b2251178993ba0475ce04de4cc837c0fce6d55cf` verglichen. Ihre Texte, Monatsbänder, Quellenzuordnungen und fachlichen Prüfdaten bleiben exakt erhalten.

Die neue serverseitige Projektion übernimmt bereits verfasste Texte einschließlich ihrer ursprünglichen Nachweiszuordnungen: 46 Jahreslaufabschnitte aus dem älteren Porträtbericht stimmen weiterhin mit den aktuellen Porträtdateien überein; sechs neuere Vogelblöcke bewahren auch ausdrücklich gekennzeichnete Einordnungsnotizen; zwei weitere Vertiefungen und die acht europäischen Ergänzungen behalten ihre jeweiligen ursprünglichen Prüfstände. Diese Übernahme ist keine erneute unabhängige Prüfung jeder alten biologischen Aussage. Allgemeines Artenwissen ohne ausgewiesenes Prüfdatum erhält kein erfundenes Datum.

Lerntexte und unmittelbar wichtige Grenzen stehen vor den standardmäßig geschlossenen Quellen. Quellen und vorhandene Bildnachweise bleiben am Ende. Für europäische Ergänzungen wird weder ein DACH-Vorkommen noch eine DACH-Jagdfreigabe behauptet.

## Ausgeführte technische Nachweise

`scripts/test-wild-year-overview-server.cjs`: acht bestandene Regressionen unter Node 22. Geprüft werden der exakte kanonische Bestand, brauchbare ausgewählte Texte für alle 114 Einträge, Originaltexte und Datumsrollen, eng zugeordnete Quellen, erhaltene Einordnungsnotizen, fehlende künstliche Monatsbänder, ungültige Eingaben und Schutz vor Mutation der Originaldaten. Die ausgewählte Inhaltsprojektion enthält keine Rechtsstatusdaten, Quizpools oder Antwortschlüssel.

`scripts/test-wild-year-catalog-navigation.cjs`: neun bestandene unabhängige Regressionen unter Node 22. Sämtliche 114 tatsächlichen Serverauswahlen wurden mit der Serverdarstellung und der ersten Clientdarstellung einschließlich der anschließenden Routerbereitschaft verglichen. Vollständige ausgewählte Lerntexte, Fotooptionalität, Gruppenauswahl und geschlossene abschließende Quellen wurden geprüft. Weitere Fälle prüfen echte ausgehende Navigation, fehlgeschlagene Wechsel zwischen Monatsmodell und Übersicht, verspätete passende Serverdaten, genau einmaligen Fokus nach tatsächlicher Inhaltsübernahme, Browser-Verlauf, wiederholte/ungültige Parameter, veraltete Auswahl- und Fehlercallbacks sowie Unmount.

Die tatsächliche Porträt-Lernhilfe rendert für jeden der 114 kanonischen Einträge genau einen gültigen Wildjahr-Link und bewahrt die bisherigen Kurs-, Lernkarten- und Modelllinks. Unbekannte Einträge erzeugen keine neue leere Lernhilfe. Die Wildjahr-Auswahl lädt eine leichte Metadatenliste; der serverseitige vollständige Porträt-/Quellenbestand bleibt außerhalb dieses Clientimportpfads.

Die abschließende schmale Darstellungskorrektur verwendet für textbasierte Übersichten eine einspaltige Kartenfläche und bei fehlendem Foto die vollständige Inhaltsbreite.

## Grenzen dieser Gegenprüfung

Die Prüfungen verwenden isolierte React-Lebenszyklen und tatsächliche Serverrenderfunktionen mit ersetzten externen UI-Endpunkten. Sie sind keine Sichtprüfung auf einem Telefon, keine authentifizierte Produktionsseitenprüfung und keine Behauptung einer vollständigen fachlichen Prüfung aller 114 Einträge. Produktionsauslieferung, Veröffentlichungscommit und Deployment werden nach der Veröffentlichung separat nachgewiesen.
