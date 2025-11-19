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



];

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
