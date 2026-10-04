# Supabase-Tabellen aufräumen

Die lokale App wurde auf ihre Tabellenzugriffe geprüft. Die folgenden Dateien sind vorbereitet; sie wurden nicht in der öffentlichen Datenbank ausgeführt. Das Löschen veralteter Tabellen ist gewünscht, setzt aber die Prüfung des tatsächlichen Datenbankbestands voraus.

| Tabellen | Verwendung und Vorgehen |
| --- | --- |
| `userprofile`, `login_codes`, `push_tokens` | Aktive Konto-, Anmelde- und Pushfunktionen. Behalten und gegen direkten Browserzugriff absichern. |
| `activity_results`, `course_progress` | Persönliche Auswertungen und abgeschlossene Kurse. Behalten. |
| `paypal_subscriptions`, `paypal_subscription_payments` | Neue bestätigte PayPal-Abos und Zahlungen. Behalten. |
| `quiz_identities`, `quiz_reserved_names`, `ranked_quiz_rounds`, `verified_quiz_scores` | Aktuelle Rangliste. Falls noch nicht vorhanden, die Ranglistenmigration einrichten. |
| `quiz_users`, `quiz_scores` | Keine aktiven Zugriffe der aktuellen App. Nach Prüfung und Reservierung der bisherigen Namen separat löschen. Alte Punkte werden nicht in die neue Rangliste übernommen. |
| `paymentlog`, `subscription` | Keine aktuellen Zugriffe im Repository. Der Detailcheck bestätigt jeweils null Zeilen. Mit erneuter Leerstandsprüfung unter Sperre zur Entfernung vorbereitet. |

## 1. Tatsächlichen Bestand prüfen

In PowerShell:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-account.ps1 -Step CleanupCheck
```

Den Inhalt der Zwischenablage im SQL Editor des vorhandenen Supabase-Projekts einfügen und **Run** ausführen. Das einzelne Ergebnis `cleanup_report` kopieren und zur Prüfung bereitstellen. Es enthält Tabellennamen, Spalten, RLS, Rechte, Abhängigkeiten und vorhandene RPCs; keine Kundendatensätze, Codes, Schlüssel oder Funktionsdefinitionen. Zeilenzahlen sind Schätzungen und können unbekannt sein.

Die Quelldatei ist `supabase/diagnostics/cleanup-preflight.sql`. Ein fehlender Eintrag im Screenshot allein beweist keine fehlende Tabelle. Ebenso bedeutet `UNRESTRICTED` fehlendes RLS, aber nicht automatisch, dass jede Rolle Zugriff hat: RLS und SQL-Rechte müssen gemeinsam geprüft werden.

Der Check findet direkte und mehrstufige Views sowie erkennbare Funktionsreferenzen. Dynamisch zusammengesetztes SQL und externe Jobs sind im Katalog nicht vollständig nachweisbar. Vor einer Löschung klären, ob ältere Deployments oder andere Dienste noch die alten Quiztabellen verwenden. Die aktuell geprüfte App muss veröffentlicht sein.

## 2. Aktive Kontotabellen absichern

### Bestätigter Bestand vom 4. Oktober 2026

Das vom Nutzer bereitgestellte `cleanup_report` bestätigt normale `postgres`-Tabellen ohne abhängige Views oder Vererbung. `service_role` hat BYPASSRLS. `userprofile` hat kein RLS und breite direkte Rechte für `anon` und `authenticated`, auch auf Premium- und Adminfelder. Die gleichen Rollen haben breite Rechte auf die übrigen sechs Zieltabellen. `login_codes` und `push_tokens` haben zwar RLS ohne freigebende Policies; zusätzliche SQL-Rechte müssen trotzdem entzogen werden. Daher zuerst die Schutzmigration ausführen.

Die vier neuen Ranglistentabellen und fünf Ranglisten-RPCs fehlen tatsächlich. Anschließend `RankedQuizSql` ausführen. Die bestehende `activity_results`-Tabelle ist vorhanden; ihre neue `verification`-Spalte wird durch diese Migration ergänzt. Die neue PayPal-Einrichtung einschließlich `apply_paypal_subscription_snapshot(jsonb)` ist bereits vorhanden.

Die Altquiztabellen besitzen den internen Fremdschlüssel `quiz_scores_username_fkey` von `quiz_scores.username` nach `quiz_users.username`. Zusätzlich existiert `public.get_week_scores()`, das die aktuelle App nicht aufruft. Der erste Bericht enthält keine exakten Zeilenzahlen und keine Spaltendefaults; daraus keine Leerstände oder Defaults ableiten.

Der folgende rein lesende Detailcheck ermittelt exakte Zeilenzahlen, die Abo-ID-Zuordnung zum neuen Ledger und die Definition dieser einzelnen alten Quizfunktion:

```powershell
& .\scripts\setup-account.ps1 -Step CleanupDetails
```

Im SQL Editor ausführen und das Ergebnis `legacy_detail_report` zur Prüfung bereitstellen. Kundendatensätze und Zahlungs-Payloads werden nicht ausgegeben. Die beiden Funktionen im Schema `realtime` sind Supabase-intern. Ein Worttreffer auf `subscription` beweist keine Abhängigkeit von `public.subscription`; solche Treffer müssen anhand Schema und Funktionskörper eingeordnet werden.

Der nachgereichte Detailcheck bestätigt `quiz_users=21`, `quiz_scores=19`, `paymentlog=0` und `subscription=0`. Die alte Wochenfunktion enthält ausschließlich eine sortierte SELECT-Abfrage auf `quiz_scores` für die aktuelle Woche. Sie ist SQL, Security Invoker, Eigentümer `postgres`, ohne eigene Konfiguration oder erkannten Aufrufer/abhängigen Datenbankobjekte. Der vom Datenbankserver ermittelte vollständige Definitionshash lautet `925e4a7640fe38f3de04b78fc0b39e7c`. Diese konkrete Definition wurde geprüft und in der manuellen Entfernung festgelegt; eine abweichende Version wird nicht gelöscht.

Erst nach Prüfung der vorhandenen Rechte, Views und RPCs:

```powershell
& .\scripts\setup-account.ps1 -Step SecureTablesSql
```

SQL einfügen und ausführen. Die Migration `20261004120000_secure_private_tables.sql` aktiviert RLS auf vorhandenen `userprofile`, `login_codes`, `push_tokens`, `paymentlog`, `subscription`, `quiz_users` und `quiz_scores`. Sie entzieht direkte Tabellen-, Spalten- und zugehörige Sequenzrechte von `PUBLIC`, `anon` und `authenticated`. Eine zusätzliche restriktive Policy verhindert Zeilenzugriffe auch bei geerbten Leserechten und früheren freizügigen Policies. Vorhandene Policies bleiben erhalten.

Die App arbeitet hier serverseitig mit `service_role`; die erforderlichen Serverrechte werden ergänzt, bestehende Serverrechte bleiben erhalten. Die Rolle muss RLS umgehen dürfen. Die Migration verändert keine Rollen und keine Datensätze. Ungeeignete Rollen oder problematische geerbte Sonderrechte führen zum Abbruch der Transaktion. Fehlende optionale Tabellen werden übersprungen. Alte Tabellen erhalten einen ergänzenden Kommentar, ohne den bisherigen Kommentar zu überschreiben.

Views mit Besitzerrechten und `SECURITY DEFINER`-Funktionen können gesonderte Zugriffswege darstellen. Diese werden angezeigt und müssen einzeln beurteilt werden; die Tabellenmigration ersetzt diese Prüfung nicht. Den Datenbankcheck anschließend erneut ausführen. `userprofile` enthält die maßgeblichen Premium- und Adminrechte und darf nicht gelöscht werden.

## 3. Alte Quiztabellen entfernen

Falls die neuen Ranglistentabellen oder ihre RPCs fehlen: zuerst die Auswertungseinrichtung und anschließend die Ranglistenmigration aus [rest-einrichtung.md](rest-einrichtung.md) ausführen. Die Ranglistenmigration reserviert Namen aus beiden alten Tabellen. Danach erneut prüfen.

Vor der Entfernung `quiz_users` und `quiz_scores` einschließlich ihrer Struktur über den vorhandenen Datenbank-Sicherungsweg sichern. Eine CSV allein stellt Rechte und Tabellenstruktur nicht wieder her. Die Sicherung nicht in Git ablegen.

Nach abgeschlossener Bestandsprüfung und Sicherung:

```powershell
& .\scripts\setup-account.ps1 -Step RemoveLegacyQuizSql
```

Die manuelle Datei `supabase/maintenance/remove_legacy_quiz.sql` im SQL Editor ausführen. Sie liegt bewusst außerhalb der automatischen Migrationen. Sie prüft die neue Rangliste, die alte Tabellenstruktur und Abhängigkeiten, übernimmt nochmals normalisierte Namen aus beiden Altbeständen, kontrolliert die vollständige Übernahme und entfernt die zwei alten Quiztabellen und die exakt geprüfte Wochenfunktion mit `DROP ... RESTRICT`. Der bekannte interne Fremdschlüssel bleibt bis zur Entfernung der Scores-Tabelle erhalten; anschließend wird die Benutzertabelle entfernt. Andere Fremdschlüssel führen zum Abbruch. Die Datei überträgt keine alten Punkte und löscht weder Konten noch persönliche Auswertungen.

Bei unerwarteten Spalten, Abhängigkeiten oder fehlender Einrichtung bricht die gesamte Transaktion ab. Die Meldung zuerst prüfen, kein `CASCADE` hinzufügen. Eventuelle explizite Realtime-Mitgliedschaften werden nur für die alten Quiztabellen entfernt; die übrige Publikation bleibt erhalten. Eine erneute erfolgreiche Ausführung ist möglich, wenn beide Tabellen schon fehlen.

## 4. Zahlungsaltbestand abschließend prüfen

Die beiden alten Zahlungstabellen sind laut Detailcheck leer. Die manuelle Datei `supabase/maintenance/remove_empty_legacy_payments.sql` prüft ihre bekannte Struktur und Abhängigkeiten und sperrt beide Tabellen vor der erneuten exakten Zählung. RLS darf keinen scheinbaren Leerstand verursachen: `row_security=off` lässt eine gefilterte Abfrage scheitern. Sobald eine der Tabellen Daten enthält, bricht die gesamte Transaktion ab. Der bekannte ausgehende Fremdschlüssel von `subscription` auf `userprofile` darf mit der leeren Tabelle entfernt werden; die aktive Elterntabelle bleibt erhalten. `CASCADE` wird nicht verwendet. Unbekannte Strukturen, externe Abhängigkeiten oder Realtime-Mitgliedschaften führen zum Abbruch.

Eine Fehlermeldung wie `Invalid subscription snapshot` belegt keinen Zugriff auf die alte Tabelle. Der Funktionscheck betrachtet erkennbare Tabellenoperationen, explizite `public`-Referenzen und Katalogabhängigkeiten. `realtime.subscription` ist ein anderer, systeminterner Bestand; seine Tabellen und Funktionen werden nicht geändert. Dynamisch zusammengesetztes SQL und externe Jobs bleiben außerhalb des vollständigen Katalognachweises.

Für die geprüfte Gesamtbereinigung ist ein einzelner PowerShell-Schritt vorbereitet:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
& .\scripts\setup-account.ps1 -Step CleanupSql
```

Nach Sicherung der beiden Quiztabellen den kopierten SQL-Text vollständig im Supabase SQL Editor ausführen. Der Helfer verbindet die beiden manuellen Dateien unter einem einzigen `BEGIN`/`COMMIT`. Ein Fehler beim Prüfen der leeren Zahlungstabellen stellt daher auch bereits entfernte Quizobjekte und neue Namensreservierungen wieder her. Erst nach dem Commit liefert `cleanup_result` den erreichten Zustand. Alle fünf `...removed`-Felder und alle `...present`-Felder müssen `true` sein. `reserved_names` zählt die insgesamt reservierten normalisierten Namen; das ist nicht zwingend identisch mit der Anzahl früherer Tabellenzeilen.

Die alte Punkteanzeige wird mit den alten Quiztabellen entfernt; die Namen bleiben reserviert. Die Löschung ist vom Nutzer nach Prüfung autorisiert. Alte Quizdaten werden nicht stillschweigend in andere Datenbanktabellen kopiert. Das vorhandene Backup ist der Wiederherstellungsweg. Es wurde hier keine Live-Löschung ausgeführt.

Der zurückgekehrte PayPal-Button belegt das Laden des SDKs. Er bestätigt noch nicht den vollständigen Zahlungs- und Freischaltungsablauf. Diesen Zustand bei der Prüfung alter Zahlungsdaten berücksichtigen.

## Lokale Prüfung und Grenze

Die SQL-Dateien wurden mit echtem PostgreSQL über PGlite an künstlichen Daten getestet. Die ursprüngliche Vorbereitung bestand 2/2 Metadatenchecks, 27/27 Rechteprüfungen, 29/29 Prüfungen der manuellen Entfernung und 5/5 Prüfungen des gesamten Ablaufs. Der neue Detailcheck besteht zusätzlich 1/1 PostgreSQL-Test für exakte Zählung, Abozuordnung, Funktionsdefinition und Abhängigkeiten ohne Ausgabe von Kundendaten. Der erweiterte PowerShell-Helfer wird mit 9 Syntax- und Auswahlprüfungen ohne Änderung der echten Zwischenablage geprüft. Geprüft werden unter anderem Browser- und Serverrechte, bestehende breite Policies, geerbte Rechte, Sequenzdefaults, Wiederholung, Datenbestand, Namensübernahme und der Abbruch bei Abhängigkeiten.

Nach dem tatsächlichen Katalogbefund wurde der interne Altquiz-Fremdschlüssel gezielt berücksichtigt: 35/35 Tests der manuellen Entfernung bestanden. Die finale Schutzmigration und der Detailcheck bestanden zusammen erneut 6/6 PostgreSQL-Tests; der erweiterte PowerShell-Helfer bestand 9/9 Prüfungen. `get_week_scores()` wird in den Tests ausdrücklich erhalten und blockiert die Entfernung, solange seine Definition ungeprüft ist.

Nach Prüfung der tatsächlich gelieferten Wochenfunktion bestanden 14/14 zusätzliche Funktionsprüfungen. Sie verwenden den unveränderten produktiven Hash und die identische CRLF-Definition, prüfen abweichende Metadaten sowie Aufrufer/Abhängigkeiten und stellen bei Abbruch Funktion, Tabellen und Reservierungen wieder her. Der finale PowerShell-Helfer besteht 11/11 Prüfungen einschließlich der gemeinsamen Transaktion und des Ergebnisses nach Commit.

Für die Entfernung der leeren Zahlungstabellen wurden 29 Prüfungen erfolgreich verifiziert: 28 Fälle im vollständigen Lauf und die korrigierte Sperrprüfung 1/1 separat. Ein anfänglicher Fehler betraf den ungeeigneten Backend-PID-Filter der lokalen Testabfrage, nicht das Produkt-SQL. Die finale Probe bestätigt beide `AccessExclusive`-Sperren vor dem ersten DROP.

Der tatsächlich vom PowerShell-Helfer erzeugte Gesamttext bestand 4/4 weitere PostgreSQL-Prüfungen: nachträglich eingefügte Zahlungsdaten führen zum vollständigen Rollback einschließlich Quizfunktion und Reservierungen; der Erfolgsfall entfernt nur die vier alten Tabellen und die geprüfte Funktion; Konten, Premium-/Adminflags, neue Abo-/Zahlungszeilen, Codes, Pushdaten, Kursfortschritt und persönliche Ergebnisse bleiben erhalten; eine Wiederholung gelingt ohne Änderungen an diesen Beständen. Alle normalisierten Quiznamen einschließlich nach der ersten Migration hinzugekommener Namen bleiben reserviert. Die anfängliche Testdatenkorrektur betraf den Kurswert (Anzahl richtiger Antworten statt Prozentwert), nicht eine Änderung an der App.

Zusätzlich bestanden 3/3 Tests mit der tatsächlichen Metadatenstruktur: Fremdschlüssel und Altdaten, Serverzugriffe sowie die Zugriffssperre für die alte INVOKER-Funktion. Ein weiterer vollständiger Schutztestlauf wurde wegen lokaler Ressourcenlast kontrolliert beendet; dessen restliche Fälle werden nicht als bestanden gezählt. UUID-Defaults im Fixture sind Testannahmen und kein Live-Nachweis.

Im gemeinsamen Ablauf blieben bestehende Premiumflags, Zahlungsaltbestand, Anmeldecodes und Pushdaten erhalten. Eine neue verifizierte Quizrunde funktionierte nach Entfernung der alten Tabellen weiterhin. Alte Ranglistenpunkte wurden nicht übernommen. Die manuellen Löschprüfungen verwenden PostgreSQL-Kataloge ab Version 15.

Eine lokale Prüfung bestätigt die Skripte an diesen Testfällen. Sie bestätigt keine bereits ausgeführte Live-Bereinigung und ersetzt nicht das Ergebnis des Checks im tatsächlichen Supabase-Projekt.

Grundlagen: [Supabase RLS und SQL-Rechte](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL DROP TABLE und RESTRICT](https://www.postgresql.org/docs/current/sql-droptable.html), [PostgreSQL Abhängigkeiten](https://www.postgresql.org/docs/current/catalog-pg-depend.html).
