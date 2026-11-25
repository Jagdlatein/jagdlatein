# Prüfungsplan: kleinere Seitendaten ohne Inhaltsverlust

Technische Prüfung am 25. November 2026 mit Node 22.23.5. Ausgangspunkt ist
Commit `61019897797d9fe851ff3bb25e46a5a5a534e578` und der zuvor dokumentierte
rein lesende Performance-Audit. Es werden keine Lerntexte oder Fachprüfdaten
neu bewertet.

## Befund und Änderung

Die bisherigen Seitendaten überschreiten die vorhandene 400000-Byte-Grenze.
Die tatsächlich benutzten Lerntexte, Quellenzuordnungen und regionalen Angaben
werden dafür nicht gekürzt. Eine kleine Projektion unmittelbar im
`getStaticProps` von `/lernen/pruefungsplan` entfernt ausschliesslich Metadaten,
die die vorhandenen Seitenkomponenten nicht lesen:

- Aus regionalen und föderalen Rechtszusammenfassungen nur `articleCount`,
  `reviewedArticleCount`, `questionCount`, `lawTitle` und `officialUrl`.
  Die Oberfläche verwendet die erhaltenen Gesamtzahlen und die vollständigen
  Quellen- und Prüfungsunterlagen. Ein fehlender oder nullwertiger Bundesblock
  bleibt entsprechend fehlend oder null.
- Nur bei den neun Regionen mit tatsächlich nichtleeren `subjectAreas` werden
  die bereits deaktivierten allgemeinen `focus`- und `moduleIds`-Startlisten
  entfernt. `ExamRegionPreparation` verwendet dort ausschliesslich die genauen
  Fachlernziele, auch wenn ein Lernstandfilter alle Ziele ausblendet. Die anderen
  42 Regionen behalten ihre Startlisten vollständig.

Unbekannte zukünftige Felder bleiben erhalten. Der Helfer mutiert die Eingaben
nicht. Die drei gemeinsamen Serveradapter und die globalen Daten bleiben
unverändert. Der Client erhält weder einen zusätzlichen Helfer noch eine neue
API-Abhängigkeit.

## Frisch gemessener Umfang

Mit dem tatsächlichen aktuellen Fragenbestand ergeben sich lokal:

| JSON | Vorher | Nachher |
| --- | ---: | ---: |
| Seiten-Props | 415968 Byte | 397024 Byte |
| Daraus konstruierte Next-Datenhülle | 415997 Byte | 397053 Byte |

Die unverpackten Seitendaten werden um 18944 Byte beziehungsweise 4,5542 Prozent
kleiner. Die vorhandene 400000-Byte-Grenze wird eingehalten und nicht erhöht.
Die Konstruktion der Next-JSON-Hülle ist eine lokale Vergleichsmessung, noch kein
Nachweis eines neuen Builds oder einer produktiven Übertragung. Die verbleibende
Grösse liegt weiterhin über Nexts 128-KiB-Hinweisgrenze. Es wird weder behauptet,
dieser Hinweis sei verschwunden, noch eine Ladezeit- oder Netzersparnis gemessen.

## Erhalt und Prüfung

Die neue gezielte Suite prüft Eingabefreeze, unbekannte zukünftige Felder,
fehlende/nullwertige Blöcke, alle 51 Regionen und die genaue 9/42-Aufteilung.
Die zwölf Kategorien, alle 48 gemeinsamen Lernziele samt 202 Quellen und
vollständigen `sourceContexts`, die 17 gemeinsamen Kursstarts und der gesamte
kompakt gespeicherte Wiederholungskatalog bleiben exakt gleich. Sämtliche
regionalen Quellen, Originaladressen, Prüfdaten, Geltungsgrenzen, Formate,
Fachlernziele und tatsächlich benutzten Gesamtzahlen bleiben erhalten.

107 tatsächliche SSR-Ausgaben sind vor und nach der Projektion byteidentisch:
51 Profile, 48 einzelne gemeinsame Aufgaben, sieben initiale/ungültige oder
nicht bereite Zustände sowie der bestehende Zustand ohne Blueprint. Der echte
SSG-Clienttransform entfernt alle Serveradapter und den neuen Seitenhelfer.

Die neue Suite und die vorhandenen Ziel-Fokus-/Themenansichtstests bestehen
zusammen 12/12 Fälle in drei Dateien ohne übersprungene Fälle:

```text
node --test scripts/test-exam-plan-page-projection-nov25.cjs scripts/test-exam-goal-focus-nov25.cjs scripts/test-exam-plan-topic-rendering.cjs
```

Externe Nachweise im Chat-Arbeitsordner:

```text
work/exam-plan-performance-nov25/performance-audit.json
work/exam-plan-performance-nov25/current-page-projection-measurement.json
work/exam-plan-performance-nov25/page-projection-tests-final.txt
```

Keine Konto-, Speicher-, Zugangs-, Rechtsfreigabe- oder API-Änderung; keine
Live-Anfrage mit Kundendaten, kein neuer Build und keine Geräteprüfung durch
diesen Änderungsschritt. Fremdes Nachmittag-JSON und Marketingmaterial bleiben
unberührt.
