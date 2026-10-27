# Genetik-Kurs und bestehendes Rassenprofil verbinden

27. Oktober 2026. Dieses Paket ergänzt Navigation, keine fachlichen Aussagen oder Prüfdaten.

Die beiden vorhandenen Genetik-Kurse erhalten im bestehenden unteren Kursmenü jeweils einen kurzen Link „Rassenprofil“. Er erscheint nur für das exakt zugeordnete Paar aus Kurs und Lektion:

- Labrador: `wissen-labrador-dnm1-eic-testgrenzen-2026` / `dnm1-befund-und-beobachtung` führt zum bestehenden Thema `gesundheit-dnm1-befund-und-beobachtung`.
- Weimaraner: `wissen-weimaraner-slc2a9-huu-testgrenzen-2026` / `huu-veranlagung-und-steinbefund` führt zum bestehenden Thema `gesundheit-huu-veranlagung-und-steinbefund`.

Beide Zuordnungen stehen nun gemeinsam in `lib/dog-breed-routing.js`; auch die bereits vorhandene serverseitige Auswahl des Genetik-Lesetexts im Rassenprofil verwendet diese Zuordnung. Kein Rassennamenabgleich oder bloßer Kurspräfix erzeugt weitere Verknüpfungen. Der bestehende Link vom Profil zum Kurs-Wissenscheck bleibt erhalten. Andere Kurse und Lektionen bieten keinen Ersatzlink an.

Es entstehen keine zusätzliche Seite, Kategorie, Auswahl oder Dialogbox. Die Links öffnen das vorhandene Profil im selben Browserfenster. Kursdaten, Karten, Rassenporträts, Fotos, Quellen, historische Prüfdaten, Antwortschlüssel und Speicherverhalten bleiben unverändert. Der Browser erhält keine zusätzlichen Kurs- oder Rassenkorpora; die bestehende Kurs-SSG-Datenstruktur bleibt gleich.

Sechs neue Regressionen prüfen sämtliche 198 Kurse und vorhandenen Lektionen, alle 59 Rassenobjekte und vollständigen Profil-Payloads, die tatsächlich registrierten Themenanker, fünf bestehende Genetik-Karten, den realen Kursleser mit genau einem unteren Link und geschlossenen Schlussquellen sowie die Browsertransformation ohne serverseitige Datenimporte. Positive vollständige Objektvergleiche verwenden den Ausgangsstand `c42efa5`; weder Fragen noch Quelltexte werden für die neue Navigation verändert.

Gemeinsam mit den vorhandenen Rassenprofil-, Genetik-, Artenverknüpfungs- und Lektionsübungsprüfungen bestanden 37 unterschiedliche Tests, kein Fall übersprungen. Das ist eine technische Verknüpfungsprüfung, keine neue medizinische oder fachliche Gesamtprüfung. Eine visuelle Geräteprüfung wird nicht behauptet. Veröffentlichung und tatsächliche Auslieferung werden im Gesamtpaket separat geprüft.
