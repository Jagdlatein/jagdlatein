# Onlinekurse im Webbrowser

## Auftrag und Funktionsumfang

Die neue Plattform `/online-kurse` verbindet vorhandene Selbstlernkurse mit veröffentlichten Kursangeboten und eingebettetem Live-Unterricht. Andere Jagdschulen können vom Betreiber ein eigenes Anbieterprofil und zugeordnete Angebote erhalten. In dieser Lieferung verwaltet und veröffentlicht ausschließlich der bestehende Betreiber die Profile, Angebote und Termine; es gibt keine automatische Fremdschul-Freigabe, neue Betreiberrolle, Teilnehmerverwaltung, neue Kursgebühr oder Zahlung.

Die zwölf bestehenden Kategorien werden unverändert verwendet. Lernform und Kategorie stehen im vorhandenen unteren Menü. Auswahl und Verlauf sind an die bereite, validierte URL gebunden; Fehler ändern den Lehrbereich nicht vorzeitig. Es entsteht kein zusätzliches Auswahlfenster. Die vorhandenen Kurse behalten vollständige Lerntexte, Übungen, Quellen und Kontofortschritt. Der dargestellte Fortschritt zählt Quizantworten und wird ausdrücklich nicht als Lesestand, Wiederaufnahmeposition oder Qualifikation bezeichnet. Die neuen Seitenprops enthalten nur vorhandene Kursmetadaten, keine Quizlösungen oder Videoraumkennungen.

Der neue Einstieg erscheint nach einer lokalen Browserprüfung in normalen Browsern, einschließlich installierter Web-Apps. In erkannten nativen Clients erscheint der neue Plattformzugang nicht. Ein direkter Aufruf erklärt dort den Browserzugang und erhält den bisherigen App-Lernbereich. SSR und erste Hydration zeigen denselben neutralen Ladezustand. Die Laufzeit-/UA-/bestehende iOS-Bridge-Prüfung dient der Darstellung; die eigentliche Berechtigung wird weiterhin serverseitig geprüft.

## Anbieter, Angebote und Termine

Drei neue, von Konto-, Zahlungs- und Fortschrittsdaten unabhängige Tabellen speichern Anbieterprofile, Kursmetadaten und Termine. Anbieterstatus und Veröffentlichungsstatus bilden die Sichtbarkeitskette. Entwürfe werden nur über den Betreiberzugang ausgegeben. Für jeden neuen Termin erzeugt der Server eine zufällige UUID-Raumkennung. Die normalen Listen und Verwaltungsantworten enthalten diese Kennung nicht. Die Raum-API prüft den aktuellen bezahlten oder Betreiberzugang, die Veröffentlichungsfolge und das Zeitfenster ab 15 Minuten vor Beginn bis zum Ende; während ausstehender Prüfungen werden Zeit und Freigaben erneut gelesen.

Schreibvorgänge verlangen aktuelle Betreiberrechte, dieselbe Origin, begrenztes JSON und validierte bekannte Kurs-/Kategoriekennungen. Abgesagte und zurückgestellte Einträge werden erhalten. SQL-Rechte erlauben anonymen und normalen angemeldeten Datenbankrollen keinen Tabellenzugriff; nur der serverseitige Dienst hat SELECT/INSERT/UPDATE, kein DELETE. Es gibt keine Konten-/Rollenänderung und keine neue Schüler- oder Anwesenheitsliste.

Die Migration wurde am 25. Oktober im regulär angemeldeten Supabase-SQL-Editor angewendet. Vorher waren alle drei Tabellennamen unbesetzt. Danach bestätigte eine gesonderte Metadatenabfrage für alle drei Tabellen: RLS=true, anon_access=false, authenticated_access=false, server_access=true, server_delete=false. Nur das tatsächliche Betreiberprofil Jagdlatein wurde angelegt, keine erfundenen Lehrer, Termine oder Angebote. Bestehende Tabellen und Datensätze blieben außerhalb dieser Migration.

Kalendereinträge verwenden UTC-Zeitpunkte, eine stabile Termin-UID und den Jagdlatein-Terminlink ohne Raumkennung. Text wird für iCalendar maskiert und auf UTF-8-Zeichengrenzen gefaltet. Die Termine werden im Kurs in Europe/Zurich angezeigt; das Betreiberformular benennt seine UTC-Eingabe ausdrücklich und lehnt ungültige Kalenderdaten ab.

## Eingebetteter Videoraum

Die Einbettung nutzt meet.jit.si. Vor „Videoraum laden“ wird kein Videodienst angefragt. Jagdlatein übergibt keinen Kontonamen, keine E-Mail, keinen Lernstand und lädt kein fremdes Seitenskript. Der eingebettete Raum beginnt mit stummem Mikrofon und ausgeschalteter Kamera sowie einer Beitrittsvorschau. Die eigentlichen Browserfreigaben und der Beitritt bleiben bewusste Handlungen des Besuchers. Ein geladenes Iframe gilt nicht als Beleg einer erfolgten Teilnahme.

Die Lehrperson startet den Konferenzraum beim Videodienst; meet.jit.si kann dafür eine eigene Anmeldung verlangen. Die Einbettung macht aus diesem öffentlichen Konferenzdienst keinen selbst betriebenen Videodienst und gibt keine Kapazitäts-, Verfügbarkeits- oder Teilnahmegarantie. Außerhalb von Jagdlatein gelten die Zugangs- und Datenschutzregeln des Konferenzdienstes. Der Betreiber sollte echte Termine mit der Lehrperson abstimmen und den vorgesehenen Raum vor Unterrichtsbeginn praktisch prüfen.

Öffnen des Jagdlatein-Menüs, Wechsel des URL-Kontexts, Raumablauf, fehlgeschlagene erneute Zugangsprüfung und Unmount entfernen die Einbettung. Der Raumzugang wird während geöffneter Ansicht regelmäßig und bei Rückkehr geprüft. Synchrone Request-/Raumidentitäten verhindern doppelte Anfragen und alte Lade-/Schließenaktionen. Doppelte Menüereignisse sind idempotent und dürfen einen späteren bewussten Neustart nicht sperren.

Tatsächlich gelesene technische Primärquellen am 25. Oktober:

- Jitsi IFrame API: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/ — Einbettung und mobile Browser.
- Jitsi User Guide Advanced: https://jitsi.github.io/handbook/docs/user-guide/user-guide-advanced/ — URL-Konfiguration, Vorschau, stumme Audio-/Videoeinstellungen.
- Jitsi Joining Guide: https://jitsi.github.io/handbook/docs/user-guide/user-guide-join-jitsi-meeting/ — Browserfreigaben und Anmeldung der ersten Person/Lehrperson.
- meet.jit.si Privacy Supplement: https://jitsi.org/meet-jit-si-privacy/ — Verarbeitung beim Konferenzdienst; verlinkt in Raumansicht und gemeinsamer Datenschutzerklärung.

Die gemeinsame Datenschutzerklärung und ihre eigenständige HTML-Fassung wurden um diese tatsächliche optionale Einbettung ergänzt. Es wurden keine Konferenzen gestartet, Gerätefreigaben erteilt, Schüler benachrichtigt oder neue kostenpflichtige Dienste eingerichtet.

## Prüfung

Die neuen Tests führen tatsächliche Middleware-, Page-, API-, ReactDOM- und Hook-Lebenszyklen mit isolierten Konten-, Datenbank-, Router-, Netzwerk- und Mediendoubles aus. Sie prüfen aktuelle Rechte, Origin/Größenlimits, Sichtbarkeitsketten, private Raumkennungen, Zeitgrenzen, abgesagte/veröffentlichte Angebote, Browser-/App-Abgrenzung, URL-Commit/History/Fehler, Anbieterentwürfe, UTC-Kalenderdaten, Mehrfachklicks, alte Handler und echte Cleanup-Grenzen.

Unabhängige Prüfer fanden drei reale Raum-Lebenszeitfehler; alle wurden behoben und mit unveränderten Regressionen erneut geprüft. Die bestehenden Prüfungen für Kategorien, untere Navigation, Konto-/Kurszugriff, Suche, Offlineinhalte und Datenschutz bleiben erhalten. Ein zunächst fehlender externer jsdom-Testpfad wurde für den vollständigen Lauf gesetzt, ohne Produktcode oder Erwartungen abzuschwächen.

Der abschließende passende Lauf bestand 291 unterschiedliche Tests ohne übersprungene Fälle; der Produktionsbuild erzeugte 509 statische Seiten und die neue geschützte dynamische Plattformroute. Isolierte Konferenztests sind kein Beleg einer echten Unterrichtsteilnahme oder physischen Geräteprüfung. Fachliche Kursinhalte und deren Prüfdaten wurden nicht geändert. Der fremde Stand `data/learning-expansion-afternoon-2026-10-16.json` ist nicht Teil der Lieferung.
