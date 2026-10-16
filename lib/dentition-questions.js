// These checks teach how to read the published reference formula. They add no
// new anatomical measurements or claims about an individual animal's teeth.
function numberOptions(value, label) {
  const alternatives = [...new Set([value, value + 2, Math.max(0, value - 2), value + 4, value + 1])].slice(0, 4);
  return alternatives.map((number, index) => ({ id: `n${index}`, text: `${number} ${number === 1 && label === "Zähne" ? "Zahn" : label}` }));
}

export function makeDentitionQuestions(profile) {
  if (!profile?.formula || !profile.count || !profile.sourceIds?.length) return [];
  const { upper, lower, total } = profile.count;
  const reference = profile.variants?.length ? "Grundform" : "Vollformel";
  const questions = [
    { suffix: "gesamt", prompt: `Wie viele Zähne enthält die oben gezeigte ${reference} insgesamt, wenn beide Seiten gezählt werden?`, value: total,
      explanation: `Die Formel nennt je eine Ober- und Unterkieferseite. Daher: 2 × (${upper} + ${lower}) = ${total}. ${profile.note}` },
    { suffix: "oben", prompt: `Wie viele Zähne enthält die oben gezeigte ${reference} im gesamten Oberkiefer, also links und rechts zusammen?`, value: upper * 2,
      explanation: `Eine Oberkieferseite enthält ${upper} Zähne. Für beide Seiten: 2 × ${upper} = ${upper * 2}. Die ${lower} Zähne einer Unterkieferseite werden bei dieser Frage nicht mitgezählt.` },
    { suffix: "molaren", prompt: `Wie viele Molaren (M) werden in der oben gezeigten ${reference} auf einer Unterkieferseite gezählt?`, value: profile.formula.M[1],
      explanation: `Bei M steht unten ${profile.formula.M[1]}. Das ist die Zahl der Molaren auf einer Unterkieferseite. Erst für beide Unterkieferseiten würde sie verdoppelt. Die Prämolaren P gehören zu einer eigenen Zahnklasse.` },
  ];
  return questions.map(question => ({
    id: `gebiss-${profile.slug}-${question.suffix}`, format: "single", skill: "Zahnformeln lesen",
    prompt: question.prompt, context: profile.scope,
    options: numberOptions(question.value, "Zähne"), correctIds: ["n0"],
    explanation: question.explanation, sourceIds: [...profile.sourceIds],
  }));
}
