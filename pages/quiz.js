import { useState } from "react";

export default function QuizPage() {
  const [selected, setSelected] = useState(null);

  const answers = [
    { text: "A: Hirsch", correct: false },
    { text: "B: Keiler", correct: true },
    { text: "C: Fuchs", correct: false },
    { text: "D: Dachs", correct: false },
  ];

  function handleClick(index) {
    if (selected !== null) return;
    setSelected(index);
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: 20,
        background: "white",
        borderRadius: 10,
      }}
    >
      <h2 style={{ fontSize: 24, marginBottom: 20, fontWeight: "bold" }}>
        Welche Spur gehört zum Keiler?
      </h2>

      {answers.map((a, i) => {
        const isSelected = selected === i;
        const isCorrect = a.correct;

        let bg = "#eaeaea";
        let color = "black";

        if (selected !== null) {
          if (isCorrect) {
            bg = "green";
            color = "white";
          }
          if (isSelected && !isCorrect) {
            bg = "red";
            color = "white";
          }
        }

        return (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={selected !== null}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "18px",
              borderRadius: "8px",
              border: "none",
              background: bg,
              color: color,
              cursor: "pointer",
            }}
          >
            {a.text}
          </button>
        );
      })}
    </div>
  );
}
