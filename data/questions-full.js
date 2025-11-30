// data/questions-full.js
// Struktur für großen Fragenpool (DE/AT/CH) mit integrierter Filter- & Shuffle-Funktion.
// Enthält 45 Startfragen (15 je Land). Du kannst beliebig erweitern.
// Format kompatibel zu deinem bestehenden Quiz.

export const PACK_INFO = {
  version: "1.0.0",
  topics: [
    "Wildkunde",
    "Waffen & Schuss",
    "Recht",
    "Hege/Naturschutz",
    "Hundewesen",
    "Wildbrethygiene",
    // optional später: "Fangjagd","Seuchen","Erste Hilfe","Ökologie","Wald & Forst"
  ],
  countries: ["DE", "AT", "CH"]
};

// Hilfs-Validator: wirft warn logs bei inkonsistenten Einträgen (nur Dev).
function validatePool(arr) {
  if (typeof window === "undefined") return; // nur im Browser warnen
  const ids = new Set();
  arr.forEach((q, i) => {
    if (!q.id) console.warn("Frage ohne ID an Index", i);
    if (ids.has(q.id)) console.warn("Doppelte ID:", q.id);
    ids.add(q.id);
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      console.warn("Zu wenige Antworten bei", q.id);
    }
    if (!Array.isArray(q.correct) || q.correct.length < 1) {
      console.warn("Keine richtige Antwort bei", q.id);
    }
  });
}

export const QUESTIONS = [
  /* =========================
   * DEUTSCHLAND (15)
   * ========================= */

  // Wildkunde
  {
    id:'DE-wk-reh-losung',
    countries:['DE'], topic:'Wildkunde',
    q:'Woran erkennst du typischerweise Rehwild-Losung?',
    answers:[
      {id:'a', text:'Birnenförmig, oft kettenartig'},
      {id:'b', text:'Große kugelige Murmeln'},
      {id:'c', text:'Spiralig gedreht'},
      {id:'d', text:'Flache Scheiben'}
    ],
    correct:['a'],
    explain:'Typisch Reh: birnenförmig, oft in Ketten abgelegt.'
  },
  {
    id:'DE-wk-rotwild-zahnpad',
    countries:['DE'], topic:'Wildkunde',
    q:'Was befindet sich beim Rotwild anstelle der oberen Schneidezähne?',
    answers:[
      {id:'a', text:'Zahnpad (Kernplatte)'},
      {id:'b', text:'Hauer'},
      {id:'c', text:'Eckzahnreihe'},
      {id:'d', text:'Nichts – komplett leer'}
    ],
    correct:['a'],
    explain:'Wiederkäuer besitzen oben ein Zahnpad statt Schneidezähnen.'
  },
  {
    id:'DE-wk-fuchs-losung',
    countries:['DE'], topic:'Wildkunde',
    q:'Wie beschreibt man typische Fuchslosung?',
    answers:[
      {id:'a', text:'Kegelförmig, oft mit Haar-/Knochenresten'},
      {id:'b', text:'Birnenförmig in Ketten'},
      {id:'c', text:'Fladenartig'},
      {id:'d', text:'Reiskornartig'}
    ],
    correct:['a'],
    explain:'Fleischfresser: häufig spitz auslaufend, mit Haar- oder Knochenresten.'
  },

  // Waffen & Schuss
  {
    id:'DE-ws-safety-muendung',
    countries:['DE'], topic:'Waffen & Schuss',
    q:'Welche Grundregel gilt immer?',
    answers:[
      {id:'a', text:'Sicherung ersetzt Mündungsdisziplin'},
      {id:'b', text:'Nie auf etwas richten, das nicht beschossen werden soll'},
      {id:'c', text:'Im Revier immer entsichert tragen'},
      {id:'d', text:'Finger früh auf den Abzug'}
    ],
    correct:['b'],
    explain:'Mündungs- und Abzugsdisziplin sind unverzichtbar.'
  },
  {
    id:'DE-ws-flintenlaufgeschoss',
    countries:['DE'], topic:'Waffen & Schuss',
    q:'Wofür dient das Flintenlaufgeschoss in der Jagdpraxis vor allem?',
    answers:[
      {id:'a', text:'Weitdistanzpräzision'},
      {id:'b', text:'Kurze Distanz/Not- oder Nachsuchensituationen'},
      {id:'c', text:'Tontaubenschießen'},
      {id:'d', text:'Als Schalldämpferersatz'}
    ],
    correct:['b'],
    explain:'Kurze Distanzen, z. B. Nachsuche; nicht für weite Präzisionsschüsse.'
  },
  {
    id:'DE-ws-zielfernrohr-parallaxe',
    countries:['DE'], topic:'Waffen & Schuss',
    q:'Wozu dient der Parallaxenausgleich am Zielfernrohr?',
    answers:[
      {id:'a', text:'Erhöht Mündungsenergie'},
      {id:'b', text:'Schärfe/Entfernung feinjustieren, Parallaxefehler minimieren'},
      {id:'c', text:'Verstellt Abzugskraft'},
      {id:'d', text:'Steuert den Schalldämpfer'}
    ],
    correct:['b'],
    explain:'Scharfstellen & Fehlerreduktion → präziseres Zielen.'
  },

  // Recht DE
  {
    id:'DE-recht-traeger',
    countries:['DE'], topic:'Recht',
    q:'Wer ist in Deutschland Träger des Jagdrechts?',
    answers:[
      {id:'a', text:'Jagdpächter'},
      {id:'b', text:'Grundstückseigentümer'},
      {id:'c', text:'Untere Jagdbehörde'},
      {id:'d', text:'Jagdscheininhaber'}
    ],
    correct:['b'],
    explain:'Träger ist der Eigentümer; Ausübungsrecht kann verpachtet werden.'
  },
  {
    id:'DE-recht-aufbewahrung',
    countries:['DE'], topic:'Recht',
    q:'Welche Aussage zur Waffenaufbewahrung ist korrekt?',
    answers:[
      {id:'a', text:'Geladene Waffen sind zulässig'},
      {id:'b', text:'Verschlossen, gesetzeskonform; Munition getrennt'},
      {id:'c', text:'Offenes Lagern ist erlaubt'},
      {id:'d', text:'Nur Vorhängeschloss genügt immer'}
    ],
    correct:['b'],
    explain:'Aufbewahrung nach WaffG/Behältnisvorgaben; Munition getrennt.'
  },
  {
    id:'DE-recht-hege',
    countries:['DE'], topic:'Recht',
    q:'Welche Pflicht trifft Jäger regelmäßig in DE?',
    answers:[
      {id:'a', text:'Keine Pflichten'},
      {id:'b', text:'Hegepflicht & Waidgerechtigkeit'},
      {id:'c', text:'Ganzjährige Fütterung'},
      {id:'d', text:'Schießen ohne Revierbezug'}
    ],
    correct:['b'],
    explain:'Hege und Waidgerechtigkeit sind zentrale Grundsätze.'
  },

  // Hege/Naturschutz
  {
    id:'DE-hege-biotope',
    countries:['DE'], topic:'Hege/Naturschutz',
    q:'Was ist Ziel der Biotophege?',
    answers:[
      {id:'a', text:'Nur jagdlich nutzbare Arten fördern'},
      {id:'b', text:'Lebensräume verbessern, Vielfalt erhalten'},
      {id:'c', text:'Nur Prädatoren reduzieren'},
      {id:'d', text:'Eingriffe komplett vermeiden'}
    ],
    correct:['b'],
    explain:'Habitatqualität & Strukturvielfalt erhöhen Biodiversität.'
  },
  {
    id:'DE-hege-verbiss',
    countries:['DE'], topic:'Hege/Naturschutz',
    q:'Was signalisiert starker Verbissschaden?',
    answers:[
      {id:'a', text:'Gute Verjüngung'},
      {id:'b', text:'Ungleichgewicht Wildbestand/Lebensraum'},
      {id:'c', text:'Nur Wettereffekt'},
      {id:'d', text:'Kein Handlungsbedarf'}
    ],
    correct:['b'],
    explain:'Angepasster Abschuss/Schutzmaßnahmen prüfen.'
  },

  // Hundewesen
  {
    id:'DE-hund-brauchbarkeit',
    countries:['DE'], topic:'Hundewesen',
    q:'Warum sind brauchbare Jagdhunde wichtig?',
    answers:[
      {id:'a', text:'Nur Zierde'},
      {id:'b', text:'Nachsuche, Apport, Stöbern – tierschutzgerecht'},
      {id:'c', text:'Weil leiser als Katzen'},
      {id:'d', text:'Nur Drückjagd'}
    ],
    correct:['b'],
    explain:'Brauchbarkeit dient Tierschutz & Waidgerechtigkeit.'
  },
  {
    id:'DE-hund-fuehrung',
    countries:['DE'], topic:'Hundewesen',
    q:'Welche Führungsgrundsätze gelten?',
    answers:[
      {id:'a', text:'Ohne Ausbildung ins Revier'},
      {id:'b', text:'Gehorsam, Signalverständnis, Wildschonung'},
      {id:'c', text:'Immer unbeaufsichtigt'},
      {id:'d', text:'Keine Nachsucheausbildung nötig'}
    ],
    correct:['b'],
    explain:'Ausbildung/Gehorsam sichern waidgerechtes Arbeiten.'
  },

  // Wildbrethygiene
  {
    id:'DE-hygiene-kuehlung',
    countries:['DE'], topic:'Wildbrethygiene',
    q:'Was ist direkt nach dem Erlegen entscheidend?',
    answers:[
      {id:'a', text:'Trophäen zuerst kochen'},
      {id:'b', text:'Schnelles, sauberes Aufbrechen & Kühlen'},
      {id:'c', text:'Warm lagern'},
      {id:'d', text:'Plastiksack ohne Lüftung'}
    ],
    correct:['b'],
    explain:'Schnelles Aufbrechen & Kühlen senken Keimdruck.'
  },
  {
    id:'DE-hygiene-trichinen',
    countries:['DE'], topic:'Wildbrethygiene',
    q:'Welche Probenpflicht gilt für Schwarzwild?',
    answers:[
      {id:'a', text:'Keine'},
      {id:'b', text:'Trichinenprobe vor Abgabe/Verzehr'},
      {id:'c', text:'Nur bei Frischlingen'},
      {id:'d', text:'Nur bei Keilern'}
    ],
    correct:['b'],
    explain:'Amtliche Trichinenuntersuchung ist Pflicht.'
  },

  /* =========================
   * ÖSTERREICH (15)
   * ========================= */

  // Wildkunde
  {
    id:'AT-wk-gams-anpassung',
    countries:['AT'], topic:'Wildkunde',
    q:'Welche Anpassung zeigt die Gams im Gebirge?',
    answers:[
      {id:'a', text:'Schwimmhäute'},
      {id:'b', text:'Harter Schalenrand, hohe Trittsicherheit'},
      {id:'c', text:'Grabkrallen'},
      {id:'d', text:'Nackter Schwanz zum Balancieren'}
    ],
    correct:['b'],
    explain:'Trittsichere Schalen für felsiges Gelände.'
  },
  {
    id:'AT-wk-schwarzwild-faehrte',
    countries:['AT'], topic:'Wildkunde',
    q:'Woran erkennst du eine typische Schwarzwildfährte?',
    answers:[
      {id:'a', text:'Runde Ballen mit Krallen'},
      {id:'b', text:'Spitz-oval, tiefes Trittsiegel'},
      {id:'c', text:'Dreizehige Spur'},
      {id:'d', text:'Sehr kleine, zweireihige Hufe'}
    ],
    correct:['b'],
    explain:'Schalenabdruck spitz-oval, kräftig gesetzt.'
  },
  {
    id:'AT-wk-ente-schwimm',
    countries:['AT'], topic:'Wildkunde',
    q:'Merkmal von Schwimmenten gegenüber Tauchenten?',
    answers:[
      {id:'a', text:'Steiler Startflug, Beine mittig'},
      {id:'b', text:'Beine weit hinten, lange Tauchgänge'},
      {id:'c', text:'Nur an Land'},
      {id:'d', text:'Können nicht auffliegen'}
    ],
    correct:['a'],
    explain:'Schwimmenten starten steil, Beine mittiger als Tauchenten.'
  },

  // Waffen & Schuss
  {
    id:'AT-ws-safety',
    countries:['AT'], topic:'Waffen & Schuss',
    q:'Welche Grundregel gilt?',
    answers:[
      {id:'a', text:'Sicherung ersetzt Mündungsdisziplin'},
      {id:'b', text:'Mündung nie auf Nicht-Ziel richten'},
      {id:'c', text:'Im Revier immer entsichert'},
      {id:'d', text:'Finger früh am Abzug'}
    ],
    correct:['b'],
    explain:'Mündungs-/Abzugsdisziplin sind zentral.'
  },
  {
    id:'AT-ws-flg',
    countries:['AT'], topic:'Waffen & Schuss',
    q:'Wofür nutzt man Flintenlaufgeschosse?',
    answers:[
      {id:'a', text:'Weitdistanz'},
      {id:'b', text:'Kurze Distanz / Nachsuche'},
      {id:'c', text:'Nur Sport'},
      {id:'d', text:'Niemals in Österreich'}
    ],
    correct:['b'],
    explain:'Kurzdistanz/Nachsuche; weite Präzision unüblich.'
  },
  {
    id:'AT-ws-kaliber-rehwild',
    countries:['AT'], topic:'Waffen & Schuss',
    q:'Sinnvolles Prinzip für Rehwildkaliber?',
    answers:[
      {id:'a', text:'Nur Randfeuer'},
      {id:'b', text:'Ausreichende Energie & Präzision'},
      {id:'c', text:'Nur Schrot'},
      {id:'d', text:'Pistolenmunition ausreichend'}
    ],
    correct:['b'],
    explain:'Energie/Präzision wichtiger als „nur groß“.'
  },

  // Recht AT
  {
    id:'AT-recht-landesrecht',
    countries:['AT'], topic:'Recht',
    q:'Welche Ebene regelt das Jagdrecht primär?',
    answers:[
      {id:'a', text:'Bund'},
      {id:'b', text:'Länder (Landesrecht)'},
      {id:'c', text:'Gemeinden exklusiv'},
      {id:'d', text:'EU direkt'}
    ],
    correct:['b'],
    explain:'Jagdrecht ist Landesrecht; Details je Bundesland.'
  },
  {
    id:'AT-recht-jagdkarte',
    countries:['AT'], topic:'Recht',
    q:'Was ist Voraussetzung zur Jagdausübung in AT meist?',
    answers:[
      {id:'a', text:'Fischereischein'},
      {id:'b', text:'Gültige Jagdkarte/Jagderlaubnis'},
      {id:'c', text:'Nur Waffenschein'},
      {id:'d', text:'Keine Voraussetzung'}
    ],
    correct:['b'],
    explain:'Landesrechtlich geregelt; Jagdkarte/Jagderlaubnis erforderlich.'
  },
  {
    id:'AT-recht-schonzeiten',
    countries:['AT'], topic:'Recht',
    q:'Was gilt für Schonzeiten in AT?',
    answers:[
      {id:'a', text:'Bundeseinheitlich'},
      {id:'b', text:'Je Bundesland unterschiedlich'},
      {id:'c', text:'Keine Schonzeiten'},
      {id:'d', text:'Nur kommunal'}
    ],
    correct:['b'],
    explain:'Landesrecht → Schonzeiten je Land verschieden.'
  },

  // Hege/Naturschutz
  {
    id:'AT-hege-biotope',
    countries:['AT'], topic:'Hege/Naturschutz',
    q:'Ziel der Biotophege?',
    answers:[
      {id:'a', text:'Nur jagdlich nutzbare Arten'},
      {id:'b', text:'Lebensräume verbessern & Vielfalt erhalten'},
      {id:'c', text:'Nur Prädatoren reduzieren'},
      {id:'d', text:'Gar keine Eingriffe'}
    ],
    correct:['b'],
    explain:'Habitatqualität & Strukturvielfalt fördern Biodiversität.'
  },
  {
    id:'AT-hege-fuettern',
    countries:['AT'], topic:'Hege/Naturschutz',
    q:'Welche Aussage zur Fütterung ist weidgerecht?',
    answers:[
      {id:'a', text:'Ersetzt Lebensraumverbesserung'},
      {id:'b', text:'Nur situativ/gesetzeskonform & fachlich begründet'},
      {id:'c', text:'Ganzjährig immer notwendig'},
      {id:'d', text:'Nie zulässig'}
    ],
    correct:['b'],
    explain:'Fütterung restriktiv; Gesetze/Lage beachten.'
  },

  // Hundewesen
  {
    id:'AT-hund-nachsuchen',
    countries:['AT'], topic:'Hundewesen',
    q:'Warum brauchbare Jagdhunde?',
    answers:[
      {id:'a', text:'Zierde'},
      {id:'b', text:'Nachsuche, Apport, Stöbern – tierschutzgerecht'},
      {id:'c', text:'Weil leiser als Katzen'},
      {id:'d', text:'Nur Drückjagd'}
    ],
    correct:['b'],
    explain:'Brauchbarkeit = Waidgerechtigkeit/Tierschutz.'
  },
  {
    id:'AT-hund-fuehrung',
    countries:['AT'], topic:'Hundewesen',
    q:'Welche Führungsgrundsätze?',
    answers:[
      {id:'a', text:'Ohne Ausbildung ins Revier'},
      {id:'b', text:'Gehorsam, Signalverständnis, Wildschonung'},
      {id:'c', text:'Unbeaufsichtigt'},
      {id:'d', text:'Keine Nachsucheausbildung'}
    ],
    correct:['b'],
    explain:'Ausbildung/Gehorsam sind zentral.'
  },

  // Wildbrethygiene
  {
    id:'AT-hygiene-aufbrechen',
    countries:['AT'], topic:'Wildbrethygiene',
    q:'Direkt nach Erlegen wichtig?',
    answers:[
      {id:'a', text:'Trophäe zuerst'},
      {id:'b', text:'Sauber aufbrechen & kühlen'},
      {id:'c', text:'Warm lagern'},
      {id:'d', text:'Plastiksack ohne Luft'}
    ],
    correct:['b'],
    explain:'Schnelles Aufbrechen/Kühlen = geringerer Keimdruck.'
  },
  {
    id:'AT-hygiene-trichinen',
    countries:['AT'], topic:'Wildbrethygiene',
    q:'Trichinen-Untersuchungspflicht betrifft:',
    answers:[
      {id:'a', text:'Nur Rehwild'},
      {id:'b', text:'Schwarzwild (gesetzlich geregelt)'},
      {id:'c', text:'Nur Hirschwild'},
      {id:'d', text:'Alle Vögel'}
    ],
    correct:['b'],
    explain:'Trichinenprobe bei Schwarzwild vorgeschrieben.'
  },

  /* =========================
   * SCHWEIZ (15)
   * ========================= */

  // Wildkunde
  {
    id:'CH-wk-gams-anpassung',
    countries:['CH'], topic:'Wildkunde',
    q:'Welche Anpassung zeigt die Gams?',
    answers:[
      {id:'a', text:'Schwimmhäute'},
      {id:'b', text:'Harter Schalenrand, trittsicher'},
      {id:'c', text:'Grabkrallen'},
      {id:'d', text:'Nackter Balancierschwanz'}
    ],
    correct:['b'],
    explain:'Gebirgsanpassung: trittsichere Schalen.'
  },
  {
    id:'CH-wk-schwarzwild-faehrte',
    countries:['CH'], topic:'Wildkunde',
    q:'Typische Schwarzwildfährte?',
    answers:[
      {id:'a', text:'Ballenabdrücke mit Krallen'},
      {id:'b', text:'Spitz-oval, tiefes Trittsiegel'},
      {id:'c', text:'Dreizehig'},
      {id:'d', text:'Mini, zweireihig'}
    ],
    correct:['b'],
    explain:'Schalen spitz-oval, kräftig gesetzt.'
  },
  {
    id:'CH-wk-ente-schwimm',
    countries:['CH'], topic:'Wildkunde',
    q:'Merkmal Schwimmenten vs. Tauchenten?',
    answers:[
      {id:'a', text:'Steiler Startflug, Beine mittig'},
      {id:'b', text:'Sehr lange Tauchgänge, Beine hinten'},
      {id:'c', text:'Nur Landvögel'},
      {id:'d', text:'Flugunfähig'}
    ],
    correct:['a'],
    explain:'Schwimmenten starten steil; Beine mittiger.'
  },

  // Waffen & Schuss
  {
    id:'CH-ws-safety',
    countries:['CH'], topic:'Waffen & Schuss',
    q:'Welche Regel gilt immer?',
    answers:[
      {id:'a', text:'Sicherung ersetzt Mündungsdisziplin'},
      {id:'b', text:'Mündung nie auf Nicht-Ziel richten'},
      {id:'c', text:'Im Revier immer entsichert'},
      {id:'d', text:'Finger früh am Abzug'}
    ],
    correct:['b'],
    explain:'Mündungs-/Abzugsdisziplin sind zentral.'
  },
  {
    id:'CH-ws-flg',
    countries:['CH'], topic:'Waffen & Schuss',
    q:'Flintenlaufgeschoss – praktischer Einsatz?',
    answers:[
      {id:'a', text:'Weitdistanz'},
      {id:'b', text:'Kurze Distanz/Nachsuche'},
      {id:'c', text:'Nur Sport'},
      {id:'d', text:'Nie verwenden'}
    ],
    correct:['b'],
    explain:'Kurzdistanz/Nachsuche.'
  },
  {
    id:'CH-ws-parallaxe',
    countries:['CH'], topic:'Waffen & Schuss',
    q:'Parallaxenausgleich am ZF dient:',
    answers:[
      {id:'a', text:'Mehr Mündungsenergie'},
      {id:'b', text:'Schärfe & Fehlerminimierung auf Distanz'},
      {id:'c', text:'Abzugsgewicht'},
      {id:'d', text:'Schalldämpfer-Steuerung'}
    ],
    correct:['b'],
    explain:'Scharfstellen & Parallaxefehler mindern.'
  },

  // Recht CH
  {
    id:'CH-recht-ebene',
    countries:['CH'], topic:'Recht',
    q:'Auf welcher Ebene werden Jagdbestimmungen maßgeblich geregelt?',
    answers:[
      {id:'a', text:'Kantonale Ebene (unter Bundesrahmen)'},
      {id:'b', text:'EU-Ebene'},
      {id:'c', text:'Nur Gemeinde'},
      {id:'d', text:'Nur Bund'}
    ],
    correct:['a'],
    explain:'Kantone regeln maßgeblich; Bund setzt Rahmen.'
  },
  {
    id:'CH-recht-system',
    countries:['CH'], topic:'Recht',
    q:'Welche Jagdsysteme gibt es in der Schweiz?',
    answers:[
      {id:'a', text:'Nur Pachtjagd'},
      {id:'b', text:'Pacht- und Patentjagd je nach Kanton'},
      {id:'c', text:'Nur Patentjagd'},
      {id:'d', text:'Keine Systeme'}
    ],
    correct:['b'],
    explain:'Je Kanton Pacht- oder Patentjagd.'
  },
  {
    id:'CH-recht-schonzeiten',
    countries:['CH'], topic:'Recht',
    q:'Wie verhalten sich Schonzeiten in CH?',
    answers:[
      {id:'a', text:'Bundeseinheitlich'},
      {id:'b', text:'Kantonale Regeln unterscheiden sich'},
      {id:'c', text:'Keine Schonzeiten'},
      {id:'d', text:'EU-weit vorgegeben'}
    ],
    correct:['b'],
    explain:'Kantone regeln Details; bundesrechtlicher Rahmen.'
  },

  // Hege/Naturschutz
  {
    id:'CH-hege-biotope',
    countries:['CH'], topic:'Hege/Naturschutz',
    q:'Zentrales Ziel der Biotophege?',
    answers:[
      {id:'a', text:'Nur jagdlich nutzbare Arten'},
      {id:'b', text:'Lebensräume verbessern & Vielfalt erhalten'},
      {id:'c', text:'Ausschließlich Prädatorenreduktion'},
      {id:'d', text:'Alle Eingriffe vermeiden'}
    ],
    correct:['b'],
    explain:'Habitatqualität/Strukturvielfalt → Biodiversität.'
  },
  {
    id:'CH-hege-fuettern',
    countries:['CH'], topic:'Hege/Naturschutz',
    q:'Weidgerechte Aussage zur Fütterung?',
    answers:[
      {id:'a', text:'Ersetzt Lebensraumverbesserung'},
      {id:'b', text:'Nur situativ/gesetzeskonform & fachlich begründet'},
      {id:'c', text:'Ganzjährig immer nötig'},
      {id:'d', text:'Nie zulässig'}
    ],
    correct:['b'],
    explain:'Zurückhaltend & rechtlich konform anwenden.'
  },

  // Hundewesen
  {
    id:'CH-hund-nachsuchen',
    countries:['CH'], topic:'Hundewesen',
    q:'Weshalb brauchbare Jagdhunde?',
    answers:[
      {id:'a', text:'Zierde'},
      {id:'b', text:'Nachsuche/Apport/Stöbern – tierschutzgerecht'},
      {id:'c', text:'Leiser als Katzen'},
      {id:'d', text:'Nur Drückjagd'}
    ],
    correct:['b'],
    explain:'Brauchbarkeit = Waidgerechtigkeit/Tierschutz.'
  },
  {
    id:'CH-hund-fuehrung',
    countries:['CH'], topic:'Hundewesen',
    q:'Welche Führungsgrundsätze?',
    answers:[
      {id:'a', text:'Ohne Ausbildung ins Revier'},
      {id:'b', text:'Gehorsam, Signalverständnis, Wildschonung'},
      {id:'c', text:'Unbeaufsichtigt'},
      {id:'d', text:'Keine Nachsucheausbildung nötig'}
    ],
    correct:['b'],
    explain:'Ausbildung/Gehorsam sind zentral.'
  },

  // Wildbrethygiene
  {
    id:'CH-hygiene-aufbrechen',
    countries:['CH'], topic:'Wildbrethygiene',
    q:'Direkt nach dem Erlegen ist wichtig:',
    answers:[
      {id:'a', text:'Trophäe zuerst kochen'},
      {id:'b', text:'Sauber aufbrechen & kühlen'},
      {id:'c', text:'Warm lagern'},
      {id:'d', text:'Plastiksack ohne Luft'}
    ],
    correct:['b'],
    explain:'Schnelles Aufbrechen/Kühlen senkt Keimdruck.'
  },
  {
    id:'CH-hygiene-trichinen',
    countries:['CH'], topic:'Wildbrethygiene',
    q:'Trichinenuntersuchungspflicht betrifft:',
    answers:[
      {id:'a', text:'Nur Rehwild'},
      {id:'b', text:'Schwarzwild (gesetzlich geregelt)'},
      {id:'c', text:'Nur Hirschwild'},
      {id:'d', text:'Alle Vögel'}
    ],
    correct:['b'],
    explain:'Bei Schwarzwild behördlich vorgeschrieben.'
  },
  /* =============================
 * NEUE FRAGEN – BLOCK 1 (50x)
 * Wildkunde (Prüfungsrelevant)
 * ============================= */

{
  id:'DE-wk-bock-gebiss-01',
  countries:['DE'], topic:'Wildkunde',
  q:'Welches Merkmal weist beim Rehbock auf ein Alter von über 5 Jahren hin?',
  answers:[
    {id:'a', text:'Deutlich abgenutzte Schmelzleiste'},
    {id:'b', text:'Milchgebiss noch vorhanden'},
    {id:'c', text:'Schneidezähne erscheinen spitz'},
    {id:'d', text:'Backenzähne wirken scharfkantig'}
  ],
  correct:['a'],
  explain:'Bei älteren Rehböcken nutzt sich die Schmelzleiste stark ab.'
},

{
  id:'DE-wk-hirsch-abschussreife-02',
  countries:['DE'], topic:'Wildkunde',
  q:'Woran erkennt man bei Hirschen häufig eine hohe Altersklasse?',
  answers:[
    {id:'a', text:'Sehr helle Läufe'},
    {id:'b', text:'Stark ausgeprägte Rosenstöcke'},
    {id:'c', text:'Unregelmäßige Tränenspuren'},
    {id:'d', text:'Dunkler Wedel'}
  ],
  correct:['b'],
  explain:'Ältere Hirsche zeigen massivere Rosenstöcke und stärkere Stangenbasis.'
},

{
  id:'DE-wk-sauen-geburt-03',
  countries:['DE'], topic:'Wildkunde',
  q:'Wann setzen Bachen typischerweise ihre Frischlinge?',
  answers:[
    {id:'a', text:'Januar–März'},
    {id:'b', text:'Mai–Juli'},
    {id:'c', text:'August–Oktober'},
    {id:'d', text:'November–Dezember'}
  ],
  correct:['a'],
  explain:'Frischlingszeit liegt schwerpunktmäßig im Winter/Frühjahr.'
},

{
  id:'DE-wk-fuchs-ranz-04',
  countries:['DE'], topic:'Wildkunde',
  q:'Wann ist die Ranzzeit beim Fuchs?',
  answers:[
    {id:'a', text:'April–Mai'},
    {id:'b', text:'Januar–Februar'},
    {id:'c', text:'Juli–August'},
    {id:'d', text:'Oktober–November'}
  ],
  correct:['b'],
  explain:'Füchse haben früh im Jahr Ranzzeit.'
},

{
  id:'DE-wk-dachs-spur-05',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie erkennst du eine typische Dachsspur?',
  answers:[
    {id:'a', text:'Krallen deutlich vor den Zehenabdrücken'},
    {id:'b', text:'Kein Ballen sichtbar'},
    {id:'c', text:'Zweizehige Trittspur'},
    {id:'d', text:'Sehr kleine, ovale Abdrücke'}
  ],
  correct:['a'],
  explain:'Dachse haben lange Krallen, die im Trittsiegel klar sichtbar sind.'
},

{
  id:'AT-wk-rotwild-laut-06',
  countries:['AT'], topic:'Wildkunde',
  q:'Wie nennt man den typischen Laut des brunftigen Rothirsches?',
  answers:[
    {id:'a', text:'Röhren'},
    {id:'b', text:'Kläffen'},
    {id:'c', text:'Quieken'},
    {id:'d', text:'Fiepen'}
  ],
  correct:['a'],
  explain:'Der Hirsch „röhrt“ während der Brunft.'
},

{
  id:'AT-wk-gams-kitteln-07',
  countries:['AT'], topic:'Wildkunde',
  q:'Was bedeutet „Kitteln“ bei der Gams?',
  answers:[
    {id:'a', text:'Sich an Felsen reiben'},
    {id:'b', text:'Ein optisches Warnsignal mit Schwanzaufstellen'},
    {id:'c', text:'Kurzzeitiges Hochwerfen des Hauptes zum Witterung prüfen'},
    {id:'d', text:'Jungen führen beim Wechsel'}
  ],
  correct:['c'],
  explain:'Kitteln = kurzes Kopfhochwerfen zur besseren Witterungsaufnahme.'
},

{
  id:'AT-wk-schwarzwild-kennzahl-08',
  countries:['AT'], topic:'Wildkunde',
  q:'Was deutet auf ein starkes Keilergebiss hin?',
  answers:[
    {id:'a', text:'Kurze Hauer, breite Schneiden'},
    {id:'b', text:'Lange, geschwungene Hauer (Gewehre)'},
    {id:'c', text:'Flache Molaren'},
    {id:'d', text:'Abgerundete Grandeln'}
  ],
  correct:['b'],
  explain:'Starke Keiler zeigen kräftig geschwungene Hauer.'
},

{
  id:'AT-wk-hasen-setzen-09',
  countries:['AT'], topic:'Wildkunde',
  q:'Wann setzt die Häsin in der Regel?',
  answers:[
    {id:'a', text:'Ganzjährig'},
    {id:'b', text:'Februar–August'},
    {id:'c', text:'November–Februar'},
    {id:'d', text:'Nur im Mai'}
  ],
  correct:['b'],
  explain:'Hasen setzen mehrfach im Jahr zwischen Februar und August.'
},

{
  id:'AT-wk-steinwild-platzhirsch-10',
  countries:['AT'], topic:'Wildkunde',
  q:'Wie nennt man beim Steinwild den ranghöchsten Bock?',
  answers:[
    {id:'a', text:'Hauptbock'},
    {id:'b', text:'Platzbock'},
    {id:'c', text:'Revierbock'},
    {id:'d', text:'Standbock'}
  ],
  correct:['b'],
  explain:'Der ranghöchste Steinbock wird Platzbock genannt.'
},

{
  id:'CH-wk-muffel-baercke-11',
  countries:['CH'], topic:'Wildkunde',
  q:'Wie nennt man das männliche Muffelwild?',
  answers:[
    {id:'a', text:'Widder'},
    {id:'b', text:'Bock'},
    {id:'c', text:'Hirsch'},
    {id:'d', text:'Bulle'}
  ],
  correct:['a'],
  explain:'Beim Muffelwild heißt das Männchen Widder.'
},

{
  id:'CH-wk-hirsch-grandeln-12',
  countries:['CH'], topic:'Wildkunde',
  q:'Was sind „Grandeln“ beim Rotwild?',
  answers:[
    {id:'a', text:'Backenzähne'},
    {id:'b', text:'Rudimentäre Eckzähne im Oberkiefer'},
    {id:'c', text:'Ein Stirnbeinfortsatz'},
    {id:'d', text:'Hautdrüsen am Haupt'}
  ],
  correct:['b'],
  explain:'Grandeln sind kleine, rudimentäre Eckzähne.'
},

{
  id:'CH-wk-spur-luchs-13',
  countries:['CH'], topic:'Wildkunde',
  q:'Wie unterscheidet sich die Luchsspur von der des Hundes?',
  answers:[
    {id:'a', text:'Krallen deutlich sichtbar'},
    {id:'b', text:'Nie Krallen sichtbar, rundliche Form'},
    {id:'c', text:'Sehr längliche Abdrücke'},
    {id:'d', text:'Zehen in zwei Reihen'}
  ],
  correct:['b'],
  explain:'Katzenartigen (Luchs) sieht man die Krallen im Trittsiegel nicht.'
},

{
  id:'DE-wk-fasan-henne-14',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie unterscheidet sich die Fasanenhenne vom Hahn?',
  answers:[
    {id:'a', text:'Helle, auffällige Farben'},
    {id:'b', text:'Tarnfarben, braun gefleckt'},
    {id:'c', text:'Lange Sporen'},
    {id:'d', text:'Grüne Brustfedern'}
  ],
  correct:['b'],
  explain:'Die Henne ist tarntönig gefärbt – wichtig für Brut und Schutz.'
},

{
  id:'DE-wk-kaninchen-kessel-15',
  countries:['DE'], topic:'Wildkunde',
  q:'Was ist ein „Kessel“ beim Kaninchen?',
  answers:[
    {id:'a', text:'Bau eines Dachses'},
    {id:'b', text:'Liegestelle im hohen Gras'},
    {id:'c', text:'Fangplatz eines Fuchses'},
    {id:'d', text:'Spezielle Schälstelle'}
  ],
  correct:['b'],
  explain:'Der Kessel ist die abgeflachte Liegestelle im Gras.'
},

{
  id:'DE-wk-schneehase-wechsel-16',
  countries:['DE'], topic:'Wildkunde',
  q:'Woran erkennst du den Wechsel eines Schneehasen im Winter?',
  answers:[
    {id:'a', text:'Dunkle Trittsiegel'},
    {id:'b', text:'V-förmiges Spurbild mit großen Hinterlaufabdrücken vorne'},
    {id:'c', text:'Einzelne runde Ballenabdrücke'},
    {id:'d', text:'Dreiteiliges Trittsiegel'}
  ],
  correct:['b'],
  explain:'Hasenspur: V-Form, Hinterläufe landen vor den Vorderläufen.'
},

{
  id:'DE-wk-birkhahn-balz-17',
  countries:['DE'], topic:'Wildkunde',
  q:'Wo balzt der Birkhahn typischerweise?',
  answers:[
    {id:'a', text:'Im dichten Unterholz'},
    {id:'b', text:'Auf freien Balzplätzen/Legestellen'},
    {id:'c', text:'In Baumhöhlen'},
    {id:'d', text:'Direkt an Gewässern'}
  ],
  correct:['b'],
  explain:'Birkhahn-Balz findet auf offenen Balzplätzen statt.'
},

{
  id:'DE-wk-wildkatze-schwanz-18',
  countries:['DE'], topic:'Wildkunde',
  q:'Wodurch unterscheidet sich der Schwanz der Wildkatze von dem der Hauskatze?',
  answers:[
    {id:'a', text:'Sehr lang und dünn'},
    {id:'b', text:'Kurz und geringelt mit dicker Spitze'},
    {id:'c', text:'Dreifarbig'},
    {id:'d', text:'Ohne Ringelung'}
  ],
  correct:['b'],
  explain:'Wildkatzen haben einen kurzen, buschigen Ringelschwanz.'
},

{
  id:'DE-wk-kuh-rotwild-19',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie heißt das weibliche Rotwild?',
  answers:[
    {id:'a', text:'Hirschkuh'},
    {id:'b', text:'Alttier'},
    {id:'c', text:'Geiß'},
    {id:'d', text:'Kahlwild'}
  ],
  correct:['b'],
  explain:'Das weibliche Rotwild heißt Alttier.'
},

{
  id:'DE-wk-steinmarder-losung-20',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie unterscheidet sich Steinmarderlosung von Iltislosung?',
  answers:[
    {id:'a', text:'Steinmarderlosung ist spitz zulaufend und gewunden'},
    {id:'b', text:'Iltislosung ist größer und spiralförmig'},
    {id:'c', text:'Steinmarderlosung ist fladenartig'},
    {id:'d', text:'Iltislosung ist kettenartig'}
  ],
  correct:['a'],
  explain:'Steinmarder: spitz und gewunden; Iltis: anders strukturiert.'
},
/* =============================
 * NEUE FRAGEN – BLOCK 2 (50x)
 * Wildkunde (Fortsetzung)
 * ============================= */

{
  id:'DE-wk-rehwild-sprung-51',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie nennt man die Fortpflanzungsphase beim Rehwild?',
  answers:[
    {id:'a', text:'Ranz'},
    {id:'b', text:'Brunft'},
    {id:'c', text:'Setzzeit'},
    {id:'d', text:'Kitzzeit'}
  ],
  correct:['a'],
  explain:'Beim Rehwild heißt die Paarungszeit "Ranz".'
},

{
  id:'DE-wk-rotwild-geburt-52',
  countries:['DE'], topic:'Wildkunde',
  q:'Wann setzen Alttiere typischerweise ihre Kälber?',
  answers:[
    {id:'a', text:'Mai–Juni'},
    {id:'b', text:'Dezember–Januar'},
    {id:'c', text:'August–September'},
    {id:'d', text:'November'}
  ],
  correct:['a'],
  explain:'Rotwild setzt meist vom späten Frühjahr bis Frühsommer.'
},

{
  id:'DE-wk-federwild-spur-53',
  countries:['DE'], topic:'Wildkunde',
  q:'Woran erkennst du eine typische Gänsefeder?',
  answers:[
    {id:'a', text:'Starke Mittelrippe, grauweißes Deckgefieder'},
    {id:'b', text:'Sehr kleine Daune'},
    {id:'c', text:'Stahlblauer Glanz'},
    {id:'d', text:'Schwarzer Kiel'}
  ],
  correct:['a'],
  explain:'Gänsefedern haben ausgeprägte Rippen und große Deckfedern.'
},

{
  id:'DE-wk-biber-spuren-54',
  countries:['DE'], topic:'Wildkunde',
  q:'Welches Zeichen deutet auf Biberaktivität hin?',
  answers:[
    {id:'a', text:'Frische Rindenfraßstellen an Bäumen'},
    {id:'b', text:'Eckige Trittsiegel'},
    {id:'c', text:'Scharrstellen im Wald'},
    {id:'d', text:'Nahrungsvorratskammern'}
  ],
  correct:['a'],
  explain:'Biber hinterlassen typische Fraßkegel an Bäumen.'
},

{
  id:'DE-wk-feldhase-ruhe-55',
  countries:['DE'], topic:'Wildkunde',
  q:'Wo ruht der Feldhase tagsüber?',
  answers:[
    {id:'a', text:'In Röhre unter der Erde'},
    {id:'b', text:'Im offenen Kessel in Bewuchs'},
    {id:'c', text:'In Baumhöhlen'},
    {id:'d', text:'Unter Wasserpflanzen'}
  ],
  correct:['b'],
  explain:'Der Hase ruht im flachen, gut getarnten "Kessel".'
},

{
  id:'DE-wk-marderbaue-56',
  countries:['DE'], topic:'Wildkunde',
  q:'Welcher Marder bewohnt oft Gebäude oder Dachböden?',
  answers:[
    {id:'a', text:'Steinmarder'},
    {id:'b', text:'Baummarder'},
    {id:'c', text:'Iltis'},
    {id:'d', text:'Nerz'}
  ],
  correct:['a'],
  explain:'Der Steinmarder ist ein typischer Kulturfolger.'
},

{
  id:'DE-wk-wildkaninchen-bau-57',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie nennt man das weit verzweigte Kaninchenversteck?',
  answers:[
    {id:'a', text:'Wurfkessel'},
    {id:'b', text:'Bau'},
    {id:'c', text:'Setzmulde'},
    {id:'d', text:'Lager'}
  ],
  correct:['b'],
  explain:'Kaninchen leben in weitläufigen Bauen.'
},

{
  id:'DE-wk-schreiadler-58',
  countries:['DE'], topic:'Wildkunde',
  q:'Wodurch ist der Schreiadler in Mitteleuropa besonders bedroht?',
  answers:[
    {id:'a', text:'Nahrungsmangel durch intensive Landwirtschaft'},
    {id:'b', text:'Zu viele natürliche Feinde'},
    {id:'c', text:'Wassermangel'},
    {id:'d', text:'Winterhärte'}
  ],
  correct:['a'],
  explain:'Der Schreiadler leidet stark unter Lebensraumverlust.'
},

{
  id:'DE-wk-waschbaer-nahrung-59',
  countries:['DE'], topic:'Wildkunde',
  q:'Was gehört NICHT typischerweise zum Nahrungsspektrum des Waschbären?',
  answers:[
    {id:'a', text:'Früchte und Insekten'},
    {id:'b', text:'Fische'},
    {id:'c', text:'Müllabfälle'},
    {id:'d', text:'Reine Pflanzenkost wie Rehwild'}
  ],
  correct:['d'],
  explain:'Waschbären sind Allesfresser, aber keine reinen Pflanzenfresser.'
},

{
  id:'DE-wk-schwarzstorch-60',
  countries:['DE'], topic:'Wildkunde',
  q:'Wo brütet der Schwarzstorch bevorzugt?',
  answers:[
    {id:'a', text:'In dicht besiedelten Gebieten'},
    {id:'b', text:'In ruhigen, alten Waldgebieten'},
    {id:'c', text:'Im Röhricht direkt am Wasser'},
    {id:'d', text:'Auf Kirchtürmen'}
  ],
  correct:['b'],
  explain:'Der Schwarzstorch benötigt störungsarme Wälder.'
},

{
  id:'AT-wk-habicht-jagdweise-61',
  countries:['AT'], topic:'Wildkunde',
  q:'Wie jagt der Habicht typischerweise?',
  answers:[
    {id:'a', text:'Stoßt von oben mit hoher Geschwindigkeit'},
    {id:'b', text:'Schlägt aus dichtem Bewuchs heraus'},
    {id:'c', text:'Jagd nur am Boden'},
    {id:'d', text:'Taucht unter Wasser'}
  ],
  correct:['b'],
  explain:'Habichte schlagen überraschend aus Deckung.'
},

{
  id:'AT-wk-alpenhase-farbe-62',
  countries:['AT'], topic:'Wildkunde',
  q:'Welche Besonderheit zeigt der Alpenhase im Winter?',
  answers:[
    {id:'a', text:'Er wird rotbraun'},
    {id:'b', text:'Er wird weiß'},
    {id:'c', text:'Er bekommt Streifen'},
    {id:'d', text:'Das Fell verfilzt stark'}
  ],
  correct:['b'],
  explain:'Kältesteuung: weißes Winterfell als Tarnung.'
},

{
  id:'AT-wk-aasfresser-63',
  countries:['AT'], topic:'Wildkunde',
  q:'Welche Art zählt NICHT zu den Aasfressern?',
  answers:[
    {id:'a', text:'Kolkrabe'},
    {id:'b', text:'Steinadler'},
    {id:'c', text:'Geier'},
    {id:'d', text:'Rebhuhn'}
  ],
  correct:['d'],
  explain:'Rebhühner sind Körnerfresser, keine Aasfresser.'
},

{
  id:'AT-wk-gams-laute-64',
  countries:['AT'], topic:'Wildkunde',
  q:'Welchen Laut gibt eine beunruhigte Gams typischerweise ab?',
  answers:[
    {id:'a', text:'Heulen'},
    {id:'b', text:'Pfeifen'},
    {id:'c', text:'Röhren'},
    {id:'d', text:'Krähen'}
  ],
  correct:['b'],
  explain:'Gams warnen mit einem scharfen Pfeifton.'
},

{
  id:'AT-wk-steingeiss-feinde-65',
  countries:['AT'], topic:'Wildkunde',
  q:'Welcher Feind spielt für junge Steinwildgeißen die größte Rolle?',
  answers:[
    {id:'a', text:'Luchs'},
    {id:'b', text:'Fuchs'},
    {id:'c', text:'Steinadler'},
    {id:'d', text:'Dachs'}
  ],
  correct:['c'],
  explain:'Steinadler schlagen bevorzugt Kitze.'
},

{
  id:'AT-wk-murmeltier-winter-66',
  countries:['AT'], topic:'Wildkunde',
  q:'Wie übersteht das Murmeltier den Winter?',
  answers:[
    {id:'a', text:'Winterruhe'},
    {id:'b', text:'Winterstarre'},
    {id:'c', text:'Echten Winterschlaf'},
    {id:'d', text:'Aktiv mit Futtersuche'}
  ],
  correct:['c'],
  explain:'Murmeltier hält echten Winterschlaf.'
},

{
  id:'AT-wk-schneehuhn-tarnung-67',
  countries:['AT'], topic:'Wildkunde',
  q:'Welche Tarnung zeigt das Alpenschneehuhn?',
  answers:[
    {id:'a', text:'Rotes Kopffeld'},
    {id:'b', text:'Weiße Wintertracht'},
    {id:'c', text:'Komplett dunkles Federkleid'},
    {id:'d', text:'Glänzende Schwanzfedern'}
  ],
  correct:['b'],
  explain:'Die Schneehühner wechseln zu weißem Wintergefieder.'
},

{
  id:'AT-wk-steinwild-habitat-68',
  countries:['AT'], topic:'Wildkunde',
  q:'Welchen Lebensraum bevorzugt Steinwild?',
  answers:[
    {id:'a', text:'Flussauen'},
    {id:'b', text:'Hochgebirge und Felsregionen'},
    {id:'c', text:'Reine Wälder'},
    {id:'d', text:'Steppen'}
  ],
  correct:['b'],
  explain:'Steinwild lebt im Hochgebirge.'
},

{
  id:'AT-wk-aalweibchen-69',
  countries:['AT'], topic:'Wildkunde',
  q:'Welches Tier ist KEIN Wild in Österreich?',
  answers:[
    {id:'a', text:'Steinbock'},
    {id:'b', text:'Fasan'},
    {id:'c', text:'Aalweibchen (Fisch)'},
    {id:'d', text:'Dachs'}
  ],
  correct:['c'],
  explain:'Fische zählen nicht zum jagdbaren Wild.'
},

{
  id:'AT-wk-wildschwein-rotten-70',
  countries:['AT'], topic:'Wildkunde',
  q:'Wie nennt man beim Schwarzwild die typischen Sozialgruppen?',
  answers:[
    {id:'a', text:'Brunftkolonien'},
    {id:'b', text:'Rotten'},
    {id:'c', text:'Züge'},
    {id:'d', text:'Lager'}
  ],
  correct:['b'],
  explain:'Schwarzwild lebt in Rotten.'
},

{
  id:'CH-wk-steingeiss-71',
  countries:['CH'], topic:'Wildkunde',
  q:'Wie nennt man das weibliche Steinwild?',
  answers:[
    {id:'a', text:'Geiß'},
    {id:'b', text:'Alttier'},
    {id:'c', text:'Hindin'},
    {id:'d', text:'Fähe'}
  ],
  correct:['a'],
  explain:'Beim Steinwild heißt das Weibchen Geiß.'
},

{
  id:'CH-wk-luchs-jagdweise-72',
  countries:['CH'], topic:'Wildkunde',
  q:'Wie jagt der Luchs typischerweise?',
  answers:[
    {id:'a', text:'Hetzjagd in großen Rudeln'},
    {id:'b', text:'Schleichender Ansitz und kurzer Sprint'},
    {id:'c', text:'Aasfresser'},
    {id:'d', text:'Nur durch Fallen'}
  ],
  correct:['b'],
  explain:'Luchse pirschen lautlos und schlagen überraschend zu.'
},

{
  id:'CH-wk-auerochse-73',
  countries:['CH'], topic:'Wildkunde',
  q:'Was war der Auerochse?',
  answers:[
    {id:'a', text:'Vorfahre des heutigen Rindes'},
    {id:'b', text:'Ein Wildschwein'},
    {id:'c', text:'Ein Hirsch'},
    {id:'d', text:'Ein ausgestorbenes Raubtier'}
  ],
  correct:['a'],
  explain:'Der Auerochse war das ursprüngliche Wildrind Europas.'
},

{
  id:'CH-wk-fischotter-nahrung-74',
  countries:['CH'], topic:'Wildkunde',
  q:'Was frisst der Fischotter hauptsächlich?',
  answers:[
    {id:'a', text:'Grassamen'},
    {id:'b', text:'Fische und Amphibien'},
    {id:'c', text:'Rehwild'},
    {id:'d', text:'Tannennadeln'}
  ],
  correct:['b'],
  explain:'Fischotter sind spezialisierte Fischjäger.'
},

{
  id:'CH-wk-steinadler-horste-75',
  countries:['CH'], topic:'Wildkunde',
  q:'Wo baut der Steinadler bevorzugt seine Horste?',
  answers:[
    {id:'a', text:'In Baumhöhlen'},
    {id:'b', text:'In Felsspalten/Steilwänden'},
    {id:'c', text:'Am Boden'},
    {id:'d', text:'In Gebäuden'}
  ],
  correct:['b'],
  explain:'Steinadler horsten in Felsen.'
},

{
  id:'CH-wk-reh-feinde-76',
  countries:['CH'], topic:'Wildkunde',
  q:'Welcher Feind spielt beim Rehwild in der Schweiz die größte Rolle?',
  answers:[
    {id:'a', text:'Wolf'},
    {id:'b', text:'Dachs'},
    {id:'c', text:'Steinadler'},
    {id:'d', text:'Auerhahn'}
  ],
  correct:['a'],
  explain:'Wölfe nehmen deutlich Einfluss auf Rehwildbestände.'
},

{
  id:'CH-wk-schalenwild-abwurf-77',
  countries:['CH'], topic:'Wildkunde',
  q:'Wann werfen Rothirsche typischerweise ihr Geweih ab?',
  answers:[
    {id:'a', text:'Februar–April'},
    {id:'b', text:'Juni–Juli'},
    {id:'c', text:'November'},
    {id:'d', text:'September'}
  ],
  correct:['a'],
  explain:'Der Abwurf erfolgt im späten Winter/Frühjahr.'
},

{
  id:'CH-wk-feldhase-gegner-78',
  countries:['CH'], topic:'Wildkunde',
  q:'Welcher Prädator schlägt regelmäßig junge Feldhasen?',
  answers:[
    {id:'a', text:'Kolkrabe'},
    {id:'b', text:'Fuchs'},
    {id:'c', text:'Buntspecht'},
    {id:'d', text:'Marderhund'}
  ],
  correct:['b'],
  explain:'Füchse schlagen regelmäßig Junghasen.'
},

{
  id:'CH-wk-steinwild-sprungkraft-79',
  countries:['CH'], topic:'Wildkunde',
  q:'Welche Besonderheit zeigt Steinwild beim Klettern?',
  answers:[
    {id:'a', text:'Sehr weiche Schalen'},
    {id:'b', text:'Gummiähnliche Sohlenstruktur für Haftung'},
    {id:'c', text:'Krallen wie ein Greifvogel'},
    {id:'d', text:'Schwimmhäute'}
  ],
  correct:['b'],
  explain:'Steinwild besitzt harte Ränder und weiche Sohlen für Felsgriffe.'
},

{
  id:'CH-wk-rotwild-brunftzeit-80',
  countries:['CH'], topic:'Wildkunde',
  q:'Wann beginnt typischerweise die Brunft beim Rotwild?',
  answers:[
    {id:'a', text:'Januar'},
    {id:'b', text:'September–Oktober'},
    {id:'c', text:'Mai–Juni'},
    {id:'d', text:'November'}
  ],
  correct:['b'],
  explain:'Hauptbrunft liegt im Herbst.'
},

{
  id:'DE-wk-speer-81',
  countries:['DE'], topic:'Wildkunde',
  q:'Was bezeichnet man als „Speer“ beim Schwarzwild?',
  answers:[
    {id:'a', text:'Auge'},
    {id:'b', text:'Ohr'},
    {id:'c', text:'Rückenlinie'},
    {id:'d', text:'Schwanzwurzel'}
  ],
  correct:['c'],
  explain:'Der Speer ist die Rückenlinie.'
},

{
  id:'DE-wk-feldhase-sprung-82',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie schnell kann ein Feldhase kurzfristig flüchten?',
  answers:[
    {id:'a', text:'10 km/h'},
    {id:'b', text:'25 km/h'},
    {id:'c', text:'70 km/h'},
    {id:'d', text:'120 km/h'}
  ],
  correct:['c'],
  explain:'Feldhasen erreichen bis 70 km/h.'
},

{
  id:'DE-wk-marderhund-83',
  countries:['DE'], topic:'Wildkunde',
  q:'Der Marderhund ist in Deutschland…',
  answers:[
    {id:'a', text:'ein heimisches Raubwild'},
    {id:'b', text:'ein invasiver Neozoon'},
    {id:'c', text:'ein Hirschartiger'},
    {id:'d', text:'ein Nagetier'}
  ],
  correct:['b'],
  explain:'Der Marderhund ist ein eingeschleppter Neozoon.'
},

{
  id:'DE-wk-fischotter-rueckkehr-84',
  countries:['DE'], topic:'Wildkunde',
  q:'Welche Entwicklung zeigt der Fischotterbestand in Deutschland?',
  answers:[
    {id:'a', text:'Nimmt ab'},
    {id:'b', text:'Stabil bis zunehmend'},
    {id:'c', text:'Komplett verschwunden'},
    {id:'d', text:'Wird zur Plage'}
  ],
  correct:['b'],
  explain:'Fischotter breiten sich in vielen Regionen wieder aus.'
},

{
  id:'DE-wk-buntschiller-85',
  countries:['DE'], topic:'Wildkunde',
  q:'Der Buntschiller ist…',
  answers:[
    {id:'a', text:'eine Rehwildfärbung'},
    {id:'b', text:'eine Hasenkrankheit'},
    {id:'c', text:'ein Federwild'},
    {id:'d', text:'eine Rotwildkrankheit'}
  ],
  correct:['a'],
  explain:'Buntschiller: seltene Rehwild-Fellvariante.'
},

{
  id:'DE-wk-bussard-86',
  countries:['DE'], topic:'Wildkunde',
  q:'Was frisst der Mäusebussard überwiegend?',
  answers:[
    {id:'a', text:'Rehwildkälber'},
    {id:'b', text:'Nagetiere'},
    {id:'c', text:'Gräser'},
    {id:'d', text:'Steinwild'}
  ],
  correct:['b'],
  explain:'Der Mäusebussard jagt hauptsächlich Nagetiere.'
},

{
  id:'DE-wk-damhirsch-87',
  countries:['DE'], topic:'Wildkunde',
  q:'Wodurch ist das Damhirschgeweih charakterisiert?',
  answers:[
    {id:'a', text:'Spieße'},
    {id:'b', text:'Schaufeln'},
    {id:'c', text:'Krumme Gabel'},
    {id:'d', text:'Keine Geweihbildung'}
  ],
  correct:['b'],
  explain:'Der Damhirsch hat schaufelförmiges Geweih.'
},

{
  id:'DE-wk-biber-laenge-88',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie lang kann ein ausgewachsener Biber werden?',
  answers:[
    {id:'a', text:'40–50 cm'},
    {id:'b', text:'60–100 cm'},
    {id:'c', text:'120–150 cm'},
    {id:'d', text:'200 cm'}
  ],
  correct:['b'],
  explain:'Biber erreichen rund einen Meter.'
},

{
  id:'DE-wk-uhu-jagdzeit-89',
  countries:['DE'], topic:'Wildkunde',
  q:'Wann jagt der Uhu überwiegend?',
  answers:[
    {id:'a', text:'Tagsüber'},
    {id:'b', text:'Dämmerung und Nacht'},
    {id:'c', text:'Nur im Winter'},
    {id:'d', text:'Nur bei Regen'}
  ],
  correct:['b'],
  explain:'Der Uhu jagt meist nachts.'
},

{
  id:'DE-wk-lerche-90',
  countries:['DE'], topic:'Wildkunde',
  q:'Welche Besonderheit zeigt die Feldlerche?',
  answers:[
    {id:'a', text:'Stummer Vogel'},
    {id:'b', text:'Steigt singend senkrecht in die Luft'},
    {id:'c', text:'Kann nicht fliegen'},
    {id:'d', text:'Lebt nur im Wald'}
  ],
  correct:['b'],
  explain:'Die Feldlerche steigt singend senkrecht auf.'
},

{
  id:'DE-wk-marder-spur-91',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie unterscheidet sich die Spur des Baummarders von der des Steinmarders?',
  answers:[
    {id:'a', text:'Baummarder hat kleinere, rundere Trittsiegel'},
    {id:'b', text:'Steinmarder zeigt keine Krallenabdrücke'},
    {id:'c', text:'Beide haben identische Spuren'},
    {id:'d', text:'Baummarder läuft dreizehig'}
  ],
  correct:['a'],
  explain:'Baummarder leichter, rundere Abdrücke.'
},

{
  id:'DE-wk-schwan-federn-92',
  countries:['DE'], topic:'Wildkunde',
  q:'Welche Farbe haben die Schwungfedern adulter Höckerschwäne?',
  answers:[
    {id:'a', text:'Braun'},
    {id:'b', text:'Schwarz'},
    {id:'c', text:'Weiß'},
    {id:'d', text:'Grau'}
  ],
  correct:['c'],
  explain:'Höckerschwäne tragen vollständig weiße Schwungfedern.'
},

{
  id:'DE-wk-turteltaube-93',
  countries:['DE'], topic:'Wildkunde',
  q:'Warum ist die Turteltaube stark bedroht?',
  answers:[
    {id:'a', text:'Hohe Prädation durch Greifvögel'},
    {id:'b', text:'Lebensraumverlust & Intensivlandwirtschaft'},
    {id:'c', text:'Klimawandel reduziert Atmung'},
    {id:'d', text:'Sie kann nicht mehr fliegen'}
  ],
  correct:['b'],
  explain:'Turteltauben leiden besonders unter Agrarintensivierung.'
},

{
  id:'DE-wk-dachs-graben-94',
  countries:['DE'], topic:'Wildkunde',
  q:'Woran erkennst du frische Grabarbeiten vom Dachs?',
  answers:[
    {id:'a', text:'Große Erdkuppen vor Baueingängen'},
    {id:'b', text:'Rote Haare in Sträuchern'},
    {id:'c', text:'Querfurchen am Baum'},
    {id:'d', text:'Federreste am Horstrand'}
  ],
  correct:['a'],
  explain:'Dachse schieben viel Erde aus dem Bau.'
},

{
  id:'DE-wk-fischreiher-95',
  countries:['DE'], topic:'Wildkunde',
  q:'Was ist die Hauptnahrung des Graureihers?',
  answers:[
    {id:'a', text:'Hasen'},
    {id:'b', text:'Fische'},
    {id:'c', text:'Aas'},
    {id:'d', text:'Gräser'}
  ],
  correct:['b'],
  explain:'Graureiher sind spezialisierte Fischjäger.'
},

{
  id:'DE-wk-kormoran-96',
  countries:['DE'], topic:'Wildkunde',
  q:'Welche Besonderheit zeigt der Kormoran?',
  answers:[
    {id:'a', text:'Sehr ölhaltiges Gefieder'},
    {id:'b', text:'Gefieder lässt Wasser durch'},
    {id:'c', text:'Kann nicht tauchen'},
    {id:'d', text:'Ist ein reiner Pflanzenfresser'}
  ],
  correct:['b'],
  explain:'Kormorane müssen ihr Gefieder trocknen, da es Wasser durchlässt.'
},

{
  id:'DE-wk-uhu-schwingen-97',
  countries:['DE'], topic:'Wildkunde',
  q:'Wodurch fliegt der Uhu besonders geräuscharm?',
  answers:[
    {id:'a', text:'Sehr kurze Flügel'},
    {id:'b', text:'Besonderer Aufbau der Schwingenfedern'},
    {id:'c', text:'Er fliegt gar nicht'},
    {id:'d', text:'Er nutzt Thermik'}
  ],
  correct:['b'],
  explain:'Spezielle Schwingenstruktur dämpft Fluggeräusche.'
},

{
  id:'DE-wk-schwarzwild-bachen-98',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie viele Frischlinge setzt eine Bache durchschnittlich?',
  answers:[
    {id:'a', text:'1–2'},
    {id:'b', text:'3–8'},
    {id:'c', text:'10–15'},
    {id:'d', text:'0'}
  ],
  correct:['b'],
  explain:'Bachen setzen meist mehrere Frischlinge.'
},

{
  id:'DE-wk-spiesser-99',
  countries:['DE'], topic:'Wildkunde',
  q:'Was bezeichnet man als „Spießer“?',
  answers:[
    {id:'a', text:'Damhirsch im 7. Kopf'},
    {id:'b', text:'Jungen Hirsch mit ungegabelten Stangen'},
    {id:'c', text:'Alten Keiler'},
    {id:'d', text:'Schmalreh'}
  ],
  correct:['b'],
  explain:'Spießer = Junger Hirsch mit zwei ungegabelten Stangen.'
},

{
  id:'DE-wk-gams-farbe-100',
  countries:['DE'], topic:'Wildkunde',
  q:'Welche Farbe trägt die Gams im Winter?',
  answers:[
    {id:'a', text:'Rötlich'},
    {id:'b', text:'Dunkelbraun bis schwarz'},
    {id:'c', text:'Weiß'},
    {id:'d', text:'Schiefergrau'}
  ],
  correct:['b'],
  explain:'Gams führt im Winter dunkles, fast schwarzes Haarkleid.'
},
{
  id:'JL-101',
  countries:['DE'], topic:'Wildkunde',
  q:'Wodurch unterscheidet sich die Fährte eines Wolfs von der eines Hundes?',
  answers:[
    {id:'a', text:'Wolf läuft enger in der Spur, fast wie auf einer Linie'},
    {id:'b', text:'Hunde laufen immer im Passgang'},
    {id:'c', text:'Wolf zeigt niemals Krallenabdrücke'},
    {id:'d', text:'Hund hat immer längere Zehen'}
  ],
  correct:['a'],
  explain:'Wölfe setzen ihre Pfoten enger in einer Linie, Hunde deutlich breiter.'
},

{
  id:'JL-102',
  countries:['DE'], topic:'Wildkunde',
  q:'Wie nennt man den Haarwechsel beim Rehwild?',
  answers:[
    {id:'a', text:'Mauser'},
    {id:'b', text:'Fegen'},
    {id:'c', text:'Schlüpfen'},
    {id:'d', text:'Verfärben'}
  ],
  correct:['d'],
  explain:'Das jahreszeitliche Haarwechseln nennt man Verfärben.'
},

{
  id:'JL-103',
  countries:['DE'], topic:'Wildkunde',
  q:'Welches Merkmal zeigt typisches Kahlwild?',
  answers:[
    {id:'a', text:'Fehlende Rosenstöcke'},
    {id:'b', text:'Gehörn mit zwei Spießen'},
    {id:'c', text:'Starke Trägerbildung'},
    {id:'d', text:'Schaufeln an den Stangen'}
  ],
  correct:['a'],
  explain:'Kahlwild trägt kein Geweih und hat daher keine Rosenstöcke.'
},

{
  id:'JL-104',
  countries:['AT'], topic:'Wildkunde',
  q:'Welche Aussage über den Steinadler ist korrekt?',
  answers:[
    {id:'a', text:'Er brütet meist in Felswänden'},
    {id:'b', text:'Er jagt fast ausschließlich Aas'},
    {id:'c', text:'Er lebt nur in Wäldern'},
    {id:'d', text:'Er kann nicht über 1000 m Höhe kreisen'}
  ],
  correct:['a'],
  explain:'Steinadler horsten typischerweise in Felswänden.'
},

{
  id:'JL-105',
  countries:['CH'], topic:'Wildkunde',
  q:'Woran erkennst du den Steinmarder?',
  answers:[
    {id:'a', text:'Er hat einen rein weißen Kehlfleck'},
    {id:'b', text:'Er hat gelbliche Beine'},
    {id:'c', text:'Er zeigt immer schwarze Ohrspitzen'},
    {id:'d', text:'Er hat einen ringelnden Schwanz'}
  ],
  correct:['a'],
  explain:'Steinmarder: weißer Kehlfleck; Baummarder eher gelblich.'
},

{
  id:'JL-106',
  countries:['DE'], topic:'Waffen & Schuss',
  q:'Welche Schussentfernung gilt für die meisten Drückjagdsituationen als typisch?',
  answers:[
    {id:'a', text:'5–30 m'},
    {id:'b', text:'80–120 m'},
    {id:'c', text:'200–300 m'},
    {id:'d', text:'Über 500 m'}
  ],
  correct:['a'],
  explain:'Auf Drückjagden erfolgen Schüsse meist auf kurze Distanzen.'
},

{
  id:'JL-107',
  countries:['DE'], topic:'Waffen & Schuss',
  q:'Was bewirkt ein Schalldämpfer hauptsächlich?',
  answers:[
    {id:'a', text:'Erhöht die Geschossgeschwindigkeit'},
    {id:'b', text:'Reduziert Mündungsknall & Rückstoß'},
    {id:'c', text:'Erlaubt das Schießen ohne Gehörschutz'},
    {id:'d', text:'Verhindert Kugelfangtreffer'}
  ],
  correct:['b'],
  explain:'Schalldämpfer mindert Knall und Rückstoß deutlich.'
},

{
  id:'JL-108',
  countries:['AT'], topic:'Waffen & Schuss',
  q:'Welches Geschossprinzip eignet sich für Schalenwild?',
  answers:[
    {id:'a', text:'Vollmantel für maximale Penetration'},
    {id:'b', text:'Deformationsgeschoss oder Zerleger'},
    {id:'c', text:'Schrotladung über 100 m'},
    {id:'d', text:'Pfeilgeschoss aus Druckluftwaffen'}
  ],
  correct:['b'],
  explain:'Deformations- und Teilzerlegergeschosse sind jagdlich üblich.'
},

{
  id:'JL-109',
  countries:['CH'], topic:'Waffen & Schuss',
  q:'Was bedeutet „Drall“ im Lauf?',
  answers:[
    {id:'a', text:'Die Anzahl der Züge pro Waffe'},
    {id:'b', text:'Die Drehung, die dem Geschoss Stabilität gibt'},
    {id:'c', text:'Eine Sicherungsfunktion'},
    {id:'d', text:'Die Größe der Patronenhülse'}
  ],
  correct:['b'],
  explain:'Der Drall versetzt das Geschoss in Rotation und stabilisiert Flugbahn.'
},

{
  id:'JL-110',
  countries:['DE'], topic:'Recht',
  q:'Wer prüft in Deutschland die Zuverlässigkeit für einen Jagdschein?',
  answers:[
    {id:'a', text:'Der Jagdpächter'},
    {id:'b', text:'Untere Jagdbehörde'},
    {id:'c', text:'Der Schießstandbetreiber'},
    {id:'d', text:'Der Hegering'}
  ],
  correct:['b'],
  explain:'Die untere Jagdbehörde prüft Zuverlässigkeit & Eignung.'
},

{
  id:'JL-111',
  countries:['DE'], topic:'Recht',
  q:'Welche Pflicht gilt nach dem Jagdrecht immer?',
  answers:[
    {id:'a', text:'Trophäenabgabe an die Behörde'},
    {id:'b', text:'Waidgerechtes Jagen'},
    {id:'c', text:'Ganzjährige Fütterung'},
    {id:'d', text:'Abschuss von Rotwild im Winter verboten'}
  ],
  correct:['b'],
  explain:'Waidgerechtes Jagen ist gesetzliche Grundpflicht.'
},

{
  id:'JL-112',
  countries:['AT'], topic:'Recht',
  q:'Welche Hauptform des Jagdrechts existiert in Österreich?',
  answers:[
    {id:'a', text:'Bundesjagdrecht'},
    {id:'b', text:'Landesjagdrecht'},
    {id:'c', text:'EU-Jagdrecht'},
    {id:'d', text:'Kommunaljagdrecht'}
  ],
  correct:['b'],
  explain:'Jagdrecht ist in Österreich Ländersache.'
},

{
  id:'JL-113',
  countries:['CH'], topic:'Recht',
  q:'Wie erfolgt die Jagd in einigen Schweizer Kantonen hauptsächlich?',
  answers:[
    {id:'a', text:'Durch Patentjagd'},
    {id:'b', text:'Nur durch Pachtjagd'},
    {id:'c', text:'Gar keine Jagd'},
    {id:'d', text:'Nur durch staatliche Jäger'}
  ],
  correct:['a'],
  explain:'Viele Kantone haben das Patentjagdsystem.'
},

{
  id:'JL-114',
  countries:['DE'], topic:'Hundewesen',
  q:'Was ist ein wesentliches Merkmal eines brauchbaren Jagdhundes?',
  answers:[
    {id:'a', text:'Er bellt selten'},
    {id:'b', text:'Zuverlässige Schweißarbeit'},
    {id:'c', text:'Kann 5 Tricks ausführen'},
    {id:'d', text:'Ist besonders klein'}
  ],
  correct:['b'],
  explain:'Schweißarbeit ist zentral für tierschutzgerechtes Jagen.'
},

{
  id:'JL-115',
  countries:['AT'], topic:'Hundewesen',
  q:'Wofür steht der Begriff „Vorstehen“?',
  answers:[
    {id:'a', text:'Hund legt sich hin'},
    {id:'b', text:'Hund zeigt Wild an durch Starre'},
    {id:'c', text:'Hund jagt selbstständig nach'},
    {id:'d', text:'Hund schwimmt weit auf Gewässern'}
  ],
  correct:['b'],
  explain:'Vorstehen = regungsloses Anzeigen von Wild.'
},

{
  id:'JL-116',
  countries:['CH'], topic:'Hundewesen',
  q:'Was beschreibt die „Fährtenlaut“-Eigenschaft?',
  answers:[
    {id:'a', text:'Hund bellt nur bei Sichtkontakt'},
    {id:'b', text:'Hund gibt auf der Fährte Spurlaut'},
    {id:'c', text:'Hund schweigt beim Arbeiten'},
    {id:'d', text:'Hund jault beim Schlafen'}
  ],
  correct:['b'],
  explain:'Fährtenlaut = Lautgeben während der Fährtenarbeit.'
},

{
  id:'JL-117',
  countries:['DE'], topic:'Wildbrethygiene',
  q:'Welcher Schritt erfolgt unmittelbar nach dem Erlegen?',
  answers:[
    {id:'a', text:'Trophäenpräparation'},
    {id:'b', text:'Sauberes Aufbrechen'},
    {id:'c', text:'Transport bei 30 °C Außentemperatur'},
    {id:'d', text:'Langes Liegenlassen'}
  ],
  correct:['b'],
  explain:'Schnelles Aufbrechen verhindert Keimbildung.'
},

{
  id:'JL-118',
  countries:['AT'], topic:'Wildbrethygiene',
  q:'Wie hoch soll die Kerntemperatur von Wildbret für sichere Lagerung sein?',
  answers:[
    {id:'a', text:'Unter 7 °C'},
    {id:'b', text:'15 °C'},
    {id:'c', text:'25 °C'},
    {id:'d', text:'10–20 °C'}
  ],
  correct:['a'],
  explain:'Unter 7 °C → hygienisch sicherer Bereich.'
},

{
  id:'JL-119',
  countries:['CH'], topic:'Wildbrethygiene',
  q:'Welche Wildart ist trichinenuntersuchungspflichtig?',
  answers:[
    {id:'a', text:'Rehwild'},
    {id:'b', text:'Schwarzwild'},
    {id:'c', text:'Rotwild'},
    {id:'d', text:'Fasan'}
  ],
  correct:['b'],
  explain:'Schwarzwild → immer trichinenpflichtig.'
},

{
  id:'JL-120',
  countries:['DE'], topic:'Hege',
  q:'Was ist Ziel einer angepassten Bejagungsstrategie?',
  answers:[
    {id:'a', text:'Überhöhte Bestände fördern'},
    {id:'b', text:'Wald-Wild-Balance herstellen'},
    {id:'c', text:'Nur starke Trophäen erlegen'},
    {id:'d', text:'Totalverzicht auf Abschüsse'}
  ],
  correct:['b'],
  explain:'Balance zwischen Waldverjüngung und Wildbestand.'
},

{
  id:'JL-121',
  countries:['DE'], topic:'Hege',
  q:'Was deutet auf Überbesatz bei Rehwild hin?',
  answers:[
    {id:'a', text:'Starker Verbiss an Leittrieben'},
    {id:'b', text:'Mehr Jungwuchs als Altbestand'},
    {id:'c', text:'Keine Losung im Bestand'},
    {id:'d', text:'Viel Bodenvegetation'}
  ],
  correct:['a'],
  explain:'Verbiss an Leittrieben zeigt Überbesatz.'
},

{
  id:'JL-122',
  countries:['AT'], topic:'Hege',
  q:'Welche Maßnahme verbessert Biotope?',
  answers:[
    {id:'a', text:'Totholz entfernen'},
    {id:'b', text:'Strukturreiche Waldränder schaffen'},
    {id:'c', text:'Alle Büsche entfernen'},
    {id:'d', text:'Monokulturen erweitern'}
  ],
  correct:['b'],
  explain:'Strukturreiche Ränder erhöhen Biodiversität.'
},
  {
  id: 'JL-123',
  countries: ['CH'],
  topic: 'Hege',
  q: 'Was fördert Niederwild besonders?',
  answers: [
    { id: 'a', text: 'Intensive Mahd während Brutzeit' },
    { id: 'b', text: 'Hecken & Saumbiotope' },
    { id: 'c', text: 'Bodenverdichtung' },
    { id: 'd', text: 'Ganzjähriges Mulchen' }
  ],
  correct: ['b'],
  explain: 'Deckung & Nahrung durch Hecken.'
},
  // BLOCK 1 – Fragen JL-1000 bis JL-1099

{
  id:'JL-1000',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Welche Struktur nutzt das Reh bevorzugt als Tageseinstand?',
  answers:[
    {id:'a', text:'Offene Ackerflächen'},
    {id:'b', text:'Dichte Hecken & Jungwuchs'},
    {id:'c', text:'Unbewachsene Kuppen'},
    {id:'d', text:'Kahlschläge ohne Unterwuchs'}
  ],
  correct:['b'],
  explain:'Rehe bevorzugen deckungsreiche Einstände.'
},
{
  id:'JL-1001',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie nennt man die Nasenspitze des Fuchses?',
  answers:[
    {id:'a', text:'Fahne'},
    {id:'b', text:'Blume'},
    {id:'c', text:'Gehöre'},
    {id:'d', text:'Lichter'}
  ],
  correct:['d'],
  explain:'Lichter = Nase & Augenpartie.'
},
{
  id:'JL-1002',
  countries:['CH','DE'],
  topic:'Steinwild',
  q:'Womit bestimmt man beim Steinbock zuverlässig das Alter?',
  answers:[
    {id:'a', text:'Fellfarbe'},
    {id:'b', text:'Jahresringe an den Hörnern'},
    {id:'c', text:'Körpergewicht'},
    {id:'d', text:'Höhe der Schulter'}
  ],
  correct:['b'],
  explain:'Jahresringe belegen das Alter.'
},
{
  id:'JL-1003',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Was kennzeichnet den Feistzustand beim Schwarzwild?',
  answers:[
    {id:'a', text:'Starke Fettpolster'},
    {id:'b', text:'Helle Rückenborsten'},
    {id:'c', text:'Verändertes Gebräch'},
    {id:'d', text:'Abwurf der Waffen'}
  ],
  correct:['a'],
  explain:'Feist = Körperfett vor Rauschzeit.'
},
{
  id:'JL-1004',
  countries:['DE'],
  topic:'Fallenjagd',
  q:'Welche Falle gilt als tierschutzgerecht für Raubwild?',
  answers:[
    {id:'a', text:'Wippbrettfalle'},
    {id:'b', text:'Selbstschussgerät'},
    {id:'c', text:'Lebendfalle mit Fangraum'},
    {id:'d', text:'Schlagfalle mit Federkraft'}
  ],
  correct:['c'],
  explain:'Lebendfallen entsprechen den Vorgaben.'
},
{
  id:'JL-1005',
  countries:['CH','DE'],
  topic:'Waffen',
  q:'Welche Eigenschaft hat ein Deformationsgeschoss?',
  answers:[
    {id:'a', text:'Geringe Energieabgabe'},
    {id:'b', text:'Pilzt im Wildkörper auf'},
    {id:'c', text:'Bleibt unverformt'},
    {id:'d', text:'Wird nur in KK verwendet'}
  ],
  correct:['b'],
  explain:'Deformationsgeschosse geben Energie ab.'
},
{
  id:'JL-1006',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wann ist Hauptbrunftzeit des Rotwildes?',
  answers:[
    {id:'a', text:'Mai–Juni'},
    {id:'b', text:'Juli–August'},
    {id:'c', text:'September–Oktober'},
    {id:'d', text:'November–Dezember'}
  ],
  correct:['c'],
  explain:'Rotwild brunftet im Frühherbst.'
},
{
  id:'JL-1007',
  countries:['CH'],
  topic:'Raubwild',
  q:'Welche Art ist ein Kulturfolger?',
  answers:[
    {id:'a', text:'Luchs'},
    {id:'b', text:'Fuchs'},
    {id:'c', text:'Wildkatze'},
    {id:'d', text:'Baummarder'}
  ],
  correct:['b'],
  explain:'Füchse leben verstärkt nahe Siedlungen.'
},
{
  id:'JL-1008',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Maßnahme fördert Insekten am stärksten?',
  answers:[
    {id:'a', text:'Frühjahrsmahd'},
    {id:'b', text:'Blühstreifen & Saumstrukturen'},
    {id:'c', text:'Ganzjährige Mulchung'},
    {id:'d', text:'Düngung'}
  ],
  correct:['b'],
  explain:'Blühflächen sind entscheidend für Insekten.'
},
{
  id:'JL-1009',
  countries:['DE'],
  topic:'Recht',
  q:'Welcher Nachweis ist für viele Jagdarten Pflicht?',
  answers:[
    {id:'a', text:'Hundeführerschein'},
    {id:'b', text:'Schießstandnachweis'},
    {id:'c', text:'Waffenpass'},
    {id:'d', text:'Jagdverband-Mitgliedschaft'}
  ],
  correct:['b'],
  explain:'Schießstandnachweise sind vorgeschrieben.'
},
{
  id:'JL-1010',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art zeigt Wellenflug?',
  answers:[
    {id:'a', text:'Auerhuhn'},
    {id:'b', text:'Ringeltaube'},
    {id:'c', text:'Kormoran'},
    {id:'d', text:'Gans'}
  ],
  correct:['b'],
  explain:'Typischer wellenförmiger Flug.'
},
{
  id:'JL-1011',
  countries:['CH'],
  topic:'Ökologie',
  q:'Was kennzeichnet einen strukturreichen Lebensraum?',
  answers:[
    {id:'a', text:'Monokultur'},
    {id:'b', text:'Wechsel Deckung/Offenland'},
    {id:'c', text:'Nur Hochwald'},
    {id:'d', text:'Reiner Grasbewuchs'}
  ],
  correct:['b'],
  explain:'Strukturvielfalt = Artenvielfalt.'
},
{
  id:'JL-1012',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie heißt der Pürzel des Rehwildes?',
  answers:[
    {id:'a', text:'Fahne'},
    {id:'b', text:'Blume'},
    {id:'c', text:'Wedel'},
    {id:'d', text:'Bürzel'}
  ],
  correct:['b'],
  explain:'Blume = Rehwildschwanz.'
},
{
  id:'JL-1013',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Was bedeutet „Gebräch“?',
  answers:[
    {id:'a', text:'Maul/Gebiss'},
    {id:'b', text:'Schwarte'},
    {id:'c', text:'Lauf'},
    {id:'d', text:'Rückenborsten'}
  ],
  correct:['a'],
  explain:'Gebräch = Maul.'
},
{
  id:'JL-1014',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Wie nennt man den Haarwechsel beim Reh?',
  answers:[
    {id:'a', text:'Fegen'},
    {id:'b', text:'Schmelzen'},
    {id:'c', text:'Rausch'},
    {id:'d', text:'Zeckenwurf'}
  ],
  correct:['b'],
  explain:'Sommer/Winterhaarwechsel = Schmelzen.'
},
{
  id:'JL-1015',
  countries:['DE'],
  topic:'Raubwild',
  q:'Welche Art ist streng territorial?',
  answers:[
    {id:'a', text:'Fuchs'},
    {id:'b', text:'Dachs'},
    {id:'c', text:'Baummarder'},
    {id:'d', text:'Iltis'}
  ],
  correct:['c'],
  explain:'Baummarder verteidigen feste Territorien.'
},
{
  id:'JL-1016',
  countries:['CH','DE'],
  topic:'Biologie',
  q:'Warum betreiben Wiederkäuer Wiederkauen?',
  answers:[
    {id:'a', text:'Reviermarkierung'},
    {id:'b', text:'Verbesserte Verdauung'},
    {id:'c', text:'Balz'},
    {id:'d', text:'Thermoregulation'}
  ],
  correct:['b'],
  explain:'Zerkleinert Nahrung für effiziente Verdauung.'
},
{
  id:'JL-1017',
  countries:['DE','CH'],
  topic:'Waffen',
  q:'Welche Optik für weite Distanzen?',
  answers:[
    {id:'a', text:'Offene Visierung'},
    {id:'b', text:'Rotpunkt'},
    {id:'c', text:'Zielfernrohr mit hoher Vergrößerung'},
    {id:'d', text:'Diopter'}
  ],
  correct:['c'],
  explain:'Hohe Vergrößerung = weite Schüsse.'
},
{
  id:'JL-1018',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Maßnahme verbessert den Wasserhaushalt?',
  answers:[
    {id:'a', text:'Drainage'},
    {id:'b', text:'Anlage von Kleingewässern'},
    {id:'c', text:'Ganzjährige Mulchung'},
    {id:'d', text:'Verdichtung'}
  ],
  correct:['b'],
  explain:'Kleingewässer fördern Arten & Feuchte.'
},
{
  id:'JL-1019',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art brütet in Baumhöhlen?',
  answers:[
    {id:'a', text:'Rebhuhn'},
    {id:'b', text:'Fasan'},
    {id:'c', text:'Hohltaube'},
    {id:'d', text:'Wiesenweihe'}
  ],
  correct:['c'],
  explain:'Hohltauben sind Höhlenbrüter.'
},

// --- AB HIER GEHT ES WEITER BIS JL-1099 ---

{
  id:'JL-1020',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Welcher Hirsch führt typischerweise ein Kahlwildrudel?',
  answers:[
    {id:'a', text:'Schmalspießer'},
    {id:'b', text:'Alttier'},
    {id:'c', text:'Hirsch II. Kopf'},
    {id:'d', text:'Kalb'}
  ],
  correct:['b'],
  explain:'Alttiere führen das Rudel.'
},
{
  id:'JL-1021',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist beim Transport von Waffen zwingend?',
  answers:[
    {id:'a', text:'Offener Transport'},
    {id:'b', text:'Entladen & verschlossen'},
    {id:'c', text:'Abzugsbügel entfernt'},
    {id:'d', text:'Getarnte Tasche'}
  ],
  correct:['b'],
  explain:'Waffe muss ungeladen & verschlossen transportiert werden.'
},
{
  id:'JL-1022',
  countries:['CH','DE'],
  topic:'Rehwild',
  q:'Wann fegt der Rehbock typischerweise sein Gehörn?',
  answers:[
    {id:'a', text:'Januar'},
    {id:'b', text:'März–April'},
    {id:'c', text:'Juni–Juli'},
    {id:'d', text:'September'}
  ],
  correct:['b'],
  explain:'Böcke fegen im Frühjahr.'
},
{
  id:'JL-1023',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Wie nennt man die Eckzähne des Keilers?',
  answers:[
    {id:'a', text:'Lichter'},
    {id:'b', text:'Waffen'},
    {id:'c', text:'Grannen'},
    {id:'d', text:'Schaufeln'}
  ],
  correct:['b'],
  explain:'Waffen = Keilerzähne.'
},
{
  id:'JL-1024',
  countries:['DE'],
  topic:'Waffen',
  q:'Welche Aussage zu Flintenlaufgeschossen ist korrekt?',
  answers:[
    {id:'a', text:'Sind Luftdruckgeschosse'},
    {id:'b', text:'Werden aus dem Kugellauf verschossen'},
    {id:'c', text:'Sind massive Projektile für den Schrotlauf'},
    {id:'d', text:'Zerfallen im Lauf'}
  ],
  correct:['c'],
  explain:'Flintenlaufgeschosse sind Vollgeschosse für Schrotläufe.'
},
{
  id:'JL-1025',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art ist ein Bodenbrüter?',
  answers:[
    {id:'a', text:'Eichelhäher'},
    {id:'b', text:'Rebhuhn'},
    {id:'c', text:'Hohltaube'},
    {id:'d', text:'Turteltaube'}
  ],
  correct:['b'],
  explain:'Rebhühner brüten am Boden.'
},
{
  id:'JL-1026',
  countries:['DE','CH'],
  topic:'Biologie',
  q:'Welche Sinnesleistung ist bei Wildschweinen am stärksten?',
  answers:[
    {id:'a', text:'Sehen'},
    {id:'b', text:'Riechen'},
    {id:'c', text:'Farbsehen'},
    {id:'d', text:'Wärmesicht'}
  ],
  correct:['b'],
  explain:'Schwarzwild hat exzellenten Geruchssinn.'
},
{
  id:'JL-1027',
  countries:['CH','DE'],
  topic:'Steinwild',
  q:'Wie nennt man die Hörner der Geiß?',
  answers:[
    {id:'a', text:'Schaufeln'},
    {id:'b', text:'Krucken'},
    {id:'c', text:'Spieße'},
    {id:'d', text:'Fahne'}
  ],
  correct:['b'],
  explain:'Krucken = Hörner von Steinwild.'
},
{
  id:'JL-1028',
  countries:['DE'],
  topic:'Hege',
  q:'Welche Maßnahme fördert Bodenbrüter?',
  answers:[
    {id:'a', text:'Frühjahrsmahd'},
    {id:'b', text:'Gestaffelte Mahd & Altgrasinseln'},
    {id:'c', text:'Ganzjahresweiden'},
    {id:'d', text:'Grünlanddüngung'}
  ],
  correct:['b'],
  explain:'Altgrasinseln ermöglichen erfolgreiche Brut.'
},
{
  id:'JL-1029',
  countries:['DE','CH'],
  topic:'Jägersprache',
  q:'Wie nennt man das Haar am Rücken des Wildschweins?',
  answers:[
    {id:'a', text:'Grannen'},
    {id:'b', text:'Weißhaar'},
    {id:'c', text:'Besen'},
    {id:'d', text:'Fahne'}
  ],
  correct:['a'],
  explain:'Grannen = harte Rückenborsten.'
},

{
  id:'JL-1030',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Wie heißt die Fortpflanzungszeit des Rehwildes?',
  answers:[
    {id:'a', text:'Rausch'},
    {id:'b', text:'Brunft'},
    {id:'c', text:'Rammeln'},
    {id:'d', text:'Feist'}
  ],
  correct:['b'],
  explain:'Rehwild brunftet im Sommer.'
},

{
  id:'JL-1031',
  countries:['DE'],
  topic:'Waffen',
  q:'Was bedeutet „Drall“ im Lauf?',
  answers:[
    {id:'a', text:'Durchmesser'},
    {id:'b', text:'Zahl der Züge'},
    {id:'c', text:'Drall = Drehung des Geschosses'},
    {id:'d', text:'Reinigungszustand'}
  ],
  correct:['c'],
  explain:'Drall stabilisiert das Geschoss.'
},

{
  id:'JL-1032',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wie nennt man die Stimme des Hirsches in der Brunft?',
  answers:[
    {id:'a', text:'Keckern'},
    {id:'b', text:'Klagen'},
    {id:'c', text:'Röhren'},
    {id:'d', text:'Fiepen'}
  ],
  correct:['c'],
  explain:'Hirsche röhren in der Brunft.'
},

{
  id:'JL-1033',
  countries:['CH'],
  topic:'Ökologie',
  q:'Welche Fläche hat höchste Artenvielfalt?',
  answers:[
    {id:'a', text:'Monokulturacker'},
    {id:'b', text:'Extensivwiese'},
    {id:'c', text:'Versiegelter Parkplatz'},
    {id:'d', text:'Fichtenforst'}
  ],
  correct:['b'],
  explain:'Extensivflächen bieten Raum für viele Arten.'
},

{
  id:'JL-1034',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welche Art legt ein Spurenbild mit 2×2 Abdruck?',
  answers:[
    {id:'a', text:'Fuchs'},
    {id:'b', text:'Dachs'},
    {id:'c', text:'Wolf'},
    {id:'d', text:'Luchs'}
  ],
  correct:['d'],
  explain:'Luchse setzen in typischer 2×2-Anordnung.'
},

{
  id:'JL-1035',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist beim Kirren verboten?',
  answers:[
    {id:'a', text:'Getreidehaufen'},
    {id:'b', text:'Kirrring über 5 kg'},
    {id:'c', text:'Lebendköder'},
    {id:'d', text:'Ankirren von Rehwild'}
  ],
  correct:['c'],
  explain:'Lebendköder sind verboten.'
},

{
  id:'JL-1036',
  countries:['CH','DE'],
  topic:'Schwarzwild',
  q:'Was bezeichnet der Begriff „Frischling“?',
  answers:[
    {id:'a', text:'Bache vor dem Setzen'},
    {id:'b', text:'Stück im ersten Lebensjahr'},
    {id:'c', text:'Männliches Alttier'},
    {id:'d', text:'Überläuferkeiler'}
  ],
  correct:['b'],
  explain:'Frischlinge = Tiere im ersten Jahr.'
},

{
  id:'JL-1037',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Pflanzung fördert Niederwild?',
  answers:[
    {id:'a', text:'Maismonokulturen'},
    {id:'b', text:'Hecken & Feldgehölze'},
    {id:'c', text:'Fichtenreinbestände'},
    {id:'d', text:'Kurzrasenwiesen'}
  ],
  correct:['b'],
  explain:'Hecken bieten Deckung & Nahrung.'
},

{
  id:'JL-1038',
  countries:['DE'],
  topic:'Waffen',
  q:'Was bedeutet „offene Visierung“?',
  answers:[
    {id:'a', text:'Optik ohne Glas'},
    {id:'b', text:'Visier + Korn'},
    {id:'c', text:'Laserpunkt'},
    {id:'d', text:'Zerlegbare Optik'}
  ],
  correct:['b'],
  explain:'Korn & Visier ohne Optik.'
},

{
  id:'JL-1039',
  countries:['CH','DE'],
  topic:'Steinwild',
  q:'Welche Geiß weist typisches Verhalten auf?',
  answers:[
    {id:'a', text:'Solitäres Leben'},
    {id:'b', text:'Familienverbände'},
    {id:'c', text:'Rudel mit Alttieren'},
    {id:'d', text:'Tägliche Ortswechsel über 20 km'}
  ],
  correct:['b'],
  explain:'Geißen leben in Mutterfamilien.'
},

// Weiter mit JL-1040 bis JL-1099 …

{
  id:'JL-1040',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art ist ein Kurzstreckenzieher?',
  answers:[
    {id:'a', text:'Kranich'},
    {id:'b', text:'Ringeltaube'},
    {id:'c', text:'Auerhuhn'},
    {id:'d', text:'Rebhuhn'}
  ],
  correct:['b'],
  explain:'Viele Ringeltauben ziehen nur kurze Distanzen.'
},

{
  id:'JL-1041',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Warum setzt das Rehwild die Keimruhe ein?',
  answers:[
    {id:'a', text:'Weniger Feinde'},
    {id:'b', text:'Optimierte Geburt im Frühsommer'},
    {id:'c', text:'Lange Tragzeit'},
    {id:'d', text:'Hirsche beeinflussen es'}
  ],
  correct:['b'],
  explain:'Geburt im Juni maximal günstig.'
},

{
  id:'JL-1042',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie heißt das Haar des Fuchses?',
  answers:[
    {id:'a', text:'Balg'},
    {id:'b', text:'Schwarte'},
    {id:'c', text:'Vlies'},
    {id:'d', text:'Flaum'}
  ],
  correct:['a'],
  explain:'Fuchsfell = Balg.'
},

{
  id:'JL-1043',
  countries:['CH','DE'],
  topic:'Rotwild',
  q:'Wie nennt man den jungen Hirsch im 2. Kopf?',
  answers:[
    {id:'a', text:'Spießer'},
    {id:'b', text:'Sechser'},
    {id:'c', text:'Gabler'},
    {id:'d', text:'Schaufler'}
  ],
  correct:['c'],
  explain:'Gabler = 2. Kopf.'
},

{
  id:'JL-1044',
  countries:['DE'],
  topic:'Waffen',
  q:'Welche Munition eignet sich für bewegtes Wild?',
  answers:[
    {id:'a', text:'Vollmantel'},
    {id:'b', text:'Langsam fliegendes Geschoss'},
    {id:'c', text:'Schnelles Deformationsgeschoss'},
    {id:'d', text:'Hartkerngeschoss'}
  ],
  correct:['c'],
  explain:'Schnelles, deformationsfreudiges Geschoss wirkt sicherer.'
},

{
  id:'JL-1045',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Wie nennt man die Geräusche eines Keilers in der Rauschzeit?',
  answers:[
    {id:'a', text:'Bellen'},
    {id:'b', text:'Grunzen'},
    {id:'c', text:'Röhren'},
    {id:'d', text:'Knurren'}
  ],
  correct:['b'],
  explain:'Schwarzwild grunzt & klagt.'
},

{
  id:'JL-1046',
  countries:['DE'],
  topic:'Raubwild',
  q:'Welche Art hinterlässt Losung auf Steinen und Wegen?',
  answers:[
    {id:'a', text:'Dachs'},
    {id:'b', text:'Baummarder'},
    {id:'c', text:'Fuchs'},
    {id:'d', text:'Marderhund'}
  ],
  correct:['c'],
  explain:'Füchse markieren erhöhte Stellen.'
},

{
  id:'JL-1047',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche verbessert Wildäse am stärksten?',
  answers:[
    {id:'a', text:'Getreideacker'},
    {id:'b', text:'Wildacker'},
    {id:'c', text:'Kurzrasenwiese'},
    {id:'d', text:'Fichtenforst'}
  ],
  correct:['b'],
  explain:'Wildäcker bieten gezielte Futterpflanzen.'
},

{
  id:'JL-1048',
  countries:['DE'],
  topic:'Recht',
  q:'Wann ist Nachtjagd verboten?',
  answers:[
    {id:'a', text:'Immer'},
    {id:'b', text:'Bei Federwildarten'},
    {id:'c', text:'Nur im Winter'},
    {id:'d', text:'Bei Vollmond'}
  ],
  correct:['b'],
  explain:'Federwild darf nachts nicht bejagt werden.'
},

{
  id:'JL-1049',
  countries:['DE','CH'],
  topic:'Ökologie',
  q:'Welcher Lebensraum ist CO₂-ärmster?',
  answers:[
    {id:'a', text:'Torfmoore'},
    {id:'b', text:'Streuobstwiesen'},
    {id:'c', text:'Nadelholzmonokulturen'},
    {id:'d', text:'Urbanflächen'}
  ],
  correct:['a'],
  explain:'Moore sind große CO₂-Speicher.'
},

{
  id:'JL-1050',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Welche Lautäußerung gibt die Ricke bei Gefahr?',
  answers:[
    {id:'a', text:'Fiepen'},
    {id:'b', text:'Schrecken'},
    {id:'c', text:'Bellen'},
    {id:'d', text:'Röhren'}
  ],
  correct:['b'],
  explain:'Schrecklaut warnt andere Stücke.'
},

{
  id:'JL-1051',
  countries:['DE'],
  topic:'Waffen',
  q:'Welche Art von Abzug hat zwei Druckpunkte?',
  answers:[
    {id:'a', text:'Flintenabzug'},
    {id:'b', text:'Feine Abzüge'},
    {id:'c', text:'Druckpunktabzug'},
    {id:'d', text:'Direktabzug'}
  ],
  correct:['c'],
  explain:'Druckpunktabzug hat Vorweg + Druckpunkt.'
},

{
  id:'JL-1052',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wie heißt das Geweih im bastigen Zustand?',
  answers:[
    {id:'a', text:'Schmelz'},
    {id:'b', text:'Bast'},
    {id:'c', text:'Lichter'},
    {id:'d', text:'Fahne'}
  ],
  correct:['b'],
  explain:'Bastgeweih = weiche Basthaut.'
},

{
  id:'JL-1053',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie heißt die Fährte des Hasen?',
  answers:[
    {id:'a', text:'Sprung'},
    {id:'b', text:'Geläufe'},
    {id:'c', text:'Wechsel'},
    {id:'d', text:'Sasse'}
  ],
  correct:['a'],
  explain:'Hasenspur = Sprung.'
},

{
  id:'JL-1054',
  countries:['CH','DE'],
  topic:'Steinwild',
  q:'Welche Struktur wird vom Steinbock bevorzugt?',
  answers:[
    {id:'a', text:'Steile Felswände'},
    {id:'b', text:'Flussaue'},
    {id:'c', text:'Dichter Wald'},
    {id:'d', text:'Offene Steppe'}
  ],
  correct:['a'],
  explain:'Steinwild ist perfekt an Fels angepasst.'
},

{
  id:'JL-1055',
  countries:['DE'],
  topic:'Federwild',
  q:'Welcher Hahn prunkt im Frühjahr?',
  answers:[
    {id:'a', text:'Fasan'},
    {id:'b', text:'Gänsegeier'},
    {id:'c', text:'Waldkauz'},
    {id:'d', text:'Kranich'}
  ],
  correct:['a'],
  explain:'Fasanenhähne prunken auffällig.'
},

{
  id:'JL-1056',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welche Art hat die größte Streiffläche?',
  answers:[
    {id:'a', text:'Iltis'},
    {id:'b', text:'Steinmarder'},
    {id:'c', text:'Fuchs'},
    {id:'d', text:'Wiesel'}
  ],
  correct:['c'],
  explain:'Füchse ziehen großräumig.'
},

{
  id:'JL-1057',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Maßnahme stärkt das Niederwild im Winter?',
  answers:[
    {id:'a', text:'Mahd im November'},
    {id:'b', text:'Schneisen freihalten'},
    {id:'c', text:'Winterstreifen stehen lassen'},
    {id:'d', text:'Überwinternde Düngung'}
  ],
  correct:['c'],
  explain:'Winterstreifen bieten Nahrung & Deckung.'
},

{
  id:'JL-1058',
  countries:['DE'],
  topic:'Fallenjagd',
  q:'Welche Kontrollen sind Pflicht?',
  answers:[
    {id:'a', text:'Täglich'},
    {id:'b', text:'Wöchentlich'},
    {id:'c', text:'2× täglich'},
    {id:'d', text:'Alle 48 Std.'}
  ],
  correct:['a'],
  explain:'Lebendfallen müssen täglich kontrolliert werden.'
},

{
  id:'JL-1059',
  countries:['DE','CH'],
  topic:'Biologie',
  q:'Welche Funktion hat der Pansen?',
  answers:[
    {id:'a', text:'Salzbildung'},
    {id:'b', text:'Mikrobielle Vorverdauung'},
    {id:'c', text:'Blutfilterung'},
    {id:'d', text:'Sauerstoffspeicherung'}
  ],
  correct:['b'],
  explain:'Pansenmikroben verdauen Pflanzenfasern.'
},

{
  id:'JL-1060',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Welche Losung ist typisch für Schwarzwild?',
  answers:[
    {id:'a', text:'Kügelchen'},
    {id:'b', text:'Würstchenform'},
    {id:'c', text:'Fladen'},
    {id:'d', text:'Trockenpellets'}
  ],
  correct:['b'],
  explain:'Schwarzwild loset wurstartig.'
},

{
  id:'JL-1061',
  countries:['CH'],
  topic:'Steinwild',
  q:'Welche Jahreszeit ist für Steinwild kritisch?',
  answers:[
    {id:'a', text:'Sommer'},
    {id:'b', text:'Frühling'},
    {id:'c', text:'Winter'},
    {id:'d', text:'Herbst'}
  ],
  correct:['c'],
  explain:'Winter: Nahrung knapp & Energieverbrauch hoch.'
},

{
  id:'JL-1062',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art hat den Ruf „kurr-kurr“?',
  answers:[
    {id:'a', text:'Fasan'},
    {id:'b', text:'Turteltaube'},
    {id:'c', text:'Auerhuhn'},
    {id:'d', text:'Wachtel'}
  ],
  correct:['b'],
  explain:'Turteltauben gurren charakteristisch.'
},

{
  id:'JL-1063',
  countries:['DE'],
  topic:'Waffen',
  q:'Wie heißt der hintere Teil des Laufes?',
  answers:[
    {id:'a', text:'Korn'},
    {id:'b', text:'Patronenlager'},
    {id:'c', text:'Hülse'},
    {id:'d', text:'Drall'}
  ],
  correct:['b'],
  explain:'Patronenlager nimmt Patrone auf.'
},

{
  id:'JL-1064',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wie nennt man das Abwerfen des Geweihs?',
  answers:[
    {id:'a', text:'Fegen'},
    {id:'b', text:'Schmelzen'},
    {id:'c', text:'Stangenwurf'},
    {id:'d', text:'Nasenwurf'}
  ],
  correct:['c'],
  explain:'Geweihabwurf = Stangenwurf.'
},

{
  id:'JL-1065',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist bei Nachsuchen Pflicht?',
  answers:[
    {id:'a', text:'Schweißhund'},
    {id:'b', text:'GPS'},
    {id:'c', text:'Nachtsichtgerät'},
    {id:'d', text:'Warnweste'}
  ],
  correct:['a'],
  explain:'Geeignete Hunde sind vorgeschrieben.'
},

{
  id:'JL-1066',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welches Tier hat eine Zickzackspur?',
  answers:[
    {id:'a', text:'Fuchs'},
    {id:'b', text:'Marder'},
    {id:'c', text:'Luchs'},
    {id:'d', text:'Wolf'}
  ],
  correct:['b'],
  explain:'Marder laufen zickzackartig.'
},

{
  id:'JL-1067',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche bietet Äsung & Deckung?',
  answers:[
    {id:'a', text:'Getreideacker'},
    {id:'b', text:'Brachfläche'},
    {id:'c', text:'Maisfeld'},
    {id:'d', text:'Moor'}
  ],
  correct:['b'],
  explain:'Brachflächen liefern Nahrung & Deckung.'
},

{
  id:'JL-1068',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie nennt man das Nest des Hasen?',
  answers:[
    {id:'a', text:'Sasse'},
    {id:'b', text:'Horst'},
    {id:'c', text:'Kobel'},
    {id:'d', text:'Kessel'}
  ],
  correct:['a'],
  explain:'Sasse = flache Mulde des Hasen.'
},

{
  id:'JL-1069',
  countries:['CH','DE'],
  topic:'Steinwild',
  q:'Wann werden Steinbockkitze gesetzt?',
  answers:[
    {id:'a', text:'Januar'},
    {id:'b', text:'April–Juni'},
    {id:'c', text:'September'},
    {id:'d', text:'November'}
  ],
  correct:['b'],
  explain:'Setzzeit Frühjahr/Frühsommer.'
},

{
  id:'JL-1070',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Taube ist Höhlenbrüter?',
  answers:[
    {id:'a', text:'Ringeltaube'},
    {id:'b', text:'Turteltaube'},
    {id:'c', text:'Hohltaube'},
    {id:'d', text:'Türkentaube'}
  ],
  correct:['c'],
  explain:'Hohltaube nutzt Baumhöhlen.'
},

{
  id:'JL-1071',
  countries:['DE'],
  topic:'Waffen',
  q:'Was ist ein Flintenlauf?',
  answers:[
    {id:'a', text:'Gezogener Lauf'},
    {id:'b', text:'Glatter Lauf'},
    {id:'c', text:'Polygonlauf'},
    {id:'d', text:'Wechselchoke'}
  ],
  correct:['b'],
  explain:'Flinten haben glatte Läufe.'
},

{
  id:'JL-1072',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Welche Farbe trägt das Sommerhaar?',
  answers:[
    {id:'a', text:'Rotbraun'},
    {id:'b', text:'Grau'},
    {id:'c', text:'Dunkelbraun'},
    {id:'d', text:'Schwarz'}
  ],
  correct:['a'],
  explain:'Sommerhaar ist rötlich.'
},

{
  id:'JL-1073',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Welcher Sinn ist bei Schwarzwild schwach?',
  answers:[
    {id:'a', text:'Geruch'},
    {id:'b', text:'Gehör'},
    {id:'c', text:'Sehen'},
    {id:'d', text:'Tastsinn'}
  ],
  correct:['c'],
  explain:'Schwarzwild sieht schlecht.'
},

{
  id:'JL-1074',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist bei der Jagdausübung immer verboten?',
  answers:[
    {id:'a', text:'Kirren'},
    {id:'b', text:'Beleuchten von Wild mit Lampen'},
    {id:'c', text:'Ansitz im Hochsitz'},
    {id:'d', text:'Nachsuche'}
  ],
  correct:['b'],
  explain:'Anleuchten ist verboten.'
},

{
  id:'JL-1075',
  countries:['CH','DE'],
  topic:'Ökologie',
  q:'Welche Schicht besteht aus Moosen & Flechten?',
  answers:[
    {id:'a', text:'Baumschicht'},
    {id:'b', text:'Strauchschicht'},
    {id:'c', text:'Krautschicht'},
    {id:'d', text:'Bodenschicht'}
  ],
  correct:['d'],
  explain:'Bodenschicht = Moose & Flechten.'
},

{
  id:'JL-1076',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wie nennt man Hirsche über 10 Jahren?',
  answers:[
    {id:'a', text:'Halbstarke'},
    {id:'b', text:'Althirsche'},
    {id:'c', text:'Schmalhirsche'},
    {id:'d', text:'Jährlinge'}
  ],
  correct:['b'],
  explain:'Althirsche sind ältere Tiere.'
},

{
  id:'JL-1077',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Was bedeutet „verblasen“ bei Federwild?',
  answers:[
    {id:'a', text:'Flüchten'},
    {id:'b', text:'Aufbauschen des Gefieders'},
    {id:'c', text:'Abstreifen der Federn'},
    {id:'d', text:'Schnelles Auffliegen'}
  ],
  correct:['d'],
  explain:'Verblasen = explosionsartiges Auffliegen.'
},

{
  id:'JL-1078',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welche Art hat eine Trittsiegelung mit 4 Zehen ohne Krallenabdruck?',
  answers:[
    {id:'a', text:'Fuchs'},
    {id:'b', text:'Dachs'},
    {id:'c', text:'Luchs'},
    {id:'d', text:'Marderhund'}
  ],
  correct:['c'],
  explain:'Luchse zeigen keine Krallenabdrücke.'
},

{
  id:'JL-1079',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche ist wichtig für Insekten?',
  answers:[
    {id:'a', text:'Schottergärten'},
    {id:'b', text:'Blühinseln'},
    {id:'c', text:'Reinweiden'},
    {id:'d', text:'Getreidefelder'}
  ],
  correct:['b'],
  explain:'Blühinseln fördern Biodiversität.'
},

{
  id:'JL-1080',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art balzt mit trommelnden Flügelschlägen?',
  answers:[
    {id:'a', text:'Auerhuhn'},
    {id:'b', text:'Buntspecht'},
    {id:'c', text:'Bekassine'},
    {id:'d', text:'Rebhuhn'}
  ],
  correct:['c'],
  explain:'Bekassine trommelt in Balzflügen.'
},

{
  id:'JL-1081',
  countries:['DE'],
  topic:'Waffen',
  q:'Was ist ein Rückstoßlader?',
  answers:[
    {id:'a', text:'Repetierer'},
    {id:'b', text:'Bockflinte'},
    {id:'c', text:'Selbstladebüchse'},
    {id:'d', text:'Handspanner'}
  ],
  correct:['c'],
  explain:'Selbstladebüchsen nutzen Rückstoßenergie.'
},

{
  id:'JL-1082',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Wie nennt man das erste Gehörn des Rehbocks?',
  answers:[
    {id:'a', text:'Gabler'},
    {id:'b', text:'Krückel'},
    {id:'c', text:'Perücken'}
  ],
  correct:['b'],
  explain:'Krückel = erstes Gehörn.'
},

{
  id:'JL-1083',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Wann setzt die Rauschzeit ein?',
  answers:[
    {id:'a', text:'Herbst'},
    {id:'b', text:'Sommer'},
    {id:'c', text:'Frühling'},
    {id:'d', text:'Winter'}
  ],
  correct:['a'],
  explain:'Rauschzeit beginnt im Herbst.'
},

{
  id:'JL-1084',
  countries:['DE'],
  topic:'Recht',
  q:'Welche Dokumente müssen bei der Jagd mitgeführt werden?',
  answers:[
    {id:'a', text:'Jagdschein & Personalausweis'},
    {id:'b', text:'Hundepass'},
    {id:'c', text:'Fallenbuch'},
    {id:'d', text:'Wildursprungsschein'}
  ],
  correct:['a'],
  explain:'Jagdschein + Ausweis sind verpflichtend.'
},

{
  id:'JL-1085',
  countries:['CH','DE'],
  topic:'Ökologie',
  q:'Was entsteht bei langjähriger Übernutzung?',
  answers:[
    {id:'a', text:'Verwaldung'},
    {id:'b', text:'Versteppung'},
    {id:'c', text:'Verlandung'},
    {id:'d', text:'Versauerung'}
  ],
  correct:['b'],
  explain:'Übernutzung kann zur Versteppung führen.'
},

{
  id:'JL-1086',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wie heißt die dunkle Färbung am Hinterteil?',
  answers:[
    {id:'a', text:'Fahne'},
    {id:'b', text:'Spiegel'},
    {id:'c', text:'Brunftfleck'},
    {id:'d', text:'Rückensattel'}
  ],
  correct:['b'],
  explain:'Spiegel = helles/kontrastreiches Hinterteil.'
},

{
  id:'JL-1087',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie nennt man die Losung des Rotwildes?',
  answers:[
    {id:'a', text:'Pansen'},
    {id:'b', text:'Kreisel'},
    {id:'c', text:'Hecken'},
    {id:'d', text:'Kügelchen'}
  ],
  correct:['d'],
  explain:'Rotwild loset in Kugeln.'
},

{
  id:'JL-1088',
  countries:['CH','DE'],
  topic:'Raubwild',
  q:'Welche Art wechselt gerne über Steine?',
  answers:[
    {id:'a', text:'Fuchs'},
    {id:'b', text:'Luchs'},
    {id:'c', text:'Marder'},
    {id:'d', text:'Dachs'}
  ],
  correct:['b'],
  explain:'Luchse nutzen erhöhte Übergänge.'
},

{
  id:'JL-1089',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche unterstützt Amphibien?',
  answers:[
    {id:'a', text:'Sandgruben'},
    {id:'b', text:'Kleingewässer'},
    {id:'c', text:'Steinbrüche'},
    {id:'d', text:'Getreidefelder'}
  ],
  correct:['b'],
  explain:'Amphibien benötigen Wasserflächen.'
},

{
  id:'JL-1090',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Wie nennt man das Gebiss des Rehwildes ohne obere Schneidezähne?',
  answers:[
    {id:'a', text:'Meißelgebiss'},
    {id:'b', text:'Schalentiergebiss'},
    {id:'c', text:'Dentalplatte'},
    {id:'d', text:'Kronengebiss'}
  ],
  correct:['c'],
  explain:'Oben nur Dentalplatte.'
},

{
  id:'JL-1091',
  countries:['DE'],
  topic:'Waffen',
  q:'Welche Einheit misst Pulverladung?',
  answers:[
    {id:'a', text:'Joule'},
    {id:'b', text:'Grain'},
    {id:'c', text:'Newton'},
    {id:'d', text:'Kaliber'}
  ],
  correct:['b'],
  explain:'Pulver wird in Grain gewogen.'
},

{
  id:'JL-1092',
  countries:['DE','CH'],
  topic:'Rotwild',
  q:'Wie nennt man die helle Färbung beim Hirschkalb?',
  answers:[
    {id:'a', text:'Fleckung'},
    {id:'b', text:'Bastung'},
    {id:'c', text:'Lichter'},
    {id:'d', text:'Spiegel'}
  ],
  correct:['a'],
  explain:'Kälber tragen Fleckenmuster.'
},

{
  id:'JL-1093',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Schalenwildart äst im Winter Baumrinde?',
  answers:[
    {id:'a', text:'Rehwild'},
    {id:'b', text:'Rotwild'},
    {id:'c', text:'Gams'},
    {id:'d', text:'Steinwild'}
  ],
  correct:['b'],
  explain:'Rotwild schält Rinde.'
},

{
  id:'JL-1094',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie heißt das Nest des Fuchses?',
  answers:[
    {id:'a', text:'Kobel'},
    {id:'b', text:'Bau'},
    {id:'c', text:'Horst'},
    {id:'d', text:'Kessel'}
  ],
  correct:['b'],
  explain:'Füchse leben im Bau.'
},

{
  id:'JL-1095',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Wie nennt man die Vorderläufe des Schwarzwilds?',
  answers:[
    {id:'a', text:'Blätter'},
    {id:'b', text:'Feist'},
    {id:'c', text:'Fänge'},
    {id:'d', text:'Waffen'}
  ],
  correct:['a'],
  explain:'Blätter = Schultern/Vorderläufe.'
},

{
  id:'JL-1096',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist bei Drückjagden Pflicht?',
  answers:[
    {id:'a', text:'Helm'},
    {id:'b', text:'Warnkleidung'},
    {id:'c', text:'Kurzwaffe'},
    {id:'d', text:'GPS-Pflicht'}
  ],
  correct:['b'],
  explain:'Warnkleidung sorgt für Sichtbarkeit.'
},

{
  id:'JL-1097',
  countries:['CH','DE'],
  topic:'Ökologie',
  q:'Was verbessert die Bodenstruktur?',
  answers:[
    {id:'a', text:'Verdichtung'},
    {id:'b', text:'Humusaufbau'},
    {id:'c', text:'Staulagen'},
    {id:'d', text:'Pflügen im Herbst'}
  ],
  correct:['b'],
  explain:'Humus verbessert Bodenleben.'
},

{
  id:'JL-1098',
  countries:['DE','CH'],
  topic:'Steinwild',
  q:'Was ist ein typisches Merkmal alter Steinböcke?',
  answers:[
    {id:'a', text:'Helle Hörner'},
    {id:'b', text:'Enge Jahresringe'},
    {id:'c', text:'Kurze Krucken'},
    {id:'d', text:'Fehlende Bartstreifen'}
  ],
  correct:['b'],
  explain:'Jahresringe rücken im Alter enger zusammen.'
},

{
  id:'JL-1099',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche bietet Wild in Hitzeperioden Vorteile?',
  answers:[
    {id:'a', text:'Dunkler Acker'},
    {id:'b', text:'Lichter Laubwald'},
    {id:'c', text:'Südhang ohne Bewuchs'},
    {id:'d', text:'Asphaltwege'}
  ],
  correct:['b'],
  explain:'Laubwald spendet Schatten & kühlt.'
},
  {
  id:'JL-1100',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Woran erkennt man eine führende Ricke?',
  answers:[
    {id:'a', text:'Sie trägt Bast am Gehörn'},
    {id:'b', text:'Sie führt ein oder mehrere Kitze'},
    {id:'c', text:'Sie schmelzt später als Böcke'},
    {id:'d', text:'Sie röhrt laut in der Brunft'}
  ],
  correct:['b'],
  explain:'Führende Ricken sind mit Kitz(en) zusammen.'
},
{
  id:'JL-1101',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie nennt man den flachen Ruheplatz des Hasen?',
  answers:[
    {id:'a', text:'Sasse'},
    {id:'b', text:'Kessel'},
    {id:'c', text:'Horst'},
    {id:'d', text:'Kobel'}
  ],
  correct:['a'],
  explain:'Die Sasse ist die flache Mulde des Hasen.'
},
{
  id:'JL-1102',
  countries:['CH','AT'],
  topic:'Steinwild',
  q:'Woran erkennt man die Setzzeit der Steinwildgeiß?',
  answers:[
    {id:'a', text:'Am bleichen Haar im Rücken'},
    {id:'b', text:'Kitze werden im Mai/Juni gesetzt'},
    {id:'c', text:'Geiß ruft laut'},
    {id:'d', text:'Krucken werden heller'}
  ],
  correct:['b'],
  explain:'Steinwild setzt im Frühling/Frühsommer.'
},
{
  id:'JL-1103',
  countries:['DE','CH'],
  topic:'Schwarzwild',
  q:'Welche Aussage beschreibt die Rottenstruktur?',
  answers:[
    {id:'a', text:'Nur Keiler leben in Rotten'},
    {id:'b', text:'Bachen und Frischlinge bilden Rotten'},
    {id:'c', text:'Frischlinge leben allein'},
    {id:'d', text:'Keiler und Hirsch im Rudel'}
  ],
  correct:['b'],
  explain:'Bachen führen Rotten, Keiler leben meist allein.'
},
{
  id:'JL-1104',
  countries:['DE'],
  topic:'Waffen',
  q:'Welche Funktion hat ein Mündungsfeuerdämpfer?',
  answers:[
    {id:'a', text:'Erhöht Rückstoß'},
    {id:'b', text:'Reduziert sichtbares Mündungsfeuer'},
    {id:'c', text:'Steigert Geschossenergie'},
    {id:'d', text:'Verhindert Kugelfang'}
  ],
  correct:['b'],
  explain:'Verringert Blendung & sichtbares Feuer.'
},
{
  id:'JL-1105',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art zeigt einen auffälligen Balzruf in der Dämmerung?',
  answers:[
    {id:'a', text:'Kranich'},
    {id:'b', text:'Wachtel'},
    {id:'c', text:'Auerhuhn'},
    {id:'d', text:'Waldkauz'}
  ],
  correct:['b'],
  explain:'Der Wachtelruf ist typisch in der Abenddämmerung.'
},
{
  id:'JL-1106',
  countries:['DE'],
  topic:'Recht',
  q:'Wann darf eine Waffe geführt werden?',
  answers:[
    {id:'a', text:'Immer, wenn sie geladen ist'},
    {id:'b', text:'Nur mit Jagdschein & Bedürfnis'},
    {id:'c', text:'Bei Spaziergängen im Wald'},
    {id:'d', text:'Im Wohngebiet ohne Grund'}
  ],
  correct:['b'],
  explain:'Führen nur mit Erlaubnis & Bedürfnis.'
},
{
  id:'JL-1107',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Was dient als wertvolle Deckung für Niederwild?',
  answers:[
    {id:'a', text:'Kurzrasen'},
    {id:'b', text:'Hecken & Altgrasstreifen'},
    {id:'c', text:'Bare Äcker'},
    {id:'d', text:'Streuobst ohne Unterbewuchs'}
  ],
  correct:['b'],
  explain:'Strukturen bieten Deckung, Nahrung, Schutz.'
},
{
  id:'JL-1108',
  countries:['AT','DE'],
  topic:'Jägersprache',
  q:'Was ist das „Gehäuse“ beim Fuchs?',
  answers:[
    {id:'a', text:'Hinterlauf'},
    {id:'b', text:'Kopf'},
    {id:'c', text:'Brustkorb'},
    {id:'d', text:'Schwanz'}
  ],
  correct:['c'],
  explain:'Gehäuse = Brustkörper beim Raubwild.'
},
{
  id:'JL-1109',
  countries:['DE','CH'],
  topic:'Wildbrethygiene',
  q:'Warum muss Wildbret schnell gekühlt werden?',
  answers:[
    {id:'a', text:'Um Gewicht zu reduzieren'},
    {id:'b', text:'Um Keimwachstum zu bremsen'},
    {id:'c', text:'Um Fell leichter abziehen zu können'},
    {id:'d', text:'Für bessere Trophäen'}
  ],
  correct:['b'],
  explain:'Schnelles Kühlen verhindert Keimvermehrung.'
},
{
  id:'JL-1110',
  countries:['CH'],
  topic:'Rotwild',
  q:'Wie verhält sich Rotwild bei starkem Wind?',
  answers:[
    {id:'a', text:'Wechselt in dichte Deckung'},
    {id:'b', text:'Sucht offene Flächen'},
    {id:'c', text:'Verliert Rudelkontakt'},
    {id:'d', text:'Rückt an Straßen heran'}
  ],
  correct:['a'],
  explain:'Wind erschwert Witterung → Deckung gesucht.'
},
{
  id:'JL-1111',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist beim Nachtzielgerät in DE besonders?',
  answers:[
    {id:'a', text:'Allgemein erlaubt'},
    {id:'b', text:'Nur mit Ausnahmegenehmigung je Bundesland'},
    {id:'c', text:'Nur bei Federwild erlaubt'},
    {id:'d', text:'Pflicht für Rehwild'}
  ],
  correct:['b'],
  explain:'Regeln sind Ländersache → teils genehmigungspflichtig.'
},
{
  id:'JL-1112',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Ente taucht längere Zeit unter?',
  answers:[
    {id:'a', text:'Stockente'},
    {id:'b', text:'Tafelente'},
    {id:'c', text:'Krickente'},
    {id:'d', text:'Moorente'}
  ],
  correct:['b'],
  explain:'Tauchenten bleiben deutlich länger unter Wasser.'
},
{
  id:'JL-1113',
  countries:['AT','CH'],
  topic:'Raubwild',
  q:'Was kennzeichnet die Losung des Luchses?',
  answers:[
    {id:'a', text:'Kugelig in Ketten'},
    {id:'b', text:'Groß, krümelig, mit Haarresten'},
    {id:'c', text:'Immer spiralig'},
    {id:'d', text:'Flach & breiig'}
  ],
  correct:['b'],
  explain:'Losung enthält oft Fellreste & ist krümelig.'
},
{
  id:'JL-1114',
  countries:['DE'],
  topic:'Waffen',
  q:'Welche Sicherungsart verhindert den Abzugsweg vollständig?',
  answers:[
    {id:'a', text:'Handspanner'},
    {id:'b', text:'Schlittensicherung'},
    {id:'c', text:'Abzugssicherung'},
    {id:'d', text:'Magazinsicherung'}
  ],
  correct:['c'],
  explain:'Abzugssicherung blockiert den Abzug.'
},
{
  id:'JL-1115',
  countries:['DE','CH'],
  topic:'Ökologie',
  q:'Welche Fläche hat die höchste Artenvielfalt?',
  answers:[
    {id:'a', text:'Maisacker'},
    {id:'b', text:'Buntbrachen'},
    {id:'c', text:'Fichtenforst'},
    {id:'d', text:'Kahlschlag'}
  ],
  correct:['b'],
  explain:'Buntbrachen schaffen Strukturreichtum.'
},
{
  id:'JL-1116',
  countries:['DE','AT'],
  topic:'Rehwild',
  q:'Wann ist die Hauptfegzeit der Böcke?',
  answers:[
    {id:'a', text:'Januar'},
    {id:'b', text:'März/April'},
    {id:'c', text:'August'},
    {id:'d', text:'November'}
  ],
  correct:['b'],
  explain:'Fegen im Frühling.'
},
{
  id:'JL-1117',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Was ist die „Decke“ beim Haarwild?',
  answers:[
    {id:'a', text:'Magen'},
    {id:'b', text:'Fell des Tieres'},
    {id:'c', text:'Fährte'},
    {id:'d', text:'Kiefer'}
  ],
  correct:['b'],
  explain:'Decke = Fell.'
},
{
  id:'JL-1118',
  countries:['CH','DE'],
  topic:'Schwarzwild',
  q:'Welche Aussage trifft auf Keiler zu?',
  answers:[
    {id:'a', text:'Keiler sind fast immer in Rotten'},
    {id:'b', text:'Keiler leben meist als Einzelgänger'},
    {id:'c', text:'Keiler führen Frischlinge'},
    {id:'d', text:'Keiler sind tagaktive Pflanzenfresser'}
  ],
  correct:['b'],
  explain:'Keiler leben überwiegend allein.'
},
{
  id:'JL-1119',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Maßnahme fördert Bodenbrüter besonders?',
  answers:[
    {id:'a', text:'Mahd im Mai'},
    {id:'b', text:'Altgrasinseln stehen lassen'},
    {id:'c', text:'Ganzjahresweiden'},
    {id:'d', text:'Waldschlag'}
  ],
  correct:['b'],
  explain:'Altgrasinseln bieten Deckung & Schutz.'
},
  {
  id:'JL-1200',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Woran erkennt man ein Schmalreh?',
  answers:[
    {id:'a', text:'An deutlich ausgeprägter Trägerbildung'},
    {id:'b', text:'Einjährige Ricke ohne Kitz'},
    {id:'c', text:'Besonders dunkles Sommerhaar'},
    {id:'d', text:'Fleckung am Spiegel'}
  ],
  correct:['b'],
  explain:'Schmalrehe sind einjährige weibliche Stücke ohne Kitz.'
},
{
  id:'JL-1201',
  countries:['DE','AT'],
  topic:'Rotwild',
  q:'Wie nennt man die Stirnzapfen des Hirschgeweihs?',
  answers:[
    {id:'a', text:'Rosenstöcke'},
    {id:'b', text:'Gabel'},
    {id:'c', text:'Spitzen'},
    {id:'d', text:'Fahnen'}
  ],
  correct:['a'],
  explain:'Rosenstöcke bilden die Basis des Geweihs.'
},
{
  id:'JL-1202',
  countries:['CH'],
  topic:'Steinwild',
  q:'Wodurch unterscheidet sich das weibliche Steinwild vom Bock?',
  answers:[
    {id:'a', text:'Geiß hat viel längere Krucken'},
    {id:'b', text:'Geiß hat kürzere, dünnere Hörner'},
    {id:'c', text:'Geiß hat keine Hörner'},
    {id:'d', text:'Geiß ist größer'}
  ],
  correct:['b'],
  explain:'Geißen tragen kürzere, schmalere Hörner.'
},
{
  id:'JL-1203',
  countries:['DE'],
  topic:'Schwarzwild',
  q:'Was ist die typische Losung des Schwarzwildes?',
  answers:[
    {id:'a', text:'Kugelartig'},
    {id:'b', text:'Wurstartig'},
    {id:'c', text:'Fladenartig'},
    {id:'d', text:'Kettenartig'}
  ],
  correct:['b'],
  explain:'Schwarzwild loset wurstartig.'
},
{
  id:'JL-1204',
  countries:['AT','DE'],
  topic:'Jägersprache',
  q:'Was bedeutet „verhoffen“?',
  answers:[
    {id:'a', text:'Flucht in vollem Lauf'},
    {id:'b', text:'Kurzes Stehenbleiben, um zu sichern'},
    {id:'c', text:'Niederlegen in Deckung'},
    {id:'d', text:'Haarwechsel im Frühjahr'}
  ],
  correct:['b'],
  explain:'Verhoffen: Wild bleibt kurz stehen und sichert.'
},
{
  id:'JL-1205',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art zeigt ein trommelndes Balzgeräusch?',
  answers:[
    {id:'a', text:'Stockente'},
    {id:'b', text:'Bekassine'},
    {id:'c', text:'Ringeltaube'},
    {id:'d', text:'Graugans'}
  ],
  correct:['b'],
  explain:'Die Bekassine erzeugt ein surrendes Trommeln in der Balz.'
},
{
  id:'JL-1206',
  countries:['DE'],
  topic:'Waffen',
  q:'Was beschreibt die Mündungsgeschwindigkeit?',
  answers:[
    {id:'a', text:'Geschwindigkeit nach 100 m'},
    {id:'b', text:'Geschwindigkeit beim Austritt aus dem Lauf'},
    {id:'c', text:'Beschleunigung im Magazin'},
    {id:'d', text:'Rückstoßkraft des Systems'}
  ],
  correct:['b'],
  explain:'Mündungsgeschwindigkeit = Geschwindigkeit beim Laufende.'
},
{
  id:'JL-1207',
  countries:['CH','DE'],
  topic:'Ökologie',
  q:'Welcher Lebensraum hat normalerweise die höchste Insektenvielfalt?',
  answers:[
    {id:'a', text:'Maisacker'},
    {id:'b', text:'Extensivwiese'},
    {id:'c', text:'Schotterfläche'},
    {id:'d', text:'Dichter Fichtenforst'}
  ],
  correct:['b'],
  explain:'Extensivflächen bieten viele Pflanzen & Nischen.'
},
{
  id:'JL-1208',
  countries:['DE','AT'],
  topic:'Wildbrethygiene',
  q:'Was passiert bei zu langsamer Kühlung von Wildbret?',
  answers:[
    {id:'a', text:'Es wird heller'},
    {id:'b', text:'Keime vermehren sich schnell'},
    {id:'c', text:'Es wird zu trocken'},
    {id:'d', text:'Es verliert Nährstoffe'}
  ],
  correct:['b'],
  explain:'Lange Warmphase = Keimwachstum.'
},
{
  id:'JL-1209',
  countries:['DE'],
  topic:'Recht',
  q:'Wann ist Fangjagd erlaubt?',
  answers:[
    {id:'a', text:'Immer und ohne Genehmigung'},
    {id:'b', text:'Nur mit geprüften, zugelassenen Fallen'},
    {id:'c', text:'Nur im Gebäudebereich'},
    {id:'d', text:'Nur mit Selbstschussgeräten'}
  ],
  correct:['b'],
  explain:'Nur tierschutzkonform zugelassene Fallen.'
},
{
  id:'JL-1210',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welcher Raubwildart sieht man die Krallen IMMER im Trittsiegel?',
  answers:[
    {id:'a', text:'Luchs'},
    {id:'b', text:'Fuchs'},
    {id:'c', text:'Katze'},
    {id:'d', text:'Marder'}
  ],
  correct:['b'],
  explain:'Füchse zeigen stets Krallenabdrücke.'
},
{
  id:'JL-1211',
  countries:['AT','DE'],
  topic:'Rotwild',
  q:'Woran erkennt man einen starken Hirsch?',
  answers:[
    {id:'a', text:'An kurzen Stangen'},
    {id:'b', text:'An massiver Stangenbasis & starken Rosen'},
    {id:'c', text:'Am Fehlen der Augsprossen'},
    {id:'d', text:'An einer grauen Decke'}
  ],
  correct:['b'],
  explain:'Starke Hirsche haben eine massive Stangenbasis.'
},
{
  id:'JL-1212',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Wann setzt das Reh typischerweise?',
  answers:[
    {id:'a', text:'Februar'},
    {id:'b', text:'Mai/Juni'},
    {id:'c', text:'September'},
    {id:'d', text:'November'}
  ],
  correct:['b'],
  explain:'Rehe setzen im späten Frühjahr.'
},
{
  id:'JL-1213',
  countries:['DE'],
  topic:'Waffen',
  q:'Was verhindert eine Abzugssicherung?',
  answers:[
    {id:'a', text:'Öffnen des Verschlusses'},
    {id:'b', text:'Bewegung des Abzugs'},
    {id:'c', text:'Schalldämpferfunktion'},
    {id:'d', text:'Magazinwechsel'}
  ],
  correct:['b'],
  explain:'Abzugssicherung blockiert den Abzug mechanisch.'
},
{
  id:'JL-1214',
  countries:['CH','DE'],
  topic:'Jägersprache',
  q:'Wie nennt man das Maul des Schwarzwildes?',
  answers:[
    {id:'a', text:'Äser'},
    {id:'b', text:'Gebräch'},
    {id:'c', text:'Träger'},
    {id:'d', text:'Fahne'}
  ],
  correct:['b'],
  explain:'Gebräch = Maul des Schwarzwildes.'
},
{
  id:'JL-1215',
  countries:['DE','AT'],
  topic:'Hege',
  q:'Welche Maßnahme hilft besonders gegen Fuchsbejagungsdruck bei Bodenbrütern?',
  answers:[
    {id:'a', text:'Ganzjährige Mahd'},
    {id:'b', text:'Altgrasinseln & Deckungsstrukturen'},
    {id:'c', text:'Reiner Wald'},
    {id:'d', text:'Entwässerung'}
  ],
  correct:['b'],
  explain:'Deckung reduziert Prädationsdruck.'
},
{
  id:'JL-1216',
  countries:['DE'],
  topic:'Wildbrethygiene',
  q:'Welche Temperatur ist ideal für Wildkühlung?',
  answers:[
    {id:'a', text:'0–1 °C'},
    {id:'b', text:'4–7 °C'},
    {id:'c', text:'15–20 °C'},
    {id:'d', text:'Über 20 °C'}
  ],
  correct:['b'],
  explain:'4–7 °C verhindern Keimwachstum optimal.'
},
{
  id:'JL-1217',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welche Art hinterlässt schnurgerade Spur?',
  answers:[
    {id:'a', text:'Hund'},
    {id:'b', text:'Wolf'},
    {id:'c', text:'Marderhund'},
    {id:'d', text:'Fuchs im Trollgang'}
  ],
  correct:['b'],
  explain:'Wölfe laufen extrem gerade und zielgerichtet.'
},
{
  id:'JL-1218',
  countries:['DE'],
  topic:'Recht',
  q:'Was ist bei Schalenwild IMMER verboten?',
  answers:[
    {id:'a', text:'Nachtjagd'},
    {id:'b', text:'Anleuchten'},
    {id:'c', text:'Ansitz im Hochsitz'},
    {id:'d', text:'Nachsuche'}
  ],
  correct:['b'],
  explain:'Anleuchten von Wild ist verboten.'
},
{
  id:'JL-1219',
  countries:['AT','CH'],
  topic:'Rotwild',
  q:'Wie nennt man den jungen Hirsch im 1. Kopf?',
  answers:[
    {id:'a', text:'Spießer'},
    {id:'b', text:'Gabler'},
    {id:'c', text:'Sechser'},
    {id:'d', text:'Schaufler'}
  ],
  correct:['a'],
  explain:'Spießer = 1. Kopf mit ungegabelten Stangen.'
},
{
  id:'JL-1220',
  countries:['DE','CH'],
  topic:'Steinwild',
  q:'Was ist typisch für alte Steinböcke?',
  answers:[
    {id:'a', text:'Sehr helle Krucken'},
    {id:'b', text:'Enge Jahresringe'},
    {id:'c', text:'Kleine Hörner'},
    {id:'d', text:'Kein Bart'}
  ],
  correct:['b'],
  explain:'Jahresringe rücken im Alter enger zusammen.'
},
{
  id:'JL-1221',
  countries:['DE'],
  topic:'Rehwild',
  q:'Welche Lautäußerung gibt ein Reh bei Gefahr?',
  answers:[
    {id:'a', text:'Röhren'},
    {id:'b', text:'Bellen / Schrecken'},
    {id:'c', text:'Trillern'},
    {id:'d', text:'Gurren'}
  ],
  correct:['b'],
  explain:'Der Schrecklaut warnt andere Stücke.'
},
{
  id:'JL-1222',
  countries:['DE','AT'],
  topic:'Waffen',
  q:'Was ist ein Direktabzug?',
  answers:[
    {id:'a', text:'Abzug ohne Druckpunkt'},
    {id:'b', text:'Abzug mit zwei Druckpunkten'},
    {id:'c', text:'Abzug mit Rückstellfeder'},
    {id:'d', text:'Elektronischer Abzug'}
  ],
  correct:['a'],
  explain:'Direktabzug löst ohne Druckpunkt aus.'
},
{
  id:'JL-1223',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art ist ein Höhlenbrüter?',
  answers:[
    {id:'a', text:'Hohltaube'},
    {id:'b', text:'Fasan'},
    {id:'c', text:'Krickente'},
    {id:'d', text:'Bekassine'}
  ],
  correct:['a'],
  explain:'Hohltauben nutzen Baumhöhlen.'
},
{
  id:'JL-1224',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Wie nennt man die Hinterläufe des Schwarzwildes?',
  answers:[
    {id:'a', text:'Waffen'},
    {id:'b', text:'Blätter'},
    {id:'c', text:'Läufe'},
    {id:'d', text:'Haken'}
  ],
  correct:['c'],
  explain:'Läufe = Beine.'
},
{
  id:'JL-1225',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche fördert Bodenbrüter stark?',
  answers:[
    {id:'a', text:'Kurzrasen'},
    {id:'b', text:'Altgrasinseln'},
    {id:'c', text:'Betonflächen'},
    {id:'d', text:'Steinbrüche'}
  ],
  correct:['b'],
  explain:'Altgrasinseln bieten Deckung & Brutplatz.'
},
{
  id:'JL-1226',
  countries:['DE'],
  topic:'Schwarzwild',
  q:'Wann sind Frischlinge gestreift?',
  answers:[
    {id:'a', text:'3–4 Monate'},
    {id:'b', text:'Bis ca. 3 Monate'},
    {id:'c', text:'Bis 1 Jahr'},
    {id:'d', text:'Gar nicht'}
  ],
  correct:['b'],
  explain:'Streifenmuster erfolgt in den ersten Monaten.'
},
{
  id:'JL-1227',
  countries:['AT','DE'],
  topic:'Ökologie',
  q:'Was entsteht bei starkem Wildverbiss?',
  answers:[
    {id:'a', text:'Starke Naturverjüngung'},
    {id:'b', text:'Schadbild an Leittrieben'},
    {id:'c', text:'Mehr Blühpflanzen'},
    {id:'d', text:'Feuchtere Böden'}
  ],
  correct:['b'],
  explain:'Verbiss zeigt Überbestand oder wenig Nahrung.'
},
{
  id:'JL-1228',
  countries:['DE','CH'],
  topic:'Wildbrethygiene',
  q:'Welche Probenpflicht gilt für Schwarzwild?',
  answers:[
    {id:'a', text:'Keine'},
    {id:'b', text:'Trichinenprobe'},
    {id:'c', text:'Rückstandstest'},
    {id:'d', text:'Trophäenprobe'}
  ],
  correct:['b'],
  explain:'Trichinenprobe ist vorgeschrieben.'
},
{
  id:'JL-1229',
  countries:['DE','AT'],
  topic:'Jägersprache',
  q:'Wie nennt man das Fegen des Geweihs?',
  answers:[
    {id:'a', text:'Schmelzen'},
    {id:'b', text:'Verfegen'},
    {id:'c', text:'Rauschen'},
    {id:'d', text:'Werfen'}
  ],
  correct:['b'],
  explain:'Verfegen = Entfernen der Basthaut.'
},
{
  id:'JL-1230',
  countries:['DE'],
  topic:'Recht',
  q:'Wann darf eine Waffe im Auto transportiert werden?',
  answers:[
    {id:'a', text:'Geladen & offen sichtbar'},
    {id:'b', text:'Ungeladen & verschlossen'},
    {id:'c', text:'Immer geladen'},
    {id:'d', text:'Offen auf Rückbank'}
  ],
  correct:['b'],
  explain:'Verschlossen & ungeladen transportieren.'
},
{
  id:'JL-1231',
  countries:['CH','DE'],
  topic:'Rotwild',
  q:'Wie nennt man das helle Hinterteil des Rotwildes?',
  answers:[
    {id:'a', text:'Fahne'},
    {id:'b', text:'Spiegel'},
    {id:'c', text:'Balg'},
    {id:'d', text:'Fleck'}
  ],
  correct:['b'],
  explain:'Spiegel ist typisch hell gefärbt.'
},
{
  id:'JL-1232',
  countries:['DE','AT'],
  topic:'Raubwild',
  q:'Welche Art ist streng territorial?',
  answers:[
    {id:'a', text:'Marderhund'},
    {id:'b', text:'Baummarder'},
    {id:'c', text:'Waschbär'},
    {id:'d', text:'Dachs'}
  ],
  correct:['b'],
  explain:'Baummarder verteidigen feste Territorien.'
},
{
  id:'JL-1233',
  countries:['DE'],
  topic:'Waffen',
  q:'Was bedeutet Joule (J)?',
  answers:[
    {id:'a', text:'Mündungsdruck'},
    {id:'b', text:'Energie'},
    {id:'c', text:'Geschwindigkeit'},
    {id:'d', text:'Drall'}
  ],
  correct:['b'],
  explain:'Energieeinheit bei Geschossen.'
},
{
  id:'JL-1234',
  countries:['AT','CH'],
  topic:'Federwild',
  q:'Welche Rufe gibt der Fasanenhahn in der Balzzeit?',
  answers:[
    {id:'a', text:'Grunzen'},
    {id:'b', text:'Krähen'},
    {id:'c', text:'Pfeifen'},
    {id:'d', text:'Singen'}
  ],
  correct:['b'],
  explain:'Besonders laut rufend in der Balz.'
},
{
  id:'JL-1235',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Welche Fellfarbe trägt das Reh im Winter?',
  answers:[
    {id:'a', text:'Rotbraun'},
    {id:'b', text:'Grau'},
    {id:'c', text:'Schwarz'},
    {id:'d', text:'Gelblich'}
  ],
  correct:['b'],
  explain:'Winterhaar ist graubraun.'
},
{
  id:'JL-1236',
  countries:['DE','AT'],
  topic:'Schwarzwild',
  q:'Wie nennt man junge Schwarzwildmännchen im zweiten Lebensjahr?',
  answers:[
    {id:'a', text:'Keiler'},
    {id:'b', text:'Blattkeiler'},
    {id:'c', text:'Überläuferkeiler'},
    {id:'d', text:'Frischling'}
  ],
  correct:['c'],
  explain:'Überläuferkeiler = 2. Lebensjahr.'
},
{
  id:'JL-1237',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Was ist ein „Stangenwurf“?',
  answers:[
    {id:'a', text:'Angriff mit den Stangen'},
    {id:'b', text:'Abwerfen des Geweihs'},
    {id:'c', text:'Angriff eines Keilers'},
    {id:'d', text:'Sprungtechnik des Rehwildes'}
  ],
  correct:['b'],
  explain:'Stangenwurf = Geweihabwurf.'
},
{
  id:'JL-1238',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Fläche begünstigt Insekten am meisten?',
  answers:[
    {id:'a', text:'Schottergärten'},
    {id:'b', text:'Blühstreifen'},
    {id:'c', text:'Asphalt'},
    {id:'d', text:'Maisfelder'}
  ],
  correct:['b'],
  explain:'Blühstreifen sind wertvoll für Insekten.'
},
{
  id:'JL-1239',
  countries:['DE'],
  topic:'Waffen',
  q:'Was ist ein Rückstoßlader?',
  answers:[
    {id:'a', text:'Repetierer'},
    {id:'b', text:'Selbstladebüchse'},
    {id:'c', text:'Bockflinte'},
    {id:'d', text:'Druckluftwaffe'}
  ],
  correct:['b'],
  explain:'Selbstlader nutzt Rückstoßenergie.'
},
{
  id:'JL-1240',
  countries:['DE','CH'],
  topic:'Rehwild',
  q:'Wie nennt man den Nachwuchs der Ricke?',
  answers:[
    {id:'a', text:'Kalb'},
    {id:'b', text:'Kitz'},
    {id:'c', text:'Frischling'},
    {id:'d', text:'Lamm'}
  ],
  correct:['b'],
  explain:'Rehwildnachwuchs = Kitz.'
},
{
  id:'JL-1241',
  countries:['AT','DE'],
  topic:'Ökologie',
  q:'Welche Fläche speichert am meisten CO₂?',
  answers:[
    {id:'a', text:'Moor'},
    {id:'b', text:'Wiese'},
    {id:'c', text:'Acker'},
    {id:'d', text:'Nadelwald'}
  ],
  correct:['a'],
  explain:'Moore sind die stärksten CO₂-Speicher.'
},
{
  id:'JL-1242',
  countries:['DE','CH'],
  topic:'Raubwild',
  q:'Welches Raubwild lebt territorial allein?',
  answers:[
    {id:'a', text:'Fuchs'},
    {id:'b', text:'Baummarder'},
    {id:'c', text:'Luchs'},
    {id:'d', text:'Marderhund'}
  ],
  correct:['c'],
  explain:'Luchse leben solitär und territorial.'
},
{
  id:'JL-1243',
  countries:['DE'],
  topic:'Recht',
  q:'Wer trägt die Verantwortung für einen sicheren Schuss?',
  answers:[
    {id:'a', text:'Revierpächter'},
    {id:'b', text:'Schütze selbst'},
    {id:'c', text:'Jagdkollege'},
    {id:'d', text:'Hegering'}
  ],
  correct:['b'],
  explain:'Der Schütze trägt immer die volle Verantwortung.'
},
{
  id:'JL-1244',
  countries:['DE','AT'],
  topic:'Rotwild',
  q:'Wie nennt man junge Hirschkälber?',
  answers:[
    {id:'a', text:'Kitze'},
    {id:'b', text:'Frischlinge'},
    {id:'c', text:'Kälber'},
    {id:'d', text:'Lämmer'}
  ],
  correct:['c'],
  explain:'Rotwildnachwuchs = Kalb.'
},
{
  id:'JL-1245',
  countries:['DE'],
  topic:'Waffen',
  q:'Warum nutzt man Schalldämpfer?',
  answers:[
    {id:'a', text:'Erhöht Energie'},
    {id:'b', text:'Reduziert Knall & Rückstoß'},
    {id:'c', text:'Als Zielfernrohrersatz'},
    {id:'d', text:'Verhindert Winddrift'}
  ],
  correct:['b'],
  explain:'Dämpft Knall & Rückstoß.'
},
{
  id:'JL-1246',
  countries:['DE','CH'],
  topic:'Federwild',
  q:'Welche Art ist ein Zugvogel?',
  answers:[
    {id:'a', text:'Auerhuhn'},
    {id:'b', text:'Krickente'},
    {id:'c', text:'Fasan'},
    {id:'d', text:'Waldkauz'}
  ],
  correct:['b'],
  explain:'Krickenten ziehen im Winter Richtung Süden.'
},
{
  id:'JL-1247',
  countries:['DE','AT'],
  topic:'Rehwild',
  q:'Welches Rehmerkmal zeigt ein älterer Bock?',
  answers:[
    {id:'a', text:'Breite Rosen & dicke Stangen'},
    {id:'b', text:'Sehr heller Spiegel'},
    {id:'c', text:'Stark gefleckte Decke'},
    {id:'d', text:'Keine Trägerbildung'}
  ],
  correct:['a'],
  explain:'Ältere Böcke: starke Stangenbasis.'
},
{
  id:'JL-1248',
  countries:['CH','DE'],
  topic:'Raubwild',
  q:'Welche Beute schlägt der Steinadler regelmäßig?',
  answers:[
    {id:'a', text:'Rehwild'},
    {id:'b', text:'Gamskitze'},
    {id:'c', text:'Füchse'},
    {id:'d', text:'Dachse'}
  ],
  correct:['b'],
  explain:'Steinadler schlagen bevorzugt Kitze.'
},
{
  id:'JL-1249',
  countries:['DE','CH'],
  topic:'Hege',
  q:'Welche Maßnahme hilft Niederwild am meisten?',
  answers:[
    {id:'a', text:'Dauermahd'},
    {id:'b', text:'Hecken & Saumbiotope'},
    {id:'c', text:'Düngung'},
    {id:'d', text:'Pflügen im Herbst'}
  ],
  correct:['b'],
  explain:'Hecken fördern Deckung & Nahrung.'
},
  // ======================
// BLOCK 1 — Fragen 1–100
// ======================

{
  id:'JL-new-0001',
  countries:['DE','AT','CH'],
  topic:'Waffen & Schuss',
  q:'Was bewirkt ein längerer Lauf bei einer Büchse normalerweise?',
  answers:[
    {id:'a', text:'Höhere Mündungsgeschwindigkeit'},
    {id:'b', text:'Weniger Drall'},
    {id:'c', text:'Schlechtere Präzision'},
    {id:'d', text:'Stärkere Rückstoßvergrößerung'}
  ],
  correct:['a'],
  explain:'Längere Läufe erlauben vollständigere Pulververbrennung → höhere V₀.'
},

{
  id:'JL-new-0002',
  countries:['DE'],
  topic:'Recht',
  q:'Wer ist in Deutschland für die Jagdscheinprüfung zuständig?',
  answers:[
    {id:'a', text:'Bundestag'},
    {id:'b', text:'Länder bzw. deren Behörden'},
    {id:'c', text:'NATO'},
    {id:'d', text:'Forstämter allein'}
  ],
  correct:['b'],
  explain:'Jagdrecht ist Ländersache.'
},

{
  id:'JL-new-0003',
  countries:['AT'],
  topic:'Recht',
  q:'Wer regelt in Österreich die Abschusspläne?',
  answers:[
    {id:'a', text:'Bund'},
    {id:'b', text:'Jeweiliges Bundesland'},
    {id:'c', text:'Forstverwaltung der EU'},
    {id:'d', text:'Schützenvereine'}
  ],
  correct:['b'],
  explain:'Jagdrecht = Landesrecht.'
},

{
  id:'JL-new-0004',
  countries:['CH'],
  topic:'Recht',
  q:'Was unterscheidet die Schweizer Patentjagd vom Pachtsystem?',
  answers:[
    {id:'a', text:'Keine Jagdprüfung notwendig'},
    {id:'b', text:'Jagdausübung via Jahrespatent statt gepachteter Fläche'},
    {id:'c', text:'Jagd nur mit Falken erlaubt'},
    {id:'d', text:'Kein Schusswaffengebrauch'}
  ],
  correct:['b'],
  explain:'Patentjagd: Gebiet ist kantonal definiert und per Patent bejagbar.'
},

{
  id:'JL-new-0005',
  countries:['DE','AT','CH'],
  topic:'Hundewesen',
  q:'Welche Eigenschaft ist besonders wichtig für die Nachsuche?',
  answers:[
    {id:'a', text:'Weitjagd'},
    {id:'b', text:'Schweißarbeit & Fährtenwillen'},
    {id:'c', text:'Hütetrieb'},
    {id:'d', text:'Wasserapport'}
  ],
  correct:['b'],
  explain:'Nachsuchehunde benötigen Spurwille & Ausdauer.'
},

{
  id:'JL-new-0006',
  countries:['DE','AT','CH'],
  topic:'Hege',
  q:'Welcher Lebensraum fördert Biodiversität am stärksten?',
  answers:[
    {id:'a', text:'Monokulturen'},
    {id:'b', text:'Strukturreiche Waldränder & Saumbiotope'},
    {id:'c', text:'Schotterflächen'},
    {id:'d', text:'Reiner Fichtenbestand'}
  ],
  correct:['b'],
  explain:'Strukturvielfalt = hohe Artenvielfalt.'
},

{
  id:'JL-new-0007',
  countries:['DE','AT','CH'],
  topic:'Wildbrethygiene',
  q:'Warum ist schnelles Aufbrechen nach dem Erlegen wichtig?',
  answers:[
    {id:'a', text:'Verringert Keimdruck'},
    {id:'b', text:'Verbessert Trophäe'},
    {id:'c', text:'Senkt Fleischgewicht'},
    {id:'d', text:'Macht Fell glänzend'}
  ],
  correct:['a'],
  explain:'Schnelles Abkühlen ist entscheidend für Hygiene.'
},

{
  id:'JL-new-0008',
  countries:['DE','AT'],
  topic:'Jägersprache',
  q:'Wie nennt man den Ruheplatz des Hasen?',
  answers:[
    {id:'a', text:'Kessel'},
    {id:'b', text:'Sasse'},
    {id:'c', text:'Horst'},
    {id:'d', text:'Bau'}
  ],
  correct:['b'],
  explain:'Die Sasse ist die flache Mulde des Feldhasen.'
},

{
  id:'JL-new-0009',
  countries:['DE'],
  topic:'Wildkunde',
  q:'Wann setzt das Reh typischerweise seine Kitze?',
  answers:[
    {id:'a', text:'Februar'},
    {id:'b', text:'Mai/Juni'},
    {id:'c', text:'September'},
    {id:'d', text:'Januar'}
  ],
  correct:['b'],
  explain:'Kitzzeit ist Mai/Juni.'
},

{
  id:'JL-new-0010',
  countries:['AT'],
  topic:'Wildkunde',
  q:'Woran erkennt man einen Gamsbock im Sommer?',
  answers:[
    {id:'a', text:'Er trägt komplett weißes Haarkleid'},
    {id:'b', text:'Deutlich dunkler Rückenstreifen'},
    {id:'c', text:'Fehlen der Krucken'},
    {id:'d', text:'Gefleckte Decke'}
  ],
  correct:['b'],
  explain:'Sommergams zeigt dunklen Aalstrich.'
},

{
  id:'JL-new-0011',
  countries:['CH'],
  topic:'Wildkunde',
  q:'Welche Jagdart des Steinadlers ist typisch?',
  answers:[
    {id:'a', text:'Hetzjagd im Rudel'},
    {id:'b', text:'Stoßflug aus großer Höhe'},
    {id:'c', text:'Nur Aasfressen'},
    {id:'d', text:'Balzflugjagd im Frühling'}
  ],
  correct:['b'],
  explain:'Er schlägt Beute im Sturzflug.'
},

{
  id:'JL-new-0012',
  countries:['DE','AT','CH'],
  topic:'Waffen & Schuss',
  q:'Welcher Faktor beeinflusst die Geschossbahn am stärksten?',
  answers:[
    {id:'a', text:'Schaftfarbe'},
    {id:'b', text:'Wind'},
    {id:'c', text:'Größe des Zielfernrohres'},
    {id:'d', text:'Lauflänge allein'}
  ],
  correct:['b'],
  explain:'Winddrift beeinflusst Geschossflug massiv.'
},

{
  id:'JL-new-0013',
  countries:['DE','AT','CH'],
  topic:'Ökologie',
  q:'Welche Fläche speichert am meisten CO₂?',
  answers:[
    {id:'a', text:'Moor'},
    {id:'b', text:'Acker'},
    {id:'c', text:'Kurzgraswiese'},
    {id:'d', text:'Schotterfläche'}
  ],
  correct:['a'],
  explain:'Moore sind bedeutende Kohlenstoffspeicher.'
},

{
  id:'JL-new-0014',
  countries:['DE','AT','CH'],
  topic:'Hundewesen',
  q:'Was bedeutet „Vorstehen“ beim Jagdhund?',
  answers:[
    {id:'a', text:'Hund legt sich hin'},
    {id:'b', text:'Hund fixiert Wild regungslos'},
    {id:'c', text:'Hund zeigt Freude'},
    {id:'d', text:'Hund jagt selbstständig weit'}
  ],
  correct:['b'],
  explain:'Vorstehen ist das starre Anzeigen von Wild.'
},

{
  id:'JL-new-0015',
  countries:['DE','AT','CH'],
  topic:'Wildkunde',
  q:'Welche Losung ist typisch für Schwarzwild?',
  answers:[
    {id:'a', text:'Kugelig'},
    {id:'b', text:'Wurstartig'},
    {id:'c', text:'Fladen'},
    {id:'d', text:'Reiskornartig'}
  ],
  correct:['b'],
  explain:'Schwarzwild loset wurstartig.'
},

{
  id:'JL-new-0016',
  countries:['DE','AT','CH'],
  topic:'Waffen & Schuss',
  q:'Was ist ein „Direktabzug“?',
  answers:[
    {id:'a', text:'Abzug ohne Druckpunkt'},
    {id:'b', text:'Elektronischer Abzug'},
    {id:'c', text:'Sehr langer Vorweg'},
    {id:'d', text:'Abzug mit Sicherungsautomatik'}
  ],
  correct:['a'],
  explain:'Direktabzug löst unmittelbar aus.'
},

{
  id:'JL-new-0017',
  countries:['DE','AT','CH'],
  topic:'Hege',
  q:'Welche Fläche ist besonders wichtig für Bodenbrüter?',
  answers:[
    {id:'a', text:'Altgrasinseln'},
    {id:'b', text:'Asphaltflächen'},
    {id:'c', text:'Kurzrasen'},
    {id:'d', text:'Monokultur-Winterweizen'}
  ],
  correct:['a'],
  explain:'Deckungsstrukturen fördern erfolgreiche Brut.'
},

{
  id:'JL-new-0018',
  countries:['DE','AT','CH'],
  topic:'Wildkunde',
  q:'Wie nennt man den Nachwuchs des Rotwildes?',
  answers:[
    {id:'a', text:'Kalb'},
    {id:'b', text:'Kitz'},
    {id:'c', text:'Lamm'},
    {id:'d', text:'Frischling'}
  ],
  correct:['a'],
  explain:'Rotwild: Kalb.'
},

{
  id:'JL-new-0019',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Was bedeutet „verhoffen“?',
  answers:[
    {id:'a', text:'Wild rennt in Panik'},
    {id:'b', text:'Wild bleibt kurz stehen und sichert'},
    {id:'c', text:'Wild wechselt langsam ab'},
    {id:'d', text:'Wild äst im Sitzen'}
  ],
  correct:['b'],
  explain:'Verhoffen = kurzes Stehen zum Sichern.'
},

{
  id:'JL-new-0020',
  countries:['AT','DE','CH'],
  topic:'Wildbrethygiene',
  q:'Welche Temperatur ist ideal für die Wildkühlung?',
  answers:[
    {id:'a', text:'15–20 °C'},
    {id:'b', text:'4–7 °C'},
    {id:'c', text:'0–1 °C'},
    {id:'d', text:'Über 20 °C'}
  ],
  correct:['b'],
  explain:'4–7 °C verhindern Keimwachstum optimal.'
},
  // ======================
// BLOCK 1 — Fragen 1–100
// ======================

{
  id:'JL-new-0001',
  countries:['DE','AT','CH'],
  topic:'Waffen & Schuss',
  q:'Was bewirkt ein längerer Lauf bei einer Büchse normalerweise?',
  answers:[
    {id:'a', text:'Höhere Mündungsgeschwindigkeit'},
    {id:'b', text:'Weniger Drall'},
    {id:'c', text:'Schlechtere Präzision'},
    {id:'d', text:'Stärkere Rückstoßvergrößerung'}
  ],
  correct:['a'],
  explain:'Längere Läufe erlauben vollständigere Pulververbrennung → höhere V₀.'
},

{
  id:'JL-new-0002',
  countries:['DE'],
  topic:'Recht',
  q:'Wer ist in Deutschland für die Jagdscheinprüfung zuständig?',
  answers:[
    {id:'a', text:'Bundestag'},
    {id:'b', text:'Länder bzw. deren Behörden'},
    {id:'c', text:'NATO'},
    {id:'d', text:'Forstämter allein'}
  ],
  correct:['b'],
  explain:'Jagdrecht ist Ländersache.'
},

{
  id:'JL-new-0003',
  countries:['AT'],
  topic:'Recht',
  q:'Wer regelt in Österreich die Abschusspläne?',
  answers:[
    {id:'a', text:'Bund'},
    {id:'b', text:'Jeweiliges Bundesland'},
    {id:'c', text:'Forstverwaltung der EU'},
    {id:'d', text:'Schützenvereine'}
  ],
  correct:['b'],
  explain:'Jagdrecht = Landesrecht.'
},

{
  id:'JL-new-0004',
  countries:['CH'],
  topic:'Recht',
  q:'Was unterscheidet die Schweizer Patentjagd vom Pachtsystem?',
  answers:[
    {id:'a', text:'Keine Jagdprüfung notwendig'},
    {id:'b', text:'Jagdausübung via Jahrespatent statt gepachteter Fläche'},
    {id:'c', text:'Jagd nur mit Falken erlaubt'},
    {id:'d', text:'Kein Schusswaffengebrauch'}
  ],
  correct:['b'],
  explain:'Patentjagd: Gebiet ist kantonal definiert und per Patent bejagbar.'
},

{
  id:'JL-new-0005',
  countries:['DE','AT','CH'],
  topic:'Hundewesen',
  q:'Welche Eigenschaft ist besonders wichtig für die Nachsuche?',
  answers:[
    {id:'a', text:'Weitjagd'},
    {id:'b', text:'Schweißarbeit & Fährtenwillen'},
    {id:'c', text:'Hütetrieb'},
    {id:'d', text:'Wasserapport'}
  ],
  correct:['b'],
  explain:'Nachsuchehunde benötigen Spurwille & Ausdauer.'
},

{
  id:'JL-new-0006',
  countries:['DE','AT','CH'],
  topic:'Hege',
  q:'Welcher Lebensraum fördert Biodiversität am stärksten?',
  answers:[
    {id:'a', text:'Monokulturen'},
    {id:'b', text:'Strukturreiche Waldränder & Saumbiotope'},
    {id:'c', text:'Schotterflächen'},
    {id:'d', text:'Reiner Fichtenbestand'}
  ],
  correct:['b'],
  explain:'Strukturvielfalt = hohe Artenvielfalt.'
},

{
  id:'JL-new-0007',
  countries:['DE','AT','CH'],
  topic:'Wildbrethygiene',
  q:'Warum ist schnelles Aufbrechen nach dem Erlegen wichtig?',
  answers:[
    {id:'a', text:'Verringert Keimdruck'},
    {id:'b', text:'Verbessert Trophäe'},
    {id:'c', text:'Senkt Fleischgewicht'},
    {id:'d', text:'Macht Fell glänzend'}
  ],
  correct:['a'],
  explain:'Schnelles Abkühlen ist entscheidend für Hygiene.'
},

{
  id:'JL-new-0008',
  countries:['DE','AT'],
  topic:'Jägersprache',
  q:'Wie nennt man den Ruheplatz des Hasen?',
  answers:[
    {id:'a', text:'Kessel'},
    {id:'b', text:'Sasse'},
    {id:'c', text:'Horst'},
    {id:'d', text:'Bau'}
  ],
  correct:['b'],
  explain:'Die Sasse ist die flache Mulde des Feldhasen.'
},

{
  id:'JL-new-0009',
  countries:['DE'],
  topic:'Wildkunde',
  q:'Wann setzt das Reh typischerweise seine Kitze?',
  answers:[
    {id:'a', text:'Februar'},
    {id:'b', text:'Mai/Juni'},
    {id:'c', text:'September'},
    {id:'d', text:'Januar'}
  ],
  correct:['b'],
  explain:'Kitzzeit ist Mai/Juni.'
},

{
  id:'JL-new-0010',
  countries:['AT'],
  topic:'Wildkunde',
  q:'Woran erkennt man einen Gamsbock im Sommer?',
  answers:[
    {id:'a', text:'Er trägt komplett weißes Haarkleid'},
    {id:'b', text:'Deutlich dunkler Rückenstreifen'},
    {id:'c', text:'Fehlen der Krucken'},
    {id:'d', text:'Gefleckte Decke'}
  ],
  correct:['b'],
  explain:'Sommergams zeigt dunklen Aalstrich.'
},

{
  id:'JL-new-0011',
  countries:['CH'],
  topic:'Wildkunde',
  q:'Welche Jagdart des Steinadlers ist typisch?',
  answers:[
    {id:'a', text:'Hetzjagd im Rudel'},
    {id:'b', text:'Stoßflug aus großer Höhe'},
    {id:'c', text:'Nur Aasfressen'},
    {id:'d', text:'Balzflugjagd im Frühling'}
  ],
  correct:['b'],
  explain:'Er schlägt Beute im Sturzflug.'
},

{
  id:'JL-new-0012',
  countries:['DE','AT','CH'],
  topic:'Waffen & Schuss',
  q:'Welcher Faktor beeinflusst die Geschossbahn am stärksten?',
  answers:[
    {id:'a', text:'Schaftfarbe'},
    {id:'b', text:'Wind'},
    {id:'c', text:'Größe des Zielfernrohres'},
    {id:'d', text:'Lauflänge allein'}
  ],
  correct:['b'],
  explain:'Winddrift beeinflusst Geschossflug massiv.'
},

{
  id:'JL-new-0013',
  countries:['DE','AT','CH'],
  topic:'Ökologie',
  q:'Welche Fläche speichert am meisten CO₂?',
  answers:[
    {id:'a', text:'Moor'},
    {id:'b', text:'Acker'},
    {id:'c', text:'Kurzgraswiese'},
    {id:'d', text:'Schotterfläche'}
  ],
  correct:['a'],
  explain:'Moore sind bedeutende Kohlenstoffspeicher.'
},

{
  id:'JL-new-0014',
  countries:['DE','AT','CH'],
  topic:'Hundewesen',
  q:'Was bedeutet „Vorstehen“ beim Jagdhund?',
  answers:[
    {id:'a', text:'Hund legt sich hin'},
    {id:'b', text:'Hund fixiert Wild regungslos'},
    {id:'c', text:'Hund zeigt Freude'},
    {id:'d', text:'Hund jagt selbstständig weit'}
  ],
  correct:['b'],
  explain:'Vorstehen ist das starre Anzeigen von Wild.'
},

{
  id:'JL-new-0015',
  countries:['DE','AT','CH'],
  topic:'Wildkunde',
  q:'Welche Losung ist typisch für Schwarzwild?',
  answers:[
    {id:'a', text:'Kugelig'},
    {id:'b', text:'Wurstartig'},
    {id:'c', text:'Fladen'},
    {id:'d', text:'Reiskornartig'}
  ],
  correct:['b'],
  explain:'Schwarzwild loset wurstartig.'
},

{
  id:'JL-new-0016',
  countries:['DE','AT','CH'],
  topic:'Waffen & Schuss',
  q:'Was ist ein „Direktabzug“?',
  answers:[
    {id:'a', text:'Abzug ohne Druckpunkt'},
    {id:'b', text:'Elektronischer Abzug'},
    {id:'c', text:'Sehr langer Vorweg'},
    {id:'d', text:'Abzug mit Sicherungsautomatik'}
  ],
  correct:['a'],
  explain:'Direktabzug löst unmittelbar aus.'
},

{
  id:'JL-new-0017',
  countries:['DE','AT','CH'],
  topic:'Hege',
  q:'Welche Fläche ist besonders wichtig für Bodenbrüter?',
  answers:[
    {id:'a', text:'Altgrasinseln'},
    {id:'b', text:'Asphaltflächen'},
    {id:'c', text:'Kurzrasen'},
    {id:'d', text:'Monokultur-Winterweizen'}
  ],
  correct:['a'],
  explain:'Deckungsstrukturen fördern erfolgreiche Brut.'
},

{
  id:'JL-new-0018',
  countries:['DE','AT','CH'],
  topic:'Wildkunde',
  q:'Wie nennt man den Nachwuchs des Rotwildes?',
  answers:[
    {id:'a', text:'Kalb'},
    {id:'b', text:'Kitz'},
    {id:'c', text:'Lamm'},
    {id:'d', text:'Frischling'}
  ],
  correct:['a'],
  explain:'Rotwild: Kalb.'
},

{
  id:'JL-new-0019',
  countries:['DE'],
  topic:'Jägersprache',
  q:'Was bedeutet „verhoffen“?',
  answers:[
    {id:'a', text:'Wild rennt in Panik'},
    {id:'b', text:'Wild bleibt kurz stehen und sichert'},
    {id:'c', text:'Wild wechselt langsam ab'},
    {id:'d', text:'Wild äst im Sitzen'}
  ],
  correct:['b'],
  explain:'Verhoffen = kurzes Stehen zum Sichern.'
},

{
  id:'JL-new-0020',
  countries:['AT','DE','CH'],
  topic:'Wildbrethygiene',
  q:'Welche Temperatur ist ideal für die Wildkühlung?',
  answers:[
    {id:'a', text:'15–20 °C'},
    {id:'b', text:'4–7 °C'},
    {id:'c', text:'0–1 °C'},
    {id:'d', text:'Über 20 °C'}
  ],
  correct:['b'],
  explain:'4–7 °C verhindern Keimwachstum optimal.'
},
]; // ← ✔ nur diese eine eckige Klammer ist korrekt!

// Validator im Dev ausführen
if (process.env.NODE_ENV !== 'production') {
  validatePool(QUESTIONS);
}

/** Ziehe Fragen nach Land/Topic & mische sie, begrenze auf count */
export function filterQuestions({ country = 'DE', topic = 'Alle', count = 10 }) {
  const pool = QUESTIONS.filter(q =>
    q.countries.includes(country) &&
    (topic === 'Alle' || q.topic === topic)
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
