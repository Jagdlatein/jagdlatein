# Begrenzte Abhängigkeitsprüfung in GitHub Actions

Konzipiert und konkret gegen Herstellerquellen geprüft am 27. Oktober 2026. Neuer eigenständiger Workflow `.github/workflows/dependency-audit.yml`; die vorhandenen iOS-Workflows, Signierfreigaben und App-/Kontoeinstellungen werden nicht geändert.

## Umfang und Rechte

Ausführung bei Pull Requests gegen `main` und Pushes auf `main`, jeweils nur bei Änderungen von `package.json`, `package-lock.json` oder `.github/workflows/**`. Zusätzlich ist ein manueller Start ohne Eingaben möglich. Kein Cron, `pull_request_target` oder `workflow_run`. Ein eigener Concurrencyname verhindert eine Kollision mit iOS-Aufträgen; überholte Läufe dürfen abgebrochen werden. Ein Ubuntu-Job erhält höchstens zehn Minuten und ausschließlich `contents: read`.

Checkout persistiert keine Git-Zugangsdaten. Setup Node richtet ausdrücklich die Projektlaufzeit Node 22 ein und verwendet keinen Paketcache. Der Workflow nutzt keine Repositorysecrets, eigenen Tokens, Umgebungsfreigaben, Artefakte, Nachrichten, Zahlungen oder Deployments. Die beiden Run-Schritte lauten genau:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm audit --omit=dev --audit-level=high
```

Die Installation folgt dem vorhandenen Lockfile und führt keine `package.json`-Installationsskripte aus. Audit prüft bekannte Produktionsabhängigkeiten gegen die Registry; hohe oder kritische Befunde sowie fehlgeschlagene Prüfaufrufe werden nicht mit `continue-on-error` überspielt. Kein `npm audit fix`, kein automatisches Update oder Build.

## Tatsächlich verifizierte Herstellerstände

- **actions/checkout 7.0.1**, vollständiger Commit `3d3c42e5aac5ba805825da76410c181273ba90b1`: [Release](https://github.com/actions/checkout/releases/tag/v7.0.1), [Commit](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1), [README am Commit](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/README.md), [action.yml am Commit](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/action.yml). Offizielle Tag-API verweist direkt auf diesen Commit im Originalrepository; GitHub meldet dessen Signatur als verifiziert.
- **actions/setup-node 7.1.0**, vollständiger Commit `949feb2413d6458794dcd2491c4babbbce0c15c1`: [Release](https://github.com/actions/setup-node/releases/tag/v7.1.0), [Commit](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1), [README am Commit](https://github.com/actions/setup-node/blob/949feb2413d6458794dcd2491c4babbbce0c15c1/README.md), [action.yml am Commit](https://github.com/actions/setup-node/blob/949feb2413d6458794dcd2491c4babbbce0c15c1/action.yml). Dieselbe Tag-/Commitprüfung wurde vorgenommen. Die Action selbst läuft laut Manifest intern auf Node 24; das unterscheidet sich von der ausdrücklich eingerichteten Projektlaufzeit 22.

Release, Tag-Auflösung und Dateien an den exakten SHAs wurden tatsächlich gelesen. Vollständige SHA-Pins verhindern, dass später verschobene Tags unbemerkt andere Actionversionen auswählen. Sie sind keine Garantie gegen jeden Lieferkettenangriff.

Technische Primärdokumentation: [GitHub: sichere Verwendung, minimale Rechte und SHA-Pins](https://docs.github.com/en/actions/reference/security/secure-use), [GitHub: Workflow-/Pfadfilter](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci/), [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit/). Insbesondere wurden Skriptunterdrückung, Registryanfrage, Fehlergrenze und die Pending-Grenze bei übersprungenen erforderlichen Checks gelesen.

## Grenzen und Nachweis

Der Lauf betrifft das npm-Hauptprojekt. Mobile Entwicklungswerkzeuge aus `mobile/package-lock.json`, native Swift-Pakete, Anwendungscode, Rechte, eigene Geheimnisse und unbekannte Schwachstellen sind dadurch nicht vollständig geprüft. npm übermittelt Paketmetadaten an die konfigurierte Registry. Ein grüner Lauf bestätigt nur den jeweiligen Datenbestand bekannter Hinweise und die gewählte Fehlergrenze; niedrigere Schweregrade werden dadurch nicht zu Sicherheitsgarantien.

Ohne gesonderte Branchregeln ist dieser Workflow kein verbindliches Vercel-Deployment-Gate. Falls später ein erforderlicher Check daraus gemacht wird, müssen Pfadfilter berücksichtigt werden: bei übersprungenen Workflows kann dessen Status Pending bleiben. Ohne Zeitplan werden neue Hinweise ohne passende Repositoryänderung erst bei einem manuellen oder späteren passenden Lauf geprüft. Es werden dafür keine Kontorechte oder Branchregeln verändert.

Der Probelauf erfolgt ausschließlich in einem neuen isolierten Chat-Work-Ordner mit Kopien der beiden Hauptmanifeste und Node 22; keine Installation und kein Build im Projekt. Ein lokaler Probelauf ersetzt weder eine unabhängige YAML-/Rechteprüfung noch einen später tatsächlich abgeschlossenen GitHub-Actions-Lauf.

Tatsächlich mit Node **22.23.3** und npm **10.9.9** ausgeführt im neuen Ordner `work/dependency-audit-smoke-20261027-30a8f24bc0f3` des Chat-Workspaces: `npm ci --ignore-scripts --no-audit --no-fund` erfolgreich (290 Pakete), anschließend `npm audit --omit=dev --audit-level=high` erfolgreich mit **0 gemeldeten Schwachstellen**. Der Installationslauf meldete außerdem Abkündigungshinweise; diese werden nicht mit einer Garantie dauerhafter Wartung oder Sicherheit verwechselt. Paket- und Lockdatei wurden durch den Probelauf nicht verändert. Keine bestehende Projektinstallation oder `.next`-Ausgabe wurde dafür neu erzeugt.

Die separate lesende Gegenprüfung des Hauptagenten und eines weiteren Reviewers bestätigt Trigger, vollständige SHA-Pins, minimale Rechte, deaktivierte Credentials/Paketcaches und die beiden festen Run-Schritte. Die bestehenden beiden iOS-Workflows sind unverändert. YAML wurde vor Veröffentlichung manuell geprüft; die tatsächliche Ausführung bei GitHub wird nach dem Push gesondert nachgewiesen. Dafür wird weder eine Branchregel noch eine persönliche Freigabe umgangen.
