// data/questions.js
export const QUESTIONS = [
  // WILDKUNDE
  {
    id: 'wk-reh-losung', countries: ['DE','AT','CH'], topic: 'Wildkunde',
    q: 'Woran erkennst du typischerweise Rehwild-Losung?',
    answers: [
      { id: 'a', text: 'Birnenförmig, oft in Ketten' },
      { id: 'b', text: 'Kugelig, groß wie Murmeln' },
      { id: 'c', text: 'Länglich, spiralig gedreht' },
      { id: 'd', text: 'Flach, scheibenförmig' }
    ],
    correct: ['a'],
    explain: 'Rehwild-Losung ist meist birnenförmig und kettenartig aneinandergereiht.'
  },
  {
    id: 'wk-sauen-faehrt', countries: ['DE','AT','CH'], topic: 'Wildkunde',
    q: 'Welche Spur ist typisch fürs Schwarzwild (Fährte)?',
    answers: [
      { id: 'a', text: 'Sehr spitz-ovale Schalen, Schubkarrenstellung, tiefe Trittsiegel' },
      { id: 'b', text: 'Rundliche Ballenabdrücke mit Krallen' },
      { id: 'c', text: 'Zweireihige Hufabdrücke, sehr klein' },
      { id: 'd', text: 'Fächerförmige Abdrücke mit Zehenballen' }
    ],
    correct: ['a'],
    explain: 'Schwarzwild hinterlässt tiefe, spitz-ovale Schalenabdrücke, oft „schubkarrenartig“ gesetzt.'
  },
  // WAFFEN
  {
    id: 'waffe-sicherheit', countries: ['DE','AT','CH'], topic: 'Waffen & Schuss',
    q: 'Welche Regel gilt immer?',
    answers: [
      { id: 'a', text: 'Sicherung ersetzt Mündungsdisziplin' },
      { id: 'b', text: 'Nie auf etwas richten, das nicht beschossen werden soll' },
      { id: 'c', text: 'Im Revier ist entsicherte Waffe erlaubt' },
      { id: 'd', text: 'Abzugsdisziplin optional' }
    ],
    correct: ['b'],
    explain: 'Mündungsdisziplin ist unverzichtbar; Sicherung ersetzt sie nicht.'
  },
  // RECHT DE
  {
    id: 'recht-de-traeger', countries: ['DE'], topic: 'Recht',
    q: 'Wer ist in Deutschland Träger des Jagdrechts?',
    answers: [
      { id: 'a', text: 'Der Jagdpächter' },
      { id: 'b', text: 'Der Grundstückseigentümer' },
      { id: 'c', text: 'Die Jagdgenossenschaft' },
      { id: 'd', text: 'Der Forstbetrieb' }
    ],
    correct: ['b'],
    explain: 'Träger ist der Eigentümer; das Ausübungsrecht kann verpachtet sein.'
  },
  // RECHT AT
  {
    id: 'recht-at-gesetz', countries: ['AT'], topic: 'Recht',
    q: 'Welche Ebene regelt in Österreich primär das Jagdrecht?',
    answers: [
      { id: 'a', text: 'Bundesrecht einheitlich' },
      { id: 'b', text: 'Landesrecht, je Bundesland' },
      { id: 'c', text: 'EU-Verordnung' },
      { id: 'd', text: 'Gemeinderecht' }
    ],
    correct: ['b'],
    explain: 'Das Jagdrecht ist Landesrecht; Details je Bundesland.'
  },
  // RECHT CH
  {
    id: 'recht-ch-kanton', countries: ['CH'], topic: 'Recht',
    q: 'In der Schweiz fallen Jagdbestimmungen maßgeblich auf welche Ebene?',
    answers: [
      { id: 'a', text: 'Kantonale Ebene' },
      { id: 'b', text: 'EU-Ebene' },
      { id: 'c', text: 'Gemeindeebene exklusiv' },
      { id: 'd', text: 'Nur Bundesrecht' }
    ],
    correct: ['a'],
    explain: 'Kantone regeln die Jagd (unter Bundesrahmen).'
  }
];

export function filterQuestions({ country = 'DE', topic = 'Alle', count = 10 }) {
  const pool = QUESTIONS.filter(q =>
    (q.countries.includes(country)) &&
    (topic === 'Alle' || q.topic === topic)
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
