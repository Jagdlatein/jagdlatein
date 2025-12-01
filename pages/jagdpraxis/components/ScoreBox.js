export default function ScoreBox({ score, max }) {
  return (
    <div style={{
      marginTop: 30,
      padding: 16,
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
    }}>
      <h2>Ergebnis</h2>
      <p>Richtige Entscheidungen: {score} / {max}</p>

      {score / max >= 0.8 ? (
        <p style={{ color: "green", fontWeight: "bold" }}>Bestanden! Sehr gute Jagdpraxis.</p>
      ) : (
        <p style={{ color: "#8a1a1a", fontWeight: "bold" }}>
          Weiter üben – du bist auf einem guten Weg.
        </p>
      )}
    </div>
  );
}
