# App-Prüfung – 4. Oktober 2026

Projekt: C:\Projekte\jagdlatein-github
Prüfstand: lokale Änderungen auf main, Ausgangscommit 64f14c0.
Die Änderungen sind für Git vorbereitet. Noch kein Commit, Push oder Vercel-Deployment.

Ergebnis der lokalen Prüfung

- 750 automatisierte Prüfungen unter Node 22.23.3: 750 bestanden, 0 fehlgeschlagen, 0 übersprungen.
- Vollständiges npm run build unter Node 22: erfolgreich. Next.js 15.5.24 hat 220 statische Seiten erzeugt; Seitendaten, Optimierung und Build-Traces abgeschlossen.
- npm audit einschließlich Entwicklungsabhängigkeiten: 0 gemeldete bekannte Sicherheitslücken. Vorher waren 31 Probleme in Produktionsabhängigkeiten gemeldet.
- 260 Quellcodedateien auf fehlende lokale Importziele geprüft: keine fehlenden Ziele.
- Git-Diff auf Formatfehler geprüft: bestanden.

Geprüft und repariert

Anmeldung und Zugriff
Die App vertraut für Konto-, Premium- und Adminzugriff der signierten Kontositzung. Unsignierte jl_session/jl_paid/jl_admin-Werte geben keinen Zugriff. Bestehende signierte Identitätssitzungen werden gegen das Kontoprofil aktualisiert; kurzlebige Berechtigungen werden regelmäßig erneuert. E-Mail-Codes werden gegen parallele Versuche und Wiederverwendung geschützt. Zugriff ohne erforderliche Konfiguration scheitert mit einem sichtbaren Fehler.

PayPal
Freischaltung prüft Webhooksignatur und den aktuellen Status eines erlaubten Aboplans beim PayPal-Server. Die Bestätigung nach dem Zahlungsdialog verwendet dieselbe Prüfung. Fehler und noch laufende Bestätigungen werden nicht als erfolgreiche Aktivierung angezeigt. Unbenutzte, widersprüchliche Einmalkauf- und ungesicherte Freischaltungswege sind stillgelegt.
Grundlagen: https://developer.paypal.com/api/rest/webhooks/rest/
https://developer.paypal.com/docs/api/subscriptions/v1/

Kurse, Quiz und Navigation
Alle 94 Kurse und die öffentlich erreichbaren Einstiegs-, Wildkunde-, Jagdrecht- und Jagdpraxisseiten wurden mit serverseitigem Rendering geprüft. Interne Links, Kursrouten und Kategorien sind erreichbar.
34 Mini-Kurse und 37 weitere Praxisübungen verhindern doppelte und verspätete Antworten. Timer werden beim Verlassen entfernt. Die 29 Praxisübungen mit Timer zeigen die Situation vor der Antwort und Rückmeldungen zehn Sekunden lang.
Die Hauptquizrunde wartet auf erfolgreiche Registrierung. Registrierungs- und Speicherfehler werden angezeigt; eine erneute Speicherung sendet dieselben Rundendaten.
Ranglistendaten werden validiert; Datenbankfehler werden nicht als Erfolg ausgegeben. Gleichzeitige Speicherungen können einen höheren Bestwert nicht durch einen kleineren ersetzen.
Die Rangliste heißt jetzt korrekt Quiz-Rangliste und zeigt die besten Einzelergebnisse. Eine Wochenwertung gab es im bisherigen Datenbestand nicht.
Blockierter Browserspeicher löst keinen Navigations- oder Quizabsturz aus. Antwortbuttons unterstützen Tastaturbedienung; disabled wird tatsächlich weitergereicht.
Der Next-15-Zugriff auf searchParams ist angepasst. Fehlende Apple- und Social-Preview-Bildpfade sind repariert.

Ansitz und Jagdpraxis
Der Ansitzsimulator zeigt alle Bedingungen vor der Entscheidung. Alle 25 Fälle haben eine Erklärung für richtige und falsche Antworten; Anzeigezeit zehn Sekunden. Bewegung, Elterntierschutz, unklare Freigabe, Schussbahn und Kugelfang werden eindeutig bewertet. Neustart erzeugt eine neue Runde.
26 weitere Trainer verwenden jeweils 25 nachvollziehbare Aussageprüfungen aus dem bereits geprüften Lernbestand, mit Erklärung, Länderbezug und Quellenlink. Diese 650 Übungspositionen verwenden bestehende Wissensfragen erneut; sie sind keine 650 zusätzlich neu recherchierten Sachverhalte.
75 Fälle zu Nachsuche, Krankwild und Waffenhandhabung sind einzeln präzisiert. Pauschale Nachsuchezeiten und sichere Blickdiagnosen sind entfernt. Die acht kurzen Praxisübungen berücksichtigen Grenzen von Altersschätzung, Artansprache und Freigabe sowie Eigenschutz bei Notfall und Wildunfall.
Grundlagen: https://www.svlfg.de/sichere-jagd
https://www.gesetze-im-internet.de/bjagdg/__22.html
https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche
https://www.drk.de/hilfe-in-deutschland/erste-hilfe/erste-hilfe-massnahmen-zur-wiederbelebung-pruefen-rufen-druecken/

Wildkunde, Recht und Glossar
47 Artenseiten mit 141 Fragen wurden auf Rendering, gültige Antwortschlüssel und Bilder geprüft. Unter anderem acht Zahnformeln, Schwarzwildwaffen und die Bezeichnung der weißen Fuchsluntenspitze wurden fachlich korrigiert. Nach falschen Antworten ist die richtige Antwort sichtbar.
Quelle zur Fuchsluntenspitze: https://jagdverband.it/fuchs-2/
Erfundene Gesetzesinhalte sind durch ausdrücklich gekennzeichnete Lernübersichten mit amtlichen Quellen ersetzt. Die Rechtsauswahl umfasst 16 deutsche Länder, 9 österreichische Länder und 26 Schweizer Kantone. Schlüssel, fehlende Dateien, wörtliche Suche und Ladefehler sind korrigiert.
Grundlagen: https://www.gesetze-im-internet.de/bjagdg/
https://www.ris.bka.gv.at/Land/
https://www.bafu.admin.ch/de/jagd
Das Glossar verwendet eine gemeinsame Quelle mit 72 eindeutigen Begriffen. Doppelte Route, Platzhalter, A–Z-Filter und Detail-404 sind repariert.

Adminwerkzeuge
Die bisherige öffentliche Passwortkontrolle ist durch den signierten Adminzugriff ersetzt. Die Quizimportseite bietet eine validierte Dateivorschau und den Download eines JSON-Entwurfs. Ein nicht existierender Repository-Upload wird nicht mehr angeboten. Die ebenfalls fehlenden Glossar-Bearbeitungs- und Importdienste werden ausdrücklich als nicht verfügbar gekennzeichnet; veröffentlichte Begriffe sind einsehbar. Neue Inhalte müssen weiterhin geprüft und in den aktiven Bestand übernommen werden.

Bibliotheken
Next.js 15.5.24, React/React DOM 19.3.0, Nodemailer 10.0.14. Ungenutzte verwundbare Pakete entfernt; PostCSS 8.5.28 und UUID 11.1.1 für betroffene Abhängigkeiten festgelegt und auf Kompatibilität geprüft. Der Browserparser verwendet die aktuelle offizielle SheetJS-Version 0.20.3.
Quellen: https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36
https://nextjs.org/docs/app/guides/upgrading/version-15
https://github.com/nodemailer/nodemailer/releases
https://docs.sheetjs.com/docs/getting-started/installation/standalone/

Verbleibende Grenzen und konkrete offene Punkte

1. Automatische Abo-Kündigung und Ablauf
Das bisherige Konto-Datenmodell enthält weder eine verlässliche Zuordnung zu einem PayPal-Abo noch einen bezahlten Zeitraum. Eine automatische Entziehung von Premium nach Kündigung/Ablauf ist deshalb noch nicht umgesetzt. Dafür werden eine Datenmodellerweiterung und die zugehörige Verarbeitung benötigt. Manuelle Premiumzugänge dürfen dabei nicht versehentlich entzogen werden.

2. Manipulationssichere Rangliste
Der Bestwert ist gegen parallele und wiederholte Speicherungen abgesichert. Der ältere Ligadatenbestand bindet Quiznamen aber noch nicht eindeutig an ein Konto und verwendet vom Client gemeldete Punkte. Die Prüfung der Zahlen und des Kontozugangs macht die Rangliste nicht zu einem gegen absichtliche Manipulation gesicherten Wettbewerb. Dafür sind serverseitige Rundenauswertung und eine verlässliche Namenszuordnung nötig.

3. Echtbetrieb und Vercel
Es gab keine Browser-Sichtprüfung, Android-Geräteprüfung, echten Zahlungen, E-Mails, Pushnachrichten oder Änderungen an einer Live-Datenbank. Die Verhaltenstests verwenden kontrollierte React-Zustandswechsel und nachgebildete Serverantworten.
Der Build ist kein Nachweis eines erfolgreichen Vercel-Deployments. Die erforderlichen Serverwerte müssen im Vercel-Projekt vorhanden sein: insbesondere JL_SESSION_SECRET (mindestens 32 Bytes), SUPABASE_SERVICE_ROLE_KEY und Supabase-URL; für Zahlungen PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_WEBHOOK_ID und der passende Plan.
Lokal wurde ausschließlich das Vorhandensein dieser Schlüsseldeklarationen geprüft, ohne Werte auszugeben: JL_SESSION_SECRET ist deklariert, die drei anderen ausdrücklich abgefragten Serverwerte SUPABASE_SERVICE_ROLE_KEY, PAYPAL_SECRET und PAYPAL_WEBHOOK_ID nicht. Vercel-Werte wurden nicht eingesehen.

4. Fachliche Reichweite
Die Prüfung aller Artenseiten auf technische Funktion ist keine vollständige Einzelbelegung aller biologischen Angaben. Die regionalen Rechtskarten sind Lernübersichten; sie ersetzen nicht die Prüfung der jeweils aktuellen konkreten Landes- oder Kantonsvorschriften.
Kurs-IDs und Abschlussumfänge bleiben erhalten. Die bestehenden Fortschritts- und Auswertungsregressionen bestanden.

Prüfnachweise liegen im lokalen Chat-Arbeitsordner work:
app-full-tests-final.log, app-production-build-final.log,
app-audit-dependencies-all-final.json sowie die zugehörigen *.test.cjs-Dateien.