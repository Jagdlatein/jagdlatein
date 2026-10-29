# Betreiberbild als App- und Webmarke

Der Betreiber hat am 29. Oktober 2026 die bearbeitete Jagdlatein-Illustration ausdrücklich für App, Website und Google-Suche gewählt. Die drei unteren Bierkrüge wurden mit Imagegen entfernt, die beiden angehobenen Krüge bleiben erhalten. Das ist eine freigegebene Markenillustration und kein Lehrfoto. Die Bildquelle wird nicht als unverändertes Original oder eigene Fotografie ausgegeben; es wird keine neue öffentliche Nutzungslizenz vergeben.

Die unveränderten PNG-Bytes des gewählten Ergebnisses liegen in `mobile/branding/jagdlatein-logo.png` und `public/branding/jagdlatein-2026-10-29.png`. `scripts/prepare-brand-assets.cjs` erzeugt nur Größenvarianten und ein vollständig sichtbares Motiv mit seitlichen Rändern für die 1200×630-Social-Vorschau. Der Nachweis mit Original- und Ableitungshashes steht in `brand-assets-2026-10-29.json`. Der vorhandene native Generator erzeugt daraus das 1024×1024-AppIcon ohne Alphakanal, die drei Kopfzeilenbilder und drei Startbilder. Alte kompatible PNG-/SVG-Ziele verwenden ebenfalls das neue Motiv; das SVG ist ein selbstständiger Rahmen mit eingebettetem PNG.

## Web und Suche

Die Startseite zeigt das Bild kompakt mit 112 beziehungsweise 144 CSS-Pixeln. Die erste Bildzeile verändert keine bestehenden Lernangebote oder Kontofunktionen. Beide Router nennen dieselben Favicons und das Apple-Touch-Bild; die gemeinsame SEO-Komponente verwendet eine passende OG-/Twitter-Vorschau. Explizite Bildangaben anderer Seiten bleiben erhalten. Die Startseite nennt ihre kanonische Adresse und ein minimales Organization-Objekt mit Bildziel, ohne erfundene Bewertungen, Geschäftsadressen oder sonstige neue Unternehmensangaben.

Die Middleware gibt ausschließlich acht konkrete neue Bildpfade und das alte `/og.png` frei. Es gibt keine Ausnahme für den gesamten Branding-Ordner. Unbekannte Nachbarn, Sicherungskopien und zusätzliche Pfadsegmente bleiben geschützt. Das bestehende `robots.txt` erlaubt das Crawlen der Startseite und dieser Dateien.

Am 29. Oktober tatsächlich gelesene Primärdokumentation: [Google-Favicon-Richtlinien](https://developers.google.com/search/docs/appearance/favicon-in-search), besonders Erreichbarkeit, quadratisches Format, stabile URL und erneute Erfassung; [Google-Organization-Daten](https://developers.google.com/search/docs/appearance/structured-data/organization), Rolle der Logoangabe. Google entscheidet selbst über Anzeige und Zeitpunkt; eine bereits geänderte Suchergebnisanzeige wird nicht behauptet.

## Native App und Veröffentlichungsgrenze

[Apple beschreibt](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon/), dass App-Symbole aus dem Xcode-Build kommen und eine Änderung nach Veröffentlichung eine neue App-Version samt Review erfordert. Das Ändern einer Webdatei aktualisiert kein bereits installiertes natives Symbol.

Die tatsächlich am 29. Oktober gelesene App-Store-Connect-Übersicht zeigte iOS 1.0.3 „Bereit für Vertrieb“. TestFlight und die Uploadliste zeigten als jüngsten abgeschlossenen Upload Version 1.0.4, Build 13. Ein anschließender neuer Build kann deshalb als 1.0.4 (14) vorbereitet werden. Diese Beobachtung ist kein Nachweis eines neuen Uploads oder einer Store-Freigabe. Die persönliche Genehmigung der bestehenden GitHub-Umgebung `ios-testflight` und die separate App-Store-Prüfung bleiben erhalten. `check-release.mjs` wird nicht verändert oder umgangen. Eine eigenständige Android-App-Quellenstruktur liegt in diesem Repository nicht vor; Android-Web-App-Symbole sind vorbereitet, eine Play-Store-Auslieferung wird nicht behauptet.

## Prüfung

219 passende Web-/SEO-/Zugriffsschutz-/Push-Tests und 51 bestehende mobile Tests bestanden, keine übersprungenen Fälle. Eine veraltete Web-Push-Testannahme an die bisherigen Icon-Dateinamen wurde ausschließlich auf die neuen konkreten Namen umgestellt; Datei-, Größen- und Push-Prüfungen bleiben erhalten. Der bestehende iOS-Projektprüfer besteht mit dem neuen Icon. Der lokale Produktionsbuild mit 509 statischen Seiten ist erfolgreich.

Ein unabhängiger Prüfer hat Masterbytes, sämtliche acht Webvarianten, native Größen und Pixelableitung, die drei identischen zentrierten Startbilder, den SVG-Inhalt, Metadaten und öffentliche Pfadgrenzen überprüft. Root hat AppIcon und Social-Vorschau zusätzlich visuell betrachtet. Diese Bild-/Quellenprüfungen sind keine Installation auf einem Gerät. Technische Rohprotokolle und der spätere tatsächliche Auslieferungsnachweis liegen außerhalb des Repos im Chat-Arbeitsbereich unter `work/regional-law-qa/*oct29*brand*`.

Die bekannte fremde Afternoon-Datei bleibt unberührt und wird nicht mitgestagt. Lehrtexte, Lehrmedien, Benutzer-/Zahlungsdaten, Zugangsschlüssel und die vorhandenen Freigaberegeln werden nicht verändert.
