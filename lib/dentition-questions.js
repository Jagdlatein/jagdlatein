// These checks teach how to read the published reference formula. They add no
// new anatomical measurements or claims about an individual animal's teeth.
function numberOptions(value, label, distractors = []) {
  const alternatives = [...new Set([value, ...distractors, value + 2, Math.max(0, value - 2), value + 4, value + 1].filter(number => Number.isInteger(number) && number >= 0))].slice(0, 4);
  return alternatives.map((number, index) => ({ id: `n${index}`, text: `${number} ${number === 1 && label === "Zähne" ? "Zahn" : label}` }));
}

export function makeDentitionQuestions(profile) {
  if (!profile?.formula || !profile.count || !Array.isArray(profile.sourceIds) || !profile.sourceIds.length) return [];
  const classes = ["I", "C", "P", "M"];
  if (!classes.every(id => Array.isArray(profile.formula[id]) && profile.formula[id].length === 2 && profile.formula[id].every(number => Number.isInteger(number) && number >= 0 && number <= 8))) return [];
  const { upper, lower, total } = profile.count;
  if (upper !== classes.reduce((sum, id) => sum + profile.formula[id][0], 0) || lower !== classes.reduce((sum, id) => sum + profile.formula[id][1], 0) || total !== 2 * (upper + lower)) return [];
  const { I, C, P, M } = profile.formula;
  const reference = profile.variants?.length ? "Grundform" : "Vollformel";
  const shown = `in der oben gezeigten ${reference}`;
  const premolars = value => `${value} ${value === 1 ? "Prämolar" : "Prämolaren"}`;
  const questions = [
    { suffix: "gesamt", prompt: `Wie viele Zähne enthält die oben gezeigte ${reference} insgesamt, wenn beide Seiten gezählt werden?`, value: total,
      distractors: [upper + lower, upper * 2, lower * 2], explanation: `Die Formel nennt je eine Ober- und Unterkieferseite. Daher: 2 × (${upper} + ${lower}) = ${total}. ${profile.note || ""}` },
    { suffix: "oben", prompt: `Wie viele Zähne enthält die oben gezeigte ${reference} im gesamten Oberkiefer, also links und rechts zusammen?`, value: upper * 2,
      distractors: [upper, lower * 2, total], explanation: `Eine Oberkieferseite enthält ${upper} Zähne. Für beide Seiten: 2 × ${upper} = ${upper * 2}. Die ${lower} Zähne einer Unterkieferseite werden bei dieser Frage nicht mitgezählt.` },
    { suffix: "molaren", prompt: `Wie viele Molaren (M) werden in der oben gezeigten ${reference} auf einer Unterkieferseite gezählt?`, value: profile.formula.M[1],
      distractors: [M[1] * 2, P[1], M[0]], explanation: `Bei M steht unten ${M[1]}. Das ist die Zahl der Molaren auf einer Unterkieferseite. Erst für beide Unterkieferseiten würde sie verdoppelt. Die Prämolaren P gehören zu einer eigenen Zahnklasse.` },
    { suffix: "unten", skill: "Kiefer unterscheiden", prompt: `Wie viele Zähne ergeben sich ${shown} für den gesamten Unterkiefer, also links und rechts?`, value: lower * 2, distractors: [lower, upper * 2, total],
      explanation: `Die untere Zeile ergibt auf einer Seite ${lower}. Links und rechts zusammen sind das 2 × ${lower} = ${lower * 2} Zähne. Der Oberkiefer wird hier nicht addiert.` },
    { suffix: "eine-seite", skill: "Eine oder beide Seiten", prompt: `Du zählst ${shown} nur eine Körperseite: Ober- und Unterkiefer zusammen. Wie viele Zähne sind das?`, value: upper + lower, distractors: [total, upper, lower],
      explanation: `Für eine Seite werden beide Zeilen addiert: ${upper} + ${lower} = ${upper + lower}. Der Faktor 2 gehört erst zur linken und rechten Seite zusammen.` },
    { suffix: "oben-eine-seite", skill: "Eine oder beide Seiten", prompt: `Wie viele Zähne stehen ${shown} auf nur einer Oberkieferseite?`, value: upper, distractors: [upper * 2, lower, total],
      explanation: `Die oberen Zahlen werden ohne Verdopplung addiert: ${I[0]} + ${C[0]} + ${P[0]} + ${M[0]} = ${upper}.` },
    { suffix: "unten-eine-seite", skill: "Kiefer unterscheiden", prompt: `Wie viele Zähne stehen ${shown} auf nur einer Unterkieferseite?`, value: lower, distractors: [lower * 2, upper, total],
      explanation: `Die unteren Zahlen ergeben ${I[1]} + ${C[1]} + ${P[1]} + ${M[1]} = ${lower}. Für diese eine Seite bleibt der Faktor 2 weg.` },
    { suffix: "molaren-oben", skill: "Zahnklassen ablesen", prompt: `Welche Zahl steht ${shown} bei M für eine Oberkieferseite?`, value: M[0], distractors: [M[1], P[0], M[0] * 2],
      explanation: `M bezeichnet die Molaren. Die obere Zahl ${M[0]} gehört zu einer Oberkieferseite; die untere Zahl ${M[1]} zu einer Unterkieferseite.` },
    { suffix: "praemolaren-unten", skill: "Zahnklassen ablesen", prompt: `Wie viele Prämolaren (P) stehen ${shown} auf einer Unterkieferseite?`, value: P[1], distractors: [M[1], P[0], P[1] * 2],
      explanation: `Bei P wird die untere Zahl ${P[1]} abgelesen. Die Zahl bei M zählt eine andere Zahnklasse und wird nicht dazugerechnet.` },
    { suffix: "schneidezaehne-oben", skill: "Zahnklassen ablesen", prompt: `Welche Anzahl Schneidezähne (I) nennt die Formel ${shown} für eine Oberkieferseite?`, value: I[0], distractors: [I[1], I[0] * 2, C[0]],
      explanation: `Für diese Frage gilt allein I oben: ${I[0]}. Auch eine 0 ist eine ausdrückliche Angabe der dargestellten Referenzformel; sie wird nicht durch einen Wert aus einer anderen Zeile ersetzt.` },
    { suffix: "eckzaehne-unten", skill: "Zahnklassen ablesen", prompt: `Welche Anzahl Eckzähne (C) wird ${shown} auf einer Unterkieferseite gezählt?`, value: C[1], distractors: [I[1], C[0], C[1] * 2],
      explanation: `C unten lautet ${C[1]}. Die Zuordnung folgt genau der hier gezeigten Formel und ihrem Geltungsbereich; andere Notationsweisen werden nicht stillschweigend damit gleichgesetzt.` },
    { suffix: "backenzaehne-unten", skill: "Zahnklassen verbinden", prompt: `Du zählst ${shown} P und M gemeinsam auf einer Unterkieferseite. Wie viele Zähne erhältst du?`, value: P[1] + M[1], distractors: [P[1], M[1], 2 * (P[1] + M[1])],
      explanation: `Für eine Unterkieferseite werden nur P und M unten addiert: ${P[1]} + ${M[1]} = ${P[1] + M[1]}. I und C sowie die zweite Seite gehören nicht zu dieser Teilmenge.` },
    { suffix: "kuerzel-i", skill: "Kürzel verstehen", prompt: `Für welche Zahnklasse steht das Kürzel I ${shown}?`, answers: ["Schneidezähne", "Eckzähne", "Prämolaren", "Molaren"],
      explanation: "I bezeichnet die Schneidezähne. C steht für Eckzähne, P für Prämolaren und M für Molaren. Die Zahlen bei jedem Kürzel beschreiben oben und unten je eine Seite." },
    { suffix: "kuerzel-c", skill: "Kürzel verstehen", prompt: `Welche Zahnklasse wird mit C ${shown} gesondert aufgeführt?`, answers: ["Eckzähne", "Schneidezähne", "Prämolaren", "Molaren"],
      explanation: "C bezeichnet die Eckzähne. Das Kürzel benennt die Zahnklasse; erst seine obere und untere Zahl geben deren Anzahl je Kieferseite an." },
    { suffix: "bruch-lesen", skill: "Formel richtig lesen", prompt: `Was bedeutet die Angabe P ${P[0]}/${P[1]} ${shown}?`, answers: [`${premolars(P[0])} auf einer Oberkieferseite und ${P[1]} auf einer Unterkieferseite.`, `${premolars(P[0])} im gesamten Oberkiefer und ${P[1]} im gesamten Unterkiefer.`, `${P[0]} ${P[0] === 1 ? "Molar" : "Molaren"} auf einer Oberkieferseite und ${P[1]} auf einer Unterkieferseite.`, `${P[0]} ${P[0] === 1 ? "Zahn" : "Zähne"} aller Zahnklassen oben und ${P[1]} ${P[1] === 1 ? "Zahn" : "Zähne"} aller Zahnklassen unten.`],
      explanation: `P bezeichnet nur die Prämolaren. Oben steht ${P[0]}, unten ${P[1]}, jeweils für eine Seite. Linke und rechte Seite zusammen werden erst anschließend berücksichtigt.` },
    { suffix: "geltungsbereich", skill: "Referenz und Einzelpräparat", prompt: `Welche Aussage zur oben gezeigten ${reference} und einem einzelnen Sammlungspräparat ist richtig?`, answers: ["Die Formel ist eine Referenz; fehlende Zähne am Präparat ändern nicht automatisch die dargestellte Formel.", "Die Zahl sichtbarer Zähne an jedem Präparat muss immer genau der Formel entsprechen.", "Aus der Gesamtzahl der Formel lässt sich das genaue Alter des Präparats ablesen.", "Die Formel bestimmt die genaue Größe und Lage jedes Zahns im 3D-Modell."],
      explanation: `Die Übung liest die dargestellte Referenzformel, keine individuelle Zahnaufnahme und keine Altersbestimmung. Ihr Geltungsbereich bleibt: ${profile.scope} ${profile.note || ""}` },
  ];
  return questions.map(question => ({
    id: `gebiss-${profile.slug}-${question.suffix}`, format: "single", skill: question.skill || "Zahnformeln lesen",
    prompt: question.prompt, context: profile.scope,
    options: question.answers ? question.answers.map((text, index) => ({ id: `t${index}`, text })) : numberOptions(question.value, "Zähne", question.distractors), correctIds: [question.answers ? "t0" : "n0"],
    explanation: question.explanation, sourceIds: [...profile.sourceIds],
  }));
}
