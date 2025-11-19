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
