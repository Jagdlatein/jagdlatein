// data/questions.js – erweiterter Fragenpool DE/AT/CH
// Themen: Wildkunde, Waffen & Schuss, Recht, Hege/Naturschutz, Hundewesen, Wildbrethygiene

export const QUESTIONS = [
  /* --------- WILDKUNDE (gemeinsam DE/AT/CH) --------- */
  {
    id:'wk-reh-losung',
    countries:['DE','AT','CH'], topic:'Wildkunde',
    q:'Woran erkennst du typischerweise Rehwild-Losung?',
    answers:[
      {id:'a', text:'Birnenförmig, oft in Ketten'},
      {id:'b', text:'Große Kugeln wie Murmeln'},
      {id:'c', text:'Spiralig gedreht'},
      {id:'d', text:'Flache Scheiben'}
    ],
    correct:['a'],
    explain:'Birnenförmig, kettenartig – typisch Rehwild.'
  },
  {
    id:'wk-schwarzwild-faehrte',
    countries:['DE','AT','CH'], topic:'Wildkunde',
    q:'Welche Eigenschaft passt zur Schwarzwildfährte?',
    answers:[
      {id:'a', text:'Sehr spitz-ovale Schalen, tiefe Trittsiegel'},
      {id:'b', text:'Runde Ballenabdrücke mit Krallen'},
      {id:'c', text:'Dreizehige Abdrücke'},
      {id:'d', text:'Sehr kleine, zweireihige Hufe'}
    ],
    correct:['a'],
    explain:'Spitz-ovale Schalen mit kräftigem Trittsiegel.'
  },
  {
    id:'wk-rotwild-gebiss',
    countries:['DE','AT','CH'], topic:'Wildkunde',
    q:'Wodurch ist das Gebiss des Rotwildes gekennzeichnet?',
    answers:[
      {id:'a', text:'Schneidezähne oben und unten'},
      {id:'b', text:'Kein Schneidezahn oben, statt dessen Zahnpad'},
      {id:'c', text:'Hauer wie beim Keiler'},
      {id:'d', text:'Raubtiergebiss mit Reißzähnen'}
    ],
    correct:['b'],
    explain:'Wiederkäuer: oben Schneidezähne fehlen, Zahnpad.'
  },
  {
    id:'wk-fuchs-losung',
    countries:['DE','AT','CH'], topic:'Wildkunde',
    q:'Wie sieht typische Fuchslosung aus?',
    answers:[
      {id:'a', text:'Kegelförmig, mit Haar- und Knochenresten'},
      {id:'b', text:'Birnenförmig, kettenartig'},
      {id:'c', text:'Große Fladen'},
      {id:'d', text:'Reiskornartig'}
    ],
    correct:['a'],
    explain:'Oft spitz endend, mit Haar/Knochen – Fleischfresser.'
  },
  {
    id:'wk-ente-schwimmenten',
    countries:['DE','AT','CH'], topic:'Wildkunde',
    q:'Merkmal von Schwimmenten (z. B. Stockente) gegenüber Tauchenten?',
    answers:[
      {id:'a', text:'Steiler Startflug, Beine mittig'},
      {id:'b', text:'Langer Tauchgang, Beine weit hinten'},
      {id:'c', text:'Sitzen nur an Land'},
      {id:'d', text:'Kein Auffliegen möglich'}
    ],
    correct:['a'],
    explain:'Schwimmenten: Beine mittiger, starten steil.'
  },

  /* --------- WAFFEN & SCHUSS (gemeinsam) --------- */
  {
    id:'ws-sicherheit-muendung',
    countries:['DE','AT','CH'], topic:'Waffen & Schuss',
    q:'Welche Grundregel gilt immer?',
    answers:[
      {id:'a', text:'Sicherung ersetzt Mündungsdisziplin'},
      {id:'b', text:'Nie auf etwas richten, das nicht beschossen werden soll'},
      {id:'c', text:'Im Revier darf stets entsichert getragen werden'},
      {id:'d', text:'Finger früh auf den Abzug'}
    ],
    correct:['b'],
    explain:'Mündungs- und Abzugsdisziplin sind unverzichtbar.'
  },
  {
    id:'ws-kaliber-typisch-rehwild',
    countries:['DE','AT','CH'], topic:'Waffen & Schuss',
    q:'Welche Aussage ist für Rehwild taugliche Büchsenkaliber sinnvoll?',
    answers:[
      {id:'a', text:'Nur Randfeuerkaliber'},
      {id:'b', text:'Mittelkaliber mit ausreichender Energie, präziser Schuss'},
      {id:'c', text:'Nur Schrot'},
      {id:'d', text:'Pistolenmunition ausreichend'}
    ],
    correct:['b'],
    explain:'Ausreichende Auftreffenergie/Präzision ist entscheidend.'
  },
  {
    id:'ws-flintenlaufgeschoss',
    countries:['DE','AT','CH'], topic:'Waffen & Schuss',
    q:'Wofür wird ein Flintenlaufgeschoss primär verwendet?',
    answers:[
      {id:'a', text:'Weitdistanz-Schüsse auf Rehwild'},
      {id:'b', text:'Notsituationen/kurze Distanzen, Nachsuche'},
      {id:'c', text:'Tontaubenschießen'},
      {id:'d', text:'Weidmännische Jagdmusik'}
    ],
    correct:['b'],
    explain:'Für kurze Distanzen/Nachsuche geeignet, nicht für Weite.'
  },

  /* --------- RECHT (DE) --------- */
  {
    id:'recht-de-traeger',
    countries:['DE'], topic:'Recht',
    q:'Wer ist in Deutschland Träger des Jagdrechts?',
    answers:[
      {id:'a', text:'Der Jagdpächter'},
      {id:'b', text:'Der Grundstückseigentümer'},
      {id:'c', text:'Die Untere Jagdbehörde'},
      {id:'d', text:'Die Jagdgenossenschaft immer'}
    ],
    correct:['b'],
    explain:'Träger = Eigentümer; Ausübungsrecht kann verpachtet sein.'
  },
  {
    id:'recht-de-schuetzenpflicht',
    countries:['DE'], topic:'Recht',
    q:'Welche Pflicht gehört zum Jäger in DE?',
    answers:[
      {id:'a', text:'Hegeverpflichtung & Waidgerechtigkeit'},
      {id:'b', text:'Nur Abschusszahlen maximieren'},
      {id:'c', text:'Wildtierfütterung ganzjährig vorgeschrieben'},
      {id:'d', text:'Waffenrechtlich keine Aufbewahrung nötig'}
    ],
    correct:['a'],
    explain:'Hege, Waidgerechtigkeit, sichere Aufbewahrung sind zentral.'
  },
  {
    id:'recht-de-aufbewahrung',
    countries:['DE'], topic:'Recht',
    q:'Welche Aussage zur Waffenaufbewahrung trifft zu?',
    answers:[
      {id:'a', text:'Geladene Waffen im Schrank sind erlaubt'},
      {id:'b', text:'Verschlossen, getrennt von Munition (bzw. konform Gesetz)'},
      {id:'c', text:'Offenes Lagern ist zulässig'},
      {id:'d', text:'Nur ein Schloss genügt in jedem Fall'}
    ],
    correct:['b'],
    explain:'Details nach Gesetz/Behältnisklassen – Grundsatz: sicher & getrennt.'
  },

  /* --------- RECHT (AT) --------- */
  {
    id:'recht-at-landesrecht',
    countries:['AT'], topic:'Recht',
    q:'Welche Ebene regelt in Österreich primär das Jagdrecht?',
    answers:[
      {id:'a', text:'Bundeseinheitlich'},
      {id:'b', text:'Landesrecht (je Bundesland)'},
      {id:'c', text:'Nur Gemeinden'},
      {id:'d', text:'EU-Verordnung direkt'}
    ],
    correct:['b'],
    explain:'Das Jagdrecht ist Landesrecht, Details variieren je Bundesland.'
  },
  {
    id:'recht-at-jagdkarte',
    countries:['AT'], topic:'Recht',
    q:'Was ist Voraussetzung zur Jagdausübung in AT typischerweise?',
    answers:[
      {id:'a', text:'Fischereischein'},
      {id:'b', text:'Gültige Jagdkarte/Jagderlaubnis je Land'},
      {id:'c', text:'Nur Waffenschein'},
      {id:'d', text:'Keine formale Voraussetzung'}
    ],
    correct:['b'],
    explain:'Landesrechtlich geregelt; Jagdkarte/Erlaubnis notwendig.'
  },

  /* --------- RECHT (CH) --------- */
  {
    id:'recht-ch-kanton',
    countries:['CH'], topic:'Recht',
    q:'In der Schweiz fallen Jagdbestimmungen maßgeblich auf welche Ebene?',
    answers:[
      {id:'a', text:'Kantonale Ebene (unter Bundesrahmen)'},
      {id:'b', text:'EU-Ebene'},
      {id:'c', text:'Nur Gemeinde'},
      {id:'d', text:'Nur Bund'}
    ],
    correct:['a'],
    explain:'Kantone regeln maßgeblich; Bundesgesetz setzt Rahmen.'
  },
  {
    id:'recht-ch-pacht-oder-patent',
    countries:['CH'], topic:'Recht',
    q:'Welche Jagdsysteme sind in der Schweiz verbreitet?',
    answers:[
      {id:'a', text:'Nur Pachtjagd'},
      {id:'b', text:'Pacht- und Patentjagd je nach Kanton'},
      {id:'c', text:'Nur Patentjagd'},
      {id:'d', text:'Gar keine Systeme'}
    ],
    correct:['b'],
    explain:'Kantonal verschieden: Pacht- oder Patentjagd.'
  },

  /* --------- HEGE / NATURSCHUTZ --------- */
  {
    id:'hege-biotope',
    countries:['DE','AT','CH'], topic:'Hege/Naturschutz',
    q:'Was ist Ziel der Biotophege?',
    answers:[
      {id:'a', text:'Maximal viele jagdlich nutzbare Arten fördern'},
      {id:'b', text:'Lebensräume verbessern und Vielfalt erhalten'},
      {id:'c', text:'Nur Prädatoren dezimieren'},
      {id:'d', text:'Alle Eingriffe vermeiden'}
    ],
    correct:['b'],
    explain:'Habitatqualität/Strukturvielfalt fördern Biodiversität.'
  },
  {
    id:'hege-anzahl-fuettern',
    countries:['DE','AT','CH'], topic:'Hege/Naturschutz',
    q:'Welche Aussage zur Fütterung ist weidgerecht?',
    answers:[
      {id:'a', text:'Füttern ersetzt Lebensraumverbesserung'},
      {id:'b', text:'Fütterung nur situativ/gesetzeskonform und fachlich begründet'},
      {id:'c', text:'Ganzjährig stets notwendig'},
      {id:'d', text:'Nie zulässig'}
    ],
    correct:['b'],
    explain:'Fütterungen sind restriktiv zu betrachten; Gesetze/Lage beachten.'
  },

  /* --------- HUNDEWESEN --------- */
  {
    id:'hund-nachsuchen',
    countries:['DE','AT','CH'], topic:'Hundewesen',
    q:'Warum sind brauchbare Jagdhunde wichtig?',
    answers:[
      {id:'a', text:'Nur zur Zierde'},
      {id:'b', text:'Für Nachsuche, Apport, Stöbern – tierschutzgerecht'},
      {id:'c', text:'Weil leiser als Katzen'},
      {id:'d', text:'Nur zur Drückjagd nötig'}
    ],
    correct:['b'],
    explain:'Brauchbarkeit dient Waidgerechtigkeit/Tierschutz.'
  },
  {
    id:'hund-fuehrung',
    countries:['DE','AT','CH'], topic:'Hundewesen',
    q:'Welche Führungsgrundsätze gelten?',
    answers:[
      {id:'a', text:'Ohne Ausbildung ins Revier'},
      {id:'b', text:'Gehorsam, Signalverständnis, Wildschonung'},
      {id:'c', text:'Hund immer unbeaufsichtigt'},
      {id:'d', text:'Keine Nachsucheausbildung erforderlich'}
    ],
    correct:['b'],
    explain:'Ausbildung/Gehorsam sichern tierschutzgerechtes Arbeiten.'
  },

  /* --------- WILDBRETHYGIENE --------- */
  {
    id:'hygiene-kuehlung',
    countries:['DE','AT','CH'], topic:'Wildbrethygiene',
    q:'Was ist direkt nach dem Erlegen entscheidend für Wildbrethygiene?',
    answers:[
      {id:'a', text:'Schnelles, sauberes Aufbrechen und Kühlen'},
      {id:'b', text:'Trophäen zuerst kochen'},
      {id:'c', text:'Transport in Plastiksack ohne Lüftung'},
      {id:'d', text:'Warm lagern zur Reifung'}
    ],
    correct:['a'],
    explain:'Rasche Entnahme der Organe/Kühlen vermindert Keimdruck.'
  },
  {
    id:'hygiene-trichinen',
    countries:['DE','AT','CH'], topic:'Wildbrethygiene',
    q:'Welche Probenpflicht gilt für Schwarzwild?',
    answers:[
      {id:'a', text:'Keine Pflicht'},
      {id:'b', text:'Trichinenprobe vor Abgabe/Verzehr'},
      {id:'c', text:'Nur bei Frischlingen'},
      {id:'d', text:'Nur bei Keilern'}
    ],
    correct:['b'],
    explain:'Trichinenuntersuchung ist Pflicht (amtlich geregelt).'
  },

  /* --------- EXTRA (mehr Substanz) --------- */
  {
    id:'wk-gams-gebirge',
    countries:['AT','CH'], topic:'Wildkunde',
    q:'Welche Anpassung zeigt die Gams?',
    answers:[
      {id:'a', text:'Schwimmhäute für Gewässer'},
      {id:'b', text:'Harter Schalenrand, trittsicher im Fels'},
      {id:'c', text:'Gr grabfähige Krallen'},
      {id:'d', text:'Nackter Schwanz als Balancierhilfe'}
    ],
    correct:['b'],
    explain:'An Gebirge angepasst: trittsichere Schalen.'
  },
  {
    id:'hege-verbiss',
    countries:['DE','AT','CH'], topic:'Hege/Naturschutz',
    q:'Was zeigt ein starker Verbissschaden an?',
    answers:[
      {id:'a', text:'Guten Zustand der Verjüngung'},
      {id:'b', text:'Ungleichgewicht Wildbestand/Lebensraum'},
      {id:'c', text:'Nur Einfluss von Wetter'},
      {id:'d', text:'Keinen Handlungsbedarf'}
    ],
    correct:['b'],
    explain:'Angepasster Abschuss/Schutzmaßnahmen prüfen.'
  },
  {
    id:'ws-zielfernrohr-parallaxe',
    countries:['DE','AT','CH'], topic:'Waffen & Schuss',
    q:'Wozu dient der Parallaxenausgleich am Zielfernrohr?',
    answers:[
      {id:'a', text:'Erhöht Mündungsenergie'},
      {id:'b', text:'Schärfe/Feinabstimmung auf Entfernung, Fehlerreduktion'},
      {id:'c', text:'Verstellt Abzug'},
      {id:'d', text:'Dient dem Schalldämpfer'}
    ],
    correct:['b'],
    explain:'Scharfstellen/Parallaxefehler mindern – präzisere Treffer.'
  },
  {
    id:'hygiene-haut',
    countries:['DE','AT','CH'], topic:'Wildbrethygiene',
    q:'Welche Aussage ist richtig?',
    answers:[
      {id:'a', text:'Kontamination der Decke ist egal'},
      {id:'b', text:'Sauberkeit beim Aufbrechen reduziert Keimeintrag'},
      {id:'c', text:'Aufbrechen erst am Folgetag'},
      {id:'d', text:'Lagerung immer bei Zimmertemperatur'}
    ],
    correct:['b'],
    explain:'Hygiene beim Aufbrechen entscheidet über Qualität.'
  },
  {
    id:'hund-nachsuche-gesetz',
    countries:['DE','AT','CH'], topic:'Hundewesen',
    q:'Welche Pflicht betrifft kranke/angeschossene Stücke?',
    answers:[
      {id:'a', text:'Nicht beachten'},
      {id:'b', text:'Unverzügliche Nachsuche, ggf. mit brauchbarem Hund'},
      {id:'c', text:'Warten bis zum nächsten Tag'},
      {id:'d', text:'Nur bei Rotwild'}
    ],
    correct:['b'],
    explain:'Tierschutz/Waidgerechtigkeit → sofortige Nachsuche.'
  }
];

/* --------- Filter/Selector --------- */
export function filterQuestions({ country = 'DE', topic = 'Alle', count = 10 }) {
  const pool = QUESTIONS.filter(q =>
    q.countries.includes(country) &&
    (topic === 'Alle' || q.topic === topic)
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
