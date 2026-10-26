# Öffentliche Herkunftsdokumente der sechs neuen Filme

Der tatsächliche Auslieferungscheck des Pakets be0a97d am 26. Oktober 2026
bestätigte alle sechs Filme samt MP4-MIME-Typ, 32-Byte-Rangeabruf und alle sechs
Poster samt Prüfsumme. Das Herkunftsmanifest und die Lizenzübersicht im neuen
statischen Medienordner wurden dagegen als unbekannte Lernpfade behandelt und
zur Preise-Seite umgeleitet. Die Videos und ihre in der Lernansicht gezeigten
Attributionen waren davon nicht betroffen.

Die vorhandene Liste expliziter öffentlicher Mediendateien wird ausschließlich
um zwei bekannte Dokumentpfade ergänzt:

- /lernen/videos-2026-10-26/mediennachweise.json
- /lernen/videos-2026-10-26/MEDIEN-LIZENZEN.md

Die Dateien enthalten ausschließlich Herkunft, Urheber, freie Lizenzversionen,
technische Medienänderungen und Prüfsummen der bereits öffentlichen Medien.
Keine Konto-, Zahlungs- oder Antwortdaten werden veröffentlicht. Es entsteht
weder eine Pfadpräfix-Ausnahme noch eine allgemeine JSON-/Markdown-Ausnahme.
Unbekannte Nachbardateien, Sicherungskopien und Dateipfadanhänge bleiben
geschützt. Lernseiten, Konten und APIs behalten ihre bestehenden Prüfungen.

Ein neuer Fall in scripts/test-public-assets-middleware.cjs prüft die beiden
genauen öffentlichen Dokumente sowie zehn weiterhin geschützte Nachbar- und
Lernpfade. Die bestehenden öffentlichen Medien- und Kontozugriffstests bleiben
unverändert erhalten. Zusammen mit den vier Medien-/Kontextregressionen
bestanden 75 passende Tests ohne fehlgeschlagene oder übersprungene Fälle.
Die Kontoseite führt ohne Anmeldung weiterhin zum Login; die geprüften
Lernpfade führen weiterhin zur Preise-Seite. Tests verwenden ausschließlich
isolierte Sitzungen und keine tatsächlichen Konten.

Der spätere neue Versions- und Dokumentabruf ist gemeinsam mit dem bereits
vorliegenden unveränderten Film-/Posterbeleg zu betrachten. Der erste Nachweis
wird nicht nachträglich als vollständiger Erfolg umgeschrieben. Eine
Gerätewiedergabe wird aus den HTTP-Prüfungen nicht abgeleitet.
