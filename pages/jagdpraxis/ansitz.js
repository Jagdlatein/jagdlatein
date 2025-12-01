import { useState } from "react";
import ProgressBar from "./components/ProgressBar";
import ScoreBox from "./components/ScoreBox";

const szenen = [
  {
    bild: "/simulator/ansitz/1.jpg",
    prompt: "realistic hunting scene, wild boar juvenile broadside at 60m, dusk, rifle scope view",
    text: "Ein Überläufer zieht breit auf 60 m. Kugelfang vorhanden. Was tust du?",
    options: [
      { text: "Schuss antragen", correct: true, reason: "Tierschutzgerecht, sicher." },
      { text: "Nicht schießen", correct: false, reason: "Situation optimal." }
    ]
  },
  {
    bild: "/simulator/ansitz/2.jpg",
    prompt: "roe deer standing frontal, dark forest, hunter perspective, 90m distance",
    text: "Reh steht spitz von vorne auf 90 m.",
    options: [
      { text: "Schuss", correct: false, reason: "Spitz von vorne → nicht tierschutzgerecht." },
      { text: "Nicht schießen", correct: true, reason: "Richtige Entscheidung." }
    ]
  },
  {
    bild: "/simulator/ansitz/3.jpg",
    prompt: "red fox in tall grass at sunset, partially covered, hunter perspective",
    text: "Fuchs im hohen Gras, teilweise verdeckt.",
    options: [
      { text: "Schuss", correct: false, reason: "Kugelfang unklar, Wild teilweise verdeckt." },
      { text: "Warten, bis frei steht", correct: true, reason: "Sicherheitsregel." }
    ]
  },

  // … 7 weitere Szenen folgen gleich (separat für bessere Übersicht)
];

export default function AnsitzSim() {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);

  const szene = szenen[index];

  function choose(opt) {
    setResult(opt);
    if (opt.correct) setScore((s) => s + 1);
  }

  function next() {
    setResult(null);
    if (index + 1 < szenen.length) setIndex(index + 1);
  }

  if (index >= szenen.length) {
    return <ScoreBox score={score} max={szenen.length} />;
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1>Ansitz-Simulator</h1>
      <ProgressBar progress={(index / szenen.length) * 100} />

      <img src={szene.bild} style={{ width: "100%", borderRadius: 12, marginTop: 24 }} />

      <p style={{ marginTop: 20 }}>{szene.text}</p>

      {szene.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => choose(opt)}
          style={{
            display: "block",
            width: "100%",
            padding: 14,
            marginTop: 12,
            background: "#caa53b",
            borderRadius: 12,
            border: "none",
            fontWeight: "bold"
          }}
        >
          {opt.text}
        </button>
      ))}

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 18,
            background: result.correct ? "#d4edda" : "#f8d7da",
            borderRadius: 12
          }}
        >
          <p>{result.reason}</p>

          <button
            onClick={next}
            style={{
              marginTop: 14,
              padding: 12,
              background: "#1f2b23",
              color: "#fff",
              borderRadius: 10,
              border: "none"
            }}
          >
            Weiter →
          </button>
        </div>
      )}
    </main>
  );
}
