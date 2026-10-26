# Gebiss: Lerntext vor Übung, Nachweise gesammelt am Ende

Technische Darstellungsprüfung vom 26. Oktober 2026. Dieser Bericht bezeichnet keine neue fachliche Prüfung der Zahnformeln oder der gesamten Lernplattform.

## Befund und Änderung

`WildlifeDentition` zeigte seine Gebissrunde vor dem vollständigen Abschnitt „Zahnformeln richtig lesen“. Nach einer Antwort fügte `ResearchQuestionRound` eigene Fragequellen ein; danach folgte noch die eigentliche Notationserklärung. Dieselben Profilquellen standen zusätzlich bereits in der abschließenden Quellenfläche.

Der vorhandene Erklärungsabschnitt steht nun vollständig vor der Übungsrunde. Sämtliche Sätze, die Referenzformeln, Varianten, Einschränkungen, Fragen, Antworttexte, Erklärungen, Profilzuordnungen und Prüfdaten bleiben erhalten. Die vorhandenen Profil- und Notationsquellen stehen weiterhin gesammelt in der letzten, zunächst geschlossenen Fläche „Belege zur Zahnformel“. Keine Quellenobjekte, Quellzuordnungen oder Datenmodule wurden geändert.

`ResearchQuestionRound` hat die zusätzliche optionale Darstellungsangabe `showSources`, standardmäßig `true`. Ausschließlich die Gebissansicht setzt sie auf `false`, weil deren Quellen schon vollständig und eindeutig am Ende gesammelt sind. Das betrifft nur die Ausgabe der zusätzlichen Rundennachweise. Erklärung, Bewertung, Fragenwechsel, Reihenfolge, Wiederholung, Rundengrenzen und gespeicherter Rundenzustand sind davon unabhängig. Andere bestehende Aufrufer behalten ihre bisherige Quellenausgabe, solange sie die neue Angabe nicht ausdrücklich ändern.

## Tatsächliche Prüfung

Die neue Datei `scripts/test-dentition-end-sources.cjs` prüft sieben Fälle mit tatsächlichen Komponenten und isolierten React-Hooks:

1. Alle 40 veröffentlichten Gebissprofile werden serverseitig gerendert. Der vollständige Notationstext steht vor der Übung; Geltungsbereich, Hinweise, Zahnzahl und vorhandenes Datum bleiben sichtbar. Jeder Profil- und Notationslink steht genau einmal in der letzten geschlossenen Nachweisfläche.
2. Die tatsächliche eingebettete Runde erhält für jedes Profil unverändert seine 16 erzeugten Fragen, seine ursprünglichen Quellen, seine ID und den bisherigen Hinweistext. Jede Fragequelle ist in der gesammelten Profilquellenfläche auflösbar.
3. Eine tatsächliche Antwort in der eingebetteten Rehwildrunde erzeugt weiterhin die richtige Bewertung und vollständige Erklärung. Im gesamten danach gerenderten Gebissabschnitt bleiben die Quellen ausschließlich am Ende.
4. Beide Acht-Fragen-Runden eines Profils mit Varianten werden durch tatsächliche Antwort- und Weiterklicks abgeschlossen: alle 16 IDs einmal, sämtliche Erklärungen, korrekte Auswertung, Fortsetzung und Neustart. Auch in der Endauswertung erscheinen keine zusätzlichen Quellen mitten im Abschnitt.
5. Für reale Forschungsfragen aller drei Formate (Einzelwahl, Mehrfachwahl, Reihenfolge) bleibt die bisherige Ausgabe bei weggelassenem `showSources` exakt gleich zur ausdrücklichen Angabe `true`. Das vorübergehende Abschalten verändert weder Antwortzustand noch Erklärung; nach der Endauswertung bleiben Defaultnachweise erhalten.
6. Der tatsächliche bestehende `RevierMoment`-Aufruf übergibt weiterhin keinen Quellen-Schalter. Seine beantwortete Tagesfrage zeigt die bisherigen Quellen und den Tagesabschluss.
7. Vogel-, zurückgehaltene und unbekannte Gebisspfade behalten ihre jeweiligen Texte beziehungsweise ihr bisheriges leeres Ergebnis und erhalten keine Übungsrunde.

Gemeinsam ausgeführt mit Node 22:

```text
node --test scripts/test-dentition-end-sources.cjs scripts/test-dentition-questions.cjs scripts/test-research-question-round.cjs
21 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen.
```

Die zwei unverändert ausgeführten Bestandssuiten prüfen zusätzlich die Formeln, alle Frageobjekte und Antwortmöglichkeiten, ID-Auswertung, unterschiedliche Formate, Mischungen, Doppelklick-/Rundengrenzen und beide Fragebatches.

Kein Browser, Mobilgerät, fremder Benutzerspeicher oder externer Dienst wurde für diese Prüfung verwendet. Eine visuelle Geräteprüfung wird damit nicht behauptet. Kein Commit oder Cloudschreibzugriff erfolgte durch diese Aufgabe. Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` blieb unberührt.
